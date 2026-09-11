// =============================================================================
// cashapp-statement — read the church's Cash App history as GIVING, not as noise
// =============================================================================
// Spoken into this app on 2026-09-11 by the Love Corner finance steward and the
// church office, in a requirements meeting that found its own answer out loud:
//
//   "If you got person a, b, c, and let's just say they totaled a thousand
//    dollars -- instead of doing this person, this person, this person, you
//    could just transfer the whole thousand dollars, and then on your
//    statement, it's gonna tell you every person and what they gave."
//
//   "Unless you care about the specific dates and times that they gave it to
//    you. It tells you that too."
//
//   "Each month it tells you the date, it tells you the person, and if you have
//    a description it tells you that, and then it tells you the amount."
//
// And the cost of not having this, in the steward's own words: *"the transfer,
// put it in Excel, then put it in my other report, then create the reports for
// the end of the month."* Three re-keyings of numbers that were already
// itemized in a file. Every re-keying is a chance to put a gift on the wrong
// person -- which for a church is not a rounding error, it is someone's giving
// record. Darrell's frame for the whole build: *"we can program it like a
// calculator, have it hardened like that. Now who gonna say a calculator
// messed up?"*
//
// SO WHAT THIS FILE IS: the read half. One Cash App export becomes typed,
// classified rows in integer cents, with EVERY source row either accepted or
// rejected with a named reason. The split half (one bank deposit back into N
// named gifts) is lib/giving-batch.js.
//
// THREE THINGS IT REFUSES TO DO
//
//   1. It never invents a giver. A Cash App display name is a string a sender
//      chose, not a person in the church directory. This file carries the name
//      VERBATIM as `giver` and stops; proposing who that is belongs to
//      lib/giving-donor-match.js, which proposes and never decides.
//   2. It never silently drops a row. A statement holds more than gifts --
//      cash-outs to the bank, top-ups, refunds, fees, money sent to someone.
//      Each is classified into its own kind and counted. An unrecognised row
//      becomes kind 'other' and is still counted, never dropped, because a
//      dropped row is a missing gift and nobody would ever see it go.
//      Silent loss is the one failure this module exists to make impossible.
//   3. It never treats every inflow as a gift. A top-up from the church's own
//      bank into Cash App is the church's own money arriving, and counting it
//      as giving would inflate what the congregation gave. Transfers are the
//      church's money changing pockets -- the same rule imported-view.js
//      already applies to the family's books.
//
// THE FORMAT IS HEADER-DRIVEN, AND ITS EXACT SPELLING IS NOT YET VERIFIED.
//   Cash App's export has been read here from its documented column set, not
//   from one of the church's own files (nobody has handed one over yet -- it
//   was offered in the meeting and not opened). So this reads by HEADER NAME
//   with synonyms, never by column position; it reports exactly which roles it
//   mapped; and `parseCashAppStatement` returns `recognized: false` with the
//   headers it actually saw when the required ones are absent, instead of
//   guessing and producing confident wrong numbers. The first real export
//   either passes straight through or names the mismatch in one line. That is
//   the honest shape for a format we have documentation for and no sample of
//   (DR-0076 section 8: provenance and honest uncertainty).
//
// Pure: no network, no DOM, no storage. Integer cents throughout -- a giving
// total computed in floats is a giving total that is wrong in the fourth month.
// =============================================================================

// ---------------------------------------------------------------------------
// Money. Signed, unlike giving-records' parseAmountCents
// ---------------------------------------------------------------------------
// giving-records.parseAmountCents is deliberately positive-only: a person
// typing their own gift cannot have given zero or a negative amount, and it
// returns null rather than 0 so "didn't say" never reads as "gave nothing".
// A STATEMENT LINE has the opposite contract -- it is signed by nature (a
// cash-out is money leaving) and zero is a real value a fee column prints. So
// this is a second parser on purpose, not duplication by accident.
export function parseSignedCents(input) {
  if (input == null || input === '') return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.round(input * 100) : null;
  }
  let s = String(input).trim();
  if (!s) return null;
  let negative = false;
  // Accounting parentheses, a trailing minus, and a leading minus all mean the
  // same thing and all three appear in real exports.
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (/-\s*$/.test(s)) { negative = true; s = s.replace(/-\s*$/, ''); }
  if (/^\s*-/.test(s)) { negative = true; s = s.replace(/^\s*-/, ''); }
  s = s.replace(/[$,\s]/g, '');
  if (s === '' || s === '.' || !/^\d*\.?\d*$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return negative ? -cents : cents;
}

// ---------------------------------------------------------------------------
// Dates AND times -- the steward asked for both
// ---------------------------------------------------------------------------
// "Unless you care about the specific dates and times that they gave it to
// you. It tells you that too." So the time is kept, as printed, and never
// converted: a statement's clock is the record, and a timezone shift can move
// a late-evening gift into the next day and out of the month it belongs to.
const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function parseStatementMoment(raw) {
  const s = String(raw || '').trim();
  if (!s) return { date: null, time: null, raw: '' };

  let date = null;
  let time = null;

  const t = s.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?/i);
  if (t) {
    let hh = Number(t[1]);
    const mm = t[2];
    const ap = (t[3] || '').toLowerCase().replace(/\./g, '');
    if (ap === 'pm' && hh < 12) hh += 12;
    if (ap === 'am' && hh === 12) hh = 0;
    if (hh >= 0 && hh <= 23) time = `${String(hh).padStart(2, '0')}:${mm}`;
  }

  const iso = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    date = `${iso[1]}-${iso[2]}-${iso[3]}`;
  } else {
    const slash = s.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})\b/);
    if (slash) {
      const mo = Number(slash[1]);
      const da = Number(slash[2]);
      let yr = Number(slash[3]);
      if (yr < 100) yr += 2000;
      if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
        date = `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
      }
    } else {
      // "Aug 31, 2026" / "31 Aug 2026"
      const named = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/)
        || s.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/);
      if (named) {
        const isMonthFirst = Number.isNaN(Number(named[1]));
        const monthWord = (isMonthFirst ? named[1] : named[2]).slice(0, 3).toLowerCase();
        const dayNum = Number(isMonthFirst ? named[2] : named[1]);
        const mo = MONTHS[monthWord];
        if (mo && dayNum >= 1 && dayNum <= 31) {
          date = `${named[3]}-${String(mo).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        }
      }
    }
  }
  return { date, time, raw: s };
}

// ---------------------------------------------------------------------------
// Columns, by name
// ---------------------------------------------------------------------------
const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The roles this reader needs. `date` and `amount` are required; without them
 * there is no gift. Everything else sharpens the record when present.
 */
export const REQUIRED_ROLES = ['date', 'amount'];

// Longest-first inside a role, so "net amount" beats "amount" when both exist.
// The counterparty role is the one a bank statement has no concept of and the
// whole feature turns on: a bank shows one deposit, this column shows WHO.
export const CASHAPP_ROLE_WORDS = {
  txnId: ['transaction id', 'identifier', 'payment id', 'transaction'],
  date: ['date time', 'datetime', 'date and time', 'transaction date', 'date'],
  type: ['transaction type', 'type'],
  status: ['status'],
  amount: ['amount'],
  fee: ['fee', 'fees'],
  netAmount: ['net amount', 'net'],
  note: ['notes', 'note', 'description', 'memo', 'for'],
  counterparty: [
    'name of sender receiver', 'name of sender', 'name of receiver',
    'sender receiver', 'sender', 'receiver', 'counterparty', 'from', 'name',
  ],
  currency: ['currency'],
  account: ['account', 'destination', 'source'],
};

export const CASHAPP_ROLES = Object.keys(CASHAPP_ROLE_WORDS);

/**
 * Map header cells onto roles by NAME. Never by position: a bank that adds a
 * column in the middle would shift every field and the numbers would still
 * look plausible, which is the worst kind of wrong.
 *
 * @returns {{ [role: string]: number }} only the roles actually present
 */
export function mapCashAppColumns(headerCells = []) {
  const cells = (headerCells || []).map(norm);
  const out = {};
  const taken = new Set();
  for (const role of CASHAPP_ROLES) {
    let best = null;
    for (const word of CASHAPP_ROLE_WORDS[role]) {
      for (let i = 0; i < cells.length; i += 1) {
        if (!cells[i] || taken.has(i)) continue;
        if (cells[i] === word) { best = { i, len: word.length, exact: true }; break; }
        if ((!best || !best.exact) && cells[i].includes(word) && (!best || word.length > best.len)) {
          best = { i, len: word.length, exact: false };
        }
      }
      if (best && best.exact) break;
    }
    if (best) { out[role] = best.i; taken.add(best.i); }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Row kinds, and why each one exists
// ---------------------------------------------------------------------------
export const KIND = {
  // Money a person sent the church. THE gift. The only kind that becomes giving.
  GIFT: 'gift',
  // Cash App -> the church's bank. This is the lump the bank shows as ONE
  // deposit, and the row the split reconciles a batch of gifts against.
  PAYOUT: 'payout',
  // The church's bank -> Cash App. The church's own money arriving; counting
  // it as giving would inflate what the congregation gave.
  TOPUP: 'topup',
  // The church sent money out to a person. A disbursement, never giving.
  SENT: 'sent',
  // A reversal. Real, and it must reduce a giving total rather than vanish.
  REFUND: 'refund',
  // A standalone fee line (Cash App also reports fees inline on a row).
  FEE: 'fee',
  // Recognised, classified as nothing above. COUNTED and surfaced so a human
  // decides, because the alternative is a dropped gift nobody sees go.
  OTHER: 'other',
};

export const REJECT = {
  BLANK: 'blank-row',
  HEADER: 'repeated-header',
  SUBTOTAL: 'subtotal-or-separator',
  NO_DATE: 'unparseable-date',
  NO_AMOUNT: 'unparseable-amount',
  NOT_USD: 'not-a-dollar-amount',
  NOT_COMPLETE: 'not-a-completed-transaction',
};

// Type wording, by what it means rather than by one vendor spelling.
const TYPE_RULES = [
  { kind: KIND.PAYOUT, re: /cash\s*out|transfer\s*(out|to\s*bank)|withdraw/i },
  { kind: KIND.TOPUP, re: /cash\s*in|add\s*cash|top\s*up|deposit\s*from/i },
  { kind: KIND.REFUND, re: /refund|reversal|returned|chargeback|dispute/i },
  { kind: KIND.FEE, re: /^\s*fee\b|service\s*fee|instant\s*(deposit\s*)?fee/i },
  { kind: KIND.GIFT, re: /payment\s*received|received\s*payment|receive/i },
  { kind: KIND.SENT, re: /sent\s*payment|payment\s*sent|sent\b|card\s*(debit|purchase)|bitcoin|stock/i },
];

/**
 * Classify one row's kind from its type wording, with the amount's SIGN as the
 * tiebreaker. Wording wins when it is unambiguous (a refund is a refund
 * whichever way the money went); sign decides when the wording says nothing,
 * because every export agrees that money in is positive.
 */
export function classifyKind(typeText, cents) {
  const t = String(typeText || '');
  for (const rule of TYPE_RULES) {
    if (rule.re.test(t)) {
      // "Cash out" wording with money ARRIVING is contradictory -- trust
      // neither silently; fall through to the sign and let it read as a gift
      // or a send, which a human can see and correct.
      if (rule.kind === KIND.PAYOUT && cents > 0) break;
      if (rule.kind === KIND.TOPUP && cents < 0) break;
      return rule.kind;
    }
  }
  if (cents == null) return KIND.OTHER;
  if (cents > 0) return KIND.GIFT;
  if (cents < 0) return KIND.SENT;
  return KIND.OTHER;
}

const isBlankRow = (cells) => !cells || cells.every((c) => String(c == null ? '' : c).trim() === '');

function looksLikeRepeatedHeader(cells, headerSig) {
  if (!headerSig) return false;
  return cells.map(norm).filter(Boolean).join('|') === headerSig;
}

function looksLikeSubtotal(cells) {
  const nonEmpty = (cells || []).filter((c) => String(c == null ? '' : c).trim() !== '');
  if (nonEmpty.length !== 1) return false;
  return /total|subtotal|balance|summary|ending|beginning|^-+$|^=+$/i.test(String(nonEmpty[0]));
}

/**
 * Read a Cash App export into typed rows.
 *
 * @param {object} input
 * @param {string[]} input.header  the header cells
 * @param {Array<string[]>} input.rows  the data rows (cell arrays), header excluded
 * @returns {{
 *   recognized: boolean,
 *   columns: object,
 *   mappedRoles: string[],
 *   missingRoles: string[],
 *   headerSeen: string[],
 *   rows: object[],
 *   rejected: Array<{ index: number, reason: string, raw: string[] }>,
 *   reconciliation: { sourceRows: number, accepted: number, rejected: number, balanced: boolean },
 *   byKind: object
 * }}
 */
export function parseCashAppStatement({ header = [], rows = [] } = {}) {
  const columns = mapCashAppColumns(header);
  const mappedRoles = Object.keys(columns);
  const missingRoles = REQUIRED_ROLES.filter((r) => columns[r] == null);
  const headerSeen = (header || []).map((c) => String(c == null ? '' : c));

  // A layout we cannot read WHEN and HOW MUCH from is not a statement we may
  // guess at. Say so, hand back the headers we actually saw, and read nothing.
  if (missingRoles.length) {
    return {
      recognized: false,
      columns,
      mappedRoles,
      missingRoles,
      headerSeen,
      rows: [],
      rejected: [],
      reconciliation: { sourceRows: (rows || []).length, accepted: 0, rejected: 0, balanced: false },
      byKind: {},
    };
  }

  const headerSig = headerSeen.map(norm).filter(Boolean).join('|');
  const at = (cells, role) => (columns[role] == null ? '' : cells[columns[role]]);

  const out = [];
  const rejected = [];

  (rows || []).forEach((cells, index) => {
    const push = (reason) => rejected.push({ index, reason, raw: (cells || []).map((c) => String(c == null ? '' : c)) });

    if (isBlankRow(cells)) { push(REJECT.BLANK); return; }
    if (looksLikeRepeatedHeader(cells, headerSig)) { push(REJECT.HEADER); return; }
    if (looksLikeSubtotal(cells)) { push(REJECT.SUBTOTAL); return; }

    const moment = parseStatementMoment(at(cells, 'date'));
    if (!moment.date) { push(REJECT.NO_DATE); return; }

    const grossCents = parseSignedCents(at(cells, 'amount'));
    if (grossCents == null) { push(REJECT.NO_AMOUNT); return; }

    // A currency column that says anything other than dollars is a row this
    // reader must not fold into a dollar total. Absent column = dollars.
    const currency = String(at(cells, 'currency') || '').trim();
    if (currency && !/^usd$|^\$$|^us dollar/i.test(currency)) { push(REJECT.NOT_USD); return; }

    // A pending / failed / cancelled row is not money that arrived. Counting
    // it would put a gift on a giving statement that never landed.
    const status = String(at(cells, 'status') || '').trim();
    if (status && /pend|fail|cancel|declin|expir/i.test(status)) { push(REJECT.NOT_COMPLETE); return; }

    // Fee is reported as a cost, and exports differ on its sign. Its MAGNITUDE
    // is what we owe the processor, so normalise and keep the sign question out
    // of every downstream sum.
    const feeRaw = parseSignedCents(at(cells, 'fee'));
    const feeCents = feeRaw == null ? 0 : Math.abs(feeRaw);
    const netParsed = parseSignedCents(at(cells, 'netAmount'));

    const typeText = String(at(cells, 'type') || '');
    const kind = classifyKind(typeText, grossCents);

    out.push({
      index,
      kind,
      typeText,
      status,
      txnId: String(at(cells, 'txnId') || '').trim(),
      date: moment.date,
      time: moment.time,
      momentRaw: moment.raw,
      // `giver` is the sender's own display name, VERBATIM. Not a person.
      giver: String(at(cells, 'counterparty') || '').trim(),
      note: String(at(cells, 'note') || '').trim(),
      grossCents,
      feeCents,
      // Net is what actually moved. Prefer the statement's own figure when it
      // printed one -- the processor's arithmetic is the record, not ours.
      netCents: netParsed == null ? grossCents - (grossCents > 0 ? feeCents : -feeCents) : netParsed,
      account: String(at(cells, 'account') || '').trim(),
    });
  });

  const byKind = {};
  for (const r of out) {
    if (!byKind[r.kind]) byKind[r.kind] = { kind: r.kind, count: 0, grossCents: 0, feeCents: 0, netCents: 0 };
    byKind[r.kind].count += 1;
    byKind[r.kind].grossCents += r.grossCents;
    byKind[r.kind].feeCents += r.feeCents;
    byKind[r.kind].netCents += r.netCents;
  }

  const sourceRows = (rows || []).length;
  return {
    recognized: true,
    columns,
    mappedRoles,
    missingRoles,
    headerSeen,
    rows: out,
    rejected,
    // THE GATE. accepted + rejected must equal the source, or the read lost a
    // row and must not be trusted (ingest-reconcile's promise, applied here).
    reconciliation: {
      sourceRows,
      accepted: out.length,
      rejected: rejected.length,
      balanced: out.length + rejected.length === sourceRows,
    },
    byKind,
  };
}

/** The gift rows only, oldest first -- the order a giving statement reads in. */
export function giftsOf(parsed) {
  const rows = (parsed && parsed.rows) || [];
  return rows
    .filter((r) => r.kind === KIND.GIFT)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index));
}

/** The payouts to the bank, oldest first -- the deposits a batch ties to. */
export function payoutsOf(parsed) {
  const rows = (parsed && parsed.rows) || [];
  return rows
    .filter((r) => r.kind === KIND.PAYOUT)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index));
}

export default { parseCashAppStatement, giftsOf, payoutsOf, classifyKind, parseSignedCents, parseStatementMoment, KIND, REJECT };
