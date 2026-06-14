// =============================================================================
// DispatchPanel — assign a 1099 worker to a work order and send the job
// =============================================================================
// One panel, two homes: the Action Queue (Big Picture) and the per-property
// Maintenance Log (Real Estate). Closes the loop named in
// BUSINESS-PROCESS-CONNECTIONS.md: a visible maintenance need must have a
// wired path to the person who fixes it. The panel assigns a worker from
// Books · 1099s, builds the full job text (what / where / when), and hands
// it off in one tap via sms: / tel:. Every assignment writes a lifecycle
// log entry on the incident via dispatchIncident, so the quality-control
// trail (who, when, how long to done) stays queryable.
import React, { useState } from 'react';
import { buildDispatchMessage, smsHref, telHref } from '../lib/dispatch.js';

const URGENCY_LABELS = {
  change: 'Broken now — same-day',
  incident: 'Within 3 days',
  project: 'Planned work',
};

export function DispatchPanel({ incident, property = null, contractors = [], onDispatch, onResolve, readOnly = false }) {
  const [pickedId, setPickedId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  if (!incident) return null;

  const DONE_STATUSES = new Set(['ended', 'terminated', 'inactive']);
  const workers = contractors.filter(c => c.direction === 'outbound' && !DONE_STATUSES.has(c.status));
  const d = incident.dispatch;
  const resolved = incident.status === 'resolved';
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
    if (!c || !onDispatch) return;
    onDispatch(incident.id, {
      contractorId: c.id,
      contractorName: c.name,
      contractorPhone: c.phone || '',
      contractorEmail: c.email || '',
      dispatchedAt: new Date().toISOString(),
    });
    setReassigning(false);
    setPickedId('');
  };

  const btn = 'text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838]';

  if (resolved) {
    return (
      <div className="text-[11px] text-[#5A6E3D] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        ✓ Done{incident.resolvedAt ? ` · ${incident.resolvedAt}` : ''}{d ? ` · ${d.contractorName}` : ''}
      </div>
    );
  }

  if (d && !reassigning) {
    return (
      <div className="space-y-1.5">
        <div className="text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          👷 <span className="font-semibold">{d.contractorName}</span> · sent {(d.dispatchedAt || '').slice(0, 10)}
        </div>
        {!readOnly && (
          <div className="flex gap-1.5 flex-wrap items-center">
            {d.contractorPhone ? (
              <>
                <a href={smsHref(d.contractorPhone, message)} className={`${btn} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white no-underline`}>💬 Text the job</a>
                <a href={telHref(d.contractorPhone)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] no-underline`}>📞 Call</a>
              </>
            ) : (
              <span className="text-[10px] text-[#B85838] italic" style={{ fontFamily: '"Fraunces", serif' }}>No phone on file — add it in Books · 1099s for one-tap dispatch.</span>
            )}
            {onResolve && (
              <button type="button" onClick={() => onResolve(incident.id)} className={`${btn} border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white`}>✓ Mark done</button>
            )}
            <button type="button" onClick={() => setReassigning(true)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]`}>Reassign</button>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No worker assigned yet.</div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Send to a worker</div>
      {workers.length === 0 ? (
        <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          No 1099 workers on file yet. Add them under <strong>Books · 1099s</strong> (include a phone number so the job can go out in one tap).
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
          <button
            type="button"
            onClick={assign}
            disabled={!pickedId}
            className={`${btn} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            👷 Dispatch
          </button>
          {reassigning && (
            <button type="button" onClick={() => setReassigning(false)} className={`${btn} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]`}>× Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}

export default DispatchPanel;
