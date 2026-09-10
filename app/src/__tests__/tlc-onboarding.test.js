// @vitest-environment node
// =============================================================================
// TLC colleague onboarding (DR-0344): the packet spec mirrors the Drive form,
// the three safety departures hold, and migration 0187 keeps its walls.
// DR-0076 §3: every pin here was broken on purpose once and failed by name.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  SECTIONS, ALL_FIELDS, BANKING_FIELDS, DOCUMENT_KEYS, REQUIRED_KEYS, ACKNOWLEDGMENT_KEYS,
  POPULATIONS, SPECIALTIES, AVAILABILITY_SLOTS, NO_CLIENTS, DAYS,
  emptyPacket, normalizePacket, validatePacket, validateBanking, abaChecksumOk, packetProgress,
  buildOnboardLink, readOnboardTokenFromUrl, documentPath, exportPacketRecord, applicantName, TLC_APP_PATH,
} from '../lib/tlc-onboarding.js';
import { mergeRoster, rosterCard, rosterCardFromPacket } from '../lib/tlc-roster-cards.js';
import { TLC_TEAM } from '../lib/tlc-practice.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(here, '../../../infra/supabase/migrations-auto/0187-tlc-colleague-onboarding-the-intake-packet-lives-in-the-app.sql');
const sql = readFileSync(MIGRATION, 'utf8');
const norm = (s) => s.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').toLowerCase();
const nsql = norm(sql);

// The question labels on the Drive form "TLC Therapy Solutions – Therapist
// Onboarding | Hiring Form" (its Responses sheet header row), minus the one
// deliberately not carried (the password) and the three banking fields
// deliberately moved to the walled table.
const DRIVE_FORM_LABELS = [
  'Preferred Name', 'First Name', 'Last Name', 'Date of Birth', 'Home Address', 'Phone Number', 'Preferred E-mail',
  'Emergency Contact (Name, Phone, Relationship)', 'License Type (LCSW, LCPC, etc.)', 'License Number', 'License Expiration Date',
  'NPI Number', 'CAQH ID', 'DEA Number (if applicable)', 'Education (School, Degree, Graduation Date)', 'Resume/CV',
  'Malpractice Insurance Carrier', 'Policy Number', 'Effective Dates', 'Proof of Insurance', 'W-9 Form',
  'Employment Status (Employee/Independent Contractor)', "Driver's License/State ID", 'I-9 Proof of Eligibility',
  'Work History (last 5 years, no gaps) (if required)', 'Payers/Insurance Panels Already Credentialed With (if required)',
  'Signed Credentialing Release (if required)', 'HIPAA Training Certificate (if required)', 'Background Check Authorization',
  'Health/TB Test Results (if required)', 'Consent to Release Info to Insurance Companies', 'Weekly Availability (Days/Times)',
  'Client Populations Served', 'Preferred Client Populations to Serve', 'Clinical Specialties', 'Bio (150–300 words)',
  'Professional Headshot', 'Acknowledgment of Practice Policies (Signature/Date)', 'Confidentiality Agreement (Signature/Date)',
  'Independent Contractor/Employment Agreement (attach & sign)',
];

describe('the packet spec mirrors the Drive form', () => {
  const labels = ALL_FIELDS.map((f) => f.label);
  it('carries every question the form asked, under the same label', () => {
    for (const l of DRIVE_FORM_LABELS) expect(labels, `missing form question: ${l}`).toContain(l);
  });
  it('banking is asked (Bank Name, Routing Number, Account Number) — as BANKING_FIELDS, never packet keys', () => {
    const bank = BANKING_FIELDS.map((f) => f.label);
    for (const l of ['Bank Name', 'Routing Number', 'Account Number']) expect(bank).toContain(l);
    for (const k of ['bankName', 'routingNumber', 'accountNumber']) expect(ALL_FIELDS.some((f) => f.key === k)).toBe(false);
    expect(Object.keys(emptyPacket())).not.toContain('routingNumber');
  });
  it('NEVER asks for a password — the form\'s "CAQH Username/Password" is replaced by an in-CAQH grant', () => {
    for (const f of ALL_FIELDS) {
      expect(f.type, `${f.key} is a password field`).not.toBe('password');
      expect(/password/i.test(f.label), `${f.key} asks for a password: ${f.label}`).toBe(false);
    }
    expect(ALL_FIELDS.some((f) => f.key === 'caqhAccessGranted' && f.type === 'yesno')).toBe(true);
  });
  it('uploads are pointers: every document field is a `file` and lands under documents', () => {
    for (const k of DOCUMENT_KEYS) expect(typeof k).toBe('string');
    expect(DOCUMENT_KEYS).toContain('resume');
    expect(DOCUMENT_KEYS).toContain('w9');
    expect(DOCUMENT_KEYS).toContain('headshot');
    expect(DOCUMENT_KEYS).toContain('contractorAgreementSigned');
  });
  it('keeps the form\'s option lists — populations, specialties, hour slots, seven days', () => {
    expect(POPULATIONS.map((p) => p.label)).toContain('Victims of Domestic Violence');
    expect(POPULATIONS.map((p) => p.label)).toContain('Refugees and Immigrants');
    expect(SPECIALTIES.map((s) => s.label)).toContain('Cognitive Behavioral Therapy (CBT)');
    expect(SPECIALTIES.map((s) => s.label)).toContain('Mindfulness-Based Therapy');
    expect(AVAILABILITY_SLOTS[0]).toBe('7 am - 8 am');
    expect(AVAILABILITY_SLOTS[AVAILABILITY_SLOTS.length - 1]).toBe('8 pm - 9 pm');
    expect(AVAILABILITY_SLOTS).toContain('12 noon - 1 pm');
    expect(NO_CLIENTS).toBe('No Clients Today');
    expect(DAYS).toHaveLength(7);
  });
  it('the three agreements are acknowledgments that point at the real documents', () => {
    expect(ACKNOWLEDGMENT_KEYS).toEqual(['policies', 'confidentiality', 'contractorAgreement']);
    for (const f of SECTIONS.find((s) => s.id === 'agreements').fields) {
      expect(f.docUrl).toMatch(/^https:\/\/docs\.google\.com\/document\/d\//);
      expect(f.statement.length).toBeGreaterThan(40);
    }
  });
});

describe('validation refuses what the server refuses, before it leaves the device', () => {
  it('a draft with nothing in it is fine; a submit names what is missing', () => {
    expect(validatePacket(emptyPacket()).ok).toBe(true);
    const v = validatePacket(emptyPacket(), { forSubmit: true });
    expect(v.ok).toBe(false);
    for (const k of REQUIRED_KEYS) expect(v.missing).toContain(k);
    expect(v.missing).toContain('acknowledgments.policies');
  });
  it('a complete packet submits; an unsigned agreement blocks it', () => {
    const p = emptyPacket();
    Object.assign(p, { firstName: 'Ann', lastName: 'Lee', phone: '217-555-0100', preferredEmail: 'ann@example.com', licenseType: 'LCSW', employmentStatus: 'Independent Contractor' });
    for (const k of ACKNOWLEDGMENT_KEYS) p.acknowledgments[k] = { agreed: true, signature: 'Ann Lee', signedOn: '2026-09-10' };
    expect(validatePacket(p, { forSubmit: true }).ok).toBe(true);
    p.acknowledgments.confidentiality.agreed = false;
    expect(validatePacket(p, { forSubmit: true }).missing).toEqual(['acknowledgments.confidentiality']);
  });
  it('a bio over 300 words is refused; under 150 blocks only a submit', () => {
    const p = emptyPacket();
    p.bio = Array(301).fill('word').join(' ');
    expect(validatePacket(p).ok).toBe(false);
    p.bio = 'short bio';
    expect(validatePacket(p).ok).toBe(true);
    expect(validatePacket(p, { forSubmit: true }).errors.join(' ')).toMatch(/at least 150/);
  });
  it('normalizePacket strips a credential or banking key that somehow arrived', () => {
    const p = normalizePacket({ firstName: 'A', caqhPassword: 'x', routingNumber: '071000013', accountNumber: '1', bankName: 'B' });
    expect(p.caqhPassword).toBeUndefined();
    expect(p.routingNumber).toBeUndefined();
    expect(p.accountNumber).toBeUndefined();
    expect(p.bankName).toBeUndefined();
    expect(p.firstName).toBe('A');
  });
  it('availability keeps only real slots', () => {
    const p = normalizePacket({ availability: { Monday: ['7 am - 8 am', 'made up', NO_CLIENTS], Funday: ['x'] } });
    expect(p.availability.Monday).toEqual(['7 am - 8 am', NO_CLIENTS]);
    expect(p.availability.Funday).toBeUndefined();
    expect(p.availability.Sunday).toEqual([]);
  });
  it('banking: the ABA checksum holds, and empty banking is not an error', () => {
    expect(abaChecksumOk('071000013')).toBe(true);   // a real 9-digit routing shape
    expect(abaChecksumOk('123456789')).toBe(false);
    expect(abaChecksumOk('07100001')).toBe(false);
    expect(validateBanking({}).empty).toBe(true);
    const bad = validateBanking({ bankName: 'Bank', routingNumber: '123456789', accountNumber: '12' });
    expect(bad.ok).toBe(false);
    expect(bad.errors).toHaveLength(2);
    const good = validateBanking({ bankName: ' Bank ', routingNumber: '071-000-013', accountNumber: '1234 5678', accountType: 'savings' });
    expect(good.ok).toBe(true);
    expect(good.fields).toEqual({ bankName: 'Bank', routingNumber: '071000013', accountNumber: '12345678', accountType: 'savings' });
  });
  it('progress counts answered fields over answerable ones', () => {
    const empty = packetProgress(emptyPacket());
    expect(empty.done).toBe(0);
    expect(empty.total).toBe(ALL_FIELDS.length);
    const p = emptyPacket(); p.firstName = 'A'; p.availability.Monday = ['7 am - 8 am']; p.documents.resume = { path: 'x' };
    expect(packetProgress(p).done).toBe(3);
  });
});

describe('the link and the file path', () => {
  it('the invite link lands on the TLC app page with ?tlc=1 and the token, and reads back', () => {
    const link = buildOnboardLink('abc123', 'https://poetech.us');
    expect(link).toBe(`https://poetech.us${TLC_APP_PATH}?tlc=1&onboard=abc123`);
    expect(TLC_APP_PATH).toBe('/tlc/app/');
    expect(readOnboardTokenFromUrl(link)).toBe('abc123');
    expect(readOnboardTokenFromUrl('https://poetech.us/tlc/app/?tlc=1')).toBe('');
  });
  it('a document path is <user>/<packet>/<key>-<safe name>', () => {
    expect(documentPath({ userId: 'u1', packetId: 'p1', docKey: 'w9', fileName: 'My W-9 (2026).pdf' })).toBe('u1/p1/w9-My-W-9-2026-.pdf');
  });
  it('the export carries every answer by its label and the masked banking, never full numbers', () => {
    const p = emptyPacket(); p.firstName = 'Ann'; p.lastName = 'Lee';
    const rec = exportPacketRecord({ packet_id: 'p1', packet: p, status: 'draft', banking: { bank_name: 'B', routing_last4: '0013', account_last4: '5678' } });
    expect(rec.answers['First Name']).toBe('Ann');
    expect(rec.directDeposit.routing_last4).toBe('0013');
    expect(JSON.stringify(rec)).not.toMatch(/routing_number/);
    expect(applicantName(p)).toBe('Ann Lee');
  });
});

describe('the roster — the same format as the current cards', () => {
  it('a live row becomes a card with exactly the seed fields (name, role, specialty, url, photo)', () => {
    const c = rosterCard({ id: 'r1', name: 'New Person, LCSW', specialty: 'Trauma-Informed Care', photo: 'data:image/jpeg;base64,x' });
    for (const k of Object.keys(TLC_TEAM[0])) expect(c, `card lacks ${k}`).toHaveProperty(k);
    expect(c.role).toBe('Specialist');
    expect(c.url).toMatch(/^https:\/\/tlctherapysolutions\.me/);
  });
  it('merges seed first, live after, a live row replacing a same-name seed card', () => {
    const merged = mergeRoster(TLC_TEAM, [{ id: 'r1', name: 'Brand New, LSW', specialty: 'x' }, { id: 'r2', name: 'candace godbolt', specialty: 'Couples Therapy', photo: 'data:image/png;base64,y' }]);
    expect(merged).toHaveLength(TLC_TEAM.length + 1);
    expect(merged[0].name).toBe(TLC_TEAM[0].name);
    expect(merged[merged.length - 1].name).toBe('Brand New, LSW');
    const candace = merged.find((c) => /Godbolt/i.test(c.name));
    expect(candace.specialty).toBe('Couples Therapy');
    expect(candace.live).toBe(true);
    expect(mergeRoster(TLC_TEAM, [])).toHaveLength(TLC_TEAM.length);
  });
  it('a packet previews as a card: name with license, Specialist, the form\'s specialty labels', () => {
    const p = emptyPacket();
    Object.assign(p, { firstName: 'Ann', lastName: 'Lee', licenseType: 'LCSW', specialties: ['trauma-informed', 'cbt'], bio: 'A bio.' });
    const c = rosterCardFromPacket({ packet: p, headshot_thumb: 'data:image/jpeg;base64,z' });
    expect(c.name).toBe('Ann Lee, LCSW');
    expect(c.role).toBe('Specialist');
    expect(c.specialty).toBe('Trauma-Informed Care · Cognitive Behavioral Therapy (CBT)');
    expect(c.photo).toBe('data:image/jpeg;base64,z');
    expect(c.bio).toBe('A bio.');
  });
});

describe('migration 0187 keeps its walls (source pins)', () => {
  it('banking has RLS on and NO policy — function access only', () => {
    expect(nsql).toContain('alter table public.tlc_onboarding_banking enable row level security');
    expect(nsql).not.toMatch(/create policy \w+ on public\.tlc_onboarding_banking/);
    expect(nsql).toContain('create or replace function public.tlc_onboarding_banking_read');
  });
  it('the banking reveal, an office read of a colleague, and every write are audited', () => {
    const fn = (name) => nsql.slice(nsql.indexOf(`function public.${name}`), nsql.indexOf('language', nsql.indexOf(`function public.${name}`) + 30) + 4000);
    for (const f of ['tlc_onboarding_banking_read', 'tlc_onboarding_read', 'tlc_onboarding_invite', 'tlc_onboarding_review', 'tlc_onboarding_withdraw', 'tlc_onboarding_delete', 'tlc_roster_upsert']) {
      expect(fn(f), `${f} writes no audit_log row`).toContain('insert into audit_log');
    }
  });
  it('the save refuses a password key and a banking key inside the packet', () => {
    expect(nsql).toContain("packet_in ? 'caqhpassword' or packet_in ? 'password'");
    expect(nsql).toContain("packet_in ? 'routingnumber' or packet_in ? 'accountnumber'");
  });
  it('a submit requires the required answers and all three signed acknowledgments, server-side', () => {
    expect(nsql).toContain("array['firstname','lastname','phone','preferredemail','licensetype','employmentstatus']");
    expect(nsql).toContain("array['policies','confidentiality','contractoragreement']");
  });
  it('the bucket is PRIVATE and born by migration; reads are owner or office; writes owner-only on a live packet', () => {
    expect(nsql).toContain("values ('tlc-onboarding', 'tlc-onboarding', false)");
    expect(nsql).toContain('create policy tlc_onboarding_object_office on storage.objects for select');
    expect(nsql).toMatch(/create policy tlc_onboarding_object_write on storage\.objects for insert to authenticated with check \(bucket_id = 'tlc-onboarding' and \(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  });
  it('the row is bounded and the headshot is a capped thumbnail; the list never selects packet or headshot', () => {
    expect(nsql).toContain('pg_column_size(packet) <= 200000');
    expect(nsql).toContain('char_length(headshot_thumb) <= 32000');
    const list = nsql.slice(nsql.indexOf('function public.tlc_onboarding_list'), nsql.indexOf('function public.tlc_onboarding_read'));
    expect(list).not.toMatch(/'packet', p\.packet/);
    expect(list).not.toContain('headshot_thumb');
  });
  it('approval writes the clinicians roster row bound to the applicant, guarded for a box without the table', () => {
    expect(nsql).toContain("to_regclass('public.clinicians') is not null");
    expect(nsql).toContain('insert into public.clinicians');
    expect(nsql).toContain("'clinician-only', $9, 'active'");
  });
  it('approval writes the PUBLIC roster card, and the public read is anon-callable with public columns only', () => {
    expect(nsql).toContain('v_roster := public.tlc_roster_upsert(');
    expect(nsql).toContain('grant execute on function public.tlc_public_roster(text) to anon, authenticated');
    const pub = nsql.slice(nsql.indexOf('function public.tlc_public_roster'), nsql.indexOf('function public.tlc_roster_upsert'));
    expect(pub).toContain('where r.office_id = office_in and r.published');
    expect(pub).not.toContain('instance_id');
    expect(pub).not.toContain('bio');
  });
  it('every colleague-facing function is SECURITY DEFINER and never granted to anon', () => {
    for (const f of ['tlc_onboarding_open', 'tlc_onboarding_save', 'tlc_onboarding_withdraw', 'tlc_onboarding_invite', 'tlc_onboarding_review', 'tlc_onboarding_banking_read', 'tlc_roster_upsert', 'tlc_roster_remove']) {
      const i = nsql.indexOf(`function public.${f}(`);
      expect(i, `${f} missing`).toBeGreaterThan(-1);
      expect(nsql.slice(i, i + 400)).toContain('security definer');
      expect(nsql).toMatch(new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon`));
    }
  });
  it('the assistant and viewer overlays are re-run so the new instance-scoped tables stay walled', () => {
    expect(nsql).toContain('select public.apply_assistant_scope_overlay();');
    expect(nsql).toContain('select public.apply_viewer_readonly_overlay();');
  });
  it('the office instance resolves the way 0130 resolves it (family first, then joined order)', () => {
    expect(nsql).toContain("order by case when i.instance_type = 'family' then 0 else 1 end, im.joined_at asc, i.id asc limit 1");
  });
});
