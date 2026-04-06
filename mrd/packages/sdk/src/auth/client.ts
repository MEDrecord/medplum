/**
 * Gateway Authentication Client
 * 
 * Client-side authentication functions for dual-mode auth (cookie + webToken).
 * Use these in React components and client-side code.
 */

import type { 
  GatewayUser, 
  GatewaySession, 
  AuthMode,
  WebTokenExchangeResponse,
  SessionVerifyResponse,
} from './types';
import {
  getGatewayUrl,
  getTenantId,
  getAppUrl,
  buildSignInUrl,
  buildSignOutUrl,
  resolveAuthMode,
  validateCallbackUrl,
} from './config';
import {
  setSessionId,
  getSessionId,
  removeSessionId,
  setUserData,
  getUserData,
  setExpiresAt,
  clearAuthStorage,
  hasStoredSession,
} from './storage';

/**
 * Redirect to gateway sign-in page
 */
export function redirectToSignIn(callbackPath?: string): void {
  const appUrl = getAppUrl();
  const callback = callbackPath ?? window.location.pathname + window.location.search;
  const fullCallbackUrl = callback.startsWith('http') ? callback : `${appUrl}${callback}`;
  
  const signInUrl = buildSignInUrl({
    callbackUrl: fullCallbackUrl,
  });
  
  window.location.href = signInUrl;
}

/**
 * Sign out and clear session
 */
export async function signOut(options?: { 
  redirect?: boolean;
  redirectUrl?: string;
}): Promise<void> {
  const gatewayUrl = getGatewayUrl();
  const mode = resolveAuthMode('auto');
  
  // Clear local storage for webToken mode
  clearAuthStorage();
  
  if (mode === 'cookie') {
    // Cookie mode: redirect to gateway signout
    if (options?.redirect !== false) {
      window.location.href = buildSignOutUrl(gatewayUrl);
    } else {
      // Just call the signout endpoint
      await fetch(`${gatewayUrl}/api/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors - user is logged out locally
      });
    }
  } else {
    // WebToken mode: just clear storage and redirect
    if (options?.redirect !== false) {
      window.location.href = options?.redirectUrl ?? '/';
    }
  }
}

/**
 * Exchange webToken for sessionId (cross-domain flow)
 */
export async function exchangeWebToken(webToken: string): Promise<WebTokenExchangeResponse> {
  const gatewayUrl = getGatewayUrl();
  
  const response = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    },
    body: JSON.stringify({ webToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      sessionId: '',
      user: null as unknown as GatewayUser,
      expiresAt: '',
      error: data.error ?? data.message ?? 'Token exchange failed',
    };
  }

  // Store session data
  if (data.sessionId) {
    setSessionId(data.sessionId);
  }
  if (data.user) {
    setUserData(data.user);
  }
  if (data.expiresAt) {
    setExpiresAt(data.expiresAt);
  }

  return data;
}

/**
 * Verify current session is valid
 */
export async function verifySession(mode?: AuthMode): Promise<SessionVerifyResponse> {
  const gatewayUrl = getGatewayUrl();
  const effectiveMode = resolveAuthMode(mode);

  try {
    if (effectiveMode === 'webtoken') {
      const sessionId = getSessionId();
      if (!sessionId) {
        return { valid: false, error: 'No session ID found' };
      }

      const response = await fetch(`${gatewayUrl}/api/auth/web-session/verify`, {
        headers: {
          'X-Session-Id': sessionId,
        },
      });

      if (!response.ok) {
        clearAuthStorage();
        return { valid: false, error: 'Session verification failed' };
      }

      return await response.json();
    } else {
      // Cookie mode: check session endpoint
      const response = await fetch(`${gatewayUrl}/api/auth/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return { valid: false, error: 'Session not found' };
      }

      const session: GatewaySession = await response.json();
      return {
        valid: true,
        user: session.user,
        expiresAt: session.expiresAt,
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Session verification failed' 
    };
  }
}

/**
 * Get current user from gateway
 */
export async function fetchUser(mode?: AuthMode): Promise<GatewayUser | null> {
  const gatewayUrl = getGatewayUrl();
  const effectiveMode = resolveAuthMode(mode);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add session ID header for webToken mode
    if (effectiveMode === 'webtoken') {
      const sessionId = getSessionId();
      if (!sessionId) {
        return null;
      }
      headers['X-Session-Id'] = sessionId;
    }

    const response = await fetch(`${gatewayUrl}/api/user/me`, {
      credentials: effectiveMode === 'cookie' ? 'include' : 'omit',
      headers,
    });

    if (!response.ok) {
      if (effectiveMode === 'webtoken') {
        clearAuthStorage();
      }
      return null;
    }

    const user: GatewayUser = await response.json();
    
    // Cache user data for webToken mode
    if (effectiveMode === 'webtoken') {
      setUserData(user);
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Make an authenticated fetch request
 * Automatically handles auth mode and 401 responses
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  options: RequestInit & { 
    mode?: AuthMode;
    onUnauthorized?: () => void;
  } = {}
): Promise<T> {
  const { mode: authMode, onUnauthorized, ...fetchOptions } = options;
  const effectiveMode = resolveAuthMode(authMode);

  const headers = new Headers(fetchOptions.headers);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add session ID for webToken mode
  if (effectiveMode === 'webtoken') {
    const sessionId = getSessionId();
    if (sessionId) {
      headers.set('X-Session-Id', sessionId);
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: effectiveMode === 'cookie' ? 'include' : 'omit',
    headers,
  });

  if (response.status === 401) {
    if (effectiveMode === 'webtoken') {
      clearAuthStorage();
    }
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      // Default: redirect to sign-in
      redirectToSignIn();
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Check if user is authenticated (quick check without API call)
 */
export function isAuthenticated(mode?: AuthMode): boolean {
  const effectiveMode = resolveAuthMode(mode);
  
  if (effectiveMode === 'webtoken') {
    return hasStoredSession();
  }
  
  // Cookie mode: can't check without API call
  // Return false to force a session check
  return false;
}

/**
 * Get cached user data (webToken mode only)
 */
export function getCachedUser(): GatewayUser | null {
  return getUserData();
}

/**
 * Handle auth callback - process webToken or validate cookie session
 */
export async function handleAuthCallback(
  searchParams: URLSearchParams
): Promise<{ success: boolean; user?: GatewayUser; error?: string; redirectUrl: string }> {
  const webToken = searchParams.get('webToken');
  const callbackUrl = validateCallbackUrl(
    searchParams.get('callbackUrl') ?? searchParams.get('redirect') ?? '/',
    getAppUrl()
  );
  const error = searchParams.get('error');

  if (error) {
    return { 
      success: false, 
      error: error,
      redirectUrl: `/auth/signin?error=${encodeURIComponent(error)}`,
    };
  }

  // WebToken flow (cross-domain)
  if (webToken) {
    const result = await exchangeWebToken(webToken);
    if (result.error) {
      return {
        success: false,
        error: result.error,
        redirectUrl: `/auth/signin?error=${encodeURIComponent(result.error)}`,
      };
    }
    return {
      success: true,
      user: result.user,
      redirectUrl: callbackUrl,
    };
  }

  // Cookie flow (same-domain) - verify session
  const verification = await verifySession('cookie');
  if (!verification.valid) {
    return {
      success: false,
      error: verification.error ?? 'Session invalid',
      redirectUrl: `/auth/signin?error=session_invalid`,
    };
  }

  return {
    success: true,
    user: verification.user,
    redirectUrl: callbackUrl,
  };
}
