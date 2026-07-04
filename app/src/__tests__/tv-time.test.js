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
  addShowFromCatalog, toggleEpisode, isEpisodeWatched, setSeasonWatched, showProgress, seasonProgress, epKey,
  addMovieFromCatalog, toggleMovieWatched, isMovieWatched, itemKind,
} from '../lib/tv-time.js';

// A looked-up show (tv-catalog shape) with 2 seasons / 3 episodes total.
const GOT = {
  id: 82, title: 'Game of Thrones', genre: 'Drama', poster: 'p.jpg', year: '2011', network: 'HBO',
  seasons: [
    { season: 1, episodes: [{ number: 1, name: 'Winter Is Coming' }, { number: 2, name: 'The Kingsroad' }] },
    { season: 2, episodes: [{ number: 1, name: 'The North Remembers' }] },
  ],
};

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

describe('episodes — bring in the seasons, check off what you watched', () => {
  it('adds a looked-up show with its seasons and tracks it', () => {
    const s = addShowFromCatalog(emptyTv(), GOT);
    const meta = customCatalog(s).find((x) => x.id === '82');
    expect(meta.title).toBe('Game of Thrones');
    expect(meta.poster).toBe('p.jpg');
    expect(meta.seasons.length).toBe(2);
    expect(getStatus(s, '82')).toBe('watching');
    expect(showProgress(s, '82')).toEqual({ watched: 0, total: 3 });
  });
  it('toggles a single episode and reflects it in progress', () => {
    let s = addShowFromCatalog(emptyTv(), GOT);
    s = toggleEpisode(s, '82', 1, 1);
    expect(isEpisodeWatched(s, '82', 1, 1)).toBe(true);
    expect(showProgress(s, '82')).toEqual({ watched: 1, total: 3 });
    s = toggleEpisode(s, '82', 1, 1);              // untoggle
    expect(isEpisodeWatched(s, '82', 1, 1)).toBe(false);
  });
  it('marks a whole season at once, and season progress is exact', () => {
    let s = addShowFromCatalog(emptyTv(), GOT);
    s = setSeasonWatched(s, '82', 1, true);
    expect(seasonProgress(s, '82', 1)).toEqual({ watched: 2, total: 2 });
    expect(showProgress(s, '82')).toEqual({ watched: 2, total: 3 });
    s = setSeasonWatched(s, '82', 1, false);       // clear the season
    expect(seasonProgress(s, '82', 1)).toEqual({ watched: 0, total: 2 });
  });
  it('re-adding refreshes the catalog but keeps your checkmarks', () => {
    let s = addShowFromCatalog(emptyTv(), GOT);
    s = toggleEpisode(s, '82', 2, 1);
    s = addShowFromCatalog(s, { ...GOT, poster: 'new.jpg' });  // refresh
    expect(customCatalog(s).find((x) => x.id === '82').poster).toBe('new.jpg');
    expect(isEpisodeWatched(s, '82', 2, 1)).toBe(true);         // checkmark kept
  });
  it('watched checkmarks survive a save/load round-trip; a corrupt key is dropped', () => {
    installStorage();
    let s = addShowFromCatalog(emptyTv(), GOT);
    s = toggleEpisode(s, '82', 1, 2);
    saveTv('ep@x.co', s);
    expect(isEpisodeWatched(loadTv('ep@x.co'), '82', 1, 2)).toBe(true);
    const map = installStorage();
    map.set(tvKey('c@x.co'), JSON.stringify({ shows: { '82': { status: 'watching', watched: { '1x1': true, 'bogus': true, '2x1': false } } } }));
    const st = loadTv('c@x.co');
    expect(isEpisodeWatched(st, '82', 1, 1)).toBe(true);
    expect(isEpisodeWatched(st, '82', 2, 1)).toBe(false);       // false value dropped
    expect(Object.keys(st.shows['82'].watched)).toEqual(['1x1']); // bogus key dropped
    expect(epKey(3, 7)).toBe('3x7');
  });
});

// A looked-up movie (tv-catalog shape) — a single-watch item, no seasons.
const MOVIE = { id: 'mv-1337364561', kind: 'movie', title: 'Black Panther', genre: 'Action & Adventure', poster: 'bp.jpg', year: '2018', network: '' };

describe('movies — a single watch, then rate + talk ("movies too?")', () => {
  it('adds a movie as "want", with no seasons, kind movie', () => {
    const s = addMovieFromCatalog(emptyTv(), MOVIE);
    const meta = customCatalog(s).find((x) => x.id === 'mv-1337364561');
    expect(meta.kind).toBe('movie');
    expect(meta.title).toBe('Black Panther');
    expect(meta.seasons).toEqual([]);
    expect(itemKind(s, 'mv-1337364561')).toBe('movie');
    expect(getStatus(s, 'mv-1337364561')).toBe('want');
    expect(showProgress(s, 'mv-1337364561')).toEqual({ watched: 0, total: 1 });
  });
  it('one tap marks a movie watched (and back), reflected in progress + status', () => {
    let s = addMovieFromCatalog(emptyTv(), MOVIE);
    s = toggleMovieWatched(s, 'mv-1337364561');
    expect(isMovieWatched(s, 'mv-1337364561')).toBe(true);
    expect(getStatus(s, 'mv-1337364561')).toBe('watched');
    expect(showProgress(s, 'mv-1337364561')).toEqual({ watched: 1, total: 1 });
    s = toggleMovieWatched(s, 'mv-1337364561');   // back to want
    expect(isMovieWatched(s, 'mv-1337364561')).toBe(false);
    expect(getStatus(s, 'mv-1337364561')).toBe('want');
  });
  it('toggleMovieWatched only acts on a tracked movie (not a show, not unknown)', () => {
    const s = addShowFromCatalog(emptyTv(), { id: 82, title: 'GoT', seasons: [] });
    expect(toggleMovieWatched(s, '82')).toEqual(s);            // a show is untouched
    expect(toggleMovieWatched(emptyTv(), 'nope')).toEqual(emptyTv());
  });
  it('a movie kind survives a save/load round-trip and rating works', () => {
    installStorage();
    let s = addMovieFromCatalog(emptyTv(), MOVIE);
    s = rateShow(s, 'mv-1337364561', 5);
    saveTv('m@x.co', s);
    const st = loadTv('m@x.co');
    expect(itemKind(st, 'mv-1337364561')).toBe('movie');
    expect(customCatalog(st)[0].seasons).toEqual([]);
    expect(bucketShows(st, customCatalog(st)).want[0].rating).toBe(5);
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
