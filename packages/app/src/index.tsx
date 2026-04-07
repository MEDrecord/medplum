// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { App } from './App';
import { getConfig, getEffectiveBaseUrl, isGatewayEnabled, createGatewayFetch } from './config';
import './index.css';

export async function initApp(): Promise<void> {
  const config = getConfig();

  // When gateway is enabled, route all calls through the gateway proxy.
  // The browser sends the auth.sid cookie automatically (same-domain, httpOnly).
  // The gateway validates the session, adds HMAC headers (X-Gateway-Key,
  // X-Gateway-Signature, X-User-Id, X-User-Email), and forwards to the
  // Medplum server which validates the HMAC.
  const baseUrl = getEffectiveBaseUrl() || config.baseUrl;

  // When routing through the gateway proxy, wrap fetch to handle CSRF tokens.
  // The gateway requires X-CSRF-Token on POST/PUT/PATCH/DELETE.
  const useGatewayProxy = isGatewayEnabled() && baseUrl?.includes('/api/gateway/proxy/');
  const gatewayFetch = useGatewayProxy ? createGatewayFetch() : undefined;

  const medplum = new MedplumClient({
    baseUrl,
    clientId: config.clientId,
    fetch: gatewayFetch,
    storagePrefix: '@medplum:',
    cacheTime: 60000,
    autoBatchTime: 100,
    onUnauthenticated: () => {
      if (window.location.pathname !== '/signin' && window.location.pathname !== '/oauth') {
        window.location.href = '/signin?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      }
    },
  });

  const theme = createTheme({
    headings: {
      sizes: {
        h1: {
          fontSize: '1.125rem',
          fontWeight: '500',
          lineHeight: '2.0',
        },
      },
    },
    fontSizes: {
      xs: '0.6875rem',
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1.0rem',
      xl: '1.125rem',
    },
  });

  const router = createBrowserRouter([{ path: '*', element: <App /> }]);

  const navigate = (path: string): Promise<void> => router.navigate(path);

  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <StrictMode>
      <MedplumProvider medplum={medplum} navigate={navigate}>
        <MantineProvider theme={theme}>
          <Notifications position="bottom-right" />
          <RouterProvider router={router} />
        </MantineProvider>
      </MedplumProvider>
    </StrictMode>
  );
}

if (process.env.NODE_ENV !== 'test') {
  initApp().catch(console.error);
}
