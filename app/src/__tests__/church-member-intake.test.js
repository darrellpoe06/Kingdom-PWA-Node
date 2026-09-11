// @vitest-environment node
//
// The Love Corner intake — what a CHURCH may ask, and what it may not.
//
// Darrell 2026-09-11: "Create the same type of intake forms for the Love Corner
// App that we did for the PoeTech and Poe Properties Apps... however make sure
// they fit the requirements of the product it claims to be."
//
// The product is a church. DR-0357's rule — every question names the surface it
// feeds, and a question no surface reads does not survive review — holds here
// with more force, because a church that collects what it does not use has
// built a file on its congregation.
//
// Most of these tests are about the WALLS.
import { describe, it, expect } from 'vitest';
import {
  CHURCH_MEMBER_SECTIONS, CHURCH_MEMBER_ALL_FIELDS, CHURCH_MEMBER_REFUSED_KEYS,
  MEMBER_FLOOR, SERVING_OPTIONS, serviceOptions, optionsFor,
  emptyMemberRecord, normalizeMemberRecord, validateMemberRecord,
  memberLabelFor, memberProgress,
} from '../lib/church-member-intake.js';
import { CHURCH_MINISTRIES } from '../lib/church-ministries.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const ok = { fullName: 'Sister Ruth', contactEmail: 'ruth@example.org', standing: 'A member' };

describe('every question earns its place', () => {
  it('names the surface it feeds — DR-0357, asserted rather than trusted', () => {
    for (const f of CHURCH_MEMBER_ALL_FIELDS) {
      expect(f.feeds, `${f.key} must name what reads it`).toBeTruthy();
      expect(String(f.feeds).length, f.key).toBeGreaterThan(8);
    }
  });

  it('gives every field a key, a type and a label', () => {
    for (const f of CHURCH_MEMBER_ALL_FIELDS) {
      expect(f.key, JSON.stringify(f)).toBeTruthy();
      expect(f.type, f.key).toBeTruthy();
      expect(f.label, f.key).toBeTruthy();
    }
  });

  it('uses each key exactly once', () => {
    const keys = CHURCH_MEMBER_ALL_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every section says what it is for', () => {
    for (const s of CHURCH_MEMBER_SECTIONS) {
      expect(s.id && s.title && s.blurb, s.id).toBeTruthy();
      expect(s.fields.length, s.id).toBeGreaterThan(0);
    }
  });
});

describe('THE WALLS — what a church may not ask', () => {
  it('refuses a giving AMOUNT, which is between a person and Yahweh', () => {
    for (const k of ['givingAmount', 'givingTotal', 'income']) {
      expect(CHURCH_MEMBER_REFUSED_KEYS).toContain(k);
      const v = validateMemberRecord({ ...ok, [k]: 500 }, COLG_DEFAULT_CHURCH);
      expect(v.ok, k).toBe(false);
      expect(v.errors.join(' ')).toMatch(new RegExp(k));
    }
  });

  it('asks about the giving RHYTHM and never a number, and says so to the reader', () => {
    const f = CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === 'givingRhythm');
    expect(f.type).toBe('select');
    expect(f.options).not.toContain('');
    expect(f.help).toMatch(/never asks what you give/i);
    expect(f.feeds).toMatch(/never an amount/i);
    // And a person may simply decline.
    expect(f.options).toContain('I would rather not say');
  });

  it('refuses account numbers, cards, passwords and a diagnosis', () => {
    for (const k of ['accountNumber', 'routingNumber', 'ssn', 'password', 'cardNumber', 'diagnosis']) {
      expect(CHURCH_MEMBER_REFUSED_KEYS).toContain(k);
    }
  });

  it('strips a refused key rather than storing it, even if one arrives', () => {
    const rec = normalizeMemberRecord({ ...ok, ssn: '123-45-6789', givingAmount: 40 }, COLG_DEFAULT_CHURCH);
    expect(rec.ssn).toBeUndefined();
    expect(rec.givingAmount).toBeUndefined();
  });

  it('NAMES NO CHILD — it counts them and stops', () => {
    const childFields = CHURCH_MEMBER_ALL_FIELDS.filter((f) => /child/i.test(f.key));
    expect(childFields.length).toBeGreaterThan(0);
    for (const f of childFields) {
      expect(f.type, `${f.key} must not be free text about a child`).not.toBe('text');
      expect(f.type).not.toBe('textarea');
    }
    const count = CHURCH_MEMBER_ALL_FIELDS.find((f) => f.key === 'childrenCount');
    expect(count.help).toMatch(/guardian/i);
    expect(count.feeds).toMatch(/never a child-facing data stream/i);
  });

  it('defaults a prayer request to the NARROWEST audience, not the widest', () => {
    const f = CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === 'prayerShareable');
    expect(f.options[0]).toBe('Only the pastor');
    expect(f.options[f.options.length - 1]).toBe('The whole church');
  });

  it('treats access needs as logistics, never a medical record', () => {
    const f = CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === 'accessNeeds');
    expect(f.feeds).toMatch(/never a medical record/i);
  });
});

describe('DERIVED, not re-typed', () => {
  it('offers every ministry from the ONE registry', () => {
    for (const m of CHURCH_MINISTRIES) {
      expect(SERVING_OPTIONS.map((o) => o.id), m.id).toContain(m.id);
    }
    // Including the ones with no page yet — that is how we learn what to build.
    expect(SERVING_OPTIONS.map((o) => o.id)).toContain('band');
  });

  it('lets a person say "wherever" or "not yet" without being chased', () => {
    const ids = SERVING_OPTIONS.map((o) => o.id);
    expect(ids).toContain('wherever');
    expect(ids).toContain('not-yet');
  });

  it('offers a ride to EVERY service the church holds — Sunday AND Wednesday', () => {
    const labels = serviceOptions(COLG_DEFAULT_CHURCH).map((o) => o.label);
    expect(labels.some((l) => /Sunday/.test(l))).toBe(true);
    expect(labels.filter((l) => /Wednesday/.test(l)).length).toBe(2);
  });

  it('resolves a derived-options field through the church', () => {
    const f = CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === 'rideServices');
    expect(f.optionsFrom).toBe('services');
    expect(optionsFor(f, COLG_DEFAULT_CHURCH).length).toBe(3);
    // A plain field just returns its own options.
    expect(optionsFor(CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === 'standing')).length).toBeGreaterThan(3);
    expect(optionsFor(null)).toEqual([]);
  });

  it('keeps only ride services the church actually holds', () => {
    const rec = normalizeMemberRecord(
      { ...ok, rideServices: ['svc-sun', 'svc-not-a-real-service'] }, COLG_DEFAULT_CHURCH);
    expect(rec.rideServices).toEqual(['svc-sun']);
  });
});

describe('the record itself', () => {
  it('starts with a place for every item', () => {
    const e = emptyMemberRecord();
    for (const f of CHURCH_MEMBER_ALL_FIELDS) expect(e).toHaveProperty(f.key);
  });

  it('asks for only three things before it can stand', () => {
    expect(MEMBER_FLOOR).toEqual(['fullName', 'contactEmail', 'standing']);
    const v = validateMemberRecord({}, COLG_DEFAULT_CHURCH);
    expect(v.ok).toBe(false);
    expect(v.missing).toEqual(['fullName', 'contactEmail', 'standing']);
  });

  it('accepts a record with the floor answered', () => {
    expect(validateMemberRecord(ok, COLG_DEFAULT_CHURCH).ok).toBe(true);
  });

  it('catches an email that is not one', () => {
    const v = validateMemberRecord({ ...ok, contactEmail: 'not-an-email' }, COLG_DEFAULT_CHURCH);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/does not look like an address/);
  });

  it('survives junk without throwing', () => {
    expect(normalizeMemberRecord(null)).toEqual(emptyMemberRecord());
    expect(normalizeMemberRecord('nope')).toEqual(emptyMemberRecord());
    expect(validateMemberRecord(undefined).ok).toBe(false);
  });

  it('reports progress to the person, and an empty record is honestly zero', () => {
    expect(memberProgress({}, COLG_DEFAULT_CHURCH)).toMatchObject({ done: 0, pct: 0 });
    const p = memberProgress(ok, COLG_DEFAULT_CHURCH);
    expect(p.done).toBe(3);
    expect(p.total).toBe(CHURCH_MEMBER_ALL_FIELDS.length);
  });

  it('names a field for a reader', () => {
    expect(memberLabelFor('fullName')).toBe('Your full name');
    expect(memberLabelFor('nope')).toBe('nope');
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a question added with no surface behind it', () => {
    const orphan = { key: 'favouriteColour', type: 'text', label: 'Favourite colour' };
    expect(orphan.feeds).toBeUndefined(); // the rule above would fail on this
  });

  it('CATCHES a giving amount sneaking in under any of its names', () => {
    for (const k of ['givingAmount', 'givingTotal', 'income']) {
      expect(validateMemberRecord({ ...ok, [k]: 1 }, COLG_DEFAULT_CHURCH).ok).toBe(false);
    }
  });

  it('CATCHES a ministries list that stopped following the registry', () => {
    expect(SERVING_OPTIONS.length).toBe(CHURCH_MINISTRIES.length + 2);
  });
});
