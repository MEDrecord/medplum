/**
 * Auth Storage
 * 
 * Client-side storage for webToken mode (cross-domain authentication).
 * Only used when cookie-based auth is not available.
 */

const SESSION_ID_KEY = 'auth.sessionId';
const USER_DATA_KEY = 'auth.user';
const EXPIRES_AT_KEY = 'auth.expiresAt';

import type { GatewayUser } from './types';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Store session ID for webToken mode
 */
export function setSessionId(sessionId: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch {
    // localStorage may be unavailable in private browsing
    console.warn('[auth] Failed to store session ID');
  }
}

/**
 * Get stored session ID
 */
export function getSessionId(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Remove stored session ID
 */
export function removeSessionId(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Store user data for quick access (cache only, not authoritative)
 */
export function setUserData(user: GatewayUser): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch {
    // Ignore errors
  }
}

/**
 * Get cached user data
 */
export function getUserData(): GatewayUser | null {
  if (!isBrowser()) return null;
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Remove cached user data
 */
export function removeUserData(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(USER_DATA_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Store session expiry time
 */
export function setExpiresAt(expiresAt: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
  } catch {
    // Ignore errors
  }
}

/**
 * Get session expiry time
 */
export function getExpiresAt(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(EXPIRES_AT_KEY);
  } catch {
    return null;
  }
}

/**
 * Check if session has expired (based on stored expiry)
 */
export function isSessionExpired(): boolean {
  const expiresAt = getExpiresAt();
  if (!expiresAt) return true;
  
  try {
    return new Date(expiresAt) <= new Date();
  } catch {
    return true;
  }
}

/**
 * Clear all auth storage
 */
export function clearAuthStorage(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if webToken session exists in storage
 */
export function hasStoredSession(): boolean {
  const sessionId = getSessionId();
  if (!sessionId) return false;
  return !isSessionExpired();
}
