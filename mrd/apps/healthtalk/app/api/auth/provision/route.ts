/**
 * User Provisioning API Route
 * 
 * POST /api/auth/provision
 * 
 * Automatically creates a Practitioner profile in Medplum when a user
 * authenticates via HealthTalk Gateway. This endpoint is called after
 * successful Gateway authentication.
 * 
 * Security: Validates the session via Gateway before provisioning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGatewayUrl } from '@mrd/sdk';
import { getMedplumClient } from '@/lib/medplum';
import { getOrCreatePractitioner, syncPractitionerWithGateway, type GatewayUser } from '@/lib/user-provisioning';

const GATEWAY_URL = getGatewayUrl();

/**
 * Get user from Gateway session
 */
async function getGatewayUser(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<GatewayUser | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (options.sessionId) {
      headers['X-Session-Id'] = options.sessionId;
    }

    if (options.cookies) {
      headers['Cookie'] = options.cookies;
    }

    const response = await fetch(`${GATEWAY_URL}/api/user/me`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role ?? 'user',
      tenantId: data.tenantId ?? 'default',
      tenantName: data.tenantName,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth from cookies or X-Session-Id header
    const cookies = request.headers.get('cookie') ?? undefined;
    const sessionId = request.headers.get('x-session-id') ?? undefined;

    if (!cookies && !sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication provided' },
        { status: 401 }
      );
    }

    // Get user from Gateway
    const user = await getGatewayUser({ cookies, sessionId });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get Medplum client for tenant
    const medplum = getMedplumClient(user.tenantId);

    // Get or create Practitioner
    const result = await getOrCreatePractitioner(medplum, user);

    if (!result.success) {
      return NextResponse.json(
        { error: 'ProvisioningFailed', message: result.error },
        { status: 500 }
      );
    }

    // If Practitioner already existed, sync latest data
    if (!result.created && result.practitioner) {
      await syncPractitionerWithGateway(medplum, result.practitioner, user);
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      practitioner: {
        id: result.practitioner?.id,
        name: result.practitioner?.name?.[0]?.text,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[HealthTalk] Provisioning error:', error);
    return NextResponse.json(
      { error: 'InternalError', message: 'Failed to provision user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/provision
 * 
 * Check provisioning status for current user
 */
export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') ?? undefined;
    const sessionId = request.headers.get('x-session-id') ?? undefined;

    if (!cookies && !sessionId) {
      return NextResponse.json(
        { provisioned: false, error: 'No authentication' },
        { status: 401 }
      );
    }

    const user = await getGatewayUser({ cookies, sessionId });

    if (!user) {
      return NextResponse.json(
        { provisioned: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const medplum = getMedplumClient(user.tenantId);
    
    // Search for existing Practitioner
    const practitioners = await medplum.searchResources('Practitioner', {
      identifier: `https://gateway.healthtalk.ai/users|${user.id}`,
    });

    return NextResponse.json({
      provisioned: practitioners.length > 0,
      practitioner: practitioners[0] ? {
        id: practitioners[0].id,
        name: practitioners[0].name?.[0]?.text,
      } : null,
    });
  } catch (error) {
    console.error('[HealthTalk] Provisioning check error:', error);
    return NextResponse.json(
      { provisioned: false, error: 'Check failed' },
      { status: 500 }
    );
  }
}
