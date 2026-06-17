import { describe, it, expect } from 'vitest';
import {
  evaluateHandoffGate,
  buildHandoff,
  handoffSummary,
  pendingHandoffs,
} from '../lib/orchestrator-handoff.js';

// A fully-permissive brake feed: every brake OPEN and budget healthy. This is the
// ONLY shape that yields allowed:true — used to prove the gate can go green, then
// each test below flips ONE brake to prove it BLOCKS (proven-to-catch).
const liveFeed = (over = {}) => ({
  ok: true,
  brakes: {
    killSwitch: 'clear',
    armed: true,
    wakeSummon: true,
    concurrencyLock: 'free',
    budget: { perTaskUsd: 1, dailyUsd: 10, spentUsd: 1, remainingUsd: 9 },
    ...over,
  },
});

describe('evaluateHandoffGate (the Cage — proven-to-catch)', () => {
  it('allows ONLY when every brake permits', () => {
    const g = evaluateHandoffGate(liveFeed());
    expect(g.allowed).toBe(true);
    expect(g.reasons).toEqual([]);
  });

  it('BLOCKS on an engaged kill-switch', () => {
    const g = evaluateHandoffGate(liveFeed({ killSwitch: 'engaged' }));
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/kill-switch/i);
  });

  it('BLOCKS when the engine is disarmed', () => {
    expect(evaluateHandoffGate(liveFeed({ armed: false })).allowed).toBe(false);
  });

  it('BLOCKS when vendor-summon consent is withheld', () => {
    expect(evaluateHandoffGate(liveFeed({ wakeSummon: false })).allowed).toBe(false);
  });

  it('BLOCKS when the concurrency lock is held (no stacking)', () => {
    const g = evaluateHandoffGate(liveFeed({ concurrencyLock: 'held' }));
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/in progress|lock/i);
  });

  it('BLOCKS when the budget cap is reached', () => {
    const g = evaluateHandoffGate(liveFeed({ budget: { dailyUsd: 10, spentUsd: 10, remainingUsd: 0 } }));
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/budget/i);
  });

  it('BLOCKS when no budget ceiling is set', () => {
    expect(evaluateHandoffGate(liveFeed({ budget: {} })).allowed).toBe(false);
  });

  it('default-DENIES a not-connected / malformed feed', () => {
    expect(evaluateHandoffGate(null).allowed).toBe(false);
    expect(evaluateHandoffGate({ ok: false }).allowed).toBe(false);
    expect(evaluateHandoffGate(undefined).reasons[0]).toMatch(/not connected/i);
  });
});

describe('buildHandoff (records intent, never dispatches)', () => {
  const project = { id: 'pr-7', title: 'COLG video wall' };

  it('builds a staged handoff discussion carrying the gate verdict', () => {
    const gate = evaluateHandoffGate(liveFeed());
    const h = buildHandoff({ project, action: 'approve execute', lane: 'church-build', gate, persona: 'darrell', nowIso: '2026-06-17T00:00:00Z' });
    expect(h.kind).toBe('handoff');
    expect(h.projectSlugs).toEqual(['pr-7']);
    expect(h.meta.dispatchState).toBe('staged'); // the brake: never auto-dispatched
    expect(h.meta.lane).toBe('church-build');
    expect(h.meta.gateAllowed).toBe(true);
    expect(h.title).toContain('COLG video wall');
  });

  it('stages even when the brakes block, and records WHY', () => {
    const gate = evaluateHandoffGate(liveFeed({ killSwitch: 'engaged' }));
    const h = buildHandoff({ project, action: 'approve', lane: 'x', gate, nowIso: '2026-06-17T00:00:00Z' });
    expect(h.meta.dispatchState).toBe('staged'); // staged regardless — no auto-run path exists
    expect(h.meta.gateAllowed).toBe(false);
    expect(h.meta.gateReasons.join(' ')).toMatch(/kill-switch/i);
  });

  it('never reaches a dispatched state from this module', () => {
    const gate = evaluateHandoffGate(liveFeed());
    const h = buildHandoff({ project, action: 'go', lane: 'x', gate, nowIso: '2026-06-17T00:00:00Z' });
    expect(['dispatched', 'cleared']).not.toContain(h.meta.dispatchState);
  });
});

describe('handoffSummary + pendingHandoffs', () => {
  it('summary always leads with Staged', () => {
    const gate = evaluateHandoffGate(liveFeed());
    const h = buildHandoff({ project: { id: 'p', title: 'T' }, action: 'a', lane: 'L', gate, nowIso: 'z' });
    expect(handoffSummary(h)).toMatch(/^Staged/);
  });
  it('summary names the blocking brake when held', () => {
    const gate = evaluateHandoffGate(liveFeed({ armed: false }));
    const h = buildHandoff({ project: { id: 'p', title: 'T' }, action: 'a', lane: 'L', gate, nowIso: 'z' });
    expect(handoffSummary(h)).toMatch(/Held by the Cage/);
  });
  it('pendingHandoffs returns only open, staged handoff records', () => {
    const list = [
      { kind: 'handoff', status: 'open', meta: { handoff: true, dispatchState: 'staged' } },
      { kind: 'handoff', status: 'resolved', meta: { handoff: true, dispatchState: 'staged' } },
      { kind: 'directive', status: 'open' },
    ];
    expect(pendingHandoffs(list)).toHaveLength(1);
  });
});
