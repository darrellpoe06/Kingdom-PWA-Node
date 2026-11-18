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
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
    if (!line) {
      carry = null;
      continue;
    }
    if (/^pending\b/i.test(line)) {
      pending = true;
      carry = null;
      continue;
    }
    if (/^(posted|completed|recent (transactions|activity)|transactions|activity)\b/i.test(line)) {
      pending = false;
      carry = null;
      continue;
    }
    const day = dayOf(line, asOf);
    const rest = day ? afterDate(line) : line;
    const money = rest != null ? rest.match(MONEY_AT_END) : null;
    // A line that is only a date is the heading of the rows under it.
    if (day && (!rest || !rest.trim())) {
      heading = day;
      carry = null;
      continue;
    }
    if (money) {
      const desc = rest.slice(0, money.index).trim();
      const amt = readMoney(money[1]);
      if (!amt) {
        carry = null;
        continue;
      }
      const rowDay = day || heading;
      if (desc) {
        if (HEADING.test(desc) && !day) {
          carry = null;
          continue;
        } // "Available balance $4,687.18"
        raw.push({ day: rowDay, description: desc, amt, pending, hadBalance: !!money[2] });
        carry = null;
        continue;
      }
      // An amount on its own line: it belongs to the description just above it.
      if (carry && ONLY_MONEY.test(rest)) {
        raw.push({ day: carry.day || rowDay, description: carry.description, amt, pending, hadBalance: !!money[2] });
        carry = null;
        continue;
      }
      carry = null;
      continue;
    }
    // A description with no amount: hold it for an amount on the next line.
    if (HEADING.test(line)) {
      carry = null;
      continue;
    }
    carry = { day: day || heading, description: (rest || line).trim() };
  }
  const signsKnown = raw.some((r) => r.amt.signed);
  const rows = [];
  for (const r of raw) {
    const open = r.day && typeof r.day === 'object' ? r.day.open : null;
    const date = typeof r.day === 'string' ? r.day : null;
    if (!date && !open) continue; // no day at all on the screen for this row
    if (date && asOf && date > asOf) continue; // a row cannot be after the screen's day
    const row = { date, description: r.description, amount: r.amt.value };
    if (open) row.openDate = open;
    if (r.pending) row.pending = true;
    // Unsigned on a screen that signs its debits: money in. Unsigned on a
    // screen that signs nothing: unknown, asked, never guessed.
    if (!r.amt.signed && !signsKnown) row.signUnknown = true;
    if (isOwnAccountTransfer(r.description)) row.category = 'transfer';
    else if (row.amount < 0 && isDebtPaymentDesc(r.description)) row.category = 'debt-payment';
    rows.push(row);
  }
  return { rows, signsKnown: signsKnown || raw.length === 0 };
}

/** A payment on a loan, mortgage or card as the bank prints it. */
export function isDebtPaymentDesc(desc = '') {
  return /\b(loan|ln)\s*(pmt|payment|pymt)\b|\bmortgage\b|\bmtg\b|\b(card|crd)\s*(member|pmt|payment|autopay)\b|\bautopay\b|\bepay\b/i.test(String(desc));
}
