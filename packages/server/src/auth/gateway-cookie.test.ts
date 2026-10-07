// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { gatewaySessionCookieCandidates } from './gateway';

const HEALTHTALK = '8d09f1e2-376d-44e0-966c-eb951007e238';
const ROBIN = '81050330-18de-4a0f-a774-e5e943c9f20a';

const names = (c: { name: string }[]): string[] => c.map((x) => x.name);

describe('gatewaySessionCookieCandidates', () => {
  test('Finds the production name', () => {
    expect(gatewaySessionCookieCandidates({ [`auth.sid.${HEALTHTALK}`]: 'sid-1' })).toEqual([
      { name: `auth.sid.${HEALTHTALK}`, value: 'sid-1' },
    ]);
  });

  test('Finds the preview name, which is what the test stack sets', () => {
    expect(gatewaySessionCookieCandidates({ [`auth.sid.preview.${HEALTHTALK}`]: 'sid-2' })).toEqual([
      { name: `auth.sid.preview.${HEALTHTALK}`, value: 'sid-2' },
    ]);
  });

  test('Still offers the legacy unscoped name', () => {
    expect(gatewaySessionCookieCandidates({ 'auth.sid': 'sid-3' })).toEqual([{ name: 'auth.sid', value: 'sid-3' }]);
  });

  test('Ignores cookies that are not the gateway session', () => {
    expect(gatewaySessionCookieCandidates({ csrf_token: 'x', 'auth.state': 'y' })).toEqual([]);
  });

  test('Ignores empty values, and missing cookies', () => {
    expect(gatewaySessionCookieCandidates({ [`auth.sid.${HEALTHTALK}`]: '' })).toEqual([]);
    expect(gatewaySessionCookieCandidates(undefined)).toEqual([]);
    expect(gatewaySessionCookieCandidates({})).toEqual([]);
  });

  /**
   * The case that kept returning 400 in a real browser. Both cookies belong to the same tenant --
   * one issued by the production gateway, one by the test gateway -- and only the gateway being
   * asked can say which of them it issued. Both must therefore be offered.
   */
  describe('when production and test sessions coexist for one tenant', () => {
    const both = {
      [`auth.sid.${HEALTHTALK}`]: 'production-session',
      [`auth.sid.preview.${HEALTHTALK}`]: 'test-session',
    };

    test('Offers both, most specific first', () => {
      expect(names(gatewaySessionCookieCandidates(both))).toEqual([
        `auth.sid.preview.${HEALTHTALK}`,
        `auth.sid.${HEALTHTALK}`,
      ]);
    });

    test('Keeps both when the tenant is configured -- they are the same tenant', () => {
      expect(gatewaySessionCookieCandidates(both, HEALTHTALK)).toHaveLength(2);
    });
  });

  describe('when the browser holds sessions for several tenants', () => {
    const many = {
      [`auth.sid.preview.${HEALTHTALK}`]: 'healthtalk-session',
      [`auth.sid.preview.${ROBIN}`]: 'robin-session',
    };

    /**
     * The safety property. Two VALID sessions on the same gateway for different tenants would make
     * "the first the gateway accepts" a coin toss between two real users, so a configured tenant
     * narrows the field to its own.
     */
    test('A configured tenant excludes other tenants entirely', () => {
      expect(gatewaySessionCookieCandidates(many, HEALTHTALK)).toEqual([
        { name: `auth.sid.preview.${HEALTHTALK}`, value: 'healthtalk-session' },
      ]);
      expect(gatewaySessionCookieCandidates(many, ROBIN)).toEqual([
        { name: `auth.sid.preview.${ROBIN}`, value: 'robin-session' },
      ]);
    });

    test('Without a configured tenant it offers all of them, deterministically ordered', () => {
      expect(names(gatewaySessionCookieCandidates(many))).toEqual([
        `auth.sid.preview.${ROBIN}`,
        `auth.sid.preview.${HEALTHTALK}`,
      ]);
    });

    test('A configured tenant matching nothing still leaves the legacy cookie', () => {
      expect(
        names(gatewaySessionCookieCandidates({ ...many, 'auth.sid': 'legacy' }, 'b7c2db39-e8e0-42ec-ada3-80208e106532'))
      ).toEqual(['auth.sid']);
    });

    test('The legacy cookie is always last -- a fallback, not a preference', () => {
      expect(names(gatewaySessionCookieCandidates({ ...many, 'auth.sid': 'legacy' }))).toEqual([
        `auth.sid.preview.${ROBIN}`,
        `auth.sid.preview.${HEALTHTALK}`,
        'auth.sid',
      ]);
    });
  });
});
