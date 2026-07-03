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
  receiptShape, loadPending, addPending, removePending, suggestMatches, PENDING_CAP,
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
  it('the surface offers capture on a still-screen overlay (no scroll-jump)', () => {
    expect(surfaceSrc).toMatch(/accept="image\/\*" capture="environment"/);
    expect(surfaceSrc).toMatch(/ReceiptModal/);
    expect(surfaceSrc).toMatch(/compressImageFile/);
  });
});
