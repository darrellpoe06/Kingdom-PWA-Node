// @vitest-environment node
// =============================================================================
// Healthy Living — the 3rd-Dimension Witness carried into Learn, DATA-DRIVEN
// =============================================================================
// Darrell 2026-08-10, holding the witness room on his phone: "is this inside
// the Learn space too? if not make these lessons from our data or a series for
// Healthy Living... data driven course/s."
//
// It was not. Twelve cited works — fasting, sleep, learning, the setback loop,
// the women's-physiology counter-witness — each already bound to the Scripture
// that said it first, and Learn carried none of it. These pins hold the series
// to the witness room's own rules rather than to a reviewer's memory:
//   • DERIVED, never re-typed — a source added to the room joins the series;
//   • WORD FIRST — the Scripture opens every lesson and the course declares
//     its own lead (DR-0127 / DR-0282);
//   • EVERY EXPERT CITED — no anonymous "studies show" (Romans 13:7);
//   • EVERY VERSE VERBATIM from the verified corpus (DR-0076);
//   • PASTORAL, NOT CLINICAL — the care note on every lesson at every level,
//     and the counter-witness never dropped.
import { describe, it, expect } from 'vitest';
import { WITNESS_SOURCES, witnessVerse } from '../lib/third-witness.js';
import {
  HEALTHY_LIVING_META, HEALTHY_LIVING_CARE_NOTE, HEALTHY_LIVING_SESSION_FLOW,
  buildHealthyLivingSchedule, moduleFromWitness, healthyLivingProgressSummary,
  exportHealthyLivingCurriculumMarkdown, healthyLivingRefs, unresolvedHealthyLivingRefs,
  citeOf, refsOf,
} from '../lib/healthy-living-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import verses from '../lib/godhead-study-verses.json';

const schedule = buildHealthyLivingSchedule();

describe('the series IS the witness room — derived, not re-typed', () => {
  it('one lesson per cited source, in the room’s own order', () => {
    expect(schedule.length).toBe(WITNESS_SOURCES.length);
    expect(schedule.length).toBeGreaterThanOrEqual(10);
    expect(schedule.map((m) => m.title)).toEqual(WITNESS_SOURCES.map((s) => s.topic));
    expect(schedule.map((m) => m.week)).toEqual(WITNESS_SOURCES.map((_, i) => i + 1));
  });

  it('a source ADDED to the witness room joins the series with no edit here', () => {
    const extra = {
      id: 'w3-new-thing', topic: 'A newly cited work',
      source: { expert: 'Dr. Someone', credential: 'Physician', work: 'A Cited Work' },
      summary: 'What the work found.',
      pairs: [{ id: 'p1', claim: 'The claim as cited.', cite: '1:00', refs: ['Proverbs 13:12'], bridge: 'How the Word said it first.' }],
    };
    const grown = buildHealthyLivingSchedule([...WITNESS_SOURCES, extra]);
    expect(grown.length).toBe(schedule.length + 1);
    expect(grown[grown.length - 1].title).toBe('A newly cited work');
  });

  it('no lesson invents content — every claim and bridge comes from the data', () => {
    for (const s of WITNESS_SOURCES) {
      const m = moduleFromWitness(s);
      for (const p of s.pairs) {
        expect(m.lesson).toContain(p.claim);
        expect(m.lesson).toContain(p.bridge);
      }
    }
  });

  it('the declared length is derived from the room, not typed', () => {
    expect(HEALTHY_LIVING_META.weeks).toBe(WITNESS_SOURCES.length);
  });
});

describe('the Word opens every lesson (DR-0127)', () => {
  it('every lesson’s big idea BEGINS with its Scripture references', () => {
    for (const s of WITNESS_SOURCES) {
      const m = moduleFromWitness(s);
      const refs = refsOf(s);
      expect(refs.length).toBeGreaterThan(0);
      expect(m.bigIdea.startsWith(refs.join(' · '))).toBe(true);
    }
  });

  it('inside each lesson the Word leads and the science follows, block by block', () => {
    for (const m of schedule) {
      const firstWord = m.lesson.indexOf('The Word —');
      const firstWitness = m.lesson.indexOf('The 3rd-dimension witness');
      expect(firstWord).toBe(0);
      expect(firstWitness).toBeGreaterThan(firstWord);
    }
  });

  it('every lesson carries a real Scripture anchor', () => {
    for (const m of schedule) {
      expect(String(m.anchor && m.anchor.ref || '').trim().length).toBeGreaterThan(0);
    }
  });

  it('the course DECLARES its own lead rather than borrowing the first lesson’s anchor', () => {
    expect(HEALTHY_LIVING_META.wordFirst.ref).toBe('3 John 1:2; 1 Corinthians 6:19-20');
    expect(HEALTHY_LIVING_META.wordFirst.frame.trim().length).toBeGreaterThan(80);
  });
});

describe('every verse verbatim, every expert cited (DR-0076, Romans 13:7)', () => {
  it('every reference the series shows resolves in the verified corpus', () => {
    expect(healthyLivingRefs().length).toBeGreaterThan(10);
    expect(unresolvedHealthyLivingRefs()).toEqual([]);
  });

  it('the declared lead quotes BOTH verses verbatim from the corpus', () => {
    const frame = HEALTHY_LIVING_META.wordFirst.frame;
    expect(frame).toContain(verses['3 John 1:2']);
    expect(frame).toContain(verses['1 Corinthians 6:19-20']);
  });

  it('PROVEN-TO-CATCH: a single altered word in a quoted verse fails the check', () => {
    const tampered = HEALTHY_LIVING_META.wordFirst.frame.replace('prosper and be in health', 'prosper and be healthy');
    expect(tampered).not.toContain(verses['3 John 1:2']);
  });

  it('every lesson names the expert, the credential and the work — no anonymous science', () => {
    for (const s of WITNESS_SOURCES) {
      const m = moduleFromWitness(s);
      const cite = citeOf(s);
      expect(cite).toContain(s.source.expert);
      expect(cite).toContain(s.source.work);
      expect(m.bigIdea).toContain(cite);
      expect(m.lesson).toContain(cite);
      expect(m.levels.teen).toContain(cite);
    }
  });

  it('where the work says WHERE the claim sits, the lesson carries that too', () => {
    const withCites = WITNESS_SOURCES.filter((s) => s.pairs.some((p) => p.cite));
    expect(withCites.length).toBeGreaterThan(0);
    for (const s of withCites) {
      const m = moduleFromWitness(s);
      for (const p of s.pairs.filter((x) => x.cite)) expect(m.lesson).toContain(p.cite);
    }
  });

  it('the verified reader resolves a known reference to real verse text', () => {
    expect(String(witnessVerse('Proverbs 13:12') || '')).toContain('Hope deferred');
  });
});

describe('pastoral, not clinical — the bright line rides every lesson', () => {
  it('the care note is on every lesson at EVERY level', () => {
    for (const m of schedule) {
      expect(m.care).toBe(HEALTHY_LIVING_CARE_NOTE);
      expect(m.lesson).toContain(HEALTHY_LIVING_CARE_NOTE);
      for (const level of ['standard', 'teen', 'senior']) {
        expect(m.levels[level]).toContain(HEALTHY_LIVING_CARE_NOTE);
      }
    }
  });

  it('the care note says the three things it must say', () => {
    expect(HEALTHY_LIVING_CARE_NOTE).toMatch(/does not diagnose or treat/i);
    expect(HEALTHY_LIVING_CARE_NOTE).toMatch(/physician/i);
    expect(HEALTHY_LIVING_CARE_NOTE).toMatch(/never one-size/i);
  });

  it('the counter-witness is carried, never dropped', () => {
    const titles = schedule.map((m) => m.title.toLowerCase());
    expect(titles.some((t) => t.includes('counter-witness'))).toBe(true);
  });

  it('no lesson issues a medical directive in the course’s own voice', () => {
    for (const m of schedule) {
      expect(m.inApp).not.toMatch(/\byou (must|should) (fast|stop eating)\b/i);
      expect(m.inApp).toMatch(/physician/i);
    }
  });
});

describe('it rides the shared Learn engine like every other course', () => {
  it('is registered in the catalog as a self-paced series', () => {
    const entry = LEARN_CATALOG.find((e) => e.key === 'healthy-living');
    expect(entry).toBeTruthy();
    expect(entry.wiring).toBe('self-paced');
    expect(entry.meta.category).toBe('The Word & The Way');
    expect(entry.buildScheduleRows().length).toBe(WITNESS_SOURCES.length);
  });

  it('progress and export work off the same derived rows', () => {
    const done = { [schedule[0].id]: true };
    const sum = healthyLivingProgressSummary(done);
    expect(sum).toMatchObject({ done: 1, total: schedule.length });
    const md = exportHealthyLivingCurriculumMarkdown();
    expect(md).toContain(HEALTHY_LIVING_META.title);
    expect(md).toContain(schedule[0].title);
  });

  it('every lesson opens the witness room it came from', () => {
    for (const m of schedule) {
      expect(m.launch).toEqual({ view: 'church', churchView: 'eternal-algorithms' });
    }
  });

  it('the session flow is a real, timed shape', () => {
    expect(HEALTHY_LIVING_SESSION_FLOW.length).toBeGreaterThan(3);
    expect(HEALTHY_LIVING_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBeGreaterThan(20);
  });
});
