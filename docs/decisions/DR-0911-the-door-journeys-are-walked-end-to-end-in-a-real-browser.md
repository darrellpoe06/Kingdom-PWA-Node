# DR-0911 — The door journeys are walked end to end, in a real browser, on every push

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: CI (`ci.yml` job `door-journeys`), `scripts/e2e/door-journeys.mjs`, `scripts/e2e/build-door-db.sh`
**Principle:** DR-0076 (no claim without evidence; proven to catch), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0061 (a surface is a live view of real state)

## Context

Darrell, 2026-10-10, after a day of Poe Properties work (DR-0903 to DR-0910: money on the door, cameras by request, branded pictures, the booking calendar, the street kept off the public page):

> "End to end testing..."

**SHOULD.** What a person does in the app is proven the way they do it: on the built app, in a browser, against a real database, with the database read afterwards to prove the screen told the truth.

**ARE (before this record).** Every proof stopped short of the whole:
- the SQL smokes prove the walls on a real database, with no app;
- vitest proves the screens against a mocked `cloud.js`;
- the rls-isolation leg proves the walls on the live database, with no app;
- `scripts/device-link-e2e.mjs` (DR-0658) walked one journey end to end, run by hand, never in CI.

Nothing proved that a screen, its query and its policy work together.

## What was measured

Building the harness found three real gaps before any journey ran:

- **The entry.** `/properties/app/` alone boots the PoeTech family landing, not Poe Properties. The face is chosen by `?properties=1` (`app/src/main.jsx:287`, and the manifest's `start_url`), so the harness opens `/properties/app/?properties=1`, exactly what the installed app opens.
- **The base.** The built page loads its scripts from `/poetech-app/assets/...` (vite `base`). The first gateway answered those with HTML, and the app died with "Expected a JavaScript module script". The gateway now serves `dist` at `/poetech-app/`, as Pages does, and returns 404 for a missing asset, never the page.
- **The grants.** On a database built without production's default privileges, every family read failed: `permission denied for table rentals`. The page said so honestly ("Your properties could not be reached... What the database said: ..."). Production grants the API roles at creation time and lets each migration's REVOKE narrow that (`infra/nas-supabase/replay_migrations.sh`). `build-door-db.sh` does the same thing in the same order: default privileges first, then the chain. A blanket grant after the chain would undo the migrations' REVOKEs.

The first local run of the finished harness, on a database built only by `build-door-db.sh` (56 public tables; 0260 to 0269 each applied twice):

```
✔ A1 the public door lists the short-stay place, without its street
✔ A2 the short form books two nights, both attestations given
✔ B1 the family sees the door with its full address
✔ B2 the family confirms the ask in the Stays tab
✔ D1 the family records a payment received on a door with no tenant
✔ C1 the booked nights are dark for the next guest
door-journeys: 6 of 6 steps passed
```

**Found by the journeys, the first time E1 ran: the board went dead after any save.** `PropertiesApp` wrote a timestamp into `busy` on every `refresh()`, and nothing ever cleared it. Five tabs read `Boolean(busy)`: the doors board, Rooms, Pictures, Files and Systems. So after the first save that refreshed (recording a payment, moving a work order, editing a door), every Edit, arrange and listing button on those tabs stayed greyed out until a reload. The bug came in with #2043.
- **The screenshot** `E1-FAILED.png` shows the door card's EDIT button disabled.
- **The fix:** the reload is a counter (`reloadKey`), and the five props are gone; each child already holds its own state during its own save.
- **The pin:** `the-door-keeps-its-money` records a payment, opens Doors and requires Edit to be enabled. With the fix reverted it fails; with the fix it passes.

## Impact

A change that breaks a journey anywhere along the path now turns the required check red before it merges. That covers the screen, the query, PostgREST, the policy, the trigger and the function. The 2026-10-10 "address shows while it says it will not" class (DR-0910) is now caught in the browser on every push, not only by a unit test and a smoke.

## Decision

1. **The journeys** (`scripts/e2e/door-journeys.mjs`). Real Chromium (the runner's Chrome, via `playwright-core`), the real `vite build`, PostgREST 12.2.12 (production's version), and PostgreSQL. After each step the harness reads the database:
   - **A1.** A stranger opens "Looking for a place". The short-stay door is listed with no street, even though the door is set to `public`.
   - **A2.** The stranger books two nights with both attestations. The row reads `requested|true|true|Coffee|false`: offers by email stay off unless the guest ticked them.
   - **B1.** The family sees the full street.
   - **B2.** The family confirms in Stays. The row reads `confirmed`, and the clock reads `asked,confirmed`.
   - **D1.** The family records $300 cash on the door with no tenant. The row reads `tenancy_id` none, the door, 300.00, cash. `door_money_months` reads 300.00.
   - **C1.** The next stranger finds those nights dark (`data-taken="yes"`).
   - **E1 and C2** (added with DR-0912). The family sets the door's area in the real editor; the database keeps only `40.12500,-88.26000`. The next stranger sees the map and "University of Illinois Main Quad about 2.0 mi", and the page source holds neither the street nor the exact point. Map tiles are answered by the harness, so a run never calls OpenStreetMap.
2. **What is stood in: sign-in only.** The harness mints the same HS256 JWT production's auth server issues, with a throwaway secret, and answers `GET /auth/v1/user` from it. Nothing else is mocked.
3. **The database** (`scripts/e2e/build-door-db.sh`). It is built from the real schema files and migrations, in replay order, on `postgres:16`. It shares `door-work-ci-bootstrap.sql` (roles, `auth.users`, `auth.uid()`) with the door-work leg. It refuses a hosted URL and needs no secret, so it runs on any PR.
4. **Proven to catch, every run.** `--break=<name>` installs one fault, requires its step to fail, then restores by re-applying the owning migration:
   - `street`: the 0158 rule returns → A1 fails;
   - `confirm`: the family loses UPDATE on stays → B2 fails;
   - `payment`: a tenancy is required again → D1 fails;
   - `calendar`: booked nights come back empty → C1 fails;
   - `area` (with DR-0912): the database refuses every area → E1 fails.
5. **It is a required leg.** `door-journeys` joins the `needs` of "app — lint + vitest". Screenshots upload as the `door-journeys-screens` artifact. A failing step prints the page's own text, its console errors and its failed requests, so the red step names its cause.
6. **Not done here, with a date.** The schema is the repo's chain, not a dump of the live database; the live schema is proven by the rls-isolation leg.
   - A live-schema mode (`pg_dump --schema-only` through the same secret, the way the sovereign replay builds its baseline) and the next journeys are tracked here. The next journeys: a worker asks for the porch camera and the family gives it; a work order with required proof is refused "Fixed" until the pictures are on it; a tenant reports a payment and the family confirms it.
   - **re-review: 2026-10-24.**

## Verification

- Local, on a fresh database built only by `build-door-db.sh`: 6 of 6 steps pass, as shown above. With DR-0912 and the busy fix: 8 of 8 pass, and all five faults are CAUGHT.
- CI, the first real run: on 44503233f the `door-journeys` leg passed (job 114304519114), with the journeys and all four faults caught on the runner's Chrome.
- Proven to catch, local, each fault on the same database, each restored afterwards (the clean run passes 6 of 6 after all four):
  - `street` → `✘ A1 ... the street "805 North Prospect Avenue" is on the public page (DR-0910 says never)` → CAUGHT
  - `confirm` → `✘ B2 ... timed out waiting for the stay to read confirmed in the database` → CAUGHT
  - `payment` → `✘ D1 ... locator.waitFor: Timeout` (the "Recorded" line never appeared) → CAUGHT
  - `calendar` → `✘ C1 ... timed out waiting for the night of <IN> to show taken` → CAUGHT
- The screenshots were read, not assumed:
  - **A1:** the card shows "Champaign, Illinois", "$150/night" and "The exact address is given by a person". No street.
  - **B2:** the Stays desk shows "Coming up (1)", the guest's two nights, and "Confirmed Ana Guest. Send them the address and check-in steps."
  - **C1:** the two nights are struck through in the calendar.
- PostgREST 12.2.12 is downloaded from its GitHub release and checked against sha256 `5de4092f1719da3353c40bf96c8dec6913f2254a7cd0b61cc05f233153b557d5`. That checksum was measured on the same tarball the local runs used.
