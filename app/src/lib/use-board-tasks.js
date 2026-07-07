// =============================================================================
// use-board-tasks — ONE shared, live board-tasks store for the whole Projects hub
// =============================================================================
// The App Firm-Up rollup (the hub headline) and the ProjectBoards detail must
// read the SAME board_tasks, so that closing an item on the board moves the
// headline % on its own (Darrell 2026-07-01: the completion timeline is the
// firm-up timeline). A module-level singleton store gives every consumer one
// source of truth: any add/patch/status-cycle re-renders both the headline and
// the board in the same tick.
//
// It owns the data lifecycle the frozen monolith can't (DR-0078): localStorage
// persistence + a single board_tasks realtime subscription (no-op signed out,
// syncs on sign-in). CRUD writes optimistically, persists, then pushes to the
// cloud controller.
// =============================================================================
import { useSyncExternalStore } from 'react';
import { boardTasksSync, mergeRemoteBoardTasks } from './board-tasks-sync.js';
import {
  newTaskSlug, seedTasksForBoard, nextStatus, tasksForBoard, groupLabelOf,
  normalizeOwner, canonicalSeedOwner, taskHistory, makeHandoff, appendHistory,
  withPhaseCompletion,
} from './board.js';

const LS_KEY = 'poetech-board-tasks-v1';

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveLocal(tasks) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(tasks)); } catch { /* quota / private mode */ }
}

// local patch -> board_tasks snake_case columns, for updateRow.
const COLUMN = {
  title: 'title', status: 'status', owner: 'owner', group: 'group_label',
  startDate: 'start_date', dueDate: 'due_date', sortRank: 'sort_rank',
  notes: 'notes', boardSlug: 'board_slug', boardTitle: 'board_title',
  links: 'links',
};
function toColumnPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch)) if (COLUMN[k]) out[COLUMN[k]] = patch[k];
  return out;
}

// ---- the singleton store --------------------------------------------------
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
  // A single realtime subscription for the whole app. onRemote merges the cloud
  // list with any local-only rows (unionPreservingLocal), then re-renders all.
  boardTasksSync.subscribe((remote) => {
    setState((cur) => mergeRemoteBoardTasks(cur, remote));
    // After the cloud list lands (rows now carry their remoteUuid), correct any
    // still-backwards seed owner and persist it. Idempotent — a converged board
    // is a no-op, so this cannot loop.
    reconcileSeedOwners();
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

// ---- CRUD (shared by every consumer) --------------------------------------
export async function addTask({ boardSlug, boardTitle, group, title, owner = null }) {
  const slug = newTaskSlug(boardSlug);
  const rank = tasksForBoard(state, boardSlug)
    .filter((t) => groupLabelOf(t) === (group || 'General')).length;
  const item = {
    id: slug, slug, boardSlug, boardTitle, title: (title || '').trim(),
    status: 'not-started', owner, group: group || 'General',
    startDate: null, dueDate: null, sortRank: rank, notes: null, links: {},
  };
  setState((cur) => [...cur, item]);
  const res = await boardTasksSync.upload(item);
  if (res && res.uploaded && res.remoteId) {
    setState((cur) => cur.map((t) => (t.slug === slug ? { ...t, remoteUuid: res.remoteId } : t)));
  }
}

export function patchTask(task, patch) {
  // The finish ripple (DR-0120): a status patch that completes the LAST open
  // item of a phase (board group / swim lane) records the completion as an
  // append-only links.history entry in the SAME write — so the Timeline's
  // context feed and the board's phase walk update themselves the moment the
  // phase actually finishes, on every status path (chip tap, select, lane
  // cell, seed-sync). Real recorded moment, never an invented date (DR-0076).
  const full = withPhaseCompletion(state, task, patch, { at: new Date().toISOString() });
  setState((cur) => cur.map((t) => (t.slug === task.slug ? { ...t, ...full } : t)));
  if (task.remoteUuid) {
    boardTasksSync.updateRow(task.remoteUuid, toColumnPatch(full))
      .catch((e) => console.warn('[board-tasks-sync] update failed', e));
  }
}

export function removeTask(task) {
  setState((cur) => cur.filter((t) => t.slug !== task.slug));
  if (task.remoteUuid) {
    boardTasksSync.deleteRow(task.remoteUuid)
      .catch((e) => console.warn('[board-tasks-sync] delete failed', e));
  }
}

export function cycleStatus(task) {
  patchTask(task, { status: nextStatus(task.status) });
}

// ---- two-way handoff (the human↔AI push channel with a record) -------------
// Reassign an item to the OTHER party with a short note, and LOG the handoff to
// the item's history (who pushed → to whom, when, why). Owner change + note +
// history persist together on board_tasks.links (one patch), so both sides see
// the same record on every device. Darrell asked for this so he can push items
// he believes are the AI's back to it — and vice versa — with a trail of intent.
export function pushTask(task, { to, by = null, note = '' }) {
  const target = normalizeOwner(to);
  if (!target || normalizeOwner(task.owner) === target) return; // no-op: nowhere to push
  const entry = makeHandoff({
    at: new Date().toISOString(),
    from: normalizeOwner(task.owner),
    to: target,
    by: by || null,
    note,
    kind: 'handoff',
  });
  patchTask(task, { owner: target, links: appendHistory(task.links, entry) });
}

// ---- least-human self-heal (DR-0076: real state, not a painted display) -----
// A seed item that was written with the OLD backwards default (a system item
// assigned to a human) is corrected to its canonical least-human owner, and the
// correction is WRITTEN to the backbone + logged as a kind='default' history
// entry — so the DB truly reflects the rule, never just the UI. A deliberate
// handoff (any history entry) is senior: once a human has pushed an item, the
// system never silently overrides that intent. Idempotent: after one pass the
// owner already equals canonical, so it never fires again (no runaway).
function reconcileSeedOwners() {
  for (const t of state) {
    if (!t || !t.slug || !String(t.slug).startsWith('bt-seed-')) continue;
    const canonical = canonicalSeedOwner(t.boardSlug, t.slug);
    if (canonical === undefined) continue;
    if (normalizeOwner(t.owner) === canonical) continue;
    if (taskHistory(t).length > 0) continue; // a deliberate push already moved it
    const entry = makeHandoff({
      at: new Date().toISOString(),
      from: normalizeOwner(t.owner),
      to: canonical,
      by: 'System',
      note: 'Re-defaulted to least-human owner (a system-doable item was assigned to a human).',
      kind: 'default',
    });
    patchTask(t, { owner: canonical, links: appendHistory(t.links, entry) });
  }
}

// Load a seed board's real items — only the ones not already present (idempotent
// by stable slug), so a re-load fills gaps without clobbering edits.
export async function loadSeed(boardSlug) {
  const present = new Set(tasksForBoard(state, boardSlug).map((t) => t.slug));
  const rows = seedTasksForBoard(boardSlug)
    .filter((r) => !present.has(r.slug))
    .map((r) => ({ ...r, id: r.slug, links: r.links || {} }));
  if (!rows.length) return;
  setState((cur) => [...cur, ...rows]);
  for (const r of rows) {
    const res = await boardTasksSync.upload(r);
    if (res && res.uploaded && res.remoteId) {
      setState((cur) => cur.map((t) => (t.slug === r.slug ? { ...t, remoteUuid: res.remoteId } : t)));
    }
  }
}

// Correct any locally-cached rows on first load too (covers the signed-out /
// offline path where the cloud subscription is a no-op). Idempotent.
reconcileSeedOwners();

// The hook every consumer uses — returns the live task list, re-rendering on any
// change from any consumer or the realtime stream.
export function useBoardTasks() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
