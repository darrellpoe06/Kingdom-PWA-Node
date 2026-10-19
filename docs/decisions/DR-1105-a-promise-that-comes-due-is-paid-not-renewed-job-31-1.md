# DR-1105: A promise that comes due is paid, not renewed — and two sessions paid the same one within the hour

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one passage placed into one existing lesson's five registers; no schema, no surface, no door)
**Type:** lesson

**Area:**
- `app/src/lib/living-lessons-class.js` (ll113 — Job 31:1 placed in the adult prose and all four bands)

**Grounds:** The gate's own clock. `passage-reach.test.js` failed CI run 39180829118 (shard 3/4, 00:34 UTC 2026-10-19) with a single message out of 6,144: *"Job 31:1 is still stranded in ll183- and its parking expired 2026-10-19 — a covenant with your eyes."*
**Principles:** DR-0075 (a non-improvement is a recorded decision WITH a date — and the date is a promise, not a deferral); DR-0547 (the reach gate and its stranded-in-its-own-introduction check); DR-0644 (the ledger refuses a number collision rather than folding a decision away); DR-0076 §3 and §8 (proven-to-catch; verbatim from the corpus; every premise re-measured rather than recalled)

## Context

Darrell, 2026-09-19, after L183 taught four passages that had been at zero
lessons: *"Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were all at zero
lessons — Make sure it's not that way anymore... make sure its everywhere it's
discussion so it can be more fully comprehensive understanding based on more
Word... make sense?"*

Three were placed then. Job 31:1 was parked with a date, and the parking stated
its reason: every lesson discussing its subject carried full-levels debt, so
placing into one of them would deepen that debt instead of paying it. The date
was 2026-10-19. It arrived, and the gate failed the build — which is the entire
point of writing a date instead of an intention.

## What was measured

| asked | answer |
|---|---|
| how many lessons carried Job 31:1 when the gate fired? | **one** — `ll183-realign-my-eyes-your-type-was-trained`, in all five of its registers |
| how many lessons discuss the subject at all? | **103** |
| was the parking's premise — every host carries full-levels debt — still true? | **no.** Many hosts now serve all five bands; the debt that justified the parking had been paid elsewhere while the parking sat |
| which hosts actually *teach* this rather than mention it? | **ll92** (Yahweh Standardized Love), where Matthew 5:28 counts the look; and **ll113** (the spirit is willing, the flesh is weak), whose `CUT THE SUPPLY LINE` movement teaches intake decided in advance from Romans 13:14 with James 1:14 |

A first pass of that measurement over-read the hosts: it counted a band as
"full" at 500 characters, which is length, not the ratio the band gates read.
Corrected before anything was written.

## What actually happened, which is the finding

**Another session hit the same expiry in the same hour and fixed it
independently.** Main's #2252 — merged 02:0x UTC, while this branch sat under
Darrell's `hold` — discharged Job 31:1 into **ll92**, raised the floor from 1
to 2, and recorded it in the file's own `DISCHARGED <date> into <lesson>`
idiom, the same form Luke 4:19's row already used. That is the better host and
the better wording: Matthew 5:28 is the direct New Testament counterpart to
Job 31:1, and ll183 itself pairs them.

So this record is deliberately small, and says plainly what it is: **main's
ll92 placement is the discharge. This adds ll113 as a second carrier, and
nothing else.** `passage-reach.js` on this branch is byte-identical to main's —
its row payment, its floor, its wording are main's work, not mine, and I took
them wholesale rather than merge two rewrites of one row.

Why keep the second carrier at all, rather than drop it as duplicated effort:
Darrell's instruction was *"everywhere it's discussion,"* ll113 genuinely
teaches the discipline at that point, and the gate proves in its own cases that
a floor is a floor and never a quota — reaching further can never fail. Reach
is now 3. **If he would rather carry one placement than two, this is the one to
drop**; the gate stays green either way, because main's satisfies it alone.

## Impact

Nothing here was found by a report from the live site; it was found by honoring
a date, twice, by two sessions that could not see each other. The parking
mechanism worked exactly as DR-0075 intends — a date was written, came due, a
deterministic gate failed the build on the day, the stated reason was
re-measured and found no longer true, and the work was done rather than the date
pushed. The duplicated effort is the cost of parallel sessions, not of the
mechanism.

The collision also cost four renumbers on this branch in one night: main took
DR-1101, DR-1102 and DR-1103 (#2252) and the lesson id **ll253**, so this
record moved 1102 → 1105, its sibling 1101 → 1104, and the two held lessons
moved to **ll254** and **ll255** — the fourth and third renumber each. Every
move was refused-then-prescribed by `resolve-ledger-conflicts.mjs` rather than
folded, and performed by `renumber-decision-record.mjs` on a clean tree in the
order the refusal named.

## Decision

**1. Main's ll92 discharge stands as the payment, untouched.** This branch takes
`passage-reach.js` from main verbatim.

**2. ll113 keeps a second carrier**, because the subject is genuinely taught
there and reaching further is explicitly permitted. Reach 3, beyond the
introduction 2.

**3. The record stays small and says whose work is whose.** Writing this up as
though it were the payment would make duplicated work look like a finding, which
is the kind of thing a reader cannot see afterward.

## Verification

- **Measured after the merge, not claimed:** Job 31:1 reach **3**, beyond its
  introduction **2**, carried by `ll92-…`, `ll113-…` and `ll183-…`; the
  whole-series stranded list is **empty**.
- `passage-reach.js` is **byte-identical to `origin/main`** (`git diff` against
  main on that path is empty).
- **The quotation is the corpus text:** identical to the five places ll183
  already carries it; `a-quoted-verse-is-the-corpus-verbatim` (356 cases) green,
  with `living-lessons-l113-verses`, `course-quotation-integrity` and
  `kjv-corpus-name-case`.
- **Resolving the 17 MB catalog took four attempts, and every one of the first
  three was caught by a measurement rather than by review.** This is recorded
  in full because the failure mode is silent deletion — the DR-0644 class
  arriving through a merge instead of a ledger fold:
  1. **Taking main's copy wholesale dropped this branch's lessons.** Measured
     against `HEAD` before any commit: `laziness merged:0 HEAD:1`.
  2. **Grafting back "the two lessons" dropped a third — `ll79`**, this
     branch's entire reason for existing. Caught by `living-lessons-order`,
     which found a dates entry (`ll79-justice-and-righteousness-travel-together`)
     with no module to match it. The lesson was that a graft set must be
     *computed* (`ours - theirs`, cross-checked against `ours - base`), never
     recalled from memory.
  3. **The two appended modules landed in the wrong array.** The script took
     the first `^];` in the file, which closes
     `LIVING_LESSONS_SESSION_FLOW` at line 404, not `LIVING_LESSONS_MODULES`
     at 24621. The runtime count gave it away: 251 modules and highest `ll253`
     where 253 and `ll255` were required.
  4. **`ll79` was placed by the wrong neighbour.** Positioned among the
     JSON-style modules it sits between `ll56` and `ll193`; in the array the
     reader walks it sits between **`ll78` and `ll80`**, which is what
     `living-lessons-l79-verses` asserts, and it failed until placed there.
  The final resolution asserts all of it mechanically: the graft set equals
  what this branch added, every affected id appears exactly once, `ll79`'s
  array neighbours are `ll78` and `ll80`, exactly three modules were added, and
  no conflict marker survives.
- **The counts were measured against main, not assumed:** main is **250**
  modules with highest `ll253` and no `ll79`; this branch is **253** with
  highest `ll255`, no duplicate numbers, and every module dated and every date
  matched to a module in both directions.
- Lint clean; `verify:gates` green **by exit code** from `app/`; the ledger
  resolver reports the ledger whole with the pointer computed from disk.

## What this does not do

- **It does not touch ll183 or ll92.** The introducing lesson and main's
  placement are unchanged.
- **It does not raise any other row's floor**, and it adds no `strandedUntil`
  anywhere. No row in the registry is parked.
- **It does not address ll113's band ratios.** Child at 0.40 and senior at 0.46
  sit below the shares a newly-authored lesson must meet; that predates this by
  a year and is the lesson's own debt, not this passage's. **`re-review:
  2026-11-19`** — measure how many of the series sit below the new-lesson band
  floors, and decide whether that is a backlog to pay or a floor that was only
  ever meant to apply going forward.
