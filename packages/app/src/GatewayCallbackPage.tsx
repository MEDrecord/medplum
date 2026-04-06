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
 * Supports webToken mode for cross-domain authentication.
 * 
 * After Gateway authentication, provisions a Practitioner in Medplum
 * using client credentials (service account).
 */
export function GatewayCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'exchanging' | 'provisioning' | 'complete' | 'error'>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string>();
  const config = getConfig();

  /**
   * Exchange webToken for sessionId
   */
  const exchangeWebToken = useCallback(async (webToken: string): Promise<ExchangeResponse> => {
    const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
    
    console.log('[Gateway] Exchanging webToken at:', gatewayUrl);
    console.log('[Gateway] Origin:', window.location.origin);
    
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

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('[Gateway] Exchange failed:', data);
      throw new Error(data.message || data.error || `Exchange failed: ${response.status}`);
    }

    console.log('[Gateway] Exchange successful, user:', data.user?.email);
    return data as ExchangeResponse;
  }, [config.gatewayUrl]);

  /**
   * Provision Practitioner using Medplum client credentials
   * This creates a Practitioner linked to the Gateway user
   */
  const provisionPractitioner = useCallback(async (user: GatewayUser, sessionId: string): Promise<void> => {
    try {
      console.log('[Gateway] Provisioning Practitioner for:', user.email);
      
      // Use the Gateway proxy to create Practitioner (gateway has service account access)
      const gatewayUrl = config.gatewayUrl || 'https://auth-test-b2c.healthtalk.ai';
      
      const nameParts = (user.name || user.email.split('@')[0]).split(' ');
      const givenName = nameParts[0] || '';
      const familyName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      const practitionerData = {
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
      };

      // Call gateway proxy to create/update Practitioner
      const response = await fetch(`${gatewayUrl}/api/gateway/proxy/medplum/fhir/R4/Practitioner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify(practitionerData),
      });

      if (response.ok) {
        const practitioner = await response.json();
        console.log('[Gateway] Practitioner provisioned:', practitioner.id);
      } else {
        // Try to search for existing and update
        console.log('[Gateway] Create failed, searching for existing...');
        const searchResponse = await fetch(
          `${gatewayUrl}/api/gateway/proxy/medplum/fhir/R4/Practitioner?identifier=https://healthtalk.ai/gateway/user|${user.id}`,
          {
            headers: {
              'X-Session-Id': sessionId,
            },
          }
        );
        
        if (searchResponse.ok) {
          const bundle = await searchResponse.json();
          if (bundle.entry?.length > 0) {
            console.log('[Gateway] Found existing Practitioner');
          }
        }
      }
    } catch (err) {
      // Log but don't fail the auth flow
      console.warn('[Gateway] Practitioner provisioning failed:', err);
    }
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

      // Check for webToken (cross-domain mode)
      const webToken = searchParams.get('webToken');
      if (webToken) {
        // Step 1: Exchange webToken for sessionId
        setStatus('exchanging');
        const result = await exchangeWebToken(webToken);
        
        // Store session data in localStorage
        localStorage.setItem('gateway.sessionId', result.sessionId);
        localStorage.setItem('gateway.user', JSON.stringify(result.user));
        localStorage.setItem('gateway.expiresAt', result.expiresAt);
        
        // Step 2: Provision Practitioner profile
        setStatus('provisioning');
        await provisionPractitioner(result.user, result.sessionId);
        
        // Step 3: Complete - show success and redirect
        setStatus('complete');
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

      // No webToken - might be cookie mode or error
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
  }, [searchParams, exchangeWebToken, provisionPractitioner, navigate]);

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
    exchanging: 'Verifying authentication...',
    provisioning: 'Setting up your profile...',
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
