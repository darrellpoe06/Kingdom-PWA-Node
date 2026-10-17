// =============================================================================
// The giving book feeds the contribution statement (DR-1073)
// =============================================================================
// DR-1064 built the Pub 1771 statement and shipped it with no caller; the
// church's book of what it received already existed. These cases are weighted
// at the ways the BRIDGE between them does real damage to a real person's taxes
// — not at the statement's own arithmetic, which DR-1064's 34 cases pin.
//
// The three ways, in the order they would actually happen in an office:
//   1. An unconfirmed match prints one person's money on another's statement.
//   2. The processor's fee is deducted from the giver's gift, understating
//      every electronic giver's year.
//   3. A refunded gift is dropped, overstating the year — the dangerous
//      direction, because the member files on it.
import { describe, it, expect } from 'vitest';
import {
  claimsForGiver, giftFromClaim, statementFromClaims,
  BASIS, UNCONFIRMED_NOTICE, SENDER_BASIS_NOTICE, GROSS_NOT_NET_NOTICE,
} from '../lib/giving-statement-source.js';

const CHURCH = {
  legalName: 'The Love Corner Church of God in Christ',
  addressLine: '1 Example St, Champaign, IL',
  ein: '00-0000000',
};
const RUTH = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';
const STEWARD = 'cccccccc-0000-0000-0000-000000000003';

/** A claim as `fromClaimRow` returns one. */
const claim = (o) => ({
  id: o.id, slug: o.id, batchId: o.batchId || 'batch-1',
  giverName: o.giverName || 'Ruth Example',
  parishionerId: o.parishionerId === undefined ? RUTH : o.parishionerId,
  matchBasis: o.matchBasis || 'name',
  confirmedBy: o.confirmedBy === undefined ? STEWARD : o.confirmedBy,
  givenOn: o.givenOn, givenAt: '10:30:00',
  grossCents: o.grossCents, feeCents: o.feeCents || 0,
  amountClaimedCents: o.grossCents - (o.feeCents || 0),
  fund: o.fund || 'offering', note: '', txnId: '',
});

describe('RULE 1 — a proposal is not a fact', () => {
  it('holds back an unconfirmed match, counts it, and says why', () => {
    const claims = [
      claim({ id: 'c1', givenOn: '2026-01-04', grossCents: 50000 }),                      // confirmed
      claim({ id: 'c2', givenOn: '2026-02-01', grossCents: 30000, confirmedBy: null }),    // PROPOSED only
    ];
    const picked = claimsForGiver(claims, { parishionerId: RUTH });
    expect(picked.basis).toBe(BASIS.member);
    expect(picked.rows.map((r) => r.id)).toEqual(['c1']);
    expect(picked.heldBack).toBe(1);
    expect(picked.heldBackCents).toBe(30000);

    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, issuedOn: '2027-01-15',
      parishionerId: RUTH,
    });
    expect(r.ok).toBe(true);
    expect(r.statement.totalCents, 'an unconfirmed gift reached a tax document').toBe(50000);
    expect(r.source.notices).toContain(UNCONFIRMED_NOTICE);
    // A member handed $500 when they remember giving $800 must be able to find
    // out why from the document itself.
    expect(r.source.heldBackCents).toBe(30000);
  });

  it('never carries another member’s gift, confirmed or not', () => {
    const claims = [
      claim({ id: 'mine', givenOn: '2026-03-01', grossCents: 10000 }),
      claim({ id: 'theirs', givenOn: '2026-03-02', grossCents: 99900, parishionerId: OTHER, giverName: 'Someone Else' }),
    ];
    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, parishionerId: RUTH,
    });
    expect(r.statement.totalCents).toBe(10000);
    expect(JSON.stringify(r.statement.gifts)).not.toMatch(/theirs/);
  });

  it('the SENDER path is offered for a giver nobody matched — and labelled as such', () => {
    // This is who most often asks for a record, and the book deliberately never
    // rewrites giver_name, so an exact name is the only honest selector.
    const claims = [
      claim({ id: 's1', givenOn: '2026-05-01', grossCents: 7500, parishionerId: null, confirmedBy: null, giverName: 'Visitor Jones' }),
    ];
    const picked = claimsForGiver(claims, { giverName: 'Visitor Jones' });
    expect(picked.basis).toBe(BASIS.sender);
    expect(picked.rows).toHaveLength(1);
    expect(picked.heldBack, 'the sender path has nothing to confirm').toBe(0);

    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Visitor Jones' }, year: 2026, giverName: 'Visitor Jones',
    });
    expect(r.ok).toBe(true);
    expect(r.source.notices[0]).toBe(SENDER_BASIS_NOTICE);
  });

  it('a near-miss name is NOT merged — two people are not one giver', () => {
    const claims = [
      claim({ id: 'a', givenOn: '2026-06-01', grossCents: 1000, parishionerId: null, confirmedBy: null, giverName: 'J Smith' }),
      claim({ id: 'b', givenOn: '2026-06-02', grossCents: 2000, parishionerId: null, confirmedBy: null, giverName: 'John Smith' }),
    ];
    expect(claimsForGiver(claims, { giverName: 'John Smith' }).rows.map((r) => r.id)).toEqual(['b']);
  });

  it('asking for nobody returns nobody, never everybody', () => {
    const claims = [claim({ id: 'x', givenOn: '2026-01-01', grossCents: 100 })];
    expect(claimsForGiver(claims, {}).rows).toEqual([]);
    expect(claimsForGiver(claims, { parishionerId: '  ' }).rows).toEqual([]);
  });
});

describe('RULE 2 — the deduction is what the giver gave, not what arrived', () => {
  it('uses GROSS, so the processor’s fee does not shrink the giver’s year', () => {
    const c = claim({ id: 'f1', givenOn: '2026-04-05', grossCents: 100000, feeCents: 2900 });
    expect(c.amountClaimedCents).toBe(97100);                 // the book's net
    expect(giftFromClaim(c).amountCents, 'the fee was taken off the giver’s gift').toBe(100000);

    const r = statementFromClaims({
      claims: [c], church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, parishionerId: RUTH,
    });
    expect(r.statement.totalCents).toBe(100000);
    expect(r.statement.deductibleCents).toBe(100000);
    expect(r.source.notices).toContain(GROSS_NOT_NET_NOTICE);
  });

  it('carries the method from the batch, and leaves it empty rather than guessing', () => {
    const c = claim({ id: 'm1', givenOn: '2026-04-05', grossCents: 1000, batchId: 'b7' });
    expect(giftFromClaim(c, { b7: 'cashapp' }).method).toBe('cashapp');
    expect(giftFromClaim(c, {}).method).toBe('');
  });

  it('never invents a non-cash description — the book holds no non-cash gift', () => {
    // A row with a description and no amount would be treated as a donated
    // piano and printed DESCRIBED-BUT-NOT-VALUED. Nothing in this book is that.
    const g = giftFromClaim(claim({ id: 'n1', givenOn: '2026-07-01', grossCents: 2500 }));
    expect(g.nonCashDescription).toBe('');
    expect(g.goodsValueCents).toBe(0);
  });
});

describe('RULE 3 — a refund is shown, not hidden', () => {
  it('a reversed gift reduces the total instead of vanishing from it', () => {
    const claims = [
      claim({ id: 'g1', givenOn: '2026-08-01', grossCents: 20000 }),
      claim({ id: 'r1', givenOn: '2026-08-09', grossCents: -20000 }),   // reversed
    ];
    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, parishionerId: RUTH,
    });
    expect(r.statement.totalCents, 'a refunded gift was counted as given').toBe(0);
    expect(r.statement.gifts, 'the reversal must be followable on the page').toHaveLength(2);
    expect(r.source.counted).toBe(2);
  });
});

describe('the refusals still refuse, and still carry the source', () => {
  it('an empty year refuses — and still says what was held back', () => {
    // The worst version of this: a member whose only two gifts are unconfirmed
    // proposals is told "no gifts are recorded", which reads as a denial of
    // something the church is in fact holding.
    const claims = [
      claim({ id: 'p1', givenOn: '2026-09-01', grossCents: 15000, confirmedBy: null }),
      claim({ id: 'p2', givenOn: '2026-09-08', grossCents: 15000, confirmedBy: null }),
    ];
    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, parishionerId: RUTH,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no-gifts');
    expect(r.source.heldBack).toBe(2);
    expect(r.source.heldBackCents).toBe(30000);
    expect(r.source.notices).toContain(UNCONFIRMED_NOTICE);
  });

  it('a different year issues nothing from this year’s claims', () => {
    const claims = [claim({ id: 'y1', givenOn: '2026-01-02', grossCents: 5000 })];
    const r = statementFromClaims({
      claims, church: CHURCH, member: { name: 'Ruth Example' }, year: 2025, parishionerId: RUTH,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no-gifts');
  });

  it('an incomplete church still refuses, bridge or no bridge', () => {
    const claims = [claim({ id: 'i1', givenOn: '2026-01-02', grossCents: 5000 })];
    const r = statementFromClaims({
      claims, church: { name: '' }, member: { name: 'Ruth Example' }, year: 2026, parishionerId: RUTH,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('issuer-incomplete');
  });

  it('the bridge is pure — no fetch, no store, no clock', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const code = readFileSync(join(here, '..', 'lib', 'giving-statement-source.js'), 'utf8');
    expect(code).not.toMatch(/fetch\(|\.insert\(|\.upsert\(|localStorage|supabase/);
    expect(code, 'a clock makes the issued date untestable').not.toMatch(/Date\.now\(|new Date\(/);
  });
});

describe('THE DOCUMENT THAT IS HANDED OVER — Pub 1771’s required elements', () => {
  const build = (extra = {}) => statementFromClaims({
    claims: [
      claim({ id: 'd1', givenOn: '2026-01-04', grossCents: 30000, feeCents: 900 }),
      claim({ id: 'd2', givenOn: '2026-06-07', grossCents: 5000 }),
      ...(extra.claims || []),
    ],
    batches: [{ id: 'batch-1', source: 'cashapp' }],
    church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, issuedOn: '2027-01-15',
    parishionerId: RUTH,
    ...extra.over,
  });

  it('carries the church, the giver, and every gift with its date and amount', async () => {
    const { statementToText } = await import('../lib/giving-statement-source.js');
    const r = build();
    const text = statementToText(r.statement, r.source);
    // The four elements without which it is not an acknowledgment at all.
    expect(text).toContain('The Love Corner Church of God in Christ');
    expect(text).toContain('Ruth Example');
    expect(text).toMatch(/2026-01-04\s+\$300\.00/);
    expect(text).toMatch(/2026-06-07\s+\$50\.00/);
    expect(text).toContain('Total  $350.00');
    expect(text, 'the goods-or-services statement is required on every one')
      .toMatch(/no goods or services|in exchange/i);
    expect(text).toContain('EIN 00-0000000');
    expect(text).toContain('Issued: 2027-01-15');
    // RULE 2 again, this time on the page the member actually reads: $309 was
    // deposited, $300 was given, and $300 is what the document says.
    expect(text, 'the net reached the document').not.toContain('$291.00');
  });

  it('A GIFT OF $250 OR MORE IS FLAGGED — it cannot be claimed without this page', async () => {
    const { statementToText } = await import('../lib/giving-statement-source.js');
    const r = build();
    expect(r.statement.countOverThreshold).toBe(1);
    expect(statementToText(r.statement, r.source)).toMatch(/\$250 or more/);
  });

  it('tells the member about gifts held back, on the document and not only on screen', async () => {
    const { statementToText } = await import('../lib/giving-statement-source.js');
    const r = build({ claims: [claim({ id: 'u1', givenOn: '2026-03-03', grossCents: 12000, confirmedBy: null })] });
    const text = statementToText(r.statement, r.source);
    // Someone comparing this against their own bank will find the difference.
    // They should not have to phone the office to learn why.
    expect(text).toMatch(/1 further gift totalling \$120\.00/);
    expect(text).toContain(UNCONFIRMED_NOTICE);
    expect(r.statement.totalCents).toBe(35000);
  });

  it('never prints a value for a gift that is not money', async () => {
    const { statementToText } = await import('../lib/giving-statement-source.js');
    // Reached through buildStatement directly, since the book holds no
    // non-cash gift: the text renderer must still obey the rule.
    const { buildStatement } = await import('../lib/giving-statement.js');
    const r = buildStatement({
      church: CHURCH, member: { name: 'Ruth Example' }, year: 2026, issuedOn: '2027-01-15',
      gifts: [
        { id: 'a', date: '2026-02-02', amountCents: 10000 },
        { id: 'b', date: '2026-02-03', nonCashDescription: 'An upright piano' },
      ],
    });
    const text = statementToText(r.statement);
    expect(text).toContain('described, not valued');
    expect(text).toContain('An upright piano');
    const nonCashBlock = text.slice(text.indexOf('GIFTS OTHER THAN MONEY'));
    expect(nonCashBlock.slice(0, nonCashBlock.indexOf('\n\n')), 'a value was printed for the piano')
      .not.toMatch(/\$/);
  });

  it('carries the tax teaching, which never promises a benefit', async () => {
    const { statementToText } = await import('../lib/giving-statement-source.js');
    const text = statementToText(build().statement);
    expect(text).toMatch(/only if you ITEMIZE/);
    // DR-1064's rule: no standard-deduction figure is printed, because it
    // changes every year and a stale number on a tax document is a liability.
    expect(text).not.toMatch(/\$1[0-9],[0-9]{3}|\$2[0-9],[0-9]{3}/);
  });
});
