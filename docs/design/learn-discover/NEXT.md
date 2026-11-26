# Learning Zone Discovery: where the work stands (2026-11-26, second revision)

Private prototype on `preview/learn-discover`. **Not authorized:** pull request, merge, deployment, public access, homepage integration, `LoveCornerHome.jsx` changes, GPU tower work, purchased imagery, a paid or semantic search service. Visual target: `reference/approved-mockup.png`. This is not final visual approval.

## Done this round (approved 2026-11-26)

- Visual redesign to the mockup's compact rhythm; all 12 categories (two-row sideways scroll on phones, 6x2 on wide screens, View All Topics); Featured Series (5, proposed); Featured Lessons kept separate; All Courses with the 13 real departments and live counts; Continue and Today's Word side by side from 480 px, compact stacked below; live script font, no lettering baked into a photograph.
- Search: the three weak questions fixed (8.5, 8, 9.5); 60-query manual evaluation; generic defects found and fixed (AI, worried, irregular verbs, contractions, rarity per field, centrality).
- 78 unplaced lessons read: 76 now placed, 2 documented.
- Navigation: the two-line `ChurchLearn.jsx` change, both Learn looks, proven to catch.
- Themes: 12 checked, contrast measured; a real `<input>` theming bug found and fixed.
- Investigations: font (done), microphone (findings, left off), trending (no data, not included).

## Waiting on Darrell

1. **Approve or edit the five series** (`SERIES-PROPOSAL.md`). The page marks them "Proposed lists" until then.
2. **Microphone:** the free browser engine sends the spoken question's audio to Google or Apple. Accept that, or leave the mic off.
3. **Search quality:** word matching has reached its ceiling for everyday-situation questions (average about 4 of 10). Recommended, at no recurring cost: a hand-written "Life Situations" guide of about 40 to 60 entries (lonely, can't sleep, lost my job, kids won't listen, start a business, why does Yahweh allow suffering...), each a short list of lessons that truly answer it, reusing the mechanism that took "closer to God" from 5.5 to 9.5. Not started.
4. **Photographs:** the six ChatGPT samples. Until then the page uses existing lesson covers (repetitive; see `PHOTO-NEEDS.md`).
5. **A course card should open that course.** The existing link is `?course=<key>`, which changes the address bar. Today a course card opens its first lesson.

## To do before any deployment ask

- A Decision Record, and the full `npm run verify` including the gate scripts (module boundary, file budget, journey coverage and the rest).
- The three-line `LoveCornerHome.jsx` entry change, coordinated with the church homepage redesign (not touched).
- `surfaces.js` entry and the `nav-history.js` allow-list for the new sub-view; wire the callbacks (`openLearnArea`, `requestOpenLesson`).
- Check the page inside the real shell wrapper under each theme, and on real phones (preview was Chromium only).
- Confirm the unapproved items above.

## How to reproduce the screenshots

`cd app && VITE_SUPABASE_URL=http://127.0.0.1:9 VITE_SUPABASE_ANON_KEY=placeholder-not-a-real-key npx vite --port 5199`, then open `/poetech-app/learn-discover-preview.html?seed=1&theme=night` (the page) or `/poetech-app/learn-discover-nav-preview.html?look=new&area=downloads` (the real Learn under a route). The placeholder values are inert; the real Learn needs them only to import.
