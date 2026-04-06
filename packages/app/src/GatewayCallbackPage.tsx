// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Logo, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getConfig } from './config';

/**
 * HealthTalk Gateway Callback Page
 * 
 * Handles the OAuth callback from HealthTalk Gateway.
 * Calls the Medplum server's /auth/gateway endpoint which:
 * 1. Validates the Gateway session/webToken
 * 2. Creates/updates User and Practitioner in Medplum
 * 3. Returns Medplum OAuth tokens
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const medplum = useMedplum();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'authenticating' | 'complete' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  /**
   * Authenticate via Medplum's Gateway endpoint
   * This endpoint handles webToken exchange AND Practitioner provisioning server-side
   */
  const authenticateWithGateway = useCallback(async (webToken: string): Promise<void> => {
    const baseUrl = config.baseUrl || medplum.getBaseUrl();
    
    const response = await fetch(`${baseUrl}auth/gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        webToken,
        projectId: config.clientId ? undefined : undefined, // Use default project
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.issue?.[0]?.diagnostics || data.error || 'Authentication failed');
    }

    // Set the tokens in Medplum client
    // The response contains id_token, access_token, refresh_token
    medplum.setAccessToken(data.access_token, data.refresh_token);
    
    return data;
  }, [config.baseUrl, config.clientId, medplum]);

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

      // Check for webToken (cross-domain mode)
      const webToken = searchParams.get('webToken');
      if (webToken) {
        setStatus('authenticating');
        
        // Check if token was already used (page refresh)
        const storedToken = localStorage.getItem('gateway.lastWebToken');
        if (storedToken === webToken) {
          // Token already processed, check if we have a valid session
          if (medplum.getActiveLogin()) {
            setStatus('complete');
            const nextUrl = searchParams.get('next');
            navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
            return;
          }
        }

        // Authenticate with Medplum's Gateway endpoint
        // This handles: webToken exchange, User creation, Practitioner provisioning
        const result = await authenticateWithGateway(webToken);
        
        // Store token to detect refresh
        localStorage.setItem('gateway.lastWebToken', webToken);
        
        setStatus('complete');
        showNotification({
          title: 'Signed in with HealthTalk',
          message: `Welcome!`,
          color: 'teal',
        });

        // Redirect to next URL or home
        const nextUrl = searchParams.get('next');
        navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
        return;
      }

      // No webToken - check if already authenticated
      if (medplum.getActiveLogin()) {
        const nextUrl = searchParams.get('next');
        navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
        return;
      }

      throw new Error('No authentication token received');

    } catch (err) {
      console.error('[Gateway] Callback error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      showNotification({
        title: 'Authentication Failed',
        message: err instanceof Error ? err.message : 'An error occurred during sign in',
        color: 'red',
      });
    }
  }, [searchParams, authenticateWithGateway, medplum, navigate]);

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
    authenticating: 'Setting up your profile...',
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
