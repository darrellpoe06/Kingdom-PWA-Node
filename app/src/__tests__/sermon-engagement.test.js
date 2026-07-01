// =============================================================================
// sermon-engagement — the deterministic ranking behind "sort by what resonates".
// =============================================================================
// Pins the two-source engagement model (in-app hearts/likes + YouTube views/likes)
// and the sort. PROVEN-TO-CATCH: the ranking is reproducible and privacy-safe —
// counts come from aggregates, never per-user rows; a no-signal video ranks last.
import { describe, it, expect } from 'vitest';
import {
  tallyEngagement, buildEngagementMap, engagementScore, sortByEngagement,
  engagementLabel, engagementFor, EMPTY_ENGAGEMENT, SORT_MODES,
} from '../lib/sermon-engagement.js';

describe('tallyEngagement (raw rows)', () => {
  it('counts hearts/likes per video and flags my own', () => {
    const rows = [
      { video_id: 'a', user_id: 'u1', kind: 'heart' },
      { video_id: 'a', user_id: 'u2', kind: 'heart' },
      { video_id: 'a', user_id: 'u1', kind: 'like' },
      { video_id: 'b', user_id: 'u2', kind: 'heart' },
    ];
    const map = tallyEngagement(rows, [], 'u1');
    expect(map.a.hearts).toBe(2);
    expect(map.a.likes).toBe(1);
    expect(map.a.myHeart).toBe(true);
    expect(map.b.myHeart).toBe(false);
  });

  it('folds YouTube stats in', () => {
    const map = tallyEngagement([], [{ video_id: 'a', yt_views: 1200, yt_likes: 40 }]);
    expect(map.a.ytViews).toBe(1200);
    expect(map.a.ytLikes).toBe(40);
    expect(map.a.hasStats).toBe(true);
  });
});

describe('buildEngagementMap (aggregate-counts privacy path)', () => {
  it('assembles counts + my-own-toggle + stats without per-user leak', () => {
    const map = buildEngagementMap({
      counts: [{ videoId: 'a', kind: 'heart', count: 5 }, { videoId: 'a', kind: 'like', count: 2 }],
      myReactions: [{ videoId: 'a', kind: 'heart' }],
      stats: [{ videoId: 'a', ytViews: 900, ytLikes: 30, ytComments: 3 }],
      myUserId: 'u1',
    });
    expect(map.a.hearts).toBe(5);
    expect(map.a.likes).toBe(2);
    expect(map.a.myHeart).toBe(true);
    expect(map.a.ytViews).toBe(900);
  });
});

describe('engagementScore', () => {
  it('weighs in-app resonance over raw reach', () => {
    const hearted = engagementScore({ ...EMPTY_ENGAGEMENT, hearts: 3 });
    const viewedOnly = engagementScore({ ...EMPTY_ENGAGEMENT, ytViews: 50 });
    expect(hearted).toBeGreaterThan(viewedOnly);
  });
  it('is 0 for no signal', () => {
    expect(engagementScore(EMPTY_ENGAGEMENT)).toBe(0);
    expect(engagementScore()).toBe(0);
  });
});

describe('sortByEngagement', () => {
  const items = [
    { id: '1', videoId: 'a', serviceDate: '2026-01-01' },
    { id: '2', videoId: 'b', serviceDate: '2026-02-01' },
    { id: '3', videoId: 'c', serviceDate: '2026-03-01' }, // no signal
  ];
  const map = {
    a: { ...EMPTY_ENGAGEMENT, hearts: 10, ytViews: 100 },
    b: { ...EMPTY_ENGAGEMENT, hearts: 2, ytViews: 5000 },
  };

  it('most-hearted ranks by hearts', () => {
    const out = sortByEngagement(items, map, 'hearted');
    expect(out.map((x) => x.videoId)).toEqual(['a', 'b', 'c']);
  });
  it('most-viewed ranks by YouTube views', () => {
    const out = sortByEngagement(items, map, 'viewed');
    expect(out.map((x) => x.videoId)).toEqual(['b', 'a', 'c']);
  });
  it('a no-signal video ranks last (honest zero)', () => {
    const out = sortByEngagement(items, map, 'hearted');
    expect(out[out.length - 1].videoId).toBe('c');
  });
  it('does not mutate the input array', () => {
    const before = items.map((x) => x.id);
    sortByEngagement(items, map, 'viewed');
    expect(items.map((x) => x.id)).toEqual(before);
  });
});

describe('engagementLabel', () => {
  it('shows only the parts with a real number', () => {
    expect(engagementLabel({ ...EMPTY_ENGAGEMENT, hearts: 1, ytViews: 340 })).toBe('1 heart · 340 views');
    expect(engagementLabel(EMPTY_ENGAGEMENT)).toBe(''); // never "0 hearts · 0 views"
  });
});

describe('surface contracts', () => {
  it('engagementFor returns the shared empty object for an unknown video', () => {
    expect(engagementFor({}, 'nope')).toBe(EMPTY_ENGAGEMENT);
  });
  it('exposes the three sort modes', () => {
    expect(SORT_MODES.map((m) => m.key)).toEqual(['newest', 'hearted', 'viewed']);
  });
});
