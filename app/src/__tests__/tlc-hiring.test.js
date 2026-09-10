// @vitest-environment node
// =============================================================================
// Hire through the TLC app (DR-0350). Darrell 2026-09-10: "need to have the
// ability to hire people for jobs we post so we can hire through the app and
// onboarding goes to the telehealth app we use."
//
// The pure half (statuses, validation mirroring 0191, the pipeline from real
// state, the telehealth hand-off as data, the jobs link) and the migration's
// shape pinned from its text: RLS on both tables, no insert policy on
// applications, owner/admin only on applicants, NULL-safe guards, the anon
// grants ONLY on the two public functions, hire minting the 0187 invite in
// the same transaction, both overlays re-run.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APPLICATION_STATUSES, canMoveApplication, applicationStatus, validateJob, normalizeJob,
  validateApplication, normalizeApplication, hirePipeline, applicationsByStatus,
  TLC_TELEHEALTH, TELEHEALTH_STATUSES, telehealthHandoffMessage, jobsDoorUrl, parseJobsLink, jobSharePayload,
} from '../lib/tlc-hiring.js';
import { isTlcDoorContext } from '../lib/tlc-door.js';
import { TLC_HANDBOOK } from '../lib/tlc-handbook.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIG = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0191-tlc-hiring-jobs-posted-on-the-door-applicants-hired-into-onboarding.sql'), 'utf8');

describe('the stations', () => {
  it('an application moves forward, back to review, or to declined; hired is reached only through hire', () => {
    expect(APPLICATION_STATUSES.map((s) => s.key)).toEqual(['new', 'reviewing', 'interview', 'offered', 'hired', 'declined']);
    expect(canMoveApplication('new', 'reviewing')).toBe(true);
    expect(canMoveApplication('offered', 'hired')).toBe(false);
    expect(canMoveApplication('hired', 'declined')).toBe(false);
    expect(canMoveApplication('declined', 'reviewing')).toBe(true);
    expect(canMoveApplication('nope', 'reviewing')).toBe(false);
    expect(applicationStatus('offered').label).toBe('Offered');
  });
});

describe('validation mirrors 0191 in the same words', () => {
  it('a job needs a title and a summary within bounds; requirements become lines', () => {
    expect(validateJob({ title: 'x', summary: 'short' }).ok).toBe(false);
    const ok = validateJob({ title: 'Telehealth therapist (LCSW / LPC)', summary: 'Part-time caseload, Illinois clients, supervision provided.' });
    expect(ok.ok).toBe(true);
    const row = normalizeJob({ title: ' Telehealth therapist ', summary: 'Part-time caseload, Illinois clients.', requirements: 'Illinois license\n\nTwo years post-graduate\n', status: 'open', modality: 'hybrid' });
    expect(row.requirements).toEqual(['Illinois license', 'Two years post-graduate']);
    expect(row.title).toBe('Telehealth therapist');
    expect(row.modality).toBe('hybrid');
    expect(row.employment_type).toBe('contractor');
    expect(normalizeJob({ title: 't', summary: 's', modality: 'space' }).modality).toBe('telehealth');
  });
  it('an application needs a name, a real email and a statement; years are whole and bounded; a link is a web link', () => {
    const bad = validateApplication({ name: 'A', email: 'nope', statement: 'hi', years_experience: 'x', link: 'ftp://x' });
    expect(bad.ok).toBe(false);
    expect(bad.errors.name).toMatch(/full name/);
    expect(bad.errors.email).toMatch(/not a valid email/);
    expect(bad.errors.statement).toMatch(/20 to 3000/);
    expect(bad.errors.years_experience).toMatch(/whole number/);
    expect(bad.errors.link).toMatch(/http/);
    expect(validateApplication({ name: 'Jane Doe', email: 'Jane@Example.com', statement: 'I am an LCSW in Illinois with six years of telehealth work.', years_experience: '61' }).errors.years_experience).toMatch(/0 and 60/);
    const good = validateApplication({ name: 'Jane Doe', email: 'Jane@Example.com', statement: 'I am an LCSW in Illinois with six years of telehealth work.', years_experience: '6', link: 'https://example.com/jane' });
    expect(good.ok).toBe(true);
    for (const word of ['full name', 'not a valid email', '20 to 3000', 'whole number', '0 and 60']) expect(MIG).toContain(word);
  });
  it('what tlc_apply receives is trimmed text only: no bytes, no health information', () => {
    const a = normalizeApplication({ name: ' Jane ', email: 'JANE@x.io ', phone: ' 555 ', statement: ' s ', years_experience: ' 6 ', link: '' });
    expect(a).toEqual({ name: 'Jane', email: 'jane@x.io', phone: '555', license_type: '', license_state: '', years_experience: '6', statement: 's', availability: '', link: '' });
    for (const k of Object.keys(a)) expect(/diagnos|client|health|record/i.test(k)).toBe(false);
  });
});

describe('the pipeline from real state', () => {
  it('each step is true only from the row and the packet it produced; nothing painted', () => {
    const applied = hirePipeline({ status: 'new', created_at: '2026-09-10T00:00:00Z' });
    expect(applied.map((s) => s.done)).toEqual([true, false, false, false, false]);
    const hired = hirePipeline({ status: 'hired', invite_id: 'inv', hired_at: 'h', telehealth_status: 'invited' }, { status: 'submitted', submitted_at: 's' });
    expect(hired.map((s) => s.done)).toEqual([true, true, true, false, false]);
    expect(hired[3].label).toBe('Packet submitted');
    expect(hired[4].label).toBe('Invited to the platform');
    const done = hirePipeline({ status: 'hired', invite_id: 'inv', telehealth_status: 'active' }, { status: 'approved' });
    expect(done.every((s) => s.done)).toBe(true);
    expect(hirePipeline({ status: 'hired' })[2].done, 'hired without an invite is not "invite sent"').toBe(false);
  });
  it('groups applications by station in station order', () => {
    const g = applicationsByStatus([{ status: 'new' }, { status: 'hired' }, {}]);
    expect(g[0].rows.length).toBe(2);
    expect(g.find((x) => x.key === 'hired').rows.length).toBe(1);
  });
});

describe('the telehealth hand-off is recorded, not pretended', () => {
  it('names the platform the handbook names, flags it for Christina, and lists the steps the office does there', () => {
    expect(TLC_TELEHEALTH.name).toBe('SimplePractice');
    expect(JSON.stringify(TLC_HANDBOOK)).toContain('SimplePractice');
    expect(TLC_TELEHEALTH.confirm).toBe(true);
    expect(TLC_TELEHEALTH.steps.length).toBeGreaterThanOrEqual(3);
    expect(TLC_TELEHEALTH.steps.join(' ')).toMatch(/never holds one/);
    expect(TELEHEALTH_STATUSES.map((s) => s.key)).toEqual(['not-started', 'invited', 'active']);
  });
  it('the message to the hire names the platform and says the app never asks for a password', () => {
    const m = telehealthHandoffMessage({ name: 'Jane' });
    expect(m).toMatch(/^Jane, welcome to TLC Therapy Solutions\./);
    expect(m).toContain('SimplePractice');
    expect(m).toMatch(/nobody at TLC will ever ask for it/);
    expect(telehealthHandoffMessage({})).toMatch(/^Welcome, welcome/);
  });
});

describe('the jobs link: the website links the door, the door carries the jobs', () => {
  it('opens the door on Join the team, or on one posting, and routes to the TLC door', () => {
    const url = jobsDoorUrl();
    expect(url).toBe('https://poetech.us/tlc/app/?tlc=1&jobs=1');
    expect(isTlcDoorContext(url.slice(url.indexOf('?')))).toBe(true);
    expect(parseJobsLink('?tlc=1&jobs=1')).toEqual({ jobs: true, jobId: null });
    expect(parseJobsLink(jobsDoorUrl({ jobId: 'abc' }).split('?')[1])).toEqual({ jobs: true, jobId: 'abc' });
    expect(parseJobsLink('?tlc=1')).toEqual({ jobs: false, jobId: null });
    expect(parseJobsLink(null)).toEqual({ jobs: false, jobId: null });
    const p = jobSharePayload({ title: 'Therapist', summary: 'Part-time', modality: 'telehealth' }, { url });
    expect(p.text).toContain('Telehealth · TLC Therapy Solutions is hiring');
    expect(p.url).toBe(url);
  });
});

describe('migration 0191, pinned from its text', () => {
  it('both tables carry RLS; applications have NO insert policy; applicants are read and updated by owner/admin only, NULL-safe', () => {
    expect(MIG).toContain('ALTER TABLE public.tlc_jobs ENABLE ROW LEVEL SECURITY');
    expect(MIG).toContain('ALTER TABLE public.tlc_job_applications ENABLE ROW LEVEL SECURITY');
    expect(MIG).not.toMatch(/CREATE POLICY \S+ ON public\.tlc_job_applications\s+FOR INSERT/);
    const readPolicy = MIG.match(/CREATE POLICY tlc_job_applications_manager_read[\s\S]*?;/)[0];
    expect(readPolicy).toContain("coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin')");
    expect(readPolicy).not.toContain("'member'");
    for (const m of MIG.matchAll(/user_role_in_instance\(instance_id\)[^)]*\)?\s*IN/g)) expect(m[0].startsWith('user_role_in_instance(instance_id), \'\') IN')).toBe(true);
    expect(MIG).not.toMatch(/\buser_role_in_instance\(instance_id\)\s+IN\b/);
  });
  it('anon may call exactly the two public functions: the open jobs and apply', () => {
    const anonGrants = [...MIG.matchAll(/GRANT EXECUTE ON FUNCTION public\.(\w+)\([^)]*\) TO anon, authenticated;/g)].map((m) => m[1]);
    expect(anonGrants.sort()).toEqual(['tlc_apply', 'tlc_public_jobs']);
    expect(MIG).toMatch(/REVOKE ALL ON FUNCTION public\.tlc_application_hire\(uuid, text\) FROM PUBLIC, anon;/);
    expect(MIG).toMatch(/WHERE j\.office_id = office_in AND j\.status = 'open'/);
  });
  it('apply refuses a closed job, a second open application, and a sixth in a day; and writes an audit row', () => {
    expect(MIG).toContain("RAISE EXCEPTION 'that position is not open'");
    expect(MIG).toContain('you have already applied for this position');
    expect(MIG).toContain("interval '1 day') >= 5");
    expect(MIG).toMatch(/'apply', 'tlc_job_application'/);
  });
  it('hire is one transaction: status hired, the 0187 invite minted for that email, its id linked; idempotent', () => {
    const hire = MIG.match(/CREATE OR REPLACE FUNCTION public\.tlc_application_hire[\s\S]*?\$\$;\n/)[0];
    expect(hire).toContain('public.tlc_onboarding_invite(v_app.email');
    expect(hire).toContain("SET status = 'hired', invite_id = (v_invite->>'id')::uuid");
    expect(hire).toContain("'already', true");
    expect(hire).toContain("NOT IN ('owner','admin')");
  });
  it('the update trigger holds who applied and to what fixed, and stamps the telehealth hand-off', () => {
    const trg = MIG.match(/CREATE OR REPLACE FUNCTION public\.tlc_job_applications_guard[\s\S]*?\$\$;/)[0];
    for (const col of ['email', 'name', 'job_id', 'statement', 'instance_id']) expect(trg).toContain(`NEW.${col}`);
    expect(trg).toContain('NEW.telehealth_at := now()');
    expect(MIG).toContain("telehealth_status IN ('not-started','invited','active')");
  });
  it('both overlays re-run, and the schema is reloaded', () => {
    expect(MIG).toContain('SELECT public.apply_assistant_scope_overlay();');
    expect(MIG).toContain('SELECT public.apply_viewer_readonly_overlay();');
    expect(MIG).toContain("NOTIFY pgrst, 'reload schema';");
  });
});
