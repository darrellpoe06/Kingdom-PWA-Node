// =============================================================================
// giving-records — record a member's gift + plan a bulk spreadsheet import
// =============================================================================
// Darrell 2026-07-12: "Bulk add excel records and easy add cash money to a
// user's records." Two steward jobs the church does every week:
//   1. add ONE cash gift fast (a member hands cash on Sunday) — normalizeGift
//   2. import YEARS of giving from a spreadsheet, deduped — planGivingImport
//
// PURE + deterministic (no I/O, no network, NO money movement). This is
// BOOKKEEPING of gifts ALREADY RECEIVED — the app never processes payments
// (binding rule: money is the owner's hand). Backed by the donor_giving table
// (infra/supabase/schema-v2.7-church.sql: parishioner_id, gift_date, amount,
// fund, method, tax_year). The UI + sync rail that COMMIT these are steward-
// gated + Tier C; this engine is the shared, tested core both reuse.
//
// Mirrors bulk-statement-import.js: a pure PLAN ({ valid, invalid, duplicates,
// totalNew }); the caller shows the summary and commits. Dedupe makes a
// re-upload (or overlapping sheets) impossible to double-count — the church's
// annual statements must be right (DR-0076).
// =============================================================================

// The methods donor_giving accepts (schema CHECK constraint), cash first — the
// Sunday-plate default.
export const GIFT_METHODS = ['cash', 'check', 'online', 'ach', 'stock', 'in-kind', 'other'];

// Round to cents without float drift (2 -> "2.00" dollars-and-cents).
function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

// Normalize a gift DATE to YYYY-MM-DD from the shapes a spreadsheet or a form
// yields: an ISO/`YYYY-MM-DD` string, `MM/DD/YYYY`, or a Date. Returns '' when
// it cannot be trusted (never guesses a date onto a financial record).
export function normalizeGiftDate(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);            // ISO / YYYY-MM-DD
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);             // MM/DD/YYYY
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return '';
}

// Parse a money string/number to a positive amount, tolerating "$1,200.50".
export function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  return Number(String(value ?? '').replace(/[$,\s]/g, ''));
}

// Normalize + VALIDATE one gift (from the quick-add form OR one spreadsheet row).
// Returns { ok:true, gift } or { ok:false, errors:[...] }. A giver NAME is
// carried on the record; linking it to a parishioner_id (and the anonymous-
// offering reconciliation) is the church's existing giving_reconciliations step,
// not invented here.
export function normalizeGift(input = {}) {
  const errors = [];
  const member = String(input.member ?? input.name ?? '').trim();
  const amount = round2(parseAmount(input.amount));
  const date = normalizeGiftDate(input.date);
  const rawMethod = String(input.method ?? '').trim().toLowerCase();
  const method = rawMethod || 'cash';
  const fund = String(input.fund ?? '').trim() || 'General';
  const note = String(input.note ?? '').trim();

  if (!member) errors.push('a giver name is required');
  if (!Number.isFinite(amount) || amount <= 0) errors.push('amount must be a positive number');
  if (!date) errors.push('a valid gift date is required (YYYY-MM-DD or MM/DD/YYYY)');
  if (!GIFT_METHODS.includes(method)) errors.push(`method must be one of: ${GIFT_METHODS.join(', ')}`);

  if (errors.length) return { ok: false, errors };
  const taxYear = Number(date.slice(0, 4));
  return { ok: true, gift: { member, amount, date, method, fund, note, taxYear } };
}

// A stable dedupe key so the same gift can't land twice across a re-upload or
// overlapping sheets. Same giver + date + amount + fund + method = the same gift.
export function giftDedupeKey(g) {
  return [
    String(g.member || '').toLowerCase().trim(),
    g.date,
    round2(g.amount).toFixed(2),
    String(g.fund || 'General').toLowerCase().trim(),
    g.method,
  ].join('|');
}

// Plan a bulk import from already-parsed rows (the UI turns an .xlsx sheet into
// row objects via SheetJS, then hands them here). Returns:
//   { valid, invalid, duplicates, totalNew }
// - valid:      new, well-formed gifts ready to commit
// - invalid:    { row, index, errors } — reported, NEVER committed silently
// - duplicates: rows that match an existing gift or an earlier row in this batch
// existingGifts seeds the dedupe set so a second import can't double-count.
export function planGivingImport(rows = [], existingGifts = []) {
  const seen = new Set((existingGifts || []).map((g) => giftDedupeKey(g)));
  const valid = [];
  const invalid = [];
  const duplicates = [];
  (rows || []).forEach((row, index) => {
    const r = normalizeGift(row);
    if (!r.ok) { invalid.push({ row, index, errors: r.errors }); return; }
    const key = giftDedupeKey(r.gift);
    if (seen.has(key)) { duplicates.push({ ...r.gift, index }); return; }
    seen.add(key);
    valid.push(r.gift);
  });
  return { valid, invalid, duplicates, totalNew: valid.length };
}

// Best-effort column guesser so the steward doesn't hand-map every spreadsheet:
// given the header row, guess which columns are the giver/amount/date/fund/
// method. Returns a map { member, amount, date, fund, method } of header->field
// (only the ones it is confident about). The UI shows the guess and lets the
// steward correct it — never a silent mis-map onto money.
export function guessGivingColumns(headers = []) {
  const map = {};
  const want = {
    member: /(name|giver|donor|member|household|family)/i,
    amount: /(amount|amt|gift|total|sum|\$)/i,
    date: /(date|gift ?date|received|when)/i,
    fund: /(fund|designation|category|purpose)/i,
    method: /(method|type|payment|tender)/i,
  };
  for (const h of headers || []) {
    const header = String(h || '').trim();
    if (!header) continue;
    for (const [field, re] of Object.entries(want)) {
      if (!map[field] && re.test(header)) map[field] = header;
    }
  }
  return map;
}

// Turn already-parsed sheet rows (array of objects keyed by header) into the
// {member,amount,date,fund,method,note} shape normalizeGift expects, using a
// column map (from guessGivingColumns or the steward's correction).
export function mapSheetRows(rows = [], columnMap = {}) {
  const pick = (row, field) => (columnMap[field] ? row[columnMap[field]] : undefined);
  return (rows || []).map((row) => ({
    member: pick(row, 'member'),
    amount: pick(row, 'amount'),
    date: pick(row, 'date'),
    fund: pick(row, 'fund'),
    method: pick(row, 'method'),
    note: pick(row, 'note'),
  }));
}
