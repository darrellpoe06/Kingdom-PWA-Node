// =============================================================================
// family-trust-store — device-local persistence for the Legacy Provisions system
// =============================================================================
// Local-first, exactly like the advocacy ledger: the family can record a
// contribution, a distribution, an attestation or a spendthrift answer on a
// phone with no signal, and lib/family-trust-sync.js is the courier that carries
// it to the rest of the house when a session exists.
//
// family-trust.js stays PURE (no browser APIs) so its engine is node-testable;
// this file is the only place the Legacy Provisions data touches storage.
// =============================================================================

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch { return null; }
}

const ENTRIES_KEY = 'poetech-family-trust-entries-v1';
const PEOPLE_KEY = 'poetech-family-trust-people-v1';

function readJson(key, fallback) {
  const ls = safeStorage();
  if (!ls) return fallback;
  try {
    const raw = ls.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function writeJson(key, value) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(key, JSON.stringify(value));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

/** Ledger entries: production / distribution / attestation / exemption. */
export function loadTrustEntries() { return readJson(ENTRIES_KEY, []); }
export function saveTrustEntries(entries) { return writeJson(ENTRIES_KEY, Array.isArray(entries) ? entries : []); }

// Spendthrift review answers are NOT a second store — they ride the same entries
// list as 'spendthrift' rows (family-trust.js spendthriftAnswersFrom folds them),
// so one sync carries the whole system and the two can never drift apart.

/** The beneficiary roster this house is tracking: [{ id, name }]. */
export function loadBeneficiaries() { return readJson(PEOPLE_KEY, []); }
export function saveBeneficiaries(people) { return writeJson(PEOPLE_KEY, Array.isArray(people) ? people : []); }

/** A stable local id for a new record (no dependency, no collision in practice). */
export function newRecordId(prefix = 'ft') {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
