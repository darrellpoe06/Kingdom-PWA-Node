// @vitest-environment node
//
// client-build-agreement — the PoeTech client contract DERIVES from the terms
// module (DR-0117 via client-engagements.js), never hand-typed (DR-0121).
// These pin: every declared number appears in the clause text VIA the derive
// (change the constant, the contract follows), and the binding fences the Ways
// require are present in the template a steward actually starts from.
import { describe, it, expect } from 'vitest';
import {
  clientBuildDefaults, CLIENT_BUILD_TEMPLATE, usd, COUNSEL_REVIEW_LINE,
} from '../lib/client-build-agreement.js';
import {
  BUILD_MINIMUM_CENTS, DEPOSIT_CENTS, MVP_PAYMENT_CENTS, TERM_DAYS,
  SUPPORT_MONTHLY_CENTS,
} from '../lib/client-engagements.js';

describe('the contract derives from the one terms source', () => {
  const d = clientBuildDefaults();
  const all = Object.values(d).join('\n');

  it('carries every declared number via the derive (not a re-typed figure)', () => {
    expect(d.paymentTerms).toContain(usd(BUILD_MINIMUM_CENTS));
    expect(d.paymentTerms).toContain(usd(DEPOSIT_CENTS));
    expect(d.paymentTerms).toContain(usd(MVP_PAYMENT_CENTS));
    expect(d.paymentTerms).toContain(usd(SUPPORT_MONTHLY_CENTS));
    expect(d.paymentTerms).toContain(String(TERM_DAYS));
    expect(d.schedule).toContain(usd(DEPOSIT_CENTS));
    expect(d.schedule).toContain(String(TERM_DAYS));
  });

  it('holds the binding fences from the Ways', () => {
    expect(d.paymentTerms).toMatch(/NO INTEREST, EVER/);
    expect(d.paymentTerms).toMatch(/RECORDED, never processed/);
    expect(d.schedule).toMatch(/RECORDED — never before/);
    expect(d.warranty).toMatch(/exportable at any time/);
    expect(d.warranty).toMatch(/never sold/);
    expect(d.terminationClause).toMatch(/no late fees/);
    expect(d.terminationClause).toMatch(/never a collection lever/);
    expect(d.acceptanceCriteria).toMatch(/reviewed requirements/);
    expect(d.deliverables).toMatch(/Feedback portal/);
  });

  it('ships as a DRAFT pending counsel review, on the printed scope itself', () => {
    expect(d.scopeOfWork.startsWith(COUNSEL_REVIEW_LINE)).toBe(true);
    expect(COUNSEL_REVIEW_LINE).toMatch(/counsel/i);
    expect(COUNSEL_REVIEW_LINE).toMatch(/Not legal advice/);
  });

  it('the template card is SCOPE_TEMPLATES-shaped and carries derived numbers in its blurb', () => {
    expect(CLIENT_BUILD_TEMPLATE).toMatchObject({ id: 'tmpl-client-build', type: 'client', entityId: 'e-poetech' });
    expect(CLIENT_BUILD_TEMPLATE.description).toContain(usd(BUILD_MINIMUM_CENTS));
    for (const k of ['title', 'scopeOfWork', 'deliverables', 'materials', 'schedule', 'paymentTerms', 'acceptanceCriteria', 'requirements', 'warranty', 'terminationClause']) {
      expect(typeof CLIENT_BUILD_TEMPLATE.defaults[k]).toBe('string');
      expect(CLIENT_BUILD_TEMPLATE.defaults[k].length).toBeGreaterThan(0);
    }
  });

  it('CATCHES a hardcoded-figure drift: no clause re-types a dollar figure the derive does not produce', () => {
    const derived = new Set([usd(BUILD_MINIMUM_CENTS), usd(DEPOSIT_CENTS), usd(MVP_PAYMENT_CENTS), usd(SUPPORT_MONTHLY_CENTS)]);
    const figures = all.match(/\$[\d,]*\d/g) || [];
    for (const f of figures) expect(derived.has(f)).toBe(true);
  });
});
