import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, validateServerSession } from '@mrd/sdk/auth/server';

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
