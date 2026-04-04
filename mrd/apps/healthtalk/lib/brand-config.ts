/**
 * MEDrecord Brand Configuration
 * 
 * Defines brand settings for MEDrecord and sub-brands.
 * Used for dynamic theming based on tenant configuration.
 */

export type BrandId = 'medrecord' | 'healthtalk' | 'coachi' | 'medsafe';

export interface BrandConfig {
  id: BrandId;
  name: string;
  tagline: string;
  logo: string;
  logoFull?: string;
  favicon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export const brands: Record<BrandId, BrandConfig> = {
  medrecord: {
    id: 'medrecord',
    name: 'MEDrecord',
    tagline: 'eHealth platform as a Service',
    logo: '/images/medrecord-logo.png',
    logoFull: '/images/medrecord-full-logo.png',
    favicon: '/images/medrecord-logo.png',
    colors: {
      primary: '#2C5F9B',   // Deep Trust Blue
      secondary: '#5DADE2', // Clear Sky Blue
      accent: '#4A9C8D',    // Vital Teal
    },
    fonts: {
      heading: 'IBM Plex Sans',
      body: 'Inter',
    },
  },
  healthtalk: {
    id: 'healthtalk',
    name: 'HealthTalk',
    tagline: 'AI Based Clinical Reporting',
    logo: '/images/healthtalk-icon.png',
    logoFull: '/images/healthtalk-logo-full.png',
    favicon: '/images/healthtalk-icon.png',
    colors: {
      primary: '#2D6A8E',   // Serenity Blue
      secondary: '#6DAA8A', // Healing Green
      accent: '#2DD4BF',    // Turquoise
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
  },
  coachi: {
    id: 'coachi',
    name: 'Coachi',
    tagline: 'Jouw persoonlijke gezondheidscoach',
    logo: '/images/coachi-logo.png',
    favicon: '/images/coachi-favicon.png',
    colors: {
      primary: '#059669',   // Green
      secondary: '#10B981',
      accent: '#34D399',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
  },
  medsafe: {
    id: 'medsafe',
    name: 'MedSafe',
    tagline: 'Medicatie veiligheid',
    logo: '/images/medsafe-logo.png',
    favicon: '/images/medsafe-favicon.png',
    colors: {
      primary: '#D97706',   // Orange/Amber
      secondary: '#F59E0B',
      accent: '#FBBF24',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
  },
};

/**
 * Get brand configuration by ID
 */
export function getBrand(brandId: BrandId): BrandConfig {
  return brands[brandId] || brands.medrecord;
}

/**
 * Get brand from environment or default to medrecord
 */
export function getCurrentBrand(): BrandConfig {
  const brandId = (process.env.NEXT_PUBLIC_BRAND || 'medrecord') as BrandId;
  return getBrand(brandId);
}
