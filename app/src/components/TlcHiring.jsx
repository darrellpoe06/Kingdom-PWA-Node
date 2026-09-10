// =============================================================================
// TlcHiring — hire through the TLC app (DR-0350)
// =============================================================================
// Darrell 2026-09-10: "need to have the ability to hire people for jobs we
// post so we can hire through the app and onboarding goes to the telehealth
// app we use." / "The website is already linked however opportunities and
// constraints."
//
// Two surfaces over one seam (lib/tlc-hiring-sync.js):
//   JoinTheTeam — on the door, for anyone: the open postings, Apply (validated
//                 on the device in the server's own words), Share a posting.
//   HiringDesk  — on Onboarding, for the office owner/admin: post / open /
//                 close jobs; applicants by station; HIRE (mints the 0187
//                 invite atomically and shows the link); the pipeline from
//                 real state; the telehealth hand-off recorded, with the steps
//                 and the ready message.
// Every number and state on these screens comes from a row (REALITY-TRACE);
// nothing is painted.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import ShareButton from './ShareButton.jsx';
import { buildOnboardLink, formatDate } from '../lib/tlc-onboarding.js';
import {
  APPLICATION_STATUSES, applicationStatus, canMoveApplication, applicationsByStatus, hirePipeline,
  validateApplication, validateJob, EMPLOYMENT_TYPES, MODALITIES,
  TLC_TELEHEALTH, TELEHEALTH_STATUSES, telehealthStatus, telehealthHandoffMessage, jobsDoorUrl, jobSharePayload,
} from '../lib/tlc-hiring.js';
import {
  listPublicJobs, applyToJob, listJobs, saveJob, deleteJob, listApplications, reviewApplication, hireApplicant, markTelehealth,
} from '../lib/tlc-hiring-sync.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_GOOD = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_RUST = 'min-h-[36px] px-4 py-2 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CHIP = 'inline-block text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border border-[#E8E4DC] text-[#5A5751]';

const labelOf = (list, key) => (list.find((x) => x.key === key) || {}).label || key;

function CopyText({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — the text is shown either way */ }
  };
  return (
    <div className="flex items-start gap-2">
      <pre className="flex-1 whitespace-pre-wrap text-[0.6875rem] break-words bg-white border border-[#E8E4DC] p-2" style={SERIF}>{text}</pre>
      <button type="button" onClick={copy} className="min-h-[36px] px-2 text-xs font-semibold border border-[#1A1815] whitespace-nowrap hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">{copied ? 'Copied' : label}</button>
    </div>
  );
}

function JobFacts({ job }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      <span className={CHIP}>{labelOf(MODALITIES, job.modality)}</span>
      <span className={CHIP}>{labelOf(EMPLOYMENT_TYPES, job.employment_type)}</span>
      {job.location && <span className={CHIP}>{job.location}</span>}
      {job.pay_note && <span className={CHIP}>{job.pay_note}</span>}
      {job.posted_at && <span className={CHIP}>posted {formatDate(job.posted_at)}</span>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// APPLY — validated on the device first, in the same words the server uses.
// Text only: no upload, no health information; the packet (0187) comes after
// the hire and carries documents as pointers.
// -----------------------------------------------------------------------------
const EMPTY_APPLICATION = { name: '', email: '', phone: '', license_type: '', license_state: '', years_experience: '', availability: '', link: '', statement: '' };

export function ApplyForm({ job, onApply = applyToJob }) {
  const [form, setForm] = useState(EMPTY_APPLICATION);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const v = validateApplication(form);
    setErrors(v.errors);
    if (!v.ok) { setMessage(Object.values(v.errors)[0]); return; }
    setBusy(true); setMessage('');
    const res = await onApply(job.id, form);
    setBusy(false);
    if (!res.ok) { setMessage(res.message); if (res.errors) setErrors(res.errors); return; }
    setReceipt(res.receipt);
  };
  if (receipt) {
    return (
      <div className="border border-[#5A6E3D] bg-[#F0F4EA] p-3" role="status">
        <div className="text-sm font-semibold text-[#3F5226]">Received. Thank you, {form.name.trim()}.</div>
        <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>Your application for {receipt.job_title || job.title} is with the office. We will reach you at {form.email.trim().toLowerCase()}.</p>
      </div>
    );
  }
  const field = (k, label, extra = {}) => (
    <label className="block text-xs text-[#5A5751]">
      {label}
      <input value={form[k]} onChange={set(k)} className={`${INPUT} mt-1`} aria-invalid={!!errors[k]} {...extra} />
      {errors[k] && <span className="block text-[0.6875rem] text-[#B85838] mt-0.5">{errors[k]}</span>}
    </label>
  );
  return (
    <form onSubmit={submit} className="space-y-2" aria-label={`Apply for ${job.title}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {field('name', 'Full name', { autoComplete: 'name' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel' })}
        {field('license_type', 'License (e.g. LCSW, LPC, LSW)')}
        {field('license_state', 'License state')}
        {field('years_experience', 'Years of experience', { inputMode: 'numeric' })}
        {field('availability', 'Availability (days / hours)')}
        {field('link', 'A link to your resume or profile (optional)', { type: 'url', placeholder: 'https://' })}
      </div>
      <label className="block text-xs text-[#5A5751]">
        About you, and why TLC
        <textarea value={form.statement} onChange={set('statement')} rows={4} className={`${INPUT} mt-1`} aria-invalid={!!errors.statement} />
        {errors.statement && <span className="block text-[0.6875rem] text-[#B85838] mt-0.5">{errors.statement}</span>}
      </label>
      <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>Text only here; documents come later, inside the onboarding packet, once the office says yes. Never include client information.</p>
      {message && <p className="text-xs text-[#B85838]" role="alert">{message}</p>}
      <button type="submit" disabled={busy} className={`${BTN_RUST}`}>{busy ? 'Sending…' : 'Send application'}</button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// JOIN THE TEAM — the door's public section. One list, from one source; the
// website links here.
// -----------------------------------------------------------------------------
export function JoinTheTeam({ lead = false, jobId = null, load = listPublicJobs, onApply = applyToJob }) {
  const [state, setState] = useState({ loaded: false, jobs: [], message: '' });
  const [openId, setOpenId] = useState(jobId);
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await load();
      if (alive) setState({ loaded: true, jobs: res.jobs || [], message: res.ok ? '' : res.message || '' });
    })();
    return () => { alive = false; };
  }, [load]);
  return (
    <section className={`bg-white border ${lead ? 'border-[#1A1815] border-2' : 'border-[#E8E4DC]'} p-4`} aria-label="Join the team">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Join the team</div>
      <h2 className="text-xl mb-1" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>Open positions</h2>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF}>Apply here; the office reads every application in the app. A hire opens your onboarding packet on this same door.</p>
      {!state.loaded && <p className="text-xs text-[#5A5751]">Checking open positions…</p>}
      {state.loaded && state.message && <p className="text-xs text-[#B85838]" role="alert">Open positions could not be loaded: {state.message}</p>}
      {state.loaded && !state.message && state.jobs.length === 0 && <p className="text-xs text-[#5A5751]" style={SERIF}>No open positions right now. Check back, or share your interest through Book an appointment’s contact page.</p>}
      <ul className="space-y-3">
        {state.jobs.map((job) => {
          const open = openId === job.id;
          return (
            <li key={job.id} className="border border-[#E8E4DC] p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base" style={{ ...SERIF, fontWeight: 600 }}>{job.title}</h3>
                  <JobFacts job={job} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ShareButton label="Share" title="Share this posting using your usual apps" payload={() => jobSharePayload(job, { url: jobsDoorUrl({ jobId: job.id }) })} />
                  <button type="button" onClick={() => setOpenId(open ? null : job.id)} aria-expanded={open} className={`${BTN}`}>{open ? 'Close' : 'Apply'}</button>
                </div>
              </div>
              <p className="text-sm text-[#1A1815] mt-2 leading-relaxed" style={SERIF}>{job.summary}</p>
              {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-[#5A5751] mt-1" style={SERIF}>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
              )}
              {open && <div className="mt-3 border-t border-[#E8E4DC] pt-3"><ApplyForm job={job} onApply={onApply} /></div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// -----------------------------------------------------------------------------
// THE JOBS AREA — post, edit, open, close, remove (owner/admin).
// -----------------------------------------------------------------------------
const EMPTY_JOB = { title: '', summary: '', requirements: '', employment_type: 'contractor', modality: 'telehealth', location: '', pay_note: '', status: 'draft' };

function JobEditor({ job, instanceId, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_JOB, ...(job || {}), requirements: Array.isArray(job && job.requirements) ? job.requirements.join('\n') : (job && job.requirements) || '' }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async (status) => {
    const next = { ...form, status };
    const v = validateJob(next);
    setErrors(v.errors);
    if (!v.ok) { setMessage(Object.values(v.errors)[0]); return; }
    setBusy(true); setMessage('');
    const res = await saveJob(next, { instanceId });
    setBusy(false);
    if (!res.ok) { setMessage(res.message); return; }
    onSaved(res.job);
  };
  return (
    <div className="border border-[#1A1815] bg-white p-4 space-y-2" aria-label={job && job.id ? 'Edit the posting' : 'Post a job'}>
      <div className="text-sm font-bold text-[#1A1815]">{job && job.id ? 'Edit the posting' : 'Post a job'}</div>
      <label className="block text-xs text-[#5A5751]">Title<input value={form.title} onChange={set('title')} className={`${INPUT} mt-1`} aria-invalid={!!errors.title} />{errors.title && <span className="block text-[0.6875rem] text-[#B85838]">{errors.title}</span>}</label>
      <label className="block text-xs text-[#5A5751]">Summary<textarea value={form.summary} onChange={set('summary')} rows={3} className={`${INPUT} mt-1`} aria-invalid={!!errors.summary} />{errors.summary && <span className="block text-[0.6875rem] text-[#B85838]">{errors.summary}</span>}</label>
      <label className="block text-xs text-[#5A5751]">Requirements, one per line<textarea value={form.requirements} onChange={set('requirements')} rows={3} className={`${INPUT} mt-1`} /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block text-xs text-[#5A5751]">Engagement<select value={form.employment_type} onChange={set('employment_type')} className={`${INPUT} mt-1`}>{EMPLOYMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
        <label className="block text-xs text-[#5A5751]">Modality<select value={form.modality} onChange={set('modality')} className={`${INPUT} mt-1`}>{MODALITIES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
        <label className="block text-xs text-[#5A5751]">Location (optional)<input value={form.location || ''} onChange={set('location')} className={`${INPUT} mt-1`} /></label>
        <label className="block text-xs text-[#5A5751]">Pay note (optional)<input value={form.pay_note || ''} onChange={set('pay_note')} className={`${INPUT} mt-1`} /></label>
      </div>
      {message && <p className="text-xs text-[#B85838]" role="alert">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save('open')} disabled={busy} className={`${BTN_GOOD}`}>{form.status === 'open' ? 'Save (stays open)' : 'Post it (open)'}</button>
        <button type="button" onClick={() => save(form.status === 'open' ? 'open' : 'draft')} disabled={busy} className={`${BTN}`}>{form.status === 'open' ? 'Save' : 'Save as draft'}</button>
        <button type="button" onClick={onCancel} className={`${BTN}`}>Cancel</button>
      </div>
    </div>
  );
}

function JobsArea({ instanceId }) {
  const [jobs, setJobs] = useState({ loaded: false, rows: [], message: '' });
  const [editing, setEditing] = useState(null); // null | {} (new) | job
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const res = await listJobs();
    setJobs({ loaded: true, rows: res.jobs || [], message: res.ok ? '' : res.message });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setStatus = async (job, status) => { setBusy(true); const res = await saveJob({ ...job, status }, { instanceId }); setBusy(false); if (!res.ok) setJobs((j) => ({ ...j, message: res.message })); refresh(); };
  const remove = async (job) => { setBusy(true); await deleteJob(job.id); setBusy(false); setConfirmRemove(null); refresh(); };
  return (
    <div className="space-y-4">
      {editing ? (
        <JobEditor job={editing.id ? editing : null} instanceId={instanceId} onSaved={() => { setEditing(null); refresh(); }} onCancel={() => setEditing(null)} />
      ) : (
        <div className="border border-[#1A1815] bg-white p-4">
          <div className="text-sm font-bold text-[#1A1815] mb-1">Post a job</div>
          <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>An open posting shows on the door under Join the team and on the website that links it. Applications arrive under Applicants; a hire opens the onboarding packet from the same app.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={() => setEditing({})} className={`${BTN_GOOD}`}>New posting</button>
            <ShareButton label="Share the jobs page" title="Share the door's Join the team page" payload={() => ({ title: 'TLC Therapy Solutions is hiring', text: 'Open positions at TLC Therapy Solutions', url: jobsDoorUrl() })} />
          </div>
        </div>
      )}
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-2">Postings</div>
        {!jobs.loaded && <p className="text-xs text-[#5A5751]">Loading…</p>}
        {jobs.message && <p className="text-xs text-[#B85838]" role="alert">{jobs.message}</p>}
        {jobs.loaded && jobs.rows.length === 0 && <p className="text-xs text-[#5A5751]">No postings yet.</p>}
        <ul className="divide-y divide-[#E6E0D6]">
          {jobs.rows.map((job) => (
            <li key={job.id} className="py-2 space-y-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm text-[#1A1815]" style={{ ...SERIF, fontWeight: 600 }}>{job.title} <span className={`${CHIP} ml-1 ${job.status === 'open' ? 'border-[#5A6E3D] text-[#3F5226]' : ''}`}>{job.status}</span></div>
                  <JobFacts job={job} />
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <button type="button" onClick={() => setEditing(job)} className={`${BTN}`}>Edit</button>
                  {job.status !== 'open' && <button type="button" onClick={() => setStatus(job, 'open')} disabled={busy} className={`${BTN_GOOD}`}>Open</button>}
                  {job.status === 'open' && <button type="button" onClick={() => setStatus(job, 'closed')} disabled={busy} className={`${BTN_WARN}`}>Close</button>}
                  {confirmRemove === job.id
                    ? <><button type="button" onClick={() => remove(job)} disabled={busy} className={`${BTN_WARN}`}>Really remove</button><button type="button" onClick={() => setConfirmRemove(null)} className={`${BTN}`}>Keep</button></>
                    : <button type="button" onClick={() => setConfirmRemove(job.id)} className={`${BTN}`}>Remove</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// THE APPLICANTS AREA — by station; hire; the pipeline; the telehealth hand-off.
// -----------------------------------------------------------------------------
function Pipeline({ steps }) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Hiring pipeline">
      {steps.map((s) => (
        <li key={s.key} className={`text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border ${s.done ? 'border-[#5A6E3D] text-[#3F5226] bg-[#F0F4EA]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
          <span aria-hidden="true">{s.done ? '✓ ' : '○ '}</span>{s.label}{s.at ? ` · ${formatDate(s.at)}` : ''}
        </li>
      ))}
    </ol>
  );
}

function TelehealthHandoff({ app, onMark, busy }) {
  const st = telehealthStatus(app.telehealth_status);
  const next = app.telehealth_status === 'not-started' ? 'invited' : app.telehealth_status === 'invited' ? 'active' : null;
  return (
    <div className="border border-[#5A6E3D] bg-[#F0F4EA] p-3 space-y-2" aria-label={`Telehealth hand-off for ${app.name}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-xs font-semibold text-[#3F5226]">Hand-off to {TLC_TELEHEALTH.name} · {st.label}{app.telehealth_at ? ` · ${formatDate(app.telehealth_at)}` : ''}</div>
        {TLC_TELEHEALTH.confirm && <span className={CHIP}>platform name from the handbook · Christina confirms</span>}
      </div>
      <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>The platform has no way for this app to add a team member for you; do these steps there, then mark each one here so the office sees one true state.</p>
      <ol className="list-decimal pl-4 text-xs text-[#1A1815] space-y-0.5" style={SERIF}>{TLC_TELEHEALTH.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">The message to send with the platform invite</div>
      <CopyText text={telehealthHandoffMessage({ name: app.name.split(' ')[0] })} label="Copy message" />
      {next && (
        <button type="button" onClick={() => onMark(app, next)} disabled={busy} className={`${BTN_GOOD}`}>
          {next === 'invited' ? `Mark invited to ${TLC_TELEHEALTH.name}` : `Mark active on ${TLC_TELEHEALTH.name}`}
        </button>
      )}
    </div>
  );
}

function ApplicantCard({ app, packet, onMove, onHire, onMark, busy, hired }) {
  const [showAll, setShowAll] = useState(false);
  const status = applicationStatus(app.status);
  const moves = APPLICATION_STATUSES.filter((s) => canMoveApplication(app.status || 'new', s.key));
  const hireable = !['hired', 'declined'].includes(app.status || 'new');
  return (
    <li className="py-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm text-[#1A1815]" style={{ ...SERIF, fontWeight: 600 }}>{app.name} <span className={`${CHIP} ml-1`}>{status.label}</span></div>
          <div className="text-[0.6875rem] text-[#5A5751]">{app.email}{app.phone ? ` · ${app.phone}` : ''}{app.license_type ? ` · ${app.license_type}${app.license_state ? ` (${app.license_state})` : ''}` : ''}{app.years_experience != null && app.years_experience !== '' ? ` · ${app.years_experience} yrs` : ''} · applied {formatDate(app.created_at)}</div>
        </div>
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className={`${BTN}`}>{showAll ? 'Less' : 'Read'}</button>
      </div>
      {showAll && (
        <div className="text-xs text-[#1A1815] space-y-1" style={SERIF}>
          <p className="whitespace-pre-wrap">{app.statement}</p>
          {app.availability && <p><span className="text-[#5A5751]">Availability:</span> {app.availability}</p>}
          {app.link && <p><a href={app.link} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">Their link</a></p>}
          {app.note && <p><span className="text-[#5A5751]">Office note:</span> {app.note}</p>}
        </div>
      )}
      <Pipeline steps={hirePipeline(app, packet)} />
      <div className="flex flex-wrap gap-1.5">
        {moves.map((s) => <button key={s.key} type="button" onClick={() => onMove(app, s.key)} disabled={busy} className={s.key === 'declined' ? BTN_WARN : BTN}>{s.key === 'declined' ? 'Decline' : `→ ${s.label}`}</button>)}
        {hireable && <button type="button" onClick={() => onHire(app)} disabled={busy} className={`${BTN_GOOD}`}>Hire · open onboarding</button>}
      </div>
      {hired && hired.id === app.id && (
        <div className="border border-[#5A6E3D] bg-[#F0F4EA] p-3" role="status">
          <div className="text-xs font-semibold text-[#3F5226] mb-1">{hired.already ? 'Already hired · the invite stands' : `Hired · onboarding invite ready for ${hired.email}`}{hired.expires_at ? ` · good until ${formatDate(hired.expires_at)}` : ''}</div>
          {hired.token && <>
            <p className="text-xs text-[#5A5751] mb-2" style={SERIF}>Send them this link any way you already reach them. It opens the TLC app and binds the packet to whoever signs in with it.</p>
            <CopyText text={buildOnboardLink(hired.token)} label="Copy link" />
          </>}
        </div>
      )}
      {app.status === 'hired' && <TelehealthHandoff app={app} onMark={onMark} busy={busy} />}
    </li>
  );
}

function ApplicantsArea({ packets = [] }) {
  const [apps, setApps] = useState({ loaded: false, rows: [], message: '' });
  const [busy, setBusy] = useState(false);
  const [hired, setHired] = useState(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const res = await listApplications();
    setApps({ loaded: true, rows: res.applications || [], message: res.ok ? '' : res.message });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const act = async (fn) => { setBusy(true); setError(''); const res = await fn(); setBusy(false); if (!res.ok) setError(res.message); refresh(); return res; };
  const onMove = (app, status) => act(() => reviewApplication(app, status));
  const onHire = async (app) => { const res = await act(() => hireApplicant(app)); if (res.ok) setHired({ id: app.id, ...res.hire }); };
  const onMark = (app, status) => act(() => markTelehealth(app, status));
  const packetFor = (app) => packets.find((p) => p.invite_id && p.invite_id === app.invite_id) || null;
  const groups = applicationsByStatus(apps.rows).filter((g) => g.rows.length > 0);
  return (
    <div className="space-y-4">
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
          <div className="text-sm font-bold text-[#1A1815]">Applicants</div>
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{apps.rows.length} on file</div>
        </div>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2" style={SERIF}>From applied to active on the telehealth platform, every step is the row’s own state. Hire mints the onboarding invite in the same breath; the packet and the roster follow under Packets and Roster.</p>
        {error && <p className="text-xs text-[#B85838]" role="alert">{error}</p>}
        {apps.message && <p className="text-xs text-[#B85838]" role="alert">{apps.message}</p>}
        {!apps.loaded && <p className="text-xs text-[#5A5751]">Loading…</p>}
        {apps.loaded && apps.rows.length === 0 && !apps.message && <p className="text-xs text-[#5A5751]">No applications yet. When a posting is open, they arrive here.</p>}
        {groups.map((g) => (
          <div key={g.key} className="mt-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold border-b border-[#E8E4DC] pb-1">{g.label} · {g.rows.length}</div>
            <ul className="divide-y divide-[#E6E0D6]">
              {g.rows.map((app) => <ApplicantCard key={app.id} app={app} packet={packetFor(app)} onMove={onMove} onHire={onHire} onMark={onMark} busy={busy} hired={hired} />)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">The hand-off, in one line</div>
        <p className="text-xs text-[#1A1815]" style={SERIF}>Applied → reviewed → hired (the invite) → the packet approved (the roster and the public card, under Packets) → {TELEHEALTH_STATUSES.map((s) => s.label.toLowerCase()).join(' → ')} on {TLC_TELEHEALTH.name}.</p>
      </div>
    </div>
  );
}

export function HiringDesk({ area = 'jobs', instanceId = null, packets = [] }) {
  return area === 'applicants' ? <ApplicantsArea packets={packets} /> : <JobsArea instanceId={instanceId} />;
}

export default HiringDesk;
