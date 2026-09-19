# DR-0542 — A passage taught on purpose must reach the lessons discussing its subject

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** architecture
- **Relates to:** DR-0076 (measure, do not claim; proven-to-catch), DR-0075 (perpetual improvement; a parked gap carries a why and a date), DR-0418 (the full-levels floors this method had to respect), DR-0541 (L188, which found the same shape in this house's own work)

## What Darrell said

After L183 taught four passages that had been sitting at zero across the whole school:

> *"Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were all at zero lessons — Make sure it's not that way anymore... make sure its everywhere it's discussion so it can be more fully comprehensive understanding based on more Word... make sense?"*

## The defect, named precisely

The failure is **not** "a verse is missing". It is a verse taught **once**, in the lesson that introduced it, and never carried to the other lessons already discussing the same subject — so a reader who arrives at that subject by any other door never meets it.

**Measured across the 187 lessons before this change:** Genesis 29:17, Genesis 24:14, Genesis 24:19, Job 31:1 and Ruth 3:11 each sat in **exactly one** lesson — `ll183`, the one that introduced them. L188 had already found the same shape pointing the other way: Luke 4:18 quoted three times, Luke 4:19 zero times, for 186 lessons (DR-0541).

## Why a declared registry and not a blanket rule

"Every verse must appear in at least two lessons" would be false. Most verses legitimately appear once, and a gate demanding otherwise would push authors to sprinkle Scripture where it does not belong — the mechanical sweep this house forbids, and the same class of error as a blind God→Yahweh replacement.

So the obligation is **declared per passage, with its reason written down**, in `app/src/lib/passage-reach.js`. Adding a row is a deliberate act that says: this passage carries weight beyond the lesson that introduced it. `minLessons` is a **floor, never a quota** — the test asserts `>=`, so a passage spreading further can never fail.

## How a candidate is found, and why the first attempt was wrong

The first measurement matched any lesson whose full text contained **two or more** subject keywords. It returned **107 candidates for Acts 20:27 and 56 for Genesis 29:17** — not a placement list, noise. Placing verses on that evidence would have been exactly the mechanical sweep this DR exists to prevent.

The measure was tightened to the lesson's **declared** subject — title plus bigIdea — which brought it to 77 real candidates whose fits are legible on sight: Leviticus 19:15 to the "just weight" lessons, Ephesians 6:9 to the bondservant lesson. Recorded because the wrong version is the instructive part: keyword co-occurrence cannot decide where a verse belongs, and a looser threshold is not a safer one.

## The placement method that survived measurement

**Write the passage into the adult lesson AND every age band, in that band's own words.**

Adding it to the adult text alone raises the denominator the band-fullness floors are measured against (DR-0418), and can push a healthy band under its floor. Adding to every band raises numerator and denominator together, so shares hold or improve. Measured on the three placements shipped here: `ll123`'s child went 0.65 → 0.67 and its teen 0.66 → 0.67; `ll119`'s child 0.80 → 0.81; `ll115`'s senior 0.75 → 0.76. **No band dropped.**

Two further rules the measurement forced:

1. **Never place into a lesson already carrying full-levels debt.** `ll9`'s youth band is missing entirely (share 0) and `ll21`'s bands are all far under floor. Both were strong subject fits and both were rejected — adding prose there deepens recorded debt instead of paying it. They are hosts only once their bands are authored (task #84).
2. **Insert before the field's final heading, not at the end.** Every adult lesson closes with `THE WHOLE OF IT` and every child band with `ONE MORE PICTURE`. Appending after those blunts the lesson's own ending; the new material lands as a penultimate section instead.

## Shipped

| Passage | Host | Why it fits |
|---|---|---|
| Genesis 29:17 (+29:31, 29:35) | `ll119` — abstention, if I am an option do not pick me | Jacob chose by sight; Yahweh opened the unchosen sister's womb and the King came down her line |
| Genesis 24:14 (+24:19, 24:58) | `ll123` — the answer, the qualification | The servant's sign was a costly kindness nobody told her was a test; her answer was four words |
| Ruth 3:11 (+Proverbs 31:30) | `ll115` — meek and quiet strength, the ornament of great price | Boaz reports a fact the whole city had settled by watching her |

## Verified

- **Quotations:** 335 / 127 / 218 referenced spans in the three host lessons, **zero faults** against their own named verses.
- **Fullness:** no short band in any host; three shares improved, none dropped.
- **Differentiation:** worst pair 0.18 against a ceiling of 0.50 — the per-band wording is genuinely different, which is why inserting one paragraph five times was refused.
- **Gates re-run:** reading-level, full-levels, band-differentiation, quoted-terminal, quotation-integrity, points-numbered, title-in-narrative — 83 tests, all green.
- **The new gate is proven-to-catch three ways:** a passage under an impossible floor, a passage at zero, and a passage "reaching 2" by being quoted twice inside the same lesson.

## The catch that proved the method needs a per-lesson check

The first full run of this change failed **one** test out of 18,731 — `ll123`'s own verse test:

> *"no marriage/legal/contract weight for a six-year-old"*

That lesson's child band deliberately teaches the transferable truth — listening, keeping a hard promise, refusing name-calling — **without** the marriage framing the adult lesson carries, and it guards that with a banned-word check. My child insertion opened *"A man was looking for a **wife** for his master's son"* and tripped it.

**The gate was right and the placement was wrong.** It is the exact class this whole DR is about, arriving from the opposite direction: a passage placed by subject fit can still carry the *host lesson's adult framing* into a band that was deliberately built without it. Fixed by de-framing the child version — a servant on a journey, a well, a costly kindness nobody asked for — which is the part of Genesis 24 a six-year-old can actually use.

**So the method gains a fourth rule:** a placement must clear the **host lesson's own** band rules, not only the corpus-wide gates. Subject fit chooses the host; the host's existing guards still govern what each band may say. Nothing here was loosened to make the placement fit.

## Re-review

- **re-review: 2026-10-19** — Job 31:1 is still at floor 1. Every strong subject fit (`ll21`, `ll113`) is either in the full-levels debt or has under 40 words of band headroom. Raise it once a healthy host exists.
- **re-review: 2026-12-19** — Luke 4:19 and Leviticus 25:9 are at floor 1 by design; raise them as the jubilee subject is taught again, so L188 does not remain the only place they appear.
- **The remaining 74 candidates are work, not a backlog to admire.** The report that produced them is reproducible from `measureReach` plus the subject keywords; the next tranche takes Leviticus 19:15 into the just-weight lessons and Ephesians 6:9 into the bondservant lesson.
