// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient } from '@medplum/core';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import crypto from 'crypto';
import { MemoryRouter } from 'react-router';
import { TextEncoder } from 'util';
import { AppRoutes } from './AppRoutes';
import { getConfig } from './config';
import type { UserEvent } from './test-utils/render';
import { act, render, screen, userEvent } from './test-utils/render';

async function setup(medplum: MedplumClient): Promise<UserEvent> {
  const user = userEvent.setup();
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/register']} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <AppRoutes />
        </MedplumProvider>
      </MemoryRouter>
    );
  });

  return user;
}

/**
 * SKIPPED IN THIS FORK -- the page under test is unreachable by design.
 *
 * AppRoutes maps /register to <Navigate to="/signin" replace />, so RegisterPage never mounts.
 * Each test here renders AppRoutes at /register and lands on the sign-in page instead, which is
 * why they fail whether they enable the flag or assert the disabled message -- the component they
 * are about is never on screen either way.
 *
 * Registration is off at two levels: this redirect, and `registerEnabled: false` hardcoded in
 * config.ts ("Google login and local registration are disabled -- gateway auth only"). Accounts
 * come from the HealthTalk gateway.
 *
 * Nothing regressed. These never ran: every suite in this package died on an unparsable PNG import
 * before reaching a test, and before that the whole workflow was rejected as invalid.
 *
 * Skipped rather than deleted. RegisterPage.tsx is still in the tree, so if the route is ever
 * restored these describe what it should do. Worth noting the component is dead code today -- if
 * registration is not coming back, the page and this file should go together.
 */
describe.skip('RegisterPage', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global, 'crypto', {
      value: crypto.webcrypto,
    });
  });

  beforeEach(() => {
    getConfig().registerEnabled = true;
  });

  test('Renders', async () => {
    const medplum = new MockClient();
    medplum.getProfile = jest.fn(() => undefined) as any;
    await setup(medplum);
    expect(screen.getByRole('button', { name: 'Register Account' })).toBeInTheDocument();
  });

  test('Redirect if signed in', async () => {
    const medplum = new MockClient();
    await setup(medplum);
    expect(screen.getByText('Sign in again to create a new project')).toBeInTheDocument();
  });

  test('Submit success', async () => {
    const medplum = new MockClient();
    medplum.getProfile = jest.fn(() => undefined) as any;
    medplum.startNewUser = jest.fn(() => Promise.resolve({ login: '1' }));
    const user = await setup(medplum);

    Object.defineProperty(global, 'grecaptcha', {
      value: {
        ready(callback: () => void): void {
          callback();
        },
        execute(): Promise<string> {
          return Promise.resolve('token');
        },
      },
    });

    await user.type(screen.getByLabelText('First name *'), 'George');
    await user.type(screen.getByLabelText('Last name *'), 'Washington');
    await user.type(screen.getByLabelText('Email *'), 'george@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password');

    await user.click(screen.getByRole('button'));

    await user.type(screen.getByLabelText('Project Name *'), 'Test Project');

    await user.click(screen.getByRole('button'));
  });

  test('Register disabled', async () => {
    getConfig().registerEnabled = false;

    const medplum = new MockClient();
    medplum.getProfile = jest.fn(() => undefined) as any;
    medplum.startNewUser = jest.fn(() => Promise.resolve({ login: '1' }));
    await setup(medplum);

    expect(screen.getByText('New projects are disabled on this server.')).toBeInTheDocument();
  });
});
