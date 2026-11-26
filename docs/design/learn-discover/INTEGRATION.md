# Wiring the discovery page into the app

**Applied on the private branch only (not merged, not deployed). Needs Darrell's review before release.**

The shell change is 3 lines in `app/src/poe-financial-mvp-v28.jsx`: one import, and the Learn block's `(() => {...})()` is passed through `withLearnDoor(churchView, ...)`. The Learn element and its props are untouched, and `return <ChurchLearn` still stands (existing tests match it).
`LearnDoor` (app/src/components/learn-discover/LearnDoor.jsx) hands back that same Learn element unchanged when:
- the link names a course or lesson (`?course=` / `?lesson=`), as links always did;
- a device or person turns it off: `?discover=0`, or `localStorage['poe-learn-discover'] = '0'` (the instant rollback);
- the discovery chunk fails to load or crashes (an error boundary; Learn shows).
Otherwise the Learning Zone opens on the discovery page, loaded lazily (the app's first paint does not carry its index). "Browse All Lessons" and the five access buttons open the existing Learn (Learn Studio or classic) exactly as before. `LoveCornerHome.jsx` is not touched: its Learning Zone button already calls `open('learn')`.

Checked before editing: `poe-financial-mvp-v28.jsx` and `LoveCornerHome.jsx` have no difference from `main` (2026-11-26), so no concurrent edit was overwritten. Re-check against `main` immediately before the PR; the shell edit is a 3-line, easily re-applied patch.

Before release: `npm run verify` on a full clone, `lesson-dates:check`, a look inside the real shell under each theme on a phone, and the live production review (DR-0104).
