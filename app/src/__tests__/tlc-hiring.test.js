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
  TLC_TELEHEALTH, TELEHEALTH_STATUSES, telehealthHandoffMessage, jobsDoorUrl, parseJobsLink, jobSharePayload, JOB_TEMPLATES, jobTemplate,
  JOB_KINDS, isInterestCard, INTEREST_ROLE_OPTIONS, interestRoleLabel, normalizeInterestRoles, reportRows, reportRoles,
} from '../lib/tlc-hiring.js';
import { TLC_POSITIONS } from '../lib/tlc-governance.js';
import { isTlcDoorContext } from '../lib/tlc-door.js';
import { TLC_HANDBOOK } from '../lib/tlc-handbook.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIG = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0191-tlc-hiring-jobs-posted-on-the-door-applicants-hired-into-onboarding.sql'), 'utf8');
const FIX = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0192-tlc-hiring-audit-actions-within-the-allow-list-the-smoke-caught-it.sql'), 'utf8');
const SCHEMA_AUDIT = readFileSync(join(here, '../../../infra/supabase/schema-v2.10-ai-workflow-state.sql'), 'utf8');
const LEG = readFileSync(join(here, '../../../.github/workflows/rls-isolation.yml'), 'utf8');
const M195 = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0195-join-the-team-the-interest-form-roles-of-interest-and-who-looks-at-what.sql'), 'utf8');
const SMOKE195 = readFileSync(join(here, '../../../infra/supabase/tests/0195-tlc-interest-and-views-smoke.sql'), 'utf8');

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
    expect(a).toEqual({ name: 'Jane', email: 'jane@x.io', phone: '555', license_type: '', license_state: '', years_experience: '6', statement: 's', availability: '', link: '', website: '', interest_roles: [] });
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
    expect(parseJobsLink('?tlc=1&jobs=1')).toEqual({ jobs: true, jobId: null, interest: false });
    expect(parseJobsLink(jobsDoorUrl({ jobId: 'abc' }).split('?')[1])).toEqual({ jobs: true, jobId: 'abc', interest: false });
    expect(parseJobsLink('?tlc=1')).toEqual({ jobs: false, jobId: null, interest: false });
    expect(parseJobsLink(null)).toEqual({ jobs: false, jobId: null, interest: false });
    // the interest form has its own link (0195)
    expect(jobsDoorUrl({ interest: true })).toBe('https://poetech.us/tlc/app/?tlc=1&jobs=1&interest=1');
    expect(parseJobsLink('?tlc=1&jobs=1&interest=1')).toEqual({ jobs: true, jobId: null, interest: true });
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

describe('posting templates for the roles beyond the clinical chart (Darrell: "What about other roles like manager or AI specialist")', () => {
  it('each template is a valid posting as it stands, names its engagement and modality, and can be fetched by key', () => {
    expect(JOB_TEMPLATES.map((t) => t.key)).toEqual(['operations-manager', 'ai-specialist', 'intake-coordinator', 'billing-credentialing', 'product-support', 'app-developer', 'curriculum-content']);
    for (const t of JOB_TEMPLATES) {
      expect(validateJob(t).ok, t.key).toBe(true);
      expect(normalizeJob({ ...t, requirements: t.requirements }).requirements.length).toBeGreaterThan(0);
    }
    expect(jobTemplate('ai-specialist').title).toBe('AI & Systems Specialist');
    expect(jobTemplate('ai-specialist').summary).toMatch(/client information walled off/);
    expect(jobTemplate('nope')).toBeNull();
  });
});

describe('0192 — the audit actions within the allow-list (rls-isolation run 130 caught 0191 writing "apply" and "hire")', () => {
  const allowList = SCHEMA_AUDIT.match(/ADD CONSTRAINT audit_log_action_check[\s\S]*?\)\);/)[0];
  const allowed = [...allowList.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  it('0191 wrote two actions the allow-list does not hold — the bug the smoke caught', () => {
    expect(allowed).toContain('create');
    expect(allowed).not.toContain('apply');
    expect(allowed).not.toContain('hire');
    expect(MIG).toMatch(/'apply', 'tlc_job_application'/);
    expect(MIG).toMatch(/'hire', 'tlc_job_application'/);
  });
  it('0192 redefines both functions with allow-listed actions only, keeps every guard, and follows 0191 in the tlc-office leg', () => {
    const actions = [...FIX.matchAll(/INSERT INTO audit_log[\s\S]*?VALUES \([^,]+, [^,]+, '([a-z-]+)'/g)].map((m) => m[1]);
    expect(actions).toEqual(['create', 'status-change']);
    for (const a of actions) expect(allowed, a).toContain(a);
    expect(FIX).toContain('CREATE OR REPLACE FUNCTION public.tlc_apply(office_in text, job_id_in uuid, applicant_in jsonb)');
    expect(FIX).toContain('CREATE OR REPLACE FUNCTION public.tlc_application_hire(application_id_in uuid, note_in text DEFAULT NULL)');
    for (const guard of ["'that position is not open'", 'you have already applied for this position', "interval '1 day') >= 5", "NOT IN ('owner','admin')", 'public.tlc_onboarding_invite(v_app.email', "'already', true"]) expect(FIX).toContain(guard);
    expect(FIX).toMatch(/GRANT EXECUTE ON FUNCTION public\.tlc_apply\(text, uuid, jsonb\) TO anon, authenticated;/);
    expect(FIX).toMatch(/REVOKE ALL ON FUNCTION public\.tlc_application_hire\(uuid, text\) FROM PUBLIC, anon;/);
    expect(LEG).toMatch(/0191-tlc-hiring-jobs[^"\n]*\.sql 0192-tlc-hiring-audit-actions-within-the-allow-list-the-smoke-caught-it\.sql 0193-[^"\n]*\.sql 0194-[^"\n]*\.sql 0195-join-the-team[^"\n]*\.sql"/);
  });
});


describe('0195 — join the team: the interest form, roles of interest, the honeypot, who looks at what, the report (Darrell: "HOW DOES ONE JOIN THE TEAM" / "data driven reporting")', () => {
  it('a posting has a kind; the interest card is the standing one; the roles a person may name come from the chart\u2019s hireable seats and the office templates', () => {
    expect(JOB_KINDS).toEqual(['posting', 'interest']);
    expect(isInterestCard({ kind: 'interest' })).toBe(true);
    expect(isInterestCard({ kind: 'posting' })).toBe(false);
    expect(isInterestCard(null)).toBe(false);
    const keys = INTEREST_ROLE_OPTIONS.map((o) => o.key);
    for (const k of ['supervisor', 'therapist', 'trainee', 'assistant', 'aispecialist']) expect(keys).toContain(k);
    for (const t of JOB_TEMPLATES) if (t.key !== 'ai-specialist') expect(keys).toContain(t.key);
    expect(keys).not.toContain('ai-specialist'); // the seat carries it, not twice
    expect(keys).not.toContain('owner');
    expect(new Set(keys).size).toBe(keys.length);
    expect(interestRoleLabel('therapist')).toBe(TLC_POSITIONS.find((p) => p.key === 'therapist').title);
    expect(interestRoleLabel('nope')).toBe('nope');
  });
  it('roles of interest normalize (trimmed, deduplicated, at most 40 chars each) and an interest card needs at least one, at most twelve', () => {
    expect(normalizeInterestRoles([' therapist ', 'therapist', '', 'aispecialist'])).toEqual(['therapist', 'aispecialist']);
    expect(normalizeInterestRoles('therapist, trainee')).toEqual(['therapist', 'trainee']);
    expect(normalizeInterestRoles(null)).toEqual([]);
    const base = { name: 'Sam Seeker', email: 'sam@example.com', statement: 'I would love to be part of the team in whatever role fits.' };
    expect(validateApplication(base).ok).toBe(true); // a posting needs no role
    const none = validateApplication(base, { kind: 'interest' });
    expect(none.ok).toBe(false);
    expect(none.errors.interest_roles).toBe('Choose at least one role you are interested in.');
    expect(validateApplication({ ...base, interest_roles: ['therapist'] }, { kind: 'interest' }).ok).toBe(true);
    const many = validateApplication({ ...base, interest_roles: Array.from({ length: 13 }, (_, i) => `r${i}`) });
    expect(many.errors.interest_roles).toBe('Choose at most 12 roles.');
    expect(normalizeApplication({ ...base, interest_roles: ['therapist', 'therapist'], website: ' http://spam ' }).interest_roles).toEqual(['therapist']);
    expect(normalizeApplication({ ...base, website: 'x' }).website).toBe('x'); // passed through so the server can refuse it
  });
  it('the migration: kind on the posting, roles pinned by the guard, the honeypot refused before any lookup, views counted only for an open posting, the report for owner/admin, the standing card seeded on the office instance', () => {
    expect(M195).toContain("ADD CONSTRAINT tlc_jobs_kind_check CHECK (kind IN ('posting','interest'))");
    expect(M195).toContain('NEW.interest_roles := OLD.interest_roles;');
    expect(M195).toMatch(/IF coalesce\(applicant_in->>'website', ''\) <> '' THEN\s+RAISE EXCEPTION 'application refused';/);
    expect(M195.indexOf("'application refused'")).toBeLessThan(M195.indexOf('SELECT * INTO v_job FROM public.tlc_jobs WHERE id = job_id_in'));
    expect(M195).toContain("IF v_job.kind = 'interest' AND jsonb_array_length(v_roles) = 0 THEN");
    expect(M195).toContain("IF jsonb_array_length(v_roles) > 12 THEN RAISE EXCEPTION 'choose at most 12 roles'; END IF;");
    expect(M195).toContain('CREATE TABLE IF NOT EXISTS public.tlc_job_views');
    expect(M195).toContain('UNIQUE (job_id, day)');
    expect(M195).toMatch(/tlc_job_viewed[\s\S]*status = 'open';[\s\S]*IF v_job\.id IS NULL THEN RETURN jsonb_build_object\('counted', false\); END IF;/);
    expect(M195).toMatch(/CREATE POLICY tlc_job_views_staff_read[\s\S]*coalesce\(public\.user_role_in_instance\(instance_id\), ''\) IN \('owner','admin','member'\)/);
    expect(M195).not.toMatch(/CREATE POLICY tlc_job_views_\w+_(insert|update|delete)/); // only the RPC writes
    expect(M195).toContain("NOT IN ('owner','admin') THEN\n    RAISE EXCEPTION 'only the office owner or admin reads the hiring report';");
    expect(M195).toContain("REVOKE ALL ON FUNCTION public.tlc_hiring_report() FROM PUBLIC, anon;");
    expect(M195).toMatch(/INSERT INTO public\.tlc_jobs \(instance_id, office_id, kind, title[\s\S]*WHERE i\.slug = 'tlc-therapy-solutions'[\s\S]*AND NOT EXISTS \(SELECT 1 FROM public\.tlc_jobs j WHERE j\.instance_id = i\.id AND j\.kind = 'interest'\)/);
    // the audit action stays on the allow-list (0192's lesson)
    const actions = [...M195.matchAll(/INSERT INTO audit_log[\s\S]*?VALUES \([^,]+, [^,]+, '([a-z-]+)'/g)].map((m) => m[1]);
    expect(actions).toEqual(['create']);
    expect(M195).toMatch(/SELECT public\.apply_assistant_scope_overlay\(\);\s*SELECT public\.apply_viewer_readonly_overlay\(\);/);
    // the smoke rides the leg and proves each rung
    expect(LEG).toMatch(/smokes: "[^"\n]*0195-tlc-interest-and-views-smoke\.sql[^"\n]*"/);
    for (const rung of ['hidden field filled', 'thirteen roles', 'a draft posting counted a view', 'anon wrote a view row directly', 'a member read the hiring report', 'interest cards, expected 1', 'expected deduplicated and sorted']) expect(SMOKE195, rung).toContain(rung);
  });
  it('the report rows and roles are numbers from the database, labeled from the chart', () => {
    const report = { jobs: [
      { id: 'j1', title: 'Telehealth therapist', kind: 'posting', status: 'open', views_7d: '3', views_total: 9, applications_total: 2, applications: { new: 1, hired: 1 } },
      { id: 'j2', title: 'Tell us which roles interest you', kind: 'interest', status: 'open', views_7d: 1, views_total: 1, applications_total: 1, applications: { reviewing: 1 } },
    ], roles: [{ role: 'therapist', interested: 2 }, { role: 'aispecialist', interested: '1' }] };
    const rows = reportRows(report);
    expect(rows.map((r) => [r.id, r.kind, r.views7d, r.viewsTotal, r.applications])).toEqual([['j1', 'posting', 3, 9, 2], ['j2', 'interest', 1, 1, 1]]);
    expect(rows[0].byStation.map((s) => `${s.label} ${s.n}`)).toEqual(['New 1', 'Hired 1']);
    expect(reportRoles(report)).toEqual([
      { key: 'therapist', label: interestRoleLabel('therapist'), interested: 2 },
      { key: 'aispecialist', label: interestRoleLabel('aispecialist'), interested: 1 },
    ]);
    expect(reportRows(null)).toEqual([]);
    expect(reportRoles({})).toEqual([]);
    expect(jobSharePayload({ kind: 'interest', title: 'Tell us which roles interest you', summary: 'Say which roles fit you.' }, { url: jobsDoorUrl({ interest: true }) })).toEqual({ title: 'TLC Therapy Solutions: tell us which roles interest you', text: 'Say which roles fit you.', url: 'https://poetech.us/tlc/app/?tlc=1&jobs=1&interest=1' });
  });
});
