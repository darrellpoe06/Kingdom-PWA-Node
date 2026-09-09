// =============================================================================
// show-the-word — one switch that opens every Scripture on the page, or hides it
// =============================================================================
// Darrell, 2026-09-08: "make all scriptures open with one click so the reader
// can read it with or without the scriptures presented... or else users have
// to click each one separately... collectively... and close collectively...
// also work independently... both... best of all options."
//
// So there are two layers, and they compose:
//   • THE SWITCH (this module) — app-wide, remembered on this device. On: every
//     reference on every surface renders with its verse open. Off: closed.
//   • THE CHIP — each reference still toggles on its own, on top of the switch:
//     with the switch on, a tap closes that one; with it off, a tap opens that
//     one. Flipping the switch clears those individual choices so the page
//     reads whole again ("with or without the scriptures presented").
//
// House pattern (instance-role.js): a module-level value + useSyncExternalStore
// so every VerseChips / WordInline on the page re-renders from ONE store when
// the switch flips, with no provider to thread. Fail-soft on storage: a private
// window or blocked site data just means the switch starts off.
import { useSyncExternalStore } from 'react';

export const SHOW_THE_WORD_KEY = 'poetech-show-the-word';

function readStored() {
  try { return localStorage.getItem(SHOW_THE_WORD_KEY) === 'on'; } catch { return false; }
}

let on = readStored();
const listeners = new Set();
function emit() { for (const l of listeners) l(); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return on; }

/** Is the Word shown everywhere right now? */
export function isShowTheWord() { return on; }

/** Set the switch (and remember it on this device). */
export function setShowTheWord(next) {
  const v = Boolean(next);
  if (v === on) return;
  on = v;
  try { localStorage.setItem(SHOW_THE_WORD_KEY, v ? 'on' : 'off'); } catch { /* private window, or site data blocked */ }
  emit();
}

export function toggleShowTheWord() { setShowTheWord(!on); }

/** For tests: forget the stored value and start from off. */
export function __resetShowTheWord() {
  on = false;
  try { localStorage.removeItem(SHOW_THE_WORD_KEY); } catch { /* ignore */ }
  emit();
}

/** The hook every reference reads. */
export function useShowTheWord() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
