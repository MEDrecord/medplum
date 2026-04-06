'use client';

import { useBrand } from './brand-provider';

export interface BrandLogoProps {
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text next to logo */
  showText?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 24, height: 24, textClass: 'text-sm' },
  md: { width: 32, height: 32, textClass: 'text-base' },
  lg: { width: 48, height: 48, textClass: 'text-lg' },
} as const;

/**
 * BrandLogo - Renders the current brand's logo
 * 
 * Automatically uses the correct logo based on the BrandProvider context.
 * 
 * @example
 * ```tsx
 * <BrandLogo size="md" showText />
 * ```
 */
export function BrandLogo({ size = 'md', showText = false, className = '' }: BrandLogoProps) {
  const { config } = useBrand();
  const { width, height, textClass } = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={config.logoPath}
        alt={`${config.displayName} logo`}
        width={width}
        height={height}
        className="object-contain"
      />
      {showText && (
        <span className={`font-semibold ${textClass}`} style={{ color: config.primaryColor }}>
          {config.displayName}
        </span>
      )}
    </div>
  );
}
