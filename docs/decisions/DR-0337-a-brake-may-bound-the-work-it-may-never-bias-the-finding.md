# DR-0337 — A brake may bound the work; it may never bias the finding

- **date:** 2026-09-08
- **status:** accepted
- **tier:** A (a reporting-layer fix and a spend-order fix inside one already-active watcher; no schema, no money, no front-door identity, no new compute)
- **decides:** what a truncating instrument owes the reader — which items survive the ceiling, and whether a row names the commitment or only its file
- **pairs-with:** DR-0225 / P10-P12 (the three brakes), DR-0075 (perpetual improvement; the dated re-review discipline this instrument drives), DR-0076 (no claim without evidence; proven-to-catch), DR-0121 (one source), DR-0103 §4 (between prompts, pull the next item forward), DR-0259 (a review lands as Ways + documentation)

## The trigger

Not a directive. The loop's own §4 — between prompts, pull the next backlog item forward — sent this session to `scripts/review-watcher.mjs` to choose the next overdue item after L134 merged and deployed. **The instrument could not be read.** Five consecutive rows were byte-identical:

```
- **INDEX.md** · overdue 15d · due 2026-08-25 · docs/decisions/INDEX.md
```

Five *different* promises that share a file and a date. A report that names which file is late, and never which promise, is a count wearing a list's clothes.

## Decision 1 — A report row names the COMMITMENT, not only its record

`re-reviews.js` already computes a per-clause `detail` for exactly this reason, and says so in a comment dated 2026-07-30: one REV title carried two distinct 2026-07-12 commitments and both rows rendered identically. **The in-app surface rendered `detail`. `formatWatchReport` — the path feeding the daily drive, the CI job summary, and the rolling issue — dropped it.** The defect was diagnosed and solved once in the engine, then silently reintroduced in the layer most people actually read.

Binding: any surface that renders dated commitments carries the distinguishing clause. Identifier plus status plus date is not evidence when one record holds several open promises (DR-0076 §1).

## Decision 2 — A brake bounds the WORK; it never chooses the FINDING

The watcher's item ceiling is correct and announces itself (`budget ceiling reached — 99 item(s) not scanned this run`), which is P10 behaving. But the run spent its 500 units in **extraction order** and sorted by urgency only afterwards, over the survivors. Which 99 commitments got withheld was therefore decided by where they happened to fall in the ledger scan — **a badly overdue item could be dropped while a December one was kept, and the report would look clean.**

Binding, and general beyond this watcher: **where a brake truncates, the work is ordered by urgency BEFORE the ceiling is spent, so what survives a bounded run is always what mattered most.** A bound may decide how much; it may never decide which. The ceiling itself is untouched here — same units, same truncation note, same coverage on an unbounded run.

**Explicitly rejected: raising the ceiling.** That is the tempting wrong fix — it makes the truncation note disappear by weakening the exact brake DR-0225 and P10 require. Widening a brake to silence its own honest signal is the failure, not the remedy.

## Decision 3 — A brake's threshold is BEHAVIOUR, not a comment

Proving Decisions 1 and 2, this session mutated the default `maxItems` from 500 to 100000 — the brake-weakening just rejected — and **no test failed.** The ceiling existed only as a default argument and a paragraph of prose. Anyone "fixing" a truncated run by widening it would have shipped green through every gate.

Binding: **every documented brake threshold is pinned by a behavioural test**, so widening it is a deliberate, visible edit to an expectation rather than a one-character change nothing notices. Pinned here as: 501 commitments, no limits passed, must scan exactly 500 and report 1 not scanned.

## Proven-to-catch (DR-0076 §3)

Each decision reverted in turn against the suite:

| Mutation | Result |
|---|---|
| Report line drops the `detail` distinguisher | **CAUGHT** |
| Budget spends in scan order (the pre-fix bias) | **CAUGHT** |
| Default ceiling widened 500 → 100000 | **CAUGHT** — and it SURVIVED before Decision 3's gate existed; that survival is why Decision 3 is a decision and not a note |

## What the fixed instrument then measured

On `bc0435d`, measured rather than estimated: **599 dated commitments** across DR bodies, `REVIEWS.md`, `INDEX.md`, session notes and `_root/` foundations — and **500 of them are overdue.** The entire budget is consumed by past-due items, so the 99 withheld are past due as well.

That is a finding about the DR-0075 discipline, not about this fix. The instrument now reports it legibly and prioritises correctly; **closing the backlog is untouched work**, materially larger than this change, and how to attack it (oldest-first sweep, triage by tier, or bulk-closing commitments whose conditions were already met) is the Governor's call. Not decided here.

re-review: 2026-10-08 — has the overdue count moved off 500, and did the now-legible report actually get used to close items? If it has not moved, the instrument is fine and the *discipline* is the finding.

## Decision 4 — A reader must see the ledger's own closures (added same session, after the sweep)

Sweeping the oldest overdue cluster found five records carrying the same `re-review: 2026-07-12` — the incident #722 serve-layer decision, **made 59 days ago**. DR-0155's INDEX row says so outright, and LESSONS-LEARNED had written **`**CLOSED 2026-07-10 by DR-0155:**`** immediately after the date, exactly where the extractor looks.

`DONE_MARKER_RE` could not see it. Its prefix class admitted only whitespace, an em-dash, a colon and an opening bracket; the ledger closes commitments in real markdown — a backtick ending an inline code span, a sentence period, bold asterisks, a closing paren.

Binding: **the done-marker's punctuation class tracks how the ledger actually writes, while the marker itself stays ALL-CAPS and case-sensitive.** The capitals are the guarantee — prose is full of the word "closed" — and widening punctuation must never weaken them.

### The hypothesis this killed, recorded because the number matters more than the story

I expected missed closures to explain the 500 overdue. **They do not: 609 commitments scanned, 6 closures already seen, exactly 2 missed.** My first probe said three, because I wrote it case-insensitively and it matched the prose *"closed the same day"* — the exact false-close the ALL-CAPS rule prevents, committed by my own measuring tool before it could be committed by the fix.

**Corrected position: the 500 overdue are, as far as the ledger records, genuinely overdue.** The instrument was under-counting by 2, not 400. The backlog is real work, not a reporting artifact — a bigger finding than the one I set out to confirm, not a smaller one.

Proven to catch: prefix reverted to the narrow original → **CAUGHT** (3 failed); marker made case-insensitive → **CAUGHT** (2 failed). Watcher total 603 → 601.

## Consequences

- `app/src/lib/review-watcher.js` — urgency-ordered budget spend; `detail` on the report line; a local `urgencyRank` derived from `reReviewStatus` so "urgent" has one definition and cannot drift from the status the report renders (DR-0121).
- `app/src/__tests__/review-watcher.test.js` — 6 assertions in 3 describes; three mutations proven to catch.
- `app/src/lib/re-reviews.js` — done-marker prefix widened to real markdown punctuation, capitals kept; `app/src/__tests__/re-reviews.test.js` +7 assertions incl. the lowercase-prose negative and an out-of-range marker.
- Nothing about the brake's strength changed. A run that truncates still truncates, still says so, and now withholds only the least urgent.
