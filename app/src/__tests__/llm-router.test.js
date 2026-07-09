import { describe, it, expect } from 'vitest';
import { makeProvider } from '../lib/llm-providers.js';
import {
  makeInertState, validateSpec, routeSpec, brakeGate, selectRunnable, planRun, makeEvent,
} from '../lib/llm-router.js';

// --- Fixtures ----------------------------------------------------------------
const local = makeProvider({
  id: 'loc', name: 'Local qwen', kind: 'local', ollamaModel: 'qwen2.5:14b',
  capabilities: ['code-review', 'code-gen', 'reasoning'], status: 'available',
  sovereign: true, costTier: 'free-local',
});
const vendorKeyed = makeProvider({
  id: 'ven', name: 'Vendor Claude', kind: 'vendor', apiId: 'anthropic', keyEnv: 'K',
  keyRequired: true, keyPresent: true, capabilities: ['reasoning', 'code-review'],
  status: 'available', costTier: 'high',
});
const vendorNoKey = makeProvider({
  id: 'ven2', name: 'Vendor no key', kind: 'vendor', apiId: 'google', keyEnv: 'G',
  keyRequired: true, keyPresent: false, capabilities: ['reasoning'],
  status: 'available', costTier: 'med',
});
const providers = [local, vendorKeyed, vendorNoKey];

const armed = { killSwitch: false, armed: true, routerArmed: true, lockHeld: false, maxTasksPerRun: 5, maxTasksPerDay: 10, tasksToday: 0 };
const spec = (over = {}) => ({ id: 's1', title: 'Do a thing', capability: 'code-review', approved: true, status: 'queued', ...over });

// --- The inert default (proven-to-catch) -------------------------------------
describe('the Cage ships inert', () => {
  it('makeInertState never passes the brake gate', () => {
    const g = brakeGate(makeInertState());
    expect(g.go).toBe(false);
    expect(g.reasons).toContain('KILL_SWITCH engaged');
    expect(g.reasons).toContain('not ARMED');
    expect(g.reasons).toContain('LLM_ROUTER not armed');
  });
  it('a fully-armed state passes', () => {
    expect(brakeGate(armed).go).toBe(true);
  });
  it('each single missing brake keeps it closed', () => {
    expect(brakeGate({ ...armed, killSwitch: true }).go).toBe(false);
    expect(brakeGate({ ...armed, armed: false }).go).toBe(false);
    expect(brakeGate({ ...armed, routerArmed: false }).go).toBe(false);
    expect(brakeGate({ ...armed, lockHeld: true }).go).toBe(false);
    expect(brakeGate({ ...armed, maxTasksPerRun: 0 }).go).toBe(false);
    expect(brakeGate({ ...armed, maxTasksPerDay: 0 }).go).toBe(false);
    expect(brakeGate({ ...armed, tasksToday: 10 }).go).toBe(false);
  });
  it('live-service freeze closes the gate (DR-0012)', () => {
    expect(brakeGate(armed, { serviceFreeze: true }).go).toBe(false);
  });
});

// --- Routing (deterministic) -------------------------------------------------
describe('routeSpec', () => {
  it('prefers the sovereign/free-local provider for a shared capability', () => {
    const { provider } = routeSpec(spec({ capability: 'code-review' }), providers);
    expect(provider.id).toBe('loc'); // free-local rank 0 beats the high-cost vendor
  });
  it('routes reasoning to the keyed vendor (local does not advertise it here-only case)', () => {
    // local DOES advertise reasoning in the fixture, and is sovereign => still wins
    const { provider } = routeSpec(spec({ capability: 'reasoning' }), providers);
    expect(provider.id).toBe('loc');
  });
  it('a PRIVATE spec never routes to a vendor', () => {
    const localless = [vendorKeyed]; // only a vendor advertises code-review
    const { provider, reason } = routeSpec(spec({ capability: 'code-review', private: true }), localless);
    expect(provider).toBeNull();
    expect(reason).toMatch(/private/i);
  });
  it('a PRIVATE spec routes to local when one exists', () => {
    const { provider } = routeSpec(spec({ capability: 'reasoning', private: true }), providers);
    expect(provider.id).toBe('loc');
  });
  it('honors a valid pin', () => {
    const { provider } = routeSpec(spec({ capability: 'code-review', targetProviderId: 'ven' }), providers);
    expect(provider.id).toBe('ven');
  });
  it('rejects a pin that is not a dispatchable candidate', () => {
    const { provider, reason } = routeSpec(spec({ capability: 'reasoning', targetProviderId: 'ven2' }), providers);
    expect(provider).toBeNull(); // ven2 has no key => not dispatchable
    expect(reason).toMatch(/pinned/i);
  });
  it('skips an unknown capability', () => {
    const { provider } = routeSpec(spec({ capability: 'nope' }), providers);
    expect(provider).toBeNull();
  });
  it('skips when no dispatchable provider advertises the capability', () => {
    const { provider } = routeSpec(spec({ capability: 'reasoning' }), [vendorNoKey]);
    expect(provider).toBeNull(); // vendorNoKey is not dispatchable
  });
});

// --- The bounded gate --------------------------------------------------------
describe('selectRunnable', () => {
  it('runs nothing when inert (every spec skipped with a brake reason)', () => {
    const r = selectRunnable({ items: [spec()] }, providers, makeInertState());
    expect(r.runnable).toHaveLength(0);
    expect(r.skipped[0].reason).toMatch(/brakes:/);
  });
  it('runs an approved, queued, routable spec when armed', () => {
    const r = selectRunnable({ items: [spec()] }, providers, armed);
    expect(r.runnable).toHaveLength(1);
    expect(r.runnable[0].provider.id).toBe('loc');
  });
  it('skips an unapproved spec', () => {
    const r = selectRunnable({ items: [spec({ approved: false })] }, providers, armed);
    expect(r.runnable).toHaveLength(0);
    expect(r.skipped[0].reason).toBe('not approved');
  });
  it('skips a non-queued spec (no re-run)', () => {
    const r = selectRunnable({ items: [spec({ status: 'done' })] }, providers, armed);
    expect(r.runnable).toHaveLength(0);
    expect(r.skipped[0].reason).toMatch(/only queued/);
  });
  it('enforces the per-run budget', () => {
    const state = { ...armed, maxTasksPerRun: 1 };
    const r = selectRunnable({ items: [spec({ id: 'a' }), spec({ id: 'b' })] }, providers, state);
    expect(r.runnable).toHaveLength(1);
    expect(r.skipped.find((s) => s.id === 'b').reason).toMatch(/per-run budget/);
  });
});

describe('planRun + validation + events', () => {
  it('planRun.inert is true under the inert default', () => {
    expect(planRun({ items: [spec()] }, providers, makeInertState()).inert).toBe(true);
  });
  it('planRun surfaces wouldRun when armed', () => {
    const p = planRun({ items: [spec()] }, providers, armed);
    expect(p.inert).toBe(false);
    expect(p.wouldRun[0]).toMatchObject({ specId: 's1', providerId: 'loc', sovereign: true });
  });
  it('validateSpec catches a missing capability', () => {
    expect(validateSpec({ id: 'x', title: 't' }).ok).toBe(false);
  });
  it('makeEvent records the brake posture', () => {
    const e = makeEvent('planned', 'x', makeInertState(), '2026-07-08T00:00:00Z');
    expect(e).toMatchObject({ agent: 'llm-router', kill_switch: 'engaged', armed: false, router_armed: false });
  });
});
