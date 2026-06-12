// v2.15 family snapshot — payload hygiene and the seed-world publish guard.
// The snapshot is how the family's non-table-synced world follows the
// account; these tests lock the three safety properties:
//   1. table-synced lists, notes, and photo bytes never enter the payload
//   2. applying a payload can't erase this device's room photos
//   3. a still-seed world is detected (it adopts, never publishes)
import { describe, it, expect } from 'vitest';
import { buildSnapshotPayload, stripPhotoBytes, mergeKeepingLocalRoomPhotos } from '../lib/snapshot-sync.js';
import { remainderIsSeed, SEED_IDS } from '../poe-financial-mvp-v28.jsx';

const B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg';

describe('buildSnapshotPayload', () => {
  const data = {
    accounts: [{ id: 'a1' }], debts: [{ id: 'd1' }], transactions: [{ id: 't1' }],
    projects: [{ id: 'p1' }], inquiries: [{ id: 'q1' }], incidents: [{ id: 'i1' }],
    contractors1099: [{ id: 'c1' }], entities: [{ id: 'e1' }],
    notes: [{ id: 'n1', text: 'private diary' }],
    appDirectives: [{ id: 'ad1' }],
    lifePhotos: [{ id: 'ph1', src: B64 }],
    recurringObligations: [{ id: 'ro1', name: 'Insurance', amount: 100 }],
    taxCalendar: [{ id: 'tax1', amount: 1200 }],
    church: { name: 'COLG' },
    inflows: { rentals: [{ id: 'r1', rooms: [{ id: 'rm1', notes: 'repainted 2026', photos: [B64] }] }] },
  };
  const payload = buildSnapshotPayload({ data, pressure: 5, theme: 'midnight' });

  it('keeps the non-synced remainder', () => {
    expect(payload.data.recurringObligations).toHaveLength(1);
    expect(payload.data.taxCalendar).toHaveLength(1);
    expect(payload.data.church.name).toBe('COLG');
    expect(payload.theme).toBe('midnight');
  });

  it('excludes every table-synced list, notes, directives, lifePhotos', () => {
    for (const k of ['accounts', 'debts', 'transactions', 'projects', 'inquiries', 'incidents', 'contractors1099', 'entities', 'notes', 'appDirectives', 'lifePhotos']) {
      expect(payload.data[k]).toBeUndefined();
    }
  });

  it('keeps room memory but strips photo bytes', () => {
    const room = payload.data.inflows.rentals[0].rooms[0];
    expect(room.notes).toBe('repainted 2026');
    expect(room.photos).toBeUndefined();
    expect(JSON.stringify(payload).includes('base64')).toBe(false);
  });
});

describe('stripPhotoBytes', () => {
  it('removes data-URL strings at any depth', () => {
    const out = stripPhotoBytes({ a: { b: [{ src: B64, keep: 'yes' }] } });
    expect(out.a.b[0].src).toBeUndefined();
    expect(out.a.b[0].keep).toBe('yes');
  });
});

describe('mergeKeepingLocalRoomPhotos', () => {
  it('matched rooms keep this device\'s photos when the snapshot copy has none', () => {
    const local = [{ id: 'r1', rooms: [{ id: 'rm1', photos: [B64] }] }];
    const snap = [{ id: 'r1', rooms: [{ id: 'rm1', notes: 'from snapshot' }] }];
    const out = mergeKeepingLocalRoomPhotos(local, snap);
    expect(out[0].rooms[0].photos).toEqual([B64]);
    expect(out[0].rooms[0].notes).toBe('from snapshot');
  });
});

describe('remainderIsSeed — the publish guard', () => {
  it('a pure-seed remainder is seed (adopts, never publishes)', () => {
    const seedRoId = [...SEED_IDS].find((id) => id.startsWith('ro-')) || [...SEED_IDS][0];
    expect(remainderIsSeed({ recurringObligations: [{ id: seedRoId }] })).toBe(true);
    expect(remainderIsSeed({})).toBe(true);
  });

  it('one family-created remainder row flips the world to real', () => {
    expect(remainderIsSeed({ events: [{ id: `ev-${Date.now()}` }] })).toBe(false);
  });

  it('real table-synced rentals do NOT flip a still-seed remainder', () => {
    expect(remainderIsSeed({ inflows: { rentals: [{ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }] } })).toBe(true);
  });
});
