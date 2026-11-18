# DR-1511: The house says WHICH teachings wait, by name, without the key

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (additive receipt field + an RPC key, both refusing by whitelist; no new route, no new secret, no money)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py` (`waiting`), `infra/supabase/migrations-auto/0326-the-house-says-which-teachings-wait-by-name.sql`, `scripts/served-lesson-queue.py` (names the rows, reports a count/named mismatch), `infra/nas-loops/test_lesson_queue_census.py` (+5 cases)
**Pairs with:** DR-1269 (the NAS applies migrations on its own clock), DR-1360/DR-1431 (the census and the second road), DR-1250 (the already-shipped sweep takes row ids), DR-0639 (a member's name), DR-0076 §8 (a listing is not a verification)
**Corrects:** DR-1507's closing claim that both roads to naming the rows were blocked by the Tailscale key

## Context

Darrell, 2026-11-17, on being told the queue was blocked on his key: *"Isn't there other ways built,!!?!!!!!?? ... Multiple paths?!!!! Tested!!!!??"*

He was right. The roads existed.

## What was measured

- **My "verified" was a listing, not a verification.** I grepped `registry.json`, saw six loop names, and reported "no self-pull loop." I never opened `services-sync.sh`, whose own header reads *"Merge to main -> mirror pulls -> this loop installs."* Main reaches the NAS every ~15 min with no key.
- **`replay-on-clock.sh` already existed for this exact failure** (DR-1269, written 2026-10-28 when the same key was refused): the NAS applies merged migrations on its own clock. I had said that road did not exist.
- **The live function is 0322's, not 0320's.** 0322 replaced it to add `by_stall`; building 0326 from 0320 would have silently deleted that. Caught by reading both.
- **The aggregates could not be acted on.** Four firings reported 5 waiting, 3 build-failed, oldest 4 d 13 h — and never which 5. The already-shipped sweep takes row **ids**, so the safety check that must precede a build could not run at all.
- **Proven on a real PostgreSQL 16**, with a member's name and a body planted inside a `waiting` element: `tags`, `lesson-name`, `Jane Doe`, the body text and a malformed id were **all dropped by the SQL**, independently of the Python. `anon` executed the receipt and was refused the table — `permission denied for table agent_inbox`.
- **The count and the named list can honestly disagree:** total 3, named 2, because a row whose id it could not read is refused rather than published half-known.

## Impact

A session that cannot join the tailnet can now name the waiting rows, sweep them against the ledger, and report them precisely. Bodies are unchanged and still never ride this road.

## Decision

1. **The census writes `waiting`** — id, created_at, the **bucketed** road, shape, and `stall` only on a build-failed row.
2. **Never a tag, and the SQL enforces it too.** Each element is rebuilt key by key from a whitelist, so a census that one day carried a tag could not publish it. Two independent refusals, not one.
3. **A row with an unreadable id is dropped, not half-published**, and the reader states `NAMED n of total` so the smaller number can never read as the queue.
4. **Bodies still never ride the public road.** Naming a row is not reading it; that boundary is unchanged.

## Verification

- `test_lesson_queue_census.py` **22 green** (+5). **Proven to catch:** tags injected into the entry → 2 fail, mine and the house's own reason-text guard, independently agreeing; the `waiting` key removed → 4 error. Restored, 22 green.
- **Migration applied against a live PostgreSQL 16**, not reasoned about: the receipt rendered, every planted leak dropped, the anon boundary refused the table by name.
- The served reader run against that real receipt printed both rows and the `NAMED 2 of 3` line.
- **Not claimed:** nothing is yet proven on the NAS itself. It reaches the box by the services-sync pull and `replay-on-clock.sh`, both keyless but neither exercised by me. `re-review: 2026-11-24`.
