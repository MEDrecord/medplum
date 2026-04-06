// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
/// <reference types="vite/client" />
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };

// Only copy .env.defaults in local dev when no .env exists AND no
// MEDPLUM_BASE_URL is provided via process environment (e.g. Vercel).
// Without this guard, .env.defaults (localhost:8103) silently overrides
// the Vercel dashboard env var because Vite .env files take precedence
// over process.env for import.meta.env.
if (!existsSync(path.join(__dirname, '.env')) && !process.env.MEDPLUM_BASE_URL) {
  copyFileSync(path.join(__dirname, '.env.defaults'), path.join(__dirname, '.env'));
}

let gitHash;
try {
  gitHash = execSync('git rev-parse --short=7 HEAD').toString().trim();
} catch (_err) {
  gitHash = 'unknown'; // Default value when not in a git repository
}

process.env.MEDPLUM_VERSION = packageJson.version + '-' + gitHash;

export default defineConfig({
  envPrefix: ['MEDPLUM_', 'GOOGLE_', 'RECAPTCHA_'],
  plugins: [react()],
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  publicDir: 'static',
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@medplum/core': path.resolve(__dirname, '../core/src'),
      '@medplum/react': path.resolve(__dirname, '../react/src'),
      '@medplum/react-hooks': path.resolve(__dirname, '../react-hooks/src'),
    },
  },
});
