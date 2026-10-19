# DR-1102: A promise that comes due is paid, not renewed — Job 31:1 leaves the lesson that introduced it

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one passage placed into one existing lesson's five registers; a registry row paid off and its floor raised; no schema, no surface, no door)
**Type:** lesson

**Area:**
- `app/src/lib/living-lessons-class.js` (ll113 — Job 31:1 placed in the adult prose and all four bands)
- `app/src/lib/passage-reach.js` (the Job 31:1 row paid: `strandedUntil` removed, floor 1 → 2, reason rewritten; the header note records that no row is parked)

**Grounds:** The gate's own clock. `passage-reach.test.js` failed CI run 39180829118 (shard 3/4, 00:34 UTC 2026-10-19) with a single message: *"Job 31:1 is still stranded in ll183- and its parking expired 2026-10-19 — a covenant with your eyes."* One failure of 6,144.
**Principles:** DR-0075 (a justified non-improvement is a recorded decision WITH a re-review date — and the date is a promise, not a deferral); DR-0547 (the reach gate itself, and the stranded-in-its-own-introduction check); DR-0621 (hold the hand of the process — a flag is where the work starts; we never discard what does not work); DR-0076 §3 and §8 (proven-to-catch; every quotation verbatim from the corpus, every premise re-measured rather than recalled)

## Context

Darrell, 2026-09-19: *"Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were
all at zero lessons — Make sure it's not that way anymore... make sure its
everywhere it's discussion so it can be more fully comprehensive understanding
based on more Word... make sense?"* Three of the four were placed then. Job 31:1
was not. It was **parked with a date**, and the parking stated its reason: every
lesson discussing its subject carried full-levels debt, so placing into one of
them would deepen that debt instead of paying it.

The date was 2026-10-19. It arrived, and the gate failed the build — which is
the entire point of writing a date instead of an intention.

## What was measured

The parking's own premise was re-measured on the day rather than assumed
(`feedback-surface-premise-conflicts`, applied to my own earlier reasoning):

| asked | answer |
|---|---|
| how many lessons carried Job 31:1? | **one** — `ll183-realign-my-eyes-your-type-was-trained`, the lesson that introduced it, in all five of its registers |
| how many lessons discuss the subject at all? | **103** |
| is the parking's premise — every host carries full-levels debt — still true? | **no.** Many hosts now carry all five authored bands. The debt that justified the parking was paid elsewhere while the parking sat |
| which host actually *teaches* this, rather than merely mentioning it? | **ll113** — *the spirit is willing but the flesh is weak* — whose `CUT THE SUPPLY LINE` movement already teaches intake decided in advance, from Romans 13:14 with James 1:14 |
| does ll113 serve every band its own depth? | **yes** — adult prose plus child, youth, teen and senior, all authored |

A first pass of this measurement over-read the hosts: it counted a band as
"full" at 500 characters, which is length, not the ratio the band gates care
about. Corrected before anything was written — ll113 qualifies because all five
registers are authored, not because of a character count.

## The placement

Job 31:1 is the concrete form of the discipline that section already teaches.
Romans 13:14 says make no provision; James 1:14 gives the sequence; Job bound
one faculty in advance **and stated his reason in the same breath** — which is
the same move, made specific. So it was placed where that movement sits, in each
register's own voice rather than pasted five times:

- **adult** — after James 1:14 closes the provisioning sequence, as the decision
  put in writing with a clause attached.
- **youth** — after "most falls are actually lost at the setup stage", as what
  binding it on one faculty looks like.
- **teen** — inside the seven-move run, between Romans 13:14 and sowing on
  purpose.
- **child** — after "Walking away early is not cheating", in the register that
  movement already uses: a promise made to Yahweh ahead of time, so you do not
  have to argue with yourself about it.
- **senior** — in move 6's reference chain, in that band's teaching-notes idiom,
  with the note that it preaches hard to a congregation that has watched decades
  of intake decided by default.

The quotation is the corpus text, verbatim, identical to the five places ll183
already carries it: *"I made a covenant with mine eyes; why then should I think
upon a maid?"* (Job 31:1). The child register quotes the first clause only,
exactly as that band's register does elsewhere. Nothing was paraphrased and no
quotation was altered (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).

## Impact

The reader who arrives at the flesh-and-spirit door now meets the passage; before
today, only the reader who arrived at ll183 did. That is the whole of what
Darrell asked for in September, finished for the last of the four he named.

The quieter result is about the mechanism rather than the verse. **The parking
worked, end to end, with nobody remembering it**: a date was written into a
registry row, the row came due, a deterministic gate failed the build on the day,
the stated reason was re-measured and found no longer true, and the work was done
instead of the date being pushed. That is DR-0075 behaving as designed, and it is
worth recording because the opposite — a date arriving and being renewed by
reflex — is the failure mode that makes parking a synonym for never.

## Decision

**1. It is placed, not re-parked.** The parking's premise was re-measured and no
longer held; a date that comes due with its reason expired is paid.

**2. The floor is raised from 1 to 2, and `strandedUntil` is removed.** A floor
of 1 was satisfiable by ll183 alone — the exact defect DR-0547 exists to stop —
and the row is no longer parked, so a regression that removes the ll113
placement fails outright rather than waiting for a date to pass.

**3. No row in the registry is parked.** The header note says so, and says why
that matters: the next person to add a `strandedUntil` is doing something the
file currently does not do, and should read how this one ended.

## Verification

- **Proven to catch, both halves** (DR-0076 §3): with the new row in place, the
  placement was reverted and the gate named it twice — *"Job 31:1 reaches 1
  lesson(s), floor is 2"* and *"Job 31:1 reaches only ll183-, the lesson that
  introduced it"*. Restored **byte-identical** (`cmp`) and green after restore.
  Note the second message no longer reads "parking expired": unparked, it fails
  immediately, which is the stronger state.
- **Measured after the placement, not claimed:** Job 31:1 reach **2**, beyond its
  introduction **1**, carried by `ll113-…` and `ll183-…`; the whole-series
  stranded list is **empty**.
- **The quotation is the corpus text:** `a-quoted-verse-is-the-corpus-verbatim`
  (356 cases) green, with `living-lessons-l113-verses` (69), `course-quotation-integrity`
  and `kjv-corpus-name-case` — 442 cases in all.
- **The bands held:** `living-lessons-adult-band-debt`, `living-lessons-full-levels`,
  `four-band-ladder`, `band-differentiation-gate`, `course-bands-reach-the-reader`
  and `passage-reach` — 116 cases green. ll113's band ratios moved as expected
  for five small additions: child 0.3836 → 0.3968, youth 0.5410 → 0.5431, teen
  0.6227 → 0.6130, senior 0.4607 → 0.4585.
- Lint clean; `verify:gates` green **by exit code** from `app/`.
- **This record's own first draft failed a gate, and it is recorded rather than
  quietly fixed:** `decision-citation-guard` refused the build because
  `passage-reach.js:81` cited DR-1102 before the record existed — *"A citation
  promises the reasoning is written down."* The citation was written first and the
  record second; the gate is right that this is the wrong order.

## What this does not do

- **It does not touch ll183.** The introducing lesson is unchanged; this adds a
  second door, it does not move the first one.
- **It does not raise any other row's floor.** Only the row that came due was
  touched; sweeping the registry on the strength of one placement would be the
  kind of blanket edit this file's own header argues against.
- **It does not address ll113's band ratios.** Child at 0.40 and senior at 0.46
  are below the shares a newly-authored lesson must meet, and that predates this
  change by a year; five sentences neither caused it nor fixes it. It is the
  lesson's own debt, not this passage's. **`re-review: 2026-11-19`** — measure
  how many of the 252 lessons sit below the new-lesson band floors, and decide
  whether that is a backlog to pay or a floor that was only ever meant to apply
  going forward.
