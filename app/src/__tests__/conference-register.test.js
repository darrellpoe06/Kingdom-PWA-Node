// conference-register — pure helpers for the OPEN congregation registration path
// (migration 0027). Locks the shapes the public form + organizer roll depend on,
// with no live DB (DR-0076: measure, don't claim). The live closed-loop (submit ->
// organizer sees it -> anon can't read it) is proven in
// conference-register-closed-loop.test.js against a faithful supabase contract.
import { describe, it, expect } from 'vitest';
import {
  validateRegistration, normalizePartySize, buildRegistrationRow,
  toRegistrationShape, totalHeads, aggregateRegistrationMeals, REGISTRATION_STATUSES,
} from '../lib/conference-register.js';

describe('validateRegistration — low barrier, only name required', () => {
  it('requires a name', () => {
    expect(validateRegistration({ name: '' }).ok).toBe(false);
    expect(validateRegistration({ name: '   ' }).errors.name).toBeTruthy();
    expect(validateRegistration({ name: 'Naomi' }).ok).toBe(true);
  });
  it('accepts a blank email but rejects a malformed one', () => {
    expect(validateRegistration({ name: 'A', email: '' }).ok).toBe(true);
    expect(validateRegistration({ name: 'A', email: 'not-an-email' }).ok).toBe(false);
    expect(validateRegistration({ name: 'A', email: 'a@b.co' }).ok).toBe(true);
  });
  it('validates party size only when given (1..99)', () => {
    expect(validateRegistration({ name: 'A', partySize: '' }).ok).toBe(true);
    expect(validateRegistration({ name: 'A', partySize: '4' }).ok).toBe(true);
    expect(validateRegistration({ name: 'A', partySize: '0' }).ok).toBe(false);
    expect(validateRegistration({ name: 'A', partySize: '200' }).ok).toBe(false);
  });
});

describe('normalizePartySize — clean integer >= 1', () => {
  it('defaults to 1 for blank/invalid, clamps to 1..99', () => {
    expect(normalizePartySize('')).toBe(1);
    expect(normalizePartySize(undefined)).toBe(1);
    expect(normalizePartySize('abc')).toBe(1);
    expect(normalizePartySize('3')).toBe(3);
    expect(normalizePartySize(0)).toBe(1);
    expect(normalizePartySize(250)).toBe(99);
    expect(normalizePartySize(2.9)).toBe(2);
  });
});

describe('buildRegistrationRow — spec-shaped, trims, snaps meal type', () => {
  it('builds the DB row with sane defaults', () => {
    const row = buildRegistrationRow({ name: '  Naomi  ', mealType: 'vegan', dietary: ' peanut ', email: ' n@x.co ', partySize: '3', conferenceName: '77th National Assembly' });
    expect(row).toMatchObject({
      name: 'Naomi', meal_type: 'Vegan', dietary: 'peanut', email: 'n@x.co',
      party_size: 3, source: 'public-link', status: 'new', conference_name: '77th National Assembly',
    });
  });
  it('nulls empty optionals + defaults meal/party/source', () => {
    const row = buildRegistrationRow({ name: 'A' });
    expect(row.email).toBe(null);
    expect(row.dietary).toBe(null);
    expect(row.party_size).toBe(1);
    expect(row.meal_type).toBe('Regular');
    expect(row.source).toBe('public-link');
  });
  it('honors an explicit source (in-app front door)', () => {
    expect(buildRegistrationRow({ name: 'A', source: 'in-app' }).source).toBe('in-app');
  });
});

describe('toRegistrationShape — row -> camelCase', () => {
  it('maps a row + snaps meal type', () => {
    const r = toRegistrationShape({ id: 'r1', name: 'Naomi', meal_type: 'gluten-free', dietary: 'celiac', party_size: 2, days: 'Fri & Sat', email: 'n@x.co', source: 'public-link', status: 'new', created_at: 't' });
    expect(r).toMatchObject({ id: 'r1', name: 'Naomi', mealType: 'Gluten-free', partySize: 2, days: 'Fri & Sat', status: 'new' });
  });
});

describe('totalHeads — real attendance, sums party size, excludes cancelled', () => {
  it('sums party_size across non-cancelled rows', () => {
    const regs = [
      { partySize: 1, status: 'new' },
      { partySize: 4, status: 'confirmed' },
      { partySize: 3, status: 'cancelled' },   // excluded
    ];
    expect(totalHeads(regs)).toBe(5);
    expect(totalHeads([])).toBe(0);
  });
});

describe('aggregateRegistrationMeals — catering counts exclude cancelled', () => {
  it('tallies meals + collects dietary notes, skipping cancelled', () => {
    const regs = [
      { name: 'A', mealType: 'Vegan', dietary: 'peanut', status: 'new' },
      { name: 'B', mealType: 'Regular', dietary: '', status: 'confirmed' },
      { name: 'C', mealType: 'Vegan', dietary: 'soy', status: 'cancelled' }, // excluded
    ];
    const agg = aggregateRegistrationMeals(regs);
    expect(agg.counts).toEqual({ Vegan: 1, Regular: 1 });
    expect(agg.notes).toHaveLength(1);
    expect(agg.total).toBe(2);
  });
});

describe('status vocabulary', () => {
  it('exposes the registration statuses', () => {
    expect(REGISTRATION_STATUSES).toEqual(['new', 'confirmed', 'cancelled']);
  });
});
