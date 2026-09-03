// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Resource, WithId } from '@medplum/core';
import { badRequest, createReference, Operator } from '@medplum/core';
import type { Encounter, Observation, ObservationComponent, Patient, Project } from '@medplum/fhirtypes';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { resolveDefaultProjectId } from '../auth/gateway';
import { getConfig } from '../config/loader';
import { sendOutcome } from '../fhir/outcomes';
import type { SystemRepository } from '../fhir/repo';
import { getGlobalSystemRepo, getProjectSystemRepo } from '../fhir/repo';
import { getLogger } from '../logger';
import { validateGatewayRequest } from '../oauth/gateway';

const ATHLETE_ID_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/athlete-id';
const EVENT_ID_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/event-id';
const STATISTIC_ID_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/statistic-id';

// Fields on the statistic payload that are identifiers/references rather than metrics,
// so they're excluded when building Observation.component entries.
const STATISTIC_META_FIELDS = new Set(['id', 'event_id', 'participant_id', 'exercise_id']);

interface ExerciseEvent {
  id: string | number;
  start_dt: string;
  end_dt: string;
  type_label: string;
}

interface Athlete {
  id: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  number?: number;
  type?: string;
}

interface ExerciseStatistic {
  id: string | number;
  event_id: string | number;
  participant_id: string | number;
  exercise_id: string | number | null;
  [metric: string]: string | number | null | undefined;
}

export const exerciseEventsRouter = Router();

/**
 * POST /healthtalk/exercise-events/
 *
 * Receives exercise event/athlete/statistic data pushed directly by the HealthTalk Gateway
 * (or a partner service proxied through it), authenticated via Gateway HMAC headers rather
 * than a Medplum bearer token. Maps the payload to FHIR resources (Patient, Encounter,
 * Observation) and upserts them by partner-supplied identifier so re-delivered requests
 * don't create duplicates.
 */
exerciseEventsRouter.post('/', async (req: Request, res: Response) => {
  const gatewayHeaders = validateGatewayRequest(req);
  if (!gatewayHeaders) {
    sendOutcome(res, badRequest('Invalid or missing Gateway authentication'));
    return;
  }

  const { event, athlete, statistic } = (req.body ?? {}) as {
    event?: ExerciseEvent;
    athlete?: Athlete;
    statistic?: ExerciseStatistic;
  };

  if (!event?.id) {
    sendOutcome(res, badRequest('Missing event.id'));
    return;
  }
  if (!athlete?.id) {
    sendOutcome(res, badRequest('Missing athlete.id'));
    return;
  }
  if (!statistic?.id) {
    sendOutcome(res, badRequest('Missing statistic.id'));
    return;
  }

  const config = getConfig();
  const projectId = gatewayHeaders.tenantId || config.defaultProjectId || (await resolveDefaultProjectId());
  if (!projectId) {
    sendOutcome(res, badRequest('No project configured for exercise event storage'));
    return;
  }

  try {
    const globalSystemRepo = getGlobalSystemRepo();
    const project = await globalSystemRepo.readResource<Project>('Project', projectId);
    const repo = await getProjectSystemRepo(project);

    const patient = await upsertByIdentifier(repo, createPatient(athlete), ATHLETE_ID_SYSTEM, String(athlete.id));
    const encounter = await upsertByIdentifier(repo, createEncounter(event), EVENT_ID_SYSTEM, String(event.id));
    const observation = await upsertByIdentifier(
      repo,
      createObservation(statistic, patient, encounter),
      STATISTIC_ID_SYSTEM,
      String(statistic.id)
    );

    res.status(200).json({
      patient: { id: patient.id },
      encounter: { id: encounter.id },
      observation: { id: observation.id },
    });
  } catch (err) {
    getLogger().error('Failed to store exercise event', { error: err });
    sendOutcome(res, badRequest('Failed to store exercise event'));
  }
});

async function upsertByIdentifier<T extends Resource>(
  repo: SystemRepository,
  resource: T,
  system: string,
  value: string
): Promise<WithId<T>> {
  const existing = await repo.searchOne<T>({
    resourceType: resource.resourceType,
    filters: [{ code: 'identifier', operator: Operator.EQUALS, value: `${system}|${value}` }],
  });

  if (existing) {
    return repo.updateResource({ ...resource, id: existing.id });
  }
  return repo.createResource(resource);
}

function createPatient(athlete: Athlete): Patient {
  return {
    resourceType: 'Patient',
    identifier: [{ system: ATHLETE_ID_SYSTEM, value: String(athlete.id) }],
    name:
      athlete.first_name || athlete.last_name
        ? [{ given: [athlete.first_name ?? ''], family: athlete.last_name }]
        : undefined,
    telecom: athlete.email ? [{ system: 'email', value: athlete.email }] : undefined,
    extension: [
      athlete.number !== undefined
        ? { url: 'https://healthtalk.ai/fhir/extensions/jersey-number', valueInteger: athlete.number }
        : undefined,
      athlete.type ? { url: 'https://healthtalk.ai/fhir/extensions/position', valueString: athlete.type } : undefined,
    ].filter((ext): ext is NonNullable<typeof ext> => ext !== undefined),
  };
}

function createEncounter(exerciseEvent: ExerciseEvent): Encounter {
  return {
    resourceType: 'Encounter',
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    identifier: [{ system: EVENT_ID_SYSTEM, value: String(exerciseEvent.id) }],
    type: exerciseEvent.type_label ? [{ text: exerciseEvent.type_label }] : undefined,
    period: { start: exerciseEvent.start_dt, end: exerciseEvent.end_dt },
  };
}

function createObservation(
  statistic: ExerciseStatistic,
  patient: WithId<Patient>,
  encounter: WithId<Encounter>
): Observation {
  const component: ObservationComponent[] = [];
  for (const [key, value] of Object.entries(statistic)) {
    if (STATISTIC_META_FIELDS.has(key) || value === null || value === undefined) {
      continue;
    }
    component.push({ code: { text: key }, valueQuantity: { value: Number(value) } });
  }

  return {
    resourceType: 'Observation',
    status: 'final',
    identifier: [{ system: STATISTIC_ID_SYSTEM, value: String(statistic.id) }],
    code: { text: 'Exercise session metrics' },
    subject: createReference(patient),
    encounter: createReference(encounter),
    component,
  };
}
