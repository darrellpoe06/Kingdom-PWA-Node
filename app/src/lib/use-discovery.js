// =============================================================================
// use-discovery — the shared, live recorded-discovery review store
// =============================================================================
// Mirrors use-moore-orders (the proven singleton pattern) over discovery_items
// (0093). The lifecycle it owns is the factory's review gate: save the parsed
// extraction (every item status='extracted'), a steward confirms/edits/rejects,
// and a confirmed requirement imports to the client's build board as a REAL
// board_tasks row (addTask — the same write path the boards use). The client's
// source_quote is never altered by any action here — edits touch only the
// buildable text; the quote is the receipt.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { discoverySync } from './discovery-sync.js';
import { unionPreservingLocal } from './table-sync.js';
import { addTask } from './use-board-tasks.js';

const LS_KEY = 'poetech-discovery-items-v1';

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveLocal(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* quota / private mode */ }
}

const COLUMN = {
  text: 'text', status: 'status', reviewedBy: 'reviewed_by', reviewedAt: 'reviewed_at',
  importedTaskSlug: 'imported_task_slug',
};
function toColumnPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch)) if (COLUMN[k]) out[COLUMN[k]] = patch[k];
  return out;
}

// ---- the singleton store ----------------------------------------------------
let state = loadLocal();
const listeners = new Set();
let subscribed = false;

function emit() {
  saveLocal(state);
  for (const l of listeners) l();
}
function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater;
  emit();
}
function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  discoverySync.subscribe((remote) => {
    setState((cur) => unionPreservingLocal(cur, remote || []));
  });
}
function subscribe(listener) {
  ensureSubscribed();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return state; }

export function useDiscoveryItems() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---- lifecycle --------------------------------------------------------------
// Save a parseDiscoveryJson() result: one row per item, each stamped with a
// stable slug so an accidental re-save can't duplicate (the 0093 unique index
// is the backstop). Returns the number saved.
export async function saveExtraction(parsed) {
  const items = (parsed?.items || []).map((it, i) => ({
    ...it,
    id: `di-${Date.now().toString(36)}-${i.toString(36)}`,
  }));
  if (!items.length) return 0;
  setState((cur) => [...cur, ...items]);
  for (const item of items) {
    const res = await discoverySync.upload(item);
    if (res && res.uploaded && res.remoteId) {
      setState((cur) => cur.map((x) => (x.id === item.id ? { ...x, remoteUuid: res.remoteId } : x)));
    }
  }
  return items.length;
}

function patchItem(item, patch) {
  setState((cur) => cur.map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
  if (item.remoteUuid) {
    discoverySync.updateRow(item.remoteUuid, toColumnPatch(patch))
      .catch((e) => console.warn('[discovery-sync] update failed', e));
  }
}

// The steward's word: confirm (optionally with an edited buildable text),
// or reject. Either way the decision is stamped and the source_quote stands.
export function reviewItem(item, { status, text = null }) {
  if (status !== 'reviewed' && status !== 'rejected') return;
  const patch = { status, reviewedAt: new Date().toISOString() };
  if (text != null && text.trim()) patch.text = text.trim();
  patchItem(item, patch);
}

// Import a CONFIRMED requirement to the client's build board as a real
// board_tasks row. Refuses anything unreviewed — the gate is the point.
export async function importToBoard(item, { boardSlug, boardTitle, owner = null }) {
  if (item.status !== 'reviewed') return { ok: false, reason: 'Only a reviewed item imports.' };
  if (item.importedTaskSlug) return { ok: false, reason: 'Already on the board.' };
  if (!boardSlug || !boardTitle) return { ok: false, reason: 'A board is required.' };
  await addTask({
    boardSlug, boardTitle,
    group: item.area || 'General',
    title: item.text,
    owner,
  });
  patchItem(item, { importedTaskSlug: `${boardSlug}:${item.text.slice(0, 60)}` });
  return { ok: true };
}
