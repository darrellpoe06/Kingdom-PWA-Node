// =============================================================================
// ProjectBoards — the REAL, working Monday.com-style board system, in-app.
// =============================================================================
// Declared by Darrell (2026-06-30): "the app manages building the app." All work
// is tracked and DRIVEN forward from inside PoeTech — boards with items, STATUS
// labels, OWNERS, dates, and PROGRESS that rolls up per board. Live on the
// shared-persistence backbone (0058 board_tasks), synced, RLS-safe. NOT static.
//
// SELF-CONTAINED (DR-0078): the monolith is frozen, so this NEW surface owns its
// own data lifecycle — it subscribes to board_tasks directly (board-tasks-sync)
// and does its own CRUD, threading NO state through the shell. It reads the
// `projects` the hub already passes for coordination, but its items are the
// board_tasks rows. Signed out, it runs from localStorage and syncs on sign-in.
//
// Every glyph here is a geometric/dingbat character (○ ◐ ▲ ✓ ▦ →), never a
// device-font emoji, so nothing tofus cross-device (consistency-guard). Text
// sizes are rem-based Tailwind tokens (never fixed-px) so the large-print
// control scales them.
// =============================================================================
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';
import { SURFACES } from '../surfaces.js';
import { boardTasksSync, mergeRemoteBoardTasks } from '../lib/board-tasks-sync.js';
import {
  BOARD_STATUS, BOARD_STATUS_ORDER, statusMeta, nextStatus,
  boardProgress, groupTasks, tasksForBoard, mergedBoardList,
  newTaskSlug, seedTasksForBoard, SEED_BOARD_BY_SLUG, groupLabelOf,
} from '../lib/board.js';

const LS_KEY = 'poetech-board-tasks-v1';

// The monolith freeze constant is a real, dated figure (scripts/monolith-budget.json).
// Shown as context on the modular-cutover board's live metric, clearly as-of.
const MONOLITH_FROZEN_LINES = 9386;
const MONOLITH_FROZEN_AT = '2026-06-29';

// local patch -> board_tasks snake_case columns, for updateRow.
const COLUMN = {
  title: 'title', status: 'status', owner: 'owner', group: 'group_label',
  startDate: 'start_date', dueDate: 'due_date', sortRank: 'sort_rank',
  notes: 'notes', boardSlug: 'board_slug', boardTitle: 'board_title',
};
function toColumnPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch)) if (COLUMN[k]) out[COLUMN[k]] = patch[k];
  return out;
}

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

// =============================================================================
export default function ProjectBoards({ isGovernor = false, currentUserPersona = null, projects = [] }) {
  const [tasks, setTasks] = useState(loadLocal);
  const [selected, setSelected] = useState(null);      // boardSlug currently open (null = board list)
  const [busy, setBusy] = useState(false);

  // Subscribe to the cloud board_tasks (no-op signed out). onRemote fires with
  // the full instance list; merge with any local-only rows and persist.
  useEffect(() => {
    const unsub = boardTasksSync.subscribe((remote) => {
      setTasks((cur) => {
        const merged = mergeRemoteBoardTasks(cur, remote);
        saveLocal(merged);
        return merged;
      });
    });
    return unsub;
  }, []);

  // Persist every local change so a signed-out device keeps its board.
  const commit = useCallback((updater) => {
    setTasks((cur) => {
      const next = typeof updater === 'function' ? updater(cur) : updater;
      saveLocal(next);
      return next;
    });
  }, []);

  // ---- CRUD ----------------------------------------------------------------
  const addTask = useCallback(async ({ boardSlug, boardTitle, group, title, owner = null }) => {
    const slug = newTaskSlug(boardSlug);
    const existing = tasksForBoard(tasks, boardSlug);
    const rank = existing.filter((t) => groupLabelOf(t) === (group || 'General')).length;
    const item = {
      id: slug, slug, boardSlug, boardTitle, title: title.trim(),
      status: 'not-started', owner, group: group || 'General',
      startDate: null, dueDate: null, sortRank: rank, notes: null, links: {},
    };
    commit((cur) => [...cur, item]);
    const res = await boardTasksSync.upload(item);
    if (res && res.uploaded && res.remoteId) {
      commit((cur) => cur.map((t) => (t.slug === slug ? { ...t, remoteUuid: res.remoteId } : t)));
    }
  }, [tasks, commit]);

  const patchTask = useCallback((task, patch) => {
    commit((cur) => cur.map((t) => (t.slug === task.slug ? { ...t, ...patch } : t)));
    if (task.remoteUuid) {
      boardTasksSync.updateRow(task.remoteUuid, toColumnPatch(patch))
        .catch((e) => console.warn('[board-tasks-sync] update failed', e));
    }
  }, [commit]);

  const removeTask = useCallback((task) => {
    commit((cur) => cur.filter((t) => t.slug !== task.slug));
    if (task.remoteUuid) {
      boardTasksSync.deleteRow(task.remoteUuid)
        .catch((e) => console.warn('[board-tasks-sync] delete failed', e));
    }
  }, [commit]);

  const cycleStatus = useCallback((task) => {
    patchTask(task, { status: nextStatus(task.status) });
  }, [patchTask]);

  // Load a seed board's real items — only the ones not already present (so a
  // re-load fills gaps without clobbering edits). Idempotent by stable slug.
  const loadSeed = useCallback(async (boardSlug) => {
    setBusy(true);
    try {
      const present = new Set(tasksForBoard(tasks, boardSlug).map((t) => t.slug));
      const rows = seedTasksForBoard(boardSlug).filter((r) => !present.has(r.slug));
      if (!rows.length) return;
      const withIds = rows.map((r) => ({ ...r, id: r.slug, links: r.links || {} }));
      commit((cur) => [...cur, ...withIds]);
      for (const r of withIds) {
        const res = await boardTasksSync.upload(r);
        if (res && res.uploaded && res.remoteId) {
          commit((cur) => cur.map((t) => (t.slug === r.slug ? { ...t, remoteUuid: res.remoteId } : t)));
        }
      }
    } finally { setBusy(false); }
  }, [tasks, commit]);

  const boards = useMemo(() => mergedBoardList(tasks), [tasks]);
  const selectedBoard = useMemo(
    () => (selected ? boards.find((b) => b.slug === selected) : null),
    [boards, selected]
  );

  // Live metric for the modular-cutover board — real, computed from state.
  const liveMetric = useMemo(() => ({ surfaces: SURFACES.length }), []);

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Projects · Work boards">
        {selectedBoard ? selectedBoard.title : 'Boards'}
      </SectionTitle>

      {!selectedBoard && (
        <BoardList
          boards={boards}
          onOpen={setSelected}
          isGovernor={isGovernor}
          onCreateBoard={(title) => {
            // A brand-new board exists the moment its first item lands. We open it
            // by a fresh slug and seed a single starter row so it persists.
            const slug = `board-user-${Date.now().toString(36)}`;
            addTask({ boardSlug: slug, boardTitle: title.trim(), group: 'General', title: 'First item' });
            setSelected(slug);
          }}
        />
      )}

      {selectedBoard && (
        <BoardDetail
          board={selectedBoard}
          tasks={tasksForBoard(tasks, selectedBoard.slug)}
          spec={SEED_BOARD_BY_SLUG[selectedBoard.slug] || null}
          liveMetric={liveMetric}
          busy={busy}
          currentUserPersona={currentUserPersona}
          onBack={() => setSelected(null)}
          onAddTask={addTask}
          onPatch={patchTask}
          onRemove={removeTask}
          onCycle={cycleStatus}
          onLoadSeed={() => loadSeed(selectedBoard.slug)}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// BoardList — the board selector: one card per board with its live roll-up.
// -----------------------------------------------------------------------------
function BoardList({ boards, onOpen, onCreateBoard, isGovernor }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const totals = useMemo(() => {
    const items = boards.reduce((n, b) => n + (b.progress.total || 0), 0);
    const done = boards.reduce((n, b) => n + (b.progress.done || 0), 0);
    return { boards: boards.length, items, done };
  }, [boards]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCell label="Boards" value={String(totals.boards)} />
        <MetricCell label="Items tracked" value={String(totals.items)} />
        <MetricCell label="Done" value={String(totals.done)} accent="green" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {boards.map((b) => (
          <button
            key={b.slug}
            onClick={() => onOpen(b.slug)}
            className="text-left rounded-xl border border-[#E8E4DC] bg-white p-4 hover:border-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-[#1A1815]">{b.title}</div>
              <span className="text-[#5A5751] text-sm shrink-0">→</span>
            </div>
            {b.blurb && <div className="mt-1 text-sm text-[#5A5751] line-clamp-2">{b.blurb}</div>}
            <div className="mt-3">
              <ProgressBar progress={b.progress} seedCount={b.seedCount} />
            </div>
          </button>
        ))}
      </div>

      {/* Create a board — anyone with board access; governors also. */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="text-sm text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838] rounded"
        >
          + New board
        </button>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onCreateBoard(name); setName(''); setCreating(false); } }}
          className="flex gap-2 items-center"
        >
          <input
            autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Board name (e.g. Marketing launch)"
            className="flex-1 rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button type="submit" className="rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-2 text-sm">Create</button>
          <button type="button" onClick={() => { setCreating(false); setName(''); }} className="text-sm text-[#5A5751]">Cancel</button>
        </form>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ProgressBar — honest roll-up. Empty board → a "load / add items" note, never a
// fake 0%/100% bar.
// -----------------------------------------------------------------------------
function ProgressBar({ progress, seedCount = 0 }) {
  const { total, done, inProgress, blocked, pct } = progress;
  if (!total) {
    return (
      <div className="text-sm text-[#5A5751]">
        No items yet{seedCount ? ` — ${seedCount} real items ready to load` : ''}.
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#5A5751]">{done}/{total} done</span>
        <span className="font-medium text-[#1A1815]">{pct}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-[#1A1815]/10 overflow-hidden">
        <div className="h-full bg-[#5A6E3D]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex gap-3 text-xs text-[#5A5751]">
        {inProgress ? <span>◐ {inProgress} in progress</span> : null}
        {blocked ? <span className="text-[#B85838]">▲ {blocked} blocked</span> : null}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BoardDetail — one board: header + live metric + groups of items.
// -----------------------------------------------------------------------------
function BoardDetail({ board, tasks, spec, liveMetric, busy, currentUserPersona, onBack, onAddTask, onPatch, onRemove, onCycle, onLoadSeed }) {
  const progress = useMemo(() => boardProgress(tasks), [tasks]);
  const groups = useMemo(() => groupTasks(tasks, spec?.groupOrder || []), [tasks, spec]);
  const [addingGroup, setAddingGroup] = useState('');

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838] rounded">
        ← All boards
      </button>

      {spec?.blurb && <p className="text-sm text-[#5A5751]">{spec.blurb}</p>}

      {/* Roll-up + optional live metric */}
      <div className="rounded-xl border border-[#E8E4DC] bg-white p-4 space-y-3">
        <ProgressBar progress={progress} seedCount={spec ? (spec.items || []).length : 0} />
        {spec?.metric === 'modular-cutover' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <MetricCell small label="Surfaces on the registry (live)" value={String(liveMetric.surfaces)} accent="green" />
            <MetricCell small label={`Monolith frozen (${MONOLITH_FROZEN_AT})`} value={`${MONOLITH_FROZEN_LINES} lines`} sub="may only go DOWN" />
          </div>
        )}
        {/* Load the real seed items when a program board is empty. */}
        {spec && progress.total === 0 && (
          <button
            onClick={onLoadSeed} disabled={busy}
            className="rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-2 text-sm disabled:opacity-50"
          >
            {busy ? 'Loading…' : `Load the ${(spec.items || []).length} real items`}
          </button>
        )}
      </div>

      {groups.map((g) => (
        <div key={g.label} className="rounded-xl border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-[#E8E4DC] bg-[#FAF8F4] font-medium text-[#1A1815] text-sm">
            {g.label} <span className="text-[#5A5751] font-normal">· {g.tasks.length}</span>
          </div>
          <ul>
            {g.tasks.map((t) => (
              <TaskRow key={t.slug} task={t} onPatch={onPatch} onRemove={onRemove} onCycle={onCycle} />
            ))}
          </ul>
          <AddItem
            onAdd={(title) => onAddTask({ boardSlug: board.slug, boardTitle: board.title, group: g.label, title, owner: currentUserPersona })}
          />
        </div>
      ))}

      {/* Add a new group (column/section) by adding its first item. */}
      {addingGroup === '' ? (
        <button onClick={() => setAddingGroup('new')} className="text-sm text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838] rounded">
          + New group
        </button>
      ) : (
        <NewGroup
          onCreate={(groupName, title) => { onAddTask({ boardSlug: board.slug, boardTitle: board.title, group: groupName, title, owner: currentUserPersona }); setAddingGroup(''); }}
          onCancel={() => setAddingGroup('')}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TaskRow — one item: status chip (tap to cycle), title (click to edit), owner,
// due date, delete. Every control keyboard-focusable.
// -----------------------------------------------------------------------------
function TaskRow({ task, onPatch, onRemove, onCycle }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [open, setOpen] = useState(false);
  const m = statusMeta(task.status);

  return (
    <li className="border-b border-[#F0EDE6] last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Status chip — tap to advance to the next status. */}
        <button
          onClick={() => onCycle(task)}
          title={`${m.label} — tap to advance`}
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border ${m.border} ${m.text} px-2 py-0.5 text-xs focus:outline focus:outline-2 focus:outline-[#B85838]`}
        >
          <span aria-hidden="true">{m.symbol}</span>{m.label}
        </button>

        {/* Title */}
        {editing ? (
          <input
            autoFocus value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { if (draft.trim() && draft !== task.title) onPatch(task, { title: draft.trim() }); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(task.title); setEditing(false); } }}
            className="flex-1 rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
        ) : (
          <button
            onClick={() => { setDraft(task.title); setEditing(true); }}
            className={`flex-1 text-left text-sm focus:outline focus:outline-2 focus:outline-[#B85838] rounded ${task.status === 'done' ? 'text-[#5A5751] line-through' : 'text-[#1A1815]'}`}
          >
            {task.title}
          </button>
        )}

        {/* Owner */}
        <span className="hidden sm:block text-xs text-[#5A5751] w-20 truncate text-right" title={task.owner || ''}>
          {task.owner || '—'}
        </span>

        {/* Due date */}
        <input
          type="date" value={task.dueDate || ''}
          onChange={(e) => onPatch(task, { dueDate: e.target.value || null })}
          className="shrink-0 text-xs text-[#5A5751] bg-transparent focus:outline focus:outline-2 focus:outline-[#B85838] rounded"
          title="Due date"
        />

        <button onClick={() => setOpen((v) => !v)} className="shrink-0 text-[#5A5751] text-sm px-1 focus:outline focus:outline-2 focus:outline-[#B85838] rounded" title="Details">
          {open ? '▾' : '▸'}
        </button>
      </div>

      {/* Expanded editor: owner + notes + delete */}
      {open && (
        <div className="px-4 pb-3 pt-0 space-y-2 bg-[#FAF8F4]">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-[#5A5751]">Owner</label>
            <input
              value={task.owner || ''} onChange={(e) => onPatch(task, { owner: e.target.value || null })}
              placeholder="who owns it"
              className="rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            />
            <label className="text-xs text-[#5A5751]">Status</label>
            <select
              value={task.status} onChange={(e) => onPatch(task, { status: e.target.value })}
              className="rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {BOARD_STATUS_ORDER.map((s) => <option key={s} value={s}>{BOARD_STATUS[s].label}</option>)}
            </select>
          </div>
          <textarea
            value={task.notes || ''} onChange={(e) => onPatch(task, { notes: e.target.value || null })}
            placeholder="Notes / detail"
            rows={2}
            className="w-full rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button onClick={() => onRemove(task)} className="text-xs text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838] rounded">
            Delete item
          </button>
        </div>
      )}
    </li>
  );
}

// -----------------------------------------------------------------------------
// AddItem — inline "add item" per group.
// -----------------------------------------------------------------------------
function AddItem({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (val.trim()) { onAdd(val); setVal(''); } }}
      className="flex gap-2 items-center px-4 py-2 border-t border-[#F0EDE6]"
    >
      <span className="text-[#5A5751] text-sm" aria-hidden="true">+</span>
      <input
        value={val} onChange={(e) => setVal(e.target.value)}
        placeholder="Add an item"
        className="flex-1 text-sm text-[#1A1815] bg-transparent py-1 focus:outline focus:outline-2 focus:outline-[#B85838] rounded"
      />
      {val.trim() && <button type="submit" className="rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-1 text-sm">Add</button>}
    </form>
  );
}

function NewGroup({ onCreate, onCancel }) {
  const [group, setGroup] = useState('');
  const [title, setTitle] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (group.trim() && title.trim()) onCreate(group.trim(), title.trim()); }}
      className="rounded-xl border border-[#E8E4DC] bg-white p-3 space-y-2"
    >
      <input value={group} onChange={(e) => setGroup(e.target.value)} autoFocus placeholder="Group name (e.g. Design)"
        className="w-full rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="First item in this group"
        className="w-full rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-1 text-sm">Create group</button>
        <button type="button" onClick={onCancel} className="text-sm text-[#5A5751]">Cancel</button>
      </div>
    </form>
  );
}
