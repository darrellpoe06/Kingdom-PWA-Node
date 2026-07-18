// =============================================================================
// tax-id-vault — the FULL taxpayer ID (SSN/EIN) lives ONLY on this device
// =============================================================================
// Darrell 2026-07-18: "Only saves to the cellphone or the backup NAS devices...
// we store no [sensitive] data." A contractor's full SSN/EIN is the most
// sensitive datum the family handles. The sovereign rule: it NEVER enters the
// cloud. The synced record (contractors-sync) carries only the LAST 4 + the W-9-
// on-file flag; the FULL id is written here, to this device's localStorage, and
// nowhere else. What isn't stored server-side can't leak, be subpoenaed from the
// vendor, or be exposed by an RLS gap.
//
// Cross-device access is by the family's own NAS backup (exportForBackup ->
// device -> NAS), NOT by cloud sync. Device loss without a NAS backup = the id is
// gone (a deliberate constraint of the "we store no data" posture).
//
// Pure where possible; all localStorage access is guarded so it is safe in tests
// / SSR (no window) and never throws into the caller.
// =============================================================================

const VAULT_KEY = 'poe.taxIdVault.v1';

// lastFour — the last 4 DIGITS of a taxpayer id, the only part allowed to leave
// the device (into the synced record, to identify the payee). Strips formatting
// (dashes/spaces) first so "12-3456789" -> "6789". Returns '' when there are no
// digits. Pure.
export function lastFour(fullId) {
  const digits = String(fullId == null ? '' : fullId).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits;
}

// A masked display of a stored id: the type + last 4, never the full number.
// e.g. maskedLabel('ein', '6789') -> 'EIN ····6789'. Pure.
export function maskedLabel(type, last4) {
  const t = type === 'ssn' ? 'SSN' : type === 'ein' ? 'EIN' : 'TIN';
  return last4 ? `${t} ····${last4}` : `${t} — not on file`;
}

function readVault() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch { return {}; }
}

function writeVault(obj) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(VAULT_KEY, JSON.stringify(obj || {}));
    return true;
  } catch { return false; }
}

// Store the FULL taxpayer id for a contractor ON THIS DEVICE ONLY. Returns the
// last 4 (the caller writes THAT — never the full id — to the synced record).
// A blank/short id clears the entry. The full id is never returned to any code
// path that syncs.
export function setFullTaxId(contractorId, fullId, { type = null } = {}) {
  if (!contractorId) return '';
  const digits = String(fullId == null ? '' : fullId).replace(/\D/g, '');
  const vault = readVault();
  if (!digits) { delete vault[contractorId]; writeVault(vault); return ''; }
  vault[contractorId] = { full: digits, type: type || null, savedAt: null };
  writeVault(vault);
  return lastFour(digits);
}

// Read the FULL id back for filing — on the device that holds it. Returns '' when
// this device has no copy (e.g. it was entered on another device and only the
// last-4 came down from the cloud). Never throws.
export function getFullTaxId(contractorId) {
  if (!contractorId) return '';
  const entry = readVault()[contractorId];
  return entry && entry.full ? entry.full : '';
}

// True when THIS device holds the full id for a contractor (so the UI can show
// "full id on this device" vs "last-4 only, from another device").
export function hasFullTaxId(contractorId) {
  return !!getFullTaxId(contractorId);
}

export function clearFullTaxId(contractorId) {
  const vault = readVault();
  if (vault[contractorId]) { delete vault[contractorId]; writeVault(vault); }
}

// The whole vault as a plain object, for the family to BACK UP to their NAS
// (device -> NAS, never cloud). The only sanctioned way the full ids leave the
// device, and it goes to hardware the family owns.
export function exportForBackup() {
  return readVault();
}

// Restore a vault previously backed up to the NAS (NAS -> device). Merges into
// whatever this device already holds (device entries win on conflict, so a
// restore never clobbers a fresher local id).
export function importFromBackup(backup) {
  if (!backup || typeof backup !== 'object') return 0;
  const vault = readVault();
  let added = 0;
  for (const [id, entry] of Object.entries(backup)) {
    if (!vault[id] && entry && entry.full) { vault[id] = entry; added += 1; }
  }
  writeVault(vault);
  return added;
}
