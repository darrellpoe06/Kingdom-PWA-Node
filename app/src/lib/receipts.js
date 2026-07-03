// =============================================================================
// receipts — the paper trail behind the ledger (DR-0090)
// =============================================================================
// Darrell 2026-07-03 (holding a real Aspen Tap House receipt): "How do we
// upload receipts?" The honest answer was "you can't yet" — this module is the
// fix. Two flows, one storage decision:
//
//   ATTACH  — a transaction row already exists: the compressed photo is stored
//             ON the transaction (`receipt` field) and rides the existing
//             sync (transactions-sync toRow/fromRow + migration 0069), so a
//             matched receipt is visible on every signed-in device.
//   SNAP NOW, MATCH LATER — the paper receipt exists days before the bank row
//             lands. The photo waits in a PENDING pool; when the charge
//             arrives, suggestMatches pairs them by amount + date and one tap
//             attaches. The pool is deliberately Phase-1 simple: per-device
//             localStorage (same posture as the rest of the financial blob),
//             capped, and drains as matches land. re-review: move the pool to
//             a synced table when cross-device pending matters (2026-08-01).
//
// Images are compressed data URLs (lib/image.js compressImageFile), the same
// pattern every photo surface in the app already uses — no new buckets, no
// dashboard steps, exportable with the data (DATA-AS-EMPOWERMENT).
// Pure logic (shapes, matching, pool math) is exported and unit-tested;
// storage is injected so tests never touch the real localStorage.
// =============================================================================

export const PENDING_KEY = 'poe-receipts-pending';
export const PENDING_CAP = 20;          // pool is a waiting room, not an archive
export const MATCH_WINDOW_DAYS = 4;     // card settlements trail the paper by days

function defaultStorage() {
  try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; }
  catch { return null; }
}

// --- Pure shapes ---------------------------------------------------------------

// The object stored on a transaction row (and inside the pending pool).
export function receiptShape({ src, amount, merchant, note, capturedAt } = {}) {
  return {
    id: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    src: typeof src === 'string' ? src : '',
    amount: Number.isFinite(parseFloat(amount)) ? Math.abs(parseFloat(amount)) : null,
    merchant: (merchant || '').trim() || null,
    note: (note || '').trim() || null,
    capturedAt: capturedAt || new Date().toISOString().slice(0, 10),
  };
}

// --- Pending pool (per-device, capped, injected storage) ------------------------

export function loadPending(storage = defaultStorage()) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PENDING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function savePending(list, storage) {
  if (!storage) return;
  try { storage.setItem(PENDING_KEY, JSON.stringify(list)); } catch { /* full/blocked: honest no-op */ }
}

export function addPending(receipt, storage = defaultStorage()) {
  const list = loadPending(storage);
  if (list.length >= PENDING_CAP) {
    return { skipped: 'cap', message: `The waiting room holds ${PENDING_CAP} receipts — match or delete some first.` };
  }
  const next = [receipt, ...list];
  savePending(next, storage);
  return { added: true, pending: next };
}

export function removePending(id, storage = defaultStorage()) {
  const next = loadPending(storage).filter((r) => r.id !== id);
  savePending(next, storage);
  return { removed: true, pending: next };
}

// --- Matching (pure) -------------------------------------------------------------

function daysBetween(aIso, bIso) {
  const a = Date.parse(`${String(aIso).slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${String(bIso).slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  return Math.abs(a - b) / 86400000;
}

// Candidate transactions for a pending receipt: same absolute amount (to the
// cent) when the receipt carries one, within the settlement window, and not
// already carrying a receipt. Sorted nearest-date-first, capped at 5.
export function suggestMatches(receipt, transactions, { windowDays = MATCH_WINDOW_DAYS } = {}) {
  const rAmt = receipt && receipt.amount != null ? Math.round(Math.abs(receipt.amount) * 100) : null;
  const when = receipt?.capturedAt;
  return (transactions || [])
    .filter((t) => t && !t.receipt && t.date)
    .filter((t) => daysBetween(t.date, when) <= windowDays)
    .filter((t) => rAmt === null || Math.round(Math.abs(Number(t.amount) || 0) * 100) === rAmt)
    .sort((a, b) => daysBetween(a.date, when) - daysBetween(b.date, when))
    .slice(0, 5);
}
