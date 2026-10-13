// =============================================================================
// Hire through the TLC app — the surfaces, walked (DR-0350). Darrell 2026-09-10:
// "hire people for jobs we post so we can hire through the app and onboarding
// goes to the telehealth app we use."
//
// The door: Join the team lists the open postings from the seam, a bad
// application is refused on the device in the server's words, a good one
// goes through the seam once, and a ?jobs=1 link leads with it. Onboarding:
// Jobs posts through the seam with the office's instance; Applicants shows
// the stations, Hire calls the atomic hire and shows the invite link, the
// telehealth hand-off names the platform and its steps and marks through the
// seam; a member (not owner/admin) never sees the desk.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { validateApplication, normalizeApplication, normalizeJob } from '../lib/tlc-hiring.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sent = { applications: [], jobs: [], reviews: [], hires: [], marks: [], views: [] };
let roleState = { instanceId: 'i1', instanceSlug: 'poe-family', instanceType: 'family', role: 'admin', loaded: true };
const JOBS = [
  { id: 'j1', title: 'Telehealth therapist (LCSW / LPC)', summary: 'Part-time caseload of Illinois clients, supervision provided, faith-integrated on request.', requirements: ['Illinois license', 'Two years post-graduate'], employment_type: 'contractor', modality: 'telehealth', location: 'Illinois', pay_note: 'Per session', status: 'open', posted_at: '2026-09-10T00:00:00Z', created_at: '2026-09-10T00:00:00Z' },
  { id: 'j2', title: 'Intake coordinator', summary: 'Answer inquiries, schedule consults, keep the roster current.', requirements: [], employment_type: 'employee', modality: 'hybrid', status: 'draft', created_at: '2026-09-09T00:00:00Z' },
  { id: 'j3', kind: 'interest', title: 'Tell us which roles interest you', summary: 'No opening posted for what you do? Say which roles fit you and a few sentences about yourself.', requirements: [], employment_type: 'contractor', modality: 'telehealth', status: 'open', posted_at: '2026-09-01T00:00:00Z', created_at: '2026-09-01T00:00:00Z' },
];
const REPORT = { office: 'TLC Therapy Solutions', jobs: [
  { id: 'j1', title: 'Telehealth therapist (LCSW / LPC)', kind: 'posting', status: 'open', views_7d: 12, views_total: 40, applications_total: 2, applications: { offered: 1, hired: 1 } },
  { id: 'j3', title: 'Tell us which roles interest you', kind: 'interest', status: 'open', views_7d: 3, views_total: 5, applications_total: 1, applications: { new: 1 } },
  { id: 'j2', title: 'Intake coordinator', kind: 'posting', status: 'draft', views_7d: 0, views_total: 0, applications_total: 0, applications: {} },
], roles: [{ role: 'therapist', interested: 2 }, { role: 'aispecialist', interested: 1 }], as_of: '2026-09-10T16:00:00Z' };
let applications = [
  { id: 'a1', job_id: 'j1', name: 'Jane Doe', email: 'jane@example.com', phone: '555', license_type: 'LCSW', license_state: 'IL', years_experience: 6, statement: 'Six years of telehealth work with adults and couples.', availability: 'Tue–Thu', link: 'https://example.com/jane', interest_roles: ['therapist', 'supervisor'], status: 'offered', telehealth_status: 'not-started', created_at: '2026-09-08T00:00:00Z' },
  { id: 'a2', job_id: 'j1', name: 'Sam Roe', email: 'sam@example.com', statement: 'New LSW, eager to learn under supervision and grow.', status: 'hired', invite_id: 'inv7', hired_at: '2026-09-09T00:00:00Z', telehealth_status: 'invited', telehealth_at: '2026-09-10T00:00:00Z', created_at: '2026-09-07T00:00:00Z' },
];

vi.mock('../lib/instance-role.js', async (orig) => {
  const real = await orig();
  return { ...real, useInstanceRole: () => roleState, fetchInstanceRole: async () => roleState, useOfficeInstanceRole: () => roleState, fetchOfficeInstanceRole: async () => roleState };
});
vi.mock('../lib/tlc-hiring-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    listPublicJobs: async () => ({ ok: true, jobs: JOBS.filter((j) => j.status === 'open') }),
    applyToJob: async (jobId, applicant, _office, opts = {}) => { const v = validateApplication(applicant, opts); if (!v.ok) return { ok: false, reason: 'invalid', message: Object.values(v.errors)[0], errors: v.errors }; sent.applications.push({ jobId, applicant: normalizeApplication(applicant) }); return { ok: true, receipt: { id: 'app9', job_title: JOBS.find((j) => j.id === jobId).title, received_at: '2026-09-10T15:00:00Z' } }; },
    listJobs: async () => ({ ok: true, jobs: JOBS }),
    recordJobView: async (jobId) => { sent.views.push(jobId); return { ok: true, data: { counted: true } }; },
    hiringReport: async () => ({ ok: true, report: REPORT }),
    saveJob: async (job, opts) => { sent.jobs.push({ job: normalizeJob(job), opts }); return { ok: true, job: { ...normalizeJob(job), id: job.id || 'j3' } }; },
    deleteJob: async () => ({ ok: true }),
    listApplications: async () => ({ ok: true, applications }),
    reviewApplication: async (app, status) => { sent.reviews.push({ id: app.id, status }); applications = applications.map((a) => (a.id === app.id ? { ...a, status } : a)); return { ok: true, application: { ...app, status } }; },
    hireApplicant: async (app) => { sent.hires.push(app.id); applications = applications.map((a) => (a.id === app.id ? { ...a, status: 'hired', invite_id: 'inv9', hired_at: '2026-09-10T15:00:00Z' } : a)); return { ok: true, hire: { id: app.id, already: false, invite_id: 'inv9', token: 'tok9', email: app.email, expires_at: '2026-10-10T00:00:00Z' } }; },
    markTelehealth: async (app, status) => { sent.marks.push({ id: app.id, status }); applications = applications.map((a) => (a.id === app.id ? { ...a, telehealth_status: status, telehealth_at: '2026-09-10T15:00:00Z' } : a)); return { ok: true, application: { ...app, telehealth_status: status } }; },
  };
});
vi.mock('../lib/tlc-onboarding-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    listOffice: async () => ({ ok: true, officeName: 'TLC Therapy Solutions', manager: true, invites: [], packets: [{ packet_id: 'p7', invite_id: 'inv7', email: 'sam@example.com', status: 'approved', applicant_name: 'Sam Roe', submitted_at: '2026-09-09T12:00:00Z', updated_at: '2026-09-09T12:00:00Z' }] }),
    myPacketStatus: async () => ({ ok: true, status: null }),
  };
});
vi.mock('../lib/tlc-roster.js', async (orig) => {
  const real = await orig();
  const { TLC_TEAM: seed } = await import('../lib/tlc-practice.js');
  return { ...real, useTlcRoster: () => seed, listRoster: async () => ({ ok: true, rows: [] }) };
});

let container, root;
async function mount(el) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(el); }); }
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });
const byText = (re, tag = 'button') => [...container.querySelectorAll(tag)].find((b) => re.test(b.textContent));
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (el, value) => act(async () => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
const inputByLabel = (re) => { const l = [...container.querySelectorAll('label')].find((x) => re.test(x.textContent)); return l && l.querySelector('input, textarea, select'); };
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = container = null;
  sent.applications.length = 0; sent.jobs.length = 0; sent.reviews.length = 0; sent.hires.length = 0; sent.marks.length = 0; sent.views.length = 0;
  roleState = { instanceId: 'i1', instanceSlug: 'poe-family', instanceType: 'family', role: 'admin', loaded: true };
  window.history.replaceState(null, '', '/');
});

describe('the door: Join the team', () => {
  it('lists the OPEN postings from the seam (never a draft), refuses a bad application on the device in the server’s words, and sends a good one through the seam once', async () => {
    const { default: TlcPublicDoor } = await import('../components/TlcPublicDoor.jsx');
    await mount(createElement(TlcPublicDoor));
    await settle();
    // the door leads with the clinical team; Join the team is its own tab on the visitor's slider
    expect(container.textContent).toContain('Match a Preferred Provider');
    const tabs = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC door sections"] [role="tab"]'));
    expect(tabs.map((t) => t.textContent.trim())).toEqual(['Find your therapist', 'Mental skills', 'Join the team']);
    await click(tabs[2]);
    await settle();
    const text = container.textContent;
    expect(text).toContain('Open positions');
    expect(text).toContain('Telehealth therapist (LCSW / LPC)');
    expect(text).not.toContain('Intake coordinator');
    expect(text).toContain('Illinois license');
    expect(text).toContain('Not seeing your role?'); // the standing interest card (0195)
    expect(sent.views).toEqual([]); // nothing counted until a posting is opened
    await click(byText(/^Apply$/));
    await settle();
    expect(sent.views).toEqual(['j1']);
    await click(byText(/Send application/));
    await settle();
    expect(container.textContent).toContain('Please give your full name.');
    expect(sent.applications.length).toBe(0);
    await type(inputByLabel(/Full name/), 'Jane Doe');
    await type(inputByLabel(/^Email/), 'Jane@Example.com');
    await type(inputByLabel(/License \(e/), 'LCSW');
    await type(inputByLabel(/Years of experience/), '6');
    await type(inputByLabel(/About you/), 'Six years of telehealth work with adults and couples in Illinois.');
    await click(byText(/Send application/));
    await settle();
    expect(sent.applications.length).toBe(1);
    expect(sent.applications[0].jobId).toBe('j1');
    expect(sent.applications[0].applicant.email).toBe('jane@example.com');
    expect(sent.applications[0].applicant.license_type).toBe('LCSW');
    expect(container.textContent).toContain('Received. Thank you, Jane Doe.');
    expect(container.textContent).toContain('We will reach you at jane@example.com');
    // closed and reopened: still one view for this mount
    expect(sent.views).toEqual(['j1']);
  });
  it('a ?jobs=1 link (the website’s careers link) leads the door with Join the team, on one posting when asked', async () => {
    window.history.replaceState(null, '', '/?tlc=1&jobs=1&job=j1');
    const { default: TlcPublicDoor } = await import('../components/TlcPublicDoor.jsx');
    await mount(createElement(TlcPublicDoor));
    await settle();
    const jobsTab = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC door sections"] [role="tab"]')).find((t) => /Join the team/.test(t.textContent));
    expect(jobsTab.getAttribute('aria-selected')).toBe('true');
    expect(container.textContent).toContain('Open positions');
    // the asked-for posting opens its Apply form straight away, and counts its view
    expect(container.querySelector('form[aria-label="Apply for Telehealth therapist (LCSW / LPC)"]')).toBeTruthy();
    expect(sent.views).toEqual(['j1']);
  });
  it('the interest card (Darrell: "HOW DOES ONE JOIN THE TEAM"): roles from the chart, at least one required, sent with the note; the honeypot is hidden and untabbable; an ?interest=1 link opens the form', async () => {
    window.history.replaceState(null, '', '/?tlc=1&jobs=1&interest=1');
    const { default: TlcPublicDoor } = await import('../components/TlcPublicDoor.jsx');
    await mount(createElement(TlcPublicDoor));
    await settle();
    const form = container.querySelector('form[aria-label="Tell us which roles interest you"]');
    expect(form, 'the interest form did not open from its link').toBeTruthy();
    expect(sent.views).toEqual(['j3']);
    // the honeypot: present, hidden, never in the tab order, never announced
    const trap = form.querySelector('input[name="website"]');
    expect(trap.getAttribute('tabindex')).toBe('-1');
    expect(trap.closest('[aria-hidden="true"]').classList.contains('hidden')).toBe(true);
    // the roles: every hireable seat and office template, none of the owner
    const boxes = [...form.querySelectorAll('input[type="checkbox"]')];
    const labels = boxes.map((b) => b.closest('label').textContent.trim());
    expect(labels).toContain('Therapist (independent contractor)');
    expect(labels).toContain('AI & Systems Specialist');
    expect(labels).toContain('Operations Manager');
    expect(labels.some((l) => /Owner/.test(l))).toBe(false);
    await type(inputByLabel(/Full name/), 'Sam Seeker');
    await type(inputByLabel(/^Email/), 'sam@example.com');
    await type(inputByLabel(/About you/), 'I would love to be part of the team in whatever role fits my license.');
    await click(byText(/Send my interest/));
    await settle();
    expect(container.textContent).toContain('Choose at least one role you are interested in.');
    expect(sent.applications.length).toBe(0);
    await click(boxes[labels.indexOf('Therapist (independent contractor)')]);
    await click(boxes[labels.indexOf('AI & Systems Specialist')]);
    await click(byText(/Send my interest/));
    await settle();
    expect(sent.applications.length).toBe(1);
    expect(sent.applications[0].jobId).toBe('j3');
    expect(sent.applications[0].applicant.interest_roles).toEqual(['therapist', 'aispecialist']);
    expect(sent.applications[0].applicant.website).toBe('');
    expect(container.textContent).toContain('Your interest in Therapist (independent contractor), AI & Systems Specialist is with the office.');
  });
});

describe('Onboarding: the hiring report (Darrell: "how many people look at this role vs this one... data driven reporting")', () => {
  it('reads views (seven days, all time) and applications by station per posting, and the roles people named, from the seam; the applicant card shows the roles', async () => {
    const { default: TlcOnboarding } = await import('../components/TlcOnboarding.jsx');
    await mount(createElement(TlcOnboarding));
    await settle();
    const tabs = [...container.querySelectorAll('[role="tablist"][aria-label="Onboarding areas"] [role="tab"]')].map((t) => t.textContent.trim());
    expect(tabs).toContain('Hiring report');
    await click(byText(/^Hiring report$/));
    await settle();
    const report = container.querySelector('[aria-label="Hiring report"]');
    expect(report).toBeTruthy();
    const rows = [...report.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()));
    expect(rows).toEqual([
      ['Telehealth therapist (LCSW / LPC)', 'open', '12', '40', '2', 'Offered 1 · Hired 1'],
      ['Tell us which roles interest youinterest form', 'open', '3', '5', '1', 'New 1'],
      ['Intake coordinator', 'draft', '0', '0', '0', '—'],
    ]);
    const roles = [...report.querySelectorAll('[aria-label="Roles of interest, counted"] li')].map((li) => li.textContent.trim());
    expect(roles).toEqual(['Therapist (independent contractor) · 2', 'AI & Systems Specialist · 1']);
    expect(report.textContent).toContain('no one identified');
    await click(byText(/^Applicants$/));
    await settle();
    const jane = [...container.querySelectorAll('li')].find((li) => /Jane Doe/.test(li.textContent) && li.querySelector('[aria-label="Hiring pipeline"]'));
    await click([...jane.querySelectorAll('button')].find((b) => /^Read$/.test(b.textContent)));
    await settle();
    expect(jane.textContent).toContain('Interested in: Therapist (independent contractor), Clinical Supervisor (LCSW)');
  });
});

describe('Onboarding: Jobs and Applicants (owner/admin)', () => {
  it('posts a job through the seam with the office’s instance, opens and closes it', async () => {
    const { default: TlcOnboarding } = await import('../components/TlcOnboarding.jsx');
    await mount(createElement(TlcOnboarding));
    await settle();
    await click(byText(/^Jobs$/));
    await settle();
    expect(container.textContent).toContain('Postings');
    expect(container.textContent).toContain('Intake coordinator');
    await click(byText(/New posting/));
    await settle();
    // start from a seat (Darrell: "How do we create the openings for the specific roles when needed?")
    await type(container.querySelector('select[aria-label="Start from a seat"]'), 'therapist');
    expect(inputByLabel(/^Title/).value).toBe('Therapist (independent contractor)');
    expect(inputByLabel(/Requirements/).value).toMatch(/Work the inquiries/);
    // and a role beyond the chart (Darrell: "What about other roles like manager or AI specialist")
    await type(container.querySelector('select[aria-label="Start from a seat"]'), 'ai-specialist');
    expect(inputByLabel(/^Title/).value).toBe('AI & Systems Specialist');
    expect(inputByLabel(/Engagement/).value).toBe('contractor');
    await type(inputByLabel(/^Title/), 'Group facilitator');
    await type(inputByLabel(/^Summary/), 'Run two psychoeducational groups a week.');
    await type(inputByLabel(/Requirements/), 'Illinois license\nGroup experience');
    await click(byText(/Post it \(open\)/));
    await settle();
    expect(sent.jobs.length).toBe(1);
    expect(sent.jobs[0].opts.instanceId).toBe('i1');
    expect(sent.jobs[0].job.status).toBe('open');
    expect(sent.jobs[0].job.requirements).toEqual(['Illinois license', 'Group experience']);
    // close the open one
    await click([...container.querySelectorAll('button')].find((b) => /^Close$/.test(b.textContent)));
    await settle();
    expect(sent.jobs[1].job.status).toBe('closed');
    expect(sent.jobs[1].job.id).toBe('j1');
  });
  it('shows applicants by station with the pipeline from real state; Hire calls the atomic hire and shows the invite link; the telehealth hand-off names the platform, its steps, the message, and marks through the seam', async () => {
    const { default: TlcOnboarding } = await import('../components/TlcOnboarding.jsx');
    await mount(createElement(TlcOnboarding));
    await settle();
    await click(byText(/^Applicants$/));
    await settle();
    let text = container.textContent;
    expect(text).toContain('Offered · 1');
    expect(text).toContain('Hired · 1');
    expect(text).toContain('Jane Doe');
    // Sam: hired, packet approved (joined by invite id), invited to the platform
    const sam = [...container.querySelectorAll('li')].find((li) => /Sam Roe/.test(li.textContent) && li.querySelector('[aria-label="Hiring pipeline"]'));
    const steps = [...sam.querySelectorAll('[aria-label="Hiring pipeline"] li')].map((x) => x.textContent);
    expect(steps.some((s) => /✓ Hired · invite sent/.test(s))).toBe(true);
    expect(steps.some((s) => /✓ Packet approved/.test(s))).toBe(true);
    expect(steps.some((s) => /○ Invited to the platform/.test(s))).toBe(true);
    expect(sam.textContent).toContain('Hand-off to SimplePractice');
    expect(sam.textContent).toContain('never holds one');
    expect(sam.textContent).toContain('Sam, welcome to TLC Therapy Solutions.');
    await click([...sam.querySelectorAll('button')].find((b) => /Mark active on SimplePractice/.test(b.textContent)));
    await settle();
    expect(sent.marks).toEqual([{ id: 'a2', status: 'active' }]);
    // Jane: hire
    const jane = [...container.querySelectorAll('li')].find((li) => /Jane Doe/.test(li.textContent) && li.querySelector('[aria-label="Hiring pipeline"]'));
    await click([...jane.querySelectorAll('button')].find((b) => /Hire · open onboarding/.test(b.textContent)));
    await settle();
    expect(sent.hires).toEqual(['a1']);
    text = container.textContent;
    expect(text).toContain('onboarding invite ready for jane@example.com');
    expect(text).toContain('/tlc/app/?tlc=1&onboard=tok9');
    expect(text).toContain('Hired · 2');
  });
  it('a member (not owner/admin) never sees the hiring desk', async () => {
    roleState = { ...roleState, role: 'member' };
    const { default: TlcOnboarding } = await import('../components/TlcOnboarding.jsx');
    await mount(createElement(TlcOnboarding));
    await settle();
    expect(container.textContent).not.toContain('Applicants');
    expect(container.textContent).not.toContain('Postings');
  });
});
