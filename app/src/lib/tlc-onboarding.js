// =============================================================================
// tlc-onboarding — the TLC colleague intake packet, as DATA (DR-0343)
// =============================================================================
// Darrell, 2026-09-10: "We need the TLC Therapy Solutions intake form inside
// the TLC Therapy Solutions App... so Christina can on-board new colleagues
// inside the TLC Therapy Solutions App... go look at our Google drive and use
// that to build the system from as our scaling process or scaffolding."
//
// THE SOURCE. The Drive form "TLC Therapy Solutions – Therapist Onboarding |
// Hiring Form" (the Google Form and its Responses sheet). Every question on it
// is a field here, under the SAME label the colleague already met, grouped the
// way the form reads: who you are, your license, your insurance and paperwork,
// credentialing, direct deposit, when you can see clients, your clinical
// profile, and the three signed acknowledgments.
//
// THREE DELIBERATE DEPARTURES from the form, each a safety, each pinned by
// tlc-onboarding.test.js:
//   1. NO PASSWORD FIELD. The form asked for "CAQH Username/Password". A
//      password in a form is a leak waiting for a screen; the packet asks the
//      colleague to grant TLC practice-manager access inside CAQH instead.
//   2. BANKING IS NOT IN THE PACKET. Bank name, routing and account numbers
//      are BANKING_FIELDS, written to a walled table (migration 0187), never
//      to the packet json; every read of them is audited.
//   3. UPLOADS ARE POINTERS. A document is a storage path in a private
//      bucket, never bytes in the row (DR-0303); the headshot rides as a
//      160px thumbnail and the full file as a document.
//
// Pure: no React, no network. The sync seam is tlc-onboarding-sync.js.
// =============================================================================

// The Drive scaffolding this was built from, kept so the next reader can
// compare the app to its source without a search. Links are TLC's own
// documents; Christina controls who they open for.
export const TLC_ONBOARDING_SOURCE = Object.freeze({
  formTitle: 'TLC Therapy Solutions – Therapist Onboarding | Hiring Form',
  formUrl: 'https://docs.google.com/forms/d/1WROLqw2XTnjTAktf-FHat-L4uZxgPT9s0PMsaz9TmsE/edit',
  responsesUrl: 'https://docs.google.com/spreadsheets/d/1pyARuAxQr_y75P1acl-RaKoDYjXgjeg5IIDyD4fmakA/edit',
  handbookUrl: 'https://docs.google.com/document/d/1V2UHQUAws0nLYfMW1VeBsCCI-GBq3BcjI-zLDXeWJk4/edit',
  contractorAgreementUrl: 'https://docs.google.com/document/d/1EhwsODMEpUxnCRHmFScz4VIdTWorAcYTI-OZeL8PaM8/edit',
  confidentialityAgreementUrl: 'https://docs.google.com/document/d/1kt2L5cd_SJVF_G8Ca3s8eLx3DxavJ_wUdT_q2oOzr8k/edit',
});

// The TLC app page the invite link lands on. /tlc/app/ serves the app bundle
// with TLC's own manifest (DR-0261), so the door reads ?tlc=1&onboard=... at
// first render; the /tlc/ alias meta-refreshes and would drop the token.
export const TLC_APP_PATH = '/tlc/app/';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// The hour slots the Drive form offered per day (7 am through 9 pm), plus the
// form's own "No Clients Today".
export const AVAILABILITY_SLOTS = [
  '7 am - 8 am', '8 am - 9 am', '9 am - 10 am', '10 am - 11 am', '11 am - 12 noon',
  '12 noon - 1 pm', '1 pm - 2 pm', '2 pm - 3 pm', '3 pm - 4 pm', '4 pm - 5 pm',
  '5 pm - 6 pm', '6 pm - 7 pm', '7 pm - 8 pm', '8 pm - 9 pm',
];
export const NO_CLIENTS = 'No Clients Today';

// Client populations, exactly as the form names them (label — description).
export const POPULATIONS = [
  { id: 'children-adolescents', label: 'Children and Adolescents', detail: 'Often face issues like behavioral problems, trauma, and family dynamics' },
  { id: 'families', label: 'Families', detail: 'Work on communication, conflict resolution, and parenting challenges' },
  { id: 'mental-illness', label: 'Individuals with Mental Illness', detail: 'Includes those with depression, anxiety, bipolar disorder, and schizophrenia' },
  { id: 'substance-abuse', label: 'Substance Abuse Clients', detail: 'Individuals struggling with addiction and seeking recovery support' },
  { id: 'elderly', label: 'Elderly Individuals', detail: 'Addressing issues like loneliness, grief, and health-related challenges' },
  { id: 'domestic-violence', label: 'Victims of Domestic Violence', detail: 'Providing support and resources for safety and recovery' },
  { id: 'low-income', label: 'Low-Income Families', detail: 'Assistance with access to resources, housing, and financial stability' },
  { id: 'refugees-immigrants', label: 'Refugees and Immigrants', detail: 'Addressing trauma, cultural adjustment, and integration challenges' },
  { id: 'disabilities', label: 'Individuals with Disabilities', detail: 'Support for mental health, social skills, and advocacy for rights' },
];

// Clinical specialties, exactly as the form names them.
export const SPECIALTIES = [
  { id: 'clinical-social-work', label: 'Clinical Social Work', detail: 'Focuses on diagnosing and treating mental health disorders and emotional issues' },
  { id: 'child-adolescent', label: 'Child and Adolescent Therapy', detail: 'Specializes in working with children and teenagers, addressing developmental issues and family dynamics' },
  { id: 'trauma-informed', label: 'Trauma-Informed Care', detail: 'Focuses on understanding and addressing the impact of trauma on individuals' },
  { id: 'family-therapy', label: 'Family Therapy', detail: 'Works with families to improve communication, resolve conflicts, and strengthen relationships' },
  { id: 'couples-therapy', label: 'Couples Therapy', detail: 'Aims to enhance relationship dynamics and address issues between partners' },
  { id: 'geriatric', label: 'Geriatric Social Work', detail: 'Specializes in the needs of elderly clients, including mental health and social support' },
  { id: 'cbt', label: 'Cognitive Behavioral Therapy (CBT)', detail: 'A structured approach that helps clients identify and change negative thought patterns' },
  { id: 'mindfulness', label: 'Mindfulness-Based Therapy', detail: 'Incorporates mindfulness practices to help clients manage stress and improve emotional regulation' },
];

export const EMPLOYMENT_STATUS = ['Independent Contractor', 'Employee'];
export const LICENSE_TYPES = ['LCSW', 'LCPC', 'LSW', 'LPC', 'LMFT', 'Psychologist (PhD/PsyD)', 'Pre-licensed / supervised', 'Other'];

export const BIO_MIN_WORDS = 150;
export const BIO_MAX_WORDS = 300;
export const HEADSHOT_THUMB_MAX_CHARS = 32000;
export const HEADSHOT_THUMB_PX = 160;
export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Field types the form renders:
//   text | email | tel | date | textarea | select | multiselect | yesno | file
//   | availability (7 days x slots) | acknowledgment (agree + typed signature + date)
export const SECTIONS = [
  {
    id: 'about', title: 'About you', blurb: 'How we reach you, and who to call if we cannot.',
    fields: [
      { key: 'preferredName', label: 'Preferred Name', type: 'text' },
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { key: 'homeAddress', label: 'Home Address', type: 'textarea' },
      { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { key: 'preferredEmail', label: 'Preferred E-mail', type: 'email', required: true },
      { key: 'emergencyContact', label: 'Emergency Contact (Name, Phone, Relationship)', type: 'text' },
    ],
  },
  {
    id: 'license', title: 'License & credentials', blurb: 'Your license, identifiers, education, and resume.',
    fields: [
      { key: 'licenseType', label: 'License Type (LCSW, LCPC, etc.)', type: 'select', options: LICENSE_TYPES, required: true },
      { key: 'licenseNumber', label: 'License Number', type: 'text' },
      { key: 'licenseExpiration', label: 'License Expiration Date', type: 'date' },
      { key: 'npiNumber', label: 'NPI Number', type: 'text' },
      { key: 'caqhId', label: 'CAQH ID', type: 'text' },
      { key: 'deaNumber', label: 'DEA Number (if applicable)', type: 'text' },
      { key: 'education', label: 'Education (School, Degree, Graduation Date)', type: 'textarea' },
      { key: 'resume', label: 'Resume/CV', type: 'file', doc: true },
    ],
  },
  {
    id: 'paperwork', title: 'Insurance & paperwork', blurb: 'Malpractice coverage, tax form, and identity documents.',
    fields: [
      { key: 'malpracticeCarrier', label: 'Malpractice Insurance Carrier', type: 'text' },
      { key: 'policyNumber', label: 'Policy Number', type: 'text' },
      { key: 'effectiveDates', label: 'Effective Dates', type: 'text' },
      { key: 'proofOfInsurance', label: 'Proof of Insurance', type: 'file', doc: true },
      { key: 'w9', label: 'W-9 Form', type: 'file', doc: true },
      { key: 'employmentStatus', label: 'Employment Status (Employee/Independent Contractor)', type: 'select', options: EMPLOYMENT_STATUS, required: true },
      { key: 'driversLicense', label: "Driver's License/State ID", type: 'file', doc: true },
      { key: 'i9Proof', label: 'I-9 Proof of Eligibility', type: 'file', doc: true },
    ],
  },
  {
    id: 'credentialing', title: 'Credentialing', blurb: 'Only what applies to you. Items marked "if required" can be left for later.',
    fields: [
      // The form's "CAQH Username/Password (if required)" is REPLACED, on purpose:
      // never a password in a form. The colleague grants access inside CAQH.
      { key: 'caqhAccessGranted', label: 'CAQH access: I have added TLC Therapy Solutions as an authorized practice manager in my CAQH ProView account (if required)', type: 'yesno' },
      { key: 'workHistory', label: 'Work History (last 5 years, no gaps) (if required)', type: 'textarea' },
      { key: 'payersCredentialed', label: 'Payers/Insurance Panels Already Credentialed With (if required)', type: 'textarea' },
      { key: 'credentialingRelease', label: 'Signed Credentialing Release (if required)', type: 'file', doc: true },
      { key: 'hipaaCertificate', label: 'HIPAA Training Certificate (if required)', type: 'file', doc: true },
      { key: 'backgroundCheckAuthorized', label: 'Background Check Authorization', type: 'yesno' },
      { key: 'tbTestResults', label: 'Health/TB Test Results (if required)', type: 'file', doc: true },
      { key: 'consentToReleaseToInsurers', label: 'Consent to Release Info to Insurance Companies', type: 'yesno' },
    ],
  },
  {
    id: 'banking', title: 'Direct deposit', blurb: 'Where your pay goes. Stored apart from everything else; only the office owner can open it, and every look is logged.',
    fields: [],   // BANKING_FIELDS below — never keys in the packet
  },
  {
    id: 'availability', title: 'Weekly availability', blurb: 'The hours you can see clients, each day of the week.',
    fields: [
      { key: 'availability', label: 'Weekly Availability (Days/Times)', type: 'availability' },
    ],
  },
  {
    id: 'profile', title: 'Clinical profile', blurb: 'What clients will read about you.',
    fields: [
      { key: 'populationsServed', label: 'Client Populations Served', type: 'multiselect', options: POPULATIONS },
      { key: 'populationsPreferred', label: 'Preferred Client Populations to Serve', type: 'multiselect', options: POPULATIONS },
      { key: 'specialties', label: 'Clinical Specialties', type: 'multiselect', options: SPECIALTIES },
      { key: 'bio', label: 'Bio (150–300 words)', type: 'textarea', words: [BIO_MIN_WORDS, BIO_MAX_WORDS] },
      { key: 'headshot', label: 'Professional Headshot', type: 'file', doc: true, image: true },
    ],
  },
  {
    id: 'agreements', title: 'Agreements', blurb: 'Read each document, then sign by typing your full name.',
    fields: [
      { key: 'policies', label: 'Acknowledgment of Practice Policies (Signature/Date)', type: 'acknowledgment', required: true, docUrl: TLC_ONBOARDING_SOURCE.handbookUrl, docName: 'Independent Contractor Handbook',
        statement: 'I acknowledge that I have received, read, and understand the Therapy Practice Policies of TLC Therapy Solutions. I agree to comply with these policies as a condition of my independent contractor relationship.' },
      { key: 'confidentiality', label: 'Confidentiality Agreement (Signature/Date)', type: 'acknowledgment', required: true, docUrl: TLC_ONBOARDING_SOURCE.confidentialityAgreementUrl, docName: 'Confidentiality Agreement (NDA)',
        statement: 'I have read the Confidentiality Agreement and agree to keep all Confidential Information strictly confidential, to use it solely to perform duties for TLC Therapy Solutions, and to comply with HIPAA in handling client information.' },
      { key: 'contractorAgreement', label: 'Independent Contractor/Employment Agreement (attach & sign)', type: 'acknowledgment', required: true, docUrl: TLC_ONBOARDING_SOURCE.contractorAgreementUrl, docName: 'Independent Contractor Agreement', attach: true,
        statement: 'I have read the Independent Contractor Agreement and agree to its terms, including confidentiality and HIPAA compliance, the one-year minimum commitment, and the client-protection and non-solicitation provisions.' },
    ],
  },
];

// Direct deposit — collected on the same screen, written to the walled table.
export const BANKING_FIELDS = [
  { key: 'bankName', label: 'Bank Name', type: 'text' },
  { key: 'accountType', label: 'Account Type', type: 'select', options: ['checking', 'savings'] },
  { key: 'routingNumber', label: 'Routing Number', type: 'text', digits: 9 },
  { key: 'accountNumber', label: 'Account Number', type: 'text' },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
export const DOCUMENT_KEYS = ALL_FIELDS.filter((f) => f.doc).map((f) => f.key)
  .concat(ALL_FIELDS.filter((f) => f.type === 'acknowledgment' && f.attach).map((f) => `${f.key}Signed`));
export const REQUIRED_KEYS = ALL_FIELDS.filter((f) => f.required && f.type !== 'acknowledgment').map((f) => f.key);
export const ACKNOWLEDGMENT_KEYS = ALL_FIELDS.filter((f) => f.type === 'acknowledgment').map((f) => f.key);

export const PACKET_STATUSES = {
  draft: { label: 'In progress', tone: 'neutral' },
  submitted: { label: 'Submitted · awaiting review', tone: 'warm' },
  returned: { label: 'Returned · needs changes', tone: 'alert' },
  approved: { label: 'Approved · on the roster', tone: 'good' },
};

export function emptyAvailability() {
  const out = {};
  for (const d of DAYS) out[d] = [];
  return out;
}

export function emptyPacket() {
  const p = { documents: {}, acknowledgments: {}, availability: emptyAvailability() };
  for (const f of ALL_FIELDS) {
    if (f.type === 'multiselect') p[f.key] = [];
    else if (f.type === 'yesno') p[f.key] = null;
    else if (f.type === 'file' || f.type === 'availability' || f.type === 'acknowledgment') continue;
    else p[f.key] = '';
  }
  for (const k of ACKNOWLEDGMENT_KEYS) p.acknowledgments[k] = { agreed: false, signature: '', signedOn: '' };
  return p;
}

// A server row's packet → a full shape (missing keys filled, nothing lost).
export function normalizePacket(raw) {
  const base = emptyPacket();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  out.documents = raw.documents && typeof raw.documents === 'object' ? { ...raw.documents } : {};
  out.acknowledgments = { ...base.acknowledgments };
  for (const k of ACKNOWLEDGMENT_KEYS) {
    const a = raw.acknowledgments && raw.acknowledgments[k];
    if (a && typeof a === 'object') out.acknowledgments[k] = { agreed: a.agreed === true, signature: String(a.signature || ''), signedOn: String(a.signedOn || '') };
  }
  out.availability = emptyAvailability();
  if (raw.availability && typeof raw.availability === 'object') {
    for (const d of DAYS) {
      const v = raw.availability[d];
      out.availability[d] = Array.isArray(v) ? v.filter((s) => s === NO_CLIENTS || AVAILABILITY_SLOTS.includes(s)) : [];
    }
  }
  for (const f of ALL_FIELDS) {
    if (f.type === 'multiselect') out[f.key] = Array.isArray(raw[f.key]) ? raw[f.key].filter((id) => f.options.some((o) => o.id === id)) : [];
  }
  // The two things a packet must never carry (mirrors the server's own refusal).
  delete out.caqhPassword; delete out.password; delete out.routingNumber; delete out.accountNumber; delete out.bankName;
  return out;
}

export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function applicantName(packet) {
  if (!packet) return '';
  const pref = String(packet.preferredName || '').trim();
  if (pref) return pref;
  return [packet.firstName, packet.lastName].map((s) => String(s || '').trim()).filter(Boolean).join(' ');
}

// ABA routing checksum: weights 3,7,1 over nine digits, sum divisible by 10.
export function abaChecksumOk(routing) {
  const d = String(routing || '').replace(/\D/g, '');
  if (d.length !== 9) return false;
  const w = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  const sum = d.split('').reduce((acc, ch, i) => acc + Number(ch) * w[i], 0);
  return sum % 10 === 0;
}

export function validateBanking(b = {}) {
  const bankName = String(b.bankName || '').trim();
  const routingNumber = String(b.routingNumber || '').replace(/\D/g, '');
  const accountNumber = String(b.accountNumber || '').replace(/\D/g, '');
  const accountType = b.accountType === 'savings' ? 'savings' : 'checking';
  const errors = [];
  const empty = !bankName && !routingNumber && !accountNumber;
  if (empty) return { ok: true, empty: true, errors, fields: null };
  if (!bankName) errors.push('the bank name is missing');
  if (!abaChecksumOk(routingNumber)) errors.push('the routing number must be nine digits and pass the bank checksum');
  if (accountNumber.length < 4 || accountNumber.length > 17) errors.push('the account number must be 4 to 17 digits');
  return { ok: errors.length === 0, empty: false, errors, fields: { bankName, routingNumber, accountNumber, accountType } };
}

// What stands between a draft and a submission. Mirrors the server's own
// check in tlc_onboarding_save(submit_in => true) so a short packet never
// leaves the device with a submit flag.
export function validatePacket(packet, { forSubmit = false } = {}) {
  const p = normalizePacket(packet);
  const errors = [];
  const missing = [];
  const email = String(p.preferredEmail || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('the preferred e-mail does not look like an address');
  const bioWords = wordCount(p.bio);
  if (p.bio && bioWords > BIO_MAX_WORDS) errors.push(`the bio is ${bioWords} words; the limit is ${BIO_MAX_WORDS}`);
  if (p.licenseExpiration && !/^\d{4}-\d{2}-\d{2}$/.test(p.licenseExpiration)) errors.push('the license expiration must be a date');
  if (forSubmit) {
    for (const k of REQUIRED_KEYS) if (!String(p[k] || '').trim()) missing.push(k);
    for (const k of ACKNOWLEDGMENT_KEYS) {
      const a = p.acknowledgments[k];
      if (!a || a.agreed !== true || !String(a.signature || '').trim()) missing.push(`acknowledgments.${k}`);
    }
    if (p.bio && bioWords < BIO_MIN_WORDS) errors.push(`the bio is ${bioWords} words; TLC asks for at least ${BIO_MIN_WORDS}`);
  }
  return { ok: errors.length === 0 && missing.length === 0, errors, missing, packet: p };
}

export function labelFor(key) {
  const k = String(key || '').replace(/^acknowledgments\./, '');
  const f = ALL_FIELDS.find((x) => x.key === k) || BANKING_FIELDS.find((x) => x.key === k);
  return f ? f.label : k;
}

// Progress a colleague can see: answered fields over answerable ones.
export function packetProgress(packet) {
  const p = normalizePacket(packet);
  let total = 0; let done = 0;
  for (const f of ALL_FIELDS) {
    total += 1;
    if (f.type === 'file') { if (p.documents[f.key]) done += 1; continue; }
    if (f.type === 'availability') { if (DAYS.some((d) => p.availability[d].length)) done += 1; continue; }
    if (f.type === 'acknowledgment') { const a = p.acknowledgments[f.key]; if (a && a.agreed && a.signature) done += 1; continue; }
    if (f.type === 'multiselect') { if (p[f.key].length) done += 1; continue; }
    if (f.type === 'yesno') { if (p[f.key] === true || p[f.key] === false) done += 1; continue; }
    if (String(p[f.key] || '').trim()) done += 1;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// The one-time link Christina delivers however she already reaches the
// colleague (text, WhatsApp, in person — DR-0187). Lands on the TLC app.
export function buildOnboardLink(token, origin) {
  const base = origin || (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  return `${base}${TLC_APP_PATH}?tlc=1&onboard=${encodeURIComponent(String(token || ''))}`;
}

export function readOnboardTokenFromUrl(href) {
  try {
    const url = new URL(href || (typeof window !== 'undefined' ? window.location.href : ''), 'https://x');
    return String(url.searchParams.get('onboard') || '').trim();
  } catch { return ''; }
}

// Bounds for an uploaded document; one sentence a person can act on.
export function validateDocumentFile(file) {
  if (!file) return { ok: false, message: 'Choose a file first.' };
  if (Number(file.size) > DOCUMENT_MAX_BYTES) return { ok: false, message: 'That file is over 15 MB. A phone photo or a PDF export is usually far smaller.' };
  const type = String(file.type || '');
  if (type && !DOCUMENT_TYPES.includes(type) && !type.startsWith('image/')) return { ok: false, message: 'Use a PDF, a Word document, or a photo.' };
  return { ok: true };
}

// A safe storage object name: `<user>/<packet>/<key>-<file>`.
export function documentPath({ userId, packetId, docKey, fileName }) {
  const clean = String(fileName || 'file').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
  return `${userId}/${packetId}/${docKey}-${clean}`;
}

// Exportable always (DATA-AS-EMPOWERMENT commitment 3): the colleague's own
// record as plain JSON, labels included so it reads without the app. Banking
// comes as the masked view the server returns; the full numbers are never in
// a client-side record.
export function exportPacketRecord(view) {
  if (!view || !view.packet_id) return null;
  const p = normalizePacket(view.packet);
  const answers = {};
  for (const f of ALL_FIELDS) {
    if (f.type === 'file') { answers[f.label] = p.documents[f.key] ? p.documents[f.key].fileName || p.documents[f.key].path : ''; continue; }
    if (f.type === 'availability') { answers[f.label] = p.availability; continue; }
    if (f.type === 'acknowledgment') { answers[f.label] = p.acknowledgments[f.key]; continue; }
    if (f.type === 'multiselect') { answers[f.label] = p[f.key].map((id) => (f.options.find((o) => o.id === id) || {}).label || id); continue; }
    answers[f.label] = p[f.key];
  }
  return {
    exportedAt: new Date().toISOString(),
    source: TLC_ONBOARDING_SOURCE.formTitle,
    office: view.office_name || '',
    status: view.status,
    submittedAt: view.submitted_at || null,
    reviewedAt: view.reviewed_at || null,
    reviewNote: view.review_note || '',
    answers,
    directDeposit: view.banking || null,
  };
}

export function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return String(iso); }
}
