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
import React, { useEffect, useMemo, useState } from 'react';
import { triageQueue, cameInLabel } from '../lib/work-order-triage.js';
import { loadAllWorkOrders } from '../modules/properties/cloud.js';

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

function Row({ w, expanded, onToggle }) {
  const crew = w.crew.length ? w.crew.join(', ') : '';
  return (
    <li className="border border-[#E8E4DC] rounded-md" data-testid="work-order">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className={`w-full text-left p-2 ${FOCUS_RING}`}>
        <span className="flex items-baseline gap-2">
          <span className="text-[0.625rem] font-semibold text-[#B85838] whitespace-nowrap" data-testid="work-order-number">#{w.number}</span>
          <span className="min-w-0 flex-1 text-xs font-semibold">{w.title}</span>
          <span className={`text-[0.625rem] uppercase tracking-wider whitespace-nowrap ${w.open ? 'text-[#B85838]' : MUTED}`}>{w.status}</span>
        </span>
        <span className={`block text-[0.625rem] ${MUTED} mt-0.5`}>
          came in {cameInLabel(w.cameInAt)} · {w.sourceLabel}
          {w.door ? ` · ${w.door}` : ''}
          {w.urgency ? ` · ${w.urgency}` : ''}
          {crew ? ` · ${crew}` : ''}
          {` · ${w.notes.length} note${w.notes.length === 1 ? '' : 's'}`}
        </span>
      </button>
      {expanded && (
        <ol className="px-2 pb-2 space-y-1" data-testid="work-order-notes">
          {w.notes.map((n, k) => (
            <li key={k} className="text-[0.6875rem] leading-snug">
              <span className={`${MUTED} whitespace-nowrap`}>{cameInLabel(n.at)}</span>
              <span> — {n.text}</span>
            </li>
          ))}
          {w.notes.length === 0 && <li className={`text-[0.6875rem] ${MUTED}`}>No notes were written on this work order.</li>}
        </ol>
      )}
    </li>
  );
}

export default function WorkOrderTriage({ incidents = [], rentals = [], load = loadAllWorkOrders }) {
  const [cloud, setCloud] = useState({ state: 'loading', requests: [], docs: [], events: [], unreadable: [] });
  const [expanded, setExpanded] = useState(null);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.resolve(load()).then((res) => {
      if (!live) return;
      if (res && res.ok) setCloud({ state: 'read', requests: res.requests || [], docs: res.docs || [], events: res.events || [], unreadable: res.unreadable || [] });
      else setCloud({ state: 'failed', requests: [], docs: [], events: [], unreadable: [], reason: (res && (res.error || res.reason)) || 'could not be read' });
    }).catch((e) => { if (live) setCloud({ state: 'failed', requests: [], docs: [], events: [], unreadable: [], reason: (e && e.message) || 'could not be read' }); });
    return () => { live = false; };
  }, [load]);

  const doorLabelOf = useMemo(() => doorLabeller(rentals), [rentals]);
  const queue = useMemo(
    () => triageQueue({ incidents, requests: cloud.requests, docs: cloud.docs, events: cloud.events, doorLabelOf }),
    [incidents, cloud, doorLabelOf],
  );
  const toggle = (key) => setExpanded((k) => (k === key ? null : key));

  return (
    <section aria-labelledby="work-order-triage-h" className="mt-4" data-testid="work-order-triage">
      <h3 id="work-order-triage-h" className="text-sm font-semibold">Work order triage</h3>
      <p className={`text-[0.625rem] ${MUTED}`} data-testid="work-order-summary">
        {queue.open.length} open · {queue.closed.length} closed · every work order in the system, numbered in the order it came in
      </p>
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
        {queue.open.map((w) => <Row key={w.key} w={w} expanded={expanded === w.key} onToggle={() => toggle(w.key)} />)}
        {queue.open.length === 0 && cloud.state !== 'loading' && <li className={`text-xs ${MUTED}`}>No open work orders.</li>}
      </ol>
      {queue.closed.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setShowClosed((s) => !s)} aria-expanded={showClosed} className={`text-[0.625rem] uppercase tracking-wider border border-[#E8E4DC] px-2 py-1 min-h-[32px] ${FOCUS_RING}`}>
            {showClosed ? 'Hide' : 'Show'} {queue.closed.length} closed
          </button>
          {showClosed && (
            <ol className="mt-1.5 space-y-1.5" aria-label="Closed work orders, in the order they came in">
              {queue.closed.map((w) => <Row key={w.key} w={w} expanded={expanded === w.key} onToggle={() => toggle(w.key)} />)}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
