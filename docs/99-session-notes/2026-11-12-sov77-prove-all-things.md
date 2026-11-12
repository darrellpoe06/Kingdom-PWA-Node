# Session note — sov77, Prove all things (DR-1457)

**Module id:** `sov77-prove-all-things`
**Course:** Sovereign A.I.: Why We Build Local, week 77
**Decision record:** `docs/decisions/DR-1457-prove-all-things-sov77.md`
**Gmail thread:** `1a17edb181a9c1f6` (forwarded 2026-10-27 19:34 UTC, built 2026-11-12)

**Date:** 2026-11-12
**Status:** accepted
**Tier:** A (additive lesson, no production surface change)
**Area:** Sovereign A.I., the lesson lane, verification doctrine
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, SPOKEN-TEACHINGS-ARE-BUILD-INPUT

## Context

On 2026-10-27 at 19:34 UTC Darrell forwarded The Neuron's daily issue — subject
line "OpenAI's Terra can enter your invoices" — out of his university mailbox
into the lesson lane, with ONE WORD typed above the forwarded header: **Lesson**.
That word is the ask; the newsletter is the occasion only, and the article is not
the foundation of anything the hour teaches. Gmail thread `1a17edb181a9c1f6`.
**Sixteen days** stood between his word and this build, and the record keeps the
gap rather than smoothing it.

The issue carried four items and one question beneath all four: a laboratory
claiming its model had overturned a thirty-five-year-old belief in computer
science; the same laboratory, the same day, shipping a cheaper model built to
click through office software and key in invoices; a second company's filing to
go public with a loss in the tens of billions; and a third offering some sixty
thousand people a way out the door. The writer's own closing line was the honest
one — *how do you check the work?* A filled form verifies in seconds; a proof
takes months, a working group and a funded conference.

Before building, both witnesses were run (DR-1414): the thread's own `labelIds`
carried no `Lesson-Captured`, and `scripts/lesson-already-built.mjs --thread
1a17edb181a9c1f6` returned NOTHING FOUND. `app/src/lib` and `docs/decisions`
were searched for a lesson from the same source; none existed (DR-0610).

## What was measured

**The band gate, measured not claimed** (`fourBandFaults` returned `[]`):

| band | words | share of adult prose | FK grade |
|---|---|---|---|
| child | 1,526 | 0.506 (floor 0.5) | 1.68 (ceiling 5.0) |
| youth | 1,830 | 0.606 (floor 0.6) | 3.82 |
| teen | 1,944 | 0.644 (floor 0.6) | 5.39 (ceiling 6.0) |
| senior | 2,867 | 0.950 (floor 0.6) | 9.83 (ceiling 10.0) |

Adult prose 3,018 words, FK 7.57. Ladder monotone. Worst pairwise overlap
0.224 (adult~teen), ceiling 0.25 — four versions, not one repeated. Three
intermediate runs were measured and three faults closed by hand rather than by
script (DR-1306): child 0.385 and youth 0.473 under floor, and teen at grade
6.66 over its ceiling.

**The verse sweep.** 51 references on `anchor.ref`, every one quoted in a reader
place and every one resolving in `app/public/bible/kjv`; 231 quoted spans across
the five reader places, each a contiguous span of its own chapter. Every verse
was FILLED by `scripts/sov77-fill.mjs` from the corpus on disk and none was
typed. Three proven-to-catch cases: one altered word, an ASCII apostrophe where
the corpus holds U+2019, and a reordered span of the same chapter.

**Trust but verify (DR-0190 / DR-0100), and what the checking CHANGED.** No
primary host was read: `openai.com`, `arxiv.org` and `sec.gov` were not
reachable at this session's egress boundary, so no figure on the page rests on a
primary-source read, and that is said in every reader place with
`re-review: 2026-11-26`. An independent search road was walked on each
load-bearing number, and four things changed:

1. **The headline loss is almost all a non-cash revaluation.** The digest gave
   "$80.75B net loss, including a one-time $72.4B accounting charge."
   Independent coverage of the same filing puts about $72.39B of it in the
   *changed fair value of convertible notes, derivative liabilities and SAFEs*,
   and the **operating** loss near **$693 million**. A reader handed only the
   headline would have taken a bookkeeping entry for money burned.
2. **The digest UNDER-stated the revenue rise** (DR-0100 §5). Its "about 1,200
   percent" is the lower reading; against the filing's own half-year comparison,
   $16.286B against $1.163B, the rise is about **fourteen-fold**, roughly 1,300
   percent. The verified figure is stated plainly.
3. **"Lean verified the result" is narrower than it sounds.** Secondary analyses
   report that the published Lean scope note does not claim the manuscript's
   sharper running-time estimate, and that the posted file does not name the
   hypothesis. The proof-checker checked a formalization; the headline was
   unconfirmed and the working group had returned no verdict. The lesson does
   NOT teach the hypothesis as overturned.
4. **A parallel result from a second laboratory the same day was dropped** by
   the digest. Secondary coverage only — attributed, never asserted.

Two claims checked out and are stated plainly rather than under-claimed: about
60,000 against about 223,000 full-time employees in the company's own June 2026
filing is **26.9 percent**, so the digest's "roughly 27 percent" holds; and the
$1 / $5 per-million token prices at half the larger model's rate held up across
independent coverage. **Not checked at all:** the 9.4s / 17.3s stopwatch
figures, every benchmark score, the chip-lease and datacenter numbers, and the
disclosed data leak.

## Impact

Sovereign A.I. gains week 77, `sov77-prove-all-things`, in all four age bands
from the first commit (P60). The hour opens on 1 Thessalonians 5:21 — a command,
not a mood, that does not stop at suspicion but ends in *hold fast that which is
good* — and runs eight numbered movements: prove all things (Acts 17:11;
1 John 4:1; Revelation 2:2); the ear trieth words, the taste test the Word built
twice (Job 12:11; Job 34:3; Hebrews 5:14); the neighbour cometh and searcheth
him (Proverbs 18:17; 27:2; John 7:18; 2 Corinthians 10:12; Proverbs 25:2); let
every man prove his own work (Galatians 6:4-5; 2 Corinthians 13:5; Haggai 1:5,
7); a just weight and a just measure (Leviticus 19:35-36; Proverbs 11:1;
Deuteronomy 25:13, 15); how long proving takes (Deuteronomy 18:21-22;
Proverbs 14:15; 19:2; Isaiah 28:16; James 1:4); the half was not told me
(1 Kings 10:1, 7; Numbers 13:27, 30, 32); and who trieth the heart
(Jeremiah 17:9-10; Psalm 139:23-24; 26:2; Malachi 3:10; 1 Corinthians 4:3, 5;
3:13; Matthew 7:16, 20). Two bright lines are kept in every band: no stopwatch
and no model weighs a man, because Yahweh alone searches the heart; and the one
Word proved all the way down is a Person — Jesus, the Lamb of Yahweh, the
Eternal Son of Yahweh. The Word is the ruler we measure other things by and
never the thing laid on the scale (DR-0098).

## Decision

Build it once, Word first, with every verse filled from the corpus and never
typed; place it in Sovereign A.I. because the occasion is a technology digest;
state the blocked roads in every reader place with a dated re-review rather than
letting an unverified figure read as a verified one; and state plainly the two
figures that survived checking, because under-claiming a verified truth is as
much a failure of truth as over-claiming an unverified one.

## Verification

- `app/src/__tests__/sovereign-ai-sov77-verses.test.js` — 46 tests, all passing,
  with proven-to-catch cases on the verse sweep (altered word, ASCII apostrophe,
  reordered span), on one band's friend line stripped alone (the per-band check
  names `teen` while the pooled `hasAllThree` still reads green, DR-0795), and
  on a stripped teaching thread. It also closes the KNOWN GATE GAP for this file
  by checking our own prose for British spellings with quotations removed, so
  the KJV's own *honour*, *neighbour* and *labour* inside a quote are untouched.
- `node scripts/record-length-guard.mjs`, `node scripts/business-systems-guard.mjs`,
  `node scripts/re-review-ratchet-guard.mjs`, `node scripts/format-guard.mjs`,
  `npm run lint` — each run by name, exit codes reported on the PR.
- Generated files regenerated, never hand-edited: `app/src/lib/lesson-dates.json`,
  the course-band baseline, and
  `infra/nas-voice-lite/fixtures/clarity-corpus.json`.
- `re-review: 2026-11-26` — go back to `openai.com`, `arxiv.org` and `sec.gov`
  and either read the primary sources or record the refusal again.
