/**
 * Gateway Authentication Module
 * 
 * Dual-mode authentication support for HealthTalk Gateway:
 * - Cookie mode: Same-domain authentication via HttpOnly cookie (auth.sid)
 * - WebToken mode: Cross-domain authentication via X-Session-Id header
 * 
 * @example
 * ```tsx
 * // Client-side usage
 * import { useAuth, AuthProvider, redirectToSignIn } from '@mrd/sdk';
 * 
 * // In app layout
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * 
 * // In components
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 * ```
 */

// Types
export type {
  GatewayUser,
  GatewayRole,
  GatewaySession,
  AuthResponse,
  WebTokenExchangeResponse,
  SessionVerifyResponse,
  AuthMode,
  AuthConfig,
  AuthState,
  AuthContextValue,
} from './types';

// Config
export {
  getGatewayUrl,
  getTenantId,
  getAppUrl,
  getAuthMode,
  isCrossDomain,
  resolveAuthMode,
  buildSignInUrl,
  buildSignOutUrl,
  validateCallbackUrl,
} from './config';

// Client functions (browser-only)
export {
  redirectToSignIn,
  signOut,
  exchangeWebToken,
  verifySession,
  fetchUser,
  fetchWithAuth,
  isAuthenticated,
  getCachedUser,
  handleAuthCallback,
} from './client';

// Storage (browser-only, for webToken mode)
export {
  setSessionId,
  getSessionId,
  removeSessionId,
  clearAuthStorage,
  hasStoredSession,
} from './storage';
