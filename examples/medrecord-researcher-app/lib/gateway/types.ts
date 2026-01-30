/**
 * Gateway API Types
 * Based on HealthTalk Gateway specification
 */

// User & Session Types
export interface GatewayUser {
  id: string
  email: string
  name: string
  roles: FHIRRole[]
  operationalRoles: OperationalRole[]
  tenantId: string
}

export interface GatewaySession {
  user: GatewayUser
  expiresAt: string
}

// FHIR Role Types
export type FHIRRole = 'Patient' | 'Practitioner' | 'RelatedPerson' | 'Organization'

export type OperationalRole = 'Admin' | 'Developer' | 'Researcher' | 'User'

// Researcher Tracking
export interface ResearcherRecord {
  id: string
  email: string
  name: string
  organization?: string
  firstAccessAt: string
  lastAccessAt: string
  accessCount: number
  tenantId: string
  purpose?: string
  acceptedTermsAt?: string
  marketingConsent: boolean
}

// Tenant Types
export interface Tenant {
  id: string
  name: string
  slug: string
  settings: TenantSettings
}

export interface TenantSettings {
  branding?: {
    logo?: string
    primaryColor?: string
  }
  features: {
    agents: boolean
    whatsapp: boolean
    prom: boolean
  }
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
