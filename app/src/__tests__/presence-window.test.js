// =============================================================================
// A PIN proved on this device is not re-demanded in the next tab
// =============================================================================
// Darrell, twice: "keeps signing me in on every tab!!!!!!!!!!" (2026-09-07) and
// "She should never be logged [out] or not able to get in!!!!! Device info
// other data.... her husband is trying to act as a user... me too"
// (2026-09-16, several people testing the Moore Divahs door at once).
//
// The cause was measured, not guessed: the proof lived in sessionStorage, which
// is per-TAB, so any second tab started empty and the gate asked again.
//
// These pins hold the fix at exactly the width it was given — a bounded window
// equal to the idle lock, never wider — because the tempting "just use
// localStorage" version would keep a stranger's tab unlocked forever and quietly
// undo the matrix Darrell locked (lib/multi-point-auth.js).
// =============================================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withinWindow, markPresence, presenceStillValid, clearPresence,
  presenceKey, PRESENCE_WINDOW_MS,
} from '../lib/presence-window.js';
import { DEFAULT_IDLE_MS } from '../lib/idle-lock.js';

// A storage double that behaves like the real thing, including the throwing
// variety a private window hands back.
const makeStore = ({ throws = false } = {}) => {
  const map = new Map();
  return {
    getItem: (k) => { if (throws) throw new Error('blocked'); return map.has(k) ? map.get(k) : null; },
    setItem: (k, v) => { if (throws) throw new Error('blocked'); map.set(k, String(v)); },
    removeItem: (k) => { if (throws) throw new Error('blocked'); map.delete(k); },
    _map: map,
  };
};

const install = (session, local) => {
  vi.stubGlobal('window', { sessionStorage: session, localStorage: local });
};

beforeEach(() => { vi.unstubAllGlobals(); });

describe('the window is the idle lock, never wider', () => {
  it('is tied to the idle lock rather than a number picked by hand', () => {
    expect(PRESENCE_WINDOW_MS).toBe(DEFAULT_IDLE_MS);
  });

  it('accepts a proof inside the window', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    expect(withinWindow('2026-09-16T11:58:00Z', now)).toBe(true);
  });

  it('CATCHES a proof past the window — the whole point of bounding it', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    expect(withinWindow('2026-09-16T11:50:00Z', now)).toBe(false);
  });

  it('refuses a proof exactly at the edge (the boundary is closed)', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    const edge = new Date(now - PRESENCE_WINDOW_MS).toISOString();
    expect(withinWindow(edge, now)).toBe(false);
  });

  it('CATCHES a future-dated proof, which would otherwise never expire', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    expect(withinWindow('2026-09-16T12:30:00Z', now)).toBe(false);
  });

  it('refuses junk and emptiness rather than trusting them', () => {
    const now = Date.now();
    for (const bad of ['', null, undefined, 'not-a-date', '{}']) {
      expect(withinWindow(bad, now)).toBe(false);
    }
  });
});

describe('the second tab — the actual complaint', () => {
  it('a NEW tab adopts a proof the first tab just gave', () => {
    const local = makeStore();
    // Tab one verifies.
    install(makeStore(), local);
    markPresence('u1');
    // Tab two starts with its own empty sessionStorage, same localStorage.
    install(makeStore(), local);
    expect(presenceStillValid('u1', Date.now())).toBe(true);
  });

  it('CATCHES the regression: a proof kept ONLY per-tab fails the new tab', () => {
    // This is the shipped behaviour the fix replaces, reproduced exactly.
    const sessionOnly = makeStore();
    install(sessionOnly, makeStore());
    sessionOnly.setItem(presenceKey('u1'), new Date().toISOString());
    install(makeStore(), makeStore()); // a fresh tab, nothing shared
    expect(presenceStillValid('u1', Date.now())).toBe(false);
  });

  it('a new tab opened AFTER the window still asks for the PIN', () => {
    const local = makeStore();
    install(makeStore(), local);
    markPresence('u1', new Date(Date.parse('2026-09-16T12:00:00Z')).toISOString());
    install(makeStore(), local);
    const later = Date.parse('2026-09-16T12:00:00Z') + PRESENCE_WINDOW_MS + 1000;
    expect(presenceStillValid('u1', later)).toBe(false);
  });

  it('the verifying tab keeps its own proof for as long as it lives', () => {
    const session = makeStore();
    install(session, makeStore());
    markPresence('u1', new Date(Date.parse('2026-09-16T12:00:00Z')).toISOString());
    // Hours later, same tab: unchanged from the behaviour before this module.
    const muchLater = Date.parse('2026-09-16T20:00:00Z');
    expect(presenceStillValid('u1', muchLater)).toBe(true);
  });

  it('one person’s proof is never another person’s', () => {
    const local = makeStore();
    install(makeStore(), local);
    markPresence('shay');
    install(makeStore(), local);
    expect(presenceStillValid('shay', Date.now())).toBe(true);
    expect(presenceStillValid('her-husband', Date.now())).toBe(false);
  });
});

describe('it fails CLOSED, never open', () => {
  it('storage that throws reads as no proof at all', () => {
    install(makeStore({ throws: true }), makeStore({ throws: true }));
    expect(presenceStillValid('u1', Date.now())).toBe(false);
    expect(() => markPresence('u1')).not.toThrow();
    expect(() => clearPresence('u1')).not.toThrow();
  });

  it('no window at all (server render) reads as no proof', () => {
    vi.stubGlobal('window', undefined);
    expect(presenceStillValid('u1', Date.now())).toBe(false);
  });

  it('a session store that throws still lets the shared marker answer', () => {
    const local = makeStore();
    install(makeStore(), local);
    markPresence('u1');
    install(makeStore({ throws: true }), local);
    expect(presenceStillValid('u1', Date.now())).toBe(true);
  });
});

describe('clearing means gone, in both stores', () => {
  it('a forgotten PIN drops the proof everywhere, so no tab can carry it', () => {
    const session = makeStore();
    const local = makeStore();
    install(session, local);
    markPresence('u1');
    clearPresence('u1');
    expect(session._map.size).toBe(0);
    expect(local._map.size).toBe(0);
    install(makeStore(), local);
    expect(presenceStillValid('u1', Date.now())).toBe(false);
  });
});
