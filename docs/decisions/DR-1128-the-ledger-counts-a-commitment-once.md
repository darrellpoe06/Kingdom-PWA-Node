# DR-1128: A commitment is counted once, not once per place it is written — and the finding I reported first was wrong

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one pure function in one library and its gate; no surface, no schema, no money, no lesson text, and not one `re-review:` date in the repo is altered)
**Type:** way

**Area:** `app/src/lib/re-reviews.js` (modified) and `app/src/__tests__/the-ledger-counts-a-commitment-once.test.js` (new).

**Grounds:** Found while pulling the next dated item forward between deliveries (DR-0103 §4 — idle turns advance the backlog). `review-watcher.mjs` reported **"Overdue (1536)"** of **2,069** dated commitments, and that number could not be trusted in either direction.

**Principles:** DR-0076 §4 (measure, don't claim) and §7 (independent verification) and §3 (proven-to-catch); DR-0075 (a `re-review:` date is the promise a parked thing is revisited — a count nobody can trust weakens every one of them); DR-0061 / P15 (reality-trace: name the real reader of the number before changing it).

## Context

The re-review backlog is how this team keeps its promises to itself: nothing parked is parked forever, because it carries a date. The instrument that reads those dates is `re-reviews.js`, and the number it produces is read by the daily drive's job summary, the rolling issue, and the in-app surface. If that number is wrong, every dated promise behind it is harder to keep.

## What was measured

Measured 2026-10-20 against `origin/main` `15141ac71`.

**The watcher feeds the extractor two overlapping documents.** `review-watcher.mjs` passes the raw body of every `DR-*.md` record *and*, separately, `docs/decisions/INDEX.md` — a table whose every row summarises one record and **reproduces its `re-review:` dates**. So a commitment written once was counted twice: once from the record, once from its own index row.

**The existing dedup could not see it, and no fingerprint could.** The key is `origin|sourceId|date|clue`, and an echo differs on three of those four: the row's `origin` is `review` where the record's is `decision`, its `sourceId` is `INDEX.md` where the record's is `DR-NNNN`, and its `clue` is the row's summary prose where the record's is the record's own. **Nothing in the text says the two are one commitment. Only the row's link does.**

| | before | after |
|---|---|---|
| index-row commitments the extractor finds | **483** | 483 |
| …of those, genuine (not an echo of their own record) | — | **38** |
| …echoes | — | **445** |
| dated commitments in all | **2,069** | **1,626** |
| overdue | **1,536** | **1,254** |
| due within 7 days | **342** | **227** |

Confirmed two independent ways that agree exactly: a raw scan attributing each index date to its own record, and the real extractor run with and without the records beside it. The watcher's own headline moved 2,069 → 1,626 on `15141ac71`, which was 443 of 481 there; after merging the base it reads **445 of 483**, and the four lower figures were measured on `15141ac71` before that merge.

**That two-row drift is itself a finding, and it changed the gate.** My first version of this gate pinned the exact totals — 481 / 38 / 443 — and the base merge moved them before the branch was an hour old, because an unrelated record (DR-1097) and this branch's own index row each added a `re-review:` date. **A pin tied to the SIZE of a ledger that grows several times a day is not a guard**: it goes red on work that has nothing to do with it, and it teaches the next session to bump a number instead of reading it. So the figures above are stated as the day's measurement in prose and the gate asserts what must hold at any size — that **no surviving index row is one its own record already carries**, computed from the records rather than from the function under test, plus a floor on the magnitude. The red is better for it: removing the suppression now names the 445 offenders by record and date (`'DR-1031 2026-10-22', …(444)`) instead of reporting a number mismatch.

**Scanning the index is not the bug, and is kept.** It was added on purpose in the 2026-07-30 comprehensive review because commitments lived there and nothing read them. Of the 481, **38 are not echoes** — dates that exist only in a row — and three of those cite **DR-1104** and **DR-1105**, which have **no record file on disk at all.** Those are exactly what the widening was for, and losing them would be the worst thing this change could do, so an echo is dropped only when the record itself carries the date.

## A finding of mine that was wrong, reported before it was verified

I told Darrell, as a measured finding, that this instrument over-counts a **single** commitment six times — citing `DR-0143`, where `grep -c "re-review: 2026-08-07"` returned **1** while the watcher reported **6**.

**That was wrong. `grep -c` counts matching LINES, not matches**, and all six sit on one long line, so the comparison was two different units. Read in context they are **six different parked items that share one date**: portable Agent Skills, calendar/email connectors, Open Notebook, multi-model routing, on-device browser AI, and the remote-session item. The watcher was right, and `review-watcher.js:173-179` says so in its own words — *"The DISTINGUISHER is not optional"* — because a record routinely carries several open commitments on one date and collapsing them yields a report a reader cannot act on.

Two things follow, and both are in the work rather than only in this paragraph:

1. **It is why this change is scoped to the ledger index by construction** and not to "a DR id near a date." The wrong finding pointed at a fix that would have eaten those siblings.
2. **It is a proven-to-catch case.** Widening the rule past the index — the shape my wrong premise argued for — turns **4** cases red, one of them reading `expected +0 to be 6`: DR-0143's six commitments vanishing. The gate catches the fix I would have built from the wrong reading.

## Decision

**Carry the owning record on every item, and drop a ledger-index row whose record already carries that date.**

- `ownerLinkBefore()` reads the nearest preceding `[DR-NNNN]` link, which in the index is the row's own record; for a decision record the owner is the record itself. It travels on the item as `owner`, so any consumer can attribute a commitment without re-reading the source.
- `dropIndexEchoes()` removes an item only when **all** of: it came from `INDEX.md`, it has an owner link, and an item from that record's own body carries the same date. A row with no link, a row citing a record that does not exist, and a date that lives only in a row are all **kept**.
- **Narrow on purpose.** Only the ledger index is treated this way, because only the index is a table whose every row summarises one record. A session note that happens to cite a DR is a different document making its own commitment, and is left alone — pinned by its own case.

## Impact

**What this buys.** The backlog number means what it says. "1,254 overdue" is a count of commitments; "1,536" was a count of *places a commitment was written*. Every consumer — the job summary, the rolling issue, the in-app surface — reads the corrected number without changing, because the fix is in the shared extractor rather than in any one reader.

**What this does not do.**

- **It does not close a single commitment.** Not one `re-review:` date in the repo is altered, and nothing parked becomes un-parked. 1,254 overdue is still 1,254 overdue — the point is that it is now the real figure.
- **It leaves the other overlapping ledgers unmeasured.** REVIEWS.md, the session notes, the foundations and `RECORDED-STATE.md` are each scanned whole, and whether any of *them* reproduces another's commitment has not been measured. Only the index↔record pair was, because only that pair is a table of one row per record. **`re-review: 2026-11-20`** — measure the other ledgers for the same overlap, and read the overdue figure again to see whether it moved by work or by counting.
- **It does not explain the 1,254.** Why this team carries that many overdue dated promises is a separate reading, and a real one. Three index rows naming records that were never written (DR-1104, DR-1105) are the first thread, and they are now visible rather than buried in 443 echoes.
- **It cannot tell a stale index row from a live one.** A row whose record dropped a date keeps that commitment alive from the index alone — which is the safe direction, but it means some of the 38 may be ghosts of edited records rather than commitments anyone still owns.

## Verification

`app/src/__tests__/the-ledger-counts-a-commitment-once.test.js`, **15 cases**, green. The **43** existing cases in `re-reviews.test.js` and `review-watcher.test.js` — the suites that own this code — still pass unchanged, 58 across the three files together. `npm run lint` and `npm run verify:gates` clean, both before and **after** merging the base. Full vitest suite before pushing (DR-1072's standard).

Anti-theater: the measured cases run against the **real ledger**, with the record count asserted above 900 and the item count above 1,000, so a parse that stopped reading would show as zero and look like success rather than pass quietly.

**Proven to catch, in two separable directions** (re-proved after the base merge, on the invariant form of the gate):

| what was done | what went red |
| --- | --- |
| the suppression removed (`const counted = out`) | **2** — the invariant, naming the 445 offenders by record and date, and the magnitude floor |
| the rule widened past the ledger index — the fix my wrong finding argued for | **4**, including `expected +0 to be 6` (DR-0143's six siblings vanishing) and the real-ledger anti-theater case |

Restored from backup and confirmed byte-identical before each final green run.

**And main's own new check runs here too:** the base merge brought `wyze_cloud.py --selftest` (DR-1097's twelfth read, added to `ci.yml`), and it passes on the merged tree — verified rather than assumed, since a base merge that breaks a check main just added is exactly the failure a stale branch hides.
