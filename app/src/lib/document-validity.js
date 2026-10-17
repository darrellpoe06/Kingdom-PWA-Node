// =============================================================================
// document-validity — what a document IS, when it stops being true, and when
// =============================================================================
// Darrell, 2026-10-16: "Make sure that when whatever you are doing with users
// documents they are organized in a deterministic systemic process that works
// comprehensively and effectively... If and when we upload certain types of
// documents and dates and renewing documents and insurance etc."
//
// WHAT WAS MEASURED FIRST (DR-0061 reality-trace, before any of this):
//
//   legal_documents (0180)       category + doc_type   date_of        no expiry
//   property_documents (0154)    kind                  effective_on   no expiry
//   choir_team_documents         doc_type              doc_date       no expiry
//   books-intake DOC_TYPES       its own vocabulary    --             no expiry
//
// FOUR shelves, FOUR vocabularies that do not agree, and NOT ONE of them knows
// that a document can stop being true. Every `expires_at` in the repository is
// an invite token. So an insurance certificate lapses, a registration goes
// stale, an inspection certificate runs out -- and the app has nothing to say
// about it until somebody needs the paper and finds it dead.
//
// WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT.
//
// It is NOT a fifth vocabulary. Replacing three working taxonomies would be a
// large, risky change that fights code people rely on. This sits BESIDE them:
// it answers one question the others cannot -- does this kind of document
// expire, and if so, is this one still good? -- and it answers it the same way
// every time, for every shelf, from the dates the row already carries.
//
// THE RULES IT WILL NOT BREAK:
//
//  1. AN UNDATED DOCUMENT IS NEVER "VALID". It is `undated`, said out loud. A
//     certificate with no date is the most dangerous kind, because it looks
//     filed. (DR-0076: unknown is never a no, and never a yes.)
//  2. AN UNKNOWN KIND IS NEVER ASSUMED PERMANENT. `unknown-kind` is its own
//     answer. Guessing "probably does not expire" is how a lapsed policy sits
//     quietly on a shelf.
//  3. THE CLOCK IS THE CALLER'S. Every function takes `today`. Nothing here
//     reads a clock, so every state is reproducible and testable.
//  4. DATES ARE WHOLE DAYS, compared as strings in ISO order. No timezone can
//     move a renewal date across midnight (the DR-1063 lesson: a bare date
//     parsed as a timestamp drifts a day in Texas).

/** A day string, or '' when there isn't one. Never a guess. */
const day = (v) => {
  const s = String(v == null ? '' : v).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
};

/** Pure. Add whole months to a day string, clamping the day of month. */
export function addMonths(isoDay, months) {
  const d = day(isoDay);
  if (!d) return '';
  const [y, m, dd] = d.split('-').map(Number);
  const total = (y * 12) + (m - 1) + Number(months || 0);
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();   // day 0 of next month
  const nd = Math.min(dd, last);
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

/** Pure. Whole days from `a` to `b`, negative when b is before a. */
export function daysBetween(a, b) {
  const x = day(a); const y = day(b);
  if (!x || !y) return null;
  return Math.round((Date.parse(`${y}T00:00:00Z`) - Date.parse(`${x}T00:00:00Z`)) / 86400000);
}

// ---------------------------------------------------------------------------
// THE REGISTRY — which kinds of document stop being true, and how long they last
// ---------------------------------------------------------------------------
// `termMonths` is how long the paper is good for FROM ITS OWN DATE, used only
// when the document does not carry its own expiry date. It is a FALLBACK for
// showing a likely renewal, never a substitute for the real date: a row that
// has `expiresOn` always uses it.
//
// `warnDays` is how much notice this kind actually needs. An insurance policy
// wants more warning than a vehicle registration, because replacing it takes
// longer and lapsing it is worse.
//
// MATCHED BY SUBSTRING, case-insensitive, FIRST MATCH WINS — because the
// existing vocabularies spell the same thing several ways ("Insurance claim
// dispute" is legal work, "Certificate of insurance" is a policy), so order
// matters and the more specific pattern is listed first.
export const EXPIRING_KINDS = Object.freeze([
  // --- insurance: the kind he named, and the one that hurts most when it lapses
  { id: 'insurance-certificate', match: /certificate of insurance|insurance certificate|\bCOI\b/i, label: 'Certificate of insurance', termMonths: 12, warnDays: 60 },
  { id: 'insurance-policy', match: /insurance (policy|binder|declarations?)|policy declarations|\bdec page\b/i, label: 'Insurance policy', termMonths: 12, warnDays: 60 },
  { id: 'insurance-liability', match: /liability insurance|general liability|umbrella policy/i, label: 'Liability insurance', termMonths: 12, warnDays: 60 },
  { id: 'insurance-property', match: /property insurance|landlord insurance|homeowners|renters insurance|flood insurance/i, label: 'Property insurance', termMonths: 12, warnDays: 60 },
  { id: 'insurance-workers-comp', match: /workers.? comp/i, label: "Workers' compensation", termMonths: 12, warnDays: 60 },
  { id: 'insurance-vehicle', match: /auto insurance|vehicle insurance|car insurance/i, label: 'Vehicle insurance', termMonths: 6, warnDays: 45 },

  // --- licenses and registrations: they renew on a cycle whether we look or not
  { id: 'business-license', match: /business licen[cs]e|occupational licen[cs]e/i, label: 'Business license', termMonths: 12, warnDays: 60 },
  { id: 'rental-registration', match: /rental registration|landlord registration|rental licen[cs]e/i, label: 'Rental registration', termMonths: 12, warnDays: 60 },
  { id: 'registered-agent', match: /annual report|registered agent/i, label: 'Annual report / registered agent', termMonths: 12, warnDays: 45 },
  { id: 'vehicle-registration', match: /vehicle registration|licen[cs]e plate|\btag renewal\b/i, label: 'Vehicle registration', termMonths: 12, warnDays: 45 },
  { id: 'contractor-license', match: /contractor.?s? licen[cs]e|trade licen[cs]e/i, label: 'Contractor license', termMonths: 12, warnDays: 60 },
  { id: 'professional-license', match: /professional licen[cs]e|counselor licen[cs]e|clinical licen[cs]e|\bLPC\b|\bLCSW\b/i, label: 'Professional license', termMonths: 24, warnDays: 90 },

  // --- inspections and certificates: a building's permission to be used
  { id: 'certificate-of-occupancy', match: /certificate of occupancy|\bC of O\b|\bCO certificate\b/i, label: 'Certificate of occupancy', termMonths: 12, warnDays: 60 },
  { id: 'inspection-certificate', match: /inspection (certificate|report)|fire inspection|elevator inspection|boiler inspection/i, label: 'Inspection certificate', termMonths: 12, warnDays: 45 },
  { id: 'alarm-permit', match: /alarm permit|burglar alarm registration/i, label: 'Alarm permit', termMonths: 12, warnDays: 30 },
  { id: 'lead-cert', match: /lead(-| )(safe|paint) (cert|clearance)/i, label: 'Lead-safe certificate', termMonths: 36, warnDays: 90 },

  // --- agreements with an end: a lease is true until it is not
  { id: 'lease', match: /\blease\b|rental agreement|tenancy agreement/i, label: 'Lease', termMonths: 12, warnDays: 60 },
  { id: 'contract-term', match: /service contract|maintenance (contract|agreement)|vendor agreement/i, label: 'Service contract', termMonths: 12, warnDays: 45 },

  // --- identity papers
  { id: 'passport', match: /\bpassport\b/i, label: 'Passport', termMonths: 120, warnDays: 180 },
  { id: 'drivers-license', match: /driver.?s licen[cs]e|state (id|identification) card/i, label: "Driver's license", termMonths: 48, warnDays: 60 },
  { id: 'work-authorization', match: /work authori[sz]ation|\bEAD\b|visa\b/i, label: 'Work authorization', termMonths: 12, warnDays: 90 },
]);

/** Kinds that are permanent by nature — a deed does not expire. */
export const PERMANENT_KINDS = Object.freeze([
  /\bwill\b|trust instrument|estate plan/i,
  /\bdeed\b|title document|chain of title/i,
  /birth certificate|death certificate|marriage certificate|divorce decree/i,
  /\btax return\b|\bW-?2\b|\b1099\b|contribution statement/i,
  /articles|operating agreement|formation/i,
  /\bEIN\b|tax.?exempt determination/i,
]);

/**
 * Pure. What kind of expiring document is this, by its own words?
 * Looks at every label the shelves carry, in order, and returns null when it
 * recognizes nothing — never a guess.
 */
export function kindOf(doc = {}) {
  const words = [doc.docType, doc.doc_type, doc.kind, doc.label, doc.title, doc.category]
    .map((v) => String(v == null ? '' : v)).filter(Boolean).join(' · ');
  if (!words.trim()) return null;
  for (const k of EXPIRING_KINDS) if (k.match.test(words)) return k;
  for (const p of PERMANENT_KINDS) if (p.test(words)) return { id: 'permanent', label: 'Does not expire', termMonths: 0, warnDays: 0, permanent: true };
  return null;
}

export const STATES = Object.freeze({
  expired: 'expired',
  expiringSoon: 'expiring-soon',
  valid: 'valid',
  permanent: 'never-expires',
  undated: 'undated',
  unknownKind: 'unknown-kind',
});

/**
 * Pure. The whole answer about one document, on one day.
 *
 * @param {object} doc  a row from ANY shelf: {docType|kind|label|title|category,
 *                      dateOf|date_of|effective_on|doc_date, expiresOn|expires_on}
 * @param {string} today an ISO day; the caller owns the clock
 * @returns {{state, kind, label, expiresOn, daysLeft, dateUsed, why}}
 */
export function validityOf(doc = {}, today) {
  const now = day(today);
  const kind = kindOf(doc);
  const stated = day(doc.expiresOn ?? doc.expires_on);
  const dated = day(doc.dateOf ?? doc.date_of ?? doc.effective_on ?? doc.doc_date ?? doc.date);

  const base = { kind: kind ? kind.id : null, label: kind ? kind.label : '', expiresOn: stated, daysLeft: null, dateUsed: stated || dated || '' };

  // RULE 2: a kind we do not recognize is its own answer, unless the row told
  // us an expiry date itself — a date beats a guess, always.
  if (!kind && !stated) {
    return { ...base, state: STATES.unknownKind, why: 'This kind of document is not one the app knows to expire. If it does, give it an expiry date and it will be watched.' };
  }
  if (kind && kind.permanent && !stated) {
    return { ...base, state: STATES.permanent, why: 'This kind of document does not expire.' };
  }

  // The expiry we will judge by: the row's own date if it has one, otherwise
  // the kind's term from the document's date. A DERIVED date is marked as
  // derived in `why`, because a likely renewal is not a known one.
  const derived = !stated && kind && kind.termMonths > 0 ? addMonths(dated, kind.termMonths) : '';
  const expires = stated || derived;

  // RULE 1: no date anywhere means UNDATED. Never "valid".
  if (!expires) {
    return { ...base, state: STATES.undated, why: 'No date on this document, so nothing can be said about whether it is still good. An undated certificate is the dangerous kind — it looks filed.' };
  }
  if (!now) {
    return { ...base, expiresOn: expires, state: STATES.undated, why: 'No day was given to judge against.' };
  }

  const left = daysBetween(now, expires);
  const warn = kind ? kind.warnDays : 45;
  const source = stated ? 'the date on the document' : `${kind.termMonths} months from ${dated}, which is this kind's usual term — not a date anyone read off the paper`;

  if (left < 0) {
    return { ...base, expiresOn: expires, daysLeft: left, state: STATES.expired, why: `Ran out ${Math.abs(left)} day${Math.abs(left) === 1 ? '' : 's'} ago, by ${source}.` };
  }
  if (left <= warn) {
    return { ...base, expiresOn: expires, daysLeft: left, state: STATES.expiringSoon, why: `Runs out in ${left} day${left === 1 ? '' : 's'}, by ${source}.` };
  }
  return { ...base, expiresOn: expires, daysLeft: left, state: STATES.valid, why: `Good for another ${left} days, by ${source}.` };
}

/** How loudly each state should be read. Lower sorts first. */
const RANK = { expired: 0, 'expiring-soon': 1, undated: 2, 'unknown-kind': 3, valid: 4, 'never-expires': 5 };

/**
 * Pure. One order, every time, for any shelf: what is already dead first, then
 * what dies soonest, then what nobody can say anything about, then the rest.
 *
 * UNDATED SORTS ABOVE VALID ON PURPOSE. A document nobody can judge is a
 * question needing an answer; a valid one is not. (The opposite of DR-1063's
 * "dateless last", and deliberately so: there, a missing date was a gap in a
 * history; here it is a live risk.)
 */
export function sortByUrgency(rows = [], today) {
  return [...rows]
    .map((r) => ({ row: r, v: validityOf(r, today) }))
    .sort((a, b) => {
      const ra = RANK[a.v.state] ?? 9; const rb = RANK[b.v.state] ?? 9;
      if (ra !== rb) return ra - rb;
      const da = a.v.daysLeft; const db = b.v.daysLeft;
      if (da != null && db != null && da !== db) return da - db;
      // Stable, deterministic tiebreak so the same set always reads the same.
      return String(a.row.label || a.row.title || '').localeCompare(String(b.row.label || b.row.title || ''));
    })
    .map((x) => ({ ...x.row, validity: x.v }));
}

/**
 * Pure. What a steward needs to act on, counted. Never a bare total: the
 * things nobody can judge are counted separately from the things that are fine.
 */
export function renewalSummary(rows = [], today) {
  const out = { expired: 0, expiringSoon: 0, undated: 0, unknownKind: 0, valid: 0, permanent: 0, total: 0 };
  for (const r of rows) {
    out.total += 1;
    const s = validityOf(r, today).state;
    if (s === STATES.expired) out.expired += 1;
    else if (s === STATES.expiringSoon) out.expiringSoon += 1;
    else if (s === STATES.undated) out.undated += 1;
    else if (s === STATES.unknownKind) out.unknownKind += 1;
    else if (s === STATES.valid) out.valid += 1;
    else out.permanent += 1;
  }
  return out;
}

export const UNDATED_IS_NOT_FILED =
  'A document with no date cannot be checked. It is counted separately from the ones that are good, because an undated certificate looks filed and is not.';

export const DERIVED_IS_NOT_READ =
  'Where a document carries no expiry date, the usual term for its kind is shown instead — a likely renewal date, not one anyone read off the paper. Enter the real date and it replaces this.';

// ---------------------------------------------------------------------------
// ON THE CALENDAR, WITH NOTICE, AND EDITABLE (Darrell, 2026-10-16: "Put on
// calendar and notify users in advance of the needs... based on the
// documents... make sense?... editable... by users... deduced from the
// documents.")
// ---------------------------------------------------------------------------
// There is already a calendar: events carry `reminders` (keys from
// REMINDER_OPTIONS in calendar-shared.js) and `dueReminders()` fires them,
// purely, against an injected clock. NOTHING HERE BUILDS A SECOND ONE. A
// document PROPOSES an event into the calendar that exists.
//
// AND A PROPOSAL IS NOT A FACT. This is the same rule the giving book keeps
// about a matched donor (DR-1073): the app may propose, a person decides, and
// once a person has decided THE APP NEVER OVERWRITES THEM. A deduced renewal
// date is a guess from the kind's usual term; the date on the actual paper is
// better; and what the owner types is better still, because they are the one
// holding it.

/** The reminder keys that exist today, longest lead first. */
const LEAD = Object.freeze([
  { key: '1mo-before', days: 30 },
  { key: '2w-before', days: 14 },
  { key: '1w-before', days: 7 },
  { key: '3d-before', days: 3 },
  { key: '1d-before', days: 1 },
]);

/**
 * Pure. Which reminders a kind needs, from the ones the calendar actually has.
 *
 * HONEST ABOUT ITS OWN CEILING: the longest lead the calendar offers is one
 * month, and insurance wants sixty days. So the calendar covers the last
 * month and the shelf's own "expiring soon" (warnDays) covers the rest — and
 * `noticeGapDays` says how much notice the calendar alone cannot give, rather
 * than quietly under-warning.
 */
export function remindersForKind(kind) {
  const warn = kind && kind.warnDays ? kind.warnDays : 45;
  const keys = LEAD.filter((l) => l.days <= warn).map((l) => l.key);
  const longest = LEAD.find((l) => keys.includes(l.key));
  const gap = Math.max(0, warn - (longest ? longest.days : 0));
  return { keys, noticeGapDays: gap };
}

/**
 * Pure. The calendar event a document proposes, or null when it proposes none.
 *
 * Returns the shape the existing calendar already stores, plus provenance:
 *   source   'stated'  the expiry date was on the document
 *            'deduced' the kind's usual term from the document's own date
 *   editable always true — this is a proposal
 */
export function proposedCalendarEvent(doc = {}, today) {
  const v = validityOf(doc, today);
  if (!v.expiresOn) return null;                       // nothing to put on a calendar
  if (v.state === STATES.permanent) return null;

  const stated = !!day(doc.expiresOn ?? doc.expires_on);
  const { keys, noticeGapDays } = remindersForKind(EXPIRING_KINDS.find((k) => k.id === v.kind));
  const name = String(doc.label || doc.title || v.label || 'Document').trim();

  return {
    // The calendar's own fields.
    title: `Renew: ${name}`,
    date: v.expiresOn,
    category: 'deadline',
    reminders: keys,
    note: stated
      ? `From the date on the document. ${v.why}`
      : `${DERIVED_IS_NOT_READ} ${v.why}`,
    // Provenance, so a surface can say where the date came from and a later
    // re-deduction can tell its own guess from a person's decision.
    documentId: doc.id || doc.slug || null,
    documentKind: v.kind,
    source: stated ? 'stated' : 'deduced',
    editable: true,
    noticeGapDays,
  };
}

/**
 * Pure. A person's edit, applied to a proposal.
 *
 * THE PERSON'S HAND WINS AND KEEPS WINNING. `source` becomes 'user', which is
 * what `shouldReplaceProposal` reads to leave it alone forever after. The
 * app's own guess is kept in `wasDeduced` rather than thrown away, so the two
 * can be compared when a document is replaced.
 */
export function applyUserEdit(proposal, edit = {}) {
  if (!proposal) return null;
  const nextDate = day(edit.date) || proposal.date;
  return {
    ...proposal,
    title: typeof edit.title === 'string' && edit.title.trim() ? edit.title.trim() : proposal.title,
    date: nextDate,
    reminders: Array.isArray(edit.reminders) ? [...edit.reminders] : proposal.reminders,
    note: typeof edit.note === 'string' ? edit.note : proposal.note,
    source: 'user',
    wasDeduced: proposal.source === 'user' ? proposal.wasDeduced : { date: proposal.date, source: proposal.source },
  };
}

/**
 * Pure. May a fresh deduction replace what is already on the calendar?
 *
 * NEVER over a person's edit. Otherwise yes — a re-read that finds a real
 * expiry date on the paper should replace an earlier guess.
 */
export function shouldReplaceProposal(existing, fresh) {
  if (!existing) return true;
  if (existing.source === 'user') return false;        // their decision stands
  if (!fresh) return false;
  if (existing.source === 'deduced' && fresh.source === 'stated') return true;
  return existing.date !== fresh.date;                 // the guess itself moved
}

/**
 * Pure. Every event a set of documents proposes, in one deterministic order,
 * skipping the ones a person has already settled.
 */
export function proposedCalendar(rows = [], today, settled = new Map()) {
  const out = [];
  for (const row of sortByUrgency(rows, today)) {
    const fresh = proposedCalendarEvent(row, today);
    if (!fresh) continue;
    const key = fresh.documentId;
    const existing = key != null ? settled.get(key) : null;
    if (existing && !shouldReplaceProposal(existing, fresh)) { out.push(existing); continue; }
    out.push(fresh);
  }
  return out;
}

export const A_PROPOSAL_IS_NOT_A_FACT =
  'These renewal dates are worked out from each document — from the date on the paper where it carries one, otherwise from how long that kind of document usually lasts. Change any of them and your date is kept; the app will not move it again.';
