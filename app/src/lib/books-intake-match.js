// =============================================================================
// books-intake-match — tie a document to what the family's books already know
// (DR-0707, the one Books upload)
// =============================================================================
// "Make it work with our known data." A document is matched to accounts (by
// last-4 first, institution second), entities, vendors, properties, debts,
// workers, projects, and to transactions already in the ledger. The rule that
// governs every match here: an existing record is REUSED, and a new one is only
// ever PROPOSED — never created silently. A duplicate account splits one card's
// history in two, which is worse than a question a person can answer later.
//
// Row-level dedupe is not re-invented: planBulkImport (bulk-statement-import.js)
// already keys every row by FITID or content + running balance, seeded from the
// ledger. matchDocument hands the rows to it.
// =============================================================================
import { planAccountImport, detectAccount } from './bulk-statement-import.js';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const last4Of = (a) => String((a && (a.fragment || a.last4 || a.mask)) || '').replace(/\D/g, '').slice(-4);

/** Accounts that could be this document's account, best first, with the reason. */
export function accountCandidates(x = {}, accounts = []) {
  const hint = x.account_hint || {};
  const out = [];
  for (const a of accounts || []) {
    if (!a || !a.id) continue;
    const l4 = last4Of(a);
    const inst = norm(hint.institution);
    const byLast4 = !!(hint.last4 && l4 && l4 === hint.last4);
    const byInstitution = !!(inst && [a.name, a.institution, a.bank].some((f) => norm(f) && (norm(f).includes(inst) || inst.includes(norm(f)))));
    if (byLast4) out.push({ id: a.id, name: a.name, reason: 'last-4', score: 3 + (byInstitution ? 1 : 0) });
    else if (byInstitution && !hint.last4) out.push({ id: a.id, name: a.name, reason: 'institution', score: 1 });
  }
  return out.sort((p, q) => q.score - p.score);
}

/**
 * The one account this document belongs to, when that is CERTAIN: exactly one
 * account shares its last-4. Anything else (none, or several) is a question.
 */
export function resolveAccount(x = {}, accounts = []) {
  const cands = accountCandidates(x, accounts).filter((c) => c.reason === 'last-4');
  if (cands.length === 1) return { accountId: cands[0].id, certain: true, candidates: cands };
  // No digits on the page: the proven filename router (a download saved as
  // 'chase7206.csv' names its account) is the second certain source.
  if (!cands.length && !(x.account_hint && x.account_hint.last4)) {
    const byFile = detectAccount(x.source_file && x.source_file.name, accounts);
    if (byFile) return { accountId: byFile, certain: true, candidates: [{ id: byFile, reason: 'file-name' }] };
  }
  return { accountId: null, certain: false, candidates: accountCandidates(x, accounts) };
}

// Ledger sign: the books carry a card's balance as NEGATIVE (owed), so a charge
// printed as +$23.45 on a card statement is -23.45 in the ledger and a payment
// printed as -$500 is +500 (demo-data a-cc-1; deriveAccountBalances adds rows).
export const isOwedDoc = (x) => x && (x.doc_type === 'card-statement' || x.doc_type === 'loan-statement');
export function ledgerRows(x = {}) {
  const flip = isOwedDoc(x);
  return (x.line_items || []).map((r) => ({ ...r, amount: flip ? -(Number(r.amount) || 0) : (Number(r.amount) || 0), category: r.category || 'other' }));
}

/**
 * The new account we WOULD create, shown as a suggestion, never created here.
 * Its anchor balance is chosen so anchor + the rows we add lands exactly on the
 * statement's closing balance (no double count of the period's activity).
 */
export function proposedAccount(x = {}) {
  const inst = (x.account_hint && x.account_hint.institution) || 'Imported';
  const l4 = x.account_hint && x.account_hint.last4;
  const isCard = x.doc_type === 'card-statement';
  const isLoan = x.doc_type === 'loan-statement';
  const s = x.summary || {};
  return {
    name: l4 ? `${inst} ${l4}` : `${inst} account`,
    type: isCard ? 'credit' : (isLoan ? 'loan' : 'bank'),
    treatAsDebt: isCard || isLoan,
    fragment: l4 || null,
    balance: s.newBalance != null
      ? Math.round(((isOwedDoc(x) ? -Math.abs(s.newBalance) : s.newBalance) - ledgerRows(x).reduce((n, r) => n + r.amount, 0)) * 100) / 100
      : 0,
    minPayment: s.minimumPayment != null ? s.minimumPayment : null,
    rate: s.apr != null ? s.apr : null,
    dueDay: x.dates && x.dates.due ? Number(x.dates.due.slice(8, 10)) : null,
  };
}

function byName(list, name, key = 'name') {
  const n = norm(name);
  if (!n) return null;
  return (list || []).find((r) => r && norm(r[key]) && (norm(r[key]) === n || n.includes(norm(r[key])) || norm(r[key]).includes(n))) || null;
}

/** Entities named on the page (or owning the matched account). */
export function resolveEntity(x = {}, { entities = [], accounts = [], accountId = null, text = '' } = {}) {
  const acc = accountId && (accounts || []).find((a) => a.id === accountId);
  if (acc && acc.entityId) return { entityId: acc.entityId, certain: true };
  const page = norm(text);
  const hits = (entities || []).filter((e) => e && e.name && norm(e.name).length >= 4 && page.includes(norm(e.name)));
  if (hits.length === 1) return { entityId: hits[0].id, certain: true };
  if ((entities || []).length === 1) return { entityId: entities[0].id, certain: true };
  return { entityId: null, certain: false, candidates: (hits.length ? hits : entities || []).map((e) => ({ id: e.id, name: e.name })) };
}

/** A rental whose address appears on the document (bills, property tax, insurance). */
export function resolveProperty(x = {}, rentals = [], text = '') {
  const page = norm(`${x.property_hint || ''} ${text}`);
  const hit = (rentals || []).find((r) => {
    const addr = norm(r && (r.address || r.name));
    const street = addr.split(' ').slice(0, 3).join(' ');
    return street.length >= 6 && page.includes(street);
  });
  return hit ? { propertyId: hit.id, name: hit.name || hit.address } : null;
}

/** Vendors: a party on the page that matches a known payee, subscription or contractor. */
export function resolveVendor(x = {}, { subscriptions = [], contractors = [], transactions = [] } = {}) {
  const names = (x.parties || []).map((p) => p.name).concat(x.account_hint && x.account_hint.institution ? [x.account_hint.institution] : []);
  for (const n of names) {
    const sub = byName(subscriptions, n);
    if (sub) return { kind: 'subscription', id: sub.id, name: sub.name };
    const c = byName(contractors, n);
    if (c) return { kind: 'contractor', id: c.id, name: c.name };
    const t = (transactions || []).find((r) => r && norm(r.description).includes(norm(n)) && norm(n).length >= 4);
    if (t) return { kind: 'payee', id: null, name: n };
  }
  return null;
}

/** A debt this document pays toward or describes (by account). */
export function resolveDebt(accountId, debts = []) {
  if (!accountId) return null;
  const d = (debts || []).find((r) => r && (r.accountId === accountId || r.id === accountId));
  return d ? { id: d.id, name: d.name } : null;
}

/**
 * Rows the ledger does not have yet, through the proven dedupe. Returns
 * { txns, duplicates } — txns carry stable ids so a re-upload is a no-op.
 */
export function newRowsFor(x = {}, accountId, transactions = []) {
  if (!accountId) return { txns: [], duplicates: 0 };
  return planAccountImport(ledgerRows(x), accountId, transactions || []);
}

/** Every match at once, for the document's detail view and the question queue. */
export function matchDocument(x = {}, known = {}, { text = '' } = {}) {
  const acc = resolveAccount(x, known.accounts || []);
  const ent = resolveEntity(x, { entities: known.entities || [], accounts: known.accounts || [], accountId: acc.accountId, text });
  return {
    account: acc,
    proposedAccount: acc.accountId ? null : proposedAccount(x),
    entity: ent,
    property: resolveProperty(x, known.rentals || [], text),
    vendor: resolveVendor(x, known),
    debt: resolveDebt(acc.accountId, known.debts || []),
    worker: byName(known.contractors || [], (x.parties || []).find((p) => p.role === 'employer' || p.role === 'payer')?.name) || null,
  };
}
