// =============================================================================
// properties/intake — the Poe Properties rental application, as REAL fields
// =============================================================================
// SOURCE, named (DR-0076 §8): Darrell, 2026-08-26 — "Data from our intake form
// in our forms from drive... go find it and add that as our intake." Read from
// his Drive: **APPLICATION FOR RENTAL** (`application.pdf`, My Drive, the paper
// form Poe Properties has used), whose sections are reproduced here field for
// field. The Google Forms of the same application ("Poe Rental Application",
// "Poe Properties, LLC ~ Application") are the same instrument in Forms clothing;
// Drive cannot export a Form's question list, so the PDF is the verbatim source.
//
// THIS FILE IS THE FIELD MODEL ONLY — pure data + validation. It is deliberately
// NOT a live public form yet: DR-0101 §7 makes the fair-housing / FCRA guardrail
// non-negotiable before any screening decision is recorded, and two findings
// below are the Governor's to settle first. Building the model now means the
// surface is a render away, and the questions it renders are HIS, not invented.
//
// ── TWO FINDINGS THE SOURCE FORM CARRIES (DR-0100: say it plainly) ───────────
//
// 1. SSN + DRIVER'S LICENSE. The paper form collects both. Storing a Social
//    Security number changes what this database IS — breach exposure, retention
//    duty, and a standard of care well past anything the app holds today. So
//    the model marks them `collect: 'out-of-band'`: the application NEVER puts
//    an SSN in the app; the landlord takes it directly when screening runs, by
//    whatever channel their screening provider requires. Flipping that is a
//    Governor decision with real consequences, not a field toggle.
//
// 2. THE AUTHORIZATION TEXT IS BORROWED AND STALE. The PDF's consumer-report
//    authorization names **On-Site.com** as the screening vendor and cites
//    **California Civil Code §1786.22** — Poe Properties operates in Illinois,
//    and there is no evidence in the repo that On-Site.com is the provider in
//    use. That paragraph must be reviewed by a licensed professional and
//    rewritten to the real provider and the governing state before it is shown
//    to a single applicant. It is carried here as `LEGAL_REVIEW_REQUIRED`, not
//    reproduced as if it were ours.
//
// The FCRA rights summary and the background questions ARE substantively
// standard and are kept — they exist to protect the applicant.
// =============================================================================

/** How a field is handled. Nothing here is decoration — each changes behavior. */
// 'app'          — asked and stored in the app.
// 'out-of-band'  — asked by the landlord directly; never stored here.
// 'derived'      — the app already knows it (the door, the date).
const F = (id, label, type, opts = {}) => Object.freeze({
  id, label, type, collect: opts.collect || 'app', required: !!opts.required,
  help: opts.help || '', options: opts.options || null, repeat: opts.repeat || 1,
});

export const APPLICATION_SECTIONS = Object.freeze([
  Object.freeze({
    id: 'unit', title: 'The place applied for',
    note: 'Every adult 18 or older completes their own application.',
    fields: [
      F('door', 'Apartment / unit', 'door', { collect: 'derived', required: true }),
      F('rent', 'Rent', 'money', { collect: 'derived' }),
      F('startDate', 'Start date', 'date', { required: true }),
      F('referredBy', 'Agent / referred by', 'text'),
    ],
  }),
  Object.freeze({
    id: 'applicant', title: 'Applicant',
    fields: [
      F('lastName', 'Last name', 'text', { required: true }),
      F('firstName', 'First name', 'text', { required: true }),
      F('middleInitial', 'M.I.', 'text'),
      F('ssn', 'Social Security number', 'ssn', { collect: 'out-of-band', help: 'Given directly to the landlord when screening runs — never stored in this app.' }),
      F('driversLicense', "Driver's license #", 'text', { collect: 'out-of-band', help: 'Shown to the landlord in person or through the screening provider.' }),
      F('birthDate', 'Birth date', 'date', { required: true }),
      F('homePhone', 'Home phone', 'tel'),
      F('workPhone', 'Work phone', 'tel'),
      F('email', 'Email', 'email', { help: 'Optional — a cell phone works instead.' }),
      F('cellPhone', 'Cell phone', 'tel', { required: true, help: 'This is how you sign in to Poe Properties once you are approved.' }),
    ],
  }),
  Object.freeze({
    id: 'currentAddress', title: 'Current address',
    fields: [
      F('street', 'Street address', 'text', { required: true }),
      F('city', 'City', 'text', { required: true }),
      F('state', 'State', 'text', { required: true }),
      F('zip', 'ZIP', 'text', { required: true }),
      F('dateIn', 'Date in', 'date'),
      F('dateOut', 'Date out', 'date'),
      F('landlordName', 'Landlord name', 'text'),
      F('landlordPhone', 'Landlord phone', 'tel'),
      F('monthlyRent', 'Monthly rent', 'money'),
      F('reasonForLeaving', 'Reason for leaving', 'text'),
    ],
  }),
  Object.freeze({
    id: 'previousAddress', title: 'Previous address',
    fields: [
      F('street', 'Street address', 'text'),
      F('city', 'City', 'text'),
      F('state', 'State', 'text'),
      F('zip', 'ZIP', 'text'),
      F('dateIn', 'Date in', 'date'),
      F('dateOut', 'Date out', 'date'),
      F('landlordName', 'Landlord name', 'text'),
      F('landlordPhone', 'Landlord phone', 'tel'),
      F('monthlyRent', 'Monthly rent', 'money'),
      F('reasonForLeaving', 'Reason for leaving', 'text'),
    ],
  }),
  Object.freeze({
    id: 'occupants', title: 'Other occupants',
    note: 'Names and birth dates of everyone who will live in the unit.',
    fields: [
      F('adults', 'Occupants 18 or older (name + birth date)', 'people'),
      F('minors', 'Occupants under 18 (name + birth date)', 'people'),
    ],
  }),
  Object.freeze({
    id: 'pets', title: 'Pets',
    fields: [
      F('hasPets', 'Any pets?', 'yesno'),
      F('describe', 'Describe', 'text'),
    ],
  }),
  Object.freeze({
    id: 'income', title: 'Employment & income',
    fields: [
      F('occupation', 'Occupation', 'text', { repeat: 2 }),
      F('employer', 'Employer / company', 'text', { repeat: 2 }),
      F('monthlySalary', 'Monthly salary', 'money', { repeat: 2 }),
      F('supervisorName', 'Supervisor name', 'text', { repeat: 2 }),
      F('supervisorPhone', 'Supervisor phone', 'tel', { repeat: 2 }),
      F('startDate', 'Start date', 'date', { repeat: 2 }),
      F('endDate', 'End date', 'date', { repeat: 2 }),
      F('otherIncomeDescription', 'Other income — description', 'text', { repeat: 2 }),
      F('otherIncomeMonthly', 'Other income — monthly', 'money', { repeat: 2 }),
    ],
  }),
  Object.freeze({
    id: 'emergency', title: 'Emergency contacts',
    fields: [
      F('name', 'Name', 'text', { repeat: 2 }),
      F('address', 'Address', 'text', { repeat: 2 }),
      F('phone', 'Phone', 'tel', { repeat: 2 }),
      F('relationship', 'Relationship', 'text', { repeat: 2 }),
    ],
  }),
  Object.freeze({
    id: 'references', title: 'Personal references',
    fields: [
      F('name', 'Name', 'text', { repeat: 2 }),
      F('address', 'Address', 'text', { repeat: 2 }),
      F('phone', 'Phone', 'tel', { repeat: 2 }),
      F('relationship', 'Relationship', 'text', { repeat: 2 }),
    ],
  }),
  Object.freeze({
    id: 'vehicles', title: 'Vehicles',
    fields: [
      F('makeModel', 'Make & model', 'text', { repeat: 2 }),
      F('year', 'Year', 'text', { repeat: 2 }),
      F('license', 'License no. & state', 'text', { repeat: 2 }),
      F('other', 'Other vehicles', 'text'),
    ],
  }),
  Object.freeze({
    id: 'other', title: 'Other information',
    fields: [
      F('heardAbout', 'How did you hear about this property?', 'text'),
      F('anythingElse', 'Anything else that would help us evaluate this application', 'longtext'),
    ],
  }),
  Object.freeze({
    id: 'background', title: 'Background',
    note: 'Answer every question. A "yes" is not an automatic decline — it is a conversation.',
    fields: [
      F('bankruptcy', 'Have you ever filed for bankruptcy?', 'yesno', { required: true }),
      F('refusedRent', 'Have you ever willfully refused to pay rent when due?', 'yesno', { required: true }),
      F('evicted', 'Have you ever been evicted, or left a tenancy owing money?', 'yesno', { required: true }),
      F('evictedDetail', 'If yes — property name, city, state, and landlord name', 'longtext'),
      F('convicted', 'Have you ever been convicted of a crime?', 'yesno', { required: true }),
      F('convictedDetail', 'If yes — type of offense, county, and state', 'longtext'),
    ],
  }),
]);

/**
 * The applicant's rights under the Fair Credit Reporting Act, as the source form
 * states them. Substantively standard and protective of the applicant, so kept.
 */
export const FCRA_RIGHTS = Object.freeze([
  'You have a right to request disclosure of the nature and scope of the investigation.',
  'You must be told if information in your file has been used against you.',
  'You have a right to know what is in your file, and this disclosure may be free.',
  'You have the right to ask for a credit score (there may be a fee for this service).',
  'You have the right to dispute incomplete or inaccurate information. Consumer reporting agencies must correct inaccurate, incomplete, or unverifiable information.',
]);

/**
 * The one block that must NOT ship as-is. Named, with why, so it cannot be
 * quietly rendered by a later change (the test asserts no surface renders it).
 */
export const LEGAL_REVIEW_REQUIRED = Object.freeze({
  id: 'consumer-report-authorization',
  why: 'The source form authorizes On-Site.com as the screening vendor and cites California Civil Code §1786.22. Poe Properties operates in Illinois, and nothing in this repo shows On-Site.com is the provider in use. The authorization must be rewritten to the REAL provider and the governing state, by a licensed professional, before an applicant signs it.',
  reReview: '2026-09-16',
  blocks: ['screening-decision', 'credit-pull', 'background-check'],
});

/** Fields that are asked but never stored in this app. */
export const OUT_OF_BAND = Object.freeze(
  APPLICATION_SECTIONS.flatMap((s) => s.fields.filter((f) => f.collect === 'out-of-band').map((f) => `${s.id}.${f.id}`))
);

/** Every field id, section-qualified — the shape a stored application uses. */
export function applicationFieldIds(sections = APPLICATION_SECTIONS) {
  return sections.flatMap((s) => s.fields.map((f) => `${s.id}.${f.id}`));
}

/**
 * Validate a filled application. Returns { ok, missing, refused }.
 * `refused` names any out-of-band field a caller tried to store — the app
 * refuses to hold an SSN even if something upstream sends one.
 */
export function validateApplication(values = {}, sections = APPLICATION_SECTIONS) {
  const missing = [];
  const refused = [];
  for (const s of sections) {
    for (const f of s.fields) {
      const key = `${s.id}.${f.id}`;
      const v = values[key];
      const filled = v !== undefined && v !== null && String(v).trim() !== '';
      if (f.collect === 'out-of-band' && filled) refused.push(key);
      if (f.required && f.collect === 'app' && !filled) missing.push(key);
    }
  }
  return { ok: missing.length === 0 && refused.length === 0, missing, refused };
}

/**
 * The fair-housing guardrail, as a machine check rather than a paragraph
 * (DR-0101 §7). A decision recorded against a protected-class factor is refused
 * outright; every decision must name a documented, consistent criterion.
 */
export const PROTECTED_CLASS_TERMS = Object.freeze([
  'race', 'color', 'religion', 'religious', 'sex', 'gender', 'familial status',
  'national origin', 'nationality', 'disability', 'disabled', 'handicap',
  'children', 'pregnan', 'ethnic', 'accent', 'church', 'muslim', 'christian',
]);

export function screenDecisionReason(reason = '') {
  const text = String(reason || '').toLowerCase();
  const hit = PROTECTED_CLASS_TERMS.find((t) => text.includes(t));
  if (hit) {
    return { ok: false, refused: true, term: hit,
      message: `A decision cannot be recorded on "${hit}" — the Fair Housing Act forbids it. Record the documented criterion the decision actually rests on (income, references, payment history, or the background answers).` };
  }
  if (text.trim().length < 10) {
    return { ok: false, refused: false, message: 'Name the criterion this decision rests on — every applicant gets the same criteria, and the reason is part of the record.' };
  }
  return { ok: true, refused: false, message: '' };
}
