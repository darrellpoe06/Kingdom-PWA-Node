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
// A CENTS-level floor for rounding noise, NOT a dollar escape hatch. This was
// $3, unconditionally — and on a $5.95 median that is +/-50%, so the 20% rule
// never ran at all for small charges and every ChargePoint session from $4.50
// to $7.40 counted as "the same amount" (measured 2026-08-11). A flat dollar
// tolerance cannot be right at two scales at once; the percentage does that job.
const AMOUNT_ABS_TOL = 0.5;
// A real recurring bill charges the SAME amount nearly every time. If most of a
// payee's charges have to be discarded to find a consistent amount, what is left
// is not a subscription — it is ordinary variable spending with a few charges
// that happen to be similar.
const CONSISTENCY = 0.75;

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
  // FIVE tokens, not three. At three, 'CHASE CREDIT CRD AUTOPAY' and
  // 'CHASE CREDIT CRD EPAY' both collapsed to 'CHASE CREDIT CRD' (measured
  // 2026-08-11) and two genuinely different payments merged into one pattern
  // with a blended median amount. The distinguishing word is usually the one
  // right after the bank's name.
  return tokens.slice(0, 5).join(' ');
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

    // THE RHYTHM MUST ALREADY BE IN THE DATA (fixed 2026-08-11).
    //
    // This used to filter by amount FIRST and then measure the gaps between
    // whatever survived — so it could not fail to find a rhythm, because it
    // deleted the evidence against one. Measured: nine coffee purchases every
    // 14 days with alternating amounts lost the four large ones to the filter,
    // leaving five survivors exactly 28 days apart, and the code reported a
    // "monthly $5.10 subscription" that does not exist in that ledger.
    //
    // So the cadence is now measured across EVERY row for the payee, before a
    // single one is discarded. A real monthly bill still reads monthly; a
    // pattern that only appears after the inconvenient rows are removed no
    // longer reads as anything.
    const allGaps = [];
    for (let i = 1; i < rows.length; i++) allGaps.push((rows[i].ms - rows[i - 1].ms) / DAY_MS);
    const rawCad = cadenceOf(median(allGaps));
    if (!rawCad) continue;

    const amounts = rows.map((r) => Math.abs(r.amount));
    const medAmt = median(amounts);
    // Similar amounts: keep only the rows near the median (a payee with wildly
    // varying charges — a grocery store — is spend, not a fixed recurring bill).
    const near = rows.filter((r) => {
      const d = Math.abs(Math.abs(r.amount) - medAmt);
      return d <= AMOUNT_ABS_TOL || (medAmt > 0 && d / medAmt <= AMOUNT_TOL);
    });
    if (near.length < minHits) continue;
    // Most of the payee's charges must BE the recurring amount, not a minority
    // of them. ChargePoint kept 3 of 6 and coffee 5 of 9 — both minorities
    // dressed as subscriptions.
    if (near.length / rows.length < CONSISTENCY) continue;
    // Consistent cadence: the gaps between consecutive hits cluster on one band.
    const gaps = [];
    for (let i = 1; i < near.length; i++) gaps.push((near[i].ms - near[i - 1].ms) / DAY_MS);
    const medGap = median(gaps);
    const cad = cadenceOf(medGap);
    if (!cad) continue; // irregular timing -> not a dependable recurring pattern
    // ...and it must be the SAME rhythm the unfiltered series already showed.
    if (cad.key !== rawCad.key) continue;
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
