// =============================================================================
// book-reviews — a book is rated by those who hold it; the shelf shows the
// average to everyone (DR-1449)
// =============================================================================
// A review is a rating from 1 to 5 with a line, left by a person who owns the
// book (the same gate as its conversation, book-conversation.js), one per
// person per book. The storefront shows the count and the average to anyone;
// the cloud copy is the book_conversations row of kind 'review' (migration
// 0323) and the summary comes from book_review_summary(), numbers only. On
// the device the reviews ride their own fail-soft store so a review left
// offline is kept. Pure except the two store helpers and readReviewSummaries.
// =============================================================================
import { conversationGate } from './book-conversation.js';
import { TIMEOUT_MS } from './poetech-plus.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

export const REVIEW_KIND = 'review';
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/** A rating is a whole number from 1 to 5. Pure. */
export function validRating(r) {
  return Number.isInteger(r) && r >= RATING_MIN && r <= RATING_MAX;
}

export function normalizeReview(raw = {}) {
  return {
    id: asStr(raw.id) || `rev-${Math.random().toString(36).slice(2, 10)}`,
    productId: asStr(raw.productId),
    userKey: asStr(raw.userKey),
    authorName: asStr(raw.authorName) || 'Reader',
    rating: validRating(raw.rating) ? raw.rating : null,
    body: asStr(raw.body).trim().slice(0, 1000),
    at: Number.isFinite(raw.at) ? raw.at : Date.now(),
  };
}

/** May this subscriber review this book? The same gate as its conversation: ownership. Pure. */
export function reviewGate(sub, product, nowIso) {
  const g = conversationGate(sub, { ...product, conversationEnabled: true }, nowIso);
  return g.allowed ? g : { allowed: false, reason: 'Only someone who holds this book can review it.' };
}

/** Add one review, gated: ownership, a valid rating, and one review per person per book (a second one replaces the first). Pure. */
export function addReviewGated(reviews, draft, { sub, product, nowIso } = {}) {
  const gate = reviewGate(sub, product, nowIso);
  if (!gate.allowed) return { ok: false, reason: gate.reason, reviews: asArr(reviews) };
  const r = normalizeReview({ ...draft, productId: product.id });
  if (!validRating(r.rating)) return { ok: false, reason: 'Pick a rating from 1 to 5.', reviews: asArr(reviews) };
  if (!r.userKey) return { ok: false, reason: 'Sign in to leave a review.', reviews: asArr(reviews) };
  const rest = asArr(reviews).filter((x) => !(x.productId === r.productId && x.userKey === r.userKey));
  return { ok: true, reason: '', reviews: [...rest, r] };
}

/** Count and average for one book, from the rows given. Pure. */
export function summarize(reviews, productId) {
  const list = asArr(reviews).filter((x) => x.productId === asStr(productId) && validRating(x.rating));
  if (!list.length) return { count: 0, average: null };
  const sum = list.reduce((a, x) => a + x.rating, 0);
  return { count: list.length, average: Math.round((sum / list.length) * 100) / 100 };
}

/** "★ 4.5 · 12 reviews" or "No reviews yet". Pure. */
export function starsLabel(summary) {
  const s = summary || { count: 0, average: null };
  if (!s.count || s.average === null) return 'No reviews yet';
  return `★ ${s.average.toFixed(1)} · ${s.count} ${s.count === 1 ? 'review' : 'reviews'}`;
}

/** Merge the device's own reviews with the cloud summary: the cloud count rules when it answered, the device adds nothing twice. Pure. */
export function mergedSummary(local, cloud) {
  if (cloud && cloud.count > 0) return { count: cloud.count, average: cloud.average };
  return local || { count: 0, average: null };
}

export function reviewsKey(productId) { return `poe-book-reviews.${asStr(productId)}`; }
function safeStore(store) { try { return store || ((typeof localStorage !== 'undefined' && localStorage) ? localStorage : null); } catch { return null; } }
export function loadReviews(productId, store) {
  const ls = safeStore(store); if (!ls) return [];
  try { const raw = ls.getItem(reviewsKey(productId)); return raw ? asArr(JSON.parse(raw)).map(normalizeReview) : []; } catch { return []; }
}
export function saveReviews(productId, reviews, store) {
  const ls = safeStore(store); if (!ls) return { skipped: 'no-storage' };
  try { ls.setItem(reviewsKey(productId), JSON.stringify(asArr(reviews))); return { saved: true }; } catch (e) { return { skipped: 'write-error', error: e }; }
}

/** The cloud summaries for every book, keyed by product id: { ok, byProduct }. A client that did not answer is ok:false. */
export async function readReviewSummaries(client) {
  try {
    if (!client || typeof client.rpc !== 'function') return { ok: false, byProduct: {} };
    const r = await Promise.race([client.rpc('book_review_summary'), new Promise((res) => setTimeout(() => res({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (!r || r.error || !Array.isArray(r.data)) return { ok: false, byProduct: {} };
    const byProduct = {};
    for (const row of r.data) {
      const id = asStr(row && row.product_id); if (!id) continue;
      const count = Number(row.reviews); const average = Number(row.average);
      byProduct[id] = { count: Number.isFinite(count) ? count : 0, average: Number.isFinite(average) ? average : null };
    }
    return { ok: true, byProduct };
  } catch {
    return { ok: false, byProduct: {} };
  }
}
