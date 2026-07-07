// =============================================================================
// use-moore-classes — the shared, live classes store (sessions + paid seats)
// =============================================================================
// Mirrors use-moore-orders. Two lists, one store: class sessions and their
// signups. The engine rules (paid-seat holds, cap 10, 14-day one-on-one lead)
// live in moore-divahs.js; consumers call canBook/seatsLeft against this live
// data. A signup is only ever added WITH payment recorded (Shay's rule: money
// books the seat) — addPaidSignup is the only write path for seats.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { mooreSessionsSync, mooreSignupsSync } from './moore-classes-sync.js';
import { unionPreservingLocal } from './table-sync.js';
import { newClassSession, PAY_METHODS } from './moore-divahs.js';

const LS_KEY = 'poetech-moore-classes-v1';

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return obj && typeof obj === 'object'
      ? { sessions: Array.isArray(obj.sessions) ? obj.sessions : [], signups: Array.isArray(obj.signups) ? obj.signups : [] }
      : { sessions: [], signups: [] };
  } catch { return { sessions: [], signups: [] }; }
}
function saveLocal(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
}

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
  mooreSessionsSync.subscribe((remote) => {
    setState((cur) => ({ ...cur, sessions: unionPreservingLocal(cur.sessions, remote || []) }));
  });
  mooreSignupsSync.subscribe((remote) => {
    setState((cur) => ({ ...cur, signups: unionPreservingLocal(cur.signups, remote || []) }));
  });
}
function subscribe(listener) {
  ensureSubscribed();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return state; }

export async function addSession(partial) {
  const item = newClassSession(partial);
  setState((cur) => ({ ...cur, sessions: [...cur.sessions, item] }));
  const res = await mooreSessionsSync.upload(item);
  if (res && res.uploaded && res.remoteId) {
    setState((cur) => ({ ...cur, sessions: cur.sessions.map((s) => (s.id === item.id ? { ...s, remoteUuid: res.remoteId } : s)) }));
  }
  return item;
}

// The ONE seat-write path: a seat exists only WITH its payment record (money
// books the seat — a promise holds nothing, so an unpaid row is never written).
export async function addPaidSignup(session, { studentName, contactValue = '', method = 'square', now = null }) {
  const ts = now || new Date().toISOString();
  const item = {
    id: `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    sessionId: session.id,
    studentName: (studentName || '').trim(),
    contactValue,
    paidAt: ts,
    payMethod: PAY_METHODS.includes(method) ? method : 'other',
    seed: false,
  };
  setState((cur) => ({ ...cur, signups: [...cur.signups, item] }));
  const res = await mooreSignupsSync.upload(item);
  if (res && res.uploaded && res.remoteId) {
    setState((cur) => ({ ...cur, signups: cur.signups.map((s) => (s.id === item.id ? { ...s, remoteUuid: res.remoteId } : s)) }));
  }
  return item;
}

export function removeSession(session) {
  setState((cur) => ({
    ...cur,
    sessions: cur.sessions.filter((s) => s.id !== session.id),
    signups: cur.signups.filter((s) => s.sessionId !== session.id),
  }));
  if (session.remoteUuid) {
    mooreSessionsSync.deleteRow(session.remoteUuid)
      .catch((e) => console.warn('[moore-classes-sync] delete failed', e));
  }
}

export function useMooreClasses() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
