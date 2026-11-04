// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Stands in for an imported asset under Jest.
 *
 * Vite resolves `import logo from './x.png'` to a URL string. Jest has no such loader, so it
 * handed the PNG to babel-jest and tried to parse it as JavaScript:
 *
 *   SyntaxError: packages/app/src/assets/healthtalk-logo.png: Unexpected character '?'. (1:0)
 *
 * The failure was not confined to the importing file. HealthTalkLogo and SignInPage import the
 * logo, almost every page reaches one of them, and a module that throws while loading fails the
 * whole suite -- so one unparsable PNG took out 60 of 64 suites in this package.
 *
 * The export is a string because that is what the real import evaluates to: components use it as
 * an `src`, so a string keeps assertions about `src` meaningful rather than yielding `undefined`.
 *
 * Lives in `src` alongside test.setup.ts, the package's other Jest-only file. Outside `src` it
 * would sit beyond the TypeScript project and the lint config that go with it.
 */
export default 'test-file-stub';
