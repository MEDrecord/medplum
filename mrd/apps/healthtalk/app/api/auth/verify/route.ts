import { NextRequest, NextResponse } from 'next/server';
import { 
  getGatewayUrl, 
  getTenantId,
} from '@mrd/sdk';

const GATEWAY_URL = getGatewayUrl();

/**
 * Validate session with gateway (server-side)
 */
async function validateServerSession(options: {
  cookies?: string;
  sessionId?: string;
}): Promise<{ valid: boolean; user?: unknown; expiresAt?: string; error?: string }> {
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

    const response = await fetch(`${GATEWAY_URL}/api/auth/session`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return { valid: false, error: 'No session found' };
    }

    const session = await response.json();

    // Check expiry
    if (new Date(session.expiresAt) <= new Date()) {
      return { valid: false, error: 'Session expired' };
    }

    return {
      valid: true,
      user: session.user,
      expiresAt: session.expiresAt,
    };
  } catch {
    return { valid: false, error: 'Session verification failed' };
  }
}

/**
 * GET /api/auth/verify
 * 
 * Verify current session and return user info.
 * Supports both cookie and webToken authentication modes.
 */
export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') ?? '';
    const sessionId = request.headers.get('x-session-id') ?? undefined;

    const validation = await validateServerSession({ cookies, sessionId });

    if (!validation.valid) {
      return NextResponse.json(
        { 
          isAuthenticated: false, 
          user: null,
          error: validation.error,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: validation.user,
      expiresAt: validation.expiresAt,
    });
  } catch (error) {
    console.error('[auth/verify] Error:', error);
    return NextResponse.json(
      { 
        isAuthenticated: false, 
        user: null,
        error: 'Session verification failed',
      },
      { status: 500 }
    );
  }
}
