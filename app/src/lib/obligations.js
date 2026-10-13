// =============================================================================
// obligations — what is owed, by whom, when, and whether it has been settled
// =============================================================================
// Darrell 2026-09-11: "validate our accounting systems for evaluating our
// process for payable and receivables... use language that businesses use for
// house hold workflows to support families and educate our children."
// And: "Accounting module needs to be tight."
//
// WHAT THE TRACE FOUND, before this module existed:
//   * The words "accounts payable", "accounts receivable", "aging", "net 30",
//     "chart of accounts" and "write-off" appeared NOWHERE in the app.
//   * The one table with the right shape (`invoices`, in a schema file) was
//     never applied to the live database and never read by a line of code.
//   * `debts` has a balance and a rate and NO due date, so on-time-versus-late
//     is uncomputable for every household payable — the app's own screens say
//     so out loud.
//   * The bill list is a JSON array in the monolith's state with one rolling
//     "next due" and no paid state per period.
//   * Reconciliation proves arithmetic (the parts sum to the whole). It never
//     closes an obligation: no imported bank row ever marks a bill paid.
//   * Rent is the ONE place a real obligation meets a real settlement.
// So the ledger held cash MOVEMENT and, outside rent, nothing that said a
// thing was OWED.
//
// THE MODEL, kept deliberately small so it can be right:
//   an OBLIGATION   — a promise of money, in one direction, with a due date.
//   a SETTLEMENT    — money actually moved against it, append-only.
//   STATUS          — never stored. Always derived from the settlements and
//                     the calendar, so it cannot drift out of step with the
//                     rows underneath it (the failure every "status column"
//                     eventually has).
//
// WHY CENTS: money is integers here, never floats. 0.1 + 0.2 is not 0.3 in
// this language, and a ledger that rounds is a ledger that argues.
//
// THE TEACHING IS NOT DECORATION. Every term below carries the word a business
// uses, the same thing said plainly, and the one sentence a child gets. The
// household runs on the business words BECAUSE the children are learning them
// — this is the household's first accounting class and it runs on real rows.
//
// Pure: no React, no network, no clock of its own (pass `today`).
// =============================================================================

/** The two directions money can be owed. */
export const DIRECTIONS = Object.freeze([
  {
    id: 'payable',
    business: 'Accounts payable (A/P)',
    plain: 'What we owe',
    oneLine: 'Money this household has promised to someone else and has not paid yet.',
    childExplains: 'We said we would pay it. Until we do, it still belongs to them.',
    counterpartyBusiness: 'Vendor',
    counterpartyPlain: 'Who we owe',
  },
  {
    id: 'receivable',
    business: 'Accounts receivable (A/R)',
    plain: 'What is owed to us',
    oneLine: 'Money someone has promised this household and has not paid yet.',
    childExplains: 'Somebody promised us money. Until it arrives, the promise is not the money.',
    counterpartyBusiness: 'Customer',
    counterpartyPlain: 'Who owes us',
  },
]);

export const DIRECTION_IDS = Object.freeze(DIRECTIONS.map((d) => d.id));
export const direction = (id) => DIRECTIONS.find((d) => d.id === id) || null;

/**
 * Payment terms — when the money is due, counted from the day the obligation
 * was issued. "Net 30" is the business phrase; it means thirty days.
 */
export const TERMS = Object.freeze([
  { id: 'due-on-receipt', business: 'Due on receipt', days: 0, plain: 'Pay it now' },
  { id: 'net-7', business: 'Net 7', days: 7, plain: 'Within a week' },
  { id: 'net-15', business: 'Net 15', days: 15, plain: 'Within two weeks' },
  { id: 'net-30', business: 'Net 30', days: 30, plain: 'Within a month' },
  { id: 'net-60', business: 'Net 60', days: 60, plain: 'Within two months' },
  { id: 'custom', business: 'A date we agreed', days: null, plain: 'On the day we agreed' },
]);

export const TERM_IDS = Object.freeze(TERMS.map((t) => t.id));
export const term = (id) => TERMS.find((t) => t.id === id) || null;

/**
 * Aging buckets — the standard business ladder. How far past due a thing is,
 * which is the single question a payables or receivables review asks.
 */
export const AGING_BUCKETS = Object.freeze([
  { id: 'current', business: 'Current', from: null, to: 0, plain: 'Not due yet' },
  { id: '1-30', business: '1–30 days', from: 1, to: 30, plain: 'A little late' },
  { id: '31-60', business: '31–60 days', from: 31, to: 60, plain: 'Over a month late' },
  { id: '61-90', business: '61–90 days', from: 61, to: 90, plain: 'Over two months late' },
  { id: '90-plus', business: '90+ days', from: 91, to: null, plain: 'Very late' },
]);

export const BUCKET_IDS = Object.freeze(AGING_BUCKETS.map((b) => b.id));

/** The lifecycle flags that ARE stored. Everything else is derived. */
export const LIFECYCLE = Object.freeze(['open', 'void', 'written-off']);

// ---------------------------------------------------------------------------
// MONEY — integers, always
// ---------------------------------------------------------------------------

/** A number, a string with a currency symbol, or nonsense → whole cents. */
export function toCents(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 100) : 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Cents → the string a person reads. Never a float in the middle. */
export function money(cents) {
  const n = Number.isFinite(Number(cents)) ? Math.round(Number(cents)) : 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// DATES — plain ISO, no clock of our own
// ---------------------------------------------------------------------------

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isIso = (s) => ISO.test(String(s || ''));

/** Whole days from `from` to `to` (negative = `to` is earlier). */
export function daysBetween(from, to) {
  if (!isIso(from) || !isIso(to)) return null;
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function addDays(iso, days) {
  if (!isIso(iso)) return '';
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

/** The due date the terms imply. `custom` keeps whatever date was agreed. */
export function dueDateFor({ issuedOn, terms, dueDate } = {}) {
  const t = term(terms);
  if (!t || t.days === null) return isIso(dueDate) ? dueDate : '';
  if (!isIso(issuedOn)) return isIso(dueDate) ? dueDate : '';
  return addDays(issuedOn, t.days);
}

// ---------------------------------------------------------------------------
// THE OBLIGATION
// ---------------------------------------------------------------------------

/** Every cent actually settled against it. Settlements are append-only. */
export function settledCents(o) {
  const list = (o && Array.isArray(o.settlements)) ? o.settlements : [];
  return list.reduce((sum, s) => sum + (Number.isFinite(Number(s && s.amountCents)) ? Math.round(Number(s.amountCents)) : 0), 0);
}

/** What is still owed. Never below zero — an overpayment is a credit, not a negative debt. */
export function balanceCents(o) {
  const amount = Math.round(Number((o && o.amountCents) || 0));
  return Math.max(0, amount - settledCents(o));
}

/** An overpayment, if there is one — named rather than hidden. */
export function creditCents(o) {
  const amount = Math.round(Number((o && o.amountCents) || 0));
  return Math.max(0, settledCents(o) - amount);
}

/**
 * The status, DERIVED. Never stored, so it can never disagree with the rows.
 * @returns {'void'|'written-off'|'paid'|'past-due'|'partial'|'open'}
 */
export function obligationStatus(o, { today } = {}) {
  if (!o) return 'open';
  if (o.lifecycle === 'void') return 'void';
  if (o.lifecycle === 'written-off') return 'written-off';
  const balance = balanceCents(o);
  if (balance === 0 && Math.round(Number(o.amountCents || 0)) > 0) return 'paid';
  const due = dueDateFor(o);
  if (isIso(due) && isIso(today) && daysBetween(due, today) > 0) return 'past-due';
  if (settledCents(o) > 0) return 'partial';
  return 'open';
}

export const STATUS_WORDS = Object.freeze({
  open: { business: 'Open', plain: 'Still owed', tone: 'neutral' },
  partial: { business: 'Partially paid', plain: 'Some of it is paid', tone: 'neutral' },
  paid: { business: 'Paid in full', plain: 'Settled', tone: 'good' },
  'past-due': { business: 'Past due', plain: 'Late', tone: 'alert' },
  void: { business: 'Voided', plain: 'Cancelled — it was never really owed', tone: 'muted' },
  'written-off': { business: 'Written off', plain: 'Given up on collecting', tone: 'muted' },
});

/** How many days past due, or null when it is not past due. */
export function daysPastDue(o, { today } = {}) {
  const due = dueDateFor(o);
  if (!isIso(due) || !isIso(today)) return null;
  const n = daysBetween(due, today);
  return n > 0 ? n : null;
}

/** Which rung of the aging ladder this sits on. */
export function agingBucket(o, { today } = {}) {
  const status = obligationStatus(o, { today });
  if (status === 'paid' || status === 'void' || status === 'written-off') return null;
  const late = daysPastDue(o, { today });
  if (late === null) return 'current';
  for (const b of AGING_BUCKETS) {
    if (b.from === null) continue;
    if (late >= b.from && (b.to === null || late <= b.to)) return b.id;
  }
  return '90-plus';
}

// ---------------------------------------------------------------------------
// THE LEDGER
// ---------------------------------------------------------------------------

/**
 * The aging report, per direction. This is the view an A/P or A/R review
 * actually runs on, and every figure is a sum of rows you can open.
 */
export function agingReport(obligations = [], { today } = {}) {
  const rows = Array.isArray(obligations) ? obligations.filter(Boolean) : [];
  const out = {};
  for (const d of DIRECTIONS) {
    const mine = rows.filter((o) => o.direction === d.id);
    const live = mine.filter((o) => !['paid', 'void', 'written-off'].includes(obligationStatus(o, { today })));
    const buckets = {};
    for (const b of AGING_BUCKETS) buckets[b.id] = { count: 0, cents: 0 };
    for (const o of live) {
      const bucket = agingBucket(o, { today });
      if (!bucket) continue;
      buckets[bucket].count += 1;
      buckets[bucket].cents += balanceCents(o);
    }
    const outstanding = live.reduce((s, o) => s + balanceCents(o), 0);
    const pastDue = live
      .filter((o) => obligationStatus(o, { today }) === 'past-due')
      .reduce((s, o) => s + balanceCents(o), 0);
    out[d.id] = {
      direction: d.id,
      count: live.length,
      outstandingCents: outstanding,
      pastDueCents: pastDue,
      buckets,
      settledThisSet: mine.filter((o) => obligationStatus(o, { today }) === 'paid').length,
      writtenOffCents: mine.filter((o) => o.lifecycle === 'written-off').reduce((s, o) => s + balanceCents(o), 0),
    };
  }
  return out;
}

/** What falls due in the next `days` — the week's real work, soonest first. */
export function dueWithin(obligations = [], days = 14, { today } = {}) {
  if (!isIso(today)) return [];
  const end = addDays(today, days);
  return (obligations || [])
    .filter(Boolean)
    .filter((o) => !['paid', 'void', 'written-off'].includes(obligationStatus(o, { today })))
    .filter((o) => {
      const due = dueDateFor(o);
      return isIso(due) && due <= end;
    })
    .sort((a, b) => String(dueDateFor(a)).localeCompare(String(dueDateFor(b))));
}

/**
 * NET POSITION — what we would have if everything owed both ways settled
 * today. Stated as a fact with both sides shown, never as a single number
 * that hides which direction it came from.
 */
export function netPosition(obligations = [], { today } = {}) {
  const report = agingReport(obligations, { today });
  const owed = report.payable.outstandingCents;
  const owing = report.receivable.outstandingCents;
  return {
    weOweCents: owed,
    owedToUsCents: owing,
    netCents: owing - owed,
    favours: owing === owed ? 'even' : owing > owed ? 'us' : 'them',
  };
}

// ---------------------------------------------------------------------------
// VALIDATION — a row that cannot be acted on does not get written
// ---------------------------------------------------------------------------

export function validateObligation(o = {}) {
  const errors = [];
  if (!DIRECTION_IDS.includes(o.direction)) errors.push('say whether this is money we owe or money owed to us');
  if (!String(o.counterparty || '').trim()) errors.push('name who it is with — an obligation with no other party cannot be chased or paid');
  if (!String(o.description || '').trim()) errors.push('say what it is for');
  const cents = Math.round(Number(o.amountCents || 0));
  if (!Number.isFinite(cents) || cents <= 0) errors.push('an amount greater than zero');
  if (!TERM_IDS.includes(o.terms)) errors.push('choose the terms');
  if (o.issuedOn && !isIso(o.issuedOn)) errors.push('the issue date must be a real date');
  if (o.terms === 'custom' && !isIso(o.dueDate)) errors.push('with agreed terms, name the date it is due');
  if (o.terms !== 'custom' && !isIso(o.issuedOn)) errors.push('with standard terms, the issue date is what the due date counts from');
  if (o.lifecycle && !LIFECYCLE.includes(o.lifecycle)) errors.push('that is not a state an obligation can be in');
  return errors;
}

export function validateSettlement(s = {}, o = null) {
  const errors = [];
  const cents = Math.round(Number(s.amountCents || 0));
  if (!Number.isFinite(cents) || cents <= 0) errors.push('an amount greater than zero');
  if (!isIso(s.paidOn)) errors.push('the day the money actually moved');
  if (o && obligationStatus(o, { today: s.paidOn }) === 'void') errors.push('a voided obligation cannot be settled');
  return errors;
}

// ---------------------------------------------------------------------------
// THE CLASS — the business words, said plainly, with what a child gets
// ---------------------------------------------------------------------------

/**
 * Darrell: "use language that businesses use for house hold workflows to
 * support families and educate our children." So the household runs on the
 * real words, and every one of them is defined where it is used — against
 * this household's own rows, not a textbook's.
 */
export const ACCOUNTING_TERMS = Object.freeze([
  {
    term: 'Accounts payable (A/P)',
    business: 'Money the business owes its vendors for things already received.',
    household: 'The bills. What we have agreed to pay and have not paid yet.',
    childExplains: 'When you borrow a book you still owe it back. Money works the same way.',
    where: 'The What we owe column.',
  },
  {
    term: 'Accounts receivable (A/R)',
    business: 'Money customers owe the business for work already delivered.',
    household: 'What people owe us — rent, an invoice for work done, money lent.',
    childExplains: 'A promise of money is not money yet. You count it when it arrives.',
    where: 'The What is owed to us column.',
  },
  {
    term: 'Terms',
    business: 'The agreed window to pay. "Net 30" means thirty days from the invoice date.',
    household: 'How long we get to pay, or how long they get to pay us.',
    childExplains: 'Everybody agrees up front WHEN, so nobody has to argue later.',
    where: 'On every obligation.',
  },
  {
    term: 'Due date',
    business: 'The day payment is expected. Everything after it is late.',
    household: 'The day it has to be paid.',
    childExplains: 'On time means before this day, not on the day you remember.',
    where: 'On every obligation, and it is what makes late countable at all.',
  },
  {
    term: 'Aging',
    business: 'Grouping what is unpaid by how long it has been overdue: current, 1–30, 31–60, 61–90, 90+.',
    household: 'Sorting what is late by how late.',
    childExplains: 'One day late and three months late are not the same problem.',
    where: 'The aging ladder on both columns.',
  },
  {
    term: 'Settlement',
    business: 'A payment applied against an obligation, closing it in whole or in part.',
    household: 'Actually paying it, and the ledger knowing you did.',
    childExplains: 'Saying you paid and paying are different. Only one of them shows up.',
    where: 'Under each obligation, append-only.',
  },
  {
    term: 'Partially paid',
    business: 'Some of the balance is settled; the rest is still outstanding.',
    household: 'We paid part of it. The rest is still owed.',
    childExplains: 'Half of a promise kept is still half a promise open.',
    where: 'The status, which is worked out from the payments, never typed in.',
  },
  {
    term: 'Write-off',
    business: 'Formally giving up on collecting a receivable, recorded rather than deleted.',
    household: 'Deciding we are not going to get it back — and saying so honestly instead of pretending it never happened.',
    childExplains: 'Sometimes you do not get it back. You write down what happened anyway.',
    where: 'A state an obligation can be put in. It never deletes the row.',
  },
  {
    term: 'Reconciliation',
    business: 'Matching the ledger against the bank so both agree, line by line.',
    household: 'Checking that what we wrote down matches what the bank says.',
    childExplains: 'Count it twice from two different places. If they disagree, one of them is wrong.',
    where: 'Settling an obligation from a real bank row is what ties the two together.',
  },
  {
    term: 'Net position',
    business: 'Receivables minus payables — what you would hold if everything settled today.',
    household: 'If everybody paid everybody right now, where would we stand?',
    childExplains: 'What you are owed minus what you owe. Both halves count.',
    where: 'The top of the ledger, with both sides always shown.',
  },
]);

/** The glossary as a lookup, for a surface that wants to define a word in place. */
export const TERM_BY_NAME = Object.freeze(
  Object.fromEntries(ACCOUNTING_TERMS.map((t) => [t.term, t])),
);
