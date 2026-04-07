// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import { badRequest, createReference, Operator } from '@medplum/core';
import type { Practitioner, Project, ProjectMembership, User } from '@medplum/fhirtypes';
import type { WithId, ProfileResource } from '@medplum/core';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';
import { body, validationResult } from 'express-validator';
import { getConfig } from '../config/loader';
import { sendOutcome } from '../fhir/outcomes';
import { getGlobalSystemRepo, getProjectSystemRepo } from '../fhir/repo';
import type { SystemRepository } from '../fhir/repo';
import { getLogger } from '../logger';
import { generateSecret, generateAccessToken, generateIdToken, generateRefreshToken } from '../oauth/keys';
import { getUserByExternalId, getUserByEmailInProject } from '../oauth/utils';
import { createProfile, createProjectMembership } from './utils';

/**
 * Gateway user info from HealthTalk Gateway session validation.
 */
interface GatewayUserInfo {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

/**
 * Validators for POST /auth/gateway
 */
export const gatewayLoginValidator = [
  body('webToken').optional().isString(),
  body('projectId').optional().isString(),
];

/**
 * POST /auth/gateway
 *
 * Authenticates a user via the HealthTalk Gateway.
 * Accepts a webToken (initial auth) or sessionId (re-auth).
 * Provisions User + Practitioner + ProjectMembership if needed.
 * Returns Medplum OAuth tokens.
 *
 * Backward compatible: this endpoint is additive and does not affect
 * any existing auth flows (Bearer, Basic, external, Google, password).
 */
export async function gatewayLoginHandler(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendOutcome(res, badRequest(errors.array()[0].msg));
    return;
  }

  const config = getConfig();
  const gatewayUrl = config.gatewayUrl;

  if (!gatewayUrl || !config.gatewayEnabled) {
    sendOutcome(res, badRequest('Gateway authentication is not enabled'));
    return;
  }

  const logger = getLogger();
  let userInfo: GatewayUserInfo | undefined;

  // --- Step 1: Resolve user identity from Gateway ---

  // Option A: Exchange webToken for session (initial cross-domain auth)
  const webToken = req.body.webToken;
  if (webToken) {
    userInfo = await exchangeWebToken(gatewayUrl, webToken, req.headers.origin || req.headers.referer);
  }

  // Option B: Validate session via auth.sid cookie (same-domain flow).
  // The gateway sets auth.sid on .healthtalk.ai. Since the Medplum server
  // is also on .healthtalk.ai, the browser sends this cookie automatically
  // when the client uses credentials:'include'. We forward it to the
  // gateway's GET /api/auth/session endpoint to get user info.
  if (!userInfo) {
    const sessionCookie = req.cookies?.['auth.sid'] || req.headers['x-session-id'];
    if (sessionCookie) {
      userInfo = await validateSessionViaCookie(gatewayUrl, sessionCookie);
    }
  }

  if (!userInfo || !userInfo.id || !userInfo.email) {
    sendOutcome(res, badRequest('Invalid or expired Gateway session'));
    return;
  }

  // --- Step 2: Resolve project ---
  const projectId = req.body.projectId || config.defaultProjectId;
  if (!projectId) {
    sendOutcome(res, badRequest('Project ID is required'));
    return;
  }

  try {
    const systemRepo = getGlobalSystemRepo();
    const project = await systemRepo.readResource<Project>('Project', projectId);
    const projectSystemRepo = await getProjectSystemRepo(project);

    // --- Step 3: Find or create User ---
    const firstName = getFirstName(userInfo.name, userInfo.email);
    const lastName = getLastName(userInfo.name);

    let user = await getUserByExternalId(systemRepo, userInfo.id, projectId);
    if (!user) {
      user = await getUserByEmailInProject(userInfo.email.toLowerCase(), projectId);
    }
    if (!user) {
      user = await systemRepo.createResource<User>({
        resourceType: 'User',
        firstName,
        lastName,
        email: userInfo.email.toLowerCase(),
        externalId: userInfo.id,
        project: { reference: `Project/${projectId}` },
      });
      logger.info('Gateway: created User', { userId: user.id, email: userInfo.email });
    }

    // --- Step 4: Find or create Practitioner profile ---
    let practitioner: WithId<Practitioner> | undefined = await findPractitionerByGatewayId(projectSystemRepo, userInfo.id);
    if (!practitioner) {
      const profile = await createProfile(projectSystemRepo, project, 'Practitioner', firstName, lastName, userInfo.email);
      practitioner = profile as WithId<Practitioner>;
      // Add Gateway identifier to the Practitioner
      await projectSystemRepo.updateResource<Practitioner>({
        ...practitioner,
        identifier: [
          ...(practitioner.identifier || []),
          { system: 'https://healthtalk.ai/gateway/user-id', value: userInfo.id },
        ],
      });
      logger.info('Gateway: created Practitioner', { practitionerId: practitioner.id });
    }

    if (!practitioner) {
      sendOutcome(res, badRequest('Failed to provision Practitioner'));
      return;
    }

    // --- Step 5: Find or create ProjectMembership ---
    let membership = await systemRepo.searchOne<ProjectMembership>({
      resourceType: 'ProjectMembership',
      filters: [
        { code: 'user', operator: Operator.EQUALS, value: `User/${user.id}` },
        { code: 'project', operator: Operator.EQUALS, value: `Project/${projectId}` },
      ],
    });
    if (!membership) {
      membership = await createProjectMembership(systemRepo, user, project, practitioner as WithId<ProfileResource>, {
        externalId: userInfo.id,
      });
      logger.info('Gateway: created ProjectMembership', { membershipId: membership.id });
    }

    // --- Step 6: Create Login + generate tokens ---
    const login = await systemRepo.createResource({
      resourceType: 'Login',
      user: createReference(user),
      membership: createReference(membership),
      project: { reference: `Project/${projectId}` },
      authMethod: 'external',
      authTime: new Date().toISOString(),
      code: generateSecret(16),
      cookie: generateSecret(16),
      refreshSecret: generateSecret(32),
      scope: 'openid profile email offline_access',
      nonce: randomUUID(),
      remoteAddress: req.ip,
      userAgent: req.get('User-Agent'),
      granted: true,
    });

    const profileRef = `Practitioner/${practitioner.id}`;

    const idToken = await generateIdToken({
      login_id: login.id,
      fhirUser: profileRef,
      email: userInfo.email,
      sub: user.id as string,
      nonce: login.nonce as string,
      auth_time: Math.floor(Date.now() / 1000),
    });

    const accessToken = await generateAccessToken({
      login_id: login.id,
      sub: user.id as string,
      username: user.id as string,
      profile: profileRef,
      scope: login.scope as string,
    });

    const refreshToken = await generateRefreshToken({
      login_id: login.id,
      refresh_secret: login.refreshSecret as string,
    });

    res.json({
      login: login.id,
      code: login.code,
      id_token: idToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      project: { reference: `Project/${projectId}` },
      profile: {
        reference: profileRef,
        display: userInfo.name || userInfo.email,
      },
    });
  } catch (err: any) {
    logger.error('Gateway login error', { error: err.message, stack: err.stack });
    sendOutcome(res, badRequest('Authentication failed'));
  }
}

// --- Internal helpers ---

async function exchangeWebToken(
  gatewayUrl: string,
  webToken: string,
  origin: string | string[] | undefined
): Promise<GatewayUserInfo | undefined> {
  try {
    const response = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webToken, origin: Array.isArray(origin) ? origin[0] : origin }),
    });
    if (!response.ok) {
      return undefined;
    }
    const data = (await response.json()) as { user?: GatewayUserInfo };
    return data.user;
  } catch (err) {
    getLogger().warn('Gateway: webToken exchange failed', { error: String(err) });
    return undefined;
  }
}

/**
 * Validate a gateway session by forwarding the auth.sid cookie to the
 * gateway's GET /api/auth/session endpoint. This is the same endpoint
 * the browser calls -- we just forward the cookie server-to-server.
 *
 * Also tries GET /api/user/me for richer user data (name, role, tenantId).
 */
async function validateSessionViaCookie(gatewayUrl: string, sessionCookie: string): Promise<GatewayUserInfo | undefined> {
  try {
    // Forward the cookie to GET /api/auth/session
    const cookieHeader = `auth.sid=${sessionCookie}`;
    const sessionRes = await fetch(`${gatewayUrl}/api/auth/session`, {
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });
    if (!sessionRes.ok) {
      getLogger().warn('Gateway: session cookie invalid', { status: sessionRes.status });
      return undefined;
    }
    const sessionData = (await sessionRes.json()) as {
      user?: { id?: string; email?: string; name?: string };
      sessionId?: string;
    };
    if (!sessionData.user?.id || !sessionData.user?.email) {
      return undefined;
    }

    // Try to get richer user info from /api/user/me
    let role: string | undefined;
    let tenantId: string | undefined;
    try {
      const meRes = await fetch(`${gatewayUrl}/api/user/me`, {
        method: 'GET',
        headers: { Cookie: cookieHeader },
      });
      if (meRes.ok) {
        const meData = (await meRes.json()) as {
          role?: string;
          tenantId?: string;
          name?: string;
        };
        role = meData.role;
        tenantId = meData.tenantId;
      }
    } catch {
      // /api/user/me is optional enrichment, session is still valid
    }

    return {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      role,
      tenantId,
    };
  } catch (err) {
    getLogger().warn('Gateway: session validation via cookie failed', { error: String(err) });
    return undefined;
  }
}

async function findPractitionerByGatewayId(
  repo: SystemRepository,
  gatewayUserId: string
): Promise<WithId<Practitioner> | undefined> {
  return repo.searchOne<Practitioner>({
    resourceType: 'Practitioner',
    filters: [
      {
        code: 'identifier',
        operator: Operator.EQUALS,
        value: `https://healthtalk.ai/gateway/user-id|${gatewayUserId}`,
      },
    ],
  });
}

function getFirstName(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts[0] || email.split('@')[0];
  }
  return email.split('@')[0];
}

function getLastName(name: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  }
  return 'User';
}
