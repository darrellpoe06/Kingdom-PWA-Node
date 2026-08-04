// @vitest-environment node
// =============================================================================
// seeing-study gates — the two DR-0076 machine checks this study ships with:
//   1. VERSE-VERBATIM (DR-0270 class): every quoted fragment in the study is
//      an exact substring of the cited verse in the repo's own KJV.
//   2. MEASURE-DON'T-CLAIM (P15/DR-0076): the pinned corpus measurements are
//      RECOMPUTED from the real KJV files and must match exactly — a painted
//      or drifted number goes red.
// Proven-to-catch: mutate any fragment, ref, or pinned count and the suite
// fails naming it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  SEEING_STUDY_META, WAYS_OF_SEEING, QUALITATIVE_METHODS,
  measureBibleCorpus, PINNED_TERM_PATTERNS, PINNED_CORPUS_MEASUREMENTS,
  QUANTITATIVE_READINGS, SEEING_ANALYSIS, DAILY_SEEING_PRACTICE,
  MUDDIED_TO_CLEAR, ENDURING_AND_ABIDING, USING_HIS_WAYS, HOW_WE_KNOW,
  RELATIONSHIP_CIRCUIT, SWORD_AND_COUNSEL, COMPETENCE_AIM,
  WALKING_IN_DISAGREEMENT, IRON_ON_IRON_DAILY, DOOR_THE_KING_KNOCKS_ON,
  LONGSUFFERING_WITH_JOYFULNESS, FAMILY_TREASURY, STEWARDSHIP_ACCOUNTABILITY,
  GUARDING_THE_HOUSE, PLATFORM_BUILDOUT, FINANCIAL_HEALING_PROTOCOL,
  GENEROSITY_IN_THE_HOUSE, WHOLE_PERSON_WHOLE_HOUSE, buildSeeingStudy,
} from '../lib/seeing-study.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');

// "1 Corinthians 15:55" / "Psalm 127:1" / "Deuteronomy 17:18-19" -> file + ch + verse
function resolveRef(ref) {
  const m = String(ref).match(/^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  let book = m[1].trim().replace(/\s+/g, '');
  if (book === 'Psalm') book = 'Psalms';
  return { book, ch: Number(m[2]), v: Number(m[3]) };
}

function kjvVerse(book, ch, v) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  return data.chapters[ch - 1][v - 1];
}

const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

// Collect every (ref, fragment) pair the study carries.
function allQuotedPairs() {
  const pairs = [];
  pairs.push({ ref: SEEING_STUDY_META.anchor.ref, fragment: SEEING_STUDY_META.anchor.text });
  for (const w of WAYS_OF_SEEING) pairs.push({ ref: w.quote.ref, fragment: w.quote.fragment });
  for (const e of SEEING_ANALYSIS.likeTheirKing) pairs.push({ ref: e.ref, fragment: e.fragment });
  const d = DAILY_SEEING_PRACTICE;
  // The regimen spans a range: fragment is from v18, fragment2 from v19.
  pairs.push({ ref: 'Deuteronomy 17:18', fragment: d.kingsRegimen.fragment });
  pairs.push({ ref: 'Deuteronomy 17:19', fragment: d.kingsRegimen.fragment2 });
  for (const p of d.dailyPractices) pairs.push({ ref: p.ref, fragment: p.fragment });
  for (const s of d.scalingInHisWays) pairs.push({ ref: s.ref, fragment: s.fragment });
  for (const c of MUDDIED_TO_CLEAR.confession) pairs.push({ ref: c.ref, fragment: c.fragment });
  for (const c of MUDDIED_TO_CLEAR.theMuddying) pairs.push({ ref: c.ref, fragment: c.fragment });
  for (const c of MUDDIED_TO_CLEAR.theClearing) pairs.push({ ref: c.ref, fragment: c.fragment });
  const e = ENDURING_AND_ABIDING;
  for (const v of e.howTheGodheadSeesTheEndurer.verses) pairs.push({ ref: v.ref, fragment: v.fragment });
  for (const v of e.abidingPhysiology.wordClaims) pairs.push({ ref: v.ref, fragment: v.fragment });
  for (const v of e.notCondemnedButSaved.verses) pairs.push({ ref: v.ref, fragment: v.fragment });
  const u = USING_HIS_WAYS;
  for (const list of [u.theRansomIsNeverOurs, u.yetTheWordSaysIt, u.whatWeAreDoing, u.whatWeAreNotDoing]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const k = HOW_WE_KNOW;
  for (const list of [k.theBoundary, k.theKnowableAssurance, k.theAnchor]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const rc = RELATIONSHIP_CIRCUIT;
  for (const list of [rc.theWiring, rc.theVerification, rc.theRouting]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const sc = SWORD_AND_COUNSEL;
  for (const list of [sc.theSwordInTheFamily, sc.theLeashedDevices, sc.theEternalNow]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  // The quantumNote's inline quotes (partial physics; faith as instrument).
  pairs.push({ ref: 'Colossians 1:16', fragment: 'visible and invisible' });
  pairs.push({ ref: '2 Corinthians 4:18', fragment: 'the things which are seen are temporal; but the things which are not seen are eternal' });
  pairs.push({ ref: 'Hebrews 11:1', fragment: 'the substance of things hoped for, the evidence of things not seen' });
  const ca = COMPETENCE_AIM;
  for (const list of [ca.theModelMen, ca.theCommandedCompetence, ca.theStudiedAnswer]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const wd = WALKING_IN_DISAGREEMENT;
  for (const list of [wd.whatAgreementMeans, wd.communicationFramework, wd.comprehensionFramework]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const ii = IRON_ON_IRON_DAILY;
  for (const list of [ii.theMechanism, ii.theDailySchedule, ii.theAngle, ii.theForge]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const dk = DOOR_THE_KING_KNOCKS_ON;
  for (const list of [dk.theConstraints, dk.theOpportunities, dk.whenAgreementIsWords]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const lj = LONGSUFFERING_WITH_JOYFULNESS;
  for (const list of [lj.theConstraints, lj.theOpportunities]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const ft = FAMILY_TREASURY;
  for (const list of [ft.theDiagnosis, ft.theDesign]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const sa = STEWARDSHIP_ACCOUNTABILITY;
  for (const list of [sa.thePatternsNamed, sa.fromAccusationToInstrumentation, sa.abundanceAndTheScarcityClaim, sa.theOldWineskinDecades]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const gh = GUARDING_THE_HOUSE;
  for (const list of [gh.theTrajectoryNamed, gh.theAbigailDoctrine, gh.whatTheSpouseDoes, gh.whatTheSpouseSays, gh.theHonestLimits, gh.theTimelines, gh.thenWhat]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  for (const v of FINANCIAL_HEALING_PROTOCOL.steps) pairs.push({ ref: v.ref, fragment: v.fragment });
  const gen = GENEROSITY_IN_THE_HOUSE;
  for (const list of [gen.theKeystone, gen.theParadoxicalLaw, gen.theAppetiteCure, gen.scaledHonestly, gen.theChildrensCurriculum, gen.generousButUngoverned]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  const wp = WHOLE_PERSON_WHOLE_HOUSE;
  for (const list of [wp.theDesign, wp.theScienceCompetency, wp.theFamilyCascade]) {
    for (const v of list) pairs.push({ ref: v.ref, fragment: v.fragment });
  }
  return pairs;
}

describe('seeing-study quotes the KJV verbatim (DR-0076 / DR-0270 class)', () => {
  it('every quoted fragment is an exact substring of its cited verse', () => {
    const failures = [];
    for (const { ref, fragment } of allQuotedPairs()) {
      const loc = resolveRef(ref);
      if (!loc) { failures.push(`${ref}: unresolvable reference`); continue; }
      let text;
      try {
        text = kjvVerse(loc.book, loc.ch, loc.v);
      } catch {
        failures.push(`${ref}: no such book/chapter/verse in local KJV (${loc.book} ${loc.ch}:${loc.v})`);
        continue;
      }
      if (typeof text !== 'string') { failures.push(`${ref}: verse missing in local KJV`); continue; }
      if (!norm(text).includes(norm(fragment))) {
        failures.push(`${ref}: fragment not verbatim — "${fragment}" (verse reads: "${text}")`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('the study carries a substantial quoted spine (not a stub)', () => {
    expect(allQuotedPairs().length).toBeGreaterThanOrEqual(30);
    expect(WAYS_OF_SEEING.length).toBeGreaterThanOrEqual(9);
    expect(QUALITATIVE_METHODS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('the pinned corpus measurements are REAL (measure-don\'t-claim, machine-checked)', () => {
  it('recomputing from the actual KJV files matches the pinned numbers exactly', () => {
    const files = readdirSync(KJV_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');
    const books = files.map((f) => JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')));
    const measured = measureBibleCorpus(books, PINNED_TERM_PATTERNS);
    expect(measured.books).toBe(PINNED_CORPUS_MEASUREMENTS.books);
    expect(measured.chapters).toBe(PINNED_CORPUS_MEASUREMENTS.chapters);
    expect(measured.verses).toBe(PINNED_CORPUS_MEASUREMENTS.verses);
    expect(measured.terms).toEqual(PINNED_CORPUS_MEASUREMENTS.terms);
  });

  it('the quantitative readings cite only numbers the pinned measurement carries', () => {
    // The load-bearing figures quoted in prose must be the measured ones.
    const blob = QUANTITATIVE_READINGS.join(' ');
    expect(blob).toContain('66');
    expect(blob).toContain('1,189');
    expect(blob).toContain('31,102');
    expect(blob).toContain('469');
    expect(blob).toContain('162');
    expect(blob).toContain('1,699');
    expect(blob).toContain('229');
    expect(blob).toContain('27');
  });
});

describe('the study assembles for a surface', () => {
  it('buildSeeingStudy returns every section', () => {
    const s = buildSeeingStudy();
    expect(s.meta.title).toContain('Seeing Like Their King');
    expect(s.ways.length).toBe(WAYS_OF_SEEING.length);
    expect(s.qualitative.length).toBe(QUALITATIVE_METHODS.length);
    expect(s.quantitative.pinned.measuredOn).toBe('2026-08-04');
    expect(s.analysis.goal).toBeTruthy();
    expect(s.daily.kingsRegimen.ref).toBe('Deuteronomy 17:18-19');
    expect(s.muddiedToClear.perspectiveProcessing).toBeTruthy();
  });

  it('the platform buildout is a dated work queue, not a wish list (DR-0236/DR-0075)', () => {
    expect(PLATFORM_BUILDOUT.length).toBeGreaterThanOrEqual(6);
    for (const item of PLATFORM_BUILDOUT) {
      expect(item.doctrine, `${item.id} names its doctrine`).toBeTruthy();
      expect(item.startingPoint, `${item.id} names its existing starting point`).toBeTruthy();
      expect(item.reReview, `${item.id} carries a re-review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every qualitative method serves at least one declared Way', () => {
    const wayIds = new Set(WAYS_OF_SEEING.map((w) => w.id));
    for (const m of QUALITATIVE_METHODS) {
      expect(m.serves.length).toBeGreaterThan(0);
      m.serves.forEach((id) => expect(wayIds.has(id), `${m.id} serves unknown way ${id}`).toBe(true));
    }
  });
});
