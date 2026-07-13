// =============================================================================
// use-assistant-access — the owner's per-1099-assistant access checkboxes
// =============================================================================
// Darrell 2026-07-13: "check boxes for what you allow for each 1099 assistant."
// The owner keeps a list of their 1099 assistants and, per assistant, CHECKS the
// work surfaces that assistant is allowed. The four grantable surfaces are the
// only checkboxes; the owner's world (finances, portfolio, family, oversight) is
// LOCKED in the model (relationships.js: ASSISTANT_CAPABILITY_POLICY) so no
// checkbox here can ever grant it — this store only ever writes an ALLOW for a
// GRANTABLE capability, and the model clamps anything else to deny (no-leak).
//
// House persistence pattern (DR-0078): pure CRUD + a useSyncExternalStore hook
// over a localStorage mirror. This is the CONFIG layer; the load-bearing data
// gate is RLS at the DB (DR-0074) — the same relationship the child config has
// with child_capabilities. Per-person config binds to a real assistant account
// when the membership role + RLS land (the named next slice).
// =============================================================================
import { useSyncExternalStore } from 'react';
import { ASSISTANT_GRANTABLE } from './relationships.js';

export const LS_KEY = 'poetech-assistant-access-v1';
const rid = () => `asst-${Math.random().toString(36).slice(2, 9)}`;
const asStr = (v) => (typeof v === 'string' ? v : '');

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return { assistants: Array.isArray(obj.assistants) ? obj.assistants : [] };
  } catch {
    return { assistants: [] };
  }
}

let state = load();
const listeners = new Set();
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ } }
function emit() { save(); for (const l of listeners) l(); }
function set(updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

// Reader for tests + non-hook callers (the hook uses the same snapshot).
export function readAssistants() { return state.assistants; }

export function addAssistant(name) {
  const nm = asStr(name).trim();
  if (!nm) return null;
  const a = { id: rid(), name: nm, config: {} };
  set((s) => ({ ...s, assistants: [...s.assistants, a] }));
  return a;
}

export function removeAssistant(id) {
  set((s) => ({ ...s, assistants: s.assistants.filter((a) => a.id !== id) }));
}

// Toggle a GRANTABLE capability for one assistant. A locked wall is not
// grantable, so this is a no-op for it — the wall can never be checked on here.
export function toggleCap(id, cap) {
  if (!ASSISTANT_GRANTABLE.includes(cap)) return; // no-leak: walls are never writable
  set((s) => ({
    ...s,
    assistants: s.assistants.map((a) => {
      if (a.id !== id) return a;
      const cfg = { ...a.config };
      if (cfg[cap] === 'allow') delete cfg[cap]; else cfg[cap] = 'allow';
      return { ...a, config: cfg };
    }),
  }));
}

export function useAssistantAccess() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
