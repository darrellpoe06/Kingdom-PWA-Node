# DR-1250: A shipped lesson does not go on waiting — the bell counted four live lessons as a backlog

**Date:** 2026-10-27
**Status:** Accepted
**Pairs with:** DR-0725 (the bell replaces the hourly timer), DR-0610 (one teaching, one lesson), DR-0669 (the NAS lesson builder; the `lesson-captured` tag is its lock), DR-0672 (Your lessons reads these tags), DR-1249 (a read that fails must not read as a clean result), DR-0076 (every looked-fine-but-wasn't class becomes a gate)

## Context

The bell reported **"12 waiting for the intake (12 past the stale alarm)"**, the oldest at **110 hours**, and `0 shipped in the last day`. Read plainly, that says twelve of Darrell's teachings had been sitting unbuilt for four days.

Four of the twelve were already built, merged, deployed and readable in the app.

## What was measured

Swept the twelve waiting row ids against `docs/decisions/` on `origin/main`:

| row | lesson | record |
| --- | --- | --- |
| `031a898a-b98b-484e-8d06-0962dede6316` | ll261 | DR-1234 |
| `bee78650-c5bc-4701-9cb9-85a8faef8770` | ll261 (the same teaching, two rows — DR-0610) | DR-1234 |
| `0593ae29-1547-46d8-b608-34ae8b09953e` | ll262 | DR-1223 |
| `6130c486-a7c0-4a8e-978d-a37ad1533b79` | ll263 | DR-1227 |

None carried `lesson-captured`. **That tag is the builder's lock** (DR-0669: "a crashed build leaves its row unmarked and the next hourly run retries it"), so the NAS builder re-claimed each one every hour and spent a model call rebuilding a lesson the congregation could already read. One was on **attempt 4**. `0593ae29`'s own tag history shows the loop: claimed → grouped → released → claimed → grouped → failed, over and over, for a lesson that merged days earlier.

**The waste is the smaller half.** Had one of those retries SUCCEEDED, it would have shipped a second lesson from a teaching that already had one — the duplicate DR-0610 exists to forbid, arriving through the one path nobody was watching.

**The real finding is how it was found: four times, by hand.** The sweep above was run on ll261's rows, then again when ll262 landed, then again on ll263, then again on ll264's turn. A check run four times by hand in one session is a check that belongs in the instrument.

**And the instrument was the thing that was wrong.** The bell is what says the count, and its count was wrong by four. Its closing line already said "mark a shipped lesson with `inbox-lesson-tag.yml`" — generic advice that named no row, so it read as boilerplate rather than as a finding about these twelve.

## Impact — what this obligates, and the limits named rather than left

- **The bell now names them, with the record and the remedy, above the generic advice.** A reader (or the hourly Routine) sees which rows to tag without re-deriving the sweep.
- **The four were tagged** by `inbox-lesson-tag.yml`, which decides `lesson-published` itself from the exact deploy commit (P62) rather than taking anyone's word. Verified on `031a898a` from the tool's own before/after: `lesson-captured`, `lesson-id:…`, `lesson-pr:2412`, `lesson-published`. The bell's count fell 12 → 10 as the first two landed.
- **The true backlog was 8, not 12.** Every other waiting row was swept against main and is genuinely unbuilt.
- **This reports; it does not tag.** Writing the tag is a state change on the live database and stays with the workflow that already does it, under the rules that already govern it. A reporter that silently mutated the queue would be a worse bug than the one it fixes.
- **Honest limit:** the match needs the row id to be IN the record. Lessons whose provenance names a source without quoting the row id are invisible to this check — sov49's own record (DR-1243) carries no uuid, so a Sovereign A.I. week built from a forwarded article would not be caught. Naming the row id in every lesson's provenance is the real close, and it is not done here. `re-review: 2026-11-10`.
- **Honest limit:** exact-uuid match only, deliberately. A prefix match would let any record quoting a few hex characters mark a teaching as shipped, and a false "already shipped" is worse than a missed one — it would stop a teaching from ever being built. A case pins this.

## Decision

`shippedButUnmarked(rows, records)` in `scripts/lesson-inbox-bell.mjs` — pure, exact-uuid, restricted to the waiting queue (a row a build holds, or one awaiting Darrell's choice, is not this defect). `formatComment` renders a named section above the generic line when any row matches. The CLI reads `docs/decisions/` from the checkout it already runs in, so there is nothing to wire and no way to forget to feed it.

## Verification

- `lesson-inbox-bell.test.js` — **36 cases green** (28 existing, 8 added), using the four real ids and records above rather than invented ones.
- **Proven to catch (DR-0076 §3):** stubbing the finder to never match reddens two cases — the pure function (`expected [] to deeply equal [ …(4) ]`) and the rendering (the section vanishes). Restored, green.
- **Verified end-to-end through the CLI, not only in unit tests**, on the real records on disk: given three real rows, it printed the two shipped ones with their record filenames and left the genuinely unbuilt `60972a31` alone.
- **That end-to-end run is what caught a real bug in this very change.** The first version of `readRecords()` called `path.join` with no `path` imported; it threw, and the `catch` returned `[]`, so the section simply never appeared — indistinguishable from "no records on disk". The unit cases all passed, because they inject `records` and never call `readRecords()`. The catch now writes the reason to stderr: a read that failed must not read as a clean result (DR-1249), including when the failure is my own typo.
- Both singular and plural renderings are pinned, since the real case was four at once.
- `lint` exit 0.
