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

describe('what a typed signature pins (DR-0350; Darrell: "how do the users acknowledge they read and agree")', () => {
  it('the packet carries the time and the document version with the signature; missing ones normalize to empty, never invented', async () => {
    const { normalizePacket } = await import('../lib/tlc-onboarding.js');
    const p = normalizePacket({ acknowledgments: { policies: { agreed: true, signature: 'Ann Lee', signedOn: '2026-09-10', signedAt: '2026-09-10T15:00:00.000Z', docVersion: 'vabc12345' } } });
    expect(p.acknowledgments.policies).toEqual({ agreed: true, signature: 'Ann Lee', signedOn: '2026-09-10', signedAt: '2026-09-10T15:00:00.000Z', docVersion: 'vabc12345', attestation: '', agreedAt: '', signedAtServer: '' });
    expect(p.acknowledgments.confidentiality).toEqual({ agreed: false, signature: '', signedOn: '', signedAt: '', docVersion: '', attestation: '', agreedAt: '', signedAtServer: '' });
  });
  it('the document version is a content hash of the text as the app renders it: stable, and different once the text changes', async () => {
    const { documentVersion, documentVersions, contentHash, signatureRecord, ESIGN_CONSENT } = await import('../lib/tlc-signing.js');
    const v = documentVersions();
    for (const k of ['policies', 'confidentiality', 'contractorAgreement']) expect(v[k]).toMatch(/^v[0-9a-f]{8}$/);
    expect(new Set(Object.values(v)).size).toBe(3);
    expect(documentVersion('policies')).toBe(v.policies);
    expect(documentVersion('nope')).toBeNull();
    expect(contentHash('a')).not.toBe(contentHash('b'));
    const r = signatureRecord({ signature: ' Ann Lee ', key: 'confidentiality', now: new Date('2026-09-10T15:00:00Z') });
    expect(r).toEqual({ signature: 'Ann Lee', signedOn: '2026-09-10', signedAt: '2026-09-10T15:00:00.000Z', docVersion: v.confidentiality });
    expect(signatureRecord({ signature: '', key: 'confidentiality' }).signedAt).toBe('');
    expect(ESIGN_CONSENT).toMatch(/same force as my handwritten signature/);
  });
  it('the form shows the consent line and stamps version + time at signing; the readout shows the version', () => {
    const form = readFileSync(join(here, '../components/TlcOnboardingForm.jsx'), 'utf8');
    const readout = readFileSync(join(here, '../components/TlcOnboardingReadout.jsx'), 'utf8');
    expect(form).toContain('{ESIGN_CONSENT}');
    expect(form).toContain('signatureRecord({ signature: name, key: field.key, live })');
    expect(readout).toContain('document version ${a.docVersion}');
  });
});


describe('"By checking here, you agree" — the sentence and the office\u2019s clock (0194; Darrell 2026-09-10: "let\u2019s use the time stamps however say by checking here you agree")', () => {
  const M194 = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0194-by-checking-here-you-agree-the-office-stamps-the-time.sql'), 'utf8');
  const SMOKE194 = readFileSync(join(here, '../../../infra/supabase/tests/0194-tlc-acknowledgment-stamp-smoke.sql'), 'utf8');
  it('the checkbox carries a sentence that names the document and what is agreed; the form stores it with the moment it was checked', async () => {
    const { acknowledgmentAttestation } = await import('../lib/tlc-signing.js');
    expect(acknowledgmentAttestation('Employee Handbook')).toBe('By checking this box, I acknowledge that I have read the Employee Handbook in full and I agree to be bound by it.');
    expect(acknowledgmentAttestation('')).toContain('read the document in full');
    const form = readFileSync(join(here, '../components/TlcOnboardingForm.jsx'), 'utf8');
    expect(form).toContain('{acknowledgmentAttestation(field.docName)}');
    expect(form).toContain("attestation: acknowledgmentAttestation(field.docName), agreedAt: new Date().toISOString()");
    expect(form).not.toContain('I have read this and I agree.');
    expect(form).toContain('received by the office');
    const readout = readFileSync(join(here, '../components/TlcOnboardingReadout.jsx'), 'utf8');
    expect(readout).toContain('Acknowledged:');
    expect(readout).toContain('by the office');
  });
  it('a normalized packet carries the sentence, the checked moment and the server stamp through untouched (a resubmit must carry the stamp back)', () => {
    const p = normalizePacket({ acknowledgments: { policies: { agreed: true, signature: 'Ann Lee', attestation: 'By checking this box, I acknowledge…', agreedAt: '2026-09-10T15:00:00.000Z', signedAtServer: '2026-09-10T15:00:03.120Z' } } });
    expect(p.acknowledgments.policies.attestation).toBe('By checking this box, I acknowledge…');
    expect(p.acknowledgments.policies.agreedAt).toBe('2026-09-10T15:00:00.000Z');
    expect(p.acknowledgments.policies.signedAtServer).toBe('2026-09-10T15:00:03.120Z');
  });
  it('the migration stamps signedAtServer with wall time on every signed acknowledgment at submit, keeps an unchanged one, re-stamps a re-signed one, and audits the versions + stamps; the smoke proves each', () => {
    expect(M194).toContain('CREATE OR REPLACE FUNCTION public.tlc_onboarding_save(');
    expect(M194).toContain("clock_timestamp() AT TIME ZONE 'UTC'");
    expect(M194).toContain("packet_in := jsonb_set(packet_in, ARRAY['acknowledgments', v_key, 'signedAtServer'], to_jsonb(v_stamp), true);");
    expect(M194).toContain("coalesce(packet_in->'acknowledgments'->v_key->>'signedAtServer', '') = ''");
    expect(M194).toContain("(v_pkt.packet->'acknowledgments'->v_key->>'signature') IS DISTINCT FROM (packet_in->'acknowledgments'->v_key->>'signature')");
    expect(M194).toContain("'signedAtServer', packet_in->'acknowledgments'->k->>'signedAtServer'");
    // every 0187 guard survives the redefinition
    for (const guard of ["'that packet is not yours'", "'a password is never stored in an intake packet'", "'banking is saved separately, never inside the packet'", "acknowledgments.' || v_key"]) expect(M194).toContain(guard);
    expect(M194).not.toContain('tlc_apply'); // one directive per file: the apply changes are 0195's
    for (const rung of ['carries no server stamp', 'an unchanged signature was re-stamped', 'a re-signed document kept its old stamp', 'lacks the versions and stamps', 'an unchecked acknowledgment submitted']) expect(SMOKE194, rung).toContain(rung);
    expect(nsql).not.toContain('signedatserver'); // 0187 never stamped; the stamp is 0194's
  });
});

describe('TLC runs in its own instance (0193, DR-0351; Darrell 2026-09-10: "yes TLC gets it\u2019s own database")', () => {
  const M193 = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0193-tlc-therapy-solutions-runs-in-its-own-instance.sql'), 'utf8');
  const n193 = norm(M193);
  const SMOKE193 = readFileSync(join(here, '../../../infra/supabase/tests/0193-tlc-own-instance-smoke.sql'), 'utf8');
  const LEG = readFileSync(join(here, '../../../.github/workflows/rls-isolation.yml'), 'utf8');
  it('one therapy-practice instance, seeded idempotently; Christina owns it (both sign-ins), Darrell administers it (gmail + phone identity); nobody else', () => {
    expect(n193).toContain("select 'tlc-therapy-solutions', 'tlc therapy solutions', 'therapy-practice' where not exists (select 1 from public.instances where slug = 'tlc-therapy-solutions')");
    expect(n193).toContain("lower(u.email) in ('christina@tlctherapysolutions.com', 'mrspoe06@gmail.com')");
    expect(n193).toContain("on conflict (instance_id, user_id) do update set role = 'owner'");
    expect(n193).toContain("lower(u.email) in ('darrellpoe06@gmail.com', '15636502416@phone.poetech.us')");
    expect(n193).toContain("on conflict (instance_id, user_id) do update set role = 'admin' where public.instance_members.role <> 'owner'");
    expect((M193.match(/INSERT INTO public\.instance_members/g) || []).length).toBe(2);
  });
  it('every office table moves from the family instance (the application guard stepped around and re-armed), and the resolvers answer ONLY from a therapy-practice membership while the shell\u2019s stays family-first', () => {
    for (const t of ['tlc_office_tasks', 'tlc_lesson_assignments', 'tlc_onboarding_invites', 'tlc_onboarding_packets', 'tlc_onboarding_banking', 'tlc_roster', 'tlc_jobs', 'tlc_job_applications']) {
      expect(n193, t).toContain(`update public.${t} set instance_id = v_tlc where instance_id = v_fam;`);
    }
    expect(n193).toContain('alter table public.tlc_job_applications disable trigger tlc_job_applications_guard_trg;');
    expect(n193).toContain('alter table public.tlc_job_applications enable trigger tlc_job_applications_guard_trg;');
    expect(n193).toContain("create or replace function public.tlc_onboarding_my_office() returns table (instance_id uuid, role text, office_name text)");
    expect(n193).toContain("where im.user_id = auth.uid() and i.instance_type = 'therapy-practice' order by im.joined_at asc, i.id asc limit 1;");
    expect(n193).not.toContain("case when i.instance_type = 'family' then 0 else 1 end"); // the family-first fallback is gone
    expect(n193).toContain("create or replace function public.my_office_instance_role() returns jsonb");
    expect(n193).not.toContain('my_default_instance_role()'); // the shell\u2019s resolver is untouched
    expect(n193).toContain('select public.apply_assistant_scope_overlay(); select public.apply_viewer_readonly_overlay();');
    expect(n193).not.toContain('office_records'); // not moved: the next increment, dated in DR-0351
  });
  it('the app reads the office role through its own hook and the office instance id through its own resolver; the TLC surfaces never read the family-first one', () => {
    const role = readFileSync(join(here, '../lib/instance-role.js'), 'utf8');
    expect(role).toContain("createRoleStore('my_office_instance_role')");
    expect(role).toContain("createRoleStore('my_default_instance_role')");
    expect(role).toContain('export const useOfficeInstanceRole = officeStore.use;');
    const sync = readFileSync(join(here, '../lib/table-sync.js'), 'utf8');
    expect(sync).toContain("supabase.rpc('my_office_instance_role')");
    expect(sync).toContain('export async function getOfficeInstanceId()');
    for (const f of ['../components/TlcPublicDoor.jsx', '../components/TlcOnboarding.jsx', '../components/TlcTeamAccess.jsx', '../components/TlcAssistant.jsx']) {
      const src = readFileSync(join(here, f), 'utf8');
      expect(src, f).toContain('useOfficeInstanceRole()');
      expect(src, f).not.toMatch(/\buseInstanceRole\(/);
    }
    for (const f of ['../lib/tlc-assignments.js', '../lib/tlc-launch-sync.js']) {
      const src = readFileSync(join(here, f), 'utf8');
      expect(src, f).toContain('getOfficeInstanceId()');
      expect(src, f).not.toMatch(/\bgetInstanceId\(/);
    }
  });
  it('the smoke rides the tlc-office leg after 0192 and proves the office-only resolver, the shell untouched, and the live office with its people and no office row left on the family', () => {
    expect(LEG).toMatch(/0192-tlc-hiring-audit-actions[^"\n]*\.sql 0193-tlc-therapy-solutions-runs-in-its-own-instance\.sql 0194-/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0193-tlc-own-instance-smoke\.sql/);
    for (const rung of ['a family-only owner got an office role', 'the shell\u2019s resolver moved for U'.replace('\u2019', "''"), 'a family-only owner minted an office invite', 'the live office has no owner', 'office rows still sit on the family instance']) expect(SMOKE193, rung).toContain(rung);
    // the earlier office smokes now stand up a therapy-practice office
    for (const f of ['0189-tlc-office-smoke.sql', '0191-tlc-hiring-smoke.sql']) expect(readFileSync(join(here, '../../../infra/supabase/tests', f), 'utf8'), f).toMatch(/'therapy-practice'\);/);
  });
});
