// =============================================================================
// Each door signs out on its own — "not dependent" (Darrell, 2026-08-28)
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  DOORS, isDoorSignedOut, leaveDoor, enterDoor, enterAllDoors, doorSession,
} from '../lib/door-session.js';

// A Storage-like double, so none of this needs a browser.
const makeStore = (seed = {}) => {
  const m = new Map(Object.entries(seed));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
};
const blocked = () => ({
  get length() { throw new Error('SecurityError'); },
  key() { throw new Error('SecurityError'); },
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); },
});

const SESSION = { access_token: 'a', user: { id: 'u1' } };

describe('leaving one door leaves one door', () => {
  it('hides the door you left and no other', () => {
    const s = makeStore();
    leaveDoor(DOORS.properties, s);
    expect(isDoorSignedOut(DOORS.properties, s)).toBe(true);
    expect(isDoorSignedOut(DOORS.poetech, s)).toBe(false);
    expect(isDoorSignedOut(DOORS.moore, s)).toBe(false);
  });

  it('never touches the session — that is the whole point', () => {
    const s = makeStore({ 'sb-abc-auth-token': JSON.stringify(SESSION) });
    leaveDoor(DOORS.properties, s);
    // The real session is still on disk: PoeTech on the same phone stays in.
    expect(s.getItem('sb-abc-auth-token')).toBe(JSON.stringify(SESSION));
  });

  it('lets you come back without signing in again', () => {
    const s = makeStore();
    leaveDoor(DOORS.properties, s);
    enterDoor(DOORS.properties, s);
    expect(isDoorSignedOut(DOORS.properties, s)).toBe(false);
  });

  it('clears every door on a real sign-out, so nothing stays shut afterwards', () => {
    const s = makeStore();
    leaveDoor(DOORS.properties, s);
    leaveDoor(DOORS.moore, s);
    enterAllDoors(s);
    expect(isDoorSignedOut(DOORS.properties, s)).toBe(false);
    expect(isDoorSignedOut(DOORS.moore, s)).toBe(false);
  });

  it('leaves unrelated keys alone when it clears', () => {
    const s = makeStore({ 'sb-abc-auth-token': 'keep', 'poe-properties-view': 'grid' });
    leaveDoor(DOORS.properties, s);
    enterAllDoors(s);
    expect(s.getItem('sb-abc-auth-token')).toBe('keep');
    expect(s.getItem('poe-properties-view')).toBe('grid');
  });
});

describe('doorSession — what the door may show, and why not', () => {
  it('shows the session when the door was not left', () => {
    const s = makeStore();
    expect(doorSession(DOORS.properties, SESSION, s)).toEqual({ session: SESSION, left: false });
  });

  it('distinguishes "you left" from "you have no account"', () => {
    // The 2026-08-28 bug was this distinction collapsing the other way: an
    // unknown rendered as "Who are you?" to a landlord with twelve doors.
    const s = makeStore();
    leaveDoor(DOORS.properties, s);
    expect(doorSession(DOORS.properties, SESSION, s)).toEqual({ session: null, left: true });
    expect(doorSession(DOORS.properties, null, s)).toEqual({ session: null, left: false });
  });
});

describe('blocked storage never locks anyone out', () => {
  it('reads as "not signed out" when storage throws', () => {
    // A private window must not silently hide a door you never left.
    expect(isDoorSignedOut(DOORS.properties, blocked())).toBe(false);
    expect(doorSession(DOORS.properties, SESSION, blocked())).toEqual({ session: SESSION, left: false });
  });

  it('reports failure instead of throwing when it cannot write', () => {
    expect(leaveDoor(DOORS.properties, blocked())).toBe(false);
    expect(enterDoor(DOORS.properties, blocked())).toBe(false);
    expect(enterAllDoors(blocked())).toBe(false);
  });

  it('is safe with a missing door name', () => {
    const s = makeStore();
    expect(isDoorSignedOut(undefined, s)).toBe(false);
    expect(leaveDoor('', s)).toBe(false);
  });
});
