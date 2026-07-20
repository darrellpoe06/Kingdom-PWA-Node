// =============================================================================
// learned-dedupe — the combine feature LEARNS, so a duplicate shape is caught next
// time without a new hardcoded rule or an app update
// =============================================================================
// Darrell 2026-07-20: the combine-duplicates escape hatch (#955) lets the family
// remove duplicates they spot, but it forgets — the next identical shape has to be
// found and combined by hand again. This is the learning layer: when the family
// combines rows, we remember the PAYEE they just confirmed has duplicates, and then
// SUGGEST any other exact (payee + date + amount + account) repeats from that payee
// for a one-tap combine. Still user-confirmed, never an auto-delete: the learning
// only decides what to SUGGEST; the family approves each combine (undo/history hold).
//
// Why gate suggestions on a LEARNED payee (not "flag every exact repeat"): a payee
// can legitimately post the same amount twice in a day (two $5 coffees). Suggesting
// only for payees the family has already taught keeps a real repeat from being
// called a duplicate. Extending an approved capability, not a new bright line
// (DR-0189). Pure core (signature/learn/suggest) + a fail-soft localStorage layer;
// pinned by learned-dedupe.test.js.
// =============================================================================

import { payeeKey } from './categorize.js';

const cents = (n) => Math.round((Number(n) || 0) * 100);

// The exact-duplicate signature: same payee, same date, same amount, same account.
// Rows sharing this are the same charge posted more than once. Accepts the imported
// row shape (name/posted/accountId) and the raw txn shape (description/date/accountId).
export function dedupeSignature(t) {
  const desc = t?.description ?? t?.name ?? '';
  const date = t?.date ?? t?.posted ?? '';
  const acct = t?.accountId ?? '';
  return `${payeeKey(desc)}|${String(date)}|${cents(t?.amount)}|${String(acct)}`;
}

// The payee key a row teaches when the family combines it (what "learned" stores).
export function learnedPayeeOf(t) {
  return payeeKey(t?.description ?? t?.name ?? '');
}

// learnFromCombine — record the payee(s) the family just confirmed have duplicates.
// Pure: returns a NEW learned map ({ [payeeKey]: true }); the caller persists it.
export function learnFromCombine(learned, rows) {
  const next = { ...(learned || {}) };
  for (const r of (rows || [])) {
    const k = learnedPayeeOf(r);
    if (k) next[k] = true;
  }
  return next;
}

// suggestLearnedDuplicates — groups of >= 2 CURRENT transactions that share an exact
// dedupeSignature AND whose payee the family has TAUGHT (in `learned`). Each group
// names the row to keep (most-informative: longest description; tie -> first seen)
// and the ids to remove. Deterministic; never mutates input; returns [] when there's
// nothing learned or nothing repeating. The caller shows each group for a one-tap,
// user-confirmed combine.
export function suggestLearnedDuplicates(transactions, learned) {
  const rules = learned || {};
  if (!Object.keys(rules).length) return [];
  const bySig = new Map();
  for (const t of (transactions || [])) {
    if (!t || !t.id) continue;
    const pk = learnedPayeeOf(t);
    if (!pk || !rules[pk]) continue; // only payees the family taught
    const sig = dedupeSignature(t);
    if (!bySig.has(sig)) bySig.set(sig, []);
    bySig.get(sig).push(t);
  }
  const groups = [];
  for (const [sig, rows] of bySig) {
    if (rows.length < 2) continue;
    const keep = [...rows].sort((a, b) => String(b.description ?? b.name ?? '').length - String(a.description ?? a.name ?? '').length)[0];
    const removeIds = rows.filter((r) => r.id !== keep.id).map((r) => r.id);
    groups.push({
      signature: sig,
      payeeKey: learnedPayeeOf(keep),
      label: String(keep.description ?? keep.name ?? '').trim(),
      amount: (Number(keep.amount) || 0),
      count: rows.length,
      keepId: keep.id,
      removeIds,
      extra: removeIds.length,
    });
  }
  // Most copies first (biggest cleanup up top).
  groups.sort((a, b) => b.extra - a.extra);
  return groups;
}

// ---- fail-soft, per-device persistence (needs no deploy, no shell handler) ------
// Device-local learning (like the theme pref): keyed by the saved profile so one
// family member's teaching doesn't bleed across profiles on a shared device. Every
// access is wrapped — a private-mode / quota error never throws into the render.

const KEY_BASE = 'poe-learned-dedupe';
function storeKey() {
  try {
    const profile = (typeof localStorage !== 'undefined' && localStorage.getItem('poe-current-profile')) || 'default';
    return `${KEY_BASE}:${profile}`;
  } catch { return KEY_BASE; }
}

export function loadLearnedDedupe() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storeKey()) : null;
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

export function saveLearnedDedupe(learned) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(storeKey(), JSON.stringify(learned || {}));
  } catch { /* private mode / quota — the learning is best-effort */ }
}
