# DR-1661: The lessons are first on the Learn home, in order

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (owner-device preview; layout, nothing removed)
**Type:** product
**Area:** `app/src/components/learn-studio/LessonsInOrder.jsx` (new), `app/src/components/learn-studio/lesson-experience.css`, `app/src/components/learn-studio/LearnStudio.jsx`, `app/src/components/learn-studio/LearnStudioPreview.jsx`, `app/src/components/learn-studio/learn-studio.css`, `app/src/__tests__/lessons-in-order.test.jsx` (new)
**Sent in by:** Darrell, 2026-11-26, on the Learn home: "Fix it!!!!!! Where is the lessons!!!!!!!!!!!!!!!!" and "New look lessons?!!!!!!!!!!"; 2026-11-25: "Show lessons in chronological order as the default... I want to read these in order especially the living lessons."
**Pairs with:** DR-1654 (every lesson in the new look), DR-1657 (the Kids library in order), DR-1606 (Learn opens on Latest: the classic list, unchanged)

## Context

On his phone the new Learn home showed the prototype banner, the search box and a full-screen hero. No lesson was on screen without scrolling, and nothing listed a course's lessons in order.

## What was measured

- His screenshot (2026-11-26 06:51): banner, search, hero; zero lesson rows in the first screen.
- Living Lessons mounts 338 lessons in the catalog the Learn home reads.

## Decision

1. **The list is first**, directly under the search box: a course picker (Living Lessons first), an order picker (In order by default; Newest first, A to Z, Z to A), and the lessons as compact numbered rows, lesson 1 on top. Five rows show at once, then "Show 20 more" and "Show all".
2. **One tap on a row opens that lesson in the new look** on the owner devices (the classic reader elsewhere), the same hand-off Read uses.
3. **The prototype banner moves to the bottom** of the page; the hero and every shelf stay, below the list.
4. **On a phone the words get the width** (Darrell, same morning: "the words leave a lot of room around the edge of screens"). In the lesson view the side margins drop from 38px to 20px each (page 16 to 8, card 22 to 12), so on a 390px screen the reading column goes from 314px to 350px, by the CSS; the Key Teaching box and the verse rule tighten too. Auto-hyphenation is off on phones ("chas-ing", "hear-ken" in his screenshot), and "Back to Learn" no longer wraps.

## Impact

- Lessons are on screen when Learn opens, in order. Nothing removed.

## Verification after merge

- `lessons-in-order.test.jsx`: 4 of 4 (order and every sort; list before hero and banner; show all; one tap opens the new look, classic off the owner device). 111 of 111 across the eight suites that touch the Learn home. legibility-guard: no new violations.
- Not seen on a phone yet: Darrell opens Learn and sees lesson 1 without scrolling.

`re-review: 2026-12-03`
