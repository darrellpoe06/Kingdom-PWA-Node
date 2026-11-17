# DR-1514: The builder says whether it is running

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (one census field, one migration, one reader line; no new road, no new secret)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0327-the-builder-says-whether-it-is-running.sql`, `scripts/served-lesson-queue.py`
**Pairs with:** DR-1511 (the rows are named), DR-0076 §8 (unknown is never zero), DR-0639 (a tag can carry a name), DR-1269 (the keyless replay road), DR-0669 (the NAS lesson builder) · found by the same DR-0108 Ways review as DR-1511 and DR-1513

**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`

## Context

0326 made the public road name the waiting rows. The first live read said six
teachings waited and **three had failed on the NAS lesson builder** — and the
only road to that builder's state was `lesson-builder-status.sh --nas`, ssh
behind a Tailscale key refused since 2026-11-04.

## What was measured

- **A failure count with no service state is not actionable:** `build-failed: 3`
  means one thing under a live builder and another under a dead one.
- **Nothing had to be built to reach it.** The census runs ON the box, so it
  reads four local paths with no key: the unit's systemd word, `.code.sha`, the
  `locks` directory, `status.json`.
- **What must never travel.** A builder's error string can quote the teaching it
  failed on, and this receipt is granted to `anon`; a lock file is named for the
  row it holds.

## Impact

`build-failed: 3` can now be weighed against whether the builder is running,
over the road that needs no key. No new road, credential or grant: an existing
local read is published through the existing receipt.

## Decision

1. **Shape, never prose.** A systemd word from a closed set, a hex sha, small
   counts, and from `status.json` only booleans, small numbers and an ISO-shaped
   stamp. Anything else is dropped **and counted**, so a short answer never
   reads as complete.
2. **The SQL refuses independently of the Python**, as 0326 does: the object is
   rebuilt key by key, so a census that one day carried an error string could
   not publish it.
3. **A lock is counted, never named.** A row the census did not count as
   waiting must not reach the public road by a side path.
4. **Unreadable is `null` with `read:false`, never 0**; ungathered is absent.

## Verification

- 32 Python cases (10 new), 15 reader cases. Proven to catch: one added
  `bl.get('error')` fails the closed-set case **by name**.
- **Applied to a real PostgreSQL 16** with a hostile builder block planted (an
  error string quoting a member, a `last_row_body`, a prose "sha", a lock named
  for a row, a stray `secret`, a systemd sentence). `anon` received **none**,
  the service word read `unknown` not `inactive`, and `anon` was still refused
  the table. Byte-level detail in the note.
- A census with no builder block publishes **no** `builder` key, so absent never reads as healthy.
- **Not claimed:** nothing is exercised on the NAS yet; it arrives by the
  services-sync pull and `replay-on-clock.sh`. `re-review: 2026-11-24`.
