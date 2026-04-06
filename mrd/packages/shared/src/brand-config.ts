/**
 * Brand Configuration
 * 
 * Central configuration for all MEDrecord brands.
 * 
 * @see mrd/.agents/standards/multi-brand.mdx
 */

export type BrandId = 'healthtalk' | 'coachi' | 'medsafe' | 'medrecord';

export interface BrandConfig {
  id: BrandId;
  name: string;
  displayName: string;
  domain: string;
  gatewayUrl: string;
  primaryColor: string;
  logoPath: string;
  features: {
    templates: boolean;
    questionnaires: boolean;
    voiceAgent: boolean;
    aiReports: boolean;
  };
  defaultLanguage: string;
  supportedLanguages: string[];
}

export const BRANDS: Record<BrandId, BrandConfig> = {
  healthtalk: {
    id: 'healthtalk',
    name: 'healthtalk',
    displayName: 'HealthTalk',
    domain: 'healthtalk.ai',
    gatewayUrl: 'https://auth-test-b2c.healthtalk.ai',
    primaryColor: '#0066CC',
    logoPath: '/logos/healthtalk.svg',
    features: {
      templates: true,
      questionnaires: true,
      voiceAgent: true,
      aiReports: true,
    },
    defaultLanguage: 'nl',
    supportedLanguages: ['nl', 'en', 'de', 'es', 'tr'],
  },
  coachi: {
    id: 'coachi',
    name: 'coachi',
    displayName: 'Coachi',
    domain: 'coachi.ai',
    gatewayUrl: 'https://auth.coachi.ai',
    primaryColor: '#7C3AED',
    logoPath: '/logos/coachi.svg',
    features: {
      templates: true,
      questionnaires: true,
      voiceAgent: true,
      aiReports: true,
    },
    defaultLanguage: 'nl',
    supportedLanguages: ['nl', 'en'],
  },
  medsafe: {
    id: 'medsafe',
    name: 'medsafe',
    displayName: 'MedSafe',
    domain: 'medsafe.ai',
    gatewayUrl: 'https://auth.medsafe.ai',
    primaryColor: '#059669',
    logoPath: '/logos/medsafe.svg',
    features: {
      templates: true,
      questionnaires: true,
      voiceAgent: false,
      aiReports: true,
    },
    defaultLanguage: 'nl',
    supportedLanguages: ['nl', 'en'],
  },
  medrecord: {
    id: 'medrecord',
    name: 'medrecord',
    displayName: 'MEDrecord',
    domain: 'medrecord.nl',
    gatewayUrl: 'https://auth.medrecord.nl',
    primaryColor: '#1E40AF',
    logoPath: '/logos/medrecord.svg',
    features: {
      templates: true,
      questionnaires: true,
      voiceAgent: true,
      aiReports: true,
    },
    defaultLanguage: 'nl',
    supportedLanguages: ['nl', 'en', 'de'],
  },
};

/**
 * Get brand configuration by ID
 */
export function getBrandConfig(brandId: BrandId): BrandConfig {
  const config = BRANDS[brandId];
  if (!config) {
    throw new Error(`Unknown brand: ${brandId}`);
  }
  return config;
}

/**
 * Get brand ID from domain
 */
export function getBrandFromDomain(hostname: string): BrandId | null {
  for (const [id, config] of Object.entries(BRANDS)) {
    if (hostname.includes(config.domain)) {
      return id as BrandId;
    }
  }
  return null;
}

/**
 * Check if brand has a specific feature enabled
 */
export function hasFeature(brandId: BrandId, feature: keyof BrandConfig['features']): boolean {
  return BRANDS[brandId]?.features[feature] ?? false;
}
