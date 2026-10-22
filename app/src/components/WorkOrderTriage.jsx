// =============================================================================
// WorkOrderTriage — every work order in the system, in the order it came in,
// with its notes (DR-1213)
// =============================================================================
// Darrell, 2026-10-22: "Where are the work orders in order that they came in
// with notes across the whole system?!" and "Work order triage". The Real
// Estate Action Queue (incidents, already in the shell's data) and Poe
// Properties' work orders (tenant_maintenance_requests, read here under the
// reader's own RLS) become one queue, numbered by arrival (lib/work-order-
// triage.js). Open work first, oldest first; then what is closed.
//
// HONEST STATES (DR-0076): while Poe Properties is being read the card says
// so; a read that fails says which part could not be read, and never shows
// the queue as if Poe Properties had no work orders.
//
// ACTING IN PLACE (DR-1215). Darrell, on a tap that only showed notes: "So I
// click it then what?!... Fix it end to end!!!" A tap opens the work order:
// its whole text, its notes, then what can be done next: move it along (by
// its own store's rules, lib/work-order-triage.js actionsFor), give it to a
// worker, add a note. An incident is written through the shell's own
// updateIncident and workerOps (the same lifecycle log the Action Queue
// writes); a Poe Properties work order through setWorkOrderStatus /
// assignWorkOrder / postNote, under the reader's RLS, and re-read after.
// A write that fails says so beside the button; nothing is claimed done
// until the store took it.
//
// A NEW WORK ORDER, AND THE WORKERS (Darrell, 2026-10-22: "805 N Prospect Ave
// Champaign IL the building... not one of the apartments... we need work done
// in the foyer... and other basement activities... how do we add a work order
// from scratch" and "Also seeing all workers outstanding and just a place to
// review the results"). "New work order" files one for a building's common
// areas (linked to the building, lib/building-group.js), for one apartment, or
// for nothing in particular, through the shell's own addIncident. "By worker"
// shows each worker's open work; "To review" shows the work the workers have
// finished that is still open, to accept (Resolve) or send back.
import React, { useEffect, useMemo, useState } from 'react';
import { triageQueue, cameInLabel, actionsFor, MOVE_TARGETS, BUILDING_AREAS, NEW_URGENCIES, newWorkOrder, workersBoard, resultsToReview, workersFinished, progressOf, ageOf, requiresResult, closingChecks } from '../lib/work-order-triage.js';
import { buildingsOf } from '../lib/building-group.js';
import { useBoardTasks, patchTask } from '../lib/use-board-tasks.js';
import { loadAllWorkOrders, setWorkOrderStatus, assignWorkOrder, postNote } from '../modules/properties/cloud.js';
import { buildTenancyNote } from '../modules/properties/model.js';

const REQUEST_OPS = {
  setStatus: (id, status) => setWorkOrderStatus(id, status),
  assign: (id, label) => assignWorkOrder(id, { assignedTo: null, assignedToLabel: label }),
  note: (record, body) => postNote(buildTenancyNote({ instanceId: record.instanceId, tenancyId: record.tenancyId, rentalId: record.rentalId, requestId: record.id, authorRole: 'owner', body })),
};

// A Projects board item is written through the board's own store (offline
// first, then its board_tasks row), the same path the board's chips use.
const TASK_OPS = { patch: (task, p) => patchTask(task, p) };
const appendLine = (notes, line) => [String(notes || '').trim(), line].filter(Boolean).join('\n');

const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

// Status colors carry meaning, never decoration, and true red is reserved
// (CLAUDE.md, Color Theology): blue is a worker on it, amber is waiting on you,
// rust is past due, green is finished and ready to check, gray is closed.
function tone(w, age) {
  if (!w.open && !w.resultWritten) return { label: 'No result written', cls: 'bg-[#F2EFE9] text-[#B45309] border border-[#B45309]' };
  if (!w.open) return { label: 'Closed', cls: 'bg-[#E8E4DC] text-[#5A5751]' };
  if (age.overdue) return { label: 'Past due', cls: 'bg-[#B85838] text-white' };
  if (workersFinished(w)) return { label: 'Check it', cls: 'bg-[#5A6E3D] text-white' };
  if ((w.workers || []).length) return { label: 'Worker on it', cls: 'bg-[#2A5A8E] text-white' };
  return { label: 'Needs a worker', cls: 'bg-[#F2EFE9] text-[#B45309] border border-[#B45309]' };
}

function Track({ w }) {
  const steps = progressOf(w);
  const at = steps.filter((x) => x.done).length;
  return (
    <span className="mt-1.5 flex items-center gap-1" aria-label={`Progress: ${at} of ${steps.length}, ${steps[at - 1].label}`} data-testid="work-order-track">
      {steps.map((x, k) => (
        <span key={x.key} className="flex items-center gap-1 min-w-0 flex-1">
          <span aria-hidden="true" className={`shrink-0 inline-block w-2.5 h-2.5 rounded-full border ${x.warn ? 'bg-[#B45309] border-[#B45309]' : x.done ? 'bg-[#5A6E3D] border-[#5A6E3D]' : 'bg-white border-[#B8B2A7]'}`} />
          <span className={`truncate text-[0.5625rem] ${x.warn ? 'text-[#B45309] font-semibold' : x.done ? 'text-[#1A1815]' : 'text-[#8A857C]'}`}>{x.label}</span>
          {k < steps.length - 1 && <span aria-hidden="true" className={`flex-1 h-px min-w-[6px] ${steps[k + 1].done ? 'bg-[#5A6E3D]' : 'bg-[#E8E4DC]'}`} />}
        </span>
      ))}
    </span>
  );
}

function doorLabeller(rentals) {
  const list = Array.isArray(rentals) ? rentals : [];
  const label = (r) => (r ? (String(r.name || '').trim() || [r.address, r.unit].filter(Boolean).join(' ').trim()) : '');
  return ({ localId, remoteId } = {}) => {
    const r = list.find((x) => (localId && x.id === localId) || (remoteId && x.remoteUuid === remoteId));
    return label(r);
  };
}

function Actions({ w, act, contractors, movers, busy, message }) {
  const [note, setNote] = useState('');
  const [worker, setWorker] = useState('');
  const [target, setTarget] = useState('');
  const [closing, setClosing] = useState(null);
  const [result, setResult] = useState('');
  const { moves, canAssign, canNote, canMove } = actionsFor(w);
  const canSendBack = w.open && w.record && w.record.kind === 'incident' && workersFinished(w);
  // The worker has no screen for a Real Estate work order, so the job goes to
  // their phone as a text the person sends (never sent on its own).
  const roster = Array.isArray(contractors) ? contractors : [];
  const textable = w.open ? (w.workers || []).map((p) => {
    const c = roster.find((x) => (p.contractorId && x.id === p.contractorId) || (x.name && x.name === p.name)) || {};
    const phone = String(p.phone || c.phone || '').replace(/[^\d+]/g, '');
    return phone ? { name: p.name, href: `sms:${phone}?&body=${encodeURIComponent(`Work order #${w.number}${w.door ? ` at ${w.door}` : ''}: ${w.fullText || w.title}`)}` } : null;
  }).filter(Boolean) : [];
  const places = MOVE_TARGETS.filter((t) => movers && typeof movers[t.key] === 'function');
  const people = (Array.isArray(contractors) ? contractors : []).filter((c) => c && c.name);
  const btn = `text-[0.6875rem] border border-[#B85838] text-[#B85838] px-2 py-1 min-h-[36px] disabled:opacity-50 ${FOCUS_RING}`;
  return (
    <div className="px-2 pb-2 space-y-2" data-testid="work-order-actions">
      {moves.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move this work order">
          {moves.map((m) => (
            <button key={m.to} type="button" disabled={busy} onClick={() => (requiresResult(m.to) ? setClosing(m) : act({ kind: 'status', to: m.to, label: m.label }))} className={btn} data-testid={`work-order-move-${m.to}`}>{m.label}</button>
          ))}
          {canSendBack && (
            <button type="button" disabled={busy} onClick={() => act({ kind: 'sendback' })} className={btn} data-testid="work-order-send-back">Send it back to the worker</button>
          )}
        </div>
      )}
      {textable.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="work-order-text">
          {textable.map((t) => <a key={t.name} href={t.href} className={`${btn} inline-flex items-center no-underline`}>Text the job to {t.name}</a>)}
        </div>
      )}
      {closing && (
        <form className="border border-[#5A6E3D] rounded-md p-2 space-y-1.5" data-testid="work-order-close"
          onSubmit={(e) => { e.preventDefault(); const t = result.trim(); if (!t) return; act({ kind: 'status', to: closing.to, label: closing.label, result: t }); setClosing(null); setResult(''); }}>
          <p className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#5A6E3D]">Before it closes: check the work</p>
          <ul className="space-y-0.5" data-testid="work-order-checks">
            {closingChecks(w).map((c, k) => (
              <li key={k} className={`text-[0.6875rem] ${c.ok ? 'text-[#1A1815]' : 'text-[#B45309]'}`}><span aria-hidden="true">{c.ok ? '✓' : '!'}</span> {c.text}</li>
            ))}
          </ul>
          <label className="text-[0.625rem] uppercase tracking-wider block" htmlFor={`wo-result-${w.key}`}>What was done? (kept on its record)</label>
          <textarea id={`wo-result-${w.key}`} rows={2} value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Replaced the foyer fixture and bulbs; tested both switches" className={`w-full text-xs border border-[#E8E4DC] px-2 py-1 ${FOCUS_RING}`} />
          <div className="flex flex-wrap gap-1.5">
            <button type="submit" disabled={busy || !result.trim()} className={`text-[0.6875rem] bg-[#5A6E3D] text-white px-3 min-h-[36px] disabled:opacity-50 ${FOCUS_RING}`} data-testid="work-order-close-go">Close it with this result</button>
            <button type="button" onClick={() => { setClosing(null); setResult(''); }} className={btn}>Not yet</button>
          </div>
        </form>
      )}
      {canMove && places.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="work-order-move">
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor={`wo-move-${w.key}`}>Not a work order? Move it to</label>
          <select id={`wo-move-${w.key}`} value={target} onChange={(e) => setTarget(e.target.value)} className={`text-xs border border-[#E8E4DC] px-1 min-h-[36px] ${FOCUS_RING}`}>
            <option value="">where it belongs…</option>
            {places.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <button type="button" disabled={busy || !target} onClick={() => { const t = places.find((p) => p.key === target); if (t) act({ kind: 'move', target: t }); setTarget(''); }} className={btn} data-testid="work-order-move-go">Move it</button>
        </div>
      )}
      {canAssign && (
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor={`wo-worker-${w.key}`}>Give it to</label>
          {people.length > 0 ? (
            <select id={`wo-worker-${w.key}`} value={worker} onChange={(e) => setWorker(e.target.value)} className={`text-xs border border-[#E8E4DC] px-1 min-h-[36px] ${FOCUS_RING}`}>
              <option value="">a worker…</option>
              {people.map((c) => <option key={c.id || c.name} value={c.id || c.name}>{c.name}</option>)}
            </select>
          ) : (
            <span className={`text-[0.625rem] ${MUTED}`}>No 1099 workers are on record yet (Real Estate → 1099 Workers).</span>
          )}
          {people.length > 0 && (
            <button type="button" disabled={busy || !worker} onClick={() => { const c = people.find((p) => (p.id || p.name) === worker); if (c) act({ kind: 'assign', contractor: c }); setWorker(''); }} className={btn} data-testid="work-order-assign">Assign</button>
          )}
        </div>
      )}
      {canNote && (
        <form className="flex flex-wrap gap-1.5" onSubmit={(e) => { e.preventDefault(); const t = note.trim(); if (t) { act({ kind: 'note', text: t }); setNote(''); } }}>
          <label className="sr-only" htmlFor={`wo-note-${w.key}`}>Add a note</label>
          <input id={`wo-note-${w.key}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className={`flex-1 min-w-[10rem] text-xs border border-[#E8E4DC] px-2 min-h-[36px] ${FOCUS_RING}`} />
          <button type="submit" disabled={busy || !note.trim()} className={btn} data-testid="work-order-note">Add note</button>
        </form>
      )}
      {message && <p role="status" className={`text-[0.625rem] ${message.ok ? MUTED : 'text-[#B85838]'}`} data-testid="work-order-result">{message.text}</p>}
    </div>
  );
}

function NewWorkOrder({ rentals, addIncident, onSaved }) {
  const buildings = useMemo(() => buildingsOf(rentals), [rentals]);
  const doors = (Array.isArray(rentals) ? rentals : []).filter((r) => r && r.id && String(r.name || r.address || '').trim());
  const [where, setWhere] = useState(buildings.length ? `b:${buildings[0].key}` : '');
  const [area, setArea] = useState(BUILDING_AREAS[0]);
  const [words, setWords] = useState('');
  const [urgency, setUrgency] = useState('incident');
  const [error, setError] = useState('');
  const isBuilding = where.startsWith('b:');
  const field = `text-xs border border-[#E8E4DC] bg-white px-2 min-h-[36px] w-full ${FOCUS_RING}`;
  const save = (e) => {
    e.preventDefault();
    if (!where) { setError('Pick where the work is first.'); return; }
    let spot = { kind: 'none' };
    if (isBuilding) spot = { kind: 'building', key: where.slice(2) };
    else if (where.startsWith('d:')) { const r = doors.find((x) => x.id === where.slice(2)); spot = { kind: 'door', id: where.slice(2), entityId: r && r.entityId }; }
    const made = newWorkOrder({ where: spot, area: isBuilding ? area : '', words, urgency });
    if (made.error) { setError(made.error); return; }
    try {
      const id = addIncident(made.item);
      setWords(''); setError('');
      onSaved(made.item, id);
    } catch (err) {
      setError(`Not saved: ${(err && err.message) || 'unexpected'}.`);
    }
  };
  return (
    <form onSubmit={save} className="mt-2 border border-[#E8E4DC] rounded-md p-2 space-y-2" data-testid="work-order-new-form">
      <div>
        <label className="text-[0.625rem] uppercase tracking-wider" htmlFor="wo-new-where">Where is the work?</label>
        <select id="wo-new-where" value={where} onChange={(e) => setWhere(e.target.value)} className={field}>
          {/* Never a silent default to "nowhere": with no building to lead
              with, the person picks (a building's work, one door, or none). */}
          {!buildings.length && <option value="">Pick where the work is…</option>}
          {buildings.length > 0 && (
            <optgroup label="A building's common areas (not one apartment)">
              {buildings.map((b) => <option key={b.key} value={`b:${b.key}`}>{b.label}: the building ({b.doors.length} doors)</option>)}
            </optgroup>
          )}
          {doors.length > 0 && (
            <optgroup label="One apartment or door">
              {doors.map((r) => <option key={r.id} value={`d:${r.id}`}>{String(r.name || r.address).trim()}</option>)}
            </optgroup>
          )}
          <option value="none">Not a property</option>
        </select>
      </div>
      {isBuilding && (
        <div>
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor="wo-new-area">Which part of the building?</label>
          <select id="wo-new-area" value={area} onChange={(e) => setArea(e.target.value)} className={field}>
            {BUILDING_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="text-[0.625rem] uppercase tracking-wider" htmlFor="wo-new-words">What needs doing?</label>
        <textarea id="wo-new-words" rows={3} value={words} onChange={(e) => setWords(e.target.value)} placeholder="e.g. Replace the foyer light, patch the stair wall" className={`text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 w-full ${FOCUS_RING}`} />
      </div>
      <div>
        <label className="text-[0.625rem] uppercase tracking-wider" htmlFor="wo-new-urgency">How soon?</label>
        <select id="wo-new-urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)} className={field}>
          {NEW_URGENCIES.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
        </select>
      </div>
      {error && <p role="status" className="text-[0.625rem] text-[#B85838]" data-testid="work-order-new-error">{error}</p>}
      <button type="submit" className={`text-[0.6875rem] bg-[#1A1815] text-white px-3 min-h-[36px] ${FOCUS_RING}`} data-testid="work-order-new-save">Save the work order</button>
    </form>
  );
}

function WorkersView({ board, openJob }) {
  if (board.busy.length === 0) {
    return <p className={`mt-2 text-xs ${MUTED}`} data-testid="work-order-workers-none">No worker has open work. Open a work order and use Give it to.{board.idle.length ? ` On the roster: ${board.idle.join(', ')}.` : ''}</p>;
  }
  return (
    <div className="mt-2 space-y-2" data-testid="work-order-workers">
      {board.busy.map((p) => (
        <div key={p.name} className="border border-[#E8E4DC] rounded-md p-2" data-testid="work-order-worker">
          <p className="text-xs font-semibold">{p.name}</p>
          <p className={`text-[0.625rem] ${MUTED}`}>{p.open.length - p.doneOpen} to do · {p.doneOpen} done, waiting on your review</p>
          <ul className="mt-1 space-y-1">
            {p.open.map(({ w, piece }) => (
              <li key={w.key}>
                <button type="button" onClick={() => openJob(w.key)} className={`w-full text-left text-[0.6875rem] border border-[#E8E4DC] px-2 py-1 min-h-[36px] ${FOCUS_RING}`}>
                  <span className="font-semibold text-[#B85838]">#{w.number}</span> <span className="line-clamp-1 inline">{w.title}</span>
                  <span className={`block text-[0.625rem] ${MUTED}`}>{w.door || w.sourceLabel} · {piece.status === 'done' ? 'their part is done' : 'assigned'} · came in {cameInLabel(w.cameInAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {board.idle.length > 0 && <p className={`text-[0.625rem] ${MUTED}`}>Nothing open for: {board.idle.join(', ')}.</p>}
    </div>
  );
}

function Row({ w, expanded, onToggle, act, contractors, movers, busy, message }) {
  const crew = w.crew.length ? w.crew.join(', ') : '';
  const age = ageOf(w);
  const t = tone(w, age);
  return (
    <li className={`border rounded-md bg-white ${age.overdue ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`} data-testid="work-order">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className={`w-full text-left p-2 ${FOCUS_RING}`}>
        <span className="flex items-baseline gap-2">
          <span className="text-[0.625rem] font-semibold text-[#B85838] whitespace-nowrap" data-testid="work-order-number">#{w.number}</span>
          {/* Two lines at most: a thought filed as a work order can be a whole
              recorded conversation, and it buried the queue (the #4 screenshot). */}
          <span className="min-w-0 flex-1 text-xs font-semibold line-clamp-2" data-testid="work-order-title">{w.title}</span>
          <span className={`text-[0.5625rem] uppercase tracking-wider whitespace-nowrap rounded-full px-1.5 py-0.5 font-semibold ${t.cls}`} data-testid="work-order-tone">{t.label}</span>
        </span>
        <Track w={w} />
        <span className={`block text-[0.625rem] ${MUTED} mt-0.5`}>
          {age.label ? <span className={age.overdue ? 'text-[#B85838] font-semibold' : ''} data-testid="work-order-age">{age.label} · </span> : null}
          came in {cameInLabel(w.cameInAt)} · {w.sourceLabel}
          {w.door ? ` · ${w.door}` : ''}
          {w.urgency ? ` · ${w.urgency}` : ''}
          {crew ? ` · ${crew}` : ''}
          {` · ${w.notes.length} note${w.notes.length === 1 ? '' : 's'}`}
          {expanded ? '' : ' · tap to open'}
        </span>
      </button>
      {expanded && (
        <>
          {(w.fullText || '').length > 120 && <p className="px-2 pb-2 text-[0.6875rem] leading-snug whitespace-pre-wrap" data-testid="work-order-full">{w.fullText}</p>}
          <ol className="px-2 pb-2 space-y-1" data-testid="work-order-notes">
            {w.notes.map((n, k) => (
              <li key={k} className="text-[0.6875rem] leading-snug">
                <span className={`${MUTED} whitespace-nowrap`}>{cameInLabel(n.at)}</span>
                <span> — {n.text}</span>
              </li>
            ))}
            {w.notes.length === 0 && <li className={`text-[0.6875rem] ${MUTED}`}>No notes were written on this work order.</li>}
          </ol>
          {act && <Actions w={w} act={act} contractors={contractors} movers={movers} busy={busy} message={message} />}
        </>
      )}
    </li>
  );
}

export default function WorkOrderTriage({ incidents = [], rentals = [], contractors = [], updateIncident = null, addIncident = null, workerOps = null, movers = null, requestOps = REQUEST_OPS, load = loadAllWorkOrders, useTasks = useBoardTasks, taskOps = TASK_OPS }) {
  const tasks = useTasks();
  const [view, setView] = useState('queue');
  const [adding, setAdding] = useState(false);
  const [cloud, setCloud] = useState({ state: 'loading', requests: [], docs: [], events: [], notes: [], unreadable: [] });
  const [expanded, setExpanded] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const [reads, setReads] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [last, setLast] = useState(null);

  useEffect(() => {
    let live = true;
    Promise.resolve(load()).then((res) => {
      if (!live) return;
      if (res && res.ok) setCloud({ state: 'read', requests: res.requests || [], docs: res.docs || [], events: res.events || [], notes: res.notes || [], unreadable: res.unreadable || [] });
      else setCloud({ state: 'failed', requests: [], docs: [], events: [], notes: [], unreadable: [], reason: (res && (res.error || res.reason)) || 'could not be read' });
    }).catch((e) => { if (live) setCloud({ state: 'failed', requests: [], docs: [], events: [], notes: [], unreadable: [], reason: (e && e.message) || 'could not be read' }); });
    return () => { live = false; };
  }, [load, reads]);

  const doorLabelOf = useMemo(() => doorLabeller(rentals), [rentals]);
  const queue = useMemo(
    () => triageQueue({ incidents, requests: cloud.requests, docs: cloud.docs, events: cloud.events, notes: cloud.notes, tasks, doorLabelOf }),
    [incidents, cloud, tasks, doorLabelOf],
  );
  const toggle = (key) => { setExpanded((k) => (k === key ? null : key)); setMessage(null); };

  // One action, written to the store the work order lives in.
  const actOn = (w) => async (a) => {
    const r = w.record;
    setBusy(true); setMessage(null);
    try {
      let res = { ok: true };
      if (r.kind === 'incident') {
        if (!updateIncident) throw new Error('this screen cannot write Real Estate work orders');
        if (a.kind === 'status') {
          if (requiresResult(a.to) && !String(a.result || '').trim()) throw new Error('say what was done before it closes');
          const note = a.result ? `${a.label}: ${a.result}` : `${a.label} (from the triage)`;
          updateIncident(r.id, { status: a.to, _note: note, ...(a.to === 'resolved' ? { resolvedAt: new Date().toISOString().slice(0, 10) } : {}) });
        } else if (a.kind === 'assign') {
          if (!workerOps || !workerOps.onAssign) throw new Error('this screen cannot assign workers');
          workerOps.onAssign(r.id, a.contractor, a.contractor.type || 'contractor');
        } else if (a.kind === 'note') {
          updateIncident(r.id, { _logNote: a.text });
        } else if (a.kind === 'sendback') {
          if (!workerOps || !workerOps.onReopen) throw new Error('this screen cannot send work back');
          for (const p of w.workers || []) if (p.status === 'done' && p.assignmentId) workerOps.onReopen(r.id, p.assignmentId);
          updateIncident(r.id, { _logNote: 'Sent back to the worker from the triage review' });
        } else if (a.kind === 'move') {
          const send = movers && movers[a.target.key];
          if (typeof send !== 'function') throw new Error(`this screen cannot send to ${a.target.done}`);
          // The words go first, whole; only then does the work order close.
          const words = w.fullText || w.title;
          if (a.target.key === 'pastor') send({ id: `vo-${Date.now()}`, kind: 'pastor', text: words, from: '', at: new Date().toISOString() });
          else if (a.target.key === 'prayer') send({ requester: 'church family', request: words, shareWithChurch: true });
          else send(words);
          updateIncident(r.id, { status: 'converted', _note: `Moved to ${a.target.done} from the triage; its words are kept here and there` });
        }
      } else if (r.kind === 'task') {
        const task = (Array.isArray(tasks) ? tasks : []).find((t) => (t.slug || t.id) === r.id);
        if (!task) throw new Error('this board item is no longer on its board');
        if (a.kind === 'status') {
          if (requiresResult(a.to) && !String(a.result || '').trim()) throw new Error('say what was done before it closes');
          taskOps.patch(task, a.result ? { status: a.to, notes: appendLine(task.notes, `Result: ${a.result}`) } : { status: a.to });
        } else if (a.kind === 'assign') {
          taskOps.patch(task, { owner: a.contractor.name });
        } else if (a.kind === 'note') {
          taskOps.patch(task, { notes: appendLine(task.notes, a.text) });
        }
      } else {
        if (a.kind === 'status') {
          if (requiresResult(a.to) && !String(a.result || '').trim()) throw new Error('say what was done before it closes');
          // The result goes on its record first; only then does it move.
          if (a.result) res = await requestOps.note(r, `Result: ${a.result}`);
          if (res && res.ok) res = await requestOps.setStatus(r.id, a.to);
        }
        else if (a.kind === 'assign') res = await requestOps.assign(r.id, a.contractor.name);
        else if (a.kind === 'note') res = await requestOps.note(r, a.text);
        if (res && res.ok) setReads((n) => n + 1);
      }
      setLast(null);
      const said = (res && res.ok
        ? { ok: true, text: a.kind === 'status' ? `Done: ${a.label}.` : a.kind === 'assign' ? `Given to ${a.contractor.name}.` : a.kind === 'move' ? `Moved to ${a.target.done}. It has left the open work orders; its words are kept.` : a.kind === 'sendback' ? 'Sent back: the worker\'s part is open again.' : 'Note added.' }
        : { ok: false, text: `Not saved: ${(res && (res.error || res.reason)) || 'the store refused it'}.` });
      setMessage(said);
      // A move or a close takes the row out of the open list, so the card says
      // what happened where it will still be seen (the journey walk, DR-0239 §2).
      setLast({ ...said, text: `#${w.number}: ${said.text}` });
    } catch (e) {
      setMessage({ ok: false, text: `Not saved: ${(e && e.message) || 'unexpected'}.` });
      setLast({ ok: false, text: `#${w.number}: Not saved: ${(e && e.message) || 'unexpected'}.` });
    } finally {
      setBusy(false);
    }
  };
  const board = useMemo(() => workersBoard(queue, contractors), [queue, contractors]);
  const review = useMemo(() => resultsToReview(queue), [queue]);
  const openJob = (key) => { setView('queue'); setExpanded(key); setMessage(null); };
  const tab = (id, label) => (
    <button type="button" key={id} onClick={() => setView(id)} aria-pressed={view === id} data-testid={`work-order-view-${id}`}
      className={`text-[0.625rem] uppercase tracking-wider border px-2 min-h-[36px] ${view === id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC]'} ${FOCUS_RING}`}>{label}</button>
  );
  const rowProps = (w) => ({ w, expanded: expanded === w.key, onToggle: () => toggle(w.key), act: actOn(w), contractors, movers, busy, message: expanded === w.key ? message : null });

  return (
    <section aria-labelledby="work-order-triage-h" className="mt-4" data-testid="work-order-triage">
      <h3 id="work-order-triage-h" className="text-sm font-semibold">Work order triage</h3>
      <p className={`text-[0.625rem] ${MUTED}`} data-testid="work-order-summary">
        {queue.open.length} open · {queue.closed.length} closed · every work order in the system, numbered in the order it came in
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Work order views">
        {tab('queue', `Queue · ${queue.open.length}`)}
        {tab('workers', `By worker · ${board.busy.length}`)}
        {tab('review', `To review · ${review.waiting.length}`)}
        {addIncident && (
          <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} data-testid="work-order-new"
            className={`text-[0.625rem] uppercase tracking-wider border border-[#B85838] text-[#B85838] px-2 min-h-[36px] ${FOCUS_RING}`}>{adding ? 'Close the form' : '+ New work order'}</button>
        )}
      </div>
      {adding && addIncident && (
        <NewWorkOrder rentals={rentals} addIncident={addIncident} onSaved={(item, id) => {
          setAdding(false); setView('queue');
          if (id) setExpanded(`inc-${id}`);
          setLast({ ok: true, text: `Saved: ${item.description.split('\n')[0].slice(0, 80)}. It is in the queue below; give it to a worker from there.` });
        }} />
      )}
      {last && <p role="status" className={`text-[0.625rem] ${last.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} data-testid="work-order-last">{last.text}</p>}
      {cloud.state === 'loading' && <p className={`text-[0.625rem] ${MUTED}`} data-testid="work-order-reading">Reading Poe Properties&apos; work orders…</p>}
      {cloud.state === 'failed' && (
        <p className="text-[0.625rem] text-[#B85838]" role="status" data-testid="work-order-unread">
          Poe Properties&apos; work orders could not be read ({String(cloud.reason)}), so this queue shows the Real Estate work orders only — it is not saying Poe Properties has none.
        </p>
      )}
      {cloud.state === 'read' && cloud.unreadable.length > 0 && (
        <p className="text-[0.625rem] text-[#B85838]" role="status">Could not read: {cloud.unreadable.join(', ')}. The notes below may be missing those.</p>
      )}
      {view === 'workers' && <WorkersView board={board} openJob={openJob} />}
      {view === 'review' && (
        <div className="mt-2" data-testid="work-order-review">
          <p className={`text-[0.625rem] ${MUTED}`}>Finished by the workers and still open: open one to read what was done, then Resolve it or send it back.</p>
          <ol className="mt-1.5 space-y-1.5" aria-label="Finished by the workers, waiting on your review">
            {review.waiting.map((w) => <Row key={w.key} {...rowProps(w)} />)}
            {review.waiting.length === 0 && <li className={`text-xs ${MUTED}`}>Nothing is waiting on your review.</li>}
          </ol>
          {review.recent.length > 0 && (
            <>
              <p className={`mt-2 text-[0.625rem] uppercase tracking-wider ${MUTED}`}>Closed, with workers on them</p>
              <ol className="mt-1.5 space-y-1.5" aria-label="Closed work orders that had workers">
                {review.recent.map((w) => <Row key={w.key} {...rowProps(w)} />)}
              </ol>
            </>
          )}
        </div>
      )}
      {view === 'queue' && (<>
      <ol className="mt-2 space-y-1.5" aria-label="Open work orders, in the order they came in">
        {queue.open.map((w) => <Row key={w.key} {...rowProps(w)} />)}
        {queue.open.length === 0 && cloud.state !== 'loading' && <li className={`text-xs ${MUTED}`}>No open work orders.</li>}
      </ol>
      {queue.closed.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setShowClosed((s) => !s)} aria-expanded={showClosed} className={`text-[0.625rem] uppercase tracking-wider border border-[#E8E4DC] px-2 py-1 min-h-[36px] ${FOCUS_RING}`}>
            {showClosed ? 'Hide' : 'Show'} {queue.closed.length} closed
          </button>
          {showClosed && (
            <ol className="mt-1.5 space-y-1.5" aria-label="Closed work orders, in the order they came in">
              {queue.closed.map((w) => <Row key={w.key} {...rowProps(w)} />)}
            </ol>
          )}
        </div>
      )}
      </>)}
    </section>
  );
}
