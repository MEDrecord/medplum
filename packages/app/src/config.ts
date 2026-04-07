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
  // Google login and local registration are disabled -- gateway auth only
  googleClientId: undefined,
  recaptchaSiteKey: undefined,
  registerEnabled: false,
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
  // Check if the gateway set a CSRF cookie (non-httpOnly) during sign-in.
  // The cookie is on .healthtalk.ai so it's readable from fhir-tst.healthtalk.ai.
  const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:csrf[_-]?token|_csrf)=([^;]*)/i);
  if (cookieMatch) {
    csrfToken = decodeURIComponent(cookieMatch[1]);
    return csrfToken;
  }
  // No pre-fetch of /api/auth/csrf -- it's cross-origin and fails CORS.
  // The retry mechanism in createGatewayFetch handles CSRF failures by
  // extracting the token from the 403 error response body.
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
export function createGatewayFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = (init?.method || 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Intercept logout: MedplumClient sends POST /oauth2/logout through the proxy,
    // but the gateway proxy returns 415. Instead, call the gateway's signout
    // endpoint directly via redirect to clear the auth.sid session cookie.
    if (method === 'POST' && url.includes('/oauth2/logout')) {
      const gatewayUrl = (config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai').replace(/\/+$/, '');
      // Redirect to gateway signout which clears the session and redirects back
      window.location.href = `${gatewayUrl}/api/auth/signout?callbackUrl=${encodeURIComponent(window.location.origin + '/signin')}`;
      // Return a fake 200 so MedplumClient's signOut() doesn't throw
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const headers = new Headers(init?.headers);

    // Rewrite FHIR content types to application/json -- the gateway proxy
    // only allows standard types (application/json, text/plain, etc.) and
    // rejects application/fhir+json with 415 Unsupported Media Type.
    // The Medplum server accepts application/json for all FHIR operations.
    const contentType = headers.get('Content-Type') || '';
    if (contentType.includes('fhir+json') || contentType.includes('fhir+xml')) {
      headers.set('Content-Type', contentType.replace(/fhir\+json/g, 'json').replace(/fhir\+xml/g, 'xml'));
    }

    if (MUTATING_METHODS.has(method)) {
      const token = await getCsrfToken();
      if (token) {
        headers.set('X-CSRF-Token', token);
      }
    }

    init = { ...init, headers, credentials: 'include' };

    const response = await fetch(input, init);

    // If CSRF failed (403), extract token from response if provided and retry once
    if (response.status === 403 && MUTATING_METHODS.has(method)) {
      const body = await response.clone().json().catch(() => ({}));
      if (body?.error === 'CSRF validation failed' || body?.message?.includes('CSRF')) {
        csrfToken = undefined;

        // Some gateways return the expected token in the error response
        if (body?.csrfToken || body?.token) {
          csrfToken = body.csrfToken || body.token;
        } else {
          // Try fetching fresh token
          await fetchCsrfToken();
        }

        if (csrfToken) {
          const retryHeaders = new Headers(init?.headers);
          retryHeaders.set('X-CSRF-Token', csrfToken);
          return fetch(input, { ...init, headers: retryHeaders });
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
