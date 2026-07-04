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

beforeAll(() => {
  __setCatalogFetcher(async (url) => {
    const u = String(url);
    if (u.includes('/search/shows')) return { ok: true, json: async () => SEARCH };
    if (u.includes('/shows/')) return { ok: true, json: async () => SHOW };
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
    expect(text).toMatch(/Live group sync/);
    expect(text).toMatch(/Look up a show/);
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
  });

  it('talks and laughs together on a tracked show', async () => {
    await mount();
    setValue(container.querySelector('#tv-search'), 'game of thrones');
    await wait(450);
    await click(btnByText(/\+ Add/));
    await click(btnByText(/^Talk/));
    setValue(container.querySelector('input[id^="cm-"]'), 'That finale!!');
    await click(btnByText(/^Post$/));
    expect(container.textContent).toContain('That finale!!');
    await click(btnByText(/^Laughed$/));
    expect(btnByText(/^Laughed 1$/), 'laugh reaction counts').toBeTruthy();
  });
});
