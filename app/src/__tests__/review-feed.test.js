// In-app Review surface (DR-0061 / DR-0072). The tab fetches the freshness
// loop's staged proposals live from the NAS; this locks the pure helpers that
// tolerate a missing/garbled response (so the panel never crashes) and that
// distinguish a real vendor cross-check from the graceful-degradation note.
import { describe, it, expect } from 'vitest';
import { normalizeReviewFeed, isPendingSynthesis, applyAction } from '../components/ReviewFeed.jsx';

describe('normalizeReviewFeed', () => {
  it('keeps well-formed proposals and reports the count', () => {
    const out = normalizeReviewFeed({
      ok: true,
      freshness: [
        { id: 'fr-1', url: 'https://a.com', summary: 'A' },
        { id: 'fr-2', url: 'https://b.com', summary: 'B' },
      ],
    });
    expect(out.ok).toBe(true);
    expect(out.count).toBe(2);
    expect(out.freshness.map(f => f.id)).toEqual(['fr-1', 'fr-2']);
  });

  it('drops proposals with no id', () => {
    const out = normalizeReviewFeed({ ok: true, freshness: [{ id: 'fr-1' }, {}, null] });
    expect(out.count).toBe(1);
  });

  it('degrades safely on a missing / garbled response', () => {
    expect(normalizeReviewFeed(undefined)).toEqual({ ok: false, count: 0, freshness: [] });
    expect(normalizeReviewFeed(null)).toEqual({ ok: false, count: 0, freshness: [] });
    expect(normalizeReviewFeed('nonsense')).toEqual({ ok: false, count: 0, freshness: [] });
    expect(normalizeReviewFeed({ ok: false, error: 'unauthorized' })).toEqual({ ok: false, count: 0, freshness: [] });
  });
});

describe('applyAction', () => {
  const list = [
    { id: 'fr-1', summary: 'A', status: 'for-review' },
    { id: 'fr-2', summary: 'B', status: 'for-review' },
  ];

  it('dismiss removes the proposal from the list', () => {
    const out = applyAction(list, 'fr-1', 'dismiss');
    expect(out.map((f) => f.id)).toEqual(['fr-2']);
  });

  it('keep flags the proposal as kept without removing it', () => {
    const out = applyAction(list, 'fr-2', 'keep');
    expect(out.find((f) => f.id === 'fr-2').status).toBe('kept');
    expect(out.length).toBe(2);
  });

  it('does not mutate the input list', () => {
    const before = JSON.parse(JSON.stringify(list));
    applyAction(list, 'fr-1', 'dismiss');
    applyAction(list, 'fr-2', 'keep');
    expect(list).toEqual(before);
  });

  it('degrades safely on bad input or unknown action', () => {
    expect(applyAction(undefined, 'fr-1', 'dismiss')).toEqual([]);
    expect(applyAction(list, 'fr-1', 'bogus').map((f) => f.id)).toEqual(['fr-1', 'fr-2']);
  });
});

describe('isPendingSynthesis', () => {
  it('treats the graceful-degradation note as pending, not a real cross-check', () => {
    expect(isPendingSynthesis('(vendor unavailable: HTTP 429 - local summary stands)')).toBe(true);
    expect(isPendingSynthesis('')).toBe(true);
    expect(isPendingSynthesis(null)).toBe(true);
    expect(isPendingSynthesis(undefined)).toBe(true);
  });

  it('treats real synthesis text as a cross-check', () => {
    expect(isPendingSynthesis('The current best practice is HMAC-signed webhooks.')).toBe(false);
  });
});
