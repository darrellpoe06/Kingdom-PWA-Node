// =============================================================================
// tv-catalog — the show LOOKUP for PoeTech TV Time (Darrell 2026-07-04: "you have
// a TV show called Game of Thrones. You can look up Game of Thrones. It'll show
// you a picture... and then it'll bring in all the seasons... check off each show
// you watched... it brings in all the seasons so you know how many seasons of
// each show it is. And it does that for every show").
//
// Source: TVmaze (https://www.tvmaze.com/api) — FREE, no API key, CORS-enabled,
// with posters + every season/episode. Licensed CC BY-SA for the data. One search
// call lists matches; one show call (?embed=episodes) returns the poster and every
// episode with its season + number.
//
// HONEST NOTE (DR-0076): the LIVE fetch runs in the reader's browser (a public,
// CORS-enabled API). The build sandbox's proxy blocks api.tvmaze.com, so the
// PARSERS below are verified against a recorded representative sample (tv-catalog
// .test.js), not a live sandbox call. The fetcher is injectable for that test and
// swappable for a same-origin proxy later (like the n8n rewrite) if we want to
// keep it sovereign/cached. Fail-soft: any network/parse error yields [] / null,
// never a throw into the render.
// =============================================================================

export const TV_SOURCE = { name: 'TVmaze', url: 'https://www.tvmaze.com', license: 'CC BY-SA' };
// Movies too (Darrell 2026-07-04: "movies too?"). TVmaze is TV-only, so movies use
// the iTunes Search API — FREE, NO API KEY (nothing to leak, unlike TMDb/OMDb),
// CORS-enabled, with a poster + year + genre. A movie is a single-watch item (no
// seasons); the same keyless / fail-soft / device-local posture as TVmaze.
export const MOVIE_SOURCE = { name: 'iTunes Search', url: 'https://itunes.apple.com', license: 'Apple public search API' };
const BASE = 'https://api.tvmaze.com';
const MOVIE_BASE = 'https://itunes.apple.com';

// Injectable fetcher (defaults to window.fetch). Tests set a disk/sample fetcher.
let _fetch = (typeof fetch === 'function') ? ((...a) => fetch(...a)) : null;
export function __setCatalogFetcher(fn) { _fetch = fn; }

async function getJson(url) {
  if (!_fetch) return null;
  try {
    const res = await _fetch(url);
    if (!res || !res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Strip TVmaze's HTML summary to plain text (its summary is a <p>…</p> blob).
function plain(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// One search result / show header -> our brief shape. Pure.
export function showBrief(s) {
  if (!s || s.id == null || !s.name) return null;
  const img = s.image || {};
  return {
    id: String(s.id),
    kind: 'show',
    title: String(s.name),
    year: String(s.premiered || '').slice(0, 4),
    network: (s.network && s.network.name) || (s.webChannel && s.webChannel.name) || '',
    poster: img.medium || img.original || '',
    genre: (Array.isArray(s.genres) && s.genres[0]) || 'Show',
    summary: plain(s.summary),
  };
}

// GET /search/shows?q= -> [{score, show}] -> [brief]. Pure parser + async fetch.
export function parseSearchResults(json) {
  return (Array.isArray(json) ? json : [])
    .map((r) => showBrief(r && r.show))
    .filter(Boolean);
}
export async function searchShows(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const json = await getJson(`${BASE}/search/shows?q=${encodeURIComponent(q)}`);
  return parseSearchResults(json);
}

// Group a flat episode list into seasons: [{ season, episodes:[{number,name,airdate}] }].
// Ignores "special" episodes with no season/number. Sorted by season then number.
export function groupEpisodes(episodes) {
  const bySeason = new Map();
  for (const e of (Array.isArray(episodes) ? episodes : [])) {
    if (!e || !Number.isFinite(e.season) || !Number.isFinite(e.number)) continue;
    if (!bySeason.has(e.season)) bySeason.set(e.season, []);
    bySeason.get(e.season).push({ number: e.number, name: String(e.name || `Episode ${e.number}`), airdate: e.airdate || '' });
  }
  return [...bySeason.keys()].sort((a, b) => a - b).map((season) => ({
    season,
    episodes: bySeason.get(season).sort((a, b) => a.number - b.number),
  }));
}

// GET /shows/:id?embed=episodes -> full show w/ seasons. Pure parser + async fetch.
export function parseShow(json) {
  const brief = showBrief(json);
  if (!brief) return null;
  const eps = json && json._embedded && json._embedded.episodes;
  return { ...brief, seasons: groupEpisodes(eps) };
}
export async function loadShow(id) {
  if (id == null) return null;
  const json = await getJson(`${BASE}/shows/${encodeURIComponent(id)}?embed=episodes`);
  return parseShow(json);
}

// Total episodes across a show's seasons (for the "0 / N watched" progress).
export function totalEpisodes(seasons) {
  return (Array.isArray(seasons) ? seasons : []).reduce((n, s) => n + (s.episodes ? s.episodes.length : 0), 0);
}

// --- Browse by genre ---------------------------------------------------------
// The genre set the friend group's app browses by (Darrell's screenshot). A
// genre grid filters the tracked list — honest: it's YOUR shows in that genre
// (the free APIs have no by-genre catalog endpoint, so we don't fake a global
// discovery feed). Matching is loose (substring, case-insensitive) so a TVmaze
// "Science-Fiction" and an iTunes "Sci-Fi & Fantasy" both land under it.
export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Anime', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Food', 'Game show', 'History', 'Home and garden',
  'Horror', 'Indie', 'Martial arts', 'Musical', 'Mystery', 'News', 'Reality',
  'Romance', 'Science fiction', 'Soap', 'Sport', 'Suspense', 'Talk show',
  'Thriller', 'Travel', 'War', 'Western',
];

// A few cross-vocabulary synonyms (TVmaze "Science-Fiction", iTunes "Sci-Fi &
// Fantasy", the screenshot's "Science fiction"). Applied before the substring
// compare so the browse grid catches the same shows across sources.
const GENRE_SYNONYMS = { scifi: 'sciencefiction', sciencefictionfantasy: 'sciencefiction', sports: 'sport', kidsfamily: 'family', gameshows: 'gameshow' };
function canonGenre(g) {
  const x = String(g || '').toLowerCase().replace(/[^a-z]/g, '');
  return GENRE_SYNONYMS[x] || x;
}

// Does an item's genre match a browse genre? Loose: normalized substring either
// way, after synonym folding ("Sci-Fi" ~ "Science fiction", "Sports" ~ "Sport").
export function genreMatches(itemGenre, browseGenre) {
  const a = canonGenre(itemGenre);
  const b = canonGenre(browseGenre);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

// --- Movies (iTunes Search API) ----------------------------------------------
// A movie is a single-watch item: no seasons, just a poster + year + genre. The
// search result already carries everything (unlike a show, no second fetch).

// Upscale iTunes' tiny artwork (…/100x100bb.jpg) to a card-sized poster. Pure.
function bigArt(url) {
  return String(url || '').replace(/\/[0-9]+x[0-9]+bb(\.(jpg|png))?$/i, '/600x600bb$1');
}

// One iTunes result -> our brief shape (kind:'movie'). Pure.
export function movieBrief(r) {
  if (!r || r.trackId == null || !r.trackName) return null;
  return {
    id: `mv-${r.trackId}`,          // 'mv-' prefix so a movie id never collides with a TVmaze show id
    kind: 'movie',
    title: String(r.trackName),
    year: String(r.releaseDate || '').slice(0, 4),
    network: '',                    // movies have no network; the studio isn't reliably in the payload
    poster: bigArt(r.artworkUrl100 || r.artworkUrl60 || ''),
    genre: String(r.primaryGenreName || 'Movie'),
    summary: plain(r.longDescription || r.shortDescription || ''),
  };
}

// GET /search?media=movie&term= -> { results:[...] } -> [brief]. Pure parser.
export function parseMovieResults(json) {
  const rows = json && Array.isArray(json.results) ? json.results : [];
  return rows.map(movieBrief).filter(Boolean);
}
export async function searchMovies(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const json = await getJson(`${MOVIE_BASE}/search?media=movie&limit=12&term=${encodeURIComponent(q)}`);
  return parseMovieResults(json);
}

// One search box, both worlds: look up shows AND movies at once, shows first
// (they carry the seasons the group checks off). Fail-soft — either side that
// errors just contributes nothing. Returns kind-tagged briefs.
export async function searchTitles(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const [shows, movies] = await Promise.all([searchShows(q), searchMovies(q)]);
  return [...shows, ...movies];
}

// --- Lazy poster backfill (for titles that arrived WITHOUT artwork) -----------
// A TV Time import stores every show with poster:'' (its GDPR export has no
// images) — so imported cards render the titled placeholder, never a picture
// (Darrell 2026-07-05: "the import didn't connect to pictures of the shows").
// resolvePoster looks a title up in the catalog once and returns the best match's
// poster. SINGLE-FLIGHT + cached per (kind,title): 100+ imported cards asking for
// the same title share ONE lookup, and each title is fetched at most once per
// session (a big imported list can't burst the free API). Fail-soft: any error or
// no-match resolves to '' (the placeholder stays). Prefers an exact title match,
// else the top result. Pure-ish: uses the injectable catalog fetcher, so tests
// drive it with a recorded sample (no live call).
// Normalize a stored/imported title into a searchable query. The TV Time zip's
// titles carry disambiguation the APIs choke on — "EMPIRE (2015)" (trailing
// year) and "LOVE IS___" (trailing underscores) both returned nothing verbatim,
// so those tiles sat blank forever (2026-08-04 comprehensive review, G3). Pure.
export function normalizeTitleQuery(title) {
  return String(title || '')
    .replace(/\(\s*(19|20)\d{2}\s*\)\s*$/, '')  // trailing "(2015)"
    .replace(/[_\s.]+$/, '')                     // trailing underscores/dots/space runs
    .replace(/\s+/g, ' ')
    .trim();
}

const _posterCache = new Map(); // `${kind}:${lowerTitle}` -> Promise<string> (settles to url|'')
export function resolvePoster(title, kind = 'show') {
  const t = normalizeTitleQuery(title);
  if (!t) return Promise.resolve('');
  const key = `${kind === 'movie' ? 'movie' : 'show'}:${t.toLowerCase()}`;
  if (!_posterCache.has(key)) {
    _posterCache.set(key, (async () => {
      // Kind-first, then the OTHER source — a title with no TVmaze artwork can
      // still have an iTunes poster (and vice versa). Both lanes stay keyless.
      const primary = kind === 'movie' ? searchMovies : searchShows;
      const secondary = kind === 'movie' ? searchShows : searchMovies;
      let results = await primary(t);
      if (!results.length || !results.some((r) => r.poster)) {
        const alt = await secondary(t);
        if (!results.length) results = alt;
        else if (alt.length && alt[0].poster && !results.some((r) => r.poster)) results = alt;
      }
      const exact = results.find((r) => normalizeTitleQuery(r.title).toLowerCase() === t.toLowerCase());
      const url = ((exact || results[0]) || {}).poster || '';
      // A settled EMPTY is not cached: the lanes can't distinguish "no match"
      // from "fetch failed" (both surface as []), and permanently caching a
      // TVmaze 429 during a fast wall scroll blanked tiles for the whole
      // session. Dropping the entry lets the NEXT scroll-into-view retry;
      // successes stay cached single-flight as before.
      if (!url) _posterCache.delete(key);
      return url;
    })());
  }
  return _posterCache.get(key);
}
// Test hook: clear the session cache between cases.
export function __resetPosterCache() { _posterCache.clear(); }
