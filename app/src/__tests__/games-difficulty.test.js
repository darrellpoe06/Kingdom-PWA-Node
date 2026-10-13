// @vitest-environment node
// Tests for the pure difficulty/reveal model (lib/games/difficulty.js). The
// engine/scoring is untouched; this only governs what the UI reveals and the
// display order — so the guarantee is: a level NEVER changes scoring, only how
// much the game gives away.
import { describe, it, expect } from 'vitest';
import {
  GAME_LEVELS, DEFAULT_LEVEL, normalizeLevel, revealPolicy, displayOrder, levelMeta,
} from '../lib/games/difficulty.js';

describe('levels are a young->old ladder', () => {
  it('offers child -> youth -> teen -> adult', () => {
    expect(GAME_LEVELS.map((l) => l.id)).toEqual(['child', 'youth', 'teen', 'adult']);
    expect(DEFAULT_LEVEL).toBe('child');
    for (const l of GAME_LEVELS) { expect(l.label).toBeTruthy(); expect(l.age).toBeTruthy(); expect(l.hint).toBeTruthy(); }
  });
  it('normalizes junk to the default and resolves meta', () => {
    expect(normalizeLevel('nope')).toBe('child');
    expect(levelMeta('adult').label).toBe('Adult');
  });
});

describe('reveal narrows as the level rises', () => {
  it('child shows everything; adult shows the least', () => {
    const c = revealPolicy('child');
    expect(c).toEqual({ showEffects: true, showRedemptionHint: true, showLensBeforeChoice: true, shuffleChoices: false });
    const a = revealPolicy('adult');
    expect(a.showEffects).toBe(false);
    expect(a.showRedemptionHint).toBe(false);
    expect(a.showLensBeforeChoice).toBe(false); // Yahweh's perspective comes AFTER
    expect(a.shuffleChoices).toBe(true);
  });
  it('the tells drop off monotonically (each level reveals <= the last)', () => {
    const score = (p) => (p.showEffects ? 1 : 0) + (p.showRedemptionHint ? 1 : 0) + (p.showLensBeforeChoice ? 1 : 0) + (p.shuffleChoices ? 0 : 1);
    const scores = GAME_LEVELS.map((l) => score(revealPolicy(l.id)));
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
  });
});

describe('displayOrder — a seeded permutation that never loses a choice', () => {
  it('is identity when the level does not shuffle (child/youth)', () => {
    expect(displayOrder('sp', 123, 'child', 4)).toEqual([0, 1, 2, 3]);
    expect(displayOrder('sp', 123, 'youth', 4)).toEqual([0, 1, 2, 3]);
  });
  it('shuffles for teen/adult but remains a permutation of every real index', () => {
    const order = displayOrder('calling', 42, 'adult', 4);
    expect([...order].sort()).toEqual([0, 1, 2, 3]); // no index lost or duplicated
  });
  it('is deterministic (same inputs -> same order) so a resumed game agrees', () => {
    expect(displayOrder('calling', 42, 'adult', 4)).toEqual(displayOrder('calling', 42, 'adult', 4));
  });
  it('varies by space so it is not the same shuffle everywhere', () => {
    const a = displayOrder('calling', 42, 'adult', 4).join('');
    const b = displayOrder('firsthome', 42, 'adult', 4).join('');
    expect(a).not.toBe(b);
  });
  it('never shuffles a single option', () => {
    expect(displayOrder('sp', 1, 'adult', 1)).toEqual([0]);
  });
});
