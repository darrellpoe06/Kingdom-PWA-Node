// Promise truth (lib/surface-claims.js): a page may only promise what runs.
// Darrell 2026-11-18: "Fix the tiles to be accurate ... unless we can make
// happen what's on the tiles" + "Ari should be on every page validation".
// The same registry feeds this CI gate AND Ari's in-app "Promise truth"
// dimension, so the two can never disagree.
import { describe, it, expect } from 'vitest';
import { SURFACE_CLAIMS, checkSurfaceClaims, claimsContext, reviewClaims } from '../lib/surface-claims.js';
import { buildAppReview, REVIEW_DIMENSIONS } from '../lib/ari-app-review.js';

describe('every registered page promise holds on the real tree', () => {
  const { results, retractedHits } = checkSurfaceClaims();
  for (const r of results) {
    it(`${r.surface} · ${r.id} — "${r.text}"`, () => {
      expect(r.ok, r.text).toBe(true);
    });
  }
  it("no retracted (not-yet-built) promise is back in any page's copy", () => {
    expect(retractedHits).toEqual([]);
  });
  it('the registry is not vacuous', () => {
    expect(results.length).toBeGreaterThanOrEqual(9);
  });
});

describe('proven to catch (DR-0076: a gate that always passes is a lie)', () => {
  it('a sample balance that no longer reconciles breaks "samples run the real system"', () => {
    const ctx = claimsContext();
    ctx.personas['family-of-1'].accounts.find((a) => a.id === 'a-solo-cc').balance = -180;
    const r = checkSurfaceClaims(ctx).results.find((x) => x.id === 'samples-reconcile');
    expect(r.ok).toBe(false);
  });
  it('emptying the singles subscriptions breaks "every subscription is on the screen"', () => {
    const ctx = claimsContext();
    ctx.personas['family-of-1'].subscriptions = [];
    expect(checkSurfaceClaims(ctx).results.find((x) => x.id === 'f1-subscriptions').ok).toBe(false);
  });
  it('dropping a receipt breaks the co-parent promise', () => {
    const ctx = claimsContext();
    const t = ctx.personas.separated.transactions.find((x) => x.receipt);
    delete t.receipt;
    expect(checkSurfaceClaims(ctx).results.find((x) => x.id === 'sep-receipts').ok).toBe(false);
  });
  it("a retracted phrase put back in a page's copy is caught", () => {
    const reg = SURFACE_CLAIMS.map((s) => ({ ...s, copy: () => [...s.copy(), 'Capex reserve auto-funded.'] }));
    expect(checkSurfaceClaims(claimsContext(), reg).retractedHits.map((h) => h.why)).toContain('capex reserve funding not built');
  });
});

describe('Ari reports it in-app: the "Promise truth" dimension', () => {
  it("is one of Ari's review dimensions and clean on the real tree", () => {
    expect(REVIEW_DIMENSIONS.map(([k]) => k)).toContain('claims');
    const review = buildAppReview({}, 0);
    const dim = review.dimensions.find((d) => d.key === 'claims');
    expect(dim.findings.filter((f) => f.severity === 'bug')).toEqual([]);
    expect(dim.metrics.broken).toBe(0);
  });
  it('turns a broken promise into a bug finding with the claim as evidence', () => {
    const ctx = claimsContext();
    ctx.personas['family-of-5'].accounts = ctx.personas['family-of-5'].accounts.filter((a) => !/^529 · /.test(a.name));
    const dim = reviewClaims({ ctx });
    expect(dim.findings.some((f) => f.severity === 'bug' && /a 529 for each of the three/.test(f.title))).toBe(true);
  });
  it('counts the pages with no promise check yet — the honest worklist toward every page', () => {
    const dim = reviewClaims({ surfaceIds: ['front-door-picker', 'rentals', 'about'] });
    const cov = dim.findings.find((f) => /have no promise check yet/.test(f.title));
    expect(cov.count).toBe(2);
    expect(cov.evidence).toContain('rentals');
    expect(dim.metrics.pagesUnchecked).toBe(2);
  });
});
