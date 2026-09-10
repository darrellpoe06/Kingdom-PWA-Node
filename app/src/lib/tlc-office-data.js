// =============================================================================
// tlc-office-data — the TLC office's inquiries + leads, standalone (DR-0344)
// =============================================================================
// Darrell, 2026-09-10: "there are tabs inside the PoeTech App that are not
// inside the TLC Therapy Solutions App?!" — Inquiries, Client Growth and
// Revenue lived only under the PoeTech shell, whose data store is the family
// books. The TLC door must never import that store (tlc-door.test.js), so
// this module binds the SAME two table syncs the shell uses (inquiries-sync,
// practice-leads-sync — same rows, same RLS) to a small store of their own:
// one initial read, a realtime subscription, and the same reducers the shell
// runs (upload → remoteUuid, updateRow patches by column, deleteRow). Signed
// out, the lists are empty and every write is a no-op the UI can see.
//
// No PHI: inquiries are pre-intake contact records (the Practice bright
// line); leads are marketing contacts. Both already ride instance RLS.
import { useEffect, useSyncExternalStore } from 'react';
import { inquiriesSync } from './inquiries-sync.js';
import { practiceLeadsSync, mergeRemoteLeads, LEAD_COLUMN_OF } from './practice-leads-sync.js';

let state = Object.freeze({ inquiries: [], practiceLeads: [], loaded: false, signedIn: false });
const listeners = new Set();
function emit() { for (const l of listeners) l(); }
function set(patch) { state = Object.freeze({ ...state, ...patch }); emit(); }
function subscribeStore(l) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state; }

let started = false;
let unsubs = [];
export function __resetTlcOfficeData() { started = false; for (const u of unsubs) { try { u(); } catch { /* noop */ } } unsubs = []; state = Object.freeze({ inquiries: [], practiceLeads: [], loaded: false, signedIn: false }); }

// One start per page load: read both tables, then follow their realtime.
export const OFFICE_READ_TIMEOUT_MS = 12000;
function bounded(p, ms) {
  let t;
  return Promise.race([p, new Promise((resolve) => { t = setTimeout(() => resolve({ skipped: 'timeout' }), ms); })]).finally(() => clearTimeout(t));
}

export async function startTlcOfficeData() {
  if (started) return state;
  started = true;
  // Bounded reads (SOUL.md): a dead connection never leaves the tabs blank forever.
  const [inq, leads] = await Promise.all([bounded(inquiriesSync.initialSync([]), OFFICE_READ_TIMEOUT_MS), bounded(practiceLeadsSync.initialSync([]), OFFICE_READ_TIMEOUT_MS)]);
  const signedIn = !(inq && (inq.skipped === 'signed-out' || inq.skipped === 'timeout'));
  set({
    inquiries: Array.isArray(inq && inq.merged) ? inq.merged : [],
    practiceLeads: Array.isArray(leads && leads.merged) ? leads.merged : [],
    loaded: true,
    signedIn,
  });
  if (!signedIn) { started = false; return state; }
  try {
    unsubs.push(inquiriesSync.subscribe((items) => set({ inquiries: items })));
    unsubs.push(practiceLeadsSync.subscribe((items) => set({ practiceLeads: mergeRemoteLeads(state.practiceLeads, items) })));
  } catch { /* realtime is optional; the initial read stands */ }
  return state;
}

// --- reducers: the shell's own, minus the family-books gate -------------------

export function addInquiry(item) {
  const nowIso = new Date().toISOString();
  const seeded = { ...item, id: `inq-${Date.now()}`, receivedAt: nowIso, status: 'new', statusHistory: [{ status: 'new', at: nowIso }] };
  set({ inquiries: [...state.inquiries, seeded] });
  inquiriesSync.upload(seeded).then((res) => {
    if (res && res.remoteId) set({ inquiries: state.inquiries.map((q) => (q.id === seeded.id ? { ...q, remoteUuid: res.remoteId } : q)) });
  }).catch(() => { /* the row stays on this device; the next read reconciles */ });
  return seeded;
}

export function inquiryPatch(local, updates) {
  const patch = {};
  if (updates.firstName !== undefined) patch.first_name = updates.firstName;
  if (updates.contactMethod !== undefined) patch.contact_method = updates.contactMethod;
  if (updates.contactValue !== undefined) patch.contact_value = updates.contactValue;
  if (updates.phone !== undefined && local.contactMethod !== 'email') patch.contact_value = updates.phone;
  if (updates.email !== undefined && local.contactMethod === 'email') patch.contact_value = updates.email;
  if (updates.interestArea !== undefined) patch.interest_area = updates.interestArea;
  if (updates.hasInsurance !== undefined) patch.has_insurance = updates.hasInsurance;
  if (updates.preferredProvider !== undefined) patch.preferred_provider = updates.preferredProvider;
  if (updates.bestTimeToCall !== undefined) patch.best_time_to_call = updates.bestTimeToCall;
  if (updates.source !== undefined) patch.source = updates.source;
  if (updates.sourceDetail !== undefined) patch.source_detail = updates.sourceDetail;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.status !== undefined) {
    patch.status = updates.status;
    patch.status_history = updates.status !== local.status
      ? [...(local.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }]
      : (local.statusHistory || []);
  }
  if (updates.conversationLog !== undefined) patch.conversation_log = updates.conversationLog;
  return patch;
}

export function updateInquiry(id, updates) {
  const local = state.inquiries.find((i) => i.id === id);
  set({ inquiries: state.inquiries.map((i) => (i.id === id
    ? { ...i, ...updates, statusHistory: updates.status && updates.status !== i.status ? [...(i.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }] : i.statusHistory }
    : i)) });
  if (local && local.remoteUuid) inquiriesSync.updateRow(local.remoteUuid, inquiryPatch(local, updates)).catch(() => {});
}

export function deleteInquiry(id) {
  const local = state.inquiries.find((i) => i.id === id);
  if (local && local.remoteUuid) inquiriesSync.deleteRow(local.remoteUuid).catch(() => {});
  set({ inquiries: state.inquiries.filter((i) => i.id !== id) });
}

export function addLead(lead) {
  set({ practiceLeads: [...state.practiceLeads, lead] });
  practiceLeadsSync.upload(lead).then((res) => {
    if (res && res.remoteId) set({ practiceLeads: state.practiceLeads.map((q) => (q.id === lead.id ? { ...q, remoteUuid: res.remoteId } : q)) });
  }).catch(() => {});
}

export function updateLead(id, updates) {
  const local = state.practiceLeads.find((l) => l.id === id);
  set({ practiceLeads: state.practiceLeads.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)) });
  if (local && local.remoteUuid) {
    const patch = {};
    for (const [localKey, column] of Object.entries(LEAD_COLUMN_OF)) if (updates[localKey] !== undefined) patch[column] = updates[localKey];
    if (Object.keys(patch).length) practiceLeadsSync.updateRow(local.remoteUuid, patch).catch(() => {});
  }
}

export function deleteLead(id) {
  const local = state.practiceLeads.find((l) => l.id === id);
  if (local && local.remoteUuid) practiceLeadsSync.deleteRow(local.remoteUuid).catch(() => {});
  set({ practiceLeads: state.practiceLeads.filter((l) => l.id !== id) });
}

// The hook the TLC door's sections read. Starts the store on first use.
export function useTlcOfficeData() {
  const snap = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);
  useEffect(() => { startTlcOfficeData(); }, []);
  return snap;
}
