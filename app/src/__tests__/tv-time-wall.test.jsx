// =============================================================================
// TVTime WALL — the surface Darrell actually looks at, previously untested
// (2026-08-04 comprehensive review, G4/G5). Pins the two journey breaks:
//   · tapping a poster tile OPENS its card IN PLACE — a full-width grid row
//     directly under the tapped tile, with NO screen flight (DR-0274/DR-0131:
//     the 2026-08-04 fix scrolled the card in from below the whole wall — the
//     fast movement Darrell's 2026-08-05 dizziness report named; the card now
//     comes to the finger instead of the screen flying to the card);
//   · tapping an IMPORTED tile hydrates it from the catalog, so its progress
//     stops reading a fake 100% and the full episode list arrives.
// Mounts the real component with >9 shows (the wall auto-engages) and an
// injected TVmaze fetcher. Device-local, no real network.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, beforeAll, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TVTime from '../components/TVTime.jsx';
import { __setCatalogFetcher, __resetPosterCache } from '../lib/tv-catalog.js';
import { saveTv } from '../lib/tv-time.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SEARCH = [{ score: 1, show: { id: 100, name: 'Empire', premiered: '2015-01-07', genres: ['Drama'], network: { name: 'FOX' }, image: { medium: 'https://img/e.jpg' }, summary: '<p>x</p>' } }];
const SHOW = {
  id: 100, name: 'Empire', premiered: '2015-01-07', genres: ['Drama'], network: { name: 'FOX' }, image: { medium: 'https://img/e.jpg' }, summary: '<p>x</p>',
  _embedded: { episodes: [
    { id: 1, name: 'Pilot', season: 1, number: 1 }, { id: 2, name: 'Outspoken King', season: 1, number: 2 },
    { id: 3, name: 'The Devils Are Here', season: 2, number: 1 },
  ] },
};

beforeAll(() => {
  __setCatalogFetcher(async (url) => {
    const u = String(url);
    if (u.includes('/search/shows')) return { ok: true, json: async () => (u.toLowerCase().includes('empire') ? SEARCH : []) };
    if (u.includes('/shows/100')) return { ok: true, json: async () => SHOW };
    if (u.includes('itunes')) return { ok: true, json: async () => ({ results: [] }) };
    return { ok: false, json: async () => null };
  });
});

// 10 shows as a TV Time zip import leaves them: tvt- ids, generic genre, no
// poster, "seasons" = only the already-watched episode. Wall auto-engages >9.
function seedImportedList() {
  const shows = {}; const custom = {};
  const titles = ['EMPIRE (2015)', 'LOVE IS___', 'Suits', 'Power', 'Blindspot', 'The 100', 'black-ish', 'grown-ish', 'Salvation', 'Krypton'];
  titles.forEach((title, i) => {
    const id = `tvt-t${i}`;
    shows[id] = { status: 'watching', rating: 0, comments: [], watched: { '1x1': true } };
    custom[id] = { id, kind: 'show', title, genre: 'Show', poster: '', year: '', network: '', seasons: [{ season: 1, episodes: [{ number: 1, name: 'Pilot', airdate: '' }] }] };
  });
  saveTv(null, { version: 3, shows, custom });
}

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* noop */ }
  __resetPosterCache();
  // The still-screen claims (DR-0274) are ASSERTED: no scrollIntoView flight,
  // and no scrollBy when the in-place card is already on screen (jsdom rects
  // are zeros — the card's top edge is well above the fold, so gentleReveal
  // must hold the screen still).
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollBy = vi.fn();
  seedImportedList();
});
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

const tick = () => act(async () => { await Promise.resolve(); });
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(TVTime, { email: null })); });
  await tick();
}

const wallTiles = () => [...container.querySelectorAll('button[aria-label*="watched"]')];

describe('the poster wall (auto-engaged at >9 shows)', () => {
  it('renders a tile per show, and an imported tile reads its honest pre-hydration count', async () => {
    await mount();
    const tiles = wallTiles();
    expect(tiles.length).toBeGreaterThanOrEqual(10);
    // pre-hydration: 1 of 1 — the fake-complete state G1 names
    expect(tiles.some((t) => /1 of 1 watched/.test(t.getAttribute('aria-label')))).toBe(true);
  });
  it('TAP: opens the show card IN PLACE right after the tile — no screen flight — and hydration replaces the fake 100%', async () => {
    await mount();
    const empire = wallTiles().find((t) => t.getAttribute('aria-label').startsWith('EMPIRE'));
    expect(empire).toBeTruthy();
    await act(async () => { empire.click(); });
    // the card opened (its status control renders)…
    expect(container.textContent).toContain('Episodes');
    // …IN PLACE: the card is the tile's immediate next sibling inside the same
    // grid, spanning the full row (DR-0274 — content comes to the finger)
    const card = empire.nextElementSibling;
    expect(card).toBeTruthy();
    expect(card.style.gridColumn).toBe('1 / -1');
    expect(card.textContent).toContain('Episodes');
    expect(card.parentElement).toBe(empire.parentElement);
    // …and the screen HELD STILL: no flight to a far-away card, no nudge when
    // the card's top edge is already on screen (DR-0131: "humans can get dizzy")
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(window.scrollBy).not.toHaveBeenCalled();
    // hydration lands: search + full-show fetch resolve, state persists
    await tick(); await tick(); await tick();
    const after = wallTiles().find((t) => t.getAttribute('aria-label').startsWith('EMPIRE'));
    expect(after.getAttribute('aria-label')).toMatch(/1 of 3 watched/); // was "1 of 1"
  });
  it('hydration runs ONCE per show: a re-tap after hydration fetches no second full record', async () => {
    await mount();
    const calls = [];
    __setCatalogFetcher(async (url) => {
      const u = String(url); calls.push(u);
      if (u.includes('/search/shows')) return { ok: true, json: async () => (u.toLowerCase().includes('empire') ? SEARCH : []) };
      if (u.includes('/shows/100')) return { ok: true, json: async () => SHOW };
      return { ok: true, json: async () => ({ results: [] }) };
    });
    const tile = () => wallTiles().find((t) => t.getAttribute('aria-label').startsWith('EMPIRE'));
    await act(async () => { tile().click(); }); // open → hydrates
    await tick(); await tick(); await tick();
    await act(async () => { tile().click(); }); // close
    await act(async () => { tile().click(); }); // reopen → sourceId set, no refetch
    await tick(); await tick();
    const fullFetches = calls.filter((u) => u.includes('/shows/100')).length;
    expect(fullFetches).toBe(1); // the hydration itself is once-per-show
  });
});
