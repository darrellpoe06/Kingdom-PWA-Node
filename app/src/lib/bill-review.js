// =============================================================================
// bill-review — one editable list of what must be paid, built from what the
// family's own records already show (Christina, 2026-11-03).
// =============================================================================
// "Use my existing financial records to prefill suggested information, but do
// not activate unverified obligations or overwrite existing records."
//
// So there are two kinds of row, and they never blur:
//   SAVED      — a data.recurringObligations entry. Only these reach Safe to
//                Spend. Confirming a row writes one; nothing else does.
//   SUGGESTED  — read from the ledger on the fly, never stored, never counted.
//                It carries what the bank shows (how much, how often, from which
//                account, the day it was usually PAID) and leaves the actual
//                due date blank: a payment day is not a due date, and a late
//                payer's history says least of all about when a bill is due.
//
// One creditor paid twice a month is ONE suggestion ("about twice a month"),
// never two bills. Collection payments are suggested as arrangements, so they
// are counted, never dropped. A payment to the family's own accounts is
// suggested as a transfer; to BG, as a family obligation to confirm.
// =============================================================================
import { detectRecurring, payeeKey } from './recurring-payments.js';
import { isTransferTxn, isBalanceAdjustment } from './imported-view.js';
import { entityLabel, TLC_KINDS } from './entity-labels.js';

// The eight groups Christina named, in her order.
export const BILL_GROUPS = [
  ['home-mortgage', 'Personal home mortgage (primary residence)'],
  ['household', 'Regular monthly household bill'],
  ['rental', 'Rental property mortgage or expense'],
  ['business', 'TLC Therapy Solutions business expense'],
  ['arrangement', 'Creditor payment arrangement'],
  ['past-due', 'Past-due balance or catch-up payment'],
  ['transfer', 'Transfer between my accounts'],
  ['family', 'Family financial obligation'],
  ['one-time', 'One-time expense'],
];
const GROUP_IDS = BILL_GROUPS.map(([id]) => id);

// How each group behaves in Safe to Spend (OBLIGATION_TYPES in safe-to-spend.js).
export const GROUP_TYPE = {
  'home-mortgage': 'regular', household: 'regular', rental: 'regular', business: 'regular', transfer: 'regular', family: 'regular',
  arrangement: 'arrangement', 'past-due': 'past-due', 'one-time': 'one-time',
};

export const REVIEW_FREQUENCIES = [
  ['monthly', 'Monthly'], ['semimonthly', 'Twice a month'], ['biweekly', 'Every two weeks'], ['weekly', 'Weekly'],
  ['quarterly', 'Quarterly'], ['semiannual', 'Twice a year'], ['annual', 'Yearly'], ['once', 'Once'],
];

const COLLECTION = /ZWICKER|PORTFOLIO RECOV|\bPRA\b|MIDLAND|BRITT|COLLECT|RECOVERY|CREDIT ACCEPTANCE|LVNV|CAVALRY|JEFFERSON CAPITAL/i;
const OWN_ACCOUNTS = /\bTLC\b|POE PROPERT|ONLINE TRANSFER|P2PEXT|TRANSFER TO|CASH APP\*DARRELL/i;
const FAMILY = /\bBG\b|BG & MOM|\bMOM\b/i;
const RENTAL = /PROPERT|RENTAL|709 COMMERCIAL|\b805\b|HOLLY HILL|KOEHN|WILLIAMSBURG/i;

export function suggestGroup(label = '', category = '') {
  const s = `${label} ${category}`;
  if (COLLECTION.test(s)) return 'arrangement';
  if (FAMILY.test(s)) return 'family';
  if (OWN_ACCOUNTS.test(s)) return 'transfer';
  if (RENTAL.test(s)) return 'rental';
  return 'household';
}

function cadenceToFrequency(cadence) {
  // detectRecurring's keys: weekly, biweekly, monthly, bimonthly, quarterly.
  return { weekly: 'weekly', biweekly: 'biweekly', monthly: 'monthly', quarterly: 'quarterly' }[cadence] || 'monthly';
}

// A readable name from a bank description: the payee, without the bank's
// prefixes, confirmation codes, ids and dates. "Online Payment 30689451727 To
// Britt and Gaines 09/07" -> "Britt and Gaines"; "Zelle payment to BG & Mom
// JPM99d0j78te" -> "Zelle to BG & Mom".
export function cleanName(desc = '') {
  let s = String(desc).replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) s = s.replace(/^(POS DEBIT|ORIG CO NAME:|PAYPAL\s+PURCHASE|Stop Pymt Reviewed-? Item Paid|PENDING -|PYMT SENT|DEBIT CARD PURCHASE)\s*/i, '');
  const online = s.match(/^Online Payment\s+\S*\s*To\s+(.+?)(\s+\d\d\/\d\d)?$/i);
  if (online) s = online[1];
  const zelle = s.match(/^Zelle payment (to|from)\s+(.+)$/i);
  if (zelle) s = `Zelle ${zelle[1].toLowerCase()} ${zelle[2]}`;
  s = s.replace(/\b(WEB|PPD|CCD|TEL|ID)\s*ID:?\s*\S*/gi, ' ').replace(/\bID:\s*\S*/gi, ' ');
  const words = s.split(' ').filter((w) => w && !/\d/.test(w) && !/^[*#:]+$/.test(w));
  return words.slice(0, 5).join(' ').replace(/[*#]/g, ' ').replace(/\s+/g, ' ').trim() || String(desc).trim().slice(0, 40);
}

// One key per payee NAME, exactly as the bank wrote it once codes, ids and
// dates are removed. Different spellings stay DIFFERENT payees: Christina's two
// Britt & Gaines accounts are told apart only by "Britt and Gaines" vs "Britt &
// Gaines" (2026-11-03), so two spellings are never assumed to be one debt; the
// family can merge them on the review screen if they are.
export function mergeKey(desc = '') {
  return cleanName(desc).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Two spellings that MIGHT be one payee ("Britt and Gaines" / "Britt & Gaines",
// "URBANA & CHAMPAIGN SANITARY" / "URBANA AND CHAMPAIGN SANITARY"). Never used
// to merge on its own — only to flag the pair for the family to decide
// (Christina 2026-11-03: "group transactions by verified account identity, not
// just the payee name").
export function similarKey(desc = '') {
  return cleanName(desc).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z ]/g, ' ').split(' ')
    .filter((w) => w && !['and', 'the', 'to', 'of', 'llc', 'inc', 'co'].includes(w)).slice(0, 2).join(' ');
}

// The property a bank description names, by the first two words of a property
// on file ("709 Commercial", "1213 Koehn"); it carries that record's entity.
// Evidence from the family's own records, never a guess from the payer.
export function propertyNamedIn(data, text = '') {
  const hay = ` ${String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  for (const r of (data?.inflows?.rentals || [])) {
    if (!r || !r.entityId) continue;
    const words = String(r.name || r.address || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 2);
    if (words.length < 2 || !/\d/.test(words[0])) continue;
    if (hay.includes(` ${words.join(' ')} `)) return { entityId: r.entityId, rentalId: r.id };
  }
  return null;
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const round2 = (x) => Math.round(x * 100) / 100;

// Suggestions from the last `lookbackDays` of money OUT: the detector's steady
// payees, plus anything the family already filed as a debt payment, utility or
// insurance in two or more months (those amounts vary, so the detector skips them).
export function suggestBills(data, asOf = new Date(), { lookbackDays = 120 } = {}) {
  const since = new Date(asOf); since.setDate(since.getDate() - lookbackDays);
  const sinceIso = iso(since); const asOfIso = iso(asOf);
  const rows = (data?.transactions || []).filter((t) => t && t.date && Number(t.amount) < 0 && !isBalanceAdjustment(t)
    && String(t.date).slice(0, 10) >= sinceIso && String(t.date).slice(0, 10) <= asOfIso);
  const byKey = new Map();
  for (const t of rows) {
    const k = mergeKey(t.description || '');
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(t);
  }
  const out = new Map();
  const add = (key, list, frequency, source) => {
    if (out.has(key) || !list.length) return;
    const label = cleanName(list[list.length - 1].description || key);
    const months = new Set(list.map((t) => String(t.date).slice(0, 7)));
    const perMonth = list.length / Math.max(1, months.size);
    const days = list.map((t) => Number(String(t.date).slice(8, 10)));
    const dayCount = new Map(); for (const d of days) dayCount.set(d, (dayCount.get(d) || 0) + 1);
    const usualDay = [...dayCount.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
    const acctCount = new Map(); for (const t of list) acctCount.set(t.accountId, (acctCount.get(t.accountId) || 0) + 1);
    const accountId = [...acctCount.entries()].sort((a, b) => b[1] - a[1])[0][0] || null;
    const acct = (data?.accounts || []).find((a) => a.id === accountId);
    const category = String(list[list.length - 1].category || '');
    const transfer = list.every((t) => isTransferTxn(t));
    const group = transfer ? (FAMILY.test(label) ? 'family' : 'transfer') : suggestGroup(label, category);
    const owner = propertyNamedIn(data, list.map((t) => t.description || '').join(' '));
    out.set(key, {
      key, source: 'suggested', verified: false,
      name: label.length > 48 ? label.slice(0, 48) : label,
      amount: round2(median(list.map((t) => Math.abs(Number(t.amount))))),
      frequency: perMonth >= 1.7 && frequency === 'monthly' ? 'semimonthly' : frequency,
      group, accountId,
      // WHO OWES IT is never read off the account that paid it (Christina
      // 2026-11-03: "Sometimes I pay Poe Properties or TLC Therapy Solutions
      // expenses from my personal account"). It is filled only when the payee
      // names a property on file; otherwise NEEDS REVIEW.
      entityId: owner ? owner.entityId : null,
      rentalId: owner ? owner.rentalId : null,
      paidFromEntityId: acct ? acct.entityId ?? null : null,
      nextDue: '', payOn: '', balance: '', pastDue: '',
      evidence: { payments: list.length, months: months.size, usualDay, total: round2(list.reduce((s, t) => s - Number(t.amount), 0)), lastPaid: String(list.map((t) => t.date).sort().pop()).slice(0, 10), how: source },
    });
  };
  // The detector reads the merged payee name, so one payee spelled two ways
  // (or carrying a new Zelle code each time) is measured as one rhythm.
  const named = rows.map((t) => ({ ...t, description: mergeKey(t.description || '') }));
  for (const g of detectRecurring(named, { direction: 'out', nowMs: asOf.getTime() })) {
    const k = mergeKey(g.label || '') || g.key;
    const list = byKey.get(k) || [...byKey.entries()].find(([key]) => payeeKey(key) === g.key)?.[1] || [];
    add(k, list, cadenceToFrequency(g.cadence), 'a steady repeating payment');
  }
  for (const [k, list] of byKey) {
    const cats = new Set(list.map((t) => String(t.category || '')));
    const billish = ['debt-payment', 'utilities', 'insurance', 'cellphone-bill', 'mortgage', 'loan'].some((c) => cats.has(c)) || COLLECTION.test(list[0].description || '') || FAMILY.test(list[0].description || '') || /Zelle payment to TLC|Transfer to Poe/i.test(list[0].description || '');
    const months = new Set(list.map((t) => String(t.date).slice(0, 7)));
    if (billish && months.size >= 2) add(k, list, 'monthly', 'filed as a bill or debt payment in more than one month');
  }
  const all = [...out.values()];
  for (const s of all) {
    const sk = similarKey(s.name);
    s.similarTo = all.filter((o) => o !== s && sk && similarKey(o.name) === sk).map((o) => o.name);
  }
  return all.sort((a, b) => b.evidence.total - a.evidence.total);
}

// The review list: every saved obligation (as stored), then each suggestion the
// family has neither saved nor dismissed.
export function reviewRows(data, asOf = new Date(), dismissed = {}) {
  const saved = (data?.recurringObligations || []).filter(Boolean).map((o) => ({
    ...o, source: 'saved', key: `saved:${o.id}`,
    group: GROUP_IDS.includes(o.group) ? o.group : 'household',
    verified: o.verified === true,
  }));
  const savedKeys = new Set(saved.flatMap((o) => [mergeKey(o.name || ''), o.fromSuggestion, ...(o.alsoPaidAs || []).map((n) => mergeKey(n))].filter(Boolean)));
  const suggested = suggestBills(data, asOf).filter((s) => !savedKeys.has(s.key) && !dismissed[s.key]);
  return { saved, suggested };
}

// What a confirmed row stores. A row can only be confirmed with an amount and
// an actual due date — the two things a bank export cannot tell us.
// And who it belongs to: an entity is chosen, never assumed from the payer. A
// TLC Therapy Solutions bill also says whether it is an operating expense,
// therapist compensation or business debt.
export function missingForConfirm(row, entities = []) {
  const miss = [];
  if (!(Number(row.amount) > 0)) miss.push('amount');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.nextDue || ''))) miss.push('actual due date');
  const tag = entityLabel(entities, row.entityId);
  if (tag.kind === 'review') miss.push('who it belongs to');
  else if (tag.kind === 'tlc' && !TLC_KINDS.some(([k]) => k === row.tlcKind)) miss.push('TLC expense type');
  return miss;
}

export function toObligation(row, now = new Date()) {
  const group = GROUP_IDS.includes(row.group) ? row.group : 'household';
  const num = (x) => (x === '' || x == null || !Number.isFinite(Number(x)) ? null : round2(Number(x)));
  return {
    name: String(row.name || '').trim() || 'Bill',
    amount: round2(Number(row.amount) || 0),
    frequency: group === 'one-time' || group === 'past-due' ? 'once' : (row.frequency || 'monthly'),
    nextDue: row.nextDue,
    payOn: /^\d{4}-\d{2}-\d{2}$/.test(String(row.payOn || '')) ? row.payOn : '',
    balance: num(row.balance),
    pastDue: num(row.pastDue),
    accountId: row.accountId || null,
    entityId: row.entityId || null,
    // Poe Properties: which property the bill is for. TLC: what kind of spend.
    rentalId: row.rentalId || null,
    tlcKind: TLC_KINDS.some(([k]) => k === row.tlcKind) ? row.tlcKind : null,
    group,
    type: GROUP_TYPE[group],
    category: group,
    verified: true,
    verifiedAt: now.toISOString(),
    fromSuggestion: row.source === 'suggested' ? row.key : (row.fromSuggestion || null),
    // The personal home mortgage points at the existing home record, so Safe
    // to Spend counts this bill and not the record's P&I a second time.
    linkedMortgageId: group === 'home-mortgage' ? (row.linkedMortgageId || null) : null,
    // A collection account is known by who it was originally owed to and its
    // account or case number. Only the last four characters are kept.
    paidAs: row.paidAs || (row.source === 'suggested' ? row.name : null) || null,
    alsoPaidAs: Array.isArray(row.alsoPaidAs) ? row.alsoPaidAs.filter(Boolean) : [],
    originalCreditor: String(row.originalCreditor || '').trim() || null,
    accountLast4: maskLast4(row.accountLast4),
  };
}

export function maskLast4(v) {
  const s = String(v || '').replace(/[^A-Za-z0-9]/g, '');
  return s ? s.slice(-4) : null;
}

const PER_MONTH = { weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1, quarterly: 1 / 3, semiannual: 1 / 6, annual: 1 / 12 };

// When an arrangement is paid off at its agreed payment: whole payments left
// and the month of the last one. Null without a balance, payment and rhythm.
export function arrangementPayoff(o, from = new Date()) {
  const bal = Number(o && o.balance) || 0;
  const pay = Number(o && o.amount) || 0;
  const per = PER_MONTH[o && o.frequency];
  if (!(bal > 0) || !(pay > 0) || !per) return null;
  const payments = Math.ceil(bal / pay);
  const months = Math.ceil(payments / per);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(String(o.nextDue || '')) ? new Date(`${o.nextDue}T12:00:00`) : from;
  const end = new Date(start.getFullYear(), start.getMonth() + Math.max(0, months - 1), 1);
  return { payments, months, payoffMonth: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}` };
}
