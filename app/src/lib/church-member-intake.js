// =============================================================================
// church-member-intake — what the Love Corner needs to know to serve a person
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for the Love Corner
// App that we did for the PoeTech and Poe Properties Apps... however make sure
// they fit the requirements of the product it claims to be."
//
// The product this claims to be is A CHURCH. Not a clinic, not a lender, not a
// CRM chasing a pipeline. So the rule DR-0357 set for the household holds here
// with more force, not less: every question earns its place by naming the
// SURFACE it feeds (`feeds`), and a question no surface reads is a question we
// do not ask. A church that collects what it does not use has built a file on
// its congregation, and this app exists to do the opposite.
//
// WALLS, each from a standing decision:
//   - NO GIVING AMOUNTS, ever. What a person gives is between them and Yahweh;
//     the giving RECORD is theirs alone (lib/giving-records.js) and the church
//     office does not learn it from an intake form. This form asks about the
//     RHYTHM a person keeps, because the Spiritual Life module teaches
//     stewardship — never the number.
//   - NO account or routing numbers, no card, no SSN, no password. The app
//     links out to the church's own giving channels and never touches payment
//     (lib/giving.js).
//   - NO clinical record. "Care" here is logistics — who to call, what the
//     person needs to get here, what they would like prayer for in their own
//     words. Never a diagnosis (the TLC firewall is senior to everything).
//   - NO CHILD-FACING STREAM. This asks an ADULT about themselves and their
//     household, counts children in ranges, and asks nothing about a named
//     child. A minor's own row belongs to the Family Roster under a guardian,
//     and the consent/assent flow DR-0093 owes is still undesigned.
//   - NOTHING THAT SORTS PEOPLE. No income, no marital judgment, no "member in
//     good standing" grade. The roll records standing (lib/church-members.js);
//     an intake does not rank a soul.
//
// DERIVED, NOT RE-TYPED — the part that keeps this honest over time:
//   - The ministries a person can offer to serve come from CHURCH_MINISTRIES
//     (lib/church-ministries.js), the ONE registry the Ministries directory,
//     the feedback picker and the staff ops list already read. Add a ministry
//     there and it appears here on the next build; nothing to remember.
//   - The services a person can ask a ride to come from the church's OWN
//     service record, through the same serviceSlots() the Bus Ministry uses.
//     Sunday and Wednesday both, because the bus runs both (2026-09-11).
//
// The office edits every word of this through the shared engine, exactly as
// TLC's office does — lib/forms-engine.js, registered in lib/product-forms.js.
//
// Pure: no React, no network.
// =============================================================================
import { CHURCH_MINISTRIES } from './church-ministries.js';
import { serviceSlots } from './bus-ministry.js';

/** Multiselect options carry an id the record stores and words the reader sees. */
const opt = (id, label, detail = '') => ({ id, label, detail });

/** The three answers without which the record cannot stand on its own. */
export const MEMBER_FLOOR = Object.freeze(['fullName', 'contactEmail', 'standing']);

const CHILD_RANGES = ['none', '1', '2', '3', '4 or more'];

// Serving options, derived from the one ministries registry. A ministry with no
// page yet is still offered — the church has it, so a person can still say they
// want to serve in it, which is exactly how we learn what to build next.
export const SERVING_OPTIONS = Object.freeze([
  ...CHURCH_MINISTRIES.map((m) => opt(m.id, m.name, m.blurb)),
  opt('wherever', 'Wherever I am needed', 'Put me where the need is.'),
  opt('not-yet', 'Not yet — I am just getting settled', 'A real answer, and nobody will chase you.'),
]);

// The services a ride can be asked for, derived from the church's own record.
export function serviceOptions(church) {
  return serviceSlots(church).map((s) => opt(s.id, `${s.dayLabel} · ${s.time} ${s.label}`.trim()));
}

export const CHURCH_MEMBER_SECTIONS = Object.freeze([
  {
    id: 'you', title: 'You', blurb: 'Who this record is for, and how to reach you.',
    fields: [
      { key: 'fullName', type: 'text', label: 'Your full name', required: true, feeds: 'the member roll and every greeting' },
      { key: 'preferredName', type: 'text', label: 'What you like to be called', feeds: 'how the app and the office address you' },
      { key: 'contactEmail', type: 'email', label: 'Best email', required: true, feeds: 'the roll, the invite, and anything the office sends' },
      { key: 'contactPhone', type: 'tel', label: 'Best phone', feeds: 'the office, and a driver calling about your ride' },
      { key: 'contactPreference', type: 'select', label: 'Best way to reach you', options: ['Text', 'Phone call', 'Email', 'In person on Sunday'], feeds: 'how the office contacts you, instead of guessing' },
      { key: 'homeArea', type: 'text', label: 'Part of town you live in', help: 'A neighborhood is enough — the bus routes are planned by area.', feeds: 'the Bus Ministry route planning' },
    ],
  },
  {
    id: 'standing', title: 'Where you are with us', blurb: 'However you answer, you are welcome. This only decides what the app shows you.',
    fields: [
      { key: 'standing', type: 'select', required: true, label: 'Right now I am…', options: ['Visiting for the first time', 'Coming back to visit', 'New member', 'A member', 'Serving on staff or a ministry team'], feeds: 'the member roll and which surfaces open (lib/member-roles.js)' },
      { key: 'sinceWhen', type: 'text', label: 'Since roughly when', help: 'A year is plenty.', feeds: 'how long someone has been with us, on the member roll' },
      { key: 'howYouFoundUs', type: 'select', label: 'How you found the Love Corner', options: ['Family or a friend', 'The bus ministry', 'The broadcast or online', 'The community — an event or the Center', 'I have always been here', 'Another way'], feeds: 'what the church learns about which doors actually reach people' },
      { key: 'newMemberWelcome', type: 'yesno', label: 'Would you like the new-member welcome?', help: 'The card and what comes next.', feeds: 'the New Members ministry (Darrell’s second pilot)' },
    ],
  },
  {
    id: 'serving', title: 'How you would serve', blurb: 'Nothing here signs you up. It tells the leaders who to talk to.',
    fields: [
      { key: 'servingInterest', type: 'multiselect', label: 'I would like to serve in…', options: SERVING_OPTIONS, feeds: 'the Ministries directory and each ministry lead’s list' },
      { key: 'servingNote', type: 'textarea', label: 'Anything the leaders should know', help: 'What you can do, when you are free, what you would rather not do.', feeds: 'the ministry lead who reaches out' },
      { key: 'canDrive', type: 'yesno', label: 'I could drive or help on the bus route', feeds: 'the Bus Ministry driver roster' },
    ],
  },
  {
    id: 'getting-here', title: 'Getting here', blurb: 'The bus runs Sunday and Wednesday.',
    fields: [
      { key: 'needsRide', type: 'yesno', label: 'I need a ride to service', feeds: 'the Bus Ministry ride requests' },
      { key: 'rideServices', type: 'multiselect', label: 'Which services', options: [], optionsFrom: 'services', help: 'Pick any — the bus covers Sunday worship and both Wednesday Bible Studies.', feeds: 'the bus schedule, by service run (migration 0208)' },
      { key: 'accessibleNeeded', type: 'yesno', label: 'I need the accessibility van', help: 'Wheelchair, walker, or trouble with steps.', feeds: 'which van is assigned to your pickup' },
      { key: 'ridersWithYou', type: 'select', label: 'People riding with you', options: ['Just me', '2', '3', '4 or more'], feeds: 'the van capacity math' },
    ],
  },
  {
    id: 'household', title: 'Your household', blurb: 'A count only. No child is named here.',
    fields: [
      { key: 'adultsCount', type: 'select', label: 'Adults in your household', options: ['1', '2', '3', '4 or more'], feeds: 'the roll’s household grouping' },
      { key: 'childrenCount', type: 'select', label: 'Children under 18', options: CHILD_RANGES, help: 'A count only. A child’s own record belongs to their guardian on the Family Roster.', feeds: 'the children’s ministry headcount; never a child-facing data stream' },
      { key: 'childrensMinistry', type: 'yesno', label: 'Interested in the children’s ministry', feeds: 'the ministry lead’s list — the guardian is contacted, never the child' },
    ],
  },
  {
    id: 'growing', title: 'Growing', blurb: 'What you would like to learn, and how.',
    fields: [
      { key: 'studyBand', type: 'select', label: 'Lessons read best for me at…', options: ['Everyone', 'Children', 'Teens', 'Adults'], feeds: 'the age band the lessons open at (Church › Learn)' },
      { key: 'studyInterest', type: 'textarea', label: 'What you would like to study', help: 'A book, a question, something you have always wondered about.', feeds: 'what gets written next for Living Lessons' },
      { key: 'readAloud', type: 'yesno', label: 'I would rather have it read to me', feeds: 'whether the big reader opens with Read aloud already on' },
      { key: 'givingRhythm', type: 'select', label: 'The giving rhythm you keep', options: ['A tithe, first', 'A set amount', 'As the Lord leads', 'I am starting', 'I would rather not say'], help: 'The rhythm only. This app never asks what you give, and the office never learns it from this form.', feeds: 'the stewardship teaching in the Spiritual Life module — never an amount, never the office' },
    ],
  },
  {
    id: 'care', title: 'Care', blurb: 'Only what you want us to carry.',
    fields: [
      { key: 'prayerRequest', type: 'textarea', label: 'Anything you would like prayer for', help: 'In your own words. Leave it blank and nobody will ask.', feeds: 'the prayer list, if you mark it shareable below' },
      { key: 'prayerShareable', type: 'select', label: 'Who may see that request', options: ['Only the pastor', 'The prayer team', 'The whole church'], feeds: 'who the request is shown to — the default is the narrowest' },
      { key: 'emergencyContact', type: 'text', label: 'Someone to call in an emergency', help: 'A name and a number.', feeds: 'the office, only in an emergency' },
      { key: 'accessNeeds', type: 'textarea', label: 'Anything that would make it easier to be here', help: 'Seating, hearing, a ramp, large print, a quiet space.', feeds: 'the ushers and the accessibility settings — never a medical record' },
    ],
  },
]);

export const CHURCH_MEMBER_ALL_FIELDS = CHURCH_MEMBER_SECTIONS.flatMap((s) => s.fields);

/** Keys this record may never carry, mirrored by the server's patch guard. */
export const CHURCH_MEMBER_REFUSED_KEYS = Object.freeze([
  'accountNumber', 'routingNumber', 'ssn', 'socialSecurityNumber', 'password',
  'cardNumber', 'diagnosis', 'givingAmount', 'givingTotal', 'income',
]);

/** An empty record — a place for every item, per DR-0354. */
export function emptyMemberRecord() {
  const p = { acknowledgments: {} };
  for (const f of CHURCH_MEMBER_ALL_FIELDS) {
    if (f.type === 'acknowledgment') { p.acknowledgments[f.key] = { agreed: false, signature: '', signedOn: '', signedAt: '', docVersion: '', attestation: '', agreedAt: '', signedAtServer: '' }; continue; }
    if (f.type === 'multiselect') p[f.key] = [];
    else if (f.type === 'yesno') p[f.key] = null;
    else p[f.key] = '';
  }
  return p;
}

/** Options for a field, resolved against the church when the field derives them. */
export function optionsFor(field, church) {
  if (!field) return [];
  if (field.optionsFrom === 'services') return serviceOptions(church);
  return field.options || [];
}

/** A stored row → a whole record: nothing lost, nothing forbidden kept. */
export function normalizeMemberRecord(raw, church) {
  const base = emptyMemberRecord();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  out.acknowledgments = { ...base.acknowledgments };
  for (const f of CHURCH_MEMBER_ALL_FIELDS) {
    if (f.type === 'acknowledgment') {
      const a = raw.acknowledgments && raw.acknowledgments[f.key];
      if (a && typeof a === 'object') {
        out.acknowledgments[f.key] = {
          agreed: a.agreed === true, signature: String(a.signature || ''), signedOn: String(a.signedOn || ''),
          signedAt: String(a.signedAt || ''), docVersion: String(a.docVersion || ''),
          attestation: String(a.attestation || ''), agreedAt: String(a.agreedAt || ''),
          signedAtServer: String(a.signedAtServer || ''),
        };
      }
      continue;
    }
    if (f.type === 'multiselect') {
      const allowed = optionsFor(f, church);
      out[f.key] = Array.isArray(raw[f.key]) ? raw[f.key].filter((id) => allowed.some((o) => o.id === id)) : [];
    }
  }
  for (const k of CHURCH_MEMBER_REFUSED_KEYS) delete out[k];
  return out;
}

/** What is still missing before the record stands on its own. */
export function validateMemberRecord(record, church) {
  const p = normalizeMemberRecord(record, church);
  const missing = [];
  const errors = [];
  for (const k of MEMBER_FLOOR) if (!String(p[k] || '').trim()) missing.push(k);
  const email = String(p.contactEmail || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('that email does not look like an address');
  for (const k of CHURCH_MEMBER_REFUSED_KEYS) {
    if (record && record[k]) errors.push(`${k} is never stored in a member record`);
  }
  return { ok: missing.length === 0 && errors.length === 0, missing, errors, record: p };
}

export function memberLabelFor(key) {
  const f = CHURCH_MEMBER_ALL_FIELDS.find((x) => x.key === key);
  return f ? f.label : key;
}

/** How much of the record is filled — shown to the person, never to rank them. */
export function memberProgress(record, church) {
  const p = normalizeMemberRecord(record, church);
  const total = CHURCH_MEMBER_ALL_FIELDS.length;
  const done = CHURCH_MEMBER_ALL_FIELDS.filter((f) => {
    const v = p[f.key];
    if (Array.isArray(v)) return v.length > 0;
    if (v === null) return false;
    return String(v || '').trim() !== '';
  }).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
