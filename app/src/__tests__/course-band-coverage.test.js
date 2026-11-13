// @vitest-environment node
// =============================================================================
// THE FOUR-BAND REQUIREMENT NEVER REACHED THE OTHER 211 LESSONS
// =============================================================================
// Darrell 2026-09-18: "Fill up the lessons and don't stop or not always do all
// of these lessons for each group asap." His words were about the lessons and
// the groups, not about one series.
//
// WHAT WAS MEASURED, and it is the reason this file exists. Three ratchets hold
// the four-band requirement — full-levels (share of the adult lesson),
// reading-level (the FK ladder) and band-differentiation (four versions rather
// than one repeated four times). ALL THREE SCAN `LIVING_LESSONS_MODULES` AND
// NOTHING ELSE. Across the whole catalog:
//
//     211  lessons outside the Living Lessons series (235 after DR-0500/0501/0504)
//       0  carrying all four authored bands
//      43  carrying no authored band at all  (37 after the first pass)
//       5  of those 43 reading ABOVE grade 9 in the text actually served (now 0)
//
// Whoever opens one of the 43 gets the single `lesson` field through
// resolveForAge's fallback, and no gate in the house has ever said so. That is
// L178's own subject committed by the instruments: the need is real, the gate
// reports nothing, and a defect no instrument reports reads as a defect that
// does not exist.
//
// AND THE COUNT ALONE WOULD HAVE LIED. The first version of this file said a
// child opening any of the 43 "is handed the adult words". Measured: that is
// true of 5 of them. `little-learners` reads at grade 0.3 and `mathematics` at
// 1.5 in that single field — already written for the youngest readers, so the
// missing bands there are a LABEL gap. `broadcast` reads at 12.4 and is the
// real defect. The register measure below exists because the count over-claimed
// (DR-0076 §1 no claim without evidence, §4 measure don't claim), and it is
// ratcheted so the distinction is instrumented rather than remembered.
//
// THEN THE FIVE WERE FIXED, which is what a measurement is for. broadcast bc2,
// bc3, bc4, bc6 and bc7 and the ai course's wk3-the-test now carry authored
// teen and senior bands, so adultRegister across the whole catalog is ZERO and
// this file holds it there: a new bandless lesson reading above grade 9 fails
// the build. The 37 still bandless all read at or below grade 9 in the text
// they serve — a label gap with a dated re-review, not a reader who cannot
// reach the words.
//
// WHAT THIS FILE DOES AND DELIBERATELY DOES NOT DO. It does NOT impose the
// Living-Lessons floors on a paced course lesson — that is a different
// artifact, and imposing them would be a decision rather than a measurement,
// and it would add 211 entries to shrink-only baselines that may never be
// added to. What it does is COUNT honestly and refuse to let the count get
// worse, which is the smallest thing that turns an invisible need into a
// visible one.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG, learnCatalogSummary } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  BANDS, bandsPresent, lessonsOfCourse, scanCourseBands, ratchetCourseBands,
  servedGrade, median, ADULT_REGISTER_CEILING,
  FOUR_BAND_GAP_CEILING, fourBandGapFindings, buildCourseBandBaseline,
} from '../../../scripts/course-band-coverage.mjs';
import baseline from '../lib/course-band-coverage-baseline.json';

const OWNED = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
const scan = scanCourseBands(LEARN_CATALOG, OWNED);

describe('the measure reads the real catalog', () => {
  it('finds lessons in every course that has any', () => {
    // If the row-shape walk breaks, this whole file silently measures nothing,
    // which is the failure mode it exists to prevent. So the count is pinned.
    // DERIVED (DR-0677): the count comes from the data, so a new lesson never edits a baseline line.
    expect(scan.total, 'the walk missed catalog lessons outside the Living Lessons').toBe(learnCatalogSummary().lessons - OWNED.size);
    expect(Object.keys(scan.courses).length).toBe(Object.keys(baseline.courses).length);
  });

  it('reads the two row shapes a course can hand back', () => {
    // Courses return either the module or a row wrapping it. Both must resolve,
    // and anything without an id or any text must not be counted as a lesson.
    const asModule = lessonsOfCourse({ buildScheduleRows: () => [{ id: 'x', lesson: 'words' }] });
    const asRow = lessonsOfCourse({ buildScheduleRows: () => [{ module: { id: 'y', lesson: 'words' } }] });
    expect(asModule.map((m) => m.id)).toEqual(['x']);
    expect(asRow.map((m) => m.id)).toEqual(['y']);
    expect(lessonsOfCourse({ buildScheduleRows: () => [{ id: 'no-text' }, null, 'junk'] })).toEqual([]);
  });

  it('reports a course whose builder throws as zero rather than crashing the scan', () => {
    // An unreadable course is a finding, not an exception: a throw here would
    // take down every other course's measurement with it.
    expect(lessonsOfCourse({ buildScheduleRows: () => { throw new Error('bad course'); } })).toEqual([]);
  });

  it('counts only bands that actually carry text', () => {
    expect(bandsPresent({ levels: { child: 'a', youth: '  ', teen: null, senior: 'b' } })).toEqual(['child', 'senior']);
    expect(bandsPresent({})).toEqual([]);
    expect(BANDS).toEqual(['child', 'youth', 'teen', 'senior']);
  });

  it('never double-counts a Living Lessons lesson, which the other ratchets own', () => {
    const withoutOwner = scanCourseBands(LEARN_CATALOG, new Set());
    expect(withoutOwner.total, 'the Living Lessons series is being counted twice').toBeGreaterThan(scan.total);
  });
});

describe('the debt, recorded as it actually is', () => {
  it('is the number measured, not a number anybody hoped for', () => {
    // 211 when this gate was written, then the Real Estate department: 219 with
    // its footing (DR-0500), 227 with its capstone (DR-0501), 235 with the
    // buying course (DR-0504), 245 with the leasing course (DR-0507) and the
    // two lessons another session landed in between, 253 with the maintenance
    // course (DR-0508), 261 with the partnerships course (DR-0510), 269 with the financing course (DR-0513), 277 with the taxes and records course (DR-0515), 285 with the Banking course (DR-0522), 293 with the Insurance and Risk course (DR-0523), 301 with the Inspections course (DR-0525) 309 with the Evictions course (DR-0527) and 317 with the Appraisal course (DR-0528), and 325 when the STOCK MARKET department opened with its first course (stocks, DR-0548) -- the first addition that is a whole new DEPARTMENT rather than another shelf in an existing one -- 333 with its second course (bonds, DR-0549), 341 with its third (world-market, DR-0553) and 349 with its fourth and last (investing, DR-0554), then 350 with World Issues issue 17 (biology walks back the selfish gene, DR-0555). Then 358 on 2026-09-23 when the HISTORY department opened with its first course (history-truth, 8 lessons, DR-0572), every lesson carrying both bands. A hundred and twelve new course
    // lessons, every one carrying authored bands — which is why adultOnly did
    // NOT move with any of them. That is the shape a new course is supposed to
    // have, and the shape this pin exists to prove: the total may grow, the
    // DEBT may not.
    // baseline.total is no longer pinned here (DR-0677): the total is derived above; the DEBT below is what may never grow.
    expect(baseline.allFour).toBe(307); // 307 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov87 (Cleanse thou me from secret faults, DR-1501) on top of main 152cfb3b302: total 481, allFour 307, adultOnly 0, still pinned 174; the Sovereign A.I. row reads {lessons: 84, allFour: 63}. sov87 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.30 < youth 3.37 < teen 4.78 < senior 8.35, adult 7.37; shares 0.554 / 0.681 / 0.734 / 0.757; worst overlap 0.130 youth~teen. Weeks 84-86 are in flight on sibling branches and will each raise this again: whichever lands second re-derives on the merged tree, never takes a side -- re-review: 2026-11-20.
    // The 306 note this replaces, kept for the chain: 306 on 2026-11-13, RE-DERIVED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the MERGED tree that holds BOTH sov82 (How beautiful are the feet, DR-1486) and sov83 (That they may continue many days, DR-1489): total 480, allFour 306, adultOnly 0, still pinned 174. Each branch had pinned 305 counting only itself -- the same textual collision this file has recorded before, and again neither side was right; the number was read off the merged catalog, never chosen. Both weeks carry all four age bands and an adult register from their first commits, so THE DEBT DID NOT MOVE. sov83's ladder: child 1.23 < youth 4.40 < teen 5.91 < senior 7.74, adult 6.49; shares 0.524 / 0.639 / 0.617 / 0.666. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20.
    // The 305 note this replaces, kept for the chain: 305 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov82 (How beautiful are the feet, DR-1486): total 479, allFour 305, adultOnly 0, still pinned 174; the Sovereign A.I. row reads {lessons: 82, allFour: 61}. sov82 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.10 < youth 3.55 < teen 4.85 < senior 7.14, adult 7.40; shares 0.514 / 0.609 / 0.635 / 0.620 against floors 0.50 / 0.60; worst band-pair overlap 0.147 youth~teen; 161 quoted spans across 15 books, 0 faults, 43 anchor references every one quoted in a reader place. THE DR-1306 SHARE FAILURE PAID AGAIN: the first draft read child 0.344, youth 0.465, teen 0.384, senior 0.519 and the teen band read EASIER than youth (1.67 < 3.90); the adult lesson was trimmed by hand and the teen band rewritten by hand in longer sentences, never by a script on prose.    // The 304 note this replaces, kept for the chain: 304 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov81 (What hast thou that thou didst not receive, DR-1478): total 478, allFour 304, adultOnly 0, still pinned 174; the Sovereign A.I. row reads {lessons: 81, allFour: 60}. sov81 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 0.98 < youth 3.45 < teen 3.91 < senior 7.02, adult 7.00; shares 0.511 / 0.610 / 0.610 / 0.622 against floors 0.50 / 0.60; worst band-pair overlap 0.072 youth~teen and worst band-to-adult 0.074 senior; 162 quoted spans across 20 books, 0 faults, 45 anchor references every one quoted in a reader place. THE DR-1306 SHARE FAILURE PAID AGAIN AND IS RECORDED: the first draft read child 0.390, youth 0.474, teen 0.475, senior 0.534, all under their floors; about 1,100 words were authored BY HAND in each band's own register, never by a script on prose, and moving the frame verses ahead of the article in the adult lesson then grew its denominator and took teen back to 0.601 before a last hand-written paragraph. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20. // 303 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds pm17 (Can two walk together, DR-1473): total 477, allFour 303, adultOnly 0, adultRegister 0, still pinned 174; the Project Management row reads {lessons: 17, allFour: 17, adultOnly: 0, adultRegister: 0}. pm17 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.17 < youth 3.04 < teen 5.72 < senior 7.03, adult 7.32, child 3.83 under its 5.0 ceiling and teen under 6.0; shares 0.512 / 0.625 / 0.627 / 0.811 against floors 0.50 / 0.60; worst band-pair overlap 0.122 teen~senior and worst band-to-adult 0.223 senior, against the 0.25 near-copy line; 206 quoted spans, every one of them in the five reader places (49 / 31 / 36 / 41 / 49), compared for EXACT EQUALITY with its own named verse across the 21 books of app/public/bible/kjv the module itself names, 0 faults, and 49 anchor references every one of which is quoted in a reader place and none that is not. THE CLOSE WAS WRITTEN BEFORE ANY SHARE WAS MEASURED, which is why no band had to be re-tuned after appending it -- the re-tune sov79 and sov80 both paid for. The three share floors still failed on the FIRST measurement (child 0.378, youth 0.453, teen 0.579) and were brought up BY HAND, about 800 words authored in each band's own register, never by a script on prose (DR-1306). MY OWN GATE WAS NARROWER THAN ITS NAME ON ITS FIRST RUN, IN THE OPPOSITE DIRECTION FROM THE USUAL: the leak check matched `the six steps are` and so fired on the CHILD BAND'S REFUSAL, "we do not say what the six steps are" -- the very sentence the file exists to require, and a gate that reports the refusal as the leak trains a reader to delete the honest sentence. It now matches an ENUMERATION only, both halves proven-to-catch, with the refusal asserted positively and separately. AND THE 46-CASE CATALOG SUITE CAUGHT THREE MORE THAT A ONE-MODULE FILE CANNOT SEE: three stretches of ordinary prose in double quotation marks, which the catalog verse sweep reads as Scripture; the GENERIC NAME IN OUR OWN VOICE (addressed by the Father as God) in the adult and senior bands, rewritten so the KJV's own O God stands untouched inside the Hebrews 1:8 quotation beside it (DR-0210); and a lesson that NEVER NAMED WHAT THE INDUSTRY CALLS IT, which is this course's whole thesis -- segregation of duties, the four-eyes principle, RACI and stakeholder alignment are now named in four bands, second, as their word. ALSO MEASURED, and it is a refinement of DR-1467 rather than a repeat: `test -f .git/shallow` is the WRONG check inside a worktree, whose `.git` is a FILE -- the marker lives at `$(git rev-parse --git-common-dir)/shallow`, and the clone re-shallowed mid-build at 08:24 while that check read clean. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20. // 302 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov80 (Discovery is not permission, DR-1472): total 476, allFour 302, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 80, allFour: 59}. sov80 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 0.99 < youth 4.12 < teen 4.53 < senior 6.95, adult 6.50, child under its 5.0 ceiling and teen 1.47 under 6.0; shares 0.512 / 0.616 / 0.624 / 0.881 against floors 0.50 / 0.60; worst band-pair overlap 0.187 youth~teen and worst band-to-adult 0.203 senior~adult, against the 0.25 near-copy line; 203 quoted spans (193 of them in the seven reader places) swept verbatim against per-chapter joins of the 21 books of app/public/bible/kjv the module itself cites, 0 faults, and 45 anchor references every one of which is quoted in a reader place and none that is not. THE DR-1306 BAND FAILURES PAID A SIXTH TIME AND ARE RECORDED RATHER THAN SMOOTHED: the first draft read child 0.475 under its floor; a hand-authored child section took it to 0.541; then my own gate found the ADULT LESSON CARRIED NO BLOCKED-ROAD NOTE AND NO TALK ABOUT IT TOGETHER CLOSE AT ALL -- the identical defect sov79 recorded the night before -- and appending both grew the adult denominator 2299 -> 2593 words, which pushed child BACK UNDER to 0.479 and youth under to 0.589. Both were brought back BY HAND, never by a script on prose. MY OWN GATE WAS ALSO NARROWER THAN ITS NAME ON ITS FIRST RUN, which is the DR-1467 class inside the check written to avoid it: the house writes Psalm 141:3 and the corpus file is Psalms.json, the generator falls back to the plural and the sweep did not, so it reported nine FALSE faults against Psalm; the resolution is now shared and asserted by name. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20. // 301 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov79 (Promotion cometh not from the east, DR-1471): total 475, allFour 301, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 79, allFour: 58}. sov79 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 0.53 < youth 4.10 < teen 5.62 < senior 9.86, child under its 5.0 ceiling and teen 0.38 under 6.0; shares 0.517 / 0.630 / 0.761 / 0.974 against floors 0.50 / 0.60; worst band-pair overlap 0.162 youth~teen and worst band-to-adult 0.181 youth~adult, against the 0.25 near-copy line; 314 quoted spans (304 of them in the five reader places) swept verbatim against per-chapter joins of the 25 books of app/public/bible/kjv the module itself cites, 0 faults, and 62 anchor references every one of which is quoted in a reader place. THE DR-1306 BAND FAILURES PAID A FIFTH TIME AND ARE RECORDED RATHER THAN SMOOTHED: the first draft read child 0.481 under its floor, teen 6.21 over the 6.0 ceiling AND above senior at 6.19 (the ladder inverted at the top), and teen, senior and the adult lesson mutually near-copies with senior~adult at 0.895. Every fix was authored BY HAND and never by a script on prose: senior rewritten as a senior-facing address, teen rewritten as nine questions in a direct voice, child extended twice; a second pass then OVERSHOT teen to 7.48 and was brought back to 5.62 by splitting sentences and plainering vocabulary, which is the honest record of a hand correction. MY OWN GATE THEN CAUGHT SIX THINGS IN THE AUTHORED TEXT: the adult lesson shipped with NO blocked-road note and NO talk-together close at all, it omitted the Arizona attribution, and the senior band used three phrasings that left it outside three thread checks the other four places passed. AND THE 62-SUITE CATALOG SWEEP CAUGHT ONE MY OWN FILE CANNOT SEE: sov66's chapter census recorded Obadiah 1 as untouched while sov79 anchors Obadiah 1:3-4, so per DR-1317 it moved from that file's FREE list to its SHARED map and neither reading was thinned. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20. // 300 on 2026-11-13, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov78 (Count the cost, DR-1470): total 474, allFour 300, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 78, allFour: 57}. sov78 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.41 < youth 2.82 < teen 5.32 < senior 8.24, adult 7.81, child under its 5.0 ceiling and teen under 6.0 with 0.68 of margin; shares 0.540 / 0.651 / 0.628 / 0.949 against floors 0.50 / 0.60; worst band-pair overlap 0.094 youth~teen and worst band-to-adult 0.209 adult~senior, against the 0.25 near-copy line; 301 quoted spans swept verbatim against per-chapter joins of 23 books of app/public/bible/kjv, 0 faults, and 62 anchor references every one of which is quoted in a reader place. THE DR-1306 TEEN OVERSHOOT PAID A FOURTH TIME AND IS RECORDED RATHER THAN SMOOTHED: the first draft read teen 6.77 over the 6.0 ceiling, youth 6.96 ABOVE teen (the ladder inverted), and child 0.460 / youth 0.562 / teen 0.547 under their floors. Every fix was authored BY HAND and never by a script on prose: three new band sections written for the child, youth and teen readers, 28 teen vocabulary swaps, and 59 youth sentences split at their own joints. MY OWN GATE THEN CAUGHT FIVE THINGS IN THE AUTHORED TEXT, which is what a gate is for: a recited DR number in the youth band, and -- the DR-1467 class again -- Revelation missing from the swept book list, so Revelation 3:7 was quoted in all five reader places and swept by nothing. Re-derived by the script, never incremented by hand -- re-review: 2026-11-20. // 299 on 2026-11-12, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov77 (Prove all things, DR-1457): total 473, allFour 299, adultOnly 0, adultRegister 0; the Sovereign A.I. row reads {lessons: 77, allFour: 56}. sov77 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.68 < youth 3.82 < teen 5.39 < senior 9.83, adult 7.57, child under its 5.0 ceiling and teen under 6.0; shares 0.506 / 0.606 / 0.644 / 0.950; worst band-pair overlap 0.224 adult~teen against the 0.25 near-copy line; 231 quoted spans swept verbatim against per-chapter joins of 22 books of app/public/bible/kjv, 0 faults. THE DR-1306 TEEN OVERSHOOT PAID A THIRD TIME AND IS RECORDED RATHER THAN SMOOTHED: the first draft read 6.66 over the 6.0 ceiling with child at 0.385 and youth at 0.473 under their floors; the fix was authored BY HAND -- about twenty long teen sentences split at their own joints and two new sections written for the child and youth bands -- landing 5.39 with the ladder still rising. Re-derived by the script, never incremented by hand -- re-review: 2026-11-19. // 298 on 2026-11-12, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov76 (the model in your hand, DR-1452): total 472, allFour 298, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 76, allFour: 55}. sov76 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.02 < youth 4.76 < teen 5.51 < senior 8.52, adult 7.29, child under its 5.0 ceiling and teen under 6.0; shares 0.513 / 0.619 / 0.711 / 0.918; worst band-pair overlap 0.186 adult~senior against the 0.25 near-copy line; 204 quoted spans swept verbatim against per-chapter joins of 21 books of app/public/bible/kjv, 0 faults. THE TEEN BAND PAID THE DR-1306 OVERSHOOT AGAIN AND IT IS RECORDED RATHER THAN SMOOTHED: its first draft read 6.85 over the 6.0 ceiling, the authored splits took it to 3.56 -- BELOW the youth band at 5.04, inverting the ladder from the other side -- and about twenty of those splits were then rejoined by hand, each read back and judged to read as prose rather than as fragments, landing 5.51. Re-derived by the script, never incremented by hand -- re-review: 2026-11-13. // 297 on 2026-11-12, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov75 (safely - a tool and not a friend, DR-1442): total 471, allFour 297, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 75, allFour: 54}. sov75 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.42 < youth 3.59 < teen 5.43 < senior 8.29, adult 6.30, child under its 5.0 ceiling and teen under 6.0; shares 0.554 / 0.643 / 0.632 / 0.638; worst band-pair overlap 0.042 adult~teen against the 0.25 near-copy line; 85 quoted spans swept verbatim against per-chapter joins of app/public/bible/kjv. Re-derived by the script, never incremented by hand -- re-review: 2026-11-13. // 296 on 2026-11-12, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov74 (with all thy getting get understanding, DR-1446): total 470, allFour 296, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 74, allFour: 53}. sov74 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.26 < youth 3.43 < teen 5.42 < senior 9.21, adult 6.61, child under its 5.0 ceiling and teen under 6.0; shares 0.546 / 0.629 / 0.643 / 0.632; worst band-pair overlap 0.030 adult~teen against the 0.25 near-copy line; 80 quoted spans swept verbatim against per-chapter joins of app/public/bible/kjv. Re-derived by the script on the merged tree, never incremented by hand -- re-review: 2026-11-13. // 295 on 2026-11-11, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds pm16 (divers weights in the bag, DR-1425): total 469, allFour 295, adultOnly 0, adultRegister 0, still pinned 174; the Project Management row reads {lessons: 16, allFour: 16}. pm16 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.31 < youth 4.84 < teen 5.64 < senior 6.71, adult 7.04, child under its 5.0 ceiling and teen under 6.0; shares 0.568 / 0.648 / 0.684 / 0.639; worst band-pair overlap 0.048 youth~teen, the lowest on this file, because the bands were written as independent compositions rather than re-registered from the adult lesson; 40 referenced Scripture spans swept verbatim against per-chapter joins of app/public/bible/kjv. The seventh collision on this literal; the structural fix is still tracked rather than assumed -- re-review: 2026-11-13. // 294 on 2026-11-11, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov73 (a credential you cannot check is not a credential, DR-1423): total 468, allFour 294, adultOnly 0, adultRegister 0, still pinned 174; the Sovereign A.I. row reads {lessons: 73, allFour: 52}. sov73 carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and THE DEBT DID NOT MOVE. Its ladder: child 1.36 < youth 4.66 < teen 5.94 < senior 8.68, adult 6.57, child under its 5.0 ceiling and teen under 6.0; shares 0.563 / 0.624 / 0.626 / 0.691; worst band-pair overlap 0.114 adult~youth against the 0.25 near-copy line; 49 quoted spans swept verbatim against per-chapter joins of app/public/bible/kjv. THE MISLABEL ABOVE WAS CORRECTED IN THIS COMMIT: the 290 note called its lesson sov73 while recording {lessons: 72, allFour: 51}, which is sov72's landing (DR-1376 is sov72 per INDEX's pointer note) -- left alone, this file would have carried two contradictory sov73 notes. The sixth collision on this literal; the structural fix is still tracked rather than assumed -- re-review: 2026-11-13. // 293 on 2026-11-10, MEASURED by the same script on the tree that holds dsi17 (what an attacker would use, DR-1408): total 467, allFour 293, adultOnly 0, still pinned 174; dsi17 carries all four bands and an adult lesson from its first commit, so the debt did not move. 292 on 2026-11-10, MEASURED by the same script on the tree that holds econ9 (the engine and the reserve, DR-1402): total 466, allFour 292, adultOnly 0, still pinned 174; econ9 carries all four bands and an adult lesson from its first commit, so the debt did not move. 291 on 2026-11-10, MEASURED by the same script on the tree that holds dsi16 (the house reports itself, DR-1401): total 465, allFour 291, adultOnly 0, still pinned 174; the Data Systems row reads {lessons: 16, allFour: 2}; dsi16 carries all four bands and an adult lesson from its first commit, so the debt did not move. 290 on 2026-11-06, MEASURED by `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs` on the tree that holds sov72 (total 464, allFour 290, adultOnly 0, adultRegister 0, still pinned 174); the Sovereign A.I. row reads {lessons: 72, allFour: 51}. sov72 (he that answereth a matter before he heareth it, DR-1376) carries all four age bands AND an adult register from its first commit, so only `total` and `allFour` moved and the DEBT DID NOT MOVE -- adultOnly and adultRegister are both still 0, which is the shape a new lesson is supposed to have and the thing this pin exists to prove. Its ladder: child 1.41 < youth 4.21 < teen 5.23 < senior 7.88, adult 7.96, child under its 5.0 ceiling and teen under 6.0, band shares 0.56 / 0.69 / 0.76 / 0.94 against floors 0.50 / 0.60, worst band-pair overlap 0.136 youth~teen and worst band-to-adult 0.21, against the 0.25 near-copy line; 40 pinned spans with 0 verse faults against app/public/bible/kjv. RE-DERIVED BY THE SCRIPT, NEVER INCREMENTED: the fifth collision on this literal in two days was the reason -- a lesson branch that counts only itself and a main that counted only its own arrivals produce the SAME wrong number, so both sides of the merge look resolved and are short. The structural fix is still tracked rather than assumed -- re-review: 2026-11-13.
    // The 289 note this replaces, kept for the chain: 289 on 2026-11-06, MEASURED by course-band-baseline-write.mjs on the tree that holds sov71 AND main's pm15+spm12 (total 463, allFour 289, adultOnly 0, still pinned 174). THE SAME COLLISION, A FOURTH TIME, AND AGAIN NEITHER SIDE WAS RIGHT: this branch pinned 287 counting only sov71, main pinned 288 after pm15 and spm12, and the truth on the merged tree is 289. Taking either side of the conflict ships a count short of the real catalog and looks resolved, which is the quiet kind of wrong. Re-derived by the script, never chosen. FOUR OCCURRENCES IN ONE DAY MAKE THE CAUSE STRUCTURAL, NOT CARELESS: this is a shared literal that every lesson PR edits from the same base, so parallel branches cannot help but collide here, and regeneration catches it without preventing it. That is tracked for machinery rather than memory -- re-review: 2026-11-13. // The 288 note this replaces, from main, kept for the chain: 288 on 2026-11-06, MEASURED by course-band-baseline-write.mjs on the tree that holds BOTH pm15 and spm12 (total 462, allFour 288, adultOnly 0, adultRegister 0). THE SAME COLLISION, A THIRD TIME, AND THIS TIME BOTH SIDES OF THE MERGE WERE WRONG THE SAME WAY: pm15 (DR-1356) raised 286 -> 287 and spm12 (DR-1366) independently raised 286 -> 287, so the textual merge offered two identical 287s and taking either would have shipped a count one short of the real catalog. Neither was taken. The number was RE-DERIVED by the script on the merged tree, which is the whole of DR-0692: a count is read off the catalog, never incremented by hand and never chosen between two branches that each counted only themselves. spm12 is the twelfth lesson of Software Project Management (software-project-management reads {lessons: 12, allFour: 12}); its ladder is child 1.77 < youth 6.21 < teen 7.47 < senior 10.95 under this course NO_ADULT_LESSON ladder, child under its 5.0 ceiling, worst band-pair overlap 0.151, and 31 quoted spans with 0 verse faults against app/public/bible/kjv. // The 287 note this replaces, from main, kept for the chain: 287 on 2026-11-06, MEASURED by course-band-baseline-write.mjs after merging main — the SECOND time this count collided the same way. pm15 (DR-1356) raised 285 to 286 on this branch while spm11 and ll285 raised it to 286 on main, so BOTH sides of the merge read 286 and the true count is 287. Earlier today the same pair read 285 on both sides and the truth was 286. DR-0692 is the rule this keeps proving: several sessions lower the same totals in parallel, so the number is re-measured, never incremented by hand, and never taken from either side of the conflict.
    // The spm12 note, kept for the chain (it pinned 287 too, which is how the collision was found): 287 on 2026-11-06: spm12 (The button you turn on -- the few lines of code that hand you a standing obligation, DR-1366), the TWELFTH lesson of Software Project Management, built from an IT Brew (Morning Brew) issue of 2026-10-22 that Darrell forwarded with the single word Lessons; three separate items in it are one shape -- a place-order button that hands you inventory, forecasting, payment, delivery and fraud; a site that worked for hours and then could not serve its requests with no code change; and a certificate practice that outgrew the hand running it. Carries all four age bands from its first commit; software-project-management reads {lessons: 12, allFour: 12}; READ from a fresh scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 461, allFour 287, adultOnly 0, adultRegister 0), never incremented by hand. fourBandFaults is clean under this course's NO_ADULT_LESSON ladder: ladder child 1.77 < youth 6.21 < teen 7.47 < senior 10.95, child under its 5.0 ceiling, worst band-pair overlap 0.151 youth~teen against the 0.25 near-copy line, every band naming its own lesson and sending the reader all three talk-together ways (DR-0795) from the first draft, and 31 quoted spans with 0 verse faults against app/public/bible/kjv. TWO CORPUS READINGS DIFFER FROM THE FAMILIAR ONES and were caught by reading rather than recalling: Exodus 18:18 ends "thyself alone" with NO comma, and Proverbs 20:25 reads "to the man who devoureth" rather than "to a man to devour" -- a pin typed from memory would have been wrong twice, and spm12's own gate holds both.
    // The spm11 note this replaces, kept for the chain: 286 on 2026-11-06: spm11 (Too old to patch -- an unsupported version cannot be fixed on the day the fix arrives, DR-1358), built from a University of Illinois Technology Services cPanel advisory about the PHP2Shell vulnerability that Darrell forwarded with the single word Lesson, carries all four age bands from its first commit; software-project-management reads {lessons: 11, allFour: 11}; READ from a fresh scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 460, allFour 286, adultOnly 0, adultRegister 0), never computed and never hand-merged (was 285, which sov70 had just taken on the same day). fourBandFaults is clean under the course's NO_ADULT_LESSON ladder (this course has no adult `lesson` field, so there is no share denominator): ladder child 2.24 < youth 5.73 < teen 7.69 < senior 11.96, child under its 5.0 ceiling, worst band-pair overlap 0.195 youth~teen against the 0.25 near-copy line, and 14 quoted spans across the four bands with 0 verse faults. Three CI findings were fixed in the lesson rather than in a gate, and the second one is the one to read: the talk-together rule (DR-0795) requires every NEW lesson to send the reader to parents, to children and to a friend IN EVERY BAND, which the first draft did in none of the four; adding those closings is what moved these grades and word counts from the figures the first commit recorded.
    // The sov70 note this replaces, kept for the chain: 285 on 2026-11-06: sov70 (Every one over against his house -- the wall that rose in fifty-two days without a meeting, and the one trumpet kept for the one thing that needed everybody, DR-1357), built from a ByteByteGo send Darrell forwarded with one word above it, Lesson -- a send that was a PAYWALLED PREVIEW, so the article was never read and the lesson says so in all five reader places. Carries all four age bands AND an adult register from the first commit (child 1779, youth 2750, teen 3043, senior 3378, adult 3424 prose words); the Sovereign A.I. row rises by one to {lessons: 70, allFour: 49}; READ from a fresh scripts/course-band-baseline-write.mjs run on the merged tree (total 459, allFour 285, adultOnly 0, adultRegister 0), never computed and never hand-merged (was 284). THE DEBT DID NOT MOVE, which is the whole point of this pin: adultOnly and adultRegister are both still 0.
    // The sov69 note that stood on this line is kept below, for the chain.
    // 284 on 2026-11-05: sov69 (At his day, or at evening -- how quickly a result must be useful, and the honest price of wanting it sooner, DR-1351), built from a Level Up Coding newsletter Darrell forwarded with one line above it that is TWO instructions, "Lessons... and potential systemic use?", carries all four age bands AND an adult register from the first commit (child 1584, youth 2290, teen 2356, senior 2814, adult 2967 prose words); the Sovereign A.I. row rises by one; READ from a fresh scripts/course-band-baseline-write.mjs run on the merged tree (total 458, allFour 284, adultOnly 0), never computed and never hand-merged (was 283).
    // The pm14 note that stood on this line is kept below, for the chain.
    // 283 on 2026-11-05: pm14 (whose measure -- the benchmark, the census, and the KPIs the Word already gave us, DR-1349), built from a CFO Dive sponsored advertisement Darrell forwarded with two things above it, Lesson and potential KPIs, carries all four age bands AND an adult register from the first commit; the Project Management row reads {lessons: 14, allFour: 14}; regenerated from the real catalog by course-band-baseline-write.mjs (was 281); 281 on 2026-11-05, sov67 (The removing of those things that
    // The sov68 note that stood on this line is kept below, for the chain.
    // on 2026-11-05, sov68 (There shall be none in the field --
    // the announced window, the portion that did not spoil, and the part no engine was holding)
    // raises it one more, from the 281 sov67 left the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the MERGED tree that holds both lessons
    // (total 456, allFour 282, adultOnly 0), never computed and never hand-merged. BOTH BRANCHES
    // RAISED THIS LINE 280 -> 281 FROM THE SAME STARTING POINT, which was named in DR-1338 before
    // either landed; sov67 landed first and took 281, so sov68 took 282 from the script rather
    // than by adding one by hand. sov68 carries all four authored bands from its first commit and
    // fourBandFaults reads clean -- adult prose 2,274 words; shares child 0.61, youth 0.64, teen
    // 0.70, senior 0.99; ladder child 2.02 < youth 3.97 < teen 4.93 < senior 8.17, every band
    // under its ceiling; worst band-pair overlap 0.215 senior~adult against the 0.25 near-copy
    // line. ITS CHILD BAND MISSED THE 0.5 SHARE FLOOR ON THE FIRST DRAFT at 0.40, and its teen
    // grade sat at 5.99 against the 6.00 ceiling -- one hundredth of a grade from red; both were
    // authored out rather than waived, and the baseline was regenerated afterwards. Recorded as
    // DR-1338.
    // The sov67 note that stood on this line is kept below, for the chain.
    // on 2026-11-05, sov67 (The removing of those things that
    // are made -- what cannot be patched is taken away, and the part nobody can lend you) raises it
    // one more, from the 280 sov66 left the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 455,
    // allFour 281, adultOnly 0, adultRegister 0), never computed and never hand-merged. sov67
    // carries all four authored bands from its first commit and fourBandFaults reads clean --
    // adult prose 3,839 words; shares child 0.571, youth 0.667, teen 0.736, senior 0.980; ladder
    // child -0.14 < youth 3.02 < teen 4.58 < senior 6.15 with the adult lesson at 7.28; worst
    // band-pair overlap 0.183 senior~adult against the 0.25 near-copy line -- so the sovereign-ai
    // row reads {lessons: 67, allFour: 46} and the DEBT does not move. ITS TEEN GRADE ALSO WENT
    // OVER THE 6.0 CEILING ON THE FIRST DRAFT, at 6.29, and the simplification pass then pushed
    // teen BELOW youth (4.58 against 4.64), breaking the ladder from the other side; youth was
    // lowered to 3.02 rather than teen raised back toward its ceiling. Recorded as DR-1332.
    // The sov66 note that stood on this line is kept below, for the chain.
    // on 2026-11-05, sov66 (They dwelt careless, and there was
    // no deliverer -- the hole that was always open, the stronger man who came, and the walls
    // Yahweh appoints) raises it one more, from the 279 sov65 left the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 454,
    // allFour 280, adultOnly 0, adultRegister 0), never computed and never hand-merged. sov66
    // carries all four authored bands from its first commit and the full fourBandFaults suite reads
    // clean -- adult prose 2,907 words; shares child 0.605, youth 0.789, teen 0.774, senior 0.936;
    // ladder child -0.10 < youth 3.68 < teen 4.15 < senior 8.91 with the adult lesson at 6.50;
    // worst band-pair overlap 0.165 adult~youth against the 0.25 near-copy line -- so the
    // sovereign-ai row reads {lessons: 66, allFour: 45} and the DEBT does not move. THE TEEN GRADE
    // WENT OVER ITS 6.0 CEILING ON THE FIRST DRAFT at 6.23; the authored simplifications overshot
    // to 2.90, BELOW the youth band at 3.68 and inverting the ladder, and 18 were then reversed by
    // hand -- each read back and judged to read as prose rather than as fragments -- landing 4.15.
    // That is the second build in a row to pay for the same overshoot, which is why the numbers
    // above are recorded rather than the pass alone.
    // Previously, on 2026-11-05, sov65 (I go, sir: and went not -- the full
    // price today and the proof coming soon, and the One of whom not one thing hath failed) raises
    // it one more, from the 278 sov64 left the day before. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 453,
    // allFour 279, adultOnly 0, adultRegister 0), never computed and never hand-merged. sov65
    // carries all four authored bands from its first commit and the full fourBandFaults suite reads
    // clean -- adult prose 3,144 words; shares child 0.548, youth 0.658, teen 0.697, senior 0.893;
    // ladder child 0.93 < youth 4.53 < teen 5.12 < senior 8.67 with the adult lesson at 7.02;
    // worst band-pair overlap 0.111 teen~senior against the 0.25 near-copy line -- so the
    // sovereign-ai row reads {lessons: 65, allFour: 44} and the DEBT does not move. THE TEEN GRADE
    // WENT OVER ITS 6.0 CEILING ON THE FIRST DRAFT at 6.40, and the 36 authored sentence splits
    // that fixed it overshot to 4.04, BELOW the youth band at 4.51 and inverting the ladder; 16
    // were then reversed by hand, each read back and judged to read as choppy fragments rather than
    // prose, landing 5.10 -- because DR-1306 measured what a script does to authored prose. The
    // youth and teen bands were each given a further authored paragraph naming the NINE readings
    // of this issue the course has already built, because a per-place sweep found that a youth or
    // teen reader was never told the obvious readings were already taught.
    // 2026-11-04, sov64 (lead on softly -- the tool was
    // made for the man, and the quota that kept its number when the straw was taken away) raises
    // it one more, from the 277 sov63 left the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run AFTER THE REBASE, on the tree that holds BOTH
    // sov63 and sov64 (total 452, allFour 278, adultOnly 0, adultRegister 0), never computed and
    // never hand-merged. sov64 was written off a main whose highest week was 62 and measured
    // 451/277 there -- true of that tree, and wrong the instant PR #2528 merged sov63, which is
    // why this number is re-derived rather than carried. sov64 carries all four authored bands
    // from its first commit and the full fourBandFaults suite reads clean -- shares child 0.60,
    // youth 0.71, teen 0.96, senior 1.05; ladder child 1.42 < youth 4.96 < teen 5.20 < senior
    // 9.16 with the adult lesson at 7.34; worst band-pair overlap 0.138 adult~teen against the
    // 0.25 near-copy line -- so the sovereign-ai row reads {lessons: 64, allFour: 43} and the
    // DEBT does not move. THE TEEN GRADE WENT OVER ITS CEILING ON THE FIRST DRAFT at 7.53, and
    // the 65 authored splits that fixed it overshot to 4.71, BELOW the youth band, inverting the
    // ladder; 25 were reversed by hand, each read back one at a time, landing 5.20 -- because
    // DR-1306 measured what a script does to authored prose. The child band was separately given
    // 160 further words of its own closing summary, in child register, raising its share from
    // 0.504 to 0.60.
    // The sov63 record this replaces, kept because it is what the previous tree measured:
    // on 2026-11-04, sov63 (let fall handfuls on purpose --
    // a standing provision is not a crisis measure, and nobody had hired them) raises it one more,
    // from the 276 sov62 left earlier the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 451,
    // allFour 277, adultOnly 0, adultRegister 0), never computed and never hand-merged -- and
    // re-derived AFTER the rebase onto the main that carries sov62, rather than carried over from
    // the pre-rebase measurement. sov63 carries all four authored bands from its first commit and
    // the full fourBandFaults suite reads clean -- shares child 0.58, youth 0.66, teen 0.87,
    // senior 0.94; ladder child 1.73 < youth 4.62 < teen 5.27 < senior 8.02 with the adult lesson
    // at 7.02; worst band-pair overlap 0.20 against the 0.25 near-copy line -- so the sovereign-ai
    // row reads {lessons: 63, allFour: 42} and the DEBT does not move. AND THE TEEN BAND IS WHERE
    // THIS LESSON PAID ITS TUITION, THREE TIMES: a first teen draft read 8.69, over its 6.0
    // ceiling, AND overlapped the adult lesson at 0.234, a near-copy by any honest reading; a
    // from-scratch rewrite in its own register dropped it to 4.08, which INVERTED the ladder below
    // the youth band; thirty-three deliberate sentence joins took it to 6.72, over the ceiling
    // again; twelve deliberate splits settled it at 5.27. Every pass was read back by hand for a
    // lowercased pronoun for Yahweh, for a manufactured fragment, and for damage to the gated TALK
    // ABOUT IT TOGETHER block, because DR-1306 measured what a script does to authored prose. No
    // script touched the prose.
    //
    // PREVIOUSLY, on 2026-11-04, sov62 (nobody told it to go around --
    // the reward that taught it, and the finished task that is not an acquittal) raises it one
    // more, from the 275 sov61 left earlier the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 450,
    // allFour 276, adultOnly 0, adultRegister 0), never computed and never hand-merged. sov62
    // carries all four authored bands from its first commit and the full fourBandFaults suite
    // reads clean -- shares child 0.60, youth 0.71, teen 0.95, senior 1.00; ladder child 3.1 <
    // youth 4.2 < teen 5.6 < senior 9.8 with the adult lesson at 6.6; worst band-pair overlap 0.06
    // teen~senior against the 0.25 near-copy line, and worst band~adult 0.07 -- so the
    // sovereign-ai row reads {lessons: 62, allFour: 41} and the DEBT does not move. THE NEAR-COPY
    // LINE WENT RED FIVE WAYS ON THE FIRST DRAFT (teen~senior 0.44, senior~adult 0.49) and three
    // bands were rewritten as independent compositions rather than re-registered; the teen grade
    // was then moved BY HAND in both directions, 39 authored joins and 9 authored reversals, each
    // read back for a lowercased pronoun for Yahweh, a manufactured fragment, and damage to the
    // gated TALK ABOUT IT TOGETHER block. No script touched the prose (DR-1306).
    // Previously 275 on 2026-11-04 with sov61 (one thing I know -- the warrant
    // nobody claimed, and the foothold you have to bring yourself) raises it one more, from the 274
    // sov60 left the day before. READ from a fresh scripts/course-band-baseline-write.mjs run on
    // the tree that holds the lesson (total 449, allFour 275, adultOnly 0, adultRegister 0), never
    // computed and never hand-merged. sov61 carries all four authored bands from its first commit
    // and the full fourBandFaults suite reads clean -- shares child 0.60, youth 0.66, teen 0.81,
    // senior 1.00; ladder child 2.0 < youth 3.1 < teen 5.2 < senior 7.1 with the adult lesson at
    // 7.2; worst band-pair overlap 0.15 against the 0.25 near-copy line -- so the sovereign-ai row
    // reads {lessons: 61, allFour: 40} and the DEBT does not move. AND BOTH GRADE MOVES WERE MADE
    // BY HAND, because DR-1306 measured what a script does to authored prose: twelve deliberate
    // sentence splits brought the teen band from 6.07 to 5.2, and twenty deliberate joins brought
    // the youth band from 2.6 to 3.1 so the child-to-youth rung is not a hair's breadth. Every one
    // was read back for a lowercased pronoun for Yahweh, for a manufactured fragment, and for
    // damage to the gated TALK ABOUT IT TOGETHER block. No script touched the prose.
    //
    // PREVIOUSLY, on 2026-11-03, sov60 (the bottleneck was never the
    // typing -- machines set to distrust each other, and the one who must still give an answer)
    // raises it one more, from the 273 sov59 left the same day. READ from a fresh
    // scripts/course-band-baseline-write.mjs run on the tree that holds the lesson (total 448,
    // allFour 274, adultOnly 0, adultRegister 0), never computed and never hand-merged. sov60
    // carries all four authored bands from its first commit and the full fourBandFaults suite reads
    // clean -- adult prose 2,686 words; shares child 0.56, youth 0.63, teen 0.83, senior 0.97;
    // ladder child 1.8 < youth 4.7 < teen 5.6 < senior 8.6 with the adult lesson at 6.4; worst
    // band-pair overlap 0.13 (youth~teen) against the 0.25 near-copy line -- so the sovereign-ai row
    // reads {lessons: 60, allFour: 39} and the DEBT does not move, which is the shape this pin
    // exists to prove. AND THE TEEN BAND IS WHERE THIS LESSON PAID ITS TUITION: two mechanical
    // attempts to move that band's reading grade were made and both were THROWN AWAY, the first
    // because joining sentences by lowercasing the following word turned "He does not raise His
    // voice" into "he does not raise His voice" -- a typographic-theology violation produced by a
    // script, which is exactly the blind-sweep failure CLAUDE.md forbids -- and the second because
    // splitting at connectives left eleven fragments, one of them inside the gated TALK ABOUT IT
    // TOGETHER block. The band that shipped was written and then repaired by hand.
    // The notes below are the reasoning sov59, sov58 and sov57 recorded for the same pin,
    // kept because the merge-order warning is still live (DR-1136): sov58 (the world that does not
    // drift -- a rehearsal is a gift, and a rehearsal is not the world, DR-1295) raised it from the
    // 271 sov57 left. READ from a fresh scripts/course-band-baseline-write.mjs run on the tree that
    // holds the lesson (total 446, allFour 272, adultOnly 0, adultRegister 0), never computed and
    // never hand-merged. sov58 carries all four authored bands from its first commit and the full
    // fourBandFaults suite reads clean, so the sovereign-ai row reads {lessons: 58, allFour: 37} and
    // the DEBT does not move -- which is the shape this pin exists to prove. The note below is the
    // reasoning sov57 recorded for the same pin, kept because it is still the live warning about
    // merge order (DR-1136): sov57 (the code can be rebuilt but the
    // register cannot, DR-1285) merged onto mgmt9's tree, and it is the SEVENTH lesson in a queue where
    // every branch was right about its own increment and wrong about the total. sov57 measured 268 -> 269
    // on the base it was built on, then 270 on the tree that also carried wm10, then THIS number on the
    // tree that also carries mgmt9 -- three numbers, each true of a real tree at a real moment, and only
    // the last true of this one. sov57 carries all four authored bands from its first commit, so the
    // sovereign-ai row reads {lessons: 57} and the DEBT does not move, which is the shape this pin exists
    // to prove. READ from a fresh scripts/course-band-baseline-write.mjs run after the merge (total 445,
    // allFour 271, adultOnly 0, adultRegister 0), never computed.
    //
    // THE PREVIOUS ENTRY, kept as it recorded itself: on 2026-10-29, mgmt9 (nobody is coming to define your
    // work, DR-1281) merged onto wm10's tree. SIX lessons landed across 2026-10-28/29 and every one of
    // them raises this figure, so every branch in the queue was right about its own increment and wrong
    // about the total. mgmt9 measured 266 -> 267 on the base it was built on, then 269 on the tree that
    // also carried sov56 and bank9, and this number on the tree that also carries wm10. READ from a fresh
    // scripts/course-band-baseline-write.mjs run AFTER each merge, never computed -- which is exactly the
    // failure that script's own header warns about, and three of those numbers were true of some real
    // tree at some real moment.
    //
    // The management-stewardship row moves {lessons: 8, allFour: 8} -> {lessons: 9, allFour: 9}: the
    // course already carried four bands on every lesson, so mgmt9 could not have shipped short.
    // DR-1281), the NINTH lesson of Management Is Stewardship, built from the SmartBrief for the Higher Ed
    // Leader edition Darrell forwarded to himself on 2026-10-06 with one word above the body. It is the
    // FIFTH lesson in a queue of five across 2026-10-28/29 that each raise this figure, and it measured
    // 266 -> 267 on the base it was built on (main at 0be3abf58). On the MERGED tree, which also carries
    // sov56 and bank9, the answer is 269. READ from a fresh scripts/course-band-baseline-write.mjs run
    // AFTER the merge, never computed: 267 was true of this branch's own tree and would have shipped a
    // wrong number here, which is the failure that script's own header warns about.
    // The whole course already carried four bands, so the management-stewardship row moves
    // {lessons: 8, allFour: 8} -> {lessons: 9, allFour: 9} and the lesson could not have shipped short.
    // mgmt9's own measurement, RE-TAKEN after its spine was sent back TWICE for colliding with sibling
    // Real Estate courses (Exodus 31/35 with maintenance-trades, caught by CI shard 4/4; Proverbs 6 with
    // buying-terms, caught by the whole-shelf gate written in answer to the first). It now stands on
    // Proverbs 30:24-27, Exodus 36:1, 1 Chronicles 25:8 and 1 Chronicles 22:16: adult prose 1,393 words;
    // shares child 0.61 / youth 0.65 / teen 0.74 / senior 0.66 against floors 0.50 / 0.60 / 0.60 / 0.60;
    // ladder 1.3 / 2.5 / 4.2 / 6.0, strictly ascending, child under the 5.0 new-lesson ceiling and teen
    // under this course's own 6.0; worst band-pair overlap 0.09. allFour does not move with a verse
    // change -- the course already carried four bands on all nine lessons -- so the 269 above stands, and
    // it was re-read from the script rather than assumed after every one of those rewrites.
    //
    // Every earlier lesson's own measurement is kept below exactly as it recorded it, none edited to suit
    // another. The chain reads 265 -> 266 -> 267 -> 268 -> 269 as each of the five landed.
    // DR-1281), the NINTH lesson of Management Is Stewardship, built from the SmartBrief for the Higher Ed
    // Leader edition Darrell forwarded to himself on 2026-10-06 with one word above the body. MEASURED on
    // the real catalog by a fresh scripts/course-band-baseline-write.mjs run (total 440 -> 441, allFour
    // 266 -> 267, adultOnly 0, adultRegister 0, 174 still pinned), never hand-written. The whole course
    // already carried four bands, so the management-stewardship row moves {lessons: 8, allFour: 8} ->
    // {lessons: 9, allFour: 9} and the lesson could not have shipped short. Its own measurement, kept as
    // this build recorded it: adult prose 1,247 words; shares child 0.59 / youth 0.65 / teen 0.72 /
    // senior 0.65 against floors 0.50 / 0.60 / 0.60 / 0.60; ladder 1.4 / 2.5 / 4.3 / 6.1, strictly
    // ascending, child under the 5.0 new-lesson ceiling and teen under this course's own 6.0; worst
    // band-pair overlap 0.09. (This block's share and overlap figures were RE-MEASURED after a two-word
    // edit to the senior band and two of them had gone stale -- teen read 0.70 and the overlap 0.11
    // before the teen band's own limits passage was rewritten. A measurement is only true of the text it
    // was taken on, so it is re-taken rather than carried forward: DR-0076 section 4.)
    //
    // 266 on 2026-10-28: TWO lessons landed the same day and BOTH
    // RESOLVED BY MEASUREMENT, FOUR TIMES OVER, never by arithmetic.
    // RESOLVED BY MEASUREMENT, FIVE TIMES OVER, never by arithmetic.
    // THE FIFTH TIME, 2026-10-29: wm10 (the name and the proof, DR-1282) merged onto the tree the note
    // below describes, and BOTH SIDES OF THAT MERGE READ 268 -- main's 268 because it holds the four
    // lessons named below, and wm10's 268 because it measured 267 + itself on a base that predated
    // bank9. Two identical numbers meaning two different catalogs is the most dangerous shape this pin
    // has met, because a textual merge of the two agrees and is wrong: the merged catalog holds all
    // FIVE, so it is 269. Read from a fresh scripts/course-band-baseline-write.mjs run on the merged
    // tree (total 443, allFour 269, adultOnly 0), never computed, and the world-market row reads
    // {lessons: 10, allFour: 10}.
    //
    // measured by scripts/course-band-baseline-write.mjs after `git merge origin/main`,
    // FOUR lessons landed across 2026-10-28/29 and every one of them raises allFour, so each measured
    // 264 -> 265 on its own base and every side of every merge in the queue was right about its own
    // increment and wrong about the total: sov55 (the czar and the charge, DR-1273), dsi15 (weighed into
    // named hands, DR-1278), sov56 (oversight is a charge, not a ceremony, DR-1274) and bank9 (the moat
    // that moves, DR-1279). The figure went 265 -> 266 -> 267 -> 268 as each landed, and bank9 is last in
    // the queue, so 268 is the catalog that holds all four. READ from a fresh
    // scripts/course-band-baseline-write.mjs run after the merge, never computed -- which is exactly the
    // failure that script's own header warns about. Taking any side's 265, or the 266 that could see two
    // of the four, or the 267 that could see three, would each have shipped a wrong number, and three of
    // those four numbers were true of some real tree at some real moment. That is why this is a script.
    // Each lesson's own measurement is kept below as it recorded it, none edited to suit another.
    // sovereign-ai reads {lessons: 56}; datasystems {lessons: 15, allFour: 1}; banking {lessons: 9, allFour: 1}.
    // never hand-written: every lesson that lands raises this, and that script's own header
    // warns that hand-merging the number after a merge is how a wrong one ships.
    //
    // Each lesson's own measurement, kept as it recorded it:
    // // 268 on 2026-10-29: wm10 (the name and the proof -- crossing the counter: what a
    // seller's name is worth, and the weight the BUYER holds too, DR-1280), the TENTH lesson
    // of The World Market, built from a Retail Dive newsletter Darrell forwarded to himself on
    // 2026-10-08 with one word above the body. It carries all four age bands from its first
    // commit, so adultOnly did NOT move with it and stays 0; the world-market row moves from
    // {lessons: 9, allFour: 9} to {lessons: 10, allFour: 10} and the total from 441 to 442.
    // Measured on the module rather than claimed: adult prose 1,996 words; band shares child
    // 0.55 / youth 0.69 / teen 0.91 / senior 1.04 against floors 0.50 / 0.60 / 0.60 / 0.60;
    // reading ladder 0.8 / 6.5 / 8.1 / 11.4, strictly ascending with the child band far under
    // the 5.0 new-lesson ceiling; worst band-pair overlap 0.26 against a ceiling of 0.50; 105
    // referenced quoted spans, 105 verbatim off the corpus on disk, 0 faults; 21 anchors, every
    // one named in the adult lesson and every quoted reference covered by anchor.ref, both
    // directions exact. Regenerated by scripts/course-band-baseline-write.mjs, never
    // hand-written -- three PRs the previous night each hand-wrote this number and two were
    // wrong. The first measurement of this lesson had the CHILD band short at 0.47, and it was
    // fixed the right way round: the child band gained the three concrete actions and the
    // unread-report disclosure it was genuinely missing, rather than adult teaching being cut
    // to flatter a ratio.
    // // 266 on 2026-10-28: sov56 (oversight is a charge, not a
    // ceremony, DR-1274), the fifty-sixth week of Sovereign A.I. Measured by a fresh
    // scripts/course-band-baseline-write.mjs run (total 440, allFour 266, adultOnly 0, 174 still
    // pinned), never hand-written. All four bands from its first commit; sovereign-ai {lessons: 56}. // 265 on 2026-10-28: sov55 (the czar and the charge, and the desk
    //
    // // 266 on 2026-10-28: TWO lessons landed the same day and BOTH
    // raise allFour, so each side of this merge said 265 and NEITHER was right. sov55 (the czar and the
    // charge, and the desk above the desk, DR-1273) measured 264 -> 265 on its own base, and dsi15
    // (weighed into named hands, DR-1278) measured 264 -> 265 on its. On the MERGED catalog both are
    // present, so the answer is 266. Re-measured by scripts/course-band-baseline-write.mjs AFTER
    // `git merge origin/main`, which is exactly the failure that script's own header warns about:
    // hand-merging these numbers after a merge is how a wrong number ships, and taking either side's
    // 265 would have shipped one. sovereign-ai reads {lessons: 55}; datasystems {lessons: 15, allFour: 1}.
    //
    // Both lessons' own measurements, kept as each recorded them:
    // // 265 on 2026-10-28: sov55 (the czar and the charge, and the desk
    // above the desk, DR-1273), the fifty-fifth week of Sovereign A.I. Measured by a fresh
    // scripts/course-band-baseline-write.mjs run (total 439, allFour 265, adultOnly 0, 174 still pinned),
    // never hand-written. All four bands from its first commit; sovereign-ai reads {lessons: 55}.
    // measured by scripts/course-band-baseline-write.mjs after `git merge origin/main`,
    // never hand-written: every lesson that lands raises this, and that script's own header
    // warns that hand-merging the number after a merge is how a wrong one ships.
    //
    // Each lesson's own measurement, kept as it recorded it:
    // // 265 on 2026-10-28: sov55 (the czar and the charge, and the desk
    // above the desk, DR-1273), the fifty-fifth week of Sovereign A.I. Measured by a fresh
    // scripts/course-band-baseline-write.mjs run (total 439, allFour 265, adultOnly 0, 174 still pinned),
    // never hand-written. All four bands from its first commit; sovereign-ai reads {lessons: 55}.
    // // 265 on 2026-10-28: bank9 (the moat that moves -- the bank changed its ground,
    // DR-1279), the NINTH lesson of the Banking course and the FIRST lesson of that course to carry all four age
    // bands, built from The Daily Upside edition Darrell forwarded to himself with one word on it (Gmail thread
    // 1a1541f1da7acd58). Measured on the real catalog, not assumed: total 440, allFour 266, adultOnly 0, 174 still
    // pinned, so the banking row reads {lessons: 9, allFour: 1}. That matters beyond the increment: banking's
    // four-band GAP is now 8 against a frozen ceiling of 8, so the ceiling binds EXACTLY -- the next lesson added
    // to Banking carries all four bands or fails fourBandGapFindings, and the eight two-band lessons already there
    // are backlog that may only shrink. Band shares child 0.54 / youth 0.61 / teen 0.68 / senior 0.77; ladder
    // child 2.4 < youth 6.4 < teen 7.9 < senior 10.7 with the child band under the 5.0 new-lesson ceiling; worst
    // band-pair overlap 0.14 against the 0.50 ceiling. Regenerated by course-band-baseline-write.mjs (was 265 on each
    // side of the merge, and 265 was wrong on both).
    // // 265 on 2026-10-28: dsi15 (weighed into named hands -- knowing what the house
    // actually owns, DR-1278), the FIFTEENTH module of PoeTech Data Systems & Infrastructure and the FIRST lesson of
    // that course to carry all four age bands, built from the IT Brew edition "The ghost of assets past" that Darrell
    // forwarded to himself on 2026-10-06 with one word above the body. MEASURED on the real catalog, not assumed:
    // child share 0.57, youth 0.66, teen 0.67, senior 0.75 of the adult lesson's own prose (1,548 prose words);
    // ladder child 2.0 < youth 6.9 < teen 10.3 < senior 13.3, the child band well under the 5.0 new-lesson ceiling;
    // worst band-pair overlap 0.09. So allFour rises 264 -> 265 with total (438 -> 439) and the datasystems row moves
    // from {lessons: 14, allFour: 0} to {lessons: 15, allFour: 1}; adultOnly and adultRegister both stay 0. Note the
    // course's frozen four-band gap ceiling is 14, which this lesson exactly meets rather than breaches (15 lessons
    // less 1 four-band = 14): the fourteen bandless-by-history modules are unchanged debt, and the fifteenth could not
    // have shipped short. Regenerated by scripts/course-band-baseline-write.mjs, never hand-edited -- two PRs earlier
    // the same day each hand-wrote 262 and both were wrong.
    // // 262 on 2026-10-28: sov54 (cheating became an industry -- the watchman Yahweh
    // sets, the gate he must actually stand at, and the name no forger can buy, DR-1272), built from the IT Brew issue
    // "Cheat codes" Darrell forwarded on 2026-09-16 with two words on it, carries all four age bands from its first
    // commit -- and carries them ABOVE their share floors, measured rather than claimed: child 0.53, youth 0.61, teen
    // 0.64, senior 0.64, with the ladder 0.3 < 5.3 < 8.0 < 9.1 and worst band-pair overlap 0.04. Measured on the real
    // catalog: total 436, allFour 262, adultOnly 0, and the sovereign-ai row reads {lessons: 54, allFour: 33}.
    // Regenerated by scripts/course-band-baseline-write.mjs, never hand-edited.
    //
    // // 263 on 2026-10-28: TWO lessons landed the same day and BOTH
    // raise allFour, so neither branch's hand-written 262 was right. Measured by
    // scripts/course-band-baseline-write.mjs after `git merge origin/main` (total 437, allFour 263,
    // adultOnly 0, 174 still pinned), which is the exact failure that script's own header warns about:
    // hand-merging these numbers after a merge is how a wrong number ships. Never hand-edited.
    // legacy-provisions reads {lessons: 8, allFour: 8}; world-market reads {lessons: 9, allFour: 9}.
    //
    // Both lessons' own measurements, kept as each recorded them:
    // // 262 on 2026-10-28: legacy8 (the hoary head holds the harvest -- a harvest held
    // is not yet handed, and a reported number is not a verified one, DR-1275), the eighth lesson of Legacy Provisions,
    // built from the Morning Brew edition Darrell forwarded to himself with one word on it (Gmail thread
    // 1a1353f9e69525a6). MEASURED on the real catalog, not assumed: all four authored bands from its first commit --
    // child share 0.62, youth 0.75, teen 0.98, senior 1.15; ladder child 2.5 < youth 7.1 < teen 7.8 < senior 8.7; worst
    // band-pair overlap 0.20 -- so allFour rises 261 -> 262 with total (435 -> 436) and the legacy-provisions row reads
    // {lessons: 8, allFour: 8}; adultOnly and adultRegister both stay 0. Regenerated by course-band-baseline-write.mjs.
    //
    // // 262 on 2026-10-28: wm9 (the cost of staying warm -- the machinery and the
    // rule arriving at one household's own door, DR-1276), the NINTH lesson of The World Market, built from the
    // Morning Brew newsletter Darrell forwarded with one word on it. It carries all four age bands from its first
    // commit -- child 0.56 / youth 0.69 / teen 0.88 / senior 1.10 of the adult lesson's own prose, ladder 0.4 / 6.9 /
    // 8.7 / 12.1 ascending with the child band under the 5.0 new-lesson ceiling -- so allFour rises with total and
    // adultOnly stays 0: not one lesson in the catalog hands a child adult prose under a child's label. The
    // world-market row reads {lessons: 9, allFour: 9}. Regenerated by scripts/course-band-baseline-write.mjs, never
    // hand-edited.
    // 261 on 2026-10-28: sov53 (prompt caching versus semantic caching -- the exact
    // memory on our own writer, the approximate one kept away from the Word, DR-1265), typed into the session by Darrell
    // and built the same day, carries all four age bands from its first commit. Measured on the branch that also carries
    // ll270 (DR-1263): total 435, allFour 261, adultOnly 0 -- ll270 moves neither figure, because this baseline does not
    // scope Living Lessons, so the +1 is sov53's alone. Regenerated by scripts/course-band-baseline-write.mjs, never
    // hand-edited.
    // 260 on 2026-10-27: sov52 (a just weight and the validator that checks
    // the file, DR-1258) carries all four age bands from its first commit. Built by hand from `agent_inbox` row
    // 60972a31 after it waited ~119 hours while the NAS lesson builder was dark-in-effect (DR-1219). Measured on
    // the merged tree, which also carries ll267: total 434, allFour 260, adultOnly 0 — ll267 moves neither figure,
    // because this baseline does not scope Living Lessons, so the +1 is sov52's alone. Regenerated by
    // scripts/course-band-baseline-write.mjs, never hand-edited.
    // 259 on 2026-10-27: sov51 (the office that does not transfer) is the
    // LAST of three Sovereign A.I. weeks written in parallel. Its own side of this merge said 257 and main said
    // 258 -- each counted only the weeks it could see. Re-measured by scripts/course-band-baseline-write.mjs on
    // the merged catalog (total 433, allFour 259, adultOnly 0). Never hand-merged: that is how a wrong number
    // ships, and it is why DR-0692 made this a script in the first place.
    // long -- on-campus polling sites, the distance to the ballot, and the roads Yahweh measured so a right could be reached, DR-1205),
    // the FIRST lesson built through the research road DR-1202 opened: Darrell sent an Instagram reel with one word on it, the NAS wrote
    // its words with a local Whisper model, and the lesson was built from the transcript. It carries all four age bands from the first
    // commit, so adultOnly did NOT move with it, and the world-issues row reads {lessons: 21, allFour: 2}. Its ground was chosen by
    // measurement: the obvious spine was the INTERSECTION of two issues this course already holds -- wi-musk-creator-critique (how to
    // receive a creator's advocacy video; Proverbs 18:17, Exodus 23:2, Leviticus 19:15, Isaiah 10:1) and wi-scotus-mail-in-voting-2026
    // (the vote and a just measure; Deuteronomy 1:17, Proverbs 11:1, Deuteronomy 25:13) -- ten shared verses, which is DR-1185's own
    // duplicate threshold. What was free, counted and not guessed at: Deuteronomy 19:2/19:3/19:6, Numbers 35:11-12, Joshua 20:4,
    // Isaiah 57:14, Isaiah 62:10 and "cities of refuge" were at ZERO across all 44 courses, so it stands on the roads Yahweh measured.
    // 254 on 2026-10-21: 253 was sov47, and this is sov48 (the bread they brought was mouldy --
    // cache invalidation, the answer that was true when you stored it, and the bread that is new every morning, DR-1193), built from
    // the ByteByteGo issue "LLM Prompt Caching Versus Semantic Caching" that Darrell forwarded at 17:12 UTC with one word on it --
    // the SECOND of two forwards that day, the first being the IT Brew issue sov47 came from. It carries all four age bands from the
    // first commit, so adultOnly did NOT move with it, and the sovereign-ai row reads {lessons: 48, allFour: 27}. Its ground was
    // chosen by measurement and the measurement said most of the article was already taught: prompt caching is sov20's, embeddings
    // and similarity are sov22's, the one critical word that flips a meaning is sov32's, the order of a prompt is sov39's. What was
    // free, counted rather than guessed at, was INVALIDATION -- zero occurrences in forty-seven weeks -- so it stands on Joshua 9,
    // Exodus 16:19-21, Lamentations 3:22-23, Matthew 6:11, John 6:49-51 and Haggai 1:5, all at zero in this course before it.
    // 253 on 2026-10-21: 252 was sov46, and this is sov47 (the purse opens after the wall falls --
    // deferred maintenance, the alarm nobody answers, and the house that droppeth through, DR-1192), built from the IT Brew issue
    // "Downtime is money" that Darrell forwarded at 16:52 UTC with one word on it -- a DIFFERENT IT Brew issue from the one sov46
    // was built from, which is why the date alone does not identify it. It carries all four age bands from the first commit, so
    // adultOnly did NOT move with it. Its spine was chosen by measurement rather than by theme: the obvious reading of that article
    // is "count the cost", which sov34 and sov38 already hold on Luke 14:28 and Matthew 7:24, so sov47 stands instead on
    // Ecclesiastes 10:18, Proverbs 24:30-34 and Nehemiah 2:17 -- all at zero occurrences in this course before it.
    // 252 on 2026-10-21: 251 was sov45 (no single witness -- the office of the critic, DR-1146),
    // and this is sov46 (the helper that must see everything -- Hezekiah's open treasure house, the goods that are another man's,
    // and the sight that belongs to Yahweh alone, DR-1139), built from the IT Brew issue Darrell forwarded with one word on it.
    // Both carry all four age bands from their first commit, so adultOnly did NOT move with either: the total may grow, the DEBT may not.
    // 250 -> 251 -> 252 across the three lessons of 2026-10-20, each increment one lesson, each verified on the merged tree.
    // The chain, unbroken: 250 on 2026-10-20: sov44 (the thief who forgot to lock his own door -- the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps, DR-1145), built from The Neuron issue "AI hackers forgot to lock up" that Darrell forwarded at 12:21 UTC with one word on it, carries all four age bands from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 249); 249 on 2026-10-20: sov43 (work beside learning is apostolic, not experimental -- the Lord's release, the Word-first algorithm run across the Word, what apostolic means, and context is King, DR-1134), spoken by Darrell into the app while reading week 42 at the release and built as its own week, carries all four age bands from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 248); 248 on 2026-10-19: sov42 (the three-year degree and the work that teaches -- counting the forming years, the debt everybody is fleeing, and the stranger in the gate, DR-1115), built from the SmartBrief for the Higher Ed Leader digest Darrell forwarded with one word on it, carries all four age bands from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 247, pm13); 247 on 2026-10-19: pm13 (selected, designed, procured, built and steered -- digital and A.I. change the how, not Who establishes the house, DR-1116), built from a McKinsey Operations alert Darrell forwarded with one word on it, carries all four age bands from the first commit; the Project Management row reads {lessons: 13, allFour: 13}; regenerated from the real catalog by course-band-baseline-write.mjs (was 246); 246 on 2026-10-19: sov41 (the agent that drowned in its own output -- a bigger window is not a sounder mind, the pointer that keeps what matters, and the clear "It is finished", DR-1114), built from The Neuron letter Darrell forwarded with one word on it, carries all four age bands from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 245); 245 on 2026-10-17: the car course grows to six lessons (car5 the electric car, car6 the car that drives itself, DR-1087), both carrying all four age bands from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 243); 243 on 2026-10-16: the History department's third course (car-research-who-invented-the-car, 4 lessons, DR-1083) carries all four age bands on every lesson from the first commit; regenerated from the real catalog by course-band-baseline-write.mjs (was 239); 239 on 2026-10-15: World Issues issue 20 (the wage that no longer buys the day, DR-1049), built from the Morning Brew letter Darrell forwarded with one word on it, is the FIRST issue of that course to carry all four age bands -- and it had to, because the course's four-band gap ceiling is 19 and a twentieth three-band issue would have failed fourBandGapFindings; measured through vitest against the real catalog after merging main's 238, and regenerated by course-band-baseline-write.mjs (was 238); 238 on 2026-10-15: sov40 (the leaders use it more than the led -- pretending to know is a debt, and no worker is untraceable, DR-1048), built from the CompTIA SmartBrief digest Darrell forwarded with one word on it, carries all four age bands; regenerated from the real catalog by course-band-baseline-write.mjs (was 237); 237 on 2026-10-13: sov39 (order carries meaning -- the same words rearranged say another thing, and that is how a lie is made, DR-1005), built from the ByteByteGo article Darrell forwarded with one word on it, carries all four age bands; regenerated from the real catalog by course-band-baseline-write.mjs (was 236); 236 on 2026-10-13: sov38 (AI lowered the cost of building, not the cost of owning -- count it sitting down, and be able to give an account, DR-1004), built from the CFO Dive letter Darrell forwarded with one word on it, carries all four age bands; regenerated from the real catalog by course-band-baseline-write.mjs (was 235); 235 on 2026-10-10: lil9 (Abraham -- the promise, the stars, and the lamb Yahweh provided, DR-0868), the third lesson of the children's spine, carries all four age bands; regenerated from the real catalog by course-band-baseline-write.mjs (was 234); 234 on 2026-10-10: lil8 (Noah -- grace, the door Yahweh shut, and the bow in the cloud, DR-0867), the second lesson of the Genesis-to-Revelation children's spine, carries all four age bands; regenerated from the real catalog by course-band-baseline-write.mjs (was 233); 233 on 2026-10-10: lil7 (Adam and Eve, Little Learners slice 2 -- Darrell's "Genesis - Revelation... Adam and Eve... basic building blocks of Yahweh's Perspectives explicitly for the children") carries all four age bands, regenerated from the real catalog by course-band-baseline-write.mjs (was 232); 232 on 2026-10-09: Sovereign A.I. weeks 1 to 8, 14 and 16 carry all four age bands (DR-0692), regenerated from the real catalog by course-band-baseline-write.mjs after merging main (was 222); 222 on 2026-10-09: the Rent-to-Own Business course carries all four age bands on every lesson (DR-0692), regenerated from the real catalog by course-band-baseline-write.mjs after merging main, and adultOnly reaches 0 (was 214); 214 on 2026-10-09: the Development course carries all four age bands on every lesson (DR-0692), regenerated from the real catalog by course-band-baseline-write.mjs after merging main (was 206); 206 on 2026-10-09: the Mathematics course carries all four age bands on every lesson (DR-0692), regenerated from the real catalog by course-band-baseline-write.mjs after merging main (was 198); 198 on 2026-10-08: Sovereign A.I. week 37 (sov37, stop paying a model to redecide what is already settled - a just weight answers the same every time, DR-0824) carries all four bands, regenerated from the real catalog by course-band-baseline-write.mjs (was 197); 197 on 2026-10-07: Sovereign A.I. week 36 (sov36, the pile the machine made - 722 manuscripts carried as a claim and the proving that is the work, DR-0792) carries all four bands, regenerated from the real catalog by course-band-baseline-write.mjs after merging week 35 (was 196); 196 on 2026-10-07: Sovereign A.I. week 35 (sov35, the new players - open weights, a just weight, DR-0791) carries all four bands, regenerated from the real catalog by course-band-baseline-write.mjs (was 195); 195 on 2026-10-06: Sovereign A.I. week 34 (sov34, the bounded answer, DR-0760) carries all four bands, regenerated from the real catalog by course-band-baseline-write.mjs after merging week 33 (was 194); 194 on 2026-10-06: Sovereign A.I. week 33 (sov33, peace, peace; when there is no peace - the tool trained on approval and the faithful witness, DR-0761) carries all four bands, regenerated from the real catalog (was 193); 193 on 2026-10-02: Sovereign A.I. week 32 (sov32, the "I’m fine" problem, DR-0752) is the first lesson of that course to carry all four bands, regenerated from the real catalog (was 192); 192 on 2026-10-01: bands-e-stocks-bonds carries all four bands, regenerated from the real catalog after merging main (was 176); 176 on 2026-10-01: bands-e-prophetic-voices carries all four bands, regenerated from the real catalog after merging main (was 170); 170 on 2026-10-01: bands-ai-little-learners carries all four bands, regenerated from the real catalog after merging main (was 156); 156 on 2026-10-01: partnerships and taxes-records join them (DR-0696), merged onto main's 62, merged onto main's 74, merged onto main's 81, merged onto main's 92, merged onto main's 108, merged onto main's 128, merged onto main's 140; 140 on 2026-10-01: project-management carries all four bands on all 12 lessons (DR-0693), merged onto main's 62, merged onto main's 74, merged onto main's 81, merged onto main's 92, merged onto main's 108, merged onto main's 128; 128 on 2026-10-01: group C (DR-0694) adds software-project-management and infrastructure, all four bands on all 20 lessons, merged onto main's 62, merged onto main's 74, merged onto main's 81, merged onto main's 92, merged onto main's 108; 108 on 2026-10-01: world-market and investing carry all four bands on all 16 lessons (DR-0695), merged onto main's 62, merged onto main's 74, merged onto main's 81, merged onto main's 92; 92 on 2026-10-01: ai-legal-blueprint and handed-forward carry all four bands on all 11 lessons (DR-0695), merged onto main's 62, merged onto main's 74, merged onto main's 81; 81 on 2026-10-01: legacy-provisions carries all four bands on all 7 lessons (DR-0695), merged onto main's 62, merged onto main's 74; 74 on 2026-10-01: church-offices and word-out carry all four bands on all 12 lessons (DR-0695), merged onto main's 62; 62 on 2026-09-30: history-truth carries all four bands on all 8 lessons (DR-0695); 54 on 2026-09-30: leasing-tenants and maintenance-trades join them (DR-0696); 38 on 2026-09-30: property-principle and management-stewardship carry child and youth beside teen and senior on all 16 lessons (DR-0696); 22 on 2026-09-29: Who He Is (DR-0675) carries all four bands on all 14 lessons; 8 on 2026-09-24: the rebuilt historical-research-1619 (DR-0597) carries child, youth, teen and senior on every lesson — the first catalog course with all four bands; a course may only add to this number
    expect(baseline.adultOnly).toBe(0);
  });

  it('matches the live catalog exactly', () => {
    expect(scan.allFour).toBe(baseline.allFour);
    expect(scan.adultOnly).toBe(baseline.adultOnly);
    expect(scan.adultRegister).toBe(baseline.adultRegister);
  });

  it('separates a missing label from adult prose served to a child', () => {
    // The correction that made the fix aimable. 43 bandless lessons were NOT
    // 43 lessons serving adult words: 5 were, and measuring said which. A
    // course written for the youngest readers, reading at grade 0.3, must
    // never be counted the same as one reading at 12.4, or the number stops
    // being information and starts being an impression with a digit on it.
    // Once a course carries all four bands it has no bandless lessons and so
    // no bandless grade (DR-0692): the distinction is then moot, not violated.
    for (const key of ['little-learners', 'mathematics']) {
      const row = baseline.courses[key];
      if (row.bandlessGrade !== undefined) expect(row.bandlessGrade, key).toBeLessThan(3);
      else expect(row.adultOnly, `${key} has bandless lessons but no bandless grade`).toBe(0);
      expect(row.adultRegister, key).toBe(0);
    }
  });

  it('holds the register defect at zero, everywhere, now that the five are authored', () => {
    // broadcast read at 12.4 and rose to 16.3; ai wk3-the-test read at 10.3.
    // All six of those lessons now carry authored teen and senior bands, so
    // NOTHING bandless in the catalog reads above the ceiling — and this is
    // the assertion that keeps it that way, because a ratchet held at zero is
    // the only kind that cannot drift.
    expect(baseline.adultRegister).toBe(0);
    expect(scan.adultRegister).toBe(0);
    expect(baseline.courses.broadcast.adultOnly).toBe(0);
    for (const [key, row] of Object.entries(baseline.courses)) {
      expect(row.adultRegister, `${key} carries a bandless lesson above grade ${ADULT_REGISTER_CEILING}`).toBe(0);
      if (row.bandlessGrade !== undefined) {
        expect(row.bandlessGrade, `${key} median bandless grade`).toBeLessThanOrEqual(ADULT_REGISTER_CEILING);
      }
    }
  });

  it('measures the served text the way the reading-level ratchet does', () => {
    // Quoted spans are verbatim Scripture: not ours to simplify, and not
    // scored against the author. And no prose means no number, never a zero
    // that would read as a perfectly easy lesson.
    const quoted = { lesson: 'He said it. "Notwithstanding the everlasting consideration of righteousness."' };
    const plain = { lesson: 'He said it.' };
    expect(servedGrade(quoted)).toBe(servedGrade(plain));
    expect(servedGrade({ lesson: '' })).toBeNull();
    expect(servedGrade({})).toBeNull();
    expect(median([1, 9, 2])).toBe(2);
    expect(median([])).toBeNull();
  });

  it('gets no worse — a course that loses bands, or a new bare lesson, fails here', () => {
    const { worse } = ratchetCourseBands(scan, baseline);
    expect(worse, `course band coverage went backwards:\n${worse.join('\n')}`).toEqual([]);
  });

  it('NEW WORK MEETS THE FULL STANDARD AT ONCE: no course gains a lesson without all four bands (DR-0697)', () => {
    const findings = fourBandGapFindings(scan, FOUR_BAND_GAP_CEILING, baseline);
    expect(findings, `the four-band requirement binds new work:\n${findings.join('\n')}`).toEqual([]);
  });

  it('records no course the catalog no longer carries', () => {
    const { stale } = ratchetCourseBands(scan, baseline);
    expect(stale, `recorded courses that no longer exist: ${stale.join(', ')}`).toEqual([]);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('sees a course that adds a bare lesson', () => {
    const worseScan = { ...scan, courses: { ...scan.courses, ai: { lessons: 9, allFour: 0, adultOnly: 8 } } };
    expect(ratchetCourseBands(worseScan, baseline).worse.join(' ')).toMatch(/ai: 8 adult-only/);
  });

  it('sees a course that LOSES an authored band', () => {
    // The direction nobody watches: bands can be deleted as easily as added.
    // Claim one more four-band lesson for ai than the catalog carries: the
    // scan then reads as having LOST one, whatever ai carries today.
    const claimed = (scan.courses.ai ? scan.courses.ai.allFour : 0) + 1;
    const padded = { ...baseline, courses: { ...baseline.courses, ai: { ...(baseline.courses.ai || {}), lessons: 8, allFour: claimed, adultOnly: 8 - claimed } } };
    expect(ratchetCourseBands(scan, padded).worse.join(' ')).toMatch(/ai: \d+ four-band/);
  });

  it('sees a WHOLE NEW COURSE that arrives unrecorded', () => {
    // A new course with no baseline row would otherwise slip in carrying any
    // amount of debt at all, which is how 211 lessons got here unnoticed.
    const withNew = { ...scan, courses: { ...scan.courses, 'real-estate-principle': { lessons: 4, allFour: 0, adultOnly: 4 } } };
    expect(ratchetCourseBands(withNew, baseline).worse.join(' ')).toMatch(/real-estate-principle: not recorded/);
  });

  it('sees a bandless lesson that climbs above the adult-register ceiling', () => {
    // The register dimension moving the wrong way: same band count, harder text.
    const worseScan = { ...scan, courses: { ...scan.courses, ai: { ...scan.courses.ai, adultRegister: 1 } } };
    expect(ratchetCourseBands(worseScan, baseline).worse.join(' ')).toMatch(/ai: 1 bandless lessons above the adult-register ceiling/);
  });

  it('refuses a baseline row that carries no register number at all', () => {
    // An absent measurement is not a licence. A row written before this
    // measure existed is reported, the same way an unrecorded course is —
    // otherwise the gate would silently stop watching the dimension.
    const unmeasured = { ...baseline, courses: { ...baseline.courses, ai: { lessons: 8, allFour: 0, adultOnly: 8 } } };
    expect(ratchetCourseBands(scan, unmeasured).worse.join(' ')).toMatch(/ai: no adultRegister recorded/);
  });

  it('THE 2026-09-30 MISS: sees a two-band lesson added to an existing course, which the old ratchet passed', () => {
    // Teen + senior only: neither adult-only nor a lost four-band lesson, so
    // ratchetCourseBands sees nothing. The gap gate must.
    const row = scan.courses.banking;
    const grown = { ...scan, courses: { ...scan.courses, banking: { ...row, lessons: row.lessons + 1 } } };
    expect(ratchetCourseBands(grown, baseline).worse.filter((w) => w.startsWith('banking'))).toEqual([]);
    expect(fourBandGapFindings(grown).join(' ')).toMatch(/banking: .*a lesson was added below the standard/);
  });

  it('THE 2026-09-30 MISS: sees a whole new course built to two bands, and passes one built to four', () => {
    const twoBand = { ...scan, courses: { ...scan.courses, 'a-new-course': { lessons: 8, allFour: 0, adultOnly: 0, adultRegister: 0 } } };
    expect(fourBandGapFindings(twoBand).join(' ')).toMatch(/a-new-course: a new course must carry child, youth, teen and senior/);
    const fourBand = { ...scan, courses: { ...scan.courses, 'a-new-course': { lessons: 8, allFour: 8, adultOnly: 0, adultRegister: 0 } } };
    expect(fourBandGapFindings(fourBand)).toEqual([]);
  });

  it('a course that closed its gap in the baseline is held there without editing the frozen table', () => {
    // banking frozen at 8; once the baseline records it at 0, one two-band lesson fails.
    const closed = { ...baseline, courses: { ...baseline.courses, banking: { ...baseline.courses.banking, lessons: 8, allFour: 8 } } };
    const oneShort = { ...scan, courses: { ...scan.courses, banking: { ...scan.courses.banking, lessons: 9, allFour: 8 } } };
    expect(fourBandGapFindings(oneShort, FOUR_BAND_GAP_CEILING, closed).join(' ')).toMatch(/banking: 1 lessons without all four bands, ceiling 0/);
  });

  it('the ceilings are frozen by hand and never written by the baseline generator', () => {
    expect(Object.isFrozen(FOUR_BAND_GAP_CEILING)).toBe(true);
    expect(buildCourseBandBaseline.toString()).not.toMatch(/FOUR_BAND_GAP_CEILING/);
  });

  it('sees a recorded course that has vanished from the catalog', () => {
    const ghost = { ...baseline, courses: { ...baseline.courses, 'a-course-that-was-deleted': { lessons: 1, allFour: 0, adultOnly: 1 } } };
    expect(ratchetCourseBands(scan, ghost).stale).toContain('a-course-that-was-deleted');
  });
});
