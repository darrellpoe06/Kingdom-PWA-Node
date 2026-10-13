// =============================================================================
// use-idle-lock — the clock behind the idle lock decision core
// =============================================================================
// Darrell 2026-09-11: "also add a timer so it logs the person out after so long
// of not doing work inside the app however on media tabs and modules make sure
// they are able to watch sermons and read lessons without the app doing
// anything... also maybe just lock it so they have to log in after 5 minutes or
// so and NEVER when on media tabs and others that don't matter..." and, when
// asked who it should apply to: "staff only..."
//
// lib/idle-lock.js already holds the DECISION — staff only, never on a restful
// surface, never over unsaved typing, and the window. This is the only thing it
// was missing: a clock, real activity, and a way to say what happened. The two
// are deliberately separate so the rules are provable without a browser and
// this file stays small enough to read in one sitting.
//
// WHAT COUNTS AS ACTIVITY, and what does not. Pointer, key, scroll and touch
// count. A background timer firing does not. Neither does a video playing —
// which sounds wrong until you remember that watching a sermon IS one of the
// surfaces the lock must never fire on, so it never needed to count as activity
// in the first place; the surface rule already covers it, and covering it twice
// would hide a bug in either one.
//
// THE FAILURE DIRECTION IS CHOSEN. Every uncertainty here resolves toward NOT
// locking: an unknown role does not lock, a missing clock does not lock, a
// half-typed form does not lock. A missed lock is a risk; a person shut out of
// their own church's app mid-sentence is a person shut out.
// =============================================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { idleDecision, DEFAULT_IDLE_MS, IDLE_LOCK_NOTICE } from './idle-lock.js';

/** The events that mean a person is here. */
export const ACTIVITY_EVENTS = Object.freeze([
  'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'focusin',
]);

/** How often the decision is re-checked. Coarse on purpose — this is a lock, not a stopwatch. */
export const TICK_MS = 15 * 1000;

/**
 * Is somebody in the middle of typing something the app has not got yet?
 *
 * Deliberately DOM-shaped rather than state-shaped: the shell cannot know about
 * every form in every lazy-loaded surface, and a lock that interrupts a
 * half-written prayer request is the exact harm this guards against. Two
 * signals, both conservative:
 *   - a text field currently focused, whatever is in it
 *   - a field holding text it did not start with
 * A search box is included on purpose. Somebody mid-search is mid-thought.
 */
export function hasUnsavedTyping(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return false;
  try {
    const active = doc.activeElement;
    if (active && /^(INPUT|TEXTAREA)$/.test(active.tagName || '')) return true;
    if (active && active.isContentEditable) return true;
    const fields = doc.querySelectorAll('input, textarea');
    for (const f of fields) {
      if (f.type === 'hidden' || f.disabled || f.readOnly) continue;
      const now = String(f.value ?? '');
      const was = String(f.defaultValue ?? '');
      if (now.trim() !== '' && now !== was) return true;
    }
    return false;
  } catch {
    // A DOM that will not answer is an unknown, and an unknown does not lock.
    return true;
  }
}

/**
 * Is the full-screen reader up? It can be opened from ANY surface, so the shell
 * cannot know — the Presenter marks itself in the DOM instead (data-reading),
 * and this is the only place that marker is read. A person being read to
 * outranks every other rule (idle-lock.js `presenting`).
 */
export function isBeingReadTo(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return false;
  try { return !!doc.querySelector('[data-reading="true"]'); } catch { return false; }
}

/**
 * Run the idle lock.
 *
 * @param {object}   opts
 * @param {boolean}  opts.isStaff   ONLY staff are locked (Darrell, 2026-09-11)
 * @param {boolean}  opts.signedIn
 * @param {boolean}  opts.canLock   false when there is no PIN to get back in with
 * @param {string}   opts.view      the top-level surface id
 * @param {string}   opts.churchView the church sub-tab id
 * @param {boolean}  opts.presenting
 * @param {function} opts.onLock    called ONCE per lock, with the notice
 * @param {number}   [opts.idleMs]
 * @returns {{ msRemaining, reason, notice, markActive }}
 */
export function useIdleLock({
  isStaff = false, signedIn = false, canLock = false,
  view = '', churchView = '', presenting = false,
  onLock = null, idleMs = DEFAULT_IDLE_MS,
  now = () => Date.now(),
} = {}) {
  const lastActivityAt = useRef(now());
  const locked = useRef(false);
  const [state, setState] = useState({ msRemaining: idleMs, reason: 'active' });

  const markActive = useCallback(() => {
    lastActivityAt.current = now();
    locked.current = false;
  }, [now]);

  // Real activity only.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const on = () => { lastActivityAt.current = now(); };
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, on, { passive: true, capture: true });
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, on, { capture: true });
    };
  }, [now]);

  // Moving to a different surface is activity too — and it re-runs the decision
  // immediately, so stepping OFF a sermon onto a staff screen starts the clock
  // rather than inheriting a five-minute-old one.
  useEffect(() => { lastActivityAt.current = now(); }, [view, churchView, now]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const tick = () => {
      const d = idleDecision({
        now: now(),
        lastActivityAt: lastActivityAt.current,
        view, churchView, presenting: presenting || isBeingReadTo(),
        hasUnsavedInput: hasUnsavedTyping(),
        signedIn, canLock, isStaff, idleMs,
      });
      setState({ msRemaining: d.msRemaining, reason: d.reason });
      if (d.lock && !locked.current) {
        locked.current = true;
        if (typeof onLock === 'function') onLock(IDLE_LOCK_NOTICE);
      }
    };
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [view, churchView, presenting, signedIn, canLock, isStaff, idleMs, onLock, now]);

  return { ...state, notice: IDLE_LOCK_NOTICE, markActive };
}

export { IDLE_LOCK_NOTICE, DEFAULT_IDLE_MS };
