// =============================================================================
// tlc-hiring-sync — the client's honest seam to migration 0191 (DR-0350)
// =============================================================================
// Anyone reads the open jobs and applies through the two SECURITY DEFINER
// functions; the office owner/admin posts, reviews, hires and marks the
// telehealth hand-off through RLS and tlc_application_hire(). Every call is
// bounded by a timeout and fails soft with a sentence the person can act on
// (SOUL.md: explicit thresholds + fallback paths); every error is put in words
// by tlcError, never a Cloudflare page (DR-0347).
import supabase from './supabase.js';
import { tlcError } from './tlc-error.js';
import { validateApplication, normalizeApplication, validateJob, normalizeJob, canMoveApplication, TELEHEALTH_STATUSES } from './tlc-hiring.js';

export const RPC_TIMEOUT_MS = 15000;
export const OFFICE_ID = 'tlc';

function withTimeout(promise, ms, what) {
  let timer;
  const bound = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} took longer than ${Math.round(ms / 1000)}s — check the connection and try again`)), ms); });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

function fail(reason, error) {
  const message = (error && tlcError(error)) || String(error || reason);
  return { ok: false, reason, message };
}

async function rpc(name, args) {
  try {
    const { data, error } = await withTimeout(supabase.rpc(name, args), RPC_TIMEOUT_MS, name);
    if (error) return fail('rpc-error', error);
    return { ok: true, data };
  } catch (e) { return fail('network-error', e); }
}

// ---- Anyone ----------------------------------------------------------------

/** The open postings, for the door. Empty on any failure, with the reason. */
export async function listPublicJobs(office = OFFICE_ID) {
  const res = await rpc('tlc_public_jobs', { office_in: office });
  if (!res.ok) return { ...res, jobs: [] };
  return { ok: true, jobs: Array.isArray(res.data) ? res.data : [] };
}

/** Apply to one posting. Validated on the device first, in the server's own words. */
export async function applyToJob(jobId, applicant, office = OFFICE_ID) {
  if (!jobId) return fail('no-job', 'Choose a position first.');
  const v = validateApplication(applicant);
  if (!v.ok) return { ok: false, reason: 'invalid', message: Object.values(v.errors)[0], errors: v.errors };
  const res = await rpc('tlc_apply', { office_in: office, job_id_in: jobId, applicant_in: normalizeApplication(applicant) });
  if (!res.ok) return res;
  return { ok: true, receipt: res.data };
}

// ---- The office owner / admin ----------------------------------------------

async function query(label, build) {
  try {
    const { data, error } = await withTimeout(build(), RPC_TIMEOUT_MS, label);
    if (error) return fail('query-error', error);
    return { ok: true, data };
  } catch (e) { return fail('network-error', e); }
}

/** Every posting of the office (draft, open, closed), newest first. */
export async function listJobs() {
  const res = await query('listing jobs', () => supabase.from('tlc_jobs').select('*').order('created_at', { ascending: false }));
  if (!res.ok) return { ...res, jobs: [] };
  return { ok: true, jobs: res.data || [] };
}

/** Post or edit a job. A new row needs the office's instance id (from the onboarding office). */
export async function saveJob(job, { instanceId = null } = {}) {
  const v = validateJob(job);
  if (!v.ok) return { ok: false, reason: 'invalid', message: Object.values(v.errors)[0], errors: v.errors };
  const row = normalizeJob(job);
  const stamps = row.status === 'open' ? { posted_at: new Date().toISOString(), closed_at: null }
    : row.status === 'closed' ? { closed_at: new Date().toISOString() } : {};
  if (row.id) {
    const res = await query('saving the job', () => supabase.from('tlc_jobs').update({ ...row, ...stamps, updated_at: new Date().toISOString() }).eq('id', row.id).select('*').single());
    return res.ok ? { ok: true, job: res.data } : res;
  }
  if (!instanceId) return fail('no-office', 'Your office could not be found; sign in as the office owner or admin.');
  const res = await query('posting the job', () => supabase.from('tlc_jobs').insert({ ...row, ...stamps, instance_id: instanceId, office_id: OFFICE_ID }).select('*').single());
  return res.ok ? { ok: true, job: res.data } : res;
}

export async function deleteJob(jobId) {
  if (!jobId) return fail('no-id', 'No posting to remove.');
  return query('removing the job', () => supabase.from('tlc_jobs').delete().eq('id', jobId));
}

/** Every application of the office, newest first (owner/admin; RLS denies everyone else). */
export async function listApplications() {
  const res = await query('listing applicants', () => supabase.from('tlc_job_applications').select('*').order('created_at', { ascending: false }));
  if (!res.ok) return { ...res, applications: [] };
  return { ok: true, applications: res.data || [] };
}

/** Move an application along its stations (never to hired: that is hire). */
export async function reviewApplication(app, status, note = '') {
  if (!app || !app.id) return fail('no-id', 'No application chosen.');
  if (!canMoveApplication(app.status || 'new', status)) return fail('bad-move', `An application cannot go from ${app.status || 'new'} to ${status} here.`);
  const res = await query('updating the application', () => supabase.from('tlc_job_applications').update({ status, note: note || app.note || null }).eq('id', app.id).select('*').single());
  return res.ok ? { ok: true, application: res.data } : res;
}

/** Hire: the application becomes hired and the onboarding invite is minted, atomically. */
export async function hireApplicant(app, note = '') {
  if (!app || !app.id) return fail('no-id', 'No application chosen.');
  const res = await rpc('tlc_application_hire', { application_id_in: app.id, note_in: note || null });
  if (!res.ok) return res;
  return { ok: true, hire: res.data };
}

/** Record the telehealth hand-off as done in the platform: invited, then active. */
export async function markTelehealth(app, status, note = '') {
  if (!app || !app.id) return fail('no-id', 'No application chosen.');
  if (!TELEHEALTH_STATUSES.some((s) => s.key === status)) return fail('bad-status', 'Not a telehealth hand-off state.');
  const res = await query('recording the hand-off', () => supabase.from('tlc_job_applications').update({ telehealth_status: status, telehealth_note: note || null }).eq('id', app.id).select('*').single());
  return res.ok ? { ok: true, application: res.data } : res;
}
