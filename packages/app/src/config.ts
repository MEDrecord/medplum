// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
export interface MedplumAppConfig {
  baseUrl?: string;
  /** Original FHIR server URL (before gateway proxy override) */
  directBaseUrl?: string;
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

export function deriveDirectBaseUrlFromConfig(
  configuredDirectBaseUrl: string | undefined,
  baseUrl: string | undefined,
  gatewayUrl: string | undefined,
  serviceName: string | undefined
): string | undefined {
  if (configuredDirectBaseUrl) {
    return configuredDirectBaseUrl;
  }

  if (baseUrl && !baseUrl.includes('/api/gateway/proxy/')) {
    return baseUrl;
  }

  if (!gatewayUrl || !serviceName) {
    return baseUrl;
  }

  try {
    const gatewayHostname = new URL(gatewayUrl).hostname;
    const gatewayParts = gatewayHostname.split('.');
    if (gatewayParts.length >= 2) {
      return `https://${serviceName}.${gatewayParts.slice(-2).join('.')}/`;
    }
  } catch {
    // Fall through to the original configured base URL.
  }

  return baseUrl;
}

function deriveDirectBaseUrl(): string | undefined {
  return deriveDirectBaseUrlFromConfig(
    import.meta.env?.MEDPLUM_DIRECT_BASE_URL,
    import.meta.env?.MEDPLUM_BASE_URL,
    import.meta.env?.MEDPLUM_GATEWAY_URL,
    import.meta.env?.MEDPLUM_GATEWAY_SERVICE_NAME || deriveServiceName()
  );
}

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL,
  directBaseUrl: deriveDirectBaseUrl(),
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

export function getDirectBaseUrl(): string | undefined {
  return config.directBaseUrl || config.baseUrl;
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

function setCsrfHeaders(headers: Headers, token: string): void {
  headers.set('X-CSRF-Token', token);
  headers.set('X-XSRF-Token', token);
  headers.set('X-Requested-With', 'XMLHttpRequest');
}

/**
 * Extracts a CSRF token from any available source:
 *  1. Non-httpOnly CSRF cookie set by the gateway on sign-in
 *  2. GET /api/auth/csrf endpoint (cross-origin with credentials)
 *  3. Response body / headers from a previous 403 (passed in as `fromResponse`)
 */
async function fetchCsrfToken(fromResponse?: Response): Promise<string | undefined> {
  // From a 403 response body or headers (most reliable — gateway sends what it expects)
  if (fromResponse) {
    const headerToken = fromResponse.headers.get('x-csrf-token') || fromResponse.headers.get('x-xsrf-token');
    if (headerToken) {
      csrfToken = headerToken;
      return csrfToken;
    }
    try {
      const body = await fromResponse.clone().json();
      const bodyToken = body?.csrfToken || body?.token || body?.csrf;
      if (bodyToken) {
        csrfToken = bodyToken;
        return csrfToken;
      }
    } catch {
      // non-JSON body — fall through
    }
  }

  // Non-httpOnly CSRF cookie set by the gateway on the shared .healthtalk.ai domain
  const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:csrf[_-]?token|_csrf|xsrf[_-]?token)=([^;]*)/i);
  if (cookieMatch) {
    csrfToken = decodeURIComponent(cookieMatch[1]);
    return csrfToken;
  }

  // Fetch from gateway's CSRF endpoint (cross-origin with credentials).
  const gatewayUrl = (config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai').replace(/\/+$/, '');
  try {
    const res = await fetch(`${gatewayUrl}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    // Accept any 2xx — some gateways return 204 with token only in headers
    const headerToken = res.headers.get('x-csrf-token') || res.headers.get('x-xsrf-token');
    if (headerToken) {
      csrfToken = headerToken;
      return csrfToken;
    }
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const bodyToken = data?.csrfToken || data?.token || data?.csrf;
      if (bodyToken) {
        csrfToken = bodyToken;
        return csrfToken;
      }
    }
  } catch {
    // CORS blocked or network error — fall through
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

/** Invalidate the cached CSRF token so the next request fetches a new one. */
export function invalidateCsrfToken(): void {
  csrfToken = undefined;
  csrfFetchPromise = undefined;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isCsrfError(status: number, body: Record<string, unknown>): boolean {
  if (status !== 403) {
    return false;
  }
  const err = String(body?.error || '').toLowerCase();
  const msg = String(body?.message || '').toLowerCase();
  return err.includes('csrf') || msg.includes('csrf') || err.includes('invalid token') || msg.includes('invalid token');
}

/**
 * Creates a fetch wrapper that adds CSRF tokens to mutating requests
 * going through the gateway proxy. GET/HEAD/OPTIONS pass through unchanged.
 * Eagerly fetches a token on construction and retries once on 403 CSRF errors.
 */
export function createGatewayFetch(): typeof fetch {
  // Warm the CSRF token immediately so the first mutating request doesn't
  // have to pay the round-trip cost and risk a 403 on the first try.
  fetchCsrfToken().catch(() => undefined);

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = (init?.method || 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Intercept logout: route directly to gateway signout to clear auth.sid.
    if (method === 'POST' && url.includes('/oauth2/logout')) {
      const gatewayUrl = (config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai').replace(/\/+$/, '');
      window.location.href = `${gatewayUrl}/api/auth/signout?callbackUrl=${encodeURIComponent(window.location.origin + '/signin')}`;
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const headers = new Headers(init?.headers);

    // Rewrite FHIR content types — gateway proxy only accepts standard types.
    const contentType = headers.get('Content-Type') || '';
    if (contentType.includes('fhir+json') || contentType.includes('fhir+xml')) {
      headers.set('Content-Type', contentType.replace(/fhir\+json/g, 'json').replace(/fhir\+xml/g, 'xml'));
    }

    if (MUTATING_METHODS.has(method)) {
      const token = await getCsrfToken();
      if (token) {
        setCsrfHeaders(headers, token);
      }
    }

    init = { ...init, headers, credentials: 'include' };
    const response = await fetch(input, init);

    // On 403 for mutating proxy requests, retry once with a fresh token.
    // Some gateway paths return an empty or non-JSON 403 even though the
    // underlying problem is still CSRF validation.
    if (response.status === 403 && MUTATING_METHODS.has(method)) {
      const body = await response.clone().json().catch(() => ({})) as Record<string, unknown>;
      const isGatewayProxyRequest = url.includes('/api/gateway/proxy/');
      if (isGatewayProxyRequest || isCsrfError(response.status, body)) {
        // Invalidate stale token and try to get a fresh one from the 403 response
        // itself first (fastest), then fall back to a dedicated fetch.
        csrfToken = undefined;
        const freshToken = await fetchCsrfToken(response) ?? await fetchCsrfToken();

        if (freshToken) {
          const retryHeaders = new Headers(headers);
          setCsrfHeaders(retryHeaders, freshToken);
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
