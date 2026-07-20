// =============================================================================
// recurring-decisions — the "keep / review / cancel" audit ON the auto-detected
// Recurring payments KPI (Darrell 2026-07-20: move the subscription audit into
// Imported, where the recurring charges are already detected from the REAL
// ledger — no manual entry, never empty, unlike the Cart). Each detected pattern
// (keyed by its stable `key`) carries a decision the family sets; from that we
// compute the monthly bleed and the potential savings (what's flagged to review
// or cut). Device-local + fail-soft, exactly like report-usage.js — real
// persisted state keyed by pattern, no painted data (DR-0061), no monolith growth.
// =============================================================================

export const RECURRING_DECISIONS_KEY = 'poe.imported.recurringDecisions.v1';
export const DECISIONS = ['keep', 'review', 'cancel'];

function safeStore() {
  try {
    if (typeof globalThis === 'undefined') return null;
    const s = globalThis.localStorage;
    if (!s || typeof s.getItem !== 'function') return null;
    return s;
  } catch { return null; }
}

// Read the decisions map { [patternKey]: 'keep'|'review'|'cancel' }. Malformed or
// unknown-value entries are dropped (deterministic; never trust the store blindly).
export function loadRecurringDecisions(store = safeStore()) {
  if (!store) return {};
  let raw;
  try { raw = store.getItem(RECURRING_DECISIONS_KEY); } catch { return {}; }
  if (!raw) return {};
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return {}; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof k === 'string' && DECISIONS.includes(v)) out[k] = v;
  }
  return out;
}

// Set (or clear) one pattern's decision and persist. Passing a decision equal to
// the current one CLEARS it (a toggle back to undecided). Returns the NEW map.
export function setRecurringDecision(key, decision, store = safeStore(), prev = loadRecurringDecisions(store)) {
  if (typeof key !== 'string' || !key) return prev;
  const next = { ...prev };
  if (!DECISIONS.includes(decision) || prev[key] === decision) delete next[key];
  else next[key] = decision;
  if (store) {
    try { store.setItem(RECURRING_DECISIONS_KEY, JSON.stringify(next)); } catch { /* fail-soft */ }
  }
  return next;
}

// Summarize the audit over the detected patterns + the family's decisions. Pure.
// `potentialSavings` = the per-cycle amount flagged to REVIEW or CANCEL (the
// "what could I cut" number that makes the audit worth doing).
export function summarizeDecisions(patterns = [], decisions = {}) {
  let total = 0, keep = 0, review = 0, cancel = 0, undecided = 0, potentialSavings = 0;
  for (const p of patterns) {
    const amt = Number(p.amount) || 0;
    total += amt;
    const d = decisions[p.key];
    if (d === 'keep') keep += 1;
    else if (d === 'review') { review += 1; potentialSavings += amt; }
    else if (d === 'cancel') { cancel += 1; potentialSavings += amt; }
    else undecided += 1;
  }
  return { total, keep, review, cancel, undecided, flagged: review + cancel, potentialSavings };
}
