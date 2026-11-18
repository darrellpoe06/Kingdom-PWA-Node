// Every door at once (DR-1530). Darrell, 2026-11-18: "I need to see all at the
// same time in a list... each property with the latest everything... like
// messages... work orders". These pin the roll-up and the tab that shows it.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  portfolioRows,
  sortPortfolio,
  portfolioTotals,
  allOpenWork,
  latestFeed,
  activeOnly,
  tenancyToRental,
  UNTIED,
} from '../modules/properties/portfolio.js';
import PortfolioTab from '../modules/properties/PortfolioTab.jsx';
import { MANAGER_TABS } from '../modules/properties/model.js';

const NOW = Date.parse('2026-11-18T12:00:00Z');
const rentals = [
  { id: 'r-holly', slug: '1508-holly-hill', address: '1508 Holly Hill', city: 'Danville', state: 'IL' },
  { id: 'r-prosp', slug: '805-prospect-apt-2', address: '805 N Prospect', unit: 'Apt 2' },
  { id: 'r-quiet', slug: 'quiet', address: '10 Quiet Ln' },
];
const tenancies = [
  { id: 't-prosp', rental_ref: '805-prospect-apt-2', status: 'active', tenant_name: 'A. Tenant' },
  { id: 't-byid', rental_ref: 'r-holly', status: 'ended' },
];
const requests = [
  { id: 'w1', rental_id: 'r-holly', title: 'Furnace out', status: 'submitted', priority: 'urgent', created_at: '2026-11-10T00:00:00Z' },
  { id: 'w2', tenancy_id: 't-prosp', title: 'Drip under sink', status: 'scheduled', priority: 'normal', created_at: '2026-11-15T00:00:00Z' },
  { id: 'w3', tenancy_id: 't-prosp', title: 'Old fan', status: 'resolved', priority: 'normal', created_at: '2026-10-01T00:00:00Z' },
  { id: 'w4', tenancy_id: 't-gone', title: 'Orphan job', status: 'received', priority: 'low', created_at: '2026-11-01T00:00:00Z' },
];
const messages = [
  { id: 'm1', tenancy_id: 't-prosp', from_role: 'landlord', body: 'We will come Tuesday', sent_at: '2026-11-16T00:00:00Z' },
  { id: 'm2', tenancy_id: 't-prosp', from_role: 'tenant', body: 'Still dripping, please', sent_at: '2026-11-18T09:00:00Z' },
  { id: 'm3', tenancy_id: 't-byid', from_role: 'landlord', body: 'Keys returned', sent_at: '2026-11-01T00:00:00Z' },
];
const rent = [{ id: 'p1', tenancy_id: 't-prosp', amount: 900, status: 'reported', reported_at: '2026-11-02T00:00:00Z' }];
const data = { rentals, tenancies, requests, messages, rent, now: NOW };

describe('the roll-up across every door', () => {
  it('maps a tenancy to its door by slug OR id', () => {
    const m = tenancyToRental(tenancies, rentals);
    expect(m.get('t-prosp')).toBe('r-prosp');
    expect(m.get('t-byid')).toBe('r-holly');
  });

  it('gives each door its open work, latest message and payments to confirm', () => {
    const rows = portfolioRows(data);
    const p = rows.find((r) => r.id === 'r-prosp');
    expect(p.openCount).toBe(1); // the resolved fan is not open
    expect(p.latestMessage.id).toBe('m2');
    expect(p.awaitingReply).toBe(true); // the tenant spoke last
    expect(p.toConfirm).toBe(1);
    expect(p.tenant).toBe('A. Tenant');
    const h = rows.find((r) => r.id === 'r-holly');
    expect(h.urgentCount).toBe(1);
    expect(h.oldestOpenDays).toBe(8);
    expect(h.awaitingReply).toBe(false); // the family spoke last
  });

  it('PROVEN-TO-CATCH: a record with no door is never dropped — the totals equal the rows', () => {
    const rows = portfolioRows(data);
    const untied = rows.find((r) => r.id === UNTIED);
    expect(untied.open.map((w) => w.id)).toEqual(['w4']);
    const t = portfolioTotals(rows);
    expect(t.open).toBe(3);
    expect(t.open).toBe(requests.filter((r) => r.status !== 'resolved').length);
    expect(t.doors).toBe(3); // the untied row is not a door
  });

  it('a preview (strict) leaves out what the cut doors do not hold', () => {
    const rows = portfolioRows({ ...data, strict: true });
    expect(rows.some((r) => r.id === UNTIED)).toBe(false);
    expect(latestFeed({ ...data, strict: true }).some((i) => i.doorId === UNTIED)).toBe(false);
  });

  it('sorts by what needs him first, and by every other key', () => {
    const rows = portfolioRows(data);
    expect(sortPortfolio(rows, 'attention')[0].id).toBe('r-holly'); // urgent outranks a waiting reply
    expect(sortPortfolio(rows, 'messages')[0].id).toBe('r-prosp');
    expect(sortPortfolio(rows, 'recent')[0].id).toBe('r-prosp');
    expect(sortPortfolio(rows, 'name').map((r) => r.label)[0]).toBe('10 Quiet Ln');
    expect(activeOnly(rows).some((r) => r.id === 'r-quiet')).toBe(false);
  });

  it('lists every open work order across doors, most pressing first, and a mixed latest feed', () => {
    const work = allOpenWork(portfolioRows(data));
    expect(work.map((w) => w.id)).toEqual(['w1', 'w2', 'w4']);
    const feed = latestFeed(data, 3);
    expect(feed[0]).toMatchObject({ kind: 'message', id: 'm-m2', doorId: 'r-prosp' });
    expect(feed).toHaveLength(3);
  });
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.removeChild(host);
});
const mount = async (props) => {
  await act(async () => {
    root.render(createElement(PortfolioTab, { rentals, tenancies, now: NOW, ...props }));
  });
};
const $ = (id) => host.querySelector(`[data-testid="${id}"]`);
const $$ = (id) => [...host.querySelectorAll(`[data-testid="${id}"]`)];
async function settle(done, ms = 3000) {
  const end = Date.now() + ms;
  while (!done() && Date.now() < end)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
}
const click = async (el) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};
const byText = (scope, re) => [...scope.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('the Overview tab', () => {
  it('is on the landlord and manager face', () => {
    expect(MANAGER_TABS.map((t) => t.id)).toContain('overview');
  });

  it('shows every door with its latest, and a tap opens that door on the tab that holds it', async () => {
    const onOpen = vi.fn();
    const load = vi.fn().mockResolvedValue({ ok: true, requests, messages, rent, unreadable: [] });
    await mount({ load, onOpen });
    await settle(() => $('portfolio-rows'));
    const rows = $$('portfolio-row');
    expect(rows[0].textContent).toContain('1508 Holly Hill'); // attention order
    expect($('portfolio-kpis').textContent).toContain('Open work3');
    expect($$('portfolio-row-awaiting')).toHaveLength(1);
    await click(byText(host, /Still dripping/));
    expect(onOpen).toHaveBeenCalledWith('r-prosp', 'thread');
    await click($('portfolio-view-work'));
    const list = $('portfolio-open-work');
    expect(list.querySelectorAll('li')).toHaveLength(3);
    await click(byText(list, /Furnace out/));
    expect(onOpen).toHaveBeenLastCalledWith('r-holly', 'board');
  });

  it('PROVEN-TO-CATCH: a failed read never reads as zero', async () => {
    await mount({ load: vi.fn().mockResolvedValue({ ok: false, reason: 'read-failed' }) });
    await settle(() => $('portfolio-failed'));
    expect($('portfolio-failed')).toBeTruthy();
    expect($('portfolio-kpis')).toBeNull();
  });

  it('names a part that could not be read', async () => {
    await mount({ load: vi.fn().mockResolvedValue({ ok: true, requests, messages: [], rent: [], unreadable: ['messages'] }) });
    await settle(() => $('portfolio-unread'));
    expect($('portfolio-unread').textContent).toContain('messages');
  });

  it('a read that never answers is bounded, not a frozen tab', async () => {
    await mount({ load: () => new Promise(() => {}), timeoutMs: 30 });
    await settle(() => $('portfolio-failed'));
    expect($('portfolio-failed')).toBeTruthy();
  });
});
