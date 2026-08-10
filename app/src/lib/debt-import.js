// =============================================================================
// debt-import — parse a pasted card/loan list into debt rows the app can add
// =============================================================================
// Christina 2026-08-10, handing over the family's full card list: "take the
// following information and add it to the debts section ... and also make it so
// that I can add debts myself manually if needed."
//
// The list arrives in the shape a person actually writes it — a numbered card
// name followed by labelled lines, with section headers separating whose cards
// they are, and MANY fields deliberately left blank because the real number
// isn't known yet:
//
//   CHRISTINA'S CREDIT CARDS
//
//   2. Capital One Platinum
//   Balance: $1,550
//   Interest: 28.99%
//   Credit usage: 78%
//   Available credit: $450
//   Highest balance: $2,001
//   Monthly payment:
//
// The whole point of this parser is that a BLANK stays UNKNOWN (null) and never
// becomes 0 (DR-0076: no painted number — a $0 monthly payment is a claim, an
// absent one is the truth). The UI shows "+ pay" on an unknown and a real figure
// on a known one, so the family can see at a glance what still needs filling in.
//
// Pure + deterministic: no dates, no I/O, no randomness. Pinned by
// debt-import.test.js against the exact text of Christina's list.
// =============================================================================

// A section header — an all-caps line with no ':' and no leading number. These
// carry WHOSE cards follow ("CHRISTINA'S CREDIT CARDS"), which becomes the
// group label so the family can tell the piles apart on the Debts tab.
const SECTION_RE = /^[A-Z][A-Z0-9'’ &.\-/]{4,}$/;

// A new card: "1. Discover it" / "10) Chase" / "12 - Citi Diamond".
const ITEM_RE = /^(\d{1,3})\s*[.)\-:]\s*(.+?)\s*$/;

// A labelled field line: "Balance: $9,667.64", "Monthly payment:" (blank).
const FIELD_RE = /^([A-Za-z][A-Za-z ()&/']*?)\s*:\s*(.*)$/;

// Lines that are commentary or running totals, never a card. Christina's list
// ends with a CURRENT SUMMARY block and per-section totals; importing those as
// debts would double-count the whole list.
const NOISE_RE = /\b(total|totals|summary|subtotal|combined|not yet provided|previously provided|therefore|appeared under|i listed them|left the unknown)\b/i;

// Field-label synonyms → canonical key. "Balance shown" and "Highest balance
// shown" appear in the same list as "Balance"/"Highest balance"; both mean the
// same thing to us.
const FIELD_ALIASES = new Map([
  ['balance', 'balance'],
  ['balance shown', 'balance'],
  ['current balance', 'balance'],
  ['amount owed', 'balance'],
  ['owed', 'balance'],
  ['interest', 'rate'],
  ['interest rate', 'rate'],
  ['apr', 'rate'],
  ['rate', 'rate'],
  ['credit usage', 'usage'],
  ['utilization', 'usage'],
  ['available credit', 'available'],
  ['available', 'available'],
  ['credit limit', 'creditLimit'],
  ['credit limit shown', 'creditLimit'],
  ['limit', 'creditLimit'],
  ['highest balance', 'highestBalance'],
  ['highest balance shown', 'highestBalance'],
  ['monthly payment', 'minPayment'],
  ['minimum payment', 'minPayment'],
  ['min payment', 'minPayment'],
  ['payment', 'minPayment'],
  ['institution', 'institution'],
  ['bank', 'institution'],
  ['note', 'note'],
  ['notes', 'note'],
]);

const round2 = (n) => Math.round(n * 100) / 100;

// Parse a money-ish value. Returns null for blank/unknown — NEVER 0. "$9,667.64"
// -> 9667.64; "" -> null; "n/a" / "unknown" / "-" -> null.
export function parseMoney(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (/^(n\/?a|none|unknown|tbd|\?+|-+|—)$/i.test(s)) return null;
  const m = s.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isFinite(n) ? round2(Math.abs(n)) : null;
}

// Parse a percentage, including the ranges the card issuers actually quote
// ("29.99% to 35.99%"). Returns { rate, rateMax } where rate is the figure the
// payoff engine uses and rateMax is set only when a range was given.
//
// On a RANGE we take the HIGH end as the working rate. A range means the true
// rate is somewhere inside it; projecting off the low end would date the payoff
// earlier than the family can count on — a rosy fiction (DR-0100: speak the
// truth plainly, never under-claim real cost). The full range is kept so the UI
// can show "29.99–35.99%" rather than implying a single quoted number.
export function parsePercent(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return { rate: null, rateMax: null };
  if (/^(n\/?a|none|unknown|tbd|\?+|-+|—)$/i.test(s)) return { rate: null, rateMax: null };
  const nums = (s.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || []).map(parseFloat).filter((n) => isFinite(n));
  if (!nums.length) return { rate: null, rateMax: null };
  // A rate above 100% is not an APR (it's a mis-pasted usage figure); reject it
  // rather than feeding an absurd number into the projection.
  const valid = nums.filter((n) => n >= 0 && n <= 100);
  if (!valid.length) return { rate: null, rateMax: null };
  const lo = Math.min(...valid);
  const hi = Math.max(...valid);
  return lo === hi ? { rate: round2(hi), rateMax: null } : { rate: round2(hi), rateMax: round2(hi), rateMin: round2(lo) };
}

// Percent that may legitimately exceed 100 (credit usage on an over-limit card
// reads 107%). Kept separate from parsePercent so an APR can never absorb it.
function parseUsage(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const m = s.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isFinite(n) ? round2(n) : null;
}

// Fold a raw field bag into the canonical debt row, filling in what the numbers
// themselves prove and nothing more.
function finalizeRow(name, raw, group, index) {
  const { rate, rateMax, rateMin } = parsePercent(raw.rate);
  const balance = parseMoney(raw.balance);
  const available = parseMoney(raw.available);
  const usage = parseUsage(raw.usage);
  let creditLimit = parseMoney(raw.creditLimit);
  // A limit the family didn't state is often still KNOWN, because balance +
  // available credit IS the limit. Deriving it is arithmetic on their own two
  // numbers, not an invention — but ONLY where the arithmetic actually holds.
  //
  // It does NOT hold on an over-limit card, and that is the majority of this
  // family's list: Discover it is $9,667.64 owed with $0 available at a stated
  // 107% usage. balance + available would call the limit $9,667.64 — which is
  // 100% usage exactly, contradicting the 107% they reported and quietly
  // erasing the fact that the card is OVER its limit. A closed card ($0
  // available, no usage stated) has no meaningful limit to derive either.
  //
  // So: derive only when the family's own stated usage confirms the result
  // (within a rounding point or two), and never off a $0-available card whose
  // usage is unstated or above 100%. Otherwise the limit stays UNKNOWN and the
  // stated usage is reported as they gave it (DR-0076: measure, don't claim).
  if (creditLimit == null && balance != null && available != null) {
    const candidate = round2(balance + available);
    const overOrUnknown = available === 0 && (usage == null || usage > 100);
    const impliedUsage = candidate > 0 ? (balance / candidate) * 100 : null;
    const contradicted = usage != null && impliedUsage != null && Math.abs(impliedUsage - usage) > 2;
    if (candidate > 0 && !overOrUnknown && !contradicted) creditLimit = candidate;
  }
  return {
    index,
    name,
    group: group || null,
    balance,                                   // null = not stated yet
    rate,                                      // null = not stated yet
    rateMax: rateMax != null ? rateMax : null, // set only for a quoted range
    rateMin: rateMin != null ? rateMin : null,
    rateKnown: rate != null,                   // an explicit 0% is KNOWN, not missing
    minPayment: parseMoney(raw.minPayment),
    creditLimit,
    creditLimitStated: parseMoney(raw.creditLimit) != null,
    highestBalance: parseMoney(raw.highestBalance),
    availableCredit: available,
    statedUsage: usage,
    // Over the limit is a real, reportable condition, not a rounding artefact —
    // it drives penalty pricing and blocks the card. Named plainly (DR-0100).
    overLimit: usage != null && usage > 100,
    institution: raw.institution ? String(raw.institution).trim() : null,
    note: raw.note ? String(raw.note).trim() : null,
  };
}

// ---------------------------------------------------------------------------
// parseDebtList — the whole paste → { rows, sections, skipped }.
//
// `rows` are ready for the preview table; `skipped` records every line that
// looked like data but wasn't used, so the importer can SHOW what it ignored
// instead of silently dropping part of the family's list.
// ---------------------------------------------------------------------------
export function parseDebtList(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const rows = [];
  const sections = [];
  const skipped = [];
  let group = null;
  let current = null;
  let raw = {};

  const flush = () => {
    if (current) rows.push(finalizeRow(current, raw, group, rows.length));
    current = null;
    raw = {};
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const item = t.match(ITEM_RE);
    if (item) {
      const name = item[2].replace(/\s+/g, ' ').trim();
      // "18. American Express Business" is a card; a numbered total line is not.
      if (name && !NOISE_RE.test(name)) {
        flush();
        current = name;
        continue;
      }
    }

    const field = t.match(FIELD_RE);
    if (field) {
      const label = field[1].trim().toLowerCase().replace(/\s+/g, ' ');
      const key = FIELD_ALIASES.get(label);
      if (key && current) { raw[key] = field[2]; continue; }
      // A "Christina's total credit card balances: $38,583.99" line closes the
      // section — it is a running total, not a field on the last card.
      if (NOISE_RE.test(t)) { flush(); skipped.push(t); continue; }
      if (key && !current) { skipped.push(t); continue; }
      skipped.push(t);
      continue;
    }

    if (SECTION_RE.test(t) && !NOISE_RE.test(t)) {
      flush();
      group = t.replace(/\s+/g, ' ').trim();
      if (!sections.includes(group)) sections.push(group);
      continue;
    }

    // Anything else — the explanatory prose in the middle of the list — is
    // recorded as skipped so nothing disappears without the family seeing it.
    if (NOISE_RE.test(t)) { flush(); }
    skipped.push(t);
  }
  flush();
  return { rows, sections, skipped };
}

// ---------------------------------------------------------------------------
// debtRowToAccount — one parsed row → the account record addAccount stores.
//
// A card becomes a `credit` account carrying the debt declaration, because that
// is what deriveDebts reads to put it on the Debts tab (financial-engineering
// .js). Unknown balance imports as 0 owed — the row still shows, with the "+
// owed" editor waiting — which is exactly the established "add it now, set the
// balance later" behaviour. Unknown rate/payment stay UNSET, so nothing claims
// a number the family never gave.
// ---------------------------------------------------------------------------
export function debtRowToAccount(row, entityId) {
  const acct = {
    name: row.name,
    type: 'credit',
    treatAsDebt: true,
    balance: row.balance != null ? row.balance : 0,
    entityId: entityId ?? null,
  };
  if (row.institution) acct.institution = row.institution;
  if (row.rate != null) { acct.rate = row.rate; acct.rateKnown = true; }
  if (row.rateMax != null && row.rateMin != null) { acct.rateMin = row.rateMin; acct.rateMax = row.rateMax; }
  if (row.minPayment != null) acct.minPayment = row.minPayment;
  if (row.creditLimit != null) acct.creditLimit = row.creditLimit;
  if (row.highestBalance != null) acct.highestBalance = row.highestBalance;
  if (row.note) acct.note = row.note;
  return acct;
}

// A comparable form of a card name, for spotting a card the family already has
// on the tab. "Discover it" and "DISCOVER  IT" are the same card; "Discover it
// Chrome" is not.
export function debtNameKey(name) {
  return String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// markDuplicates — flag rows that would double-add, WITHOUT mistaking two real
// cards for one.
//
// Two distinctions the naive name-only check got wrong on this family's list:
//   · `alreadyOnTab` — the name already exists among the debts on the tab.
//     Re-pasting the same list is how a family ends up with 54 cards instead of
//     27, so these arrive pre-unchecked.
//   · `repeat` — the SAME card appears twice within one paste. Matched on name
//     AND balance together, because two genuinely different cards can share a
//     name: this list holds a "Chase" at $13,000 and a second "Chase" at
//     $30,600, and Christina's "Discover it" at $9,667.64 is not Darrell's
//     closed "Discover it" at $13,500. Flagging those as duplicates would have
//     silently dropped $30,600 and $13,500 of real debt from the import.
//
// `sameName` marks rows that share a name with another row but are NOT the same
// card, so the preview can say so rather than leaving it looking like a mistake.
// ---------------------------------------------------------------------------
export function markDuplicates(rows, existingDebts = []) {
  const onTab = new Set((existingDebts || []).map((d) => debtNameKey(d && d.name)).filter(Boolean));
  const nameCounts = new Map();
  for (const r of rows || []) {
    const k = debtNameKey(r.name);
    nameCounts.set(k, (nameCounts.get(k) || 0) + 1);
  }
  const seenCards = new Set();
  return (rows || []).map((r) => {
    const nameKey = debtNameKey(r.name);
    const cardKey = `${nameKey}|${r.balance == null ? '' : r.balance}`;
    const repeat = seenCards.has(cardKey);
    seenCards.add(cardKey);
    const alreadyOnTab = onTab.has(nameKey);
    return {
      ...r,
      repeat,
      alreadyOnTab,
      sameName: !repeat && (nameCounts.get(nameKey) || 0) > 1,
      duplicate: repeat || alreadyOnTab,
    };
  });
}

// ---------------------------------------------------------------------------
// summarizeRows — the honest headline for the preview: what the paste totals,
// and how much of it is still unknown. "9 cards, $38,582.99 owed, 7 missing a
// monthly payment" tells the family exactly what they still have to gather.
// ---------------------------------------------------------------------------
export function summarizeRows(rows) {
  const list = rows || [];
  const withBalance = list.filter((r) => r.balance != null);
  return {
    count: list.length,
    totalBalance: round2(withBalance.reduce((s, r) => s + r.balance, 0)),
    withBalance: withBalance.length,
    missingBalance: list.filter((r) => r.balance == null).length,
    missingRate: list.filter((r) => r.rate == null).length,
    missingPayment: list.filter((r) => r.minPayment == null).length,
    knownPayments: round2(list.filter((r) => r.minPayment != null).reduce((s, r) => s + r.minPayment, 0)),
    duplicates: list.filter((r) => r.duplicate).length,
  };
}
