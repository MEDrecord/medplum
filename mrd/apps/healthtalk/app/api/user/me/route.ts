import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@mrd/sdk/auth/server';

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
