// =============================================================================
// ANTICIPATED -> ACTUAL closed loop: register -> check-in -> variance reflects it
// =============================================================================
// The build's acceptance test, against a faithful in-memory model of the
// 0027 + 0031 RLS contract (not a live cloud round-trip, which needs a
// service-role key):
//   1. Congregants REGISTER (the ANTICIPATED projection: heads + meal mix).
//   2. A greeter CHECKS people IN (the ACTUAL arrival: checked_in_at + heads).
//   3. The VARIANCE reflects it correctly — arrived heads, no-show rate, and the
//      per-meal anticipated-vs-served gap all compute from the real rows.
//   4. RLS still holds: an anon viewer reads NOTHING back (no leak).
// Green here = the projection->reality loop is closed and truthful.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Faithful model of conference_public_registrations under its RLS. `role` switches
// the reader; update()/.eq() models the owner/admin check-in write.
const h = vi.hoisted(() => ({ state: { store: [], role: 'organizer' } }));

vi.mock('../lib/supabase.js', () => {
  const order = () => Promise.resolve({
    // SELECT is organizer-only (no anon SELECT policy on the roll).
    data: h.state.role === 'organizer' ? [...h.state.store].slice().reverse() : [],
    error: null,
  });
  const from = () => ({
    insert: (row) => {
      const rows = Array.isArray(row) ? row : [row];
      rows.forEach((r) => h.state.store.push({
        id: `id-${h.state.store.length + 1}`,
        instance_id: 'colg-instance',
        created_at: `2026-07-15T0${h.state.store.length}:00:00Z`,
        checked_in_at: null, checked_in_heads: null,
        ...r,
      }));
      return Promise.resolve({ error: null });
    },
    update: (patch) => ({
      // update(...).eq('id', id) — only the owner/admin path reaches here.
      eq: (col, val) => {
        if (h.state.role !== 'organizer') return Promise.resolve({ error: { message: 'permission denied' } });
        h.state.store = h.state.store.map((r) => (r[col] === val ? { ...r, ...patch } : r));
        return Promise.resolve({ error: null });
      },
    }),
    select: function select() { return this; },
    order,
  });
  const supabase = {
    from,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'organizer-uid' } } } }) },
  };
  return { default: supabase, supabase };
});

import {
  submitRegistration, fetchRegistrations, checkInRegistration, undoCheckIn,
} from '../lib/conference-register.js';
import {
  eventVariance, anticipatedHeads, actualHeads, checkInProgress, mealVarianceRows,
} from '../lib/conference-variance.js';

beforeEach(() => {
  h.state.store = [];
  h.state.role = 'organizer';
});

// Helper: register N people then return the organizer's current roll.
async function roll() {
  const { rows } = await fetchRegistrations();
  return rows;
}

describe('register (anticipated) -> check-in (actual) -> variance', () => {
  it('the full loop: heads, no-show rate, and meal variance all track reality', async () => {
    // 1) ANTICIPATED — three parties register (8 heads), a mix of meals.
    await submitRegistration({ name: 'Adam', mealType: 'Regular', partySize: '3', source: 'public-link' });
    await submitRegistration({ name: 'Naomi', mealType: 'Vegan', dietary: 'peanut', partySize: '2', source: 'public-link' });
    await submitRegistration({ name: 'Ruth', mealType: 'Regular', partySize: '3', source: 'in-app' });

    let rows = await roll();
    expect(anticipatedHeads(rows)).toBe(8);
    expect(actualHeads(rows)).toBe(0); // nobody has arrived yet
    expect(eventVariance(rows).noShowRate).toBe(1); // 0 of 8 arrived

    // 2) ACTUAL — the greeter checks people in. Adam's full party of 3 arrives;
    //    Naomi's party of 2 arrives; Ruth's party of 3 is a no-show.
    const adam = rows.find((r) => r.name === 'Adam');
    const naomi = rows.find((r) => r.name === 'Naomi');
    expect((await checkInRegistration(adam.id, adam.partySize)).ok).toBe(true);
    expect((await checkInRegistration(naomi.id, naomi.partySize)).ok).toBe(true);

    rows = await roll();
    const ev = eventVariance(rows);
    expect(ev.anticipated).toBe(8);
    expect(ev.actual).toBe(5);             // 3 + 2 arrived
    expect(ev.delta).toBe(-3);
    expect(ev.noShowRate).toBeCloseTo(3 / 8, 5); // Ruth's party of 3 didn't come
    expect(checkInProgress(rows)).toEqual({ arrived: 2, expected: 3, remaining: 1 });

    // 3) MEAL VARIANCE — anticipated plates vs what we'd serve. Kitchen "serves"
    //    the actuals: 6 Regular (over-prepared), 2 Vegan (exact).
    const meals = mealVarianceRows(rows, [
      { scope: 'meal', refKey: 'Regular', actual: 6 },
      { scope: 'meal', refKey: 'Vegan', actual: 2 },
    ]);
    const regMeal = meals.find((m) => m.type === 'Regular');
    const vegMeal = meals.find((m) => m.type === 'Vegan');
    expect(regMeal).toMatchObject({ anticipated: 6, actual: 6 }); // 3 (Adam) + 3 (Ruth) plates planned
    expect(vegMeal).toMatchObject({ anticipated: 2, actual: 2, tone: 'good' });
  });

  it('check-in can be partial (some of a party showed) and undone', async () => {
    await submitRegistration({ name: 'Eli', mealType: 'Regular', partySize: '4', source: 'public-link' });
    let rows = await roll();
    const eli = rows.find((r) => r.name === 'Eli');

    // Only 3 of Eli's party of 4 came.
    await checkInRegistration(eli.id, 3);
    rows = await roll();
    expect(actualHeads(rows)).toBe(3);
    expect(eventVariance(rows).noShowRate).toBeCloseTo(1 / 4, 5);

    // Greeter tapped the wrong row — undo clears the arrival.
    await undoCheckIn(eli.id);
    rows = await roll();
    expect(actualHeads(rows)).toBe(0);
    expect(checkInProgress(rows).arrived).toBe(0);
  });

  it('a check-in write from a non-organizer is denied (RLS) and surfaced honestly', async () => {
    await submitRegistration({ name: 'Mara', partySize: '2', source: 'public-link' });
    const rows = await roll();
    const mara = rows.find((r) => r.name === 'Mara');

    h.state.role = 'anon'; // simulate a caller without owner/admin
    const res = await checkInRegistration(mara.id, 2);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('an ANON viewer cannot read the roll back even after check-ins (no leak)', async () => {
    await submitRegistration({ name: 'Naomi', mealType: 'Vegan', partySize: '2' });
    const rows = await roll();
    await checkInRegistration(rows[0].id, 2);

    h.state.role = 'anon';
    const { rows: anonRows } = await fetchRegistrations();
    expect(anonRows).toEqual([]);
  });
});
