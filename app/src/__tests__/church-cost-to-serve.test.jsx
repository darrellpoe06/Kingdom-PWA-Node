// @vitest-environment jsdom
// =============================================================================
// A church's cost to serve is worked out before the offer (DR-1128).
// Darrell, 2026-10-20: "build in the cost to sustain their support before the
// offer... not ask for money afterwards because we didn't see we would need it."
//
// PROVEN-TO-CATCH (DR-0076 §3): a blank cost must never read as zero, "ready to
// offer" must need every cost and a price that covers it with its reserve, and
// a workflow quote must carry its support as well as its build.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  churchCostToServe, workflowQuote, giftOfMonths, dollars, MEASURED_PLATFORM_MONTHLY_CENTS, CHURCH_PRICE_CENTS, CHURCH_FLOOR_CENTS,
} from '../lib/church-cost-to-serve.js';
import ChurchCostToServe from '../components/ChurchCostToServe.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('the cost to serve one church', () => {
  it('starts from the measured platform cost, shared across the churches', () => {
    expect(MEASURED_PLATFORM_MONTHLY_CENTS).toBe(30811);
    expect(CHURCH_PRICE_CENTS).toBe(20000);
    expect(churchCostToServe({ churches: 2 }).lines[0].cents).toBe(15406);
    expect(churchCostToServe({ churches: 1 }).lines[0].cents).toBe(30811);
  });

  it('a cost nobody entered is missing, never zero, and nothing is claimed', () => {
    const r = churchCostToServe({ churches: 4 });
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(['support hours each month', 'the hourly rate for that time', 'compute each month', 'storage each month', 'hiring each month', 'devices for sovereignty']);
    expect(r.covers).toBeNull();
    expect(r.readyToOffer).toBe(false);
    expect(r.minimumPriceCents).toBeNull();
    expect(r.lines.slice(1).every((l) => l.cents === null)).toBe(true);
  });

  it('ready to offer only when every cost is known and the price covers it with its reserve', () => {
    // 4 churches: share $77.03; 1 h × $50 support; $10 compute; $5 storage; no hiring; no devices = $142.03; +20% = $170.44.
    const r = churchCostToServe({ churches: 4, supportHoursPerMonth: 1, hourlyRateCents: 5000, computeCentsPerMonth: 1000, storageCentsPerMonth: 500, hiringMonthlyCents: 0, devicesOneTimeCents: 0 });
    expect(r.knownCostCents).toBe(7703 + 5000 + 1000 + 500);
    expect(r.withReserveCents).toBe(Math.ceil(14203 * 1.2));
    // The arithmetic says $175, but $200 is the floor.
    expect(r.minimumPriceCents).toBe(20000);
    expect(r.readyToOffer).toBe(true);
    expect(r.marginCents).toBe(0);
  });

  it('a price that does not cover the support is not ready, and the shortfall is named', () => {
    const r = churchCostToServe({ churches: 2, supportHoursPerMonth: 3, hourlyRateCents: 5000, computeCentsPerMonth: 0, storageCentsPerMonth: 0, hiringMonthlyCents: 0, devicesOneTimeCents: 0 });
    expect(r.readyToOffer).toBe(false);
    expect(r.covers).toBe(false);
    expect(r.marginCents).toBeLessThan(0);
    expect(r.minimumPriceCents).toBeGreaterThan(20000);
  });

  it('zero is a real entry, not a blank', () => {
    const r = churchCostToServe({ churches: 10, supportHoursPerMonth: 0, hourlyRateCents: 0, computeCentsPerMonth: 0, storageCentsPerMonth: 0, hiringMonthlyCents: 0, devicesOneTimeCents: 0 });
    expect(r.complete).toBe(true);
    expect(r.readyToOffer).toBe(true);
  });

  it('$200 is the floor: a price under it is never ready, however cheap the arithmetic', () => {
    expect(CHURCH_FLOOR_CENTS).toBe(20000);
    const all0 = { churches: 50, supportHoursPerMonth: 0, hourlyRateCents: 0, computeCentsPerMonth: 0, storageCentsPerMonth: 0, hiringMonthlyCents: 0, devicesOneTimeCents: 0 };
    const r = churchCostToServe({ ...all0, priceCents: 15000 });
    expect(r.belowFloor).toBe(true);
    expect(r.readyToOffer).toBe(false);
    expect(r.minimumPriceCents).toBe(20000);
  });

  it('hiring and the devices for sovereignty are carried, shared across the churches', () => {
    // 5 churches: hiring $1,000/mo → $200 each; devices $3,600 over 36 months → $20 each.
    const r = churchCostToServe({ churches: 5, supportHoursPerMonth: 0, hourlyRateCents: 0, computeCentsPerMonth: 0, storageCentsPerMonth: 0, hiringMonthlyCents: 100000, devicesOneTimeCents: 360000, devicesMonths: 36 });
    expect(r.lines.find((l) => /Hiring/.test(l.label)).cents).toBe(20000);
    expect(r.lines.find((l) => /Devices/.test(l.label)).cents).toBe(2000);
    // Share $61.63 + $200 + $20 = $281.63; +20% = $337.96 → $340, above the floor.
    expect(r.readyToOffer).toBe(false);
    expect(r.minimumPriceCents).toBe(34000);
  });

  it('a gift of months is costed in full and leaves the price alone', () => {
    expect(giftOfMonths({ months: 3, costToServeCents: 17044 })).toEqual({ complete: true, months: 3, costCents: 51132 });
    expect(giftOfMonths({ months: 3, costToServeCents: null }).complete).toBe(false);
    expect(giftOfMonths({ months: '' , costToServeCents: 100 }).complete).toBe(false);
  });
});

describe('a workflow is quoted up front, build and support together', () => {
  it('missing pieces give no quote', () => {
    expect(workflowQuote({ buildHours: 10 })).toMatchObject({ complete: false, totalCents: null });
    expect(workflowQuote({ buildHours: 10, hourlyRateCents: 5000, supportHoursPerMonth: 1, months: 0 }).missing).toContain('how many months the support is priced for');
  });
  it('the price carries the support after it ships, not only the build', () => {
    // 10 h build + 1 h/month × 12 months at $50, +20% = $1,320.
    const q = workflowQuote({ buildHours: 10, hourlyRateCents: 5000, supportHoursPerMonth: 1, months: 12 });
    expect(q.buildCents).toBe(50000);
    expect(q.supportCents).toBe(60000);
    expect(q.totalCents).toBe(132000);
    expect(q.monthlyCents).toBe(11000);
    const buildOnly = workflowQuote({ buildHours: 10, hourlyRateCents: 5000, supportHoursPerMonth: 0, months: 12 });
    expect(q.totalCents).toBeGreaterThan(buildOnly.totalCents);
  });
  it('dollars() says "not entered" for an unknown', () => {
    expect(dollars(null)).toBe('not entered');
    expect(dollars(15406)).toBe('$154.06');
  });
});

describe('the screen', () => {
  let host; let root;
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = () => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(ChurchCostToServe)));
  };
  const type = (id, v) => act(() => {
    const el = host.querySelector(`#${id}`);
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  const status = () => host.querySelector('[role=status]').textContent;

  it('opens on the measured share, not ready, naming what is missing', () => {
    mount();
    expect(host.textContent).toContain('$308.11');
    expect(host.textContent).toContain('$154.06');
    expect(status()).toMatch(/^Not ready to offer: enter support hours each month, the hourly rate for that time, compute each month, storage each month, hiring each month, devices for sovereignty\./);
  });

  it('becomes ready only once every cost is entered and covered', () => {
    mount();
    type('cts-churches', '6');
    type('cts-hours', '1'); type('cts-rate', '40'); type('cts-compute', '5'); type('cts-hiring', '0');
    expect(status()).toMatch(/Not ready to offer: enter storage each month, devices for sovereignty/);
    type('cts-storage', '2'); type('cts-devices', '1800');
    expect(status()).toMatch(/^Ready to offer: \$200\.00 covers the cost to serve with \$[\d.,]+ a month to spare\./);
    type('cts-hours', '4');
    expect(status()).toMatch(/^Not ready to offer: \$200\.00 is \$[\d.,]+ a month short\./);
  });

  it('a price typed under the floor is refused by name', () => {
    mount();
    type('cts-price', '150');
    expect(status()).toBe('Not ready to offer: $150.00 is under the $200.00 floor for a church.');
  });

  it('a gift of months shows what it costs us', () => {
    mount();
    type('gift-months', '2');
    expect(host.querySelector('[data-testid=gift-cost]').textContent).toMatch(/not known until every cost above is entered/);
    type('cts-churches', '6'); type('cts-hours', '1'); type('cts-rate', '40'); type('cts-compute', '5'); type('cts-storage', '2'); type('cts-hiring', '0'); type('cts-devices', '0');
    expect(host.querySelector('[data-testid=gift-cost]').textContent).toMatch(/^A gift of 2 months costs us \$[\d.,]+\. The price stays \$200\.00 a month\.$/);
  });

  it('quotes a workflow with its support once the pieces are in', () => {
    mount();
    expect(host.querySelector('[data-testid=workflow-quote]').textContent).toMatch(/No quote yet/);
    type('cts-rate', '50'); type('wf-build', '10'); type('wf-support', '1');
    expect(host.querySelector('[data-testid=workflow-quote]').textContent).toContain('Quote: $1,320.00, or $110.00 a month for 12 months');
  });

  it('sits in Dev/Ops beside the pricing projections', () => {
    expect(readFileSync(join(SRC, 'components/DevOps.jsx'), 'utf8')).toMatch(/<ChurchCostToServe \/>/);
  });
});
