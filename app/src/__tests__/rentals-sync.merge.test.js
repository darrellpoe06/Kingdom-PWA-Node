// rentals-sync merge rules — device-local detail must survive a remote refresh.
// See app/src/lib/rentals-sync.js header for the full mapping contract (v2.2.2:
// status + propertyType store the app's real vocab and sync two-way; city /
// state / zip fill from remote but never blank out local detail).
import { describe, it, expect } from 'vitest';
import {
  mergeRemoteRentals,
  toRemoteStatus,
  toRemotePropertyType,
  fromRemoteStatus,
} from '../lib/rentals-sync.js';

const localSeed = {
  id: 'r1',
  name: '1402 Maple St',
  address: '1402 Maple St',
  city: 'Cedar Heights',
  state: 'IL',
  zip: '',
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
  id: 'r1', // slug column (links jsonb fallback for v0-soak rows)
  remoteUuid: 'uuid-1',
  name: '1402 Maple Street', // renamed on another device
  address: '1402 Maple St',
  city: '',                  // v0-soak row predates the city/state/zip columns
  state: '',
  zip: '',
  propertyType: 'primary-home', // real vocab stored since v2.2.2
  rent: 0,
  actual: 0,
  status: 'vacant',          // tenant moved out, changed on another device
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
    // synced columns follow remote — including status + propertyType (v2.2.2)
    expect(m.name).toBe('1402 Maple Street');
    expect(m.purchasePrice).toBe(95000);
    expect(m.estimatedValue).toBe(140000);
    expect(m.remoteUuid).toBe('uuid-1');
    expect(m.mortgage.balance).toBe(87000);
    expect(m.status).toBe('vacant');
    expect(m.propertyType).toBe('primary-home');
    // device-local fields survive
    expect(m.rent).toBe(1100);
    expect(m.actual).toBe(550);
    expect(m.mortgage.rate).toBe(6.5);
    expect(m.mortgage.monthlyPI).toBe(556);
    expect(m.tenantName).toBe('Tracy W.');
    expect(m.entityId).toBe('e-poeprops');
    expect(m.rooms).toHaveLength(1);
  });

  it('fills city/state/zip from remote but never blanks local detail', () => {
    // blank remote values (v0-soak row) must not erase the local city/state
    const [kept] = mergeRemoteRentals([localSeed], [remoteTwin]);
    expect(kept.city).toBe('Cedar Heights');
    expect(kept.state).toBe('IL');
    // a remote value typed on another device lands here
    const remoteWithCity = { ...remoteTwin, city: 'Champaign', state: 'IL', zip: '61820' };
    const [filled] = mergeRemoteRentals([localSeed], [remoteWithCity]);
    expect(filled.city).toBe('Champaign');
    expect(filled.zip).toBe('61820');
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

describe('status / property-type vocab (v2.2.2 — stored as-is, no flattening)', () => {
  it('passes the full app status vocab through to the remote CHECK', () => {
    for (const s of ['paying', 'late', 'vacant', 'rehab', 'for-sale', 'sold', 'owner-occupied', 'seasonal', 'unrented']) {
      expect(toRemoteStatus(s)).toBe(s);
    }
    expect(toRemoteStatus('something-new')).toBe('paying'); // never violate CHECK
  });

  it('passes the full app property-type vocab through to the remote CHECK', () => {
    for (const t of ['single-family', 'duplex', 'multi-family', 'condo', 'townhouse', 'commercial', 'land', 'primary-home', 'secondary-home', 'vacation', 'other']) {
      expect(toRemotePropertyType(t)).toBe(t);
    }
    expect(toRemotePropertyType(undefined)).toBe('single-family');
  });

  it('normalizes v0-soak occupancy statuses into the app vocab coming down', () => {
    expect(fromRemoteStatus('occupied')).toBe('paying');
    expect(fromRemoteStatus('listed')).toBe('for-sale');
    expect(fromRemoteStatus('off-market')).toBe('unrented');
    // real app vocab passes through untouched
    expect(fromRemoteStatus('late')).toBe('late');
    expect(fromRemoteStatus('owner-occupied')).toBe('owner-occupied');
    // shared values stay themselves
    expect(fromRemoteStatus('vacant')).toBe('vacant');
    expect(fromRemoteStatus('sold')).toBe('sold');
  });
});
