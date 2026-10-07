// Service-worker update lifecycle — the gate for the "Reload to update did
// nothing" bug (live build 41258af). The REQUIRED gate: after the new worker
// takes over, the page reloads to the new build EXACTLY ONCE, with no reload
// loop, and never a spurious reload on first install. Locked here against the
// pure wiring in lib/sw-update.js (node-env; no real browser needed).
import { describe, it, expect, vi } from 'vitest';
import {
  activateWorker, applyUpdate, wireUpdates, startUpdateChecks, isUpdateStuck, UPDATE_CHECK_MS,
  compareBuild, fetchLiveBuild, watchLiveBuild, BUILD_BEHIND_EVENT, UPDATE_STUCK_EVENT as STUCK_EVT, BUILD_JSON_PATH,
  UPDATE_EVENT, UPDATED_EVENT, UPDATE_STUCK_EVENT,
} from '../lib/sw-update.js';

// --- Minimal fakes that model the real SW lifecycle event surface. ---

function makeWorker(state = 'installed') {
  const listeners = {};
  return {
    state,
    posted: [],
    postMessage(msg) { this.posted.push(msg); },
    addEventListener(type, cb) { (listeners[type] ||= []).push(cb); },
    fire(type) { (listeners[type] || []).forEach((cb) => cb()); },
  };
}

function makeRegistration({ waiting = null, installing = null } = {}) {
  const listeners = {};
  return {
    waiting,
    installing,
    updateCount: 0,
    update() { this.updateCount += 1; },
    addEventListener(type, cb) { (listeners[type] ||= []).push(cb); },
    fire(type) { (listeners[type] || []).forEach((cb) => cb()); },
  };
}

function makeNavigator({ controller = null } = {}) {
  const listeners = {};
  return {
    serviceWorker: {
      controller,
      addEventListener(type, cb) { (listeners[type] ||= []).push(cb); },
      fire(type) { (listeners[type] || []).forEach((cb) => cb()); },
    },
  };
}

function makeSessionStorage() {
  const map = new Map();
  return {
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); },
    _map: map,
  };
}

function makeWindow() {
  const events = {};
  const timers = [];
  return {
    reloads: 0,
    dispatched: [],
    sessionStorage: makeSessionStorage(),
    location: { reload() { /* bound below */ } },
    addEventListener(type, cb) { (events[type] ||= []).push(cb); },
    fire(type) { (events[type] || []).forEach((cb) => cb()); },
    dispatchEvent(evt) { this.dispatched.push(evt); return true; },
    // Controllable fake timer so the applyUpdate safety-net reload is
    // deterministic: scheduling records the callback, flushTimers() fires it.
    setTimeout(cb) { timers.push(cb); return timers.length; },
    flushTimers() { const due = timers.splice(0); due.forEach((cb) => cb()); },
    pendingTimers() { return timers.length; },
  };
}

function win() {
  const w = makeWindow();
  w.location.reload = () => { w.reloads += 1; };
  return w;
}

const dispatchedTypes = (w) => w.dispatched.map((e) => e.type);

describe('activateWorker — skip-waiting message', () => {
  it('posts SKIP_WAITING to the worker', () => {
    const wkr = makeWorker();
    expect(activateWorker(wkr)).toBe(true);
    expect(wkr.posted).toEqual([{ type: 'SKIP_WAITING' }]);
  });
  it('is null-safe', () => {
    expect(activateWorker(null)).toBe(false);
    expect(activateWorker({})).toBe(false);
  });
});

describe('applyUpdate — the indicator tap', () => {
  it('skip-waits the WAITING worker (does not reload directly)', () => {
    const waiting = makeWorker('installed');
    const reg = makeRegistration({ waiting });
    const w = win();
    expect(applyUpdate(reg, w)).toBe('skip-waiting');
    expect(waiting.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    expect(w.reloads).toBe(0); // controllerchange does the reload, not the click
  });
  it('falls back to a direct reload when there is no waiting worker', () => {
    const reg = makeRegistration({ waiting: null });
    const w = win();
    expect(applyUpdate(reg, w)).toBe('reload');
    expect(w.reloads).toBe(1);
  });

  // THE FIX for "tap RELOAD TO UPDATE does nothing": a tap is never a silent
  // no-op. If controllerchange does not drive a navigation, the armed safety net
  // forces exactly one guarded reload so the update still applies.
  it('arms a timed fallback reload so the tap is never a silent no-op', () => {
    const waiting = makeWorker('installed');
    const reg = makeRegistration({ waiting });
    const w = win();
    applyUpdate(reg, w);
    expect(w.reloads).toBe(0);              // nothing yet — give the swap its chance
    expect(w.pendingTimers()).toBe(1);      // ...but a fallback is armed
    // controllerchange never fired -> the safety net fires.
    w.flushTimers();
    expect(w.reloads).toBe(1);
    // The sentinel is set by the fallback so the next load can detect a non-stick.
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBe('1');
  });

  it('does NOT set the sentinel until an actual reload happens (no false loop)', () => {
    const waiting = makeWorker('installed');
    const reg = makeRegistration({ waiting });
    const w = win();
    applyUpdate(reg, w);
    // Posting SKIP_WAITING alone must not mark a reload — only the reload does.
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBeNull();
  });

  it('respects an injected timeout/setTimeout (tests stay deterministic)', () => {
    const waiting = makeWorker('installed');
    const reg = makeRegistration({ waiting });
    const w = win();
    let scheduledDelay = null;
    const fakeSetTimeout = (cb, ms) => { scheduledDelay = ms; cb(); };
    applyUpdate(reg, w, { timeoutMs: 1234, setTimeout: fakeSetTimeout });
    expect(scheduledDelay).toBe(1234);
    expect(w.reloads).toBe(1); // injected timer fired synchronously here
  });
});

describe('wireUpdates — controller swap reloads exactly once', () => {
  it('UPDATE path: waiting-at-load -> banner + skip-waiting + single reload', () => {
    const waiting = makeWorker('installed');
    const reg = makeRegistration({ waiting });
    const nav = makeNavigator({ controller: makeWorker('activated') }); // already controlled
    const w = win();

    const handle = wireUpdates(reg, nav, w);

    // Banner surfaced + waiting worker told to skip.
    expect(w.dispatched.map((e) => e.type)).toContain(UPDATE_EVENT);
    expect(waiting.posted).toEqual([{ type: 'SKIP_WAITING' }]);

    // New worker takes control -> exactly one reload.
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
    expect(handle.state.reloaded).toBe(1);
  });

  it('NO reload loop: repeated controllerchange still reloads once', () => {
    const reg = makeRegistration({ waiting: makeWorker() });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    wireUpdates(reg, nav, w);
    nav.serviceWorker.fire('controllerchange');
    nav.serviceWorker.fire('controllerchange');
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
  });

  it('FIRST INSTALL: no prior controller -> claim does NOT reload', () => {
    const reg = makeRegistration({ waiting: null });
    const nav = makeNavigator({ controller: null }); // brand-new install
    const w = win();
    wireUpdates(reg, nav, w);
    // clients.claim() fires controllerchange on first control — must be ignored.
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(0);
    expect(w.dispatched).toEqual([]); // no banner on first install
  });

  it('updatefound path: a worker installing this session gets skip-waited + reloads once', () => {
    const reg = makeRegistration({ waiting: null });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    wireUpdates(reg, nav, w);

    // A new worker appears and reaches "installed".
    const installing = makeWorker('installing');
    reg.installing = installing;
    reg.fire('updatefound');
    installing.state = 'installed';
    installing.fire('statechange');

    expect(w.dispatched.map((e) => e.type)).toContain(UPDATE_EVENT);
    expect(installing.posted).toEqual([{ type: 'SKIP_WAITING' }]);

    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
  });

  it('is inert without a registration or serviceWorker', () => {
    expect(wireUpdates(null, makeNavigator(), win()).state.reloaded).toBe(0);
    expect(wireUpdates(makeRegistration(), {}, win()).state.reloaded).toBe(0);
  });

  it('sets the durable sessionStorage sentinel BEFORE the reload', () => {
    const reg = makeRegistration({ waiting: makeWorker() });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    wireUpdates(reg, nav, w);
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBeNull();
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
    // The sentinel must outlive the reload so the next page load can detect it.
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBe('1');
  });
});

// The headline gate: the "banner persists / loops" symptom is a CROSS-reload
// loop the old in-memory guard could not stop. The sentinel survives the reload;
// these drive two page-lives over one shared sessionStorage (one tab).
describe('wireUpdates — durable cross-reload loop guard (sentinel)', () => {
  it('post-update load with a worker STILL waiting does NOT auto-skip-wait (no spin)', () => {
    const ss = makeSessionStorage();
    ss.setItem('poetech:sw-reloading', '1'); // we reloaded for an update last life

    const stillWaiting = makeWorker('installed');
    const reg = makeRegistration({ waiting: stillWaiting });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    w.sessionStorage = ss;

    const handle = wireUpdates(reg, nav, w);

    expect(handle.loopRisk).toBe(true);
    // Loop signature detected: do NOT auto-activate (that would re-loop)...
    expect(stillWaiting.posted).toEqual([]);
    expect(handle.state.autoApplied).toBe(0);
    // ...but DO surface the manual indicator as the escape hatch...
    expect(dispatchedTypes(w)).toContain(UPDATE_EVENT);
    // ...escalate to the honest "close & reopen" hint (stuck flag + event)...
    expect(w.__pwaUpdateStuck).toBe(true);
    expect(isUpdateStuck(w)).toBe(true);
    expect(dispatchedTypes(w)).toContain(UPDATE_STUCK_EVENT);
    // ...and clear the sentinel so we don't mis-detect forever.
    expect(ss.getItem('poetech:sw-reloading')).toBeNull();
  });

  it('a healthy post-update load is NOT marked stuck', () => {
    const ss = makeSessionStorage();
    ss.setItem('poetech:sw-reloading', '1');
    const reg = makeRegistration({ waiting: null }); // new build stuck/active
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    w.sessionStorage = ss;
    wireUpdates(reg, nav, w);
    expect(isUpdateStuck(w)).toBe(false);
    expect(dispatchedTypes(w)).not.toContain(UPDATE_STUCK_EVENT);
  });

  it('a MANUAL tap in the loop case still applies (controllerchange not blocked)', () => {
    const ss = makeSessionStorage();
    ss.setItem('poetech:sw-reloading', '1');
    const stillWaiting = makeWorker('installed');
    const reg = makeRegistration({ waiting: stillWaiting });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    w.sessionStorage = ss;

    wireUpdates(reg, nav, w);
    // User taps the fallback banner -> skip-waiting -> swap -> exactly one reload.
    applyUpdate(reg, w);
    expect(stillWaiting.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    nav.serviceWorker.fire('controllerchange');
    expect(w.reloads).toBe(1);
  });

  it('post-update load with NO worker waiting confirms via UPDATED_EVENT', () => {
    const ss = makeSessionStorage();
    ss.setItem('poetech:sw-reloading', '1');
    const reg = makeRegistration({ waiting: null });
    const nav = makeNavigator({ controller: makeWorker('activated') });
    const w = win();
    w.sessionStorage = ss;

    const handle = wireUpdates(reg, nav, w);
    expect(handle.loopRisk).toBe(false);
    expect(handle.state.updatedShown).toBe(1);
    expect(dispatchedTypes(w)).toContain(UPDATED_EVENT);
    expect(dispatchedTypes(w)).not.toContain(UPDATE_EVENT); // no nagging banner
    expect(ss.getItem('poetech:sw-reloading')).toBeNull();
  });

  it('end-to-end: auto-reload -> still-pending -> NO second auto-reload (loop broken)', () => {
    const ss = makeSessionStorage(); // the one tab's storage, across both lives

    // Page life 1: a worker is waiting, auto-applies, swap reloads once.
    const w1 = win();
    w1.sessionStorage = ss;
    const reg1 = makeRegistration({ waiting: makeWorker('installed') });
    const nav1 = makeNavigator({ controller: makeWorker('activated') });
    wireUpdates(reg1, nav1, w1);
    nav1.serviceWorker.fire('controllerchange');
    expect(w1.reloads).toBe(1);
    expect(ss.getItem('poetech:sw-reloading')).toBe('1');

    // Page life 2 (the reload): the new build DIDN'T stick — a worker is STILL
    // waiting. The in-memory guard reset, but the sentinel did not: no auto-spin.
    const w2 = win();
    w2.sessionStorage = ss;
    const reg2 = makeRegistration({ waiting: makeWorker('installed') });
    const nav2 = makeNavigator({ controller: makeWorker('activated') });
    const h2 = wireUpdates(reg2, nav2, w2);
    expect(h2.loopRisk).toBe(true);
    expect(h2.state.autoApplied).toBe(0);
    expect(reg2.waiting.posted).toEqual([]); // never auto-skip-waited again
  });
});

describe('startUpdateChecks — long-lived PWA re-checks for new builds', () => {
  it('checks immediately and on focus / visibility regain', () => {
    const reg = makeRegistration();
    const w = win();
    w.document = { visibilityState: 'visible' };
    startUpdateChecks(reg, w, makeNavigator());
    expect(reg.updateCount).toBe(1); // immediate
    w.fire('focus');
    expect(reg.updateCount).toBe(2);
    w.fire('visibilitychange');
    expect(reg.updateCount).toBe(3);
  });
  it('is null-safe when update() is unavailable', () => {
    expect(() => startUpdateChecks({}, win(), makeNavigator())).not.toThrow();
  });
  it('re-checks on a clock while visible, so a tablet that never refocuses (the camera wall) still takes a new build (2026-10-07)', () => {
    vi.useFakeTimers();
    try {
      const reg = makeRegistration();
      const w = win();
      w.document = { visibilityState: 'visible' };
      w.setInterval = (fn, ms) => setInterval(fn, ms);
      startUpdateChecks(reg, w, makeNavigator());
      expect(reg.updateCount).toBe(1);
      vi.advanceTimersByTime(UPDATE_CHECK_MS);
      expect(reg.updateCount).toBe(2);
      vi.advanceTimersByTime(UPDATE_CHECK_MS * 2);
      expect(reg.updateCount).toBe(4);
      // hidden: the clock does not ask (visibility regain asks instead)
      w.document.visibilityState = 'hidden';
      vi.advanceTimersByTime(UPDATE_CHECK_MS);
      expect(reg.updateCount).toBe(4);
      expect(UPDATE_CHECK_MS).toBe(10 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }
  });
});

// DR-0781: the server is asked which build is live; "latest" is a measurement.
describe('watchLiveBuild — the server names the live build, and a device behind it is brought forward', () => {
  const liveJson = (sha) => async (url, opts) => ({ ok: true, json: async () => ({ sha, time: '2026-10-07T12:59:00Z' }), url, opts });
  it('compareBuild: same is latest, different is behind, dev or unreadable is unknown (never latest)', () => {
    expect(compareBuild('10b6419', { sha: '10b6419' })).toBe('latest');
    expect(compareBuild('847ec24', { sha: '10b6419' })).toBe('behind');
    expect(compareBuild('847ec24', null)).toBe('unknown');
    expect(compareBuild('dev', { sha: '10b6419' })).toBe('unknown');
    expect(compareBuild('', { sha: '10b6419' })).toBe('unknown');
  });
  it('fetchLiveBuild asks with cache: no-store and a cache-busting query, and reads sha + time; a miss is null', async () => {
    const calls = [];
    const f = async (url, opts) => { calls.push({ url, opts }); return { ok: true, json: async () => ({ sha: 'abc1234', time: 't' }) }; };
    expect(await fetchLiveBuild(f, BUILD_JSON_PATH, 42)).toEqual({ sha: 'abc1234', time: 't' });
    expect(calls[0].url).toBe('/poetech-app/build.json?b=42');
    expect(calls[0].opts.cache).toBe('no-store');
    expect(await fetchLiveBuild(async () => ({ ok: false }))).toBeNull();
    expect(await fetchLiveBuild(async () => { throw new Error('offline'); })).toBeNull();
    expect(await fetchLiveBuild(async () => ({ ok: true, json: async () => ({}) }))).toBeNull();
  });
  it('same sha: nothing is said and nothing is done', async () => {
    const reg = makeRegistration();
    const w = win();
    w.document = { visibilityState: 'visible' };
    const timers = [];
    const h = watchLiveBuild(reg, w, { buildSha: '10b6419', fetchImpl: liveJson('10b6419'), setTimeout: (fn, ms) => timers.push({ fn, ms }), setInterval: () => 0 });
    await new Promise((r) => setTimeout(r, 5));
    expect(h.state.last).toBe('latest');
    expect(dispatchedTypes(w)).not.toContain(BUILD_BEHIND_EVENT);
    expect(reg.updateCount).toBe(0);
    expect(timers).toHaveLength(0);
  });
  it('behind: the event fires, the worker is asked to update, and when no worker appears ONE guarded reload brings the device forward', async () => {
    const reg = makeRegistration();
    const w = win();
    w.document = { visibilityState: 'visible' };
    const timers = [];
    const h = watchLiveBuild(reg, w, { buildSha: '847ec24', fetchImpl: liveJson('10b6419'), setTimeout: (fn, ms) => timers.push({ fn, ms }), setInterval: () => 0, reloadAfterMs: 8000 });
    await new Promise((r) => setTimeout(r, 5));
    expect(h.state.last).toBe('behind');
    expect(dispatchedTypes(w)).toContain(BUILD_BEHIND_EVENT);
    expect(reg.updateCount).toBe(1);
    expect(timers).toHaveLength(1);
    expect(timers[0].ms).toBe(8000);
    timers[0].fn();
    expect(w.reloads).toBe(1);
    expect(w.sessionStorage.getItem('poetech:sw-reloading')).toBeTruthy();
    // a second check in the same page life never arms a second reload
    await h.check();
    expect(timers).toHaveLength(1);
    expect(w.reloads).toBe(1);
  });
  it('behind, but a new worker appeared in time: the worker path owns the reload, this one stands down', async () => {
    const reg = makeRegistration();
    const w = win();
    w.document = { visibilityState: 'visible' };
    const timers = [];
    watchLiveBuild(reg, w, { buildSha: '847ec24', fetchImpl: liveJson('10b6419'), setTimeout: (fn, ms) => timers.push({ fn, ms }), setInterval: () => 0 });
    await new Promise((r) => setTimeout(r, 5));
    reg.waiting = makeWorker('installed');
    timers[0].fn();
    expect(w.reloads).toBe(0);
  });
  it('reloaded for the server\'s verdict and STILL on the old build: says stuck instead of spinning', async () => {
    const w = win();
    w.document = { visibilityState: 'visible' };
    w.sessionStorage.setItem('poetech:sw-reloading', String(Date.now()));
    w.__pwaBehindSha = '10b6419';
    const reg = makeRegistration();
    watchLiveBuild(reg, w, { buildSha: '847ec24', fetchImpl: liveJson('10b6419'), setTimeout: () => { throw new Error('must not arm'); }, setInterval: () => 0 });
    await new Promise((r) => setTimeout(r, 5));
    expect(dispatchedTypes(w)).toContain(STUCK_EVT);
    expect(w.__pwaUpdateStuck).toBe(true);
    expect(w.reloads).toBe(0);
  });
  it('unreadable (offline / an older deploy without build.json): unknown, never latest, nothing done', async () => {
    const reg = makeRegistration();
    const w = win();
    const h = watchLiveBuild(reg, w, { buildSha: '847ec24', fetchImpl: async () => ({ ok: false }), setTimeout: () => { throw new Error('must not arm'); }, setInterval: () => 0 });
    await new Promise((r) => setTimeout(r, 5));
    expect(h.state.last).toBe('unknown');
    expect(w.reloads).toBe(0);
  });
});
