// =============================================================================
// venue-commercial-rates — the COMMERCIAL event rate card + quote engine
// =============================================================================
// Source: the "Commercial Event Facility Rental Proposal" from Christina,
// Director of Ministries for The Love Corner (The Church of the Living God,
// Champaign, Illinois), 2026-08-30. Her document is the ONLY source of every
// committed number in this file — nothing here is invented, estimated, or
// recalled from memory (DR-0076: measure, don't claim).
//
// WHAT THIS CLOSES: venue-rental.js has carried this note since the booking
// table shipped —
//   "the committed catalog carries a relative `tier` per campus but NO invented
//    dollar rates... A staff-editable rate card is a documented follow-up."
// Christina's proposal is the real rate card that note was waiting for.
//
// THE NUMBERS ARE DEFAULTS, NOT LAW. Christina 2026-08-30: "this will need to
// be able to be updated based on what the whole team and staff would like to
// see, however it's a great opportunity for default settings to be able to be
// discussed... inside the Love Corner App." So the architecture is deliberate:
//   - DEFAULT_COMMERCIAL_RATE_CARD (here, committed) = her proposal, the seed.
//   - venue_rate_cards (one row per instance) = what the team AGREES TO, edited
//     by staff in-app. Only the fields they changed are stored; everything else
//     keeps falling through to her defaults, so a later default change reaches
//     every field the team never touched.
//   - venue_rate_card_notes = the discussion itself, in the app, on the record.
// mergeRateCard() is the seam: one function, every surface reads through it.
//
// THE STATUS IS PART OF THE TRUTH: her document closes with "Proposed rates and
// terms are subject to approval." So the card ships as `status: 'proposed'` and
// every surface that renders it MUST say so. A proposal displayed as a settled
// price is a painted number on a trust surface — exactly what the reality-trace
// rule forbids. When the team approves, the status flips in the DATA (not the
// code) and every surface follows.
//
// THE REFUNDABLE DEPOSIT IS NOT INCOME. The damage/security deposit is held and
// returned after inspection, so it is carried SEPARATELY from `eventCharges`
// all the way through the quote — the church's revenue line never counts money
// it expects to give back.
//
// Pure module — no DB, no React. Every shape is locked by
// venue-commercial-quote.test.js against the worked examples in her document.
// =============================================================================

// --- The committed DEFAULTS (Christina's proposal, verbatim) -----------------
export const DEFAULT_COMMERCIAL_RATE_CARD = Object.freeze({
  // Not yet approved. Her document: "Proposed rates and terms are subject to approval."
  status: 'proposed',

  facilityHourly: 1000,       // $1,000 per hour of reserved facility time
  soundHourly: 50,            // $50 per hour, per sound person
  soundTypicalMin: 2,         // "Generally 2-4 people"
  soundTypicalMax: 4,
  securityHourly: 35,         // $35 per hour, per security person
  securityTypicalMin: 5,      // "Generally 5-10 security personnel"
  securityTypicalMax: 10,
  cleaningFlat: 500,          // cleaning / post-event reset
  refundableDeposit: 1000,    // refundable damage / security deposit

  signingShare: 0.5,          // 50% of the FACILITY RENTAL is due at signing
  finalPaymentDaysBefore: 30, // everything else is due 30 days before the event
});

export const RATE_CARD_SOURCE = Object.freeze({
  author: 'Christina, Director of Ministries',
  church: 'The Church of the Living God (The Love Corner) — Champaign, Illinois',
  documentTitle: 'Commercial Event Facility Rental Proposal',
  receivedOn: '2026-08-30',
});

// Where the card can sit while the team works it. 'proposed' is where Christina's
// document put it; nothing but a staff action moves it.
export const RATE_CARD_STATUSES = Object.freeze([
  { id: 'proposed',     label: 'Proposed',     tone: 'attention', blurb: 'As submitted — subject to approval.' },
  { id: 'under-review', label: 'Under review', tone: 'attention', blurb: 'The team is working the numbers.' },
  { id: 'approved',     label: 'Approved',     tone: 'good',      blurb: 'Agreed by the team — quote with confidence.' },
]);
export const RATE_CARD_STATUS_IDS = RATE_CARD_STATUSES.map((s) => s.id);

// --- The editable field registry (drives the staff form AND validation) ------
// One list, so a new rate never needs a form edit and a validation edit.
export const RATE_FIELDS = Object.freeze([
  { key: 'facilityHourly',         label: 'Facility rental',            kind: 'money',   unit: 'per hour',        min: 0,    max: 100000, help: 'Billed on total hours reserved and used — setup, sound check, event, breakdown, load-out.' },
  { key: 'soundHourly',            label: 'Sound personnel',            kind: 'money',   unit: 'per hour, each',  min: 0,    max: 10000,  help: 'Applies when mics, the sound system, or church audio resources are used.' },
  { key: 'soundTypicalMin',        label: 'Sound staffing — typical low',  kind: 'count', unit: 'people',       min: 0,    max: 50,     help: 'Guidance shown to staff; never a cap.' },
  { key: 'soundTypicalMax',        label: 'Sound staffing — typical high', kind: 'count', unit: 'people',       min: 0,    max: 50,     help: 'Guidance shown to staff; never a cap.' },
  { key: 'securityHourly',         label: 'Security personnel',         kind: 'money',   unit: 'per hour, each',  min: 0,    max: 10000,  help: 'Final count depends on attendance, entrances, backstage, parking, crowd flow.' },
  { key: 'securityTypicalMin',     label: 'Security staffing — typical low',  kind: 'count', unit: 'people',   min: 0,    max: 100,    help: 'Guidance shown to staff; never a cap.' },
  { key: 'securityTypicalMax',     label: 'Security staffing — typical high', kind: 'count', unit: 'people',   min: 0,    max: 100,    help: 'Guidance shown to staff; never a cap.' },
  { key: 'cleaningFlat',           label: 'Cleaning / post-event reset', kind: 'money',   unit: 'flat',           min: 0,    max: 100000, help: 'One flat charge per commercial event.' },
  { key: 'refundableDeposit',      label: 'Refundable damage deposit',  kind: 'money',   unit: 'flat, refundable', min: 0,  max: 100000, help: 'Held, then returned after post-event inspection. Never counted as income.' },
  { key: 'signingShare',           label: 'Due at contract signing',    kind: 'percent', unit: 'of facility rental', min: 0, max: 1,     help: 'The share of the FACILITY RENTAL that reserves and secures the date.' },
  { key: 'finalPaymentDaysBefore', label: 'Balance due before event',   kind: 'days',    unit: 'days before',    min: 0,    max: 365,    help: 'Everything remaining is paid in full by this many days out.' },
]);
export const RATE_FIELD_KEYS = RATE_FIELDS.map((f) => f.key);
const FIELD_BY_KEY = new Map(RATE_FIELDS.map((f) => [f.key, f]));

// What counts as a commercial event, in Christina's words — the definition staff
// read before applying this card to a booking. Overridable like the terms below.
export const DEFAULT_COMMERCIAL_DEFINITION =
  'Commercial events are events in which an individual, promoter, organization, artist, or business is generating revenue or otherwise using the facility for a commercial purpose. The facility rental is based on the total number of hours reserved and used, including applicable setup, sound check, event time, breakdown, and load-out.';

// The contract terms carried alongside the numbers — not arithmetic, but part of
// the proposal, so they ride the quote and nothing is dropped. Each is editable.
export const DEFAULT_COMMERCIAL_TERMS = Object.freeze([
  { key: 'final-cost',      label: 'Final event cost', text: 'The total cost is determined by facility hours, number and hours of sound personnel, number and hours of security personnel, and other event-specific requirements.' },
  { key: 'insurance',       label: 'Insurance',        text: 'Appropriate event liability insurance may be required and must be provided by the established deadline.' },
  { key: 'additional-time', label: 'Additional time',  text: 'Additional facility time is billed at the same hourly facility rate. Sound and security personnel remain at their per-hour, per-person rates for additional required time.' },
  { key: 'damage-deposit',  label: 'Damage deposit',   text: 'The refundable deposit is subject to post-event inspection and may be applied to damage, extraordinary cleaning, overtime, or other unpaid event charges.' },
]);
export const TERM_KEYS = DEFAULT_COMMERCIAL_TERMS.map((t) => t.key);

// --- Small numeric helpers (defensive; nothing here ever throws) -------------
function hoursOf(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100; // quarter and half hours are real; noise is not
}
function headcountOf(v) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// --- mergeRateCard: the ONE seam every surface reads through -----------------
// `override` is the stored venue_rate_cards row shape (camelCase), or null when
// the team has never edited anything. Only recognized, valid keys win; every
// other field falls through to Christina's committed default — so an override
// row can never blank out a rate by omission, and a default change still
// reaches every field the team never touched.
export function mergeRateCard(override) {
  const o = (override && typeof override === 'object') ? override : {};
  const values = { ...DEFAULT_COMMERCIAL_RATE_CARD };
  const changedKeys = [];
  const stored = (o.values && typeof o.values === 'object') ? o.values : o;

  for (const key of RATE_FIELD_KEYS) {
    const raw = stored[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) continue;
    const f = FIELD_BY_KEY.get(key);
    if (f && (n < f.min || n > f.max)) continue;
    const clean = f?.kind === 'count' || f?.kind === 'days' ? Math.floor(n) : money(n);
    if (clean !== DEFAULT_COMMERCIAL_RATE_CARD[key]) changedKeys.push(key);
    values[key] = clean;
  }

  const status = RATE_CARD_STATUS_IDS.includes(o.status) ? o.status : DEFAULT_COMMERCIAL_RATE_CARD.status;

  // Term text overrides: only known keys, only non-empty strings.
  const termOverrides = (o.terms && typeof o.terms === 'object') ? o.terms : {};
  const terms = DEFAULT_COMMERCIAL_TERMS.map((t) => {
    const text = String(termOverrides[t.key] ?? '').trim();
    return text ? { ...t, text, edited: true } : { ...t, edited: false };
  });
  const definitionOverride = String(o.definition ?? '').trim();

  return {
    ...values,
    status,
    terms,
    definition: definitionOverride || DEFAULT_COMMERCIAL_DEFINITION,
    definitionEdited: !!definitionOverride,
    changedKeys,
    // True only when the team has changed NOTHING — the surface says "as
    // submitted by Christina" instead of implying the team already worked it.
    isDefault: changedKeys.length === 0 && !definitionOverride && !terms.some((t) => t.edited),
    updatedAt: o.updatedAt ?? null,
    updatedByEmail: o.updatedByEmail ?? null,
    source: RATE_CARD_SOURCE,
  };
}

// Validate a staff edit before it is stored. Returns the clean values to save
// plus per-field messages — the form never silently drops a bad entry.
export function validateRateCardPatch(patch = {}) {
  const values = {};
  const errors = {};
  for (const f of RATE_FIELDS) {
    if (!(f.key in patch)) continue;
    const raw = patch[f.key];
    if (raw === '' || raw === null || raw === undefined) continue; // cleared = fall back to default
    const n = Number(raw);
    if (!Number.isFinite(n)) { errors[f.key] = 'Enter a number.'; continue; }
    if (n < f.min || n > f.max) {
      errors[f.key] = f.kind === 'percent'
        ? 'Enter a share between 0 and 1 (0.5 = 50%).'
        : `Enter a value between ${f.min} and ${f.max}.`;
      continue;
    }
    values[f.key] = f.kind === 'count' || f.kind === 'days' ? Math.floor(n) : money(n);
  }
  // A typical-low above its typical-high is a real mistake, not a preference.
  const lowHigh = [['soundTypicalMin', 'soundTypicalMax'], ['securityTypicalMin', 'securityTypicalMax']];
  const merged = { ...DEFAULT_COMMERCIAL_RATE_CARD, ...values };
  for (const [lo, hi] of lowHigh) {
    if (merged[lo] > merged[hi]) errors[hi] = 'The typical high must be at least the typical low.';
  }
  return { ok: Object.keys(errors).length === 0, values, errors };
}

// --- The quote engine --------------------------------------------------------
// Input (all optional except hours):
//   hours          total reserved hours — setup + sound check + event + breakdown + load-out
//   soundPeople    number of sound personnel assigned
//   soundHours     their hours (defaults to the facility hours)
//   securityPeople number of security personnel assigned
//   securityHours  their hours (defaults to the facility hours)
//   cleaning       include the post-event reset fee (default true)
//   deposit        include the refundable deposit (default true)
//
// `card` is a merged rate card (mergeRateCard output) — pass the team's live one.
// Output separates what the church EARNS (eventCharges) from what it HOLDS and
// gives back (refundableDeposit). See the header note.
export function quoteCommercialEvent(input = {}, card = DEFAULT_COMMERCIAL_RATE_CARD) {
  const R = { ...DEFAULT_COMMERCIAL_RATE_CARD, ...(card || {}) };
  const hours = hoursOf(input.hours);
  const soundPeople = headcountOf(input.soundPeople);
  const securityPeople = headcountOf(input.securityPeople);
  // Staff hours default to the facility hours; a person assigned for zero hours
  // is a typo, so an empty hours field means "same as the event", not "free".
  const soundHours = input.soundHours === undefined || input.soundHours === null || input.soundHours === ''
    ? hours : hoursOf(input.soundHours);
  const securityHours = input.securityHours === undefined || input.securityHours === null || input.securityHours === ''
    ? hours : hoursOf(input.securityHours);
  const cleaning = input.cleaning === false ? 0 : money(R.cleaningFlat);
  const refundableDeposit = input.deposit === false ? 0 : money(R.refundableDeposit);

  const facilityRental = money(hours * R.facilityHourly);
  const soundTotal = money(soundPeople * soundHours * R.soundHourly);
  const securityTotal = money(securityPeople * securityHours * R.securityHourly);

  // Revenue-bearing charges only. The refundable deposit is deliberately NOT here.
  const eventCharges = money(facilityRental + soundTotal + securityTotal + cleaning);
  const totalDueBeforeEvent = money(eventCharges + refundableDeposit);

  // Christina's payment terms, exactly: the signing share applies to the FACILITY
  // RENTAL (not to the whole quote), then EVERYTHING remaining is due 30 days
  // out, then $0 on the day — "all payments and documents received before
  // building access is granted."
  const atSigning = money(facilityRental * R.signingShare);
  const thirtyDaysBefore = money(totalDueBeforeEvent - atSigning);

  const lines = [
    { key: 'facility', label: 'Commercial event facility rental', detail: `${hours} hr × ${usd(R.facilityHourly)}/hr`, amount: facilityRental, refundable: false },
    { key: 'sound',    label: 'Sound personnel',    detail: `${soundPeople} × ${soundHours} hr × ${usd(R.soundHourly)}/hr`, amount: soundTotal, refundable: false },
    { key: 'security', label: 'Security personnel', detail: `${securityPeople} × ${securityHours} hr × ${usd(R.securityHourly)}/hr`, amount: securityTotal, refundable: false },
    { key: 'cleaning', label: 'Cleaning / post-event reset', detail: cleaning ? 'Flat fee' : 'Not included', amount: cleaning, refundable: false },
    { key: 'deposit',  label: 'Refundable damage / security deposit', detail: refundableDeposit ? 'Returned after post-event inspection' : 'Not included', amount: refundableDeposit, refundable: true },
  ];

  return {
    rateStatus: R.status || 'proposed',
    hours, soundPeople, soundHours, securityPeople, securityHours,
    facilityRental, soundTotal, securityTotal, cleaning,
    eventCharges, refundableDeposit, totalDueBeforeEvent,
    lines,
    schedule: { atSigning, thirtyDaysBefore, eventDay: 0 },
    notes: staffingNotes({ hours, soundPeople, securityPeople }, R),
  };
}

function usd(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
}

// Guidance, never a block: the card gives TYPICAL staffing bands and the final
// number depends on the event. A count outside the band is a prompt to confirm,
// not an error — so this returns notes the surface shows plainly.
export function staffingNotes({ hours, soundPeople, securityPeople }, card = DEFAULT_COMMERCIAL_RATE_CARD) {
  const R = { ...DEFAULT_COMMERCIAL_RATE_CARD, ...(card || {}) };
  const notes = [];
  if (!hoursOf(hours)) notes.push('Enter the total reserved hours — setup, sound check, event, breakdown, and load-out all count.');
  if (soundPeople > 0 && (soundPeople < R.soundTypicalMin || soundPeople > R.soundTypicalMax)) {
    notes.push(`Sound staffing is outside the typical ${R.soundTypicalMin}–${R.soundTypicalMax} — confirm with the media team.`);
  }
  if (securityPeople > 0 && (securityPeople < R.securityTypicalMin || securityPeople > R.securityTypicalMax)) {
    notes.push(`Security staffing is outside the typical ${R.securityTypicalMin}–${R.securityTypicalMax} — confirm with the security team.`);
  }
  if (securityPeople === 0) {
    notes.push(`Commercial events generally require ${R.securityTypicalMin}–${R.securityTypicalMax} security personnel.`);
  }
  return notes;
}

// The date the balance is due: `finalPaymentDaysBefore` days before the event.
// Returns an ISO 'YYYY-MM-DD' string, or null when the date is missing/unparseable.
export function finalPaymentDueDate(eventDate, card = DEFAULT_COMMERCIAL_RATE_CARD) {
  const days = Number(card?.finalPaymentDaysBefore ?? DEFAULT_COMMERCIAL_RATE_CARD.finalPaymentDaysBefore);
  const s = String(eventDate ?? '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - (Number.isFinite(days) ? days : 30));
  return d.toISOString().slice(0, 10);
}

// Is the balance-due date already reached? Staff need to see that a booking
// taken inside the window is due IN FULL now, not "in 30 days".
export function finalPaymentOverdue(eventDate, card = DEFAULT_COMMERCIAL_RATE_CARD, today = new Date()) {
  const due = finalPaymentDueDate(eventDate, card);
  if (!due) return false;
  const now = today instanceof Date ? today : new Date(today);
  return due <= now.toISOString().slice(0, 10);
}

// The three payment milestones as rows a surface can render directly.
export function paymentMilestones(quote, eventDate, card = DEFAULT_COMMERCIAL_RATE_CARD) {
  const due = finalPaymentDueDate(eventDate, card);
  const share = Math.round((Number(card?.signingShare ?? 0.5)) * 100);
  const days = Number(card?.finalPaymentDaysBefore ?? 30);
  return [
    { key: 'signing', when: 'At contract signing', detail: `${share}% of the facility rental — reserves and secures the date`, amount: quote?.schedule?.atSigning ?? 0 },
    { key: 'thirty',  when: due ? `By ${due} (${days} days before)` : `${days} days before the event`, detail: 'All remaining charges, including the refundable deposit', amount: quote?.schedule?.thirtyDaysBefore ?? 0 },
    { key: 'day',     when: 'Event day', detail: 'Nothing outstanding — all payments and documents received before building access', amount: 0 },
  ];
}

// The stored shape for venue_bookings.quote_detail — only the INPUTS, so a quote
// is always recomputed against the team's live rate card and can never go stale
// against a rate the team later changed. Totals are derived, never stored.
export function quoteInputsFrom(quote = {}) {
  // Staff hours mirror the engine's own default: an absent (or zero) staff-hours
  // value means "the whole reserved window", never "free". Storing a bare 0 here
  // would silently drop the sound and security lines from every saved quote.
  const hours = hoursOf(quote.hours);
  return {
    hours,
    soundPeople: headcountOf(quote.soundPeople),
    soundHours: hoursOf(quote.soundHours) || hours,
    securityPeople: headcountOf(quote.securityPeople),
    securityHours: hoursOf(quote.securityHours) || hours,
    cleaning: quote.cleaning !== 0 && quote.cleaning !== false,
    deposit: (quote.refundableDeposit ?? quote.deposit) !== 0 && quote.deposit !== false,
  };
}
