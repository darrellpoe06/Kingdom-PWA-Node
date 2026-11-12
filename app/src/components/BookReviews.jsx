// =============================================================================
// BookReviews — the stars anyone sees, and the review a holder leaves (DR-1449)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { loadReviews, saveReviews, addReviewGated, summarize, starsLabel, mergedSummary, reviewGate, RATING_MIN, RATING_MAX } from '../lib/book-reviews.js';

const btn =
  'inline-flex items-center text-xs px-3 py-1.5 min-h-[36px] border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60';

/** The stars line for one book: the device's reviews merged with the cloud summary. */
export function Stars({ productId, cloud = null }) {
  const local = useMemo(() => summarize(loadReviews(productId), productId), [productId]);
  const s = mergedSummary(local, cloud);
  return (
    <span className="text-[0.6875rem] text-[#5A5751]" data-testid="stars" data-count={s.count}>
      {starsLabel(s)}
    </span>
  );
}

/** A holder's review form; everyone else sees why they cannot. */
export default function BookReviews({ product, sub, userKey, nowIso, cloud = null }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    setReviews(loadReviews(product.id));
  }, [product.id]);
  const gate = reviewGate(sub, product, nowIso);
  const summary = mergedSummary(summarize(reviews, product.id), cloud);
  const mine = reviews.find((r) => r.userKey === userKey) || null;
  const post = useCallback(() => {
    const res = addReviewGated(
      reviews,
      { userKey, authorName: userKey ? userKey.split('@')[0] : 'Reader', rating, body, at: Date.now() },
      { sub, product, nowIso }
    );
    if (!res.ok) {
      setNotice(res.reason);
      return;
    }
    setReviews(res.reviews);
    saveReviews(product.id, res.reviews);
    setNotice('Thank you. Your review is on this device and counts the moment it reaches the shelf.');
  }, [reviews, userKey, rating, body, sub, product, nowIso]);
  return (
    <div className="border p-2 border-[#E8E4DC]" data-testid="book-reviews">
      <div className="text-[0.6875rem] uppercase tracking-wider mb-1 text-[#5A5751]">Reviews · {starsLabel(summary)}</div>
      {!gate.allowed ? (
        <p className="text-xs text-[#5A5751]" data-testid="review-gate">
          {gate.reason}
        </p>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Your rating">
            {Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => i + RATING_MIN).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} of ${RATING_MAX}`}
                onClick={() => setRating(n)}
                className={`${btn} ${rating >= n ? 'border-[#B85838] text-[#B85838]' : 'border-[#E8E4DC] text-[#5A5751]'}`}
                data-testid={`rate-${n}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={mine ? 'Change your review…' : 'A line about the book (optional)'}
              className="flex-1 text-xs border px-2 py-1 min-h-[36px] border-[#E8E4DC]"
              aria-label="Your review"
            />
            <button type="button" onClick={post} disabled={!rating} className={`${btn} border-[#1A1815] text-[#1A1815]`} data-testid="post-review">
              {mine ? 'Update' : 'Post'}
            </button>
          </div>
          {!rating && <p className="text-[0.625rem] mt-1 text-[#5A5751]">Pick a star to enable Post.</p>}
        </div>
      )}
      {notice && (
        <p className="text-[0.6875rem] mt-1 text-[#B85838]" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
