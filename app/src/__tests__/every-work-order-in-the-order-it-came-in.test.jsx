// @vitest-environment jsdom
// =============================================================================
// Every work order in the system, in the order it came in, with its notes (DR-1213)
// =============================================================================
// Darrell, 2026-10-22: "Where are the work orders in order that they came in
// with notes across the whole system?!" and "Work order triage". Measured
// first (work-orders-probe): the Real Estate Action Queue (incidents) held 4,
// Poe Properties (tenant_maintenance_requests) 0, and no surface showed the two
// together; Recent Activity is a mix of six. The fixtures below are made up.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { triageQueue, fromIncident, fromRequest, isClosed } from '../lib/work-order-triage.js';
import WorkOrderTriage from '../components/WorkOrderTriage.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(WorkOrderTriage, props)); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}
const all = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const one = (id) => container.querySelector(`[data-testid="${id}"]`);
const DOOR = '11111111-2222-4333-8444-555555555555';

const incident = (id, createdAt, extra = {}) => ({
  id, createdAt, date: createdAt.slice(0, 10), category: 'maintenance', urgency: 'incident', status: 'open',
  description: `fixture job ${id}`,
  lifecycle: { phase: 'open', log: [{ at: createdAt, fromPhase: null, toPhase: 'open', by: 'user', note: 'created' }] },
  ...extra,
});
const request = (id, created_at, extra = {}) => ({
  id, created_at, title: `fixture request ${id}`, status: 'submitted', priority: 'normal', rental_id: DOOR, detail: '', ...extra,
});

describe('one queue across the whole system, numbered by arrival', () => {
  const incidents = [
    incident('in-b', '2026-06-22T15:00:00Z', { lifecycle: { phase: 'open', log: [
      { at: '2026-06-22T15:00:00Z', fromPhase: null, toPhase: 'open', note: 'created' },
      { at: '2026-06-23T10:00:00Z', fromPhase: 'open', toPhase: 'open', note: 'dispatched to a fixture worker' },
    ] }, dispatch: { assignments: [{ id: 'a1', name: 'Fixture Worker' }] } }),
    incident('in-a', '2026-06-20T09:00:00Z', { status: 'resolved' }),
  ];
  const requests = [request('r1', '2026-10-01T12:00:00Z', { detail: 'the sink drips' })];
  const docs = [{ request_id: 'r1', outcome: 'fixed', note: 'washer replaced', created_at: '2026-10-02T08:00:00Z' }];
  const events = [{ subject: 'work', subject_id: 'r1', event: 'status', from_value: 'submitted', to_value: 'in-progress', detail: {}, at: '2026-10-01T18:00:00Z' }];
  const q = triageQueue({ incidents, requests, docs, events, doorLabelOf: ({ remoteId }) => (remoteId === DOOR ? 'Fixture Door' : '') });

  it('numbers every work order by the order it came in, across both stores', () => {
    expect(q.all.map((w) => [w.number, w.key])).toEqual([[1, 'inc-in-a'], [2, 'inc-in-b'], [3, 'req-r1']]);
  });
  it('lists the open work first, oldest first, and the closed after', () => {
    expect(q.open.map((w) => w.key)).toEqual(['inc-in-b', 'req-r1']);
    expect(q.closed.map((w) => w.key)).toEqual(['inc-in-a']);
  });
  it('PROVEN TO CATCH: a newest-first sort (the Recent Activity order) is not the order they came in', () => {
    const newestFirst = [...q.all].sort((a, b) => Date.parse(b.cameInAt) - Date.parse(a.cameInAt));
    expect(newestFirst.map((w) => w.number)).not.toEqual(q.all.map((w) => w.number));
  });
  it('carries every note, in time order, from each store', () => {
    expect(q.all[1].notes.map((n) => n.text)).toEqual(['came in', 'dispatched to a fixture worker']);
    expect(q.all[1].crew).toEqual(['Fixture Worker']);
    expect(q.all[2].notes.map((n) => n.text)).toEqual(['the sink drips', 'submitted → in-progress', 'job note: fixed · washer replaced']);
    expect(q.all[2].door).toBe('Fixture Door');
  });
  it('every incident is a work order, whatever its category', () => {
    expect(fromIncident(incident('x', '2026-07-01T00:00:00Z', { category: 'other' })).key).toBe('inc-x');
    expect(triageQueue({ incidents: [incident('x', '2026-07-01T00:00:00Z', { category: 'other' })] }).all).toHaveLength(1);
  });
  it('a closed status ends the work, in either store', () => {
    for (const s of ['resolved', 'declined', 'cancelled', 'closed']) expect(isClosed(s)).toBe(true);
    for (const s of ['open', 'submitted', 'scheduled', 'in-progress']) expect(isClosed(s)).toBe(false);
    expect(fromRequest(request('r2', '2026-10-03T00:00:00Z', { status: 'resolved', resolution_note: 'done' })).notes.at(-1).text).toBe('resolved: done');
  });
});

describe('the triage card says the truth about what it read', () => {
  const incidents = [incident('in-1', '2026-06-20T09:00:00Z')];
  it('shows both stores, numbered, and opens a work order to its notes', async () => {
    const load = async () => ({ ok: true, requests: [request('r9', '2026-10-05T10:00:00Z', { detail: 'fixture leak' })], docs: [], events: [], unreadable: [] });
    await mount({ incidents, rentals: [{ id: 'l1', remoteUuid: DOOR, name: 'Fixture Door' }], load });
    expect(all('work-order')).toHaveLength(2);
    expect(all('work-order-number').map((n) => n.textContent)).toEqual(['#1', '#2']);
    expect(one('work-order-summary').textContent).toMatch(/^2 open · 0 closed/);
    expect(all('work-order')[1].textContent).toContain('Fixture Door');
    const button = all('work-order')[1].querySelector('button');
    await act(async () => { button.click(); });
    expect(one('work-order-notes').textContent).toContain('fixture leak');
  });
  it('PROVEN TO CATCH: a Poe Properties read that failed is never shown as "none there"', async () => {
    const load = async () => ({ ok: false, reason: 'read-failed', error: 'permission denied' });
    await mount({ incidents, load });
    expect(one('work-order-unread').textContent).toMatch(/could not be read \(permission denied\).*not saying Poe Properties has none/);
    expect(all('work-order')).toHaveLength(1);
  });
  it('says it is reading while it reads', async () => {
    await mount({ incidents: [], load: () => new Promise(() => {}) });
    expect(one('work-order-reading')).toBeTruthy();
  });
});

describe('where it lives', () => {
  const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
  it('PROVEN TO CATCH: the card is loaded on its own, never into the shell chunk at the size limit', () => {
    for (const f of ['LifeHub.jsx', 'BigPictureDashboard.jsx']) {
      const src = read('components', f);
      expect(src, f).toMatch(/import WorkOrderTriage from '\.\/WorkOrderTriageLazy\.jsx';/);
      expect(src, f).not.toMatch(/from '\.\/WorkOrderTriage\.jsx'/);
    }
    expect(read('components', 'WorkOrderTriageLazy.jsx')).toMatch(/lazy\(\(\) => import\('\.\/WorkOrderTriage\.jsx'\)\)/);
  });
  it('on the Life Hub, under Recent Activity, and on Big Picture → Now', () => {
    expect(read('components', 'LifeHub.jsx')).toMatch(/<WorkOrderTriage incidents=\{data\.incidents \|\| \[\]\}/);
    expect(read('components', 'BigPictureDashboard.jsx')).toMatch(/id: 'work-orders',[\s\S]{0,120}<WorkOrderTriage incidents=\{incidents\} rentals=\{rentals\} /);
  });
  it('reads Poe Properties under the reader\'s own RLS, never scoped by the client', () => {
    const src = read('modules', 'properties', 'cloud.js');
    const fn = src.slice(src.indexOf('export async function loadAllWorkOrders'), src.indexOf('export async function confirmRent'));
    expect(fn).toMatch(/from\('tenant_maintenance_requests'\)\.select\('\*'\)\.order\('created_at', \{ ascending: true \}\)/);
    expect(fn).not.toMatch(/\.eq\('tenancy_id'/);
  });
});
