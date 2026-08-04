// =============================================================================
// instance-role — the signed-in user's REAL instance role, from the database
// =============================================================================
// DR-0220 P3 named the standing defect: the shell derives affordances from
// email allowlists and a client-side tier switch, never from the backend role.
// This lib is the honest source: my_default_instance_role() (migration 0130,
// SECURITY DEFINER) returns the caller's membership role + instance for their
// default (non-church) space, resolved with 0119's deterministic order.
//
// First use: assistant scope (DR-0271, Christina 2026-08-04). A member whose
// role is 'assistant' gets the Assistant workspace and nothing else — the UI
// reads THIS to agree with what RLS already enforces (nav + render agree;
// DR-0074: the client gate is a courtesy, the database is the wall).
//
// House pattern: module-level cache + useSyncExternalStore; fail-soft (a
// signed-out or erroring fetch resolves to the null role — the app never
// blocks on it). Re-fetches on each auth change.
import { useSyncExternalStore } from 'react';
import supabase, { onAuthChange } from './supabase.js';

const EMPTY = Object.freeze({ instanceId: null, instanceSlug: null, instanceType: null, role: null, loaded: false });

let state = EMPTY;
const listeners = new Set();
function emit() { for (const l of listeners) l(); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

let inFlight = null;

// Fetch (once per auth session) the caller's default-instance role. Returns the
// normalized shape and caches it for the hook. Safe to call repeatedly.
export async function fetchInstanceRole() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { state = { ...EMPTY, loaded: true }; emit(); return state; }
      const { data, error } = await supabase.rpc('my_default_instance_role');
      if (error) {
        console.warn('[instance-role] my_default_instance_role failed:', error);
        state = { ...EMPTY, loaded: true };
      } else {
        state = {
          instanceId: data?.instance_id ?? null,
          instanceSlug: data?.instance_slug ?? null,
          instanceType: data?.instance_type ?? null,
          role: data?.role ?? null,
          loaded: true,
        };
      }
    } catch (e) {
      console.warn('[instance-role] fetch failed:', e);
      state = { ...EMPTY, loaded: true };
    }
    emit();
    return state;
  })();
  try { return await inFlight; } finally { inFlight = null; }
}

// Reset + refetch when auth changes (sign-in/out swaps the person).
let wired = false;
function wireAuth() {
  if (wired) return;
  wired = true;
  try {
    onAuthChange(() => { state = EMPTY; emit(); fetchInstanceRole(); });
  } catch { /* non-browser (tests) — hook callers still work via fetch */ }
}

// The hook: current role snapshot ({ role, instanceId, instanceSlug, loaded }).
// Kicks the fetch lazily on first mount.
export function useInstanceRole() {
  wireAuth();
  if (!state.loaded && !inFlight) fetchInstanceRole();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Pure helpers the shell + doors read (kept dumb on purpose — the DB decides).
export const isAssistantRole = (s) => (s?.role ?? null) === 'assistant';
export const canManageTeam = (s) => ['owner', 'admin'].includes(s?.role ?? '');
