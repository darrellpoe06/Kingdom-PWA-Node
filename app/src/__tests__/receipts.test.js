// @vitest-environment node
// =============================================================================
// receipts — proven-to-catch for the paper trail (DR-0090 / DR-0076)
// =============================================================================
// The first real test case is the receipt Darrell photographed the night this
// shipped: Aspen Tap House, 07/02/2026, $48.59 + tip on the VISA. The paper
// exists DAYS before the bank row lands — snap-now-match-later must pair them
// by amount within the settlement window, and the attached receipt must ride
// the transaction row's sync so it reaches every device.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  receiptShape, loadPending, addPending, removePending, suggestMatches, matchKind, merchantOverlap, PENDING_CAP,
} from '../lib/receipts.js';

const here = dirname(fileURLToPath(import.meta.url));

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

describe('receiptShape', () => {
  it('normalizes the fields and absolutizes the amount', () => {
    const r = receiptShape({ src: 'data:image/jpeg;base64,x', amount: '-48.59', merchant: ' Aspen Tap House ', capturedAt: '2026-07-02' });
    expect(r.amount).toBe(48.59);
    expect(r.merchant).toBe('Aspen Tap House');
    expect(r.capturedAt).toBe('2026-07-02');
    expect(r.id).toMatch(/^rcpt-/);
    expect(receiptShape({ src: 'x' }).amount).toBeNull();
  });
});

describe('pending pool — per-device waiting room', () => {
  it('adds, survives a reload, and removes', () => {
    const s = fakeStorage();
    const r = receiptShape({ src: 'x', amount: 48.59, capturedAt: '2026-07-02' });
    expect(addPending(r, s).added).toBe(true);
    expect(loadPending(s)).toHaveLength(1);
    expect(removePending(r.id, s).pending).toHaveLength(0);
  });
  it('caps the pool and says so instead of silently dropping', () => {
    const s = fakeStorage();
    for (let i = 0; i < PENDING_CAP; i += 1) addPending(receiptShape({ src: 'x' }), s);
    const over = addPending(receiptShape({ src: 'x' }), s);
    expect(over.skipped).toBe('cap');
    expect(over.message).toMatch(/match or delete/i);
    expect(loadPending(s)).toHaveLength(PENDING_CAP);
  });
});

describe("suggestMatches — Darrell's Aspen Tap House receipt finds its charge", () => {
  const receipt = receiptShape({ src: 'x', amount: 48.59, merchant: 'Aspen Tap House', capturedAt: '2026-07-02' });
  it('matches the bank row that lands two days later, to the cent', () => {
    const txns = [
      { id: 'a', date: '2026-07-04', amount: -48.59, description: 'ASPEN TAP HOUSE CHAMPAIGN' },
      { id: 'b', date: '2026-07-04', amount: -21.0, description: 'WENDYS' },
      { id: 'c', date: '2026-06-20', amount: -48.59, description: 'OLD CHARGE OUT OF WINDOW' },
    ];
    const m = suggestMatches(receipt, txns);
    expect(m.map((t) => t.id)).toEqual(['a']); // right amount, in window; wrong amount + stale both excluded
  });
  it('never suggests a row that already carries a receipt', () => {
    const txns = [{ id: 'a', date: '2026-07-03', amount: -48.59, description: 'X', receipt: { src: 'y' } }];
    expect(suggestMatches(receipt, txns)).toHaveLength(0);
  });
  it('a receipt without a total falls back to the date window, nearest first', () => {
    const noTotal = receiptShape({ src: 'x', capturedAt: '2026-07-02' });
    const txns = [
      { id: 'far', date: '2026-07-05', amount: -10, description: 'FAR' },
      { id: 'near', date: '2026-07-02', amount: -20, description: 'NEAR' },
    ];
    expect(suggestMatches(noTotal, txns).map((t) => t.id)).toEqual(['near', 'far']);
  });
});

describe('tip-inclusive matching — the paper total is LESS than the settled charge', () => {
  // The 2026-07-05 incident, verbatim: the Aspen Tap House paper says Total
  // $72.60 (balance due, pre-tip); the VISA settles $86.68 with the handwritten
  // tip (+19.4%). Exact-cent matching pairs nothing — the pending receipt would
  // sit forever. The bounded, one-directional tip window is the fix.
  const paper = receiptShape({ src: 'x', amount: 72.60, merchant: 'Aspen Tap House', capturedAt: '2026-07-05' });

  it('classifies the tipped settlement as a tip match, an exact charge as exact', () => {
    expect(matchKind(paper, { amount: -86.68 })).toBe('tip');   // +19.4% tip
    expect(matchKind(paper, { amount: -72.60 })).toBe('exact'); // no tip added
    expect(matchKind(paper, { amount: -60.00 })).toBeNull();    // charge BELOW paper — never a tip
    expect(matchKind(paper, { amount: -120.00 })).toBeNull();   // beyond the 30% ceiling
  });

  it('suggests the tip-inclusive charge that exact-cent matching would have missed', () => {
    const txns = [
      { id: 'tip', date: '2026-07-06', amount: -86.68, description: 'ASPEN TAP HOUSE CHAMPAIGN' },
      { id: 'unrelated', date: '2026-07-06', amount: -200.00, description: 'HOME DEPOT' },
    ];
    expect(suggestMatches(paper, txns).map((t) => t.id)).toEqual(['tip']);
  });

  it('ranks an exact match above a tip match, and uses merchant name to break ties', () => {
    const txns = [
      { id: 'tip', date: '2026-07-05', amount: -80.00, description: 'ASPEN TAP HOUSE' },
      { id: 'exact', date: '2026-07-05', amount: -72.60, description: 'SOME OTHER CHARGE' },
    ];
    expect(suggestMatches(paper, txns).map((t) => t.id)).toEqual(['exact', 'tip']);
    // Two date-only candidates equidistant in time: the one whose description
    // carries the merchant name ranks first (rank-only signal, never a filter).
    const noTotal = receiptShape({ src: 'x', merchant: 'Aspen Tap House', capturedAt: '2026-07-05' });
    const dateTxns = [
      { id: 'other', date: '2026-07-05', amount: -5, description: 'WENDYS' },
      { id: 'aspen', date: '2026-07-05', amount: -5, description: 'ASPEN TAP HOUSE CHAMPAIGN' },
    ];
    expect(suggestMatches(noTotal, dateTxns).map((t) => t.id)).toEqual(['aspen', 'other']);
    expect(merchantOverlap(noTotal, { description: 'ASPEN TAP HOUSE CHAMPAIGN' })).toBeGreaterThan(0);
  });
});

describe('the receipt rides the row to every device (wiring guards)', () => {
  const syncSrc = readFileSync(join(here, '../lib/transactions-sync.js'), 'utf8');
  const monolithSrc = readFileSync(join(here, '../poe-financial-mvp-v28.jsx'), 'utf8');
  const surfaceSrc = readFileSync(join(here, '../components/BooksTransactions.jsx'), 'utf8');
  const migrationSrc = readFileSync(join(here, '../../../infra/supabase/migrations-auto/0069-transaction-receipt.sql'), 'utf8');

  it('toRow uploads it, fromRow hydrates it, the update patch carries it', () => {
    expect(syncSrc).toMatch(/receipt:\s*item\.receipt \?\? null/);
    expect(syncSrc).toMatch(/receipt:\s*row\.receipt \?\? null/);
    expect(monolithSrc).toMatch(/updates\.receipt !== undefined\)\s+patch\.receipt = updates\.receipt/);
  });
  it('the migration adds the column', () => {
    expect(migrationSrc).toMatch(/ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt jsonb/);
  });
  it('the surface offers camera AND photo-library/files on a still-screen overlay', () => {
    // capture="environment" forces camera-only on phones and hides the photo
    // library — the exact defect Darrell hit 2026-07-05. accept="image/*"
    // WITHOUT capture gives the OS chooser: Take Photo / Photo Library / Files.
    expect(surfaceSrc).toMatch(/accept="image\/\*"/);
    expect(surfaceSrc).not.toMatch(/capture=/);
    expect(surfaceSrc).toMatch(/ReceiptModal/);
    expect(surfaceSrc).toMatch(/compressImageFile/);
  });
  it('the file input resets its value on change so re-picking the SAME receipt re-fires', () => {
    // The stranding bug Darrell hit 2026-07-05: filename shown, Save stuck on
    // "Add the photo first". The browser fires `change` only when the file value
    // differs, so after a save cleared `src`, re-selecting the same photo fired
    // nothing and the button never unlocked. Clearing the value on every change
    // is the fix; without it the same-file re-pick is dead.
    expect(surfaceSrc).toMatch(/onChange=\{\(e\) => \{ const f = e\.target\.files && e\.target\.files\[0\]; e\.target\.value = ''; onPhoto\(f\); \}\}/);
  });
});
