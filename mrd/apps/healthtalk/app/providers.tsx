'use client';

import type { ReactNode } from 'react';
import { GatewayProvider } from '@mrd/sdk';
import { BrandProvider } from '@mrd/ui';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'https://auth-test-b2c.healthtalk.ai';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider brand="healthtalk">
      <GatewayProvider gatewayUrl={GATEWAY_URL} brand="healthtalk">
        {children}
      </GatewayProvider>
    </BrandProvider>
  );
}
