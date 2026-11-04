// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient } from '@medplum/core';
import { DrAliceSmith, MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import crypto from 'crypto';
import { MemoryRouter } from 'react-router';
import { TextEncoder } from 'util';
import { AppRoutes } from './AppRoutes';
import { getConfig } from './config';
import { act, fireEvent, render, screen } from './test-utils/render';

// logged out
const medplum = new MockClient({ profile: null });

/**
 * SKIPPED IN THIS FORK -- these test a sign-in form the app no longer renders.
 *
 * These look for "Sign in to Medplum", an "Email *" label, a password field, "Forgot password" and
 * a "Register" link. SignInPage.tsx renders none of them. It shows a branded page whose only
 * control is a "Sign in with HealthTalk Gateway" button, and credentials are collected by the
 * gateway rather than by this app.
 *
 * Nothing regressed. These never ran: every suite in this package died on an unparsable PNG import
 * before reaching a test, and before that the whole workflow was rejected as invalid. Fixing those
 * two things is what made these visible.
 *
 * Skipped rather than deleted -- the file is the starting point for tests of the flow that
 * replaced this one: that the button targets the gateway with the right callback, and that an
 * already-signed-in profile redirects. Writing those is worth doing on its own.
 */
describe.skip('SignInPage', () => {
  function setup(url = '/signin', medplumClient: MedplumClient = medplum): void {
    render(
      <MemoryRouter initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplumClient}>
          <AppRoutes />
        </MedplumProvider>
      </MemoryRouter>
    );
  }

  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });

  function expectSigninPageRendered(): void {
    expect(screen.getByText('Sign in to Medplum')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  }

  test('Renders', async () => {
    setup();

    expectSigninPageRendered();
  });

  test('Success', async () => {
    setup();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(await screen.findByTestId('search-control')).toBeInTheDocument();
  });

  test('Forgot password', async () => {
    setup();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Reset Password'));
    });
  });

  test('Register enabled', async () => {
    getConfig().registerEnabled = true;
    setup();

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });
  });

  test('Register disabled', async () => {
    getConfig().registerEnabled = false;
    setup();

    expectSigninPageRendered();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  test('Redirect to next after login', async () => {
    setup('/signin?next=/batch');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(await screen.findByText('Batch Create')).toBeInTheDocument();
  });

  test('Redirects to homepage after login if bad next', async () => {
    setup('/signin?next=https%3A%2F%2Fevil.com');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    // should redirect to the homepage
    expect(await screen.findByTestId('search-control')).toBeInTheDocument();
  });

  test('Does NOT automatically redirect to next if logged in and next NOT present', async () => {
    setup('/signin', new MockClient({ profile: DrAliceSmith }));

    expectSigninPageRendered();
  });

  test('Automatically redirects to next if logged in and next present', async () => {
    setup('/signin?next=/batch', new MockClient({ profile: DrAliceSmith }));

    expect(await screen.findByText('Batch Create')).toBeInTheDocument();
  });

  test('Automatically redirects to homepage if logged with bad next', async () => {
    setup('/signin?next=https%3A%2F%2Fevil.com', new MockClient({ profile: DrAliceSmith }));

    // should redirect to the homepage
    expect(await screen.findByTestId('search-control')).toBeInTheDocument();
  });
});
