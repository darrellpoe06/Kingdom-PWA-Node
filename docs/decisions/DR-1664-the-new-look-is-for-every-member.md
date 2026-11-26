# DR-1664: The new look is for every member, not two accounts

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn and Institute change look; no data, schema or money; the classic page remains a fail-safe)
**Type:** product
**Area:** `app/src/poe-financial-mvp-v28.jsx` (the two defaults), `app/src/components/ChurchLearn.jsx` (comments), `app/src/__tests__/learn-functions-in-new-look.test.jsx`
**Sent in by:** Darrell, 2026-11-26 02:4xZ: "Why don't the new look show on others phones?!!!!!!!!!!!!!!!!!!!!!!!!!!!!" and "Only Christina and mines!!!!!!!!!!!"
**Pairs with:** DR-1654 (every lesson in the new look, owner devices), DR-1662 (every Learn function in the new look), DR-1663 (it never hands back), #2897 / #2898 (the Institute redesign, owner preview)

## Context

The new Learn (DR-1654, DR-1661, DR-1662, DR-1663) and the new Institute (#2897, #2898) were built as previews for the owner's devices and shown nowhere else. Darrell saw that other members' phones still show the classic pages.

## What was measured

- `poe-financial-mvp-v28.jsx` passed `learnStudioDefaultOn={['darrell', 'christina'].includes(personaOf(authSession?.user?.email))}` to `ChurchLearn` and the same condition as `studioDefaultOn` to `ChurchInstitute`: true for exactly two personas, false for every other member and every signed-out visitor.
- That one prop also gated the Lesson Experience (`ownerDevice`): every other member's Read / Listen opened the classic reader.
- A device that remembered an explicit `?learnStudio=0` / `?instituteStudio=0` (or the Learn fail-safe's remembered off) keeps its choice; nothing else needs a URL.

## Decision

1. **The new Learn, its Lesson Experience and the new Institute default ON for every member**: the shell passes both defaults with no persona condition.
2. The classic pages stay as the fail-safe: the error boundary (DR-1654) still falls back to them, and `?learnStudio=0` / `?instituteStudio=0` still turns a device back.
3. **The walks follow the product.** The browser journeys run as a signed-out visitor, who now gets the new look: `lesson-link-lands` accepts the new-look cover of the linked lesson (or the classic lesson space, the fail-safe); `learn-by-taps` taps Learn, the first lesson picture, Read Lesson, and requires the lesson's title in the Lesson Experience. Both planted faults are still caught by exactly their own walks.
4. **The Lesson Experience's "Owner preview · this lesson is not public yet" badge is removed**: it is public now, and the badge would tell every member something false.
5. A standing test holds it: the shell must pass both defaults with no persona condition (proven to catch: with the two-persona condition restored, it fails).

## Impact

- Every member, and every visitor, now opens Learn and the Institute in the new look, with every function DR-1662 and DR-1663 carried over.
- The shell did not grow (monolith budget 5172 held).

## Verification after merge

- `learn-functions-in-new-look.test.jsx` (the every-member case), `institute-studio.test.jsx`, `church-learn-play-and-courses.test.jsx`, `learn-studio-owner-default.test.js`: 69 of 69.
- `scripts/e2e/app-journeys.mjs` on a local build (stub backend, as CI): 8 of 8 walks; `--break=link` caught by lesson-link-lands only; `--break=taps` caught by the six tapping walks only.
- `lesson-experience-prototype.test.jsx` now proves the Experience opened by its `.le-root`, not the removed badge's text: 90 of 90 with the new-look and journey stand-in suites.
- Not yet seen on another member's phone: someone other than Darrell or Christina opens Learn and the Institute after the deploy and sees the new look.

`re-review: 2026-12-03`
