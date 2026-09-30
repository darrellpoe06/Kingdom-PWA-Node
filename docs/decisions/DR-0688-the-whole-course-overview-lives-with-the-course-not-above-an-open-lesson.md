---
id: DR-0688
title: The whole-course overview lives with the course, not above an open lesson
status: accepted
date: 2026-09-30
tier: A
type: surface
declared_by: Darrell
scope:
  - app/src/components/ChurchLearn.jsx (the overview renders only on the course's lesson list, renamed as the whole course; the course-wide cohort date leaves the open lesson; the facilitator toggle stays)
  - app/src/__tests__/the-course-overview-lives-with-the-course.test.jsx (new)
  - app/src/__tests__/church-learn-play-and-courses.test.jsx, app/src/__tests__/the-lesson-count-is-derived.test.jsx (the new wording)
  - scripts/chrome-layout-probe.mjs (the presenter pass enters the deck from the course page, where the overview now lives; the device pass starts with the live-service bar dismissed)
principles: [VERIFICATION-DOCTRINE (DR-0076), DERIVED-NEVER-PAINTED (DR-0121), REALITY-TRACE (DR-0061)]
grounds:
  - DR-0631 — the lesson's own space and its count read from the lessons themselves
  - DR-0451 — Present this one; the overview was the only deck door before it
---

## Context — his words (verbatim)

Darrell, 2026-09-30, from his phone on poetech.us, Church → Learn → Living Lessons, with L200 open. Above the lesson's own bar ("ALL COURSES / ALL LESSONS / L200 · 1 of 199 / PREV / NEXT") sat a "SHOW FACILITATOR GUIDE" box and a big green "▶ PLAY THE OVERVIEW (ALL 199 AT A GLANCE)" button with its caption ("Opens the big full-screen view … Every lesson below has its own ▶ Play; this one plays the whole series at a glance."):

> "Also the over view should not be at the top of each lesson it is confusing.... only play button should be to play that specific lesson... the whole course overview can live somewhere just not in a confusing place... make. Sense?"

It does. Inside a lesson, a second, bigger play button that plays something else is the confusing thing.

## What was measured

- **Where it rendered.** `ChurchLearn.jsx`, the `weeks` section: the overview button and its caption sat in a plain `<div className="mb-4">` with no condition, directly above the `focusModule &&` lesson bar. So it rendered on the course page AND above every open lesson, in every course that uses ChurchLearn (all 43 courses in the picker, walked by the new test).
- **The facilitator control.** One Governor toggle (`showFacilitator`) that reveals `m.facilitator` on each lesson card. Inside an open lesson only that lesson's card is on screen, so the toggle reveals THAT lesson's guide and nothing else: it serves the open lesson. The cohort start-date controls in the same Governor box are course-wide.
- **The lesson's own Play.** The card's actions row renders twice by design (at the head of the card and after the content, 2026-08-18, so a finished reader need not scroll back). Both copies are the open lesson's own ▶ Play.
- **199 vs L200.** Measured from `LIVING_LESSONS_MODULES` (numbers read from the ids, not from `meta.weeks`): **199 lessons, highest L200, no duplicates, one gap: L79**, which was never made (`living-lessons-dates.js`, the same finding as DR-0631). "1 of 199" and "L200" are both true. The count is right; nothing was changed.

## Impact

A reader who opened one lesson met two play buttons at the top, and the bigger one played the whole series. The one he wanted (this lesson) was the smaller one further down.

## Decision

1. **An open lesson shows no course overview.** The button and its caption render only when no lesson is open (`!focusModule`). Inside a lesson the only play control is that lesson's own ▶ Play. This holds for every course.
2. **The overview's home is the course's own page**, the lesson list before any lesson is opened, where it already sat under "The N lessons" heading. It is labelled plainly as the whole course: **"▶ Play the whole course overview (N lessons)"**, N read from the schedule (the course's own noun: lessons, weeks, sessions). The caption now says it is the whole course at a glance and that one lesson is heard by opening it and pressing its own ▶ Play.
3. **The facilitator toggle stays above the open lesson** (Governor only), because there it reveals that lesson's own guide. **The cohort start-date controls move off the open lesson** and stay on the course page, since they are course-wide.

## Verification

- New `the-course-overview-lives-with-the-course.test.jsx`: (a) the reported case, L200 open as the Governor: no course-overview button, no "at a glance" text, every play control on screen inside L200's own card, the facilitator toggle present, no cohort date input; (b) every course in the picker (43): the course page shows the overview exactly once with "whole course overview (N " where N is that course's schedule length; opening a lesson by its ▶ Play leaves no overview and only the lesson's own Play; "← All lessons" brings the overview back. 2/2 pass.
- **Proven-to-catch:** with `ChurchLearn.jsx` stashed back to main, both tests fail: "no course overview above an open lesson: expected 1 to be +0" and "expected '▶ Play the overview (all 199 at a gla…' to match /whole course overview \(199 /". Restored, 2/2 pass.
- Updated and passing: church-learn-play-and-courses (14), the-lesson-count-is-derived (6). Also run and passing: learn-sort-every-option (14), living-lessons-order (17), learn-lesson-index-is-next (8), learn-lesson-space (5), church-learn-render (5), church-learn-hostile-data (3), over-is-over-and-all-is-obvious (15), the-title-stays-in-view (19), lesson-127-is-the-standard (10), learn-open (8), learn-play-from-the-list (5), continue-a-lesson-numbers (8), learn-browse-without-choosing (12), learn-a-tab-is-navigation-not-a-resume (6); decision-chain, the legibility guard and lint with this record.
- **The chrome-layout probe followed the button.** Its presenter pass opened L1 and clicked "Play the overview" inside the open lesson, so on the first CI run it reported "presenter@360px: no way into the deck was found on the lesson page". That was the probe pinning the old placement. It now loads the Living Lessons course page and presses "▶ Play the whole course overview", the reader's real way into the whole-course deck; the measurements after that are unchanged.
- **A second probe failure, not from this change, measured and closed.** The same CI run also failed the Create device pass at three sizes ("the Workspace canvas starts at 1010px, below the 900px fold"). ChurchLearn is not on the Create page. Measured locally on this build in Chromium at 1440x900: the page root carried `padding-top: 491px` for the fixed live-service bar (LiveWorshipBar, "Live service · The Love Corner · Watch on YouTube"), which shows app-wide inside a published service window read from the runner's clock; at 13:15 UTC on 2026-09-30 that window was open. The pass measures the Create page's own layout, so it now starts with the bar dismissed for the session (`poe.liveWorshipBar.dismissedSession`, the key a person's × sets). With that, the local sweep is green: Workspace canvas at 519px (1440x900), 479px (1920x1080), 661px (390x844), 479px (960x540); presenter both cases ok; coverage 52/52 chrome, 7/7 lesson, 4 device. The live bar's own size during a service is its own surface and is not changed here; re-review: 2026-10-14 whether the layout probe should measure the live bar itself at each device size.
