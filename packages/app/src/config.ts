// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
export interface MedplumAppConfig {
  baseUrl?: string;
  clientId?: string;
  googleClientId?: string;
  recaptchaSiteKey?: string;
  registerEnabled?: boolean | string;
  awsTextractEnabled?: boolean | string;
  // HealthTalk Gateway configuration
  gatewayUrl?: string;
  gatewayTenantId?: string;
  gatewayEnabled?: boolean | string;
}

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL,
  clientId: import.meta.env?.MEDPLUM_CLIENT_ID,
  googleClientId: import.meta.env?.GOOGLE_CLIENT_ID,
  recaptchaSiteKey: import.meta.env?.RECAPTCHA_SITE_KEY,
  registerEnabled: import.meta.env?.MEDPLUM_REGISTER_ENABLED,
  awsTextractEnabled: import.meta.env?.MEDPLUM_AWS_TEXTRACT_ENABLED,
  // HealthTalk Gateway - uses MEDPLUM_ prefix to match Vite envPrefix
  gatewayUrl: import.meta.env?.MEDPLUM_GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai',
  gatewayTenantId: import.meta.env?.MEDPLUM_GATEWAY_TENANT_ID || 'default',
  gatewayEnabled: import.meta.env?.MEDPLUM_GATEWAY_ENABLED ?? true,
};

export function getConfig(): MedplumAppConfig {
  return config;
}

export function isRegisterEnabled(): boolean {
  return isFeatureEnabled('registerEnabled');
}

export function isAwsTextractEnabled(): boolean {
  return isFeatureEnabled('awsTextractEnabled');
}

export function isGatewayEnabled(): boolean {
  return isFeatureEnabled('gatewayEnabled');
}

export function getGatewaySignInUrl(callbackUrl: string): string {
  const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
  const tenantId = config.gatewayTenantId || 'default';
  return `${gatewayUrl}/api/auth/signin?tenantId=${tenantId}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

function isFeatureEnabled(feature: keyof MedplumAppConfig): boolean {
  // This try/catch exists to prevent Rollup optimization from removing this function
  try {
    return config[feature] !== false && config[feature] !== 'false';
  } catch {
    return true;
  }
}
