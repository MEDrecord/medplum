// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import healthtalkLogo from './assets/healthtalk-logo.png';

interface HealthTalkLogoProps {
  size?: number;
}

export function HealthTalkLogo({ size = 32 }: HealthTalkLogoProps): JSX.Element {
  let borderRadius: number;
  if (size > 40) {
    borderRadius = 16;
  } else if (size > 20) {
    borderRadius = 8;
  } else {
    borderRadius = 4;
  }
  return (
    <img
      src={healthtalkLogo}
      alt="HealthTalk"
      width={size}
      height={size}
      style={{ borderRadius, display: 'block' }}
    />
  );
}
