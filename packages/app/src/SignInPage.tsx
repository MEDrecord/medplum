// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Center, Paper, Stack, Title } from '@mantine/core';
import { useMedplumProfile } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getGatewaySignInUrl } from './config';

export function SignInPage(): JSX.Element {
  const profile = useMedplumProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navigateToNext = useCallback(() => {
    const nextUrl = searchParams.get('next');
    navigate(nextUrl?.startsWith('/') ? nextUrl : '/')?.catch(console.error);
  }, [searchParams, navigate]);

  useEffect(() => {
    if (profile && searchParams.has('next')) {
      navigateToNext();
    }
  }, [profile, searchParams, navigateToNext]);

  // If already logged in, redirect
  useEffect(() => {
    if (profile) {
      navigate('/')?.catch(console.error);
    }
  }, [profile, navigate]);

  const handleGatewaySignIn = useCallback(() => {
    const nextUrl = searchParams.get('next') || '/';
    const callbackUrl = `${window.location.origin}/gateway/callback?next=${encodeURIComponent(nextUrl)}`;
    const gatewayUrl = getGatewaySignInUrl(callbackUrl);
    window.location.href = gatewayUrl;
  }, [searchParams]);

  return (
    <Center mih="100vh" bg="gray.0">
      <Paper shadow="md" p="xl" radius="md" w={400}>
        <Stack align="center" gap="lg">
          <img
            src="/healthtalk-logo.png"
            alt="HealthTalk"
            width={64}
            height={64}
            style={{ borderRadius: 12 }}
          />
          <Title order={3} ta="center">
            Sign in to HealthTalk
          </Title>
          <Button
            fullWidth
            size="lg"
            color="blue"
            onClick={handleGatewaySignIn}
          >
            Sign in with HealthTalk Gateway
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
