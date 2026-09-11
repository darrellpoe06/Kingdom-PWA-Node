// @vitest-environment node
//
// The idle lock, and the sermon it must never interrupt.
//
// Darrell, 2026-09-11: "add a timer so it logs the person out after so long of
// not doing work inside the app however on media tabs and modules make sure
// they are able to watch sermons and read lessons without the app doing
// anything... maybe just lock it so they have to log in after 5 minutes or so
// and never when on media tabs and others that don't matter."
//
// The first half is trivial. The second half is the whole engineering problem:
// a person watching a 40-minute message touches NOTHING for 40 minutes, so a
// plain idle timer throws a sign-in box over the middle of the sermon. These
// tests exist mostly to make that impossible.
import { describe, it, expect } from 'vitest';
import {
  idleDecision, isRestfulSurface, DEFAULT_IDLE_MS, IDLE_LOCK_NOTICE,
  RESTFUL_TOP_VIEWS, RESTFUL_CHURCH_SUBS,
} from '../lib/idle-lock.js';
import { SURFACES } from '../surfaces.js';

const T0 = 1_700_000_000_000;
const after = (mins) => T0 + mins * 60_000;
// A STAFF member on a work surface — the only person this feature touches at all.
const work = { lastActivityAt: T0, view: 'church', churchView: 'bus', isStaff: true };

describe('the window itself', () => {
  it('is five minutes, as declared', () => {
    expect(DEFAULT_IDLE_MS).toBe(5 * 60 * 1000);
  });

  it('does not lock inside the window, and reports the time left', () => {
    const d = idleDecision({ ...work, now: after(4) });
    expect(d.lock).toBe(false);
    expect(d.reason).toBe('active');
    expect(d.msRemaining).toBe(60_000);
  });

  it('locks once the window passes on a work surface', () => {
    expect(idleDecision({ ...work, now: after(6) })).toMatchObject({ lock: true, reason: 'idle' });
  });

  it('locks exactly AT the boundary, not a tick before', () => {
    expect(idleDecision({ ...work, now: T0 + DEFAULT_IDLE_MS - 1 }).lock).toBe(false);
    expect(idleDecision({ ...work, now: T0 + DEFAULT_IDLE_MS }).lock).toBe(true);
  });

  it('honours a widened window', () => {
    expect(idleDecision({ ...work, now: after(6), idleMs: 30 * 60_000 }).lock).toBe(false);
  });
});

describe('THE SERMON RULE — reading and watching ARE using the app', () => {
  it('NEVER locks during a sermon, however long it runs', () => {
    for (const mins of [6, 20, 45, 90]) {
      const d = idleDecision({ ...work, churchView: 'pulpit', now: after(mins) });
      expect(d.lock, `${mins} minutes into a sermon`).toBe(false);
      expect(d.reason).toBe('restful-surface');
    }
  });

  it('never locks on any restful church surface', () => {
    for (const sub of RESTFUL_CHURCH_SUBS) {
      expect(idleDecision({ ...work, churchView: sub, now: after(90) }).lock, sub).toBe(false);
    }
  });

  it('never locks on any restful top-level surface', () => {
    for (const view of RESTFUL_TOP_VIEWS) {
      expect(idleDecision({ lastActivityAt: T0, view, isStaff: true, now: after(90) }).lock, view).toBe(false);
    }
  });

  it('never locks while the big reader is open, wherever it was opened from', () => {
    // ▶ Play can be pressed from a work surface; the person is still being READ to.
    expect(idleDecision({ ...work, presenting: true, now: after(90) }).lock).toBe(false);
  });

  it('the clock RESETS rather than pauses — an hour of reading is not idleness', () => {
    // The decision never accumulates while restful, so the moment the person
    // moves to a work surface the caller records fresh activity and gets a full
    // window. Pinned as the property: a restful surface always reports the FULL
    // window remaining, never a partly-spent one.
    const d = idleDecision({ ...work, churchView: 'scripture', now: after(60) });
    expect(d.msRemaining).toBe(DEFAULT_IDLE_MS);
  });
});

describe('never take away half-finished work', () => {
  it('DEFERS while something is typed but unsaved', () => {
    const d = idleDecision({ ...work, hasUnsavedInput: true, now: after(90) });
    expect(d.lock).toBe(false);
    expect(d.reason).toBe('unsaved-input');
  });
});

describe('STAFF ONLY — a congregant is never locked', () => {
  // Darrell, asked whether this covers everyone or staff only: "staff only".
  it('never locks a member, however long they sit', () => {
    for (const mins of [6, 60, 600]) {
      const d = idleDecision({ ...work, isStaff: false, now: after(mins) });
      expect(d.lock, `${mins} minutes as a member`).toBe(false);
      expect(d.reason).toBe('not-staff');
    }
  });

  it('DEFAULTS to locking nobody when the caller does not say who this is', () => {
    // The failure direction is deliberate: a missed lock is a risk; a wrongly
    // locked congregant is a person shut out of their own church's app.
    const { isStaff, ...unsaid } = work;
    expect(idleDecision({ ...unsaid, now: after(600) }).lock).toBe(false);
  });

  it('still locks the staff member on a work surface', () => {
    expect(idleDecision({ ...work, now: after(6) }).lock).toBe(true);
  });
});

describe('no-lockout — the gate opens rather than stranding a member', () => {
  it('does not lock when there is no way to unlock (no PIN / backend down)', () => {
    expect(idleDecision({ ...work, canLock: false, now: after(90) }))
      .toMatchObject({ lock: false, reason: 'no-lock-available' });
  });

  it('does nothing to someone who is not signed in', () => {
    expect(idleDecision({ ...work, signedIn: false, now: after(90) }).lock).toBe(false);
  });

  it('does not lock on nonsense timestamps instead of guessing', () => {
    expect(idleDecision({ ...work, lastActivityAt: undefined, now: after(90) }))
      .toMatchObject({ lock: false, reason: 'unknown-activity' });
    expect(idleDecision({}).lock).toBe(false);
  });

  it('says it is a LOCK, not a sign-out, why it happened, and that nothing was lost', () => {
    expect(IDLE_LOCK_NOTICE).toMatch(/other people/i);
    expect(IDLE_LOCK_NOTICE).toMatch(/not been signed out/i);
    expect(IDLE_LOCK_NOTICE).toMatch(/where you were/i);
    expect(IDLE_LOCK_NOTICE).toMatch(/PIN/);
  });
});

describe('the restful list names REAL surfaces', () => {
  const topIds = new Set(SURFACES.filter((s) => s.nav === 'top').map((s) => s.view));
  const churchSubs = new Set(SURFACES.filter((s) => s.nav === 'church').map((s) => s.sub));

  it('every restful top-level view exists in the registry', () => {
    for (const v of RESTFUL_TOP_VIEWS) expect(topIds, v).toContain(v);
  });

  it('every restful church sub-tab exists in the registry', () => {
    for (const s of RESTFUL_CHURCH_SUBS) expect(churchSubs, s).toContain(s);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a timer that would interrupt the sermon', () => {
    // The exact regression: treat pulpit as ordinary and it locks at 6 minutes.
    expect(idleDecision({ ...work, churchView: 'pulpit', now: after(6) }).lock).toBe(false);
    expect(idleDecision({ ...work, churchView: 'bus', now: after(6) }).lock).toBe(true);
  });

  it('CATCHES a lock that fires on a congregant', () => {
    expect(idleDecision({ ...work, isStaff: false, now: after(600) }).lock).toBe(false);
  });

  it('CATCHES a lock that never fires at all', () => {
    // A "safe" implementation that always returns false would pass every test
    // above except this one.
    expect(idleDecision({ ...work, now: after(10) }).lock).toBe(true);
  });

  it('CATCHES a restful list that drifted off the real surfaces', () => {
    expect(isRestfulSurface({ view: 'church', churchView: 'not-a-real-sub' })).toBe(false);
    expect(isRestfulSurface({ view: 'not-a-real-view' })).toBe(false);
  });
});
