// =============================================================================
// chrome-dock — the app's bottom bar, where the floaters now live (DR-0716)
// =============================================================================
// Darrell 2026-09-30, from the L202 lesson reader on his Galaxy Fold 7 (open,
// dark, A44): "Put the feedback and other floating options on the task bars
// somewhere they make sense... they can still do what they do however it will
// make the reader better and less blocked." Then: "Like the text size etc..."
//
// Before this, five things floated over the lesson words: Feedback (bottom
// left), the network dot (left, mid screen), Give and back-to-top (bottom
// right) and the read-aloud pill. Each did its job; together they covered the
// Word. They now sit in ONE full-width bar at the bottom of the screen
// (components/ChromeDock.jsx), styled as the same square bordered buttons the
// text-size row uses. This module is the small shared state that bar needs:
//
//   * the SLOT: the dock registers the element the read-aloud controls render
//     into (TTSControl portals its button / mini-bar / pill there). A surface
//     that mounts TTSControl WITHOUT the dock (the follow-along display, the
//     public TLC door) gets no slot and keeps its own corner, unchanged.
//   * scrolled-deep: the one "show back-to-top" rule, formerly private to
//     TTSControl, so the bar and the reader agree on it.
//   * the button look: one class string, so every docked control is one family
//     with A / A+ / A++ / A+++ / A44.
// =============================================================================
import { useEffect, useState, useSyncExternalStore } from 'react';
import { motionBehavior } from './gentle-motion.js';

let slotEl = null;
const subs = new Set();
const notify = () => { subs.forEach((f) => { try { f(); } catch (_) { /* one listener */ } }); };
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

/** The dock calls this with its reader slot element (and null on unmount). */
export function setDockSlot(el) {
  if (slotEl === el) return;
  slotEl = el || null;
  notify();
}

/** The current reader slot element, or null when no dock is mounted. */
export function getDockSlot() {
  return slotEl && slotEl.isConnected !== false ? slotEl : null;
}

/** React hook: the dock's reader slot, re-rendering when it mounts/unmounts. */
export function useDockSlot() {
  return useSyncExternalStore(subscribe, getDockSlot, () => null);
}

/** Where the page counts as "deep" enough to offer back-to-top: more than a
 *  screen and a quarter down (the rule TTSControl has used since 2026-08-15). */
export const DEEP_FACTOR = 1.25;

export function isScrolledDeep(scrollY, innerHeight) {
  const y = Number(scrollY) || 0;
  const h = Number(innerHeight) || 0;
  return h > 0 && y > h * DEEP_FACTOR;
}

/** React hook: true once the page is scrolled past DEEP_FACTOR screens. */
export function useScrolledDeep() {
  const [deep, setDeep] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setDeep(isScrolledDeep(window.scrollY, window.innerHeight));
      });
    };
    setDeep(isScrolledDeep(window.scrollY, window.innerHeight));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return deep;
}

/** Back to the top of the page, honoring reduced motion (gentle-motion.js). */
export function scrollPageToTop() {
  if (typeof window === 'undefined') return;
  try { window.scrollTo({ top: 0, behavior: motionBehavior() }); } catch (_) { window.scrollTo(0, 0); }
}

// THE FAMILY LOOK. The text-size row's unselected chip is a white square with a
// 2px #E8E4DC border that darkens on hover (TextSizeControl.jsx). Docked
// controls wear the same, at a 44px floor, with a short word under the icon.
// Each button is its OWN .ts-chrome-region, exactly like the chips: sized in
// rem, zoomed back to its Normal size at every text size, so the bar is the
// same 48px at Normal and at A44 and the large-print guard's rem rule holds.
// The bar itself is NOT a chrome region: a zoomed bar around the reader's
// controls (which carry their own cap) would shrink them twice.
const DOCK_BTN_BASE = 'ts-chrome-region relative inline-flex flex-col items-center justify-center gap-[0.125rem] min-h-[2.75rem] min-w-[2.75rem] px-[0.25rem] py-[0.125rem] rounded-md border-2 font-semibold leading-none whitespace-nowrap focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
export const DOCK_BTN = `${DOCK_BTN_BASE} border-[#E8E4DC] bg-white text-[#1A1815] hover:border-[#1A1815]`;
/** The pressed / "on" state, same as the selected text-size chip. */
export const DOCK_BTN_ON = `${DOCK_BTN_BASE} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838]`;
/** The short word under each icon (9px at every size, inside the chip's cap). */
export const DOCK_LABEL = 'text-[0.5625rem] uppercase tracking-[0.02em]';
/** The icon line (16px at every size, inside the chip's cap). */
export const DOCK_ICON = 'text-[1rem] leading-none';
/** The bar's own height: one row of 44px buttons, nothing more (DR-0716). */
export const DOCK_HEIGHT_PX = 44;
