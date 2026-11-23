// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import { isGatewaySuperAdmin } from './gateway';

describe('isGatewaySuperAdmin', () => {
  const list = ' Boss@HealthTalk.ai , other@medrecord.io';

  test('a listed address, any case', () => {
    expect(isGatewaySuperAdmin('boss@healthtalk.ai', list)).toBe(true);
    expect(isGatewaySuperAdmin('BOSS@healthtalk.AI', list)).toBe(true);
    expect(isGatewaySuperAdmin('other@medrecord.io', list)).toBe(true);
  });

  test('anyone else is not', () => {
    expect(isGatewaySuperAdmin('boss+x@healthtalk.ai', list)).toBe(false);
    expect(isGatewaySuperAdmin('colleague@healthtalk.ai', list)).toBe(false);
    expect(isGatewaySuperAdmin('', list)).toBe(false);
    expect(isGatewaySuperAdmin(undefined, list)).toBe(false);
  });

  test('no list means nobody', () => {
    expect(isGatewaySuperAdmin('boss@healthtalk.ai', undefined)).toBe(false);
    expect(isGatewaySuperAdmin('boss@healthtalk.ai', '')).toBe(false);
  });
});
