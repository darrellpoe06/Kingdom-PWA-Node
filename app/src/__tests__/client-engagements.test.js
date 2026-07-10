// =============================================================================
// client-engagements — the declared build terms are PINNED (DR-0117):
// $2,000 minimum, 90 days same as cash ($500 deposit / $500 at MVP / balance
// over the rest of the 90), $150/mo Feedback-portal support after. Proven-to-
// catch: these tests fail if the gate math, the declared numbers, or the
// no-invention discovery parsing regress.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  normalizeEngagement, normalizePayment, agreementOnFile,
  totalPaidCents, depositRequiredCents, expectedByMvpCents, balanceDueCents,
  quoteMeetsMinimum, canStartBuild, engagementStage, termDueDate, STAGE_LABELS,
  BUILD_MINIMUM_CENTS, DEPOSIT_CENTS, MVP_PAYMENT_CENTS, TERM_DAYS,
  SUPPORT_MONTHLY_CENTS, SUPPORT_SCOPE, ENGAGEMENT_TERMS,
  parseDiscoveryJson, pendingDiscoveryItems, requirementsByArea,
} from '../lib/client-engagements.js';

const quoted = (over = {}) => ({
  clientName: 'Test Client', businessName: 'Test Biz',
  terms: 'ninety-day', quoteCents: 200000, payments: [], ...over,
});

describe('the declared numbers (Darrell 2026-07-07) are the numbers', () => {
  it('pins $2,000 min / $500 deposit / $500 MVP / 90 days / $150 support', () => {
    expect(BUILD_MINIMUM_CENTS).toBe(200000);
    expect(DEPOSIT_CENTS).toBe(50000);
    expect(MVP_PAYMENT_CENTS).toBe(50000);
    expect(TERM_DAYS).toBe(90);
    expect(SUPPORT_MONTHLY_CENTS).toBe(15000);
    expect(SUPPORT_SCOPE).toContain('$150/mo');
    expect(SUPPORT_SCOPE).toContain('$2,000 minimum');
    expect(Object.keys(ENGAGEMENT_TERMS)).toEqual(['ninety-day', 'full-upfront']);
  });
});

describe('the deposit gate — "or we don\'t even start work"', () => {
  it('no quote yet -> gate CLOSED even if money arrived (nothing agreed)', () => {
    expect(canStartBuild({ payments: [{ amountCents: 999999, method: 'Venmo' }] })).toBe(false);
    expect(engagementStage({})).toBe('inquiry');
  });

  it('a quote BELOW the $2,000 minimum never clears', () => {
    const e = quoted({ quoteCents: 150000, payments: [{ amountCents: 150000, method: 'Square' }] });
    expect(quoteMeetsMinimum(e)).toBe(false);
    expect(canStartBuild(e)).toBe(false);
    expect(engagementStage(e)).toBe('inquiry');
  });

  it('quoted but unpaid -> awaiting-deposit, gate closed', () => {
    const e = quoted();
    expect(canStartBuild(e)).toBe(false);
    expect(engagementStage(e)).toBe('awaiting-deposit');
    expect(depositRequiredCents(e)).toBe(DEPOSIT_CENTS);
  });

  it('a payment below $500 does not open the gate; $500 does', () => {
    expect(canStartBuild(quoted({ payments: [{ amountCents: 49999, method: 'Square' }] }))).toBe(false);
    const e = quoted({ payments: [{ amountCents: 50000, method: 'Square', paidAt: '2026-07-07' }] });
    expect(canStartBuild(e)).toBe(true);
    expect(engagementStage(e)).toBe('cleared-to-build');
  });

  it('full-upfront requires 100% before work starts', () => {
    const e = quoted({ terms: 'full-upfront', payments: [{ amountCents: 199999, method: 'Venmo' }] });
    expect(depositRequiredCents(e)).toBe(200000);
    expect(canStartBuild(e)).toBe(false);
    expect(canStartBuild({ ...e, payments: [{ amountCents: 200000, method: 'Venmo' }] })).toBe(true);
  });

  it('$1,000 is expected by MVP; a larger quote still milestones $500+$500', () => {
    expect(expectedByMvpCents(quoted())).toBe(100000);
    expect(expectedByMvpCents(quoted({ quoteCents: 500000 }))).toBe(100000);
    expect(expectedByMvpCents(quoted({ terms: 'full-upfront', quoteCents: 500000 }))).toBe(500000);
  });
});

describe('the 90-day same-as-cash clock', () => {
  const started = () => quoted({ payments: [{ amountCents: 50000, method: 'Square', paidAt: '2026-07-07' }] });

  it('the term runs 90 days from the FIRST recorded payment', () => {
    expect(termDueDate(started())).toBe('2026-10-05');
    expect(termDueDate(quoted())).toBeNull(); // no payment, no clock
    expect(termDueDate(quoted({ terms: 'full-upfront' }))).toBeNull();
  });

  it('walks the whole lifecycle from real fields — never a stored stage', () => {
    let e = started();
    e = { ...e, mvpDeliveredAt: '2026-07-14' };
    expect(engagementStage(e)).toBe('mvp-review');
    e = { ...e, payments: [...e.payments, { amountCents: 50000, method: 'Square', paidAt: '2026-07-14' }], mvpAcceptedAt: '2026-07-16' };
    expect(engagementStage(e, '2026-08-01')).toBe('in-term');
    expect(balanceDueCents(e)).toBe(100000);
    expect(engagementStage(e, '2026-10-20')).toBe('past-due');
    e = { ...e, payments: [...e.payments, { amountCents: 100000, method: 'Square', paidAt: '2026-09-30' }] };
    expect(engagementStage(e, '2026-10-20')).toBe('complete');
    expect(balanceDueCents(e)).toBe(0);
  });

  it('every stage has a label', () => {
    for (const s of ['inquiry', 'awaiting-deposit', 'cleared-to-build', 'mvp-review', 'in-term', 'past-due', 'complete']) {
      expect(STAGE_LABELS[s]).toBeTruthy();
    }
  });
});

describe('payments are records, never charges', () => {
  it('zero/negative amounts rejected; no card fields survive', () => {
    expect(normalizePayment({ amountCents: 0 })).toBeNull();
    expect(normalizePayment({ amountCents: -500 })).toBeNull();
    const p = normalizePayment({ amountCents: 1000, method: 'Apple Pay', cardNumber: '4111111111111111' });
    expect(p).not.toHaveProperty('cardNumber');
    expect(Object.keys(p).sort()).toEqual(['amountCents', 'method', 'note', 'paidAt']);
  });

  it('totalPaid ignores malformed rows instead of miscounting', () => {
    const e = quoted({ payments: [{ amountCents: 50000 }, { amountCents: 'nope' }, null, { note: 'no amount' }] });
    expect(totalPaidCents(e)).toBe(50000);
  });

  it('normalizeEngagement defaults unknown terms to ninety-day', () => {
    expect(normalizeEngagement({ terms: 'net-30' }).terms).toBe('ninety-day');
  });
});

describe('recorded discovery — requirements from the client\'s own words', () => {
  const sample = {
    client: { name: 'Shay', business: 'Moore Divahs' },
    requirements: [
      { area: 'orders', requirement: 'Track custom orders with a 3-week clock', confidence: 'high', source_quote: 'everything is three weeks out once they pay' },
      { area: 'classes', requirement: 'Seat-held sewing classes', confidence: 'med', source_quote: 'ten max in a group class' },
      { requirement: '' }, // empty — must be skipped, never guessed
    ],
    pricing: [{ item: 'Group class seat', amount_text: '$45', source_quote: 'forty-five for group' }],
    policies: [{ policy: 'Payment always upfront, no rush orders', source_quote: 'payment always upfront' }],
    channels: ['tiktok', ''],
    pain_points: [{ pain: 'Google Doc intake loses orders', source_quote: 'I lose track in the doc' }],
    unclear: ['shipping rates?'],
  };

  it('parses every kind with source_quote provenance, status=extracted', () => {
    const out = parseDiscoveryJson(sample, { sourceRecording: 'voice-note-001.m4a', sourceRun: 'run-1', extractedAt: '2026-07-07T00:00:00Z' });
    expect(out.client).toEqual({ name: 'Shay', business: 'Moore Divahs' });
    expect(out.items).toHaveLength(5); // 2 requirements + 1 pricing + 1 policy + 1 pain — the empty one skipped
    for (const i of out.items) {
      expect(i.status).toBe('extracted');
      expect(i.sourceRecording).toBe('voice-note-001.m4a');
      expect(i.sourceQuote).toBeTruthy();
    }
    expect(out.channels).toEqual(['tiktok']);
    expect(out.unclear).toEqual(['shipping rates?']);
  });

  it('accepts a JSON string; malformed JSON throws (caller catches — never silently invented)', () => {
    expect(parseDiscoveryJson(JSON.stringify(sample)).items).toHaveLength(5);
    expect(() => parseDiscoveryJson('not json')).toThrow();
  });

  it('a field the client did not state stays null — nothing invented', () => {
    const out = parseDiscoveryJson({ requirements: [{ requirement: 'A thing', confidence: 'bogus' }] });
    const item = out.items[0];
    expect(item.area).toBeNull();
    expect(item.confidence).toBeNull(); // bogus confidence -> null, not defaulted
    expect(item.sourceQuote).toBeNull();
    expect(out.client.name).toBeNull();
  });

  it('extracted items wait for steward review before the spec uses them', () => {
    const out = parseDiscoveryJson(sample);
    expect(pendingDiscoveryItems(out.items)).toHaveLength(5);
    // by default only REVIEWED requirements ride into the spec view
    expect(requirementsByArea(out.items).size).toBe(0);
    expect([...requirementsByArea(out.items, { includeExtracted: true }).keys()]).toEqual(['orders', 'classes']);
    const reviewed = out.items.map((i) => (i.kind === 'requirement' ? { ...i, status: 'reviewed' } : i));
    expect(requirementsByArea(reviewed).size).toBe(2);
  });
});


// ---------------------------------------------------------------------------
// agreementOnFile (DR-0123 §2) — the signed scope and the engagement link by
// id; the helper answers from REAL rows and never invents a link. The money
// gate (canStartBuild) is deliberately independent: readiness surfaces show
// both truths side by side.
// ---------------------------------------------------------------------------
describe('agreementOnFile — the signed-scope link', () => {
  const scopes = [
    { id: 'scope-1', title: 'PoeTech Client Build', engagementId: 'eng-1' },
    { id: 'scope-2', title: 'Unlinked scope' },
  ];

  it('finds the scope that names the engagement', () => {
    const hit = agreementOnFile({ id: 'eng-1' }, scopes);
    expect(hit?.id).toBe('scope-1');
  });

  it('finds the scope the engagement names (the reverse link)', () => {
    const hit = agreementOnFile({ id: 'eng-9', agreementScopeId: 'scope-2' }, scopes);
    expect(hit?.id).toBe('scope-2');
  });

  it('no link = null, never an invented match — and null ids never cross-match', () => {
    expect(agreementOnFile({ id: 'eng-3' }, scopes)).toBeNull();
    expect(agreementOnFile({}, [{ id: 's', engagementId: null }])).toBeNull();
    expect(agreementOnFile({ id: 'eng-1' }, null)).toBeNull();
  });

  it('normalizeEngagement carries agreementScopeId (the field is first-class)', () => {
    expect(normalizeEngagement({ agreementScopeId: 'scope-7' }).agreementScopeId).toBe('scope-7');
  });

  it('the money gate stays independent: canStartBuild ignores the agreement link', () => {
    const paid = { id: 'eng-1', quoteCents: 200000, payments: [{ amountCents: 100000, paidAt: '2026-07-01' }] };
    expect(canStartBuild(paid)).toBe(canStartBuild({ ...paid, agreementScopeId: 'scope-1' }));
  });
});
