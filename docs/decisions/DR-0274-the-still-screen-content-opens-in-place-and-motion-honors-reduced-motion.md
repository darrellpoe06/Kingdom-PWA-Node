---
id: DR-0274
title: The still screen — content opens in place; every animated scroll honors reduced motion
date: 2026-08-05
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [all]
---

**Post-report, spec-conformance close (DR-0219 run in full).** Darrell, 2026-08-05, with two phone screenshots of the TV Time wall: *"the movement of the screen is an issue... documentation says dont move the screen fast for a features or update because it can cause dizziness for the user."*

**SHOULD (the documented intent).** DR-0131 / session note 2026-07-09, declared verbatim: *"I also don't like how the input shifts fast to another page on the app surface this needs to open inplace and not move fast from that location because humans can get dizzy."* And UX-PATTERNS' accessibility bar: "Reduced motion mode respected (no auto-animation)." The Way was already written; the report is that a surface violates it.

**ARE (the traced reality).** The 2026-08-04 wall fix (DR-0269 session, "the tap looked dead") rendered a tapped poster's card **below the entire wall** and compensated by flying the screen to it — `scrollIntoView({ behavior: 'smooth', block: 'start' })`, a thousands-of-pixels animated flight on a 100-tile wall, **with its own test pinning the flight** (`tv-time-wall.test.jsx` asserted `scrollIntoView` was called — a gate protecting a defect, the same lesson REV-0212 recorded for the Live bar). The wider audit: **16 source files** hardcoded `behavior: 'smooth'`; outside `SpinnerWheel.jsx` (its own private helper) **nothing** in the app consulted `prefers-reduced-motion` for scrolling.

**GAPS.** (1) TV Time's card opened far from the finger and the screen was flown to it — the exact DR-0131 shape. (2) App-wide, animated scrolls ignored the user's OS reduced-motion request. (3) No machinery prevented either from recurring.

**CLOSED — all three, same session:**

- **The card opens IN PLACE.** The tapped tile's card is now a full-width grid row **directly under the tile** (`gridColumn: '1 / -1'` beside the tile in the same grid). The content comes to the finger; the screen holds still. `gentleReveal` nudges only when the card's top edge starts below the fold — by exactly the overshoot, at most about a tile of travel, honoring reduced motion.
- **One motion helper, everywhere.** `app/src/lib/gentle-motion.js` (`prefersReducedMotion` / `motionBehavior` / `gentleReveal`). All 16 hardcoded `'smooth'` sites now ride `motionBehavior()` — smooth only for users who have not asked for reduced motion, an instant cut for those who have. SpinnerWheel's private copy folded into the shared helper (less code, DR-0075).
- **Gate the class.** `__tests__/still-screen-motion.test.js` source-scans the app and fails the build on any hardcoded `behavior: 'smooth'` outside the helper — **proven-to-catch**: run against the pre-sweep tree it named all 16 offenders red (DR-0076 §3). The wall's in-place open + held-still screen is pinned in the corrected `tv-time-wall.test.jsx` (the old pin asserted the flight; the new pin asserts its absence).

**The sanctioned movement forms** are now written as UX-PATTERNS **Pattern 2e** (the standing standard this DR grounds): in-place open first; user-invited travel via `motionBehavior()`; the instant cut (`'auto'`) for view navigation — ChurchLearn's lesson space was already the reference implementation and is unchanged.

**Verification:** full suite green (7,073 tests / 634 files) including the two new/corrected pins; production build green.

grounds: DR-0131, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, SPEC-CONFORMANCE, PERPETUAL-IMPROVEMENT, EXCELLENCE-STANDARD
