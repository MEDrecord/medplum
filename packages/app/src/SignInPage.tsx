// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Divider, Title } from '@mantine/core';
import { getAppName, Logo, SignInForm, useMedplumProfile } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getConfig, getGatewaySignInUrl, isGatewayEnabled, isRegisterEnabled } from './config';

export function SignInPage(): JSX.Element {
  const profile = useMedplumProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const config = getConfig();

  const navigateToNext = useCallback(() => {
    // only redirect to next if it is a pathname to avoid redirecting
    // to a maliciously crafted URL, e.g. /signin?next=https%3A%2F%2Fevil.com
    const nextUrl = searchParams.get('next');
    navigate(nextUrl?.startsWith('/') ? nextUrl : '/')?.catch(console.error);
  }, [searchParams, navigate]);

  useEffect(() => {
    if (profile && searchParams.has('next')) {
      navigateToNext();
    }
  }, [profile, searchParams, navigateToNext]);

  // Handle HealthTalk Gateway sign-in
  const handleGatewaySignIn = useCallback(() => {
    const nextUrl = searchParams.get('next') || '/';
    // Build callback URL that includes the next param for redirect after gateway auth
    const callbackUrl = `${window.location.origin}/gateway/callback?next=${encodeURIComponent(nextUrl)}`;
    const gatewayUrl = getGatewaySignInUrl(callbackUrl);
    window.location.href = gatewayUrl;
  }, [searchParams]);

  return (
    <SignInForm
      onSuccess={() => navigateToNext()}
      onForgotPassword={() => navigate('/resetpassword')?.catch(console.error)}
      onRegister={isRegisterEnabled() ? () => navigate('/register')?.catch(console.error) : undefined}
      googleClientId={config.googleClientId}
      login={searchParams.get('login') || undefined}
      projectId={searchParams.get('project') || undefined}
    >
      <Logo size={32} />
      {searchParams.get('project') !== 'new' && (
        <Title order={3} py="lg" ta="center">
          Sign in to {getAppName()}
        </Title>
      )}
      {searchParams.get('project') === 'new' && (
        <Title order={3} py="lg" ta="center">
          Sign in again to create a new project
        </Title>
      )}
      {isGatewayEnabled() && searchParams.get('project') !== 'new' && (
        <>
          <Divider label="or" labelPosition="center" my="md" />
          <Button
            fullWidth
            variant="outline"
            color="teal"
            onClick={handleGatewaySignIn}
            leftSection={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7L12 12L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          >
            Sign in with HealthTalk Gateway
          </Button>
        </>
      )}
    </SignInForm>
  );
}
