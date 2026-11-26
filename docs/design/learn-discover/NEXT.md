# Learning Zone Discovery: where the work stands (2026-11-26)

Private prototype on `preview/learn-discover`. Not authorized: pull request, merge, deployment,
public access, homepage integration, `LoveCornerHome.jsx` changes, GPU tower work, purchased imagery.
Visual reference: `reference/approved-mockup.png`. Comparison awaiting Darrell's review: `COMPARISON.md`.

## Done
- Index, search (browser only, no cost), 12 categories, Continue (real places), Today's Word (verbatim KJV), collections, preview harness. See README.md.
- Search work since the first prototype: head-first ranking, rarity measured per field, spelling correction, 7 new concepts with a category bonus, ubiquitous-word discount, idiom neutralisation, curated Relationships shelf feeding the Marriage category, stemmer fixes (forgive / forgiven / forgiveness).
- 60-query evaluation set (`app/src/__tests__/fixtures/learn-discover-queries.js`) written BEFORE tuning; automated mean 9.3 of 10 on 2026-11-26. Inventory tests now catch loss, retitling and moving but allow additions.
- Side-by-side comparison with the mockup (`comparison/`).

## Honest state of search quality
The automated proxy overstates it. A first manual read of the nine named questions (stricter) found roughly:
stress 9, marriage 6, godly children 9, debt 6-7, first home 9, forgiveness 8, purpose 5, leader 7-8,
closer to God 4-6. Since then ranking was changed for purpose, marriage and closer-to-God; those were NOT
re-reviewed by hand. "Closer to God" remains the weakest: the curriculum answers it in prayer and Spirit
lessons whose titles do not name the subject (e.g. "Your Hidden Prayer Room Shapes Your Public Life" is not
in its top ten).

## To do (approved by Darrell; visual revision waits for his review of COMPARISON.md)
1. Manual relevance review of queries 11 to 60 (held out from tuning) into `SEARCH-EVALUATION.md`; re-review the nine named questions after the latest ranking changes. Target: at least 8 of 10 genuinely relevant for the three weak questions.
2. Review the 71 lessons in no category (the others, 924 of 995, are placed). Do not force a category.
3. Minimal `ChurchLearn.jsx` change (line ~4390: widen `takeLearnAreaHint` allow-list) for All Courses, All Departments, Study Tools, Downloads deep links, with regression tests (existing `church-learn-*` and `learn-*` tests). Check how Learn Studio (on by default, DR-1664) handles each hint.
4. Page changes: heading "What are you facing today?", suggested questions, Featured Series, Trending only if real activity data exists (none found; use Featured, no invented statistics), All Courses.
5. Screenshots for review: full-page mobile, desktop, all twelve category cards, category browsing, the nine questions' results, the 60-query results, Continue with real progress logic, navigation into the existing Learn, comparison with the mockup.
6. Themes: verify how the shell applies default / midnight / night / heritage to a surface before claiming theme support.
