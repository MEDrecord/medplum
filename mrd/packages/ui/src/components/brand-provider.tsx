'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getBrandConfig, type BrandId, type BrandConfig } from '@mrd/shared';

interface BrandContextValue {
  brand: BrandId;
  config: BrandConfig;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export interface BrandProviderProps {
  children: ReactNode;
  /** Brand identifier */
  brand: BrandId;
}

/**
 * BrandProvider - Provides brand configuration to all child components
 * 
 * This provider injects CSS custom properties for brand theming.
 * 
 * @example
 * ```tsx
 * <BrandProvider brand="healthtalk">
 *   <App />
 * </BrandProvider>
 * ```
 */
export function BrandProvider({ children, brand }: BrandProviderProps) {
  const config = useMemo(() => getBrandConfig(brand), [brand]);

  const value = useMemo(() => ({ brand, config }), [brand, config]);

  // Inject CSS custom properties for brand theming
  const style = useMemo(() => ({
    '--brand-primary': config.primaryColor,
    '--brand-name': config.name,
  } as React.CSSProperties), [config]);

  return (
    <BrandContext.Provider value={value}>
      <div style={style} data-brand={brand}>
        {children}
      </div>
    </BrandContext.Provider>
  );
}

/**
 * useBrand - Access brand configuration
 * 
 * @throws Error if used outside BrandProvider
 * 
 * @example
 * ```tsx
 * const { brand, config } = useBrand();
 * console.log(config.displayName); // "HealthTalk"
 * ```
 */
export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

/**
 * useHasFeature - Check if current brand has a feature enabled
 * 
 * @example
 * ```tsx
 * const hasVoice = useHasFeature('voiceAgent');
 * if (hasVoice) {
 *   return <VoiceAgentButton />;
 * }
 * ```
 */
export function useHasFeature(feature: keyof BrandConfig['features']): boolean {
  const { config } = useBrand();
  return config.features[feature] ?? false;
}
