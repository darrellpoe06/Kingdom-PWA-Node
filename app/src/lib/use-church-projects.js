// =============================================================================
// use-church-projects — singleton store for the Love Corner Projects board
// =============================================================================
// House pattern (DR-0078): pure model in church-projects.js; this owns
// localStorage + the useSyncExternalStore hook + CRUD. Device-local for now
// (honest — DR-0076); a Supabase sync under the church instance (RLS, DR-0060)
// is the wired follow-up. Seeds merge as the baseline; user rows win by id.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { makeProject, mergeSeed, nextStage, SEED_PROJECTS } from './church-projects.js';

const LS_KEY = 'poetech-church-projects-v1';
const nowIso = () => new Date().toISOString();

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

let state = mergeSeed(loadLocal(), SEED_PROJECTS);
const listeners = new Set();

function saveLocal(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota / private mode */ } }
function emit() { saveLocal(state); for (const l of listeners) l(); }
function setState(updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

export function addProject(partial) {
  const project = makeProject(partial, { now: nowIso() });
  if (!project.title) return null;
  setState((cur) => [...cur, project]);
  return project;
}
export function updateProject(id, patch) {
  setState((cur) => cur.map((p) => (p.id === id ? makeProject({ ...p, ...patch }, { now: p.createdIso || nowIso() }) : p)));
}
export function setStage(id, stage) { updateProject(id, { stage }); }
export function advanceProject(id) {
  setState((cur) => cur.map((p) => (p.id === id ? makeProject({ ...p, stage: nextStage(p.stage) }, { now: p.createdIso || nowIso() }) : p)));
}
export function removeProject(id) { setState((cur) => cur.filter((p) => p.id !== id)); }

export function useChurchProjects() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
