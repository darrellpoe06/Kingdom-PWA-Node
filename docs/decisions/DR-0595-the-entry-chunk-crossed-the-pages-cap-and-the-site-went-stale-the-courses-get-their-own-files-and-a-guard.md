# DR-0595 — The entry chunk crossed Cloudflare's 25 MiB cap and the site went stale: the course libraries get their own files, and a proven-to-catch asset-size guard runs before every merge and every deploy

- **Status:** accepted
- **Tier:** C (touches the deploy lane's judgement of a build; shipped only with the deploy proven per DR-0107)
- **Type:** fix (post-incident)
- **Date:** 2026-09-23
- **Scope:** `app/vite.config.js` (manualChunks: `living-lessons-class.js` → its own chunk; every other `*-course.js` / `*-class.js` / `*-study.js` library → `learn-courses`); `scripts/asset-size-guard.mjs` (new, with `--selftest`); `.github/workflows/ci.yml` (selftest + guard on the real dist after the build); `.github/workflows/deploy-cloudflare-pages.yml` (guard before the Pages project step)
- **Principles:** A-DOWN-SITE-IS-THE-WORST-OUTCOME (DR-0107), THE-SITE-HAS-ITS-OWN-WITNESS (DR-0125), VERIFICATION-DOCTRINE (DR-0076 §2 gates over claims, §3 proven-to-catch), MEASURE-DONT-CLAIM (DR-0076 §4)
- **Grounds:** the deploy run for main's merge commit `6f503a8` (run 35935020945, 23:43Z) failed at wrangler: *"Error: Pages only supports files up to 25 MiB in size — assets/poe-financial-mvp-v28-Deo4BFVC.js is 26.1 MiB in size"*. CI on the same commit was green (run 35933674465). Every gate before the deploy measured tests, lint, layout and boot — none measured a built file's size.

## Context

PR #1756 (DR-0587 / DR-0588 / DR-0589, plus the 1619 course of DR-0590, the Owed fix of DR-0592 and the Taxes work of DR-0593) squash-merged at 23:43:36Z. The auto-merge lane dispatched the deploy as designed. The build succeeded; the upload was refused because one file was over Cloudflare Pages' hard per-file limit. The live site kept serving the build before the merge — the exact LESSONS P25 shape (CI-green is not deployed), caught this time within minutes because the merge's deploy was read as DR-0107 requires, not because anything in the lane said so.

## What was measured

| what | measured |
| --- | --- |
| the refused file | `assets/poe-financial-mvp-v28-*.js`, 26.1 MiB on the runner (wrangler); 26.02 MiB in the local stub build of the same tree |
| where the bytes are | the course libraries: `src/lib/living-lessons-class.js` is 11,453,195 bytes of source alone; the fifty-odd other course/class/study libraries total ~13.7 MB; the build-time defines add 1,839,341 bytes, of which `__DR_LEDGER__` is 997,475 (the DR-0588 chain text for the newest forty records) and `__UIUX_REVIEWS__` 729,152 |
| what pushed it over | the entry chunk had been growing with every course and lesson; #1756 added the chain-text ledger (~0.5 MB inlined) and the 1619 course (133 KB source); the previous deploy (L190's, DR-0104-reviewed) was under the cap |
| after the split (local stub build, same tree + the Business Research course) | entry chunk 9.69 MiB; `living-lessons` 10.64 MiB; `learn-courses` 5.95 MiB; largest other file 1.67 MiB; 600 files, none within 1 MiB of the cap |
| the split build boots | Chromium against `vite preview` on a 412-px viewport: build stamp present, 10,127 chars of body text, both new chunks loaded with the entry, zero page errors; the only failed requests were the sandbox's own (stub Supabase, Google Fonts, the Cloudflare trace) |
| the guard catches | `--selftest`: refuses a file exactly at the 24 MiB limit and a 26.1 MiB incident-sized file; passes one byte under; run on the real dist: PASS |

## Impact

Until the fix lands, poetech.us serves the build before #1756: the family and COLG do not see the Owed fix, the Taxes key state, the 1619 course or the Governance chain. Nothing is broken on the served build; it is stale, which DR-0107 names the worst outcome. After the fix, each course library is its own file: the entry chunk stops growing with every lesson, and a course can be added for years before any file approaches the cap. Load order is unchanged — index.html and the entry chunk import the same modules eagerly; the browser fetches three large files instead of one. The cost is one more step in ci.yml and one in the deploy workflow, each a few hundred milliseconds.

## Decision

1. `living-lessons-class.js` is built into its own chunk and every other `*-course.js` / `*-class.js` / `*-study.js` library under `src/lib/` into `learn-courses`, by rule in `manualChunks`, so the split is automatic for every course that follows.
2. `scripts/asset-size-guard.mjs` fails when any built file is within 1 MiB of the 25 MiB cap. It runs on the real dist in `ci.yml` right after the build (with its selftest first, DR-0076 §3) and in the deploy workflow before the Pages project step, so a refused file is named in plain words before wrangler is reached.
3. Per DR-0107 this change is not done at merge: the merge's own deploy run must succeed and the served build must advance to main's tip; that proof is recorded on the PR.
4. The defines that inline the decision ledger and the UI/UX reviews (1.7 MB together) are the next growth to move out of the entry chunk; tracked here with a re-review date rather than widened into this fix.

## Verification

- `node scripts/asset-size-guard.mjs --selftest` — PASS (refuses at-limit and 26.1 MiB; passes one byte under); `node scripts/asset-size-guard.mjs app/dist` — PASS on the split build.
- Local stub build sizes and the Chromium boot probe as measured above.
- After merge: the deploy run on the merge commit succeeds; `deploy-freshness` / `site-health` read the served build's stamp equal to main's tip; DR-0104 live review of Books → Owed, Books → Taxes, Projects → Governance and Church → Learn on the served build.
- re-review: 2026-10-07 — move `__DR_LEDGER__` and `__UIUX_REVIEWS__` out of the entry chunk (a fetched JSON or a lazy chunk), and read the guard's largest-file line on the latest deploy to see how much headroom the entry chunk has left.

## Measured after merge (2026-09-24, appended per DR-0107)

| what | measured |
| --- | --- |
| merge | PR #1757 squash-merged at 00:26:42Z as `4bcaa14` on main |
| the deploy the lane dispatched | run 35938478450 on `4bcaa14`: build 30 s; **asset-size guard PASS on the production dist** (step 8, 00:28:03Z); wrangler uploaded 597 files and answered "Deployment complete" at 00:28:23Z; the boot-check job booted the domain, the pages.dev origin, the Moore door and the Church tab in a real browser — BOOT OK ×4 at 00:28:48–51Z; run conclusion `success` at 00:28:53Z |
| the site's own witness | site-health run 35938587332 (dispatched 00:28:38Z): **UP. Fresh.** served build `4bcaa14` · main tip `4bcaa14`; pages.dev shell 200; sovereign auth transport 200; the open `incident`-labeled issue from the stale window was closed by the probe with "RECOVERED: probe green (served build 4bcaa14)"; the rolling run log carries the line on issue #1693 |
| stale window | from the refused deploy at 23:45:01Z (run 35935020945) to the accepted one at 00:28:23Z: 43 minutes serving the pre-#1756 build; the second refused attempt (deploy-freshness heal, run 35936279199, 00:00:46Z) is on the record too |
| carried, not this fix's | the probe's order-path selfcheck on the sovereign backend answered "Invalid authentication credentials" (its own note: RPC absent on that backend or anon-key mismatch) and is marked NOT MEASURED with a warning, not a failure; it belongs to the sovereign-parity thread (DR-0582/DR-0583) and is read at the next nas-health check-in |
