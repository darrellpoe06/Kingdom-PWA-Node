// rentals-sync merge rules — device-local detail must survive a remote refresh.
// See app/src/lib/rentals-sync.js header for the full mapping contract.
import { describe, it, expect } from 'vitest';
import { mergeRemoteRentals, toRemoteStatus, toRemotePropertyType } from '../lib/rentals-sync.js';

const localSeed = {
  id: 'r1',
  name: '1402 Maple St',
  address: '1402 Maple St',
  city: 'Cedar Heights',
  state: 'IL',
  tenantName: 'Tracy W.',
  rent: 1100,
  actual: 550,
  status: 'late',
  entityId: 'e-poeprops',
  propertyType: 'primary-home',
  mortgage: { balance: 88000, rate: 6.5, monthlyPI: 556, escrow: 180, estimated: true },
  rooms: [{ id: 'rm-1', name: 'Kitchen' }],
};

const remoteTwin = {
  id: 'r1', // slug recovered from the links jsonb
  remoteUuid: 'uuid-1',
  name: '1402 Maple Street', // renamed on another device
  address: '1402 Maple St',
  propertyType: 'single-family', // remote CHECK vocab
  rent: 0,
  actual: 0,
  status: 'paying', // remote 'occupied' mapped back
  purchasePrice: 95000,
  purchaseDate: '2019-04-01',
  estimatedValue: 140000,
  mortgage: { balance: 87000, rate: 0, monthlyPI: 0, escrow: 0, estimated: true },
  notes: '',
  updatedAt: '2026-06-10T00:00:00Z',
};

describe('mergeRemoteRentals', () => {
  it('overlays synced columns but keeps device-local fields', () => {
    const [m] = mergeRemoteRentals([localSeed], [remoteTwin]);
    // synced columns follow remote
    expect(m.name).toBe('1402 Maple Street');
    expect(m.purchasePrice).toBe(95000);
    expect(m.estimatedValue).toBe(140000);
    expect(m.remoteUuid).toBe('uuid-1');
    expect(m.mortgage.balance).toBe(87000);
    // device-local fields survive
    expect(m.rent).toBe(1100);
    expect(m.actual).toBe(550);
    expect(m.status).toBe('late'); // local rent-collection state wins
    expect(m.propertyType).toBe('primary-home'); // richer local vocab wins
    expect(m.mortgage.rate).toBe(6.5);
    expect(m.mortgage.monthlyPI).toBe(556);
    expect(m.tenantName).toBe('Tracy W.');
    expect(m.city).toBe('Cedar Heights');
    expect(m.entityId).toBe('e-poeprops');
    expect(m.rooms).toHaveLength(1);
  });

  it('keeps a never-uploaded local item and adopts a remote-only item', () => {
    const localOnly = { ...localSeed, id: 'r-176000', status: 'paying' };
    const remoteOnly = { ...remoteTwin, id: 'r-remote-uuid-9', remoteUuid: 'uuid-9' };
    const merged = mergeRemoteRentals([localOnly], [remoteOnly]);
    expect(merged).toHaveLength(2);
    expect(merged.map((r) => r.id)).toEqual(['r-176000', 'r-remote-uuid-9']);
  });

  it('drops a previously-synced local item whose remote row was deleted', () => {
    const syncedLocal = { ...localSeed, remoteUuid: 'uuid-gone' };
    expect(mergeRemoteRentals([syncedLocal], [])).toHaveLength(0);
  });

  it('matches by remoteUuid when the local slug differs', () => {
    const renamedSlug = { ...localSeed, id: 'r1-old', remoteUuid: 'uuid-1' };
    const merged = mergeRemoteRentals([renamedSlug], [remoteTwin]);
    expect(merged).toHaveLength(1);
    expect(merged[0].remoteUuid).toBe('uuid-1');
    expect(merged[0].rooms).toHaveLength(1);
  });

  it('is idempotent across repeated refreshes', () => {
    const once = mergeRemoteRentals([localSeed], [remoteTwin]);
    const twice = mergeRemoteRentals(once, [remoteTwin]);
    expect(twice).toEqual(once);
  });
});

describe('status / property-type vocab mapping', () => {
  it('maps local rent-collection statuses into the remote occupancy CHECK', () => {
    expect(toRemoteStatus('paying')).toBe('occupied');
    expect(toRemoteStatus('late')).toBe('occupied');
    expect(toRemoteStatus('owner-occupied')).toBe('occupied');
    expect(toRemoteStatus('unrented')).toBe('vacant');
    expect(toRemoteStatus('for-sale')).toBe('listed');
    expect(toRemoteStatus('sold')).toBe('sold');
    expect(toRemoteStatus('something-new')).toBe('occupied'); // never violate CHECK
  });

  it('maps local-only property types onto the remote CHECK', () => {
    expect(toRemotePropertyType('duplex')).toBe('duplex');
    expect(toRemotePropertyType('primary-home')).toBe('single-family');
    expect(toRemotePropertyType('vacation')).toBe('single-family');
    expect(toRemotePropertyType('other')).toBe('single-family');
    expect(toRemotePropertyType(undefined)).toBe('single-family');
  });
});
