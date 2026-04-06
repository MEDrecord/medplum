// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import { badRequest, OperationOutcomeError, Operator } from '@medplum/core';
import type { Practitioner, Project, ProjectMembership, User } from '@medplum/fhirtypes';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';
import { body, validationResult } from 'express-validator';
import { getConfig } from '../config/loader';
import { sendOutcome } from '../fhir/outcomes';
import { getGlobalSystemRepo, getProjectSystemRepo } from '../fhir/repo';
import { getLogger } from '../logger';
import { generateSecret, generateAccessToken, generateIdToken, generateRefreshToken } from '../oauth/keys';
import { createProfile, createProjectMembership, sendLoginResult } from './utils';

/**
 * Gateway user info from HealthTalk Gateway session validation
 */
export interface GatewayUserInfo {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

/**
 * Gateway session validation response
 */
interface GatewaySessionResponse {
  valid: boolean;
  user?: GatewayUserInfo;
  expiresAt?: string;
  error?: string;
}

/**
 * Validates a Gateway session by calling the Gateway's session validation endpoint.
 * Supports both cookie-based (auth.sid) and header-based (X-Session-Id) sessions.
 */
export async function validateGatewaySession(req: Request): Promise<GatewayUserInfo | null> {
  const config = getConfig();
  const gatewayUrl = config.gatewayUrl;
  
  if (!gatewayUrl) {
    getLogger().debug('Gateway URL not configured');
    return null;
  }

  // Get session ID from cookie or header
  const sessionId = req.cookies?.['auth.sid'] || req.headers['x-session-id'];
  
  if (!sessionId) {
    return null;
  }

  try {
    const response = await fetch(`${gatewayUrl}/api/auth/session/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      getLogger().debug('Gateway session validation failed', { status: response.status });
      return null;
    }

    const data = (await response.json()) as GatewaySessionResponse;
    
    if (!data.valid || !data.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    getLogger().warn('Gateway session validation error', { error: err });
    return null;
  }
}

/**
 * Validator for Gateway login request
 */
export const gatewayLoginValidator = [
  body('sessionId').optional().isString(),
  body('webToken').optional().isString(),
  body('projectId').optional().isString(),
];

/**
 * Handler for Gateway authentication
 * POST /auth/gateway
 * 
 * Accepts either:
 * - sessionId in body (for API calls)
 * - auth.sid cookie (for browser requests)
 * - X-Session-Id header (for cross-domain requests)
 * - webToken for initial authentication
 */
export async function gatewayLoginHandler(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendOutcome(res, badRequest(errors.array()[0].msg));
    return;
  }

  const config = getConfig();
  const gatewayUrl = config.gatewayUrl;

  if (!gatewayUrl) {
    sendOutcome(res, badRequest('Gateway authentication not configured'));
    return;
  }

  const logger = getLogger();
  let userInfo: GatewayUserInfo | null = null;

  // Try to get user info from webToken first (initial auth)
  const webToken = req.body.webToken;
  if (webToken) {
    try {
      const exchangeResponse = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webToken,
          origin: req.headers.origin || req.headers.referer,
        }),
      });

      if (exchangeResponse.ok) {
        const data = await exchangeResponse.json() as { sessionId: string; user: GatewayUserInfo };
        userInfo = data.user;
        
        // Set the session cookie for future requests
        res.cookie('gateway.sessionId', data.sessionId, {
          httpOnly: true,
          secure: config.baseUrl.startsWith('https'),
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }
    } catch (err) {
      logger.warn('Gateway webToken exchange failed', { error: err });
    }
  }

  // If no webToken or exchange failed, try session validation
  if (!userInfo) {
    const sessionId = req.body.sessionId || req.cookies?.['auth.sid'] || req.headers['x-session-id'];
    
    if (sessionId) {
      try {
        const validateResponse = await fetch(`${gatewayUrl}/api/auth/session/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (validateResponse.ok) {
          const data = await validateResponse.json() as GatewaySessionResponse;
          if (data.valid && data.user) {
            userInfo = data.user;
          }
        }
      } catch (err) {
        logger.warn('Gateway session validation failed', { error: err });
      }
    }
  }

  if (!userInfo) {
    sendOutcome(res, badRequest('Invalid or expired Gateway session'));
    return;
  }

  // Now we have valid Gateway user info
  // Find or create Medplum user and login
  const systemRepo = getGlobalSystemRepo();
  const projectId = req.body.projectId || config.defaultProjectId;

  if (!projectId) {
    sendOutcome(res, badRequest('Project ID required'));
    return;
  }

  try {
    // Get the project
    const project = await systemRepo.readResource<Project>('Project', projectId);
    const projectSystemRepo = await getProjectSystemRepo(project);

    // Find or create User by Gateway external ID
    let user = await findUserByGatewayId(userInfo.id, projectId);
    
    if (!user) {
      // Create new user
      user = await systemRepo.createResource<User>({
        resourceType: 'User',
        email: userInfo.email,
        firstName: getFirstName(userInfo.name, userInfo.email),
        lastName: getLastName(userInfo.name),
        project: { reference: `Project/${projectId}` },
        externalId: userInfo.id, // Store Gateway user ID
      });
      logger.info('Created new user from Gateway', { userId: user.id, email: userInfo.email });
    }

    // Find or create Practitioner profile
    let practitioner = await findPractitionerByGatewayId(projectSystemRepo, userInfo.id);
    
    if (!practitioner) {
      // Create Practitioner profile
      practitioner = await projectSystemRepo.createResource<Practitioner>({
        resourceType: 'Practitioner',
        meta: { project: projectId },
        identifier: [{
          system: 'https://healthtalk.ai/gateway/user',
          value: userInfo.id,
        }],
        name: [{
          given: [getFirstName(userInfo.name, userInfo.email)],
          family: getLastName(userInfo.name),
        }],
        telecom: [{
          system: 'email',
          value: userInfo.email,
          use: 'work',
        }],
        active: true,
      });
      logger.info('Created Practitioner from Gateway', { practitionerId: practitioner.id, email: userInfo.email });
    }

    // Find or create ProjectMembership
    let membership = await findMembershipByUser(systemRepo, user.id as string, projectId);
    
    if (!membership) {
      membership = await createProjectMembership(
        systemRepo,
        user,
        project,
        practitioner
      );
      logger.info('Created ProjectMembership', { membershipId: membership.id });
    }

    // Create Login record
    const login = await systemRepo.createResource({
      resourceType: 'Login',
      user: { reference: `User/${user.id}` },
      membership: { reference: `ProjectMembership/${membership.id}` },
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

    // Generate tokens
    const idToken = await generateIdToken({
      login_id: login.id,
      fhirUser: `Practitioner/${practitioner.id}`,
      email: userInfo.email,
      sub: user.id as string,
      nonce: login.nonce as string,
      auth_time: Math.floor(Date.now() / 1000),
    });

    const accessToken = await generateAccessToken({
      login_id: login.id,
      sub: user.id as string,
      username: user.id as string,
      profile: `Practitioner/${practitioner.id}`,
      scope: login.scope as string,
    });

    const refreshToken = await generateRefreshToken({
      login_id: login.id,
      refresh_secret: login.refreshSecret as string,
    });

    res.json({
      id_token: idToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      project: {
        reference: `Project/${projectId}`,
      },
      profile: {
        reference: `Practitioner/${practitioner.id}`,
        display: userInfo.name || userInfo.email,
      },
    });

  } catch (err: any) {
    logger.error('Gateway login error', { error: err.message, stack: err.stack });
    sendOutcome(res, badRequest('Authentication failed: ' + err.message));
  }
}

/**
 * Find User by Gateway external ID
 */
async function findUserByGatewayId(gatewayUserId: string, projectId: string): Promise<User | undefined> {
  const systemRepo = getGlobalSystemRepo();
  
  const users = await systemRepo.searchResources<User>({
    resourceType: 'User',
    filters: [
      { code: 'external-id', operator: Operator.EQUALS, value: gatewayUserId },
      { code: 'project', operator: Operator.EQUALS, value: `Project/${projectId}` },
    ],
  });

  return users[0];
}

/**
 * Find Practitioner by Gateway user ID (stored as identifier)
 */
async function findPractitionerByGatewayId(repo: any, gatewayUserId: string): Promise<Practitioner | undefined> {
  const practitioners = await repo.searchResources<Practitioner>({
    resourceType: 'Practitioner',
    filters: [
      { code: 'identifier', operator: Operator.EQUALS, value: `https://healthtalk.ai/gateway/user|${gatewayUserId}` },
    ],
  });

  return practitioners[0];
}

/**
 * Find ProjectMembership by user and project
 */
async function findMembershipByUser(systemRepo: any, userId: string, projectId: string): Promise<ProjectMembership | undefined> {
  const memberships = await systemRepo.searchResources<ProjectMembership>({
    resourceType: 'ProjectMembership',
    filters: [
      { code: 'user', operator: Operator.EQUALS, value: `User/${userId}` },
      { code: 'project', operator: Operator.EQUALS, value: `Project/${projectId}` },
    ],
  });

  return memberships[0];
}

/**
 * Extract first name from full name or email
 */
function getFirstName(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts[0] || email.split('@')[0];
  }
  return email.split('@')[0];
}

/**
 * Extract last name from full name
 */
function getLastName(name: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return parts[0]; // Use first name as last name if only one part
  }
  return '';
}
