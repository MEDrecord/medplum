// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { ProfileResource, WithId } from '@medplum/core';
import { OperationOutcomeError, unauthorized } from '@medplum/core';
import type { Bot, ClientApplication, Login, Project, ProjectMembership, UserConfiguration } from '@medplum/fhirtypes';
import type { NextFunction, Request, Response } from 'express';
import type { IncomingMessage } from 'node:http';
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

/**
 * Returns true if the request originates from a *.healthtalk.ai domain.
 * Checked via Origin and Referer headers.
 */
export function isHealthTalkOrigin(req: Request): boolean {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  return /(?:^|\.)healthtalk\.ai(?:\/|$)/i.test(origin as string);
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  const ctx = getRequestContext();
  if (ctx instanceof AuthenticatedRequestContext) {
    next();
  } else if (isHealthTalkOrigin(req)) {
    // Requests from *.healthtalk.ai bypass mandatory auth; session-cookie auth
    // was already attempted in attachRequestContext via authenticateTokenImpl.
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

  // 2. Try Gateway header authentication (HMAC-validated requests from HealthTalk Gateway)
  const config = getConfig();
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

  // 3. Try Gateway session-cookie authentication for *.healthtalk.ai origins.
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
