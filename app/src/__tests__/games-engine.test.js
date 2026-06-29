// =============================================================================
// games-engine.test.js — the generic board-game engine is pure & deterministic
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  nextRandom, spinWheel, emptyScores, applyEffects, boardFor, computeTotals,
  createGame, choosePath, takeTurn, resolveChoice, finishGame, progress,
} from '../lib/games/engine.js';

// A tiny self-contained game definition so the engine is tested in isolation
// from any real game's content.
const DEF = {
  id: 'test-game',
  categories: [
    { key: 'a', label: 'A', weight: 2 },
    { key: 'b', label: 'B', weight: 1 },
  ],
  paths: [
    { id: 'p1', label: 'Path One', opening: [
      { id: 'p1-1', type: 'word', title: 'Open', effects: { a: 2 } },
    ] },
    { id: 'p2', label: 'Path Two', opening: [
      { id: 'p2-1', type: 'word', title: 'Open2', effects: { b: 2 } },
    ] },
  ],
  trunk: [
    { id: 't1', type: 'word', title: 'Trunk one', effects: { a: 1, b: 1 } },
    { id: 't2', type: 'crossroads', title: 'Fork', choices: [
      { label: 'left', effects: { a: 5 } },
      { label: 'right', effects: { b: 5 } },
    ] },
    { id: 't3', type: 'card', title: 'Draw', deck: 'd' },
    { id: 't4', type: 'finish', title: 'End' },
  ],
  decks: { d: [ { title: 'only card', effects: { a: 1 } } ] },
  legacy: (def, state) => ({ score: computeTotals(def, state).weighted, tier: 'done' }),
};

describe('rng — deterministic & bounded', () => {
  it('nextRandom is a pure function of its seed', () => {
    const [v1, s1] = nextRandom(42);
    const [v2, s2] = nextRandom(42);
    expect(v1).toBe(v2);
    expect(s1).toBe(s2);
    expect(v1).toBeGreaterThanOrEqual(0);
    expect(v1).toBeLessThan(1);
  });
  it('spinWheel stays within [min,max] across many seeds', () => {
    let seed = 7;
    for (let i = 0; i < 500; i++) {
      const [val, next] = spinWheel(seed, 1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      seed = next;
    }
  });
});

describe('scoring helpers', () => {
  it('emptyScores zeroes every category', () => {
    expect(emptyScores(DEF)).toEqual({ a: 0, b: 0 });
  });
  it('applyEffects adds deltas and never drops below 0', () => {
    const s = applyEffects(DEF, { a: 1, b: 1 }, { a: 2, b: -5 });
    expect(s).toEqual({ a: 3, b: 0 });
  });
  it('applyEffects ignores unknown categories and null effects', () => {
    expect(applyEffects(DEF, { a: 1, b: 1 }, { z: 9 })).toEqual({ a: 1, b: 1 });
    expect(applyEffects(DEF, { a: 1, b: 1 }, null)).toEqual({ a: 1, b: 1 });
  });
  it('computeTotals weights categories', () => {
    const t = computeTotals(DEF, { scores: { a: 3, b: 4 } });
    // a:3*2 + b:4*1 = 10
    expect(t.weighted).toBe(10);
    expect(t.byCategory).toEqual({ a: 3, b: 4 });
  });
});

describe('board assembly', () => {
  it('boardFor concatenates the path opening with the shared trunk', () => {
    const board = boardFor(DEF, 'p1');
    expect(board.map((s) => s.id)).toEqual(['p1-1', 't1', 't2', 't3', 't4']);
  });
});

describe('lifecycle', () => {
  it('createGame starts paused at the path crossroads', () => {
    const g = createGame(DEF, { seed: 1 });
    expect(g.status).toBe('choosing-path');
    expect(g.position).toBe(-1);
    expect(g.scores).toEqual({ a: 0, b: 0 });
    expect(g.pending).toBeNull();
  });

  it('choosePath puts the player on the first space and resolves it', () => {
    const g = choosePath(DEF, createGame(DEF, { seed: 1 }), 'p1');
    expect(g.status).toBe('playing');
    expect(g.pathId).toBe('p1');
    expect(g.position).toBe(0);
    expect(g.scores.a).toBe(2); // p1-1 auto-applied { a: 2 }
  });

  it('an unknown path id is a no-op', () => {
    const g0 = createGame(DEF, { seed: 1 });
    expect(choosePath(DEF, g0, 'nope')).toBe(g0);
  });

  it('takeTurn does nothing while a decision is pending', () => {
    // Force landing on the crossroads (t2, index 2) by choosing a seed/spins
    // path; simpler: drive turns until pending appears.
    let g = choosePath(DEF, createGame(DEF, { seed: 3 }), 'p1');
    let guard = 0;
    while (!g.pending && g.status === 'playing' && guard++ < 50) g = takeTurn(DEF, g);
    if (g.pending) {
      const frozen = takeTurn(DEF, g);
      expect(frozen).toBe(g); // no-op
    }
    expect(guard).toBeLessThan(50);
  });

  it('resolveChoice applies the chosen option and clears pending', () => {
    let g = choosePath(DEF, createGame(DEF, { seed: 3 }), 'p1');
    let guard = 0;
    while (!g.pending && g.status === 'playing' && guard++ < 50) g = takeTurn(DEF, g);
    if (g.pending && g.pending.spaceId === 't2') {
      const before = g.scores.a;
      g = resolveChoice(DEF, g, 0); // 'left' -> a += 5
      expect(g.pending).toBeNull();
      expect(g.scores.a).toBe(before + 5);
    }
  });

  it('finishGame freezes status and computes legacy', () => {
    const g = finishGame(DEF, { status: 'playing', scores: { a: 1, b: 2 }, pending: null, log: [] });
    expect(g.status).toBe('finished');
    expect(g.legacy.tier).toBe('done');
    expect(g.legacy.score).toBe(1 * 2 + 2 * 1);
  });
});

describe('a full deterministic play-through always reaches the finish', () => {
  // Drive any seed to completion, resolving every decision by the first option.
  function playToEnd(seed) {
    let g = choosePath(DEF, createGame(DEF, { seed }), 'p1');
    let guard = 0;
    while (g.status === 'playing' && guard++ < 200) {
      if (g.pending) g = resolveChoice(DEF, g, 0);
      else g = takeTurn(DEF, g);
    }
    return { g, guard };
  }

  it('terminates and produces a legacy for many seeds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { g, guard } = playToEnd(seed);
      expect(g.status).toBe('finished');
      expect(g.legacy).toBeTruthy();
      expect(guard).toBeLessThan(200);
    }
  });

  it('is reproducible: same seed + same choices => identical scores', () => {
    const a = playToEnd(17).g;
    const b = playToEnd(17).g;
    expect(a.scores).toEqual(b.scores);
    expect(a.legacy.score).toBe(b.legacy.score);
  });

  it('progress reports position out of the full board', () => {
    const g = choosePath(DEF, createGame(DEF, { seed: 1 }), 'p1');
    const p = progress(DEF, g);
    expect(p.total).toBe(5);
    expect(p.index).toBeGreaterThanOrEqual(1);
  });
});
