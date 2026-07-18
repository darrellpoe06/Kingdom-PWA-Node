// @vitest-environment node
//
// snapshot-slim — photo bytes must never block the financial save. Christina/
// Darrell, live: "storage is full — changes are NOT being saved"; and "we want
// images to leave our phone and go to the NAS ... not losing anything" (2026-07-18).
import { describe, it, expect } from 'vitest';
import { slimSnapshotData, snapshotByteSize } from '../lib/snapshot-slim.js';

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
