// @vitest-environment node
// =============================================================================
// Nothing interrupts you USING the app, either (DR-1130)
// =============================================================================
// Darrell 2026-10-20, using the app while it was being rebuilt under him:
//
//   "When using the app at times, the app flashes and undermines me using the
//    app while building the app. So production environment and a testing
//    environment may be necessary. Thoughts?"
//
// THE SYMPTOM IS REAL AND THE CAUSE IS ONE LINE OF POLICY. sw-update.js says it
// of itself: "SEAMLESS BY DEFAULT: on detecting a pending worker we auto
// skip-wait it, so the controllerchange -> single reload happens with NO user
// action" and "never a decision the user must make". That is RIGHT for a reader
// — the family opens the app, it quietly updates, no banner to dismiss. It is
// WRONG for the one person using the app while it is rebuilt several times an
// hour. Merge = deploy (DR-0054), and three merges landed the day he said this.
//
// WHAT WAS ALREADY THERE, AND THE GAP. sw-update.js ALREADY defers the reload
// through whenIntakeFree (DR-0748, built after a multi-minute spoken message
// was lost). But intake-guard knew six kinds — recording, recording-kept,
// dictation, typing, reading, download — and every one of them protects WORDS
// COMING IN. None protected a person reading a board, tapping between tabs or
// scrolling a lesson. The guard protected his words; it did not protect his
// session, which is exactly what he described.
//
// AND THE WINDOW MATTERS AS MUCH AS THE KIND. QUIET_MS is 3 s, right for words
// (a Stop then an immediate Send must not be cut in two) and wrong for reading,
// where pauses over three seconds happen constantly. USE_IDLE_MS is 45 s: long
// enough that reading does not release the hold, short enough that putting the
// phone down lets the update land before the next look. Both bounds are checked
// below, because either one alone leaves the flash in place.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  watchUse, holdIntake, intakeHeld, intakeKinds, intakeWords, whenIntakeFree,
  resetIntakeForTests, INTAKE_KINDS, USE_IDLE_MS, QUIET_MS, TYPING_IDLE_MS,
} from '../lib/intake-guard.js';

/** A document stub with injectable clock, so the whole lifecycle runs in Node. */
function stubDoc() {
  const handlers = new Map();
  let now = 0;
  const timers = [];
  return {
    visibilityState: 'visible',
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (handlers.has(type)) handlers.get(type).delete(fn);
    },
    fire(type) { for (const fn of handlers.get(type) || []) fn({ type }); },
    listens(type) { return (handlers.get(type) || new Set()).size > 0; },
    // --- clock
    setTimeout(cb, ms) { timers.push({ at: now + ms, cb, live: true }); return timers.length - 1; },
    clearTimeout(id) { if (timers[id]) timers[id].live = false; },
    advance(ms) {
      now += ms;
      for (const t of timers) if (t.live && t.at <= now) { t.live = false; t.cb(); }
    },
  };
}

const wire = (doc, opts = {}) => watchUse(doc, {
  setTimeout: doc.setTimeout.bind(doc), clearTimeout: doc.clearTimeout.bind(doc), ...opts,
});

beforeEach(() => { resetIntakeForTests(); });

describe('the gap this closes', () => {
  it('"use" is a kind the guard knows, beside the six that protect words', () => {
    expect(INTAKE_KINDS).toContain('use');
    for (const k of ['recording', 'recording-kept', 'dictation', 'typing', 'reading', 'download']) {
      expect(INTAKE_KINDS, 'no existing kind is dropped').toContain(k);
    }
  });

  it('and it says in plain words why the app is waiting', () => {
    expect(intakeWords(['use'])).toBe('you are using the app');
  });
});

describe('PROVEN-TO-CATCH: an update reload no longer lands mid-use', () => {
  it('a tap holds the app still, so a reload defers instead of firing', () => {
    const doc = stubDoc();
    wire(doc);
    doc.fire('pointerdown');
    expect(intakeHeld()).toBe(true);
    expect(intakeKinds()).toContain('use');

    let fired = false;
    const { deferred } = whenIntakeFree(() => { fired = true; },
      { setTimeout: doc.setTimeout.bind(doc), clearTimeout: doc.clearTimeout.bind(doc) });
    expect(deferred, 'the reload waits').toBe(true);
    expect(fired, 'and has not fired').toBe(false);
  });

  it('WITHOUT the hold the same reload fires at once — the flash, reproduced', () => {
    // The case that makes the one above mean something: unwatched, nothing
    // defers and the reload lands under the person.
    let fired = false;
    const doc = stubDoc();
    const { deferred } = whenIntakeFree(() => { fired = true; },
      { setTimeout: doc.setTimeout.bind(doc), clearTimeout: doc.clearTimeout.bind(doc) });
    expect(deferred).toBe(false);
    expect(fired, 'with no use hold it fires immediately').toBe(true);
  });

  it('a scroll and a keypress hold it too, not only a tap', () => {
    for (const ev of ['scroll', 'keydown', 'wheel', 'touchstart']) {
      resetIntakeForTests();
      const doc = stubDoc();
      wire(doc);
      doc.fire(ev);
      expect(intakeHeld(), `${ev} is use`).toBe(true);
    }
  });
});

describe('the window is sized for reading, not for typing', () => {
  it('a pause longer than QUIET_MS does NOT release it', () => {
    // The second half of the defect: a 3 s window would release while reading,
    // and the reload would land exactly where it lands today.
    const doc = stubDoc();
    wire(doc);
    doc.fire('pointerdown');
    doc.advance(QUIET_MS + 1000);
    expect(intakeHeld(), 'still reading').toBe(true);
  });

  it('but real idleness DOES release it, so an update is never starved', () => {
    // A hold that never releases is the opposite failure: stale code forever.
    const doc = stubDoc();
    wire(doc);
    doc.fire('pointerdown');
    doc.advance(USE_IDLE_MS + 1);
    expect(intakeHeld(), 'put down, so the swap may land').toBe(false);
  });

  it('each interaction re-arms the window, so continuous use keeps holding', () => {
    const doc = stubDoc();
    wire(doc);
    doc.fire('pointerdown');
    for (let i = 0; i < 5; i += 1) {
      doc.advance(USE_IDLE_MS - 1000);
      doc.fire('scroll');
      expect(intakeHeld(), `still in use at pass ${i + 1}`).toBe(true);
    }
    doc.advance(USE_IDLE_MS + 1);
    expect(intakeHeld()).toBe(false);
  });

  it('the two windows are different numbers on purpose', () => {
    expect(USE_IDLE_MS).toBeGreaterThan(QUIET_MS);
    expect(USE_IDLE_MS).toBeLessThan(TYPING_IDLE_MS);
  });
});

describe('a tab nobody is looking at is not in use', () => {
  it('hiding the tab releases at once — the best moment for the swap', () => {
    const doc = stubDoc();
    wire(doc);
    doc.fire('pointerdown');
    expect(intakeHeld()).toBe(true);
    doc.visibilityState = 'hidden';
    doc.fire('visibilitychange');
    expect(intakeHeld()).toBe(false);
  });

  it('and an event arriving in a hidden tab never takes the hold', () => {
    const doc = stubDoc();
    wire(doc);
    doc.visibilityState = 'hidden';
    doc.fire('pointerdown');
    expect(intakeHeld()).toBe(false);
  });

  it('coming back into view holds again', () => {
    const doc = stubDoc();
    wire(doc);
    doc.visibilityState = 'hidden';
    doc.fire('visibilitychange');
    doc.visibilityState = 'visible';
    doc.fire('visibilitychange');
    expect(intakeHeld()).toBe(true);
  });
});

describe('it is tidy, and it does not fight the other kinds', () => {
  it('the unwire removes every listener and drops the hold', () => {
    const doc = stubDoc();
    const off = wire(doc);
    doc.fire('pointerdown');
    expect(intakeHeld()).toBe(true);
    off();
    expect(intakeHeld(), 'released on unwire').toBe(false);
    for (const e of ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart', 'visibilitychange']) {
      expect(doc.listens(e), `${e} unhooked`).toBe(false);
    }
  });

  it('a use hold releasing does not release a recording', () => {
    const doc = stubDoc();
    wire(doc);
    const stopRecording = holdIntake('recording');
    doc.fire('pointerdown');
    doc.advance(USE_IDLE_MS + 1);
    expect(intakeHeld(), 'the recording still holds').toBe(true);
    expect(intakeKinds()).toEqual(['recording']);
    stopRecording();
    expect(intakeHeld()).toBe(false);
  });

  it('a missing or hostile document is a no-op, never a throw', () => {
    expect(() => watchUse(null)()).not.toThrow();
    expect(() => watchUse({})()).not.toThrow();
  });
});
