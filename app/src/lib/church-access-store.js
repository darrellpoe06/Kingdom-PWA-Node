// =============================================================================
// church-access-store — my own church membership and my own granted keys
// =============================================================================
// The shell's surface gates need one more fact than the email allowlists can
// give them: what the OFFICE has granted this person, in the database, through
// 0211's request-and-approval chain. Without it an approval would write a row
// and change nothing a person can see.
//
// Same house pattern as lib/instance-role.js: a module-level cache behind
// useSyncExternalStore, fetched once per auth session, fail-soft. A signed-out
// or erroring fetch resolves to NO capabilities — the failure direction is
// always toward less access, never more.
//
// THE DATABASE IS STILL THE WALL. This makes the app agree with what RLS and
// the RPC guards already enforce; it never grants anything by itself, and a
// tampered snapshot here opens no row (DR-0060 / DR-0074).
// =============================================================================
import { useSyncExternalStore } from 'react';
import supabase, { onAuthChange } from './supabase.js';
import { myChurchAccess } from './access-requests.js';

const EMPTY = Object.freeze({ instanceId: null, instanceSlug: '', role: '', capabilities: Object.freeze([]), loaded: false });

let state = EMPTY;
const listeners = new Set();
const emit = () => { for (const l of listeners) l(); };
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => state;
let inFlight = null;

export async function fetchChurchAccess() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { state = { ...EMPTY, loaded: true }; emit(); return state; }
      const res = await myChurchAccess();
      state = res.ok
        ? {
          instanceId: res.instanceId, instanceSlug: res.instanceSlug,
          role: res.role, capabilities: Object.freeze([...res.capabilities]), loaded: true,
        }
        : { ...EMPTY, loaded: true };
    } catch (e) {
      console.warn('[church-access] fetch failed:', e);
      state = { ...EMPTY, loaded: true };
    }
    emit();
    return state;
  })();
  try { return await inFlight; } finally { inFlight = null; }
}

let wired = false;
function wireAuth() {
  if (wired) return;
  wired = true;
  try {
    onAuthChange(() => { state = EMPTY; emit(); fetchChurchAccess(); });
  } catch { /* non-browser (tests) — callers still work via fetchChurchAccess */ }
}

/**
 * The snapshot the shell hands to every surface gate.
 * Re-fetch after a grant so the person does not have to reload to see the tab
 * the office just opened for them.
 */
export function useChurchAccess() {
  wireAuth();
  if (!state.loaded && !inFlight) fetchChurchAccess();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** For a surface that just changed somebody's grants. */
export function refreshChurchAccess() {
  state = { ...state, loaded: false };
  emit();
  return fetchChurchAccess();
}
