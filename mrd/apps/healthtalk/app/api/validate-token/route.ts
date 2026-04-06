import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/validate-token
 * 
 * Validates a magic link token and returns task/questionnaire info.
 * In production, this calls the Gateway API.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Call the Gateway API (server-only env var — never expose to client)
    const gatewayUrl = process.env.GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai';
    
    const response = await fetch(`${gatewayUrl}/api/gateway/proxy/tasks/validate-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        return NextResponse.json({ valid: false }, { status: 404 });
      }
      if (response.status === 410) {
        return NextResponse.json({ valid: false, expired: true });
      }
      throw new Error(`Gateway error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('[validate-token] Error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
