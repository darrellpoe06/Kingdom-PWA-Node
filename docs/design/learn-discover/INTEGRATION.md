# Wiring the discovery page into the app

**Applied on the private branch only (not merged, not deployed). Needs Darrell's review before release.**

**The shell is not edited.** `poe-financial-mvp-v28.jsx` is frozen (DR-0078; the monolith guard failed on even one added line), so the door mounts through the surface registry: `app/src/surfaces.js` line 128, the `learn` surface, now loads `components/learn-discover/ChurchLearnWithDoor.jsx` instead of `ChurchLearn.jsx`. That wrapper renders the existing `ChurchLearn` with every prop passed through, behind `LearnDoor`. This is a **one-line change in surfaces.js** (the "three lines in the shell" became zero).

`LearnDoor` hands back that same Learn element unchanged when:
- the link names a course or lesson (`?course=` / `?lesson=`), as links always did;
- the retired Eternal Algorithms route is used (it arrives with `initialDept`);
- a device turns discovery off: `?discover=0` or `localStorage['poe-learn-discover'] = '0'` (the instant rollback);
- the discovery chunk fails to load or crashes (error boundary; Learn shows).
Otherwise The Word / Learning Zone opens the discovery page first, loaded lazily. "Browse All Lessons" and the five access buttons open the existing Learn exactly as before. `LoveCornerHome.jsx` is not touched (its Learning Zone button already calls `open('learn')`).

To roll back: revert `surfaces.js` line 128 (one line), or set the opt-out on a device.
Checked 2026-11-26: `main` had no differences to `surfaces.js`, the shell or `LoveCornerHome.jsx` beyond this branch. Re-check against `main` right before the PR.
Verified: `npm run verify:gates` (monolith budget, DR ledger and the rest), lint, `lesson-dates:check` (995 of 995), tests for the door, the wrapper and the frozen shell.
