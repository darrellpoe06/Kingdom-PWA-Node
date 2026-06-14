// Non-family parishioner onboarding — 2026-06-14. A signed-in NON-family user
// (e.g. a parishioner) fully authenticates and gets their OWN RLS-scoped
// instance, but the app used to leave currentProfile null, trapping them at the
// Poe-family device picker (a full-screen lockout), and the no-snapshot
// hydration path fell back to SEED_DATA (the Poe-family shape) on the public
// host — contradicting the "public host must NEVER use SEED_DATA" rule.
//
// These tests lock the two pieces of that fix that are pure data/logic:
//   1. isFamilyEmail correctly separates family from outside users (drives the
//      self-serve profile branch, the sanitized-names guard, and the wf18 gate).
//   2. EMPTY_WORLD is the safe starting instance: structurally complete, but
//      carrying none of the family's data, and classified as scaffolding
//      (remainderIsSeed === true) so it never publishes until the user enters
//      real data of their own.
import { describe, it, expect } from 'vitest';
import { isFamilyEmail, EMPTY_WORLD, SEED_DATA, remainderIsSeed } from '../poe-financial-mvp-v28.jsx';

describe('isFamilyEmail', () => {
  it('recognizes the family emails (case-insensitive)', () => {
    expect(isFamilyEmail('darrellpoe06@gmail.com')).toBe(true);
    expect(isFamilyEmail('MrsPoe06@gmail.com')).toBe(true);
    expect(isFamilyEmail('christina@tlctherapysolutions.com')).toBe(true);
  });
  it('rejects an outside parishioner email', () => {
    expect(isFamilyEmail('jaydenbrown95@icloud.com')).toBe(false);
  });
  it('rejects null / undefined / empty without throwing', () => {
    expect(isFamilyEmail(null)).toBe(false);
    expect(isFamilyEmail(undefined)).toBe(false);
    expect(isFamilyEmail('')).toBe(false);
  });
});

describe('EMPTY_WORLD — a non-family user lands on their own empty instance', () => {
  it('carries none of the family-bearing collections', () => {
    const emptyLists = [
      'entities', 'accounts', 'transactions', 'contractors1099', 'taxCalendar',
      'recurringObligations', 'incidents', 'scopes', 'events', 'projects',
      'subscriptions', 'inquiries', 'debts', 'opportunities', 'capexItems',
      'skillProfiles', 'prayerRequests',
    ];
    for (const key of emptyLists) {
      expect(Array.isArray(EMPTY_WORLD[key]), `${key} should be an array`).toBe(true);
      expect(EMPTY_WORLD[key].length, `${key} should be empty`).toBe(0);
    }
    expect(EMPTY_WORLD.inflows.salaries).toEqual([]);
    expect(EMPTY_WORLD.inflows.rentals).toEqual([]);
  });

  it('is structurally complete (every SEED_DATA key is present)', () => {
    for (const key of Object.keys(SEED_DATA)) {
      expect(EMPTY_WORLD, `EMPTY_WORLD missing key ${key}`).toHaveProperty(key);
    }
  });

  it('is NOT the family seed (no SEED entity/account/debt ids leak through)', () => {
    expect(EMPTY_WORLD.entities).not.toEqual(SEED_DATA.entities);
    const allIds = [
      ...EMPTY_WORLD.entities, ...EMPTY_WORLD.accounts, ...EMPTY_WORLD.debts,
    ].map(r => r.id);
    expect(allIds.length).toBe(0);
  });

  it('is classified as scaffolding so it never publishes until real data exists', () => {
    expect(remainderIsSeed(EMPTY_WORLD)).toBe(true);
  });

  it('starts on the free foundation tier', () => {
    expect(EMPTY_WORLD.userTier).toBe('foundation');
  });
});
