// @vitest-environment node
//
// prophetic-voices — the study catalog of the Body's own voices who named
// America's sins and the Church's account (Darrell 2026-07-04). Gates: every
// voice fully cited (DR-0076), the record is HELD not endorsed wholesale (the
// Test governs), honest uncertainty is labeled, and the study is registered.
import { describe, it, expect } from 'vitest';
import {
  PV_META, PV_MODULES, PV_SESSION_MINUTES,
  PV_CONFIRMED_COHORT, PV_PROPOSED_COHORT_START,
  buildPvSchedule, pvProgressSummary, exportPvCurriculumMarkdown,
  resolvePvCohort, pvSources, propheticVoicesToGameCards, PV_ROAD_STATIONS,
} from '../lib/prophetic-voices.js';
import { defaultCourses } from '../lib/book-corpus.js';
import { withStudyDeck } from '../lib/games/generations.js';
import { resolveForAge } from '../lib/learn-framework.js';

// Refs verified verbatim against the public-domain KJV during this session
// (DR-0076) — the game deck may only cite from this set.
const VERIFIED_REFS = new Set([
  'Psalm 43:3', 'Revelation 13:7', 'Revelation 13:14', 'Proverbs 22:22-23',
  'Genesis 16:13', 'Matthew 13:57', 'Luke 8:17', 'Hosea 4:6', 'Revelation 12:11',
  'Daniel 7:25', 'Mark 3:25', 'Acts 7:52',
]);

describe('shape', () => {
  it('seeds the preachers AND the scientists who weren’t heard, each fully formed', () => {
    const ids = PV_MODULES.map((m) => m.id);
    // preachers
    expect(ids).toContain('pv-price');
    expect(ids).toContain('pv-darby');
    // scientists/scholars who also weren't heard (Darrell 2026-07-04)
    expect(ids).toContain('pv-diop');
    expect(ids).toContain('pv-obenga');
    expect(ids).toContain('pv-williams');
    // the theft of Black inventions (Darrell 2026-07-04)
    expect(ids).toContain('pv-inventions');
    for (const m of PV_MODULES) {
      expect(m.title && m.bigIdea && m.anchor?.ref && m.anchor?.theme, m.id).toBeTruthy();
      expect(m.voice?.name, m.id).toBeTruthy();
      expect(m.lesson.length, m.id).toBeGreaterThan(200);
      for (const q of m.quiz.questions) {
        expect(q.options[q.answer], `${m.id} answer`).toBeTruthy();
        expect(q.explain, `${m.id} explain`).toBeTruthy();
      }
    }
  });
  it('renders child + senior through the shared framework', () => {
    for (const m of PV_MODULES) {
      expect(resolveForAge(m, 'child').text, `${m.id} child`).toBeTruthy();
      expect(resolveForAge(m, 'senior').text, `${m.id} senior`).toBeTruthy();
    }
  });
});

describe('citation integrity (DR-0076) + honest uncertainty', () => {
  it('every voice carries sources with a publisher, url, and as-of date', () => {
    const src = pvSources();
    expect(src.length).toBeGreaterThanOrEqual(3);
    for (const s of src) {
      expect(s.publisher, `${s.moduleId} publisher`).toBeTruthy();
      expect(s.url, `${s.moduleId} url`).toMatch(/^https?:\/\//);
      expect(s.asOf, `${s.moduleId} asOf`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('Darby carries an honest-uncertainty note labeling the unverified framing', () => {
    const darby = PV_MODULES.find((m) => m.id === 'pv-darby');
    expect(darby.honestNote).toBeTruthy();
    expect(darby.honestNote.toLowerCase()).toMatch(/not independently verified|darrell.s framing|not.*verified/);
    // and the study receives voices with discernment, not blanket acceptance
    expect(`${darby.bigIdea} ${darby.lesson} ${darby.inApp}`.toLowerCase()).toMatch(/discernment|the test|does not endorse|weigh/);
  });
  it('Price carries his sourced thesis (consent of the Church)', () => {
    const price = PV_MODULES.find((m) => m.id === 'pv-price');
    expect(`${price.bigIdea} ${price.lesson}`.toLowerCase()).toMatch(/consent of the church/);
    expect(pvSources().some((s) => s.moduleId === 'pv-price' && /Race, Religion|Price/i.test(`${s.title} ${s.publisher}`))).toBe(true);
  });
  it('the scientists carry honest-uncertainty notes on their contested specifics (DR-0076)', () => {
    for (const id of ['pv-diop', 'pv-obenga']) {
      const m = PV_MODULES.find((x) => x.id === id);
      expect(m.honestNote, `${id} honestNote`).toBeTruthy();
      expect(m.honestNote.toLowerCase()).toMatch(/debated|contested|not.*settled|not.*consensus/);
    }
  });
  it('the scientists are sourced and framed on the record-altered / Light-of-Truth theme', () => {
    for (const id of ['pv-diop', 'pv-obenga', 'pv-williams']) {
      const m = PV_MODULES.find((x) => x.id === id);
      expect(pvSources().some((s) => s.moduleId === id), `${id} sourced`).toBe(true);
      expect(m.voice.name).toMatch(/Diop|Obenga|Williams/);
    }
    const diop = PV_MODULES.find((m) => m.id === 'pv-diop');
    expect(diop.anchor.ref).toMatch(/Daniel 7:25/);   // the 4th beast that changes the record
    const williams = PV_MODULES.find((m) => m.id === 'pv-williams');
    expect(`${williams.lesson}`.toLowerCase()).toMatch(/unity is strength|division is vulnerability|house.*divided/);
  });
});

describe('the prophetic frame + registration', () => {
  it('is anchored on the prophet-rejected / names-the-nation’s-sin theme', () => {
    const refs = PV_MODULES.map((m) => m.anchor.ref).join(' ');
    expect(refs).toMatch(/Acts 7|Matthew 13:57|Acts 10:34/);
  });
  it('builds a schedule + markdown and resolves a cohort (ships proposed)', () => {
    expect(buildPvSchedule('2026-08-01').length).toBe(PV_MODULES.length);
    expect(pvProgressSummary({}).total).toBe(PV_MODULES.length);
    expect(exportPvCurriculumMarkdown('2026-08-01')).toContain(PV_META.title);
    expect(resolvePvCohort(null).confirmed).toBe(false);
    expect(PV_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(PV_PROPOSED_COHORT_START).toBeNull();
    expect(PV_SESSION_MINUTES).toBe(75);
  });
  it('is registered as a real corpus study', () => {
    expect(defaultCourses().map((c) => c.key)).toContain('prophetic-voices');
  });
});

describe('the inventions module + the game weave the whole road', () => {
  it('the inventions module is sourced and labels the contested cotton-gin "Sam" claim', () => {
    const inv = PV_MODULES.find((m) => m.id === 'pv-inventions');
    expect(inv).toBeTruthy();
    expect(pvSources().some((s) => s.moduleId === 'pv-inventions' && /patent/i.test(s.claim))).toBe(true);
    expect(inv.honestNote.toLowerCase()).toMatch(/contested|cotton gin|sam/);
    expect(`${inv.lesson} ${inv.levels.senior}`).toMatch(/1793|1836|1858|patent/);
  });
  it('"The Road of His Children" game weaves the study and builds a real Generations def', () => {
    const cards = propheticVoicesToGameCards();
    expect(cards.length).toBeGreaterThanOrEqual(8);
    // the road runs Source -> Beast -> Theft -> Covering -> Witnesses -> Exposure -> Recovery -> Kingdom
    expect(PV_ROAD_STATIONS).toEqual([
      'road-light', 'road-beast', 'road-theft', 'road-covering',
      'road-witnesses', 'road-exposure', 'road-recovery', 'road-kingdom',
    ]);
    const def = withStudyDeck(null, cards); // same wiring the study component uses
    expect(def).toBeTruthy();
    expect(def.decks?.study?.length).toBe(cards.length);
  });
  it('every game card cites a VERIFIED KJV ref and offers a redemptive choice (DR-0076)', () => {
    for (const c of propheticVoicesToGameCards()) {
      expect(c.scripture?.ref, `${c.id} ref`).toBeTruthy();
      expect(VERIFIED_REFS.has(c.scripture.ref), `${c.id} ref "${c.scripture.ref}" is verified`).toBe(true);
      expect(c.choices.some((ch) => ch.redemption), `${c.id} has a redemptive choice`).toBe(true);
    }
  });
  it('the beast station ties Daniel 7 to Revelation 13 (the 4th beast, both testaments)', () => {
    const beast = propheticVoicesToGameCards().find((c) => c.id === 'road-beast');
    expect(`${beast.lens} ${beast.body}`).toMatch(/Daniel 7/);
    expect(`${beast.lens} ${beast.body} ${beast.scripture.ref}`).toMatch(/Revelation 13/);
  });
});
