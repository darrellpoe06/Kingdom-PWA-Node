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
import React, { useEffect, useMemo, useState } from 'react';
import { triageQueue, cameInLabel, actionsFor, MOVE_TARGETS } from '../lib/work-order-triage.js';
import { loadAllWorkOrders, setWorkOrderStatus, assignWorkOrder, postNote } from '../modules/properties/cloud.js';
import { buildTenancyNote } from '../modules/properties/model.js';

const REQUEST_OPS = {
  setStatus: (id, status) => setWorkOrderStatus(id, status),
  assign: (id, label) => assignWorkOrder(id, { assignedTo: null, assignedToLabel: label }),
  note: (record, body) => postNote(buildTenancyNote({ instanceId: record.instanceId, tenancyId: record.tenancyId, rentalId: record.rentalId, requestId: record.id, authorRole: 'owner', body })),
};

const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

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
  const { moves, canAssign, canNote, canMove } = actionsFor(w);
  const places = MOVE_TARGETS.filter((t) => movers && typeof movers[t.key] === 'function');
  const people = (Array.isArray(contractors) ? contractors : []).filter((c) => c && c.name);
  const btn = `text-[0.6875rem] border border-[#B85838] text-[#B85838] px-2 py-1 min-h-[36px] disabled:opacity-50 ${FOCUS_RING}`;
  return (
    <div className="px-2 pb-2 space-y-2" data-testid="work-order-actions">
      {moves.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move this work order">
          {moves.map((m) => (
            <button key={m.to} type="button" disabled={busy} onClick={() => act({ kind: 'status', to: m.to, label: m.label })} className={btn} data-testid={`work-order-move-${m.to}`}>{m.label}</button>
          ))}
        </div>
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

function Row({ w, expanded, onToggle, act, contractors, movers, busy, message }) {
  const crew = w.crew.length ? w.crew.join(', ') : '';
  return (
    <li className="border border-[#E8E4DC] rounded-md" data-testid="work-order">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className={`w-full text-left p-2 ${FOCUS_RING}`}>
        <span className="flex items-baseline gap-2">
          <span className="text-[0.625rem] font-semibold text-[#B85838] whitespace-nowrap" data-testid="work-order-number">#{w.number}</span>
          {/* Two lines at most: a thought filed as a work order can be a whole
              recorded conversation, and it buried the queue (the #4 screenshot). */}
          <span className="min-w-0 flex-1 text-xs font-semibold line-clamp-2" data-testid="work-order-title">{w.title}</span>
          <span className={`text-[0.625rem] uppercase tracking-wider whitespace-nowrap ${w.open ? 'text-[#B85838]' : MUTED}`}>{w.status}</span>
        </span>
        <span className={`block text-[0.625rem] ${MUTED} mt-0.5`}>
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

export default function WorkOrderTriage({ incidents = [], rentals = [], contractors = [], updateIncident = null, workerOps = null, movers = null, requestOps = REQUEST_OPS, load = loadAllWorkOrders }) {
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
    () => triageQueue({ incidents, requests: cloud.requests, docs: cloud.docs, events: cloud.events, notes: cloud.notes, doorLabelOf }),
    [incidents, cloud, doorLabelOf],
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
          const note = a.to === 'discarded' ? 'Not a work order: closed from the triage, its words kept' : `${a.label} (from the triage)`;
          updateIncident(r.id, { status: a.to, _note: note, ...(a.to === 'resolved' ? { resolvedAt: new Date().toISOString().slice(0, 10) } : {}) });
        } else if (a.kind === 'assign') {
          if (!workerOps || !workerOps.onAssign) throw new Error('this screen cannot assign workers');
          workerOps.onAssign(r.id, a.contractor, a.contractor.type || 'contractor');
        } else if (a.kind === 'note') {
          updateIncident(r.id, { _logNote: a.text });
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
      } else {
        if (a.kind === 'status') res = await requestOps.setStatus(r.id, a.to);
        else if (a.kind === 'assign') res = await requestOps.assign(r.id, a.contractor.name);
        else if (a.kind === 'note') res = await requestOps.note(r, a.text);
        if (res && res.ok) setReads((n) => n + 1);
      }
      setLast(null);
      const said = (res && res.ok
        ? { ok: true, text: a.kind === 'status' ? `Done: ${a.label}.` : a.kind === 'assign' ? `Given to ${a.contractor.name}.` : a.kind === 'move' ? `Moved to ${a.target.done}. It has left the open work orders; its words are kept.` : 'Note added.' }
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
  const rowProps = (w) => ({ w, expanded: expanded === w.key, onToggle: () => toggle(w.key), act: actOn(w), contractors, movers, busy, message: expanded === w.key ? message : null });

  return (
    <section aria-labelledby="work-order-triage-h" className="mt-4" data-testid="work-order-triage">
      <h3 id="work-order-triage-h" className="text-sm font-semibold">Work order triage</h3>
      <p className={`text-[0.625rem] ${MUTED}`} data-testid="work-order-summary">
        {queue.open.length} open · {queue.closed.length} closed · every work order in the system, numbered in the order it came in
      </p>
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
    </section>
  );
}
