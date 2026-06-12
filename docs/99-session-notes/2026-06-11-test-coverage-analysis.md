# Test Coverage Analysis — 2026-06-11

Layer 4 working artifact. A survey of what is and is not tested across the
repository, plus a prioritized proposal list for improving tests and
workflows. No code changes ship with this note; it is the audit that feeds
the next build.

## 1. Current state

### 1.1 PWA (`app/`)

- **4 test files, 25 tests**, all under `app/src/__tests__/`, all targeting
  pure financial calcs from the Pass 2 financial-accuracy audit
  (`docs/05-financial-os/CALC-INVENTORY.md`):
  - `frequencyToMonthly.test.js` — C10, all frequency branches.
  - `projectDebt.basic.test.js` — C1 basics + avalanche allocation.
  - `flag-10-incidents-reserves.test.js` — the FLAG-10 contract
    (incidents contribute 0 to monthly reserves).
  - `flag-11-practice-annual-revenue.test.js` — the FLAG-11 fix.
- Vitest is configured (`app/vitest.config.js`, jsdom environment) and the
  `test` / `test:run` scripts exist in `app/package.json`.

### 1.2 The headline finding: the suite is broken on a clean checkout

On a fresh clone with no `app/.env.local`, **all 4 test files fail at
collection and 0 tests run**:

```
Error: supabaseUrl is required.
  src/lib/supabase.js:40
```

The chain: every test imports from `src/lib/financial-calcs.js`, which
re-exports the calc functions from the 7,616-line
`poe-financial-mvp-v28.jsx` monolith; that file's import graph reaches
`src/lib/supabase.js`, which calls `createClient(...)` at module load with
the `VITE_SUPABASE_*` env vars. Missing env = throw = no tests anywhere.

Verified both directions on this clean container:

- `npx vitest run` → 4 files failed, "no tests".
- `VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npx vitest run` →
  **25/25 pass**.

So the tests themselves are sound; the suite only runs on a machine that
happens to have `.env.local`. Any CI, any remote session, any new family
machine gets a red suite out of the box. The vitest config's own comment
already names the cure ("a future refactor will extract the calc functions
out of the MVP file entirely into a standalone module with zero React
imports") — that refactor is now load-bearing, not cosmetic.

### 1.3 No CI at all

There is **no `.github/workflows/` directory**. Nothing runs `npm run
lint` or `vitest run` on a PR or on push to `main`. The lint script exists
but is manual-only. Vercel builds the app (`vite build`) but a build is not
a test gate — the broken-on-clean-checkout suite above is exactly the kind
of thing CI would have surfaced the day it regressed.

This also leaves RELEASE-TIERS.md without a mechanical floor: Tier A's
"documented bug fix" and the six low-risk tests are honor-system today.

### 1.4 n8n workflows (`docs/00-foundations/n8n-workflows/`)

- **39 workflow JSONs; exactly 1 has a test harness** —
  `scripts/test-wf36-quality-gatekeeper.js`, which reads the live jsCode
  out of the workflow JSON, runs it in a `vm` sandbox with a stubbed
  `$input` and in-memory fs, and asserts 6 binding scenarios. This is a
  good, dependency-free pattern — and even it is run only by hand.
- `PERPETUAL-PIPELINE-HEALTH.md` rule 9 mandates tests per workflow.
  Current score: 1/39.

### 1.5 Backend voice-worker (`backend/voice-worker/`)

Zero tests, no test script in `package.json`. It receives Twilio webhooks
(external, unauthenticated-by-default input) — the highest-value untested
parsing/auth surface outside the PWA.

### 1.6 Components and regression history

Zero component tests. The 2026-06-03 incident in `LESSONS-LEARNED.md`
(real ops data leaked to poetech.us via localStorage hydration running
independent of the `importedAllowed` gate) is precisely the class of bug a
hydration-gate regression test would have caught — and nothing today would
catch its recurrence.

### 1.7 Calc engines still uncovered

`CALC-INVENTORY.md` marks most engines UNVERIFIED with open flags.
Exported and importable but untested: `projectDebtSnowball` (FLAG-1/2),
`projectDebtMinimumOnly` (FLAG-1/3), `projectRentalSnowball` (FLAG-2/4),
`findExtraForTarget` (FLAG-5). The sync libs (`table-sync.js`,
`feedback-sync.js`, `n8n-base.js`, etc.) and the service worker are also
untested.

## 2. Proposals, prioritized

### P1 — Make the suite run on a clean checkout (Tier A, small)

Two complementary moves, in order of durability:

1. **Short-term unblock:** have `vitest.config.js` `define` stub values for
   `import.meta.env.VITE_SUPABASE_*` (or alias `src/lib/supabase.js` to a
   test mock). One-file change; the suite goes green everywhere today.
2. **Durable fix:** complete the extraction the vitest config already
   promises — move the six calc engines out of
   `poe-financial-mvp-v28.jsx` into `financial-calcs.js` proper (zero
   React, zero supabase imports), flip vitest back to `environment:
   'node'`. This also chips at the 7,616-line monolith.

### P2 — Add CI (Tier A for the workflow file itself)

A single GitHub Actions workflow on PR + push to `main`:

- `npm ci && npm run lint && npx vitest run` in `app/`.
- `node scripts/test-wf36-quality-gatekeeper.js` (already dependency-free).

This gives RELEASE-TIERS a mechanical floor: nothing merges with a red
suite, regardless of tier. (P1 step 1 is a prerequisite — CI on today's
suite would be red on arrival.)

### P3 — Cover the remaining calc engines (pairs with the FLAG fixes)

Per the established lockstep rule (tests update with FLAG fixes): basic
correctness + edge tests for `projectDebtSnowball`,
`projectDebtMinimumOnly` (stuck detector, FLAG-3 plateau case),
`projectRentalSnowball` (sort orders incl. `best-cashflow`, FLAG-4), and
`findExtraForTarget` (FLAG-5 sort mismatch). These are the engines the
family's real money decisions ride on; they are pure functions and cheap
to test once P1 lands.

### P4 — Regression tests from LESSONS-LEARNED

- **localStorage hydration gate:** assert that on a public-origin load the
  seed data is not overwritten by stored ops data (the 2026-06-03 leak).
- **SW version stamping:** assert the build output's `sw.js` no longer
  contains the `__SW_VERSION__` placeholder (forward fix #4).

LESSONS-LEARNED exists so prior failures don't recur; encoding each entry's
forward fix as a test is the mechanical version of "read this before
designing new surfaces."

### P5 — Static conformance checks on the 39 workflow JSONs

Most PERPETUAL-PIPELINE-HEALTH rules are machine-checkable against the
JSON: webhook workflows carry bearer auth, error paths exist, persistence
paths are under bind mounts, and — per the 2026-06-08 three-brakes rule —
any timer-driven workflow declares a budget, a concurrency lock, and a
kill-switch. A single Node script in `scripts/` (same zero-dependency style
as the wf36 harness) run in CI turns those foundations from prose into
gates.

### P6 — Extend the wf36 vm-sandbox harness to the next high-value workflows

Candidates in order: wf18 (bearer guard — auth logic), wf16 (cross-verify
engine — financial correctness), wf12 (network health probe), wf27/wf31
(the continuous-feedback pair that featured in the 2026-06-06 runaway).

### P7 — Voice-worker tests

Unit tests for Twilio webhook parsing, signature/auth validation, and D1
row shaping (wrangler's vitest pool, or plain unit tests on extracted pure
functions). External-input surfaces should not be the least-tested code.

### P8 — Component smoke tests (lowest priority)

React Testing Library smoke tests for `ErrorBoundary`, `AuthBanner`, and
`InputCenter` render paths. Worth having, but P1–P5 buy far more safety
per hour.

## 3. Suggested sequencing

P1.1 + P2 are an afternoon and change the repo's posture from "tests exist
on one machine" to "tests gate every merge." P3 and P4 ride the existing
audit cadence. P5 converts the foundation docs into enforcement. P1.2 (the
monolith extraction) is the one structural item and can proceed
incrementally behind the green suite.
