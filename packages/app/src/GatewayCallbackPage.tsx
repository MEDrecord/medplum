// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Logo, useMedplum } from '@medplum/react';
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

/**
 * HealthTalk Gateway Callback Page
 * 
 * Handles the OAuth callback from HealthTalk Gateway.
 * Supports webToken mode for cross-domain authentication.
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const medplum = useMedplum();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'provisioning' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  /**
   * Provision or update Practitioner profile in Medplum based on Gateway user
   */
  const provisionPractitioner = useCallback(async (user: GatewayUser): Promise<void> => {
    try {
      // Search for existing Practitioner with this Gateway user ID
      const searchResult = await medplum.searchResources('Practitioner', {
        identifier: `https://healthtalk.ai/gateway/user|${user.id}`,
      });

      const nameParts = (user.name || user.email.split('@')[0]).split(' ');
      const givenName = nameParts[0] || '';
      const familyName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      if (searchResult.length > 0) {
        // Update existing Practitioner
        const existing = searchResult[0];
        await medplum.updateResource({
          ...existing,
          name: [{
            given: [givenName],
            family: familyName,
          }],
          telecom: [
            { system: 'email', value: user.email, use: 'work' },
          ],
        });
        console.log('[Gateway] Updated existing Practitioner:', existing.id);
      } else {
        // Create new Practitioner
        const practitioner = await medplum.createResource({
          resourceType: 'Practitioner',
          identifier: [{
            system: 'https://healthtalk.ai/gateway/user',
            value: user.id,
          }],
          name: [{
            given: [givenName],
            family: familyName,
          }],
          telecom: [
            { system: 'email', value: user.email, use: 'work' },
          ],
          active: true,
        });
        console.log('[Gateway] Created new Practitioner:', practitioner.id);
      }
    } catch (err) {
      // Log but don't fail the auth flow
      console.warn('[Gateway] Practitioner provisioning failed:', err);
    }
  }, [medplum]);

  const exchangeWebToken = useCallback(async (webToken: string): Promise<{ sessionId: string; user: any }> => {
    const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
    
    const response = await fetch(`${gatewayUrl}/api/auth/web-session/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        webToken,
        origin: window.location.origin, // Required by gateway for CORS validation
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to exchange webToken');
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
        
        // Provision Practitioner profile in Medplum
        setStatus('provisioning');
        if (result.user) {
          await provisionPractitioner(result.user as GatewayUser);
        }

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
  }, [searchParams, exchangeWebToken, provisionPractitioner, navigate]);

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

  const statusMessage = status === 'provisioning' 
    ? 'Setting up your profile...' 
    : 'Completing sign in...';

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Logo size={48} />
        <Loader size="lg" color="teal" />
        <Text c="dimmed">{statusMessage}</Text>
      </Stack>
    </Center>
  );
}
