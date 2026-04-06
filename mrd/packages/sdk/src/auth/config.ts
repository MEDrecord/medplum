/**
 * Gateway Authentication Configuration
 * 
 * Configuration helpers for HealthTalk Gateway authentication.
 */

import type { AuthMode } from './types';

// Environment variable names
const ENV_GATEWAY_URL = 'NEXT_PUBLIC_GATEWAY_URL';
const ENV_TENANT_ID = 'NEXT_PUBLIC_TENANT_ID';
const ENV_APP_URL = 'NEXT_PUBLIC_APP_URL';
const ENV_AUTH_MODE = 'NEXT_PUBLIC_AUTH_MODE';

// Default values
const DEFAULT_GATEWAY_URL = 'https://auth-test-b2c.healthtalk.ai';
const DEFAULT_TENANT_ID = 'default';

/**
 * Get gateway URL from environment
 */
export function getGatewayUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env[ENV_GATEWAY_URL] ?? DEFAULT_GATEWAY_URL;
  }
  return process.env[ENV_GATEWAY_URL] ?? DEFAULT_GATEWAY_URL;
}

/**
 * Get tenant ID from environment
 */
export function getTenantId(): string {
  return process.env[ENV_TENANT_ID] ?? DEFAULT_TENANT_ID;
}

/**
 * Get app URL from environment or current origin
 */
export function getAppUrl(): string {
  // Server-side: use env variable
  if (typeof window === 'undefined') {
    return process.env[ENV_APP_URL] ?? '';
  }
  // Client-side: prefer env variable, fall back to window.location.origin
  return process.env[ENV_APP_URL] ?? window.location.origin;
}

/**
 * Get authentication mode from environment or auto-detect
 */
export function getAuthMode(): AuthMode {
  const envMode = process.env[ENV_AUTH_MODE] as AuthMode | undefined;
  if (envMode && ['cookie', 'webtoken', 'auto'].includes(envMode)) {
    return envMode;
  }
  return 'auto';
}

/**
 * Detect if we're in a cross-domain context (webToken mode needed)
 * 
 * Cross-domain is detected when:
 * 1. App URL and Gateway URL have different parent domains
 * 2. Running in v0 preview (*.v0.dev)
 * 3. Running in Vercel preview (*.vercel.app)
 */
export function isCrossDomain(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check env vars
    const appUrl = process.env[ENV_APP_URL] ?? '';
    const gatewayUrl = getGatewayUrl();
    return !isSameDomain(appUrl, gatewayUrl);
  }

  const appOrigin = window.location.origin;
  const gatewayUrl = getGatewayUrl();

  // Check for known cross-domain patterns
  if (appOrigin.includes('.v0.dev') || appOrigin.includes('.vercel.app')) {
    return true;
  }

  return !isSameDomain(appOrigin, gatewayUrl);
}

/**
 * Check if two URLs share the same parent domain
 */
function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = getParentDomain(url1);
    const domain2 = getParentDomain(url2);
    return domain1 === domain2;
  } catch {
    return false;
  }
}

/**
 * Extract parent domain from URL
 * e.g., "https://app.healthtalk.ai" -> "healthtalk.ai"
 */
function getParentDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split('.');
    // Handle localhost
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return 'localhost';
    }
    // Return last two parts (parent domain)
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

/**
 * Resolve effective auth mode
 */
export function resolveAuthMode(mode: AuthMode = 'auto'): 'cookie' | 'webtoken' {
  if (mode === 'auto') {
    return isCrossDomain() ? 'webtoken' : 'cookie';
  }
  return mode;
}

/**
 * Build sign-in URL with proper parameters
 */
export function buildSignInUrl(options: {
  gatewayUrl?: string;
  tenantId?: string;
  callbackUrl: string;
}): string {
  const gatewayUrl = options.gatewayUrl ?? getGatewayUrl();
  const tenantId = options.tenantId ?? getTenantId();
  const callbackUrl = encodeURIComponent(options.callbackUrl);

  return `${gatewayUrl}/api/auth/signin?tenantId=${tenantId}&callbackUrl=${callbackUrl}`;
}

/**
 * Build sign-out URL
 */
export function buildSignOutUrl(gatewayUrl?: string): string {
  return `${gatewayUrl ?? getGatewayUrl()}/api/auth/signout`;
}

/**
 * Validate callback URL to prevent open redirects
 * Only allows internal paths (starting with /)
 */
export function validateCallbackUrl(url: string, appUrl?: string): string {
  // If it's a relative path, it's safe
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  // If appUrl is provided, validate the URL is on the same origin
  if (appUrl) {
    try {
      const callbackOrigin = new URL(url).origin;
      const appOrigin = new URL(appUrl).origin;
      if (callbackOrigin === appOrigin) {
        return url;
      }
    } catch {
      // Invalid URL, return safe default
    }
  }

  // Default to home page for invalid URLs
  return '/';
}
