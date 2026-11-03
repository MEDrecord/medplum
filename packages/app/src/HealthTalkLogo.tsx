// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import healthtalkLogo from './assets/healthtalk-logo.png';

interface HealthTalkLogoProps {
  size?: number;
}

/**
 * Corner rounding that stays proportional as the logo scales.
 *
 * @param size - Rendered width and height in pixels.
 * @returns The border radius in pixels.
 */
function borderRadiusFor(size: number): number {
  if (size > 40) {
    return 16;
  }
  if (size > 20) {
    return 8;
  }
  return 4;
}

export function HealthTalkLogo({ size = 32 }: HealthTalkLogoProps): JSX.Element {
  return (
    <img
      src={healthtalkLogo}
      alt="HealthTalk"
      width={size}
      height={size}
      style={{ borderRadius: borderRadiusFor(size), display: 'block' }}
    />
  );
}
