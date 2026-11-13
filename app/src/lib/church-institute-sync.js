// =============================================================================
// church-institute-sync — the seam for the Institute's roll, attendance and
// credentials (migration 0325, DR-1460)
// =============================================================================
// The doors, and no others:
//   readInstituteSettings     institute_settings (anyone reads) — the office's
//                             regulatory state and whether enrollment is open.
//   saveInstituteSettings     institute_settings (office writes)
//   readMyEnrollments         institute_enrollments — your own rows.
//   applyToProgram            institute_enrollments INSERT — your own row; the
//                             database refuses it unless the settings read
//                             confirmed AND open (the policy is the wall).
//   withdrawMyEnrollment      your own row to 'withdrawn'.
//   readInstituteRoll         institute_enrollments — the office reads all.
//   setEnrollmentStatus       office: accepted / withdrawn / cohort date.
//   readAttendance            attendance rows for one enrollment (student or office).
//   markAttendance            office: one session date, present or not.
//   readCompletion            institute_completion(enrollment) — the standard.
//   issueCredential           institute_issue_credential — office only; the
//                             server re-runs the standard first.
//   readMyCredentials         institute_credentials — your own.
//   verifyCredential          institute_verify_credential — anyone, a code in,
//                             the minimal public fields out.
//
// USER-ACCOUNTS-AND-HISTORIES-STANDARD: a student's application, attendance and
// credential are their own history, scoped to them by RLS (the office reads
// its church's roll, nobody reads across churches); the account holds a name on
// a certificate and nothing clinical or financial; every row a person owns is
// theirs to read back. Every call is three-valued through lib/church-access.js
// ask(): { ok, value } or { ok:false, reason, message } a surface can say in a
// sentence. No `error` is destructured away (DR-1053); every call carries
// ask's attempt ceiling as its timeout.
// =============================================================================
import supabase from './supabase.js';
import { ask } from './church-access.js';

const SETTINGS_FIELDS = ['name', 'exemption_status', 'filing_reference', 'filed_at', 'enrollment_open', 'attendance_floor'];

const list = (a) => (a.ok && Array.isArray(a.value) ? a.value : []);
const one = (a) => (a.ok && a.value && typeof a.value === 'object' && !Array.isArray(a.value) ? a.value : null);
const refuse = (reason, message, extra = {}) => ({ ok: false, reason, message, attempts: 0, ...extra });

export async function readInstituteSettings(instanceId, opts) {
  if (!instanceId) return refuse('no-instance', 'no church to read', { settings: null });
  const a = await ask(() => supabase.from('institute_settings').select('*').eq('instance_id', instanceId).maybeSingle(), opts);
  return { ...a, settings: one(a) };
}

export async function saveInstituteSettings(instanceId, patch = {}, opts) {
  if (!instanceId) return refuse('no-instance', 'no church to write', { settings: null });
  const allowed = {};
  for (const k of SETTINGS_FIELDS) if (patch[k] !== undefined) allowed[k] = patch[k];
  const a = await ask(
    () =>
      supabase
        .from('institute_settings')
        .upsert({ instance_id: instanceId, ...allowed }, { onConflict: 'instance_id' })
        .select('*')
        .single(),
    { tries: 1, ...opts }
  );
  return { ...a, settings: one(a) };
}

export async function readMyEnrollments(instanceId, userId, opts) {
  if (!instanceId || !userId) return refuse('signed-out', 'sign in to see your applications', { enrollments: [] });
  const a = await ask(
    () => supabase.from('institute_enrollments').select('*').eq('instance_id', instanceId).eq('user_id', userId).order('applied_at', { ascending: false }),
    opts
  );
  return { ...a, enrollments: list(a) };
}

export async function applyToProgram(instanceId, { programKey, programTitle, courseKeys = [], note = '' } = {}, opts) {
  if (!instanceId) return refuse('no-instance', 'no church to apply to', { enrollment: null });
  if (!programKey || !programTitle) return refuse('bad-input', 'choose a program first', { enrollment: null });
  const a = await ask(
    () =>
      supabase
        .from('institute_enrollments')
        .insert({ instance_id: instanceId, program_key: programKey, program_title: programTitle, course_keys: courseKeys, note: note || null })
        .select('*')
        .single(),
    { tries: 1, ...opts }
  );
  return { ...a, enrollment: one(a) };
}

export async function withdrawMyEnrollment(enrollmentId, opts) {
  if (!enrollmentId) return refuse('bad-input', 'no application to withdraw', { enrollment: null });
  const a = await ask(() => supabase.from('institute_enrollments').update({ status: 'withdrawn' }).eq('id', enrollmentId).select('*').single(), {
    tries: 1,
    ...opts,
  });
  return { ...a, enrollment: one(a) };
}

export async function readInstituteRoll(instanceId, opts) {
  if (!instanceId) return refuse('no-instance', 'no church to read', { roll: [] });
  const a = await ask(() => supabase.from('institute_enrollments').select('*').eq('instance_id', instanceId).order('applied_at', { ascending: true }), opts);
  return { ...a, roll: list(a) };
}

export async function setEnrollmentStatus(enrollmentId, { status, cohortStart } = {}, opts) {
  if (!enrollmentId) return refuse('bad-input', 'no enrollment named', { enrollment: null });
  const patch = {};
  if (status) patch.status = status;
  if (cohortStart !== undefined) patch.cohort_start = cohortStart || null;
  if (Object.keys(patch).length === 0) return refuse('bad-input', 'nothing to change', { enrollment: null });
  const a = await ask(() => supabase.from('institute_enrollments').update(patch).eq('id', enrollmentId).select('*').single(), { tries: 1, ...opts });
  return { ...a, enrollment: one(a) };
}

export async function readAttendance(enrollmentId, opts) {
  if (!enrollmentId) return refuse('bad-input', 'no enrollment named', { attendance: [] });
  const a = await ask(
    () => supabase.from('institute_attendance').select('*').eq('enrollment_id', enrollmentId).order('session_date', { ascending: true }),
    opts
  );
  return { ...a, attendance: list(a) };
}

export async function markAttendance(instanceId, enrollmentId, sessionDate, present = true, opts) {
  if (!instanceId || !enrollmentId || !sessionDate) return refuse('bad-input', 'a session date is required', { row: null });
  const a = await ask(
    () =>
      supabase
        .from('institute_attendance')
        .upsert(
          { instance_id: instanceId, enrollment_id: enrollmentId, session_date: sessionDate, present: !!present },
          { onConflict: 'enrollment_id,session_date' }
        )
        .select('*')
        .single(),
    { tries: 1, ...opts }
  );
  return { ...a, row: one(a) };
}

export async function readCompletion(enrollmentId, opts) {
  if (!enrollmentId) return refuse('bad-input', 'no enrollment named', { completion: null });
  const a = await ask(() => supabase.rpc('institute_completion', { p_enrollment: enrollmentId }), opts);
  return { ...a, completion: one(a) };
}

export async function issueCredential(enrollmentId, holderName, opts) {
  const name = String(holderName || '').trim();
  if (!enrollmentId || !name) return refuse('bad-input', "the holder's name is required on the certificate", { credential: null });
  const a = await ask(() => supabase.rpc('institute_issue_credential', { p_enrollment: enrollmentId, p_holder_name: name }), { tries: 1, ...opts });
  return { ...a, credential: one(a) };
}

export async function readMyCredentials(instanceId, opts) {
  if (!instanceId) return refuse('no-instance', 'no church to read', { credentials: [] });
  const a = await ask(() => supabase.from('institute_credentials').select('*').eq('instance_id', instanceId).order('issued_at', { ascending: false }), opts);
  return { ...a, credentials: list(a) };
}

export async function verifyCredential(code, opts) {
  const c = String(code || '')
    .trim()
    .toUpperCase();
  if (!c) return refuse('bad-input', 'enter the code printed on the certificate', { found: null });
  const a = await ask(() => supabase.rpc('institute_verify_credential', { p_code: c }), opts);
  return { ...a, found: one(a) };
}

/** Pure. The one sentence a surface says for an answer that is not ok. */
export function instituteSentence(answer) {
  if (!answer || answer.ok) return '';
  if (answer.reason === 'signed-out') return 'Sign in to see your applications.';
  if (answer.reason === 'no-instance') return 'No church is selected.';
  if (answer.reason === 'bad-input') return answer.message || 'Something is missing.';
  if (answer.reason === 'refused') return `The office's wall refused it: ${answer.message || 'not allowed'}.`;
  return `The church's records did not answer${answer.attempts > 1 ? ` after ${answer.attempts} tries` : ''}; try again in a moment.`;
}
