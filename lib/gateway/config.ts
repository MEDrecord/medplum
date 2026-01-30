/**
 * MEDrecord Gateway Configuration - Environment-Based Settings
 * 
 * All configuration values are loaded from environment variables.
 * NO HARDCODED VALUES are allowed in this file.
 * 
 * @see /docs/ARCHITECTURE.md for configuration requirements
 */

import 'server-only';

// ============================================================================
// Environment Variable Validation
// ============================================================================

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file or Vercel project settings.`
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

// ============================================================================
// Gateway Configuration Object
// ============================================================================

/**
 * Gateway configuration with lazy evaluation.
 * Environment variables are read at access time, not at import time.
 * This allows for better error messages when variables are missing.
 */
export const gatewayConfig = {
  /**
   * Base URL of the MEDrecord Gateway
   * @example https://auth-test-b2c.healthtalk.ai
   */
  get baseUrl(): string {
    return requireEnv('MEDRECORD_GATEWAY_URL');
  },

  /**
   * Tenant ID for multi-tenant isolation
   * All requests include X-Tenant-ID header with this value
   */
  get tenantId(): string {
    return requireEnv('MEDRECORD_TENANT_ID');
  },

  /**
   * OAuth Client ID for authentication
   */
  get clientId(): string {
    return requireEnv('MEDRECORD_CLIENT_ID');
  },

  /**
   * Public application URL (for OAuth callbacks)
   */
  get appUrl(): string {
    return requireEnv('NEXT_PUBLIC_APP_URL');
  },

  /**
   * API Key for server-to-server communication (optional)
   * Only used in development/testing scenarios
   */
  get apiKey(): string | undefined {
    return process.env.MEDRECORD_API_KEY;
  },

  /**
   * Whether we're in development mode
   */
  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  /**
   * Whether we're in production mode
   */
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },

  /**
   * Request timeout in milliseconds
   */
  get requestTimeout(): number {
    return parseInt(optionalEnv('GATEWAY_TIMEOUT_MS', '30000'), 10);
  },

  /**
   * Maximum retry attempts for failed requests
   */
  get maxRetries(): number {
    return parseInt(optionalEnv('GATEWAY_MAX_RETRIES', '3'), 10);
  },
} as const;

// ============================================================================
// Configuration Validation (called at startup)
// ============================================================================

/**
 * Validates that all required environment variables are set.
 * Call this in app initialization to fail fast if config is missing.
 */
export function validateGatewayConfig(): void {
  const requiredVars = [
    'MEDRECORD_GATEWAY_URL',
    'MEDRECORD_TENANT_ID', 
    'MEDRECORD_CLIENT_ID',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(key => `  - ${key}`).join('\n') +
      `\n\nPlease add these to your .env.local file.`
    );
  }
}

// ============================================================================
// OAuth URLs (derived from config)
// ============================================================================

export const oauthUrls = {
  get authorize(): string {
    return `${gatewayConfig.baseUrl}/api/auth/signin`;
  },
  
  get callback(): string {
    return `${gatewayConfig.appUrl}/api/auth/callback`;
  },
  
  get logout(): string {
    return `${gatewayConfig.baseUrl}/api/auth/signout`;
  },
} as const;
