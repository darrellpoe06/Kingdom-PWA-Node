// =============================================================================
// ReadinessTab — is this door ready to take a guest?
// =============================================================================
// The Airbnb completion checklist, on the door it describes. Darrell asked for
// it as a standalone page on 2026-09-12 and then for it to live in the app; the
// engine's header carries the full reality-trace. The short version: real rows
// in board_tasks (0059, RLS-scoped, realtime-synced), NOTHING seeded, and the
// bedroom groups are the door's REAL property_rooms — never an invented count.
//
// Two writes, chosen so a 181-item list never floods the table:
//   · a task with no row yet  -> ensureTask() writes it the moment it is touched
//   · a task that has a row   -> patchTask() updates it
// An untouched door holds zero rows and still reads correctly, because Not
// Started is exactly what an untouched task is.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { useBoardTasks, ensureTask, patchTask, removeTask } from '../../lib/use-board-tasks.js';
import {
  READY_STATUS, READY_STATUS_ORDER,
  readinessBoard, rowForTask, patchForTask, buildCustomTask, bedroomsOf,
} from './readiness.js';

const ACCENT = '#2F5D50';
const LINE = '#E8E4DC';
const INK = '#1A1815';
const MUTED = '#6B665E';

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : tone === 'danger' ? 'bg-white text-[#9B2C1E] border-[#9B2C1E] hover:bg-[#9B2C1E] hover:text-white'
          : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const Card = ({ title, children, right }) => (
  <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3">
    {(title || right) && (
      <div className="flex items-baseline justify-between gap-3 mb-2">
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: ACCENT }}>{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </section>
);

const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
  maximumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
})}`;

/** One progress bar, one vocabulary — full turns green so "done" reads at a glance. */
const Bar = ({ pct, thin }) => (
  <div className={`w-full ${thin ? 'h-1' : 'h-2'} bg-[#F2EFE9] border border-[#E8E4DC]`} aria-hidden="true">
    <div className="h-full" style={{ width: `${pct}%`, background: pct === 100 ? ACCENT : '#B8860B' }} />
  </div>
);

/** A 44px-target checkbox — this list is worked from a phone, standing in the unit. */
function Check({ status, onToggle, label }) {
  const done = status === 'done';
  const started = status === 'in-progress';
  return (
    <button
      type="button" role="checkbox" aria-checked={done} aria-label={label}
      onClick={onToggle}
      className="flex-none w-7 h-7 border-2 flex items-center justify-center focus:outline focus:outline-2 focus:outline-[#2F5D50]"
      style={{
        borderColor: done ? ACCENT : started ? '#B8860B' : '#C9C2B6',
        background: done ? ACCENT : started ? '#FBF3E0' : '#FFFFFF',
      }}
    >
      {done && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {started && <span className="w-2.5 h-2.5" style={{ background: '#B8860B' }} />}
    </button>
  );
}

// ---------------------------------------------------------------------------

export function ReadinessTab({ boardSlug, boardTitle, rooms = [] }) {
  const tasks = useBoardTasks();
  const [view, setView] = useState('all');
  const [openSlug, setOpenSlug] = useState(null);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(null);      // `${sectionId}|${group}`
  const [addText, setAddText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const board = useMemo(
    () => readinessBoard(boardSlug, tasks, rooms),
    [boardSlug, tasks, rooms],
  );

  if (!boardSlug) {
    return <Card title="Ready for guests"><p className="text-[0.875rem]" style={{ color: MUTED }}>Pick a door first — this checklist belongs to one unit.</p></Card>;
  }

  // ---- writes -------------------------------------------------------------
  // A task with a row is patched; one without gets its row written now. Both
  // paths land in board_tasks, so every device sees the same state.
  const touch = (task, patch) => {
    if (task.row) patchTask(task.row, patchForTask(task, patch));
    else ensureTask(rowForTask(task, boardSlug, boardTitle, patch));
  };

  const setStatus = (task, status) => touch(task, { status });
  const toggle = (task) => setStatus(task, task.status === 'done' ? 'not-started' : 'done');

  const saveDraft = (task) => {
    const cost = draft.cost.trim() === '' ? null : Number(draft.cost);
    touch(task, {
      title: draft.title.trim() || task.title,
      note: draft.note,
      cost: Number.isFinite(cost) && cost >= 0 ? cost : null,
    });
    setOpenSlug(null);
    setDraft(null);
  };

  // A task the landlord added is deleted outright; a TEMPLATE task is marked
  // removed instead, because the template would otherwise put it straight back.
  const dropTask = (task) => {
    if (task.custom && task.row) removeTask(task.row);
    else touch(task, { removed: true });
    setOpenSlug(null);
    setDraft(null);
  };

  const addTask = (sectionId, group) => {
    const built = buildCustomTask(boardSlug, sectionId, group, addText, board.tasks.length);
    if (!built) return;
    ensureTask(rowForTask(built, boardSlug, boardTitle));
    setAddText('');
    setAdding(null);
  };

  // Reset deletes this door's rows. The template is code, so the list comes
  // back whole — what is thrown away is only the real state on top of it.
  const resetBoard = () => {
    for (const t of board.tasks) if (t.row) removeTask(t.row);
    setConfirmReset(false);
    setOpenSlug(null);
    setDraft(null);
  };

  const openEditor = (task) => {
    if (openSlug === task.slug) { setOpenSlug(null); setDraft(null); return; }
    setOpenSlug(task.slug);
    setDraft({ title: task.title, note: task.note || '', cost: task.cost == null ? '' : String(task.cost) });
  };

  const shown = (t) => (view === 'remaining' ? t.status !== 'done' : view === 'completed' ? t.status === 'done' : true);
  const { tally } = board;

  return (
    <>
      {/* ---- the dashboard ------------------------------------------------ */}
      <Card
        title="Ready for guests"
        right={<span className="text-[0.625rem] uppercase tracking-wider" style={{ color: MUTED }}>{boardTitle}</span>}
      >
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <div className="text-[2.75rem] leading-none font-semibold tabular-nums" style={{ color: tally.pct === 100 ? ACCENT : INK }}>
              {tally.pct}%
            </div>
            <div className="text-[0.625rem] uppercase tracking-wider mt-1" style={{ color: MUTED }}>Overall completion</div>
          </div>
          <div className="flex-1 min-w-[12rem] pb-2"><Bar pct={tally.pct} /></div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            ['Completed', String(tally.done), INK],
            ['Remaining', String(tally.left), INK],
            ['In progress', String(tally.started), INK],
            ['Est. remaining cost', money(tally.cost), ACCENT],
          ].map(([k, v, color]) => (
            <div key={k}>
              <dt className="text-[0.625rem] uppercase tracking-wider" style={{ color: MUTED }}>{k}</dt>
              <dd className="text-[1.0625rem] font-semibold tabular-nums" style={{ color }}>{v}</dd>
            </div>
          ))}
        </dl>

        <p className="text-[0.8125rem] mt-3 tabular-nums" style={{ color: MUTED }}>
          <strong style={{ color: INK }}>{tally.done} of {tally.total}</strong> tasks completed
          {tally.left ? <> · <strong style={{ color: INK }}>{tally.left}</strong> still to go</> : ' · every area is clear'}
        </p>
        <p className="text-[0.75rem] mt-2" style={{ color: MUTED }}>
          Saved to this door for everyone who manages it — the same list on your phone and at your desk.
        </p>
      </Card>

      {/* ---- progress by area --------------------------------------------- */}
      <Card title="Progress by area">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {board.sections.map((sec) => (
            <button
              key={sec.id} type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: false }))}
              className="text-left border p-2 focus:outline focus:outline-2 focus:outline-[#2F5D50]"
              style={{ borderColor: sec.tally.pct === 100 ? ACCENT : LINE, background: sec.tally.pct === 100 ? '#F1F6F3' : '#FFFFFF' }}
            >
              <div className="text-[0.6875rem] font-semibold leading-tight min-h-[2.2em]" style={{ color: INK }}>{sec.short}</div>
              <div className="flex items-baseline justify-between gap-1 my-1">
                <span className="text-[1.125rem] font-semibold tabular-nums" style={{ color: sec.tally.pct === 100 ? ACCENT : INK }}>{sec.tally.pct}%</span>
                <span className="text-[0.625rem] tabular-nums" style={{ color: MUTED }}>{sec.tally.done}/{sec.tally.total}</span>
              </div>
              <Bar pct={sec.tally.pct} thin />
            </button>
          ))}
        </div>
      </Card>

      {/* ---- the list ------------------------------------------------------ */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[['all', 'All', tally.total], ['remaining', 'Still needed', tally.left], ['completed', 'Completed', tally.done]].map(([id, label, n]) => (
          <Btn key={id} tone={view === id ? 'primary' : 'ghost'} onClick={() => setView(id)}>{label} {n}</Btn>
        ))}
      </div>

      {board.sections.map((sec) => {
        const visible = sec.tasks.filter(shown);
        if (!visible.length && view !== 'all') return null;
        const isShut = collapsed[sec.id];
        return (
          <Card
            key={sec.id}
            title={sec.name}
            right={
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: !c[sec.id] }))}
                className="text-[0.625rem] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#2F5D50]"
                style={{ color: MUTED }}
              >
                {sec.tally.done}/{sec.tally.total} · {sec.tally.pct}% {isShut ? '· show' : '· hide'}
              </button>
            }
          >
            {!isShut && sec.grouped && !bedroomsOf(rooms).length && (
              <p className="text-[0.875rem]" style={{ color: MUTED }}>
                No bedrooms are recorded for this door yet. Add them on the <strong style={{ color: INK }}>Rooms</strong> tab
                and each one gets its own {sec.tasks.length}-item list here — named the way you named the room.
              </p>
            )}

            {!isShut && sec.groups.map((grp) => {
              const rows = grp.tasks.filter(shown);
              if (!rows.length && view !== 'all') return null;
              const addKey = `${sec.id}|${grp.name}`;
              return (
                <div key={grp.name}>
                  {sec.grouped && (
                    <div className="flex items-center gap-2 pt-3 pb-1">
                      <span className="text-[0.625rem] uppercase tracking-wider font-semibold" style={{ color: MUTED }}>
                        {grp.name} · {grp.tally.done}/{grp.tally.total}
                      </span>
                      <span className="flex-1 h-px" style={{ background: LINE }} />
                    </div>
                  )}

                  <ul className="divide-y" style={{ borderColor: LINE }}>
                    {rows.map((task) => {
                      const isOpen = openSlug === task.slug;
                      return (
                        <li key={task.slug} className="py-2" style={{ borderColor: LINE }}>
                          <div className="flex items-start gap-3">
                            <Check
                              status={task.status}
                              label={`Mark "${task.title}" completed`}
                              onToggle={() => toggle(task)}
                            />
                            <button
                              type="button" onClick={() => openEditor(task)}
                              className="flex-1 text-left min-w-0 focus:outline focus:outline-2 focus:outline-[#2F5D50]"
                            >
                              <span
                                className="block text-[0.9375rem] leading-snug break-words"
                                style={{ color: task.status === 'done' ? MUTED : INK, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                              >
                                {task.title}
                              </span>
                              <span className="flex flex-wrap items-center gap-2 mt-1">
                                {task.status === 'in-progress' && (
                                  <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5" style={{ background: '#FBF3E0', color: '#8A6510' }}>In progress</span>
                                )}
                                {task.cost != null && (
                                  <span className="text-[0.6875rem] font-semibold tabular-nums px-1.5 py-0.5" style={{ background: '#F1F6F3', color: ACCENT }}>{money(task.cost)}</span>
                                )}
                                {task.custom && (
                                  <span className="text-[0.5625rem] uppercase tracking-wider" style={{ color: MUTED }}>added here</span>
                                )}
                                {task.note && (
                                  <span className="block w-full text-[0.8125rem] leading-snug pl-2 border-l-2" style={{ color: MUTED, borderColor: LINE }}>{task.note}</span>
                                )}
                              </span>
                            </button>
                          </div>

                          {isOpen && draft && (
                            <div className="mt-3 ml-10 grid gap-3">
                              <label>
                                <span className={lbl}>Task</span>
                                <input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                              </label>
                              <div>
                                <span className={lbl}>Status</span>
                                <div className="flex gap-2">
                                  {READY_STATUS_ORDER.map((s) => (
                                    <Btn key={s} tone={task.status === s ? 'primary' : 'ghost'} onClick={() => setStatus(task, s)}>
                                      {READY_STATUS[s].label}
                                    </Btn>
                                  ))}
                                </div>
                              </div>
                              <label>
                                <span className={lbl}>Cost / budget</span>
                                <input
                                  className={field} inputMode="decimal" placeholder="0"
                                  value={draft.cost}
                                  onChange={(e) => setDraft({ ...draft, cost: e.target.value.replace(/[^0-9.]/g, '') })}
                                />
                              </label>
                              <label>
                                <span className={lbl}>Notes</span>
                                <textarea
                                  className={field} rows={3} placeholder="Measurements, brand, store, who is doing it"
                                  value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <Btn tone="primary" onClick={() => saveDraft(task)}>Save</Btn>
                                <Btn onClick={() => { setOpenSlug(null); setDraft(null); }}>Cancel</Btn>
                                <span className="flex-1" />
                                <Btn tone="danger" onClick={() => dropTask(task)}>Delete task</Btn>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {view === 'all' && (adding === addKey ? (
                    <div className="flex flex-wrap gap-2 pt-3">
                      <input
                        className={`${field} flex-1 min-w-[12rem] w-auto`} value={addText} autoFocus
                        placeholder={sec.grouped ? `What else does ${grp.name} need?` : 'What else is needed?'}
                        onChange={(e) => setAddText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(sec.id, grp.name); } }}
                      />
                      <Btn tone="primary" onClick={() => addTask(sec.id, grp.name)}>Add</Btn>
                      <Btn onClick={() => { setAdding(null); setAddText(''); }}>Cancel</Btn>
                    </div>
                  ) : (
                    <div className="pt-3">
                      <Btn onClick={() => { setAdding(addKey); setAddText(''); }}>
                        + Add a task{sec.grouped ? ` to ${grp.name}` : ''}
                      </Btn>
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>
        );
      })}

      {/* ---- reset --------------------------------------------------------- */}
      <Card title="Start over">
        {confirmReset ? (
          <div>
            <p className="text-[0.875rem] mb-3" style={{ color: INK }}>
              This clears every checkmark, status, cost and note on this door, and deletes the tasks you added here.
              The original {board.tally.total}-item list stays. It cannot be undone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => setConfirmReset(false)}>Keep my progress</Btn>
              <Btn tone="danger" onClick={resetBoard}>Reset this checklist</Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Btn onClick={() => setConfirmReset(true)}>Reset checklist</Btn>
            <span className="text-[0.75rem]" style={{ color: MUTED }}>Asks before it clears anything.</span>
          </div>
        )}
      </Card>
    </>
  );
}

export default ReadinessTab;
