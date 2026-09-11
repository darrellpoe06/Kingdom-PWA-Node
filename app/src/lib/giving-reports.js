// =============================================================================
// giving-reports — the reports the steward stopped building by hand
// =============================================================================
// The whole cost this replaces, in the finance steward's own words, 2026-09-11:
//
//   "the transfer, put it in Excel, then put it in my other report, then
//    create the reports for the end of the month."
//
// Three re-keyings of figures that were already itemized in a file she already
// has. And Darrell's target state, same meeting: *"the goal is to make it so
// that you don't have to do no report. It's already there. You can go look at
// the reports."*
//
// So these are models, not rendered output: `{ title, meta, columns, groups,
// total, note }` -- the same shape finance-reports.js uses, so one surface and
// one CSV export can serve both the family's books and the church's giving
// without a second renderer.
//
// FOUR RULES THIS FILE WILL NOT BEND
//
//   1. Subtotals tie to the total, always. A giving report whose parts do not
//      add up to its total is not a report, it is a rumour. Tested directly.
//   2. An unidentified giver is a NAMED ROW, never a dropped one and never
//      folded into someone else. "Bobby J." who has not been confirmed appears
//      as himself, marked unconfirmed, with his money still in the total. The
//      failure mode this exists to prevent is a gift silently landing on the
//      wrong member's statement (DR-0076: never under-claim either).
//   3. Every report states how much of itself is unconfirmed. A steward must
//      never sign a month off believing it is settled when 8 of 30 gifts are
//      still proposals. The number is on the report, not in a footnote
//      somewhere else.
//   4. A per-person statement says what it IS. A record assembled from a
//      processor export is not the same document as a church-issued tax
//      statement, and it says so on its face -- the same honesty
//      giving-records.js already prints on a giver's own CSV.
//
// Pure: integer cents, no I/O, no DOM.
// =============================================================================

export const GIVING_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'time', label: 'Time', type: 'text' },
  { key: 'giver', label: 'Giver', type: 'text' },
  { key: 'note', label: 'Note', type: 'text' },
  { key: 'method', label: 'How', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'money', align: 'right' },
];

export const UNIDENTIFIED_LABEL = 'Not yet identified';

/** What a per-person record assembled from a processor export actually is. */
export const REPORT_PROVENANCE =
  'Assembled from the church’s own Cash App transaction history. Each line is a payment the processor recorded, with the sender name as the sender wrote it. This is a working record for the church office — not a church-issued tax statement.';

const centsOf = (c) => (c && typeof c.amountClaimedCents === 'number' ? c.amountClaimedCents : 0);

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(String(s).length === 10 ? `${s}T00:00:00` : String(s));
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function monthKeyOf(date) {
  const s = String(date || '');
  return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : 'undated';
}

function monthLabelOf(key) {
  if (key === 'undated') return 'Undated';
  const d = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * The display name for a claim: the confirmed member when the office has said
 * so, otherwise the sender's own words, marked. Never a guess presented as a
 * fact -- a high-confidence PROPOSAL is still shown as the raw name, because a
 * proposal rendered as a name is how a wrong attribution becomes invisible.
 */
export function giverLabel(claim, directory = {}) {
  const confirmedId = claim && claim.parishionerId;
  if (confirmedId && directory[String(confirmedId)]) return directory[String(confirmedId)];
  const raw = (claim && claim.giverName) || '';
  return raw ? `${raw} (${UNIDENTIFIED_LABEL.toLowerCase()})` : UNIDENTIFIED_LABEL;
}

function toRow(claim, directory) {
  return {
    date: fmtDate(claim.givenOn),
    time: claim.givenAt || '',
    giver: giverLabel(claim, directory),
    note: claim.note || '',
    method: 'Cash App',
    amountCents: centsOf(claim),
    _claim: claim,
  };
}

function subtotal(rows) {
  let cents = 0;
  for (const r of rows) cents += r.amountCents || 0;
  return { cents, count: rows.length };
}

/**
 * How much of this report is still a proposal rather than a confirmation. On
 * every model, so nobody signs off on a month believing it is settled.
 */
export function confirmationState(claims = []) {
  const list = claims || [];
  let confirmedCents = 0;
  let unconfirmedCents = 0;
  let confirmed = 0;
  let unconfirmed = 0;
  let ambiguous = 0;
  for (const c of list) {
    if (c.parishionerId) { confirmed += 1; confirmedCents += centsOf(c); continue; }
    unconfirmed += 1;
    unconfirmedCents += centsOf(c);
    if (c.proposal && c.proposal.ambiguous) ambiguous += 1;
  }
  return {
    total: list.length,
    confirmed,
    unconfirmed,
    ambiguous,
    confirmedCents,
    unconfirmedCents,
    settled: unconfirmed === 0,
  };
}

function noteFor(state) {
  if (state.settled) return `All ${state.total} gift${state.total === 1 ? '' : 's'} are confirmed to a member.`;
  return `${state.unconfirmed} of ${state.total} gift${state.total === 1 ? '' : 's'} (${money(state.unconfirmedCents)}) are NOT yet confirmed to a member and are shown under the name the sender used. This report is not final until they are confirmed.`;
}

/**
 * Month by month, newest month first -- the month-end report, built.
 *
 * @param {object[]} claims  claims from giving-batch (optionally with proposals)
 * @param {object} [opts]
 * @param {object} [opts.directory]  { parishionerId: displayName }
 * @param {object} [opts.meta]
 */
export function givingByMonthReport(claims = [], opts = {}) {
  const directory = opts.directory || {};
  const list = (claims || []).slice().sort((a, b) => String(b.givenOn || '').localeCompare(String(a.givenOn || '')));
  const map = new Map();
  for (const c of list) {
    const key = monthKeyOf(c.givenOn);
    if (!map.has(key)) map.set(key, { key, label: monthLabelOf(key), rows: [] });
    map.get(key).rows.push(toRow(c, directory));
  }
  const groups = [...map.values()].map((g) => ({ label: g.label, key: g.key, rows: g.rows, subtotal: subtotal(g.rows) }));
  const state = confirmationState(list);
  return {
    title: 'Giving by month',
    meta: opts.meta || {},
    columns: GIVING_COLUMNS,
    groups,
    total: subtotal(groups.flatMap((g) => g.rows)),
    confirmation: state,
    note: noteFor(state),
    provenance: REPORT_PROVENANCE,
  };
}

/**
 * Who gave, and how much -- largest first. The view the steward opens when
 * someone asks "what did we receive from the Coleman family this year?"
 *
 * Grouping is by CONFIRMED member where one exists, and by the raw sender name
 * otherwise. Two unconfirmed spellings of the same person therefore stay
 * apart, which is correct: merging them would be the app deciding an identity
 * nobody confirmed.
 */
export function givingByGiverReport(claims = [], opts = {}) {
  const directory = opts.directory || {};
  const map = new Map();
  for (const c of claims || []) {
    const key = c.parishionerId ? `id:${c.parishionerId}` : `raw:${(c.giverName || '').trim().toLowerCase()}`;
    if (!map.has(key)) map.set(key, { key, label: giverLabel(c, directory), rows: [], confirmed: !!c.parishionerId });
    map.get(key).rows.push(toRow(c, directory));
  }
  const groups = [...map.values()].map((g) => ({
    label: g.label, key: g.key, confirmed: g.confirmed, rows: g.rows, subtotal: subtotal(g.rows),
  }));
  // Biggest giving first, then most gifts, then label -- deterministic.
  groups.sort((a, b) => b.subtotal.cents - a.subtotal.cents
    || b.subtotal.count - a.subtotal.count
    || String(a.label).localeCompare(String(b.label)));
  const state = confirmationState(claims || []);
  return {
    title: 'Giving by giver',
    meta: opts.meta || {},
    columns: GIVING_COLUMNS,
    groups,
    total: subtotal(groups.flatMap((g) => g.rows)),
    confirmation: state,
    note: noteFor(state),
    provenance: REPORT_PROVENANCE,
  };
}

/**
 * One person's record: every gift, in date order, with the time and the note.
 * "Unless you care about the specific dates and times that they gave it to
 * you. It tells you that too." -- so it does.
 */
export function giverStatement(claims = [], { parishionerId = null, giverName = null, directory = {}, meta = {} } = {}) {
  const want = parishionerId ? String(parishionerId) : null;
  const wantName = giverName ? String(giverName).trim().toLowerCase() : null;
  const mine = (claims || []).filter((c) => (want
    ? String(c.parishionerId || '') === want
    : (c.giverName || '').trim().toLowerCase() === wantName));

  const rows = mine
    .slice()
    .sort((a, b) => String(a.givenOn || '').localeCompare(String(b.givenOn || ''))
      || String(a.givenAt || '').localeCompare(String(b.givenAt || '')))
    .map((c) => toRow(c, directory));

  const label = rows.length ? rows[0].giver : (giverName || UNIDENTIFIED_LABEL);
  const state = confirmationState(mine);
  return {
    title: `Giving record — ${label}`,
    meta,
    columns: GIVING_COLUMNS,
    groups: [{ label, rows, subtotal: subtotal(rows) }],
    total: subtotal(rows),
    confirmation: state,
    note: state.settled
      ? 'Every gift on this record is confirmed to this member.'
      : 'This record is assembled from the sender name used on the payment and has not been confirmed against the church directory.',
    provenance: REPORT_PROVENANCE,
  };
}

/**
 * Every deposit and whether it ties -- the page a steward reads before signing
 * a month off, and the one Darrell described as the end of the argument: "no,
 * this is what you gave, this is what you did, this is everything, all steps."
 */
export function batchReconciliationReport(batches = [], opts = {}) {
  const rows = (batches || []).map((b) => ({
    date: fmtDate(b.batch.payoutOn || b.batch.serviceDate),
    batchId: b.batch.onlineBatchId || '(no transfer id)',
    gifts: b.claims.length,
    giftsCents: b.reconciliation.giftsNetCents,
    depositCents: b.reconciliation.depositCents,
    differenceCents: b.reconciliation.differenceCents,
    status: b.reconciliation.status,
    balanced: b.reconciliation.balanced,
    explanation: b.reconciliation.explanation,
  }));
  const unbalanced = rows.filter((r) => !r.balanced && r.depositCents != null);
  return {
    title: 'Deposits and what they were made of',
    meta: opts.meta || {},
    columns: [
      { key: 'date', label: 'Transfer date', type: 'date' },
      { key: 'batchId', label: 'Transfer id', type: 'text' },
      { key: 'gifts', label: 'Gifts', type: 'number', align: 'right' },
      { key: 'giftsCents', label: 'Gifts total', type: 'money', align: 'right' },
      { key: 'depositCents', label: 'Bank deposit', type: 'money', align: 'right' },
      { key: 'differenceCents', label: 'Difference', type: 'money', align: 'right' },
    ],
    rows,
    allBalanced: unbalanced.length === 0,
    unbalanced: unbalanced.length,
    note: unbalanced.length
      ? `${unbalanced.length} deposit${unbalanced.length === 1 ? '' : 's'} do NOT match the gifts recorded against them. Nothing has been adjusted — the difference is shown so it can be found.`
      : 'Every deposit is fully accounted for by the gifts recorded against it.',
    provenance: REPORT_PROVENANCE,
  };
}

/** Rows -> CSV, with a trailing total and the provenance line. */
export function reportToCsv(model) {
  const cols = model.columns || [];
  const esc = (v) => {
    const s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cell = (row, c) => {
    if (c.type === 'money') {
      const cents = c.key === 'amount' ? row.amountCents : row[c.key];
      return cents == null ? '' : (Math.round(cents) / 100).toFixed(2);
    }
    return row[c.key];
  };
  const lines = [cols.map((c) => esc(c.label)).join(',')];
  const groups = model.groups || (model.rows ? [{ label: '', rows: model.rows }] : []);
  for (const g of groups) {
    if (g.label && groups.length > 1) lines.push(esc(g.label));
    for (const r of g.rows) lines.push(cols.map((c) => esc(cell(r, c))).join(','));
    if (g.subtotal && groups.length > 1) {
      lines.push(`${esc(`Subtotal ${g.label}`)}${','.repeat(Math.max(0, cols.length - 2))},${(g.subtotal.cents / 100).toFixed(2)}`);
    }
  }
  if (model.total) {
    lines.push(`${esc('Total')}${','.repeat(Math.max(0, cols.length - 2))},${(model.total.cents / 100).toFixed(2)}`);
  }
  if (model.note) lines.push('', esc(model.note));
  if (model.provenance) lines.push(esc(model.provenance));
  return lines.join('\n');
}

function money(cents) {
  const v = Math.round(Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

export default {
  givingByMonthReport, givingByGiverReport, giverStatement,
  batchReconciliationReport, reportToCsv, confirmationState, giverLabel,
  GIVING_COLUMNS, REPORT_PROVENANCE,
};
