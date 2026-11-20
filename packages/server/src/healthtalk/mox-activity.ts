// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import { badRequest, Operator } from '@medplum/core';
import type { Device, Encounter, Observation, ObservationComponent, Project, Resource } from '@medplum/fhirtypes';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { resolveDefaultProjectId } from '../auth/gateway';
import { getConfig } from '../config/loader';
import { sendOutcome } from '../fhir/outcomes';
import type { SystemRepository } from '../fhir/repo';
import { getGlobalSystemRepo, getProjectSystemRepo } from '../fhir/repo';
import { getLogger } from '../logger';
import { validateGatewayRequest } from '../oauth/gateway';

const MOX_SERIAL_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/mox-serial';
const MOX_SESSION_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/mox-session';
const MOX_MEASUREMENT_SYSTEM = 'https://healthtalk.ai/fhir/identifiers/mox-measurement';

const UCUM_SYSTEM = 'http://unitsofmeasure.org';

interface MoxActivityRecord {
  MoxName: string;
  MeasurementId: string;
  Timestamp: string;
  Day: number;
  SedentaryinSeconds: number;
  StandingInSeconds: number;
  DynamicInSeconds: number;
  Steps: number;
}

export const moxActivityRouter = Router();

/**
 * POST /healthtalk/mox-activity/
 *
 * Receives daily posture/activity summaries from Mox sensors, pushed via the HealthTalk
 * Gateway (HMAC-authenticated, same as exercise-events). Each record is a day of data for
 * one Mox device. There is no patient linkage yet -- records are stored against the Device,
 * to be re-subjected to a Patient once that mapping exists upstream.
 */
moxActivityRouter.post('/', async (req: Request, res: Response) => {
  const gatewayHeaders = validateGatewayRequest(req);
  if (!gatewayHeaders) {
    sendOutcome(res, badRequest('Invalid or missing Gateway authentication'));
    return;
  }

  const { records } = (req.body ?? {}) as { records?: MoxActivityRecord[] };
  if (!records?.length) {
    sendOutcome(res, badRequest('Missing records'));
    return;
  }

  const config = getConfig();
  const projectId = config.defaultProjectId || (await resolveDefaultProjectId());
  if (!projectId) {
    sendOutcome(res, badRequest('No project configured for Mox activity storage'));
    return;
  }

  try {
    const globalSystemRepo = getGlobalSystemRepo();
    const project = await globalSystemRepo.readResource<Project>('Project', projectId);
    const repo = await getProjectSystemRepo(project);

    for (const record of records) {
      if (!record.MoxName || !record.MeasurementId || record.Day === undefined) {
        sendOutcome(res, badRequest('Each record requires MoxName, MeasurementId, and Day'));
        return;
      }
    }

    const sessions = new Map<string, MoxActivityRecord[]>();
    for (const record of records) {
      const sessionRecords = sessions.get(record.MeasurementId) ?? [];
      sessionRecords.push(record);
      sessions.set(record.MeasurementId, sessionRecords);
    }

    const observationIds: string[] = [];
    for (const sessionRecords of sessions.values()) {
      const device = await upsertByIdentifier(
        repo,
        createDevice(sessionRecords[0]),
        MOX_SERIAL_SYSTEM,
        sessionRecords[0].MoxName,
        projectId
      );
      const encounter = await upsertByIdentifier(
        repo,
        createEncounter(sessionRecords),
        MOX_SESSION_SYSTEM,
        sessionRecords[0].MeasurementId,
        projectId
      );

      for (const record of sessionRecords) {
        const observation = await upsertByIdentifier(
          repo,
          createObservation(record, device, encounter),
          MOX_MEASUREMENT_SYSTEM,
          `${record.MeasurementId}-${record.Day}`,
          projectId
        );
        observationIds.push(observation.id);
      }
    }

    getLogger().info('Stored Mox activity records', {
      resolvedProjectId: projectId,
      recordCount: records.length,
      observationIds,
    });

    res.status(200).json({ observations: observationIds.map((id) => ({ id })) });
  } catch (err) {
    getLogger().error('Failed to store Mox activity records', { error: err, resolvedProjectId: projectId });
    sendOutcome(res, badRequest('Failed to store Mox activity records'));
  }
});

async function upsertByIdentifier<T extends Resource>(
  repo: SystemRepository,
  resource: T,
  system: string,
  value: string,
  projectId: string
): Promise<WithId<T>> {
  const existing = await repo.searchOne<T>({
    resourceType: resource.resourceType,
    filters: [
      { code: 'identifier', operator: Operator.EQUALS, value: `${system}|${value}` },
      { code: '_project', operator: Operator.EQUALS, value: projectId },
    ],
  });

  if (existing) {
    return repo.updateResource({ ...resource, id: existing.id });
  }
  return repo.createResource({ ...resource, meta: { ...resource.meta, project: projectId } });
}

function createDevice(record: MoxActivityRecord): Device {
  return {
    resourceType: 'Device',
    identifier: [{ system: MOX_SERIAL_SYSTEM, value: record.MoxName }],
    serialNumber: record.MoxName,
  };
}

function createEncounter(sessionRecords: MoxActivityRecord[]): Encounter {
  const timestamps = sessionRecords.map((r) => r.Timestamp).sort();

  return {
    resourceType: 'Encounter',
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'HH', display: 'home health' },
    identifier: [{ system: MOX_SESSION_SYSTEM, value: sessionRecords[0].MeasurementId }],
    period: { start: timestamps[0], end: timestamps[timestamps.length - 1] },
  };
}

function createObservation(record: MoxActivityRecord, device: WithId<Device>, encounter: WithId<Encounter>): Observation {
  const component: ObservationComponent[] = [
    { code: { text: 'SedentaryinSeconds' }, valueQuantity: { value: record.SedentaryinSeconds, unit: 's', system: UCUM_SYSTEM, code: 's' } },
    { code: { text: 'StandingInSeconds' }, valueQuantity: { value: record.StandingInSeconds, unit: 's', system: UCUM_SYSTEM, code: 's' } },
    { code: { text: 'DynamicInSeconds' }, valueQuantity: { value: record.DynamicInSeconds, unit: 's', system: UCUM_SYSTEM, code: 's' } },
    { code: { text: 'Steps' }, valueQuantity: { value: record.Steps, unit: '{steps}', system: UCUM_SYSTEM, code: '{steps}' } },
  ];

  return {
    resourceType: 'Observation',
    status: 'final',
    identifier: [{ system: MOX_MEASUREMENT_SYSTEM, value: `${record.MeasurementId}-${record.Day}` }],
    category: [
      {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'activity', display: 'Activity' },
        ],
      },
    ],
    code: { text: 'Daily posture/activity summary' },
    effectiveDateTime: record.Timestamp,
    subject: { reference: `Device/${device.id}` },
    device: { reference: `Device/${device.id}` },
    encounter: { reference: `Encounter/${encounter.id}` },
    component,
  };
}
