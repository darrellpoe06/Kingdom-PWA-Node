// =============================================================================
// tv-time — PoeTech TV Time: track what you watch, talk about it, laugh together
// (Darrell 2026-07-04). His wife's friend group needs a home now that the "TV
// Time" app (com.tozelabs.tvshowtime) shuts down July 15, 2026 — and they asked
// for OURS. This is the acquisition surface: they install the PoeTech App (a PWA,
// iOS + Android + desktop, no store gate) to keep tracking their shows together.
//
// THE POETECH DIFFERENCE (mission): it is fun AND thoughtful. You track and joke,
// and you can also watch it THROUGH THE WAY — a gentle discernment prompt drawn
// from the Test (Philippians 4:8), never preachy. And because it is PoeTech, the
// data serves the family/circle — never an ad model that "was no longer
// sustainable" and disappears on you (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
//
// SOVEREIGN + PRIVATE + FAIL-SOFT: state is DEVICE-LOCAL (localStorage), keyed to
// the signed-in identity, never sent anywhere (same posture as study-space /
// scripture-highlights). A throwing/absent localStorage degrades to an in-memory
// empty state and never throws into the render. PURE transforms; the live
// cross-device circle feed is a documented follow-up (a DB table + RLS, Tier B).
// =============================================================================

const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.tvtime.v1';

// Where a show sits for you. The sections the friend group already thinks in
// (their app had "Watch Next" and "Haven't watched for a while").
export const STATUSES = [
  { key: 'watching', label: 'Watching', hint: 'in it right now' },
  { key: 'want', label: 'Want to watch', hint: 'on the list' },
  { key: 'watched', label: 'Watched', hint: 'done — let’s talk' },
  { key: 'stale', label: 'Haven’t watched in a while', hint: 'pick it back up?' },
];
const STATUS_KEYS = new Set(STATUSES.map((s) => s.key));
export const DEFAULT_STATUS = 'want';

// Reactions — "laugh together" is the whole point, so a laugh leads. Word-keyed
// (the surface renders a labeled pill; no raw device emoji — consistency-guard).
export const REACTIONS = [
  { key: 'laugh', label: 'Laughed' },
  { key: 'love', label: 'Loved' },
  { key: 'wow', label: 'Wow' },
  { key: 'sad', label: 'In my feelings' },
  { key: 'real', label: 'So real' },
  { key: 'side-eye', label: 'Side-eye' },
];
const REACTION_KEYS = new Set(REACTIONS.map((r) => r.key));

// Watch it through The Way — gentle, relational discernment (the Test, Phil 4:8),
// mixed with plain fun. Deterministically chosen per show so a card is stable.
export const DISCERNMENT_PROMPTS = [
  'What did this one stir in you — and is that worth feeding?',
  'Anything TRUE or LOVELY in it worth keeping? Anything you’d put down?',
  'Would you watch this with your kids in the room? Why, or why not?',
  'What’s the story really teaching — and do you agree with it?',
  'Made you laugh — good. What made you think?',
  'Where did you see grace? Where did you see the opposite?',
  'If a younger sister asked “should I watch this?”, what would you say?',
];

// A small, aspirational starter catalog (SEED-DATA-AS-ASPIRATION): shows the
// circle would recognize by genre, no copyrighted art — titles are the reader's
// own to add. Kept generic + varied so the surface looks alive on first open.
export const SEED_SHOWS = [
  { id: 'reality-housewives', title: 'The Real Housewives', genre: 'Reality', network: 'Bravo' },
  { id: 'drama-crown', title: 'A Royal Drama', genre: 'Drama', network: 'Streaming' },
  { id: 'comedy-office', title: 'Workplace Comedy', genre: 'Comedy', network: 'Sitcom' },
  { id: 'fantasy-realm', title: 'The Fantasy Realm', genre: 'Fantasy', network: 'Streaming' },
  { id: 'cooking-competition', title: 'Kitchen Showdown', genre: 'Competition', network: 'Food' },
  { id: 'faith-testimony', title: 'Testimony Stories', genre: 'Faith', network: 'Faith & Family' },
];

// A seed circle so the surface shows a thriving conversation on first open (the
// friends' voices are examples until live sync lands; clearly the aspiration).
export const SEED_CIRCLE = ['Tiffany', 'Sister K', 'Lady D', 'You'];

export function styleForStatus(key) {
  return STATUSES.find((s) => s.key === key) || null;
}

// --- Per-identity device-local persistence (the only I/O; fails soft) --------

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

export function tvKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

export function emptyTv() {
  return { version: STORE_VERSION, shows: {}, custom: {} };
}

// Stamp the store's change time (ISO) — the cross-device sync uses it for
// newest-wins. Pure; caller passes the clock (safeNow) so this layer stays pure.
// updatedAt is CONDITIONAL in the store shape (only present once stamped), so it
// never perturbs the equality of an untouched state.
export function touchTv(state, nowIso) {
  const base = normalize(state);
  const at = typeof nowIso === 'string' && nowIso ? nowIso : base.updatedAt;
  return at ? { ...base, updatedAt: at } : base;
}

// The store's change time, or '' if never stamped.
export function tvUpdatedAt(state) {
  const at = normalize(state).updatedAt;
  return typeof at === 'string' ? at : '';
}

// Slug an id from a title so a custom show has a stable key.
function slugify(title) {
  return String(title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

// Normalize any parsed blob into a clean state. Unknown statuses/reactions and
// malformed entries are dropped so a corrupt/hand-edited store can't inject junk.
export function normalize(parsed) {
  const shows = {};
  const src = parsed && typeof parsed.shows === 'object' && parsed.shows ? parsed.shows : {};
  for (const [id, raw] of Object.entries(src)) {
    if (typeof id !== 'string' || !id.trim() || !raw || typeof raw !== 'object') continue;
    const status = STATUS_KEYS.has(raw.status) ? raw.status : DEFAULT_STATUS;
    const rating = Number.isInteger(raw.rating) && raw.rating >= 0 && raw.rating <= 5 ? raw.rating : 0;
    const comments = Array.isArray(raw.comments) ? raw.comments
      .filter((c) => c && typeof c.id === 'string' && typeof c.text === 'string' && c.text.trim())
      .map((c) => ({
        id: c.id,
        author: typeof c.author === 'string' && c.author.trim() ? c.author : 'You',
        text: c.text,
        at: Number.isFinite(c.at) ? c.at : 0,
        reactions: normalizeReactions(c.reactions),
      })) : [];
    // Which episodes you've checked off: { "1x1": true, "1x2": true, ... }.
    const watched = {};
    const wsrc = raw.watched && typeof raw.watched === 'object' ? raw.watched : {};
    for (const [k, v] of Object.entries(wsrc)) if (v === true && /^\d+x\d+$/.test(k)) watched[k] = true;
    shows[id] = { status, rating, comments, watched };
  }
  const custom = {};
  const csrc = parsed && typeof parsed.custom === 'object' && parsed.custom ? parsed.custom : {};
  for (const [id, raw] of Object.entries(csrc)) {
    if (typeof id !== 'string' || !id.trim() || !raw || typeof raw !== 'object') continue;
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
    if (!title) continue;
    custom[id] = {
      id,
      // A movie is a single-watch item (no seasons); a show has seasons to check off.
      kind: raw.kind === 'movie' ? 'movie' : 'show',
      title,
      genre: typeof raw.genre === 'string' && raw.genre.trim() ? raw.genre.trim() : 'Show',
      poster: typeof raw.poster === 'string' ? raw.poster : '',
      year: typeof raw.year === 'string' ? raw.year : '',
      network: typeof raw.network === 'string' ? raw.network : '',
      seasons: raw.kind === 'movie' ? [] : normalizeSeasons(raw.seasons),
    };
  }
  const out = { version: STORE_VERSION, shows, custom };
  // Conditional: carried only when a blob was actually stamped (cross-device
  // sync), so an untouched state keeps its original shape/equality.
  if (typeof parsed?.updatedAt === 'string' && parsed.updatedAt) out.updatedAt = parsed.updatedAt;
  return out;
}

// The cached season/episode structure (from tv-catalog). Kept clean so a corrupt
// blob can't inject junk episodes.
function normalizeSeasons(seasons) {
  return (Array.isArray(seasons) ? seasons : [])
    .filter((s) => s && Number.isFinite(s.season) && Array.isArray(s.episodes))
    .map((s) => ({
      season: s.season,
      episodes: s.episodes
        .filter((e) => e && Number.isFinite(e.number))
        .map((e) => ({ number: e.number, name: typeof e.name === 'string' ? e.name : `Episode ${e.number}`, airdate: typeof e.airdate === 'string' ? e.airdate : '' })),
    }));
}

// The episode checkmark key.
export function epKey(season, number) { return `${season}x${number}`; }

function normalizeReactions(r) {
  const out = {};
  const src = r && typeof r === 'object' ? r : {};
  for (const [k, who] of Object.entries(src)) {
    if (REACTION_KEYS.has(k) && Array.isArray(who)) {
      const people = [...new Set(who.filter((x) => typeof x === 'string' && x.trim()))];
      if (people.length) out[k] = people;
    }
  }
  return out;
}

export function loadTv(email) {
  const ls = safeStorage();
  if (!ls) return emptyTv();
  try {
    const raw = ls.getItem(tvKey(email));
    if (!raw) return emptyTv();
    return normalize(JSON.parse(raw));
  } catch { return emptyTv(); }
}

export function saveTv(email, state) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(tvKey(email), JSON.stringify(normalize(state)));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

// --- Your data is yours: export + restore (DATA-AS-EMPOWERMENT) --------------
// The whole reason the friend group needs a new home is their old app is dying
// and taking their lists with it. Here your list is exportable at full fidelity
// (watched episodes, ratings, comments) and restorable — no lock-in, ever.

export const EXPORT_TAG = 'poetech-tv-time';

// A clean, JSON-serializable backup of the whole list. Pure (no clock — the
// caller stamps exportedAt if it wants one).
export function exportTv(state) {
  const base = normalize(state);
  return { app: EXPORT_TAG, version: STORE_VERSION, shows: base.shows, custom: base.custom };
}

// Restore from a backup (a parsed export object OR a raw state). Merges into the
// current list, restore-wins per id, so it's safe to import onto a non-empty
// list. Malformed input is dropped by normalize — a bad file can't corrupt you.
export function importTvJson(state, incoming) {
  const base = normalize(state);
  const inc = normalize(incoming && typeof incoming === 'object' ? incoming : {});
  return {
    version: STORE_VERSION,
    shows: { ...base.shows, ...inc.shows },
    custom: { ...base.custom, ...inc.custom },
  };
}

// --- Pure transforms (immutable) ---------------------------------------------

function entry(state, showId) {
  const base = normalize(state);
  return base.shows[showId] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
}

export function getStatus(state, showId) {
  return entry(state, showId).status;
}

export function setStatus(state, showId, status) {
  const base = normalize(state);
  if (!showId || !STATUS_KEYS.has(status)) return base;
  const cur = base.shows[showId] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, status } }, custom: base.custom };
}

// Clear a show from your list entirely (untrack).
export function untrack(state, showId) {
  const base = normalize(state);
  if (!base.shows[showId]) return base;
  const shows = { ...base.shows };
  delete shows[showId];
  return { version: STORE_VERSION, shows, custom: base.custom };
}

export function rateShow(state, showId, rating) {
  const base = normalize(state);
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  if (!showId) return base;
  const cur = base.shows[showId] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, rating: r } }, custom: base.custom };
}

// Add a custom show the catalog doesn't have (the reader's own), tracked as
// "want to watch". Returns a NEW state; the id is slugged from the title.
export function addCustomShow(state, { title, genre } = {}) {
  const base = normalize(state);
  const id = slugify(title);
  if (!id) return base;
  const custom = { ...base.custom, [id]: { id, title: String(title).trim(), genre: String(genre || 'Show').trim() || 'Show' } };
  const cur = base.shows[id] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  return { version: STORE_VERSION, shows: { ...base.shows, [id]: cur }, custom };
}

// The custom shows as a catalog array (merge with SEED_SHOWS for the surface).
export function customCatalog(state) {
  return Object.values(normalize(state).custom);
}

// --- Episodes: look it up, bring in the seasons, check off what you watched ---
// (Darrell 2026-07-04: "it'll bring in all the seasons... check off each show
// you watched... so you know how many seasons of each show it is.")

// Add a show from the lookup (tv-catalog) — caches its poster + every season, and
// starts tracking it. Re-adding refreshes the cached seasons without losing your
// checkmarks. Returns a NEW state.
export function addShowFromCatalog(state, show, status = 'watching') {
  const base = normalize(state);
  if (!show || show.id == null || !show.title) return base;
  const id = String(show.id);
  const meta = {
    id,
    kind: 'show',
    title: String(show.title),
    genre: show.genre || 'Show',
    poster: typeof show.poster === 'string' ? show.poster : '',
    year: typeof show.year === 'string' ? show.year : '',
    network: typeof show.network === 'string' ? show.network : '',
    seasons: normalizeSeasons(show.seasons),
  };
  const custom = { ...base.custom, [id]: meta };
  const cur = base.shows[id] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  const st = STATUS_KEYS.has(status) ? status : cur.status;
  return { version: STORE_VERSION, shows: { ...base.shows, [id]: { ...cur, status: st } }, custom };
}

// --- Movies: one watch, then rate + talk (Darrell 2026-07-04: "movies too?") ---
// A movie has no seasons; being "watched" is simply its status. Add it (default
// "want to watch"), then a single tap flips Watched. Re-adding refreshes the meta.

export function addMovieFromCatalog(state, movie, status = 'want') {
  const base = normalize(state);
  if (!movie || movie.id == null || !movie.title) return base;
  const id = String(movie.id);
  const meta = {
    id,
    kind: 'movie',
    title: String(movie.title),
    genre: movie.genre || 'Movie',
    poster: typeof movie.poster === 'string' ? movie.poster : '',
    year: typeof movie.year === 'string' ? movie.year : '',
    network: typeof movie.network === 'string' ? movie.network : '',
    seasons: [],
  };
  const custom = { ...base.custom, [id]: meta };
  const cur = base.shows[id] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  const st = STATUS_KEYS.has(status) ? status : cur.status;
  return { version: STORE_VERSION, shows: { ...base.shows, [id]: { ...cur, status: st } }, custom };
}

// The kind of a tracked item ('movie' | 'show'); defaults to 'show'.
export function itemKind(state, id) {
  const meta = normalize(state).custom[id];
  return meta && meta.kind === 'movie' ? 'movie' : 'show';
}

// A movie is "watched" when its status is 'watched' (its single checkbox).
export function isMovieWatched(state, id) {
  return getStatus(state, id) === 'watched';
}

// Flip a movie between Watched and Want. Only acts on a tracked movie.
export function toggleMovieWatched(state, id) {
  const base = normalize(state);
  const cur = base.shows[id];
  const meta = base.custom[id];
  if (!cur || !meta || meta.kind !== 'movie') return base;
  const status = cur.status === 'watched' ? 'want' : 'watched';
  return { version: STORE_VERSION, shows: { ...base.shows, [id]: { ...cur, status } }, custom: base.custom };
}

export function isEpisodeWatched(state, showId, season, number) {
  const e = normalize(state).shows[showId];
  return !!(e && e.watched && e.watched[epKey(season, number)]);
}

// Toggle one episode's checkmark. Returns a NEW state.
export function toggleEpisode(state, showId, season, number) {
  const base = normalize(state);
  const cur = base.shows[showId];
  if (!cur || !Number.isFinite(season) || !Number.isFinite(number)) return base;
  const key = epKey(season, number);
  const watched = { ...cur.watched };
  if (watched[key]) delete watched[key]; else watched[key] = true;
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, watched } }, custom: base.custom };
}

// Mark/clear a whole season at once ("finished season 1"). Returns a NEW state.
export function setSeasonWatched(state, showId, season, on) {
  const base = normalize(state);
  const cur = base.shows[showId];
  const meta = base.custom[showId];
  const s = meta && meta.seasons.find((x) => x.season === season);
  if (!cur || !s) return base;
  const watched = { ...cur.watched };
  for (const e of s.episodes) { const k = epKey(season, e.number); if (on) watched[k] = true; else delete watched[k]; }
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, watched } }, custom: base.custom };
}

// Progress across a whole show: { watched, total } (total from the cached seasons).
export function showProgress(state, showId) {
  const base = normalize(state);
  const meta = base.custom[showId];
  const cur = base.shows[showId];
  // A movie is a single watch: 1/1 when its status is 'watched', else 0/1.
  if (meta && meta.kind === 'movie') return { watched: cur && cur.status === 'watched' ? 1 : 0, total: 1 };
  const total = meta ? meta.seasons.reduce((n, s) => n + s.episodes.length, 0) : 0;
  const watched = cur ? Object.keys(cur.watched).length : 0;
  return { watched: total ? Math.min(watched, total) : watched, total };
}

// Progress within one season: { watched, total }.
export function seasonProgress(state, showId, season) {
  const base = normalize(state);
  const meta = base.custom[showId];
  const cur = base.shows[showId];
  const s = meta && meta.seasons.find((x) => x.season === season);
  if (!s) return { watched: 0, total: 0 };
  let w = 0;
  for (const e of s.episodes) if (cur && cur.watched[epKey(season, e.number)]) w += 1;
  return { watched: w, total: s.episodes.length };
}

export function getComments(state, showId) {
  return entry(state, showId).comments.slice();
}

// Add a comment (the discussion). `now` + `seq` make a stable id without a clock
// dependency in the pure layer (the caller passes Date.now()).
export function addComment(state, showId, { author, text } = {}, now = 0, seq = 0) {
  const base = normalize(state);
  const body = String(text || '').trim();
  if (!showId || !body) return base;
  const cur = base.shows[showId] || { status: DEFAULT_STATUS, rating: 0, comments: [], watched: {} };
  const comment = {
    id: `c${now}-${seq}`,
    author: String(author || 'You').trim() || 'You',
    text: body,
    at: Number(now) || 0,
    reactions: {},
  };
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, comments: [...cur.comments, comment] } }, custom: base.custom };
}

// Toggle a reaction on a comment for `who` (laugh together). Adding removes on a
// second tap by the same person, so a reaction is a set of people per key.
export function toggleReaction(state, showId, commentId, reactionKey, who = 'You') {
  const base = normalize(state);
  if (!REACTION_KEYS.has(reactionKey)) return base;
  const cur = base.shows[showId];
  if (!cur) return base;
  const person = String(who || 'You').trim() || 'You';
  const comments = cur.comments.map((c) => {
    if (c.id !== commentId) return c;
    const reactions = { ...c.reactions };
    const people = new Set(reactions[reactionKey] || []);
    if (people.has(person)) people.delete(person); else people.add(person);
    if (people.size) reactions[reactionKey] = [...people]; else delete reactions[reactionKey];
    return { ...c, reactions };
  });
  return { version: STORE_VERSION, shows: { ...base.shows, [showId]: { ...cur, comments } }, custom: base.custom };
}

// Group the tracked shows into the four sections, resolving each id against the
// catalog (seed + any custom shows the caller merges in). Untracked catalog
// shows are offered under `untracked` so they can be added.
export function bucketShows(state, catalog) {
  const base = normalize(state);
  const byId = new Map((Array.isArray(catalog) ? catalog : []).map((s) => [s.id, s]));
  const buckets = { watching: [], want: [], watched: [], stale: [], untracked: [] };
  for (const s of (Array.isArray(catalog) ? catalog : [])) {
    const e = base.shows[s.id];
    if (e) buckets[e.status].push({ ...s, status: e.status, rating: e.rating, commentCount: e.comments.length });
    else buckets.untracked.push({ ...s });
  }
  // A tracked show that isn't in the catalog (custom-added but catalog missing it)
  // still shows up under its status.
  for (const [id, e] of Object.entries(base.shows)) {
    if (!byId.has(id)) buckets[e.status].push({ id, title: id, genre: 'Custom', status: e.status, rating: e.rating, commentCount: e.comments.length });
  }
  return buckets;
}

// --- What's getting watched: a real-data activity ranking -------------------
// (Darrell 2026-07-04: "update the shows list dynamically based on what people
// are watching".) Pure + deterministic + explainable — the concern-signals.js
// precedent. Ranks the TRACKED items by an activity signal built from REAL local
// state: how it's being watched (status), momentum (episodes checked), rating,
// and discussion (comments). Circle-wide once live sync lands; today it reflects
// this device's list — no fabricated other-people activity (DR-0076).

const WATCH_WEIGHT = { watching: 40, watched: 20, stale: 10, want: 0 };

function watchReason(e, eps, comments, meta) {
  const isMovie = meta && meta.kind === 'movie';
  if (e.status === 'watching' && eps > 0) return `Watching · ${eps} episode${eps === 1 ? '' : 's'} in`;
  if (e.status === 'watching') return 'Watching now';
  if (comments > 0) return `${comments} comment${comments === 1 ? '' : 's'} · people are talking`;
  if (e.status === 'watched') return isMovie ? 'Watched' : 'Finished it';
  if (e.rating) return `Rated ${e.rating} of 5`;
  if (e.status === 'stale') return 'Picked up before';
  return 'On the list';
}

// Ranked tracked items, most active first. `catalog` supplies title/poster/kind
// (merge customCatalog + any seed). Deterministic: score desc, then title asc.
export function watchSignal(state, catalog) {
  const base = normalize(state);
  const byId = new Map((Array.isArray(catalog) ? catalog : []).map((s) => [s.id, s]));
  const rows = [];
  for (const [id, e] of Object.entries(base.shows)) {
    const meta = byId.get(id) || base.custom[id] || { id, title: id, kind: 'show' };
    const eps = Object.keys(e.watched).length;
    const comments = e.comments.length;
    const score = (WATCH_WEIGHT[e.status] || 0) + Math.min(eps, 100) + (e.rating || 0) * 2 + comments * 4;
    rows.push({
      id,
      title: meta.title || id,
      poster: typeof meta.poster === 'string' ? meta.poster : '',
      kind: meta.kind === 'movie' ? 'movie' : 'show',
      year: typeof meta.year === 'string' ? meta.year : '',
      status: e.status,
      score,
      reason: watchReason(e, eps, comments, meta),
    });
  }
  return rows.sort((a, b) => (b.score - a.score) || a.title.localeCompare(b.title));
}

// The "trending" slice: the most active items with real activity (score > 0),
// capped. What's actually getting watched — never a painted list.
export function trendingWatches(state, catalog, limit = 5) {
  return watchSignal(state, catalog).filter((r) => r.score > 0).slice(0, Math.max(0, limit));
}

// A stable discernment prompt for a show — deterministic from the id so the card
// doesn't flicker between renders. Pure (no randomness).
export function discernmentPromptFor(showId) {
  const s = String(showId || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return DISCERNMENT_PROMPTS[h % DISCERNMENT_PROMPTS.length];
}

// Count of reactions on a comment (for the surface's little tally).
export function reactionCount(comment, key) {
  return comment && comment.reactions && Array.isArray(comment.reactions[key]) ? comment.reactions[key].length : 0;
}
