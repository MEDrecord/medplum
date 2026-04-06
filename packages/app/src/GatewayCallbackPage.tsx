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
 * Sends the webToken to the Medplum server's /auth/gateway endpoint,
 * which handles all server-side work (token exchange, user/practitioner provisioning).
 * Then sets the returned Medplum tokens on the client.
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const medplum = useMedplum();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'authenticating' | 'complete' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  const handleCallback = useCallback(async () => {
    try {
      // Check for error from gateway
      const error = searchParams.get('error');
      if (error) {
        throw new Error(searchParams.get('error_description') || error);
      }

      // If user already has an active login, just redirect
      if (medplum.getActiveLogin()) {
        const nextUrl = searchParams.get('next');
        navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
        return;
      }

      const webToken = searchParams.get('webToken');
      if (!webToken) {
        throw new Error('No authentication token received');
      }

      // Prevent re-processing on page refresh
      const storedToken = sessionStorage.getItem('gateway.lastWebToken');
      if (storedToken === webToken && medplum.getActiveLogin()) {
        const nextUrl = searchParams.get('next');
        navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
        return;
      }

      setStatus('authenticating');

      // Call Medplum server's /auth/gateway endpoint
      // All heavy lifting happens server-side:
      //   - webToken exchange with Gateway
      //   - User creation/lookup
      //   - Practitioner provisioning
      //   - Token generation
      const baseUrl = medplum.getBaseUrl();
      const response = await fetch(`${baseUrl}auth/gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.issue?.[0]?.diagnostics || data?.error || `Authentication failed (${response.status})`
        );
      }

      const tokens = await response.json();

      // Set the active login on the Medplum client
      await medplum.setActiveLogin({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        project: tokens.project,
        profile: tokens.profile,
      });

      // Prevent re-exchange on refresh
      sessionStorage.setItem('gateway.lastWebToken', webToken);

      setStatus('complete');
      showNotification({
        title: 'Signed in with HealthTalk',
        message: `Welcome, ${tokens.profile?.display || 'User'}!`,
        color: 'teal',
      });

      const nextUrl = searchParams.get('next');
      navigate(nextUrl?.startsWith('/') ? nextUrl : '/', { replace: true });
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
  }, [searchParams, medplum, navigate]);

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
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/signin')}
          >
            Return to Sign In
          </Text>
        </Stack>
      </Center>
    );
  }

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
