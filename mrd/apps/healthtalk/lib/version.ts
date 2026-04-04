/**
 * HealthTalk Version Information
 * 
 * Versioning is independent of Medplum.
 * We do NOT expose Medplum version to end users.
 */

export const VERSION = {
  /** Brand name */
  brand: 'HealthTalk',
  
  /** Major version */
  major: 1,
  
  /** Minor version */
  minor: 0,
  
  /** Patch version */
  patch: 0,
  
  /** Build suffix (dev, alpha, beta, rc, or empty for release) */
  suffix: 'dev',
  
  /** Full version string */
  get full(): string {
    return `${this.major}.${this.minor}.${this.patch}${this.suffix ? `-${this.suffix}` : ''}`;
  },
  
  /** Short display version */
  get short(): string {
    return `${this.major}.${this.minor}.${this.patch}${this.suffix ? `-${this.suffix}` : ''}`;
  },
  
  /** Display string for UI (brand: version) */
  get display(): string {
    return `${this.brand}: ${this.short}`;
  },
};
