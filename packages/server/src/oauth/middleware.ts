// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { ProfileResource, WithId } from '@medplum/core';
import { OperationOutcomeError, unauthorized } from '@medplum/core';
import type { Bot, ClientApplication, Login, Project, ProjectMembership, UserConfiguration } from '@medplum/fhirtypes';
import type { NextFunction, Request, Response } from 'express';
import type { IncomingMessage } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getConfig } from '../config/loader';
import { AuthenticatedRequestContext, getRequestContext } from '../context';
import type { Repository } from '../fhir/repo';
import { getLogger } from '../logger';
import { validateGatewayRequest } from './gateway';
import { getLoginForAccessToken, getLoginForBasicAuth, getLoginForGatewayAuth } from './utils';
import { validateSessionViaCookie } from '../auth/gateway';
import type { GatewayHeaders } from './gateway';

export type AuthState = {
  login: Login;
  project: WithId<Project>;
  membership: WithId<ProjectMembership>;
  profile?: WithId<ProfileResource | Bot | ClientApplication>;
  userConfig: UserConfiguration;
  accessToken?: string;

  onBehalfOf?: WithId<ProfileResource>;
  onBehalfOfMembership?: WithId<ProjectMembership>;
};

export type AuthenticationResult = {
  authState: AuthState;
  repo: Repository;
};

export const PROMPT_BASIC_AUTH_PARAM = '_medplum-prompt-basic-auth';

const DEFAULT_M2M_EMAIL = 'gateway-m2m@healthtalk.ai';

function isHealthTalkHostname(hostname: string): boolean {
  return hostname === 'healthtalk.ai' || hostname.endsWith('.healthtalk.ai');
}

function getRequestHostname(req: Request): string | undefined {
  const originLikeHeader = req.headers['origin'] || req.headers['referer'];
  if (typeof originLikeHeader !== 'string' || !originLikeHeader) {
    return undefined;
  }

  try {
    return new URL(originLikeHeader).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function validateConfiguredApiKey(expectedKey: string | undefined, actualKey: string | undefined): boolean {
  if (!expectedKey || !actualKey) {
    return false;
  }

  try {
    const a = Buffer.from(actualKey);
    const b = Buffer.from(expectedKey);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function buildMachineUserId(apiKey: string, configuredUserId?: string): string {
  if (configuredUserId) {
    return configuredUserId;
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex').slice(0, 24);
  return `gateway-m2m-${keyHash}`;
}

/**
 * Returns true if the request originates from a *.healthtalk.ai domain.
 * Checked via Origin and Referer headers.
 */
export function isHealthTalkOrigin(req: Request): boolean {
  const hostname = getRequestHostname(req);
  return !!hostname && isHealthTalkHostname(hostname);
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  const ctx = getRequestContext();
  if (ctx instanceof AuthenticatedRequestContext) {
    next();
  } else {
    if (res.req.query[PROMPT_BASIC_AUTH_PARAM]) {
      res.set('WWW-Authenticate', `Basic realm="${getConfig().baseUrl}"`);
    }
    next(new OperationOutcomeError(unauthorized));
  }
}

export async function authenticateTokenImpl(req: Request): Promise<AuthenticationResult | undefined> {
  // 1. Try standard Bearer/Basic auth first (backward compatible)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [tokenType, token] = authHeader.split(' ');
    if (tokenType && token) {
      if (tokenType === 'Bearer') {
        return getLoginForAccessToken(req, token);
      }
      if (tokenType === 'Basic') {
        return getLoginForBasicAuth(req, token);
      }
    }
  }

  const config = getConfig();

  // 2. Try machine-to-machine API key authentication.
  const clientApiKey = req.header('x-api-key');
  if (validateConfiguredApiKey(config.gatewayClientApiKey, clientApiKey)) {
    try {
      const machineHeaders: GatewayHeaders = {
        gatewayKey: '',
        signature: '',
        timestamp: '',
        requestId: '',
        userId: buildMachineUserId(clientApiKey as string, config.gatewayClientUserId),
        userEmail: config.gatewayClientEmail ?? DEFAULT_M2M_EMAIL,
        userRole: 'service',
        authMethod: 'm2m',
      };
      return await getLoginForGatewayAuth(req, machineHeaders);
    } catch (err) {
      getLogger().warn('Gateway M2M auth failed', { err: String(err) });
      return undefined;
    }
  }

  // 3. Try Gateway header authentication (HMAC-validated requests from HealthTalk Gateway)
  if (config.gatewayEnabled) {
    const gatewayHeaders = validateGatewayRequest(req);
    if (gatewayHeaders) {
      try {
        return await getLoginForGatewayAuth(req, gatewayHeaders);
      } catch (err) {
        getLogger().warn('Gateway auth failed', { err: String(err), userId: gatewayHeaders.userId });
        return undefined;
      }
    }
  }

  // 4. Try Gateway session-cookie authentication for *.healthtalk.ai origins.
  // If the request comes from a healthtalk.ai domain, validate the auth.sid
  // cookie against the gateway session endpoint. No HMAC signing required.
  if (isHealthTalkOrigin(req) && config.gatewayEnabled && config.gatewayUrl) {
    const sessionCookie = (req.cookies as Record<string, string> | undefined)?.['auth.sid'] ||
      (req.headers['x-session-id'] as string | undefined);
    if (sessionCookie) {
      try {
        const userInfo = await validateSessionViaCookie(config.gatewayUrl, sessionCookie);
        if (userInfo) {
          const syntheticHeaders: GatewayHeaders = {
            gatewayKey: '',
            signature: '',
            timestamp: '',
            requestId: '',
            userId: userInfo.id,
            userEmail: userInfo.email,
            userRole: userInfo.role,
            tenantId: userInfo.tenantId,
          };
          return await getLoginForGatewayAuth(req, syntheticHeaders);
        }
      } catch (err) {
        getLogger().warn('HealthTalk session-cookie auth failed', { err: String(err) });
      }
    }
  }

  return undefined;
}

export function isExtendedMode(req: Request | IncomingMessage): boolean {
  return req.headers['x-medplum'] === 'extended';
}
