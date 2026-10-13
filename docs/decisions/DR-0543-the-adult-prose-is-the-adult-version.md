# DR-0543 — The top-level `lesson` IS the adult version, not a fallback from one

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** bug
- **Relates to:** DR-0418 (the age bands and their floors), DR-0239 (surface-says-truth), DR-0076 (measure, do not claim; proven-to-catch), DR-0061 (a surface is a live view of real state)

## What Darrell saw

Two corrections on the same day, on the same wire.

**The morning.** Two screenshots of one Development lesson, TEEN selected and ADULT selected, byte-identical text:

> *"Same lesson on all levels?!!!!! Won't change?"*

That was fixed by making the level row speak: `LessonLevelControl` now reads the `branched` flag and says "This lesson has no *band* version yet" when a lesson has none.

**The evening.** With the row finally speaking, he opened **L186 — Glory to Glory**, which carries four authored bands plus its adult prose, and the app told him:

> *"This lesson has one version for every age so far, so switching here changes the pace, not the words. The Adult version has not been written yet."*

> *"Choosing to change the length?!!!!!!!!!!! Not the lessons to fit the level?!!!!!!!!!!!!!"*

He is right both times, and the second is the more serious failure.

## The defect

The adult band's depth key is `'standard'` (`AGE_BANDS`, `learn-framework.js`). Almost no module carries `levels.standard` — the adult text lives in the module's top-level `lesson` field. So `resolveForAge` ran the chain `['standard']`, found nothing, fell through to:

```js
if (m.lesson) return { text: m.lesson, levelId: chain[0], branched: false, band };
```

`branched: false` is what `ChurchLearn` reads as `noneAuthored`. So **every adult reader — the `DEFAULT_AGE_BAND`, the widest audience — was told their version had never been written, printed over the very prose it was displaying.** On L186 that prose was authored the same day.

The words were right. The app called them nobody's.

And the framing compounded it: "switching here changes the pace, not the words" describes a **length** control. This platform's whole claim is the opposite — the same message taught at each age's capacity (DR-0418: "full message, age-simple"). The copy was advertising the failure mode as the feature.

## The fix, and why it is conditional

Both complaints are the same wire, so one flag has to serve both:

```js
const hasAuthoredBand = !!levels && Object.values(levels).some((v) => typeof v === 'string' && v);
return { text: m.lesson, levelId: chain[0], branched: band.depth === 'standard' && hasAuthoredBand, band };
```

- **A lesson carrying bands** → `lesson` is the deliberate adult version sitting beside them, so the adult band reports `branched: true`. Today's complaint, fixed.
- **A lesson carrying NO bands** → there genuinely is one version written once for everybody, and no band is being served its own text. Every band still reports `false`, so the row can still say so. The morning's fix, preserved.
- **Any non-adult band falling through to `lesson`** → still `false`. A child handed adult prose has not been given a child version, and pretending otherwise would be the same lie pointed the other way.

The naive version of this fix — `branched: band.depth === 'standard'` unconditionally — was written first and **broke three assertions in the morning's own test file**, which had deliberately pinned "a bandless lesson reports branched:false for EVERY band." That test was right, and it caught the over-correction in one run. The condition exists because of it.

## Verified

- All 10 tests in `the-level-row-says-when-there-is-no-version.test.js` pass, including the three the first attempt broke.
- Three new assertions pin the screenshot itself: the adult band on a banded lesson is served its own text and knows it; every band on a fully banded lesson reports `branched: true`; and **proven-to-catch** — strip the bands and the adult honestly reports `false` again, so the fix cannot silently swallow the morning's case.

## The honest remainder

This fixes the app **telling the truth** about what is authored. It does not by itself author anything. Measured the same day:

| | |
|---|---|
| Living Lessons | 187, of which **107** clear all four band floors |
| Course lessons outside Living Lessons | 317, of which **0** carry all four bands, 37 carry none |
| Missing band-slots, school-wide | **742** |

The 80 short Living Lessons are **L1–L78 plus L80 and L153** — the youth band was introduced at L81 and the back catalogue was never filled. In those 80 the short bands are child 79, youth 80, teen 79, senior 62: **300 band-slots**, not 80. L1 is filled in this same change as the first of that pass (657 adult prose words against child 116 / teen 128 / senior 192 / no youth at all → all four now clear their floors, 21 quoted spans verbatim, grades ascending 2.65 → 3.78 → 5.92 → 6.84, differentiation 0.00).

**re-review: 2026-10-03** — report the measured authoring rate from the first ten filled lessons and convert it into a date for the remaining 742, rather than promising one now.
