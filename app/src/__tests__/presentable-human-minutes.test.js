// @vitest-environment node
// =============================================================================
// A runtime is said in the unit a person plans in (not 5034 minutes)
// =============================================================================
// Darrell 2026-08-31, reading the presenter's fit line on the live app: "the
// total time needs to be in the highest level like hours or minutes etc... not
// 5034 minutes."
//
// One lesson is minutes and stays minutes. The whole 111-lesson series is 5034
// of them — a number the reader has to do arithmetic on before it means
// anything. This pins the roll-up, and pins that small values are untouched so
// every per-section time still reads exactly as it always did.
import { describe, it, expect } from 'vitest';
import { humanMinutes, fitToBudget } from '../lib/presentable.js';

describe('humanMinutes — the roll-up', () => {
  it('THE REPORTED CASE: the full series reads in hours, not 5034 minutes', () => {
    expect(humanMinutes(5034)).toBe('83 hr 54 min');
    expect(humanMinutes(5034)).not.toContain('5034');
  });

  it('leaves a single lesson in minutes — under an hour is already the right unit', () => {
    expect(humanMinutes(0)).toBe('0 min');
    expect(humanMinutes(1)).toBe('1 min');
    expect(humanMinutes(45)).toBe('45 min');
    expect(humanMinutes(59)).toBe('59 min');
  });

  it('rolls over exactly at the hour, and drops a zero remainder', () => {
    expect(humanMinutes(60)).toBe('1 hr');
    expect(humanMinutes(61)).toBe('1 hr 1 min');
    expect(humanMinutes(90)).toBe('1 hr 30 min');
    expect(humanMinutes(120)).toBe('2 hr');
    expect(humanMinutes(75)).toBe('1 hr 15 min');
  });

  it('stays in hours rather than days — a course is scheduled in hours', () => {
    expect(humanMinutes(1440)).toBe('24 hr');
    expect(humanMinutes(10000)).toBe('166 hr 40 min');
    expect(humanMinutes(10000)).not.toMatch(/\bd\b|day/);
  });

  it('never throws or prints junk on bad input (unbreakable)', () => {
    for (const bad of [null, undefined, NaN, -5, 'x', {}, []]) {
      const out = humanMinutes(bad);
      expect(typeof out).toBe('string');
      expect(out).not.toMatch(/NaN|Infinity|undefined|-/);
    }
  });

  it('the arithmetic is real — hours x 60 + minutes returns the input', () => {
    for (const m of [60, 75, 119, 480, 5034, 9999]) {
      const [, hr, mi] = humanMinutes(m).match(/^(\d+) hr(?: (\d+) min)?$/) || [];
      expect(Number(hr) * 60 + Number(mi || 0), `${m} must round-trip`).toBe(m);
    }
  });
});

describe('the presenter fit line says it the same way', () => {
  const scenes = Array.from({ length: 111 }, (_, i) => ({ id: `s${i}`, estimatedMin: 45, audience: { title: `Part ${i}` } }));

  it('the full-series summary carries hours, never a raw four-digit minute count', () => {
    const fit = fitToBudget(scenes, 0);
    expect(fit.fullMin).toBeGreaterThan(600);          // the real total is still minutes internally
    expect(fit.summary).toMatch(/\d+ hr/);             // but it is SAID in hours
    expect(fit.summary).not.toMatch(/\b\d{4,} min\b/); // and never as "5034 min"
  });

  it('a normal 45-minute class still reads in plain minutes', () => {
    const fit = fitToBudget(scenes.slice(0, 3), 45);
    expect(fit.summary).toMatch(/45 min/);
    expect(fit.summary).not.toMatch(/hr/);
  });
});
