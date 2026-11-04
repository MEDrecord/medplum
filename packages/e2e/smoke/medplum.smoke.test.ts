// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import path from 'node:path';

/**
 * SKIPPED IN THIS FORK -- these test a sign-in flow the app no longer has.
 *
 * Every test here drives Medplum's local sign-in form: fill name@domain.com, Continue, type a
 * password, Sign In, and follow a "Register" link. This fork replaced all of that with HealthTalk
 * gateway auth. packages/app/src/SignInPage.tsx renders no form at all -- it redirects:
 *
 *   window.location.href = gatewayUrl;
 *
 * and `registerEnabled` is hardcoded false in config.ts ("Google login and local registration are
 * disabled -- gateway auth only"). The email field, the password field and the Register link do
 * not exist, and no configuration brings them back.
 *
 * The failure reads as a routing bug -- the app sits on /Patient where the test expects /signin --
 * which points the first reader in the wrong direction. It is not: the app is simply past a
 * sign-in step that no longer happens locally.
 *
 * Nothing regressed here. These never ran: the workflow template was invalid, so the job was
 * rejected before its first step. Fixing that is what made this visible.
 *
 * Skipped rather than deleted -- the file records what smoke coverage used to exist and is the
 * starting point for rewriting it against the gateway flow. That rewrite needs a reachable gateway
 * and test credentials in CI, which is a decision about test infrastructure, not a fix.
 *
 * A check that cannot pass is worse than one honestly skipped: a permanently red job is how the
 * earlier production break went unnoticed.
 */
test.describe.skip('Medplum App Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // TODO: Work around recaptcha
  test.skip('Register new user', async ({ page }) => {
    // We should automatically be redirected to the signin form
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/signin/);

    // Make sure the sign in form is there
    await expect(page.locator('form')).toContainText('Email *');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByText('Register')).toBeVisible();

    // Navigate to sign up form
    await page.getByText('Register').click();
    await expect(page).toHaveURL('http://localhost:3000/register');

    // Fill out sign up form
    await page.getByPlaceholder('First name').fill('Test');
    await page.getByPlaceholder('Last name').fill('User');
    await page.getByPlaceholder('name@domain.com').fill('test@gmail.com');
    await page.getByLabel('Password *').fill('TestTest123%');
    await page.getByLabel('Remember me').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL('http://localhost:3000/register');
    await page.getByPlaceholder('My Project').fill('Test Project');
    await page.getByRole('button', { name: 'Create Project' }).click();
  });

  test('Sign in', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'medplum_admin');
  });

  test('Create a patient', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'medplum_admin');

    await page.getByRole('button', { name: 'Medplum Logo' }).click();
    await page.getByRole('link', { name: 'Patient' }).click();
    await page.getByRole('button', { name: 'New...' }).click();
    await page.getByRole('button', { name: 'Add Name' }).click();
    await page.getByPlaceholder('Given').fill('Frodo');
    await page.getByPlaceholder('Family').fill('Baggins');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/Patient\/[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/);
    await expect(page.getByTestId('timeline-item').getByText('Frodo Baggins')).toBeVisible();
  });

  test('Search for patient via searchbar', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'medplum_admin');

    await page.getByPlaceholder('Search').fill('Frodo Baggins');
    await expect(page.getByTestId('options')).toBeVisible();
    await page.getByText('FBFrodo Baggins').first().click();

    await page.getByTestId('timeline-item').getByText('Frodo Baggins').click();
  });

  test('Search for patient via permalink', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'medplum_admin');

    await page.goto('http://localhost:3000/Patient?name=Frodo&_sort=-_lastUpdated');
    await expect(page.getByTestId('search-control-row').first().locator('div')).toContainText('Frodo Baggins');
  });

  test('Upload patient profile photo', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'medplum_admin');

    await page.goto('http://localhost:3000/Patient?name=Frodo&_sort=-_lastUpdated');
    await expect(page.getByTestId('search-control-row').first().locator('div')).toContainText('Frodo Baggins');

    // Click on patient
    await page.getByTestId('search-control-row').first().locator('div').click();

    // Edit and upload image
    await page.getByRole('tab', { name: 'Edit' }).click();
    await expect(page.getByText('An identifier for this patient.', { exact: true })).toBeVisible();
    await page.getByTestId('upload-file-input').setInputFiles(path.resolve('./content/frodo_baggins.png'));
    await expect(page.getByTestId('attachment-image')).toBeVisible();
    await page.getByRole('button', { name: 'Update' }).click();

    await page.getByRole('tab', { name: 'Details' }).click();
    await expect(page.getByTestId('attachment-details')).toBeVisible();
    await expect(page.getByTestId('attachment-details')).toContainText('frodo_baggins.png');
  });
});

async function signIn(page: Page, email: string, password: string): Promise<void> {
  // We should automatically be redirected to the signin form
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/signin/);

  // Make sure the sign in form is there
  await expect(page.locator('form')).toContainText('Email *');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByText('Register')).toBeVisible();

  // Fill out sign in form
  await page.getByPlaceholder('name@domain.com').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password *').fill(password);
  await page.getByLabel('Remember me').check();
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Make sure we ended up on the right page
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/Patient\?/);
  await expect(page.locator('div').filter({ hasText: /^Medplum Logo$/ })).toBeVisible();
}
