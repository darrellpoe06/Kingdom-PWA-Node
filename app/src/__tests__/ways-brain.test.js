// ways-brain — the LIVE Ways fetched from the sovereign parser (DR-0219). Proves
// same-origin routing, honest normalization, and honest-offline fallback (the
// build-time snapshot survives any failure — the live brain never fabricates).
import { describe, it, expect } from 'vitest';
import { WAYS_BRAIN_URL, normalizeWaysBrain, fetchWaysBrain } from '../lib/ways-brain.js';

const BRAIN = {
  ok: true,
  generated_at: '2026-07-21T12:00:00Z',
  principles: [
    { id: 'THREE-BRAKES', summary: 'No timer automation without the brakes.', source: 'CLAUDE.md' },
    { id: 'bad' }, // no summary is fine; a row with no id is dropped
    { nope: true },
  ],
  open_re_reviews: [
    { id: 'DR-0219', date: '2026-08-04', title: 'Spec-Conformance Review' },
    { id: 'DR-0000', title: 'no date -> dropped' },
  ],
  counts: { principles: 35, decisions: 189, open_re_reviews: 87 },
};

describe('sovereign routing', () => {
  it('is a same-origin relative path, never a vendor/Funnel URL', () => {
    expect(WAYS_BRAIN_URL).toBe('/ways/brain.json');
    expect(WAYS_BRAIN_URL).not.toMatch(/^https?:\/\//);
    expect(WAYS_BRAIN_URL).not.toMatch(/n8n|webhook|tail5a2f35/i);
  });
});

describe('normalizeWaysBrain', () => {
  it('normalizes principles + open re-reviews and honors the counts', () => {
    const out = normalizeWaysBrain(BRAIN);
    expect(out.ok).toBe(true);
    expect(out.live).toBe(true);
    expect(out.generatedAt).toBe('2026-07-21T12:00:00Z');
    expect(out.principles.map((p) => p.id)).toEqual(['THREE-BRAKES', 'bad']); // id-less row dropped
    expect(out.openReReviews.map((r) => r.id)).toEqual(['DR-0219']); // date-less dropped
    expect(out.counts).toEqual({ principles: 35, decisions: 189, open_re_reviews: 87 });
  });

  it('is honest-offline on garbage (caller keeps the build snapshot)', () => {
    for (const bad of [null, undefined, 'nope', { ok: false }]) {
      const out = normalizeWaysBrain(bad);
      expect(out.ok).toBe(false);
      expect(out.live).toBe(false);
      expect(out.principles).toEqual([]);
    }
  });
});

describe('fetchWaysBrain — honest-offline', () => {
  it('returns the live brain on a good response', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => BRAIN });
    const out = await fetchWaysBrain({ fetchImpl });
    expect(out.live).toBe(true);
    expect(out.counts.open_re_reviews).toBe(87);
  });
  it('falls back to not-live on a non-2xx or a throw (never fabricates)', async () => {
    expect((await fetchWaysBrain({ fetchImpl: async () => ({ ok: false, json: async () => ({}) }) })).live).toBe(false);
    expect((await fetchWaysBrain({ fetchImpl: async () => { throw new Error('down'); } })).live).toBe(false);
  });
});
