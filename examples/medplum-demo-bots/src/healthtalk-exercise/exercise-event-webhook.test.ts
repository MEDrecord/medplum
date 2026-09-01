// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';

import { handler } from './exercise-event-webhook';

describe('Exercise Event Webhook', () => {
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/json';

  let medplum: MockClient;

  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  beforeEach(() => {
    medplum = new MockClient();
  });

  test('throws error when eventId is missing', async () => {
    await expect(handler(medplum, { bot, input: {} as any, contentType, secrets: {} })).rejects.toThrow(
      'Missing eventId'
    );
  });

  test('acknowledges a valid notification', async () => {
    const result = await handler(medplum, {
      bot,
      input: { eventId: 107251 },
      contentType,
      secrets: {},
    });

    expect(result).toStrictEqual({ received: true, eventId: 107251 });
  });
});
