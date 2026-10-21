// =============================================================================
// home-view-prefs — which home a person opens, and how dense they want it
// =============================================================================
// Darrell 2026-09-17, relaying three home-view mockups from his wife Christina
// ("options she would like to see as views for the app") with three decisions
// given: the Current View stayed the default front door AT FIRST, build real
// records for the tiles that had none, and let the phone nav fold behind More.
// It shipped opt-in (DR-0464). On 2026-10-15 Darrell approved the Hub as the
// home (DR-1046), the Tier C front-door decision that opt-in had deferred, so
// DEFAULT_HOME_VIEW below is 'lifehub'; a device that already chose the Current
// View keeps it.
//
// WHY A DEVICE STORE, SAID PLAINLY. "Per person" is implemented here as "per
// device", the same way live-player-prefs.js and text-size.js already work in
// this app: one module-level store, useSyncExternalStore, localStorage,
// fail-soft. In this family that IS per person — each of them reads the app on
// their own phone — but the honest limit is that two people sharing one device
// share the choice, and a signed-in person moving to a new device starts on the
// default again. The durable fix is a column on the person's profile row, which
// is a schema change and a separate decision; it is named in DR-0464 with a
// re-review date rather than implied here. Nothing in this module claims to
// know who the reader is, because it does not.
//
// THE DENSITIES ARE HER THREE LOOKS, AS DENSITY RATHER THAN AS PALETTES, and
// that was a forced call worth stating: her three mockups differ in skin (light
// pastel / photographic / dark) and in density (Quick Actions 4 / 8 / 6). A
// private palette per view cannot be carried here — contrast-guard reads the
// theme CSS as the single source of truth and a hardcoded color cannot be
// remapped per theme, so three private palettes would render dark-on-dark in
// midnight for whoever picked the pastel one. The structure and the density
// survive intact and inherit the theme the reader already chose, which keeps
// every color inside the contrast gate. All three of her looks therefore ship,
// as airy / photo / compact, rather than two being discarded.
import { useSyncExternalStore } from 'react';

export const HOME_VIEWS = ['current', 'lifehub'];
// The default lives in ONE place. It used to be a literal in the initial read
// AND a second literal in the test reset, which meant a break that flipped the
// real default was invisible to the gate — the reset put 'current' back. One
// constant, used by both, and the promise is checkable.
// THE LIFE HUB IS THE HOME (DR-1046; Darrell's approval, relayed by Christina
// 2026-10-15). DR-0464 shipped it opt-in; the approval makes it the front door.
// A device that chose the Current View keeps it, and the Current View stays
// one tap away on the Hub.
export const DEFAULT_HOME_VIEW = 'lifehub';
export const DEFAULT_HUB_DENSITY = 'airy';
export const HUB_DENSITIES = ['airy', 'photo', 'compact'];
// How many Quick Actions each of her three looks put on the screen, measured
// from the mockups themselves (4 / 8 / 6) rather than chosen here.
export const DENSITY_ACTIONS = { airy: 4, photo: 8, compact: 6 };

export const HOME_VIEW_KEY = 'poetech:home-view';
export const HUB_DENSITY_KEY = 'poetech:home-hub-density';

// Per person here means per device. Stated in one line on purpose, because the
// phrase "per person" in the task would otherwise imply an account-level
// setting this does not have.
//
// Pure over the getter so the blocked-storage case is testable directly: a
// private window, cleared site data or a browser that throws on access must
// return the FALLBACK, never a guess and never a crash on the family's front
// door.
export function readPref(getItem, allowed = [], fallback = null) {
  try {
    const v = typeof getItem === 'function' ? getItem() : null;
    return allowed.includes(v) ? v : fallback;
  } catch { return fallback; }
}

const read = (key, allowed, fallback) => readPref(() => localStorage.getItem(key), allowed, fallback);

// THE DEFAULT IS DEFAULT_HOME_VIEW ('lifehub' since DR-1046). A reader who never
// chooses anything, or whose storage is blocked, or who is in a private window,
// opens the Life Hub; a stored 'current' is honoured. One constant, read here and
// in the test's reset, so a break that flipped the real default is visible.
let state = {
  homeView: read(HOME_VIEW_KEY, HOME_VIEWS, DEFAULT_HOME_VIEW),
  density: read(HUB_DENSITY_KEY, HUB_DENSITIES, DEFAULT_HUB_DENSITY),
};

const listeners = new Set();
const emit = () => { for (const l of listeners) l(); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

export function getHomeView() { return state.homeView; }
export function getHubDensity() { return state.density; }

export function setHomeView(next) {
  if (!HOME_VIEWS.includes(next) || next === state.homeView) return;
  state = { ...state, homeView: next };
  try { localStorage.setItem(HOME_VIEW_KEY, next); } catch { /* private window / blocked */ }
  emit();
}

export function setHubDensity(next) {
  if (!HUB_DENSITIES.includes(next) || next === state.density) return;
  state = { ...state, density: next };
  try { localStorage.setItem(HUB_DENSITY_KEY, next); } catch { /* private window / blocked */ }
  emit();
}

export function useHomePrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Test seam: the store is module-level on purpose (one truth per page), so a
// test that changes it must be able to put it back.
export function __resetHomePrefs() {
  state = { homeView: DEFAULT_HOME_VIEW, density: DEFAULT_HUB_DENSITY };
  emit();
}
