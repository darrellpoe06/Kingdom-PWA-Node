// @vitest-environment node
// =============================================================================
// Living Lessons — every age version is the FULL message. Measured, ratcheted.
// =============================================================================
// Darrell 2026-09-15: "I want all levels to be full now... why wait?!!!!!!"
// (and 2026-08-25: "full message, age-simple", "THE SHORT LESSON IS THE ONLY
// PROBLEM"). resolveForAge's comment claimed every age version was authored at
// FULL COVERAGE. Measured across 153 lessons on 2026-09-15: child median 16% of
// the adult words, teen 26%, senior 41%; youth has no level of its own at all.
// The claim was false by measurement (DR-0076 §4). This gate records the debt
// as SHRINK-ONLY and fails any NEW short band, so the corpus can only get
// fuller from here (DR-0418).
import { describe, it, expect } from 'vitest';
import {
  words, measureFullness, shortBands, scanFullness, ratchetFullness, buildFullLevelsBaseline,
  FULL_BANDS, FULL_FLOOR,
} from '../../../scripts/full-levels.mjs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/full-levels-baseline.json';

const w = (n, s = 'word') => Array.from({ length: n }, () => s).join(' ') + '.';
const lesson = (id, adult, levels) => ({ id, lesson: w(adult), levels });

describe('the measure', () => {
  it('counts words and shares against the adult lesson', () => {
    const m = measureFullness(lesson('x', 100, { child: w(50), youth: w(60), teen: w(60), senior: w(60) }));
    expect(m.adultWords).toBe(100);
    expect(m.bands.child.share).toBe(0.5);
    expect(m.bands.youth.present).toBe(true);
    expect(words('')).toBe(0);
  });

  it('the floors are stated values, a decision not a finding (DR-0418)', () => {
    expect(FULL_BANDS).toEqual(['child', 'youth', 'teen', 'senior']);
    expect(FULL_FLOOR).toEqual({ child: 0.5, youth: 0.6, teen: 0.6, senior: 0.6 });
  });

  it('PROVEN-TO-CATCH: a fragment band and a missing band are both named short', () => {
    const m = measureFullness(lesson('x', 1000, { child: w(160), teen: w(600), senior: w(900) }));
    expect(shortBands(m)).toEqual(['child', 'youth']);
  });

  it('a full lesson has no short band', () => {
    const m = measureFullness(lesson('x', 1000, { child: w(500), youth: w(600), teen: w(600), senior: w(600) }));
    expect(shortBands(m)).toEqual([]);
  });
});

describe('the ratchet — a NEW short band fails, the debt may only shrink', () => {
  it('PROVEN-TO-CATCH: a short band not in the baseline is fresh', () => {
    const scan = scanFullness([lesson('llNEW', 1000, { child: w(100), youth: w(600), teen: w(600), senior: w(600) })]);
    const r = ratchetFullness(scan, { short: {} });
    expect(r.fresh).toEqual(['llNEW :: child']);
  });
  it('a recorded short band is known debt, not a regression', () => {
    const scan = scanFullness([lesson('llOLD', 1000, { child: w(100), youth: w(600), teen: w(600), senior: w(600) })]);
    const r = ratchetFullness(scan, { short: { llOLD: ['child'] } });
    expect(r.fresh).toEqual([]);
  });
  it('a full band may not be shortened again — even on a lesson with other debt', () => {
    const scan = scanFullness([lesson('llOLD', 1000, { child: w(100), youth: w(100), teen: w(600), senior: w(600) })]);
    const r = ratchetFullness(scan, { short: { llOLD: ['child'] } });
    expect(r.fresh).toEqual(['llOLD :: youth']);
  });
  it('reports healing so the baseline can be shrunk deliberately', () => {
    const scan = scanFullness([lesson('llOLD', 1000, { child: w(500), youth: w(600), teen: w(600), senior: w(600) })]);
    const r = ratchetFullness(scan, { short: { llOLD: ['child', 'youth'] } });
    expect(r.healed).toEqual(['llOLD :: child', 'llOLD :: youth']);
  });
});

describe('THE LIVE SERIES — measured, not asserted', () => {
  const scan = scanFullness(LIVING_LESSONS_MODULES);

  it('the scan reads the REAL modules (non-vacuous)', () => {
    expect(scan.total).toBe(LIVING_LESSONS_MODULES.length);
    expect(scan.total).toBeGreaterThan(100);
  });

  it('NO NEW short band — a lesson ships full, and a full band stays full', () => {
    const r = ratchetFullness(scan, baseline);
    expect(r.fresh, `these bands are short and not in the recorded debt:\n${r.fresh.join('\n')}`).toEqual([]);
  });

  it('the committed baseline is the REAL debt, not a painted number', () => {
    const fresh = buildFullLevelsBaseline(scan);
    expect(fresh.short).toEqual(baseline.short);
    expect(fresh.lessonsShort).toBe(baseline.lessonsShort);
    expect(fresh.measuredLessons).toBe(baseline.measuredLessons);
  });

  it('the debt is real — this gate is not decoration (it flips to zero when the last level is full)', () => {
    expect(baseline.lessonsShort).toBeGreaterThan(0);
  });
});
