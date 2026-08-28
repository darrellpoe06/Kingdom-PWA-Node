// =============================================================================
// Our own home is not a rental door — and every property keeps a mechanical
// history. Darrell, 2026-08-28.
// =============================================================================
// THE DEFECT THESE PIN. 2111 Talans Dr rendered "AVAILABLE - no rent on record"
// on the live board with QR TO APPLY / ADVERTISE / START A TENANCY beside it,
// while the database had carried status = 'owner-occupied' since the row was
// entered and rental-portfolio.js had honoured that on the Real Estate side for
// months. Three independent refusals now stand between that row and a listing;
// each is tested here, because a single filter is exactly what was missing.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isOwnHome, isRentalDoor, splitDoors, offerRefusal, assertNotOwnHome, OWN_HOME_TYPES } from '../modules/properties/homes.js';
import { isPersonalProp } from '../lib/rental-portfolio.js';
import { statusWord, DoorsBoard } from '../modules/properties/DoorTabs.jsx';
import {
  buildSystem, buildSystemEvent, systemBoard, ageYears, lifeStatus, serviceStatus,
  seedSystems, retireSystem, inferSystemKind, defaultsFor, toTimelineEvents,
  liveSystems, retiredSystems, sortEvents, SYSTEM_KINDS, EVENT_KINDS,
} from '../modules/properties/systems.js';

// The live row, copied from the catalog 2026-08-28 (not invented).
const TALANS = {
  id: '12a697f9-13a0-454f-88fb-b8d14187bc0b', slug: 'r-2111talans',
  instance_id: 'inst-1', address: '2111 Talans Dr', unit: null,
  city: 'Champaign', state: 'IL', status: 'owner-occupied',
  property_type: 'primary-home', monthly_rent: '0.00', listed_at: null,
  display_name: '2111 Talans Dr',
};
const KOEHN = {
  id: 'ff3d0a85-b70b-48d4-8127-e32f19912172', slug: 'r-1003koehn',
  instance_id: 'inst-1', address: '1003 Koehn Dr', city: 'Danville', state: 'IL',
  status: 'paying', property_type: 'single-family', monthly_rent: '680.00',
  listed_at: null, display_name: '1003 Koehn Dr, Danville',
};

describe('homes — which rows are ours, not offered', () => {
  it('knows the family home by its status', () => {
    expect(isOwnHome(TALANS)).toBe(true);
    expect(isRentalDoor(TALANS)).toBe(false);
  });

  it('knows a rental door with no rent yet is still a rental door', () => {
    // Four of the twelve carry $0 and not one of them is a home. Rent must
    // never be the signal (Darrell 2026-06-13: rentals stay rentals).
    expect(isOwnHome({ ...KOEHN, monthly_rent: '0.00' })).toBe(false);
    expect(isOwnHome({ status: 'unrented', property_type: 'multi-family' })).toBe(false);
  });

  it('accepts either shape — the Supabase row and the app object', () => {
    expect(isOwnHome({ property_type: 'secondary-home' })).toBe(true);
    expect(isOwnHome({ propertyType: 'secondary-home' })).toBe(true);
  });

  it('agrees with the Real Estate side, which had this right all along', () => {
    // Two definitions of "ours" that disagree is how the board and the rollup
    // ended up saying different things about the same house.
    for (const t of OWN_HOME_TYPES) {
      expect(isOwnHome({ property_type: t })).toBe(isPersonalProp({ propertyType: t }));
    }
    expect(isOwnHome({ status: 'owner-occupied' })).toBe(isPersonalProp({ status: 'owner-occupied' }));
    expect(isOwnHome(KOEHN)).toBe(isPersonalProp({ propertyType: 'single-family', status: 'paying' }));
  });

  it('survives junk without claiming a home', () => {
    for (const v of [null, undefined, 0, '', 'owner-occupied', []]) expect(isOwnHome(v)).toBe(false);
  });

  it('splits a portfolio without dropping anything', () => {
    const { doors, homes } = splitDoors([KOEHN, TALANS]);
    expect(doors).toEqual([KOEHN]);
    expect(homes).toEqual([TALANS]);
    expect(doors.length + homes.length).toBe(2);
  });

  it('explains the refusal in words, naming the property', () => {
    const say = offerRefusal(TALANS);
    expect(say).toContain('2111 Talans Dr');
    expect(say).toMatch(/never advertised/i);
    expect(say).toMatch(/Real Estate/);
    expect(offerRefusal(KOEHN)).toBe(null);
  });

  it('throws on the write path, so a forgotten filter fails loudly', () => {
    expect(() => assertNotOwnHome(TALANS, 'advertise')).toThrow(/Refused to advertise/);
    expect(assertNotOwnHome(KOEHN)).toBe(true);
  });
});

describe('statusWord — the family home is never "available"', () => {
  it('says Our home, outranking every leasing state', () => {
    expect(statusWord({ ownHome: true })).toBe('Our home');
    expect(statusWord({ ownHome: true, listed: true })).toBe('Our home');
    expect(statusWord({ ownHome: true, rented: true })).toBe('Our home');
    expect(statusWord({ ownHome: true, comingSoon: true, daysOut: 3 })).toBe('Our home');
  });

  it('still reads correctly for a real door', () => {
    expect(statusWord({})).toBe('Available');
    expect(statusWord({ listed: true })).toBe('Advertised');
    expect(statusWord({ rented: true })).toBe('Rented');
    expect(statusWord({ comingSoon: true, daysOut: 0 })).toBe('Opens today');
    expect(statusWord({ comingSoon: true, daysOut: 12 })).toBe('Opens in 12d');
  });
});

// ── the board, rendered ──────────────────────────────────────────────────────
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(el); });
  return { host, unmount: () => act(() => root.unmount()) };
}
const text = (host) => host.textContent || '';
const buttons = (host) => [...host.querySelectorAll('button')].map((b) => (b.textContent || '').trim());

describe('DoorsBoard — the home has a place, and none of the machinery', () => {
  it('keeps the home out of the doors count and off the rental list', () => {
    const { host, unmount } = render(
      <DoorsBoard rentals={[KOEHN, TALANS]} tenancies={[]} photos={[]} canManage />,
    );
    expect(text(host)).toContain('Your doors (1)');
    expect(text(host)).toContain('Our homes (1)');
    expect(text(host)).toContain('0 rented \u00b7 1 available');   // the home is in neither number
    unmount();
  });

  it('offers the home no QR, no advertising and no tenancy', () => {
    const { host, unmount } = render(
      <DoorsBoard rentals={[TALANS]} tenancies={[]} photos={[]} canManage />,
    );
    const b = buttons(host);
    expect(b.join(' ')).not.toMatch(/QR to apply/i);
    expect(b.join(' ')).not.toMatch(/Advertise/i);
    expect(b.join(' ')).not.toMatch(/Start a tenancy/i);
    expect(b.join(' ')).toMatch(/Edit home/i);
    unmount();
  });

  it('says where the money lives, so the house does not read as lost', () => {
    const { host, unmount } = render(<DoorsBoard rentals={[TALANS]} tenancies={[]} photos={[]} canManage />);
    expect(text(host)).toMatch(/Real.?Estate/);
    expect(text(host)).toContain('Our home');
    expect(text(host)).not.toContain('no rent on record');
    unmount();
  });

  it('a portfolio that is only homes does not claim doors it has not got', () => {
    const { host, unmount } = render(<DoorsBoard rentals={[TALANS]} tenancies={[]} photos={[]} canManage />);
    expect(text(host)).toContain('Nothing here is rented out');
    unmount();
  });

  it('every door is selectable, tenancy or not', () => {
    // With zero tenancies on the account this was disabled on all twelve, so
    // Rooms, Pictures, Files and Door history had nothing to show anybody.
    const picked = [];
    const { host, unmount } = render(
      <DoorsBoard rentals={[KOEHN]} tenancies={[]} photos={[]} canManage onPick={(id) => picked.push(id)} />,
    );
    const target = [...host.querySelectorAll('button')].find((b) => (b.textContent || '').includes('1003 Koehn'));
    expect(target).toBeTruthy();
    expect(target.disabled).toBe(false);
    act(() => { target.click(); });
    expect(picked).toEqual([KOEHN.id]);
    unmount();
  });
});

// ── the database's own refusals ──────────────────────────────────────────────
describe('0156 — the database refuses what the UI merely declines to offer', () => {
  const sql = readFileSync(
    join(process.cwd(), '..', 'infra/supabase/migrations-auto/0156-our-own-home-is-not-a-rental-door.sql'),
    'utf8',
  );

  it('defines ownership once, and the CHECK calls it', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.rental_is_own_home/);
    expect(sql).toMatch(/rentals_home_is_never_listed[\s\S]*?NOT public\.rental_is_own_home\(status, property_type\)/);
  });

  it('matches the app predicate exactly — status and both home types', () => {
    const body = sql.slice(sql.indexOf('rental_is_own_home'), sql.indexOf('COMMENT ON FUNCTION'));
    expect(body).toContain("'owner-occupied'");
    for (const t of OWN_HOME_TYPES) expect(body).toContain(`'${t}'`);
  });

  it('keeps the family home out of the public listing RPC', () => {
    const fn = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.public_vacancies'));
    expect(fn).toMatch(/NOT public\.rental_is_own_home\(r\.status, r\.property_type\)/);
  });

  it('re-runs the overlays for both new instance-scoped tables', () => {
    expect(sql).toContain('SELECT public.apply_viewer_readonly_overlay();');
    expect(sql).toContain('SELECT public.apply_assistant_scope_overlay();');
  });

  it('grants no DELETE on either mechanical table — history is not erasable', () => {
    expect(sql).toMatch(/GRANT SELECT, INSERT, UPDATE ON public\.property_systems TO authenticated;/);
    expect(sql).toMatch(/GRANT SELECT, INSERT ON public\.property_system_events TO authenticated;/);
    expect(sql).not.toMatch(/GRANT[^;]*DELETE[^;]*property_system/);
  });
});

// ── the mechanical history ───────────────────────────────────────────────────
const base = { instanceId: 'inst-1', rentalRef: TALANS.id };

describe('systems — what is installed and how old it is', () => {
  it('builds a system from a name alone', () => {
    const s = buildSystem({ ...base, name: '  Furnace ' });
    expect(s.name).toBe('Furnace');
    expect(s.kind).toBe('heating');
    expect(s.installed_on).toBe(null);
    expect(s.rental_ref).toBe(TALANS.id);
  });

  it('refuses a blank name and a duplicate at the same door', () => {
    expect(() => buildSystem({ ...base, name: '   ' })).toThrow(/needs a name/);
    const one = { ...buildSystem({ ...base, name: 'Water heater' }), id: 'x' };
    expect(() => buildSystem({ ...base, name: 'water  HEATER' }, [one])).toThrow(/already has a system/);
  });

  it('lets a retired name be used again', () => {
    const gone = { ...buildSystem({ ...base, name: 'Furnace' }), id: 'x', archived_at: '2020-01-01T00:00:00Z' };
    expect(() => buildSystem({ ...base, name: 'Furnace' }, [gone])).not.toThrow();
  });

  it('refuses a system with no property', () => {
    expect(() => buildSystem({ name: 'Roof' })).toThrow(/belongs to a property/);
  });

  it('refuses a kind it does not have', () => {
    expect(() => buildSystem({ ...base, name: 'Thing', kind: 'teleporter' })).toThrow(/not a system kind/);
  });

  it('refuses a life or interval that is not a schedule', () => {
    expect(() => buildSystem({ ...base, name: 'A', expectedLifeYears: 0 })).toThrow(/less than a year/);
    expect(() => buildSystem({ ...base, name: 'B', serviceIntervalMonths: 0 })).toThrow(/less than a month/);
  });

  it('never invents an install date', () => {
    for (const bad of ['', '   ', 'someday', '2026-13-40', null, undefined]) {
      expect(buildSystem({ ...base, name: `S${Math.random()}`, installedOn: bad }).installed_on).toBe(null);
    }
  });

  it('guesses the kind from ordinary names', () => {
    expect(inferSystemKind('Gas furnace')).toBe('heating');
    expect(inferSystemKind('A/C condenser')).toBe('cooling');
    expect(inferSystemKind('Tankless hot water')).toBe('water-heater');
    expect(inferSystemKind('Shingle roof')).toBe('roof');
    expect(inferSystemKind('Smoke detectors')).toBe('safety');
    expect(inferSystemKind('Something odd')).toBe('other');
  });

  it('offers a starter set for a bare property, once', () => {
    const rows = seedSystems({ ...base, propertyType: 'house' });
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.every((r) => r.installed_on === null)).toBe(true);
    const existing = rows.map((r, i) => ({ ...r, id: `s${i}` }));
    expect(seedSystems({ ...base }, existing)).toEqual([]);
  });

  it('prefills the usual figures for a kind, all overwritable', () => {
    expect(defaultsFor('water-heater').expectedLifeYears).toBeGreaterThan(5);
    expect(defaultsFor('other')).toEqual({ expectedLifeYears: null, serviceIntervalMonths: null });
    for (const k of SYSTEM_KINDS) expect(defaultsFor(k)).toHaveProperty('expectedLifeYears');
  });
});

describe('systems — age and service, with unknown as a real answer', () => {
  const NOW = Date.parse('2026-08-28T00:00:00Z');
  const furnace = { id: 'f1', name: 'Furnace', kind: 'heating', installed_on: '2008-05-01', expected_life_years: 18, service_interval_months: 12 };

  it('measures the age from the install date', () => {
    expect(ageYears(furnace, NOW)).toBeCloseTo(18.3, 1);
    expect(ageYears({ installed_on: null }, NOW)).toBe(null);
  });

  it('never reports an undated system as new or ok', () => {
    const s = lifeStatus({ id: 'x', installed_on: null, expected_life_years: 20 }, NOW);
    expect(s.state).toBe('unknown');
    expect(s.age).toBe(null);
    expect(s.say).toMatch(/not recorded/i);
  });

  it('reports a system past its usual life', () => {
    expect(lifeStatus(furnace, NOW).state).toBe('past-life');
    expect(lifeStatus({ ...furnace, expected_life_years: 25 }, NOW).state).toBe('ok');
    expect(lifeStatus({ ...furnace, expected_life_years: 20 }, NOW).state).toBe('near-end');
  });

  it('reads the newest servicing EVENT, not just the field', () => {
    const st = serviceStatus(furnace, [
      { system_ref: 'f1', kind: 'serviced', event_date: '2024-01-10' },
      { system_ref: 'f1', kind: 'repaired', event_date: '2026-08-01' },
      { system_ref: 'OTHER', kind: 'serviced', event_date: '2026-08-20' },
    ], NOW);
    expect(st.last).toBe('2026-08-01');
    expect(st.state).toBe('ok');
  });

  it('says overdue in days, and unknown when nothing was ever recorded', () => {
    expect(serviceStatus(furnace, [{ system_ref: 'f1', kind: 'serviced', event_date: '2025-01-10' }], NOW).state).toBe('overdue');
    expect(serviceStatus(furnace, [], NOW).state).toBe('unknown');
    expect(serviceStatus({ id: 'r', service_interval_months: null }, [], NOW).state).toBe('none');
  });
});

describe('systems — the board counts what is on screen', () => {
  const NOW = Date.parse('2026-08-28T00:00:00Z');
  const rows = [
    { id: 'f1', name: 'Furnace', kind: 'heating', installed_on: '2008-05-01', expected_life_years: 18, service_interval_months: 12 },
    { id: 'r1', name: 'Roof', kind: 'roof', installed_on: null, expected_life_years: 22 },
    { id: 'g1', name: 'Gone', kind: 'other', archived_at: '2024-01-01T00:00:00Z' },
  ];
  const events = [
    { id: 'e1', system_ref: 'f1', kind: 'serviced', event_date: '2026-06-01', cost: 180, summary: 'Annual service' },
    { id: 'e2', system_ref: 'f1', kind: 'issue', event_date: '2026-07-02', cost: null, summary: 'Short cycling' },
  ];

  it('counts only what is installed, and separates the retired', () => {
    const b = systemBoard(rows, events, NOW);
    expect(b.count).toBe(2);
    expect(b.retired.map((r) => r.id)).toEqual(['g1']);
    expect(liveSystems(rows).length).toBe(2);
    expect(retiredSystems(rows).length).toBe(1);
  });

  it('does not pad "needs attention" with the unknowns', () => {
    const b = systemBoard(rows, events, NOW);
    expect(b.attention).toBe(1);   // the furnace, past its life
    expect(b.unknown).toBe(1);     // the roof, undated
  });

  it('totals the real spend and the issues', () => {
    const b = systemBoard(rows, events, NOW);
    const f = b.rows.find((r) => r.system.id === 'f1');
    expect(f.spend).toBe(180);
    expect(f.openIssues).toBe(1);
    expect(f.eventCount).toBe(2);
    expect(b.spend).toBe(180);
  });

  it('is empty-safe', () => {
    const b = systemBoard();
    expect(b).toMatchObject({ count: 0, attention: 0, unknown: 0, spend: 0 });
  });
});

describe('system events — a record of what happened', () => {
  const ev = { instanceId: 'inst-1', systemRef: 'f1', rentalRef: TALANS.id };

  it('needs a date and a sentence', () => {
    expect(() => buildSystemEvent({ ...ev, eventDate: '2026-01-01' })).toThrow(/what happened/);
    expect(() => buildSystemEvent({ ...ev, summary: 'Serviced' })).toThrow(/needs the date/);
    expect(() => buildSystemEvent({ ...ev, summary: 'x', eventDate: 'last spring' })).toThrow(/needs the date/);
  });

  it('refuses a kind it does not have, and a negative cost', () => {
    expect(() => buildSystemEvent({ ...ev, summary: 'x', eventDate: '2026-01-01', kind: 'exploded' })).toThrow(/not an event kind/);
    expect(() => buildSystemEvent({ ...ev, summary: 'x', eventDate: '2026-01-01', cost: -5 })).toThrow(/cannot be negative/);
    for (const k of EVENT_KINDS) {
      expect(buildSystemEvent({ ...ev, summary: 'x', eventDate: '2026-01-01', kind: k }).kind).toBe(k);
    }
  });

  it('keeps a blank cost blank rather than zero', () => {
    expect(buildSystemEvent({ ...ev, summary: 'x', eventDate: '2026-01-01' }).cost).toBe(null);
    expect(buildSystemEvent({ ...ev, summary: 'x', eventDate: '2026-01-01', cost: '0' }).cost).toBe(0);
  });

  it('sorts newest first with undated last', () => {
    const out = sortEvents([
      { event_date: '2020-01-01' }, { event_date: null }, { event_date: '2026-01-01' },
    ]);
    expect(out.map((e) => e.event_date)).toEqual(['2026-01-01', '2020-01-01', null]);
  });
});

describe('the mechanical record joins the door chronology', () => {
  it('emits the shape the timeline already renders', () => {
    const out = toTimelineEvents(
      [{ id: 'e1', system_ref: 'f1', kind: 'replaced', event_date: '2026-03-14', summary: 'New furnace', vendor_name: "Dave's Heating", cost: 5400 }],
      [{ id: 'f1', name: 'Furnace' }],
    );
    expect(out[0].kind).toBe('system');
    expect(out[0].summary).toContain('Furnace');
    expect(out[0].summary).toContain('Replaced');
    expect(out[0].summary).toContain('$5400');
    expect(out[0].who).toBe("Dave's Heating");
    expect(Number.isFinite(out[0].ms)).toBe(true);
  });

  it('marks an undated record undated rather than sorting it to the top', () => {
    const out = toTimelineEvents([{ id: 'e', system_ref: 'f1', kind: 'note', event_date: null, summary: 'x' }], []);
    expect(out[0].undated).toBe(true);
    expect(out[0].ms).toBe(null);
  });
});

describe('retiring a system keeps its history', () => {
  it('archives rather than deletes, and says what that means', () => {
    const { patch, meansFor } = retireSystem({ id: 's1' }, { at: '2026-08-28T00:00:00Z', by: 'u1' });
    expect(patch.archived_at).toBe('2026-08-28T00:00:00Z');
    expect(meansFor).toMatch(/stays on the property/i);
    expect(() => retireSystem({})).toThrow(/Which system/);
  });
});
