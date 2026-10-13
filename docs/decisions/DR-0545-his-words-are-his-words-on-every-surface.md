# DR-0545 — His words are His words on every surface, not just the ones a gate happened to read

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** bug
- **Relates to:** DR-0544 (the youth band was never on the ladder), DR-0459 (no ellipsis inside a quotation), DR-0076 (measure don't claim; proven-to-catch), DR-0210 (our voice only — never quoted Scripture)

## The defect

`scripts/quotation-integrity.mjs` declares:

```js
// The fields a reader actually reads. Facilitator notes and quiz explanations
// are deliberately out of scope for the DR-id check in this first cut: the
// facilitator is a steward of the house and a record id is not noise to him.
export const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];
```

That reasoning is sound **for the DR-id check**. The quoted-verse gate then reused the same `readerTexts()` and silently inherited a scope that has nothing to do with record ids. So for as long as the gate has existed, every quotation living in **benefits**, **the quiz**, and **the facilitator's talking points** was never checked against the KJV at all.

This is the same shape as DR-0544 on the same day: a surface that is authored, displayed and read, that no instrument was looking at.

## Measured

| | |
|---|---|
| Spans the gate was checking | 26,629 |
| Spans it was **not** | **2,942** |
| Of those, already verbatim | 2,906 |
| Of those, **faulting** | **36** |

The authoring had been overwhelmingly faithful — which is the reason this went unnoticed. The 36 were not.

**Eight quotations that were not the verse**, each one His words altered to fit our sentence:

| lesson | reference | ours | the verse |
|---|---|---|---|
| ll1 | 1 John 4:18 | "perfect love **casts** out fear" | "casteth" |
| ll14 | 1 Thessalonians 5:18 | "**i**n every thing" | opens the sentence: "In" |
| ll32 | James 1:27 | "pure religion**...** visit the fatherless" | an ellipsis inside a quotation, and "Pure" |
| ll44 | Galatians 2:20 | "in Christ" | the verse says "Christ liveth in me" |
| ll47 | 1 Peter 3:15 ×2 | the "**why**" | the verse says "a reason of the hope that is in you" |
| ll47 | John 10:10 | "**t**he thief" | opens the sentence: "The" |
| ll146 | Deuteronomy 7:7 | the quotation runs on into verse 8 | cited 7:7-8 |

Plus **one shouted word** (ll24 shouted WHOSOEVER inside Revelation 22:17; the emphasis moved into our own sentence) and **twenty-seven references abbreviated** past the point a resolver could check them. A twenty-eighth fault — `"resist... and he will flee"` (James 4:7), an ellipsis and a lowered first word — surfaced only once the abbreviations were written out, which is itself the argument for writing them out.

**All 36 were repaired. None was recorded as debt.** After the repair: **29,572 spans, 29,572 verbatim, zero faults.**

## Two decisions inside the fix

**1. A second, wider scope rather than widening the first.** `readerTexts` keeps its scope and its reason; `quotedTexts` adds benefits, the quiz and the talking points, and the quotation gate judges the series by that. The DR-id check is unchanged.

**2. The abbreviations were WRITTEN OUT, not taught to the resolver.** Teaching `bookFile` that "Phil" means Philippians is a place a wrong book can hide — and "Phil" is genuinely ambiguous with Philemon. Writing the name out removes the guess, reads properly to a facilitator saying it aloud, and leaves the gate refusing any future abbreviation. 86 references across the corpus now carry their full book name.

## Verified

- 17 tests pass, including **four proven-to-catch**. Three of them bend the real module at each surface and assert both halves: the wide scan reports the fault **and the narrow scan reports nothing** — the miss this change closes, asserted rather than described. The fourth pins that an abbreviated reference is `unresolvable`, so it cannot ship unverified.
- One assertion measures that `quotedTexts` reaches more than 2,000 spans further than `readerTexts`, so the widening cannot silently collapse back.
- One asserts the corpus carries **no** abbreviated reference today.

## The honest remainder

This covers the Living Lessons and Little Learners series. The other catalog courses have their own quotation gate (`course-quotation-integrity`) and its scope has **not** been audited the same way. **re-review: 2026-10-03** — run the same measurement against the catalog courses and report the span count, not an assurance.
