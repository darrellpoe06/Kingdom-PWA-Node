// =============================================================================
// payments — the payment history, and how much of it is actually known
// =============================================================================
// Darrell, 2026-08-27: "payment historical accuracy and information etc..."
//
// The 1003 Koehn tab is the reason this exists. It records three payments —
// 9/16, 10/03 and 11/02/2022 — and then FOUR EMPTY ROWS labelled 12/2022
// through 3/2023. Someone drew the months and never filled them in. A feed that
// lists three payments and stops reads as "three payments"; the truth is three
// payments and four months nobody can account for.
//
// So the ledger here is built from the PERIODS a tenancy should have, not from
// the records that happen to exist. A month with no record is a row that says
// so. That inverts the usual failure: absence becomes visible instead of
// invisible.
//
// And the voucher rows do not balance. 9/16 shows the programme paying $646
// against $680 contract rent with the tenant portion recorded as $0.00 — $34
// unaccounted. 10/03 shows $640, so $40. Only 11/02 pays the full $680. Three
// rows, two of them short, and nothing in the sheet says why. That is exactly
// what "historical accuracy" has to surface rather than sum away.
//
// Nothing here moves money (the standing line: money_moved_in_app stays false).
// This reads what was recorded and reports what is missing.
// =============================================================================

const MONTH = /^(\d{4})-(\d{2})$/;

/** "2022-09" for a date, in UTC — the period a payment belongs to. */
export function periodOf(value) {
  if (!value) return null;
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Every month from `from` to `to` inclusive, oldest first. */
export function periodsBetween(from, to) {
  const a = MONTH.exec(String(from ?? ''));
  const b = MONTH.exec(String(to ?? ''));
  if (!a || !b) return [];
  let y = Number(a[1]);
  let m = Number(a[2]);
  const ey = Number(b[1]);
  const em = Number(b[2]);
  if (y > ey || (y === ey && m > em)) return [];
  const out = [];
  // A tenancy is years, not centuries; the cap stops a bad date eating memory.
  while ((y < ey || (y === ey && m <= em)) && out.length < 1200) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * One row per period the tenancy covers, newest first.
 *
 * `expectedRent` is the contract rent. `records` are rent_records rows
 * ({ for_period, amount, status, confirmed_at, reported_at, method }).
 * A period with no record is present with `state: 'no-record'` — the whole point.
 */
export function paymentLedger({
  records = [], expectedRent = null, from = null, to = null, subsidised = false,
} = {}) {
  const byPeriod = new Map();
  for (const r of records) {
    const p = r.for_period || periodOf(r.confirmed_at || r.reported_at);
    if (!p) continue;
    if (!byPeriod.has(p)) byPeriod.set(p, []);
    byPeriod.get(p).push(r);
  }

  // The span: what was asked for, widened to cover any record outside it, so a
  // payment can never fall off the end of the ledger it belongs to.
  const seen = [...byPeriod.keys()].sort();
  const start = from || seen[0] || null;
  const end = to || seen[seen.length - 1] || null;
  const periods = start && end ? periodsBetween(start, end) : seen;

  const rows = periods.map((period) => {
    const rs = byPeriod.get(period) ?? [];
    const paid = rs.reduce((s, r) => s + num(r.amount), 0);
    const confirmed = rs.filter((r) => r.status === 'confirmed');
    const disputed = rs.filter((r) => r.status === 'disputed');
    const expected = expectedRent === null ? null : Number(expectedRent);

    let state = 'no-record';
    if (rs.length > 0) {
      if (disputed.length > 0) state = 'disputed';
      else if (expected === null) state = 'recorded';
      else if (Math.abs(paid - expected) < 0.01) state = 'paid';
      else if (paid > expected) state = 'over';
      else if (paid > 0) state = 'short';
      else state = 'recorded';
    }

    return {
      period,
      expected,
      paid: rs.length ? paid : null,
      shortfall: expected !== null && rs.length ? Math.round((expected - paid) * 100) / 100 : null,
      state,
      confirmed: confirmed.length > 0,
      // A payment nobody confirmed is a claim, not a receipt.
      unconfirmed: rs.length > 0 && confirmed.length === 0,
      subsidised,
      records: rs,
    };
  });

  return rows.reverse(); // newest first, as everywhere in this module
}

/** The months with nothing in them at all — the four blank rows at 1003 Koehn. */
export function gaps(ledger = []) {
  return ledger.filter((r) => r.state === 'no-record').map((r) => r.period);
}

/** Every period where the money and the contract disagree, or nobody confirmed. */
export function discrepancies(ledger = []) {
  const out = [];
  for (const r of ledger) {
    if (r.state === 'short') {
      out.push({ period: r.period, kind: 'short', by: r.shortfall, note: `paid ${r.paid} against ${r.expected}` });
    } else if (r.state === 'over') {
      out.push({ period: r.period, kind: 'over', by: Math.abs(r.shortfall), note: `paid ${r.paid} against ${r.expected}` });
    } else if (r.state === 'disputed') {
      out.push({ period: r.period, kind: 'disputed', note: 'a record in this period is disputed' });
    }
    if (r.unconfirmed && r.state !== 'no-record') {
      out.push({ period: r.period, kind: 'unconfirmed', note: 'reported but never confirmed' });
    }
  }
  return out;
}

/**
 * How much of this history is actually KNOWN. Not a score to feel good about —
 * a statement of how far the record can be trusted, so a total is never read as
 * complete when it is not. Unknown never reads as fine (DR-0076).
 */
export function accuracy(ledger = []) {
  const total = ledger.length;
  if (total === 0) {
    return { total: 0, known: 0, ratio: null, complete: false, statement: 'no period is covered by this ledger' };
  }
  const known = ledger.filter((r) => r.state !== 'no-record' && r.confirmed).length;
  const missing = gaps(ledger).length;
  const unconfirmed = ledger.filter((r) => r.unconfirmed).length;
  const issues = discrepancies(ledger).length;
  const ratio = Math.round((known / total) * 1000) / 1000;
  const parts = [`${known} of ${total} month(s) carry a confirmed payment`];
  if (missing) parts.push(`${missing} have no record at all`);
  if (unconfirmed) parts.push(`${unconfirmed} were reported but never confirmed`);
  if (issues) parts.push(`${issues} discrepanc${issues === 1 ? 'y' : 'ies'} to resolve`);
  return {
    total,
    known,
    missing,
    unconfirmed,
    ratio,
    complete: known === total,
    statement: `${parts.join('; ')}.`,
  };
}

/**
 * What the household has actually paid over the ledger, with the caveat
 * attached. A total whose basis is 3 of 7 months must never be shown bare.
 */
export function totals(ledger = []) {
  const covered = ledger.filter((r) => r.paid !== null);
  const paid = covered.reduce((s, r) => s + num(r.paid), 0);
  const expected = ledger
    .filter((r) => r.expected !== null)
    .reduce((s, r) => s + num(r.expected), 0);
  const acc = accuracy(ledger);
  return {
    paid: Math.round(paid * 100) / 100,
    expected: Math.round(expected * 100) / 100,
    balance: Math.round((paid - expected) * 100) / 100,
    basis: `${covered.length} of ${ledger.length} month(s)`,
    trustworthy: acc.complete,
    caveat: acc.complete ? null : `Incomplete: ${acc.statement}`,
  };
}
