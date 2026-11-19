// =============================================================================
// A new recording on the church channel rings the bell (2026-11-18)
// =============================================================================
// Darrell: "when BG has a new sermon from YouTube... send out a notification
// to users to watch it... So they know." The Arrivals bell listed new lessons
// and nothing from the channel. These pin the new kind against the feed's own
// shape (parseYoutubeFeed over real Atom), the watcher's read of the
// same-origin relay, and the rule that a tap, not opening Church, marks it seen.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseYoutubeFeed } from '../lib/youtube-feed.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import {
  serviceArrivals,
  combineArrivals,
  arrivalLanding,
  arrivalNotification,
  unseenArrivals,
  markSeen,
  arrivalCount,
  SCREEN_KINDS,
  ARRIVAL_KINDS,
  SERVICE_MAX,
  EMPTY_SEEN,
  OPENED_KEY,
  CATALOG_SINCE_PREFIX,
  noteArrivalOpened,
  peekArrivalOpened,
  markIdSeen,
} from '../lib/arrivals.js';
import { fetchChannelServices, startArrivalsWatch, SERVICES_REFRESH_MS } from '../lib/arrivals-watch.js';
import { ARRIVALS_EVENT } from '../lib/arrivals.js';

const entry = (id, title, published) =>
  `<entry><id>yt:video:${id}</id><yt:videoId>${id}</yt:videoId><title>${title}</title><published>${published}</published></entry>`;
const FEED = `<feed>${[
  entry('AAAAAAAAAAA', 'Sunday Worship &amp; The Word', '2026-11-15T17:00:00+00:00'),
  entry('BBBBBBBBBBB', 'RAP Bible Study', '2026-11-11T19:00:00+00:00'),
  entry('CCCCCCCCCCC', 'Sunday Worship', '2026-11-08T17:00:00+00:00'),
  entry('DDDDDDDDDDD', 'An older service', '2026-10-04T17:00:00+00:00'),
].join('')}</feed>`;

describe('a new recording on the church channel is an arrival', () => {
  it('PROVEN TO CATCH: each feed video on or after the day becomes one arrival, newest first, with the video’s own title', () => {
    const items = serviceArrivals(parseYoutubeFeed(FEED, 15), { since: '2026-11-08' });
    expect(items.map((i) => i.id)).toEqual(['service-new:AAAAAAAAAAA', 'service-new:BBBBBBBBBBB', 'service-new:CCCCCCCCCCC']);
    expect(items[0]).toMatchObject({ kind: 'service-new', screen: 'church', videoId: 'AAAAAAAAAAA', at: '2026-11-15T17:00:00.000Z' });
    expect(items[0].title).toBe('New service to watch: Sunday Worship & The Word');
    // It names no preacher: the feed lists every upload and does not say who spoke.
    expect(items.map((i) => i.title + i.detail).join(' ')).not.toMatch(/Bishop|Gwin|sermon/i);
  });

  it('a video with no readable publish time is left out, never dated today', () => {
    const items = serviceArrivals([
      { videoId: 'EEEEEEEEEEE', title: 'No date', published: '' },
      { videoId: 'FFFFFFFFFFF', title: 'Bad date', published: 'soon' },
    ]);
    expect(items).toEqual([]);
  });

  it('lists at most SERVICE_MAX, and the cap is 5', () => {
    expect(SERVICE_MAX).toBe(5);
    const many = Array.from({ length: 9 }, (_, i) => ({
      videoId: `VIDEO0000${i}0`,
      title: `S${i}`,
      published: `2026-11-${String(18 - i).padStart(2, '0')}T12:00:00Z`,
    }));
    expect(serviceArrivals(many)).toHaveLength(5);
  });

  it('is a kind of its own, sorts in with the lessons by time, and counts until it is seen', () => {
    expect(ARRIVAL_KINDS).toContain('service-new');
    expect(SCREEN_KINDS.church).toEqual(['service-new']);
    const services = serviceArrivals(parseYoutubeFeed(FEED, 15), { since: '2026-11-08' });
    const lesson = { kind: 'lesson-new', id: 'lesson-new:x/y', at: '2026-11-12T12:00:00.000Z', title: 'New lesson: Y', screen: 'learn' };
    const all = combineArrivals({ catalog: [lesson], services });
    expect(all.map((i) => i.id)).toEqual(['service-new:AAAAAAAAAAA', 'lesson-new:x/y', 'service-new:BBBBBBBBBBB', 'service-new:CCCCCCCCCCC']);
    expect(arrivalCount(all, EMPTY_SEEN)).toBe(4);
    const seen = markSeen(EMPTY_SEEN, all, SCREEN_KINDS.church);
    expect(unseenArrivals(all, seen).map((i) => i.id)).toEqual(['lesson-new:x/y']);
  });

  it('a tap lands on Church in the door the person is in, and the notification carries the title', () => {
    const [item] = serviceArrivals(parseYoutubeFeed(FEED, 15));
    expect(arrivalLanding({ pathname: '/poetech-app/', search: '', item })).toBe('/poetech-app/?view=church');
    expect(arrivalNotification(item)).toMatchObject({
      title: 'New service to watch: Sunday Worship & The Word',
      tag: 'poetech-arrival:service-new:AAAAAAAAAAA',
    });
  });
});

describe('the watcher reads the channel through the same-origin relay', () => {
  const ok = (text) => ({ ok: true, text: async () => text });

  it('asks /api/church-recent for the church’s own channel and returns the parsed videos', async () => {
    const fetchImpl = vi.fn(async () => ok(FEED));
    const videos = await fetchChannelServices({ fetchImpl, channelId: COLG_DEFAULT_CHURCH.youtubeChannelId, parse: parseYoutubeFeed });
    expect(fetchImpl.mock.calls[0][0]).toBe(`/api/church-recent?channel=${COLG_DEFAULT_CHURCH.youtubeChannelId}`);
    expect(videos.map((v) => v.videoId)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD']);
  });

  it('a failed, empty, thrown or timed-out read is null, so the last picture stands', async () => {
    const id = COLG_DEFAULT_CHURCH.youtubeChannelId;
    expect(await fetchChannelServices({ fetchImpl: async () => ({ ok: false, text: async () => '' }), channelId: id, parse: parseYoutubeFeed })).toBeNull();
    expect(await fetchChannelServices({ fetchImpl: async () => ok('<feed></feed>'), channelId: id, parse: parseYoutubeFeed })).toBeNull();
    expect(
      await fetchChannelServices({
        fetchImpl: async () => {
          throw new Error('offline');
        },
        channelId: id,
        parse: parseYoutubeFeed,
      })
    ).toBeNull();
    const hung = (_u, o) => new Promise((_res, rej) => o.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    expect(await fetchChannelServices({ fetchImpl: hung, channelId: id, parse: parseYoutubeFeed, timeoutMs: 20 })).toBeNull();
    expect(await fetchChannelServices({ fetchImpl: async () => ok(FEED), channelId: 'not-a-channel', parse: parseYoutubeFeed })).toBeNull();
  });

  it('PROVEN TO CATCH: a signed-in person with no rows of their own hears the new service, and the feed is read once per window', async () => {
    const events = [];
    const listeners = {};
    const store = new Map([[`${CATALOG_SINCE_PREFIX}u1`, '2026-11-08']]);
    const win = {
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
      document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, title: '' },
      navigator: {},
      addEventListener: (n, fn) => {
        listeners[n] = fn;
      },
      removeEventListener() {},
      dispatchEvent: (e) => {
        events.push(e);
        return true;
      },
      CustomEvent: class {
        constructor(type, init) {
          this.type = type;
          this.detail = init && init.detail;
        }
      },
      location: { pathname: '/poetech-app/', search: '' },
    };
    const readServices = vi.fn(async () => parseYoutubeFeed(FEED, 15));
    let session;
    const stop = startArrivalsWatch(win, {
      supabase: {
        channel: () => ({
          on() {
            return this;
          },
          subscribe() {
            return this;
          },
        }),
        removeChannel() {},
      },
      onAuthChange: (fn) => {
        session = fn;
        return () => {};
      },
      loaders: {
        catalog: async () => () => [],
        lessons: async () => async () => ({ ok: true, owner: false, items: [] }),
        queue: async () => async () => ({ ok: true, rows: [] }),
        feedback: async () => async () => ({ ok: true, items: [] }),
        services: async () => readServices,
      },
    });
    session({ user: { id: 'u1' } });
    await vi.waitFor(() => {
      const last = events.filter((e) => e.type === ARRIVALS_EVENT).pop();
      expect(last.detail.items.map((i) => i.kind)).toContain('service-new');
    });
    const last = events.filter((e) => e.type === ARRIVALS_EVENT).pop();
    // The first look lists the last week only: the October service is not rung.
    expect(last.detail.items.map((i) => i.id)).not.toContain('service-new:DDDDDDDDDDD');
    expect(readServices).toHaveBeenCalledTimes(1);
    expect(SERVICES_REFRESH_MS).toBe(600000);
    stop();
  });
});

describe('a tap, not opening Church, marks a new service seen', () => {
  const src = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf8');
  const mem = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  };

  it('the tap leaves a note of the one item; only a new service is noted', () => {
    const s = mem();
    expect(noteArrivalOpened({ kind: 'lesson-new', id: 'lesson-new:x/y' }, s)).toBe(false);
    expect(peekArrivalOpened(s)).toBeNull();
    expect(noteArrivalOpened({ kind: 'service-new', id: 'service-new:AAAAAAAAAAA' }, s)).toBe(true);
    expect(peekArrivalOpened(s)).toBe('service-new:AAAAAAAAAAA');
    expect(markIdSeen(EMPTY_SEEN, 'service-new:AAAAAAAAAAA').ids).toEqual(['service-new:AAAAAAAAAAA']);
  });

  it('PROVEN TO CATCH: after the tap and the reload, the watcher marks that one service seen and keeps the others', async () => {
    const events = [];
    // The day this account lists from is fixed, so the test does not move with the calendar.
    const store = new Map([[`${CATALOG_SINCE_PREFIX}u1`, '2026-11-08']]);
    const session = mem();
    session.setItem(OPENED_KEY, 'service-new:AAAAAAAAAAA');
    const win = {
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
      sessionStorage: session,
      document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, title: '' },
      navigator: {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: (e) => {
        events.push(e);
        return true;
      },
      CustomEvent: class {
        constructor(type, init) {
          this.type = type;
          this.detail = init && init.detail;
        }
      },
      location: { pathname: '/poetech-app/', search: '?view=church' },
    };
    let signIn;
    const stop = startArrivalsWatch(win, {
      supabase: {
        channel: () => ({
          on() {
            return this;
          },
          subscribe() {
            return this;
          },
        }),
        removeChannel() {},
      },
      onAuthChange: (fn) => {
        signIn = fn;
        return () => {};
      },
      loaders: {
        catalog: async () => () => [],
        lessons: async () => async () => ({ ok: true, owner: false, items: [] }),
        queue: async () => async () => ({ ok: true, rows: [] }),
        feedback: async () => async () => ({ ok: true, items: [] }),
        services: async () => async () => parseYoutubeFeed(FEED, 15),
      },
    });
    signIn({ user: { id: 'u1' } });
    await vi.waitFor(() => expect(peekArrivalOpened(session)).toBeNull());
    const last = events.filter((e) => e.type === ARRIVALS_EVENT).pop();
    expect(last.detail.items.map((i) => i.id)).toEqual(['service-new:BBBBBBBBBBB', 'service-new:CCCCCCCCCCC']);
    stop();
  });

  it('the bell still marks nothing itself, and Church marks only when a recording is played, never on mount', () => {
    const bell = src('components', 'ArrivalsBell.jsx');
    expect(bell).toMatch(/noteArrivalOpened\(item, win\.sessionStorage\)/);
    const home = src('components', 'ChurchHome.jsx');
    expect(home).toMatch(/setChosenVideoId\(v\.videoId\);\s*markArrivalsSeen\(SCREEN_KINDS\.church\)/);
    expect(home.match(/markArrivalsSeen\(/g)).toHaveLength(1);
  });
});
