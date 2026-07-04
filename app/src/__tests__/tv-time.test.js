// @vitest-environment node
//
// tv-time — PoeTech TV Time store (Darrell 2026-07-04). Pins the sovereignty +
// integrity of a person's watch list + discussion: per-identity keys never
// commingle, the store is fail-soft (a throwing localStorage never breaks the
// render), transforms are pure/immutable, reactions are a set (laugh together,
// tap to toggle), and a corrupt blob can't inject a bad status/reaction.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  STATUSES, REACTIONS, DEFAULT_STATUS, SEED_SHOWS, DISCERNMENT_PROMPTS,
  tvKey, emptyTv, loadTv, saveTv, getStatus, setStatus, untrack, rateShow,
  addComment, getComments, toggleReaction, reactionCount, bucketShows, discernmentPromptFor,
  addCustomShow, customCatalog,
} from '../lib/tv-time.js';

function installStorage(throwing = false) {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (throwing ? (() => { throw new Error('x'); })() : (map.has(k) ? map.get(k) : null)),
    setItem: (k, v) => { if (throwing) throw new Error('x'); map.set(k, String(v)); },
    removeItem: (k) => map.delete(k),
  };
  return map;
}
beforeEach(() => { delete globalThis.localStorage; });

describe('catalog + palette', () => {
  it('offers the four sections the friend group thinks in', () => {
    expect(STATUSES.map((s) => s.key)).toEqual(['watching', 'want', 'watched', 'stale']);
    expect(DEFAULT_STATUS).toBe('want');
    expect(REACTIONS.some((r) => r.key === 'laugh')).toBe(true);  // laugh together
    expect(SEED_SHOWS.length).toBeGreaterThan(3);
    expect(DISCERNMENT_PROMPTS.length).toBeGreaterThan(3);
  });
});

describe('pure transforms (immutable)', () => {
  it('sets status + rating without mutating the input', () => {
    const s0 = emptyTv();
    const s1 = setStatus(s0, 'reality-housewives', 'watching');
    expect(getStatus(s1, 'reality-housewives')).toBe('watching');
    expect(getStatus(s0, 'reality-housewives')).toBe('want');   // default; original untouched
    const s2 = rateShow(s1, 'reality-housewives', 9);           // clamps to 5
    expect(bucketShows(s2, SEED_SHOWS).watching[0].rating).toBe(5);
    expect(getStatus(untrack(s2, 'reality-housewives'), 'reality-housewives')).toBe('want'); // untracked -> default
  });
  it('ignores unknown statuses (a corrupt store cannot inject one)', () => {
    expect(getStatus(setStatus(emptyTv(), 'x', 'bogus'), 'x')).toBe('want');
  });
  it('adds comments and toggles reactions as a set (laugh together)', () => {
    let s = addComment(emptyTv(), 'drama-crown', { author: 'Tiffany', text: 'The finale!!' }, 1000, 0);
    const c = getComments(s, 'drama-crown')[0];
    expect(c.author).toBe('Tiffany');
    s = toggleReaction(s, 'drama-crown', c.id, 'laugh', 'You');
    s = toggleReaction(s, 'drama-crown', c.id, 'laugh', 'Sister K');
    expect(reactionCount(getComments(s, 'drama-crown')[0], 'laugh')).toBe(2);
    s = toggleReaction(s, 'drama-crown', c.id, 'laugh', 'You');   // untoggle
    expect(reactionCount(getComments(s, 'drama-crown')[0], 'laugh')).toBe(1);
    // an unknown reaction is a no-op
    s = toggleReaction(s, 'drama-crown', c.id, 'nope', 'You');
    expect(getComments(s, 'drama-crown')[0].reactions.nope).toBeUndefined();
  });
  it('empty comment text is ignored', () => {
    expect(getComments(addComment(emptyTv(), 'x', { text: '   ' }, 1, 0), 'x')).toEqual([]);
  });
});

describe('bucketShows', () => {
  it('sorts catalog shows into their status; untracked shows are offered to add', () => {
    let s = setStatus(emptyTv(), 'reality-housewives', 'watching');
    s = setStatus(s, 'comedy-office', 'watched');
    const b = bucketShows(s, SEED_SHOWS);
    expect(b.watching.map((x) => x.id)).toContain('reality-housewives');
    expect(b.watched.map((x) => x.id)).toContain('comedy-office');
    expect(b.untracked.length).toBe(SEED_SHOWS.length - 2);
  });
});

describe('custom shows (add your own, no double duty)', () => {
  it('adds a custom show as "want", slugs a stable id, and lists it in the catalog', () => {
    const s = addCustomShow(emptyTv(), { title: 'My Home Church Live!', genre: 'Faith' });
    const cat = customCatalog(s);
    expect(cat).toHaveLength(1);
    expect(cat[0].id).toBe('my-home-church-live');
    expect(cat[0].title).toBe('My Home Church Live!');
    expect(getStatus(s, 'my-home-church-live')).toBe('want');
    // it shows up when bucketed against the merged catalog, and survives a round-trip
    expect(bucketShows(s, [...SEED_SHOWS, ...cat]).want.map((x) => x.id)).toContain('my-home-church-live');
    installStorage();
    saveTv('c@x.co', setStatus(s, 'my-home-church-live', 'watching'));
    expect(customCatalog(loadTv('c@x.co'))[0].title).toBe('My Home Church Live!');
  });
  it('a blank title is ignored', () => {
    expect(customCatalog(addCustomShow(emptyTv(), { title: '  ' }))).toEqual([]);
  });
});

describe('discernment prompt is deterministic per show', () => {
  it('same show -> same prompt, from the list', () => {
    const p = discernmentPromptFor('drama-crown');
    expect(DISCERNMENT_PROMPTS).toContain(p);
    expect(discernmentPromptFor('drama-crown')).toBe(p);
  });
});

describe('per-identity, device-local persistence', () => {
  it('keys are namespaced per identity (no commingling)', () => {
    expect(tvKey('A@B.com')).toBe('poetech.tvtime.v1:a@b.com');
    expect(tvKey('a@b.co')).not.toBe(tvKey('c@d.co'));
  });
  it('round-trips through storage and stays separate across identities', () => {
    installStorage();
    saveTv('one@x.co', setStatus(emptyTv(), 'drama-crown', 'watching'));
    saveTv('two@x.co', setStatus(emptyTv(), 'drama-crown', 'watched'));
    expect(getStatus(loadTv('one@x.co'), 'drama-crown')).toBe('watching');
    expect(getStatus(loadTv('two@x.co'), 'drama-crown')).toBe('watched');
  });
  it('drops a corrupt status/reaction on load (a hand-edited blob cannot inject)', () => {
    const map = installStorage();
    map.set(tvKey('x@y.co'), JSON.stringify({ shows: { good: { status: 'watching', rating: 3, comments: [{ id: 'c1', text: 'hi', reactions: { laugh: ['You'], bogus: ['x'] } }] }, bad: { status: 'evil' } } }));
    const st = loadTv('x@y.co');
    expect(getStatus(st, 'good')).toBe('watching');
    expect(getStatus(st, 'bad')).toBe('want');                  // unknown status -> default
    expect(reactionCount(getComments(st, 'good')[0], 'laugh')).toBe(1);
    expect(getComments(st, 'good')[0].reactions.bogus).toBeUndefined();
  });
});

describe('fail-soft (never throws into the render tree)', () => {
  it('returns empty with no storage; save reports skipped', () => {
    expect(loadTv('a@b.co')).toEqual(emptyTv());
    expect(saveTv('a@b.co', emptyTv())).toEqual({ skipped: 'no-storage' });
  });
  it('degrades when localStorage throws', () => {
    installStorage(true);
    expect(loadTv('a@b.co')).toEqual(emptyTv());
    expect(saveTv('a@b.co', emptyTv()).skipped).toBe('write-error');
  });
});
