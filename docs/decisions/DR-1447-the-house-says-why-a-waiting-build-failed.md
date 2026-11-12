# DR-1447: The house says why a waiting build failed, as a class

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** B (widens what the public census road publishes, by one field, under its own allow-list)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py` (`stall_of`, `by_stall`), `infra/supabase/migrations-auto/0322-the-house-says-why-a-waiting-build-failed.sql` (new), `scripts/served-lesson-queue.py`, `infra/nas-loops/test_lesson_queue_census.py`
**Sent in by:** Nobody. The 13:04 and 14:04 lesson-intake ticks reported the same unactionable number twice, so the gap was the work (DR-0621).
**Pairs with:** DR-1360 (the NAS writes its result where the app reads it), DR-1431 / 0320 (the census read half), DR-1186 (unread is never zero), DR-1232 (a cut reason tag hid a 429), DR-0611 (never a body)

## Context
0320 gave the lesson lane a road that works when the tailnet is shut. Today it worked, and what it could say was still not enough to act on.

## What was measured
- **Two consecutive ticks, 13:04 and 14:04**, both: `Waiting lesson rows: 5`, `By shape -- build-failed: 3, plain: 2`, oldest 55 min then 1 h. The tailnet join failed both times (`TS_AUTHKEY invalid or consumed`), so the census answered, exactly as designed.
- **`build-failed: 3` cannot be acted on.** Two of the builder's failure classes heal themselves — `lesson_builder.eligibility()` reads `rate-limited` or `transient` back off the front of the `build-reason` tag and retries — and anything else is stuck and wants a person. One word separates "wait" from "work", and the count does not carry it.
- **The class is already written, and already kept first on purpose.** `reason_tag()` (`lesson_builder.py:183`) prefixes `rate-limited: ` / `transient: ` precisely so the class survives its 200-character cut; DR-1232 records the incident that earned that ordering — a 429 sat ~250 characters into a JSON tail, the tag was cut before it, and two rows were counted as failed lessons "with nothing wrong in them".
- **The reason's TEXT is not safe to publish.** It can quote a gate error carrying a person's words. The class name is a tag shape, which is what this lane already publishes.

## Impact
The next tick says whether the stalled teachings are waiting on a rate limit or stuck on something real — without the tailnet, and without any row content leaving the house.

## Decision
- **The census emits `by_stall`:** counts per failure class over the build-failed rows only, so it sums to `by_shape`'s `build-failed` and is `{}` when nothing has failed. Keys: `rate-limited`, `transient`, `other`.
- **It reads the classifier, never the remainder.** Matched at the **front** of the reason, never as a substring.
- **A failed row with no reason is `other`, not absent** — a build killed by the wall-clock budget can land without one, and counting it as nothing would make `by_stall` disagree with `by_shape` and quietly lose a stuck teaching.
- **0322 publishes it under its own fixed allow-list** (`k_stalls`), the way 0320 fixed roads and shapes, and re-states 0320's rules rather than patching around them.

## Verification
- **Proven on real PostgreSQL 16.15**, not by reading the SQL: 0322 applied, and a body carrying today's live shape plus an `INVENTED-KEY: 9` returned `{"other":1,"transient":1,"rate-limited":1}` — the invented key dropped. **Proven to catch:** with `k_stalls` removed from the filter, `INVENTED-KEY` rides out of the public function; restored, it is refused.
- **0320's discipline carries:** a corrupt `"rate-limited":-5` is **dropped, not clamped** (that clamp was 0320's own measured bug — it turned `-5` into a manufactured `0`), and a `by_stall` that is not an object degrades to `{}` without breaking the receipt.
- **17 green** in the census suite. Proven to catch: matching the class anywhere instead of at the front fails by name; a reasonless failed row counting as nothing fails by name; carrying the reason's text fails two cases.
- **My own proof was broken first and is recorded as such.** The substring break passed because the fixture said `rate-limit` where the class is `rate-limited`, so the path was never exercised — a proof that proves nothing. The fixture now carries the whole word, and the break fails.
- **124 green** in the builder suite (it owns `reason_tag`); `format-guard` clean; the five pre-existing `RUF100` findings in these files are byte-identical before and after, so none is this change's.
