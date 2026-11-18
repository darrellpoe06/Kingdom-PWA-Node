// =============================================================================
// snapshot-rows — the transaction rows on a banking-app screenshot, read from
// the text OCR produced (Phase 1.3, 2026-11-17).
//
// Christina 2026-11-16: "The existing screenshot upload feature recognizes bank
// balances, but individual transactions are not consistently appearing in the
// Transactions section." Measured on the old reader (one line = date +
// description + amount, nothing else): it silently dropped "($12.00)", a
// Unicode minus, "Today" / "Yesterday", rows grouped under a date header and
// rows whose amount OCR put on its own line; it read "$-12.00" and "−12.00" as
// DEPOSITS; it took a trailing running balance as the amount; and it returned
// nothing at all until the screenshot's day was answered.
//
// The rules here:
//   · every money form a bank prints is read with its sign: -$12.00, $-12.00,
//     ($12.00), 12.00-, −12.00, +$12.00;
//   · two amounts at the end of a line are amount then running balance; the
//     balance is never taken as the amount;
//   · a row's day comes from the row ("11/04", "Nov 4", "Today", "Yesterday")
//     or from the date heading above it ("Monday, November 4");
//   · a description line followed by an amount-only line is one row;
//   · SIGNS ARE NEVER GUESSED. When the bank signs any row on the screen
//     (a minus, parentheses, a plus), its unsigned rows are money in: that is
//     how banking apps print deposits beside signed debits. When NOTHING on the
//     screen carries a sign, every row is marked signUnknown and a question is
//     asked before anything is written.
//   · Without the screenshot's day, rows are still read (dates left open) so
//     the review card can show them; nothing is written until the day is
//     answered.
// Pure: text in, rows out.
// =============================================================================
import { isOwnAccountTransfer } from './bill-review.js';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const WEEKDAY_RE = '(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*,?\\s+)?';
// One money token: optional sign / parentheses / dollar in any order, digits
// with optional thousands commas, exactly two decimals, optional trailing minus.
const MONEY = '\\(?\\s?[+-]?\\s?\\$?\\s?[+-]?\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})\\s?\\)?-?';
const MONEY_AT_END = new RegExp(`(${MONEY})(?:\\s+(${MONEY}))?\\s*$`);
const ONLY_MONEY = new RegExp(`^\\s*(${MONEY})(?:\\s+(${MONEY}))?\\s*$`);

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
function addDaysIso(day, n) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** A bank's money token → { value, signed }. `signed` is true when the text itself carries the direction. */
export function readMoney(token) {
  let s = String(token || '')
    .trim()
    .replace(/[−–—]/g, '-');
  if (!s) return null;
  let negative = false;
  let signed = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    signed = true;
    s = s.slice(1, -1).trim();
  }
  if (/-$/.test(s)) {
    negative = true;
    signed = true;
    s = s.slice(0, -1).trim();
  }
  if (/-/.test(s)) {
    negative = true;
    signed = true;
  }
  if (/\+/.test(s)) {
    signed = true;
  }
  const digits = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(digits);
  if (!Number.isFinite(n)) return null;
  return { value: negative ? -n : n, signed };
}

/** The day a row line (or a heading) names, given the screenshot's day; null when it names none. */
function dayOf(text, asOf) {
  const s = String(text).trim();
  let m = s.match(/^(today|yesterday)\b/i);
  if (m) return asOf ? (m[1].toLowerCase() === 'today' ? asOf : addDaysIso(asOf, -1)) : { open: m[1] };
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const mo = Number(m[1]);
    const d = Number(m[2]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    if (m[3]) {
      const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return iso(y, mo, d);
    }
    if (!asOf) return { open: `${mo}/${d}` };
    const y = Number(asOf.slice(0, 4));
    const asOfMonth = Number(asOf.slice(5, 7));
    return iso(mo > asOfMonth ? y - 1 : y, mo, d);
  }
  m = s.match(new RegExp(`^${WEEKDAY_RE}${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i'));
  if (m) {
    const mo = MONTHS[m[1].toLowerCase().slice(0, 4)] || MONTHS[m[1].toLowerCase().slice(0, 3)];
    const d = Number(m[2]);
    if (!mo || d < 1 || d > 31) return null;
    if (m[3]) return iso(Number(m[3]), mo, d);
    if (!asOf) return { open: `${m[1]} ${d}` };
    const y = Number(asOf.slice(0, 4));
    const asOfMonth = Number(asOf.slice(5, 7));
    return iso(mo > asOfMonth ? y - 1 : y, mo, d);
  }
  return null;
}
/** The part of a line after its leading date, if it starts with one. */
function afterDate(text) {
  const s = String(text).trim();
  const m = s.match(
    new RegExp(`^(?:today|yesterday|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|${WEEKDAY_RE}${MONTH_RE}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?)\\s*`, 'i')
  );
  return m ? s.slice(m[0].length) : null;
}

const HEADING =
  /^(pending|posted|completed|recent (transactions|activity)|transactions|activity|available balance|present balance|current balance|available|balance)\b/i;

/**
 * Read the rows. Returns { rows, signsKnown }: each row is { date, description,
 * amount, pending?, signUnknown?, category?, openDate? }. `date` is null (and
 * `openDate` holds what the screen printed) while the screenshot's day is not
 * known.
 */
export function readSnapshotRows(text, { asOf = null } = {}) {
  const raw = [];
  let pending = false;
  let heading = null;
  let carry = null;
  let last = null;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
    if (!line) {
      carry = null;
      last = null;
      continue;
    }
    if (/^pending\b/i.test(line)) {
      pending = true;
      carry = null;
      last = null;
      continue;
    }
    if (/^(posted|completed|recent (transactions|activity)|transactions|activity)\b/i.test(line)) {
      pending = false;
      carry = null;
      last = null;
      continue;
    }
    const day = dayOf(line, asOf);
    const rest = day ? afterDate(line) : line;
    const money = rest != null ? rest.match(MONEY_AT_END) : null;
    // A line that is only a date is the heading of the rows under it.
    if (day && (!rest || !rest.trim())) {
      heading = day;
      carry = null;
      last = null;
      continue;
    }
    if (money) {
      const desc = rest.slice(0, money.index).trim();
      const tokens = [readMoney(money[1]), money[2] ? readMoney(money[2]) : null].filter(Boolean);
      if (!tokens.length) {
        carry = null;
        last = null;
        continue;
      }
      // A pending row carries no date of its own on a banking app: it is
      // today's, the screenshot's day (2026-11-18: Chase pending rows were
      // dropped for having no day).
      const rowDay = day || heading || (pending ? (asOf || { open: 'pending' }) : null);
      if (desc) {
        if (HEADING.test(desc) && !day) {
          carry = null;
          last = null;
          continue;
        } // "Available balance $4,687.18"
        last = { day: rowDay, description: desc, tokens, pending };
        raw.push(last);
        carry = null;
        continue;
      }
      if (ONLY_MONEY.test(rest)) {
        // An amount on its own line: it belongs to the description just above it.
        if (carry) {
          last = { day: carry.day || rowDay, description: carry.description, tokens, pending };
          raw.push(last);
          carry = null;
          continue;
        }
        // A second figure under a row that already has one: the bank's running
        // balance (Chase prints it in gray beneath the row) or the amount OCR
        // read after it. Kept with its row; which is which is decided below,
        // by the balances' own arithmetic, never by position.
        if (last && last.tokens.length + tokens.length <= 2) {
          last.tokens.push(...tokens);
          continue;
        }
      }
      carry = null;
      last = null;
      continue;
    }
    // A description with no amount: hold it for an amount on the next line.
    if (HEADING.test(line)) {
      carry = null;
      last = null;
      continue;
    }
    carry = { day: day || heading || (pending ? (asOf || { open: 'pending' }) : null), description: (rest || line).trim() };
    last = null;
  }
  resolveAmounts(raw);
  const signsKnown = raw.some((r) => r.amt && r.amt.signed);
  const rows = [];
  for (const r of raw) {
    const open = r.day && typeof r.day === 'object' ? r.day.open : null;
    const date = typeof r.day === 'string' ? r.day : null;
    if (!date && !open) continue; // no day at all on the screen for this row
    if (date && asOf && date > asOf) continue; // a row cannot be after the screen's day
    const row = { date, description: r.description, amount: r.amt ? r.amt.value : null };
    if (open) row.openDate = open;
    if (r.pending) row.pending = true;
    if (r.balance != null) row.runningBalance = r.balance;
    // The figures the screen printed for this row, exactly as read, so the
    // review card can show them beside the amount taken (Christina 2026-11-18).
    row.printed = r.tokens.map((t) => t.value);
    if (r.amountUnclear) {
      // Two figures that the balances cannot tell apart, or one figure on a
      // screen that prints a balance under every row (the amount itself was
      // not read): never written, shown for review with what was printed.
      row.amountUnclear = r.amountUnclear;
      row.amount = null;
    } else if (r.signFrom === 'balance') row.signFrom = 'balance';
    // Unsigned on a screen that signs its debits: money in. Unsigned on a
    // screen that signs nothing: unknown, asked, never guessed. A sign read
    // from the running balance is known.
    if (row.amount != null && !r.amt.signed && r.signFrom !== 'balance' && !signsKnown) row.signUnknown = true;
    if (isOwnTransferRow(r.description)) row.category = 'transfer';
    else if (row.amount != null && row.amount < 0 && isDebtPaymentDesc(r.description)) row.category = 'debt-payment';
    rows.push(row);
  }
  return { rows, signsKnown: signsKnown || raw.length === 0 };
}

const near = (a, b) => Math.abs(a - b) < 0.005;
/**
 * Which of a row's figures is the transaction and which the running balance,
 * and the transaction's sign. Banks list newest first, so a row's balance
 * minus the next (older) row's balance IS the row's amount, sign included.
 * The layout (amount first or balance first) is the one that arithmetic
 * proves on this screen. Without that proof a row with two figures takes the
 * signed one as the amount only when exactly one is signed; otherwise it is
 * unclear. A screen that prints a balance under its rows and shows one figure
 * for a row has lost that row's amount: unclear, never the balance.
 */
function resolveAmounts(raw) {
  const pairs = raw.map((r) => (r.tokens.length === 2 ? r.tokens : null));
  // Score each layout by the chain: for consecutive rows i (newer) and j (older)
  // that both have two figures, does balance_i - balance_j equal amount_i?
  const score = (amountIdx) => {
    let hits = 0;
    let misses = 0;
    for (let i = 0; i < raw.length - 1; i += 1) {
      const a = pairs[i];
      const b = pairs[i + 1];
      if (!a || !b) continue;
      const amt = Math.abs(a[amountIdx].value);
      const delta = a[1 - amountIdx].value - b[1 - amountIdx].value;
      if (near(Math.abs(delta), amt) && amt > 0) hits += 1;
      else misses += 1;
    }
    return { hits, misses };
  };
  const first = score(0);
  const second = score(1);
  let layout = null; // index of the amount among a row's two figures
  // One exact match to the cent is proof; a screen with rows OCR skipped has
  // gaps (misses) that say nothing about the layout.
  if (first.hits > second.hits) layout = 0;
  else if (second.hits > first.hits) layout = 1;
  const screenHasBalances = pairs.some(Boolean);
  for (let i = 0; i < raw.length; i += 1) {
    const r = raw[i];
    if (r.tokens.length === 1) {
      if (screenHasBalances && !r.tokens[0].signed) {
        r.amountUnclear = 'one-figure';
        continue;
      }
      r.amt = r.tokens[0];
      continue;
    }
    let idx = layout;
    if (idx == null) {
      const signed = r.tokens.map((t) => t.signed && t.value < 0);
      if (signed[0] !== signed[1]) idx = signed[0] ? 0 : 1;
    }
    if (idx == null) {
      r.amountUnclear = 'two-figures';
      continue;
    }
    const amt = r.tokens[idx];
    r.balance = r.tokens[1 - idx].value;
    // The sign from the balances: this row's balance minus the older row's.
    const older = pairs[i + 1];
    if (layout != null && older) {
      const delta = r.balance - older[1 - layout].value;
      if (near(Math.abs(delta), Math.abs(amt.value)) && Math.abs(delta) > 0) {
        const fromBalance = Math.sign(delta) * Math.abs(amt.value);
        if (amt.signed && Math.sign(amt.value) !== Math.sign(fromBalance)) {
          // The printed sign and the balances disagree: shown, never chosen.
          r.amountUnclear = 'sign-conflict';
          continue;
        }
        r.amt = { value: fromBalance, signed: true };
        r.signFrom = 'balance';
        continue;
      }
    }
    r.amt = amt;
  }
}

/**
 * Money moving between the household's own accounts, as a banking app prints
 * it: the shared rule (lib/bill-review.js), plus a transfer that names an
 * account by its last four ("Transfer from Chase 3322", "Online Transfer to
 * CHK ...7206") and Cash App to or from Darrell. A suggestion on the review
 * card, never income (Christina 2026-11-18: "Transfers between my own accounts
 * must not count as new income").
 */
export function isOwnTransferRow(desc = '') {
  const s = String(desc);
  return isOwnAccountTransfer(s) || /\btransfer\s+(?:from|to)\b.*\d{4}\b/i.test(s) || /\bcash\s*app\b.*\bdarrell\b/i.test(s);
}

/** A payment on a loan, mortgage or card as the bank prints it. */
export function isDebtPaymentDesc(desc = '') {
  return /\b(loan|ln)\s*(pmt|payment|pymt)\b|\bmortgage\b|\bmtg\b|\b(card|crd)\s*(member|pmt|payment|autopay)\b|\bautopay\b|\bepay\b/i.test(String(desc));
}
