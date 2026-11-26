# DR-1699: The Learning Zone discovery landing page

**Date:** 2026-11-26
**Status:** Proposed (built and verified on `preview/learn-discover`; not wired, not merged, not deployed; release needs Darrell's final approval and the homepage owner's review)
**Tier:** B (member-facing front door of Learn; no schema; no change to any lesson, course, title, photograph, progress record or theme)
**Type:** feature
**Area:** `app/src/components/learn-discover/` (new), `app/src/lib/learn-discover-*.js|json` (new), `scripts/derive-learn-discover-index.mjs` (new), `app/src/lib/learn-landing.js` (one allow-list export), `app/src/components/ChurchLearn.jsx` (two lines), `app/public/learn-discover/photos/` (new photography package)
**Sent in by:** Darrell, 2026-11-26 (architecture approval, mockup, photography package, Life Situations Guide approval)
**Pairs with:** DR-1664 (the new look for every member), DR-1606 (Learn opens on Latest), DR-0076 (verification), DR-0075 (re-review dates)

## Context

Learn assumes a person already knows which course holds their answer. Darrell asked for an entrance between The Word / Learning Zone and Learn: describe what you are facing, find biblically grounded lessons, return through the week. Church Homepage -> The Word / Learning Zone -> **discovery page** -> the existing Learn (courses, departments, lessons), which is replaced by nothing.

## What was measured

- The curriculum: 995 lessons, 51 courses, 13 departments (derived index, `lesson-dates:check` 995 of 995). 992 of 995 lessons sit in at least one of the 12 categories; 3 are documented as unplaced.
- Search, by a manual review separate from the automated floor: the nine named questions averaged 7.5 of 10; everyday-situation phrasings were weaker (about 4) before the Life Situations Guide. Several situations have little or no lesson behind them (aging parents, divorce, infidelity, teenagers, loneliness, sleep); the page says so.
- The real app shell (browser run, Night, tour dismissed): the page opens, search and a Life Situation callout work, series and category lists render in Learn Studio's own list, an age button opens the real Learn, 0 page errors.
- Contrast across the themes tried: lowest text 5.5:1; no horizontal overflow at 390 px.

## Impact

- Members: The Word / Learning Zone opens on the discovery page first; Browse All Lessons and the access buttons reach the existing Learn unchanged. Deep links (`?course=`, `?lesson=`) are unaffected.
- Code: additive. Existing files touched: `ChurchLearn.jsx` (2 lines), `learn-landing.js` (one export), `surfaces.js` (one line), the regenerated `legibility-health.json`. The frozen shell, `LoveCornerHome.jsx` and Learn Studio are untouched.
- Latency/state: the page and its index (about 0.9 MB gzipped) load lazily; no schema, no new storage except the optional opt-out key. Series progress reads the device's existing saved places; no new progress record.
- Journeys: the `learn-by-taps` walk (scripts/e2e/app-journeys.mjs) now goes through the new front door (it taps Browse All Lessons before the lesson list) with all its original assertions kept; CI's built-app run found this, and the same path passes in a browser run.
- Rollback: revert the `surfaces.js` line, or `?discover=0` / `localStorage['poe-learn-discover']='0'` per device.

## Decision

1. A private, additive discovery page (search, 12 topic categories, Continue Learning from real saved progress, Today's Word, Featured Series, All Courses by the 13 departments, access buttons) that opens the existing Learn through its own doors: the one-time area hint, Learn Studio's own controls, `requestOpenLesson`, and the course card.
2. Search is browser-side and free: a derived compact index (995 lessons, 51 courses, 13 departments), a stemmer, the finder's seat guarantees kept, a concept map, and a hand-read Life Situations Guide (57 entries, expandable to 150 as data). A situation the curriculum only touches says so on the page; one with no lesson returns nothing rather than unrelated lessons.
3. Visual: the approved mockup, colors sampled from it. Near-black page in the two dark themes (Night, Midnight); the light themes keep their own surface. No theme is overridden.
4. Photography: the supplied package fills banner, 11 categories, 4 series and Today's Word; lesson, course and Continue covers are untouched. Technology keeps its existing cover.
5. Microphone stays off. Trending is excluded until real activity data exists. The five Featured Series (lesson selections and teaching order) were approved by Darrell 2026-11-26; the "Proposed lists" label is removed. The lists may be refined after launch.
6. ChurchLearn.jsx changes by exactly two lines (the area-hint allow-list). The page is mounted through `surfaces.js` (one line; the frozen shell is untouched) behind `LearnDoor`: deep links, an opt-out and a failed load all show the existing Learn. See `docs/design/learn-discover/INTEGRATION.md`.

## Verification

Tests: discovery (62), situations (4), entry (3), nav into the real ChurchLearn in both looks (20), plus the repo gates (lint, format, ui-standards, still-screen, American spelling, legibility). Search: manual review separate from the automated floor (SEARCH-EVALUATION.md). Everyday-situation queries remain weaker than topical ones.

## Re-review

`re-review:` 2026-12-10, or when Darrell approves the series, the photographs at full resolution, and the shell wiring, whichever is first.
