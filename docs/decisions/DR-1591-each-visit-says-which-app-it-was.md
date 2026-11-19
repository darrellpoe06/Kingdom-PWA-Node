# DR-1591: Each visit says which app it was

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (additive schema: one nullable column, one governor-only read; the Signups screen gains a line)
**Type:** feature
**Area:** `usage_events` (0339), `app/src/lib/usage-events.js`, `app/src/lib/person-onboarding.js`, `app/src/main.jsx`, Admin > Users & usage > Signups
**Pairs with:** DR-0843 (0259, when and by whom), DR-0840 (per-person usage), DR-1075 (our probe is not a person), DR-0076 (no painted numbers), DR-1592 (did they get in, and who needs help)

## Context

Darrell, 2026-11-19, on Admin > Users & usage > Signups: "How do I know who signed up and if and when they got in? Coreyon is supposed to be using the Poe Properties App... he may also want the Love Corner App... as well as the PoeTech App... how do I know?" Then: "Not wanting to lose functions just gain an easy-to-use one."

## What was measured

| question | answer, from the code |
| --- | --- |
| what a usage row holds | `usage_events` (0073): owner, kind (`view`, `use` since 0253), name (tab id), at. No app. |
| which apps exist | `app-doors.js` `DOORS`: poetech, lovecorner, moore, tlc, properties; `currentDoor(pathname, search)` says which one a page booted as |
| does the Poe Properties app write usage | no. `main.jsx` boots `/properties/app/` straight into `PropertiesDoor`, never the shell, and only the shell calls `recordView` (`poe-financial-mvp-v28.jsx:1026`) |
| who can read another person's usage today | `user_usage_metrics` (0145) only for a steward of a shared space, so a person with no space is unreadable |

## Decision

1. `usage_events.door` (nullable, a short lowercase key, checked). Every `view` and `use` row now carries `currentDoor(location).key`.
2. One `kind='door'` row per signed-in person per page load, written when a member door boots with a session or when someone signs in inside it (`noteDoorOpen`, called for the shell boot and the Poe Properties boot). Nothing that counts tabs reads it: `usage_flow_metrics` reads `view`, and the When & by whom calendar drops `door` in `usage-calendar.js`.
3. `admin_person_doors()`, poe-family only: per person, each door with first time, last time and count; rows from before the column counted apart; `door_tracking_since`. It includes people with no space.
4. Each Signups row adds one line: `Apps: PoeTech: … · The Love Corner: never · Poe Properties: first 3d ago, last yesterday`, with earlier visits said as "app not recorded". One note under the list says what "never" means and from which date. If the read fails, the note says why and no row says "never".

Nothing is removed: every chip, the sort, Mask emails, Refresh, Add to a space and Usage are pinned by a test.

## Safety on the way in

A build can reach a person before the lane applies 0339. The insert carries the door; on the one error that names the missing column, the row is written again without it and the page stops sending a door. A test proves the row is not lost.

## Verification

- `infra/supabase/tests/0339-person-doors-smoke.sql` on PostgreSQL 16 in this sandbox, after 0339 applied twice: PERSON DOORS SMOKE: PASS. Proven to catch: with EXECUTE granted to anon it fails; with the untagged rows dropped from the read it fails on the person whose only rows are old; restored, it passes.
- `which-app-each-person-opened.test.jsx`: 8 cases, including the missing-column fallback, once-per-person door rows, the calendar not counting door rows, and every existing chip and button still rendering.
- Not verified against the live database from here: the sandbox has no route to the NAS. After merge, the lane's `db-migrate` run and the `person-doors` isolation leg are the receipts.

## Not done

The smoke runs as the `person-doors` leg of `rls-isolation.yml` (one matrix row, no job logic changed), against the real database in a rolled-back transaction, after each migration apply and daily. Reading the live screen after the first door rows land is the next look. `re-review: 2026-11-26`.
