// DR-1639: The Word tab opens on Bishop Gwin's latest message, in big.
// Darrell 2026-11-24: "The Word tab needs to be updated... it should be
// inviting... BG's latest in big like the Home tab does."
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wordLatest, latestDate } from '../lib/word-latest.js';
import WordLatestMessage from '../components/WordLatestMessage.jsx';

const CHANNEL = 'UC' + 'a'.repeat(22);
const FEED = [
  { videoId: 'guest00001a', title: '11-22-2026 Elder Brown Sunday Service', published: '2026-11-22T17:00:00+00:00' },
  { videoId: 'gwin000001b', title: '11-18 -2026 Bishop Lloyd E. Gwin Wednesday Bible Study', published: '2026-11-19T01:00:00+00:00' },
  { videoId: 'gwin000002c', title: '11-15-2026 Bishop Lloyd E. Gwin Sunday', published: '2026-11-15T17:00:00+00:00' },
];

describe('which message The Word tab leads with', () => {
  it("is Bishop Gwin's newest, even when a guest preached more recently", () => {
    expect(wordLatest(FEED)).toEqual({ video: FEED[1], his: true });
  });
  it("falls back to the church's newest, and never claims it is his", () => {
    const guests = [FEED[0]];
    expect(wordLatest(guests)).toEqual({ video: FEED[0], his: false });
  });
  it('has nothing to lead with when the feed is empty or malformed', () => {
    expect(wordLatest([])).toBeNull();
    expect(wordLatest(null)).toBeNull();
    expect(wordLatest([{ videoId: '', title: 'Bishop Gwin' }])).toBeNull();
  });
  it('dates the message in words, and says nothing for an unreadable date', () => {
    expect(latestDate('2026-11-19T01:00:00+00:00')).toMatch(/2026/);
    expect(latestDate('not a date')).toBe('');
  });
});

describe('the hero on screen', () => {
  let host;
  let root;
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = (feed) => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root.render(createElement(WordLatestMessage, { feed, channelId: CHANNEL })); });
  };

  it("plays his latest message at full width, names it, and points to the library", () => {
    mount(FEED);
    const hero = host.querySelector('[data-testid="word-latest"]');
    expect(hero).toBeTruthy();
    expect(hero.textContent).toMatch(/Bishop Gwin’s latest message/);
    expect(host.querySelector('[data-testid="word-latest-title"]').textContent).toBe(FEED[1].title);
    const frame = hero.querySelector('iframe');
    expect(frame.getAttribute('src')).toContain('/embed/gwin000001b');
    expect(frame.parentElement.className).toMatch(/\bw-full\b/);
    expect(hero.textContent).toMatch(/library below/);
  });

  it('renders nothing until the feed answers, so the tab is never a dead frame', () => {
    mount([]);
    expect(host.querySelector('[data-testid="word-latest"]')).toBeNull();
  });
});

describe('The Word tab carries the hero first, wider than its reading column', () => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'Pulpit.jsx'), 'utf8');
  it('mounts the hero on the feed the tab already reads, before the epigraph and the library', () => {
    const hero = src.indexOf('<WordLatestMessage feed={channelFresh}');
    expect(hero).toBeGreaterThan(0);
    expect(hero).toBeLessThan(src.indexOf('Nehemiah 8 epigraph'));
    expect(hero).toBeLessThan(src.indexOf('<LibraryPanel'));
    expect(src).toContain('<div className="max-w-4xl">\n      <SectionTitle eyebrow="Church · The Word — Migdal">');
  });
});
