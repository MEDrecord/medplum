// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Logo } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getConfig } from './config';

interface GatewayUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

interface ExchangeResponse {
  sessionId: string;
  user: GatewayUser;
  expiresAt: string;
}

/**
 * HealthTalk Gateway Callback Page
 * 
 * Handles the OAuth callback from HealthTalk Gateway.
 * Exchanges webToken for session and stores Gateway auth state.
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'exchanging' | 'complete' | 'error'>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  /**
   * Exchange webToken with Gateway for session
   */
  const exchangeWebToken = useCallback(async (webToken: string): Promise<ExchangeResponse> => {
    const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
    
    const response = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        webToken,
        origin: window.location.origin,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `Exchange failed: ${response.status}`);
    }

    return data as ExchangeResponse;
  }, [config.gatewayUrl]);

  /**
   * Main callback handler
   */
  const handleCallback = useCallback(async () => {
    try {
      // Check for error from gateway
      const error = searchParams.get('error');
      if (error) {
        throw new Error(searchParams.get('error_description') || error);
      }

      const webToken = searchParams.get('webToken');
      if (!webToken) {
        // Check if we have a stored session (returning user or page refresh)
        const storedUser = localStorage.getItem('gateway.user');
        if (storedUser) {
          const user = JSON.parse(storedUser) as GatewayUser;
          showNotification({
            title: 'Already signed in',
            message: `Welcome back, ${user.name || user.email || 'User'}!`,
            color: 'teal',
          });
          const nextUrl = searchParams.get('next');
          navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
          return;
        }
        throw new Error('No authentication token received');
      }

      // Check if this token was already exchanged (page refresh)
      const storedToken = localStorage.getItem('gateway.lastWebToken');
      if (storedToken === webToken) {
        const storedUser = localStorage.getItem('gateway.user');
        if (storedUser) {
          const user = JSON.parse(storedUser) as GatewayUser;
          setStatus('complete');
          showNotification({
            title: 'Signed in with HealthTalk',
            message: `Welcome, ${user.name || user.email || 'User'}!`,
            color: 'teal',
          });
          const nextUrl = searchParams.get('next');
          navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
          return;
        }
      }

      // Exchange webToken for session
      setStatus('exchanging');
      const result = await exchangeWebToken(webToken);
      
      // Store session data
      localStorage.setItem('gateway.sessionId', result.sessionId);
      localStorage.setItem('gateway.user', JSON.stringify(result.user));
      localStorage.setItem('gateway.expiresAt', result.expiresAt);
      localStorage.setItem('gateway.lastWebToken', webToken);
      
      setStatus('complete');
      showNotification({
        title: 'Signed in with HealthTalk',
        message: `Welcome, ${result.user?.name || result.user?.email || 'User'}!`,
        color: 'teal',
      });

      // Redirect to next URL or home
      const nextUrl = searchParams.get('next');
      navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });

    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      showNotification({
        title: 'Authentication Failed',
        message: err instanceof Error ? err.message : 'An error occurred during sign in',
        color: 'red',
      });
    }
  }, [searchParams, exchangeWebToken, navigate]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  // Error state
  if (status === 'error') {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Logo size={48} />
          <Title order={3} c="red">Authentication Failed</Title>
          <Text c="dimmed">{errorMessage}</Text>
          <Text
            c="teal"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/signin')}
          >
            Return to Sign In
          </Text>
        </Stack>
      </Center>
    );
  }

  // Loading states
  const statusMessages: Record<string, string> = {
    exchanging: 'Completing sign in...',
    complete: 'Redirecting...',
  };

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Logo size={48} />
        <Loader size="lg" color="teal" />
        <Text c="dimmed">{statusMessages[status]}</Text>
      </Stack>
    </Center>
  );
}
