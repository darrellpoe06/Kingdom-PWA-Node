# DR-0547 — A floor the introducing lesson meets by itself is green by construction

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** gate
- **Relates to:** DR-0542 (a taught passage must reach its subject — the gate this corrects), DR-0541 (L188, the acceptable year and the whole counsel), DR-0546 (L189), DR-0076 (verification doctrine, §3 proven-to-catch), DR-0075 (a parked improvement carries a date)

## What Darrell asked

He sent a screenshot of L188's own point 7 — the paragraph headed **OUR OWN HOUSE FAILED THIS MEASURE** — and asked one question:

> *"Did we fix this so this is throughout the lessons we speak on it?!!!!!!!!!!!"*

Then the frame:

> *"We want to understand and clarify the King's message and that is what He was about then we will His Will."*

## The measured answer was NO — and the gate said yes

Counted across the 188 lessons before anything was written:

| Reference | Lessons carrying it |
|---|---|
| Luke 4:18 | 4 — ll53, ll86, ll140, ll188 |
| Luke 4:19 | **1** — ll188 |
| Luke 4:20 | **1** — ll188 |
| Luke 4:21 | **1** — ll188 |
| Isaiah 61:2 | **1** — ll188 |
| Leviticus 25:9 | **1** — ll188 |

ll188 is the lesson that *named* the omission. So the house wrote a lesson saying it had stopped one line short three separate times, and then went on standing there.

**And the gate built that same day reported green.** `passage-reach.js` declared `Luke 4:19` with `minLessons: 1` — a floor the introducing lesson satisfies **by itself**. The count was right. The floor was a lie. That is exactly the shape DR-0076 §3 forbids: *a gate that always passes is itself a lie* — and this house built one, on the same day, about the same defect.

## What changed

**1. The King's own reading, carried into ll86.** Every one of ll86's five versions reads the Nazareth synagogue scene, quotes Luke 4:18, and stops exactly there. Each now reads on: Luke 4:19, its source in Isaiah 61:2, the closing of the book in Luke 4:20, and the claim in Luke 4:21 — the paragraph finishing the sentence it was already in the middle of. Measured after: **92 quoted spans, 92 verbatim, 0 faults**; every band share held or improved (child 1.02 → 1.00, youth 1.11 → 1.10, teen 1.09 → 1.09, senior 1.18 → 1.16, all far over floor); band overlap fell 0.14 → 0.13.

**2. The jubilee trumpet, carried into ll133** — the lesson whose subject *is* the day of atonement and the two goats. Leviticus 25:9 dates the jubilee trumpet to that exact day, so it settles the atonement-before-liberty order from the text rather than from a teacher. Measured after: **176 spans, 176 verbatim, 0 faults**, and every share ROSE (child .54 → .56, youth .72 → .73, teen .60 → .63, senior .62 → .65).

Not ll71, which also teaches jubilee liberty but carries full-levels debt today — its youth band is missing entirely. The registry's own rule: never place into a lesson already carrying that debt, because it deepens recorded debt instead of paying it.

**3. The gate now states the defect instead of approximating it.** Every registry row declares `introducedBy`. `measureReach` returns `beyond` beside `reach` — the count EXCLUDING the lesson that introduced the passage — and `passagesStrandedInTheirIntroduction` fails on `beyond === 0`.

**4. Parking is a DATE, not a floor of 1.** A row may still be stranded, but only the way DR-0075 permits anything to be parked: `strandedUntil` is a date, and it is the promise the placement gets made. No date, no parking. Job 31:1 is parked to **2026-10-19** — every lesson discussing its subject carries full-levels debt today — and the test fails the row the moment that date passes.

**5. Luke 4:20, Luke 4:21 and Isaiah 61:2 are now declared rows.** They were the three lines Darrell's question was actually about and the registry never named them at all.

## Proven-to-catch

The decisive test does not assert the new code works. It pins **the defect**, so a regression that removes the new check cannot pass silently:

```
it('PROVEN-TO-CATCH: the OLD check passes a passage that never left its own lesson', () => {
  expect(
    passagesBelowFloor(onlyIntro, STRANDED),
    'the floor of 1 was met by the introducing lesson, and that is the lie',
  ).toEqual([]);
});
```

Alongside it: the new check names it; `beyond` reads 0 where `reach` reads 1; a placement into a second lesson clears it; an EXPIRED parking date fails; and a row parked with no date at all is not parked. 19 tests in the file, all passing.

## The honest remainder

- **The other direction is not swept.** This closed the passages the registry declares. Whether other verses in this house are taught once and never carried is not measured — the registry is deliberately declared per passage rather than blanket, because a blanket rule would push authors to sprinkle Scripture where it does not belong (DR-0542). **re-review: 2026-11-19** — sample the corpus for taught-once passages with an obvious second home, and declare the ones that earn a row.
- **Job 31:1 is still stranded**, by decision, with its date above.
- **ll71 still carries full-levels debt** — youth band missing, child and teen under floor. It is in the task #84 band-fill queue, not forgotten.
