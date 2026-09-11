// The clock behind the idle lock — and the four ways it must refuse to fire.
//
// Darrell 2026-09-11: "add a timer so it logs the person out after so long of
// not doing work inside the app however on media tabs and modules make sure
// they are able to watch sermons and read lessons without the app doing
// anything... also maybe just lock it so they have to log in after 5 minutes or
// so and NEVER when on media tabs and others that don't matter..." and, asked
// who it applies to: "staff only..."
//
// lib/idle-lock.js holds the rules and is tested on its own. This file is about
// the half that touches a browser: does real activity reset it, does a person
// mid-sentence keep their sentence, and does the full-screen reader stop it
// dead no matter which surface it was opened from.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useIdleLock, hasUnsavedTyping, isBeingReadTo, ACTIVITY_EVENTS, TICK_MS } from '../lib/use-idle-lock.jsx';
import { IDLE_LOCK_NOTICE, DEFAULT_IDLE_MS } from '../lib/idle-lock.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

const STAFF = { isStaff: true, signedIn: true, canLock: true, view: 'books', churchView: '' };

function harness(props) {
  const locks = [];
  let clock = 1000;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  function Probe(p) { useIdleLock(p); return null; }
  const render = (extra = {}) => act(() => {
    root.render(createElement(Probe, { ...props, ...extra, now: () => clock, onLock: (n) => locks.push(n) }));
  });
  return {
    locks, container, root, render,
    advance: (ms) => { clock += ms; },
    tick: (times = 1) => act(() => { vi.advanceTimersByTime(TICK_MS * times); }),
    cleanup: () => { act(() => root.unmount()); container.remove(); },
  };
}

describe('it locks when it should', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('locks a STAFF member after the quiet window, once, with the notice', () => {
    const h = harness(STAFF);
    h.render();
    h.tick();
    expect(h.locks).toEqual([]);
    h.advance(DEFAULT_IDLE_MS + 1);
    h.tick();
    expect(h.locks).toEqual([IDLE_LOCK_NOTICE]);
    // ...and NOT again on every following tick.
    h.tick(3);
    expect(h.locks.length).toBe(1);
    h.cleanup();
  });

  it('the notice is a LOCK, not a sign-out, and says so', () => {
    expect(IDLE_LOCK_NOTICE).toMatch(/you have not been signed out/i);
    expect(IDLE_LOCK_NOTICE).toMatch(/nothing was lost/i);
    expect(IDLE_LOCK_NOTICE).not.toMatch(/signed you out|logged out/i);
  });

  it('real activity resets the clock', () => {
    const h = harness(STAFF);
    h.render();
    h.advance(DEFAULT_IDLE_MS - 1000);
    act(() => { window.dispatchEvent(new Event('pointerdown')); });
    h.advance(2000);
    h.tick();
    expect(h.locks, 'a pointer down two seconds ago is not idle').toEqual([]);
    h.cleanup();
  });
});

describe('THE FOUR REFUSALS — every one of these keeps somebody in', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const goesQuiet = (props) => {
    const h = harness(props);
    h.render();
    h.advance(DEFAULT_IDLE_MS * 3);
    h.tick(2);
    const out = h.locks.slice();
    h.cleanup();
    return out;
  };

  it('never locks a congregant — staff only', () => {
    expect(goesQuiet({ ...STAFF, isStaff: false })).toEqual([]);
  });

  it('never locks on a RESTFUL surface — a sermon, a lesson, the Word', () => {
    for (const [view, churchView] of [['library', ''], ['tvtime', ''], ['church', 'learn'], ['church', 'pulpit'], ['church', 'scripture']]) {
      expect(goesQuiet({ ...STAFF, view, churchView }), `${view}/${churchView}`).toEqual([]);
    }
  });

  it('never locks over what somebody is in the middle of typing', () => {
    const input = document.createElement('input');
    input.defaultValue = '';
    input.value = 'a prayer request half written';
    document.body.appendChild(input);
    expect(goesQuiet(STAFF)).toEqual([]);
    input.remove();
  });

  it('never locks when there is no way back in', () => {
    // canLock false = no PIN / backend down. Locking here would be a lockout,
    // which is the exact harm the no-lockout work exists to prevent.
    expect(goesQuiet({ ...STAFF, canLock: false })).toEqual([]);
    expect(goesQuiet({ ...STAFF, signedIn: false })).toEqual([]);
  });
});

describe('the full-screen reader stops it, from ANY surface', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a Presenter open over a NON-restful tab still refuses to lock', () => {
    const reader = document.createElement('div');
    reader.setAttribute('data-reading', 'true');
    document.body.appendChild(reader);
    const h = harness({ ...STAFF, view: 'books' });   // books is not restful
    h.render();
    h.advance(DEFAULT_IDLE_MS * 3);
    h.tick(2);
    expect(h.locks, 'somebody being read to was locked out mid-sentence').toEqual([]);
    h.cleanup();
    reader.remove();
  });

  it('isBeingReadTo reads the marker the Presenter actually writes', () => {
    expect(isBeingReadTo()).toBe(false);
    const src = read('components/Presenter.jsx');
    // Count the ATTRIBUTE, not the word: the file also explains the marker in a
    // comment above the component, and counting that would pass while a root
    // quietly lost its attribute.
    const roots = (src.match(/\}\} data-reading="true"/g) || []).length;
    expect(roots, 'every Presenter root must carry the marker').toBe(3);
    // ...and the three roots are all of them.
    expect((src.match(/role="dialog"/g) || []).length).toBe(3);
  });
});

describe('hasUnsavedTyping', () => {
  it('sees a field holding text it did not start with', () => {
    const doc = new DOMParser().parseFromString('<input id="a">', 'text/html');
    const f = doc.getElementById('a');
    expect(hasUnsavedTyping(doc)).toBe(false);
    f.value = 'typed';
    expect(hasUnsavedTyping(doc)).toBe(true);
  });
  it('ignores a field that still holds what it was given', () => {
    const doc = new DOMParser().parseFromString('<input id="a" value="preset">', 'text/html');
    expect(hasUnsavedTyping(doc)).toBe(false);
  });
  it('ignores hidden, disabled and read-only fields', () => {
    const doc = new DOMParser().parseFromString('<input type="hidden" id="h"><input id="d" disabled><input id="r" readonly>', 'text/html');
    for (const id of ['h', 'd', 'r']) doc.getElementById(id).value = 'x';
    expect(hasUnsavedTyping(doc)).toBe(false);
  });
  it('a DOM that will not answer counts as typing — an unknown never locks', () => {
    expect(hasUnsavedTyping({ get activeElement() { throw new Error('no'); } })).toBe(true);
    expect(hasUnsavedTyping(null)).toBe(false);
  });
});

describe('the shell wiring', () => {
  const shell = read('poe-financial-mvp-v28.jsx');

  it('runs the lock for staff and the family, and nobody else', () => {
    expect(shell).toMatch(/useIdleLock\(\{ isStaff: isChurchStaff \|\| isFamilyMember/);
  });
  it('locks by clearing the PIN — it does NOT sign anybody out', () => {
    expect(shell).toMatch(/setMpPinVerified\(false\)/);
    expect(shell).toMatch(/onLock: \(n\) => \{ setIdleLockNotice\(n\)/);
  });
  it('only arms when there is a PIN to get back in with', () => {
    expect(shell).toMatch(/canLock: mpEnforce && mpHasPin/);
  });
  it('the gate SAYS what happened instead of demanding a PIN out of nowhere', () => {
    expect(shell).toMatch(/idleLockNotice \|\| \(mpHasBiometric/);
  });
  it('and the notice does not outlive the lock it explains', () => {
    expect(shell).toMatch(/setMpPinVerified\(true\); setIdleLockNotice\(''\)/);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('CATCHES a lock that fired on a lesson', () => {
    const h = harness({ ...STAFF, view: 'church', churchView: 'learn' });
    h.render();
    h.advance(DEFAULT_IDLE_MS * 10);
    h.tick(5);
    expect(h.locks).toEqual([]);
    h.cleanup();
  });

  it('CATCHES a lock that never fires at all — the gate must be real', () => {
    const h = harness(STAFF);
    h.render();
    h.advance(DEFAULT_IDLE_MS + 1);
    h.tick();
    expect(h.locks.length, 'the lock never fired, so none of the refusals above mean anything').toBe(1);
    h.cleanup();
  });

  it('listens for real gestures, not for a timer pretending to be one', () => {
    expect(ACTIVITY_EVENTS).toContain('pointerdown');
    expect(ACTIVITY_EVENTS).toContain('keydown');
    expect(ACTIVITY_EVENTS).not.toContain('timeupdate');
  });
});
