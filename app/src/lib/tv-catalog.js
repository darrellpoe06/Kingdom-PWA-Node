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
const BASE = 'https://api.tvmaze.com';

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
