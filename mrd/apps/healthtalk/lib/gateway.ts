/**
 * Gateway utilities for HealthTalk
 * 
 * Re-exports from MEDrecord (the overarching brand) where the
 * shared Gateway integration lives.
 * 
 * All brands use the same Gateway authentication.
 */

export {
  verifyGatewayAuth,
  GatewayAuthError,
  hasRole,
  isAdmin,
  isPractitioner,
  type GatewayAuthResponse,
  type GatewayAuthContext,
  type GatewayError,
} from '../../medrecord/lib/gateway';
