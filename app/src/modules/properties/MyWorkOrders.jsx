// =============================================================================
// MyWorkOrders — every job sent to this 1099 worker, on every door (DR-1594)
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!!" The worker's Work tab read the ONE door that
// happened to be selected, so a job on any other door was invisible until he
// guessed it. This card reads my_assigned_work_orders() (0337: his jobs only,
// with where each one is) and stands first on his screen, whatever tab.
//
// It works on a door he holds no grant for: everything a job needs is on the
// row (what, where, how urgent, the detail, whether proof is required), the
// street opens in maps, and "Fixed" / "Not fixed" are written as his own
// documentation (0337's assigned-worker insert; 0260's trigger closes a fixed
// job). "Open the door" appears only for a door he can actually open.
//
// Opening it marks the bell's work-order arrivals seen (SCREEN_KINDS).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { jobWhere, jobMapHref, SEEN_EVENT, JOB_KINDS } from '../../lib/assigned-work.js';
import { compressImageFile, isLikelyImageFile } from '../../lib/image.js';
import { FULL_MAX_WIDTH, FULL_QUALITY } from './DoorTabs.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border bg-white text-[#1A1815] border-[#E8E4DC] '
  + 'hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';
const PRIORITY = { urgent: 'Urgent: same day', high: 'High: within 3 days', normal: 'This week', low: 'When convenient' };
const PROOF = { photos: 'Pictures of the finished work are required before it is paid: add one below, then press Fixed', 'photos-and-video': 'Pictures and a video of the finished work are required before it is paid: add the picture here and the video from the door' };

function Job({ job, canOpen, onOpen, onDocument }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const map = jobMapHref(job);
  const write = async (doc) => {
    setBusy(true);
    try {
      const r = await onDocument(job, { note, ...doc });
      setSaid(r && r.ok ? 'Saved on the job.' : `Not saved: ${(r && (r.error || r.reason)) || 'try again'}`);
      if (r && r.ok) setNote('');
    } finally { setBusy(false); }
  };
  const picture = async (file) => {
    if (!file) return;
    if (!isLikelyImageFile(file)) { setSaid('That is not a picture.'); return; }
    let imageData;
    try { imageData = await compressImageFile(file, FULL_MAX_WIDTH, FULL_QUALITY); } catch { setSaid('That picture could not be read.'); return; }
    await write({ outcome: null, imageData });
  };
  return (
    <div className="border-b border-[#F0EDE6] py-2" data-testid="my-work-order">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-[#1A1815]" style={serif}>{job.title || 'Work order'}</span>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{PRIORITY[job.priority] || job.priority} · {job.status}</span>
      </div>
      <div className="text-xs text-[#5A5751]" style={serif}>
        {map ? <a href={map} target="_blank" rel="noopener noreferrer" className="underline">{jobWhere(job)}</a> : jobWhere(job)}
        {job.area ? ` · ${job.area}` : ''}
      </div>
      {job.detail && <p className="text-xs text-[#1A1815] mt-1" style={serif}>{job.detail}</p>}
      {PROOF[job.proof_required] && <p className="text-xs text-[#8A6510] mt-1" style={serif}>{PROOF[job.proof_required]}.</p>}
      <input value={note} onChange={(e) => setNote(e.target.value)} type="text" placeholder="What you did or found (optional)"
        aria-label={`Note on ${job.title || 'this job'}`} className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mt-2" style={serif} />
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" className={BTN} disabled={busy} onClick={() => write({ outcome: 'fixed' })}>Fixed</button>
        <button type="button" className={BTN} disabled={busy} onClick={() => write({ outcome: 'not_fixed' })}>Not fixed yet</button>
        <label className={`${BTN} cursor-pointer`}>
          Add a picture
          <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; picture(f); }} />
        </label>
        {canOpen && <button type="button" className={BTN} onClick={() => onOpen(job)}>Open the door</button>}
      </div>
      {said && <p className="text-xs text-[#5A5751] mt-1" style={serif} role="status">{said}</p>}
    </div>
  );
}

/**
 * The documentation row a worker writes on his own job: an outcome (fixed /
 * not fixed) or none (a picture alone), his note, a picture's bytes. The scope
 * is the JOB's; 0260's trigger copies it again before RLS reads it.
 */
export function jobDocRow(job = {}, { outcome = null, note = '', imageData = null } = {}) {
  return {
    instance_id: job.instance_id || null,
    request_id: job.id || null,
    tenancy_id: job.tenancy_id || null,
    rental_id: job.rental_id || null,
    outcome: outcome === 'fixed' || outcome === 'not_fixed' ? outcome : null,
    followup: null,
    note: String(note || '').trim() || null,
    image_data: imageData || null,
  };
}

/**
 * jobs: open assigned jobs (openAssigned). state: 'ok' | 'loading' | a failure
 * reason. canOpen(job) says whether this worker can open the job's door.
 */
export default function MyWorkOrders({ jobs = [], state = 'ok', canOpen = () => false, onOpen = () => {}, post = async () => ({ ok: false }), onDone = () => {} }) {
  const onDocument = async (job, doc) => {
    const r = await post(jobDocRow(job, doc));
    if (r && r.ok) onDone();
    return r;
  };
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent(SEEN_EVENT, { detail: { kinds: [...JOB_KINDS] } })); } catch { /* no window */ }
  }, [jobs.length]);
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="my-work-orders">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">My work orders ({jobs.length})</h3>
      {state !== 'ok' && state !== 'loading' && (
        <p className="text-xs text-[#8A6510]" style={serif} role="status">
          Your work orders could not be read just now ({state}). What is below may be out of date.
        </p>
      )}
      {jobs.length === 0
        ? <p className="text-xs text-[#5A5751]" style={serif}>{state === 'loading' ? 'Reading your work orders…' : 'Nothing is assigned to you right now. When a job is sent to you it appears here, on every door, and the bell rings.'}</p>
        : jobs.map((j) => <Job key={j.id} job={j} canOpen={canOpen(j)} onOpen={onOpen} onDocument={onDocument} />)}
    </section>
  );
}

/** Shown first where a worker lands (My doors, My jobs) and on any tab he cannot open. */
export function showsMyWork(tab, locked = false) {
  return locked || ['doors', 'jobs', 'work'].includes(tab);
}
