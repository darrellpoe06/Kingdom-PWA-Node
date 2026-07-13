// =============================================================================
// use-referral-ops — singleton store for the TLC referral database + assistant
// =============================================================================
// House persistence pattern (DR-0078): the pure model is in referral-ops.js;
// this owns localStorage + the useSyncExternalStore hook + CRUD. Device-local for
// now (honest — DR-0076); a Supabase table sync is the wired follow-up once the
// referral_* tables land under the TLC/business instance (RLS, DR-0060). Seeds
// merge as the baseline on load; user rows win by id.
// =============================================================================
import { useSyncExternalStore } from 'react';
import {
  makeOrg, makePost, makeIdea, mergeSeed, SEED_ORGS, SEED_POSTS,
} from './referral-ops.js';

const LS_KEY = 'poetech-referral-ops-v1';
const nowIso = () => new Date().toISOString();

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      orgs: Array.isArray(obj.orgs) ? obj.orgs : [],
      posts: Array.isArray(obj.posts) ? obj.posts : [],
      ideas: Array.isArray(obj.ideas) ? obj.ideas : [],
    };
  } catch {
    return { orgs: [], posts: [], ideas: [] };
  }
}

function hydrate() {
  const local = loadLocal();
  return {
    orgs: mergeSeed(local.orgs, SEED_ORGS),
    posts: mergeSeed(local.posts, SEED_POSTS),
    ideas: local.ideas, // real captures only — no seed
  };
}

let state = hydrate();
const listeners = new Set();

function saveLocal(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota / private mode */ } }
function emit() { saveLocal(state); for (const l of listeners) l(); }
function setState(updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

// ── orgs (the referral database) ────────────────────────────────────────────
export function addOrg(partial) {
  const org = makeOrg(partial, { now: nowIso() });
  if (!org.organization) return null;
  setState((cur) => ({ ...cur, orgs: [...cur.orgs, org] }));
  return org;
}
export function updateOrg(id, patch) {
  setState((cur) => ({
    ...cur,
    orgs: cur.orgs.map((o) => (o.id === id ? makeOrg({ ...o, ...patch }, { now: o.addedIso || nowIso() }) : o)),
  }));
}
export function setOrgOutcome(id, outcomeId) { updateOrg(id, { outcomeId }); }
export function markFlyerSent(id) { updateOrg(id, { flyerSent: true }); }
export function recordEmail(id) { updateOrg(id, { emailedOn: nowIso() }); }
export function recordCall(id) { updateOrg(id, { calledOn: nowIso() }); }
export function setFollowUp(id, followUpOn) { updateOrg(id, { followUpOn }); }

// ── posts (the content calendar) + ideas ─────────────────────────────────────
export function addPost(partial) {
  const post = makePost(partial, { now: nowIso() });
  setState((cur) => ({ ...cur, posts: [...cur.posts, post] }));
  return post;
}
export function updatePost(id, patch) {
  setState((cur) => ({ ...cur, posts: cur.posts.map((p) => (p.id === id ? makePost({ ...p, ...patch }, { now: p.createdIso || nowIso() }) : p)) }));
}
export function addIdea(text) {
  const idea = makeIdea({ text }, { now: nowIso() });
  if (!idea.text.trim()) return null;
  setState((cur) => ({ ...cur, ideas: [...cur.ideas, idea] }));
  return idea;
}

export function useReferralOps() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
