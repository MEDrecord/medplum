// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Center, Divider, Paper, Stack, Text, Title } from '@mantine/core';
import { useMedplumProfile } from '@medplum/react';
import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getGatewaySignInUrl } from './config';
import healthtalkLogo from './assets/healthtalk-logo.png';

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
    <Center
      mih="100vh"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2a5a8c 50%, #1e3a5f 100%)',
      }}
    >
      <Paper
        shadow="xl"
        p={48}
        radius="lg"
        w={420}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Stack align="center" gap="xl">
          {/* Logo */}
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(30, 58, 95, 0.3)',
            }}
          >
            <img
              src={healthtalkLogo}
              alt="HealthTalk"
              width={80}
              height={80}
              style={{ display: 'block' }}
            />
          </Box>

          {/* Title */}
          <Stack align="center" gap={4}>
            <Title order={2} fw={700} c="dark.8" ta="center">
              HealthTalk
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Sign in to continue to the healthcare platform
            </Text>
          </Stack>

          <Divider w="100%" color="gray.2" />

          {/* Sign In Button */}
          <Button
            fullWidth
            size="lg"
            radius="md"
            onClick={handleGatewaySignIn}
            style={{
              backgroundColor: '#1e3a5f',
              height: 52,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 0.3,
              transition: 'all 0.2s ease',
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: '#2a5a8c',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.4)',
                },
              },
            }}
          >
            Sign in with HealthTalk Gateway
          </Button>

          {/* Footer */}
          <Text size="xs" c="dimmed" ta="center">
            Secure authentication powered by HealthTalk Gateway
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
