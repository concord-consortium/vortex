# Migrate Vortex Firebase Functions from Cloud Runtime Config

**Jira**: https://concord-consortium.atlassian.net/browse/DEV-157

**Status**: **Closed**

## Overview

Migrate the Vortex Firebase Cloud Functions off the deprecated Cloud Runtime Config API (`functions.config()`) and modernize the entire `functions/` toolchain — upgrading from Node 8 to Node 22, updating all dependencies to current major versions, and replacing TSLint with ESLint — before the hard deprecation cutoff on March 31, 2026.

## Requirements

- **R1**: Remove the `functions.config()` call by replacing `admin.initializeApp(functions.config().firebase)` with `admin.initializeApp()`.
- **R2**: Upgrade the Node.js runtime from Node 8 to Node 22 in `functions/package.json` (`engines.node`). (Node 22 is the maximum supported by 1st gen Cloud Functions.)
- **R3**: Upgrade `firebase-functions` from `^3.1.0` to the latest v4+ (or v6 if available and stable).
- **R4**: Upgrade `firebase-admin` from `^8.0.0` to the latest v11+ (or v12/v13 if available and stable).
- **R5**: Upgrade TypeScript from `^3.2.2` to a modern version (v5+).
- **R6**: Replace TSLint with ESLint (TSLint has been deprecated since 2019).
  - Update the `lint` script in `functions/package.json` to run `eslint`.
  - Update `firebase.json` predeploy to run `eslint` instead of `tslint`.
  - Remove `tslint.json` and the `tslint` devDependency.
- **R7**: Remove the deprecated `timestampsInSnapshots` Firestore setting.
- **R8**: Resolve any breaking API changes introduced by the major version bumps (firebase-functions v3→v4+, firebase-admin v8→v11+).
- **R9**: Fix any TypeScript compilation errors that arise from the upgraded TypeScript version and stricter type checking.
- **R10**: All 4 existing Cloud Functions must continue to work with the same HTTP endpoints and request/response contracts.
- **R11**: The migration must be completed and deployed before **March 31, 2026** (hard cutoff for `functions.config()` deprecation).
- **R12**: After deployment, manually verify each of the 4 Cloud Functions responds correctly (smoke test with known inputs/outputs).
- **R13**: Delete and regenerate `functions/package-lock.json` after dependency upgrades to ensure a clean dependency tree.
- **R14**: Add a Cloud Functions section to `README.md` documenting what the functions do, prerequisites (Firebase CLI, project access), and how to deploy.

## Technical Notes

- **Single source file**: All functions live in `functions/src/index.ts` (203 lines). No other source files exist.
- **Dependencies**: `cors@^2.8.5` and `js-base64@^2.5.1` — these may also need minor version bumps but are unlikely to have breaking changes.
- **Firebase project**: `vortex-e5d5d` (from `.firebaserc`).
- **Deployment target**: `us-central1` (implied by hardcoded URL on line 193).
- **`firebase-admin` v11+ changes**: The `admin` namespace import pattern (`import * as admin from "firebase-admin"`) changed in v11+. The modular SDK uses named imports (`import { initializeApp } from "firebase-admin/app"`, `import { getFirestore } from "firebase-admin/firestore"`). However, the v11 compat layer may still support the namespace import pattern.
- **`firebase-functions` v4+ import change (CRITICAL)**: Since September 2024, `import * as functions from "firebase-functions"` defaults to **2nd-gen** functions. For 1st-gen functions, the import **must** change to `import * as functions from "firebase-functions/v1"`. Failing to do this would silently deploy all functions as 2nd-gen, breaking existing endpoints.
- **`err.toString()` patterns**: 6 occurrences (lines 28, 59, 65, 71, 73, 102). In strict TypeScript with modern versions, caught errors are typed as `unknown`, so `.toString()` won't compile without type narrowing or casting.
- **`request.query` types**: 3 destructuring sites (lines 18, 80, 185). With updated `@types/express` (pulled in by newer `firebase-functions`), query parameters are typed as `string | ParsedQs | string[] | ParsedQs[] | undefined` instead of `any`. Line 84 (`src.match(...)`) and line 26 (`Base64.decode(runData)`) won't compile without string assertions.
- **`String.prototype.substr`**: Line 123 uses the deprecated `.substr()` method. Modern TypeScript may flag this; replace with `.substring()`.
- **`cors` import**: `import * as cors from "cors"` works because `@types/cors` uses `export =` and there is no `esModuleInterop` in `tsconfig.json`. If `esModuleInterop` is enabled during the upgrade, this must change to `import cors from "cors"`.
- **`FirebaseFirestore.FieldValue` and `admin.firestore.FieldValue` (REQUIRED)**: In `firebase-admin` v13, both the global `FirebaseFirestore` namespace and `admin.firestore.FieldValue` are removed. Must `import { FieldValue } from "firebase-admin/firestore"` and replace all usages. This affects the `CodeDocument` interface type and both `serverTimestamp()` call sites.
- **`@types/cors`**: Currently `^2.8.6` — may need a version bump alongside other devDependency upgrades.
- **Reference PR**: [report-service#378](https://github.com/concord-consortium/report-service/pull/378) shows a similar migration pattern.

## Out of Scope

- Migrating from v1 HTTP triggers (`functions.https.onRequest`) to v2 triggers (`onRequest` from `firebase-functions/v2/https`).
- Refactoring the Cloud Functions logic (e.g., splitting into multiple files, adding new features).
- Migrating to the modular `firebase-admin` SDK (named imports) — the compat/namespace pattern is acceptable.
- Adding unit or integration tests (none exist currently).
- Upgrading the client-side Vortex application code — this ticket covers only the `functions/` directory.

## Local Emulator Test Plan

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Functions built: `cd functions && npm run build`
3. Java Runtime (required by Firestore emulator): `java -version` to verify

### Running Tests

Start the emulators in one terminal:

```bash
firebase emulators:start --only functions,firestore
```

Then run the automated test script in another terminal:

```bash
./functions/test-emulator.sh
```

The script exercises all 4 Cloud Functions across 8 test groups (18 assertions total):

1. `saveExperimentRun` — save experiment data to Firestore
2. `saveExperimentRun` — save photo data, receive `photo://` URL
3. `getExperimentPhoto` — retrieve photo using URL from test 2
4. `createCodeForExperimentRun` — generate a sharing code
5. `getUrlForExperimentRunCode` — resolve code from test 4 to a URL
6. Error handling — missing/invalid parameters across all functions
7. `errorMessage` helper — invalid base64 triggers error path
8. CORS preflight — verifies `Access-Control-Allow-Origin` header

Tests use a unique run key per invocation and are safe to run multiple times. The Firestore emulator data is ephemeral and cleared when emulators stop.

**Expected output**: `Results: 18 passed, 0 failed`
