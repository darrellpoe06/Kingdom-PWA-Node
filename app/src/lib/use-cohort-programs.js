// =============================================================================
// use-cohort-programs — the singleton store for the Academy cohort operation
// =============================================================================
// The house persistence pattern (DR-0078): the pure model lives in
// cohort-programs.js; THIS file owns localStorage + the useSyncExternalStore
// hook + all CRUD. One module-level store, shared by every consumer, so any
// write re-renders the whole surface in one tick.
//
// Device-local by design for now (honest — DR-0076): cohort operations persist
// on THIS device. A Supabase table sync (the `*-sync.js` sibling) is the wired
// follow-up once the `cohort_*` tables land under the family instance (RLS,
// DR-0060) — a Tier-C schema change that needs the DB migration applied by hand.
// Until then nothing is painted: what you enter is really saved, on this device.
//
// Seeds (SEED-DATA-AS-ASPIRATION) are merged as the permanent baseline on load;
// user rows win by id. Seed rows carry `seed-` ids so a future sync can filter
// them out of any cloud upload.
// =============================================================================
import { useSyncExternalStore } from 'react';
import {
  makeProgram, makeEnrollment, makeTeamMember, makeRetroNote, makeInterest, mergeSeed,
  SEED_PROGRAMS, SEED_ENROLLMENTS, SEED_TEAM, SEED_RETROS,
} from './cohort-programs.js';

const LS_KEY = 'poetech-cohort-programs-v1';
const nowIso = () => new Date().toISOString();

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      programs: Array.isArray(obj.programs) ? obj.programs : [],
      enrollments: Array.isArray(obj.enrollments) ? obj.enrollments : [],
      team: Array.isArray(obj.team) ? obj.team : [],
      retros: Array.isArray(obj.retros) ? obj.retros : [],
      interests: Array.isArray(obj.interests) ? obj.interests : [],
    };
  } catch {
    return { programs: [], enrollments: [], team: [], retros: [], interests: [] };
  }
}

// Merge the persisted user data over the seed baseline once, at module load, so
// the snapshot identity is stable (a fresh merge on every getSnapshot would loop
// React). Writes replace `state` with a new object → one re-render.
function hydrate() {
  const local = loadLocal();
  return {
    programs: mergeSeed(local.programs, SEED_PROGRAMS),
    enrollments: mergeSeed(local.enrollments, SEED_ENROLLMENTS),
    team: mergeSeed(local.team, SEED_TEAM),
    retros: mergeSeed(local.retros, SEED_RETROS),
    interests: local.interests, // real prospective-family captures only — no seed
  };
}

let state = hydrate();
const listeners = new Set();

function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota / private mode — device-local best effort */ }
}
function emit() { saveLocal(state); for (const l of listeners) l(); }
function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater;
  emit();
}
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

// ---------------------------------------------------------------------------
// CRUD — programs
// ---------------------------------------------------------------------------
export function addProgram(partial) {
  const program = makeProgram(partial, { now: nowIso() });
  setState((cur) => ({ ...cur, programs: [...cur.programs, program] }));
  return program;
}
export function updateProgram(id, patch) {
  setState((cur) => ({
    ...cur,
    programs: cur.programs.map((p) => (p.id === id ? makeProgram({ ...p, ...patch }, { now: p.createdIso || nowIso() }) : p)),
  }));
}

// ---------------------------------------------------------------------------
// CRUD — enrollments
// ---------------------------------------------------------------------------
export function addEnrollment(partial) {
  const enr = makeEnrollment(partial, { now: nowIso() });
  if (!enr.programId || !enr.studentName) return null;
  setState((cur) => ({ ...cur, enrollments: [...cur.enrollments, enr] }));
  return enr;
}
export function setEnrollmentStatus(id, status) {
  setState((cur) => ({
    ...cur,
    enrollments: cur.enrollments.map((e) => (e.id === id ? makeEnrollment({ ...e, status }, { now: e.enrolledIso || nowIso() }) : e)),
  }));
}
export function recordPayment(id, amountCents, note = '') {
  setState((cur) => ({
    ...cur,
    enrollments: cur.enrollments.map((e) => {
      if (e.id !== id) return e;
      const payment = { amountCents: Math.max(0, Math.round(Number(amountCents) || 0)), iso: nowIso(), note: String(note || '') };
      return makeEnrollment({ ...e, payments: [...(e.payments || []), payment] }, { now: e.enrolledIso || nowIso() });
    }),
  }));
}

// ---------------------------------------------------------------------------
// CRUD — team
// ---------------------------------------------------------------------------
export function addTeamMember(partial) {
  const member = makeTeamMember(partial, { now: nowIso() });
  if (!member.programId || !member.name) return null;
  setState((cur) => ({ ...cur, team: [...cur.team, member] }));
  return member;
}
export function removeTeamMember(id) {
  setState((cur) => ({ ...cur, team: cur.team.filter((m) => m.id !== id) }));
}

// ---------------------------------------------------------------------------
// CRUD — retro notes
// ---------------------------------------------------------------------------
export function addRetroNote(partial) {
  const note = makeRetroNote(partial, { now: nowIso() });
  if (!note.programId || !note.note.trim()) return null;
  setState((cur) => ({ ...cur, retros: [...cur.retros, note] }));
  return note;
}

// ---------------------------------------------------------------------------
// CRUD — prospective-family interest (the public invite's pipeline end)
// ---------------------------------------------------------------------------
export function addInterest(partial) {
  const interest = makeInterest(partial, { now: nowIso() });
  if (!interest.parentName || !interest.email) return null;
  setState((cur) => ({ ...cur, interests: [...(cur.interests || []), interest] }));
  return interest;
}

// The hook every consumer imports — live, shared, auto-re-rendering.
export function useCohortPrograms() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
