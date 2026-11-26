# Learning Zone discovery page: private prototype

Status 2026-11-26: **private prototype, local only. Not wired into the app, not pushed to any
auto-merge branch, not deployed.** Approved by Darrell the same day: entry from The Word and Learning
Zone, Browse All Lessons into the existing Learn, Phase 1 search only, twelve categories, existing
photographs first, black red and gold, mobile screenshots on real data before any deployment ask.

## What was built (all new files; no existing file edited)

| File | Purpose |
|---|---|
| `scripts/derive-learn-discover-index.mjs` | Reads the mounted catalog and writes the compact search index. `--check` fails on drift. |
| `app/src/lib/learn-discover-index.json` | Derived index: 995 lessons, 2.4 MB (about 0.8 MB gzipped), loaded only with the page. |
| `app/src/lib/learn-discover-text.js` | The one tokenizer and stemmer (build time and query time). |
| `app/src/lib/learn-discover-concepts.js` | 18 everyday concepts mapped to the curriculum's own words. |
| `app/src/lib/learn-discover-search.js` | Natural-language search. Reuses Learn's own `searchLessons` for the declared-word seat guarantee. |
| `app/src/lib/learn-discover-categories.js` | The 12 categories as rules over the index. |
| `app/src/lib/learn-discover-photos.js`, `-home.js`, `-word.js` | Category photo picks (existing covers), Continue / Newest / Featured / Relationships builders, Today's Word. |
| `app/src/components/learn-discover/LearnDiscover.jsx`, `learn-discover.css` | The page. |
| `app/learn-discover-preview.html`, `app/learn-discover-preview/main.jsx` | Dev-only review harness, not a Vite build input (same pattern as `learn-studio-preview`). |
| `app/src/__tests__/learn-discover.test.js`, `learn-discover-render.test.jsx` | 45 tests on the real catalog. |

## Measured on the real catalog

- Inventory: **995 lessons, 51 courses, 13 departments.** Matches the live app. The test fails if it ever differs from `learnInventory()`.
- Only **1 of 995 lessons carries `tags`**, so topic tags cannot drive discovery. Titles, themes, big ideas, promotional records and body text do.
- 976 lessons carry a promotional record (display title, headline, description) and a photograph. All 976 are in `review` status, not `approved`; Learn Studio already shows them by passing `preview`, and this page does the same. 19 lessons have neither and show their course name on a panel.
- The index holds every lesson id, original title and course exactly (test), and the finder rows rebuilt from it match `buildLessonIndex` over the real catalog (test).
- Declared-word seats (DR-1049, DR-1129, DR-1329): every course that declared a plain word is reachable when that word is typed. **Proven to catch:** with the seat pass disabled, 60 seats break and the test fails.
- Speed: about 10 ms per query, 115 ms to prepare the index.

### The nine questions, first ten results judged against the question (a regex I wrote, so treat as a floor, not a score)

| Question | Top ten that fit |
|---|---|
| Why am I always stressed? | 10 |
| How can I strengthen my marriage? | 8 |
| How do I raise godly children? | 6 |
| How can I get out of debt? | 10 |
| How do I buy my first home? | 9 |
| What does the Bible say about forgiveness? | 6 |
| How do I find my purpose? | 10 |
| How can I become a better leader? | 10 |
| How can I grow closer to God? | 6 |

Mean 8.3 of 10. The three weakest are broad devotional questions where the curriculum answers in
parables whose titles do not name the subject. A semantic tier would help them; Phase 1 does not
include one.

### Defects found and fixed while building (kept because they explain the code)

1. `bible` and `will` are course-declared plain words but also question words or stopwords, so typing either alone returned nothing and two courses lost their seat. Found by the seat test. Fixed: a declared word is the subject when it is all the reader typed.
2. A first index kept only each lesson's top 70 terms, which saw 16 of 78 marriage lessons. Fixed: any concept or category word a lesson uses twice is kept.
3. "Matches more of the words" outranked "is strongly about the subject" (a rare adjective like "godly" beat "children"). Fixed with a softer coverage factor and a cap on one word's weight.

### Categories: all twelve are supported

| Category | Lessons | Via home course | Via words |
|---|---|---|---|
| Faith & Spiritual Growth | 217 | 14 | 203 |
| Marriage & Relationships | 28 | 0 | 28 |
| Parenting & Family | 103 | 9 | 94 |
| Mental & Emotional Wellness | 117 | 30 | 87 |
| Purpose & Personal Growth | 67 | 0 | 67 |
| Money & Financial Stewardship | 169 | 82 | 87 |
| Business & Entrepreneurship | 116 | 44 | 72 |
| Real Estate & Homeownership | 105 | 97 | 8 |
| Leadership & Ministry | 91 | 29 | 62 |
| Bible Study & Scripture | 232 | 162 | 70 |
| History & Understanding Our World | 175 | 60 | 115 |
| Technology, AI & Innovation | 184 | 170 | 14 |

924 of 995 lessons sit in at least one category; 507 sit in two or more. Marriage is the thinnest:
28 lessons, 16 of them dedicated to it, spread across 14 courses that touch it. That is real
content, not a rule that is too strict, but it is the category a new lesson would help most.

## Preserved, by test or by construction

No lesson, title, course or department assignment is touched (index test). Progress is read from
Learn's own saved places, never written. Opening a lesson hands it to Learn's opener. No
preference key is read or written. `ChurchLearn`, `learn-studio/`, `LoveCornerHome` and
`surfaces.js` are unmodified.

## To wire it in (not done; waits for your go)

1. `surfaces.js`: one new `SURFACES` entry, church sub-view `discover`, lazy `load`.
2. `lib/nav-history.js`: add `'discover'` to the church sub-view allow-list (line 62 area).
3. `LoveCornerHome.jsx`: change two `open('learn')` calls (The Word card, "All courses") to
   `open('discover')`. **This is the one file Darrell's homepage redesign also touches**, so it goes
   last and as a three-line change.
4. Callbacks: Browse All Lessons is `setChurchView('learn')`; a lesson is `requestOpenLesson` then
   `setChurchView('learn')`; an area is `setLearnAreaHint(area)` then `setChurchView('learn')`.
5. **One decision for you:** `ChurchLearn` reads the one-time area hint with
   `takeLearnAreaHint()`, which today allows only `'record'`. My All Courses, All Departments,
   Study Tools and Downloads tiles would open Learn on its usual landing until that allow-list is
   widened by a one-line change in `ChurchLearn.jsx` (line 4390). It is the only edit I would make
   inside the file you asked me to preserve. My Learning works today.

## Before it is public

A Decision Record (the house rule for a new directive), the full `npm run verify`, the photographs
chosen from `PHOTO-NEEDS.md`, the mockup compared line by line (it did not reach this session;
see below), and your approval of the screenshots.

## Mockup

The "approved visual mockup" was not attached to this session. The page follows the Learn Studio
visual language (same dark tokens, type and lesson-card shape) and the brief. Fidelity to the
mockup is **unverified** until it is attached.
