// =============================================================================
// eternal-algorithms-sync — the forge→pulpit bridge, proven not claimed.
// =============================================================================
// Darrell 2026-07-03: "Scriptures are eternal algorithms to me and to
// everything" + approved the bridge ("yes 🔥"). These tests pin:
//   * the sync merge (newest-wins, tombstones, first-sync upload, per-device
//     seed dedupe by NAME) — same guarantees the Study sync carries;
//   * the PUBLISH state round trip — published/publish4D/publishedAt survive
//     normalize → row → doc → entry, and the row's `published` column mirrors
//     the doc so the DATABASE (not the client) filters the public window;
//   * unpublish clears the column (nothing lingers half-public);
//   * the scripture cross-reference matcher — honest overlap only: same
//     book+chapter, verse ranges intersecting where both sides carry them
//     (Jas 1:27 does NOT surface an algorithm anchored at Jas 1:2-4).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  mergeLibrary, dedupeSeedAlgorithms, algorithmToRow, rowToAlgorithm,
  parseScriptureRef, refsOverlap, algorithmsAnchoredAt, normalizePublished,
} from '../lib/eternal-algorithms-sync.js';
import { normalizeAlgorithm } from '../lib/eternal-algorithms.js';

const alg = (id, over = {}) => normalizeAlgorithm({
  id, name: `Framework ${id}`,
  fourD: { summary: 'deep', scripture: 'James 1:2-4' },
  threeD: { summary: 'practical' },
  outcome: 'the win',
  createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
  ...over,
});
const row = (e) => algorithmToRow(e);
const lib = (entries) => ({ version: 1, label: 'Eternal Algorithms', entries });

describe('merge — same guarantees as the Study rail', () => {
  it('local edit newer than cloud wins and re-uploads', () => {
    const le = alg('a', { outcome: 'edited here', updatedAt: '2026-07-03T10:00:00.000Z' });
    const ce = alg('a', { outcome: 'stale', updatedAt: '2026-07-02T00:00:00.000Z' });
    const r = mergeLibrary(lib([le]), { rows: [row(ce)] });
    expect(r.library.entries[0].outcome).toBe('edited here');
    expect(r.pushEntries.map((e) => e.id)).toEqual(['a']);
  });

  it('first sync uploads the whole device store; cloud-only entries come down', () => {
    const r = mergeLibrary(lib([alg('a')]), { rows: [row(alg('b', { name: 'From the phone' }))] });
    expect(r.library.entries.map((e) => e.id).sort()).toEqual(['a', 'b']);
    expect(r.pushEntries.map((e) => e.id)).toEqual(['a']);
  });

  it('a cloud tombstone removes the local copy; a post-delete edit survives', () => {
    const gone = mergeLibrary(lib([alg('a')]), {
      rows: [{ id: 'a', doc: {}, deleted: true, updated_at: '2026-07-02T00:00:00.000Z' }],
    });
    expect(gone.library.entries).toHaveLength(0);
    const kept = mergeLibrary(lib([alg('a', { updatedAt: '2026-07-03T00:00:00.000Z' })]), {
      rows: [{ id: 'a', doc: {}, deleted: true, updated_at: '2026-07-02T00:00:00.000Z' }],
    });
    expect(kept.library.entries).toHaveLength(1);
    expect(kept.pushEntries.map((e) => e.id)).toEqual(['a']);
  });

  it('per-device seed duplicates collapse by NAME; the cloud duplicate is tombstoned', () => {
    const mine = alg('e_dev1', { seed: true, name: 'The Table Before the Enemy', updatedAt: '2026-07-03T00:00:00.000Z' });
    const cloudDup = alg('e_dev2', { seed: true, name: 'The Table Before the Enemy', updatedAt: '2026-07-01T00:00:00.000Z' });
    const r = mergeLibrary(lib([mine]), { rows: [row(cloudDup)] });
    expect(r.library.entries).toHaveLength(1);
    expect(r.library.entries[0].id).toBe('e_dev1');
    expect(r.pushTombstones).toEqual(['e_dev2']);
  });

  it('non-seed frameworks with the same name are both kept', () => {
    expect(dedupeSeedAlgorithms([alg('a', { name: 'Same' }), alg('b', { name: 'Same' })]).entries).toHaveLength(2);
  });
});

describe('publish state — the bridge round trip', () => {
  it('published/publish4D/publishedAt survive normalize → row → entry', () => {
    const e = normalizeAlgorithm({ ...alg('a'), published: true, publish4D: true, publishedAt: '2026-07-03T12:00:00.000Z' });
    expect(e.published).toBe(true);
    expect(e.publish4D).toBe(true);
    const r = algorithmToRow(e);
    expect(r.published).toBe(true);            // the DB filter column mirrors the doc
    expect(r.doc.published).toBe(true);
    expect(r.doc.publish4D).toBe(true);
    expect(r.doc.publishedAt).toBe('2026-07-03T12:00:00.000Z');
    const back = rowToAlgorithm(r);
    expect(back.published).toBe(true);
    expect(back.publish4D).toBe(true);
  });

  it('an unpublished entry writes published=false to the column (nothing half-public)', () => {
    const r = algorithmToRow(alg('a'));
    expect(r.published).toBe(false);
    expect(r.doc.published).toBe(false);
  });

  it('normalizePublished omits the deep layer when the owner kept it private (null, never painted)', () => {
    const pub = normalizePublished({ id: 'a', name: 'X', outcome: 'win', three_d_summary: '3d', four_d_summary: null, scripture: 'James 1:2-4', tags: [], published_at: null });
    expect(pub.fourD).toBeNull();
    const withDeep = normalizePublished({ id: 'a', name: 'X', outcome: 'win', three_d_summary: '3d', four_d_summary: 'deep', scripture: '', tags: [], published_at: null });
    expect(withDeep.fourD).toBe('deep');
  });
});

describe('scripture cross-reference — honest overlap only', () => {
  it('parses refs with books, numbered books, chapters, and ranges', () => {
    expect(parseScriptureRef('James 1:2-4')).toEqual({ book: 'james', chapter: 1, v1: 2, v2: 4 });
    expect(parseScriptureRef('1 Corinthians 2:16')).toEqual({ book: '1 corinthians', chapter: 2, v1: 16, v2: 16 });
    expect(parseScriptureRef('Psalm 23')).toEqual({ book: 'psalm', chapter: 23, v1: null, v2: null });
    expect(parseScriptureRef('')).toBeNull();
  });

  it('overlapping verse ranges match; disjoint verses in the same chapter do NOT', () => {
    expect(refsOverlap('James 1:2', 'James 1:2-4')).toBe(true);
    expect(refsOverlap('James 1:3-5', 'James 1:2-4')).toBe(true);
    expect(refsOverlap('James 1:27', 'James 1:2-4')).toBe(false);
    expect(refsOverlap('James 2:1', 'James 1:2-4')).toBe(false);
    expect(refsOverlap('Jude 1:2', 'James 1:2-4')).toBe(false);
  });

  it('a chapter-level ref matches any verse in that chapter', () => {
    expect(refsOverlap('Psalm 23', 'Psalm 23:5')).toBe(true);
  });

  it('algorithmsAnchoredAt finds only the algorithms whose refs overlap the verse', () => {
    const published = [
      { id: 'p1', name: 'Joy Is the Strength', scripture: 'Nehemiah 8:10; 1 Peter 1:8' },
      { id: 'p2', name: 'Seedtime and Harvest', scripture: 'Galatians 6:7-9; Genesis 8:22' },
    ];
    expect(algorithmsAnchoredAt('Galatians 6:9', published).map((a) => a.id)).toEqual(['p2']);
    expect(algorithmsAnchoredAt('Nehemiah 8:10', published).map((a) => a.id)).toEqual(['p1']);
    expect(algorithmsAnchoredAt('John 3:16', published)).toEqual([]);
  });
});
