'use client';

import type { ReactNode } from 'react';
import { GatewayProvider, AuthProvider } from '@mrd/sdk';
import { BrandProvider } from '@mrd/ui';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'https://auth-test-b2c.healthtalk.ai';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'default';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider brand="healthtalk">
      <GatewayProvider gatewayUrl={GATEWAY_URL} brand="healthtalk">
        <AuthProvider gatewayUrl={GATEWAY_URL} tenantId={TENANT_ID}>
          {children}
        </AuthProvider>
      </GatewayProvider>
    </BrandProvider>
  );
}
