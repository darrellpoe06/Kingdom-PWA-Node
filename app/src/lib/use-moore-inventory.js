// =============================================================================
// use-moore-inventory — the shared, live shop-inventory store
// =============================================================================
// Mirrors use-moore-orders over shop_inventory (0086). Adjustments write the
// real qty; value is derived by the engine every render.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { mooreInventorySync } from './moore-inventory-sync.js';
import { unionPreservingLocal } from './table-sync.js';
import { normalizeInventoryItem } from './moore-divahs.js';

const LS_KEY = 'poetech-moore-inventory-v1';

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

let state = loadLocal();
const listeners = new Set();
let subscribed = false;

function emit() { saveLocal(state); for (const l of listeners) l(); }
function setState(updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); }
function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  mooreInventorySync.subscribe((remote) => {
    setState((cur) => unionPreservingLocal(cur, remote || []));
  });
}
function subscribe(listener) {
  ensureSubscribed();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return state; }

export async function addInventoryItem(partial) {
  const item = normalizeInventoryItem(partial);
  if (!item.name) return null;
  setState((cur) => [...cur, item]);
  const res = await mooreInventorySync.upload(item);
  if (res && res.uploaded && res.remoteId) {
    setState((cur) => cur.map((i) => (i.id === item.id ? { ...i, remoteUuid: res.remoteId } : i)));
  }
  return item;
}

export function adjustInventoryQty(item, delta) {
  const qty = Math.max(0, (item.qty || 0) + delta);
  setState((cur) => cur.map((i) => (i.id === item.id ? { ...i, qty } : i)));
  if (item.remoteUuid) {
    mooreInventorySync.updateRow(item.remoteUuid, { qty })
      .catch((e) => console.warn('[moore-inventory-sync] update failed', e));
  }
}

export function removeInventoryItem(item) {
  setState((cur) => cur.filter((i) => i.id !== item.id));
  if (item.remoteUuid) {
    mooreInventorySync.deleteRow(item.remoteUuid)
      .catch((e) => console.warn('[moore-inventory-sync] delete failed', e));
  }
}

export function useMooreInventory() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
