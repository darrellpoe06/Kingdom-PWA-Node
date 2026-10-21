// =============================================================================
// The Real Estate door opens on the portfolio, not on a label (DR-1163)
// =============================================================================
// Darrell, 2026-10-21 at 01:35, on his phone: "real estate needs a makeover
// too... it looks bland... boring..."
//
// Measured first, in a real Chromium against the built dist at 360px: the tab
// opened on a 10px grey "PROPERTIES · N" label and a stack of near-identical
// white cards — no figure about the portfolio on the first screen, while the
// door count, the mortgage debt, the monthly P&I and this month's collected
// rent all existed one tab over.
//
// These gates hold the fix to its own standard: every number on the door comes
// off a real row, an unknown month is SAID rather than drawn as zero, and the
// band that is tapped opens exactly the doors it counted.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { doorState, ATTENTION_BANDS } from '../lib/real-estate-door.js';
import RealEstateDoor from '../components/RealEstateDoor.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A small, real-shaped portfolio: three paying doors, one behind, one empty,
// one still missing its mortgage figure, plus the family's own home.
const ROWS = [
  { id: 'a', name: '1402 Maple St', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.5, monthlyPI: 556, escrow: 180 } },
  { id: 'b', name: '1517 Oak Ave', rent: 1200, actual: 1200, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 90000, rate: 6.5, monthlyPI: 570, escrow: 180 } },
  { id: 'c', name: '1521 Oak Ave', rent: 1400, actual: 550, status: 'late', entityId: 'e-poeprops', mortgage: { balance: 110000, rate: 6.5, monthlyPI: 695, escrow: 220 } },
  { id: 'd', name: '312 Willow Ln', rent: 950, actual: 0, status: 'vacant', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.5, monthlyPI: 506, escrow: 170 } },
  { id: 'e', name: '818 Birch St', rent: 1250, actual: 1250, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 0, rate: 0, monthlyPI: 0, escrow: 0 } },
  { id: 'home', name: 'Our house', rent: 0, actual: 0, status: 'owner-occupied', propertyType: 'primary-home', entityId: 'e-personal', mortgage: { balance: 140000, rate: 5.5, monthlyPI: 800, escrow: 300 } },
];
const ENTITIES = [{ id: 'e-poeprops', name: 'Steward Real Estate LLC' }, { id: 'e-personal', name: 'Personal' }];
const LEDGER = { received: 2300, expected: 4700, percent: 49, doors: 4, doorsPaid: 2, doorsPartial: 1, doorsUnpaid: 1 };

describe('the door reads the real rows', () => {
  it('counts the rental doors and names the business that owns them', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES });
    expect(s.doors).toBe(5);           // the family home is not a door
    expect(s.properties).toBe(5);
    expect(s.personal).toBe(1);
    expect(s.label).toBe('Steward Real Estate LLC');
  });

  it('sums only the figures that are on the rows, and says how many are entered', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES });
    const by = Object.fromEntries(s.holds.map((h) => [h.key, h]));
    expect(by.rent.value).toBe(1100 + 1200 + 1400 + 950 + 1250);
    expect(by.pi.value).toBe(556 + 570 + 695 + 506);
    expect(by.debt.value).toBe(88000 + 90000 + 110000 + 80000);
    expect(by.net.value).toBe(by.rent.value - by.pi.value);
    // One door has no mortgage figure, so the debt cell says what it counted.
    expect(by.debt.sub).toBe('4 of 5 entered');
    expect(by.rent.sub).toBe(null); // every door has a rent
  });

  it('counts what wants a person off the rows themselves', () => {
    const s = doorState({
      rentals: ROWS, entities: ENTITIES,
      incidents: [
        { id: 'i1', status: 'open', linkedTo: { type: 'rental', id: 'b' } },
        { id: 'i2', status: 'resolved', linkedTo: { type: 'rental', id: 'a' } },
        { id: 'i3', status: 'open', linkedTo: { type: 'rental', id: 'home' } }, // not a rental door
      ],
    });
    const by = Object.fromEntries(s.attention.map((b) => [b.key, b]));
    expect(by.late.count).toBe(1);
    expect(by.late.ids).toEqual(['c']);
    expect(by.vacant.ids).toEqual(['d']);
    expect(by.incident.ids).toEqual(['b']);   // resolved and personal are not counted
    expect(by.needsDebt.ids).toEqual(['e']);
    expect(by.rehab).toBeUndefined();         // a band with nothing in it never shows
    expect(s.allClear).toBe(false);
  });

  it('says all clear only when every door really is', () => {
    const clean = ROWS.filter((r) => ['a', 'b'].includes(r.id));
    const s = doorState({ rentals: clean, entities: ENTITIES });
    expect(s.attention).toEqual([]);
    expect(s.allClear).toBe(true);
  });

  it('every band it can show is one the person can read', () => {
    for (const b of ATTENTION_BANDS) {
      expect(typeof b.label).toBe('string');
      expect(b.label.length).toBeGreaterThan(2);
    }
  });
});

describe('a month the ledger cannot speak for is said, never drawn as zero', () => {
  it('reports the ledger when there is one', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, paidRollup: LEDGER });
    expect(s.collected.known).toBe(true);
    expect(s.collected.received).toBe(2300);
    expect(s.collected.doorsPaid).toBe(2);
    // Four of five doors have a lease the ledger can read — it says so.
    expect(s.collected.note).toBe('4 of 5 doors have a lease the ledger can read');
  });

  it('with no synced lease, known is false and the reason is in words', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, paidRollup: { doors: 0, received: 0, expected: 0, percent: 0 } });
    expect(s.collected.known).toBe(false);
    expect(s.collected.percent).toBe(0);
    expect(s.collected.note).toMatch(/No lease is synced yet/);
  });

  it('with no property at all, it says that instead', () => {
    const s = doorState({ rentals: [], entities: ENTITIES });
    expect(s.collected.known).toBe(false);
    expect(s.collected.note).toBe('No property is on the books yet.');
  });

  it('a lease covering every door adds no qualifier', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, paidRollup: { ...LEDGER, doors: 5 } });
    expect(s.collected.note).toBe(null);
  });
});

describe('the payoff line comes off the real mortgage rows', () => {
  it('carries the projection and whether it lands inside the seventh year', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, snowball: { allClearedYears: 6.4, allClearedDate: "Mar '33" } });
    expect(s.clear).toEqual({ years: 6.4, date: "Mar '33", bySeven: true });
    const past = doorState({ rentals: ROWS, entities: ENTITIES, snowball: { allClearedYears: 11.2, allClearedDate: "Dec '37" } });
    expect(past.clear.bySeven).toBe(false);
  });

  it('shows nothing rather than a guess when there is no projection or no debt', () => {
    expect(doorState({ rentals: ROWS, entities: ENTITIES }).clear).toBe(null);
    const noDebt = ROWS.filter((r) => r.id === 'e');
    expect(doorState({ rentals: noDebt, entities: ENTITIES, snowball: { allClearedYears: 3 } }).clear).toBe(null);
  });
});

// --- the rendered band ------------------------------------------------------
const mounted = [];
function mount(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(el); });
  mounted.push({ host, root });
  return host;
}
afterEach(() => {
  while (mounted.length) { const m = mounted.pop(); act(() => m.root.unmount()); m.host.remove(); }
});

describe('the band on screen says what the rows say', () => {
  const state = () => doorState({
    rentals: ROWS, entities: ENTITIES, paidRollup: LEDGER,
    incidents: [{ id: 'i1', status: 'open', linkedTo: { type: 'rental', id: 'b' } }],
    snowball: { allClearedYears: 6.4, allClearedDate: "Mar '33" },
  });

  it('opens on the door count and the owner, not a 10px label', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    const h = host.querySelector('h2');
    expect(h.textContent).toContain('5 doors');
    expect(host.textContent).toContain('Steward Real Estate LLC');
  });

  it('shows this month against the ledger', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    const strip = host.querySelector('[data-testid="re-door-collected"]');
    expect(strip).toBeTruthy();
    expect(strip.textContent).toContain('$2,300');
    expect(strip.textContent).toContain('2 of 4');
  });

  it('with no lease it prints the reason and draws no bar', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, paidRollup: { doors: 0 } });
    const host = mount(createElement(RealEstateDoor, { state: s }));
    expect(host.querySelector('[data-testid="re-door-collected"]')).toBe(null);
    expect(host.querySelector('[data-testid="re-door-collected-unknown"]').textContent).toMatch(/No lease is synced yet/);
  });

  it('a band is a button that reports which doors it means', () => {
    let got = 'untouched';
    const host = mount(createElement(RealEstateDoor, { state: state(), onFocus: (k) => { got = k; } }));
    const late = host.querySelector('[data-testid="re-door-focus-late"]');
    expect(late.textContent).toContain('1');
    expect(late.textContent).toContain('behind on rent');
    act(() => { late.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(got).toBe('late');
  });

  it('a focused band offers the way back to every door', () => {
    let got = 'untouched';
    const host = mount(createElement(RealEstateDoor, { state: state(), focus: 'late', onFocus: (k) => { got = k; } }));
    expect(host.querySelector('[data-testid="re-door-focus-late"]').getAttribute('aria-pressed')).toBe('true');
    const back = host.querySelector('[data-testid="re-door-show-all"]');
    act(() => { back.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(got).toBe(null);
  });

  it('quotes Proverbs 27:23 exactly as it is written', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    expect(host.textContent).toContain('Be thou diligent to know the state of thy flocks, and look well to thy herds.');
    expect(host.textContent).toContain('Proverbs 27:23');
  });

  it('marks nothing with true red — the Blood keeps that color (DR-0099)', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    const html = host.innerHTML;
    expect(html).not.toMatch(/#(FF0000|F00|E00000|D00000|CC0000|FF2|FF3)[0-9A-F]*/i);
    expect(html).not.toMatch(/\btext-red-|\bbg-red-|\bborder-red-/);
  });

  it('every tap target on the band is at least 44px tall', () => {
    const host = mount(createElement(RealEstateDoor, { state: state(), focus: 'late' }));
    const buttons = [...host.querySelectorAll('button')];
    expect(buttons.length).toBeGreaterThan(1);
    for (const b of buttons) expect(b.className, b.textContent).toMatch(/min-h-\[44px\]/);
  });
});

describe('PROVEN-TO-CATCH: a painted figure would be named', () => {
  it('the door never shows a number the rows do not carry', () => {
    // Break the rows: drop every rent. A door that painted its own total would
    // still print the old figure; this one must follow the rows down to zero.
    const stripped = ROWS.map((r) => ({ ...r, rent: 0 }));
    const s = doorState({ rentals: stripped, entities: ENTITIES });
    const by = Object.fromEntries(s.holds.map((h) => [h.key, h]));
    expect(by.rent.value).toBe(0);
    expect(by.rent.sub).toBe('0 of 5 entered');
    expect(s.attention.find((b) => b.key === 'needsRent').count).toBe(5);
  });
});

// =============================================================================
// The band's own colors, measured in every theme (DR-0076 §4)
// =============================================================================
// Not a claim: the repo's own contrast math over the real theme CSS, on the
// exact token/background pairs this band renders. The first draft used the
// urgency amber #D97706 the incident row uses and measured 3.08-3.19:1 on the
// card in ten of eleven themes; it was replaced with the tracked blue rather
// than shipped with a comment saying AA. This case keeps that honest.
describe('every pair the band renders clears WCAG 2.1 AA in every theme', () => {
  it('measures, it does not claim', async () => {
    const { parseThemes, contrastRatio } = await import('../../../scripts/contrast-guard.mjs');
    const root = join(process.cwd(), '..');
    const css = readFileSync(join(root, 'app/src/poe-financial-mvp-v28.jsx'), 'utf8')
      + '\n' + readFileSync(join(root, 'app/src/lib/theme-css.js'), 'utf8');
    const themes = parseThemes(css);
    expect(Object.keys(themes).length).toBeGreaterThan(5);

    // fg slot → the background slot it actually sits on in RealEstateDoor.jsx.
    // Only the rent-this-month strip is the cream base; everything else is the
    // white card.
    const PAIRS = [
      ['headline ink on the card', 'textPrimary', 'cardBg'],
      ['eyebrow rust on the card', 'accentRust', 'cardBg'],
      ['hold green on the card', 'accentGreen', 'cardBg'],
      ['hold rust on the card', 'accentRust', 'cardBg'],
      ['hold label grey on the card', 'textSecondary', 'cardBg'],
      ['band blue on the card', 'accentBlue', 'cardBg'],
      ['verse grey on the card', 'textSecondary', 'cardBg'],
      ['show-all rust on the card', 'accentRust', 'cardBg'],
      ['ledger line ink on the strip', 'textPrimary', 'baseBg'],
      ['ledger grey on the strip', 'textSecondary', 'baseBg'],
    ];
    const below = [];
    for (const [name, t] of Object.entries(themes)) {
      for (const [what, fg, bg] of PAIRS) {
        const r = contrastRatio(t[fg], t[bg]);
        if (!(r >= 4.5)) below.push(`${name} · ${what}: ${r == null ? 'unparseable' : r.toFixed(2)}:1 (${t[fg]} on ${t[bg]})`);
      }
    }
    expect(below, below.join('\n')).toEqual([]);
  });

  it('refuses the amber that was measured and rejected', () => {
    // A regression here would be silent on screen and loud nowhere else.
    const src = readFileSync(join(process.cwd(), 'src/components/RealEstateDoor.jsx'), 'utf8');
    const tones = src.slice(src.indexOf('const TONE_TEXT'), src.indexOf('const TONE_EDGE'));
    expect(tones).not.toContain('#D97706');
  });
});
