// @vitest-environment node
//
// The Word dedupe — the live bug (Darrell 2026-07-01): SIX identical draft rows
// "POINTS AND SCRIPTURES FROM 11-26-2023 SERMON ...", all 2026-06-29, Bishop
// Lloyd E. Gwin, from a harvest that writes null-video_id rows. These pin the
// pure guard (mirror of migration 0061): the six clones collapse to one, and
// genuinely-distinct messages are never wrongly merged. Deterministic backbone.
import { describe, it, expect, vi } from 'vitest';

// sermonDedupeKey / dedupeSermons are pure, but choir-sync.js imports supabase.js
// (which touches window at module load). Mock the side-effecting deps so the pure
// functions load in the node env.
vi.mock('../lib/supabase.js', () => ({ default: { from: vi.fn() } }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: vi.fn() }));

import { sermonDedupeKey, dedupeSermons } from '../lib/choir-sync.js';

const SIX_DUPES = Array.from({ length: 6 }, (_, i) => ({
  id: `d${i}`,
  title: 'POINTS AND SCRIPTURES FROM 11-26-2023 SERMON - I.M ON THE LORD.S SIDE - LUKE 19.9-10 NIV',
  serviceDate: '2026-06-29', serviceType: 'sunday', speaker: 'Bishop Lloyd E. Gwin',
  videoId: null, status: 'draft',
}));

describe('sermonDedupeKey', () => {
  it('keys video-backed rows by video id', () => {
    expect(sermonDedupeKey({ videoId: 'abc', title: 'X', serviceDate: '2026-01-01' })).toBe('v:abc');
  });
  it('keys video-less rows by content, case/space-insensitive on title', () => {
    expect(sermonDedupeKey({ title: '  Hello World ', serviceDate: '2026-01-01', serviceType: 'sunday' }))
      .toBe(sermonDedupeKey({ title: 'hello world', serviceDate: '2026-01-01', serviceType: 'sunday' }));
  });
  it('accepts snake_case DB rows too', () => {
    expect(sermonDedupeKey({ video_id: 'z9' })).toBe('v:z9');
    expect(sermonDedupeKey({ title: 'A', service_date: '2026-01-01', service_type: 'wednesday' }))
      .toBe('t:a|2026-01-01|wednesday|');
  });
});

describe('dedupeSermons — collapses the live 6-clone bug to one', () => {
  it('keeps exactly one of six identical drafts, drops five (keeps the first)', () => {
    const { kept, dropped } = dedupeSermons(SIX_DUPES);
    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(5);
    expect(kept[0].id).toBe('d0');
  });
  it('does NOT collapse genuinely distinct messages (different date, service, or video)', () => {
    const rows = [
      { id: 'a', title: 'Same Title', serviceDate: '2026-06-01', serviceType: 'sunday' },
      { id: 'b', title: 'Same Title', serviceDate: '2026-06-08', serviceType: 'sunday' }, // different date
      { id: 'c', title: 'Same Title', serviceDate: '2026-06-01', serviceType: 'wednesday' }, // different service
      { id: 'd', title: 'Same Title', serviceDate: '2026-06-01', serviceType: 'sunday', videoId: 'v1' }, // has video
    ];
    expect(dedupeSermons(rows).kept.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('is a no-op on already-unique input and handles empty/non-array', () => {
    expect(dedupeSermons([]).kept).toEqual([]);
    expect(dedupeSermons(null).kept).toEqual([]);
  });
});
