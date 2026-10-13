// =============================================================================
// debt-history — what the STATEMENTS actually say: paid, on time, late, left
// =============================================================================
// Darrell 2026-08-11, from the Books > Debts tab: "How do we add the credit card
// debits... after can it show how many paid on time and late and what is left
// and what should be added for payoff faster... Debts shows snowball not all
// payments and paid and left to pay based on the uploaded statements from
// credit card companies."
//
// The complaint is exact. Debts renders a snowball PLAN — a projection of what
// to pay next — while the imported statements hold the lived RECORD of what was
// actually paid, when, and whether it landed before the due date. The plan was
// visible and the record was not.
//
// What already existed (debt-payments.js): payment counts and per-month RATES
// over a six-month window, a payoff date at the current paydown, and a real APR
// derived from the interest lines the card itself posted. Genuinely useful, and
// none of it answers "how many did I pay on time."
//
// LATENESS NEEDS A DUE DATE, AND WE HOLD NONE (measured 2026-08-11: no
// `due_date`, `dueDay`, `past due`, or `on-time` anywhere in the debt libs or
// the debts table). So this module takes `dueDay` as an INPUT and reports
// `known: false` when it is absent — it never guesses a due date, and it never
// shows an on-time count it could not compute. A fabricated "you were on time"
// on somebody's credit history is exactly the class of claim this codebase
// refuses (DR-0076).
//
// Pure, clock-injected, dependency-free — every figure is derived from rows the
// user imported, so nothing here is typed by hand (DR-0121).
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const msOf = (t) => {
  if (!t) return null;
  const raw = t.date ?? t.postedAt ?? t.at ?? null;
  if (raw == null) return null;
  const ms = raw instanceof Date ? raw.getTime() : Date.parse(String(raw));
  return Number.isFinite(ms) ? ms : null;
};

/**
 * The due date that governs a payment made on `ms`, given a day-of-month.
 *
 * A payment lands in the cycle whose due date it is meant to satisfy. Cards
 * bill monthly, so the governing due date is that month's — and a payment made
 * BEFORE the due day is early for that same month, not late for the previous
 * one. Months shorter than the due day clamp to the last day (a 31st due day in
 * February means the 28th/29th), which is what card issuers actually do.
 */
export function dueDateFor(ms, dueDay) {
  const day = Math.round(Number(dueDay));
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  const d = new Date(ms);
  const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth(), Math.min(day, lastOfMonth)).getTime();
}

/**
 * The payment record for one debt, straight from imported rows.
 *
 *   transactions — imported rows; a POSITIVE amount is a payment toward the
 *                  card (the sign convention debt-payments.js already uses)
 *   accountId    — which card
 *   dueDay       — 1..31, or null/absent when unknown
 *   graceDays    — a payment this many days past due still counts on time
 *                  (default 0 — an issuer's posting grace, set deliberately)
 *
 * Returns { known, payments[], onTime, late, totalPaid, largest, lastPaidAt }.
 * `known` is false when no due day was supplied: the totals are still real and
 * are still reported, but onTime/late are null rather than zero — absent is not
 * the same as none, and a zero would read as "never late."
 */
export function paymentHistory(transactions, accountId, { dueDay = null, graceDays = 0 } = {}) {
  const rows = (transactions || []).filter((t) => t && t.accountId === accountId);
  const known = Number.isFinite(Number(dueDay)) && Number(dueDay) >= 1 && Number(dueDay) <= 31;
  const grace = Math.max(0, Number(graceDays) || 0);

  const payments = [];
  let totalPaid = 0;
  let largest = 0;
  let lastPaidAt = null;

  for (const t of rows) {
    const amt = Number(t.amount);
    const ms = msOf(t);
    if (!Number.isFinite(amt) || amt <= 0 || ms == null) continue; // payments only
    totalPaid += amt;
    if (amt > largest) largest = amt;
    if (lastPaidAt == null || ms > lastPaidAt) lastPaidAt = ms;

    const due = known ? dueDateFor(ms, dueDay) : null;
    const daysLate = due == null ? null : Math.max(0, Math.ceil((ms - due - grace * DAY_MS) / DAY_MS));
    payments.push({
      at: ms,
      amount: round2(amt),
      dueAt: due,
      onTime: due == null ? null : ms <= due + grace * DAY_MS,
      daysLate,
    });
  }

  payments.sort((a, b) => a.at - b.at);
  return {
    known,
    payments,
    count: payments.length,
    onTime: known ? payments.filter((p) => p.onTime).length : null,
    late: known ? payments.filter((p) => p.onTime === false).length : null,
    totalPaid: round2(totalPaid),
    largest: round2(largest),
    lastPaidAt,
  };
}

/**
 * What is LEFT, reconciled against the record rather than asserted.
 *
 * `balance` is the debt's own figure. `charges` and `payments` are what the
 * imported rows actually show. When a statement balance is supplied it WINS —
 * the card issuer is the authority on what is owed, not our arithmetic — and
 * the drift between the two is reported rather than hidden, because a drift is
 * usually a missing import, which is worth seeing.
 */
export function amountLeft({ balance = null, statementBalance = null, totalPaid = 0, totalCharges = 0 } = {}) {
  // null/undefined/'' must NOT slide through Number() to 0. Caught by this
  // module's own test: an absent statementBalance became a real $0, which then
  // WON over the true balance and rendered "$0 left" on a card that is owed.
  // On a money surface an unmeasured value must never read as a measured zero.
  const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
  const stated = num(statementBalance);
  const own = num(balance);
  const hasStated = Number.isFinite(stated);
  const hasOwn = Number.isFinite(own);
  if (!hasStated && !hasOwn) {
    return { known: false, left: null, source: null, drift: null };
  }
  const derived = hasOwn ? own : null;
  if (hasStated) {
    return {
      known: true,
      left: round2(stated),
      source: 'statement',
      drift: derived == null ? null : round2(stated - derived),
    };
  }
  return { known: true, left: round2(own), source: 'balance', drift: null };
}

/**
 * What adding `extra` per month actually buys, in months and in interest.
 *
 * Amortised month by month at the card's real APR (deriveApr reads it off the
 * posted interest lines, so this is the rate the card charged rather than a
 * remembered one). Returns null-ish honestly when the payment cannot clear the
 * interest — telling someone they will be debt-free on a payment that never
 * reduces the principal is the worst possible lie on this surface.
 *
 * `maxMonths` bounds the loop (default 600 = 50 years); a plan still running at
 * the bound is reported as never-clearing rather than as a large number.
 */
export function payoffWith(owed, monthlyPayment, aprPercent, maxMonths = 600) {
  const principal = Number(owed);
  const pay = Number(monthlyPayment);
  const apr = Math.max(0, Number(aprPercent) || 0);
  if (!(principal > 0)) return { clears: true, months: 0, totalPaid: 0, totalInterest: 0 };
  if (!(pay > 0)) return { clears: false, months: null, totalPaid: null, totalInterest: null, reason: 'no-payment' };

  const r = apr / 100 / 12;
  let bal = principal;
  let interest = 0;
  let paid = 0;
  for (let m = 1; m <= maxMonths; m += 1) {
    const charge = bal * r;
    if (pay <= charge) {
      // The payment does not even cover the month's interest: the balance grows.
      return { clears: false, months: null, totalPaid: null, totalInterest: null, reason: 'below-interest' };
    }
    interest += charge;
    bal = bal + charge - pay;
    paid += pay;
    if (bal <= 0.005) {
      return {
        clears: true,
        months: m,
        totalPaid: round2(paid + bal), // bal is <= 0 here: the final part-payment
        totalInterest: round2(interest),
      };
    }
  }
  return { clears: false, months: null, totalPaid: null, totalInterest: null, reason: 'beyond-horizon' };
}

/**
 * "What should I add to pay this off faster?" — the delta, not a lecture.
 *
 * Compares the current payment against current + extra and reports what the
 * extra actually buys: months saved and interest saved. Returns known:false
 * when the comparison cannot honestly be made (no APR, no payment, a payment
 * that never clears), so the surface can say why instead of printing a zero.
 */
export function accelerationOptions(owed, currentPayment, aprPercent, extras = [50, 100, 250]) {
  const base = payoffWith(owed, currentPayment, aprPercent);
  if (!base.clears) {
    return { known: false, base, options: [], reason: base.reason || 'no-baseline' };
  }
  const options = [];
  for (const raw of extras) {
    const extra = Number(raw);
    if (!Number.isFinite(extra) || extra <= 0) continue;
    const alt = payoffWith(owed, Number(currentPayment) + extra, aprPercent);
    if (!alt.clears) continue;
    options.push({
      extra: round2(extra),
      months: alt.months,
      monthsSaved: base.months - alt.months,
      interestSaved: round2(base.totalInterest - alt.totalInterest),
    });
  }
  return { known: options.length > 0, base, options, reason: options.length ? null : 'no-improvement' };
}

// =============================================================================
// THE STATEMENT'S OWN FACTS — the data nothing was capturing
// =============================================================================
// Darrell 2026-08-11: "uploader for the credit card statements... parcer to
// process all data and use it to our users advantage."
//
// statement-import.js already turns any file into transaction ROWS (CSV, OFX,
// spreadsheet, bulk, deduped). What it never read is the statement's own
// header block — the closing date, the payment due date, the new balance, the
// minimum due, the APR. That header is precisely where the answers to "how many
// on time" and "what is left" live, which is why neither could be shown.
//
// Deliberately conservative: every field is independently optional and absent
// stays absent. A statement whose due date cannot be read yields dueDate:null,
// and the surface then says on-time/late is unknown — rather than inventing a
// date and rendering a credit-history claim that was never measured.
const MONEY = '\\$?\\s*(-?[\\d,]+\\.\\d{2}|-?[\\d,]+)';

function money(text, labels) {
  for (const label of labels) {
    const re = new RegExp(label + '[^\\n\\r$\\d-]{0,40}' + MONEY, 'i');
    const m = text.match(re);
    if (m) {
      const n = Number(String(m[1]).replace(/,/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function dateNear(text, labels) {
  for (const label of labels) {
    const re = new RegExp(label + '[^\\n\\r]{0,40}?((?:\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})|(?:[A-Z][a-z]{2,8}\\s+\\d{1,2},?\\s+\\d{4}))', 'i');
    const m = text.match(re);
    if (m) {
      const ms = Date.parse(m[1].replace(/-/g, '/'));
      if (Number.isFinite(ms)) return ms;
    }
  }
  return null;
}

/**
 * Read a credit-card statement's header facts out of its text.
 *
 * Returns every field it could read and null for every field it could not —
 * `found` lists the names actually read, so a surface can show its work and a
 * partial parse is visibly partial instead of quietly half-invented.
 */
export function parseStatementSummary(text = '') {
  const s = String(text || '');
  const out = {
    statementBalance: money(s, ['new balance(?: total)?', 'statement balance', 'balance due', 'closing balance']),
    minimumPayment: money(s, ['minimum payment(?: due)?', 'minimum amount due', 'min(?:imum)? due']),
    previousBalance: money(s, ['previous balance', 'beginning balance']),
    paymentsCredits: money(s, ['payments(?:\\s*(?:and|&|/)\\s*credits)?', 'total payments']),
    dueDate: dateNear(s, ['payment due date', 'due date', 'payment due']),
    closingDate: dateNear(s, ['closing date', 'statement closing', 'statement date', 'billing period ending']),
    apr: (() => {
      const m = s.match(/(\d{1,2}(?:\.\d{1,3})?)\s*%\s*(?:annual percentage rate|apr)|(?:annual percentage rate|apr)[^\n\r%]{0,40}?(\d{1,2}(?:\.\d{1,3})?)\s*%/i);
      const raw = m ? (m[1] ?? m[2]) : null;
      const n = raw == null ? NaN : Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),
  };
  out.found = Object.keys(out).filter((k) => k !== 'found' && out[k] !== null);
  out.dueDay = out.dueDate == null ? null : new Date(out.dueDate).getDate();
  return out;
}

// =============================================================================
// THE PLAYS — the best move for THIS situation, ranked, with the reason
// =============================================================================
// Darrell: "use it to our users advantage... at least give them the best
// business plays for their situations."
//
// Every play is DERIVED from the measured facts above and carries the number
// that justifies it, so a person can check the advice rather than trust it.
// Ordered by what the math says is worth most, not by what sounds best. When
// the facts do not support a play it is simply not returned — this never pads
// the list to look busy, and it never advises on money it has not measured.
export function bestPlays({
  debts = [], asOf = Date.now(), history = {}, minSurplus = 0,
} = {}) {
  const plays = [];
  const live = (debts || []).filter((d) => d && Number(d.balance) > 0.01 && !d.leaveAlone);
  if (live.length === 0) return plays;

  const rate = (d) => Number(d.rate) || 0;
  const bal = (d) => Number(d.balance) || 0;
  const pay = (d) => (Number(d.minPayment) || 0) + (Number(d.extraPayment) || 0);

  // 1. AVALANCHE — the highest rate is where a dollar buys the most, always.
  const byRate = [...live].sort((a, b) => rate(b) - rate(a));
  const top = byRate[0];
  if (rate(top) > 0) {
    const cheapest = byRate[byRate.length - 1];
    plays.push({
      kind: 'avalanche',
      debt: top.id,
      headline: `Put every spare dollar on ${top.name} first — ${rate(top)}% is your most expensive money`,
      why: byRate.length > 1 && rate(top) > rate(cheapest)
        ? `It costs ${round2(rate(top) - rate(cheapest))} points more than ${cheapest.name}. The same dollar kills more interest here than anywhere else you could put it.`
        : 'It carries your highest rate.',
      value: round2(bal(top) * rate(top) / 100 / 12),
      unit: 'interest/month at stake',
    });
  }

  // 2. A PAYMENT THAT NEVER CLEARS — the alarm that outranks any optimisation.
  for (const d of live) {
    const p = payoffWith(bal(d), pay(d), rate(d));
    if (!p.clears && p.reason === 'below-interest') {
      plays.unshift({
        kind: 'underwater',
        debt: d.id,
        headline: `${d.name} is going BACKWARD — the payment is below the monthly interest`,
        why: `At ${rate(d)}% the interest is about $${round2(bal(d) * rate(d) / 100 / 12)}/mo and the payment is $${round2(pay(d))}. The balance grows every month no matter how long you pay.`,
        value: round2(bal(d) * rate(d) / 100 / 12 - pay(d)),
        unit: 'growth/month',
      });
    }
  }

  // 3. A PROMO RATE ABOUT TO END — a dated cliff, worth more than a rate sort.
  for (const d of live) {
    const until = d.promoZeroAprUntil ? Date.parse(d.promoZeroAprUntil) : NaN;
    if (!Number.isFinite(until)) continue;
    const days = Math.ceil((until - asOf) / DAY_MS);
    if (days > 0 && days <= 120) {
      plays.unshift({
        kind: 'promo-cliff',
        debt: d.id,
        headline: `${d.name}'s 0% ends in ${days} days — clear what you can before it does`,
        why: `$${round2(bal(d))} is interest-free until then. After that date it starts charging, and every dollar left becomes expensive on the same day.`,
        value: round2(bal(d)),
        unit: 'interest-free balance at risk',
      });
    }
  }

  // 4. LATENESS — measured, never assumed. Only when a due day was known.
  for (const d of live) {
    const h = history[d.id];
    if (!h || !h.known || !(h.late > 0)) continue;
    plays.push({
      kind: 'late-pattern',
      debt: d.id,
      headline: `${d.name} was late ${h.late} of ${h.count} payments — an autopay for the minimum ends that`,
      why: 'Late fees and the rate bumps that follow them cost more than the interest you are trying to optimise, and they mark your credit.',
      value: h.late,
      unit: 'late payments on record',
    });
  }

  // 5. WHAT A REAL SURPLUS BUYS — only offered when there IS one.
  if (minSurplus > 0 && top) {
    const acc = accelerationOptions(bal(top), pay(top), rate(top), [minSurplus]);
    const opt = acc.options && acc.options[0];
    if (opt && opt.monthsSaved > 0) {
      plays.push({
        kind: 'surplus',
        debt: top.id,
        headline: `Adding $${round2(minSurplus)}/mo to ${top.name} finishes it ${opt.monthsSaved} months sooner`,
        why: `It also saves about $${opt.interestSaved} in interest you would otherwise hand the card.`,
        value: opt.interestSaved,
        unit: 'interest saved',
      });
    }
  }

  return plays;
}
