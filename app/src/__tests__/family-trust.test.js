// family-trust.test.js — the Legacy Provisions ENGINE (the business system).
//
// This file's whole purpose is PROVEN-TO-CATCH (DR-0076 §3): every honesty rule
// the system claims is tested by feeding the case that would break it and
// REQUIRING the honest answer. A gate that only asserts the happy path is
// theatre — each block below would fail if the engine started painting.
//
//   • An empty ledger reports 'no-record' with a NULL total — never zero, never
//     a pass. (Absent is not zero.)
//   • A check whose inputs are missing reports 'unknown' — never 'pass'.
//   • distributionReview NEVER returns 'clear' on unknown or no-record.
//   • An unanswered spendthrift item reads 'unreviewed' — never 'protected' —
//     and an all-unanswered review is NOT confirmed.
//   • An unattested constitution article is reported missing.
import { describe, it, expect } from 'vitest';
import {
  FAMILY_CONSTITUTION,
  TRUST_PROVISIONS,
  provisionById,
  ENTRY_KINDS,
  PRODUCTION_KINDS,
  POE_PRODUCTION_POLICY,
  SPENDTHRIFT_REVIEW_ITEMS,
  toAmount,
  normalizeEntry,
  normalizeEntries,
  entriesInPeriod,
  productionStanding,
  standingsFor,
  distributionReview,
  constitutionStanding,
  spendthriftAnswersFrom,
  spendthriftReview,
  trustSystemSummary,
  exportConstitutionMarkdown,
  exportProvisionsMarkdown,
  adoptConstitution,
} from '../lib/family-trust.js';

const ASOF = '2026-09-02';
const prod = (over = {}) => ({ id: `p-${Math.random()}`, kind: 'production', beneficiary: 'heir', occurredAt: '2026-06-01', productionKind: 'business', ...over });
const dist = (over = {}) => ({ id: `d-${Math.random()}`, kind: 'distribution', beneficiary: 'heir', occurredAt: '2026-06-15', ...over });

describe('the three provisions Darrell named are all present, with their honest limits', () => {
  it('carries exactly the three provisions, each stating what it does NOT do', () => {
    expect(TRUST_PROVISIONS.map((p) => p.id)).toEqual([
      'constitution-reference', 'spendthrift', 'forced-income-production',
    ]);
    for (const p of TRUST_PROVISIONS) {
      expect(p.oneLine, `${p.id} oneLine`).toBeTruthy();
      expect(p.mustSay.length, `${p.id} drafting checklist`).toBeGreaterThan(2);
      expect(p.limits.length, `${p.id} MUST state its limits`).toBeGreaterThan(0);
      expect(p.appOperates.length, `${p.id} must name what the app operates`).toBeGreaterThan(0);
    }
  });

  it('the spendthrift record names the self-settled and exception-creditor limits', () => {
    const limits = provisionById.spendthrift.limits.join(' ').toLowerCase();
    expect(limits).toContain('self-settled');
    expect(limits).toContain('child support');
  });

  it('the constitution is prepopulated with real articles, each anchored', () => {
    expect(FAMILY_CONSTITUTION.family).toMatch(/Poe/);
    expect(FAMILY_CONSTITUTION.articles.length).toBeGreaterThanOrEqual(10);
    for (const a of FAMILY_CONSTITUTION.articles) {
      expect(a.id).toBeTruthy();
      expect(a.statement.length).toBeGreaterThan(60);
      expect(a.standards.length).toBeGreaterThan(0);
      expect(a.anchor?.ref).toBeTruthy();
      expect(a.anchor?.quote).toBeTruthy();
    }
  });
});

describe('constitution Scripture is verbatim KJV (proven-to-catch)', () => {
  // Fetched verbatim from app/public/bible/kjv/*.json. Paraphrase one and this
  // test fails — the same safeguard the courses carry.
  const VERBATIM = [
    'Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.',
    'but as for me and my house, we will serve the LORD.',
    'Honour the LORD with thy substance, and with the firstfruits of all thine increase',
    'Thou oughtest therefore to have put my money to the exchangers',
    'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
    'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
    'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.',
    'Lying lips are abomination to the LORD: but they that deal truly are his delight.',
    'the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all',
    'who should arise and declare them to their children',
    'Write the vision, and make it plain upon tables, that he may run that readeth it.',
    'So shall not the inheritance of the children of Israel remove from tribe to tribe',
    'Occupy till I come.',
  ];
  const quotes = [
    ...FAMILY_CONSTITUTION.articles.map((a) => a.anchor.quote),
    ...TRUST_PROVISIONS.map((p) => p.anchor?.quote || ''),
  ].join('\n');
  for (const frag of VERBATIM) {
    it(`quotes verbatim: "${frag.slice(0, 40)}…"`, () => {
      expect(quotes).toContain(frag);
    });
  }
});

describe('absent is not zero (the rule the whole system stands on)', () => {
  it('toAmount returns null — not 0 — for absent values', () => {
    expect(toAmount(null)).toBeNull();
    expect(toAmount('')).toBeNull();
    expect(toAmount(undefined)).toBeNull();
    expect(toAmount('not a number')).toBeNull();
    expect(toAmount(0)).toBe(0); // an explicitly entered zero IS a zero
    expect(toAmount('12.50')).toBe(12.5);
  });

  it('an EMPTY ledger reports no-record with a null total — never 0, never a pass', () => {
    const s = productionStanding([], { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('no-record');
    expect(s.produced.total).toBeNull();
    expect(s.received.total).toBeNull();
    expect(s.checks).toEqual([]);
    expect(s.headline).toMatch(/not a zero and not a pass/i);
  });

  it('a production entry with NO amount totals null, not zero', () => {
    const s = productionStanding([prod({ amount: null }), prod({ amount: null, occurredAt: '2026-07-01' })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.produced.count).toBe(2);
    expect(s.produced.total).toBeNull();
    expect(s.produced.valued).toBe(0);
  });
});

describe('the checks report unknown rather than pass when they cannot be evaluated', () => {
  it('a distribution with no amount makes the ratio check UNKNOWN, and the standing unverified', () => {
    const entries = [prod({ amount: 1000 }), prod({ occurredAt: '2026-07-01', amount: 500 }), dist({ amount: null })];
    const s = productionStanding(entries, { beneficiary: 'heir', asOf: ASOF });
    const ratio = s.checks.find((c) => c.id === 'contribute-back');
    expect(ratio.result).toBe('unknown');
    expect(s.status).toBe('unverified');
  });

  it('recorded contributions with no amounts still cannot satisfy the ratio', () => {
    const entries = [
      prod({ amount: 1000 }),
      prod({ occurredAt: '2026-07-01', productionKind: 'contribution', amount: null }),
      dist({ amount: 10000 }),
    ];
    const s = productionStanding(entries, { beneficiary: 'heir', asOf: ASOF });
    expect(s.checks.find((c) => c.id === 'contribute-back').result).toBe('unknown');
    expect(s.status).toBe('unverified');
  });

  it('a real shortfall is a FAIL, not an unknown', () => {
    const entries = [
      prod({ amount: 1000 }),
      prod({ occurredAt: '2026-07-01', productionKind: 'contribution', amount: 100 }),
      dist({ amount: 10000 }),
    ];
    const s = productionStanding(entries, { beneficiary: 'heir', asOf: ASOF });
    expect(s.checks.find((c) => c.id === 'contribute-back').result).toBe('fail');
    expect(s.status).toBe('short');
  });

  it('a met requirement is a pass', () => {
    const entries = [
      prod({ amount: 1000 }),
      prod({ occurredAt: '2026-07-01', productionKind: 'contribution', amount: 1200 }),
      dist({ amount: 10000 }),
    ];
    const s = productionStanding(entries, { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('meets');
  });

  it('drawing with NO production on record fails the take-only check', () => {
    const s = productionStanding([dist({ amount: 5000 })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.checks.find((c) => c.id === 'not-take-only').result).toBe('fail');
    expect(s.status).toBe('short');
  });

  it('an exemption on record exempts the period instead of failing the heir', () => {
    const s = productionStanding(
      [{ id: 'x', kind: 'exemption', beneficiary: 'heir', occurredAt: '2026-05-01', reason: 'illness or injury' }, dist({ amount: 5000 })],
      { beneficiary: 'heir', asOf: ASOF },
    );
    expect(s.status).toBe('exempt');
  });
});

describe('the distribution gate fails safe toward the governor, never toward the money', () => {
  it('NEVER clears on no-record', () => {
    const s = productionStanding([], { beneficiary: 'heir', asOf: ASOF });
    expect(distributionReview(s, { amount: 25000 }).decision).toBe('review');
  });

  it('NEVER clears on unverified', () => {
    const s = productionStanding([prod({ amount: 1 }), prod({ occurredAt: '2026-07-02', amount: 1 }), dist({ amount: null })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('unverified');
    expect(distributionReview(s, { amount: 25000 }).decision).toBe('review');
  });

  it('HOLDS on a real shortfall', () => {
    const s = productionStanding([dist({ amount: 9000 })], { beneficiary: 'heir', asOf: ASOF });
    expect(distributionReview(s, { amount: 9000 }).decision).toBe('hold');
  });

  it('clears a support-level request under the review floor even with no record — support is never a penalty', () => {
    const s = productionStanding([], { beneficiary: 'heir', asOf: ASOF });
    const r = distributionReview(s, { amount: POE_PRODUCTION_POLICY.reviewFloorAmount - 1 });
    expect(r.decision).toBe('clear');
    expect(r.reason).toMatch(/review floor/i);
  });

  it('clears when the standing is genuinely met', () => {
    const s = productionStanding([prod({ amount: 5000 }), prod({ occurredAt: '2026-07-01', amount: 5000 })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('meets');
    expect(distributionReview(s, { amount: 25000 }).decision).toBe('clear');
  });

  it('reviews rather than clears when handed no standing at all', () => {
    expect(distributionReview(null).decision).toBe('review');
  });
});

describe('the period window is real, and an undated entry is reported rather than counted', () => {
  it('entries outside the period do not count toward standing', () => {
    const old = prod({ occurredAt: '2020-01-01', amount: 100000 });
    const s = productionStanding([old], { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('no-record');
  });

  it('an undated entry is neither counted nor silently dropped', () => {
    const { inPeriod, undated } = entriesInPeriod([prod({ occurredAt: null })], { asOf: ASOF, periodMonths: 12 });
    expect(inPeriod).toEqual([]);
    expect(undated.length).toBe(1);
    const s = productionStanding([prod({ occurredAt: null })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.undatedCount).toBe(1);
    expect(s.headline).toMatch(/undated/i);
  });

  it('records belonging to another beneficiary never leak into a standing', () => {
    const s = productionStanding([prod({ beneficiary: 'someone-else', amount: 9000 })], { beneficiary: 'heir', asOf: ASOF });
    expect(s.status).toBe('no-record');
  });

  it('an attestation is a real record but does NOT manufacture a production standing', () => {
    const s = productionStanding(
      [{ id: 'a', kind: 'attestation', beneficiary: 'heir', articleId: FAMILY_CONSTITUTION.articles[0].id, occurredAt: '2026-08-01' }],
      { beneficiary: 'heir', asOf: ASOF },
    );
    expect(s.status).toBe('no-record');
  });
});

describe('normalizeEntry refuses what the table refuses', () => {
  it('drops an unknown kind and a person-less non-spendthrift row', () => {
    expect(normalizeEntry({ kind: 'nonsense', beneficiary: 'heir' })).toBeNull();
    expect(normalizeEntry({ kind: 'production', beneficiary: '   ' })).toBeNull();
    expect(normalizeEntry({ kind: 'spendthrift', beneficiary: '', itemId: 'titling', answer: 'yes' })).toBeTruthy();
  });

  it('drops an invalid production kind and an invalid answer rather than storing it', () => {
    const e = normalizeEntry({ kind: 'production', beneficiary: 'heir', productionKind: 'vibes', answer: 'maybe' });
    expect(e.productionKind).toBeNull();
    expect(e.answer).toBeNull();
  });

  it('every declared entry kind and production kind is a real, stable id', () => {
    expect(ENTRY_KINDS).toContain('spendthrift');
    expect(new Set(PRODUCTION_KINDS.map((k) => k.id)).size).toBe(PRODUCTION_KINDS.length);
    expect(normalizeEntries([null, undefined, {}])).toEqual([]);
  });
});

describe('the spendthrift review never assumes protection', () => {
  it('an unanswered review reads unreviewed for every item and is NOT confirmed', () => {
    const r = spendthriftReview({}, { asOf: ASOF });
    expect(r.tally.protected).toBe(0);
    expect(r.tally.unreviewed).toBe(SPENDTHRIFT_REVIEW_ITEMS.length);
    expect(r.confirmed).toBe(false);
    for (const item of r.items) expect(item.status).toBe('unreviewed');
  });

  it('a single exposure keeps the whole posture unconfirmed', () => {
    const answers = Object.fromEntries(SPENDTHRIFT_REVIEW_ITEMS.map((i) => [i.id, { answer: 'yes', reviewedAt: '2026-08-01' }]));
    expect(spendthriftReview(answers, { asOf: ASOF }).confirmed).toBe(true);
    answers.titling = { answer: 'no', reviewedAt: '2026-08-01' };
    const r = spendthriftReview(answers, { asOf: ASOF });
    expect(r.items.find((i) => i.id === 'titling').status).toBe('exposed');
    expect(r.confirmed).toBe(false);
  });

  it('an answer older than the review interval goes STALE — reviewed once is not reviewed forever', () => {
    const answers = Object.fromEntries(SPENDTHRIFT_REVIEW_ITEMS.map((i) => [i.id, { answer: 'yes', reviewedAt: '2020-01-01' }]));
    const r = spendthriftReview(answers, { asOf: ASOF, staleAfterMonths: 12 });
    expect(r.tally.stale).toBe(SPENDTHRIFT_REVIEW_ITEMS.length);
    expect(r.confirmed).toBe(false);
  });

  it('folds ledger rows into answers, and the LATEST dated answer wins', () => {
    const answers = spendthriftAnswersFrom([
      { id: '1', kind: 'spendthrift', beneficiary: '', itemId: 'titling', answer: 'yes', occurredAt: '2026-01-01' },
      { id: '2', kind: 'spendthrift', beneficiary: '', itemId: 'titling', answer: 'no', occurredAt: '2026-06-01' },
    ]);
    expect(answers.titling.answer).toBe('no');
    expect(answers.titling.reviewedAt).toBe('2026-06-01');
  });

  it('the review questions cover the failure modes that actually void the clause', () => {
    const ids = SPENDTHRIFT_REVIEW_ITEMS.map((i) => i.id);
    expect(ids).toContain('third-party-funded'); // self-settled is the biggest limit
    expect(ids).toContain('titling');            // an unfunded trust protects nothing
    expect(ids).toContain('anti-alienation');    // the clause itself
  });
});

describe('constitution attestation reports what is MISSING', () => {
  it('an untouched ledger reports every article missing, not a clean slate', () => {
    const s = constitutionStanding([], { beneficiary: 'heir' });
    expect(s.attested).toEqual([]);
    expect(s.missing.length).toBe(FAMILY_CONSTITUTION.articles.length);
    expect(s.complete).toBe(false);
    expect(s.pct).toBe(0);
  });

  it('counts only real attestations, and ignores an article id that does not exist', () => {
    const s = constitutionStanding([
      { id: '1', kind: 'attestation', beneficiary: 'heir', articleId: FAMILY_CONSTITUTION.articles[0].id, occurredAt: '2026-08-01' },
      { id: '2', kind: 'attestation', beneficiary: 'heir', articleId: 'art99-invented', occurredAt: '2026-08-01' },
      { id: '3', kind: 'attestation', beneficiary: 'other', articleId: FAMILY_CONSTITUTION.articles[1].id, occurredAt: '2026-08-01' },
    ], { beneficiary: 'heir' });
    expect(s.attested).toEqual([FAMILY_CONSTITUTION.articles[0].id]);
    expect(s.complete).toBe(false);
  });
});

describe('the whole-system summary and the exports', () => {
  it('summarizes real people, flags who needs review, and never hides an unconfirmed wall', () => {
    const summary = trustSystemSummary({
      beneficiaries: [{ id: 'heir', name: 'Heir' }, { id: 'second', name: 'Second' }],
      entries: [prod({ amount: 900 }), prod({ occurredAt: '2026-07-01', amount: 900 })],
      asOf: ASOF,
    });
    expect(summary.production.standings.length).toBe(2);
    expect(summary.production.needingReview).toContain('second'); // no record for them
    expect(summary.production.needingReview).not.toContain('heir');
    expect(summary.spendthrift.confirmed).toBe(false);
    expect(summary.constitution.fullyAttested).toBe(0);
  });

  it('standingsFor accepts bare id strings as well as objects', () => {
    const rows = standingsFor(['heir'], [prod({ amount: 5 })], { asOf: ASOF });
    expect(rows[0].id).toBe('heir');
    expect(rows[0].name).toBe('heir');
  });

  it('exports a constitution another family can start from, marked as adopted', () => {
    const md = exportConstitutionMarkdown();
    expect(md).toContain('Family Constitution');
    expect(md).toContain('Article 1');
    expect(md).toMatch(/not legal advice/i);
    const theirs = adoptConstitution('The Example Family');
    expect(theirs.family).toBe('The Example Family');
    expect(theirs.adopted).toBe(true);
    expect(theirs.adoptedFrom).toBe(FAMILY_CONSTITUTION.family);
    // Adoption must not mutate ours.
    expect(FAMILY_CONSTITUTION.family).toMatch(/Poe/);
  });

  it('exports the three provisions with their limits — the sheet you take to an attorney', () => {
    const md = exportProvisionsMarkdown();
    expect(md).toContain('Honest limits');
    expect(md).toMatch(/child support/i);
    expect(md).toMatch(/not legal advice/i);
  });
});
