// @vitest-environment node
// =============================================================================
// sw-push-handler — the service worker's push path, tested on the REAL file
// =============================================================================
// This suite loads `app/public/sw.js` itself and drives its handlers against a
// fake ServiceWorkerGlobalScope. It deliberately does NOT test a copy of the
// logic: the shipped artifact is the thing that has to work, and a duplicate
// would drift from it silently — which is the whole failure class here.
//
// WHY IT EXISTS. Darrell, 2026-09-06: "My phone didn't notify me of the
// livestream inside the Love Corner App... why not." The measured answer was
// that sw.js had FOUR listeners — install, activate, message, fetch — and no
// `push` handler whatsoever, so a phone with the app closed could not be
// notified of anything, ever. These tests are the standing proof that the
// handler exists and behaves, so the gap cannot silently reopen.
//
// THE RULE THAT SHAPES MOST OF THESE CASES: a push handler must never throw.
// Push services may deliver an EMPTY push as a "wake up" ping, bodies can be
// malformed, and on some platforms a handler that rejects costs the origin its
// push permission outright. So every malformed input below must still produce
// an honest notification rather than an exception.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SW_PATH = join(HERE, '..', '..', 'public', 'sw.js');
const SW_SRC = readFileSync(SW_PATH, 'utf8');
const BASE = '/poetech-app';

/** Load the real sw.js into a fake worker scope and hand back what it registered. */
function loadServiceWorker() {
  const handlers = {};
  const shown = [];
  const opened = [];
  const posted = [];
  const clientList = [];

  const badge = { set: [], cleared: 0 };
  const self = {
    addEventListener(type, fn) { handlers[type] = fn; },
    skipWaiting() {},
    navigator: {
      setAppBadge(n) { badge.set.push(n); return Promise.resolve(); },
      clearAppBadge() { badge.cleared += 1; return Promise.resolve(); },
    },
    registration: {
      showNotification(title, options) {
        shown.push({ title, options });
        return Promise.resolve();
      },
      // The notifications currently in the shade — what the app badge counts.
      getNotifications() { return Promise.resolve(shown.slice()); },
    },
    clients: {
      claim() { return Promise.resolve(); },
      matchAll() { return Promise.resolve(clientList); },
      openWindow(url) { opened.push(url); return Promise.resolve({ url }); },
    },
  };
  const caches = {
    open: () => Promise.resolve({ add: () => Promise.resolve(), match: () => Promise.resolve(undefined), put: () => Promise.resolve() }),
    keys: () => Promise.resolve([]),
    delete: () => Promise.resolve(true),
  };
  new Function('self', 'caches', 'fetch', SW_SRC)(self, caches, () => Promise.resolve(new Response('')));
  return { handlers, shown, opened, posted, clientList, self, badge };
}

/** A push event whose data.text() returns `raw`; `waitUntil` collects the promise. */
function pushEvent(raw, { throwOnRead = false } = {}) {
  const waited = [];
  return {
    waited,
    data: raw === null ? null : {
      text() {
        if (throwOnRead) throw new Error('decryption failed');
        return raw;
      },
    },
    waitUntil(p) { waited.push(p); },
  };
}

describe('the real sw.js registers the handlers a closed phone needs', () => {
  let sw;
  beforeEach(() => { sw = loadServiceWorker(); });

  it('registers a push handler — the listener whose absence started this work', () => {
    expect(typeof sw.handlers.push, 'sw.js must have a push listener').toBe('function');
  });

  it('registers notificationclick, so a tap lands somewhere', () => {
    expect(typeof sw.handlers.notificationclick).toBe('function');
  });

  it('registers pushsubscriptionchange, so a rotated subscription is not lost silently', () => {
    expect(typeof sw.handlers.pushsubscriptionchange).toBe('function');
  });

  it('keeps the four listeners that were already there (no regression)', () => {
    for (const t of ['install', 'activate', 'message', 'fetch']) {
      expect(typeof sw.handlers[t], `${t} listener lost`).toBe('function');
    }
  });
});

describe('a live-service push becomes the right notification', () => {
  let sw;
  beforeEach(() => { sw = loadServiceWorker(); });

  it('shows the title, body and deep link the sender chose', async () => {
    const ev = pushEvent(JSON.stringify({
      kind: 'live',
      title: 'The Love Corner is live',
      body: 'Sunday Worship has started.',
      url: `${BASE}/?tab=church`,
    }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);

    expect(sw.shown).toHaveLength(1);
    expect(sw.shown[0].title).toBe('The Love Corner is live');
    expect(sw.shown[0].options.body).toBe('Sunday Worship has started.');
    expect(sw.shown[0].options.data.url).toBe(`${BASE}/?tab=church`);
  });

  it('always calls waitUntil, so the browser cannot kill the worker mid-show', async () => {
    const ev = pushEvent(JSON.stringify({ title: 'x' }));
    sw.handlers.push(ev);
    expect(ev.waited.length).toBe(1);
    await Promise.all(ev.waited);
  });

  it('tags by kind so a repeated announcement REPLACES rather than buzzing twice', async () => {
    const ev = pushEvent(JSON.stringify({ kind: 'live', title: 'live' }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.tag).toBe('poetech-live');
    expect(sw.shown[0].options.renotify).toBe(false);
  });

  it('honours an explicit tag and an explicit renotify', async () => {
    const ev = pushEvent(JSON.stringify({ title: 't', tag: 'colg-2026-09-06', renotify: true }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.tag).toBe('colg-2026-09-06');
    expect(sw.shown[0].options.renotify).toBe(true);
  });

  it('carries an icon and a badge so the shade shows the church, not a blank dot', async () => {
    const ev = pushEvent(JSON.stringify({ title: 't' }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.icon).toBe(`${BASE}/icon.svg`);
    // The status-bar glyph must be a monochrome RASTER: Android masks it to
    // white and cannot use the seal SVG (a generic bell showed instead,
    // Darrell's shade 2026-09-09). badge-96.png is the church's cross.
    expect(sw.shown[0].options.badge).toBe(`${BASE}/badge-96.png`);
  });
});

describe('malformed and hostile payloads still notify, and never throw', () => {
  let sw;
  beforeEach(() => { sw = loadServiceWorker(); });

  it('an EMPTY push (a legitimate wake-up ping) shows an honest generic notice', async () => {
    const ev = pushEvent(null);
    expect(() => sw.handlers.push(ev)).not.toThrow();
    await Promise.all(ev.waited);
    expect(sw.shown).toHaveLength(1);
    expect(sw.shown[0].title).toBe('The Love Corner');
    // It must not invent a claim it was not given — no "we are live" here.
    expect(sw.shown[0].options.body).not.toMatch(/live/i);
  });

  it('a body that is not JSON is shown as text rather than dropped', async () => {
    const ev = pushEvent('Bible study starts in ten minutes');
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.body).toBe('Bible study starts in ten minutes');
  });

  it('truncates an absurdly long non-JSON body instead of pasting a wall into the shade', async () => {
    const ev = pushEvent('x'.repeat(5000));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.body.length).toBe(200);
  });

  it('JSON that is not an object falls back cleanly', async () => {
    for (const raw of ['null', '42', '"just a string"', '[1,2,3]']) {
      const local = loadServiceWorker();
      const ev = pushEvent(raw);
      expect(() => local.handlers.push(ev)).not.toThrow();
      await Promise.all(ev.waited);
      expect(local.shown).toHaveLength(1);
      expect(local.shown[0].title.length).toBeGreaterThan(0);
    }
  });

  it('a payload with no title still gets one', async () => {
    const ev = pushEvent(JSON.stringify({ body: 'no title here' }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].title).toBe('The Love Corner');
    expect(sw.shown[0].options.body).toBe('no title here');
  });

  it('does not throw when reading event.data itself fails', async () => {
    const ev = pushEvent('{}', { throwOnRead: true });
    expect(() => sw.handlers.push(ev)).not.toThrow();
    await Promise.all(ev.waited);
    expect(sw.shown).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: an off-origin url is refused, so a push cannot redirect the app', async () => {
    // A push body is attacker-influenceable if a sender is ever compromised.
    // An absolute URL in `url` would let a notification tap open any site while
    // wearing the church's icon — a phishing primitive. Only same-origin,
    // leading-slash paths are honoured.
    for (const hostile of [
      'https://evil.example/steal',
      '//evil.example/steal',
      '/\\evil.example/steal',
      'javascript:alert(1)',
      'http://poetech.us.evil.example/',
    ]) {
      const local = loadServiceWorker();
      const ev = pushEvent(JSON.stringify({ title: 'Tap me', url: hostile }));
      local.handlers.push(ev);
      await Promise.all(ev.waited);
      expect(local.shown[0].options.data.url, `accepted hostile url: ${hostile}`).toBe(`${BASE}/`);
    }
  });

  it('accepts a same-origin path', async () => {
    const ev = pushEvent(JSON.stringify({ title: 't', url: `${BASE}/?tab=messages` }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.shown[0].options.data.url).toBe(`${BASE}/?tab=messages`);
  });
});

describe('tapping the notification reuses an open tab instead of stacking copies', () => {
  let sw;
  beforeEach(() => { sw = loadServiceWorker(); });

  function clickEvent(url) {
    const waited = [];
    let closed = false;
    return {
      waited,
      closed: () => closed,
      notification: { close() { closed = true; }, data: { url } },
      waitUntil(p) { waited.push(p); },
    };
  }

  it('closes the notification when tapped', async () => {
    const ev = clickEvent(`${BASE}/`);
    sw.handlers.notificationclick(ev);
    await Promise.all(ev.waited);
    expect(ev.closed()).toBe(true);
  });

  it('opens a window when no tab is open', async () => {
    const ev = clickEvent(`${BASE}/?tab=church`);
    sw.handlers.notificationclick(ev);
    await Promise.all(ev.waited);
    expect(sw.opened).toEqual([`${BASE}/?tab=church`]);
  });

  it('focuses an existing app tab rather than opening a second one', async () => {
    let focused = false;
    sw.clientList.push({
      url: `https://poetech.us${BASE}/?tab=church`,
      focus() { focused = true; return Promise.resolve(this); },
    });
    const ev = clickEvent(`${BASE}/?tab=church`);
    sw.handlers.notificationclick(ev);
    await Promise.all(ev.waited);
    expect(focused).toBe(true);
    expect(sw.opened).toEqual([]);
  });

  it('navigates an open tab that is on a DIFFERENT screen', async () => {
    let navigatedTo = null;
    sw.clientList.push({
      url: `https://poetech.us${BASE}/?tab=money`,
      focus() { return Promise.resolve(this); },
      navigate(u) { navigatedTo = u; return Promise.resolve({ focus() { return Promise.resolve(); } }); },
    });
    const ev = clickEvent(`${BASE}/?tab=church`);
    sw.handlers.notificationclick(ev);
    await Promise.all(ev.waited);
    expect(navigatedTo).toBe(`${BASE}/?tab=church`);
    expect(sw.opened).toEqual([]);
  });

  it('falls back to the app root when the notification carries no url', async () => {
    const ev = { notification: { close() {}, data: null }, waitUntil(p) { this.waited = [p]; }, waited: [] };
    sw.handlers.notificationclick(ev);
    await Promise.all(ev.waited);
    expect(sw.opened).toEqual([`${BASE}/`]);
  });
});

describe('a rotated subscription tells the page to re-register', () => {
  it('posts PUSH_SUBSCRIPTION_CHANGED to every open client', async () => {
    const sw = loadServiceWorker();
    const got = [];
    sw.clientList.push({ url: `https://poetech.us${BASE}/`, postMessage: (m) => got.push(m) });
    const ev = { waited: [], waitUntil(p) { this.waited.push(p); } };
    sw.handlers.pushsubscriptionchange(ev);
    await Promise.all(ev.waited);
    expect(got).toEqual([{ type: 'PUSH_SUBSCRIPTION_CHANGED' }]);
  });
});

// ---------------------------------------------------------------------------
// THE APP-ICON BADGE (Darrell, 2026-09-09: "on the app and in the notification
// list"). ConnectBot wore a "1" beside a bare church icon: the shade was one
// place, the launcher the other. The worker sets the badge to the number of
// notifications it is showing, and clears it when a tap empties the shade.
// ---------------------------------------------------------------------------
describe('the app-icon badge follows the notifications in the shade', () => {
  it('a push sets the badge to the count of notifications showing', async () => {
    const sw = loadServiceWorker();
    const ev = pushEvent(JSON.stringify({ title: 'mrspoe06 sent you a message', kind: 'message', tag: 'message:1' }));
    sw.handlers.push(ev);
    await Promise.all(ev.waited);
    expect(sw.badge.set).toEqual([1]);
    const ev2 = pushEvent(JSON.stringify({ title: 'darrellpoejr sent you a message', kind: 'message', tag: 'message:2' }));
    sw.handlers.push(ev2);
    await Promise.all(ev2.waited);
    expect(sw.badge.set).toEqual([1, 2]);
  });

  it('a tap that empties the shade clears the badge', async () => {
    const sw = loadServiceWorker();
    // Nothing left showing after the tap closes the notification.
    sw.self.registration.getNotifications = () => Promise.resolve([]);
    const waited = [];
    sw.handlers.notificationclick({
      notification: { close() {}, data: { url: `${BASE}/?tab=messages` } },
      waitUntil(p) { waited.push(p); },
    });
    await Promise.all(waited);
    expect(sw.badge.cleared).toBe(1);
    expect(sw.opened).toEqual([`${BASE}/?tab=messages`]);
  });

  it('a worker scope without the Badging API is a no-op, never a throw', async () => {
    const sw = loadServiceWorker();
    delete sw.self.navigator;
    const ev = pushEvent(JSON.stringify({ title: 'x' }));
    sw.handlers.push(ev);
    await expect(Promise.all(ev.waited)).resolves.toBeTruthy();
    expect(sw.shown).toHaveLength(1);
  });

  it('the badge glyph the worker names is a real 96x96 PNG in public/', () => {
    const png = readFileSync(join(HERE, '..', '..', 'public', 'badge-96.png'));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(96);
    expect(png.readUInt32BE(20)).toBe(96);
    expect(SW_SRC).toContain("badge: BASE + '/badge-96.png'");
  });
});
