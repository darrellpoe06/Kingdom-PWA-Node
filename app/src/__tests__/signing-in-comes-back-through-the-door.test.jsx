// =============================================================================
// Signing in comes back through the door (DR-0954)
// =============================================================================
// Christina, 2026-10-11, relayed by Darrell:
//   "When I sign in as then I click on I live here. I then go to the other
//    sign in page and it is a loop as it goes straight to these 3 pages over
//    and over. Can you fix this. This is Christina"
//
// Three screens, for ever: "Who are you?" -> "I live here" -> the sign-in
// form -> back to "Who are you?" with "You signed out of Poe Properties on
// this device."
//
// THE WHOLE LOOP WAS ONE MISSING CALL. Leaving this door writes a per-door
// flag (leaveDoor), and doorSession hides the session while it is set.
// enterDoor clears it, and its own docstring says it is "called whenever a
// sign-in succeeds at that door" — the sign-in call site never called it. So
// she signed in SUCCESSFULLY, the page reloaded, the flag was still there,
// and the door still believed she had left.
//
// Tested at the seam that actually failed: the door-session contract, plus
// the wiring that the signed-in handler re-enters the door.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOORS, doorSession, leaveDoor, enterDoor } from '../lib/door-session.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** A localStorage that behaves like the real one. */
function fakeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    get size() { return m.size; },
  };
}

const SESSION = { user: { id: 'christina' } };
let store;
beforeEach(() => { store = fakeStore(); });

describe("Christina's loop", () => {
  it('PROVEN-TO-CATCH: a door she left keeps hiding her until something re-enters it', async () => {
    // 1. She leaves the door at some point.
    leaveDoor(DOORS.properties, store);
    expect(doorSession(DOORS.properties, SESSION, store)).toEqual({ session: null, left: true });

    // 2. She signs in again — a real, successful Supabase session.
    //    WITHOUT enterDoor, this is exactly what she met: still left.
    expect(
      doorSession(DOORS.properties, SESSION, store).left,
      'a successful sign-in alone was enough to get back in — then there was no loop to fix',
    ).toBe(true);

    // 3. Re-entering the door is what ends it.
    enterDoor(DOORS.properties, store);
    expect(doorSession(DOORS.properties, SESSION, store)).toEqual({ session: SESSION, left: false });
  });

  it('PROVEN-TO-CATCH: the sign-in handler re-enters the door before reloading', () => {
    // This is a claim about WIRING — which call site runs enterDoor — and no
    // render can show it, because the loop only appears across a reload that
    // jsdom does not perform. Pinned to the one line that caused it.
    const src = readFileSync(join(HERE, '../components/PropertiesDoor.jsx'), 'utf8');
    const handler = /onSignedIn=\{\(\)\s*=>\s*\{([^}]*)\}\}/.exec(src);
    expect(handler, 'the sign-in handler is no longer a block — re-check this pin').toBeTruthy();
    expect(
      /enterDoor\(DOORS\.properties\)/.test(handler[1]),
      'signing in does not re-enter the door, so a person who left it loops for ever',
    ).toBe(true);
    // Order matters: clearing the flag after a reload never runs.
    expect(handler[1].indexOf('enterDoor')).toBeLessThan(handler[1].indexOf('reload'));
  });

  it('leaving is still leaving — this does not weld the door open', () => {
    enterDoor(DOORS.properties, store);
    expect(doorSession(DOORS.properties, SESSION, store).left).toBe(false);
    leaveDoor(DOORS.properties, store);
    expect(doorSession(DOORS.properties, SESSION, store).left).toBe(true);
  });

  it('one door is not the other — leaving Properties leaves PoeTech alone', () => {
    leaveDoor(DOORS.properties, store);
    const other = Object.values(DOORS).find((d) => d !== DOORS.properties);
    if (other) expect(doorSession(other, SESSION, store).left).toBe(false);
  });
});
