# Learning Zone discovery page: private prototype

Status 2026-11-26. **Private prototype on `preview/learn-discover`. Not wired into the app, no pull request, not merged, not deployed, not public.** Visual target: `reference/approved-mockup.png`. This is not final visual approval and not deployment authorization.

The page is an additive entrance: The Word / Learning Zone, then **this page**, then the existing Learning Zone (courses, departments, lessons). It replaces and redesigns nothing behind it.

## Read these, in this order

| File | What it is |
|---|---|
| `COMPARISON.md` | The first comparison against the mockup (the prototype before the redesign) |
| `revised/` | **The review screenshots of the redesigned page**: mobile 390 and 512, desktop 1280, all 12 topics, category browsing, the nine named questions, Continue Learning (with and without progress), a series, courses by department, all 12 themes, and navigation into the real Learning Zone |
| `comparison/rev-*.jpg` | Revised page against the mockup, section by section, at the mockup's own proportions |
| `SEARCH-EVALUATION.md` | All 60 queries, manual relevance scores before and after the fixes |
| `CATEGORY-COUNTS.md` | The 12 category counts after the manual review, and the lessons in no category |
| `SERIES-PROPOSAL.md` | The five Featured Series, lesson by lesson, **for approval** |
| `INVESTIGATIONS.md` | The script font, the microphone, themes, trending data, navigation |
| `PHOTO-NEEDS.md`, `photo-audit/` | What the existing photography is, and what is still needed |
| `NEXT.md` | What remains, and the decisions waiting on Darrell |

## What is built (new files; one existing file changed by two lines)

| File | Purpose |
|---|---|
| `scripts/derive-learn-discover-index.mjs` | Reads the mounted catalog and writes the compact search index. `--check` fails on drift. |
| `app/src/lib/learn-discover-index.json` | Derived index: 995 lessons, 2.5 MB (about 0.85 MB gzipped), loaded only with the page. |
| `learn-discover-text.js`, `-concepts.js`, `-search.js` | The tokenizer and stemmer, the everyday-concept bridge, and the search (reuses Learn's own finder for its seat guarantees). |
| `learn-discover-categories.js`, `-reviewed.js` | The 12 categories as rules, plus the lessons placed by hand. |
| `learn-discover-series.js`, `-photos.js`, `-home.js`, `-word.js`, `-nav.js` | Featured Series, existing photograph picks, Continue / Newest / Featured / Relationships builders, Today's Word, routes into Learn. |
| `app/src/components/learn-discover/` | The page, its stylesheet, and the two open-licence fonts. |
| `app/learn-discover-preview*` | Dev-only review harnesses (not Vite build inputs): the page under every theme, and the real Learn under each route. |
| `app/src/lib/learn-landing.js` (+4 lines), `app/src/components/ChurchLearn.jsx` (**2 lines**) | The approved deep-link change: the one-time area hint accepts `DEEP_LINK_AREAS`. Proven to catch (reverting it fails 5 tests). |
| `app/src/__tests__/learn-discover*.test.*`, `fixtures/learn-discover-queries.js` | 79 tests on the real catalog, plus the 60-query set. |

`LoveCornerHome.jsx`, `surfaces.js` and the church homepage are untouched.

## Measured facts

- Inventory: **995 lessons, 51 courses, 13 departments**, verified against the mounted catalog. The tests fail if any indexed lesson is lost, retitled or moved, and allow new lessons.
- 976 lessons carry a promotional record and a photograph; all are still in `review` status, untouched. Only 1 of 995 lessons has tags.
- **992 of 995 lessons are in at least one of the 12 categories.** Two (ll317, ll341) fit none and are documented; they remain reachable through Browse All Lessons and search.
- **Search quality is the weak point.** Strict manual mean across all 60 queries: **5.2 of 10 before this round's fixes, 5.6 after** (see `SEARCH-EVALUATION.md`). Topical searches are good; life-situation questions are poor. The three questions Darrell singled out now reach 8.5, 8 and 9.5.
- Themes: 12 checked, text contrast 5.3:1 or better everywhere, zero errors.

## Preserved, by test or by construction

No lesson, title, course, department, promotional record, photograph, progress record, preference or download is changed. Progress is read from Learn's own saved places and never written. A lesson opens through Learn's own opener. Mounting the page writes no theme, course, sort or level preference. Browse All Lessons is Learn opened with no hint, so it lands where Learn lands today.

## Before it could go public (none of this is started)

A Decision Record (the house rule for a new directive); the full `npm run verify` including the repo gate scripts; the real photographs; approval of the series lists; the mic decision; the three-line entry-point change in `LoveCornerHome.jsx`, coordinated with the homepage redesign; and Darrell's approval of the screenshots.
