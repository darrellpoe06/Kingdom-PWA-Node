// =============================================================================
// WorkerReach — the landlord's "why isn't he getting them?" (DR-1594)
// =============================================================================
// On People, for the owner: every 1099 worker on this space, the four links
// a job travels (invited, signed in, permissions held, jobs assigned) read
// from the real rows, and the one plain reason that stops each of them. See
// worker-reach.js for the rules; this file only reads and shows.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { workerReach } from './worker-reach.js';
import { loadWorkerReach } from './worker-reach-cloud.js';

const serif = { fontFamily: '"Fraunces", serif' };
const TONE = { blocked: 'border-[#B85838]', waiting: 'border-[#8A6510]', unknown: 'border-[#8A867E]', idle: 'border-[#E8E4DC]', ok: 'border-[#2F5D50]' };
const STATE = { blocked: 'Stopped', waiting: 'Waiting on them', unknown: 'Could not check', idle: 'Nothing assigned', ok: 'Getting work' };
const when = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch { return iso; } };

export default function WorkerReach({ invites = [], instanceId = null, load = loadWorkerReach, reloadKey = 0 }) {
  const [read, setRead] = useState({ loading: true, grants: null, jobs: null });
  useEffect(() => {
    let live = true;
    load(instanceId).then((r) => { if (live) setRead({ loading: false, ...r }); }).catch(() => { if (live) setRead({ loading: false, grants: null, jobs: null }); });
    return () => { live = false; };
  }, [instanceId, load, reloadKey]);
  const rows = useMemo(() => workerReach(invites, { instanceId, grants: read.grants, jobs: read.jobs }), [invites, instanceId, read]);
  if (!rows.length) return null;
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="worker-reach">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-1">Are your 1099 workers getting their jobs? ({rows.length})</h3>
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        A job reaches a worker only when all four are true: they were invited, they signed in, they hold a permission, and the job is assigned to them.
        {read.loading ? ' Checking…' : ''}
      </p>
      {rows.map((w) => (
        <div key={w.key} className={`border-l-4 ${TONE[w.state]} pl-2 py-2 mb-2`} data-testid="worker-reach-row" data-state={w.state}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-[#1A1815]" style={serif}>{w.name}</span>
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{STATE[w.state]}</span>
          </div>
          <ul className="text-xs text-[#5A5751] list-none p-0 m-0" style={serif}>
            <li>Invited{w.invitedAt ? ` ${when(w.invitedAt)}` : ''}{w.contact.label ? ` by ${w.contact.kind === 'phone' ? 'phone' : 'email'}, ${w.contact.label}` : ''}{w.invitedWith.length ? ` · asked for: ${w.invitedWith.join(', ')}` : ' · asked for nothing'}</li>
            <li>{w.signedIn ? `Signed in ${when(w.signedInAt)}` : 'Has not signed in yet'}</li>
            {w.signedIn && <li>Holds: {w.holds == null ? 'could not be read' : w.holds.length ? w.holds.join(', ') : 'no permission'}</li>}
            <li>Open jobs assigned: {w.jobs == null ? (w.signedIn ? 'could not be read' : 'none linked yet') : w.jobs}{w.waitingByName ? ` · ${w.waitingByName} sent to their name, not yet linked` : ''}</li>
          </ul>
          <p className="text-xs text-[#1A1815] mt-1" style={serif}>{w.reason}</p>
        </div>
      ))}
    </section>
  );
}
