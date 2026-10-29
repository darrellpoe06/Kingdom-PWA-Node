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
    expect(baseline.allFour).toBe(269); // 269 on 2026-10-29: mgmt9 (nobody is coming to define your work,
    // DR-1281), the NINTH lesson of Management Is Stewardship, built from the SmartBrief for the Higher Ed
    // Leader edition Darrell forwarded to himself on 2026-10-06 with one word above the body. It is the
    // FIFTH lesson in a queue of five across 2026-10-28/29 that each raise this figure, and it measured
    // 266 -> 267 on the base it was built on (main at 0be3abf58). On the MERGED tree, which also carries
    // sov56 and bank9, the answer is 269. READ from a fresh scripts/course-band-baseline-write.mjs run
    // AFTER the merge, never computed: 267 was true of this branch's own tree and would have shipped a
    // wrong number here, which is the failure that script's own header warns about.
    // The whole course already carried four bands, so the management-stewardship row moves
    // {lessons: 8, allFour: 8} -> {lessons: 9, allFour: 9} and the lesson could not have shipped short.
    // mgmt9's own measurement, kept as this build recorded it: adult prose 1,247 words; shares child 0.59
    // / youth 0.65 / teen 0.72 / senior 0.65 against floors 0.50 / 0.60 / 0.60 / 0.60; ladder 1.4 / 2.5 /
    // 4.3 / 6.1, strictly ascending, child under the 5.0 new-lesson ceiling and teen under this course's
    // own 6.0; worst band-pair overlap 0.09.
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
