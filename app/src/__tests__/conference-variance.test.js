// =============================================================================
// conference-variance — pure ANTICIPATED-vs-ACTUAL math (no DB)
// =============================================================================
// Locks the shapes the variance surface renders so the numbers are MEASURED, not
// claimed (DR-0076). Every helper is pure; these run with no supabase.
import { describe, it, expect } from 'vitest';
import {
  varianceCell, ratePct, anticipatedHeads, actualHeads, checkInProgress, eventVariance,
  anticipatedMealHeads, actualsByKey, mealVarianceRows, roomVarianceRows, sessionVarianceRows,
  buildActualRow, toActualShape,
} from '../lib/conference-variance.js';

// A registration shape as toRegistrationShape produces (camelCase + check-in fields).
const reg = (over = {}) => ({
  id: over.id ?? `r${Math.random()}`, name: over.name ?? 'Person', status: over.status ?? 'new',
  mealType: over.mealType ?? 'Regular', dietary: over.dietary ?? null, partySize: over.partySize ?? 1,
  checkedInAt: over.checkedInAt ?? null, checkedInHeads: over.checkedInHeads ?? null,
  email: over.email ?? null, phone: over.phone ?? null,
});

describe('varianceCell', () => {
  it('on-target is good', () => {
    const c = varianceCell(100, 100);
    expect(c).toMatchObject({ anticipated: 100, actual: 100, delta: 0, direction: 'on-target', tone: 'good' });
    expect(c.label).toMatch(/on target/);
  });
  it('small under (<=10%) is good', () => {
    expect(varianceCell(100, 95).tone).toBe('good');
  });
  it('moderate gap (10-25%) is attention', () => {
    const c = varianceCell(100, 80);
    expect(c.tone).toBe('attention');
    expect(c.direction).toBe('under');
    expect(c.label).toMatch(/20 under/);
  });
  it('large gap (>25%) is a problem', () => {
    expect(varianceCell(100, 60).tone).toBe('problem');
  });
  it('over a capacity ceiling is a problem when overIsProblem', () => {
    expect(varianceCell(100, 105, { overIsProblem: true }).tone).toBe('problem');
    // without the flag a 5% over is still good
    expect(varianceCell(100, 105).tone).toBe('good');
  });
  it('null anticipated yields an idle, label-only cell', () => {
    const c = varianceCell(null, 12);
    expect(c).toMatchObject({ anticipated: null, actual: 12, tone: 'idle' });
  });
  it('ratePct formats', () => {
    expect(ratePct(0.2)).toBe('20%');
    expect(ratePct(null)).toBe('—');
  });
});

describe('headcount: anticipated vs actual (check-in)', () => {
  const regs = [
    reg({ partySize: 3, status: 'new' }),                                   // 3 anticipated
    reg({ partySize: 2, status: 'confirmed', checkedInAt: 't', checkedInHeads: 2 }), // 2 ant, 2 actual
    reg({ partySize: 4, status: 'new', checkedInAt: 't', checkedInHeads: 3 }),       // 4 ant, 3 actual (1 no-show in party)
    reg({ partySize: 5, status: 'cancelled' }),                             // excluded
  ];
  it('anticipatedHeads sums party size of non-cancelled', () => {
    expect(anticipatedHeads(regs)).toBe(3 + 2 + 4); // 9
  });
  it('actualHeads sums checked-in heads', () => {
    expect(actualHeads(regs)).toBe(2 + 3); // 5
  });
  it('checkInProgress counts rows arrived vs expected', () => {
    expect(checkInProgress(regs)).toEqual({ arrived: 2, expected: 3, remaining: 1 });
  });
  it('eventVariance computes the no-show rate over heads', () => {
    const e = eventVariance(regs);
    expect(e.anticipated).toBe(9);
    expect(e.actual).toBe(5);
    expect(e.noShowRate).toBeCloseTo(4 / 9, 5);
  });
  it('no-show rate is null with no anticipated heads', () => {
    expect(eventVariance([]).noShowRate).toBeNull();
  });
});

describe('meals: anticipated plates (heads) vs served', () => {
  const regs = [
    reg({ mealType: 'Regular', partySize: 3 }),
    reg({ mealType: 'Regular', partySize: 1 }),
    reg({ mealType: 'Vegan', partySize: 2 }),
    reg({ mealType: 'Vegan', partySize: 1, status: 'cancelled' }), // excluded
  ];
  it('anticipatedMealHeads weights by party size, excludes cancelled', () => {
    expect(anticipatedMealHeads(regs)).toEqual({ Regular: 4, Vegan: 2 });
  });
  it('mealVarianceRows pairs anticipated with the recorded served actual', () => {
    const actuals = [
      { scope: 'meal', refKey: 'Regular', actual: 4 },
      { scope: 'meal', refKey: 'Vegan', actual: 1 },
    ];
    const rows = mealVarianceRows(regs, actuals);
    const reg4 = rows.find((r) => r.type === 'Regular');
    const veg = rows.find((r) => r.type === 'Vegan');
    expect(reg4).toMatchObject({ anticipated: 4, actual: 4, hasActual: true, tone: 'good' });
    expect(veg).toMatchObject({ anticipated: 2, actual: 1, hasActual: true });
    expect(veg.tone).toBe('problem'); // 1 of 2 = 50% off
  });
  it('a meal type with no actual recorded is flagged hasActual:false (idle in UI)', () => {
    const rows = mealVarianceRows(regs, []);
    expect(rows.every((r) => r.hasActual === false)).toBe(true);
    expect(rows.find((r) => r.type === 'Regular').actual).toBeNull();
  });
  it('actualsByKey indexes by ref for a scope', () => {
    const m = actualsByKey([{ scope: 'meal', refKey: 'Regular', actual: 9 }, { scope: 'room', refKey: 'x', actual: 1 }], 'meal');
    expect(m.get('Regular').actual).toBe(9);
    expect(m.has('x')).toBe(false);
  });
});

describe('rooms: capacity vs actually used', () => {
  const rooms = [
    { id: 'rm1', name: 'Sanctuary', capacity: 600, status: 'active' },
    { id: 'rm2', name: 'Fellowship', capacity: 120, status: 'active' },
    { id: 'rm3', name: 'No-cap', capacity: null, status: 'active' },
    { id: 'rm4', name: 'Archived', capacity: 50, status: 'archived' },
  ];
  it('pairs each room capacity with its recorded use; over capacity is a problem', () => {
    const actuals = [
      { scope: 'room', refKey: 'rm1', actual: 480 }, // under cap — fine-ish (20% under -> attention)
      { scope: 'room', refKey: 'rm2', actual: 140 }, // OVER capacity -> problem
    ];
    const rows = roomVarianceRows(rooms, actuals);
    const sanctuary = rows.find((r) => r.roomId === 'rm1');
    const hall = rows.find((r) => r.roomId === 'rm2');
    expect(sanctuary).toMatchObject({ anticipated: 600, actual: 480, hasActual: true });
    expect(hall).toMatchObject({ anticipated: 120, actual: 140, direction: 'over', tone: 'problem' });
  });
  it('drops archived rooms and capacity-less rooms with no actual', () => {
    const rows = roomVarianceRows(rooms, []);
    expect(rows.map((r) => r.roomId).sort()).toEqual(['rm1', 'rm2']);
  });
  it('keeps a capacity-less room IF it has a recorded actual', () => {
    const rows = roomVarianceRows(rooms, [{ scope: 'room', refKey: 'rm3', actual: 30 }]);
    expect(rows.some((r) => r.roomId === 'rm3')).toBe(true);
  });
});

describe('sessions: signed-up vs checked-in (derived from the roll)', () => {
  const sessions = [
    { id: 's1', title: 'Breakout A', day: 'Tue', status: 'active' },
    { id: 's2', title: 'Empty', day: 'Tue', status: 'active' },
  ];
  const participants = [
    { sessionId: 's1', registrationStatus: 'registered' },
    { sessionId: 's1', registrationStatus: 'checked_in' },
    { sessionId: 's1', registrationStatus: 'cancelled' }, // not on the roll
  ];
  it('anticipated = roll (registered+checked_in); actual = checked_in', () => {
    const rows = sessionVarianceRows(sessions, participants);
    const a = rows.find((r) => r.sessionId === 's1');
    expect(a).toMatchObject({ anticipated: 2, actual: 1 });
  });
  it('drops sessions with an empty roll', () => {
    const rows = sessionVarianceRows(sessions, participants);
    expect(rows.some((r) => r.sessionId === 's2')).toBe(false);
  });
});

describe('actuals row shapes (DB <-> camelCase)', () => {
  it('buildActualRow normalizes scope, ref_key, and clamps actual >= 0', () => {
    expect(buildActualRow({ conferenceId: 'c1', scope: 'meal', refKey: 'Vegan', actual: '12' }))
      .toMatchObject({ conference_id: 'c1', scope: 'meal', ref_key: 'Vegan', actual: 12 });
    expect(buildActualRow({ scope: 'bogus', actual: -4 })).toMatchObject({ scope: 'event', ref_key: 'event', actual: 0 });
  });
  it('toActualShape maps a DB row back', () => {
    expect(toActualShape({ id: 'a1', conference_id: 'c1', scope: 'room', ref_key: 'rm1', actual: 80, anticipated: 120 }))
      .toMatchObject({ id: 'a1', conferenceId: 'c1', scope: 'room', refKey: 'rm1', actual: 80, anticipated: 120 });
  });
});
