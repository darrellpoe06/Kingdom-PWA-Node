// =============================================================================
// receipt-itemize — emailed-receipt enrichment for a matched bank transaction
// =============================================================================
// The bank statement is the source of truth for the AMOUNT (lib/reconciliation.js
// gates that: sum(orders[].paid) === total === abs(transaction.amount)). A vendor
// receipt / order-confirmation email (Walmart, Walgreens, Amazon, …) supplies the
// thing the bank line can never carry: the LINE ITEMS with per-item prices, and a
// better merchant/category signal. This module is the pure, deterministic layer
// that turns those receipt items into (a) a second verification (the items must
// sum to the receipt total the bank already confirmed), (b) a precise category —
// or a SPLIT across categories (groceries vs household on one Walmart charge) —
// derived from the items, and (c) the QC verdict the Concerns queue reads.
//
// Pairs with:
//   • lib/reconciliation.js — the amount-level gate (orders roll up to the debit).
//     receipt-itemize adds the item-level gate BELOW an order (lines roll up to it).
//   • lib/categorize.js — the PAYEE categorizer (categorizes by the bank
//     description). This is its item-level complement: when a receipt exists, the
//     items disambiguate a merchant the payee rule can only guess at.
//   • infra/nas-finance-ingest/receipts.py — the NAS pipeline that parses the
//     emails and writes exactly this `items[]` shape onto the reconciliation block.
//
// The receipt `items[]` live inside an existing reconciliation order (migration
// 0036 jsonb — additive, no schema change). Shape of one item:
//   { name: "Great Value Milk 1gal", qty: 1, price: 3.98, category?: "groceries" }
// `price` is the LINE total (extended price), so qty is display-only. Money is
// compared in integer cents so 0.1 + 0.2 can never flip a verdict.
//
// PURE + DETERMINISTIC + OFFLINE + $0 (no LLM, no network). The LLM only ever runs
// on the NAS as a fallback parser for UNKNOWN email layouts; by the time items
// reach here they are plain structured data and every check is arithmetic.
// =============================================================================

import { TX_CATEGORIES } from './categorize.js';

const cents = (n) => Math.round((Number(n) || 0) * 100);
const dollars = (c) => c / 100;

// ---------------------------------------------------------------------------
// receiptOrders — the orders on a reconciliation that actually carry receipt
// itemization (a non-empty items[]). Medical invoice-rollup orders (o.lines,
// no o.items) are ignored here so the two paths never cross-contaminate.
// ---------------------------------------------------------------------------
export function receiptOrders(reconciliation) {
  const orders = (reconciliation && Array.isArray(reconciliation.orders)) ? reconciliation.orders : [];
  return orders.filter((o) => o && Array.isArray(o.items) && o.items.length > 0);
}

// hasReceiptItems — does this reconciliation carry emailed-receipt line items?
export function hasReceiptItems(reconciliation) {
  return receiptOrders(reconciliation).length > 0;
}

// allReceiptItems — flat list of every receipt line item across all orders.
export function allReceiptItems(reconciliation) {
  return receiptOrders(reconciliation).flatMap((o) => o.items);
}

// itemsSubtotalCents — sum of the line-item prices (extended), in cents.
export function itemsSubtotalCents(items) {
  return (Array.isArray(items) ? items : []).reduce((s, it) => s + cents(it && it.price), 0);
}

// ---------------------------------------------------------------------------
// ITEM categorizer — categorizes ONE receipt line by its product NAME. This is
// deliberately separate from the payee categorizer (lib/categorize.js): a payee
// rule sees "WALMART" and can only guess groceries; an item line says "Tide Pods"
// (household) or "Amoxicillin" (medical) and removes the guess. Ordered
// MOST-SPECIFIC FIRST; each [regex, category]. Unmatched → null (caller decides).
// ---------------------------------------------------------------------------
const ITEM_RULES = [
  // Medical / pharmacy — prescription + OTC health. Precedes household so
  // "cough" / "pain" items don't fall into generic aisles.
  [/\b(rx|prescription|amoxicillin|ibuprofen|acetaminophen|tylenol|advil|aleve|allergy|claritin|zyrtec|antibiotic|cough|cold|flu|bandage|band-?aid|first aid|thermometer|vitamin|supplement|antacid|tums|pepto|insulin|inhaler|copay|co-pay|pharmacy)\b/i, 'medical'],
  // Fuel
  [/\b(unleaded|regular gas|premium gas|diesel|fuel|gasoline|gallons? of gas)\b/i, 'fuel'],
  // Household / cleaning / paper / home goods — non-food staples.
  [/\b(tide|detergent|laundry|dish soap|dawn|clorox|lysol|bleach|paper towel|toilet paper|bath tissue|charmin|bounty|trash bag|glad|ziploc|foil|aluminum|napkin|sponge|swiffer|windex|febreze|air freshener|batter(?:y|ies)|light ?bulb|hardware|screw|tool|nail|caulk|paint|filter|hanger|storage bin|hand soap|shampoo|conditioner|toothpaste|deodorant|razor|diaper|wipe|feminine|tampon|pad|jacket|coat|shirt|pant|jean|\bshoe|\bsock|backpack|notebook|pencil|crayon|marker|\bglue|folder|binder|lunch ?box|clothing|apparel|uniform)s?\b/i, 'household'],
  // Dining / prepared / restaurant-in-store
  [/\b(hot food|deli sandwich|rotisserie|fountain drink|slice of pizza|combo meal|value meal|cheeseburger)\b/i, 'dining'],
  // Groceries — food + beverage staples (broad; runs after the specific ones).
  // Trailing `s?` before the boundary so plurals categorize ("Bananas", "Eggs",
  // "Grapes") — receipt lines are almost always plural/branded, so a rigid
  // \bword\b silently drops the most common grocery items.
  [/\b(milk|egg|bread|butter|cheese|yogurt|banana|apple|orange|grape|berr|lettuce|tomato|onion|potato|carrot|broccoli|spinach|produce|chicken|beef|pork|turkey|bacon|sausage|fish|salmon|rice|pasta|cereal|oat|flour|sugar|coffee|tea|juice|soda|water|snack|chip|cracker|cookie|candy|granola|bean|soup|sauce|frozen|ice cream|pizza|tortilla|salsa|honey|peanut butter|jam|jelly|broth|stock|seasoning|spice|oil|vinegar|condiment|ketchup|mustard|mayo|nut|almond|yeast)s?\b/i, 'groceries'],
];

// categorizeItem — one item's category by name (+ its explicit category if the
// parser already set one, which always wins). Returns { category, source }.
export function categorizeItem(item) {
  const explicit = item && typeof item.category === 'string' && TX_CATEGORIES.includes(item.category) ? item.category : null;
  if (explicit) return { category: explicit, source: 'parser' };
  const name = String((item && item.name) || '');
  for (const [re, cat] of ITEM_RULES) {
    if (re.test(name)) return { category: cat, source: 'item-rule' };
  }
  return { category: null, source: 'none' };
}

// ---------------------------------------------------------------------------
// categorySplit — split the receipt total across categories BY ITEM. This is the
// precise-categorization payoff: one Walmart charge that is 70% groceries / 30%
// household stops being mis-filed as a single lump. Returns an array of
// { category, amount, itemCount } sorted by amount desc, plus the dominant
// category and an `uncertain` flag (share of dollars we could not categorize).
// Uncategorized dollars roll into an 'other' bucket rather than vanishing —
// nothing is silently dropped (mirrors ingest-reconcile's no-silent-loss rule).
// ---------------------------------------------------------------------------
export function categorySplit(reconciliation) {
  const items = allReceiptItems(reconciliation);
  const byCat = {};
  let uncategorizedCents = 0;
  let totalCents = 0;
  for (const it of items) {
    const c = cents(it && it.price);
    totalCents += c;
    const { category } = categorizeItem(it);
    const key = category || 'other';
    if (!category) uncategorizedCents += c;
    if (!byCat[key]) byCat[key] = { category: key, amountCents: 0, itemCount: 0 };
    byCat[key].amountCents += c;
    byCat[key].itemCount += 1;
  }
  const parts = Object.values(byCat)
    .map((p) => ({ category: p.category, amount: dollars(p.amountCents), itemCount: p.itemCount }))
    .sort((a, b) => b.amount - a.amount);
  const dominant = parts.length ? parts[0].category : null;
  const uncertainShare = totalCents > 0 ? uncategorizedCents / totalCents : 0;
  return {
    parts,
    dominant,
    isSplit: parts.filter((p) => p.category !== 'other').length > 1,
    uncertainShare,
    uncertain: uncertainShare > 0.25, // >25% of dollars uncategorized → flag for review
    total: dollars(totalCents),
  };
}

// derivedCategory — the single best category for the whole charge, derived from
// the items (the dominant spend). Prefer a real category over the 'other' bucket
// when any exists. Falls back to null so the caller can keep the payee guess.
export function derivedCategory(reconciliation) {
  const split = categorySplit(reconciliation);
  const real = split.parts.filter((p) => p.category !== 'other');
  if (real.length) return real[0].category;
  return null;
}

// ---------------------------------------------------------------------------
// receiptVerification — the SECOND, item-level verification gate (DR-0076: the
// cross-reference IS the verification). It confirms, per order, that the line
// items + tax reconcile to what the order says was paid, and that the receipt
// orders roll up to the bank debit. Returns:
//   { verified: boolean, reason: string|null, checks: [...] }
// `verified` is true ONLY when every check passes. A tampered price makes an
// order's items-sum != paid, which flips verified→false — proven-to-catch in the
// test. `tolerance` cents absorbs a vendor's rounding (default 2c per order).
// ---------------------------------------------------------------------------
export function receiptVerification(reconciliation, amount, opts = {}) {
  const tolerance = Number.isFinite(opts.toleranceCents) ? opts.toleranceCents : 2;
  const checks = [];
  const orders = receiptOrders(reconciliation);
  if (orders.length === 0) {
    return { verified: false, reason: 'no receipt items', checks };
  }
  // Per-order: items + tax + fees ≈ paid.
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const itemsC = itemsSubtotalCents(o.items);
    const taxC = cents(o.tax);
    const feesC = cents(o.fees) + cents(o.shipping);
    const discC = cents(o.discount); // positive number that REDUCES the total
    const paidC = cents(o.paid);
    const computed = itemsC + taxC + feesC - discC;
    const diff = Math.abs(computed - paidC);
    const ok = diff <= tolerance;
    checks.push({
      check: 'items+tax=paid',
      order: o.order || `#${i + 1}`,
      ok,
      detail: ok ? null : `items ${(itemsC / 100).toFixed(2)} + tax ${(taxC / 100).toFixed(2)}${feesC ? ` + fees ${(feesC / 100).toFixed(2)}` : ''}${discC ? ` - disc ${(discC / 100).toFixed(2)}` : ''} = ${(computed / 100).toFixed(2)} != paid ${(paidC / 100).toFixed(2)}`,
    });
  }
  // Cross-order → bank debit: receipt totals roll up to the single debit.
  const paidSum = orders.reduce((s, o) => s + cents(o.paid), 0);
  const debitC = Math.abs(cents(amount));
  const rollupOk = Math.abs(paidSum - debitC) <= tolerance;
  checks.push({
    check: 'receipts=bank-debit',
    ok: rollupOk,
    detail: rollupOk ? null : `receipt total ${(paidSum / 100).toFixed(2)} != bank debit ${(debitC / 100).toFixed(2)}`,
  });
  const failed = checks.find((c) => !c.ok);
  return {
    verified: !failed,
    reason: failed ? failed.detail || failed.check : null,
    checks,
  };
}
