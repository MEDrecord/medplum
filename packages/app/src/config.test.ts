// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'fs';
import path from 'path';
import { deriveDirectBaseUrlFromConfig } from './config';

describe('App config', () => {
  test('Uses explicitly configured direct base URL', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        'https://direct.healthtalk.ai/',
        'https://authb2c-tst.healthtalk.ai/api/gateway/proxy/fhir-api-tst/',
        'https://authb2c-tst.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://direct.healthtalk.ai/');
  });

  test('Derives direct base URL from gateway service configuration', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        undefined,
        'https://authb2c-tst.healthtalk.ai/api/gateway/proxy/fhir-api-tst/',
        'https://authb2c-tst.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://fhir-api-tst.healthtalk.ai/');
  });

  test('Keeps non-proxied base URL unchanged', () => {
    expect(
      deriveDirectBaseUrlFromConfig(
        undefined,
        'https://fhir-api-tst.healthtalk.ai/',
        'https://authb2c-tst.healthtalk.ai',
        'fhir-api-tst'
      )
    ).toBe('https://fhir-api-tst.healthtalk.ai/');
  });
});

/**
 * Which environment a host belongs to.
 *
 * `auth-test-b2c` is listed as PRODUCTION on purpose. It reads like a test host and is an alias of
 * production -- that single misreading is what pointed the test build at the production gateway,
 * so the mapping is written down here rather than inferred from the name.
 */
const GATEWAY_HOSTS: Record<string, 'test' | 'production'> = {
  'authb2c-tst.healthtalk.ai': 'test',
  'authb2c.healthtalk.ai': 'production',
  'auth-test-b2c.healthtalk.ai': 'production',
};

const FHIR_HOSTS: Record<string, 'test' | 'production'> = {
  'fhir-api-tst.healthtalk.ai': 'test',
  'fhir-api-acc.healthtalk.ai': 'test',
  'fhir-api.healthtalk.ai': 'production',
};

/**
 * The slug the gateway registers each backend under.
 *
 * It is NOT derivable from the hostname: production's backend is `fhir-api.healthtalk.ai` and its
 * slug is `fhir-api-prd`. Deriving it would produce `fhir-api`, which no gateway has, so every
 * FHIR call would 404 after a successful sign-in. Hence the explicit mapping, and the assertion
 * below that .env.defaults names one of these.
 */
const SERVICE_SLUGS: Record<string, 'test' | 'production'> = {
  'fhir-api-tst': 'test',
  'fhir-api-acc': 'test',
  'fhir-api-prd': 'production',
};

function readEnvDefaults(): Record<string, string> {
  const file = readFileSync(path.join(__dirname, '..', '.env.defaults'), 'utf8');
  const out: Record<string, string> = {};
  for (const line of file.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim();
    }
  }
  return out;
}

/**
 * The regression guard.
 *
 * Both branches shipped the same .env.defaults: a TEST FHIR server next to a PRODUCTION gateway.
 * Nothing failed, because nothing compared them. These assertions do, so the mismatch cannot be
 * merged on either branch again -- whichever environment a branch targets, it must target it with
 * every host.
 */
describe('.env.defaults environment consistency', () => {
  const env = readEnvDefaults();

  test('Names a known gateway host', () => {
    const host = new URL(env.MEDPLUM_GATEWAY_URL).hostname;
    expect(Object.keys(GATEWAY_HOSTS)).toContain(host);
  });

  test('Names a known FHIR host', () => {
    const host = new URL(env.MEDPLUM_BASE_URL).hostname;
    expect(Object.keys(FHIR_HOSTS)).toContain(host);
  });

  test('Names a gateway service slug the gateway actually registers', () => {
    expect(Object.keys(SERVICE_SLUGS)).toContain(env.MEDPLUM_GATEWAY_SERVICE_NAME);
  });

  test('Gateway, FHIR server and service slug are all from the SAME environment', () => {
    const gatewayEnv = GATEWAY_HOSTS[new URL(env.MEDPLUM_GATEWAY_URL).hostname];
    const fhirEnv = FHIR_HOSTS[new URL(env.MEDPLUM_BASE_URL).hostname];
    const slugEnv = SERVICE_SLUGS[env.MEDPLUM_GATEWAY_SERVICE_NAME];
    expect(fhirEnv).toBe(gatewayEnv);
    expect(slugEnv).toBe(gatewayEnv);
  });

  /**
   * Derivation is what the app falls back to when the slug is not configured, and it is wrong in
   * production. Asserting the slug is set stops the fallback being relied on again.
   */
  test('The slug is set explicitly, not left to hostname derivation', () => {
    expect(env.MEDPLUM_GATEWAY_SERVICE_NAME).toBeTruthy();
  });
});

/**
 * Loads a fresh copy of ./config with a controlled environment.
 *
 * The module reads `import.meta.env` once, at import time, so the only way to assert what it does
 * with a given configuration is to re-import it. babel-preset-vite rewrites `import.meta.env` to
 * `process.env` under jest, which is what makes this possible.
 */
function loadConfigWith(env: Record<string, string | undefined>): typeof import('./config') {
  const saved: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  let loaded: typeof import('./config') | undefined;
  jest.isolateModules(() => {
    loaded = require('./config');
  });

  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return loaded as typeof import('./config');
}

const TEST_ENV = {
  MEDPLUM_GATEWAY_URL: 'https://authb2c-tst.healthtalk.ai',
  MEDPLUM_BASE_URL: 'https://fhir-api-tst.healthtalk.ai/',
  MEDPLUM_GATEWAY_TENANT_ID: undefined,
};

describe('getGatewayUrl', () => {
  test('Returns the configured gateway, without a trailing slash', () => {
    const { getGatewayUrl } = loadConfigWith({ ...TEST_ENV, MEDPLUM_GATEWAY_URL: 'https://authb2c-tst.healthtalk.ai/' });
    expect(getGatewayUrl()).toBe('https://authb2c-tst.healthtalk.ai');
  });

  test('Returns the production gateway when that is what is configured', () => {
    const { getGatewayUrl } = loadConfigWith({ ...TEST_ENV, MEDPLUM_GATEWAY_URL: 'https://authb2c.healthtalk.ai' });
    expect(getGatewayUrl()).toBe('https://authb2c.healthtalk.ai');
  });

  /**
   * The defect this replaces: every call site fell back to `auth-test-b2c.healthtalk.ai`, which is
   * an alias of PRODUCTION. An environment that forgot the variable authenticated its users against
   * production and said nothing. Failing loudly is the fix, so it is asserted.
   */
  test('Throws rather than falling back to a hardcoded gateway', () => {
    const { getGatewayUrl } = loadConfigWith({ ...TEST_ENV, MEDPLUM_GATEWAY_URL: undefined });
    expect(() => getGatewayUrl()).toThrow(/MEDPLUM_GATEWAY_URL is not set/);
  });

  test('The error names both gateways so the fix is obvious', () => {
    const { getGatewayUrl } = loadConfigWith({ ...TEST_ENV, MEDPLUM_GATEWAY_URL: undefined });
    expect(() => getGatewayUrl()).toThrow(/authb2c-tst\.healthtalk\.ai/);
    expect(() => getGatewayUrl()).toThrow(/authb2c\.healthtalk\.ai/);
  });
});

describe('Gateway sign-in URL', () => {
  test('Targets the configured gateway, never a hardcoded one', () => {
    const { getGatewaySignInUrl } = loadConfigWith(TEST_ENV);
    const url = new URL(getGatewaySignInUrl('https://app.example.com/gateway/callback'));
    expect(`${url.protocol}//${url.host}`).toBe('https://authb2c-tst.healthtalk.ai');
    expect(url.pathname).toBe('/api/auth/signin');
  });

  test('A production build targets the production gateway', () => {
    const { getGatewaySignInUrl } = loadConfigWith({
      ...TEST_ENV,
      MEDPLUM_GATEWAY_URL: 'https://authb2c.healthtalk.ai',
      MEDPLUM_BASE_URL: 'https://fhir-api.healthtalk.ai/',
    });
    const url = new URL(getGatewaySignInUrl('https://app.example.com/gateway/callback'));
    expect(url.host).toBe('authb2c.healthtalk.ai');
  });

  /**
   * "default" was not a tenant id -- no tenant has it. The gateway could not resolve it and fell
   * back to the master tenant, so the flow still worked and the dead value went unnoticed.
   */
  test('Sends a real tenant id, not the string "default"', () => {
    const { getGatewaySignInUrl } = loadConfigWith(TEST_ENV);
    const url = new URL(getGatewaySignInUrl('https://app.example.com/gateway/callback'));
    const tenantId = url.searchParams.get('tenantId');
    expect(tenantId).not.toBe('default');
    expect(tenantId).toBe('8d09f1e2-376d-44e0-966c-eb951007e238');
  });

  test('An explicit tenant id overrides the master default', () => {
    const { getGatewaySignInUrl } = loadConfigWith({
      ...TEST_ENV,
      MEDPLUM_GATEWAY_TENANT_ID: '81050330-18de-4a0f-a774-e5e943c9f20a',
    });
    const url = new URL(getGatewaySignInUrl('https://app.example.com/gateway/callback'));
    expect(url.searchParams.get('tenantId')).toBe('81050330-18de-4a0f-a774-e5e943c9f20a');
  });

  test('Round-trips the callback URL', () => {
    const { getGatewaySignInUrl } = loadConfigWith(TEST_ENV);
    const callback = 'https://app.example.com/gateway/callback?next=%2Fpatients';
    const url = new URL(getGatewaySignInUrl(callback));
    expect(url.searchParams.get('callbackUrl')).toBe(callback);
  });
});
