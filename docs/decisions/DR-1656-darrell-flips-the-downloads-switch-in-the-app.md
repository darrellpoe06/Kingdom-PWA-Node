# DR-1656: Darrell flips the downloads switch in the app

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** C (schema: a new table and two functions; Governor-only write)
**Type:** product
**Area:** `infra/supabase/migrations-auto/0344-downloads-open-only-on-darrells-word.sql` (new), `infra/supabase/tests/0344-downloads-switch-smoke.sql` (new), `.github/workflows/rls-isolation.yml`, `app/src/lib/lesson-download-access.js`, `app/src/components/DownloadAccess.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/__tests__/lesson-downloads-are-paid.test.jsx`, `scripts/system-flow-registry.mjs`, `scripts/workflow-budget.json`
**Sent in by:** Darrell, 2026-11-25: "Build the in-app downloads switch now"
**Pairs with:** DR-1655 (downloads are off until Darrell opens them), DR-1652 (PoeTech+ or the pass), 0237 (`is_lesson_governor`)

## Context

DR-1655 closed every download door with one line in the app, and said a switch Darrell flips without a deploy needed a stored setting. He asked for it now.

## What was measured

- On a bare PostgreSQL 16 with 0237's governor functions, 0344 applies twice without error, and the smoke prints `DOWNLOADS SWITCH SMOKE: PASS`.
- Proven to catch: with the Governor check removed from `set_downloads_open`, the smoke fails with `BREACH: a member flipped the downloads switch`; restored, it passes.
- 85 of 85 pass across the six suites that touch downloads.

## Decision

1. **The switch is stored.** `platform_switches` holds one row per platform switch; no policies, so nothing reads or writes it directly.
2. **Everyone reads it, only the Governor writes it.** `downloads_open()` (anon + signed-in) answers the stored value, false with no row. `set_downloads_open(on_in)` refuses anyone but `is_lesson_governor()` with 42501.
3. **The app reads it live, closed until it answers.** Every download door reads one answer; in flight, an error, a timeout or a missing function all read as closed. With it open, the DR-1652 rule decides.
4. **The control sits in Learn > Downloads, shown to the Governor only.** It shows where the switch stands as the database answered, flips it, re-reads, and never claims a flip that did not land.

## Impact

- Darrell opens or closes downloads from his phone with no deploy. Seeded with nothing: closed.
- Until db-migrate applies 0344 on the sovereign database, the read fails and every door stays closed, the same as today.

## Verification after merge

- db-migrate applies 0344; the rls-isolation `downloads-switch` leg prints PASS on the real database.
- Darrell sees "Downloads switch · Governor only" in Learn > Downloads, reading Closed.

`re-review: 2026-12-09`
