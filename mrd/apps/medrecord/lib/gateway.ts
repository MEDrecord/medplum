/**
 * Gateway HMAC Validation for Next.js API Routes
 *
 * Validates inbound requests from the HealthTalk Gateway using the same
 * HMAC-SHA256 scheme as packages/server/src/oauth/gateway.ts.
 *
 * Auth flow:
 *   1. Gateway proxies request → sets X-Gateway-Key, X-Gateway-Signature,
 *      X-Gateway-Timestamp, X-Request-Id, and trusted user headers.
 *   2. This module validates those headers with timing-safe comparison and
 *      5-minute replay protection.
 *   3. Returns a GatewayAuthContext populated from the trusted headers.
 *
 * Backward compatibility:
 *   If no HMAC headers are present but an Authorization header IS present,
 *   falls back to the legacy HTTP-verify flow (POST to gateway /auth/verify).
 *   This ensures existing browser-side callers are not broken during migration.
 *
 * Env vars (server-only, NEVER NEXT_PUBLIC_*):
 *   GATEWAY_API_KEY       – shared key the gateway sends in X-Gateway-Key
 *   SERVICE_SECRET_KEY    – HMAC secret for X-Gateway-Signature
 *   GATEWAY_URL           – base URL for legacy verify fallback
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatewayAuthContext {
  user_id: string;
  email: string;
  tenant_id: string;
  organization_id?: string;
  brand: 'healthtalk' | 'coachi' | 'medsafe' | 'medrecord';
  roles: string[];
}

/** @deprecated Use GatewayAuthContext instead */
export type GatewayAuthResponse = GatewayAuthContext;

export interface GatewayError {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class GatewayAuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GatewayAuthError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Internal: HMAC header extraction
// ---------------------------------------------------------------------------

interface GatewayHmacHeaders {
  gatewayKey: string;
  signature: string;
  timestamp: string;
  requestId: string;
  userId: string;
  userEmail: string;
  userRole?: string;
  tenantId?: string;
  tenantRole?: string;
  authMethod?: string;
  signedPath?: string;
}

function extractHmacHeaders(request: Request): GatewayHmacHeaders | undefined {
  const gatewayKey = request.headers.get('x-gateway-key');
  if (!gatewayKey) {
    return undefined;
  }

  return {
    gatewayKey,
    signature: request.headers.get('x-gateway-signature') ?? '',
    timestamp: request.headers.get('x-gateway-timestamp') ?? '',
    requestId: request.headers.get('x-request-id') ?? '',
    userId: request.headers.get('x-user-id') ?? '',
    userEmail: request.headers.get('x-user-email') ?? '',
    userRole: request.headers.get('x-user-role') ?? undefined,
    tenantId: request.headers.get('x-tenant-id') ?? undefined,
    tenantRole: request.headers.get('x-tenant-role') ?? undefined,
    authMethod: request.headers.get('x-auth-method') ?? undefined,
    signedPath: request.headers.get('x-signed-path') ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Internal: Timing-safe string comparison
// ---------------------------------------------------------------------------

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal: HMAC validation helpers (mirrors packages/server/src/oauth/gateway.ts)
// ---------------------------------------------------------------------------

function validateGatewayKey(gatewayKey: string): boolean {
  const expectedKey = process.env.GATEWAY_API_KEY;
  if (!expectedKey) {
    console.error('[Gateway] GATEWAY_API_KEY env var is not set');
    return false;
  }
  return timingSafeCompare(gatewayKey, expectedKey);
}

function validateTimestamp(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return false;
  }
  // 5-minute window — matches Express server
  return Math.abs(Date.now() - requestTime) <= 300_000;
}

function validateSignature(
  request: Request,
  headers: GatewayHmacHeaders
): boolean {
  const secretKey = process.env.SERVICE_SECRET_KEY;
  if (!secretKey) {
    console.error('[Gateway] SERVICE_SECRET_KEY env var is not set');
    return false;
  }

  const url = new URL(request.url);
  const path = headers.signedPath || url.pathname;
  const signatureData = `${request.method}:${path}:${headers.timestamp}:${headers.requestId}`;

  const expectedSignature = createHmac('sha256', secretKey)
    .update(signatureData)
    .digest('hex');

  try {
    const a = Buffer.from(headers.signature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal: Build GatewayAuthContext from trusted headers
// ---------------------------------------------------------------------------

function buildAuthContext(headers: GatewayHmacHeaders): GatewayAuthContext {
  if (!headers.userId || !headers.userEmail) {
    throw new GatewayAuthError(
      'INVALID_HEADERS',
      'Gateway headers missing required X-User-Id or X-User-Email'
    );
  }

  if (!headers.tenantId) {
    throw new GatewayAuthError(
      'INVALID_HEADERS',
      'Gateway headers missing required X-Tenant-Id'
    );
  }

  // Derive roles from user-role and tenant-role headers
  const roles: string[] = [];
  if (headers.userRole) {
    roles.push(headers.userRole);
  }
  if (headers.tenantRole && headers.tenantRole !== headers.userRole) {
    roles.push(headers.tenantRole);
  }

  return {
    user_id: headers.userId,
    email: headers.userEmail,
    tenant_id: headers.tenantId,
    organization_id: undefined, // Not in HMAC headers; set downstream if needed
    brand: 'healthtalk',        // Default; overridden by caller if needed
    roles,
  };
}

// ---------------------------------------------------------------------------
// Internal: Legacy HTTP-verify fallback (backward compatibility)
// ---------------------------------------------------------------------------

async function legacyVerify(request: Request): Promise<GatewayAuthContext> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new GatewayAuthError('MISSING_AUTH', 'Authorization header required');
  }

  const gatewayUrl =
    process.env.GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai';

  const response = await fetch(`${gatewayUrl}/auth/verify`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Authentication failed' }));
    throw new GatewayAuthError(
      'AUTH_FAILED',
      error.message || 'Authentication failed'
    );
  }

  const data = await response.json();

  if (!data.auth?.tenant_id) {
    throw new GatewayAuthError(
      'INVALID_RESPONSE',
      'Gateway response missing tenant_id'
    );
  }

  return {
    user_id: data.auth.user_id,
    email: data.auth.email,
    tenant_id: data.auth.tenant_id,
    organization_id: data.auth.organization_id,
    brand: data.auth.brand,
    roles: data.auth.roles || [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify authentication via Gateway.
 *
 * Tries HMAC header validation first (server-to-server from Gateway).
 * Falls back to legacy HTTP-verify if no HMAC headers are present
 * (backward compat for browser clients sending Authorization header).
 *
 * MUST be called at the start of every API route.
 */
export async function verifyGatewayAuth(
  request: Request
): Promise<GatewayAuthContext> {
  // --- Path 1: HMAC validation (preferred, server-to-server) ---
  const hmacHeaders = extractHmacHeaders(request);
  if (hmacHeaders) {
    if (!validateGatewayKey(hmacHeaders.gatewayKey)) {
      throw new GatewayAuthError('INVALID_GATEWAY_KEY', 'Invalid gateway key');
    }

    if (!validateTimestamp(hmacHeaders.timestamp)) {
      throw new GatewayAuthError(
        'TIMESTAMP_EXPIRED',
        'Gateway request timestamp expired or invalid'
      );
    }

    if (!validateSignature(request, hmacHeaders)) {
      throw new GatewayAuthError(
        'INVALID_SIGNATURE',
        'Invalid gateway HMAC signature'
      );
    }

    return buildAuthContext(hmacHeaders);
  }

  // --- Path 2: Legacy HTTP-verify fallback (browser clients) ---
  return legacyVerify(request);
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export function hasRole(auth: GatewayAuthContext, role: string): boolean {
  return auth.roles.includes(role);
}

export function isAdmin(auth: GatewayAuthContext): boolean {
  return hasRole(auth, 'admin');
}

export function isPractitioner(auth: GatewayAuthContext): boolean {
  return hasRole(auth, 'practitioner');
}
