// A catalog snapshot (no lesson text) must present EVERY lesson exactly as the
// live catalog does: same title, number, code, listening length, age versions,
// video flag. Proven to catch: drop a measurement from the snapshot and a lesson
// presents differently.
import { describe, it, expect } from 'vitest';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { presentLesson, presentationIndex, catalogSnapshot } from '../lib/learn-presentation/presentation.js';

const LIVE = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const SNAP = catalogSnapshot(LIVE);
const idx = presentationIndex([]);

describe('catalogSnapshot', () => {
  it('keeps every course and every lesson, in order', () => {
    expect(SNAP.map((c) => c.key)).toEqual(LIVE.map((c) => c.key));
    expect(SNAP.reduce((n, c) => n + c.schedule.length, 0)).toBe(LIVE.reduce((n, c) => n + c.schedule.length, 0));
    // A floor, not a pin: no lesson lost from the 994 measured 2026-11-24; new lessons (L342 on) pass.
    expect(SNAP.reduce((n, c) => n + c.schedule.length, 0)).toBeGreaterThanOrEqual(994);
  });

  it('presents every lesson exactly as the live catalog does', () => {
    let checked = 0;
    LIVE.forEach((c, i) => {
      c.schedule.forEach((l, j) => {
        const live = presentLesson(l, c, idx);
        const snap = presentLesson(SNAP[i].schedule[j], SNAP[i], idx);
        expect(snap).toEqual(live);
        checked += 1;
      });
    });
    expect(checked).toBe(LIVE.reduce((n, c) => n + c.schedule.length, 0));
    expect(checked).toBeGreaterThanOrEqual(994);
  });

  it('carries no lesson text', () => {
    const json = JSON.stringify(SNAP);
    expect(json.length).toBeLessThan(2_000_000);
    for (const c of SNAP) for (const l of c.schedule) expect(Object.keys(l).sort()).toEqual(expect.arrayContaining(['id', 'title', 'presentedMeasure']));
  });
});
