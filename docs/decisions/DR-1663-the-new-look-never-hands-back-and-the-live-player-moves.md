# DR-1663: The new Learn never hands the reader back to the classic page; the live player moves and closes from itself

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (owner-device Learn preview; the live player is on every door, presentation only)
**Type:** fix
**Area:** `app/src/components/learn-studio/LearnStudio.jsx`, `app/src/components/learn-studio/LessonsInOrder.jsx`, `app/src/components/learn-studio/LearnDashboard.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/components/LiveWorshipBar.jsx`, `app/src/lib/live-player-prefs.js`, `app/src/__tests__/learn-functions-in-new-look.test.jsx`, `app/src/__tests__/live-worship-bar.test.jsx`, `app/src/__tests__/live-player-prefs.test.js`
**Sent in by:** Darrell, 2026-11-26 08:37, with the classic Learn page on his phone: "How is this still a view?... we should be able to keep the functions and make it look better..."; 08:38, with the small live player floating over a course page: "Should be able to move the hovering video... looks good though... also close it from itself to not just top right corner... make sense?"
**Pairs with:** DR-1662 (every Learn function in the new look), DR-1654 (no feature is lost)

## Context

DR-1662 deployed at 02:29Z. Eight minutes later Darrell was on the classic Learn page again, with "‹ New Learn (preview)" showing: the new look had handed him back. The small live player (#2898) floated over the lesson cards with its only controls in the top strip.

## What was measured

- The deployed build was the new one: `deploy-cloudflare-pages.yml` workflow_dispatch for `673bb1aff` completed with success at 02:29:54Z; his screenshot is 02:37Z.
- Not a crash: ChurchLearn mounted in the new look with a real-shaped signed-in record (40 record rows with versions read, 20 saved places, 30 lessons of progress, the full catalog) rendered `.ls-root` with no error-boundary fallback (1 of 1).
- What does hand back: three paths in `LearnStudio.jsx` called `onExit` (the classic page): **All Courses**, any department chip the tools did not take, and nothing else on the home. All Courses is the button beside the search box.
- Inside the new look, the tools panel repeated the classic department tabs, quick links, course select, progress line and sorts that the new look's own dashboard already gives.
- The same course key listed twice in a catalog produced duplicate React keys in the lessons course picker (`eternal-torah`, `eternal-wisdom`, `eternal-prophets` in the test catalog).
- The small player: `MINI_FRAME_STYLE` fixed bottom-right; no drag; close and Wide only in the top strip.

## Decision

1. **All Courses stays in the new look**: it goes to the Courses section (pictures, sort, show, view). A department chip opens that department in the tools panel on the same page. The classic page is reached only off the owner devices, or if the new look itself fails (the error boundary, DR-1654's fail-safe).
2. **The tools panel shows only what the new look does not**: in the new look the classic department tabs, quick links, course select, progress line and course sort are left out of it (`!studio`); the area strip (Lessons, Continue, Latest, Browse, Find, Record, Downloads) and its contents stay. Off the owner devices the classic page is unchanged.
3. **One row per course key** in the lessons picker and the course cards.
4. **The small live player moves and closes from itself**: a grip along its top (the video itself swallows touches) drags it anywhere on screen, clamped so the whole frame stays visible, its place held for the session; the grip carries **Wide** and **×**. The size still comes only from the shared `MINI_FRAME_STYLE` (the drag adds a translate), the frame is never remounted, so the broadcast never restarts.

## Impact

- The reader stays in the new look on every tap of the Learn home. No function removed: every classic tool is in the panel, and what was left out of it is in the dashboard above.
- The live player can be moved off whatever it covers, or closed, with one hand.

## Verification after merge

- `learn-functions-in-new-look.test.jsx`: 16 of 16, including All Courses and a department chip never calling `onExit`, and the tools leaving out the duplicated controls. **Proven to catch:** with All Courses returned to `onExit`, the case fails; restored, it passes.
- `live-worship-bar.test.jsx` + `live-player-prefs.test.js`: 25 of 25; the grip drags the same frame (no remount) and the place is saved; × closes; Wide widens; `clampMiniOffset` keeps the frame on screen.
- 65 of 65 across the six Learn suites that mount it.
- Not yet seen on his phone: Learn > All Courses stays in the new look; the small player drags by its grip and closes with its own ×.

`re-review: 2026-12-03`
