// =============================================================================
// household-intake — what PoeTech needs to know to serve THIS household
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for PoeTech and
// Poe Properties Apps... however make sure they fit the requirements of the
// product it claims to be."
//
// PoeTech is the family's own operating system: the books, the doors, the
// projects, the rhythms, the study, the roster. It is NOT a clinic and NOT a
// screening bureau, so this form asks only what THOSE systems need and cannot
// derive for themselves. Every question earns its place by naming the surface
// it feeds (`feeds`) — a question no surface reads is a question we do not ask.
//
// WALLS this form is built inside, each from a standing decision:
//   - NO account numbers, routing numbers or passwords. The bank's NAME is a
//     fact; its numbers are not ours to hold (DR-0344's walled-banking rule).
//   - NO clinical record. The app is not a PHI store
//     (USER-ACCOUNTS-AND-HISTORIES-STANDARD; the TLC firewall is senior to
//     everything). "Health" here is logistics — a carrier, an emergency
//     contact, the rhythms the household keeps — never a diagnosis.
//   - NO child-facing data stream. A minor's own row belongs to the Family
//     Roster, where `minor_tier` and the generated COPPA flag live (DR-0093),
//     and the consent/assent flow is still undesigned. So this form asks an
//     ADULT about the HOUSEHOLD, counts minors in ranges, and asks nothing
//     about a named child.
//   - The household's record is the household's: readable, exportable,
//     correctable, removable (DATA-AS-EMPOWERMENT).
//
// The office (here: the household's own owner/admin) edits every word of this
// through the same engine TLC uses — lib/forms-engine.js, DR-0357.
// =============================================================================

export const HOUSEHOLD_FLOOR = Object.freeze(['householdName', 'answeredBy', 'contactEmail']);

const MINOR_RANGES = ['none', '1', '2', '3', '4 or more'];

/** Multiselect options carry an id the record stores and words the reader sees. */
const opt = (id, label, detail = '') => ({ id, label, detail });

export const HOUSEHOLD_HELPS = Object.freeze([
  opt('money', 'The money — books, debts, forecast', 'Where every dollar is and where it is going.'),
  opt('property', 'The property — doors, rooms, systems', 'What we own, what it needs, who is in it.'),
  opt('projects', 'The projects — what we are building', 'The work with a start, an end and a next step.'),
  opt('rhythms', 'The rhythms — the week that repeats', 'Sabbath, the family meeting, the meals, the school run.'),
  opt('study', 'The study — the Word and the lessons', 'What we are learning together and alone.'),
  opt('health', 'The health rhythms — food, movement, rest', 'The habits, never the medical record.'),
  opt('work', 'The work — income, the business, the 1099s', 'What earns, and what could.'),
  opt('legacy', 'The legacy — the trust, the documents, the succession', 'What outlasts us and who carries it.'),
]);

export const INCOME_KINDS = Object.freeze([
  opt('w2', 'A job (W-2)'),
  opt('1099', 'Contract work (1099)'),
  opt('business', 'A business we own'),
  opt('rental', 'Rent from a door we own'),
  opt('benefit', 'A benefit or pension'),
  opt('other', 'Something else'),
]);

export const RHYTHM_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The household record's questions. Same shape the engine reads everywhere:
 * { id, title, blurb, fields: [{ key, type, label, required?, options?, help?, feeds }] }.
 * `feeds` is documentation, not behavior — it is what makes a question
 * defensible, and the test asserts every question has one.
 */
export const HOUSEHOLD_SECTIONS = Object.freeze([
  {
    id: 'household', title: 'The household', blurb: 'Who this record is for, and who answers for it.',
    fields: [
      { key: 'householdName', type: 'text', label: 'What we call this household', required: true, feeds: 'the app header and every report' },
      { key: 'answeredBy', type: 'text', label: 'Who is answering (your full name)', required: true, feeds: 'the record’s author, shown on the readout' },
      { key: 'contactEmail', type: 'email', label: 'Best email for the household', required: true, feeds: 'notifications and the export' },
      { key: 'contactPhone', type: 'tel', label: 'Best phone', feeds: 'notifications' },
      { key: 'adultsCount', type: 'select', label: 'Adults in the household', options: ['1', '2', '3', '4 or more'], feeds: 'the roster and the budget’s per-person math' },
      { key: 'minorsCount', type: 'select', label: 'Children under 18 in the household', options: MINOR_RANGES, help: 'A count only. Each child’s own record lives on the Family Roster, where a guardian decides what they may see.', feeds: 'the roster prompt; never a child-facing data stream' },
      { key: 'homeCity', type: 'text', label: 'City and state we live in', feeds: 'the state rules the app applies (taxes, tenancy, licensure)' },
      { key: 'startedOn', type: 'date', label: 'The day we started keeping this record', feeds: 'the history’s beginning' },
    ],
  },
  {
    id: 'home', title: 'The home', blurb: 'The roof over us — what it costs and what it needs.',
    fields: [
      { key: 'homeTenure', type: 'select', label: 'We own this home / we rent it', options: ['We own it', 'We rent it', 'It is family-owned', 'Something else'], feeds: 'the books (mortgage vs rent) and the property module' },
      { key: 'housingPayment', type: 'text', label: 'What the home costs each month', help: 'Mortgage or rent. A number is enough.', feeds: 'the budget and the forecast' },
      { key: 'homeInsurer', type: 'text', label: 'Home or renter insurance carrier', feeds: 'the documents vault and the renewal reminders' },
      { key: 'homeSystemsNote', type: 'textarea', label: 'What the house needs next', help: 'The roof, the furnace, the water heater — whatever you already know is coming.', feeds: 'the property systems log and the capex plan' },
      { key: 'ownsRentalDoors', type: 'yesno', label: 'We own a door someone else rents', feeds: 'whether Poe Properties belongs on this household’s app' },
    ],
  },
  {
    id: 'money', title: 'The money', blurb: 'Where it comes from and where it is committed. Never an account number.',
    fields: [
      { key: 'incomeKinds', type: 'multiselect', label: 'How money comes in', options: INCOME_KINDS, feeds: 'the books’ income categories and the tax view' },
      { key: 'payCadence', type: 'select', label: 'How often money arrives', options: ['Weekly', 'Every two weeks', 'Twice a month', 'Monthly', 'It varies'], feeds: 'the forecast’s cadence' },
      { key: 'bankName', type: 'text', label: 'The bank or credit union we use', help: 'The name only. This app never holds an account or routing number.', feeds: 'the books’ account labels' },
      { key: 'givingPractice', type: 'select', label: 'Our giving rhythm', options: ['A tithe, first', 'A set amount each month', 'As the Lord leads', 'We are starting'], feeds: 'the giving line in the books and the Spiritual Life module' },
      { key: 'emergencyFundGoal', type: 'text', label: 'The emergency fund we are aiming at', feeds: 'the buffer target on the Big Picture' },
      { key: 'debtSnapshot', type: 'textarea', label: 'What we owe, in your own words', help: 'The kinds and roughly how much. The exact rows go in Debts.', feeds: 'the snowball plan' },
      { key: 'taxFiling', type: 'select', label: 'How we file', options: ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'A business files too'], feeds: 'the tax module' },
      { key: 'booksKeeper', type: 'text', label: 'Who keeps the books', feeds: 'the assignment of the money work' },
    ],
  },
  {
    id: 'work', title: 'The work', blurb: 'What earns today, and what could.',
    fields: [
      { key: 'workToday', type: 'textarea', label: 'What each working adult does now', feeds: 'the income doors and the schedule' },
      { key: 'ownsBusiness', type: 'yesno', label: 'We run a business or a practice', feeds: 'whether the business surfaces mount' },
      { key: 'skillsToMonetize', type: 'textarea', label: 'Skills we have that have not earned yet', feeds: 'the Opportunities match' },
      { key: 'contractorsUsed', type: 'yesno', label: 'We pay contractors or helpers (1099)', feeds: 'the 1099 tracking and the year-end forms' },
    ],
  },
  {
    id: 'rhythms', title: 'The rhythms', blurb: 'The week that repeats. This is what the app plans around.',
    fields: [
      { key: 'sabbathDay', type: 'select', label: 'Our day of rest', options: RHYTHM_DAYS, feeds: 'the calendar’s protected day; nothing is scheduled into it' },
      { key: 'familyMeetingDay', type: 'select', label: 'The day we meet as a household', options: RHYTHM_DAYS, feeds: 'the review cadence and the board' },
      { key: 'devotionTime', type: 'select', label: 'When we are in the Word together', options: ['Morning', 'Midday', 'Evening', 'Before bed', 'It varies'], feeds: 'when lessons are served' },
      { key: 'schoolRhythm', type: 'textarea', label: 'School, work and practice schedules we plan around', feeds: 'the calendar and the project capacity' },
    ],
  },
  {
    id: 'faith', title: 'The faith', blurb: 'The spine everything else orbits.',
    fields: [
      { key: 'churchHome', type: 'text', label: 'Our church home', feeds: 'the church surfaces and the giving record' },
      { key: 'studyTrack', type: 'textarea', label: 'What we are studying now', feeds: 'the lessons the Library serves' },
      { key: 'prayerFocus', type: 'textarea', label: 'What we are praying for as a household', help: 'Kept to this household. Nothing here is ever shared, analyzed for anyone else, or sent anywhere.', feeds: 'the household’s own record only' },
    ],
  },
  {
    id: 'wellbeing', title: 'The rhythms of health', blurb: 'Logistics and habits only. This app is not a medical record and never becomes one.',
    fields: [
      { key: 'healthInsurer', type: 'text', label: 'Health insurance carrier', feeds: 'the documents vault and the renewal reminders' },
      { key: 'emergencyContact', type: 'text', label: 'Who to call if we cannot be reached', feeds: 'the household’s emergency card' },
      { key: 'emergencyPhone', type: 'tel', label: 'Their phone', feeds: 'the household’s emergency card' },
      { key: 'foodApproach', type: 'textarea', label: 'How we eat', help: 'Allergies worth knowing, and the way you plan meals.', feeds: 'the meal planning and the grocery list' },
      { key: 'movementRhythm', type: 'select', label: 'How often we move on purpose', options: ['Most days', 'A few times a week', 'Once a week', 'We are starting'], feeds: 'the health rhythms, never a diagnosis' },
    ],
  },
  {
    id: 'direction', title: 'What we want from this', blurb: 'The reason the app exists for you. This is what the insights are built on.',
    fields: [
      { key: 'helpWith', type: 'multiselect', label: 'What we want this app to carry for us', options: HOUSEHOLD_HELPS, feeds: 'which surfaces mount first and what the insights watch' },
      { key: 'oneYearGoal', type: 'textarea', label: 'Where we want to be in a year', feeds: 'the goals and the forecast target' },
      { key: 'biggestFriction', type: 'textarea', label: 'The thing that wastes the most of our time or peace', feeds: 'the first workflow we build for you' },
      { key: 'wantToLearn', type: 'textarea', label: 'What we want to learn', feeds: 'the Library and the training tracks' },
    ],
  },
  {
    id: 'agreements', title: 'The agreement', blurb: 'Read it, then sign by typing your full name.',
    fields: [
      { key: 'householdCovenant', type: 'acknowledgment', required: true, label: 'How this household uses the app, and what the app owes it (Signature/Date)', docName: 'Household Covenant',
        statement: 'I have read the Household Covenant. I understand what this household’s record holds, that it is ours to read, correct, export and remove at any time, and that it is never sold, never sent to an insurer, an employer or an advertiser, and never used to train anything outside this household without our word.' },
    ],
  },
]);

export const HOUSEHOLD_ALL_FIELDS = HOUSEHOLD_SECTIONS.flatMap((s) => s.fields);

/** Keys the record may never carry, mirrored by the server's patch guard. */
export const HOUSEHOLD_REFUSED_KEYS = Object.freeze([
  'accountNumber', 'routingNumber', 'ssn', 'socialSecurityNumber', 'password', 'cardNumber', 'diagnosis',
]);

/** An empty household record — a place for every item, per DR-0354. */
export function emptyHousehold() {
  const p = { acknowledgments: {} };
  for (const f of HOUSEHOLD_ALL_FIELDS) {
    if (f.type === 'acknowledgment') { p.acknowledgments[f.key] = { agreed: false, signature: '', signedOn: '', signedAt: '', docVersion: '', attestation: '', agreedAt: '', signedAtServer: '' }; continue; }
    if (f.type === 'multiselect') p[f.key] = [];
    else if (f.type === 'yesno') p[f.key] = null;
    else p[f.key] = '';
  }
  return p;
}

/** A stored row → a whole record, nothing lost, nothing forbidden kept. */
export function normalizeHousehold(raw) {
  const base = emptyHousehold();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  out.acknowledgments = { ...base.acknowledgments };
  for (const f of HOUSEHOLD_ALL_FIELDS) {
    if (f.type === 'acknowledgment') {
      const a = raw.acknowledgments && raw.acknowledgments[f.key];
      if (a && typeof a === 'object') {
        out.acknowledgments[f.key] = {
          agreed: a.agreed === true, signature: String(a.signature || ''), signedOn: String(a.signedOn || ''),
          signedAt: String(a.signedAt || ''), docVersion: String(a.docVersion || ''), attestation: String(a.attestation || ''),
          agreedAt: String(a.agreedAt || ''), signedAtServer: String(a.signedAtServer || ''),
        };
      }
      continue;
    }
    if (f.type === 'multiselect') out[f.key] = Array.isArray(raw[f.key]) ? raw[f.key].filter((id) => f.options.some((o) => o.id === id)) : [];
  }
  for (const k of HOUSEHOLD_REFUSED_KEYS) delete out[k];
  return out;
}

/** What is still missing before the record stands on its own. */
export function validateHousehold(record) {
  const p = normalizeHousehold(record);
  const missing = [];
  const errors = [];
  for (const k of HOUSEHOLD_FLOOR) if (!String(p[k] || '').trim()) missing.push(k);
  const email = String(p.contactEmail || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('the household email does not look like an address');
  for (const k of HOUSEHOLD_REFUSED_KEYS) if (record && record[k]) errors.push(`${k} is never stored in a household record`);
  return { ok: missing.length === 0 && errors.length === 0, missing, errors, record: p };
}

export function householdLabelFor(key) {
  const f = HOUSEHOLD_ALL_FIELDS.find((x) => x.key === key);
  return f ? f.label : key;
}

/** How much of the household's own record is answered — honest, never painted. */
export function householdProgress(record) {
  const p = normalizeHousehold(record);
  let total = 0; let done = 0;
  for (const f of HOUSEHOLD_ALL_FIELDS) {
    total += 1;
    if (f.type === 'acknowledgment') { const a = p.acknowledgments[f.key]; if (a && a.agreed && a.signature) done += 1; continue; }
    if (f.type === 'multiselect') { if (p[f.key].length) done += 1; continue; }
    if (f.type === 'yesno') { if (p[f.key] === true || p[f.key] === false) done += 1; continue; }
    if (String(p[f.key] || '').trim()) done += 1;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
