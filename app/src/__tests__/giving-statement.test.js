// @vitest-environment node
// =============================================================================
// The church-issued contribution statement (DR-1064)
// =============================================================================
// Darrell, 2026-10-16, with the membership agreement open on "it holds no
// giving amount and no giving total": **"The church has will need to have
// recorded records for giving for tax purposes..."** — then: **"They will have
// to accept that we do keep these types of records in the signin for the app
// when they give something... they can also give anonymous... however we need
// to know all possible data... make sure people know the tax benefits of their
// church tithe."**
//
// The cases below are weighted at the ways a statement can HARM the person
// holding it, which is a different list from the ways it can be untidy:
//   1. ISSUING ONE THAT CANNOT STAND. A statement missing a required element is
//      worse than none — the member relies on it and finds out at an audit.
//   2. VALUING A NON-CASH GIFT. The church describing a donated car is correct;
//      the church pricing it is the church signing a number it did not verify.
//   3. OVER-CLAIMING THE TAX BENEFIT. "Your tithe is a deduction" is false for
//      most households, and the ones it is least true for can least absorb it.
import { describe, it, expect } from 'vitest';
import {
  WRITTEN_ACK_THRESHOLD_CENTS, QUID_PRO_QUO_THRESHOLD_CENTS, NO_GOODS_STATEMENT,
  STATEMENT_PROVENANCE, ANONYMOUS_NOTICE, isAnonymous,
  checkIssuer, normalizeGift, buildStatement, quidProQuoDisclosure,
  statementWarnings, contemporaneousCheck, TITHE_TAX_TEACHING, titheTaxNote,
} from '../lib/giving-statement.js';
import { RECORD_PROVENANCE } from '../lib/giving-records.js';
import { CHURCH_MEMBER_ALL_FIELDS } from '../lib/church-member-intake.js';

const CHURCH = { legalName: 'The Love Corner Church of the Living God', addressLine: '1 Church Way, TX', ein: '00-0000000' };
const MEMBER = { name: 'Christina Poe' };
const gift = (o) => ({ id: o.id || o.date, date: o.date, fund: 'tithe', amountCents: o.amountCents ?? 0, ...o });

const build = (o = {}) => buildStatement({ church: CHURCH, member: MEMBER, year: 2026, issuedOn: '2027-01-20', ...o });

describe('THE GAP: three giving roads existed and none of them was this one', () => {
  it('the giver’s own ledger says the statement comes from the office', () => {
    // Characterizing the state of the world before the change (DR-0076 §5):
    // one road points at the office, and the office's road says it is not the
    // document. The statement itself was never built.
    expect(RECORD_PROVENANCE).toMatch(/official contribution statement comes from the church office/i);
  });

  it('...and this statement says what IT is, without overstating itself', () => {
    expect(STATEMENT_PROVENANCE).toMatch(/Issued by the church from its own records/i);
    expect(STATEMENT_PROVENANCE).toMatch(/does not give tax advice/i);
  });
});

describe('it refuses rather than issuing something it cannot stand behind', () => {
  it('no legal name or address: refused, naming exactly what is missing', () => {
    const r = buildStatement({ church: { legalName: 'X' }, member: MEMBER, year: 2026, gifts: [gift({ date: '2026-01-01', amountCents: 100 })] });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('issuer-incomplete');
    expect(r.missing).toContain('the church’s address');
    expect(r.message).toMatch(/cannot be issued yet/i);
  });

  it('an unnamed member is refused — a statement must name the giver', () => {
    const r = build({ member: {}, gifts: [gift({ date: '2026-01-01', amountCents: 100 })] });
    expect(r.reason).toBe('no-member-name');
  });

  it('a bad year is refused before any arithmetic', () => {
    expect(build({ year: 0, gifts: [] }).reason).toBe('bad-year');
    expect(build({ year: '20x6', gifts: [] }).reason).toBe('bad-year');
  });

  it('AN EMPTY YEAR ISSUES NOTHING — a statement reading $0 reads like a denial', () => {
    const r = build({ gifts: [gift({ date: '2025-05-05', amountCents: 5000 })] });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no-gifts');
  });
});

describe('the Pub 1771 elements are decided from the data, not pasted on', () => {
  it('a plain year carries the no-goods statement and a correct total', () => {
    const r = build({ gifts: [
      gift({ date: '2026-01-04', amountCents: 10000 }),
      gift({ date: '2026-02-01', amountCents: 25000 }),
    ] });
    expect(r.ok).toBe(true);
    expect(r.statement.totalCents).toBe(35000);
    expect(r.statement.goodsStatement).toBe(NO_GOODS_STATEMENT);
    expect(r.statement.issuer.name).toBe(CHURCH.legalName);
  });

  it('gifts of $250 or more are counted, because those are the ones that NEED this', () => {
    const r = build({ gifts: [
      gift({ date: '2026-01-04', amountCents: WRITTEN_ACK_THRESHOLD_CENTS - 1 }),
      gift({ date: '2026-02-04', amountCents: WRITTEN_ACK_THRESHOLD_CENTS }),
      gift({ date: '2026-03-04', amountCents: 100000 }),
    ] });
    expect(r.statement.countOverThreshold).toBe(2);   // the boundary is inclusive
  });

  it('A NON-CASH GIFT IS DESCRIBED AND NEVER VALUED', () => {
    // The church pricing a donated piano is the church signing a number it did
    // not verify. Pub 1771 says describe, do not value, and that is right.
    const r = build({ gifts: [
      gift({ date: '2026-04-01', amountCents: 0, nonCashDescription: 'An upright piano' }),
      gift({ date: '2026-04-02', amountCents: 5000 }),
    ] });
    expect(r.statement.totalCents, 'a non-cash gift leaked into the cash total').toBe(5000);
    expect(r.statement.nonCashDescriptions).toEqual([{ date: '2026-04-01', description: 'An upright piano' }]);
    expect(JSON.stringify(r.statement.nonCashDescriptions)).not.toMatch(/\$|cents|value/i);
    expect(r.statement.warnings.join(' ')).toMatch(/NOT valued, which is correct/);
  });

  it('a quid pro quo over $75 discloses that only the excess is deductible', () => {
    const r = build({ gifts: [gift({ date: '2026-05-01', amountCents: 20000, goodsValueCents: 5000 })] });
    const s = r.statement;
    expect(s.totalCents).toBe(20000);
    expect(s.deductibleCents, 'the value received was not subtracted').toBe(15000);
    expect(s.goodsStatement).toMatch(/only the amount paid ABOVE their value is deductible/i);
    expect(s.goodsStatement).toMatch(/\$150\.00 deductible/);
    expect(s.goodsStatement).not.toBe(NO_GOODS_STATEMENT);
  });

  it('a payment AT OR UNDER $75 is not a quid pro quo disclosure case', () => {
    const g = normalizeGift({ date: '2026-05-01', amountCents: QUID_PRO_QUO_THRESHOLD_CENTS, goodsValueCents: 1000 });
    expect(g.isQuidProQuo).toBe(false);
    // ...but the arithmetic is still honest about what was received.
    expect(g.deductibleCents).toBe(QUID_PRO_QUO_THRESHOLD_CENTS - 1000);
  });

  it('MONEY NEVER DRIFTS: 300 gifts of $33.33 total exactly', () => {
    const gifts = Array.from({ length: 300 }, (_, i) => gift({ id: `g${i}`, date: '2026-06-01', amountCents: 3333 }));
    expect(build({ gifts }).statement.totalCents).toBe(999900);
  });

  it('gifts come out in date order, stably', () => {
    const r = build({ gifts: [
      gift({ id: 'c', date: '2026-03-01', amountCents: 1 }),
      gift({ id: 'a', date: '2026-01-01', amountCents: 1 }),
      gift({ id: 'b', date: '2026-01-01', amountCents: 1 }),
    ] });
    expect(r.statement.gifts.map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('anonymous giving is kept, and what it costs is SAID', () => {
  it('the church records it; the statement honestly cannot carry it', () => {
    const r = build({ gifts: [
      gift({ date: '2026-01-01', amountCents: 10000 }),
      gift({ date: '2026-02-01', amountCents: 50000, anonymous: true }),
    ] });
    expect(r.statement.totalCents, 'an anonymous gift was put on a statement that names a donor').toBe(10000);
    expect(r.statement.anonymousCount).toBe(1);
    expect(r.statement.warnings.join(' ')).toMatch(/given anonymously and is NOT on this statement/);
    expect(r.statement.warnings.join(' ')).toMatch(/Say so when you send it/);
  });

  it('a year of ONLY anonymous gifts says that, not "no gifts"', () => {
    // "No gifts are recorded" would be a lie to someone who gave all year.
    const r = build({ gifts: [gift({ date: '2026-02-01', amountCents: 50000, anonymous: true })] });
    expect(r.reason).toBe('only-anonymous');
    expect(r.anonymousCount).toBe(1);
    expect(r.message).toMatch(/The church has them in its records/);
  });

  it('the trade is stated BEFORE the choice, and both options are honoured', () => {
    expect(ANONYMOUS_NOTICE).toMatch(/still records the gift/i);
    expect(ANONYMOUS_NOTICE).toMatch(/will not be on your contribution statement/i);
    expect(ANONYMOUS_NOTICE).toMatch(/Both are honourable/i);
  });

  it('it reads both field spellings', () => {
    expect(isAnonymous({ anonymous: true })).toBe(true);
    expect(isAnonymous({ is_anonymous: true })).toBe(true);
    expect(isAnonymous({})).toBe(false);
  });
});

describe('THE TAX TEACHING DOES NOT OVER-CLAIM', () => {
  it('it leads with the CONDITION, never with "your tithe is a deduction"', () => {
    expect(TITHE_TAX_TEACHING.theTest).toMatch(/only if you ITEMIZE/i);
    expect(TITHE_TAX_TEACHING.theHonestPart).toMatch(/most households take it/i);
    expect(TITHE_TAX_TEACHING.theHonestPart).toMatch(/not a write-off/i);
  });

  it('NO DOLLAR FIGURE FOR THE STANDARD DEDUCTION IS PRINTED ANYWHERE', () => {
    // A number typed from memory would be read off a church surface by a family
    // making a real decision, and a stale one is worse than none. The teaching
    // carries the TEST and names who holds the current figure.
    const prose = [TITHE_TAX_TEACHING.theTest, TITHE_TAX_TEACHING.theHonestPart, TITHE_TAX_TEACHING.whoDecides].join(' ');
    expect(/standard deduction (is|of|was)\s*\$/i.test(prose), 'a standard-deduction figure was printed').toBe(false);
    expect(TITHE_TAX_TEACHING.whoDecides).toMatch(/change every year/i);
    expect(TITHE_TAX_TEACHING.whoDecides).toMatch(/your preparer/i);
  });

  it('the one figure it DOES name is the one that does not move: the $250 rule', () => {
    expect(TITHE_TAX_TEACHING.whatNeverChanges).toMatch(/\$250 or more/);
    expect(TITHE_TAX_TEACHING.whatNeverChanges).toMatch(/written acknowledgment/i);
  });

  it('the Word is quoted verbatim and the ORDER is named', () => {
    expect(TITHE_TAX_TEACHING.theOrder.translation).toBe('KJV');
    expect(TITHE_TAX_TEACHING.theOrder.text).toContain('God loveth a cheerful giver');
    expect(TITHE_TAX_TEACHING.theOrder.text).toContain('Take heed that ye do not your alms before men');
    expect(TITHE_TAX_TEACHING.theOrder.note).toMatch(/real, and it is second/i);
  });

  it('the note on a statement is shaped by what is actually on it', () => {
    const plain = titheTaxNote({ countOverThreshold: 0 });
    expect(plain).toMatch(/only if you ITEMIZE/i);
    expect(plain).toMatch(/Keep the statement either way/i);
    const big = titheTaxNote({ countOverThreshold: 3 });
    expect(big).toMatch(/3 of your gifts this year were \$250 or more/);
    expect(big).toMatch(/cannot be claimed at all without this statement/i);
  });
});

describe('contemporaneous — in their hands in time to be used', () => {
  it('January of the following year is in time', () => {
    const r = contemporaneousCheck(2026, '2027-01-20');
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/2027-04-15/);
    expect(r.message, 'it claims to know when the member filed').toMatch(/provided the member had not already filed/);
  });

  it('after the due date says so, and says what to do next year', () => {
    const r = contemporaneousCheck(2026, '2027-06-01');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('late');
    expect(r.message).toMatch(/AFTER the ordinary 2026 due date/);
    expect(r.message).toMatch(/by the end of January/);
  });

  it('the due date itself is in time; nonsense is "unknown", never a guess', () => {
    expect(contemporaneousCheck(2026, '2027-04-15').ok).toBe(true);
    expect(contemporaneousCheck(2026, 'sometime').reason).toBe('unknown');
  });
});

describe('the issuer check, and what it warns about rather than refusing', () => {
  it('a missing EIN WARNS and does not block — Pub 1771 does not require it', () => {
    const r = buildStatement({ church: { ...CHURCH, ein: '' }, member: MEMBER, year: 2026, issuedOn: '2027-01-20', gifts: [gift({ date: '2026-01-01', amountCents: 100 })] });
    expect(r.ok, 'a missing EIN blocked a statement it does not invalidate').toBe(true);
    expect(r.statement.warnings.join(' ')).toMatch(/No EIN is on file/);
  });

  it('checkIssuer accepts either naming of the fields', () => {
    expect(checkIssuer({ name: 'A', address: 'B' }).ok).toBe(true);
    expect(checkIssuer({}).ok).toBe(false);
  });

  it('an undated gift is named rather than quietly dropped into a year', () => {
    expect(statementWarnings({ church: CHURCH, rows: [{ date: '' }] }).join(' ')).toMatch(/no usable date/);
  });

  it('quidProQuoDisclosure names every affected gift, not just the total', () => {
    const rows = [
      normalizeGift({ date: '2026-05-01', amountCents: 20000, goodsValueCents: 5000 }),
      normalizeGift({ date: '2026-09-01', amountCents: 30000, goodsValueCents: 10000 }),
    ];
    const s = quidProQuoDisclosure(rows);
    expect(s).toMatch(/2026-05-01/);
    expect(s).toMatch(/2026-09-01/);
  });
});

describe('the membership agreement no longer reads as "no record exists"', () => {
  const covenant = CHURCH_MEMBER_ALL_FIELDS.find((q) => q.key === 'churchCovenant');

  it('the promise that MATTERS is kept word for word', () => {
    // Giving must never appear on a member card. That was always true and must
    // stay true — this record only removed the ambiguity around it.
    expect(covenant.statement).toMatch(/THIS record holds no giving amount and no giving total/);
    expect(covenant.statement).toMatch(/no one reading the roll can see what I give/);
  });

  it('...and the giving record is now acknowledged, with the anonymous carve-out', () => {
    expect(covenant.statement).toMatch(/separately records the gifts it receives/i);
    expect(covenant.statement).toMatch(/that record is mine to read/i);
    expect(covenant.statement).toMatch(/unless I chose to give anonymously/i);
  });

  it('EVERY original refusal survives the rewrite', () => {
    // The easiest way to do harm here is to lose a protection while adding a
    // sentence. Each one is pinned.
    //
    // ONE was deliberately removed rather than lost, and it is named here so
    // the removal stays a decision instead of becoming a silent drift: the
    // "never sent to… an advertiser" clause. DR-1071 struck it because the
    // app's own sign-in offers a Google door (app/src/lib/supabase.js,
    // signInWithOAuth provider 'google'), so a member signing that clause was
    // signing something already untrue. The covenant now names that door
    // plainly instead, and the pin for it lives in church-member-intake.test.js.
    for (const promise of [/(never|ever) willingly sell/i, /employer/i, /lender/i, /who is welcome/i, /train anything/i, /prayer request goes only as far as I said/i, /mine to read, correct, take a copy of and have removed at any time/i]) {
      expect(covenant.statement, `a protection was lost: ${promise}`).toMatch(promise);
    }
    expect(covenant.statement, 'the advertiser clause must stay struck, not quietly return')
      .not.toMatch(/advertiser/i);
  });

  it('the refusals govern the GIVING record too, not only the member card', () => {
    // The rewrite first turned "never sold, never sent to…" into "NONE OF IT is
    // ever sold…", and DR-1071 then gave the promise a subject — "THE CHURCH
    // will never willingly sell my record, my giving or my prayer requests".
    // Both moves widened the antecedent to cover both records, and that is the
    // reason the wording moved — pinned so a later tidy-up cannot narrow it
    // back to the member card alone.
    const at = covenant.statement.search(/The church will never willingly sell/i);
    expect(at, 'the refusal clause is gone').toBeGreaterThan(-1);
    const tail = covenant.statement.slice(at);
    for (const r of [/my giving/i, /my prayer requests/i, /employer/i, /lender/i, /who is welcome/i, /train anything/i]) {
      expect(tail, `${r} fell outside the refusal clause`).toMatch(r);
    }
  });

  it('A GIVING RECORD IS THE WORST THING TO OVERPROMISE ABOUT (DR-1071)', () => {
    // This suite is the one that matters most for this correction. A member
    // decides whether to give through this app partly on the strength of the
    // sentence above. If that sentence reads like a guarantee and the church is
    // still learning how to hold the data, the giver was misled about the one
    // record that names their money.
    expect(covenant.statement).toMatch(/still learning/i);
    expect(covenant.statement).toMatch(/real risk/i);
    expect(covenant.statement).toMatch(/their will, not their perfection/i);
  });
});
