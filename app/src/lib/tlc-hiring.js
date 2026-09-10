// =============================================================================
// tlc-hiring — hire through the TLC app: jobs on the door, applicants, the
// hire that opens onboarding, and the hand-off to the telehealth platform
// =============================================================================
// Darrell 2026-09-10: "need to have the ability to hire people for jobs we
// post so we can hire through the app and onboarding goes to the telehealth
// app we use." Then: "The website is already linked however opportunities and
// constraints."
//
// The pipeline, as data (DR-0350):
//   posted (tlc_jobs, open) -> applied (tlc_apply, anyone) -> reviewing /
//   interview / offered -> HIRED (tlc_application_hire mints the 0187 invite
//   in the same transaction) -> the packet (0187: draft / submitted / approved,
//   approval writes the roster and the public card) -> the telehealth platform
//   (invited -> active, marked by the office after doing it there).
//
// Pure and injectable: no window, no network. The seam is tlc-hiring-sync.js.
// Every bound here mirrors migration 0191 so a bad application is refused on
// the device before it is refused by the server, in the same words.
// =============================================================================
import { CANONICAL_APP_ORIGIN } from './app-share.js';
import { TLC_APP_PATH } from './tlc-onboarding.js';
import { TLC_BRAND } from './tlc-practice.js';

export const JOB_STATUSES = Object.freeze(['draft', 'open', 'closed']);
export const EMPLOYMENT_TYPES = Object.freeze([
  { key: 'contractor', label: 'Independent contractor' },
  { key: 'employee', label: 'Employee' },
]);
export const MODALITIES = Object.freeze([
  { key: 'telehealth', label: 'Telehealth' },
  { key: 'in-person', label: 'In person' },
  { key: 'hybrid', label: 'Hybrid' },
]);

// The application's stations, in order; hired and declined are terminal.
export const APPLICATION_STATUSES = Object.freeze([
  { key: 'new', label: 'New', next: ['reviewing', 'interview', 'declined'] },
  { key: 'reviewing', label: 'Reviewing', next: ['interview', 'offered', 'declined'] },
  { key: 'interview', label: 'Interview', next: ['offered', 'declined', 'reviewing'] },
  { key: 'offered', label: 'Offered', next: ['hired', 'declined', 'interview'] },
  { key: 'hired', label: 'Hired', next: [] },
  { key: 'declined', label: 'Declined', next: ['reviewing'] },
]);
export const APPLICATION_STATUS_KEYS = APPLICATION_STATUSES.map((s) => s.key);

export function applicationStatus(key) {
  return APPLICATION_STATUSES.find((s) => s.key === key) || APPLICATION_STATUSES[0];
}

/** May an application move from one station to another? Hired is reached only through hire. */
export function canMoveApplication(from, to) {
  if (to === 'hired') return false;
  const s = APPLICATION_STATUSES.find((x) => x.key === from);
  return !!s && s.next.includes(to);
}

// ---------------------------------------------------------------------------
// THE TELEHEALTH HAND-OFF. The office's scheduling / telehealth platform is
// named in the handbook (lib/tlc-handbook.js: "approved platforms (e.g.,
// SimplePractice, Glide)"). It has no public API for adding a team member, so
// the app records the hand-off and carries the message; it never pretends to
// create the account. `confirm` is Christina's: the name and the steps are the
// handbook's reading, to be ratified in-app (re-review 2026-09-17).
// ---------------------------------------------------------------------------
export const TLC_TELEHEALTH = Object.freeze({
  name: 'SimplePractice',
  role: 'scheduling and telehealth platform',
  source: 'Independent Contractor Handbook, "Use of Approved Scheduling Platform"',
  confirm: true,
  // What the office does there, in order, after the packet is approved.
  steps: Object.freeze([
    'Add the therapist as a team member in the platform, with their clinician role and calendar.',
    'Send them the platform’s own invitation to their email; they set their own password there (the app never holds one).',
    'Confirm their telehealth sessions, notes and scheduling live in the platform, not in this app (the TLC firewall: no client health information here).',
    'Mark the hand-off Active below once they have signed in and their first availability is on the calendar.',
  ]),
});

export const TELEHEALTH_STATUSES = Object.freeze([
  { key: 'not-started', label: 'Not started' },
  { key: 'invited', label: 'Invited to the platform' },
  { key: 'active', label: 'Active on the platform' },
]);
export function telehealthStatus(key) {
  return TELEHEALTH_STATUSES.find((s) => s.key === key) || TELEHEALTH_STATUSES[0];
}

const line = (s) => String(s == null ? '' : s).trim();

/** The message the office sends the new hire when the platform invite goes out. */
export function telehealthHandoffMessage({ name = '', platform = TLC_TELEHEALTH } = {}) {
  const who = line(name) || 'Welcome';
  return [
    `${who}, welcome to ${TLC_BRAND.name}.`,
    `Your onboarding packet is approved. The next step is ${platform.name}, our ${platform.role}: you will receive its invitation at this email. Set your own password there; nobody at TLC will ever ask for it.`,
    'Your sessions, notes and scheduling live in that platform. The TLC app is where your training, the team, and the office live.',
    'Reply here when you are in, and we will confirm your first availability on the calendar.',
  ].join('\n\n');
}

// ---------------------------------------------------------------------------
// POSTING TEMPLATES (Darrell 2026-09-10: "How do we create the openings for
// the specific roles when needed?" / "What about other roles like manager or
// AI specialist"). The clinical seats come from the governance chart; these
// are the office roles beyond it. A template only fills the editor — every
// field stays editable, and "Something else" starts blank.
// ---------------------------------------------------------------------------
export const JOB_TEMPLATES = Object.freeze([
  { key: 'operations-manager', title: 'Operations Manager', employment_type: 'employee', modality: 'hybrid',
    summary: 'Run the office day to day: onboarding invites and packets, the launch board, scheduling and the platforms the practice runs on, so the clinicians can stay with their clients.',
    requirements: ['Three or more years running a small office or practice', 'Comfortable with scheduling and telehealth platforms and with the TLC app', 'Discretion with confidential information; HIPAA awareness', 'Reports to the owner; sits as the admin seat in the app'] },
  { key: 'ai-specialist', title: 'AI & Systems Specialist', employment_type: 'contractor', modality: 'telehealth',
    summary: 'Keep the practice’s systems honest and useful: the TLC app and its automations, the data flows between the website, the door and the office, the training library, and the sovereign tools we run ourselves — always with client information walled off.',
    requirements: ['Hands-on with modern web apps, APIs and automation', 'Understands data privacy and the line between office data and client health information', 'Can explain what a system does in plain words and prove it with a test', 'Reports to the Operations Manager'] },
  { key: 'intake-coordinator', title: 'Intake Coordinator', employment_type: 'employee', modality: 'hybrid',
    summary: 'Answer inquiries, schedule consults, keep the roster and the booking page current, and walk a new client from first contact to first session.',
    requirements: ['Warm, clear on the phone and in writing', 'Organized across a queue of inquiries', 'Discretion with confidential information'] },
  { key: 'billing-credentialing', title: 'Billing & Credentialing Specialist', employment_type: 'contractor', modality: 'telehealth',
    summary: 'Keep clinicians credentialed with the payers we accept and claims moving: CAQH, payer enrollment, claims and follow-up.',
    requirements: ['Experience with behavioral-health billing and payer credentialing', 'Familiar with CAQH and the major Illinois payers', 'Accurate and persistent with follow-up'] },
  // The support roles for the work and the development of the product and the
  // systems we support (Darrell 2026-09-10).
  { key: 'product-support', title: 'Product & Systems Support Specialist', employment_type: 'contractor', modality: 'telehealth',
    summary: 'Be the person a colleague or a client reaches when the app, the door, a link or a device does not do what it should: answer, reproduce, fix what can be fixed, and hand the rest to development with a clear report.',
    requirements: ['Patient and clear with people who are not technical', 'Can reproduce a problem step by step and write it down', 'Knows the TLC app and the platforms the office runs on', 'Reports to the AI & Systems Specialist'] },
  { key: 'app-developer', title: 'App Developer (PWA)', employment_type: 'contractor', modality: 'telehealth',
    summary: 'Build and keep the TLC app and the PoeTech platform it lives in: React, the database and its row-level security, the tests and gates every change must pass, and the sovereign services on our own hardware.',
    requirements: ['Modern JavaScript and React; SQL and row-level security', 'Ships with tests; every claim proven, never “it should work”', 'Cares about privacy: client health information never enters the app', 'Reports to the AI & Systems Specialist'] },
  { key: 'curriculum-content', title: 'Curriculum & Content Specialist', employment_type: 'contractor', modality: 'telehealth',
    summary: 'Write and keep the lessons and trainings: the client lessons, the therapist trainings and their Illinois rules, every verse verbatim, every claim sourced, plain by default with the Word on click.',
    requirements: ['Writes clearly for clients and for clinicians', 'Cites sources and quotes Scripture exactly, never from memory', 'Works with Christina (LCSW) for clinical sign-off', 'Reports to the Operations Manager'] },
]);
export function jobTemplate(key) {
  return JOB_TEMPLATES.find((t) => t.key === key) || null;
}

// ---------------------------------------------------------------------------
// VALIDATION, mirroring 0191 (the same bounds, the same words).
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateJob(job = {}) {
  const errors = {};
  const title = line(job.title);
  const summary = line(job.summary);
  if (title.length < 3 || title.length > 120) errors.title = 'A title of 3 to 120 characters.';
  if (summary.length < 10 || summary.length > 2000) errors.summary = 'A summary of 10 to 2000 characters.';
  const reqs = Array.isArray(job.requirements) ? job.requirements.map(line).filter(Boolean) : [];
  if (reqs.length > 20) errors.requirements = 'At most 20 requirements.';
  if (job.employment_type && !EMPLOYMENT_TYPES.some((t) => t.key === job.employment_type)) errors.employment_type = 'Contractor or employee.';
  if (job.modality && !MODALITIES.some((m) => m.key === job.modality)) errors.modality = 'Telehealth, in person, or hybrid.';
  if (line(job.location).length > 120) errors.location = 'At most 120 characters.';
  if (line(job.pay_note).length > 300) errors.pay_note = 'At most 300 characters.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** The row the seam sends: trimmed, bounded, requirements as an array of lines. */
export function normalizeJob(job = {}) {
  const reqs = Array.isArray(job.requirements)
    ? job.requirements
    : String(job.requirements || '').split('\n');
  return {
    ...(job.id ? { id: job.id } : {}),
    title: line(job.title),
    summary: line(job.summary),
    requirements: reqs.map(line).filter(Boolean).slice(0, 20),
    employment_type: EMPLOYMENT_TYPES.some((t) => t.key === job.employment_type) ? job.employment_type : 'contractor',
    modality: MODALITIES.some((m) => m.key === job.modality) ? job.modality : 'telehealth',
    location: line(job.location) || null,
    pay_note: line(job.pay_note) || null,
    status: JOB_STATUSES.includes(job.status) ? job.status : 'draft',
  };
}

export function validateApplication(a = {}) {
  const errors = {};
  const name = line(a.name);
  const email = line(a.email).toLowerCase();
  const statement = line(a.statement);
  if (name.length < 2 || name.length > 120) errors.name = 'Please give your full name.';
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = 'That is not a valid email address.';
  if (statement.length < 20 || statement.length > 3000) errors.statement = 'Please write a few sentences about yourself (20 to 3000 characters).';
  const years = line(a.years_experience);
  if (years && !/^\d{1,2}$/.test(years)) errors.years_experience = 'Years of experience must be a whole number.';
  else if (years && (Number(years) < 0 || Number(years) > 60)) errors.years_experience = 'Years of experience must be between 0 and 60.';
  if (line(a.phone).length > 40) errors.phone = 'At most 40 characters.';
  if (line(a.license_type).length > 80) errors.license_type = 'At most 80 characters.';
  if (line(a.license_state).length > 40) errors.license_state = 'At most 40 characters.';
  if (line(a.availability).length > 500) errors.availability = 'At most 500 characters.';
  const link = line(a.link);
  if (link && (link.length > 300 || !/^https?:\/\//i.test(link))) errors.link = 'A web link starting with http:// or https://, at most 300 characters.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** What tlc_apply receives: trimmed strings, nothing more. No bytes, no health information. */
export function normalizeApplication(a = {}) {
  return {
    name: line(a.name),
    email: line(a.email).toLowerCase(),
    phone: line(a.phone),
    license_type: line(a.license_type),
    license_state: line(a.license_state),
    years_experience: line(a.years_experience),
    statement: line(a.statement),
    availability: line(a.availability),
    link: line(a.link),
  };
}

// ---------------------------------------------------------------------------
// THE PIPELINE, per application, joined to the packet it produced (by
// invite_id) — every step true or false from real state, never painted.
// ---------------------------------------------------------------------------
export function hirePipeline(app = {}, packet = null) {
  const status = app.status || 'new';
  const hired = status === 'hired';
  const packetStatus = packet ? packet.status : null;
  return [
    { key: 'applied', label: 'Applied', done: true, at: app.created_at || null },
    { key: 'reviewed', label: 'Reviewed', done: ['reviewing', 'interview', 'offered', 'hired', 'declined'].includes(status), at: null },
    { key: 'hired', label: 'Hired · invite sent', done: hired && !!app.invite_id, at: app.hired_at || null },
    { key: 'packet', label: packetStatus === 'approved' ? 'Packet approved' : packetStatus ? `Packet ${packetStatus}` : 'Packet not started', done: packetStatus === 'approved', at: packet && packet.submitted_at ? packet.submitted_at : null },
    { key: 'telehealth', label: telehealthStatus(app.telehealth_status).label, done: app.telehealth_status === 'active', at: app.telehealth_at || null },
  ];
}

/** Group applications by their station, in station order, for the office board. */
export function applicationsByStatus(apps = []) {
  return APPLICATION_STATUSES.map((s) => ({ ...s, rows: apps.filter((a) => (a.status || 'new') === s.key) }));
}

// ---------------------------------------------------------------------------
// THE LINK. The website is already linked to the door; the door carries the
// jobs, so one list serves both: `?tlc=1&jobs=1` opens the door on Join the
// team, and `&job=<id>` on one posting.
// ---------------------------------------------------------------------------
export const JOBS_LINK_PARAMS = Object.freeze({ door: 'tlc', jobs: 'jobs', job: 'job' });

export function jobsDoorUrl({ jobId = null, origin = CANONICAL_APP_ORIGIN, path = TLC_APP_PATH } = {}) {
  const parts = [`${JOBS_LINK_PARAMS.door}=1`, `${JOBS_LINK_PARAMS.jobs}=1`];
  if (jobId) parts.push(`${JOBS_LINK_PARAMS.job}=${encodeURIComponent(String(jobId))}`);
  return `${origin || ''}${path || '/'}?${parts.join('&')}`;
}

export function parseJobsLink(search) {
  const out = { jobs: false, jobId: null };
  try {
    const sp = new URLSearchParams(search || '');
    const j = sp.get(JOBS_LINK_PARAMS.jobs);
    out.jobs = j !== null && j !== '' && j !== '0';
    const id = (sp.get(JOBS_LINK_PARAMS.job) || '').trim();
    if (id) { out.jobId = id; out.jobs = true; }
  } catch (_) { /* malformed query -> nothing linked */ }
  return out;
}

/** What the share sheet gets for one posting. */
export function jobSharePayload(job = {}, { url = '' } = {}) {
  const title = line(job.title) || `A position at ${TLC_BRAND.name}`;
  const mode = MODALITIES.find((m) => m.key === job.modality);
  const text = [line(job.summary), `${mode ? `${mode.label} · ` : ''}${TLC_BRAND.name} is hiring`].filter(Boolean).join('\n');
  return { title, text, url: String(url || '') };
}
