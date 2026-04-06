'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import useSWR from 'swr';
import type { 
  GatewayUser, 
  AuthMode, 
  AuthContextValue, 
  AuthState 
} from '../auth/types';
import {
  getGatewayUrl,
  getTenantId,
  resolveAuthMode,
  isCrossDomain,
} from '../auth/config';
import {
  fetchUser,
  redirectToSignIn as clientRedirectToSignIn,
  signOut as clientSignOut,
  getCachedUser,
  clearAuthStorage,
  getSessionId,
} from '../auth/client';

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Provider Props
// ============================================

export interface AuthProviderProps {
  children: ReactNode;
  /** Gateway URL override (defaults to NEXT_PUBLIC_GATEWAY_URL) */
  gatewayUrl?: string;
  /** Tenant ID override (defaults to NEXT_PUBLIC_TENANT_ID) */
  tenantId?: string;
  /** Auth mode override (defaults to auto-detection) */
  mode?: AuthMode;
  /** Callback when session expires or user is not authenticated */
  onUnauthenticated?: () => void;
  /** Disable automatic session loading on mount */
  disableAutoLoad?: boolean;
}

// ============================================
// Provider Component
// ============================================

/**
 * AuthProvider - Provides authentication context to all child components
 * 
 * Supports dual-mode authentication:
 * - Cookie mode: Same-domain authentication via HttpOnly cookie (auth.sid)
 * - WebToken mode: Cross-domain authentication via X-Session-Id header
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx or app/providers.tsx
 * import { AuthProvider } from '@mrd/sdk';
 * 
 * export function Providers({ children }) {
 *   return (
 *     <AuthProvider>
 *       {children}
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({
  children,
  gatewayUrl: gatewayUrlProp,
  tenantId: tenantIdProp,
  mode: modeProp = 'auto',
  onUnauthenticated,
  disableAutoLoad = false,
}: AuthProviderProps) {
  const gatewayUrl = gatewayUrlProp ?? getGatewayUrl();
  const tenantId = tenantIdProp ?? getTenantId();
  const effectiveMode = resolveAuthMode(modeProp);

  // Initial state from cached user (webToken mode)
  const [initialUser] = useState<GatewayUser | null>(() => {
    if (typeof window === 'undefined') return null;
    if (effectiveMode === 'webtoken') {
      return getCachedUser();
    }
    return null;
  });

  // Fetcher function for SWR
  const fetcher = useCallback(async (): Promise<GatewayUser | null> => {
    // In webToken mode, check for session ID first
    if (effectiveMode === 'webtoken') {
      const sessionId = getSessionId();
      if (!sessionId) {
        return null;
      }
    }
    return fetchUser(effectiveMode);
  }, [effectiveMode]);

  // Use SWR for session management with caching and revalidation
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<GatewayUser | null>(
    disableAutoLoad ? null : ['auth-session', effectiveMode],
    fetcher,
    {
      fallbackData: initialUser,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      onError: () => {
        // Clear storage on auth error in webToken mode
        if (effectiveMode === 'webtoken') {
          clearAuthStorage();
        }
        onUnauthenticated?.();
      },
    }
  );

  // Sign in handler
  const signIn = useCallback((callbackPath?: string) => {
    clientRedirectToSignIn(callbackPath);
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    await clientSignOut({ redirect: false });
    await mutate(null, false);
    
    // Redirect after state update
    if (effectiveMode === 'cookie') {
      // Cookie mode: gateway handles redirect
      window.location.href = `${gatewayUrl}/api/auth/signout`;
    } else {
      // WebToken mode: redirect to home
      window.location.href = '/';
    }
  }, [gatewayUrl, effectiveMode, mutate]);

  // Refresh session
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Context value
  const value = useMemo<AuthContextValue>(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !error,
    error: error?.message ?? null,
    mode: effectiveMode,
    signIn,
    signOut,
    refresh,
    gatewayUrl,
    tenantId,
  }), [
    user,
    isLoading,
    error,
    effectiveMode,
    signIn,
    signOut,
    refresh,
    gatewayUrl,
    tenantId,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/**
 * useAuth - Access authentication state and actions
 * 
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * function UserGreeting() {
 *   const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();
 * 
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <button onClick={() => signIn()}>Sign In</button>;
 * 
 *   return (
 *     <div>
 *       Welcome, {user.name}!
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * useAuthOptional - Access authentication state without throwing
 * Returns null if outside AuthProvider
 */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}

/**
 * useUser - Get current user (shorthand for useAuth().user)
 * 
 * @example
 * ```tsx
 * const user = useUser();
 * if (user) {
 *   console.log(`Logged in as ${user.name}`);
 * }
 * ```
 */
export function useUser(): GatewayUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * useIsAuthenticated - Get authentication status
 * 
 * @example
 * ```tsx
 * const isAuthenticated = useIsAuthenticated();
 * if (!isAuthenticated) {
 *   return <LoginPrompt />;
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
