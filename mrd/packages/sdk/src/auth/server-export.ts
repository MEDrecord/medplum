/**
 * Server-side Auth Exports
 * 
 * This file is meant to be imported as '@mrd/sdk/auth/server'
 * for server-only usage in Next.js Server Components, Server Actions, and Route Handlers.
 * 
 * @example
 * ```ts
 * import { getServerSession, validateServerSession } from '@mrd/sdk/auth/server';
 * ```
 */

export {
  getServerSession,
  validateServerSession,
  getServerUser,
  serverFetch,
  createAuthHeaders,
  verifySessionId,
  getSessionFromRequest,
  requireAuth,
  getGatewayUrl,
  getTenantId,
  getAppUrl,
} from './server';
