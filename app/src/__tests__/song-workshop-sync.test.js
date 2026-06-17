// Tests for the Song Workshop pure helpers (Darrell 2026-06-17). Locks the
// list-paste parser, source detection, embed fallback, status bucketing, and the
// comment/vote tallies the surface renders from. Proven-to-catch: each block
// asserts the failure mode it guards (a dropped list line, a dead card, a
// mis-bucketed final, a mis-counted vote). Pairs with the break-it ship gate.
import { describe, it, expect } from 'vitest';
import {
  detectSourceType, ideaEmbedUrl, parseSongLine, parseSongList,
  toIdeaShape, toSongCommentShape, toVoteShape,
  splitByStatus, groupCommentsBySong, tallyVotes,
} from '../lib/song-workshop-sync.js';

describe('detectSourceType', () => {
  it('flags embeddable YouTube as youtube, everything else as link', () => {
    expect(detectSourceType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectSourceType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(detectSourceType('https://example.com/song.mp3')).toBe('link');
    expect(detectSourceType('')).toBe('link');
    expect(detectSourceType(null)).toBe('link');
  });
});

describe('ideaEmbedUrl (never a dead card)', () => {
  it('returns an embed URL for YouTube ideas', () => {
    expect(ideaEmbedUrl({ url: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
  it('returns null (-> Open-link fallback) for non-embeddable or missing URLs', () => {
    expect(ideaEmbedUrl({ url: 'https://example.com/x' })).toBeNull();
    expect(ideaEmbedUrl({ url: null })).toBeNull();
    expect(ideaEmbedUrl(null)).toBeNull();
  });
});

describe('parseSongLine', () => {
  it('splits "Title - URL"', () => {
    expect(parseSongLine('Total Praise - https://youtu.be/dQw4w9WgXcQ'))
      .toEqual({ title: 'Total Praise', url: 'https://youtu.be/dQw4w9WgXcQ' });
  });
  it('splits "URL Title"', () => {
    expect(parseSongLine('https://youtu.be/dQw4w9WgXcQ Way Maker'))
      .toEqual({ title: 'Way Maker', url: 'https://youtu.be/dQw4w9WgXcQ' });
  });
  it('accepts a bare youtu.be link without a scheme and names it', () => {
    expect(parseSongLine('youtu.be/dQw4w9WgXcQ'))
      .toEqual({ title: 'YouTube song', url: 'https://youtu.be/dQw4w9WgXcQ' });
  });
  it('strips list bullets / numbering from the title', () => {
    expect(parseSongLine('1. Goodness of God https://example.com/g'))
      .toEqual({ title: 'Goodness of God', url: 'https://example.com/g' });
  });
  it('keeps a title-only line (no URL) rather than dropping it', () => {
    expect(parseSongLine('Oh How I Love Jesus')).toEqual({ title: 'Oh How I Love Jesus', url: null });
  });
  it('ignores blank lines', () => {
    expect(parseSongLine('   ')).toBeNull();
  });
});

describe('parseSongList', () => {
  it('parses each line and de-duplicates by URL/title', () => {
    const text = [
      'Total Praise - https://youtu.be/aaaaaaaaaaa',
      'https://youtu.be/aaaaaaaaaaa',          // dup URL -> dropped
      'Way Maker',
      '',
      '  • Goodness of God https://example.com/g',
    ].join('\n');
    const out = parseSongList(text);
    expect(out).toEqual([
      { title: 'Total Praise', url: 'https://youtu.be/aaaaaaaaaaa' },
      { title: 'Way Maker', url: null },
      { title: 'Goodness of God', url: 'https://example.com/g' },
    ]);
  });
  it('returns [] for empty/whitespace input', () => {
    expect(parseSongList('')).toEqual([]);
    expect(parseSongList('\n  \n')).toEqual([]);
  });
});

describe('toIdeaShape', () => {
  it('maps a row and flags mine by added_by', () => {
    const row = { id: 'i1', title: 'T', url: 'u', source_type: 'youtube', status: 'final', added_by: 'me', added_by_name: 'Christina', created_at: 't' };
    const s = toIdeaShape(row, 'me');
    expect(s).toMatchObject({ id: 'i1', title: 'T', url: 'u', sourceType: 'youtube', status: 'final', addedByName: 'Christina', mine: true });
    expect(toIdeaShape(row, 'other').mine).toBe(false);
  });
  it('defaults status to idea and name to Member', () => {
    expect(toIdeaShape({ id: 'x', title: 'T' }, null)).toMatchObject({ status: 'idea', addedByName: 'Member', mine: false });
  });
});

describe('splitByStatus (the three buckets)', () => {
  it('routes finals / candidates / pool and sorts newest-first', () => {
    const ideas = [
      { id: 'a', status: 'idea', createdAt: '2026-06-01' },
      { id: 'b', status: 'final', createdAt: '2026-06-02' },
      { id: 'c', status: 'pool', createdAt: '2026-06-03' },
      { id: 'd', status: 'idea', createdAt: '2026-06-05' },
    ];
    const { finals, candidates, pool } = splitByStatus(ideas);
    expect(finals.map((x) => x.id)).toEqual(['b']);
    expect(candidates.map((x) => x.id)).toEqual(['d', 'a']);   // newest first
    expect(pool.map((x) => x.id)).toEqual(['c']);
  });
  it('handles an empty/undefined list', () => {
    expect(splitByStatus()).toEqual({ finals: [], candidates: [], pool: [] });
  });
});

describe('groupCommentsBySong', () => {
  it('buckets by songId, oldest first', () => {
    const map = groupCommentsBySong([
      { id: 'c2', songId: 's1', createdAt: '2026-06-02' },
      { id: 'c1', songId: 's1', createdAt: '2026-06-01' },
      { id: 'c3', songId: 's2', createdAt: '2026-06-01' },
    ]);
    expect(map.get('s1').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(map.get('s2').map((c) => c.id)).toEqual(['c3']);
  });
});

describe('tallyVotes', () => {
  it('counts votes per song and surfaces whether mine is among them', () => {
    const map = tallyVotes([
      { songId: 's1', mine: false },
      { songId: 's1', mine: true },
      { songId: 's2', mine: false },
    ]);
    expect(map.get('s1')).toEqual({ count: 2, mine: true });
    expect(map.get('s2')).toEqual({ count: 1, mine: false });
    expect(map.get('s3')).toBeUndefined();
  });
});

describe('toSongCommentShape / toVoteShape', () => {
  it('maps comment rows + mine flag', () => {
    expect(toSongCommentShape({ id: 'c', song_id: 's', user_id: 'me', author: 'A', body: 'hi', created_at: 't' }, 'me'))
      .toEqual({ id: 'c', songId: 's', userId: 'me', author: 'A', body: 'hi', createdAt: 't', mine: true });
  });
  it('maps vote rows + mine flag', () => {
    expect(toVoteShape({ id: 'v', song_id: 's', user_id: 'u' }, 'u')).toEqual({ id: 'v', songId: 's', userId: 'u', mine: true });
    expect(toVoteShape({ id: 'v', song_id: 's', user_id: 'u' }, 'me').mine).toBe(false);
  });
});
