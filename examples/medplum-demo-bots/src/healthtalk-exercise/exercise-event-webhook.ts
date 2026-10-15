// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { BotEvent, MedplumClient } from '@medplum/core';

type ExerciseEventNotification = {
  eventId: string | number;
};

/**
 * Handles the "new event" webhook notification from the exercise-tracking integration partner.
 *
 * The HealthTalk Gateway authenticates the partner and forwards this request to Medplum
 * already signed (validated by `authenticateRequest`/`validateGatewayRequest` before this
 * handler ever runs), so no additional secret check happens in the bot itself.
 *
 * The partner only sends the event ID here. Fetching the full event/statistics/athlete
 * details and storing them as FHIR resources happens in a follow-up step, once this
 * receiver is confirmed to be reachable and validating correctly.
 *
 * @param medplum - The Medplum client
 * @param event - The BotEvent containing the partner's webhook payload
 *
 * @returns A promise that resolves to an acknowledgement object
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent<ExerciseEventNotification>
): Promise<{ received: true; eventId: string | number }> {
  const eventId = event.input?.eventId;
  if (!eventId) {
    throw new Error('Missing eventId');
  }

  console.log('Received new exercise event notification:', eventId);

  return { received: true, eventId };
}
