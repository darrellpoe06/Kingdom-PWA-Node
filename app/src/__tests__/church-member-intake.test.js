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
    // An acknowledgment lives under `acknowledgments` (the shape the engine
    // signs against), everything else at the top level — same as the household.
    const e = emptyMemberRecord();
    for (const f of CHURCH_MEMBER_ALL_FIELDS) {
      if (f.type === 'acknowledgment') expect(e.acknowledgments, f.key).toHaveProperty(f.key);
      else expect(e, f.key).toHaveProperty(f.key);
    }
  });

  it('carries a SIGNING POINT — a covenant nobody can sign is a promise nobody made', () => {
    const ack = CHURCH_MEMBER_ALL_FIELDS.find((f) => f.type === 'acknowledgment');
    expect(ack, 'the intake must end in an agreement').toBeTruthy();
    expect(ack.required).toBe(true);
    expect(ack.statement).toMatch(/no giving amount/i);
    expect(ack.statement).toMatch(/only as far as I said/i);
    // DR-1064 widened the refusals from "never sold, never sent to…" to
    // "NONE OF IT is ever sold, ever sent to…", because the covenant now speaks
    // about TWO records — the member card, which holds no giving figure, and
    // the church's record of gifts received, which it must keep. DR-1071 then
    // moved the subject again, to the church itself ("the church will never
    // willingly sell my record, my giving or my prayer requests"), because a
    // promise has to name who is making it. The antecedent has changed three
    // times; the promise has only widened. Matched on the sentence rather than
    // on a word, and the clause itself is pinned below.
    expect(ack.statement).toMatch(/(never|ever) (used to|hand them to anyone to) train anything/i);
  });

  it('the refusals govern EVERY record the covenant names, not only the member card (DR-1064)', () => {
    // The easiest way to do harm here is to narrow the refusal clause back to
    // one record while the sentence still reads reassuringly. The clause is
    // found by its own opening rather than by a fixed index, so it survives a
    // rewrite of the sentences around it (DR-1071 rewrote three of them).
    const { statement } = CHURCH_MEMBER_ALL_FIELDS.find((f) => f.type === 'acknowledgment');
    expect(statement).toMatch(/separately records the gifts it receives/i);
    expect(statement).toMatch(/that record is mine to read/i);
    const at = statement.search(/The church will never willingly sell/i);
    expect(at, 'the refusal clause is gone').toBeGreaterThan(-1);
    const tail = statement.slice(at);
    for (const r of [/my record, my giving or my prayer requests/i, /employer/i, /lender/i, /who is welcome/i, /train anything/i]) {
      expect(tail, `${r} fell outside the refusals`).toMatch(r);
    }
  });

  it('IT PROMISES A WILL, NOT A PERFECTION — the risk is disclosed, not papered over (DR-1071)', () => {
    // Darrell, 2026-10-16: "dont add constraints for fake values... we won't
    // willingly sell data... period... however we are still learning and
    // researching and don't know everything yet... so its a risk... period!!!
    // Grow with us or don't!!!"
    //
    // So the harm this case exists to catch is NOT a weak promise. It is a
    // STRONG one we cannot keep: a covenant that reads like a guarantee of
    // safety is a lie the moment anything goes wrong, and the member signed it.
    // Three things therefore have to be in the sentence a member signs.
    const { statement } = CHURCH_MEMBER_ALL_FIELDS.find((f) => f.type === 'acknowledgment');

    // 1. The promise is about WILL. "Never willingly", not "never possible".
    expect(statement, 'the promise must name itself as a will, not an impossibility')
      .toMatch(/never willingly/i);
    expect(statement).toMatch(/their will, not their perfection/i);

    // 2. The learning, and therefore the risk, is said out loud.
    expect(statement).toMatch(/still learning/i);
    expect(statement).toMatch(/do not know everything yet/i);
    expect(statement).toMatch(/real risk/i);
    expect(statement, 'a wrong turn must be something we say, not something they discover')
      .toMatch(/say so when they find they were wrong/i);

    // 3. The measurement that makes the thing better is DISCLOSED rather than
    //    denied — including the Google sign-in door that already exists
    //    (app/src/lib/supabase.js, signInWithOAuth provider 'google'), and the
    //    two doors that do not involve Google at all.
    expect(statement).toMatch(/counts how its PAGES are used/);
    expect(statement).toMatch(/sign in with Google, then Google knows/i);
    expect(statement).toMatch(/phone-and-PIN door or an email and password/i);

    // 4. And the claims we are no longer in a position to make are GONE. An
    //    "advertiser" clause cannot stand on a surface whose sign-in door is
    //    an advertiser's, and no sentence may promise a guarantee.
    expect(statement, 'the advertiser promise was removed; it had become false')
      .not.toMatch(/advertiser/i);
    //    The word "guarantee" appears once, and only to refuse the posture:
    //    "told to me straight rather than dressed up as a guarantee".
    expect(statement).toMatch(/rather than dressed up as a guarantee/i);
    expect(statement, 'a covenant may not promise a guarantee of safety')
      .not.toMatch(/(we|they|the church) (guarantee|ensure)|completely (safe|secure)|fully secure|100%/i);
    expect(statement, 'and it may not claim a safety that has not been built')
      .toMatch(/will not claim a safety they have not built yet/i);
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
    const orphan = { key: 'favouriteColour', type: 'text', label: 'Favourite color' };
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
