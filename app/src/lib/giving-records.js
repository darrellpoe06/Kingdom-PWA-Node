// =============================================================================
// giving-records — the parishioner's OWN record of tithes, offerings and gifts.
// =============================================================================
// PURE (no React, no network). giving-records-sync.js does the Supabase I/O;
// ChurchGiving.jsx renders. Everything load-bearing lives here so it is unit-
// testable without a browser or a database (Verification Doctrine, DR-0076).
//
// THE PREMISE, CARRIED IN THE CODE (same words as migration 0184). This app
// never touches payment data — the binding link-safety rule in lib/giving.js
// means the Give surface only OPENS the church's own published channels. So
// this history is NOT a processor feed and is never dressed as one: it is the
// giver's own ledger of gifts they made, entered by them. RECORD_PROVENANCE
// below is the one-line honest statement the surface is required to show, so a
// member can never mistake their own log for a church-issued statement.
//
// MONEY IS NEVER A FLOAT. Amounts round-trip through integer cents for every
// sum, so a year total can never drift by a half-penny across many gifts.
// =============================================================================

// The honest provenance line the surface MUST render beside any total.
export const RECORD_PROVENANCE =
  'This is your own record of what you gave — kept by you, private to you. The church’s official contribution statement comes from the church office.';

// Matthew 6:3-4 is why this ledger is owner-only. Stated on the surface so the
// privacy is read as doctrine, not as a settings default someone might widen.
export const RECORD_PRIVACY = {
  ref: 'Matthew 6:3-4',
  translation: 'ESV',
  text: 'But when you give to the needy, do not let your left hand know what your right hand is doing, so that your giving may be in secret. And your Father who sees in secret will reward you.',
  note: 'Your giving record is visible to you alone. No church admin, and no one else on this app, can read it.',
};

// The funds a gift can be designated to. `tithe` and `offering` lead because
// they are the two the Word names most plainly; the rest are the ordinary
// designations a congregation actually uses. `other` carries the giver's own
// words in fundNote so we never force a real gift into a wrong bucket.
export const GIVING_FUNDS = [
  { id: 'tithe',       label: 'Tithe',            blurb: 'The 10% baseline of stewardship (Malachi 3:10).' },
  { id: 'offering',    label: 'Offering',         blurb: 'Given above the tithe, as you decided in your heart (2 Corinthians 9:7).' },
  { id: 'gift',        label: 'Gift',             blurb: 'A gift to the church or its work.' },
  { id: 'building',    label: 'Building fund',    blurb: 'Toward the house itself — repair, expansion, upkeep.' },
  { id: 'missions',    label: 'Missions',         blurb: 'Toward the work sent out beyond the house.' },
  { id: 'benevolence', label: 'Benevolence',      blurb: 'Toward the needs of the saints (Romans 12:13).' },
  { id: 'other',       label: 'Other',            blurb: 'Name it yourself — your words are kept exactly.' },
];

// How the gift was actually sent. The first four mirror the church's own
// published channels (GIVING_CHANNELS, lib/giving.js) by id, so a member who
// tapped a channel here can record it with the same name they just used.
export const GIVING_METHODS = [
  { id: 'zelle',    label: 'Zelle' },
  { id: 'cashapp',  label: 'Cash App' },
  { id: 'givelify', label: 'Givelify' },
  { id: 'paypal',   label: 'PayPal' },
  { id: 'cash',     label: 'Cash' },
  { id: 'check',    label: 'Check' },
  { id: 'bank',     label: 'Bank transfer' },
  { id: 'other',    label: 'Other' },
];

export const DEFAULT_FUND = 'tithe';
export const DEFAULT_METHOD = 'other';

const FUND_IDS = new Set(GIVING_FUNDS.map((f) => f.id));
const METHOD_IDS = new Set(GIVING_METHODS.map((m) => m.id));

export function fundLabel(id) {
  const f = GIVING_FUNDS.find((x) => x.id === id);
  return f ? f.label : 'Other';
}
export function methodLabel(id) {
  const m = GIVING_METHODS.find((x) => x.id === id);
  return m ? m.label : 'Other';
}

// --- Money -------------------------------------------------------------------
// parseAmountCents — accepts what a person actually types ("50", "$50", "1,250.75",
// " 20.5 ") and returns integer cents, or null when it is not a real amount.
// Returns null (never 0) for unusable input: 0 is a real number and would read
// as "gave nothing," which is not the same as "didn't say."
export function parseAmountCents(input) {
  if (input == null) return null;
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null;
    const cents = Math.round(input * 100);
    return cents > 0 ? cents : null;
  }
  const cleaned = String(input).replace(/[$,\s]/g, '');
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return cents > 0 ? cents : null;
}

export function centsToAmount(cents) {
  return Math.round(Number(cents) || 0) / 100;
}

// formatMoney — USD, always two decimals. Falls back to a hand-rolled format if
// Intl is unavailable so a total never renders as "undefined" on an old device.
export function formatMoney(cents) {
  const value = centsToAmount(cents);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

// --- Validation --------------------------------------------------------------
// validateGivingDraft — every reason a gift cannot be recorded, named per field.
// A draft is only ok when it carries a real amount, a real date that is not in
// the future (you cannot have already given tomorrow), and a known fund.
export function validateGivingDraft(draft, { today } = {}) {
  const errors = {};
  const d = draft || {};

  const cents = parseAmountCents(d.amount);
  if (cents == null) errors.amount = 'Enter the amount you gave — more than $0.';

  const given = String(d.givenOn || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(given)) {
    errors.givenOn = 'Pick the day you gave.';
  } else {
    const todayStr = today || localToday();
    if (given > todayStr) errors.givenOn = 'That day hasn’t come yet — pick the day you actually gave.';
  }

  const fund = String(d.fund || '').trim();
  if (!FUND_IDS.has(fund)) errors.fund = 'Choose what this gift was for.';
  else if (fund === 'other' && !String(d.fundNote || '').trim()) {
    errors.fundNote = 'Name this gift in your own words.';
  }

  const method = String(d.method || DEFAULT_METHOD).trim();
  if (!METHOD_IDS.has(method)) errors.method = 'Choose how you gave.';

  return { ok: Object.keys(errors).length === 0, errors, cents };
}

// localToday — the giver's own calendar day as YYYY-MM-DD. Built from local
// date parts, NOT toISOString(), which would hand back the UTC day and put a
// 7pm Sunday gift on Monday for anyone west of Greenwich.
export function localToday(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// blankDraft — a fresh entry form, dated today, defaulted to the tithe.
export function blankDraft(today = localToday()) {
  return { amount: '', givenOn: today, fund: DEFAULT_FUND, fundNote: '', method: DEFAULT_METHOD, reference: '', note: '' };
}

// --- Shaping -----------------------------------------------------------------
export function toGivingRow(draft, { tenantId, userId, slug }) {
  const { cents } = validateGivingDraft(draft);
  return {
    instance_id: tenantId,
    created_by:  userId,
    slug,
    given_on:    draft.givenOn,
    amount:      centsToAmount(cents),
    fund:        draft.fund,
    fund_note:   String(draft.fundNote || '').trim(),
    method:      String(draft.method || DEFAULT_METHOD),
    reference:   String(draft.reference || '').trim(),
    note:        String(draft.note || '').trim(),
  };
}

export function fromGivingRow(row) {
  return {
    id:         row.slug || `give-remote-${row.id}`,
    remoteUuid: row.id,
    givenOn:    row.given_on,
    cents:      Math.round(Number(row.amount || 0) * 100),
    fund:       row.fund || 'other',
    fundNote:   row.fund_note || '',
    method:     row.method || 'other',
    reference:  row.reference || '',
    note:       row.note || '',
    createdAt:  row.created_at,
  };
}

// --- Summary -----------------------------------------------------------------
// yearsOf — the distinct years present in the record, newest first. Derived from
// the rows themselves, so the year picker can never offer a year with no gifts.
export function yearsOf(records) {
  const set = new Set((records || []).map((r) => String(r.givenOn || '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)));
  return [...set].sort().reverse();
}

export function recordsInYear(records, year) {
  if (!year || year === 'all') return records || [];
  return (records || []).filter((r) => String(r.givenOn || '').startsWith(String(year)));
}

// summarizeGiving — totals derived from the rows, never stored. Sums in integer
// cents so many small gifts cannot drift the year total. byFund keeps the
// GIVING_FUNDS display order and omits funds with no gifts (no painted zeros).
export function summarizeGiving(records) {
  const rows = records || [];
  const totalCents = rows.reduce((sum, r) => sum + (Math.round(Number(r.cents) || 0)), 0);
  const byFund = GIVING_FUNDS
    .map((f) => {
      const mine = rows.filter((r) => r.fund === f.id);
      return { id: f.id, label: f.label, count: mine.length, cents: mine.reduce((s, r) => s + (Math.round(Number(r.cents) || 0)), 0) };
    })
    .filter((f) => f.count > 0);
  const dates = rows.map((r) => r.givenOn).filter(Boolean).sort();
  return {
    count: rows.length,
    totalCents,
    byFund,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
  };
}

// sortByDateDesc — newest gift first; ties broken by createdAt so two gifts on
// the same day keep the order they were entered.
export function sortByDateDesc(records) {
  return [...(records || [])].sort((a, b) => {
    if (a.givenOn !== b.givenOn) return a.givenOn < b.givenOn ? 1 : -1;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

// newSlug — a client-stable id so an entry survives a retry without duplicating.
export function newSlug() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `give-${Date.now().toString(36)}-${rand}`;
}
