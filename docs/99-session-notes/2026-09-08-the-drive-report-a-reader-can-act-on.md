# The drive report a reader can act on — and a brake that stopped choosing the finding

**Date:** 2026-09-08
**Branch:** `claude/love-corner-give-button-yb2qe4` (restarted from `main` @ `bc0435d` — the previous PR for this branch, #1482, was merged, so this is a fresh change, not a stack on merged history)
**Rules in force:** DR-0075 (perpetual improvement is the default) · DR-0076 (no claim without evidence; proven-to-catch) · DR-0103 §4 (between prompts, pull the next item forward) · DR-0225 / P10 (brakes are build requirements) · DR-0111 (do the work, do not re-ask)

---

## How this was found

Nobody asked for it. L134 merged as `bc0435d`, the deploy was proven, and the loop says the next turn pulls the backlog forward rather than idling. So I ran the instrument that *is* the backlog — `scripts/review-watcher.mjs`, the daily drive report over every literal `re-review: <date>` in the repo — intending to pick the next overdue item off it.

The report could not be read. Five consecutive rows were byte-identical:

```
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
```

Those are five **different** commitments that share a file and a date. The report names which file is late, never which promise. That is not a backlog; it is a count.

## Finding 1 — the distinguisher existed and the report threw it away

`app/src/lib/re-reviews.js` already computes a `detail` field for each commitment, and its own comment says exactly why, dated 2026-07-30:

> one REV title — "the 2026-07-05 working day" — carried TWO distinct 2026-07-12 commitments, so both rows rendered IDENTICALLY and read as duplicates

The in-app surface renders `detail`. `formatWatchReport` — the path that feeds the daily drive, the job summary, and the rolling issue — did not. The defect was diagnosed and solved once, in the engine, and then quietly reintroduced in the reporting layer that most people actually read.

Fix: the report line carries the commitment clause as an indented sub-line. Same rows, now telling you what each one is:

```
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
  - …te collapse trips 3/3, the fixed build passes 3/3), the daily review-watcher sweeps dated skips.
```

## Finding 2 — the budget was choosing which findings you saw

The run ends with `budget ceiling reached — 99 item(s) not scanned this run`. The ceiling is correct and it announces itself, which is the brake behaving. But the run spent its 500 units in **extraction order**, and only sorted by urgency *afterwards*, over the survivors. So which 99 commitments got withheld was decided by where they happened to fall in the ledger scan — and a badly overdue item could be dropped while a December one was kept.

A brake may bound the work. It may never bias the finding.

Fix: order by urgency **before** spending. The ceiling is untouched — same 500 units, same truncation note, same coverage on an unbounded run. Only the consumption order changed, so what survives a truncated run is always the most urgent.

Deliberately *not* done: raising the ceiling. That is the tempting wrong fix — it makes the truncation note disappear by weakening the exact brake P10 and DR-0225 require.

## Finding 3 — the honest one: I could not prove the third mutation, so I built the gate

Proving the two fixes, I mutated `maxItems` from 500 to 100000 — the brake-weakening above — and **no test failed**. The ceiling was a comment, not behaviour. Anyone "fixing" a truncated run by widening it would have shipped green.

So the default ceiling is now pinned by behaviour: 501 commitments, no limits passed, must scan exactly 500 and report 1 not scanned. Widening it is now a visible, deliberate edit to that expectation. Mutation re-run after the gate: caught.

## Proven to catch (DR-0076 §3)

Each fix reverted in turn against the suite:

| Mutation | Result |
|---|---|
| Report line drops the `detail` distinguisher | **CAUGHT** |
| Budget spends in scan order (the pre-fix bias) | **CAUGHT** |
| Default ceiling widened 500 → 100000 | **CAUGHT** (gate added after it first survived) |

## What the fixed instrument now says about the repo

Measured, not estimated, on `bc0435d`:

- **599** dated commitments across DR bodies, `REVIEWS.md`, `INDEX.md`, session notes and `_root/` foundations.
- **500 of them are overdue** — the entire budget is consumed by past-due items, so the 99 withheld are past due as well.

That is the real headline and it is not a happy one: the dated-re-review discipline in DR-0075 is running about 600 commitments deep with at least 500 already past their date. The instrument now reports it legibly and prioritises correctly; **the backlog itself is untouched work.** Closing it is a separate, much larger job than this change, and it is Darrell's call how to attack it — sweep the oldest first, triage by tier, or bulk-close the ones whose conditions have already been met.

## Files

- `app/src/lib/review-watcher.js` — urgency-ordered budget spend; `detail` in the report line; local `urgencyRank` derived from `reReviewStatus` so "urgent" has one definition.
- `app/src/__tests__/review-watcher.test.js` — 6 new assertions in 3 describes, three mutations proven to catch.

Full suite: 12,612 passing, 1 skipped. Lint clean. Real build clean.

**re-review: 2026-10-08** — check whether the overdue count has moved off 500, and whether the legible report actually got used to close items. If it has not moved, the instrument is fine and the *discipline* is the finding.
