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
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEARN_CATALOG, learnCatalogSummary } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  BANDS, bandsPresent, lessonsOfCourse, scanCourseBands, ratchetCourseBands,
  servedGrade, median, ADULT_REGISTER_CEILING,
  ratchetFourBands, shrinkFourBandAllowlist, serializeFourBandAllowlist, fourBandGateFaults as bandGateFaults,
} from '../../../scripts/course-band-coverage.mjs';
import baseline from '../lib/course-band-coverage-baseline.json';
import allowlist from '../lib/course-band-four-allowlist.json';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');
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
    // FLOORS, not exact pins (DR-0692): five sessions raise allFour and lower
    // adultOnly at once, and the exact numbers live in the regenerated baseline,
    // which 'matches the live catalog exactly' below holds to the truth. These
    // two lines hold the direction: allFour may only rise, adultOnly only fall.
    expect(baseline.allFour).toBeGreaterThanOrEqual(54); // 54 on 2026-09-30: leasing-tenants and maintenance-trades join (DR-0696); 38 on 2026-09-30: property-principle and management-stewardship carry all four on all 16 lessons (DR-0696); 22 on 2026-09-29: Who He Is (DR-0675) carries all four bands on all 14 lessons; 8 on 2026-09-24: the rebuilt historical-research-1619 (DR-0597) carries child, youth, teen and senior on every lesson — the first catalog course with all four bands; a course may only add to this number
    expect(baseline.adultOnly).toBeLessThanOrEqual(37);
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
    expect(baseline.courses['little-learners'].bandlessGrade).toBeLessThan(3);
    expect(baseline.courses['little-learners'].adultRegister).toBe(0);
    expect(baseline.courses.mathematics.bandlessGrade).toBeLessThan(3);
    expect(baseline.courses.mathematics.adultRegister).toBe(0);
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

  it('records no course the catalog no longer carries', () => {
    const { stale } = ratchetCourseBands(scan, baseline);
    expect(stale, `recorded courses that no longer exist: ${stale.join(', ')}`).toEqual([]);
  });
});

// =============================================================================
// ALL FOUR BANDS, ON EVERY LESSON FROM HERE ON (DR-0692)
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// The honest answer was no: 22 of 398 catalog lessons carried all four bands.
// The ratchet above only said "no worse", so a new course could land with two
// bands and pass, and the gap never closed. From this commit the rule is per
// LESSON: the 378 lessons missing a band on 2026-09-30 are pinned by id in
// course-band-four-allowlist.json, that list may only shrink, and any other
// lesson missing child, youth, teen or senior fails here by name.
const catalogLessons = {};
for (const c of LEARN_CATALOG) for (const m of lessonsOfCourse(c)) if (c && c.key) catalogLessons[`${c.key}/${m.id}`] = m;
const PINNED_2026_09_30 = 378;
const pinnedCount = (a) => Object.values(a.courses).reduce((t, l) => t + l.length, 0);

describe('every lesson carries child, youth, teen and senior (DR-0692)', () => {
  it('no lesson outside the pinned list is missing a band', () => {
    const { fresh } = ratchetFourBands(scan, allowlist, catalogLessons);
    expect(fresh, `lessons missing an age band:\n${fresh.join('\n')}`).toEqual([]);
  });

  it('the pinned list drops every lesson that now carries all four', () => {
    // An excuse that outlives its debt is a licence: the next edit could strip
    // that lesson's bands again and still pass. So a healed lesson must leave.
    const { healed } = ratchetFourBands(scan, allowlist, catalogLessons);
    expect(healed, `now carry all four — remove from course-band-four-allowlist.json (run scripts/course-band-baseline-write.mjs):\n${healed.join('\n')}`).toEqual([]);
  });

  it('the pinned list only shrinks, and names no course that did not exist on 2026-09-30', () => {
    expect(pinnedCount(allowlist)).toBeLessThanOrEqual(PINNED_2026_09_30);
    for (const key of Object.keys(allowlist.courses)) expect(baseline.courses[key], `${key} is not a catalog course`).toBeDefined();
  });

  it('is written the one way the regenerator writes it, so parallel shrinks merge cleanly', () => {
    const text = readFileSync(join(LIB, 'course-band-four-allowlist.json'), 'utf8');
    expect(text).toBe(serializeFourBandAllowlist(shrinkFourBandAllowlist(scan, allowlist), allowlist.note));
  });
});

// A band is only a band if it passes the house's band gates — the same ones
// Who He Is is held to (share of the adult lesson, a rising reading ladder
// with the child band held to the age, four genuinely different texts, each
// naming its lesson). Four empty-ish labels would satisfy a count, so every
// four-band catalog lesson is judged. The eight historical-research-1619
// lessons were banded before this rule and measure with an inverted ladder
// (teen easier than youth) and bands that do not name their lesson; they are
// recorded here, shrink-only, for their own course's pass. re-review: 2026-10-14.
const BAND_GATE_EXEMPT = new Set([
  'historical-research-1619/hr1-the-standard-before-the-claim',
  'historical-research-1619/hr1-go-to-the-record',
  'historical-research-1619/hr1-the-witnesses',
  'historical-research-1619/hr1-two-or-three-witnesses-the-process',
  'historical-research-1619/hr1-fact-and-interpretation',
  'historical-research-1619/hr1-the-correction-and-the-quiet-edit',
  'historical-research-1619/hr1-the-city-they-built',
  'historical-research-1619/hr1-write-it-in-order-for-our-children',
]);

describe('every four-band lesson passes the house band gates (DR-0692)', () => {
  it('share, ladder, child ceiling, differentiation and naming, on every lesson', () => {
    const faults = [];
    for (const [key, m] of Object.entries(catalogLessons)) {
      if (OWNED.has(m.id) || BAND_GATE_EXEMPT.has(key) || bandsPresent(m).length !== 4) continue;
      for (const x of bandGateFaults(m)) faults.push(`${key}: ${x}`);
    }
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('the exemption only shrinks, and each exempt lesson still fails (or it must leave)', () => {
    expect(BAND_GATE_EXEMPT.size).toBeLessThanOrEqual(8);
    for (const key of BAND_GATE_EXEMPT) {
      expect(catalogLessons[key], `${key} is gone`).toBeDefined();
      expect(bandGateFaults(catalogLessons[key]).length, `${key} now passes — remove it from BAND_GATE_EXEMPT`).toBeGreaterThan(0);
    }
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('a four-band lesson whose youth band is a two-line summary fails the band gates', () => {
    const base = catalogLessons['who-he-is/whohe4-the-kings-and-the-psalms'];
    expect(bandGateFaults(base)).toEqual([]);
    const thin = { ...base, levels: { ...base.levels, youth: 'The Kings and the Psalms. It is short.' } };
    expect(bandGateFaults(thin).join(' ')).toMatch(/youth share/);
  });

  it('a youth band that reads harder than the teen band fails the ladder', () => {
    const base = catalogLessons['who-he-is/whohe4-the-kings-and-the-psalms'];
    const inverted = { ...base, levels: { ...base.levels, youth: base.levels.senior, senior: base.levels.youth } };
    expect(bandGateFaults(inverted).join(' ')).toMatch(/ladder/);
  });

  it('fails a NEW lesson that arrives without a youth band, and names it', () => {
    const base = catalogLessons['who-he-is/whohe1-all-of-them-the-rule-the-line-and-the-edge'];
    const noYouth = { ...base, id: 'whohe99-a-new-lesson', levels: { ...base.levels, youth: '' } };
    const course = { key: 'who-he-is', buildScheduleRows: () => [...lessonsOfCourse(LEARN_CATALOG.find((c) => c.key === 'who-he-is')), noYouth] };
    const withNew = scanCourseBands([course], OWNED);
    const { fresh } = ratchetFourBands(withNew, allowlist, { 'who-he-is/whohe99-a-new-lesson': noYouth });
    expect(fresh.join(' ')).toMatch(/who-he-is\/whohe99-a-new-lesson: missing youth/);
  });

  it('fails a four-band lesson that LOSES a band, because it is not on the pinned list', () => {
    const base = catalogLessons['who-he-is/whohe2-before-time-and-the-beginning'];
    const stripped = { ...base, levels: { ...base.levels, child: '' } };
    const course = { key: 'who-he-is', buildScheduleRows: () => lessonsOfCourse(LEARN_CATALOG.find((c) => c.key === 'who-he-is')).map((m) => (m.id === base.id ? stripped : m)) };
    const { fresh } = ratchetFourBands(scanCourseBands([course], OWNED), allowlist, { [`who-he-is/${base.id}`]: stripped });
    expect(fresh.join(' ')).toMatch(/whohe2-before-time-and-the-beginning: missing child/);
  });

  it('reports a pinned lesson that has healed, so its excuse cannot outlive it', () => {
    const padded = { courses: { ...allowlist.courses, 'who-he-is': ['whohe3-the-fathers-and-moses'] } };
    expect(ratchetFourBands(scan, padded).healed).toContain('who-he-is/whohe3-the-fathers-and-moses');
  });

  it('the regenerator never adds: a fresh gap is not shrunk INTO the list', () => {
    const fakeScan = { ...scan, missing: { ...scan.missing, 'who-he-is': ['whohe99-a-new-lesson'] } };
    expect(shrinkFourBandAllowlist(fakeScan, allowlist)['who-he-is']).toEqual([]);
  });

  it('sees a course that adds a bare lesson', () => {
    const worseScan = { ...scan, courses: { ...scan.courses, ai: { lessons: 9, allFour: 0, adultOnly: 8 } } };
    expect(ratchetCourseBands(worseScan, baseline).worse.join(' ')).toMatch(/ai: 8 adult-only/);
  });

  it('sees a course that LOSES an authored band', () => {
    // The direction nobody watches: bands can be deleted as easily as added.
    const padded = { ...baseline, courses: { ...baseline.courses, ai: { lessons: 8, allFour: 3, adultOnly: 7 } } };
    expect(ratchetCourseBands(scan, padded).worse.join(' ')).toMatch(/ai: 0 four-band/);
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

  it('sees a recorded course that has vanished from the catalog', () => {
    const ghost = { ...baseline, courses: { ...baseline.courses, 'a-course-that-was-deleted': { lessons: 1, allFour: 0, adultOnly: 1 } } };
    expect(ratchetCourseBands(scan, ghost).stale).toContain('a-course-that-was-deleted');
  });
});
