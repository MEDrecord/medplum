// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Logo } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getConfig } from './config';

/**
 * HealthTalk Gateway Callback Page
 * 
 * Handles the OAuth callback from HealthTalk Gateway.
 * Supports webToken mode for cross-domain authentication.
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  const exchangeWebToken = useCallback(async (webToken: string): Promise<{ sessionId: string; user: any }> => {
    const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
    
    const response = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to exchange webToken');
    }

    return response.json();
  }, [config.gatewayUrl]);

  const handleCallback = useCallback(async () => {
    try {
      // Check for error from gateway
      const error = searchParams.get('error');
      if (error) {
        throw new Error(searchParams.get('error_description') || error);
      }

      // Check for webToken (cross-domain mode)
      const webToken = searchParams.get('webToken');
      if (webToken) {
        // Exchange webToken for sessionId
        const result = await exchangeWebToken(webToken);
        
        // Store session data in localStorage for webToken mode
        localStorage.setItem('gateway.sessionId', result.sessionId);
        localStorage.setItem('gateway.user', JSON.stringify(result.user));
        
        // Show success notification
        showNotification({
          title: 'Signed in with HealthTalk',
          message: `Welcome, ${result.user?.name || result.user?.email || 'User'}!`,
          color: 'teal',
        });

        // Redirect to next URL or home
        const nextUrl = searchParams.get('next');
        navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
        return;
      }

      // Check for session cookie mode (same-domain)
      // In this case, gateway already set the cookie, just verify and redirect
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

  if (status === 'error') {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Logo size={48} />
          <Title order={3} c="red">Authentication Failed</Title>
          <Text c="dimmed">{errorMessage}</Text>
          <Text
            c="teal"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/signin')}
          >
            Return to Sign In
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Logo size={48} />
        <Loader size="lg" color="teal" />
        <Text c="dimmed">Completing sign in...</Text>
      </Stack>
    </Center>
  );
}
