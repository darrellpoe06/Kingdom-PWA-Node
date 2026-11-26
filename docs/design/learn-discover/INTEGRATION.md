# Wiring the discovery page into the app (NOT applied; needs Darrell's approval and the homepage owner's review)

Nothing below is merged. All of it is additive and touches the shell in few lines.

1. **Shell mount** (`app/src/poe-financial-mvp-v28.jsx`, the `churchView === 'learn' || 'eternal-algorithms'` block): wrap the existing `<ChurchLearn .../>` as
   `<LearnDiscoverEntry renderLearn={() => (<ChurchLearn ...unchanged props... />)} />`, only for `churchView === 'learn'`.
   Links with `?course=` or `?lesson=` already go straight to Learn (tested). Existing tests that match the literal `churchView === 'learn' ||` text must keep matching: leave that line as is.
2. **Entry points**: The Word / Learning Zone already calls `open('learn')` in `LoveCornerHome.jsx`; with step 1 it lands on discovery with **no change to the homepage file**.
3. **Not needed**: no `surfaces.js` entry or `nav-history.js` allow-list change (it is the same `learn` view).
4. **Before release**: `npm run verify` on a full clone, `lesson-dates:check`, a look inside the real shell under each theme and on a phone, and the live production review pass (DR-0104).
