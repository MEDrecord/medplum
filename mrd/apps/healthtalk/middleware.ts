import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for HealthTalk App
 * 
 * Handles authentication checks for protected routes.
 * Supports both cookie mode (auth.sid) and webToken mode (X-Session-Id header).
 * 
 * IMPORTANT: Middleware runs on the Edge and cannot make external API calls 
 * or access localStorage. It can only check for the presence of auth tokens,
 * not validate them. Actual validation happens in API routes and Server Components.
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
  '/', // Home page is public
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

/**
 * Detect if this is a cross-domain request (webToken mode)
 * In cross-domain mode, we can't rely on cookies - we need X-Session-Id header
 */
function isCrossDomainRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin') ?? '';
  const host = request.headers.get('host') ?? '';
  
  // Check for v0 preview or Vercel preview
  if (host.includes('.v0.dev') || host.includes('.vercel.app')) {
    return true;
  }
  
  // Check if origin differs from host
  if (origin) {
    try {
      const originHost = new URL(origin).hostname;
      // Different parent domains = cross-domain
      const originParts = originHost.split('.');
      const hostParts = host.split(':')[0].split('.');
      const originParent = originParts.slice(-2).join('.');
      const hostParent = hostParts.slice(-2).join('.');
      return originParent !== hostParent;
    } catch {
      return false;
    }
  }
  
  return false;
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

  // Check for authentication tokens
  // Cookie mode: check for auth.sid cookie (same-domain)
  const authCookie = request.cookies.get('auth.sid');
  
  // WebToken mode: check for X-Session-Id header (cross-domain)
  // Note: In cross-domain mode, client must send this header with every request
  const sessionIdHeader = request.headers.get('x-session-id');

  const isCrossDomain = isCrossDomainRequest(request);
  
  // In cross-domain mode, we REQUIRE X-Session-Id header
  // In same-domain mode, we accept either cookie or header
  let hasAuth = false;
  if (isCrossDomain) {
    hasAuth = !!sessionIdHeader;
  } else {
    hasAuth = !!authCookie?.value || !!sessionIdHeader;
  }

  if (!hasAuth) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Authentication required',
          authMode: isCrossDomain ? 'webtoken' : 'cookie',
        },
        { status: 401 }
      );
    }

    // Redirect to sign-in with callback URL
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);

    return NextResponse.redirect(signInUrl);
  }

  // User has auth token, continue
  // Note: Token validity is verified by the gateway on actual API calls
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
