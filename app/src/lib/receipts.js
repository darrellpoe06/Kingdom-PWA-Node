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
// A settled card charge for a tipped service = the printed paper total PLUS the
// handwritten tip. The paper says $72.60 (balance due); the card settles $86.68.
// Exact-cent matching (the original DR-0090 rule) therefore NEVER pairs a
// restaurant receipt to its real charge — the exact defect Darrell hit
// 2026-07-05 on the very Aspen Tap House receipt this feature was built around.
// Tip only ADDS, so the tolerance is one-directional (charge >= paper total) and
// bounded, which keeps false positives low; the match is still human-confirmed.
export const TIP_TOLERANCE_PCT = 0.30;  // charge may exceed the paper total by up to 30% (tip)

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

// Absolute amount in whole cents (sign-agnostic — a charge is negative, a
// receipt total positive; we compare magnitudes).
function cents(n) { return Math.round(Math.abs(Number(n) || 0) * 100); }

// How well a receipt's merchant name overlaps a transaction description — the
// count of receipt-merchant words (>=3 chars, so "the"/"to" don't count) that
// appear in the bank description. Pure, case-insensitive. Used only to RANK
// ties; it never widens or narrows the candidate set, so it cannot mis-pair.
export function merchantOverlap(receipt, txn) {
  const m = ((receipt && receipt.merchant) || '').toLowerCase();
  const d = ((txn && txn.description) || '').toLowerCase();
  if (!m || !d) return 0;
  const words = m.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  return words.filter((w) => d.includes(w)).length;
}

// Why a transaction is (or isn't) a candidate for a receipt — pure, exported
// for the surface (which labels each suggestion so an INEXACT pairing is
// flagged for the human to confirm) and for the tests:
//   'exact' — magnitudes equal to the cent
//   'tip'   — the charge is the paper total plus up to TIP_TOLERANCE_PCT
//   'date'  — the receipt carries no total; paired on the settlement window only
//   null    — not a candidate
export function matchKind(receipt, txn, { tolerance = TIP_TOLERANCE_PCT } = {}) {
  if (!receipt || !txn) return null;
  if (receipt.amount == null) return 'date';
  const rAmt = cents(receipt.amount);
  const tAmt = cents(txn.amount);
  if (tAmt === rAmt) return 'exact';
  if (tAmt > rAmt && tAmt <= Math.round(rAmt * (1 + tolerance))) return 'tip';
  return null;
}

const KIND_RANK = { exact: 0, tip: 1, date: 2 };

// Candidate transactions for a pending receipt: within the settlement window,
// not already carrying a receipt, and a matchKind other than null (exact, or a
// bounded tip-inclusive charge, or — when the receipt has no total — the date
// window alone). Ranked best-match-first: match quality, then merchant-name
// overlap, then nearest settlement date. Capped at 5.
export function suggestMatches(receipt, transactions, { windowDays = MATCH_WINDOW_DAYS, tolerance = TIP_TOLERANCE_PCT } = {}) {
  const when = receipt?.capturedAt;
  return (transactions || [])
    .filter((t) => t && !t.receipt && t.date)
    .filter((t) => daysBetween(t.date, when) <= windowDays)
    .map((t) => ({ t, kind: matchKind(receipt, t, { tolerance }) }))
    .filter((x) => x.kind !== null)
    .sort((a, b) => {
      if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
      const mo = merchantOverlap(receipt, b.t) - merchantOverlap(receipt, a.t);
      if (mo !== 0) return mo;
      return daysBetween(a.t.date, when) - daysBetween(b.t.date, when);
    })
    .slice(0, 5)
    .map((x) => x.t);
}
