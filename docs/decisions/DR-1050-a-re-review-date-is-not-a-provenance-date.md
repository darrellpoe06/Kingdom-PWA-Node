# DR-1050: A `re-review:` date is not a provenance date — the duplicate finder would have blocked a real lesson

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (one finder's scoring, tightened; no data, no money, no new door, no control moved)
**Type:** orchestration
**Area:**
- `scripts/lesson-already-built.mjs` (`provenanceDayHit`, `isPromiseLine`, `SOURCE_DAY_WINDOW`; `scoreFile` now takes its day from provenance)
- `app/src/__tests__/lesson-already-built.test.js` (a new describe, 10 checks, proven to catch on the real shape)

**Amends:** DR-1024, which built this finder and fixed the bare-day defect one level up. Its rule — *"a bare day proves nothing by itself; paired with the source it is strong"* — is right about the pair and was silent about DISTANCE. This supplies the distance.
**Grounds:** DR-0610 (one teaching, one lesson — this finder is that brake); DR-0076 §3 (proven-to-catch), §4 (measure, do not claim), §5 (characterize before you change); DR-0075 (`re-review:` dates are the institution that poisoned the signal); DR-0225 / DR-0111 (a brake exists to protect the work, never to stall it); DR-0621 (a flag is where the work starts)
**Declared by:** me, after the finder answered on three live forwards and one answer was wrong

## Concern

On 2026-10-15 the Gmail lesson intake found three uncaptured threads. Run
through this finder, it answered:

| thread | verdict | truth |
|---|---|---|
| ByteByteGo, "19th-Century Heat Physics" | **ALREADY BUILT**, naming DR-1005 | correct — it is sov39 |
| CompTIA SmartBrief, "Executives use AI…" | WEAK — terms only | correct — it was unbuilt, now sov40 |
| Morning Brew, "Piping hot" | **LIKELY ALREADY BUILT — the source on that day** | **WRONG — it was unbuilt, now World Issues 20** |

The third is the finding. "LIKELY ALREADY BUILT" is the second-strongest
verdict this tool has, and the three records it named — DR-0412, DR-0416,
DR-0437 — are all SEPTEMBER records about a DIFFERENT newsletter.

**Why they matched, measured exactly.** In each one `2026-10-15` appears as a
`re-review:` date, a promise to revisit, while "Morning Brew" sits thousands of
characters away in the provenance line. `scoreFile` asked two whole-file
questions — does this text contain the day, does it contain the source — and
scored a yes to both as *"the source on that day."* Two unrelated facts, in one
50KB file, read as one sentence. Both `includes()` calls were blind to distance.

**Why this is worse than an ordinary false positive, and why it was not left
alone.** This finder is deliberately biased toward weak false positives, and
DR-1024 says so in its own words: a needless read is cheaper than a duplicate
lesson in the congregation's app. That bias is right. But `re-review:` dates are
a **DR-0075 institution** — every parked improvement in this ledger carries
one — so the ledger is densely seeded with future days, and a recurring source
collides with one on almost any day. Morning Brew alone has sourced six records.
The effect is that the verdict most likely to STOP a build fires hardest on
exactly the sources this house uses most. Taken at face value this morning it
would have blocked World Issues 20 on the day it was written — a brake braking
the work instead of protecting it, which DR-0225 and DR-0111 both forbid.

The irony is worth recording: DR-0075's promise that nothing is parked forever
is what degraded the brake that keeps one teaching to one lesson.

## What was measured

Everything below is a measurement on the real ledger, not an estimate.

- **The three live verdicts above**, from `scripts/lesson-already-built.mjs` run
  against the real tree at `68765f579`.
- **The cause, located to the character.** In DR-0412 the day sits at offset
  10,634 and the source at 1,310. In DR-0416, 10,797 against 1,005. In DR-0437,
  13,853 against 7,935.
- **The window was derived, not chosen.** Minimum character distance between the
  source name and the day, across the real records:

  | kind | record | gap |
  |---|---|---|
  | TRUE provenance | DR-1005 / ByteByteGo | **22** |
  | TRUE provenance | DR-0416 / Morning Brew (its own 2026-09-15 forward) | **26** |
  | TRUE provenance | DR-0791 / Morning Brew | **107** |
  | false | INDEX.md | 2,859 |
  | false | DR-0437 | 5,918 |
  | false | DR-0412 | 9,324 |
  | false | DR-0416 | 9,792 |

  A **27x** gap separates the widest true pair from the narrowest false one, so
  `SOURCE_DAY_WINDOW = 400` sits about 4x above every true pair and about 7x
  below every false one. The constant is asserted in the suite, so a drift in it
  is a visible change rather than a quiet one.
- **THE FIRST FIX FAILED, AND THAT IS THE MORE USEFUL FINDING.** The first
  attempt used a three-LINE window. It correctly demoted DR-0412, DR-0416 and
  DR-0437 to `source` — and the false verdict SURVIVED, now resting on
  `docs/decisions/INDEX.md` alone. `INDEX.md` is one row per record, each row a
  whole paragraph on a **single line of 1,600 to 3,200 characters**, so "within
  three lines" there spans three entire records. Line distance is not distance
  in this ledger. Only re-running the tool on the real case found this; the
  line-based version passed every fixture I had written for it.
- **No regression, checked on the live ledger rather than fixtures.** After the
  change, ByteByteGo still answers ALREADY BUILT naming DR-1005 by its forward
  timestamp; DR-0791's own forward still answers ALREADY BUILT naming its own
  record; and DR-0416's own 2026-09-15 forward still answers
  `source+day` — correctly, because DR-0412 and DR-0416 were both forwarded that
  day ("Darrell forwarded two items on 2026-09-15"). The Morning Brew thread is
  demoted to **MAYBE — a source match only**, which is one cheap read.
- **Proven to catch, both directions (DR-0076 §3).** Reverting only
  `scripts/lesson-already-built.mjs` and keeping the test ran the file **RED, 8
  of 24 failing** — and one failure is behavioural rather than a missing import:
  `expected 'source+day' to be 'source'`, the defect reproduced on DR-0412's
  real shape. Restored: **GREEN, 24/24.** The script was reverted ALONE on
  purpose; stashing a check together with the thing it checks passes trivially
  and proves nothing.
- `npm run verify:gates` — 20 guards. `npm run lint` — clean. Targeted suite as
  above.

## Decision

1. **A promise about a date is never provenance.** `isPromiseLine` excludes a
   `re-review:` line from supplying the forward's day. It earns its place
   independently of the window, because a record may legitimately name its
   source right beside a parked date.
2. **The day counts only near the source.** `provenanceDayHit` requires the day
   and the source within `SOURCE_DAY_WINDOW` (400) characters, and `scoreFile`
   takes its `dayHit` from it instead of a whole-file `includes`.
3. **Distance is measured in characters, never lines**, because this ledger's
   index puts a whole record on one line.
4. The `timestamp` signal is untouched. A day AND a minute together is
   effectively unique to one forward and stays decisive wherever it appears,
   including in `INDEX.md`.

## Impact

**If this had been left alone.** The next Morning Brew, CompTIA, ByteByteGo or
any other recurring forward would keep drawing a build-blocking verdict on a
calendar coincidence, and the cost compounds in the direction that is hardest to
see: a lesson NOT built leaves no artifact to notice. A duplicate lesson is
visible in the congregation's app and gets fixed; a teaching silently skipped
because a brake misfired looks exactly like a quiet day. Today's case is the
measurable instance — World Issues 20 would not exist.

**What this obligates.** The `source+day` verdict now means something narrow and
defensible — the source and the day in one statement — so a reader who gets it
should act on it rather than discount it. That raises the duty on the two
remaining gaps named below: the finder is now accurate enough that the missing
thread ids are the weakest link in the brake, not the scoring.

**What it costs.** One constant and one proximity scan per candidate file. The
finder still writes nothing and still fails no build.

## Verification

- **Gates:** `npm run verify:gates` — **all 20 guards OK**, including
  `business-systems-guard`, which refused the first push with *"INDEX.md Next ID
  says DR-1049 but the newest decision on disk is DR-1050 — the pointer must
  read DR-1051"* and passed once the pointer advanced. `decision-chain` also
  refused this record for missing its Impact and Verification steps, which is
  why they are here.
- **Lint:** `eslint src --max-warnings 0` — clean.
- **Targeted:** `lesson-already-built.test.js` **24/24**; with
  `business-systems-guard.test.js` **33/33**; the ledger blast radius
  (`decision-record-guard`, `decisions`, `decision-chain`,
  `resolve-ledger-conflicts`, `renumber-decision-record`) run green.
- **Proven to catch, both ways:** script reverted ALONE, test kept → **RED,
  8/24**, one of them behavioural (`expected 'source+day' to be 'source'`);
  restored → **GREEN, 24/24**.
- **Re-run on the live ledger, not fixtures:** the three real forwards answer
  ALREADY BUILT / WEAK / MAYBE respectively, and the two historical regressions
  (DR-0791's forward, DR-0416's forward) still answer as they should.
- **Not proven here:** the full 1,540-file suite did not complete locally —
  parallel sessions hold the shared local memory lock. CI's four shards cover it
  and are the authority.

## What this does not fix

- **The lock is still a single witness outside the repo, and it failed today.**
  DR-0610 names the lock as "the `lesson-captured` tag written only after the
  push". Thread `1a135f165fe391e3` was built as sov39 under DR-1005 on
  2026-10-13 and **was never tagged**, so the Gmail door re-surfaced it as
  uncaptured two days running. The tag is a Gmail label that can silently fail
  to be written, and nothing in the repo contradicts it.
- **6 of the 15 records built from a forwarded email carry no Gmail thread id**
  — DR-0416, DR-0759, DR-0763, DR-1001, DR-1004 and DR-1005 — so for those the
  ledger cannot be queried by thread id at all, and this finder has to work by
  subject, source and timestamp instead of by the one identifier that is exact.
  DR-1005 is the record that bit today. Recording the thread id in every
  email-sourced record, and a guard that requires it, would make the ledger a
  second witness that no missed label can defeat. Not built here: it is a
  convention change across the record format and it wants its own decision.
  **`re-review: 2026-10-22`** — alongside the other intake items already dated
  that day.
- The thread's `Lesson-Captured` label is **still not written**. The label calls
  need an approval this session does not hold, so the tag is outstanding and is
  reported as outstanding rather than assumed.
