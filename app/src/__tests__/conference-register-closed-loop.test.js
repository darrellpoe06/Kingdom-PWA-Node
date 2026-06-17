// =============================================================================
// conference public registration — CLOSED-LOOP contract test
// =============================================================================
// Proves the registration->visibility loop against a faithful model of the 0027
// RLS contract (NOT a live cloud round-trip, which needs a service-role key):
//   1. An anonymous congregant submits a registration  -> it PERSISTS.
//   2. A church organizer reads the roll                -> the row APPEARS.
//   3. An anonymous viewer tries to read the roll       -> sees NOTHING (no leak).
//   4. Meal counts + head count tally the real rows.
// This is the "registration silently failed" ship-gate, inverted: a green here
// means a real submission reaches organizers and a registrant can't read it back.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared, faithful in-memory model of the table under its RLS. `role` switches the
// reader between an anonymous visitor and a church organizer.
const h = vi.hoisted(() => ({ state: { store: [], role: 'organizer', insertError: null } }));

vi.mock('../lib/supabase.js', () => {
  const order = () => Promise.resolve({
    // RLS: SELECT is organizer-only. Anyone else reads nothing (deny-all), exactly
    // like the absence of an anon SELECT policy on conference_public_registrations.
    data: h.state.role === 'organizer' ? [...h.state.store].slice().reverse() : [],
    error: null,
  });
  const from = () => ({
    insert: (row) => {
      if (h.state.insertError) return Promise.resolve({ error: h.state.insertError });
      const rows = Array.isArray(row) ? row : [row];
      rows.forEach((r, i) => h.state.store.push({
        id: `id-${h.state.store.length + 1}`,
        // trigger forces the instance — the client value never decides routing.
        instance_id: 'colg-instance',
        created_at: `2026-06-16T0${h.state.store.length}:00:00Z`,
        ...r,
      }));
      return Promise.resolve({ error: null });
    },
    select: function select() { return this; },
    order,
  });
  const supabase = {
    from,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  return { default: supabase, supabase };
});

import {
  submitRegistration, fetchRegistrations, aggregateRegistrationMeals, totalHeads,
} from '../lib/conference-register.js';

beforeEach(() => {
  h.state.store = [];
  h.state.role = 'organizer';
  h.state.insertError = null;
});

describe('closed loop: submit (anon) -> organizer sees it -> anon cannot', () => {
  it('a public submission PERSISTS and surfaces a truthful success', async () => {
    const res = await submitRegistration({ name: 'Naomi', mealType: 'Vegan', dietary: 'peanut', partySize: '2', source: 'public-link' });
    expect(res.ok).toBe(true);
    expect(h.state.store).toHaveLength(1);
    expect(h.state.store[0]).toMatchObject({ name: 'Naomi', meal_type: 'Vegan', party_size: 2, instance_id: 'colg-instance' });
  });

  it('the ORGANIZER reads the submitted registration back (shared/visible)', async () => {
    await submitRegistration({ name: 'Adam', mealType: 'Regular', source: 'in-app' });
    await submitRegistration({ name: 'Naomi', mealType: 'Vegan', dietary: 'peanut', partySize: '3', source: 'public-link' });
    h.state.role = 'organizer';
    const { ok, rows } = await fetchRegistrations();
    expect(ok).toBe(true);
    expect(rows.map((r) => r.name).sort()).toEqual(['Adam', 'Naomi']);
    // The organizer's catering view is REAL: counts + heads come from the rows.
    const meals = aggregateRegistrationMeals(rows);
    expect(meals.counts).toEqual({ Regular: 1, Vegan: 1 });
    expect(totalHeads(rows)).toBe(4); // 1 (Adam) + 3 (Naomi's party)
  });

  it('create -> register -> appears: the organizer-set conference name flows through to what the organizer sees', async () => {
    // Organizer "creates"/configures the conference (sets its name); the public
    // form carries that name; the organizer sees the registration tagged with it.
    const CONF = '77th National Assembly';
    await submitRegistration({ name: 'Naomi', mealType: 'Vegan', conferenceName: CONF, source: 'public-link' });
    h.state.role = 'organizer';
    const { ok, rows } = await fetchRegistrations();
    expect(ok).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0].conferenceName).toBe(CONF);
    expect(rows[0].name).toBe('Naomi');
  });

  it('an ANONYMOUS viewer cannot read the roll (no read-back leak)', async () => {
    await submitRegistration({ name: 'Naomi', mealType: 'Vegan' });
    h.state.role = 'anon';
    const { ok, rows } = await fetchRegistrations();
    expect(ok).toBe(true);
    expect(rows).toEqual([]); // RLS denies the read; the registrant sees nothing back
  });

  it('a failed insert is reported HONESTLY (never a false "registered")', async () => {
    h.state.insertError = { message: 'permission denied for table conference_public_registrations' };
    const res = await submitRegistration({ name: 'Naomi' });
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
    expect(h.state.store).toHaveLength(0);
  });

  it('a registration with no name never reaches the DB', async () => {
    const res = await submitRegistration({ name: '   ' });
    expect(res.ok).toBe(false);
    expect(h.state.store).toHaveLength(0);
  });
});
