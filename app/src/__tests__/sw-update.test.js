// Service-worker update lifecycle — the gate for the "Reload to update did
// nothing" bug (live build 41258af). The REQUIRED gate: after the new worker
// takes over, the page reloads to the new build EXACTLY ONCE, with no reload
// loop, and never a spurious reload on first install. Locked here against the
// pure wiring in lib/sw-update.js (node-env; no real browser needed).
import { describe, it, expect } from 'vitest';
import {
  activateWorker, applyUpdate, wireUpdates, startUpdateChecks, UPDATE_EVENT,
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

function makeWindow() {
  const events = {};
  return {
    reloads: 0,
    dispatched: [],
    location: { reload() { /* bound below */ } },
    addEventListener(type, cb) { (events[type] ||= []).push(cb); },
    fire(type) { (events[type] || []).forEach((cb) => cb()); },
    dispatchEvent(evt) { this.dispatched.push(evt); return true; },
  };
}

function win() {
  const w = makeWindow();
  w.location.reload = () => { w.reloads += 1; };
  return w;
}

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

describe('applyUpdate — the banner button', () => {
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
});
