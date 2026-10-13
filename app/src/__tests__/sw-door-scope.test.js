// @vitest-environment node
// =============================================================================
// sw-door-scope — the worker registers AT THE DOOR, and a root registration
// left by earlier builds is retired without ever silencing the phone
// =============================================================================
// Darrell 2026-09-23 (two Fold screenshots): the shade says "Chrome ·
// poetech..." for a PoeTech message and the "P" in the dock carries no count.
// MDN browser-compat-data 8.1.2: navigator.setAppBadge is NOT implemented on
// Chrome Android / Samsung Internet / WebView, so the only road to a count on
// the icon is the OS crediting the notification to the installed app — which
// needs the showing registration to lie inside the app's manifest scope. A
// registration at '/' lies inside none of the doors. See lib/sw-door-scope.js.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  swScopeFor, isRootScope, registerDoorWorker, retireRootRegistration, rowMoverFor,
} from '../lib/sw-door-scope.js';
import { DOORS } from '../lib/app-doors.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://poetech.us';

function fakeSub({ endpoint, key = new Uint8Array([4, 1, 2]) } = {}) {
  let alive = true;
  return {
    endpoint,
    options: { applicationServerKey: key },
    toJSON: () => ({ endpoint, keys: { p256dh: 'p-' + endpoint, auth: 'a-' + endpoint } }),
    unsubscribe: async () => { alive = false; return true; },
    get alive() { return alive; },
  };
}

function fakeReg(scope, { sub = null, subscribeFails = false } = {}) {
  const reg = {
    scope: ORIGIN + scope,
    unregistered: false,
    subscribeCalls: [],
    pushManager: {
      getSubscription: async () => sub,
      subscribe: async (opts) => {
        reg.subscribeCalls.push(opts);
        if (subscribeFails) throw new Error('push service unreachable');
        sub = fakeSub({ endpoint: 'https://push/new-' + scope, key: opts.applicationServerKey });
        return sub;
      },
    },
    unregister: async () => { reg.unregistered = true; return true; },
  };
  return reg;
}

function fakeNavigator({ regs = [], registerFails = false } = {}) {
  const calls = [];
  const sw = {
    register: async (url, opts) => {
      calls.push({ url, opts });
      if (registerFails) throw new Error('SecurityError');
      const r = fakeReg(opts.scope);
      regs.push(r);
      return r;
    },
    getRegistrations: async () => regs.slice(),
  };
  return { navigator: { serviceWorker: sw }, calls, regs };
}

describe('swScopeFor — the scope is the door the page booted in', () => {
  it('maps every installable door path to itself', () => {
    for (const d of DOORS) {
      expect(swScopeFor(d.path + '?view=church')).toBe(d.path);
      expect(swScopeFor(d.path + 'index.html')).toBe(d.path);
    }
  });

  it("the PoeTech door is '/poetech-app/' — matching the manifest's declared scope exactly", () => {
    const manifest = JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'manifest.webmanifest'), 'utf8'));
    expect(swScopeFor('/poetech-app/')).toBe(manifest.scope);
  });

  it('a page outside every door keeps the root, so it is never left uncontrolled', () => {
    expect(swScopeFor('/')).toBe('/');
    expect(swScopeFor('/tlc/')).toBe('/');     // the TLC public door page, not its app
    expect(swScopeFor('')).toBe('/');
    expect(swScopeFor(undefined)).toBe('/');
  });

  it('isRootScope recognises the legacy registration in every spelling', () => {
    expect(isRootScope('/', ORIGIN)).toBe(true);
    expect(isRootScope(ORIGIN + '/', ORIGIN)).toBe(true);
    expect(isRootScope(ORIGIN + '/poetech-app/', ORIGIN)).toBe(false);
  });
});

describe('registerDoorWorker — one worker file, registered at the door', () => {
  it("registers '/sw.js' with the door's scope", async () => {
    const f = fakeNavigator();
    const out = await registerDoorWorker({ navigator: f.navigator, location: { pathname: '/lovecorner/app/', origin: ORIGIN } });
    expect(f.calls).toEqual([{ url: '/sw.js', opts: { scope: '/lovecorner/app/' } }]);
    expect(out.scope).toBe('/lovecorner/app/');
    expect(out.registration).toBe(f.regs[0]);
    expect(out.migrated).toEqual({ sub: false, row: false, unregistered: false, reason: 'none' });
  });

  it('a failed register is a RESULT, never a throw', async () => {
    const f = fakeNavigator({ registerFails: true });
    const out = await registerDoorWorker({ navigator: f.navigator, location: { pathname: '/poetech-app/', origin: ORIGIN } });
    expect(out.registration).toBeNull();
    expect(out.error).toMatch(/SecurityError/);
  });

  it('no service worker at all is a result too', async () => {
    const out = await registerDoorWorker({ navigator: {}, location: { pathname: '/poetech-app/' } });
    expect(out).toMatchObject({ registration: null, error: 'no-service-worker' });
  });
});

describe('retireRootRegistration — the phone keeps ringing through the move', () => {
  it('with a root registration and NO subscription: unregisters it, nothing to move', async () => {
    const root = fakeReg('/');
    const f = fakeNavigator({ regs: [root] });
    const out = await registerDoorWorker({ navigator: f.navigator, location: { pathname: '/poetech-app/', origin: ORIGIN } });
    expect(root.unregistered).toBe(true);
    expect(out.migrated).toMatchObject({ sub: false, unregistered: true, reason: 'no-subscription' });
  });

  it('carries the subscription to the door with the SAME server key, moves the row, then retires the root', async () => {
    const key = new Uint8Array([4, 9, 9]);
    const oldSub = fakeSub({ endpoint: 'https://push/old', key });
    const root = fakeReg('/', { sub: oldSub });
    const f = fakeNavigator({ regs: [root] });
    const moves = [];
    const moveRow = async (from, sub) => { moves.push({ from, to: sub.endpoint }); return { ok: true, moved: 1 }; };
    const out = await registerDoorWorker({ navigator: f.navigator, location: { pathname: '/poetech-app/', origin: ORIGIN }, moveRow });
    const door = f.regs.find((r) => r.scope === ORIGIN + '/poetech-app/');
    expect(door.subscribeCalls).toHaveLength(1);
    expect(door.subscribeCalls[0].applicationServerKey).toBe(key);
    expect(door.subscribeCalls[0].userVisibleOnly).toBe(true);
    expect(moves).toEqual([{ from: 'https://push/old', to: 'https://push/new-/poetech-app/' }]);
    expect(oldSub.alive).toBe(false);
    expect(root.unregistered).toBe(true);
    expect(out.migrated).toEqual({ sub: true, row: true, unregistered: true, reason: 'moved' });
  });

  it('PROVEN-TO-CATCH: if the row cannot be moved, the OLD subscription stays alive and the root stays registered', async () => {
    const oldSub = fakeSub({ endpoint: 'https://push/old' });
    const root = fakeReg('/', { sub: oldSub });
    const f = fakeNavigator({ regs: [root] });
    const moveRow = async () => ({ ok: false, error: 'not-signed-in' });
    const out = await registerDoorWorker({ navigator: f.navigator, location: { pathname: '/poetech-app/', origin: ORIGIN }, moveRow });
    expect(oldSub.alive, 'tearing this down would silence the phone').toBe(true);
    expect(root.unregistered).toBe(false);
    expect(out.migrated).toMatchObject({ sub: true, row: false, unregistered: false, reason: 'row-move-failed' });
  });

  it('if the door cannot subscribe, nothing is torn down', async () => {
    const oldSub = fakeSub({ endpoint: 'https://push/old' });
    const root = fakeReg('/', { sub: oldSub });
    const f = fakeNavigator({ regs: [root] });
    // Make the NEW registration's subscribe fail.
    f.navigator.serviceWorker.register = async (url, opts) => { const r = fakeReg(opts.scope, { subscribeFails: true }); f.regs.push(r); return r; };
    const out = await retireRootRegistration({ sw: f.navigator.serviceWorker, registration: await f.navigator.serviceWorker.register('/sw.js', { scope: '/poetech-app/' }), origin: ORIGIN, moveRow: async () => ({ ok: true }) });
    expect(oldSub.alive).toBe(true);
    expect(root.unregistered).toBe(false);
    expect(out.reason).toBe('resubscribe-failed');
  });

  it('is idempotent: a second boot finds no root registration and touches nothing', async () => {
    const f = fakeNavigator({ regs: [fakeReg('/poetech-app/')] });
    const out = await retireRootRegistration({ sw: f.navigator.serviceWorker, registration: f.regs[0], origin: ORIGIN });
    expect(out.reason).toBe('none');
  });
});

describe('rowMoverFor — the row follows the endpoint, only for a signed-in person', () => {
  function fakeSupabase({ session = { user: { id: 'u1' } }, rows = [{ endpoint: 'new' }], error = null } = {}) {
    const log = [];
    const q = {
      update: (v) => { log.push(['update', v]); return q; },
      eq: (k, v) => { log.push(['eq', k, v]); return q; },
      select: (s) => { log.push(['select', s]); return Promise.resolve({ data: rows, error }); },
    };
    return { log, client: { auth: { getSession: async () => ({ data: { session } }) }, from: (t) => { log.push(['from', t]); return q; } } };
  }

  it('updates endpoint + keys on the old endpoint and reports the moved count', async () => {
    const s = fakeSupabase();
    const out = await rowMoverFor(s.client)('https://push/old', fakeSub({ endpoint: 'https://push/new' }));
    expect(out).toEqual({ ok: true, moved: 1 });
    expect(s.log[0]).toEqual(['from', 'push_subscriptions']);
    expect(s.log[1][1]).toMatchObject({ endpoint: 'https://push/new', p256dh: 'p-https://push/new', auth: 'a-https://push/new' });
    expect(s.log[2]).toEqual(['eq', 'endpoint', 'https://push/old']);
  });

  it('signed OUT refuses (0 rows would otherwise read as success)', async () => {
    const s = fakeSupabase({ session: null });
    const out = await rowMoverFor(s.client)('https://push/old', fakeSub({ endpoint: 'https://push/new' }));
    expect(out).toEqual({ ok: false, error: 'not-signed-in' });
    expect(s.log.find((l) => l[0] === 'update')).toBeUndefined();
  });

  it('a database error is a result', async () => {
    const s = fakeSupabase({ error: { message: 'boom' } });
    const out = await rowMoverFor(s.client)('https://push/old', fakeSub({ endpoint: 'https://push/new' }));
    expect(out).toEqual({ ok: false, error: 'boom' });
  });
});

describe('the registration that exists is the registration described', () => {
  it('main.jsx registers through registerDoorWorker and no longer at the bare root', () => {
    const main = readFileSync(join(HERE, '..', 'main.jsx'), 'utf8');
    expect(main).toMatch(/registerDoorWorker\(/);
    expect(main).not.toContain("register('/sw.js')");
  });
});
