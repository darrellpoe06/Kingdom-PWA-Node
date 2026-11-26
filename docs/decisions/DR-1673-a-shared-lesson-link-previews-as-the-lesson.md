# DR-1673: A shared lesson link previews as the lesson: its picture and its title

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (what every texted lesson link looks like; a new public route that only reads approved covers and titles; no schema)
**Type:** feature
**Area:** `app/src/lib/learn-link-preview.js` (new), `app/functions/l/[[path]].js` (new), `app/public/_routes.json`, `app/vite.config.js` (emits `learn-preview.json`), `app/src/lib/lesson-links.js`; tests `a-shared-lesson-previews-as-the-lesson.test.js`, `lesson-share-note.test.js`, `a-lesson-link-opens-in-its-own-app.test.js`
**Sent in by:** Darrell, 2026-11-26, after texting his wife a lesson link that previewed as the church's generic card: "can we send the image and lesson title as a marketing strategy and structural data collection for interest and understanding our stakeholders?" and "I want the photos to be able to promote and provide understanding of the information inside... short and sweet... the lessons titles do this anyway."
**Grounds:** DR-0698 (a shared lesson link keeps its record: who shared, and whether it opened), DR-1428 (a lesson link opens in its own app), the `/moore` door page (its own preview tags, then a refresh into the app)
**Pairs with:** DR-1677

## Context

A text app builds a link's preview from the page's tags without running the app. Every lesson link pointed at the one app page, so every lesson previewed as "The Church of the Living God · The Love Corner" with the logo.

## What was measured

- The structured record Darrell asked for already exists (DR-0698, migration 0244): one row per share (token, sharer, course, lesson, method) and one per open (ok or failed, and nothing about the person who opened it). The Governor reads them all; a sharer reads counts for their own shares. Only the preview was missing.
- 976 lesson records carry an approved cover; every cover ships as `w1280.webp` (1280 x 720) and `w640.webp`. No JPG copies exist.
- The build emits the preview index as `learn-preview.json`: 232 KB, 976 lessons, verified in a local production build.

## Decision

1. **A lesson link a person sends goes through `/l/<door>/` with the same query** (`?view=..&course=..&lesson=..&s=<token>`). The Function answers a tiny page whose tags are the lesson's display title, its approved cover (`og:image`, 1280 x 720, `summary_large_image`) and one short line ("The Love Corner · Lesson 10"), then refreshes into the lesson's own door (meta refresh only; no script, as the CSP and `/moore` require).
2. **The share record is unchanged.** The token rides through the refresh, so the open is counted against the share exactly as before.
3. **Fail-safe.** An unknown lesson previews plainly as the door; a missing index previews plainly; an unknown door is a 302 into the Love Corner app with the query. A preview may be plain; a lesson link never fails. The app's own entry pages are not routed through any Function.
4. **Short and sweet:** title and picture only; no long blurb.

## Impact

- Every lesson shared from the share sheet, a copied share, or a section share previews with its own picture and title.
- One new Function route (`/l/*`), listed in `_routes.json`.
- **Uncertain, said plainly:** the covers are WebP. Android (Google Messages) and iOS (iMessage) decode WebP; a platform that does not will show the title without the picture. If that is seen, the next step is a JPG copy per cover (about 32 MB for 982 covers, measured at 640 px).

## Verification after merge

- `a-shared-lesson-previews-as-the-lesson.test.js` (6): the index holds every approved cover with a real file; the preview doors equal the lesson doors; a lesson link maps to `/l/<door>/` and nothing else does; the page carries the lesson's title, cover and short line and refreshes into the lesson with the same query; unknown lesson, missing index and unknown door never fail; a title cannot break out of its tag. With the lookup forced to null, the title case fails (run 2026-11-26).
- Live: text a lesson link; the preview shows its cover and title, and tapping opens the lesson.

`re-review: 2026-12-03`
