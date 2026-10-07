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
import { validateGatewayRequest } from '../oauth/gateway';
import { generateSecret, generateAccessToken, generateIdToken, generateRefreshToken } from '../oauth/keys';
import { getUserByExternalId, getUserByEmailInProject } from '../oauth/utils';
import { createProfile, createProjectMembership } from './utils';

/**
 * Gateway user info from HealthTalk Gateway session validation.
 */
export interface GatewayUserInfo {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

/**
 * Every cookie that could be the gateway session, best candidate first.
 *
 * WHY A LIST AND NOT A CHOICE
 *
 * The gateway names its session cookie per tenant, and outside production it also inserts the
 * deployment environment:
 *
 *   auth.sid.<tenantId>                 production
 *   auth.sid.<vercelEnv>.<tenantId>     preview and development
 *
 * All of them are set with Domain=.healthtalk.ai, so one browser routinely holds several at once:
 * a production session from one app, a test session from another, a second tenant from a third.
 * That is the design working, not a fault.
 *
 * An earlier version of this picked one and refused when it could not tell them apart. Refusing
 * was the common case, not the rare one, and it returned the very 400 it was meant to fix.
 * Guessing is not the alternative -- the fix is to stop deciding here at all. Only the gateway
 * knows which session ids are real FOR IT, so every candidate is offered to it in turn and the
 * first it recognises wins. A production session id presented to the test gateway is simply not
 * found, which is exactly the answer we need and costs one request to learn.
 *
 * `tenantId` is still honoured, and matters when a browser holds two VALID sessions for the SAME
 * gateway under different tenants. Then "the first the gateway accepts" would be a coin toss
 * between two real users, so when it is configured only that tenant's cookies are offered.
 */
/**
 * How many session cookies to offer the gateway before giving up.
 *
 * Each one costs a request, and a browser with more than a handful of live gateway sessions is not
 * a real user. The cap keeps a crowded cookie jar from turning one login into a dozen round trips.
 */
const MAX_SESSION_COOKIE_ATTEMPTS = 4;

export function gatewaySessionCookieCandidates(
  cookies: Record<string, string | undefined> | undefined,
  tenantId?: string
): { name: string; value: string }[] {
  if (!cookies) {
    return [];
  }

  const all = Object.entries(cookies)
    .filter(([name, value]) => Boolean(value) && (name === 'auth.sid' || name.startsWith('auth.sid.')))
    .map(([name, value]) => ({ name, value: value as string }));

  // Longest name first: `auth.sid.preview.<tenant>` is more specific than `auth.sid.<tenant>`,
  // which is more specific than the legacy `auth.sid`. Ties sort by name so the order is stable.
  const bySpecificity = (a: { name: string }, b: { name: string }): number =>
    b.name.length - a.name.length || a.name.localeCompare(b.name);

  const legacy = all.filter((c) => c.name === 'auth.sid');
  const scoped = all.filter((c) => c.name !== 'auth.sid');

  const mine = tenantId ? scoped.filter((c) => c.name.endsWith(`.${tenantId}`)) : scoped;

  // The legacy unscoped cookie carries no tenant, so it cannot be another tenant's session and is
  // safe to keep as a last resort whichever way the filter went.
  return [...mine.sort(bySpecificity), ...legacy];
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

  // Option B: Validate the gateway session cookie (same-domain flow).
  // The gateway sets it on .healthtalk.ai, and the Medplum server is also on .healthtalk.ai, so
  // the browser sends it automatically when the client uses credentials:'include'. We forward it
  // to the gateway's GET /api/auth/session endpoint to get user info.
  if (!userInfo) {
    const candidates = gatewaySessionCookieCandidates(req.cookies, config.gatewayTenantId);
    for (const candidate of candidates.slice(0, MAX_SESSION_COOKIE_ATTEMPTS)) {
      userInfo = await validateSessionViaCookie(gatewayUrl, candidate.value, candidate.name);
      if (userInfo) {
        break;
      }
    }
    const headerSessionId = req.headers['x-session-id'];
    if (!userInfo && typeof headerSessionId === 'string' && headerSessionId) {
      userInfo = await validateSessionViaCookie(gatewayUrl, headerSessionId);
    }
  }

  // Option C: Request arrived through the gateway proxy with HMAC headers.
  // The gateway already validated auth.sid, resolved the user, and signed
  // the request. We just need to validate the HMAC and read the user info
  // from the trusted headers (X-User-Id, X-User-Email, etc.).
  if (!userInfo) {
    const gatewayHeaders = validateGatewayRequest(req);
    if (gatewayHeaders && gatewayHeaders.userId && gatewayHeaders.userEmail) {
      userInfo = {
        id: gatewayHeaders.userId,
        email: gatewayHeaders.userEmail,
        role: gatewayHeaders.userRole,
        tenantId: gatewayHeaders.tenantId,
      };
      logger.info('Gateway login: authenticated via HMAC headers', { userId: userInfo.id });
    }
  }

  if (!userInfo || !userInfo.id || !userInfo.email) {
    sendOutcome(res, badRequest('Invalid or expired Gateway session'));
    return;
  }

  // --- Step 2: Resolve project ---
  // Priority: explicit body param > config env var > first non-system project from DB
  let projectId = req.body.projectId || config.defaultProjectId;
  if (!projectId) {
    projectId = await resolveDefaultProjectId();
  }
  if (!projectId) {
    sendOutcome(res, badRequest('No project found. Create a project first.'));
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
export async function validateSessionViaCookie(
  gatewayUrl: string,
  sessionCookie: string,
  cookieName = 'auth.sid'
): Promise<GatewayUserInfo | undefined> {
  try {
    // Forward the cookie under the NAME IT ARRIVED WITH. The gateway selects a session by cookie
    // name, so renaming it on the way through is the same as not sending it.
    const cookieHeader = `${cookieName}=${sessionCookie}`;
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

/**
 * Cache for the default project ID so we don't query on every request.
 */
let cachedDefaultProjectId: string | undefined;

/**
 * Resolve the default project from the database.
 * Finds the first Project resource that is NOT the built-in system/super-admin project.
 * Caches the result for the lifetime of the process.
 */
export async function resolveDefaultProjectId(): Promise<string | undefined> {
  if (cachedDefaultProjectId) {
    return cachedDefaultProjectId;
  }

  try {
    const systemRepo = getGlobalSystemRepo();
    // Search for projects, sorted by creation date (oldest first = most likely the main project)
    const projects = await systemRepo.searchResources<Project>({
      resourceType: 'Project',
      count: 10,
      sortRules: [{ code: '_lastUpdated', descending: false }],
    });

    // Find the first non-system project (system projects typically have superAdmin=true
    // or are named "Super Admin" / "Medplum")
    const defaultProject = projects.find(
      (p) => !p.superAdmin && p.name !== 'Super Admin' && p.name !== 'Medplum'
    );

    if (defaultProject?.id) {
      cachedDefaultProjectId = defaultProject.id;
      getLogger().info('Gateway: resolved default project from DB', {
        projectId: defaultProject.id,
        projectName: defaultProject.name,
      });
      return defaultProject.id;
    }

    // If no non-system project, use the first one available
    if (projects.length > 0 && projects[0].id) {
      cachedDefaultProjectId = projects[0].id;
      getLogger().info('Gateway: using first available project', {
        projectId: projects[0].id,
        projectName: projects[0].name,
      });
      return projects[0].id;
    }

    return undefined;
  } catch (err) {
    getLogger().warn('Gateway: failed to resolve default project', { error: String(err) });
    return undefined;
  }
}
