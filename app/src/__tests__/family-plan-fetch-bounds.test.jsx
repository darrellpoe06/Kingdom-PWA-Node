// =============================================================================
// family-plan-fetch-bounds — the Plan tab's fetch is BOUNDED, SCOPED and
// RETRYABLE (2026-09-24, the Books → Plan end-to-end review).
// =============================================================================
// Three assumptions the first usePlan made, each now explicit and pinned:
//   - the network answers: a request that never resolves left "Loading the
//     family plan…" on screen for ever → an 8 s bound and an honest error;
//   - one instance per member: no instance_id filter (RLS alone) → the query
//     is pinned to the resolved instance when one is known;
//   - a failed load is final → a "Try again" control re-runs the fetch.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const calls = { eq: [], abortSignal: 0, limit: 0 };
let hang = false; // when set, limit() never resolves on its own — the hung-request case
let answer = { data: [], error: null };
let pendingReject = null;

vi.mock('../lib/supabase.js', () => ({
  default: {
    // A thenable builder, like PostgrestBuilder: every step returns the builder,
    // limit() arms the answer, abortSignal() registers the bound, `await` reads it.
    from: () => {
      let pending = null;
      const q = {
        select: () => q,
        eq: (col, val) => { calls.eq.push([col, val]); return q; },
        order: () => q,
        limit: () => {
          calls.limit += 1;
          pending = hang ? new Promise((_res, rej) => { pendingReject = rej; }) : Promise.resolve(answer);
          return q;
        },
        // The real builder rejects with an AbortError when its signal fires.
        abortSignal: (signal) => {
          calls.abortSignal += 1;
          signal.addEventListener('abort', () => {
            if (pendingReject) pendingReject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
          });
          return q;
        },
        then: (res, rej) => (pending || Promise.resolve(answer)).then(res, rej),
      };
      return q;
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  },
}));

const role = { instanceId: null, instanceSlug: null, instanceType: null, role: null, loaded: true };
vi.mock('../lib/instance-role.js', () => ({
  useInstanceRole: () => role,
  fetchInstanceRole: () => Promise.resolve(role),
}));

import FamilyPlan, { PLAN_FETCH_TIMEOUT_MS, fetchNewestPlan, planFetchError } from '../components/FamilyPlan.jsx';

let container = null; let root = null;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(FamilyPlan)); });
}
async function cleanup() {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = null; container = null;
}
const text = () => (container ? container.textContent : '');
const buttonNamed = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

beforeEach(() => { calls.eq = []; calls.abortSignal = 0; calls.limit = 0; hang = false; pendingReject = null; answer = { data: [], error: null }; role.instanceId = null; });
afterEach(async () => { await cleanup(); vi.useRealTimers(); });

describe('the fetch is bounded', () => {
  it('a request that never answers becomes an honest error within the bound, with a Try again control', async () => {
    vi.useFakeTimers();
    hang = true; // limit() never answers on its own
    await mount();
    expect(text()).toMatch(/Loading the family plan/);
    // The bound fires: the controller aborts, the builder rejects with an
    // AbortError, and the surface says so instead of loading for ever.
    await act(async () => { vi.advanceTimersByTime(PLAN_FETCH_TIMEOUT_MS + 10); });
    await act(async () => {});
    expect(calls.abortSignal, 'the query was handed the abort signal').toBe(1);
    expect(text()).toMatch(/The plan could not be loaded: no answer within 8 seconds/);
    expect(buttonNamed(/Try again/i)).toBeTruthy();
    expect(PLAN_FETCH_TIMEOUT_MS).toBe(8000);
  });

  it('planFetchError names the bound for an abort and passes a real message through', () => {
    expect(planFetchError({ name: 'AbortError', message: 'The operation was aborted' })).toBe('no answer within 8 seconds');
    expect(planFetchError({ message: 'permission denied for table family_plans' })).toBe('permission denied for table family_plans');
    expect(planFetchError(null)).toBe('load failed');
  });

  it('a failed load shows the error and Try again re-runs the fetch', async () => {
    answer = { data: null, error: { message: 'JWT expired' } };
    await mount();
    await act(async () => {});
    expect(text()).toMatch(/The plan could not be loaded: JWT expired/);
    expect(calls.limit).toBe(1);
    answer = { data: [], error: null };
    await act(async () => { buttonNamed(/Try again/i).dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => {});
    expect(calls.limit).toBe(2);
    expect(text()).toMatch(/No plan has been published for this family yet/);
  });
});

describe('the fetch is scoped', () => {
  it('pins the query to the resolved instance when one is known, and leaves RLS alone when none is', async () => {
    const client = {
      from: () => {
        const q = { select: () => q, eq: (c, v) => { calls.eq.push([c, v]); return q; }, order: () => q, limit: () => Promise.resolve({ data: [], error: null }) };
        return q;
      },
    };
    await fetchNewestPlan(client, { instanceId: 'inst-1' });
    expect(calls.eq).toEqual([['instance_id', 'inst-1']]);
    calls.eq = [];
    await fetchNewestPlan(client, { instanceId: null });
    expect(calls.eq).toEqual([]);
  });

  it('the mounted tab passes the shell’s resolved instance through', async () => {
    role.instanceId = 'inst-fam';
    await mount();
    await act(async () => {});
    expect(calls.eq).toEqual([['instance_id', 'inst-fam']]);
  });
});
