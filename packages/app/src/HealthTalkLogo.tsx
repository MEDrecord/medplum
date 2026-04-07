// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import healthtalkLogo from './assets/healthtalk-logo.png';

interface HealthTalkLogoProps {
  size?: number;
}

export function HealthTalkLogo({ size = 32 }: HealthTalkLogoProps): JSX.Element {
  return (
    <img
      src={healthtalkLogo}
      alt="HealthTalk"
      width={size}
      height={size}
      style={{ borderRadius: size > 40 ? 16 : size > 20 ? 8 : 4, display: 'block' }}
    />
  );
}
