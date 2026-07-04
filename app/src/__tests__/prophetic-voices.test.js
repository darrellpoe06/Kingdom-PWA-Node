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
  resolvePvCohort, pvSources,
} from '../lib/prophetic-voices.js';
import { defaultCourses } from '../lib/book-corpus.js';
import { resolveForAge } from '../lib/learn-framework.js';

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
