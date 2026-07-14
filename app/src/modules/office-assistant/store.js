// =============================================================================
// office-assistant/store — the per-office persistence store factory
// =============================================================================
// House persistence pattern (DR-0078): the pure model is in model.js; this owns
// localStorage + the useSyncExternalStore hook + CRUD. `createOfficeStore(config,
// model)` returns an INDEPENDENT store namespaced by config.storageKey, so two
// offices never collide. Device-local for now (honest — DR-0076); a Supabase
// table sync per office instance is the wired follow-up. Seeds merge as the
// baseline on load; user rows win by id.
// =============================================================================
import { useSyncExternalStore } from 'react';

export function createOfficeStore(config, model) {
  const LS_KEY = config.storageKey;
  const nowIso = () => new Date().toISOString();

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return {
        orgs: Array.isArray(obj.orgs) ? obj.orgs : [],
        posts: Array.isArray(obj.posts) ? obj.posts : [],
        ideas: Array.isArray(obj.ideas) ? obj.ideas : [],
        // null (never touched) => fall back to the config's default schedule;
        // an array => staff have adjusted it and their list is authoritative.
        schedule: Array.isArray(obj.schedule) ? obj.schedule : null,
      };
    } catch {
      return { orgs: [], posts: [], ideas: [], schedule: null };
    }
  }
  function hydrate() {
    const local = loadLocal();
    return {
      orgs: model.mergeSeed(local.orgs, model.seedOrgs),
      posts: model.mergeSeed(local.posts, model.seedPosts),
      ideas: local.ideas, // real captures only — no seed
      // Default to the config schedule until staff edit it; then persist theirs.
      schedule: (local.schedule || model.seedSchedule).map((b) => model.makeBlock(b)),
    };
  }

  let state = hydrate();
  const listeners = new Set();
  function saveLocal(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota / private mode */ } }
  function emit() { saveLocal(state); for (const l of listeners) l(); }
  function setState(updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function getSnapshot() { return state; }

  function addOrg(partial) {
    const org = model.makeOrg(partial, { now: nowIso() });
    if (!org.organization) return null;
    setState((cur) => ({ ...cur, orgs: [...cur.orgs, org] }));
    return org;
  }
  function updateOrg(id, patch) {
    setState((cur) => ({
      ...cur,
      orgs: cur.orgs.map((o) => (o.id === id ? model.makeOrg({ ...o, ...patch }, { now: o.addedIso || nowIso() }) : o)),
    }));
  }
  const setOrgOutcome = (id, outcomeId) => updateOrg(id, { outcomeId });
  const markFlyerSent = (id) => updateOrg(id, { flyerSent: true });
  const recordEmail = (id) => updateOrg(id, { emailedOn: nowIso() });
  const recordCall = (id) => updateOrg(id, { calledOn: nowIso() });
  const setFollowUp = (id, followUpOn) => updateOrg(id, { followUpOn });

  function addPost(partial) {
    const post = model.makePost(partial, { now: nowIso() });
    setState((cur) => ({ ...cur, posts: [...cur.posts, post] }));
    return post;
  }
  function updatePost(id, patch) {
    setState((cur) => ({ ...cur, posts: cur.posts.map((p) => (p.id === id ? model.makePost({ ...p, ...patch }, { now: p.createdIso || nowIso() }) : p)) }));
  }
  function addIdea(text) {
    const idea = model.makeIdea({ text }, { now: nowIso() });
    if (!idea.text.trim()) return null;
    setState((cur) => ({ ...cur, ideas: [...cur.ideas, idea] }));
    return idea;
  }

  // Schedule (editable work-time blocks). Every write persists the WHOLE list, so
  // staff edits are authoritative and dependent surfaces (the CEO-meeting time,
  // read from schedule[0]) update from this one source — "update the spaces that
  // need that" (Darrell, 2026-07-14).
  function updateBlock(id, patch) {
    setState((cur) => ({ ...cur, schedule: cur.schedule.map((b) => (b.id === id ? model.makeBlock({ ...b, ...patch, id }) : b)) }));
  }
  function addBlock(partial = {}) {
    const block = model.makeBlock(partial);
    setState((cur) => ({ ...cur, schedule: [...cur.schedule, block] }));
    return block;
  }
  function removeBlock(id) {
    setState((cur) => ({ ...cur, schedule: cur.schedule.filter((b) => b.id !== id) }));
  }
  function resetSchedule() {
    setState((cur) => ({ ...cur, schedule: model.seedSchedule.map((b) => model.makeBlock(b)) }));
  }

  function useStore() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  return {
    useStore,
    addOrg, updateOrg, setOrgOutcome, markFlyerSent, recordEmail, recordCall, setFollowUp,
    addPost, updatePost, addIdea,
    updateBlock, addBlock, removeBlock, resetSchedule,
  };
}
