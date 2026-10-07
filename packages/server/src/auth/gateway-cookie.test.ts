// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { findGatewaySessionCookie } from './gateway';

const HEALTHTALK = '8d09f1e2-376d-44e0-966c-eb951007e238';
const ROBIN = '81050330-18de-4a0f-a774-e5e943c9f20a';

describe('findGatewaySessionCookie', () => {
  test('Finds the production name', () => {
    expect(findGatewaySessionCookie({ [`auth.sid.${HEALTHTALK}`]: 'sid-1' })).toEqual({
      name: `auth.sid.${HEALTHTALK}`,
      value: 'sid-1',
    });
  });

  /**
   * The shape that actually broke sign-in: outside production the gateway inserts the deployment
   * environment, so the test stack's cookie matched nothing this server looked for.
   */
  test('Finds the preview name, which is what the test stack sets', () => {
    expect(findGatewaySessionCookie({ [`auth.sid.preview.${HEALTHTALK}`]: 'sid-2' })).toEqual({
      name: `auth.sid.preview.${HEALTHTALK}`,
      value: 'sid-2',
    });
  });

  test('Still finds the legacy unscoped name', () => {
    expect(findGatewaySessionCookie({ 'auth.sid': 'sid-3' })).toEqual({ name: 'auth.sid', value: 'sid-3' });
  });

  test('Ignores cookies that are not the gateway session', () => {
    expect(findGatewaySessionCookie({ csrf_token: 'x', 'auth.state': 'y', other: 'z' })).toBeUndefined();
  });

  test('Ignores an empty value', () => {
    expect(findGatewaySessionCookie({ [`auth.sid.${HEALTHTALK}`]: '' })).toBeUndefined();
  });

  test('Returns undefined when there are no cookies at all', () => {
    expect(findGatewaySessionCookie(undefined)).toBeUndefined();
    expect(findGatewaySessionCookie({})).toBeUndefined();
  });

  describe('when the browser holds sessions for several tenants', () => {
    const twoTenants = {
      [`auth.sid.${HEALTHTALK}`]: 'healthtalk-session',
      [`auth.sid.${ROBIN}`]: 'robin-session',
    };

    test('Picks the configured tenant', () => {
      expect(findGatewaySessionCookie(twoTenants, HEALTHTALK)?.value).toBe('healthtalk-session');
      expect(findGatewaySessionCookie(twoTenants, ROBIN)?.value).toBe('robin-session');
    });

    test('Picks the configured tenant through the preview suffix too', () => {
      const preview = {
        [`auth.sid.preview.${HEALTHTALK}`]: 'healthtalk-session',
        [`auth.sid.preview.${ROBIN}`]: 'robin-session',
      };
      expect(findGatewaySessionCookie(preview, ROBIN)?.value).toBe('robin-session');
    });

    /**
     * The security property. Guessing would authenticate whichever user happened to sort first --
     * precisely what per-tenant cookie names exist to prevent. Refusing produces a failed login,
     * which is recoverable; the wrong user is not.
     */
    test('Refuses to guess when nothing says which tenant is ours', () => {
      expect(findGatewaySessionCookie(twoTenants)).toBeUndefined();
    });

    test('Refuses when the configured tenant is not among them', () => {
      expect(findGatewaySessionCookie(twoTenants, 'b7c2db39-e8e0-42ec-ada3-80208e106532')).toBeUndefined();
    });

    test('A legacy unscoped cookie is a deliberate answer, not a guess', () => {
      expect(findGatewaySessionCookie({ ...twoTenants, 'auth.sid': 'legacy' })?.value).toBe('legacy');
    });

    test('But the configured tenant still wins over the legacy cookie', () => {
      expect(findGatewaySessionCookie({ ...twoTenants, 'auth.sid': 'legacy' }, ROBIN)?.value).toBe('robin-session');
    });
  });
});
