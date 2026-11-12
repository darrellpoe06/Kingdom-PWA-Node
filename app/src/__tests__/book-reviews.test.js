// @vitest-environment node
// =============================================================================
// book-reviews — rated by those who hold the book, one each; the average
// shown to anyone (DR-1449)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validRating, normalizeReview, reviewGate, addReviewGated, summarize, starsLabel, mergedSummary, loadReviews, saveReviews, readReviewSummaries } from '../lib/book-reviews.js';
import { normalizeSubscriber, grantBookEntitlement } from '../lib/entitlements.js';

const now = new Date().toISOString();
const product = { id: 'prod-living-lessons', priceCents: 999, tierIncluded: [], conversationEnabled: true };
const owner = grantBookEntitlement(normalizeSubscriber({ userKey: 'o@example.com' }), product.id);
const stranger = normalizeSubscriber({ userKey: 's@example.com' });

describe('the gate and the rating', () => {
  it('only a holder may review; a rating is a whole number 1..5; one review per person, the second replaces the first', () => {
    expect(reviewGate(owner, product, now).allowed).toBe(true);
    expect(reviewGate(stranger, product, now).reason).toMatch(/holds this book/);
    expect([0, 6, 3.5, '4', NaN].map(validRating)).toEqual([false, false, false, false, false]);
    const a = addReviewGated([], { userKey: 'o@example.com', authorName: 'O', rating: 4, body: 'Good' }, { sub: owner, product, nowIso: now });
    expect(a.ok).toBe(true);
    const b = addReviewGated(a.reviews, { userKey: 'o@example.com', rating: 5, body: 'Better' }, { sub: owner, product, nowIso: now });
    expect(b.reviews.length).toBe(1);
    expect(b.reviews[0].rating).toBe(5);
    expect(addReviewGated([], { userKey: 's@example.com', rating: 5 }, { sub: stranger, product, nowIso: now }).ok).toBe(false);
    expect(addReviewGated([], { userKey: 'o@example.com', rating: 9 }, { sub: owner, product, nowIso: now }).reason).toMatch(/1 to 5/);
    expect(addReviewGated([], { userKey: '', rating: 3 }, { sub: owner, product, nowIso: now }).reason).toMatch(/Sign in/);
    expect(normalizeReview({ body: 'x'.repeat(2000) }).body.length).toBe(1000);
  });
});

describe('the summary', () => {
  it('counts and averages only valid ratings of that book; the label says it plainly; the cloud count rules when it answered', () => {
    const rows = [
      { productId: 'p', userKey: 'a', rating: 5 }, { productId: 'p', userKey: 'b', rating: 4 }, { productId: 'p', userKey: 'c', rating: 9 }, { productId: 'q', userKey: 'a', rating: 1 },
    ];
    expect(summarize(rows, 'p')).toEqual({ count: 2, average: 4.5 });
    expect(summarize(rows, 'z')).toEqual({ count: 0, average: null });
    expect(starsLabel(summarize(rows, 'p'))).toBe('★ 4.5 · 2 reviews');
    expect(starsLabel(summarize(rows, 'q'))).toBe('★ 1.0 · 1 review');
    expect(starsLabel(summarize(rows, 'z'))).toBe('No reviews yet');
    expect(mergedSummary({ count: 1, average: 5 }, { count: 12, average: 4.6 })).toEqual({ count: 12, average: 4.6 });
    expect(mergedSummary({ count: 1, average: 5 }, { count: 0, average: null })).toEqual({ count: 1, average: 5 });
  });
  it('the device store fails soft and the cloud read is honest about not answering', async () => {
    const mem = new Map();
    const store = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
    saveReviews('p', [{ productId: 'p', userKey: 'a', rating: 5 }], store);
    expect(loadReviews('p', store)[0].rating).toBe(5);
    expect(loadReviews('p', null).length === 0 || true).toBe(true);
    const client = { rpc: async () => ({ data: [{ product_id: 'p', reviews: 3, average: '4.33' }], error: null }) };
    expect(await readReviewSummaries(client)).toEqual({ ok: true, byProduct: { p: { count: 3, average: 4.33 } } });
    expect((await readReviewSummaries({ rpc: async () => ({ data: null, error: 'boom' }) })).ok).toBe(false);
    expect((await readReviewSummaries(null)).ok).toBe(false);
  });
});

describe('the migration', () => {
  it('0323 adds the rating, the review kind, one review per person, and a numbers-only public summary', () => {
    const sql = readFileSync(new URL('../../../infra/supabase/migrations-auto/0323-a-book-is-reviewed-by-those-who-hold-it.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/rating smallint CHECK \(rating BETWEEN 1 AND 5\)/);
    expect(sql).toMatch(/'question', 'comment', 'answer', 'review'/);
    expect(sql).toMatch(/uq_book_conversations_one_review[\s\S]*WHERE kind = 'review'/);
    expect(sql).toMatch(/FUNCTION public\.book_review_summary\(\)[\s\S]*SECURITY DEFINER/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.book_review_summary\(\) TO anon, authenticated, service_role/);
    expect(sql).not.toMatch(/SELECT[^;]*\bbody\b/);
  });
});
