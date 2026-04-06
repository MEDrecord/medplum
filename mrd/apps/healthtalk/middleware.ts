import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for HealthTalk App
 * 
 * Handles authentication checks for protected routes.
 * Supports both cookie mode (auth.sid) and webToken mode (X-Session-Id header).
 */

// Routes that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/admin',
  '/settings',
  '/templates',
  '/patients',
  '/appointments',
];

// Routes that should skip auth check entirely
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/callback',
  '/auth/signout',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/public',
];

// Check if path matches any pattern
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  if (!matchesPath(pathname, PROTECTED_PATHS)) {
    return NextResponse.next();
  }

  // Check for authentication
  // Cookie mode: check for auth.sid cookie
  const authCookie = request.cookies.get('auth.sid');
  
  // WebToken mode: check for X-Session-Id header or sessionId in localStorage
  // Note: We can't read localStorage in middleware, so for webToken mode
  // we rely on the client to send X-Session-Id header
  const sessionIdHeader = request.headers.get('x-session-id');

  const isAuthenticated = !!authCookie?.value || !!sessionIdHeader;

  if (!isAuthenticated) {
    // Redirect to sign-in with callback URL
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, continue
  return NextResponse.next();
}

export const config = {
  // Match all paths except static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
