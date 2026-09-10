// =============================================================================
// TLC colleague onboarding surfaces (DR-0344): the REAL components, the sync
// seam stubbed. The colleague's form saves through the one write and refuses
// a short submit; Christina's panel mints a link, lists packets, previews the
// public card and approves through the one review call with that card; the
// TLC door swaps to the invite flow on ?onboard= and grows an Onboarding
// section for the office owner; the roster surfaces render live rows in the
// seed format. DR-0076: proven-to-catch — each stub records what was sent.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const sent = { saves: [], reviews: [], invites: [], rosterUpserts: [], launch: [], roles: [], spaceInvites: [] };
let openStatus = 'draft';
let packetStatus = null; // the signed-in person's own packet, if any (null = a client, no packet)
let roleState = { instanceId: 'i1', instanceSlug: 'poe-family', instanceType: 'family', role: 'admin', loaded: true };

const basePacket = () => ({
  firstName: 'Ann', lastName: 'Lee', preferredName: '', phone: '217-555-0100', preferredEmail: 'ann@example.com',
  licenseType: 'LCSW', employmentStatus: 'Independent Contractor', specialties: ['trauma-informed'], bio: 'A short bio.',
  documents: { resume: { path: 'u1/p1/resume-cv.pdf', fileName: 'cv.pdf' } },
  acknowledgments: { policies: { agreed: true, signature: 'Ann Lee', signedOn: '2026-09-10' }, confidentiality: { agreed: true, signature: 'Ann Lee', signedOn: '2026-09-10' }, contractorAgreement: { agreed: false, signature: '', signedOn: '' } },
  availability: { Monday: ['7 am - 8 am'] },
});
const view = (over = {}) => ({ packet_id: 'p1', invite_id: 'inv1', office_name: 'TLC Therapy Solutions', email: 'ann@example.com', status: openStatus, packet: basePacket(), headshot_thumb: null, submitted_at: null, banking: { bank_name: 'Busey', account_type: 'checking', routing_last4: '2568', account_last4: '8025' }, ...over });

vi.mock('../lib/tlc-onboarding-sync.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    myPacketStatus: async () => ({ ok: true, status: packetStatus }),
    openPacket: async (token) => (token === 'good' ? { ok: true, view: view() } : { ok: false, reason: 'unknown', message: real.openMessage('unknown') }),
    savePacket: async (args) => { sent.saves.push(args); if (args.submit) return { ok: true, submitted: true, missing: [], view: view({ status: 'submitted', submitted_at: '2026-09-10T12:00:00Z' }) }; return { ok: true, submitted: false, missing: [], view: view() }; },
    uploadDocument: async () => ({ ok: true, pointer: { path: 'u1/p1/w9-w9.pdf', fileName: 'w9.pdf' } }),
    signedDocumentUrl: async () => 'https://signed.example/x',
    withdrawPacket: async () => ({ ok: true, removed: true }),
    mintInvite: async (email, note) => { sent.invites.push({ email, note }); return { ok: true, invite: { id: 'inv9', token: 'tok9', email, expires_at: '2026-10-10T00:00:00Z' } }; },
    revokeInvite: async () => ({ ok: true }),
    listOffice: async () => ({ ok: true, officeName: 'TLC Therapy Solutions', manager: true, invites: [{ id: 'inv2', email: 'new@example.com', note: 'LSW', token: 'tok2', created_at: '2026-09-09', expires_at: '2026-10-09', opened: false }], packets: [{ packet_id: 'p1', invite_id: 'inv1', email: 'ann@example.com', status: 'submitted', applicant_name: 'Ann Lee', license_type: 'LCSW', submitted_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z' }] }),
    readPacket: async () => ({ ok: true, view: view({ status: 'submitted', submitted_at: '2026-09-10T12:00:00Z', headshot_thumb: 'data:image/jpeg;base64,zz' }) }),
    readBanking: async () => ({ ok: true, banking: { present: true, bank_name: 'Busey', account_type: 'checking', routing_number: '071102568', account_number: '13198025', updated_at: '2026-09-10' } }),
    reviewPacket: async (id, decision, note, card) => { sent.reviews.push({ id, decision, note, card }); return { ok: true, clinicianCreated: true, view: view({ status: 'approved', roster: { id: 'r1' } }) }; },
    deletePacket: async () => ({ ok: true, removed: true }),
  };
});
vi.mock('../lib/tlc-roster.js', async (orig) => {
  const real = await orig();
  const { TLC_TEAM: seed } = await import('../lib/tlc-practice.js');
  return {
    ...real,
    fetchPublicRoster: async () => [{ id: 'r1', name: 'Brand New, LSW', role: 'Specialist', specialty: 'Trauma-Informed Care', url: null, photo: null }],
    listRoster: async () => ({ ok: true, rows: [{ id: 'r1', name: 'Brand New, LSW', role: 'Specialist', specialty: 'Trauma-Informed Care', url: null, photo: null, bio: '', published: true, sort_order: 100 }] }),
    upsertRosterCard: async (c) => { sent.rosterUpserts.push(c); return { ok: true, row: c }; },
    removeRosterCard: async () => ({ ok: true, removed: true }),
    useTlcRoster: () => real.mergeRoster(seed, [{ id: 'r1', name: 'Brand New, LSW', role: 'Specialist', specialty: 'Trauma-Informed Care', url: null, photo: null }]),
  };
});
vi.mock('../lib/tlc-assignments.js', async (orig) => ({ ...(await orig()), listMyAssignments: async () => ({ ok: true, rows: [] }), listAssignedToMe: async () => ({ ok: true, rows: [] }) }));
vi.mock('../lib/tlc-office-data.js', async (orig) => {
  const real = await orig();
  return { ...real, useTlcOfficeData: () => ({ inquiries: [{ id: 'inq-1', firstName: 'Maya R.', contactMethod: 'phone', phone: '217', status: 'new', receivedAt: '2026-09-01T00:00:00Z', statusHistory: [], interestArea: 'individual', source: 'church' }], practiceLeads: [], loaded: true, signedIn: true }), startTlcOfficeData: async () => ({}) };
});
vi.mock('../lib/tlc-launch-sync.js', async (orig) => {
  const real = await orig();
  return { ...real, loadLaunchStatuses: async () => ({ ok: true, statuses: {} }), setLaunchStatus: async (key, status) => { sent.launch.push({ key, status }); return { ok: true }; } };
});
vi.mock('../lib/member-roles.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    listInstanceMembersStrict: async () => [
      { userId: 'u-owner', displayName: 'Christina Poe', email: 'mrspoe06@gmail.com', role: 'owner', classification: null },
      { userId: 'u-me', displayName: 'Darrell Poe', email: 'christina@tlctherapysolutions.com', role: 'admin', classification: null },
      { userId: 'u-ann', displayName: 'Ann Lee', email: 'ann@example.com', role: 'member', classification: null },
    ],
    setMemberRole: async (instanceId, userId, role) => { sent.roles.push({ instanceId, userId, role }); return { status: 'changed', role }; },
    removeInstanceMember: async () => ({ status: 'removed' }),
    inviteToSpace: async (instanceType, email, role, instanceId) => { sent.spaceInvites.push({ instanceType, email, role, instanceId }); return { ok: true, kind: 'instance', email, role, link: 'https://poetech.us/?join=tok-gov' }; },
  };
});
vi.mock('../lib/instance-role.js', async (orig) => {
  const real = await orig();
  return { ...real, useInstanceRole: () => roleState, fetchInstanceRole: async () => roleState };
});
let session = null;
vi.mock('../lib/supabase.js', async (orig) => {
  const real = await orig();
  return { ...real, onAuthChange: (cb) => { cb(session); return () => {}; } };
});

import TlcOnboardingForm from '../components/TlcOnboardingForm.jsx';
import TlcOnboarding from '../components/TlcOnboarding.jsx';
import TlcPublicDoor from '../components/TlcPublicDoor.jsx';
import { mergeRoster } from '../lib/tlc-roster.js';
import { TLC_TEAM } from '../lib/tlc-practice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount(el) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(el); }); }
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; sent.saves.length = 0; sent.reviews.length = 0; sent.invites.length = 0; sent.rosterUpserts.length = 0; sent.launch.length = 0; sent.roles.length = 0; sent.spaceInvites.length = 0; openStatus = 'draft'; roleState = { instanceId: 'i1', instanceSlug: 'poe-family', instanceType: 'family', role: 'admin', loaded: true }; packetStatus = null; window.history.replaceState(null, '', '/'); });
const settle = () => act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); });
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const byText = (re, tag = 'button') => Array.from(container.querySelectorAll(tag)).find((b) => re.test(b.textContent));
// A second-row area chip (Darrell 2026-09-10: "another tab slider for each section").
const areaChip = (strip, re) => Array.from(container.querySelectorAll(`[role="tablist"][aria-label="${strip}"] [role="tab"]`)).find((t) => re.test(t.textContent));
const area = async (strip, re) => { const t = areaChip(strip, re); expect(t, `${strip} → ${re}`).toBeTruthy(); await click(t); await settle(); };

describe('TlcOnboardingForm — the colleague', () => {
  it('opens the packet, shows every section as a sliding tab, and the progress line', async () => {
    await mount(createElement(TlcOnboardingForm, { token: 'good' }));
    await settle();
    expect(container.textContent).toMatch(/TLC Therapy Solutions · In progress/);
    for (const t of ['About you', 'License & credentials', 'Insurance & paperwork', 'Credentialing', 'Direct deposit', 'Weekly availability', 'Clinical profile', 'Agreements', 'Review & submit']) {
      expect(container.textContent, `tab ${t}`).toContain(t);
    }
    expect(container.textContent).toMatch(/\d+ of \d+ answered/);
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });
  it('a bad link is an honest sentence, never a blank', async () => {
    await mount(createElement(TlcOnboardingForm, { token: 'nope' }));
    await settle();
    expect(container.textContent).toMatch(/could not be opened/);
    expect(container.textContent).toMatch(/ask Christina/i);
  });
  it('a submit with an unsigned agreement is refused on the device — nothing is sent', async () => {
    await mount(createElement(TlcOnboardingForm, { token: 'good' }));
    await settle();
    await click(byText(/Review & submit/));
    await click(byText(/^Submit to/));
    await settle();
    expect(sent.saves).toHaveLength(0);
    expect(container.textContent).toMatch(/Still needed/);
    expect(container.textContent).toMatch(/Independent Contractor\/Employment Agreement/);
  });
  it('Save draft goes through the one write with the packet and no submit flag', async () => {
    await mount(createElement(TlcOnboardingForm, { token: 'good' }));
    await settle();
    await click(byText(/Review & submit/));
    await click(byText(/Save draft/));
    await settle();
    expect(sent.saves).toHaveLength(1);
    expect(sent.saves[0].packetId).toBe('p1');
    expect(sent.saves[0].submit).toBe(false);
    expect(sent.saves[0].packet.firstName).toBe('Ann');
    expect(sent.saves[0].banking).toBeNull();
    expect(container.textContent).toMatch(/Saved/);
  });
  it('a submitted packet is read-only with its readout and the masked banking', async () => {
    openStatus = 'submitted';
    await mount(createElement(TlcOnboardingForm, { token: 'good' }));
    await settle();
    expect(container.textContent).toMatch(/Submitted · awaiting review/);
    expect(container.textContent).toMatch(/Your packet is with Christina/);
    expect(container.textContent).toMatch(/routing ····2568/);
    expect(container.textContent).not.toMatch(/071102568/);
    expect(byText(/^Submit to/)).toBeUndefined();
    expect(byText(/Export my packet/)).toBeTruthy();
    expect(byText(/Withdraw/)).toBeTruthy();
  });
});

describe('TlcOnboarding — Christina', () => {
  it('a non-manager gets the honest wall', async () => {
    roleState = { ...roleState, role: 'member' };
    await mount(createElement(TlcOnboarding));
    await settle();
    expect(container.textContent).toMatch(/run by the office owner/);
    roleState = { ...roleState, role: 'admin' };
  });
  it('mints a link that lands on the TLC app with the token, and lists invites + packets + the live roster, each its own area', async () => {
    await mount(createElement(TlcOnboarding));
    await settle();
    expect(Array.from(container.querySelectorAll('[role="tablist"][aria-label="Onboarding areas"] [role="tab"]')).map((t) => t.textContent.trim())).toEqual(['Invite', 'Packets · 1', 'Roster', 'Jobs', 'Applicants']);
    const input = container.querySelector('input[type="email"]');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(input, 'new2@example.com'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await click(byText(/Create invite link/));
    await settle();
    expect(sent.invites[0].email).toBe('new2@example.com');
    expect(container.textContent).toContain('/tlc/app/?tlc=1&onboard=tok9');
    expect(container.textContent).toContain('new@example.com');
    await area('Onboarding areas', /^Packets/);
    expect(container.textContent).toContain('Ann Lee');
    expect(container.textContent).toMatch(/Submitted · awaiting review/);
    await area('Onboarding areas', /^Roster$/);
    expect(container.textContent).toMatch(/Live roster · Match a Preferred Provider/);
    expect(container.textContent).toContain('Brand New, LSW');
  });
  it('opens a packet, previews the public card from it, reveals banking on demand, and approves WITH the card', async () => {
    await mount(createElement(TlcOnboarding));
    await settle();
    await area('Onboarding areas', /^Packets/);
    await click(byText(/^Open$/));
    await settle();
    expect(container.textContent).toMatch(/Their card, as clients will see it/);
    expect(container.querySelector('#rc-name').value).toBe('Ann Lee, LCSW');
    expect(container.querySelector('#rc-spec').value).toBe('Trauma-Informed Care');
    expect(container.textContent).not.toMatch(/071102568/);
    await click(byText(/Reveal banking details/));
    await settle();
    expect(container.textContent).toMatch(/071102568/);
    await click(byText(/Approve · add to roster/));
    await settle();
    expect(sent.reviews).toHaveLength(1);
    expect(sent.reviews[0].decision).toBe('approve');
    expect(sent.reviews[0].card.name).toBe('Ann Lee, LCSW');
    expect(sent.reviews[0].card.role).toBe('Specialist');
    expect(container.textContent).toMatch(/card is live on Match a Preferred Provider/);
  });
  it('Return needs a note; the note travels with the decision', async () => {
    await mount(createElement(TlcOnboarding));
    await settle();
    await area('Onboarding areas', /^Packets/);
    await click(byText(/^Open$/));
    await settle();
    const ret = byText(/Return with note/);
    expect(ret.disabled).toBe(true);
    const ta = container.querySelector('#review-note');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; setter.call(ta, 'Please attach your W-9.'); ta.dispatchEvent(new Event('input', { bubbles: true })); });
    await click(byText(/Return with note/));
    await settle();
    expect(sent.reviews[0]).toMatchObject({ decision: 'return', note: 'Please attach your W-9.', card: null });
  });
});

describe('the TLC door', () => {
  it('under ?onboard=TOKEN a signed-out visitor meets the invite card, not the booking page', async () => {
    window.history.replaceState(null, '', '/tlc/app/?tlc=1&onboard=good');
    await mount(createElement(TlcPublicDoor));
    await settle();
    expect(container.textContent).toMatch(/You have been invited to onboard/);
    expect(container.textContent).not.toMatch(/Match a Preferred Provider/);
  });
  it('the signed-out booking page renders the live roster after the seed cards, same card shape', async () => {
    await mount(createElement(TlcPublicDoor));
    await settle();
    const merged = mergeRoster(TLC_TEAM, [{ id: 'r1', name: 'Brand New, LSW', specialty: 'Trauma-Informed Care' }]);
    expect(merged[merged.length - 1].name).toBe('Brand New, LSW');
    expect(container.textContent).toMatch(/Match a Preferred Provider/);
    expect(container.textContent).toContain('Brand New, LSW');
    const cards = Array.from(container.querySelectorAll('a[target="_blank"]')).filter((a) => /Specialist|Founder/.test(a.textContent));
    expect(cards.length).toBe(TLC_TEAM.length + 1);
  });
});

describe('a client account sees only what a client needs (DR-0350; Darrell: "when a user creates an account they can see?")', () => {
  it('signed in with no office role and no packet: Find your therapist · Mental skills · Join the team — no Team, no Assistant, no office', async () => {
    const keep = roleState;
    roleState = { ...roleState, role: null, instanceId: null };
    openStatus = null; // no packet: a client, not a colleague in onboarding
    try {
      session = { user: { email: 'newclient@example.com' } };
      await mount(createElement(TlcPublicDoor));
      await settle();
      const tabs = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC app sections"] [role="tab"]')).map((t) => t.textContent.trim());
      expect(tabs).toEqual(['Find your therapist', 'Mental skills', 'Join the team']);
      for (const bad of ['Inquiries', 'Client Growth', 'Revenue', 'Team', 'Assistant', 'Onboarding', 'Training']) expect(tabs).not.toContain(bad);
      for (const bad of ['Pre-Intake Inquiry', 'Independent Contractor Handbook', 'Launch board', 'Governance']) expect(container.textContent).not.toContain(bad);
    } finally { roleState = keep; }
  });
});

describe('the TLC app carries the office workflows on ONE slider (DR-0344)', () => {
  it('a signed-in office admin sees Find · Inquiries · Client Growth · Revenue · Training · Team · Assistant · Onboarding, side by side', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    const tabs = Array.from(container.querySelectorAll('[role="tab"]')).map((t) => t.textContent.trim());
    for (const t of ['Find your therapist', 'Inquiries', 'Client Growth', 'Revenue', 'Training', 'Team', 'Assistant', 'Onboarding']) expect(tabs, `tab ${t}`).toContain(t);
    expect(container.querySelectorAll('[role="tablist"]').length).toBe(1);
    // USER PHOTO (Darrell 2026-09-10): the signed-in bar wears the person's
    // picture — initials and "+ photo" until they add one — and opens My profile
    const me = container.querySelector('header button[aria-label$="open my profile"]');
    expect(me, 'the avatar button on the bar').toBeTruthy();
    expect(me.textContent).toContain('+ photo');
    expect(Array.from(container.querySelectorAll('header button')).some((b) => /^Log out$/.test(b.textContent.trim()))).toBe(true);
    await click(byText(/^Inquiries$/, '[role="tab"]'));
    await settle();
    expect(container.textContent).toMatch(/Pre-Intake Inquiry Tracking/);
    expect(container.textContent).toContain('Maya R.');
    session = null;
  });
  it('a signed-in person who is not staff gets no office tabs — a client sees Find · Mental skills · Join the team (DR-0350 §17)', async () => {
    session = { user: { email: 'client@example.com' } };
    roleState = { ...roleState, role: null, instanceId: null };
    await mount(createElement(TlcPublicDoor));
    await settle();
    const tabs = Array.from(container.querySelectorAll('[role="tab"]')).map((t) => t.textContent.trim());
    expect(tabs).toEqual(['Find your therapist', 'Mental skills', 'Join the team']);
    roleState = { ...roleState, role: 'admin', instanceId: 'i1' };
    session = null;
  });
});

describe('the office documents live on the Team tab, in the app (DR-0344 — "why would you use Google?!")', () => {
  it('Team shows the handbook, both agreements, the training notes, the hiring form, Finding Peace, and the live launch board — with no link out', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    // Team's areas, side by side: Documents · Launch board · Who we are.
    expect(Array.from(container.querySelectorAll('[role="tablist"][aria-label="Team areas"] [role="tab"]')).map((t) => t.textContent.trim())).toEqual(['Documents', 'Launch board', 'Who we are', 'Governance']);
    const text = container.textContent;
    for (const t of ['Independent Contractor Handbook', 'Independent Contractor Agreement', 'Confidentiality Agreement', 'Training Notes for Therapists-in-Training', 'Therapist Onboarding | Hiring Form', 'Finding Peace']) {
      expect(text, t).toContain(t);
    }
    expect(text).toContain('all in the app');
    expect(Array.from(container.querySelectorAll('a[href]')).filter((a) => /google\.com|drive/i.test(a.href))).toHaveLength(0);
    // the handbook opens at section 1, then 2 (Darrell: "where is number 1?")
    await click(byText(/Independent Contractor Handbook/, 'button'));
    await settle();
    const hb = container.textContent;
    expect(hb.indexOf('1. Introduction')).toBeGreaterThan(-1);
    expect(hb.indexOf('1. Introduction')).toBeLessThan(hb.indexOf('2. Professional Standards'));
    expect(hb).toContain('Welcome to TLC Therapy Solutions');
    // the contractor agreement opens in place: its first section reads here
    await click(byText(/Independent Contractor Agreement/, 'button'));
    await settle();
    expect(container.textContent).toMatch(/1\. /);
    expect(container.textContent).toContain('TLC Therapy Solutions, with a principal place of business');
    // the launch board is live in its own area: its rows render and a status chip saves through the seam
    await area('Team areas', /^Launch board$/);
    expect(container.textContent).toMatch(/TLCTS Launch · 1 of 15 done/);
    expect(container.textContent).toContain('Create social media pages (FB, IG, LinkedIn)');
    const group = Array.from(container.querySelectorAll('[role="group"]')).find((g) => /Create social media pages/.test(g.getAttribute('aria-label')));
    await click(Array.from(group.querySelectorAll('button')).find((b) => /In progress/.test(b.textContent)));
    await settle();
    expect(sent.launch).toEqual([{ key: 'marketing-social-pages', status: 'in-progress' }]);
    session = null;
  });
  it('"Open Training" on a Team fold moves the ONE slider to Training (controlled SectionTabs)', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    await click(byText(/Training Notes for Therapists-in-Training/, 'button'));
    await settle();
    await click(byText(/^Open Training$/, 'button'));
    await settle();
    const selected = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC app sections"] [role="tab"][aria-selected="true"]')).map((t) => t.textContent.trim());
    expect(selected).toEqual(['Training']);
    // Two levels, never more: the app slider, then Training's own area row.
    expect(Array.from(container.querySelectorAll('[role="tablist"]')).map((t) => t.getAttribute('aria-label'))).toEqual(['TLC app sections', 'Training areas']);
    session = null;
  });
  it('a colleague who is not staff (a packet in progress) reads the documents on Team but gets no Onboarding button, no launch board, no Assistant', async () => {
    session = { user: { email: 'colleague@example.com' } };
    roleState = { ...roleState, role: null, instanceId: null };
    packetStatus = 'submitted';
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    expect(container.textContent).toContain('Independent Contractor Handbook');
    expect(areaChip('Team areas', /Launch board/)).toBeUndefined();
    expect(byText(/^Open Onboarding$/, 'button')).toBeUndefined();
    const tabs = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC app sections"] [role="tab"]')).map((x) => x.textContent.trim());
    expect(tabs).toEqual(['Find your therapist', 'Training', 'Team']);
    roleState = { ...roleState, role: 'admin', instanceId: 'i1' };
    session = null;
  });
});

describe('the tabs that work together, end to end (Darrell: "Each tab that should work together make sure they work end to end")', () => {
  it('Team → Open Onboarding lands on Onboarding’s Invite area; Onboarding → approve → Roster area lists the card → Find your therapist shows the same card', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    await click(byText(/Therapist Onboarding \| Hiring Form/, 'button'));
    await settle();
    await click(byText(/^Open Onboarding$/, 'button'));
    await settle();
    const selected = () => Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC app sections"] [role="tab"][aria-selected="true"]')).map((t) => t.textContent.trim());
    expect(selected()).toEqual(['Onboarding']);
    expect(container.textContent).toContain('Invite a new colleague');
    await area('Onboarding areas', /^Packets/);
    await click(byText(/^Open$/));
    await settle();
    await click(byText(/Approve · add to roster/));
    await settle();
    expect(sent.reviews[0].decision).toBe('approve');
    await click(byText(/Back to list/));
    await settle();
    await area('Onboarding areas', /^Roster$/);
    expect(container.textContent).toContain('Brand New, LSW');
    await click(byText(/^Find your therapist$/, '[role="tab"]'));
    await settle();
    expect(selected()).toEqual(['Find your therapist']);
    expect(container.textContent).toContain('Brand New, LSW');
    session = null;
  });
  it('Team → Open Training lands on Training with its Lessons area selected and the therapist’s Assigned area on the strip', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    await click(byText(/Training Notes for Therapists-in-Training/, 'button'));
    await settle();
    await click(byText(/^Open Training$/, 'button'));
    await settle();
    const lessons = areaChip('Training areas', /^Lessons$/);
    expect(lessons.getAttribute('aria-selected')).toBe('true');
    expect(areaChip('Training areas', /^Assigned/)).toBeTruthy();
    session = null;
  });
});

describe('owners and managers govern from the same app (DR-0346)', () => {
  it('an office admin’s Team carries Governance: the chart, the matrix, the live members with guarded seat changes, and an invite with a seat', async () => {
    session = { user: { email: 'christina@tlctherapysolutions.com', id: 'u-me' } };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    expect(Array.from(container.querySelectorAll('[role="tablist"][aria-label="Team areas"] [role="tab"]')).map((t) => t.textContent.trim())).toEqual(['Documents', 'Launch board', 'Who we are', 'Governance']);
    await area('Team areas', /^Governance$/);
    const text = container.textContent;
    expect(text).toContain('Owner · Clinical Director');
    expect(text).toContain('Office Assistant');
    expect(text).toMatch(/reports to Operations Manager/);
    expect(container.querySelector('table[aria-label="Which seat reaches which part of the app"]')).toBeTruthy();
    expect(text).toContain('Members of the office · live');
    expect(text).toContain('Ann Lee');
    // every member row carries their picture (initials until they add one)
    const memberRows = Array.from(container.querySelectorAll('li')).filter((li) => /Ann Lee|Owner O|Therapist T|Assistant A|Viewer V/.test(li.textContent));
    expect(memberRows.length).toBeGreaterThan(0);
    for (const li of memberRows) expect(li.querySelector('.rounded-full'), `no picture beside ${li.textContent.slice(0, 30)}`).toBeTruthy();
    expect(text).toContain('Therapist (independent contractor)');
    // the signed-in admin cannot edit themself or the owner
    expect(text).toMatch(/owner · untouchable/);
    const select = container.querySelector('select[aria-label="Role for Ann Lee"]');
    expect(select).toBeTruthy();
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['member', 'viewer', 'assistant']);
    await act(async () => { select.value = 'assistant'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle();
    expect(sent.roles).toEqual([{ instanceId: 'i1', userId: 'u-ann', role: 'assistant' }]);
    const email = container.querySelector('input[type="email"]');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(email, 'helper@example.com'); email.dispatchEvent(new Event('input', { bubbles: true })); });
    const seat = container.querySelector('select[aria-label="Seat for the invite"]');
    await act(async () => { seat.value = 'assistant'; seat.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(byText(/^Create invite link$/));
    await settle();
    expect(sent.spaceInvites).toEqual([{ instanceType: 'family', email: 'helper@example.com', role: 'assistant', instanceId: 'i1' }]);
    expect(container.textContent).toContain('/?join=tok-gov');
    session = null;
  });
  it('a member (a therapist) has no Governance area', async () => {
    session = { user: { email: 'therapist@example.com', id: 'u-t' } };
    roleState = { ...roleState, role: 'member' };
    await mount(createElement(TlcPublicDoor));
    await settle();
    await click(byText(/^Team$/, '[role="tab"]'));
    await settle();
    expect(areaChip('Team areas', /Governance/)).toBeUndefined();
    roleState = { ...roleState, role: 'admin' };
    session = null;
  });
});
