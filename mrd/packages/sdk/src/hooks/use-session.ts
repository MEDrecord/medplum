'use client';

import useSWR from 'swr';
import { useGateway } from './use-gateway';
import type { SessionInfo } from '../client/gateway-client';

/**
 * useSession - Get current user session
 * 
 * @example
 * ```tsx
 * const { session, isLoading, isAuthenticated, logout } = useSession();
 * 
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginButton />;
 * 
 * return <div>Welcome, {session.user.name}</div>;
 * ```
 */
export function useSession() {
  const { client } = useGateway();

  const { data, error, isLoading, mutate } = useSWR<SessionInfo | null>(
    'session',
    () => client.getSession(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );

  const logout = async () => {
    await client.logout();
    mutate(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  return {
    session: data,
    isLoading,
    isAuthenticated: !!data && !error,
    error,
    logout,
    refresh: () => mutate(),
  };
}
