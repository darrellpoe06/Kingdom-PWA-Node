// =============================================================================
// DispatchPanel — assign MULTIPLE 1099 workers to one work order and send the job
// =============================================================================
// One panel, two homes: the Action Queue (Big Picture) and the per-property
// Maintenance Log (Real Estate). Closes the loop named in
// BUSINESS-PROCESS-CONNECTIONS.md: a visible maintenance need must have a
// wired path to the people who fix it. A work order can now carry a CREW —
// each assigned worker is listed with their own contact actions (Text the job
// / Call), dispatch status, Mark-done, and a 1099 payout entry (hours /
// amount). Workers are picked from the Books · 1099s directory (not free
// text). Every action writes a lifecycle log entry on the incident, so
// who-was-sent / who-finished / how-long-to-done stays a queryable QC trail.
// The work order's own done-rule: explicit close, surfaced once all workers
// are done.
import React, { useState } from 'react';
import { buildDispatchMessage, smsHref, telHref } from '../lib/dispatch.js';
import { getAssignments, allDone } from '../lib/assignments.js';

const URGENCY_LABELS = {
  change: 'Broken now — same-day',
  incident: 'Within 3 days',
  project: 'Planned work',
};

const btn = 'text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838]';
const fmtMoney = (n) => (n == null || !isFinite(n) ? null : `$${Math.abs(Math.round(n)).toLocaleString()}`);

// One assigned worker: contact actions, status, payout — all in-context, no
// scroll-to-top, no view change. This is where the per-worker controls live.
function WorkerCard({ a, message, readOnly, onWorkerDone, onReopen, onUnassign, onSetPayout }) {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [hours, setHours] = useState(a.payout?.hours ?? '');
  const [amount, setAmount] = useState(a.payout?.amount ?? '');
  const done = a.status === 'done';
  const payAmount = fmtMoney(a.payout?.amount);
  const payHours = a.payout?.hours != null ? `${a.payout.hours}h` : null;
  const payLabel = [payHours, payAmount].filter(Boolean).join(' · ');

  const savePayout = () => {
    onSetPayout && onSetPayout(a.id, { hours, amount });
    setPayoutOpen(false);
  };

  return (
    <div className="border border-[#E8E4DC] bg-white p-2.5 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {done ? '✅' : '👷'} <span className="font-semibold">{a.name}</span>
          <span className="text-[#5A5751]">
            {a.type ? ` · ${a.type}` : ''}{a.role ? ` · ${a.role}` : ''}
            {a.dispatchedAt ? ` · sent ${(a.dispatchedAt || '').slice(0, 10)}` : ''}
          </span>
        </div>
        <span
          className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5"
          style={done ? { color: '#5A6E3D' } : { color: '#B85838' }}
        >
          {done ? `done${a.doneAt ? ` · ${(a.doneAt || '').slice(0, 10)}` : ''}` : 'assigned'}
        </span>
      </div>

      {payLabel && (
        <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          💵 1099 payout: {payLabel}
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-1.5 flex-wrap items-center">
          {a.phone ? (
            <>
              <a href={smsHref(a.phone, message)} className={`${btn} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white no-underline`}>💬 Text the job</a>
              <a href={telHref(a.phone)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] no-underline`}>📞 Call</a>
            </>
          ) : (
            <span className="text-[10px] text-[#B85838] italic" style={{ fontFamily: '"Fraunces", serif' }}>No phone on file — add it in Books · 1099s.</span>
          )}
          {!done && onWorkerDone && (
            <button type="button" onClick={() => onWorkerDone(a.id)} className={`${btn} border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white`}>✓ Mark done</button>
          )}
          {done && onReopen && (
            <button type="button" onClick={() => onReopen(a.id)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]`}>↩ Reopen</button>
          )}
          {onSetPayout && (
            <button type="button" onClick={() => setPayoutOpen(o => !o)} aria-expanded={payoutOpen} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]`}>💵 {payLabel ? 'Edit payout' : 'Payout'}</button>
          )}
          {onUnassign && (
            <button type="button" onClick={() => { if (window.confirm(`Remove ${a.name} from this work order?`)) onUnassign(a.id); }} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838]`}>✕ Remove</button>
          )}
        </div>
      )}

      {payoutOpen && !readOnly && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 flex gap-2 items-end flex-wrap">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block">Hours</label>
            <input type="number" step="0.25" min="0" value={hours} onChange={e => setHours(e.target.value)} aria-label={`Payout hours for ${a.name}`} className="w-20 p-1.5 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block">Amount ($)</label>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} aria-label={`Payout amount for ${a.name}`} className="w-24 p-1.5 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
          </div>
          <button type="button" onClick={savePayout} className={`${btn} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838]`}>Save</button>
        </div>
      )}
    </div>
  );
}

export function DispatchPanel({
  incident,
  property = null,
  contractors = [],
  onAssign,
  onUnassign,
  onWorkerDone,
  onReopen,
  onSetPayout,
  onResolve,
  readOnly = false,
}) {
  const [pickedId, setPickedId] = useState('');
  const [pickedType, setPickedType] = useState('contractor');
  const [adding, setAdding] = useState(false);
  if (!incident) return null;

  const assignments = getAssignments(incident);
  const resolved = incident.status === 'resolved';

  const DONE_STATUSES = new Set(['ended', 'terminated', 'inactive']);
  const assignedActiveIds = new Set(assignments.filter(a => a.status !== 'done').map(a => a.contractorId));
  // Pickable = outbound (we pay) workers, not retired, not already on the crew.
  const workers = contractors.filter(
    c => c.direction === 'outbound' && !DONE_STATUSES.has(c.status) && !assignedActiveIds.has(c.id),
  );

  const message = buildDispatchMessage({
    propertyName: property?.name || '',
    address: property?.address || '',
    city: property?.city || '',
    state: property?.state || '',
    zip: property?.zip || '',
    description: incident.description || '',
    urgencyLabel: URGENCY_LABELS[incident.urgency] || '',
    dueDate: incident.dueDate || '',
  });

  const assign = () => {
    const c = workers.find(w => w.id === pickedId);
    if (!c || !onAssign) return;
    onAssign(incident.id, c, pickedType);
    setPickedId('');
    setPickedType('contractor');
    setAdding(false);
  };

  // Resolved (work order closed) — compact crew read-out, no actions.
  if (resolved) {
    return (
      <div className="text-[11px] text-[#5A6E3D] font-semibold space-y-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <div>✓ Done{incident.resolvedAt ? ` · ${incident.resolvedAt}` : ''}</div>
        {assignments.length > 0 && (
          <div className="text-[#5A5751] font-normal">
            {assignments.map(a => a.name).join(', ')}
          </div>
        )}
      </div>
    );
  }

  const crewDone = allDone(assignments);

  // WorkerCard calls these with just the assignment id; the parent handlers
  // (Action Queue / Maintenance Log) need the incident id too. Bind it here so
  // the card stays incident-agnostic.
  const cardOps = {
    onWorkerDone: onWorkerDone ? (aid) => onWorkerDone(incident.id, aid) : undefined,
    onReopen: onReopen ? (aid) => onReopen(incident.id, aid) : undefined,
    onUnassign: onUnassign ? (aid) => onUnassign(incident.id, aid) : undefined,
    onSetPayout: onSetPayout ? (aid, p) => onSetPayout(incident.id, aid, p) : undefined,
  };

  return (
    <div className="space-y-2">
      {assignments.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">
            Crew · {assignments.length} {assignments.length === 1 ? 'worker' : 'workers'}
            {assignments.length > 1 ? ` · ${assignments.filter(a => a.status === 'done').length}/${assignments.length} done` : ''}
          </div>
          {assignments.map(a => (
            <WorkerCard
              key={a.id}
              a={a}
              message={message}
              readOnly={readOnly}
              onWorkerDone={cardOps.onWorkerDone}
              onReopen={cardOps.onReopen}
              onUnassign={cardOps.onUnassign}
              onSetPayout={cardOps.onSetPayout}
            />
          ))}
          {/* The work order's own done-rule: all workers done -> offer the close. */}
          {!readOnly && crewDone && onResolve && (
            <button type="button" onClick={() => onResolve(incident.id)} className={`${btn} border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#1A1815] hover:border-[#1A1815] w-full`}>
              ✓ All workers done — close work order
            </button>
          )}
        </div>
      )}

      {readOnly ? (
        assignments.length === 0 && (
          <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No worker assigned yet.</div>
        )
      ) : (
        <div className="space-y-1.5">
          {/* Add-a-worker affordance: collapsed once a crew exists, so the list
              stays the focus and adding is one tap away — in-context. */}
          {assignments.length > 0 && !adding ? (
            <button type="button" onClick={() => setAdding(true)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">
              + Assign another worker
            </button>
          ) : (
            <>
              <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">
                {assignments.length === 0 ? 'Assign a worker' : 'Add a worker'}
              </div>
              {contractors.filter(c => c.direction === 'outbound' && !DONE_STATUSES.has(c.status)).length === 0 ? (
                <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                  No 1099 workers on file yet. Add them under <strong>Books · 1099s</strong> (include a phone number so the job can go out in one tap).
                </div>
              ) : workers.length === 0 ? (
                <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                  Everyone on file is already on this work order. Add more under <strong>Books · 1099s</strong>.
                </div>
              ) : (
                <div className="flex gap-1.5 flex-wrap items-center">
                  <select
                    value={pickedId}
                    onChange={e => setPickedId(e.target.value)}
                    aria-label="Pick a worker to dispatch"
                    className="p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <option value="">— pick a worker —</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}{w.role ? ` · ${w.role}` : ''}{w.phone ? '' : ' (no phone)'}</option>
                    ))}
                  </select>
                  <select
                    value={pickedType}
                    onChange={e => setPickedType(e.target.value)}
                    aria-label="Worker type for this job"
                    className="p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <option value="contractor">contractor</option>
                    <option value="vendor">vendor</option>
                  </select>
                  <button
                    type="button"
                    onClick={assign}
                    disabled={!pickedId}
                    className={`${btn} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    👷 Dispatch
                  </button>
                  {adding && assignments.length > 0 && (
                    <button type="button" onClick={() => setAdding(false)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]`}>× Cancel</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DispatchPanel;
