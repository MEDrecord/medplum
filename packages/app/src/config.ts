// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
export interface MedplumAppConfig {
  baseUrl?: string;
  clientId?: string;
  googleClientId?: string;
  recaptchaSiteKey?: string;
  registerEnabled?: boolean | string;
  awsTextractEnabled?: boolean | string;
  // HealthTalk Gateway configuration
  gatewayUrl?: string;
  gatewayTenantId?: string;
  gatewayEnabled?: boolean | string;
  /** Service name used in the gateway proxy path, e.g. "fhir-api-tst" */
  gatewayServiceName?: string;
}

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL,
  clientId: import.meta.env?.MEDPLUM_CLIENT_ID,
  googleClientId: import.meta.env?.GOOGLE_CLIENT_ID,
  recaptchaSiteKey: import.meta.env?.RECAPTCHA_SITE_KEY,
  registerEnabled: import.meta.env?.MEDPLUM_REGISTER_ENABLED,
  awsTextractEnabled: import.meta.env?.MEDPLUM_AWS_TEXTRACT_ENABLED,
  // HealthTalk Gateway - uses MEDPLUM_ prefix to match Vite envPrefix
  gatewayUrl: import.meta.env?.MEDPLUM_GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai',
  gatewayTenantId: import.meta.env?.MEDPLUM_GATEWAY_TENANT_ID || 'default',
  gatewayEnabled: import.meta.env?.MEDPLUM_GATEWAY_ENABLED ?? true,
  gatewayServiceName: import.meta.env?.MEDPLUM_GATEWAY_SERVICE_NAME || deriveServiceName(),
};

/**
 * Derive the gateway service name from MEDPLUM_BASE_URL when not explicitly set.
 * e.g. "https://fhir-api-tst.healthtalk.ai/" -> "fhir-api-tst"
 */
function deriveServiceName(): string | undefined {
  try {
    const baseUrl = import.meta.env?.MEDPLUM_BASE_URL;
    if (!baseUrl) {
      return undefined;
    }
    const hostname = new URL(baseUrl).hostname; // "fhir-api-tst.healthtalk.ai"
    const parts = hostname.split('.');
    // Take everything before the domain (e.g. "fhir-api-tst" from "fhir-api-tst.healthtalk.ai")
    if (parts.length >= 3) {
      return parts.slice(0, parts.length - 2).join('.');
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function getConfig(): MedplumAppConfig {
  return config;
}

export function isRegisterEnabled(): boolean {
  return isFeatureEnabled('registerEnabled');
}

export function isAwsTextractEnabled(): boolean {
  return isFeatureEnabled('awsTextractEnabled');
}

export function isGatewayEnabled(): boolean {
  return isFeatureEnabled('gatewayEnabled');
}

/**
 * Returns the base URL the MedplumClient should use.
 * When the gateway is enabled and a service name is configured, all FHIR/auth
 * calls are routed through the gateway proxy so the auth.sid cookie (same-domain,
 * httpOnly) is forwarded automatically by the browser.
 *
 * Example: https://auth-test-b2c.healthtalk.ai/api/gateway/proxy/fhir-api-tst/
 */
export function getEffectiveBaseUrl(): string | undefined {
  if (isGatewayEnabled() && config.gatewayServiceName && config.gatewayUrl) {
    const gw = config.gatewayUrl.replace(/\/+$/, '');
    const svc = config.gatewayServiceName.replace(/^\/+|\/+$/g, '');
    return `${gw}/api/gateway/proxy/${svc}/`;
  }
  return config.baseUrl;
}

export function getGatewaySignInUrl(callbackUrl: string): string {
  const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
  const tenantId = config.gatewayTenantId || 'default';
  return `${gatewayUrl}/api/auth/signin?tenantId=${tenantId}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

/**
 * CSRF token cache for gateway proxy requests.
 * The gateway requires X-CSRF-Token on mutating requests (POST/PUT/PATCH/DELETE).
 */
let csrfToken: string | undefined;
let csrfFetchPromise: Promise<string | undefined> | undefined;

async function fetchCsrfToken(): Promise<string | undefined> {
  const gatewayUrl = (config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai').replace(/\/+$/, '');
  try {
    const res = await fetch(`${gatewayUrl}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken || data.token;
      return csrfToken;
    }
  } catch {
    // CSRF fetch failed, proceed without token
  }
  return undefined;
}

async function getCsrfToken(): Promise<string | undefined> {
  if (csrfToken) {
    return csrfToken;
  }
  // Deduplicate concurrent CSRF fetches
  if (!csrfFetchPromise) {
    csrfFetchPromise = fetchCsrfToken().finally(() => {
      csrfFetchPromise = undefined;
    });
  }
  return csrfFetchPromise;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Creates a fetch wrapper that adds CSRF tokens to mutating requests
 * going through the gateway proxy. GET/HEAD/OPTIONS pass through unchanged.
 * If a request fails with 403 CSRF, retries once with a fresh token.
 */
/** Headers that the gateway CORS does not allow -- strip before sending. */
const DISALLOWED_HEADERS = ['x-medplum'];

export function createGatewayFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = (init?.method || 'GET').toUpperCase();
    const headers = new Headers(init?.headers);

    // Strip headers the gateway proxy doesn't allow through CORS
    for (const h of DISALLOWED_HEADERS) {
      headers.delete(h);
    }

    if (MUTATING_METHODS.has(method)) {
      const token = await getCsrfToken();
      if (token) {
        headers.set('X-CSRF-Token', token);
      }
    }

    init = { ...init, headers, credentials: 'include' };

    const response = await fetch(input, init);

    // If CSRF failed, refresh token and retry once
    if (response.status === 403 && MUTATING_METHODS.has((init?.method || 'GET').toUpperCase())) {
      const body = await response.clone().json().catch(() => ({}));
      if (body?.error === 'CSRF validation failed') {
        csrfToken = undefined; // Invalidate cached token
        const freshToken = await fetchCsrfToken();
        if (freshToken) {
          const headers = new Headers(init?.headers);
          headers.set('X-CSRF-Token', freshToken);
          return fetch(input, { ...init, headers });
        }
      }
    }

    return response;
  };
}

function isFeatureEnabled(feature: keyof MedplumAppConfig): boolean {
  // This try/catch exists to prevent Rollup optimization from removing this function
  try {
    return config[feature] !== false && config[feature] !== 'false';
  } catch {
    return true;
  }
}
