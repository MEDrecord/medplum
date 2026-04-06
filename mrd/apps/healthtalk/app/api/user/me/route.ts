import { NextRequest, NextResponse } from 'next/server';
import { getGatewayUrl } from '@mrd/sdk';

const GATEWAY_URL = getGatewayUrl();

/**
 * Get user from gateway (server-side)
 */
async function getServerUser(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<unknown | null> {
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

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/user/me
 * 
 * Get current authenticated user.
 * Proxies request to gateway with proper auth headers.
 */
export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') ?? '';
    const sessionId = request.headers.get('x-session-id') ?? undefined;

    const user = await getServerUser({ cookies, sessionId });

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[user/me] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
