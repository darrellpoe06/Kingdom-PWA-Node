// ari-team — proven-to-catch (DR-0076 §3): Ari's team plan is allocated across
// agents + subs, and the plan is DISPATCHABLE only when all three brakes are
// clear AND every task routed. Each tripped brake must block; the composition
// with the real agent-brakes primitives must reflect a tripped kill-switch and
// an exceeded budget.
import { describe, it, expect } from 'vitest';
import { planTeam, composeTeamBrakes } from '../lib/ari-team.js';
import { CAPABILITY_TOKENS } from '../lib/llm-providers.js';
import { killSwitch, memoryStore } from '../lib/agent-brakes.js';

const CAP = CAPABILITY_TOKENS[0];
// Two dispatchable sovereign local providers advertising CAP.
const PROVIDERS = [
  { id: 'local-a', name: 'Local A', kind: 'local', sovereign: true, active: true, status: 'available', keyRequired: false, capabilities: [CAP], costTier: 'free-local', ollamaModel: 'qwen2.5' },
  { id: 'local-b', name: 'Local B', kind: 'local', sovereign: true, active: true, status: 'available', keyRequired: false, capabilities: [CAP], costTier: 'free-local', ollamaModel: 'qwen2.5' },
];
const CLEAR = { budget: { blocked: false }, lock: { blocked: false }, kill: { blocked: false } };

describe('ari-team.planTeam — allocation + the three-brake dispatch gate', () => {
  it('authorizes a clear, routable plan and counts every agent incl. subs', () => {
    const tasks = [
      { id: 't1', capability: CAP },
      { id: 't2', capability: CAP, subs: [{ id: 't2a', capability: CAP }, { id: 't2b', capability: CAP }] },
    ];
    const p = planTeam(tasks, PROVIDERS, CLEAR);
    expect(p.authorized).toBe(true);
    expect(p.allRoutable).toBe(true);
    expect(p.dispatchable).toBe(true);
    expect(p.agentsPlanned).toBe(4); // t1 + t2 + 2 subs
    expect(p.assignments[1].subs.length).toBe(2);
    expect(p.assignments[0].provider).toBeTruthy();
  });

  it('BLOCKS dispatch when the BUDGET brake is tripped', () => {
    const p = planTeam([{ id: 't1', capability: CAP }], PROVIDERS, { ...CLEAR, budget: { blocked: true, reason: 'unit ceiling reached' } });
    expect(p.authorized).toBe(false);
    expect(p.dispatchable).toBe(false);
    expect(p.blockedBy).toBe('budget');
  });

  it('BLOCKS dispatch when the LOCK brake is tripped', () => {
    const p = planTeam([{ id: 't1', capability: CAP }], PROVIDERS, { ...CLEAR, lock: { blocked: true, reason: 'prior run holds the lock' } });
    expect(p.authorized).toBe(false);
    expect(p.blockedBy).toBe('lock');
  });

  it('BLOCKS dispatch when the KILL-SWITCH is tripped', () => {
    const p = planTeam([{ id: 't1', capability: CAP }], PROVIDERS, { ...CLEAR, kill: { blocked: true, reason: 'explicitly tripped' } });
    expect(p.authorized).toBe(false);
    expect(p.blockedBy).toBe('kill-switch');
  });

  it('is NOT dispatchable when a task cannot be routed (unknown capability), even with clear brakes', () => {
    const p = planTeam([{ id: 't1', capability: 'not-a-real-capability' }], PROVIDERS, CLEAR);
    expect(p.authorized).toBe(true);       // brakes are clear
    expect(p.allRoutable).toBe(false);     // but nothing routed
    expect(p.dispatchable).toBe(false);    // so it must not dispatch
    expect(p.assignments[0].routable).toBe(false);
  });
});

describe('ari-team.composeTeamBrakes — real agent-brakes wiring', () => {
  it('reports all brakes clear on a fresh store', () => {
    const b = composeTeamBrakes(memoryStore(), { nowMs: 1000, name: 'ari-team-test', budget: { maxUnits: 10 }, agentsPlanned: 3 });
    expect(b.kill.blocked).toBe(false);
    expect(b.budget.blocked).toBe(false);
  });

  it('reflects a tripped KILL-SWITCH (sticky)', () => {
    const store = memoryStore();
    killSwitch(store, 'ari-team-test', { nowMs: 1000 }).trip('overrun');
    const b = composeTeamBrakes(store, { nowMs: 2000, name: 'ari-team-test', budget: { maxUnits: 10 }, agentsPlanned: 1 });
    expect(b.kill.blocked).toBe(true);
    expect(b.kill.reason).toMatch(/overrun/);
  });

  it('reflects an EXCEEDED budget when used + planned agents hit the ceiling', () => {
    const b = composeTeamBrakes(memoryStore(), { nowMs: 1000, name: 'ari-team-test', budget: { maxUnits: 5, usedUnits: 4 }, agentsPlanned: 2 });
    expect(b.budget.blocked).toBe(true); // 4 + 2 = 6 >= 5
  });
});
