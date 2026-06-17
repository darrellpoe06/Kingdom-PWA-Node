// =============================================================================
// Wake-orchestrator cockpit — proven-to-catch tests (DR-0076).
// =============================================================================
// The cockpit must bind to REAL orchestrator state and degrade honestly when the
// feed isn't connected (never a painted status). These tests pin the pure shapers
// that drive the surface: normalize the live feed, the overall KPI, the per-brake
// status grid, and the budget cap readout. Each proven-to-catch case fails loudly
// if the logic regresses.
import { describe, it, expect } from 'vitest';
import {
  normalizeWakeState,
  wakeOrchestratorKpi,
  brakeRows,
  budgetStatus,
  wakeAtLabel,
  CONTROL_ACTIONS,
} from '../lib/wake-orchestrator.js';

const liveFeed = (over = {}) => ({
  ok: true,
  generated_at: '2026-06-16T20:00:00Z',
  self_drive_implemented: false,
  brakes: {
    kill_switch: 'engaged',
    armed: false,
    wake_summon: false,
    concurrency_lock: 'free',
    budget: { per_task_usd: 2, daily_usd: 25, spent_usd: 0, remaining_usd: 25 },
    ...(over.brakes || {}),
  },
  handoffs: over.handoffs || [],
  summons: over.summons || [],
  events: over.events || [],
});

describe('normalizeWakeState — honest, never-throwing shaper', () => {
  it('degrades to ok:false on null / error / non-object (no fabricated state)', () => {
    expect(normalizeWakeState(null).ok).toBe(false);
    expect(normalizeWakeState({ ok: false, error: 'x' }).ok).toBe(false);
    expect(normalizeWakeState('nope').ok).toBe(false);
  });

  it('normalizes a live feed into a fully-defaulted shape', () => {
    const d = normalizeWakeState(liveFeed());
    expect(d.ok).toBe(true);
    expect(d.brakes.killSwitch).toBe('engaged');
    expect(d.brakes.armed).toBe(false);
    expect(d.brakes.budget.dailyUsd).toBe(25);
    expect(d.selfDriveImplemented).toBe(false);
  });

  it('parses handoffs + derives scheduledWakes from those with a wake time', () => {
    const d = normalizeWakeState(liveFeed({
      handoffs: [
        { id: 'h1', lane: 'study', task: 'do it', issued_by: 'claude', suggested_vendor: 'claude', wake_at: { at: '2026-06-16T22:00:00Z' }, due: false },
        { id: 'h2', lane: 'other', task: 'x', wake_at: {}, due: false },
      ],
    }));
    expect(d.handoffs).toHaveLength(2);
    expect(d.scheduledWakes).toHaveLength(1); // only h1 has a real wake time
    expect(d.handoffs[0].wakeAtLabel).toMatch(/at 2026-06-16/);
  });

  it('parses vendor summons with measured cost', () => {
    const d = normalizeWakeState(liveFeed({ summons: [{ ts: '2026-06-16T22:01:00Z', lane: 'study', vendor: 'claude', model: 'claude-sonnet-4-6', cost_usd: 0.0123 }] }));
    expect(d.summons[0].vendor).toBe('claude');
    expect(d.summons[0].costUsd).toBeCloseTo(0.0123, 6);
  });
});

describe('wakeOrchestratorKpi — inert is safe, live is attention, breach is problem', () => {
  it('loading / offline are honest idle (never a misleading green)', () => {
    expect(wakeOrchestratorKpi('loading', null).status).toBe('idle');
    expect(wakeOrchestratorKpi('offline', null).status).toBe('idle');
    expect(wakeOrchestratorKpi('ok', { ok: false }).status).toBe('idle');
  });

  it('kill-switch engaged reads good/inert (the safe default)', () => {
    const d = normalizeWakeState(liveFeed());
    expect(wakeOrchestratorKpi('ok', d).status).toBe('good');
  });

  it('fully live (clear + armed + summon-consented) reads attention', () => {
    const d = normalizeWakeState(liveFeed({ brakes: { kill_switch: 'clear', armed: true, wake_summon: true, budget: { per_task_usd: 2, daily_usd: 25, spent_usd: 1, remaining_usd: 24 } } }));
    const k = wakeOrchestratorKpi('ok', d);
    expect(k.status).toBe('attention');
    expect(k.label).toMatch(/ARMED/);
  });

  it('a budget breach is a problem even when live (proven-to-catch)', () => {
    const d = normalizeWakeState(liveFeed({ brakes: { kill_switch: 'clear', armed: true, wake_summon: true, budget: { per_task_usd: 2, daily_usd: 25, spent_usd: 25, remaining_usd: 0 } } }));
    expect(wakeOrchestratorKpi('ok', d).status).toBe('problem');
  });
});

describe('budgetStatus — measured cap usage, not guessed', () => {
  it('unset daily cap => idle (a missing brake, no spend possible)', () => {
    expect(budgetStatus({ dailyUsd: 0, spentUsd: 0 }).status).toBe('idle');
  });
  it('under 80% => good with a real pct', () => {
    const b = budgetStatus({ dailyUsd: 25, spentUsd: 5 });
    expect(b.status).toBe('good');
    expect(b.pct).toBe(20);
  });
  it('>= 80% => attention', () => {
    expect(budgetStatus({ dailyUsd: 25, spentUsd: 20 }).status).toBe('attention');
  });
  it('>= cap => problem', () => {
    expect(budgetStatus({ dailyUsd: 25, spentUsd: 25 }).status).toBe('problem');
    expect(budgetStatus({ dailyUsd: 25, spentUsd: 30 }).status).toBe('problem');
  });
});

describe('brakeRows — green is the safe state, amber is a gate opening', () => {
  it('all-safe defaults render every brake green except unset budget', () => {
    const rows = brakeRows(normalizeWakeState(liveFeed()).brakes);
    const by = Object.fromEntries(rows.map(r => [r.key, r.status]));
    expect(by.kill_switch).toBe('good');   // engaged = safe
    expect(by.arm).toBe('good');            // disarmed = safe
    expect(by.wake_summon).toBe('good');    // not consented = safe
    expect(by.concurrency).toBe('good');    // free
    expect(by.budget).toBe('good');         // 0 of 25
  });

  it('opened gates flip to attention (kill disengaged, armed, consented)', () => {
    const rows = brakeRows(normalizeWakeState(liveFeed({ brakes: { kill_switch: 'clear', armed: true, wake_summon: true, concurrency_lock: 'held', budget: { per_task_usd: 2, daily_usd: 25, spent_usd: 0, remaining_usd: 25 } } })).brakes);
    const by = Object.fromEntries(rows.map(r => [r.key, r.status]));
    expect(by.kill_switch).toBe('attention');
    expect(by.arm).toBe('attention');
    expect(by.wake_summon).toBe('attention');
    expect(by.concurrency).toBe('attention');
  });
});

describe('wakeAtLabel + control action metadata', () => {
  it('labels each wake driver, dash for none', () => {
    expect(wakeAtLabel({ at: '2026-06-16T22:00:00Z' })).toMatch(/^at /);
    expect(wakeAtLabel({ after_seconds: 600 })).toMatch(/\+600s/);
    expect(wakeAtLabel({ condition: 'ci-green:PR-210' })).toMatch(/when ci-green/);
    expect(wakeAtLabel({})).toBe('—');
    expect(wakeAtLabel(null)).toBe('—');
  });

  it('arming actions require confirm; safe-ward actions do not', () => {
    expect(CONTROL_ACTIONS.arm.confirm).toBe(true);
    expect(CONTROL_ACTIONS.unkill.confirm).toBe(true);
    expect(CONTROL_ACTIONS['wake-arm'].confirm).toBe(true);
    expect(CONTROL_ACTIONS.kill.confirm).toBe(false);     // panic stop is instant
    expect(CONTROL_ACTIONS.disarm.confirm).toBe(false);
    expect(CONTROL_ACTIONS['wake-disarm'].confirm).toBe(false);
  });
});
