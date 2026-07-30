// @vitest-environment node
//
// derived-insights (DR-0249) — "we need valuable insights from data all the
// time." Pins: measurements only from real rows (no rows => honest
// unavailable, never a painted zero); movement stated from two real windows;
// headlines carry their basis (the receipt rides the claim).
import { describe, it, expect } from 'vitest';
import { reviewVelocity, resolutionHealth, insightLines } from '../lib/derived-insights.js';

const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
const NOW = ms('2026-07-30');
const REG = {
  ok: true,
  items: [
    { id: 'REV-1', date: '2026-07-29', status: 'addressed' },
    { id: 'REV-2', date: '2026-07-28', status: 'addressed' },
    { id: 'REV-3', date: '2026-07-20', status: 'open' },
    { id: 'REV-4', date: '2026-07-18', status: 'logged' },
    { id: 'REV-5', date: '2026-07-01', status: 'addressed' },
    { id: 'REV-6', date: '', status: 'open' }, // undated: contributes nothing
  ],
};

describe('reviewVelocity', () => {
  it('counts the two windows and states the delta', () => {
    const v = reviewVelocity(REG, NOW, 7);
    expect(v).toMatchObject({ ok: true, current: 2, prior: 2, delta: 0 });
  });
  it('degrades honestly with no data', () => {
    expect(reviewVelocity({ ok: true, items: [] }, NOW).ok).toBe(false);
    expect(reviewVelocity(REG, NaN).ok).toBe(false);
  });
});

describe('resolutionHealth', () => {
  it('measures addressed ratio and the oldest unresolved age from real rows', () => {
    const h = resolutionHealth(REG, NOW);
    expect(h).toMatchObject({ ok: true, total: 5, addressed: 3, unresolved: 2 });
    expect(h.oldestOpenDays).toBe(12); // REV-4, 2026-07-18 -> 2026-07-30
  });
  it('no rows => unavailable, never a painted zero', () => {
    expect(resolutionHealth(null, NOW).ok).toBe(false);
  });
});

describe('insightLines', () => {
  it('every line states the fact AND carries its basis (the receipt rides the claim)', () => {
    const lines = insightLines(REG, NOW);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const l of lines) {
      expect(l.headline.length).toBeGreaterThan(30);
      expect(l.basis.length).toBeGreaterThan(10);
    }
  });
  it('an empty registry yields the honest-unavailable line, not fabricated numbers', () => {
    const lines = insightLines({ ok: true, items: [] }, NOW);
    expect(lines).toHaveLength(1);
    expect(lines[0].id).toBe('unavailable');
    expect(lines[0].headline).toMatch(/never a painted number/i);
  });
});
