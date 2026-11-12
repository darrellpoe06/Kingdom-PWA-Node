# DR-1430: Every lesson is in both apps; access, not the app, is what is paid for

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (one card's copy and two pins; no price, nothing locked)
**Type:** decision
**Area:** `app/src/components/PoeTechShowcase.jsx`, `app/src/__tests__/a-lesson-link-opens-in-its-own-app.test.js`
**Sent in by:** Darrell, 2026-11-12, after DR-1428 went live: "I want the ability to get lessons to be in both still... access is what is paid for... for certain lessons... make sense?"
**Pairs with:** DR-1428 (two apps, one catalog), DR-0447 (the Love Corner shows the whole catalog)

## Context

DR-1428 sends a shared link to the app a lesson belongs to. It also put a card on PoeTech-subject courses inside the Love Corner, and the card read "This course lives in the PoeTech app." That reads as if the lesson were only over there, which was never what DR-1428 decided.

## What was measured

- **The catalog is the same in both apps.** `ChurchLearn.jsx` reads no app at all: there is no `currentDoor`, no `app-doors` import and no `churchDoorOnly`. Both apps mount the same courses (DR-0447).
- **Access depends on the lesson and the level, not the app.** `lessonAccess` takes the department, the level and the lesson's place in its course, and nothing about the app.
- **Only the card's wording said otherwise.**

## Impact

A reader finds every lesson in whichever app they use. A PoeTech+ member gets the deeper levels in either app, and the Love Corner card now says so.

## Decision

- **Both apps, one catalog.** Every course and every lesson stays in both the Love Corner and PoeTech.
- **Access is what is paid for.** It goes by the person's plan, for certain lessons and levels (DR-1428's rule), and is the same in either app.
- **The card says it plainly.**
  - "This course is here in both apps, the Love Corner and PoeTech. The child level of every lesson and the whole first lesson are free to everyone."
  - "The deeper levels come with PoeTech+ ($39/mo), in whichever app you read."
  - The link reads "See it in PoeTech ›".
- **Shared links are unchanged.** They still open in the lesson's home app (DR-1428), which is a way in, not a wall.

## Verification

`a-lesson-link-opens-in-its-own-app.test.js` has 19 cases, and 34 tests pass with `learn-access-tiers`.
- The card renders saying "here in both apps", "free to everyone" and "in whichever app you read", and never "lives in the PoeTech app".
- **Pinned:** `ChurchLearn` reads no app. A filter by app planted there would fail this test.
- **Pinned:** a business lesson's access is identical when read from `/lovecorner/app/` and from `/poetech-app/`.
