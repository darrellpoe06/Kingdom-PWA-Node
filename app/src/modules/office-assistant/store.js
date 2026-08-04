// =============================================================================
// office-assistant/store — the per-office persistence store factory
// =============================================================================
// House persistence pattern (DR-0078): the pure model is in model.js; this owns
// localStorage + the useSyncExternalStore hook + CRUD. `createOfficeStore(config,
// model)` returns an INDEPENDENT store namespaced by config.storageKey, so two
// offices never collide. Cross-device sync is the office_records cloud
// (cloud.js, migration 0130 — DR-0271): attachCloud() wires outbound CRUD
// mirroring + inbound mergeRemote; with no cloud attached the store behaves
// exactly as before (device-local, fail-soft). Seeds merge as the baseline on
// load; user rows win by id; seeds never upload (every cloud row is real —
// DR-0061).
// =============================================================================
import { useSyncExternalStore } from 'react';

export function createOfficeStore(config, model) {
  const LS_KEY = config.storageKey;
  const nowIso = () => new Date().toISOString();
  // The optional cloud (cloud.js controller). All calls are fire-and-forget:
  // the UI never waits on the network, and a signed-out call no-ops.
  let cloud = null;

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

  // --- cloud wiring (DR-0271) ------------------------------------------------
  // stampRemote: record the cloud row uuid on a just-uploaded item WITHOUT
  // re-triggering an upload (it only bookkeeps). mergeRemote: fold the cloud
  // snapshot in — cloud is authoritative for synced rows; a never-uploaded
  // local record (no remoteUuid) and the local seed baseline both survive.
  const LIST_KEYS = { org: 'orgs', post: 'posts', idea: 'ideas' };
  function attachCloud(c) { cloud = c; }
  function getState() { return state; }
  function stampRemote(kind, id, remoteUuid) {
    const key = LIST_KEYS[kind];
    if (!key) return;
    setState((cur) => ({
      ...cur,
      [key]: cur[key].map((it) => (it.id === id ? { ...it, remoteUuid } : it)),
    }));
  }
  function mergeList(currentLocal, remoteItems, seeds) {
    const remote = remoteItems || [];
    if (!remote.length) {
      // An empty cloud read is not proof of deletion (the 2026-07-19 lesson):
      // keep what we have and wait for a real snapshot.
      return currentLocal;
    }
    const remoteIds = new Set(remote.map((r) => r.id));
    const keep = (currentLocal || []).filter((it) => {
      if (model.isSeedId ? model.isSeedId(it.id) : String(it.id).startsWith('seed-')) return !remoteIds.has(it.id);
      return !it.remoteUuid && !remoteIds.has(it.id);
    });
    const combined = [...remote, ...keep];
    return seeds ? model.mergeSeed(combined, seeds) : combined;
  }
  function mergeRemote(remote) {
    if (!remote) return;
    setState((cur) => ({
      ...cur,
      orgs: mergeList(cur.orgs, remote.orgs, model.seedOrgs),
      posts: mergeList(cur.posts, remote.posts, model.seedPosts),
      ideas: mergeList(cur.ideas, remote.ideas, null),
      schedule: (remote.schedule && Array.isArray(remote.schedule.blocks) && remote.schedule.blocks.length)
        ? remote.schedule.blocks.map((b) => model.makeBlock(b))
        : cur.schedule,
    }));
  }

  function addOrg(partial) {
    const org = model.makeOrg(partial, { now: nowIso() });
    if (!org.organization) return null;
    setState((cur) => ({ ...cur, orgs: [...cur.orgs, org] }));
    if (cloud) cloud.onAdd('org', org, stampRemote);
    return org;
  }
  function updateOrg(id, patch) {
    let updated = null;
    setState((cur) => ({
      ...cur,
      orgs: cur.orgs.map((o) => {
        if (o.id !== id) return o;
        updated = model.makeOrg({ ...o, ...patch }, { now: o.addedIso || nowIso() });
        // keep the sync bookkeeping the model doesn't know about
        if (o.remoteUuid) updated = { ...updated, remoteUuid: o.remoteUuid };
        return updated;
      }),
    }));
    if (cloud && updated) cloud.onUpdate('org', updated, stampRemote);
  }
  const setOrgOutcome = (id, outcomeId) => updateOrg(id, { outcomeId });
  const markFlyerSent = (id) => updateOrg(id, { flyerSent: true });
  const recordEmail = (id) => updateOrg(id, { emailedOn: nowIso() });
  const recordCall = (id) => updateOrg(id, { calledOn: nowIso() });
  const setFollowUp = (id, followUpOn) => updateOrg(id, { followUpOn });

  // Bulk import (from a parsed CSV). Skips rows with no organization name and
  // skips duplicates (same name + category already present), so re-importing the
  // same file is idempotent. Returns a { added, skipped, invalid } summary.
  function importOrgs(partials) {
    const rows = Array.isArray(partials) ? partials : [];
    const key = (o) => `${(o.organization || '').trim().toLowerCase()}|${o.categoryId || ''}`;
    let added = 0; let skipped = 0; let invalid = 0;
    const addedOrgs = [];
    setState((cur) => {
      const seen = new Set(cur.orgs.map(key));
      const next = [...cur.orgs];
      for (const p of rows) {
        const org = model.makeOrg(p, { now: nowIso() });
        if (!org.organization.trim()) { invalid += 1; continue; }
        const k = key(org);
        if (seen.has(k)) { skipped += 1; continue; }
        seen.add(k); next.push(org); added += 1; addedOrgs.push(org);
      }
      return { ...cur, orgs: next };
    });
    if (cloud) for (const org of addedOrgs) cloud.onAdd('org', org, stampRemote);
    return { added, skipped, invalid };
  }

  function addPost(partial) {
    const post = model.makePost(partial, { now: nowIso() });
    setState((cur) => ({ ...cur, posts: [...cur.posts, post] }));
    if (cloud) cloud.onAdd('post', post, stampRemote);
    return post;
  }
  function updatePost(id, patch) {
    let updated = null;
    setState((cur) => ({
      ...cur,
      posts: cur.posts.map((p) => {
        if (p.id !== id) return p;
        updated = model.makePost({ ...p, ...patch }, { now: p.createdIso || nowIso() });
        if (p.remoteUuid) updated = { ...updated, remoteUuid: p.remoteUuid };
        return updated;
      }),
    }));
    if (cloud && updated) cloud.onUpdate('post', updated, stampRemote);
  }
  function addIdea(text) {
    const idea = model.makeIdea({ text }, { now: nowIso() });
    if (!idea.text.trim()) return null;
    setState((cur) => ({ ...cur, ideas: [...cur.ideas, idea] }));
    if (cloud) cloud.onAdd('idea', idea, stampRemote);
    return idea;
  }

  // Schedule (editable work-time blocks). Every write persists the WHOLE list, so
  // staff edits are authoritative and dependent surfaces (the CEO-meeting time,
  // read from schedule[0]) update from this one source — "update the spaces that
  // need that" (Darrell, 2026-07-14).
  // Every schedule write syncs the WHOLE list (one cloud row, kind 'schedule')
  // — the same wholesale authority the local persistence already has.
  function syncSchedule() { if (cloud) cloud.onScheduleReplace(state.schedule); }
  function updateBlock(id, patch) {
    setState((cur) => ({ ...cur, schedule: cur.schedule.map((b) => (b.id === id ? model.makeBlock({ ...b, ...patch, id }) : b)) }));
    syncSchedule();
  }
  function addBlock(partial = {}) {
    const block = model.makeBlock(partial);
    setState((cur) => ({ ...cur, schedule: [...cur.schedule, block] }));
    syncSchedule();
    return block;
  }
  function removeBlock(id) {
    setState((cur) => ({ ...cur, schedule: cur.schedule.filter((b) => b.id !== id) }));
    syncSchedule();
  }
  function resetSchedule() {
    setState((cur) => ({ ...cur, schedule: model.seedSchedule.map((b) => model.makeBlock(b)) }));
    syncSchedule();
  }

  function useStore() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  return {
    useStore,
    addOrg, updateOrg, setOrgOutcome, markFlyerSent, recordEmail, recordCall, setFollowUp, importOrgs,
    addPost, updatePost, addIdea,
    updateBlock, addBlock, removeBlock, resetSchedule,
    // cloud wiring (DR-0271): attachOfficeCloud(store, cloud) uses these.
    attachCloud, getState, stampRemote, mergeRemote,
  };
}
