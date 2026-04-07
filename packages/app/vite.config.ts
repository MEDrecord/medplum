// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
/// <reference types="vite/client" />
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };

// Only copy .env.defaults for local dev when no .env exists AND no
// MEDPLUM_BASE_URL is provided via the process environment (e.g. Vercel).
// .env.defaults ships localhost:8103 which silently overrides Vercel dashboard
// env vars because Vite .env files take precedence over process.env.
const envDefaultsPath = path.join(__dirname, '.env.defaults');
if (!existsSync(path.join(__dirname, '.env')) && !process.env.MEDPLUM_BASE_URL && existsSync(envDefaultsPath)) {
  copyFileSync(envDefaultsPath, path.join(__dirname, '.env'));
}

let gitHash;
try {
  gitHash = execSync('git rev-parse --short=7 HEAD').toString().trim();
} catch (_err) {
  gitHash = 'unknown'; // Default value when not in a git repository
}

process.env.MEDPLUM_VERSION = packageJson.version + '-' + gitHash;

// When process.env has MEDPLUM_BASE_URL (Vercel, CI), force it into
// import.meta.env so it cannot be overridden by a stale .env / .env.defaults.
// Vite's `define` takes precedence over env-file loading.
const ENV_OVERRIDE_KEYS = [
  'MEDPLUM_BASE_URL', 'MEDPLUM_CLIENT_ID', 'MEDPLUM_REGISTER_ENABLED',
  'MEDPLUM_AWS_TEXTRACT_ENABLED', 'MEDPLUM_GATEWAY_URL', 'MEDPLUM_GATEWAY_TENANT_ID',
  'MEDPLUM_GATEWAY_ENABLED', 'GOOGLE_CLIENT_ID', 'RECAPTCHA_SITE_KEY',
] as const;

function envOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const key of ENV_OVERRIDE_KEYS) {
    if (process.env[key]) {
      overrides[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
  }
  // Build-time diagnostics (visible in Vercel build logs)
  const baseUrl = process.env.MEDPLUM_BASE_URL;
  const envFileExists = existsSync(path.join(__dirname, '.env'));
  const envDefaultsExists = existsSync(envDefaultsPath);
  console.log(`[vite.config] MEDPLUM_BASE_URL from process.env: ${baseUrl ?? '(not set)'}`);
  console.log(`[vite.config] .env exists: ${envFileExists}, .env.defaults exists: ${envDefaultsExists}`);
  console.log(`[vite.config] define overrides applied: ${Object.keys(overrides).join(', ') || '(none)'}`);
  return overrides;
}

export default defineConfig({
  envPrefix: ['MEDPLUM_', 'GOOGLE_', 'RECAPTCHA_'],
  define: envOverrides(),
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
