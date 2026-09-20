# DR-0544 — The youth band was never on the reading ladder

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** bug
- **Relates to:** DR-0543 (the adult prose IS the adult version), DR-0418 (the age bands and their floors), DR-0417 D3 (the child ceiling is an AGE number), DR-0076 (measure don't claim; proven-to-catch), DR-0075 (perpetual improvement)

## What Darrell said

Looking at a lesson's level row, having just been told by the app that switching levels changes the pace and not the words:

> *"Choosing to change the length?!!!!!!!!!!! Not the lessons to fit the level?!!!!!!!!!!!!!"*

DR-0543 fixed the app **saying** that. This record is the other half: whether the lessons actually **do** fit the level, and who was checking.

## The defect

`scripts/reading-level.mjs` shipped 2026-09-06 with:

```js
export const BAND_ORDER = ['child', 'teen', 'senior'];
```

The **youth** band was introduced with L81 and never added. `measureLesson` looped over that same literal, so it never produced a youth figure at all, and `isInverted` never had one to compare. For two weeks the app displayed a youth level that **nothing measured** — while the band-fill pass (task #84) was authoring eighty more of them.

This is the same class of hole the gate's own header describes finding in the child band, hidden one rung further down.

## Measured, the day the rung was added

| | |
|---|---|
| Lessons carrying a youth band | **115** of 187 |
| Of those, inverted at the youth rung | **30** |
| Shape of every one of the 30 | youth reads **harder** than teen |

Thirty lessons where the **younger** band is the **harder read**. That is Darrell's sentence, measured: the lesson was not fitting the level, and the instrument that exists to say so was looking the other way.

## The change

1. `BAND_ORDER` is now `['child', 'youth', 'teen', 'senior']`, and `measureLesson` derives its loop from it rather than repeating the literal — so the next band added cannot be forgotten the same way.
2. The 30 are recorded in `reading-level-baseline.json` as **shrink-only debt**. The `inverted` list grew once, on this date, because the gate widened — not because the corpus worsened. That is stated in the baseline's own `note` so a future reader cannot mistake it for a regression.
3. A new inversion at the youth rung now **fails the build**, exactly as the child rung does.

## Verified

- Six new assertions in `reading-level-gate.test.js`, including three **proven-to-catch**: youth harder than teen is caught; youth easier than child is caught; and — the one that names the miss — *the same lesson passes when youth is removed from its levels*, which is precisely what the three-rung ladder was doing.
- One assertion pins the youth debt at **≤ 30** and requires every currently-inverting lesson to be present in the baseline. The number is a ceiling that can only come down.
- **L129, L130 and L135 were not given an exemption.** Each carries a dedicated test asserting it does not invert — L129 and L130 as the gate's own "authored since this gate, is CLEAN" standard, L135 in its own verses file — and all three inverted at the new rung (L129 youth 5.8 / teen 5.6; L130 6.0 / 5.5; L135 7.0 / 6.7). A standard with an exemption is not a standard, so all three youth bands were re-authored rather than recorded as debt: L129 now reads 5.2 against 5.6, L130 5.1 against 5.5, L135 6.0 against 6.7, nothing removed from any of them. **L135 was found by the full suite, not by me** — the targeted run before it was green, and the per-lesson standard file is what caught the one the corpus ratchet would have quietly absorbed.
- **The title-in-narrative gate caught two of the new youth bands.** Every band must name its own lesson inside its first 200 characters (at least half the title's distinctive words), so a reader inside the narrative is reminded what he is in. The new youth bands for L6 and L8 opened on their own headings and named nothing. That gate is shrink-only too, so rebuilding its baseline would have **recorded my two new bands as debt** — the quiet way a ratchet stops meaning anything. Both openings carry the title now; the count is back to 431 with zero fresh.

## The honest remainder

Flesch-Kincaid is still a proxy and still is not comprehension (the caveat DR-0332 forces, asserted in the gate's own header). What it catches is the gross case, and the gross case was present 30 times.

The 30 are real work, not a formality — each one is a youth band that needs re-authoring so a fourteen-year-old meets an easier read than a seventeen-year-old does. They are being worked in the same pass that is filling the 282 remaining short band-slots, newest defect first.

**re-review: 2026-10-10** — report how many remain, from the committed baseline rather than from memory. L135 came off in this same change, so the recorded inverted debt stands at **43**, of which **29** are youth-rung.
