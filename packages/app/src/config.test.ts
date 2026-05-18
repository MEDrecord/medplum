// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { deriveDirectBaseUrlFromConfig } from './config';

describe('App config', () => {
  test('Uses explicitly configured direct base URL', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        'https://direct.healthtalk.ai/',
        'https://auth-test-b2c.healthtalk.ai/api/gateway/proxy/fhir-api-tst/',
        'https://auth-test-b2c.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://direct.healthtalk.ai/');
  });

  test('Derives direct base URL from gateway service configuration', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        undefined,
        'https://auth-test-b2c.healthtalk.ai/api/gateway/proxy/fhir-api-tst/',
        'https://auth-test-b2c.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://fhir-api-tst.healthtalk.ai/');
  });

  test('Keeps non-proxied base URL unchanged', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        undefined,
        'https://fhir-api-tst.healthtalk.ai/',
        'https://auth-test-b2c.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://fhir-api-tst.healthtalk.ai/');
  });
});