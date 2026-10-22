# DR-1214: The build-time manifests are held once — the shell's chunk falls from 24 MB to 2.45 MB

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (build output only; every screen reads the same data it read before)
**Type:** delivery (the deploy lane, DR-0595 / DR-0107)
**Area:**
- `app/vite.config.js` (`define` and `manualChunks`)
- `app/src/lib/build-manifests.js` (new)
- `app/eslint.config.js`
- the 14 files that read a manifest (`GovernanceQueue`, `BuildBoard`, `IntakeOutcomeList`, `Discussions`, `PerpetualReport`, `QualityProof`, `ReviewsPeek`, `ChurchInfraPlan`, `OperationsIntelligence`, `AriReview`, `ConflictLoop`, `FeedbackCenter`, `QualityThroughput`, `lib/feedback-sync.js`)

**Grounds:** #2401 (work order triage, DR-1213) failed `asset-size-guard` with the shell chunk at *"24.03 MiB — at or over the 24.00 MiB limit (Cloudflare Pages refuses files over 25.00 MiB). Split it: see manualChunks"*. Main had measured 23.99 MiB on its last CI build.
**Principles:** VERIFICATION-DOCTRINE (measured on real builds, proven to catch), DETERMINISTIC-FIRST, HOLD-THE-HAND-OF-THE-PROCESS

## Context

The build parses the repo's ledgers and hands them to the app as Vite `define` constants: the decision records, the governance queue, principles, reviews, the quality proof, the interconnect graph, the conflict loop, the test census and the lessons. A `define` is a text replacement, so its whole value is pasted at **every** place its name is written. Thirteen files write `__DR_LEDGER__`, each as `typeof __DR_LEDGER__ !== 'undefined' ? __DR_LEDGER__ : …`.

## What was measured

All on real `vite build`s in one environment, with the same dependencies for each:

- **Main's shell chunk** (`poe-financial-mvp-v28-*.js`) was 25,156,374 bytes. It held **six copies** of the decision ledger at 2,410,878 bytes each, about 14.5 MB of the chunk's 24 MB.
- **Every new decision record** was therefore added six times. Main sat 0.01 MiB under the limit, so the next record from any session would refuse the deploy. #2401's DR-1213 was the one that crossed.
- **Lazy-loading the triage card alone did not help.** The shell chunk stayed at 24.03 MiB with the card in its own 8.5 KB file. The record text was what grew it, not the card.
- **With this change** the shell chunk is 2,565,868 bytes (2.45 MiB). There is exactly one ledger copy across all chunks, in `build-manifests-*.js` (3.35 MiB). `asset-size-guard` passes.

## Impact

- **Unresolved:** every decision record grows the app's first download six times over, the lane goes red at the cap for an unrelated change, and every phone downloads about 21 MB more than it needs to for the main app.
- **The call obligates:** each manifest's JSON appears once in the bundle, in its own file, and every reader of it loads it before reading.

## Decision

- **The JSON, once.** Each manifest's JSON is defined once as `__NAME_DATA__`, and `src/lib/build-manifests.js` assigns it to `globalThis.__PT_NAME`. That module gets its own chunk (`manualChunks`).
- **The names the app reads.** `__DR_LEDGER__` and the rest are now defined as the reference `globalThis.__PT_NAME`, a few bytes at each use. No reader's code changes.
- **The import comes first.** Every file that reads a manifest imports `build-manifests.js` as its first import, so ESM evaluates it before that file's own body, whichever entry loaded it: PoeTech, Poe Properties, TLC, Moore or Love Corner.
- **The tests are unchanged.** There is no build in the tests, so the `_DATA` names do not exist: each assignment throws, is caught, and is skipped. A test sets the global it needs itself, exactly as before. The 47 suites that read these manifests pass.

## Verification

- `the-ledger-is-built-once.test.js`: 5/5. Proven to catch:
  - a name defined as its JSON again
  - a reader that forgot the import
- The 47 suites that read a manifest: 807/807.
- Lint is clean.
- Real builds: the shell chunk went from 25,156,374 bytes to 2,565,868, and ledger copies from 6 to 1. `asset-size-guard` passes.
- Runtime: served in Chromium, the app boots and the manifests are present (recorded in the PR).

`re-review: 2026-11-22`: whether `build-manifests` should load lazily with the Ops surfaces, rather than with the entry.
