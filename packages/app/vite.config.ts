// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
/// <reference types="vite/client" />
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { copyFileSync, existsSync, readFileSync } from 'fs';
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

/**
 * The gateway a production build is allowed to talk to.
 *
 * Hardcoded on purpose. The whole point of the check below is to catch the case where
 * configuration is wrong, so it cannot read the expected value from configuration.
 */
const PRODUCTION_GATEWAY_HOST = 'authb2c.healthtalk.ai';

/** Read one key out of a dotenv-style file, without pulling in a parser. */
function readEnvFileValue(file: string, key: string): string | undefined {
  if (!existsSync(file)) {
    return undefined;
  }
  for (const line of readFileSync(file, 'utf-8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match && match[1] === key) {
      return match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}

/**
 * Refuse to build a production bundle that points at a non-production gateway.
 *
 * WHY THIS EXISTS
 *
 * On 2026-10-15 fhir.healthtalk.ai shipped a build whose gateway was authb2c-tst and whose FHIR
 * slug was fhir-api-tst. Sign-in broke: the production app asked the TEST gateway to validate a
 * production session, and got 401s and CORS failures.
 *
 * Nothing about that was visible. Two things had to be true at once, and both looked harmless:
 *
 *  1. turbo.json declared no `env`, and turbo's strict env mode strips undeclared variables, so
 *     the Vercel dashboard values never reached `vite build` at all. Vercel printed a warning and
 *     the build succeeded. The dashboard was correct the whole time and had no effect -- which
 *     also meant .env.defaults, nominally a local-dev convenience, was the real production config.
 *  2. A routine `test` -> `main` merge (#133) overwrote main's .env.defaults with the test copy.
 *     Both files were valid and internally consistent -- test gateway, test FHIR server, test slug
 *     -- so a consistency check could not tell anything was wrong. Only the branch it landed on
 *     made it wrong.
 *
 * turbo.json is fixed and the two branches now carry the same .env.defaults so a merge cannot flip
 * it again. This check is the backstop for whatever we have not thought of: a production build
 * that resolves to the wrong gateway fails here, loudly, instead of shipping and breaking sign-in.
 */
function assertProductionBuildTargetsProduction(): void {
  if (process.env.VERCEL_ENV !== 'production') {
    return;
  }

  // Same precedence the app ends up with: process.env wins via `define`, otherwise Vite loads
  // .env, which is .env.defaults when the copy above ran.
  const gatewayUrl =
    process.env.MEDPLUM_GATEWAY_URL ??
    readEnvFileValue(path.join(__dirname, '.env'), 'MEDPLUM_GATEWAY_URL') ??
    readEnvFileValue(envDefaultsPath, 'MEDPLUM_GATEWAY_URL');

  if (!gatewayUrl) {
    throw new Error(
      'Production build: MEDPLUM_GATEWAY_URL is not set anywhere. Set it on the Vercel project ' +
        'and make sure it is listed in turbo.json globalEnv, or the build cannot see it.'
    );
  }

  const host = new URL(gatewayUrl).hostname;
  if (host !== PRODUCTION_GATEWAY_HOST) {
    throw new Error(
      `Production build is pointed at the gateway "${host}", not "${PRODUCTION_GATEWAY_HOST}". ` +
        'Refusing to build: this ships a production app that signs users in against another ' +
        'environment. Check MEDPLUM_GATEWAY_URL on the Vercel project, that turbo.json globalEnv ' +
        'lists it, and that packages/app/.env.defaults has not been overwritten by a branch merge.'
    );
  }
}

assertProductionBuildTargetsProduction();

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
  'MEDPLUM_DIRECT_BASE_URL',
  'MEDPLUM_AWS_TEXTRACT_ENABLED', 'MEDPLUM_GATEWAY_URL', 'MEDPLUM_GATEWAY_TENANT_ID',
  'MEDPLUM_GATEWAY_ENABLED', 'MEDPLUM_GATEWAY_SERVICE_NAME',
  'GOOGLE_CLIENT_ID', 'GOOGLE_AUTH_ORIGINS', 'RECAPTCHA_SITE_KEY',
] as const;

function envOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const key of ENV_OVERRIDE_KEYS) {
    if (process.env[key]) {
      overrides[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
  }
  // Always set app name to HealthTalk
  overrides['import.meta.env.MEDPLUM_APP_NAME'] = JSON.stringify('HealthTalk');
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
