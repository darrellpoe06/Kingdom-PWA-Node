// =============================================================================
// recurring-payments — find the repeating payment patterns in the imported ledger
// =============================================================================
// Darrell 2026-07-20: "repetitive patterns of payments should also be highlighted."
// The family's real ledger is full of the same payee hitting on a regular cadence
// (a card autopay, a subscription, rent, a loan payment). This surfaces them so a
// repeating obligation is never a surprise — and a recurring PAYMENT to a debt is
// exactly the reliable pace debt-payments.js uses to date a payoff.
//
// Pure + deterministic (nowMs injected). Groups by a normalized payee key, then
// keeps only groups that genuinely repeat: >= MIN_HITS occurrences, similar
// amounts, and a consistent gap between them. No fabrication — a group that isn't
// actually regular is reported as such and dropped, never painted as recurring.
// Pinned by recurring-payments.test.js.
// =============================================================================

const DAY_MS = 86400000;
const round2 = (n) => Math.round(n * 100) / 100;

const MIN_HITS = 3;           // need at least 3 to call it a pattern
const AMOUNT_TOL = 0.20;      // amounts within 20% of the median count as "same"
const AMOUNT_ABS_TOL = 3;     // ...or within $3 (small-dollar subscriptions)

// Normalize a messy bank description into a stable payee key: uppercase, drop the
// trailing dates / store numbers / city-state noise, keep the first meaningful
// tokens. "CASH APP*DARRELL POE*C OAKLAND CA 121492 07/13" -> "CASH APP DARRELL".
export function payeeKey(desc) {
  const raw = String(desc || '').toUpperCase();
  const cleaned = raw
    .replace(/[*#]/g, ' ')
    .replace(/\b\d[\d/.-]*\b/g, ' ')      // numbers, dates, ids
    .replace(/[^A-Z ]/g, ' ')             // punctuation
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = cleaned.split(' ').filter((w) => w.length > 1);
  return tokens.slice(0, 3).join(' ');
}

function txMs(t) {
  const s = t && (t.date ?? t.posted);
  if (!s) return null;
  const str = String(s);
  const ms = Date.parse(str.length === 10 ? str + 'T00:00:00' : str);
  return Number.isNaN(ms) ? null : ms;
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Classify a median gap (days) into a human cadence. Bands are generous so a
// real-world "monthly" that drifts a few days still reads as monthly.
function cadenceOf(gapDays) {
  if (gapDays >= 6 && gapDays <= 8) return { key: 'weekly', label: 'weekly', days: 7 };
  if (gapDays >= 12 && gapDays <= 16) return { key: 'biweekly', label: 'every 2 weeks', days: 14 };
  if (gapDays >= 25 && gapDays <= 35) return { key: 'monthly', label: 'monthly', days: 30 };
  if (gapDays >= 55 && gapDays <= 70) return { key: 'bimonthly', label: 'every 2 months', days: 61 };
  if (gapDays >= 80 && gapDays <= 100) return { key: 'quarterly', label: 'quarterly', days: 91 };
  return null;
}

// detectRecurring — the repeating payment groups in a set of transactions.
// opts.direction: 'out' (default, payments/spend — negative amounts),
//   'in' (deposits — positive), or 'all'. opts.minHits, opts.nowMs.
// Returns groups newest-activity-first: each { key, label, amount, cadence,
// cadenceDays, count, firstDate, lastDate, nextExpected, direction, txIds }.
export function detectRecurring(transactions, opts = {}) {
  const direction = opts.direction || 'out';
  const minHits = opts.minHits || MIN_HITS;
  const nowMs = opts.nowMs != null ? opts.nowMs : Date.now();

  const groups = new Map();
  for (const t of (transactions || [])) {
    if (!t) continue;
    const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    if (!Number.isFinite(a) || a === 0) continue;
    if (direction === 'out' && a >= 0) continue;
    if (direction === 'in' && a <= 0) continue;
    const ms = txMs(t);
    if (ms == null) continue;
    const key = payeeKey(t.description || t.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ms, amount: a, id: t.id, desc: String(t.description || t.name || '').trim() });
  }

  const out = [];
  for (const [key, rowsRaw] of groups) {
    if (rowsRaw.length < minHits) continue;
    const rows = rowsRaw.sort((x, y) => x.ms - y.ms);
    const amounts = rows.map((r) => Math.abs(r.amount));
    const medAmt = median(amounts);
    // Similar amounts: keep only the rows near the median (a payee with wildly
    // varying charges — a grocery store — is spend, not a fixed recurring bill).
    const near = rows.filter((r) => {
      const d = Math.abs(Math.abs(r.amount) - medAmt);
      return d <= AMOUNT_ABS_TOL || (medAmt > 0 && d / medAmt <= AMOUNT_TOL);
    });
    if (near.length < minHits) continue;
    // Consistent cadence: the gaps between consecutive hits cluster on one band.
    const gaps = [];
    for (let i = 1; i < near.length; i++) gaps.push((near[i].ms - near[i - 1].ms) / DAY_MS);
    const medGap = median(gaps);
    const cad = cadenceOf(medGap);
    if (!cad) continue; // irregular timing -> not a dependable recurring pattern
    // Most gaps must sit within the band (tolerate one-off skips/double-posts).
    const inBand = gaps.filter((g) => Math.abs(g - cad.days) <= Math.max(5, cad.days * 0.35)).length;
    if (inBand < Math.ceil(gaps.length * 0.6)) continue;

    const lastMs = near[near.length - 1].ms;
    const nextExpected = new Date(lastMs + cad.days * DAY_MS);
    // A representative label: the most complete description seen.
    const label = near.map((r) => r.desc).sort((a, b) => b.length - a.length)[0] || key;
    out.push({
      key,
      label,
      amount: round2(medAmt),
      cadence: cad.key,
      cadenceLabel: cad.label,
      cadenceDays: cad.days,
      count: near.length,
      firstDate: new Date(near[0].ms),
      lastDate: new Date(lastMs),
      nextExpected,
      direction: direction === 'in' ? 'in' : 'out',
      txIds: near.map((r) => r.id).filter((id) => id != null),
      overdue: nextExpected.getTime() < nowMs,
    });
  }
  // Biggest, most-frequent obligations first.
  out.sort((a, b) => (b.amount * b.count) - (a.amount * a.count) || b.count - a.count);
  return out;
}

// recurringTxIds — flat Set of every transaction id that belongs to a detected
// recurring group, so the register can badge those rows.
export function recurringTxIds(transactions, opts = {}) {
  const ids = new Set();
  for (const g of detectRecurring(transactions, opts)) for (const id of g.txIds) ids.add(id);
  return ids;
}
