// =============================================================================
// create-sub — which Create sub is open, shared by the row and the page
// =============================================================================
// DR-0679, amending DR-0678. Darrell 2026-09-29: "Why take away my type
// texting place?!!!!!!!!!!!! Where is it?!!!!!!!!!!!!!!", then "Obviously give
// us a actual tabs like so we can know!!!!!!!!!!!!!!!!", then "Subtabs".
//
// Create has a second row under the main nav, the same row Church has
// (components/CreateSubNav.jsx, derived from surfaces.js nav:'create'). The row
// sits in the shell's header and the page sits in <main>, so the open sub lives
// here, in one small store both read, instead of a new state line in the shell
// (the monolith is frozen). Church keeps churchView in the shell; this is the
// same idea with the state held beside the feature.
//
// The open sub, in order of precedence:
//   1. the handoff link (?view=create&panel=…, read once at boot by
//      lib/app-doors.js, the same snapshot DR-0678 used);
//   2. the sub this device last chose (localStorage, never trusted to exist);
//   3. the Workspace. Always the default, on every device.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { consumeStationPanel } from './app-doors.js';
import { PANEL_KEYS, WORKSPACE_TAB, panelFromSearch, readRememberedTab, rememberTab } from './device-roles.js';

/** Every Create sub id: the Workspace, then the station's panels. */
export const CREATE_SUBS = Object.freeze([WORKSPACE_TAB, ...PANEL_KEYS]);

let current = null;
let openedFrom = '';
const listeners = new Set();

function init() {
  if (current !== null) return;
  let p;
  try {
    const raw = consumeStationPanel();
    p = raw === WORKSPACE_TAB ? WORKSPACE_TAB : panelFromSearch(`?panel=${encodeURIComponent(raw)}`);
  } catch { p = ''; }
  if (p) {
    current = p;
    openedFrom = p;
    rememberTab(p);
  } else {
    current = readRememberedTab(CREATE_SUBS);
  }
}

/** The open Create sub. */
export function getCreateSub() {
  init();
  return current;
}

/** Open a Create sub; unknown ids are ignored. Remembered on this device. */
export function setCreateSub(id) {
  init();
  if (!CREATE_SUBS.includes(id) || id === current) return;
  current = id;
  rememberTab(id);
  for (const l of [...listeners]) l();
}

/** The sub a handoff link opened, once ('' after the first read or when none). */
export function takeOpenedFrom() {
  init();
  const p = openedFrom;
  openedFrom = '';
  return p;
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** React: the open Create sub, re-rendering when it changes. */
export function useCreateSub() {
  return useSyncExternalStore(subscribe, getCreateSub, getCreateSub);
}

/** Tests only: forget the open sub so the next read starts from boot again. */
export function resetCreateSubForTest() {
  current = null;
  openedFrom = '';
}
