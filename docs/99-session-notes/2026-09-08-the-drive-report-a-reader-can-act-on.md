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

---

## The sweep that followed, and the hypothesis it killed

With the report legible, the next move was the backlog itself. The default I picked — without being asked, because DR-0075 already directs it — was to close the commitments whose conditions were already met, since those are *false* overdue: they inflate the count and hide the real work.

The oldest cluster proved the method. Five records (LESSONS-LEARNED ×2, INDEX, DR-0153, DR-0155, REVIEWS.md) all carried the same 2026-07-12 commitment — the incident #722 serve-layer decision. **That decision was made 59 days ago.** DR-0155's INDEX row says so outright: *"Closes the #722 / LESSONS P32 open decision"* (that same 2026-07-12 line). And LESSONS-LEARNED had already written the closure into the text: **`**CLOSED 2026-07-10 by DR-0155:**`** — sitting immediately after the date, exactly where the extractor looks.

The extractor could not see it. `DONE_MARKER_RE` admitted only whitespace, an em-dash, a colon and an opening bracket before the marker. The ledger writes real markdown — a backtick closing an inline code span, a sentence period, bold asterisks, a closing paren — and every one of those blocked a genuine, correctly-recorded closure. **A reader that cannot see the ledger's own closures reports finished work as outstanding.**

### The hypothesis I got wrong, measured rather than assumed

I expected this to be the explanation for the 500. It is not, and the honest number matters more than the tidy story: **609 commitments scanned, 6 closures already seen, and exactly 2 missed.** Not hundreds. Two.

My first probe said three — because I wrote it case-insensitively and it matched the prose *"closed the same day"* mid-sentence. That is precisely the false-close the ALL-CAPS marker exists to prevent, and my own measuring tool committed it. The fix therefore widens **only the punctuation class** and keeps the marker case-sensitive; a gate now pins that lowercase prose never closes a commitment.

So the corrected position: the 500 overdue are, as far as the ledger records, genuinely overdue. The instrument was under-counting closures by 2, not by 400. **The backlog is real work, not a reporting artifact** — which makes it a bigger finding, not a smaller one.

### Proven to catch

| Mutation | Result |
|---|---|
| Prefix class reverted to the narrow original | **CAUGHT** (3 failed) |
| Marker made case-insensitive (prose false-closes) | **CAUGHT** (2 failed) |

Watcher total after the fix: **603 → 601** — the two recorded closures now count, and the count is honest for the first time.

Files: `app/src/lib/re-reviews.js` (prefix widened, capitals kept), `app/src/__tests__/re-reviews.test.js` (+7 assertions incl. the lowercase-prose negative and an out-of-range marker).


## The sweep's own second lesson: narrating a date mints a phantom commitment

Closing the #722 cluster worked — four records marked DONE with the evidence that DR-0155 shipped all three of its parts (the guard at `app/functions/poetech-app/assets/[[path]].js`, its 16 proven-to-catch assertions green, the propagation gate in `deploy-cloudflare-pages.yml`), verified 2026-09-08 rather than taken on the DR's word.

Then the count barely moved, and the reason was me. **Writing *about* a commitment in the ledger's own syntax mints a new one.** This session's session note, REV-0252, DR-0337 and the INDEX row each quoted the literal token while describing the finding, and the extractor — correctly, it cannot know intent — read five narrations as five live commitments. Four closed, five invented, net worse.

Fixed by writing the date without the token ("the same 2026-07-12 commitment") wherever the text is *describing* rather than *promising*. The literal token survives untouched on every real commitment.

**Not gated, with the why (DR-0075).** A machine check here would have to separate a promise from a description of a promise, and every rule I can write for that misfires on legitimate prose. A guard that fires where it should not is noise, and noise is how a guard gets deleted — REV-0249's own lesson, and the reason its `SINGULAR_BY_DESIGN` list carries reasons. The durable protection is that the watcher's total is now watched: an authoring pass that inflates it shows up immediately in the next run's count. re-review: 2026-11-08 — if narration phantoms recur, the cheap gate is a lint on *new* `re-review:` tokens in a session-note diff, and the recurrence is the evidence that the false-positive cost is worth paying.

**Net after the sweep:** 597 commitments, down from 599 at the start of the session despite four legitimate new ones added by this work — four real closures, five phantoms removed.


## Third pass: the ceiling was answering questions about the backlog

Measuring the backlog *unbounded* — straight through the module, no budget — corrected a number this session had already reported.

**The report said "Overdue (500)". The truth is 502.** `counts.overdue` was the length of the *kept* list, so on a truncated run the ceiling was answering a question about the backlog. With a larger repo it could read 500 while 900 were past due, and nothing would look wrong. Extraction already produces every item, so the true tallies were free the whole time: the brake now bounds what is **listed**, never what is **counted**, and the report says `Overdue (502) — showing the 500 most urgent`.

That correction immediately exposed the next one. **502 overdue consumed all 500 units, so the "due within 7 days — pull forward" section rendered EMPTY while 27 items were due that week** — a whole category erased, with nothing on the page to say it was missing. Starving a category is the same defect as biasing the order, one layer up. Due-soon now holds a floor of up to a fifth of the ceiling and returns whatever it does not need, so a run with few due-soon items behaves exactly as before. The report now shows all 27, and 473 of the 502.

The floor had to be spent **first** to be a floor at all: left in urgency order the reserved rows still sat behind all 502 overdue and the ceiling never reached them. That was caught by running it, not by reading it.

### Proven to catch

| Mutation | Result |
|---|---|
| `counts.overdue` back to the shown length | **CAUGHT** (3 failed) |
| The due-soon floor removed | **CAUGHT** (2 failed) |
| The floor made a fixed slice that never returns its unused part | **survived — and it is not a defect**: `slice()` already clamps, so the `Math.min` is belt-and-braces. No gate was invented for a no-op; the code now says so, since an unpinned line invites the next reader to assume it is load-bearing. |

### The honest accounting for this sweep

Closed with verified evidence: **5** (four in the #722 cluster, plus the poll-timers commitment discharged by DR-0255 — read, not cited from a summary). Phantoms removed: **5**. Legitimate new commitments this work itself added: **7** — every REV and DR written carries its own `re-review` date.

**So the total is roughly flat at 600, and that is the discipline working, not failing.** Documentation-heavy work cannot reduce this number, because documenting a finding creates a dated promise to revisit it. The number that moved honestly is the one that was wrong: overdue is **502**, measured unbounded, not the ceiling's 500.


**re-review: 2026-10-08** — check whether the overdue count has moved off 500, and whether the legible report actually got used to close items. If it has not moved, the instrument is fine and the *discipline* is the finding.
