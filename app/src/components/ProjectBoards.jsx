// =============================================================================
// ProjectBoards — the REAL, working Monday.com-style board system, in-app.
// =============================================================================
// Declared by Darrell (2026-06-30): "the app manages building the app." All work
// is tracked and DRIVEN forward from inside PoeTech — boards with items, STATUS
// labels, OWNERS, dates, and PROGRESS that rolls up per board. Live on the
// shared-persistence backbone (0059 board_tasks), synced, RLS-safe. NOT static.
//
// SHARED STATE (DR-0078 + 2026-07-01): the monolith is frozen, so this surface
// owns its data lifecycle — but the App Firm-Up headline needs the SAME live
// board_tasks so closing an item moves the completion % on its own. So the state
// + CRUD + the single realtime subscription live in lib/use-board-tasks.js (a
// module-level store); both this board and the headline read one source of truth.
//
// Every glyph here is a geometric/dingbat character (○ ◐ ▲ ✓ ▦ →), never a
// device-font emoji, so nothing tofus cross-device (consistency-guard). Text
// sizes are rem-based Tailwind tokens (never fixed-px) so the large-print
// control scales them.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';
import {
  useBoardTasks, addTask, patchTask, removeTask, cycleStatus, loadSeed, pushTask,
} from '../lib/use-board-tasks.js';
import {
  BOARD_STATUS, BOARD_STATUS_ORDER, statusMeta,
  boardProgress, groupTasks, tasksForBoard, mergedBoardList,
  SEED_BOARD_BY_SLUG, HANDOFF_TARGETS, taskHistory, isAiOwner,
} from '../lib/board.js';
import {
  FLOW_STEPS, FLOW_ORDER, hasValidationFlow, validationLanes, laneSummary,
  outcomeOf, outcomeMeta, nextOutcome,
} from '../lib/board-validation.js';
import { moduleLedger } from '../lib/completion.js';

// =============================================================================
export default function ProjectBoards({ isGovernor = false, currentUserPersona = null, projects = [] }) {
  const tasks = useBoardTasks();
  const [selected, setSelected] = useState(null);      // boardSlug currently open (null = board list)
  const [busy, setBusy] = useState(false);

  const doLoadSeed = async (boardSlug) => {
    setBusy(true);
    try { await loadSeed(boardSlug); } finally { setBusy(false); }
  };

  const boards = useMemo(() => mergedBoardList(tasks), [tasks]);
  const selectedBoard = useMemo(
    () => (selected ? boards.find((b) => b.slug === selected) : null),
    [boards, selected]
  );

  // Live metric for the modular-cutover board — real: the surface-registry count
  // (live from the registry) + the monolith line-count vs its frozen budget, read
  // from the deterministic module-ledger JSON (never a hardcoded/stale number).
  const liveMetric = useMemo(() => { const ledger = moduleLedger(); return { surfaces: ledger.surfaces, ledger }; }, []);

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
          onPush={pushTask}
          onLoadSeed={() => doLoadSeed(selectedBoard.slug)}
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
function BoardDetail({ board, tasks, spec, liveMetric, busy, currentUserPersona, onBack, onAddTask, onPatch, onRemove, onCycle, onPush, onLoadSeed }) {
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
            <MetricCell
              small
              label="Monolith line-count"
              value={liveMetric.ledger.monolithLines != null ? `${liveMetric.ledger.monolithLines.toLocaleString()} lines` : '—'}
              sub={liveMetric.ledger.frozenBudget != null
                ? `frozen ${liveMetric.ledger.frozenBudget.toLocaleString()} · may only go DOWN${liveMetric.ledger.measuredAt ? ` · measured ${new Date(liveMetric.ledger.measuredAt).toLocaleDateString()}` : ''}`
                : 'may only go DOWN'}
            />
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

      {/* The validation lane — Darrell's Current → Future → Gap → Decision
          workflow (DR-0118, from his Mosaic implementation board). Renders only
          when this board carries flow-tagged rows; plain boards are untouched.
          The same rows also stay listed in their group below (one data model,
          two views) so every edit affordance is preserved. */}
      {hasValidationFlow(tasks) && <ValidationLanes tasks={tasks} onPatch={onPatch} onCycle={onCycle} />}

      {groups.map((g) => (
        <div key={g.label} className="rounded-xl border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-[#E8E4DC] bg-[#FAF8F4] font-medium text-[#1A1815] text-sm">
            {g.label} <span className="text-[#5A5751] font-normal">· {g.tasks.length}</span>
          </div>
          <ul>
            {g.tasks.map((t) => (
              <TaskRow key={t.slug} task={t} currentUserPersona={currentUserPersona} onPatch={onPatch} onRemove={onRemove} onCycle={onCycle} onPush={onPush} />
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
// ValidationLanes — the sideways Current → Future → Gap → Decision walk, one
// lane per unit, 'All units' pinned first (DR-0118; Darrell's Mosaic-board
// workflow). Each cell: the step, the row's work status (tap = advance), and
// its validation OUTCOME chip (tap = cycle Fit → Partial fit → Gap → Unknown).
// A step with no row reads "not examined" — honest, never invented. The lane
// slides sideways on a phone (the thin tab-scroll bar shows what's off-screen).
// -----------------------------------------------------------------------------
export function ValidationLanes({ tasks, onPatch, onCycle }) {
  const { lanes, duplicates } = validationLanes(tasks);
  if (!lanes.length) return null;
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-wider text-[#5A5751] font-semibold">
        Validation — current → future → gap → decision
      </div>
      {lanes.map((lane) => {
        const sum = laneSummary(lane);
        const worst = outcomeMeta(sum.worst);
        return (
          <div key={lane.unit} className={`rounded-xl border bg-white overflow-hidden ${lane.allUnits ? 'border-[#1A1815]' : 'border-[#E8E4DC]'}`}>
            <div className="px-4 py-2 border-b border-[#E8E4DC] bg-[#FAF8F4] flex items-baseline justify-between gap-2 flex-wrap">
              <span className="font-medium text-[#1A1815] text-sm">
                {lane.allUnits ? '▦ All units impacted' : lane.unit}
              </span>
              <span className={`text-xs ${sum.decided ? 'text-[#5A6E3D]' : worst.text}`}>
                {sum.decided ? '✓ decided' : `${worst.symbol} ${worst.label.toLowerCase()} — open`}
              </span>
            </div>
            <div className="tab-scroll w-full overflow-x-auto overscroll-x-contain">
              <div className="flex items-stretch min-w-full">
                {FLOW_ORDER.map((stepKey, i) => {
                  const t = lane.steps[stepKey];
                  const step = FLOW_STEPS[stepKey];
                  return (
                    <div key={stepKey} className={`flex-1 min-w-[11rem] p-3 ${i > 0 ? 'border-l border-[#F0EDE6]' : ''}`}>
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1 flex items-center gap-1">
                        {i > 0 && <span aria-hidden="true" className="text-[#C9BFA8]">→</span>}
                        {step.label}
                      </div>
                      {t ? (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => onCycle(t)}
                            title={`${statusMeta(t.status).label} — tap to advance`}
                            className={`inline-flex items-center gap-1 text-xs ${statusMeta(t.status).text} focus:outline focus:outline-2 focus:outline-[#B85838] rounded`}
                          >
                            <span aria-hidden="true">{statusMeta(t.status).symbol}</span>
                            <span className="text-[#1A1815] text-left">{t.title}</span>
                          </button>
                          {(() => {
                            const o = outcomeOf(t);
                            const m = outcomeMeta(o);
                            return (
                              <button
                                onClick={() => onPatch(t, { links: { ...(t.links || {}), outcome: nextOutcome(o) } })}
                                title={`${m.blurb} — tap to change`}
                                className={`inline-flex items-center gap-1 rounded-full border ${m.border} ${m.text} px-2 py-0.5 text-xs focus:outline focus:outline-2 focus:outline-[#B85838]`}
                              >
                                <span aria-hidden="true">{m.symbol}</span>{m.label}
                              </button>
                            );
                          })()}
                          {t.notes && <div className="text-[0.6875rem] text-[#5A5751] leading-snug">{t.notes}</div>}
                        </div>
                      ) : (
                        <div className="text-xs text-[#5A5751] italic">— not examined</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      {duplicates.length > 0 && (
        <p className="text-[0.6875rem] text-[#B85838]">
          ▲ {duplicates.length} duplicate step row{duplicates.length > 1 ? 's' : ''} on this lane view (kept the first of each; tidy the extras in the group list below).
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TaskRow — one item: status chip (tap to cycle), title (click to edit), owner,
// due date, delete. Every control keyboard-focusable.
// -----------------------------------------------------------------------------
function TaskRow({ task, currentUserPersona, onPatch, onRemove, onCycle, onPush }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [open, setOpen] = useState(false);
  const m = statusMeta(task.status);
  const ownerIsAi = isAiOwner(task.owner);

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

        {/* Owner — an AI-owned item wears a subtle badge so the least-human split is legible at a glance. */}
        <span
          className={`hidden sm:inline-flex items-center gap-1 text-xs w-20 justify-end truncate ${ownerIsAi ? 'text-[#2A5A8E]' : 'text-[#5A5751]'}`}
          title={ownerIsAi ? `${task.owner} — AI / system owns this` : (task.owner ? `${task.owner} — needs a human` : 'no owner')}
        >
          {ownerIsAi && <span aria-hidden="true">◆</span>}{task.owner || '—'}
        </span>

        {/* Due date */}
        <input
          type="date" value={task.dueDate || ''}
          onChange={(e) => onPatch(task, { dueDate: e.target.value || null })}
          className="shrink-0 text-xs text-[#5A5751] bg-transparent focus:outline focus:outline-2 focus:outline-[#B85838] rounded"
          title="Due date"
        />

        <button onClick={() => setOpen((v) => !v)} className="shrink-0 text-[#5A5751] text-sm px-1 focus:outline focus:outline-2 focus:outline-[#B85838] rounded" title="Details" aria-expanded={open}>
          {open ? '▾' : '▸'}
        </button>
      </div>

      {/* Expanded editor: owner + status + notes + handoff + history + delete */}
      {open && (
        <div className="px-4 pb-3 pt-0 space-y-3 bg-[#FAF8F4]">
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
          {/* ANXIETY-CLARITY (Darrell 2026-07-04: "obvious issues like save
              buttons"): edits DO save on every change — say so, so nobody hunts
              for a Save button or fears losing work. */}
          <p className="text-[0.6875rem] text-[#5A6E3D]" role="status">
            ✓ Saves as you type — every change above is stored the moment you make it. No save button needed.
          </p>

          <Handoff task={task} currentUserPersona={currentUserPersona} onPush={onPush} />
          <HandoffHistory task={task} />

          <button onClick={() => onRemove(task)} className="text-xs text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838] rounded">
            Delete item
          </button>
        </div>
      )}
    </li>
  );
}

// -----------------------------------------------------------------------------
// Handoff — the two-way push control. Reassign an item to the OTHER party with a
// short note (what/why). Preview-then-execute: choosing a target reveals a note
// field + a plain-English preview of the reassignment before it commits; every
// push is logged to the item's history (see HandoffHistory). This is the record
// Darrell asked for so each side can see what the other is thinking.
// -----------------------------------------------------------------------------
function Handoff({ task, currentUserPersona, onPush }) {
  const [target, setTarget] = useState(null);   // the chosen destination (composing)
  const [note, setNote] = useState('');
  const by = currentUserPersona ? String(currentUserPersona) : null;
  const byLabel = by ? by.charAt(0).toUpperCase() + by.slice(1) : 'someone';
  const options = HANDOFF_TARGETS.filter((o) => o.value.toLowerCase() !== String(task.owner || '').toLowerCase());
  const chosen = HANDOFF_TARGETS.find((o) => o.value === target) || null;

  const send = () => {
    if (!target) return;
    onPush(task, { to: target, by, note });
    setTarget(null); setNote('');
  };

  if (!options.length) return null; // owner already both parties? nothing to push

  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-2 space-y-2">
      <div className="text-xs font-medium text-[#5A5751]">Hand this off · currently {task.owner || 'unassigned'}</div>
      {!target ? (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setTarget(o.value)}
              title={o.hint}
              className="rounded-full border border-[#2A5A8E] text-[#2A5A8E] px-3 py-1 text-xs hover:bg-[#2A5A8E] hover:text-white transition-colors focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              → {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-[#1A1815]">
            Reassign <span className="font-medium">{task.owner || 'unassigned'}</span> → <span className="font-medium">{chosen?.value}</span>
            <span className="text-[#5A5751]"> — {chosen?.hint}</span>
          </div>
          <textarea
            autoFocus value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Note — what / why (so the other side knows what you're thinking)"
            rows={2}
            className="w-full rounded border border-[#E8E4DC] px-2 py-1 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <div className="flex items-center gap-2">
            <button onClick={send} className="rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-1 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]">
              Send to {chosen?.value}
            </button>
            <button onClick={() => { setTarget(null); setNote(''); }} className="text-sm text-[#5A5751]">Cancel</button>
            <span className="text-xs text-[#5A5751]">logged as {byLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// HandoffHistory — the recorded two-way channel: every push (and every system
// re-default) on this item, newest first. Persisted on board_tasks.links.history
// so both sides see the same trail on every device.
// -----------------------------------------------------------------------------
function HandoffHistory({ task }) {
  const entries = taskHistory(task);
  if (!entries.length) return null;
  const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s);
  const when = (iso) => {
    const d = new Date(iso || '');
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-2">
      <div className="text-xs font-medium text-[#5A5751] mb-1">Handoff history · {entries.length}</div>
      <ul className="space-y-1">
        {[...entries].reverse().map((e, i) => (
          <li key={i} className="text-xs text-[#1A1815]">
            <span className="text-[#5A5751]">{when(e.at)}</span>{' · '}
            <span className="font-medium">{e.from || 'unassigned'}</span> → <span className="font-medium">{e.to}</span>
            {e.by ? <span className="text-[#5A5751]"> (by {cap(e.by)})</span> : null}
            {e.kind === 'default' ? <span className="text-[#5A5751]"> · auto</span> : null}
            {e.note ? <div className="text-[#5A5751] pl-1">“{e.note}”</div> : null}
          </li>
        ))}
      </ul>
    </div>
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
