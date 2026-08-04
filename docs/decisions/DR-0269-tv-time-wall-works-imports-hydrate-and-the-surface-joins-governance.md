---
id: DR-0269
title: The TV Time wall works — a tap opens the card in view, imports hydrate to full seasons, posters survive real titles, and the surface joins governance
date: 2026-08-04
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT, DATA-AS-EMPOWERMENT]
source: 2026-08-04 comprehensive TV Time review, triggered by Darrell's wall screenshot ("dont work... comprehensive understanding of the opportunities and constraints after researching best Ways and documentation data driven")
---

## Context

TV Time is the acquisition surface (the friend group's app died 2026-07-15; their imported lists live here now) and was the largest surface in the app with NO decision record, no FEATURE-WORKFLOW-REGISTER row, and zero test coverage on the poster wall — the one view Darrell was actually looking at. The comprehensive trace (SHOULD/ARE per DR-0219) found the wall's write-path fully real (status/episodes/comments/sync all live) but four defects stacked into "don't work":

1. **The tap looked dead.** A tile tap set focus, but the opened card rendered BELOW the whole grid with no scroll — on a 100-tile imported wall, thousands of pixels under the viewport.
2. **Imports had nothing to check off.** The TV Time zip migration stored only the episodes ALREADY WATCHED as a show's "seasons," so the checkoff grid held no unwatched episodes and every tile's progress read a permanent 100%. The promised catalog refresh ("a fuller list can refresh from the catalog") was never built.
3. **Genre chips emptied the wall.** Imports carried `genre:'Show'`, which matches no chip; filtering hid every imported show.
4. **Blank posters stayed blank.** One un-normalized lookup ("EMPIRE (2015)", "LOVE IS___" → zero hits), single-source, with failures (including TVmaze 429s during a fast scroll) cached for the whole session.

## Decision

1. **Tap-in-view:** the focused card scrolls into view on open (`TVTime.jsx`).
2. **Hydration:** `hydrateShow` (lib/tv-time.js) merges the catalog's full record into an imported/hand-added show IN PLACE — same id, every checkmark kept, fuller seasons win, real genre/poster fill only where generic/absent, `sourceId` stamps once-only. Fired on user gesture only (tile tap / Episodes tab), single-flight per show per session — a 100-show wall cannot burst the keyless APIs.
3. **Poster resilience:** `normalizeTitleQuery` strips trailing "(YYYY)"/underscores; lookup falls to the other keyless source when the primary has no artwork; a failed/empty resolution is NOT session-cached (the next scroll-into-view retries). The keyless-by-mandate posture is unchanged — no TMDb, no new secrets.
4. **Untrack cleans up:** removing a show now removes its cached metadata (no orphaned entries duplicating on re-import).
5. **Gates:** `tv-time-wall.test.jsx` (wall engages >9, tap opens + scrolls, hydration replaces the fake 100%, once-per-show) and `tv-time-hydrate.test.js` (reducer + title normalization + poster retry/fallback, with the literal broken titles) now gate merge.

## Carried (named system, dated)

- **Poster URL persistence per tile** (each device session re-resolves un-hydrated tiles): hydration persists poster+seasons+genre together on open; per-tile write-back needs a race-safe reducer path. `re-review: 2026-08-18`.
- **Interconnect rails** for `tv_watch`/`tv_share`/`tv_circle` in `scripts/interconnect-manifest.mjs`, and a FEATURE-WORKFLOW-REGISTER row: `re-review: 2026-08-18`.
- **Duplicate-id merge** (a zip `tvt-` slug and the same show's TVmaze id can coexist): hydration's `sourceId` now records the linkage a future merge can key on. `re-review: 2026-08-18`.
- **Measured form-factor sweep** (chrome-layout-probe at phone width for the wall): rides the existing CI layout probe on every push; a wall-specific assertion `re-review: 2026-08-18`.

## Consequences

The wall answers a tap visibly; an imported show becomes a full, check-off-able record the first time it's opened; genre chips stop deleting the imported list as shows hydrate; blank tiles heal on scroll instead of staying blank a whole session. The friend group's migrated history — the only copy since their app died — is now progressively completed by the catalog rather than frozen at import fidelity.
