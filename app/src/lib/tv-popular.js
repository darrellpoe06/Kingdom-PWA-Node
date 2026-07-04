// =============================================================================
// tv-popular — a curated "Popular picks" starter catalog, grouped by genre
// =============================================================================
// Darrell 2026-07-04: "Can we add the currently most watched shows for them
// already so they can just click a tab and it will sort what we have inside as a
// list already under drama etc." So TV Time opens to a FULL, browsable grid (like
// the friend group's old app) instead of an empty page.
//
// HONEST SOURCING (DR-0076): the free catalog APIs (TVmaze / iTunes) expose no
// global "most-watched" ranking, so this is a CURATED starter set — real, current,
// widely-loved shows across genres, weighted toward this friend group's taste
// (network + cable drama, crime, and Black-led shows — read from the real TV Time
// export they're migrating from), plus broad current hits. It is labeled as picks,
// not a live ratings chart. Each title resolves to its poster + seasons on demand
// via the existing catalog lookup (searchTitles/loadShow) when a card mounts, and
// tapping a card adds it through the same add-by-title flow as search. Curated
// list — refreshed over time, not a painted number.
//
// PURE data + grouping so it's node-testable and the UI stays thin.
// =============================================================================

// Genre tags use the canonical labels from tv-catalog GENRES so the picks line up
// with the "Browse by genre" chips (genreMatches folds synonyms).
export const POPULAR_SHOWS = [
  // Drama
  { title: 'This Is Us', genre: 'Drama' },
  { title: 'All American', genre: 'Drama' },
  { title: "Grey's Anatomy", genre: 'Drama' },
  { title: 'Yellowstone', genre: 'Drama' },
  { title: 'Euphoria', genre: 'Drama' },
  { title: 'The Chi', genre: 'Drama' },
  { title: 'Power Book II: Ghost', genre: 'Drama' },
  { title: 'Reasonable Doubt', genre: 'Drama' },
  // Crime
  { title: 'Chicago P.D.', genre: 'Crime' },
  { title: 'Law & Order: SVU', genre: 'Crime' },
  { title: 'Snowfall', genre: 'Crime' },
  { title: 'Queen of the South', genre: 'Crime' },
  { title: 'The Rookie', genre: 'Crime' },
  { title: 'Power', genre: 'Crime' },
  // Comedy
  { title: 'Abbott Elementary', genre: 'Comedy' },
  { title: 'black-ish', genre: 'Comedy' },
  { title: 'grown-ish', genre: 'Comedy' },
  { title: 'Insecure', genre: 'Comedy' },
  { title: 'The Neighborhood', genre: 'Comedy' },
  { title: 'Ted Lasso', genre: 'Comedy' },
  // Science fiction / Fantasy
  { title: 'House of the Dragon', genre: 'Fantasy' },
  { title: 'Stranger Things', genre: 'Science fiction' },
  { title: 'The Boys', genre: 'Science fiction' },
  { title: 'Wednesday', genre: 'Fantasy' },
  { title: 'Star Trek: Discovery', genre: 'Science fiction' },
  // Reality
  { title: 'The Voice', genre: 'Reality' },
  { title: 'Love Is Blind', genre: 'Reality' },
  { title: 'The Real Housewives of Atlanta', genre: 'Reality' },
  // Action
  { title: "Tom Clancy's Jack Ryan", genre: 'Action' },
  { title: 'Reacher', genre: 'Action' },
];

// The order genres are shown in the browse grid — the friend group's heaviest
// genres first (from the real export), then the rest.
export const POPULAR_GENRE_ORDER = [
  'Drama', 'Crime', 'Comedy', 'Science fiction', 'Fantasy', 'Reality', 'Action',
];

// Group the picks by genre, in POPULAR_GENRE_ORDER, dropping empty groups. Any
// genre not in the order list is appended alphabetically (so a new pick can't
// silently vanish). Pure. `exclude` (a Set of lowercased titles) hides shows the
// user already tracks, so the browse grid is "what you don't have yet".
export function popularByGenre(shows = POPULAR_SHOWS, order = POPULAR_GENRE_ORDER, exclude = null) {
  // Normalize the exclude entries too, so a caller need not pre-trim/lowercase.
  const skip = exclude instanceof Set
    ? new Set([...exclude].map((x) => String(x).toLowerCase().trim()))
    : new Set();
  const groups = new Map();
  for (const s of Array.isArray(shows) ? shows : []) {
    if (!s || typeof s.title !== 'string' || !s.title.trim()) continue;
    if (skip.has(s.title.toLowerCase().trim())) continue;
    const g = typeof s.genre === 'string' && s.genre.trim() ? s.genre.trim() : 'Other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({ title: s.title, genre: g });
  }
  const ordered = [];
  for (const g of order) if (groups.has(g)) { ordered.push({ genre: g, shows: groups.get(g) }); groups.delete(g); }
  for (const g of [...groups.keys()].sort()) ordered.push({ genre: g, shows: groups.get(g) });
  return ordered;
}

// How many picks total (for the section's count line). Pure.
export function popularCount(shows = POPULAR_SHOWS) {
  return (Array.isArray(shows) ? shows : []).filter((s) => s && typeof s.title === 'string' && s.title.trim()).length;
}
