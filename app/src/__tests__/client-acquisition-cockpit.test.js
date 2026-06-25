// =============================================================================
// Cockpit + observability + the three RUN brakes + the activity/outcome report.
// Added 2026-06-25 (Darrell: "intuitive + DO the work + report on it — WHY it did
// what it did, with metrics"). Per DR-0076 the brakes are PROVEN-TO-CATCH: each
// brake is shown to deny on its own, and the report derives only from real lists.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  configForSide, STAGE_KEYS,
  newRun, setRunStep, buildRunPlan, runOverallStatus,
  runStageInProgress, runProgress, runStatusLabel, runPhase,
  stepRationale, rationaleText,
  runEvent, pushRunEvent, RUN_EVENT_TYPES,
  RUN_BUDGET_DEFAULT, RUN_LOCK_STALE_MS, newRunLock, acquireRunLock, releaseRunLock,
  isLockStale, budgetRemaining, evaluateRunGate,
  TIME_SAVED_PER_ARTIFACT, estMinutesSavedFor, buildActivityReport,
  newStageOutput, newOutboundItem, newLead,
} from '../lib/client-acquisition.js';

const cfg = configForSide('client');

describe('run record carries observability scaffolding', () => {
  it('newRun starts idle with an empty event reel, not killed, manual trigger', () => {
    const r = newRun(cfg, { now: '2026-06-25T00:00:00.000Z', id: 'run-1' });
    expect(r.killed).toBe(false);
    expect(r.trigger).toBe('manual');
    expect(Array.isArray(r.events)).toBe(true);
    expect(r.events).toHaveLength(0);
    expect(r.steps.every((s) => 'rationale' in s)).toBe(true);
  });
  it('buildRunPlan includes the stage number n (for "stage 2 of 4")', () => {
    expect(buildRunPlan(cfg).map((p) => p.n)).toEqual([1, 2, 3, 4]);
  });
});

describe('run status readout (the cockpit reads these)', () => {
  it('idle when there is no run', () => {
    expect(runPhase(null)).toBe('idle');
    expect(runStatusLabel(null)).toMatch(/Idle/i);
  });
  it('reports the in-progress stage with a 2-of-4 position', () => {
    let r = newRun(cfg, { id: 'r' });
    r = setRunStep(r, 'market-signal', { status: 'produced' });
    r = setRunStep(r, 'offer-architect', { status: 'running' });
    expect(runPhase(r)).toBe('running');
    expect(runStageInProgress(r).role).toBe('Offer Architect');
    expect(runProgress(r)).toEqual({ done: 1, total: 4 });
    expect(runStatusLabel(r)).toMatch(/stage 2 of 4/);
  });
  it('"review" when all stages produced; "capture" when a stage needs the human', () => {
    let r = newRun(cfg, { id: 'r' });
    for (const k of STAGE_KEYS) r = setRunStep(r, k, { status: 'produced' });
    r = { ...r, status: runOverallStatus(r) };
    expect(runPhase(r)).toBe('review');
    expect(runStatusLabel(r)).toMatch(/Nothing sent/i);
    r = setRunStep(r, 'content-angle', { status: 'needs-capture' });
    r = { ...r, status: runOverallStatus(r) };
    expect(runPhase(r)).toBe('capture');
    expect(runStatusLabel(r)).toMatch(/pending/i);
  });
  it('"stopped" when killed, and says nothing was sent', () => {
    const r = { ...newRun(cfg, { id: 'r' }), killed: true };
    expect(runPhase(r)).toBe('stopped');
    expect(runStatusLabel(r)).toMatch(/Nothing was sent/i);
  });
});

describe('decision rationale — did X, not Y, because Z', () => {
  it('produced explains it drafted and did NOT send', () => {
    const r = stepRationale('offer-architect', 'produced');
    expect(r.did).toMatch(/Drafted/i);
    expect(r.not).toMatch(/did NOT send/i);
    expect(rationaleText(r)).toContain(r.why);
  });
  it('produced on the live workflow names the sovereign A.I. when live', () => {
    expect(stepRationale('offer-architect', 'produced', { live: true }).did).toMatch(/wf-practice-growth/);
  });
  it('needs-capture refuses to fabricate (DR-0076)', () => {
    const r = stepRationale('market-signal', 'needs-capture');
    expect(r.not).toMatch(/did NOT fabricate/i);
    expect(r.why).toMatch(/pending/i);
  });
  it('budget-halt and killed both say nothing kept running / left the system', () => {
    expect(stepRationale('content-angle', 'budget-halt').why).toMatch(/budget/i);
    expect(stepRationale('content-angle', 'killed').not).toMatch(/Nothing left the system/i);
  });
  it('rationaleText is empty for an unknown mode', () => {
    expect(rationaleText(stepRationale('market-signal', 'pending'))).toBe('');
  });
});

describe('run event reel', () => {
  it('pushRunEvent appends a timestamped line; types are enumerated', () => {
    let r = newRun(cfg, { id: 'r' });
    r = pushRunEvent(r, 'run-started', 'client', { now: '2026-06-25T00:00:00.000Z' });
    r = pushRunEvent(r, 'stage-produced', 'Offer Architect', { now: '2026-06-25T00:01:00.000Z' });
    expect(r.events).toHaveLength(2);
    expect(r.events[0]).toEqual({ ts: '2026-06-25T00:00:00.000Z', type: 'run-started', detail: 'client' });
    expect(RUN_EVENT_TYPES).toContain('run-killed');
  });
  it('runEvent stamps now when no time is given', () => {
    expect(runEvent('run-finished').type).toBe('run-finished');
  });
});

describe('THE THREE RUN BRAKES — proven-to-catch', () => {
  it('a clean state with a budget and a free lock ALLOWS the run', () => {
    expect(evaluateRunGate({ killSwitch: 'clear', lock: newRunLock(), budget: RUN_BUDGET_DEFAULT }).allowed).toBe(true);
  });
  it('BRAKE 1 — the kill-switch denies on its own', () => {
    const g = evaluateRunGate({ killSwitch: 'engaged', lock: newRunLock(), budget: RUN_BUDGET_DEFAULT });
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/Kill-switch/i);
  });
  it('BRAKE 2 — a held single-flight lock denies (no stacking runs)', () => {
    const lock = acquireRunLock('run-x', { now: '2026-06-25T00:00:00.000Z' });
    expect(lock.held).toBe(true);
    const g = evaluateRunGate({ lock, budget: RUN_BUDGET_DEFAULT, now: '2026-06-25T00:00:30.000Z' });
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/already in progress/i);
  });
  it('BRAKE 2 dead-man — a STALE lock is ignored so a wedged run cannot block forever', () => {
    const lock = acquireRunLock('run-x', { now: '2026-06-25T00:00:00.000Z' });
    const later = new Date(Date.parse('2026-06-25T00:00:00.000Z') + RUN_LOCK_STALE_MS + 1000).toISOString();
    expect(isLockStale(lock, { now: later })).toBe(true);
    expect(evaluateRunGate({ lock, budget: RUN_BUDGET_DEFAULT, now: later }).allowed).toBe(true);
    expect(releaseRunLock().held).toBe(false);
  });
  it('BRAKE 3 — the budget cap denies when too few stage-calls remain', () => {
    expect(budgetRemaining({ capCalls: 10, usedCalls: 8 })).toBe(2);
    const g = evaluateRunGate({ lock: newRunLock(), budget: { capCalls: 10, usedCalls: 8 }, stagesInRun: 4 });
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/Budget/i);
  });
  it('BRAKE 3 — a zero/absent cap denies (a ceiling must be set)', () => {
    expect(evaluateRunGate({ lock: newRunLock(), budget: { capCalls: 0, usedCalls: 0 } }).allowed).toBe(false);
  });
});

describe('activity / outcome report — real data, with rationale + metrics', () => {
  function fixture() {
    // Two runs for the client side: one produced, one needs-capture.
    let r1 = newRun(configForSide('client'), { id: 'r1', now: '2026-06-25T01:00:00.000Z' });
    for (const k of STAGE_KEYS) r1 = setRunStep(r1, k, { status: 'produced', rationale: rationaleText(stepRationale(k, 'produced')) });
    r1 = { ...r1, status: 'produced', finishedAt: '2026-06-25T01:05:00.000Z', summary: { landedLeads: 2, queuedOutbound: 1 } };
    let r2 = newRun(configForSide('client'), { id: 'r2', now: '2026-06-25T02:00:00.000Z' });
    r2 = setRunStep(r2, 'market-signal', { status: 'needs-capture', rationale: rationaleText(stepRationale('market-signal', 'needs-capture')) });
    r2 = { ...r2, status: 'needs-capture' };

    const outputs = [
      newStageOutput('market-signal', 'Underserved segment: grief care.', { sideKey: 'client', id: 'o1' }),
      newStageOutput('offer-architect', 'Three honest tiers.', { sideKey: 'client', id: 'o2' }),
      { ...newStageOutput('content-angle', '', { sideKey: 'client', id: 'o3' }), status: 'needs-capture' },
      newStageOutput('market-signal', 'Therapist supply gap.', { sideKey: 'therapist', id: 'o4' }), // other side
    ];
    outputs[0].status = 'approved';
    const outbound = [
      newOutboundItem({ leadId: 'l1', sideKey: 'client', subject: 'Hi', body: 'A warm note.' }, { id: 'ob1' }),
      { ...newOutboundItem({ leadId: 'l2', sideKey: 'client', subject: 'Hi', body: 'A warm note.' }, { id: 'ob2' }), status: 'approved' },
    ];
    const leads = [
      newLead({ sideKey: 'client', source: 'run-the-team', stage: 'outreach-ready' }, { id: 'l1' }),
      newLead({ sideKey: 'client', source: 'referral', stage: 'new' }, { id: 'l2' }),
    ];
    return { runs: [r1, r2], outputs, outbound, leads };
  }

  it('aggregates runs, drafts, needs-capture, outbound states, and leads landed (side-scoped)', () => {
    const f = fixture();
    const rep = buildActivityReport({ ...f, sideKey: 'client' });
    expect(rep.runsTotal).toBe(2);
    expect(rep.draftsProduced).toBe(2);       // o1, o2 have content; o3 empty; o4 is therapist side
    expect(rep.needsCapture).toBe(1);          // o3
    expect(rep.approvedDrafts).toBe(1);        // o1
    expect(rep.outboundQueued).toBe(2);
    expect(rep.outboundPending).toBe(1);
    expect(rep.outboundApproved).toBe(1);
    expect(rep.leadsLanded).toBe(1);           // only the run-the-team lead
    expect(rep.lastRunAt).toBe('2026-06-25T02:00:00.000Z');
  });
  it('per-run rollup carries the decisions WITH rationale, newest first', () => {
    const rep = buildActivityReport({ ...fixture(), sideKey: 'client' });
    expect(rep.perRun.map((r) => r.runId)).toEqual(['r2', 'r1']); // newest first
    const r1 = rep.perRun.find((r) => r.runId === 'r1');
    expect(r1.draftsProduced).toBe(4);
    expect(r1.landedLeads).toBe(2);
    expect(r1.decisions).toHaveLength(4);
    expect(r1.decisions[0].rationale).toMatch(/did NOT send/i);
  });
  it('estimated time saved is a transparent count × per-artifact minutes', () => {
    // market-signals 25 + offer 30 = 55 (content-angle has no content; therapist excluded)
    const rep = buildActivityReport({ ...fixture(), sideKey: 'client' });
    expect(rep.estMinutesSaved).toBe(TIME_SAVED_PER_ARTIFACT['market-signals'] + TIME_SAVED_PER_ARTIFACT.offer);
    expect(rep.estTimeSavedAssumption).toMatch(/Estimate/i);
    expect(estMinutesSavedFor([])).toBe(0);
  });
  it('with no sideKey it reports across all sides', () => {
    const rep = buildActivityReport(fixture());
    expect(rep.draftsProduced).toBe(3); // o1, o2, o4
  });
});
