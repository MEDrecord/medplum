'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { GatewayClient, type BrandId, type GatewayClientOptions } from '../client/gateway-client';

interface GatewayContextValue {
  client: GatewayClient;
  brand: BrandId;
  gatewayUrl: string;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export interface GatewayProviderProps {
  children: ReactNode;
  /** Gateway URL (e.g., https://auth-test-b2c.healthtalk.ai) */
  gatewayUrl: string;
  /** Brand identifier */
  brand: BrandId;
  /** Default service slug for API calls */
  serviceSlug?: string;
}

/**
 * GatewayProvider - Provides GatewayClient to all child components
 * 
 * @example
 * ```tsx
 * <GatewayProvider
 *   gatewayUrl={process.env.NEXT_PUBLIC_GATEWAY_URL!}
 *   brand="healthtalk"
 * >
 *   {children}
 * </GatewayProvider>
 * ```
 */
export function GatewayProvider({
  children,
  gatewayUrl,
  brand,
  serviceSlug,
}: GatewayProviderProps) {
  const client = useMemo(
    () => new GatewayClient({ gatewayUrl, brand, serviceSlug }),
    [gatewayUrl, brand, serviceSlug]
  );

  const value = useMemo(
    () => ({ client, brand, gatewayUrl }),
    [client, brand, gatewayUrl]
  );

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
}

/**
 * useGateway - Access the GatewayClient and context
 * 
 * @throws Error if used outside GatewayProvider
 * 
 * @example
 * ```tsx
 * const { client, brand } = useGateway();
 * const templates = await client.templates.list();
 * ```
 */
export function useGateway(): GatewayContextValue {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error('useGateway must be used within a GatewayProvider');
  }
  return context;
}
