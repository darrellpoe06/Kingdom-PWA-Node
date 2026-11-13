// =============================================================================
// update-while-reading — the app says when a newer version is waiting on a
// reading (DR-1503)
// =============================================================================
// Found 2026-11-13 (PR #2688): Darrell kept hearing reader faults that were
// already fixed and deployed, because the tab he had kept open was still on
// the old bundle. lib/sw-update.js finds a new build every ten minutes and
// when the tab comes back into view, then WAITS to reload while a reading
// plays (DR-0748, lib/intake-guard.js) — and told nobody. A long reading
// session stayed on the old build in silence.
//
// The wait is right: a reload never cuts a sentence in two. The silence was
// not. So while a reading is the reason the reload waits, the page shows ONE
// quiet line (components/PwaPrompts.jsx UpdatePrompt, the existing update
// toast) saying a newer version is ready, that it loads when the reading
// ends, and that a tap loads it now. The tap stops the reading cleanly first
// (the reader's own stop, registered here by useReadingHold) and reloads.
//
// Never shown when no update waits; never twice for one build; when nothing
// is reading, sw-update behaves exactly as it did. Pure module state; the
// suite drives it in plain Node with the real intake guard.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { intakeKinds, subscribeIntake, useIntakeHold } from './intake-guard.js';

export const UPDATE_READY_EVENT = 'poetech:update-ready-while-reading';
export const UPDATE_READY_WORDS = 'A newer version of the app is ready. It will load when this reading ends — or tap to load it now.';

const stoppers = new Set(); // each playing reader's own stop()
const listeners = new Set();
const offeredKeys = new Set(); // builds already offered this page-life
let offer = null; // { key, reload, cancel } while the line shows

/** Is a reading the reason the app is holding still right now? */
export function readingHeld() {
  return intakeKinds().includes('reading');
}

function announce(win) {
  const ready = !!offer;
  for (const fn of Array.from(listeners)) {
    try {
      fn(ready);
    } catch (_) {
      /* one listener never blocks another */
    }
  }
  const w = win || (typeof window !== 'undefined' ? window : null);
  try {
    if (w && typeof w.dispatchEvent === 'function') {
      const evt =
        typeof w.CustomEvent === 'function' ? new w.CustomEvent(UPDATE_READY_EVENT, { detail: { ready } }) : { type: UPDATE_READY_EVENT, detail: { ready } };
      w.dispatchEvent(evt);
    }
  } catch (_) {
    /* the event is a courtesy */
  }
}

/**
 * A reload is waiting. If a reading is (or becomes) the reason, offer the line
 * once for this build. `reload` loads the new build; `cancel` drops the
 * deferred reload so a tap does not reload twice. Returns { offered(), stop }.
 */
export function offerUpdateWhileReading({ key = 'sw', reload, cancel, win } = {}) {
  let done = false;
  let off = () => {};
  const tryOffer = () => {
    if (done || !readingHeld()) return;
    done = true;
    off();
    if (offer || offeredKeys.has(key)) return; // one line per build, one line at a time
    offeredKeys.add(key);
    offer = { key, reload, cancel };
    announce(win);
  };
  off = subscribeIntake(tryOffer);
  tryOffer();
  return {
    offered: () => !!(offer && offer.key === key),
    stop() {
      done = true;
      off();
      if (offer && offer.key === key) {
        offer = null;
        announce(win);
      }
    },
  };
}

/** Is the line showing? */
export function updateReady() {
  return !!offer;
}

/** The tap: stop every reading cleanly, drop the deferred reload, load now. */
export function loadUpdateNow() {
  const o = offer;
  if (!o) return false;
  offer = null;
  try {
    if (typeof o.cancel === 'function') o.cancel();
  } catch (_) {
    /* the reload below still runs */
  }
  for (const stop of Array.from(stoppers)) {
    try {
      stop();
    } catch (_) {
      /* a reader that fails to stop never blocks the load */
    }
  }
  if (typeof o.reload === 'function') o.reload();
  return true;
}

/** React: is the line showing? Re-renders when it starts or stops. */
export function useUpdateReady() {
  const [ready, setReady] = useState(() => updateReady());
  useEffect(() => {
    setReady(updateReady());
    const fn = (r) => setReady(r);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return ready;
}

/** React: the reader's hold (DR-0748), with its stop() kept for the tap. */
export function useReadingHold(on, stop) {
  useIntakeHold('reading', on);
  const ref = useRef(stop);
  ref.current = stop;
  useEffect(() => {
    if (!on) return undefined;
    const fn = () => {
      if (typeof ref.current === 'function') ref.current();
    };
    stoppers.add(fn);
    return () => {
      stoppers.delete(fn);
    };
  }, [on]);
}

/** For tests: forget every offer, stopper and listener. */
export function resetUpdateWhileReadingForTests() {
  offer = null;
  offeredKeys.clear();
  stoppers.clear();
  listeners.clear();
}
