// =============================================================================
// use-moore-orders — the shared, live Moore Divahs orders store
// =============================================================================
// Mirrors use-board-tasks (the proven singleton pattern): one module-level
// store gives every consumer — the steward tab today, the branded customer
// door tomorrow — the SAME live order list. localStorage persistence + a
// single custom_orders realtime subscription (no-op signed out, syncs on
// sign-in). CRUD writes optimistically, persists, then pushes to the cloud
// controller. The pure rules live in moore-divahs.js; this owns lifecycle.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { mooreOrdersSync } from './moore-orders-sync.js';
import { unionPreservingLocal } from './table-sync.js';
import { newOrder, moveOrderStage, recordPayment, appendChangeOrder } from './moore-divahs.js';

const LS_KEY = 'poetech-moore-orders-v1';

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveLocal(orders) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(orders)); } catch { /* quota / private mode */ }
}

// local patch -> custom_orders snake_case columns, for updateRow.
const COLUMN = {
  stage: 'stage', customerName: 'customer_name', contactValue: 'contact_value',
  channel: 'channel', productType: 'product_type', description: 'description',
  inspoNotes: 'inspo_notes', sizeOrMeasurements: 'size_or_measurements',
  fabric: 'fabric', bulkLines: 'bulk_lines', quoteCents: 'quote_cents',
  paidAt: 'paid_at', payMethod: 'pay_method', turnaroundDays: 'turnaround_days',
  materialsCents: 'materials_cents', delivery: 'delivery', deliveredAt: 'delivered_at',
  followUp: 'follow_up', changeOrders: 'change_orders', policyAccepted: 'policy_accepted',
  history: 'history',
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
  mooreOrdersSync.subscribe((remote) => {
    setState((cur) => unionPreservingLocal(cur, remote || []));
  });
}
function subscribe(listener) {
  ensureSubscribed();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return state;
}

// ---- CRUD -------------------------------------------------------------------
function persistPatch(order, patch) {
  setState((cur) => cur.map((o) => (o.id === order.id ? { ...o, ...patch } : o)));
  if (order.remoteUuid) {
    mooreOrdersSync.updateRow(order.remoteUuid, toColumnPatch(patch))
      .catch((e) => console.warn('[moore-orders-sync] update failed', e));
  }
}

export async function addOrder(partial) {
  const item = newOrder(partial);
  setState((cur) => [...cur, item]);
  const res = await mooreOrdersSync.upload(item);
  if (res && res.uploaded && res.remoteId) {
    setState((cur) => cur.map((o) => (o.id === item.id ? { ...o, remoteUuid: res.remoteId } : o)));
  }
  return item;
}

export function patchOrder(order, patch) {
  persistPatch(order, patch);
}

export function advanceOrder(order, toStage) {
  const moved = moveOrderStage(order, toStage);
  if (moved === order) return;
  persistPatch(order, { stage: moved.stage, history: moved.history, updatedAt: moved.updatedAt });
}

// The lock moment — full payment up front, the 3-week clock starts (her rule).
export function payOrder(order, method) {
  const paid = recordPayment(order, { method });
  persistPatch(order, {
    stage: paid.stage, paidAt: paid.paidAt, payMethod: paid.payMethod,
    history: paid.history, updatedAt: paid.updatedAt,
  });
}

// Record a change order (fee computed by the ladder; attribution senior).
export function recordChangeOrder(order, { band, reason, shayPct, acceptedByCustomer, note }) {
  const { order: next, entry } = appendChangeOrder(order, { band, reason, shayPct, acceptedByCustomer, note });
  persistPatch(order, { changeOrders: next.changeOrders, updatedAt: next.updatedAt });
  return entry;
}

export function removeOrder(order) {
  setState((cur) => cur.filter((o) => o.id !== order.id));
  if (order.remoteUuid) {
    mooreOrdersSync.deleteRow(order.remoteUuid)
      .catch((e) => console.warn('[moore-orders-sync] delete failed', e));
  }
}

// The hook every consumer uses.
export function useMooreOrders() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
