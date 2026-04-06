/**
 * @mrd/shared - MEDrecord Shared Package
 * 
 * Common types, brand configuration, and utilities for all MEDrecord packages and apps.
 * 
 * @example
 * ```tsx
 * import { getBrandConfig, type BrandId, type TemplateSummary } from '@mrd/shared';
 * 
 * const config = getBrandConfig('healthtalk');
 * console.log(config.displayName); // "HealthTalk"
 * ```
 */

// Brand configuration
export {
  BRANDS,
  getBrandConfig,
  getBrandFromDomain,
  hasFeature,
  type BrandId,
  type BrandConfig,
} from './brand-config';

// Types
export * from './types';
