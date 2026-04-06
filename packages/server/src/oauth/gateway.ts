// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/loader';
import { getLogger } from '../logger';

/**
 * Gateway headers sent by the HealthTalk Gateway on every proxied request.
 */
export interface GatewayHeaders {
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

/**
 * Extracts Gateway headers from an incoming request.
 * Returns undefined if no Gateway headers are present.
 */
export function extractGatewayHeaders(req: Request): GatewayHeaders | undefined {
  const gatewayKey = req.headers['x-gateway-key'] as string | undefined;
  if (!gatewayKey) {
    return undefined;
  }

  return {
    gatewayKey,
    signature: (req.headers['x-gateway-signature'] as string) || '',
    timestamp: (req.headers['x-gateway-timestamp'] as string) || '',
    requestId: (req.headers['x-request-id'] as string) || '',
    userId: (req.headers['x-user-id'] as string) || '',
    userEmail: (req.headers['x-user-email'] as string) || '',
    userRole: req.headers['x-user-role'] as string | undefined,
    tenantId: req.headers['x-tenant-id'] as string | undefined,
    tenantRole: req.headers['x-tenant-role'] as string | undefined,
    authMethod: req.headers['x-auth-method'] as string | undefined,
    signedPath: req.headers['x-signed-path'] as string | undefined,
  };
}

/**
 * Validates the Gateway API key.
 */
export function validateGatewayKey(gatewayKey: string): boolean {
  const config = getConfig();
  const expectedKey = config.gatewayApiKey;
  if (!expectedKey) {
    return false;
  }

  try {
    const a = Buffer.from(gatewayKey);
    const b = Buffer.from(expectedKey);
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Validates the Gateway HMAC signature.
 * Signature data format: method:path:timestamp:requestId
 */
export function validateGatewaySignature(req: Request, headers: GatewayHeaders): boolean {
  const config = getConfig();
  const secretKey = config.gatewayServiceSecretKey;
  if (!secretKey) {
    return false;
  }

  const signedPath = headers.signedPath || req.path;
  const signatureData = `${req.method}:${signedPath}:${headers.timestamp}:${headers.requestId}`;

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

/**
 * Validates the Gateway timestamp to prevent replay attacks.
 * Allows a 5-minute window.
 */
export function validateGatewayTimestamp(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return false;
  }
  return Math.abs(Date.now() - requestTime) <= 300_000; // 5 minutes
}

/**
 * Full Gateway request validation.
 * Returns the validated headers if valid, undefined otherwise.
 */
export function validateGatewayRequest(req: Request): GatewayHeaders | undefined {
  const headers = extractGatewayHeaders(req);
  if (!headers) {
    return undefined;
  }

  // 1. Validate Gateway key
  if (!validateGatewayKey(headers.gatewayKey)) {
    getLogger().warn('Gateway: Invalid gateway key');
    return undefined;
  }

  // 2. Validate timestamp (replay protection)
  if (!validateGatewayTimestamp(headers.timestamp)) {
    getLogger().warn('Gateway: Timestamp expired or invalid');
    return undefined;
  }

  // 3. Validate HMAC signature
  if (!validateGatewaySignature(req, headers)) {
    getLogger().warn('Gateway: Invalid HMAC signature');
    return undefined;
  }

  return headers;
}

/**
 * Express middleware to sign outgoing responses for Gateway verification.
 * Attaches X-Response-Signature and X-Response-Timestamp headers.
 */
export function gatewayResponseSigner(req: Request, res: Response, next: NextFunction): void {
  const config = getConfig();
  const secretKey = config.gatewayServiceSecretKey;
  const gatewayRequestId = req.headers['x-request-id'] as string | undefined;

  if (!secretKey || !gatewayRequestId) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);

  res.json = function signedJson(body: any): Response {
    const timestamp = Date.now().toString();
    const bodyString = JSON.stringify(body);
    const bodyHash = createHash('sha256').update(bodyString).digest('hex');
    const signatureData = `${gatewayRequestId}:${res.statusCode}:${timestamp}:${bodyHash}`;
    const signature = createHmac('sha256', secretKey).update(signatureData).digest('hex');

    res.set('X-Response-Signature', signature);
    res.set('X-Response-Timestamp', timestamp);
    return originalJson(body);
  };

  next();
}

/**
 * Checks if the request is from the Gateway (has valid Gateway headers).
 */
export function isGatewayRequest(req: Request): boolean {
  return !!req.headers['x-gateway-key'];
}
