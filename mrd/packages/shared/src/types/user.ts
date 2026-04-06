/**
 * User Types
 * 
 * Types for users, sessions, and tenants.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'practitioner' | 'assistant' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface Session {
  user: User;
  tenant: Tenant;
  accessToken: string;
  expiresAt: string;
}

export interface SessionInfo {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  expiresAt: string;
}
