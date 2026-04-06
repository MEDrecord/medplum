/**
 * Gateway Authentication Types
 * 
 * Types for dual-mode authentication (cookie-based and webToken-based).
 * 
 * @see mrd/.agents/specs/gateway-auth.mdx
 */

/**
 * User information returned from gateway
 */
export interface GatewayUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: GatewayRole;
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
}

/**
 * Gateway user roles
 */
export type GatewayRole = 'user' | 'tenant_admin' | 'developer' | 'admin';

/**
 * Session information from gateway
 */
export interface GatewaySession {
  user: GatewayUser;
  expiresAt: string;
}

/**
 * Auth response from /api/user/me or /api/auth/session
 */
export interface AuthResponse {
  user: GatewayUser | null;
  isAuthenticated: boolean;
  error?: string;
}

/**
 * WebToken exchange response
 */
export interface WebTokenExchangeResponse {
  sessionId: string;
  user: GatewayUser;
  expiresAt: string;
  error?: string;
}

/**
 * Session verification response
 */
export interface SessionVerifyResponse {
  valid: boolean;
  user?: GatewayUser;
  expiresAt?: string;
  error?: string;
}

/**
 * Authentication mode
 * - 'cookie': Same-domain authentication via HttpOnly cookie (auth.sid)
 * - 'webtoken': Cross-domain authentication via X-Session-Id header
 * - 'auto': Auto-detect based on environment (default)
 */
export type AuthMode = 'cookie' | 'webtoken' | 'auto';

/**
 * Auth configuration options
 */
export interface AuthConfig {
  /** Gateway URL (e.g., https://auth-test-b2c.healthtalk.ai) */
  gatewayUrl: string;
  /** Tenant ID for multi-tenant authentication */
  tenantId: string;
  /** App URL for callbacks */
  appUrl: string;
  /** Authentication mode */
  mode: AuthMode;
}

/**
 * Auth state for context
 */
export interface AuthState {
  user: GatewayUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  mode: AuthMode;
}

/**
 * Auth context value
 */
export interface AuthContextValue extends AuthState {
  /** Redirect to gateway sign-in */
  signIn: (callbackPath?: string) => void;
  /** Sign out and clear session */
  signOut: () => Promise<void>;
  /** Refresh session data */
  refresh: () => Promise<void>;
  /** Gateway URL */
  gatewayUrl: string;
  /** Tenant ID */
  tenantId: string;
}
