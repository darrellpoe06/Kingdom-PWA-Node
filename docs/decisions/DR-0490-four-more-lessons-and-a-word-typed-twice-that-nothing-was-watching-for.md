# DR-0490 — Four more lessons, and a word typed twice that nothing was watching for

- **Status:** accepted
- **Tier:** B (lesson content, plus a new corpus-wide gate)
- **Date:** 2026-09-18
- **Type:** gate
- **Scope:** `app/src/lib/living-lessons-class.js` (ll98 senior, ll103 youth, ll97 senior + a typo fix, ll104 youth, ll123 a typo fix), `app/src/__tests__/doubled-word-guard.test.js` (new, 8 checks), three baselines rebased
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0484 through DR-0489

## Measured

| lesson | worst before | worst after | bands written |
|---|---|---|---|
| ll98 the-just-judge | 0.63 | **0.41** | senior |
| ll103 his-kings | 0.62 | **0.41** | youth |
| ll97 a-just-weight-for-work | 0.61 | **0.44** | senior |
| ll104 study-your-ways | 0.61 | **0.26** | youth |

Recorded duplication debt **8 -> 4 lessons**. ll104's youth band also came down from **FK 7.92 to 5.04** — it had been reading *harder than the adult lesson*, which is a band not doing its job for its reader.

## The find: "roughly roughly"

While reading ll97's teen band I hit this, shipped, in front of readers:

> worth up to **roughly roughly** 1.69 million dollars, averaging **about about** 338,000 dollars a year against the previous figure of **roughly roughly** 127,000 dollars

Three doubled words in one sentence — in a lesson whose subject is *keeping a just weight for words*. No check in the house was looking for it. A corpus scan found exactly those three, so the corpus was otherwise clean: the cheapest possible moment to install a gate, because the debt was already zero and could be held there with no allowance list at all.

`doubled-word-guard.test.js` reads reader-facing fields across every lesson and fails on a word typed twice.

## Building it taught more than finding it

**The first version reported 37 offenders, and every single one was a false positive of my own making.** It blanked quotations with a space, so `it pairs with the Living Lessons "A" and "B" and its companion...` collapsed to `... and   and its ...` and the detector read two legitimate `and`s as one slip. Replacing a quotation with a **sentinel that is not whitespace** fixed it, because the pattern requires adjacency and a sentinel breaks it. Had I trusted the first run I would have "corrected" thirty-seven sentences that were never wrong.

Three survived the fix, and only **one** was a defect:

- `out-legal legal` (ll55) — deliberate wordplay; the word boundary splits the compound at the hyphen.
- `what makes the good good` (ll174) — the lesson's own thesis, a predicate adjective after a nominalised one.
- `HOW TO USE THIS THIS WEEK` (ll123) — **a real typo**, now fixed.

I then wrote a hyphen rule to excuse the first case, and **my own test killed it**: `out-legal legal` (deliberate) and `well-made made` (a slip) are structurally identical, so the rule would have blinded the detector to a whole class of real typos in order to spare one real phrase. The rule came out; the phrase went into a short `ALLOWED` list where each entry carries its reason and a reader can argue with it. **A structural rule that cannot tell a defect from a feature is worse than an explicit exception, because the exception is visible and the rule is not.**

## What remains

Four lessons: ll171 0.59 (both pairs, and by far the largest lesson in the set), ll167 0.58 (senior), ll94 0.54 (senior), ll168 0.54 (both pairs).
