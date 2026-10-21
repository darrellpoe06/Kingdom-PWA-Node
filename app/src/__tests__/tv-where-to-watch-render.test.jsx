// =============================================================================
// Where to watch + Free channels — LIVE RENDER proof (DR-1168).
// =============================================================================
// DR-0061 §3: confirm the surface by OBSERVING it, not by assuming. The pure
// transforms are tested elsewhere; this mounts the REAL components and proves a
// person can actually reach the thing:
//
//   • open a show's "Where to watch" panel and read a real answer;
//   • tap "Check TVmaze" on an un-asked title and watch the real service appear
//     AND PERSIST (the answer is saved, so it is not asked twice);
//   • see "unknown" — never "not available" — on a title with no answer;
//   • follow a free YouTube channel over a stubbed /api/youtube-feed and see its
//     episodes land, then unfollow it.
//
// Injected catalog fetcher + a stubbed window.fetch for our own edge route. No
// real network — the sandbox has none to youtube.com or api.tvmaze.com anyway.
import { describe, it, expect, afterEach, beforeEach, beforeAll, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TVTime from '../components/TVTime.jsx';
import TVChannels from '../components/TVChannels.jsx';
import { __setCatalogFetcher, __resetWatchCache } from '../lib/tv-catalog.js';
import { loadTv } from '../lib/tv-time.js';
import { loadChannels } from '../lib/youtube-follow.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// TVmaze: "Shelter Show" streams on Tubi (a FREE service); "Air Show" only ever
// aired on NBC (a broadcaster, no streamer).
const SHOWS = {
  shelter: { id: 501, name: 'Shelter Show', premiered: '2020-01-01', genres: ['Drama'], webChannel: { name: 'Tubi' }, image: null, summary: '<p>x</p>' },
  air: { id: 502, name: 'Air Show', premiered: '2019-01-01', genres: ['Reality'], network: { name: 'NBC' }, image: null, summary: '<p>y</p>' },
};
const withEpisodes = (s) => ({ ...s, _embedded: { episodes: [{ id: 1, name: 'One', season: 1, number: 1, airdate: '2020-01-01' }] } });

beforeAll(() => {
  __setCatalogFetcher(async (url) => {
    const u = String(url).toLowerCase();
    if (u.includes('/search/shows')) {
      if (u.includes('shelter')) return { ok: true, json: async () => [{ score: 1, show: SHOWS.shelter }] };
      if (u.includes('air')) return { ok: true, json: async () => [{ score: 1, show: SHOWS.air }] };
      return { ok: true, json: async () => [] };
    }
    if (u.includes('/shows/501')) return { ok: true, json: async () => withEpisodes(SHOWS.shelter) };
    if (u.includes('/shows/502')) return { ok: true, json: async () => withEpisodes(SHOWS.air) };
    if (u.includes('itunes')) return { ok: true, json: async () => ({ results: [] }) };
    return { ok: false, json: async () => null };
  });
});

const TED = 'UCAuUUnT6oDeKwE6v1NGQxug';
const FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=${TED}"/>
 <yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>
 <title>TED</title>
 <entry>
  <yt:videoId>vfbNzpd6cIw</yt:videoId>
  <title>What Makes a Good Game?</title>
  <published>2026-10-20T15:00:04+00:00</published>
  <media:group><media:thumbnail url="https://i3.ytimg.com/vi/vfbNzpd6cIw/hqdefault.jpg"/></media:group>
 </entry>
</feed>`;

let container, root;
beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } __resetWatchCache(); });
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  vi.unstubAllGlobals();
});

const settle = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function mount(Comp, props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(Comp, props)); });
  await settle();
  return container;
}
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
// A React controlled input ignores a plain `el.value = x` (its value tracker
// sees no change and onChange never fires), so the native setter is required --
// the same helper tv-time-render.test.jsx uses. Getting this wrong is why the
// first run of this file "passed" while the search results never rendered at
// all and the Add it found belonged to a Popular pick.
const type = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
};
const byTestId = (host, id) => host.querySelector(`[data-testid="${id}"]`);

// Put a title on the list the way a person does: search, then tap Add.
// SCOPED TO THE RESULTS LIST on purpose: on an empty list the Popular picks grid
// is expanded and carries its own "+ Add" buttons, and an unscoped query picked
// one of those instead -- which silently added "This Is Us" and made two
// assertions here look like product bugs when they were test bugs.
async function addTitle(host, query) {
  const input = host.querySelector('#tv-search');
  await type(input, query);
  await settle(450);                                       // the 350ms debounce
  const results = host.querySelector('[aria-live="polite"]');
  expect(results, `the search results list never rendered for "${query}"`).toBeTruthy();
  const add = [...results.querySelectorAll('button')].find((b) => /\+ Add/.test(b.textContent));
  expect(add, `no search result to add for "${query}"`).toBeTruthy();
  click(add);
  await settle(50);
}

describe('Where to watch — on the real card, for a real title', () => {
  it('a free service is named AND marked free with ads', async () => {
    const host = await mount(TVTime, { email: 'a@b.com' });
    await addTitle(host, 'shelter');

    // The panel is behind its own control, like Episodes and Talk.
    const open = byTestId(host, 'tv-watch-open');
    expect(open, 'the Where to watch control is not on the card').toBeTruthy();
    click(open);
    await settle();

    const answer = byTestId(host, 'tv-watch-answer');
    expect(answer.textContent).toMatch(/Streaming free with ads on Tubi/);
    // A real streaming answer came from a real provider field, so there is
    // nothing left to check.
    expect(byTestId(host, 'tv-watch-check')).toBe(null);
  });

  it('a broadcaster is reported as a broadcaster, and streaming reads UNKNOWN', async () => {
    const host = await mount(TVTime, { email: 'a@b.com' });
    await addTitle(host, 'air');
    click(byTestId(host, 'tv-watch-open'));
    await settle();

    const said = byTestId(host, 'tv-watch-answer').textContent;
    expect(said).toMatch(/Aired on NBC/);
    expect(said).toMatch(/unknown/i);
    // THE RULE, on the rendered surface and not only in the transform.
    expect(said.toLowerCase()).not.toContain('not available');
  });

  it('the free-service routes are on screen, labelled by what the tap does', async () => {
    const host = await mount(TVTime, { email: 'a@b.com' });
    await addTitle(host, 'shelter');
    click(byTestId(host, 'tv-watch-open'));
    await settle();

    const tubi = byTestId(host, 'tv-watch-free-tubi');
    const pluto = byTestId(host, 'tv-watch-free-pluto');
    const roku = byTestId(host, 'tv-watch-free-roku');
    expect(tubi.getAttribute('href')).toBe('https://tubitv.com/search/Shelter%20Show');
    expect(pluto.getAttribute('href')).toBe('https://pluto.tv/en/search?q=Shelter%20Show');
    // A proven search route says "Look on"; an unverified one says "Open".
    expect(tubi.textContent).toMatch(/Look on Tubi/);
    expect(roku.textContent).toMatch(/Open The Roku Channel/);
    // Every outbound link is safe to open from the app.
    for (const a of [tubi, pluto, roku]) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toMatch(/noopener/);
    }
  });

  it('NO connect-an-account control is anywhere on the surface', async () => {
    const host = await mount(TVTime, { email: 'a@b.com' });
    await addTitle(host, 'shelter');
    click(byTestId(host, 'tv-watch-open'));
    await settle();
    const text = host.textContent;
    expect(text).not.toMatch(/connect (your )?(netflix|hulu|max|disney|prime)/i);
    expect(text).not.toMatch(/sign in to netflix/i);
    expect(text).not.toMatch(/link your (netflix|hulu|streaming) account/i);
  });

  it('an UN-ASKED title offers a real check, and the answer PERSISTS', async () => {
    // A title with no webChannel key at all — exactly a pre-DR-1168 record or a
    // zip import. Written straight to the store, as an import leaves it.
    const key = 'poetech.tvtime.v1:a@b.com';
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      shows: { 'tvt-1': { status: 'watching', rating: 0, comments: [], watched: {} } },
      custom: { 'tvt-1': { id: 'tvt-1', kind: 'show', title: 'Shelter Show', genre: 'Show', poster: '', year: '', network: '', seasons: [] } },
    }));

    const host = await mount(TVTime, { email: 'a@b.com' });
    click(byTestId(host, 'tv-watch-open'));
    await settle();

    expect(byTestId(host, 'tv-watch-answer').textContent).toMatch(/unknown until we check/);
    const check = byTestId(host, 'tv-watch-check');
    expect(check, 'an un-asked title must offer the lookup').toBeTruthy();

    click(check);
    await settle(80);

    // The real service is now on screen...
    expect(byTestId(host, 'tv-watch-answer').textContent).toMatch(/Tubi/);
    // ...and SAVED, so the question is not asked again on the next open.
    const saved = loadTv('a@b.com');
    expect(saved.custom['tvt-1'].webChannel).toBe('Tubi');
    expect(byTestId(host, 'tv-watch-check')).toBe(null);
  });

  it('the coverage line counts the real list, and says what is still unknown', async () => {
    const host = await mount(TVTime, { email: 'a@b.com' });
    await addTitle(host, 'air');            // broadcaster only -> unknown streaming
    const line = byTestId(host, 'tv-watch-coverage');
    expect(line, 'the measured coverage line is missing').toBeTruthy();
    expect(line.textContent).toMatch(/0 of 1 title has a known streaming service/);
    expect(line.textContent).toMatch(/1 still unknown/);
  });
});

describe('Free channels — following a free YouTube channel over our own edge', () => {
  const stubEdge = (impl) => vi.stubGlobal('fetch', vi.fn(impl));

  it('follows a channel, shows its episodes, and persists the follow', async () => {
    // Two same-origin roads, each with its own job: the handle resolver returns
    // JSON, and the FEED comes from the Church tab's existing church-recent
    // proxy as raw Atom XML (DR-1168 collapsed a duplicate proxy onto it).
    const seen = [];
    stubEdge(async (url) => {
      const u = String(url);
      seen.push(u);
      if (u.startsWith('/api/youtube-channel-id?')) return { ok: true, json: async () => ({ channelId: TED }) };
      if (u.startsWith('/api/church-recent?channel=')) return { ok: true, text: async () => FEED_XML };
      throw new Error(`unexpected road: ${u}`);
    });

    const host = await mount(TVChannels, { email: 'a@b.com' });
    await type(byTestId(host, 'tv-channel-input'), 'https://www.youtube.com/@TED');
    click(byTestId(host, 'tv-channel-follow'));
    await settle(60);

    expect(byTestId(host, 'tv-channel-msg').textContent).toMatch(/Following TED/);
    const eps = byTestId(host, 'tv-channel-episodes');
    expect(eps.textContent).toMatch(/What Makes a Good Game\?/);
    expect(eps.querySelector('a').getAttribute('href')).toBe('https://www.youtube.com/watch?v=vfbNzpd6cIw');

    // The follow is stored per identity, device-local.
    expect(Object.keys(loadChannels('a@b.com').channels)).toEqual([TED]);
    // And it really went down BOTH of the intended roads, in order, with no
    // second feed proxy involved.
    expect(seen.some((u) => u.startsWith('/api/youtube-channel-id?'))).toBe(true);
    expect(seen.some((u) => u.startsWith('/api/church-recent?channel='))).toBe(true);
    expect(seen.some((u) => u.includes('/api/youtube-feed'))).toBe(false);

    // And it can be undone.
    const unfollow = [...host.querySelectorAll('button')].find((b) => /Unfollow/.test(b.textContent));
    click(unfollow);
    await settle();
    expect(Object.keys(loadChannels('a@b.com').channels)).toEqual([]);
  });

  it('a bad link is reported plainly and nothing is stored', async () => {
    stubEdge(async () => ({ ok: false, json: async () => ({ error: 'not-a-youtube-channel-url' }), text: async () => '' }));
    const host = await mount(TVChannels, { email: 'a@b.com' });
    await type(byTestId(host, 'tv-channel-input'), 'https://example.com/nope');
    click(byTestId(host, 'tv-channel-follow'));
    await settle(40);
    expect(byTestId(host, 'tv-channel-msg').textContent).toMatch(/does not look like a YouTube channel link/);
    expect(Object.keys(loadChannels('a@b.com').channels)).toEqual([]);
  });

  it('a feed we could NOT read says so — it never reads as "no new episodes"', async () => {
    // The follow already exists; the edge then fails on refresh.
    localStorage.setItem('poetech.tvchannels.v1:a@b.com', JSON.stringify({
      version: 1, channels: { [TED]: { id: TED, title: 'TED', addedAt: '2026-01-01T00:00:00Z' } },
    }));
    stubEdge(async () => ({ ok: false, json: async () => ({ error: 'youtube-unreachable' }), text: async () => '' }));

    const host = await mount(TVChannels, { email: 'a@b.com' });
    await settle(60);

    const unread = byTestId(host, 'tv-channel-unread');
    expect(unread, 'an unreadable feed must be named on the surface').toBeTruthy();
    expect(unread.textContent).toMatch(/could not be read/);
    expect(unread.textContent).toMatch(/not the same as having no new episodes/);
    // The follow survives a failed read.
    expect(Object.keys(loadChannels('a@b.com').channels)).toEqual([TED]);
  });

  it('an empty follow list invites, and fetches nothing', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({}), text: async () => '' }));
    stubEdge(f);
    const host = await mount(TVChannels, { email: 'a@b.com' });
    await settle(30);
    expect(host.textContent).toMatch(/Nothing followed yet/);
    expect(f).not.toHaveBeenCalled();
  });
});
