# DR-0163 — The gate tests a BOOTABLE build, a blank page never passes, and a stalled boot frees the waiting worker

- **Status:** accepted
- **Tier:** A shipped through the lane (gate correctness + a bounded boot-chain heal; the CI change touches the required job's env only — proven both directions before shipping)
- **Scope:** `.github/workflows/ci.yml` (stub env on the gate build), `scripts/sw-nav-check.mjs` (positive mount proof), `app/public/watchdog.js` (free-the-waiting-worker), incident: Darrell "PoeTech is down" 2026-07-10 ~16:45Z
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 — a gate that can pass vacuously is itself a lie), SPEAK-ESTABLISHED-FACT (DR-0100), DR-0107 (a down site outranks everything), LESSONS P33

## What was found (measured, in order)

Darrell reported the app down (blank at `?view=church&sub=…` on his installed phone) while PR #760's CI failed the new sw-nav gate at the same URL. Diagnosis separated three defects that were wearing one symptom:

1. **CI's gate was testing a build that could never boot.** The required job's `npm run build` ran with NO env, so `lib/supabase.js` inlined `undefined` into `createClient`, which THROWS at module scope — every gate run was judging the heal ladder's recovery screen, not the worker. Proven locally: the same commit fails the gate env-less and passes it with the vitest stub values.
2. **The gate had a false-green mode — and one CI run used it.** "Status 200 + no fail-marker" also describes a BLANK page: the heal ladder's 800ms pre-reload beat has an empty body. Run 29106558881 (b020f25, 16:12Z) passed exactly that way; the three honest runs around it failed. A blank instant beat the camera.
3. **Darrell's device is in the pinned-device trap** (the morning's #750 worker, reverted 14:01Z in #757): the broken worker serves a blank-but-live page; that live client blocks the FIXED worker (waiting) from activating; the in-bundle update tap can never render because the bundle can never run. The live domain measured green the whole time (site-health 16:52Z success; verify-boot's controlled pass green) — fresh visitors fine, pinned devices down, exactly P33's shape.

## Decision

1. **The gate build gets the vitest stub env** (`https://test-stub.supabase.co` / `test-stub-anon-key` — the same non-secret values `vitest.config.js` has always stubbed, same rationale: the gate tests the WORKER and the boot chain, not Supabase). The dist under test can now actually boot.
2. **The gate requires a POSITIVE mount** — real rendered text (≥400 chars) or the access gate's own markers (`CREATE PROFILE & ENTER` / `Welcome back`, the #715 lesson) within 20s. No fail-marker + 200 + blank = FAIL with the body's first bytes in the message. Proven both directions before shipping: env-less build → FAIL loudly; stub-env build → `OK … serves AND mounts`.
3. **`watchdog.js` frees a waiting worker on a stalled boot.** The watchdog lives OUTSIDE the bundle at a stable path, so it runs even when nothing else can; if `__PT_BOOTED` never appears and a waiting (fixed) worker exists, it posts `SKIP_WAITING` (which sw.js already honors) before its single bounded retry — the retry then navigates under the fixed worker. This closes the trap CLASS for every future shell; it cannot reach devices whose cached shell predates the watchdog (2026-07-10 morning installs), which recover by a full app close + reopen (or site-data clear).

## Routed

- **The pinned fleet question** — how many family devices still hold the #750-era worker, and whether sw.js should self-expire a known-broken predecessor — belongs to the worker lane (DR-0160's `re-review: 2026-07-17`, unchanged).
- **CI env mystery closed as instrument defect**, recorded in LESSONS: the "passing" gate run that let the lane keep moving was the false-green, not a working build.

## Supersedes / pairs

Sharpens DR-0160 (the gate keeps its job; now it cannot pass vacuously and tests a bootable artifact). Pairs with DR-0076 §3 (proven-to-catch is demonstrated for the FIX too), P31/P33, DR-0155 (serve-side), DR-0157/#757 (worker-side history). No supersession.
