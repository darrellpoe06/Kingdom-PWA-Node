// =============================================================================
// Your paces, and whether speed helps or hurts understanding (DR-1386)
// =============================================================================
// Darrell 2026-11-10: "Give the reader their reader vs reading paces... if
// they are measuring accurately... and users want that"; "Can we see if we
// improve or reduce our comprehension based on the speed of the data being
// consumed?" Measured, never assumed; a finding only when the data holds one.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  noteSeenRise,
  noteEarsPace,
  eyesPace,
  earsPace,
  recordPacedAttempt,
  pacedAttempts,
  paceVsUnderstanding,
  paceFindingLine,
  getShowPaces,
  setShowPaces,
  PAUSE_MS,
  BAND_MIN,
} from '../lib/pace-understanding.js';

function memory() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('the two paces', () => {
  let storage;
  beforeEach(() => {
    storage = memory();
  });

  it('the eyes pace is words over the time between rises, shown only once accurate', () => {
    const t0 = 1_000_000;
    noteSeenRise('L', { words: 50, at: t0 }, { storage });
    expect(eyesPace('L', { storage }).accurate, 'too little measured').toBe(false);
    // The first rise starts the clock; 250 more words over 60 s: 250 words a minute.
    for (let i = 1; i <= 5; i += 1) noteSeenRise('L', { words: 50, at: t0 + i * 12000 }, { storage });
    const e = eyesPace('L', { storage });
    expect(e.words).toBe(250);
    expect(e.accurate).toBe(true);
    expect(e.wpm).toBe(250);
  });

  it('a long pause counts as time to think, never as a tab left open', () => {
    const t0 = 0;
    noteSeenRise('P', { words: 100, at: t0 }, { storage });
    noteSeenRise('P', { words: 100, at: t0 + 10 * 60000 }, { storage });
    expect(eyesPace('P', { storage }).ms).toBe(PAUSE_MS);
  });

  it('a reading held at the grace ceiling is beyond what the measure can see, and is never used as a pace', () => {
    noteSeenRise('G', { words: 400, at: 0 }, { storage });
    noteSeenRise('G', { words: 400, at: 40000, capped: true }, { storage });
    expect(eyesPace('G', { storage }).beyondGrace).toBe(true);
    expect(recordPacedAttempt({ lessonId: 'G', pct: 90, passed: true }, { storage }).eyesWpm).toBe(null);
  });

  it('the reader pace is kept as measured, and an attempt carries both paces; the first try is marked', () => {
    noteEarsPace('R', 182.4, 1.2, { storage });
    expect(earsPace('R', { storage })).toEqual({ wpm: 182, rate: 1.2 });
    const a = recordPacedAttempt({ lessonId: 'R', pct: 75, passed: true }, { storage });
    const b = recordPacedAttempt({ lessonId: 'R', pct: 100, passed: true }, { storage });
    expect(a.earsWpm).toBe(182);
    expect(a.firstTry).toBe(true);
    expect(b.firstTry).toBe(false);
    expect(pacedAttempts({ storage })).toHaveLength(2);
  });

  it('off until the learner turns it on', () => {
    expect(getShowPaces({ storage })).toBe(false);
    setShowPaces(true, { storage });
    expect(getShowPaces({ storage })).toBe(true);
    setShowPaces(false, { storage });
    expect(getShowPaces({ storage })).toBe(false);
  });
});

describe('pace and understanding', () => {
  const tries = (wpm, pcts) => pcts.map((pct, i) => ({ lessonId: `${wpm}-${i}`, firstTry: true, eyesWpm: wpm, pct, passed: pct >= 70 }));

  it('speaks only when two paces each hold enough first tries, and says how many it still needs', () => {
    const r = paceVsUnderstanding([...tries(200, [90, 80]), ...tries(450, [60])]);
    expect(r.finding).toBe(null);
    expect(paceFindingLine(r)).toMatch(/^Not enough yet to say: 3 first tries with a measured pace\./);
  });

  it('names the pace where first tries score higher, from the data', () => {
    const r = paceVsUnderstanding([...tries(200, [90, 80, 100]), ...tries(450, [60, 70, 50]), { lessonId: 'x', firstTry: false, eyesWpm: 450, pct: 100 }]);
    expect(r.finding.hi.id).toBe('steady');
    expect(r.finding.lo.id).toBe('fast');
    expect(paceFindingLine(r)).toBe(
      'So far your first tries score higher at 150 to 250 words a minute (90% across 3) than at 400 words a minute or more (60% across 3).'
    );
  });

  it('PROVEN TO CATCH: retakes and unmeasured tries never make a finding', () => {
    const retakes = tries(450, [100, 100, 100]).map((a) => ({ ...a, firstTry: false }));
    const unmeasured = [1, 2, 3].map((i) => ({ lessonId: `u${i}`, firstTry: true, pct: 100 }));
    const r = paceVsUnderstanding([...tries(200, [50, 50, 50]), ...retakes, ...unmeasured]);
    expect(r.finding).toBe(null);
    expect(r.measured).toBe(BAND_MIN);
  });
});
