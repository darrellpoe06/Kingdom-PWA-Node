// @vitest-environment node
//
// snapshot-slim — photo bytes must never block the financial save. Christina/
// Darrell, live: "storage is full — changes are NOT being saved"; and "we want
// images to leave our phone and go to the NAS ... not losing anything" (2026-07-18).
import { describe, it, expect } from 'vitest';
import { slimSnapshotData, snapshotByteSize, persistSnapshot, extraSlimSnapshotData, storageBannerMessage } from '../lib/snapshot-slim.js';

const bigDataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(2_000_000); // ~2MB inline photo

describe('slimSnapshotData', () => {
  it('strips heavy inline base64 photo bytes but keeps every other field', () => {
    const data = {
      transactions: [{ id: 't1', amount: -50 }],
      lifePhotos: [
        { id: 'p1', src: bigDataUrl, caption: 'Backyard', category: 'Properties', date: '2026-06-01' },
        { id: 'p2', src: 'https://nas.local/thumb/abc.jpg', caption: 'On NAS', category: 'Family' }, // NAS URL — kept
      ],
    };
    const slim = slimSnapshotData(data);
    // Financial data untouched.
    expect(slim.transactions).toEqual(data.transactions);
    // Inline base64 dropped + flagged; metadata preserved.
    expect(slim.lifePhotos[0].src).toBe('');
    expect(slim.lifePhotos[0].srcDropped).toBe(true);
    expect(slim.lifePhotos[0].caption).toBe('Backyard');
    // NAS-hosted photo (normal URL) is a light reference — untouched.
    expect(slim.lifePhotos[1].src).toBe('https://nas.local/thumb/abc.jpg');
    expect(slim.lifePhotos[1].srcDropped).toBeUndefined();
  });

  it('shrinks the persisted size dramatically so the financial snapshot fits', () => {
    const data = {
      transactions: Array.from({ length: 50 }, (_, i) => ({ id: 't' + i, amount: i })),
      lifePhotos: [
        { id: 'p1', src: bigDataUrl },
        { id: 'p2', src: bigDataUrl },
        { id: 'p3', src: bigDataUrl },
      ],
    };
    const before = snapshotByteSize(data);
    const after = snapshotByteSize(slimSnapshotData(data));
    expect(before).toBeGreaterThan(6_000_000);   // 3 x ~2MB photos overflow the ~5MB quota
    expect(after).toBeLessThan(10_000);          // slimmed snapshot easily fits
  });

  it('does not touch the in-memory object it was given (returns a copy)', () => {
    const data = { lifePhotos: [{ id: 'p1', src: bigDataUrl }] };
    slimSnapshotData(data);
    expect(data.lifePhotos[0].src).toBe(bigDataUrl); // original still has the bytes for the session
  });

  it('strips base64 RECEIPT images off transactions but keeps the receipt metadata + the txn', () => {
    const data = {
      transactions: [
        { id: 't1', amount: -42, category: 'groceries', receipt: { src: bigDataUrl, merchant: 'County Market', amount: -42 } },
        { id: 't2', amount: -10, category: 'fuel' }, // no receipt — untouched
      ],
    };
    const slim = slimSnapshotData(data);
    expect(slim.transactions[0].amount).toBe(-42);                 // financial data kept
    expect(slim.transactions[0].receipt.src).toBe('');             // heavy bytes dropped
    expect(slim.transactions[0].receipt.srcDropped).toBe(true);
    expect(slim.transactions[0].receipt.merchant).toBe('County Market'); // metadata kept
    expect(slim.transactions[1]).toEqual(data.transactions[1]);    // receiptless txn untouched
    expect(data.transactions[0].receipt.src).toBe(bigDataUrl);     // original not mutated
  });

  it('a ledger full of receipt photos slims to a size that fits', () => {
    const data = {
      transactions: Array.from({ length: 40 }, (_, i) => ({
        id: 't' + i, amount: i, receipt: { src: bigDataUrl, merchant: 'M' + i },
      })),
    };
    expect(snapshotByteSize(data)).toBeGreaterThan(6_000_000); // 40 x ~2MB receipts overflow
    expect(snapshotByteSize(slimSnapshotData(data))).toBeLessThan(20_000); // slims to fit
  });

  it('handles a snapshot with no photos, and non-object input, safely', () => {
    expect(slimSnapshotData({ transactions: [] })).toEqual({ transactions: [] });
    expect(slimSnapshotData(null)).toBe(null);
  });

  it('also strips inline bytes from a legacy photos[] collection and dataUrl fields', () => {
    const data = { photos: [{ id: 'x', dataUrl: bigDataUrl, note: 'keep me' }] };
    const slim = slimSnapshotData(data);
    expect(slim.photos[0].dataUrl).toBe('');
    expect(slim.photos[0].note).toBe('keep me');
    expect(slim.photos[0].srcDropped).toBe(true);
  });
});

describe('persistSnapshot — keep photos when they fit, protect the books when they do not', () => {
  it('writes the FULL snapshot (photos kept) when there is room', async () => {
    const writes = [];
    const setItem = async (k, v) => { writes.push(v); };
    const data = { transactions: [{ id: 't1' }], lifePhotos: [{ id: 'p', src: 'data:image/png;base64,AAAA' }] };
    const mode = await persistSnapshot(setItem, 'key', { savedAt: 'now' }, data);
    expect(mode).toBe('full');
    expect(writes[0]).toContain('data:image/png;base64,AAAA'); // photo bytes kept
  });

  it('falls back to SLIM (books saved, photo bytes dropped) when the full write overflows', async () => {
    let call = 0;
    const writes = [];
    const setItem = async (k, v) => {
      call += 1;
      if (call === 1) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } // full overflows
      writes.push(v);
    };
    const data = { transactions: [{ id: 't1', amount: -9 }], lifePhotos: [{ id: 'p', src: bigDataUrl }] };
    const mode = await persistSnapshot(setItem, 'key', { savedAt: 'now' }, data);
    expect(mode).toBe('slim');
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('"t1"');           // the FINANCIAL data was saved
    expect(writes[0]).not.toContain(bigDataUrl);   // the photo bytes were dropped to make it fit
  });

  it('falls to EXTRA-slim (drops recoverable history) when even the slim copy overflows', async () => {
    let call = 0;
    const writes = [];
    const setItem = async (k, v) => {
      call += 1;
      if (call <= 2) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } // full + slim overflow
      writes.push(v);
    };
    const data = {
      transactions: [{ id: 't1', amount: -5 }],
      recordEvents: Array.from({ length: 5000 }, (_, i) => ({ id: 'e' + i, blob: 'x'.repeat(500) })),
    };
    const mode = await persistSnapshot(setItem, 'key', {}, data);
    expect(mode).toBe('extra');
    expect(writes[0]).toContain('"t1"');          // the current ledger saved
    expect(writes[0]).not.toContain('"e4999"');   // the recoverable history was shed
  });

  it('re-throws only when even the EXTRA-slim copy cannot be written (genuinely out of space)', async () => {
    const setItem = async () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; };
    await expect(persistSnapshot(setItem, 'key', {}, { transactions: [] })).rejects.toThrow();
  });
});

describe('extraSlimSnapshotData — shed recoverable history so the ledger always fits', () => {
  it('drops recordEvents (cloud-recoverable) and flags what was shed, keeping the ledger', () => {
    const data = { transactions: [{ id: 't1', amount: -9 }], recordEvents: [{ id: 'e1' }, { id: 'e2' }] };
    const x = extraSlimSnapshotData(data);
    expect(x.transactions).toEqual(data.transactions); // current ledger kept
    expect(x.recordEvents).toEqual([]);                // history shed
    expect(x.localCacheShed).toContain('recordEvents');
    expect(data.recordEvents.length).toBe(2);          // original not mutated
  });
});

describe('storageBannerMessage — honest wording, no false alarm on a synced ledger', () => {
  it('says nothing when the full snapshot saved', () => {
    expect(storageBannerMessage('full', true)).toBe(null);
  });
  it('slim → a calm photos note, never an alarm', () => {
    expect(storageBannerMessage('slim', true)).toMatch(/saving fine/);
    expect(storageBannerMessage('slim', true)).not.toMatch(/NOT being saved/);
  });
  it('on a hard FAIL, a CLOUD-SYNCED ledger is told it is SAFE — not "changes are NOT being saved"', () => {
    const msg = storageBannerMessage('fail', true);
    expect(msg).toMatch(/synced to the cloud and safe/);
    expect(msg).not.toMatch(/NOT being saved/);
  });
  it('on a hard FAIL with NO cloud sync, the real data-loss alarm IS shown', () => {
    expect(storageBannerMessage('fail', false)).toMatch(/NOT being saved/);
  });
});
