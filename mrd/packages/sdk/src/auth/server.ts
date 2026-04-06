/**
 * Gateway Authentication Server
 * 
 * Server-side authentication functions for Next.js Server Components,
 * Server Actions, and Route Handlers.
 * 
 * These functions should only be used on the server side.
 */

import type { GatewayUser, GatewaySession, SessionVerifyResponse } from './types';
import { getGatewayUrl } from './config';

// Re-export config functions for server use
export { getGatewayUrl, getTenantId, getAppUrl } from './config';

/**
 * Get session from gateway (server-side)
 * 
 * @param cookies - Cookie string from request headers
 * @param sessionId - Session ID for webToken mode
 */
export async function getServerSession(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<GatewaySession | null> {
  const gatewayUrl = getGatewayUrl();

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add session ID for webToken mode
    if (options.sessionId) {
      headers['X-Session-Id'] = options.sessionId;
    }

    // Forward cookies for cookie mode
    if (options.cookies) {
      headers['Cookie'] = options.cookies;
    }

    const response = await fetch(`${gatewayUrl}/api/auth/session`, {
      headers,
      cache: 'no-store', // Always fetch fresh session data
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Validate session and return user (server-side)
 */
export async function validateServerSession(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<SessionVerifyResponse> {
  const session = await getServerSession(options);

  if (!session) {
    return { valid: false, error: 'No session found' };
  }

  // Check expiry
  if (new Date(session.expiresAt) <= new Date()) {
    return { valid: false, error: 'Session expired' };
  }

  return {
    valid: true,
    user: session.user,
    expiresAt: session.expiresAt,
  };
}

/**
 * Get user from gateway /api/user/me (server-side)
 */
export async function getServerUser(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<GatewayUser | null> {
  const gatewayUrl = getGatewayUrl();

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (options.sessionId) {
      headers['X-Session-Id'] = options.sessionId;
    }

    if (options.cookies) {
      headers['Cookie'] = options.cookies;
    }

    const response = await fetch(`${gatewayUrl}/api/user/me`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Make authenticated server fetch to gateway proxy
 */
export async function serverFetch<T = unknown>(
  path: string,
  options: {
    cookies?: string;
    sessionId?: string;
    serviceSlug?: string;
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
  } = {}
): Promise<T> {
  const gatewayUrl = getGatewayUrl();
  const serviceSlug = options.serviceSlug ?? 'api';
  const url = path.startsWith('http') 
    ? path 
    : `${gatewayUrl}/api/gateway/proxy/${serviceSlug}${path}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.sessionId) {
    headers.set('X-Session-Id', options.sessionId);
  }

  if (options.cookies) {
    headers.set('Cookie', options.cookies);
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Create auth headers for server-side requests
 */
export function createAuthHeaders(options: {
  cookies?: string;
  sessionId?: string;
}): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options.sessionId) {
    headers['X-Session-Id'] = options.sessionId;
  }

  if (options.cookies) {
    headers['Cookie'] = options.cookies;
  }

  return headers;
}

/**
 * Verify session ID (webToken mode) - server-side
 */
export async function verifySessionId(sessionId: string): Promise<SessionVerifyResponse> {
  const gatewayUrl = getGatewayUrl();

  try {
    const response = await fetch(`${gatewayUrl}/api/auth/web-session/verify`, {
      headers: {
        'X-Session-Id': sessionId,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { valid: false, error: 'Session verification failed' };
    }

    return await response.json();
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Session verification failed' 
    };
  }
}

/**
 * Get session from request (Next.js helper)
 * Works with both cookie and webToken modes
 * 
 * @example
 * ```ts
 * // In a Server Component or Route Handler
 * import { cookies, headers } from 'next/headers';
 * import { getSessionFromRequest } from '@mrd/sdk/auth/server';
 * 
 * const session = await getSessionFromRequest({
 *   getCookies: () => cookies().toString(),
 *   getHeader: (name) => headers().get(name),
 * });
 * ```
 */
export async function getSessionFromRequest(helpers: {
  getCookies: () => string | Promise<string>;
  getHeader: (name: string) => string | null | Promise<string | null>;
}): Promise<GatewaySession | null> {
  const [cookies, sessionId] = await Promise.all([
    helpers.getCookies(),
    helpers.getHeader('x-session-id'),
  ]);

  return getServerSession({
    cookies,
    sessionId: sessionId ?? undefined,
  });
}

/**
 * Require authentication - throws redirect if not authenticated
 * For use in Server Components
 */
export async function requireAuth(options: {
  cookies?: string;
  sessionId?: string;
  redirectTo?: string;
}): Promise<GatewaySession> {
  const session = await getServerSession(options);

  if (!session) {
    // In Next.js 15+, we can't throw redirect from a utility function
    // Instead, we throw an error that can be caught
    const error = new Error('UNAUTHORIZED');
    (error as Error & { redirectTo?: string }).redirectTo = options.redirectTo ?? '/auth/signin';
    throw error;
  }

  return session;
}
