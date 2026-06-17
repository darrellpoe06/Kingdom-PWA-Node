// Build freshness — pure, testable logic shared by the header build stamp and
// the Build board's "live build" stamp.
//
//   GREEN ("Latest")            = the running build is the newest deployed build.
//   RED   ("Update available")  = a newer build has downloaded and is waiting to
//                                 take over — the user is on a STALE build.
//
// This drives off the mechanism that ALREADY exists (lib/sw-update.js, PR #134):
// when a new service worker installs, wireUpdates() dispatches the
// `poetech:update-available` event and main.jsx parks the registration on
// window.__pwaReg with a `.waiting` worker. "An update is waiting" IS the stale
// signal — we do not invent a second source of truth. No waiting worker => the
// running build is the latest the browser knows about => GREEN.
//
// WCAG 2.1 AA — the dot is NEVER the sole signal (1.4.1 use-of-color): every
// render pairs it with a visible text label + title + aria-label. The two
// colors below each clear >=3:1 non-text contrast (1.4.11) against BOTH white
// and black, so the dot stays distinguishable on every theme (the light themes
// .. midnight OLED black).

import { useEffect, useState } from 'react';
import { UPDATE_EVENT, UPDATE_STUCK_EVENT, isUpdateStuck } from './sw-update.js';
import { KPI_STATUS } from './kpi-status.js';

// Build freshness is the FIRST instance of the shared KPI status system
// (lib/kpi-status.js): latest build => 'good' (green), a newer build waiting =>
// 'problem' (red). Colors come from the shared palette so they can never drift
// from the rest of the app's KPIs.
export const FRESH_COLOR = KPI_STATUS.good.color;    // green — latest
export const STALE_COLOR = KPI_STATUS.problem.color; // red   — old / update available

// Pure descriptor for a freshness state. `stale === true` => a newer build is
// waiting. `stuck === true` => an update reload didn't make the new build stick
// (a reload loop was caught), so "reload" has proven not to work on this device
// and we escalate to the honest "close & reopen" hint. Carries the canonical KPI
// `status` key plus everything a renderer needs to stay color-safe: a color AND
// independent text (label / title / aria).
export function freshnessDescriptor(stale, stuck = false) {
  if (stale && stuck) {
    return {
      stale: true,
      stuck: true,
      status: 'problem',
      color: STALE_COLOR,
      label: 'Update ready — close & reopen',
      title: 'A newer build is ready but an in-place reload did not apply it. Fully close the app (swipe it away / quit the browser tab) and reopen to finish updating.',
      ariaLabel: 'Update ready — fully close the app and reopen to finish updating',
    };
  }
  return stale
    ? {
        stale: true,
        stuck: false,
        status: 'problem',
        color: STALE_COLOR,
        label: 'Update available — reload',
        title: 'A newer build is available. Tap to reload and update.',
        ariaLabel: 'Update available — reload to get the latest build',
      }
    : {
        stale: false,
        stuck: false,
        status: 'good',
        color: FRESH_COLOR,
        label: 'Latest',
        title: 'You are running the latest deployed build.',
        ariaLabel: 'Running the latest build',
      };
}

// Read the current "is a newer build waiting?" signal from a window-like handle.
// Null-safe (tests / SSR). main.jsx parks the registration on __pwaReg after
// register(); `.waiting` is the installed-but-not-yet-active new worker.
export function updateWaiting(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  try {
    return !!(w && w.__pwaReg && w.__pwaReg.waiting);
  } catch (_) {
    return false;
  }
}

// React hook: returns true once a newer build is waiting. Seeds from the parked
// registration (catches the case where the update event fired before this
// component mounted) and then flips on the `poetech:update-available` event.
// Also re-checks on the stuck event, so a component using only this hook still
// re-renders when the state escalates (the descriptor reads stuck separately).
export function useStaleBuild(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  const [stale, setStale] = useState(() => updateWaiting(w));
  useEffect(() => {
    if (!w || typeof w.addEventListener !== 'function') return undefined;
    const mark = () => setStale(true);
    w.addEventListener(UPDATE_EVENT, mark);
    w.addEventListener(UPDATE_STUCK_EVENT, mark);
    // Late-mount catch: the event may have fired before we subscribed.
    if (updateWaiting(w)) setStale(true);
    return () => {
      w.removeEventListener(UPDATE_EVENT, mark);
      w.removeEventListener(UPDATE_STUCK_EVENT, mark);
    };
  }, [w]);
  return stale;
}

// React hook: returns true once the update path is stuck (a reload didn't make
// the new build stick). Seeds from the window flag and flips on the stuck event.
export function useUpdateStuck(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  const [stuck, setStuck] = useState(() => isUpdateStuck(w));
  useEffect(() => {
    if (!w || typeof w.addEventListener !== 'function') return undefined;
    const mark = () => setStuck(true);
    w.addEventListener(UPDATE_STUCK_EVENT, mark);
    if (isUpdateStuck(w)) setStuck(true);
    return () => w.removeEventListener(UPDATE_STUCK_EVENT, mark);
  }, [w]);
  return stuck;
}
