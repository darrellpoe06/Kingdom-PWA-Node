// =============================================================================
// bank-formats — learn a bank's statement layout once, reuse it forever
// =============================================================================
// Darrell 2026-08-11: "Automatically creates an account and vendor for perpetual
// use for any user the format should be the same for the same banks eventually
// we would have all of them... imported data would be easier to parce."
//
// What happens today (measured): every import re-derives the layout from
// scratch. findStatementHeader scans for a header row and parseStatementText
// guesses the shape, per file, every time. Nothing remembers that THIS bank
// lays its columns out THIS way, so Chase parses like a stranger on the
// hundredth statement exactly as it did on the first. And detectAccount only
// MATCHES an existing account by a digit fragment in the filename — upload a
// card that was never set up and there is nothing to route to.
//
// This module is the missing memory. It fingerprints a statement by its HEADER
// (the columns the bank actually wrote), not by the filename a person happened
// to save it under, records the mapping once, and hands it back on every later
// import from the same bank.
//
// THE CACHED-ASSUMPTION HAZARD, GUARDED. A remembered format is an assumption,
// and banks change their exports without telling anyone. A registry that
// quietly parses a changed layout with yesterday's mapping is the same failure
// class as the recurring detector that invented subscriptions: confident, and
// wrong. So every reuse re-checks the fingerprint, and a header that no longer
// matches is RE-LEARNED rather than forced through the stale mapping.
//
// Pure and storage-injected: no window, no DOM, no network.
// =============================================================================

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The column roles we need; everything else on a statement is passenger data. */
export const ROLES = ['date', 'description', 'amount', 'debit', 'credit', 'balance', 'fitid'];

// How each role is written in the wild. Ordered longest-first inside a role so
// "posting date" wins over "date" when both appear.
const ROLE_WORDS = {
  date: ['transaction date', 'posting date', 'post date', 'trans date', 'date'],
  description: ['description', 'payee', 'merchant', 'memo', 'details', 'name'],
  amount: ['amount', 'transaction amount'],
  debit: ['debit', 'withdrawal', 'charges', 'payments made'],
  credit: ['credit', 'deposit', 'deposits'],
  balance: ['running balance', 'balance'],
  fitid: ['fitid', 'reference number', 'transaction id', 'reference'],
};

/**
 * Map a header row's cells onto roles. Returns { role: columnIndex }, only for
 * roles actually present — an absent role is absent, never index 0 by accident.
 */
export function mapColumns(headerCells = []) {
  const cells = headerCells.map(norm);
  const out = {};
  for (const role of ROLES) {
    let best = null;
    for (const word of ROLE_WORDS[role]) {
      for (let i = 0; i < cells.length; i += 1) {
        if (!cells[i]) continue;
        if (cells[i] === word) { best = { i, len: word.length, exact: true }; break; }
        if (!best?.exact && cells[i].includes(word) && (!best || word.length > best.len)) {
          best = { i, len: word.length, exact: false };
        }
      }
      if (best?.exact) break;
    }
    if (best && !Object.values(out).includes(best.i)) out[role] = best.i;
  }
  return out;
}

// Issuers we can name from the statement body. Naming the bank is a convenience
// for the account we create; the FORMAT is keyed on the header signature, so an
// unrecognised issuer still gets a perfectly good remembered layout.
const ISSUERS = [
  { key: 'chase', label: 'Chase', re: /\bchase\b|jpmorgan/i },
  { key: 'capital-one', label: 'Capital One', re: /capital\s*one/i },
  { key: 'discover', label: 'Discover', re: /\bdiscover\b/i },
  { key: 'amex', label: 'American Express', re: /american\s*express|\bamex\b/i },
  { key: 'citi', label: 'Citi', re: /\bciti\b|citibank/i },
  { key: 'wells-fargo', label: 'Wells Fargo', re: /wells\s*fargo/i },
  { key: 'bofa', label: 'Bank of America', re: /bank\s*of\s*america|bankofamerica/i },
  { key: 'synchrony', label: 'Synchrony', re: /synchrony/i },
];

/** The last 4 digits of an account, from the usual masked forms. */
export function accountFragment(text = '') {
  const m = String(text).match(/(?:ending(?:\s+in)?|acct|account|card)\D{0,12}(\d{4})\b/i)
    || String(text).match(/[*xX•]{2,}\s*(\d{4})\b/);
  return m ? m[1] : null;
}

/**
 * Fingerprint a statement: who wrote it, how its columns are laid out, and a
 * stable signature to remember it by.
 *
 * The signature is built from the HEADER CELLS — the one part of a file that is
 * the bank's own choice and is stable across months. Filenames are not: people
 * rename downloads, and two banks both produce "statement (3).csv".
 */
export function fingerprintStatement({ headerCells = [], text = '' } = {}) {
  const cells = (headerCells || []).map(norm).filter(Boolean);
  const signature = cells.join('|');
  const columns = mapColumns(headerCells);
  const issuer = ISSUERS.find((i) => i.re.test(String(text))) || null;
  // A layout is usable only if we can read WHEN and HOW MUCH. Description is
  // strongly wanted but a statement without it is still importable.
  const hasAmount = columns.amount != null || columns.debit != null || columns.credit != null;
  return {
    signature,
    usable: signature.length > 0 && columns.date != null && hasAmount,
    columns,
    bank: issuer ? issuer.key : null,
    bankLabel: issuer ? issuer.label : null,
    fragment: accountFragment(text),
    signConvention: columns.debit != null && columns.credit != null ? 'split' : 'signed',
  };
}

// ---------------------------------------------------------------------------
// The registry — remembered layouts, keyed by signature
// ---------------------------------------------------------------------------
export const BANK_FORMATS_KEY = 'poe.books.bankFormats.v1';

const safeParse = (raw) => { try { return JSON.parse(raw) || {}; } catch { return {}; } };

export function loadFormats(store) {
  try {
    const raw = store && store.getItem(BANK_FORMATS_KEY);
    const v = raw ? safeParse(raw) : {};
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}

/** Remember a usable layout. An unusable fingerprint is never stored. */
export function rememberFormat(fp, store, at = null) {
  if (!fp || !fp.usable || !store) return loadFormats(store);
  const all = loadFormats(store);
  const prev = all[fp.signature] || {};
  all[fp.signature] = {
    signature: fp.signature,
    columns: fp.columns,
    bank: fp.bank ?? prev.bank ?? null,
    bankLabel: fp.bankLabel ?? prev.bankLabel ?? null,
    signConvention: fp.signConvention,
    seen: (prev.seen || 0) + 1,
    firstSeen: prev.firstSeen ?? at,
    lastSeen: at,
  };
  try { store.setItem(BANK_FORMATS_KEY, JSON.stringify(all)); } catch { /* quota */ }
  return all;
}

/**
 * Recall a layout for a statement in hand.
 *
 * Returns { status, format }:
 *   'remembered' — this exact header has been seen before; reuse it
 *   'new'        — never seen; derive it now and remember it
 *   'changed'    — the bank is known but its header no longer matches, so the
 *                  stored mapping is STALE and must not be applied. Re-derive.
 *   'unusable'   — no date or no amount column; nothing to reuse
 *
 * The 'changed' case is the whole reason this is not a plain lookup. A silent
 * hit on a stale mapping would shift every column by one and import a year of
 * wrong numbers with total confidence.
 */
export function recallFormat(fp, store) {
  if (!fp || !fp.usable) return { status: 'unusable', format: null };
  const all = loadFormats(store);
  const hit = all[fp.signature];
  if (hit) return { status: 'remembered', format: hit };
  if (fp.bank) {
    const sameBank = Object.values(all).find((f) => f && f.bank === fp.bank);
    if (sameBank) return { status: 'changed', format: null, previous: sameBank };
  }
  return { status: 'new', format: null };
}

/**
 * What must be CREATED for this statement to have a home.
 *
 * Returns the account (and vendor) to provision, or nulls when an existing
 * account already covers it. Never invents an account when one matches: a
 * duplicate account silently splits a card's history in two, which is worse
 * than an unrouted import a person can see and fix.
 */
export function provisionFromStatement(fp, { accounts = [], summary = null, entityId = null } = {}) {
  const frag = fp && fp.fragment;
  const existing = (accounts || []).find((a) => {
    const af = String((a && a.fragment) || '').replace(/\D/g, '');
    return frag && af && af.slice(-4) === frag;
  }) || null;

  const label = fp && fp.bankLabel ? fp.bankLabel : 'Imported card';
  const name = frag ? `${label} ${frag}` : label;
  const isCard = !!(summary && (summary.minimumPayment != null || summary.dueDate != null));

  return {
    existingAccountId: existing ? existing.id : null,
    account: existing ? null : {
      name,
      type: isCard ? 'credit' : 'bank',
      treatAsDebt: isCard,
      fragment: frag || null,
      entityId,
      balance: summary && summary.statementBalance != null ? summary.statementBalance : 0,
      minPayment: summary && summary.minimumPayment != null ? summary.minimumPayment : null,
      rate: summary && summary.apr != null ? summary.apr : null,
      dueDay: summary && summary.dueDay != null ? summary.dueDay : null,
      bank: fp ? fp.bank : null,
    },
    vendor: existing ? null : { name: label, kind: 'financial-institution', bank: fp ? fp.bank : null },
  };
}
