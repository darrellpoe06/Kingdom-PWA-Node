// =============================================================================
// TVTime — live render proof PoeTech TV Time works (Darrell 2026-07-04). Mounts
// the real component with an injected TVmaze fetcher, searches a show, adds it,
// checks off an episode (progress updates), and talks/laughs. Device-local, no
// real network.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TVTime from '../components/TVTime.jsx';
import { __setCatalogFetcher } from '../lib/tv-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SEARCH = [{ score: 1, show: { id: 82, name: 'Game of Thrones', premiered: '2011-04-17', genres: ['Drama'], network: { name: 'HBO' }, image: null, summary: '<p>x</p>' } }];
const SHOW = {
  id: 82, name: 'Game of Thrones', premiered: '2011-04-17', genres: ['Drama'], network: { name: 'HBO' }, image: null, summary: '<p>x</p>',
  _embedded: { episodes: [{ id: 1, name: 'Winter Is Coming', season: 1, number: 1, airdate: '2011-04-17' }, { id: 2, name: 'The Kingsroad', season: 1, number: 2 }] },
};
const MOVIES = { resultCount: 1, results: [{ trackId: 999, trackName: 'Black Panther', artworkUrl100: 'http://is/100x100bb.jpg', releaseDate: '2018-02-16T08:00:00Z', primaryGenreName: 'Action' }] };

beforeAll(() => {
  __setCatalogFetcher(async (url) => {
    const u = String(url);
    // Query-aware so each test gets only its own hit: "game" → the show, "black"/
    // "panther" → the movie. (searchTitles fetches both lanes for every query.)
    if (u.includes('/search/shows')) return { ok: true, json: async () => (u.includes('game') || u.includes('thrones') ? SEARCH : []) };
    if (u.includes('/shows/')) return { ok: true, json: async () => SHOW };
    if (u.includes('itunes')) return { ok: true, json: async () => (u.includes('black') || u.includes('panther') ? MOVIES : { results: [] }) };
    return { ok: false, json: async () => null };
  });
});

let container, root;
beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

const tick = () => act(async () => { await Promise.resolve(); });
const wait = (ms) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(TVTime, { email: 'fan@example.com', ...props })); });
  await tick();
}
const setValue = (el, val) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val); el.dispatchEvent(new window.Event('input', { bubbles: true }));
};
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await tick(); };
const btnByText = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));

describe('PoeTech TV Time', () => {
  it('opens with the title and the honest circle note', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/PoeTech TV Time/);
    expect(text).toMatch(/live group sync is coming next/);
    expect(text).toMatch(/Look up a show/);
  });

  it('opens to a populated "Popular picks" grid so an empty list is never blank', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/Popular picks/);
    expect(text).toContain('This Is Us');       // a curated pick renders as a card
    expect(text).toContain('Abbott Elementary'); // across genres
  });

  it('a genre chip surfaces the popular picks in that genre — never a dead end', async () => {
    await mount();
    const chip = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Comedy');
    expect(chip, 'the Comedy genre chip shows even with an empty list').toBeTruthy();
    await click(chip);
    const text = container.textContent || '';
    expect(text).toMatch(/Popular Comedy picks/);
    expect(text).toContain('Abbott Elementary'); // a curated Comedy pick shows below
  });

  it('searches a show, adds it, brings in the seasons, and checks off an episode', async () => {
    await mount();
    setValue(container.querySelector('#tv-search'), 'game of thrones');
    await wait(450); // debounce (350ms) + the injected fetch resolves
    // the live result populated (the thing that didn't work before)
    expect(container.textContent).toContain('Game of Thrones');
    await click(btnByText(/\+ Add/));
    // tracked, with episode progress from the brought-in seasons
    expect(container.textContent, 'progress shows after add').toMatch(/0 \/ 2 episodes watched/);
    // open the episode list and check one off
    await click(btnByText(/^Episodes$/));
    await click(btnByText(/Winter Is Coming/));
    expect(container.textContent, 'progress advances after a check').toMatch(/1 \/ 2 episodes watched/);
    // the curated spinoff connection surfaces (GoT -> House of the Dragon)
    expect(container.textContent, 'same-universe link shows').toMatch(/Same universe/);
    expect(btnByText(/\+ House of the Dragon/), 'spinoff is offered to add').toBeTruthy();
  });

  it('searches a movie, adds it as a single-watch item, and one tap marks it watched', async () => {
    await mount();
    setValue(container.querySelector('#tv-search'), 'black panther');
    await wait(450);
    expect(container.textContent).toContain('Black Panther');   // the movie populated
    // add the movie (it's the only result for this query — shows side returns none)
    await click(btnByText(/\+ Add/));
    // a movie shows a single "Mark watched" control, not an episode list
    const markBtn = btnByText(/Mark watched/);
    expect(markBtn, 'movie shows a Mark watched control').toBeTruthy();
    expect(btnByText(/^Episodes$/), 'no Episodes tab for a movie').toBeFalsy();
    await click(markBtn);
    expect(btnByText(/^Watched$/), 'one tap marks the movie watched').toBeTruthy();
  });

  it('surfaces a dynamic "what\'s getting watched" strip from real activity', async () => {
    await mount();
    // nothing tracked → no strip
    expect(container.textContent).not.toMatch(/getting watched/);
    setValue(container.querySelector('#tv-search'), 'game of thrones');
    await wait(450);
    await click(btnByText(/\+ Add/));
    // adding a watching show makes it show up in the ranking with an honest reason
    expect(container.textContent).toMatch(/getting watched/);
    expect(container.textContent).toMatch(/Watching now|Watching ·/);
  });

  it('talks and laughs together on a tracked show', async () => {
    await mount();
    setValue(container.querySelector('#tv-search'), 'game of thrones');
    await wait(450);
    await click(btnByText(/\+ Add/));
    await click(btnByText(/^Talk($| \()/)); // exact "Talk"/"Talk (N)" — not the "Talk show" genre chip
    setValue(container.querySelector('input[id^="cm-"]'), 'That finale!!');
    await click(btnByText(/^Post$/));
    expect(container.textContent).toContain('That finale!!');
    await click(btnByText(/^Laughed$/));
    expect(btnByText(/^Laughed 1$/), 'laugh reaction counts').toBeTruthy();
  });
});
