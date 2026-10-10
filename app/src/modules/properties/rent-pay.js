// =============================================================================
// rent-pay — "I'm paying": the hand-off to how the tenant actually pays, and
// the record of it, full or part (DR-0899, migration 0262)
// =============================================================================
// Darrell, 2026-10-10: "The tenants can say they paying right not take them to
// cashapp or zelle and other options... even cash... put it in Chase bank...
// etc" and "Full rent or percentage of rent... so it documents it and the
// notes for the following remaining amount and when it will be paid... keeping
// the historical events" and "Date and timestamps for everything possible...
// so we can recreate a situation".
//
// MONEY NEVER MOVES IN THE APP (DR-0094; rent_records.money_moved_in_app is
// CHECKed false since 0055). What the app does is two things in order:
//   1. WRITE THE RECORD FIRST: amount, method, what was due, what remains,
//      when the rest is promised, a note, the device's own clock. The server
//      stamps reported_at; 0262 logs every change with its own clock.
//   2. THEN HAND OFF: open Cash App or Venmo with the amount filled in, or show
//      the Zelle address, the cash arrangement, the bank-deposit instruction
//      or who a check is payable to — each written by the landlord.
// The landlord confirms when the money lands. Nothing here claims it arrived.
//
// No account or routing number is ever stored or shown. The bank-deposit line
// is the landlord's own words ("Deposit at any Chase branch to Poe Properties
// LLC"); 0262 refuses a long run of digits in it.
// =============================================================================

/** The ways a tenant pays, in the order they are offered. */
export const PAY_METHODS = Object.freeze([
  { id: 'cashapp', label: 'Cash App', needs: 'cashtag' },
  { id: 'zelle', label: 'Zelle', needs: 'zelle_to' },
  { id: 'venmo', label: 'Venmo', needs: 'venmo' },
  { id: 'deposit', label: 'Bank deposit', needs: 'deposit_note' },
  { id: 'cash', label: 'Cash', needs: 'cash_note' },
  { id: 'check', label: 'Check', needs: 'check_payable_to' },
]);

const money = (n) => Math.round(Number(n || 0) * 100) / 100;
export const dollars = (n) => `$${money(n).toFixed(2)}`;

/** The methods this landlord has actually set up. An unset one is not offered. */
export function methodsOffered(payee) {
  if (!payee) return [];
  return PAY_METHODS.filter((m) => String(payee[m.needs] ?? '').trim());
}

/**
 * Where a method sends the tenant, or null when it has no link and the app
 * shows the landlord's instruction instead. Cash App takes the amount in its
 * path (cash.app/$tag/25.00); Venmo takes recipients, amount and note.
 */
export function payLink(methodId, payee, amount, note = 'Rent') {
  const amt = money(amount);
  if (methodId === 'cashapp') {
    const tag = String(payee?.cashtag || '').trim().replace(/^\$?/, '$');
    return tag.length > 1 ? `https://cash.app/${encodeURIComponent(tag).replace(/^%24/, '$')}${amt > 0 ? `/${amt.toFixed(2)}` : ''}` : null;
  }
  if (methodId === 'venmo') {
    const who = String(payee?.venmo || '').trim().replace(/^@/, '');
    if (!who) return null;
    const q = new URLSearchParams({ txn: 'pay', recipients: who, ...(amt > 0 ? { amount: amt.toFixed(2) } : {}), note });
    return `https://venmo.com/?${q.toString()}`;
  }
  return null;
}

/** The landlord's own words for a method with no link. */
export function payInstruction(methodId, payee) {
  if (methodId === 'zelle') return payee?.zelle_to ? `Send it with Zelle in your bank's app to ${payee.zelle_to}.` : '';
  if (methodId === 'deposit') return String(payee?.deposit_note || '').trim();
  if (methodId === 'cash') return String(payee?.cash_note || '').trim();
  if (methodId === 'check') return payee?.check_payable_to ? `Make the check payable to ${payee.check_payable_to}.` : '';
  return '';
}

/**
 * What is due for a month, what has been reported or confirmed against it,
 * and what remains. Disputed and void records do not count as paid.
 */
export function rentDue({ monthlyRent, rent = [], period }) {
  const due = money(monthlyRent);
  const paid = money((rent || [])
    .filter((r) => r && r.for_period === period && ['reported', 'confirmed'].includes(r.status))
    .reduce((s, r) => s + Number(r.amount || 0), 0));
  return { due, paid, remaining: Math.max(0, money(due - paid)) };
}

/**
 * Check and build the record a tenant writes when they pay. A part payment
 * must say when the rest is coming (a date, today or later); a note is
 * optional. Returns { ok, errors, row } — row is what 0262's columns hold.
 */
export function buildRentReport({ amount, period, method, remainingBefore, promisedOn, note, today, deviceAt }) {
  const errors = {};
  const amt = money(amount);
  if (!(amt > 0)) errors.amount = 'Enter the amount you are paying.';
  if (!/^\d{4}-\d{2}$/.test(String(period || ''))) errors.period = 'Pick the month this is for.';
  if (!PAY_METHODS.some((m) => m.id === method)) errors.method = 'Pick how you are paying.';
  const before = money(remainingBefore);
  const after = before > 0 ? Math.max(0, money(before - amt)) : 0;
  const partial = before > 0 && after > 0;
  if (partial) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(promisedOn || ''))) errors.promisedOn = 'Say when you will pay the rest.';
    else if (today && promisedOn < today) errors.promisedOn = 'That date has passed; pick today or later.';
  }
  const memo = String(note || '').trim().slice(0, 500) || null;
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    partial,
    remainingAfter: after,
    row: {
      amount: amt,
      for_period: period,
      method,
      memo,
      due_amount: before > 0 ? before : null,
      remaining_after: before > 0 ? after : null,
      rest_promised_on: partial ? promisedOn : null,
      reported_on_device_at: deviceAt || null,
    },
  };
}

/** One line a history row reads as: what, how, part or whole, and the promise. */
export function rentLine(r) {
  const head = `${dollars(r.amount)}${r.for_period ? ` for ${r.for_period}` : ''} by ${(PAY_METHODS.find((m) => m.id === r.method) || {}).label || r.method}`;
  if (r.remaining_after > 0) {
    return `${head}. Part payment: ${dollars(r.remaining_after)} still owed${r.rest_promised_on ? `, promised by ${r.rest_promised_on}` : ''}.`;
  }
  if (r.due_amount > 0) return `${head}. Paid in full.`;
  return `${head}.`;
}
