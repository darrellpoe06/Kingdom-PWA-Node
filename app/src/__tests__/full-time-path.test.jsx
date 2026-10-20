// @vitest-environment jsdom
// =============================================================================
// The road to full time, and the next hire (DR-1135).
// Darrell, 2026-10-20: "The goal would be to have we able to work full-time
// inside PoeTech.... based on workloads and revenue... and to be able to keep
// hiring." Then: "Not church only... making apps for businesses and churches."
//
// PROVEN-TO-CATCH (DR-0076 §3): a blank never reads as zero; revenue from
// every line counts, not only churches; people are paid in order with their
// employer costs; a hire is needed on workload and paid for on revenue, and a
// hire needed before it is paid for is named.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fullTimePath, HIRE_AT_LOAD_PCT } from '../lib/full-time-path.js';
import FullTimePath from '../components/FullTimePath.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

// Platform $308.11; no reserve, no employer costs unless a test sets them.
const base = (over = {}) => ({
  lines: [
    { name: 'Churches', count: 0, priceCents: 20000, costCents: 0, hoursEach: 2 },
    { name: 'Apps built for others', count: 0, priceCents: 100000, costCents: 0, hoursEach: 20 },
  ],
  employerCostPct: 0,
  missionCents: 0,
  reservePct: 0,
  people: [
    { role: 'Darrell', monthlyPayCents: 500000, hoursPerMonth: 160 },
    { role: 'Christina', monthlyPayCents: 500000, hoursPerMonth: 160 },
  ],
  nextHire: { kind: '1099', monthlyPayCents: 300000, hoursPerMonth: 160 },
  ...over,
});

describe('the road to full time', () => {
  it('a blank is missing, never zero, and nothing is claimed', () => {
    const r = fullTimePath({ lines: [{ name: 'Churches', count: '', priceCents: 20000, costCents: '', hoursEach: '' }], people: [{ role: 'Darrell' }] });
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(['how many Churches', 'the running cost for Churches', 'the hours for Churches', 'employer costs (%)', 'what the mission work costs each month', "Darrell's full-time pay", "Darrell's hours a month"]);
    expect(r.allCovered).toBeUndefined();
  });

  it('with no people listed it says so', () => {
    expect(fullTimePath(base({ people: [] })).missing).toContain('who is going full time');
  });

  it('counts the churches needed for each person, paid in order', () => {
    // $5,000 + $308.11 platform; each church nets $200 → 27 churches; both → 52.
    const r = fullTimePath(base());
    expect(r.fullTimeCovered).toBe(0);
    expect(r.shortCents).toBe(1000000 + 30811);
    expect(r.eachFullTimeAt).toEqual([27, 52]);
    expect(r.allFullTimeAt).toBe(52);
  });

  it('every line counts: apps built for others pay toward the same payroll', () => {
    const r = fullTimePath(base({ lines: [
      { name: 'Churches', count: 10, priceCents: 20000, costCents: 0, hoursEach: 2 },
      { name: 'Apps built for others', count: 4, priceCents: 100000, costCents: 0, hoursEach: 20 },
    ] }));
    // $2,000 + $4,000 = $6,000 in; $308.11 out → $5,691.89 for people: Darrell yes, Christina not yet.
    expect(r.revenueCents).toBe(600000);
    expect(r.fullTimeCovered).toBe(1);
    // Growing the churches line: Christina needs $5,000 − $691.89 = $4,308.11 → 22 more.
    expect(r.eachFullTimeAt).toEqual([0, 22]);
    // Growing the apps line instead: 5 more builds.
    expect(fullTimePath({ ...base({ lines: [
      { name: 'Churches', count: 10, priceCents: 20000, costCents: 0, hoursEach: 2 },
      { name: 'Apps built for others', count: 4, priceCents: 100000, costCents: 0, hoursEach: 20 },
    ] }), growLine: 1 }).eachFullTimeAt).toEqual([0, 5]);
  });

  it('employer costs, running costs and the reserve all come out before pay', () => {
    const plain = fullTimePath(base()).eachFullTimeAt[0];
    expect(fullTimePath(base({ employerCostPct: 7.65 })).eachFullTimeAt[0]).toBeGreaterThan(plain);
    expect(fullTimePath(base({ reservePct: 20 })).eachFullTimeAt[0]).toBeGreaterThan(plain);
    const costly = base();
    costly.lines[0].costCents = 2000;
    expect(fullTimePath(costly).eachFullTimeAt[0]).toBeGreaterThan(plain);
  });

  it('the mission work the paid lines carry comes out before anyone is paid (DR-0018)', () => {
    // $2,000 of mission work a month = 10 more churches before the first person.
    expect(fullTimePath(base({ missionCents: 200000 })).eachFullTimeAt[0]).toBe(27 + 10);
  });

  it('a 1099 hire carries no employer costs; a W-2 hire does (DR-0021)', () => {
    const contractor = fullTimePath(base({ employerCostPct: 10 }));
    const employee = fullTimePath(base({ employerCostPct: 10, nextHire: { kind: 'w2', monthlyPayCents: 300000, hoursPerMonth: 160 } }));
    expect(employee.hireAffordableAt).toBeGreaterThan(contractor.hireAffordableAt);
  });

  it('a hire is needed on workload and paid for on revenue, and the gap is named', () => {
    // 320 payroll hours; 80% = 256 hours = 128 churches at 2 h. Paid for: $13,000 + $308.11 at $200 → 67.
    const r = fullTimePath(base());
    expect(HIRE_AT_LOAD_PCT).toBe(80);
    expect(r.hireNeededAt).toBe(128);
    expect(r.hireAffordableAt).toBe(67);
    expect(r.hireGap).toBe(0);
    // Heavy support (6 h a church): needed at 43, paid for at 67 → 24 churches of work without the money.
    const heavy = base();
    heavy.lines[0].hoursEach = 6;
    const h = fullTimePath(heavy);
    expect(h.hireNeededAt).toBe(43);
    expect(h.hireGap).toBe(24);
  });

  it('a price that can never cover the pay says so instead of looping', () => {
    const r = fullTimePath(base({ lines: [{ name: 'Churches', count: 0, priceCents: 1000, costCents: 1000, hoursEach: 1 }] }));
    expect(r.eachFullTimeAt).toEqual([null, null]);
    expect(r.hireAffordableAt).toBeNull();
    expect(r.hireGap).toBeNull();
  });
});

describe('the screen', () => {
  let host; let root;
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = () => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(FullTimePath)));
  };
  const type = (id, v) => act(() => {
    const el = host.querySelector(`#${id}`);
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  const status = () => host.querySelector('[role=status]').textContent;
  const fill = () => {
    ['0', '1', '2', '3', '4'].forEach((i) => { type(`ftp-count-${i}`, '0'); type(`ftp-price-${i}`, i === '0' ? '200' : '100'); type(`ftp-cost-${i}`, '0'); type(`ftp-hrs-${i}`, '1'); });
    type('ftp-employer', '0'); type('ftp-reserve', '0'); type('ftp-mission', '0');
    type('ftp-pay-0', '5000'); type('ftp-hours-0', '160'); type('ftp-pay-1', '5000'); type('ftp-hours-1', '160');
    type('ftp-hire-pay', '3000'); type('ftp-hire-hours', '160');
  };

  it('opens on the published prices and every other entry blank', () => {
    mount();
    expect(host.querySelector('#ftp-price-0').value).toBe('200');
    expect(host.querySelector('#ftp-price-1').value).toBe('249');
    expect(host.querySelector('#ftp-price-3').value).toBe('150');
    expect(host.querySelector('#ftp-line-4').value).toBe('Apps built this month');
    expect(host.querySelector('#ftp-price-4').value).toBe('2000');
    expect(host.querySelector('#ftp-hire-kind').value).toBe('1099');
    expect(status()).toMatch(/^Not yet known: enter how many Churches, the running cost for Churches/);
  });

  it('answers once everything is entered, for the line chosen to grow', () => {
    mount();
    fill();
    expect(status()).toBe('Today 0 of 2 can be paid full time; the payroll is $10,308.11 a month short.');
    expect(host.querySelector('[data-testid=ftp-milestones]').textContent).toContain('Darrell full time after 27 more churches');
    act(() => {
      const sel = host.querySelector('#ftp-grow');
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, '4');
      sel.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    expect(host.querySelector('[data-testid=ftp-milestones]').textContent).toContain('Darrell full time after 54 more apps built this month');
  });

  it('names the work outrunning the money', () => {
    mount();
    fill();
    type('ftp-hrs-0', '10');
    expect(host.querySelector('[data-testid=ftp-hire]').textContent).toMatch(/needed after 26 more churches and paid for after 67 more churches\. For 41 of those the work outruns the money/);
  });

  it('sits in Dev/Ops under the church cost to serve', () => {
    expect(readFileSync(join(SRC, 'components/DevOps.jsx'), 'utf8')).toMatch(/<ChurchCostToServe \/>\s*\n\s*<FullTimePath \/>/);
  });
});
