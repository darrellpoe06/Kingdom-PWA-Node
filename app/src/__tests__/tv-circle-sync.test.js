// tv-circle-sync — the PURE parts of the circle sharing client (invite codes +
// bucketing shares into views + the community feed). The supabase I/O is fail-soft
// and proven by the live isolation smoke test (0074), not a mock. Also pins the
// enablement GATE — now ON, since that test passed (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  TV_SHARING_ENABLED, makeInviteCode, bucketShares, feedForBucket,
} from '../lib/tv-circle-sync.js';

describe('the enablement gate', () => {
  it('is ON — the 0074 isolation smoke test passed GREEN against the real DB (2026-07-04)', () => {
    // Flipped from false to true only AFTER tv-sharing-isolation ran green on main
    // (run 28722936533, head a893dee): kids never read 'us', spouse reads 'us',
    // parent oversight, friend-scope, cross-family isolation — all asserted. DR-0076.
    expect(TV_SHARING_ENABLED).toBe(true);
  });
});

describe('makeInviteCode', () => {
  it('is the requested length, from the unambiguous alphabet', () => {
    const code = makeInviteCode(6, () => 0.5);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    expect(code).not.toMatch(/[IO01L]/); // ambiguous chars excluded
  });
  it('varies with the rng', () => {
    let i = 0;
    const seq = [0, 0.2, 0.4, 0.6, 0.8, 0.99];
    const code = makeInviteCode(6, () => seq[i++]);
    expect(new Set(code).size).toBeGreaterThan(1);
  });
});

describe('bucketShares — group readable rows into the three views', () => {
  const rows = [
    { owner: 'u-dad', audience: 'family', doc: { shows: { a: {} }, custom: { a: { title: 'Bluey' } } } },
    { owner: 'u-mom', audience: 'family', doc: { shows: { a: {} }, custom: { a: { title: 'Bluey' } } } },
    { owner: 'u-dad', audience: 'us', doc: { shows: { b: {} }, custom: { b: { title: 'Snowfall' } } } },
    { owner: 'u-pal', audience: 'circle', doc: { shows: { c: {} }, custom: { c: { title: 'Power' } } } },
  ];
  const names = { 'u-dad': 'Dad', 'u-mom': 'Mom', 'u-pal': 'Pal' };

  it('splits rows by audience and resolves names', () => {
    const b = bucketShares(rows, names);
    expect(b.family.map((m) => m.name).sort()).toEqual(['Dad', 'Mom']);
    expect(b.us.map((m) => m.name)).toEqual(['Dad']);
    expect(b.circle.map((m) => m.name)).toEqual(['Pal']);
  });
  it('an unknown owner falls back to "Someone"; a bad audience is dropped', () => {
    const b = bucketShares([{ owner: 'x', audience: 'family', doc: {} }, { owner: 'y', audience: 'nope', doc: {} }], {});
    expect(b.family[0].name).toBe('Someone');
    expect(b.us).toEqual([]);
  });
  it('is empty-safe', () => {
    expect(bucketShares()).toEqual({ us: [], family: [], circle: [] });
  });

  it('feedForBucket counts watchers per title, most-watched first', () => {
    const b = bucketShares(rows, names);
    const feed = feedForBucket(b.family);
    expect(feed[0]).toMatchObject({ title: 'Bluey', count: 2 });
  });
});
