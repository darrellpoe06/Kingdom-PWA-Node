// =============================================================================
// The Real Estate door opens on the portfolio, not on a label (DR-1169)
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
    // One door has no mortgage figure, so BOTH the owed-balance and the
    // monthly-note cells say what they counted rather than letting the blank
    // pass as a confident $0 (the bug on Darrell's phone: 11 doors read
    // "Mortgage a month $0" with no caveat — see DR-0076 §8).
    expect(by.debt.sub).toBe('4 of 5 entered');
    expect(by.pi.sub).toBe('4 of 5 entered');
    expect(by.rent.sub).toBe(null); // every door has a rent
    // "Left after the note" is overstated while a mortgage is missing (the
    // missing note sums as $0), so it flags that it is a before-the-figures
    // number instead of presenting the inflated net as final.
    expect(by.net.sub).toBe('before every figure is in');
  });

  it('drops the caveats once every mortgage figure is in (honest, not noisy)', () => {
    const complete = ROWS.map((r) => (r.id === 'e'
      ? { ...r, mortgage: { balance: 75000, rate: 6.5, monthlyPI: 475, escrow: 150 } }
      : r));
    const s = doorState({ rentals: complete, entities: ENTITIES });
    const by = Object.fromEntries(s.holds.map((h) => [h.key, h]));
    expect(by.pi.sub).toBe(null);   // all five mortgages entered
    expect(by.debt.sub).toBe(null);
    expect(by.net.sub).toBe(null);  // the net is now a real figure
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

  it('assigns no color meaning to the Word, and adds no red of its own (DR-0099)', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    // The verse rides --pp-muted, never the brand red: no color meaning is
    // attached to Scripture on this surface.
    const verse = host.querySelector('.pp-verse');
    expect(verse.className).not.toMatch(/pp-red/);
    expect(verse.textContent).toContain('Be thou diligent');
    // The band itself introduces no color literal; every color it uses is a
    // --pp-* token the shared stylesheet owns and remaps for midnight.
    const own = readFileSync(join(process.cwd(), 'src/components/RealEstateDoor.jsx'), 'utf8');
    expect(own).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('every tap target on the band is at least 44px tall', () => {
    const host = mount(createElement(RealEstateDoor, { state: state(), focus: 'late' }));
    const buttons = [...host.querySelectorAll('button')];
    expect(buttons.length).toBeGreaterThan(1);
    // jsdom lays nothing out, so the height is read where it is declared: the
    // shared stylesheet, in the ts-fixed unit every other control there uses.
    const css = readFileSync(join(process.cwd(), 'src/components/PoePropertiesWelcome.jsx'), 'utf8');
    expect(css).toMatch(/\.pp-band\{[^}]*min-height:calc\(2\.75 \* var\(--ts-fixed,1rem\)\)/);
    expect(css).toMatch(/\.pp-back\{[^}]*min-height:calc\(2\.75 \* var\(--ts-fixed,1rem\)\)/);
    for (const b of buttons) expect(b.className, b.textContent).toMatch(/pp-band|pp-back/);
  });

  it('wears the Poe Properties face by using its stylesheet, not a copy of it', () => {
    const host = mount(createElement(RealEstateDoor, { state: state() }));
    const scope = host.querySelector('[data-testid="real-estate-door-scope"]');
    expect(scope.className).toContain('pp-door');
    expect(host.querySelector('style').textContent).toContain('--pp-red');
    expect(host.querySelectorAll('.pp-panel').length).toBeGreaterThan(2);
    // Inside the Poe Properties app the host already is a .pp-door, so the
    // island does not declare the palette or the stylesheet twice.
    const inside = mount(createElement(RealEstateDoor, { state: state(), scoped: false }));
    expect(inside.querySelector('style')).toBe(null);
    expect(inside.querySelector('[data-testid="real-estate-door"]')).toBeTruthy();
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
// The band's own colors, measured in both themes the stylesheet defines
// =============================================================================
// Not a claim: the repo's own WCAG math over the --pp-* tokens read straight
// out of the shared stylesheet, so a drift in either palette is MEASURED here
// rather than assumed. The first draft of this band used the urgency amber
// #D97706 the incident row uses and measured 3.08-3.19:1 on the card in ten of
// eleven app themes; it was replaced rather than shipped under a comment
// claiming AA, which is the exact failure DR-0076 was written about.
describe('every pair the band renders clears WCAG 2.1 AA in both themes', () => {
  const css = () => readFileSync(join(process.cwd(), 'src/components/PoePropertiesWelcome.jsx'), 'utf8');
  const tokensIn = (src, needle) => {
    const i = src.indexOf(needle);
    expect(i, `missing block: ${needle}`).toBeGreaterThan(-1);
    const seg = src.slice(i, src.indexOf('}', i));
    const out = {};
    for (const m of seg.matchAll(/--(pp-[a-z-]+):(#[0-9A-Fa-f]{6})/g)) out[m[1]] = m[2];
    return out;
  };

  it('measures, it does not claim', async () => {
    const { contrastRatio } = await import('../../../scripts/contrast-guard.mjs');
    const src = css();
    const light = { ...tokensIn(src, '.pp-door{'), ...tokensIn(src, '.pp-door{--pp-good') };
    const midnight = {
      ...light,
      ...tokensIn(src, '[data-theme="midnight"].pp-door{'),
      ...tokensIn(src, '[data-theme="midnight"].pp-door{--pp-good'),
    };
    // Every foreground this band paints, on the panel it actually sits on.
    const FG = ['pp-ink', 'pp-muted', 'pp-red', 'pp-good', 'pp-watch'];
    const below = [];
    for (const [name, pal] of [['light', light], ['midnight', midnight]]) {
      for (const fg of FG) {
        const r = contrastRatio(pal[fg], pal['pp-card']);
        if (!(r >= 4.5)) below.push(`${name} · ${fg}: ${r == null ? 'unparseable' : r.toFixed(2)}:1 (${pal[fg]} on ${pal['pp-card']})`);
      }
    }
    expect(below, below.join('\n')).toEqual([]);
  });

  it('the two accents it added carry a midnight remap, so neither goes dark-on-dark', () => {
    const src = css();
    expect(src).toMatch(/\.pp-door\{--pp-good:#[0-9A-Fa-f]{6};--pp-watch:#[0-9A-Fa-f]{6}\}/);
    expect(src).toMatch(/\[data-theme="midnight"\]\.pp-door\{--pp-good:#[0-9A-Fa-f]{6};--pp-watch:#[0-9A-Fa-f]{6}\}/);
  });

  it('refuses the amber that was measured and rejected', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/RealEstateDoor.jsx'), 'utf8');
    expect(src).not.toContain('#D97706');
  });
});

// =============================================================================
// The level of service, on record (Darrell 2026-10-21)
// =============================================================================
// "If a potential tenant uses the app they will be able to see the level of
// services that were provided by us." A trust figure is the last place a
// painted number belongs, so every one of these is counted off a row that
// already exists, and an incident that cannot be TIMED is excluded from the
// typical figure and said out loud rather than averaged in.
describe('the service line counts the record, and times only what it can', () => {
  const ISSUES = [
    { id: 'i1', status: 'resolved', date: '2026-10-01', resolvedAt: '2026-10-03', linkedTo: { type: 'rental', id: 'a' } }, // 2 days
    { id: 'i2', status: 'resolved', date: '2026-09-10', resolvedAt: '2026-09-14', linkedTo: { type: 'rental', id: 'b' } }, // 4 days
    { id: 'i3', status: 'resolved', date: '2026-09-01', resolvedAt: '2026-09-07', linkedTo: { type: 'rental', id: 'c' } }, // 6 days
    { id: 'i4', status: 'resolved', date: '2026-08-01', linkedTo: { type: 'rental', id: 'c' } },                           // no resolvedAt
    { id: 'i5', status: 'open', date: '2026-10-18', dueDate: '2026-10-20', linkedTo: { type: 'rental', id: 'c' } },        // overdue
    { id: 'i6', status: 'open', date: '2026-10-20', dueDate: '2026-10-25', linkedTo: { type: 'rental', id: 'd' } },        // in window
    { id: 'i7', status: 'resolved', date: '2026-10-01', resolvedAt: '2026-10-02', linkedTo: { type: 'rental', id: 'home' } }, // the family home
  ];
  const svc = (extra = {}) => doorState({ rentals: ROWS, entities: ENTITIES, incidents: ISSUES, today: '2026-10-21', ...extra }).service;

  it('answers with the median of the issues it could time', () => {
    const s = svc();
    expect(s.answered).toBe(4);        // the family home's (i7) is not ours to claim
    expect(s.measured).toBe(3);
    expect(s.unmeasured).toBe(1);      // i4 has no resolved date — counted, not timed
    expect(s.typicalDays).toBe(4);
  });

  it('says how many open issues are past the day their own band promised', () => {
    const s = svc();
    expect(s.openNow).toBe(2);
    expect(s.overdue).toBe(1);
  });

  it('never guesses the day: no today in, no overdue figure out', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES, incidents: ISSUES }).service;
    expect(s.overdue).toBe(null);
    expect(s.openNow).toBe(2);
  });

  it('with nothing timeable it reports no typical figure rather than a zero', () => {
    const s = doorState({
      rentals: ROWS, entities: ENTITIES, today: '2026-10-21',
      incidents: [{ id: 'x', status: 'resolved', date: '2026-10-01', linkedTo: { type: 'rental', id: 'a' } }],
    }).service;
    expect(s.answered).toBe(1);
    expect(s.typicalDays).toBe(null);
    expect(s.measured).toBe(0);
  });

  it('counts the six stores a record keeps, and takes the live photo total where there is one', () => {
    const withRecords = ROWS.map((r) => (r.id === 'a'
      ? { ...r, photos: [1, 2], maintenanceLog: [1, 2, 3], unitNotes: [1], rooms: [1, 2], equipment: [1], conversationLog: [] }
      : r));
    const plain = doorState({ rentals: withRecords, entities: ENTITIES }).service;
    expect(plain.photos).toBe(2);
    expect(plain.maintenance).toBe(3);
    expect(plain.rooms).toBe(2);
    expect(plain.filed).toBe(2 + 3 + 1 + 2 + 1);
    // The archive on the NAS holds 40 for that door — what a person actually
    // sees — so that is the number, not the two on this device.
    const live = doorState({ rentals: withRecords, entities: ENTITIES, photoCounts: { a: 40 } }).service;
    expect(live.photos).toBe(40);
  });

  it('a portfolio with no history says so instead of printing zeroes', () => {
    const s = doorState({ rentals: ROWS, entities: ENTITIES }).service;
    expect(s.known).toBe(false);
  });

  it('the band prints the service line only when there is a record', () => {
    const withService = doorState({ rentals: ROWS, entities: ENTITIES, incidents: ISSUES, today: '2026-10-21' });
    const host = mount(createElement(RealEstateDoor, { state: withService }));
    const line = host.querySelector('[data-testid="re-door-service"]');
    expect(line.textContent).toContain('4 issues answered');
    expect(line.textContent).toContain('typically in');
    expect(line.textContent).toContain('1 past the day promised');
    expect(line.textContent).toContain('3 of 4 carry both dates');

    const empty = mount(createElement(RealEstateDoor, { state: doorState({ rentals: ROWS, entities: ENTITIES }) }));
    expect(empty.querySelector('[data-testid="re-door-service"]')).toBe(null);
  });
});
