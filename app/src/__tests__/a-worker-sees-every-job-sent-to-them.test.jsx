// @vitest-environment jsdom
// =============================================================================
// A 1099 WORKER SEES EVERY JOB SENT TO THEM, AND IS TOLD (DR-1594)
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!?"
//
// After 0337 a worker can READ a job sent to them. Two gaps remained: the Work
// tab read the one door that happened to be selected, so a job on another
// door stayed out of sight; and nothing told the worker a job had been sent.
// This pins the cross-door list (lib/assigned-work.js + MyWorkOrders.jsx) and
// the bell's 'job-new' arrival.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  loadMyAssignedWork, openAssigned, SEEN_EVENT, JOB_KINDS, jobDoorId, jobWhere, jobMapHref, jobArrivals, jobLanding, OPEN_JOB_STATUSES,
} from '../lib/assigned-work.js';
import {
  ARRIVAL_KINDS, SCREEN_KINDS, ARRIVALS_EVENT, ARRIVALS_SEEN_EVENT, combineArrivals, arrivalLanding, CATALOG_SINCE_PREFIX,
} from '../lib/arrivals.js';
import { startArrivalsWatch } from '../lib/arrivals-watch.js';
import { KIND_WORDS } from '../components/ArrivalsBell.jsx';
import MyWorkOrders, { jobDocRow, showsMyWork } from '../modules/properties/MyWorkOrders.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const job = (over = {}) => ({
  id: '11111111-1111-4111-8111-111111111111', instance_id: 'inst', tenancy_id: null, rental_id: 'r-1',
  title: 'Furnace filter', detail: 'Basement unit', area: 'Utility', priority: 'normal', status: 'scheduled',
  proof_required: 'none', assigned_to_label: 'Coreyon', created_at: '2026-11-19T10:00:00Z',
  door_label: '1003 Koehn', unit_label: null, address: '1003 Koehn St', city: 'Davenport', state: 'IA', zip: '52804', ...over,
});

// ── 1. THE READ ─────────────────────────────────────────────────────────────
describe('the jobs sent to me are one read across every door', () => {
  it('reads my_assigned_work_orders and returns the rows', async () => {
    const rpc = vi.fn(async () => ({ data: [job()], error: null }));
    const r = await loadMyAssignedWork({ rpc });
    expect(rpc).toHaveBeenCalledWith('my_assigned_work_orders');
    expect(r).toEqual({ ok: true, jobs: [job()] });
  });

  it('a failed read is a failure, never an empty list', async () => {
    expect(await loadMyAssignedWork({ rpc: async () => ({ data: null, error: { message: 'boom' } }) })).toEqual({ ok: false, reason: 'read-failed' });
    expect(await loadMyAssignedWork({ rpc: async () => ({ data: null, error: { message: 'function public.my_assigned_work_orders() does not exist' } }) }))
      .toEqual({ ok: false, reason: 'not-enabled-yet' });
    expect(await loadMyAssignedWork(null)).toEqual({ ok: false, reason: 'no-client' });
  });

  it('a read that hangs is abandoned at its timeout', async () => {
    const r = await loadMyAssignedWork({ rpc: () => new Promise(() => {}) }, { timeoutMs: 20 });
    expect(r).toEqual({ ok: false, reason: 'timeout' });
  });

  it('open jobs only, urgent first, then newest', () => {
    const rows = [
      job({ id: 'a', status: 'resolved' }),
      job({ id: 'b', priority: 'low', created_at: '2026-11-19T12:00:00Z' }),
      job({ id: 'c', priority: 'urgent', created_at: '2026-11-01T00:00:00Z' }),
      job({ id: 'd', created_at: '2026-11-18T00:00:00Z' }),
      job({ id: 'e', created_at: '2026-11-19T11:00:00Z' }),
    ];
    expect(openAssigned(rows).map((j) => j.id)).toEqual(['c', 'e', 'd', 'b']);
    expect(OPEN_JOB_STATUSES).toEqual(['submitted', 'received', 'scheduled', 'in-progress']);
  });

  it('says where the job is and opens the street in maps', () => {
    expect(jobWhere(job())).toBe('1003 Koehn St, Davenport, IA');
    expect(jobWhere(job({ door_label: '805 N Prospect', unit_label: 'Apt 2', address: '805 North Prospect Ave' })))
      .toBe('805 N Prospect · Apt 2 — 805 North Prospect Ave, Davenport, IA');
    expect(jobWhere(job({ door_label: null, address: null, city: null, state: null }))).toBe('Address not on file');
    expect(jobMapHref(job())).toContain(encodeURIComponent('1003 Koehn St, Davenport, IA, 52804'));
    expect(jobDoorId(job({ tenancy_id: 't-1' }))).toBe('t-1');
    expect(jobDoorId(job())).toBe('r-1');
  });
});

// ── 2. THE BELL ─────────────────────────────────────────────────────────────
describe('a job sent to a worker rings the bell', () => {
  it('PROVEN-TO-CATCH: one arrival per OPEN job, named, landing in Poe Properties on that door', () => {
    const items = jobArrivals([job(), job({ id: 'x', status: 'resolved' })]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'job-new', id: `job-new:${job().id}`, screen: 'properties-jobs', door: 'r-1' });
    expect(items[0].title).toBe('New job for you: Furnace filter');
    expect(items[0].detail).toContain('1003 Koehn St');
    expect(jobLanding(items[0])).toBe('/properties/app/?p=jobs&door=r-1');
    expect(arrivalLanding({ pathname: '/poetech-app/', search: '', item: items[0] })).toBe('/properties/app/?p=jobs&door=r-1');
  });

  it('is a known kind, has a word on the bell, and is marked seen by its screen', () => {
    expect(ARRIVAL_KINDS).toContain('job-new');
    expect(SCREEN_KINDS['properties-jobs']).toEqual(['job-new']);
    expect(SEEN_EVENT, 'the light copy is the bell\'s own event').toBe(ARRIVALS_SEEN_EVENT);
    expect([...JOB_KINDS]).toEqual(SCREEN_KINDS['properties-jobs']);
    expect(KIND_WORDS['job-new']).toBe('Work order');
    expect(combineArrivals({ jobs: jobArrivals([job()]) }).map((i) => i.kind)).toEqual(['job-new']);
  });

  it('PROVEN-TO-CATCH: the watcher reads the jobs and publishes them for a signed-in worker', async () => {
    const events = [];
    const store = new Map([[`${CATALOG_SINCE_PREFIX}w1`, '2026-11-12']]);
    const win = {
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
      document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, title: '' },
      navigator: {}, addEventListener() {}, removeEventListener() {},
      dispatchEvent: (e) => { events.push(e); return true; },
      CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
      location: { pathname: '/properties/app/', search: '' },
    };
    let session;
    const stop = startArrivalsWatch(win, {
      supabase: { channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {} },
      onAuthChange: (fn) => { session = fn; return () => {}; },
      loaders: {
        catalog: async () => () => [],
        lessons: async () => async () => ({ ok: true, owner: false, items: [] }),
        queue: async () => async () => ({ ok: true, rows: [] }),
        feedback: async () => async () => ({ ok: true, items: [] }),
        services: async () => async () => null,
        jobs: async () => async () => ({ ok: true, jobs: [job()] }),
      },
    });
    session({ user: { id: 'w1' } });
    await vi.waitFor(() => {
      const last = events.filter((e) => e.type === ARRIVALS_EVENT).pop();
      expect(last.detail.items.map((i) => i.kind)).toContain('job-new');
    });
    stop();
  });
});

// ── 3. THE CARD ─────────────────────────────────────────────────────────────
describe('My work orders, first on the worker\'s screen', () => {
  let container, root;
  afterEach(() => {
    try { act(() => root && root.unmount()); } catch { /* noop */ }
    if (container) container.remove();
    container = null; root = null;
  });
  async function mount(props) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(MyWorkOrders, props)); });
  }

  it('PROVEN-TO-CATCH: lists the jobs on EVERY door, each with where it is', async () => {
    const jobs = [job(), job({ id: '22222222-2222-4222-8222-222222222222', title: 'Gutter', rental_id: 'r-2', door_label: '805 N Prospect', address: '805 North Prospect Ave' })];
    await mount({ jobs });
    const rows = container.querySelectorAll('[data-testid="my-work-order"]');
    expect(rows).toHaveLength(2);
    expect(container.textContent).toContain('My work orders (2)');
    expect(container.textContent).toContain('1003 Koehn St');
    expect(container.textContent).toContain('805 North Prospect Ave');
  });

  it('marks the bell\'s work orders seen when it opens', async () => {
    const seen = [];
    const on = (e) => seen.push(e.detail);
    window.addEventListener(ARRIVALS_SEEN_EVENT, on);
    await mount({ jobs: [job()] });
    window.removeEventListener(ARRIVALS_SEEN_EVENT, on);
    expect(seen.some((d) => d && Array.isArray(d.kinds) && d.kinds.includes('job-new'))).toBe(true);
  });

  it('Fixed writes the worker\'s own documentation on that job, and the list re-reads', async () => {
    const post = vi.fn(async () => ({ ok: true }));
    const onDone = vi.fn();
    await mount({ jobs: [job()], post, onDone });
    const fixed = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Fixed');
    await act(async () => { fixed.click(); });
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ request_id: job().id, instance_id: 'inst', rental_id: 'r-1', outcome: 'fixed' }));
    expect(onDone).toHaveBeenCalled();
    expect(container.textContent).toContain('Saved on the job.');
  });

  it('a refusal (pictures required) is said, not swallowed', async () => {
    const post = async () => ({ ok: false, reason: 'write-failed', error: 'This job needs pictures of the finished work before it is marked fixed.' });
    await mount({ jobs: [job({ proof_required: 'photos' })], post });
    expect(container.textContent).toContain('Pictures of the finished work are required');
    const fixed = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Fixed');
    await act(async () => { fixed.click(); });
    expect(container.textContent).toContain('needs pictures of the finished work');
  });

  it('offers "Open the door" only for a door the worker can open', async () => {
    await mount({ jobs: [job()], canOpen: () => false });
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Open the door')).toBe(false);
    act(() => root.unmount()); container.remove();
    await mount({ jobs: [job()], canOpen: () => true });
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Open the door')).toBe(true);
  });

  it('nothing assigned says so, and a failed read says so', async () => {
    await mount({ jobs: [], state: 'read-failed' });
    expect(container.textContent).toContain('Nothing is assigned to you right now');
    expect(container.textContent).toContain('could not be read just now (read-failed)');
  });

  it('a picture alone is documentation with no outcome', () => {
    expect(jobDocRow(job(), { imageData: 'data:image/jpeg;base64,xx' })).toMatchObject({ outcome: null, image_data: 'data:image/jpeg;base64,xx', request_id: job().id });
    expect(jobDocRow(job(), { outcome: 'bogus' }).outcome).toBeNull();
  });

  it('stands where a worker lands, and on any tab he cannot open', () => {
    expect(showsMyWork('doors')).toBe(true);
    expect(showsMyWork('jobs')).toBe(true);
    expect(showsMyWork('gallery')).toBe(false);
    expect(showsMyWork('gallery', true)).toBe(true);
  });
});

// ── 4. THE WIRING ───────────────────────────────────────────────────────────
describe('the module wires the list for a worker', () => {
  const src = readFileSync(join(HERE, '..', 'modules', 'properties', 'PropertiesApp.jsx'), 'utf8');
  it('reads the assigned jobs and renders them for the real field worker', () => {
    expect(src).toContain('loadMyAssignedWork(supabase)');
    expect(src).toMatch(/realRole === 'field_worker' && showsMyWork\(/);
    expect(src).toContain('jobs={openAssigned(assigned.jobs)}');
  });
  it('a person sent a job with no grant is still a field worker', () => {
    expect(src).toMatch(/if \(assigned\.jobs\.length > 0 && !rawRentals\.length && !seatIsOwner\(seat\)\) return 'field_worker';/);
  });
});
