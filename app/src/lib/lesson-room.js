// =============================================================================
// lesson-room — inside a lesson, the room is the lesson (DR-0749)
// =============================================================================
// Darrell 2026-10-02, with seven screenshots of L105 and Sovereign A.I. week
// 29 open on his Fold: "we have a lot of not necessary information within the
// lessons space... after the user chooses the lesson we want that space
// cleared from clutter... the top staying the same after we already read it
// while the bottom moves makes the reading space smaller... the next page
// isn't flowing well.. the page starting point has to always be found instead
// of starting where we need based on where we are in the lesson." And: "once
// inside the lessons we have the opportunity to scroll or click next... I like
// both... sometimes I want to pause and next works... other times the next is
// annoying."
//
// Four small, pure decisions live here so the lesson space (ChurchLearn.jsx)
// can be proven in plain Node:
//   1. THE CHROME HIDES WHILE YOU READ DOWN AND RETURNS WHEN YOU LOOK UP
//      (nextChromeState): the pinned bar over a lesson gives the reading its
//      height back the moment the reader scrolls on, and comes back on the
//      first flick up, or at the top of the page.
//   2. A STEP LANDS WHERE THE EYE IS (stepScrollTop, landStep): when the
//      reader taps Next or Back, the new step's first line sits at the top of
//      the screen with the chrome stepped aside (it is one flick up away), or
//      just under the chrome near the top of the page where the chrome always
//      shows — so the starting point never has to be found, and the words keep
//      the whole screen. The landing's own scroll is never read as the
//      reader's: the chrome decides once, from where the step landed.
//   3. STEP BY STEP, OR SCROLL IT ALL (readFlowMode / writeFlowMode): the
//      reader's own choice, kept on the device; both ways stay available.
//   4. WHICH STEP IS UNDER THE EYE while scrolling it all (stepInView): the
//      progress follows the reading instead of waiting for a tap.
// =============================================================================
import { useEffect, useRef, useState } from 'react';

/** How far down the page before the chrome may hide at all. */
export const CHROME_HIDE_AFTER = 120;
/** A scroll shorter than this (in px) is a tremor, not a direction. */
export const CHROME_DELTA = 24;
/** The space kept between the chrome's bottom edge and a landed step. */
export const STEP_LANDING_GAP = 8;

/** A pager says the reader moved to a step or part (detail.el). */
export const STEP_EVENT = 'poetech:lesson-step';
/** The host says where that step landed (detail.top), so the chrome decides once. */
export const LANDED_EVENT = 'poetech:lesson-landed';
/** How long a landing's own scroll may still be settling before a scroll is the reader's again. */
export const LANDING_SETTLE_MS = 1500;

export const FLOW_KEY = 'poetech:lesson-flow';
export const FLOW_MODES = Object.freeze(['steps', 'scroll']);
export const FLOW_WORDS = Object.freeze({
  steps: 'Step by step',
  scroll: 'Scroll it all',
});

/**
 * The chrome's next state from the last one and the scroll it just made.
 * 'shown' near the top always; 'hidden' after a real scroll down; 'shown'
 * after a real scroll up; otherwise unchanged. Pure.
 */
export function nextChromeState(state, lastY, y, { hideAfter = CHROME_HIDE_AFTER, delta = CHROME_DELTA } = {}) {
  const was = state === 'hidden' ? 'hidden' : 'shown';
  const a = Number(lastY) || 0;
  const b = Number(y) || 0;
  if (b <= hideAfter) return 'shown';
  if (b - a > delta) return 'hidden';
  if (a - b > delta) return 'shown';
  return was;
}

/**
 * Where to scroll so an element's top sits just under the chrome.
 * @param {{elTop:number, scrollY:number, chromeHeight?:number, gap?:number}} o  elTop is viewport-relative
 */
export function stepScrollTop({ elTop, scrollY, chromeHeight = 0, gap = STEP_LANDING_GAP }) {
  const top = (Number(elTop) || 0) + (Number(scrollY) || 0) - (Number(chromeHeight) || 0) - gap;
  return Math.max(0, Math.round(top));
}

/** The reader's flow choice from storage; 'steps' when unset or unreadable. */
export function readFlowMode(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const v = s ? s.getItem(FLOW_KEY) : null;
    return FLOW_MODES.includes(v) ? v : 'steps';
  } catch (_) { return 'steps'; }
}

/** Keep the reader's flow choice. Unknown modes are ignored. Returns the mode kept. */
export function writeFlowMode(mode, storage) {
  const m = FLOW_MODES.includes(mode) ? mode : 'steps';
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s) s.setItem(FLOW_KEY, m);
  } catch (_) { /* a choice that cannot be kept still applies now */ }
  return m;
}

const flowListeners = new Set();
function announceFlow(mode) { for (const fn of Array.from(flowListeners)) { try { fn(mode); } catch (_) { /* one never blocks another */ } } }

/** React: [mode, setMode] for the flow choice, shared across every open lesson. */
export function useFlowMode() {
  const [mode, setModeState] = useState(() => readFlowMode());
  useEffect(() => {
    flowListeners.add(setModeState);
    return () => { flowListeners.delete(setModeState); };
  }, []);
  const setMode = (m) => { const kept = writeFlowMode(m); setModeState(kept); announceFlow(kept); };
  return [mode, setMode];
}

/**
 * Which step the reader's eye is on while every step is shown at once: the
 * last step whose top is at or above the reading line, else the first. Pure.
 * @param {number[]} tops  each step's top, viewport-relative
 * @param {number} line   the reading line (just under the chrome)
 */
export function stepInView(tops, line) {
  const list = Array.isArray(tops) ? tops : [];
  if (!list.length) return -1;
  let at = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (Number.isFinite(list[i]) && list[i] <= line) at = i;
  }
  return at;
}

/** The chrome's state once a step has landed at `top`: shown only near the page top. Pure. */
export function chromeAfterLanding(top, { hideAfter = CHROME_HIDE_AFTER } = {}) {
  return (Number(top) || 0) <= hideAfter ? 'shown' : 'hidden';
}

/**
 * React: 'shown' | 'hidden' for the lesson chrome, following the reader's own
 * scrolling while `enabled`. A step or part the reader moved to (STEP_EVENT,
 * then LANDED_EVENT with where it landed) decides the state once from the
 * landing: aside, so the words have the screen, or shown near the page top.
 * The landing's own scroll is held still, never read as the reader's.
 */
export function useChromeAutoHide(enabled, win = typeof window !== 'undefined' ? window : undefined) {
  const [state, setState] = useState('shown');
  // The decision reads the last state from a ref, never from a lazy updater:
  // the anchor (lastY) moves right after the call, and an updater that ran
  // later would read the moved anchor and see no scroll at all.
  const stateRef = useRef('shown');
  const put = (next) => { stateRef.current = next; setState(next); };
  useEffect(() => {
    if (!enabled || !win || typeof win.addEventListener !== 'function') { put('shown'); return undefined; }
    let lastY = win.scrollY || 0;
    let raf = null;
    // While a landing is under way its scroll only moves the anchor.
    let landing = null; // { top: number|null, until: number }
    const onScroll = () => {
      if (raf !== null) return;
      const schedule = typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : (cb) => setTimeout(cb, 16);
      raf = schedule(() => {
        raf = null;
        const y = win.scrollY || 0;
        if (landing) {
          lastY = y;
          const arrived = landing.top !== null && Math.abs(y - landing.top) <= 2;
          if (arrived || Date.now() > landing.until) landing = null;
          return;
        }
        put(nextChromeState(stateRef.current, lastY, y));
        // A small move keeps the last anchor so a slow drift still adds up.
        if (Math.abs(y - lastY) > CHROME_DELTA || y <= CHROME_HIDE_AFTER) lastY = y;
      });
    };
    const onStep = () => { landing = { top: null, until: Date.now() + LANDING_SETTLE_MS }; };
    const onLanded = (e) => {
      const top = Number(e && e.detail && e.detail.top);
      if (!Number.isFinite(top)) { landing = null; return; }
      put(chromeAfterLanding(top));
      lastY = top;
      landing = { top, until: Date.now() + LANDING_SETTLE_MS };
    };
    win.addEventListener('scroll', onScroll, { passive: true });
    win.addEventListener(STEP_EVENT, onStep);
    win.addEventListener(LANDED_EVENT, onLanded);
    return () => {
      win.removeEventListener('scroll', onScroll);
      win.removeEventListener(STEP_EVENT, onStep);
      win.removeEventListener(LANDED_EVENT, onLanded);
    };
  }, [enabled, win]);
  return enabled ? state : 'shown';
}

function sendOn(win, type, detail) {
  try {
    if (!win || typeof win.dispatchEvent !== 'function') return false;
    const evt = typeof win.CustomEvent === 'function' ? new win.CustomEvent(type, { detail }) : { type, detail };
    win.dispatchEvent(evt);
    return true;
  } catch (_) { return false; }
}

/**
 * Say that the reader moved to a step or part: the host lands the element's
 * first line where the eye is (landStep). Never throws.
 */
export function announceStep(el, win = typeof window !== 'undefined' ? window : undefined) {
  return sendOn(win, STEP_EVENT, { el });
}

/**
 * Scroll a step's element to the top of the screen, the chrome stepped aside;
 * near the top of the page, where the chrome always shows, its measured height
 * is counted so the line sits under it. Then says where it landed
 * (LANDED_EVENT) so the chrome decides once. Returns the top, or false.
 */
export function landStep(el, { chromeEl = null, win = typeof window !== 'undefined' ? window : undefined, behavior = 'auto' } = {}) {
  try {
    if (!el || !win || typeof el.getBoundingClientRect !== 'function' || typeof win.scrollTo !== 'function') return false;
    const elTop = el.getBoundingClientRect().top;
    const scrollY = win.scrollY || 0;
    let top = stepScrollTop({ elTop, scrollY, chromeHeight: 0 });
    if (chromeAfterLanding(top) === 'shown') {
      const chromeHeight = chromeEl && typeof chromeEl.getBoundingClientRect === 'function' ? chromeEl.getBoundingClientRect().height : 0;
      top = stepScrollTop({ elTop, scrollY, chromeHeight });
    }
    win.scrollTo({ top, behavior });
    sendOn(win, LANDED_EVENT, { top });
    return top;
  } catch (_) { return false; }
}
