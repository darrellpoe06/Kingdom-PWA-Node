# DR-1695: the classic Learn tools wear the new look, in pictures

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — presentation only inside the new look; no data, no schema, nothing sent; the classic page (learnStudio=0) is unchanged
**Type:** feature
**Area:** `lib/learn-classic-skin.js` + `scripts/learn-classic-skin.mjs` (new; writes `learn-studio/learn-classic-skin.css`), `learn-studio/StudioTools.jsx` (new), `LearnStudio.jsx` ToolsPanel, `CourseChoiceList.jsx`, `LatestLessons.jsx`, `LessonContinue.jsx`, `LearnSquares.jsx`, `Presenter.jsx` / `AudienceSlide.jsx` (one attribute each)
**Pairs with:** DR-1662, DR-1663, DR-1684, DR-0099, DR-0076, DR-0061
**Session note:** `docs/99-session-notes/2026-11-26-the-classic-learn-tools-wear-the-new-look.md`

## Context

Darrell, 2026-11-26, on the new-look Learn: "what happened to the green section or the things
that is like the full all the courses looking like the old system? When is that update coming?"
And: "We have pictures. Why are we showing words all the time?"

## What was measured (real browser, vite dev, 390 and 1024 px)

1. The "Every Learn Tool" panel embeds the whole classic Learn (DR-1662) in its own palette:
   cream #FAF8F4 cards, ink #1A1815 words, green #5A6E3D buttons — a light page pasted into the
   dark look. Courses, Latest, Continue and Browse listed lessons and courses as text; 0 pictures.
2. 51 classic sources reach 90 distinct color classes; 6 colors had no defined role at all.

## Impact

Whoever opens the tools panel in the new look met a second, older app inside it; now one look, with pictures.
The classic page and every function are unchanged; one generated stylesheet (~110 rules), no data, no latency.

## Decision

1. ONE mapping (`learn-classic-skin.js`) gives every classic color a new-look role (panel, ink,
   dim, gold, coral, line); the generator writes the stylesheet scoped to `.ls-classic-skin`, which
   only the new look's ToolsPanel carries. Rules out-rank every app theme (0,3,0 + !important);
   words on a fill flip dark. A light surface that paints itself inline (the Presenter, an audience
   slide) carries `data-classic-paper` and the skin stops at it.
2. Red stays the Blood (DR-0099): the terracotta #B85838 and #7A1F1F become a light coral; the
   new look's own red door button (#A3141C) is kept; no rule paints true red.
3. Pictures, from the presentation records (no new art): `StudioToolsContext`, provided only by
   the ToolsPanel. Courses become picture cards; Latest and Continue rows lead with the lesson's
   cover and its progress bar; Browse areas, courses and lessons are picture tiles. Never blank:
   no cover shows the lesson number or course initials. No context = the classic render, untouched.
4. Every function kept: choose, open, Play, Continue, Refresh, Start fresh, read marks, version
   taps, Find, Record, Downloads, drill-down.

## Verification

- Gate (`learn-classic-tools-in-new-look.test.jsx`): every color class in every classic Learn source
  has a rule; the stylesheet equals the generator's output. PROVEN TO CATCH: an unmapped class, an
  unknown color and a removed rule all fail (and caught 6 real unroled colors while being built).
- Each function pressed in the new look and on the classic page (no pictures there).
- Real browser, 7 tools x 360/390/1024: 0 light panels, 0 contrast failures, lowest 10.15:1,
  no sideways scroll; 51 course covers, 975 lesson covers on Latest.

## Open

- Find-by-verse results and the Record rows wear the skin but carry no thumbnails yet.
  `re-review: 2026-12-03`
