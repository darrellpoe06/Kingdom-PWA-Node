// @vitest-environment jsdom
// =============================================================================
// The church and its options are priced on the page (DR-1144; numbers DR-1128)
// =============================================================================
// Darrell, 2026-10-20, from the Paid tiers page: "I need the prices for church
// and other options like surveillance..." The card reads the ONE church price
// from the cost-to-serve model; the options strip says each option's price,
// what it rests on, and whether it can be had today.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { ChurchCard, ChurchOptions } from '../components/ChurchOffer.jsx';
import { CHURCH_TIER, CHURCH_OPTIONS, optionPriceLabel, churchMonthlyDollars } from '../lib/church-offer.js';
import { CHURCH_FLOOR_CENTS } from '../lib/church-cost-to-serve.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted = [];
function mount(type, props = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(type, props)); });
  mounted.push({ host, root });
  return host;
}
afterEach(() => {
  while (mounted.length) {
    const { host, root } = mounted.pop();
    act(() => root.unmount());
    host.remove();
  }
});
const byId = (host, id) => host.querySelector(`[data-testid="${id}"]`);

describe('the church price has one source', () => {
  it('the card\'s number IS the cost-to-serve floor (DR-1128), never a second number', () => {
    expect(CHURCH_TIER.monthlyCents).toBe(CHURCH_FLOOR_CENTS);
    expect(churchMonthlyDollars()).toBe('200');
  });

  it('the card says "from $200/mo", flat, no contract, 0% of giving, and shows no invented yearly rate', () => {
    const host = mount(ChurchCard, { onChoose: () => {} });
    const text = byId(host, 'church-card').textContent;
    expect(text).toMatch(/from\$200\/mo/);
    expect(text).not.toMatch(/\/yr/);
    expect(text).toContain('no contract · 0% of giving');
    expect(text).toContain('PoeTech takes 0%');
  });

  it('what $200 includes is everything a church already runs on (DR-1128 §2)', () => {
    const host = mount(ChurchCard, { onChoose: () => {} });
    const text = host.textContent;
    for (const line of CHURCH_TIER.includes) expect(text).toContain(line);
    expect(text).toContain('annual contribution statements');
    expect(text).toContain('Living Lessons catalog');
  });

  it('the terms say free only where we do no work, and that the price is the higher of $200 and the cost to serve', () => {
    const host = mount(ChurchCard, { onChoose: () => {} });
    const terms = byId(host, 'church-terms').textContent;
    expect(terms).toContain('Free where PoeTech does no work');
    expect(terms).toContain('higher of $200 and the whole cost to serve');
    expect(terms).toContain('Cancel any month');
  });

  it('Subscribe hands the cart the church tier at $200 a month', () => {
    const got = [];
    const host = mount(ChurchCard, { onChoose: (t) => got.push(t) });
    const button = [...host.querySelectorAll('button')].find((b) => /subscribe/i.test(b.textContent));
    expect(button).toBeTruthy();
    act(() => { button.click(); });
    expect(got).toHaveLength(1);
    expect(got[0].name).toBe('Church · Supported');
    expect(got[0].monthly).toBe('200');
  });
});

describe('the options above any tier are each a fixed written amount (DR-1128 §7)', () => {
  it('every option says what it is and what its number rests on; a price is a number or "quoted up front", never blank', () => {
    expect(CHURCH_OPTIONS.length).toBe(3);
    for (const o of CHURCH_OPTIONS) {
      expect(o.what.length).toBeGreaterThan(20);
      expect(o.basis.length).toBeGreaterThan(20);
      expect(optionPriceLabel(o)).not.toBe('');
      if (o.priceCents === null) expect(optionPriceLabel(o)).toBe('quoted up front');
      else expect(optionPriceLabel(o)).toMatch(/^\$\d+ /);
    }
  });

  it('cameras: $10 a camera a month, for a church or a household, and NOT sold until proven on our own cameras', () => {
    const cams = CHURCH_OPTIONS.find((o) => o.key === 'cameras');
    expect(optionPriceLabel(cams)).toBe('$10 a camera a month');
    expect(cams.available).toBe(false);
    expect(cams.forWhom).toEqual(['church', 'household']);
    const host = mount(ChurchOptions);
    const tile = byId(host, 'tier-option-cameras').textContent;
    expect(tile).toContain('$10 a camera a month');
    expect(tile).toContain('ships next');
    expect(tile).toContain("Not sold yet: offered once proven on PoeTech's own cameras");
    expect(tile).toContain('$3–10 a camera a month');
  });

  it('the minister\'s own lessons: $50 a month, available now', () => {
    const o = CHURCH_OPTIONS.find((x) => x.key === 'ministers-lessons');
    expect(optionPriceLabel(o)).toBe('$50 a month');
    expect(o.available).toBe(true);
    const host = mount(ChurchOptions);
    expect(byId(host, 'tier-option-ministers-lessons').textContent).toContain('available now');
  });

  it('a workflow built for one church is quoted up front and joins the base when it ships (DR-1128 §4)', () => {
    const host = mount(ChurchOptions);
    const tile = byId(host, 'tier-option-built-for-you').textContent;
    expect(tile).toContain('quoted up front');
    expect(tile).toContain('joins the base for every church');
  });

  it('the strip is a labelled section a screen reader can land on', () => {
    const host = mount(ChurchOptions);
    const section = byId(host, 'tier-options');
    expect(section.tagName).toBe('SECTION');
    const labelledBy = section.getAttribute('aria-labelledby');
    expect(host.querySelector(`#${labelledBy}`).textContent).toMatch(/Options · above any tier/);
  });
});
