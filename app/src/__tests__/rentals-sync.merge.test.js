// rentals-sync merge rules — device-local detail must survive a remote refresh.
// See app/src/lib/rentals-sync.js header for the live-shape mapping contract
// (2026-06-10): rent / actual / tenantName / entityId / the full mortgage
// object sync as columns now; rooms / equipment / logs stay device-local;
// city / state / zip fill from remote but never blank out local detail.
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
  tenantName: 'Old Name',
  rent: 1000,
  actual: 500,
  status: 'late',
  entityId: 'e-poeprops',
  propertyType: 'primary-home',
  mortgage: { balance: 88000, rate: 6.5, monthlyPI: 556, escrow: 180, estimated: true },
  rooms: [{ id: 'rm-1', name: 'Kitchen' }],
};

// What another device pushed (fromRow shape).
const remoteTwin = {
  id: 'r1',
  remoteUuid: 'uuid-1',
  name: '1402 Maple Street',
  address: '1402 Maple St',
  city: '',
  state: '',
  zip: '',
  tenantName: 'Tracy W.',
  entityId: 'e-poeprops',
  propertyType: 'primary-home',
  rent: 1100,
  actual: 550,
  status: 'vacant',
  purchasePrice: 95000,
  purchaseDate: '2019-04-01',
  estimatedValue: 140000,
  mortgage: { balance: 87000, rate: 6.25, monthlyPI: 540, escrow: 175, estimated: false },
  notes: '',
  updatedAt: '2026-06-10T00:00:00Z',
};

describe('mergeRemoteRentals', () => {
  it('overlays synced columns (including rent/tenant/mortgage) but keeps device-local records', () => {
    const [m] = mergeRemoteRentals([localSeed], [remoteTwin]);
    // synced columns follow remote
    expect(m.name).toBe('1402 Maple Street');
    expect(m.purchasePrice).toBe(95000);
    expect(m.estimatedValue).toBe(140000);
    expect(m.remoteUuid).toBe('uuid-1');
    expect(m.status).toBe('vacant');
    expect(m.propertyType).toBe('primary-home');
    expect(m.rent).toBe(1100);
    expect(m.actual).toBe(550);
    expect(m.tenantName).toBe('Tracy W.');
    expect(m.entityId).toBe('e-poeprops');
    // the whole mortgage object syncs; only the local 'estimated' flag is kept
    expect(m.mortgage.balance).toBe(87000);
    expect(m.mortgage.rate).toBe(6.25);
    expect(m.mortgage.monthlyPI).toBe(540);
    expect(m.mortgage.escrow).toBe(175);
    expect(m.mortgage.estimated).toBe(true);
    // device-local records survive
    expect(m.rooms).toHaveLength(1);
  });

  it('fills city/state/zip from remote but never blanks local detail', () => {
    const [kept] = mergeRemoteRentals([localSeed], [remoteTwin]);
    expect(kept.city).toBe('Cedar Heights');
    expect(kept.state).toBe('IL');
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
    // 2026-06-12 contract change: deletion propagates only via a NON-EMPTY
    // read (the read returns the remaining rows). An all-empty read is
    // treated as a failed read, not a mass deletion — see the empty-read
    // guard test below and the sync-data-safety suite.
    const syncedLocal = { ...localSeed, remoteUuid: 'uuid-gone' };
    const survivor = { id: 'r-other', remoteUuid: 'uuid-stays', name: 'Other Property', mortgage: {} };
    const localPair = [syncedLocal, { ...survivor }];
    const merged = mergeRemoteRentals(localPair, [survivor]);
    expect(merged.some((r) => r.remoteUuid === 'uuid-gone')).toBe(false);
    expect(merged.some((r) => r.remoteUuid === 'uuid-stays')).toBe(true);
  });

  it('an empty read with synced local items aborts the merge (RLS 0-rows is a failed read)', () => {
    const syncedLocal = { ...localSeed, remoteUuid: 'uuid-gone' };
    expect(mergeRemoteRentals([syncedLocal], [])).toHaveLength(1);
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

describe('status / property-type vocab (live table has no CHECKs; app vocab stores as-is)', () => {
  it('passes the full app status vocab through', () => {
    for (const s of ['paying', 'late', 'vacant', 'rehab', 'for-sale', 'sold', 'owner-occupied', 'seasonal', 'unrented']) {
      expect(toRemoteStatus(s)).toBe(s);
    }
    expect(toRemoteStatus('something-unknown')).toBe('paying'); // garbage never syncs
  });

  it('passes the full app property-type vocab through', () => {
    for (const t of ['single-family', 'duplex', 'multi-family', 'condo', 'townhouse', 'commercial', 'land', 'primary-home', 'secondary-home', 'vacation', 'other']) {
      expect(toRemotePropertyType(t)).toBe(t);
    }
    expect(toRemotePropertyType(undefined)).toBe('single-family');
  });

  it('normalizes legacy occupancy statuses coming down', () => {
    expect(fromRemoteStatus('occupied')).toBe('paying');
    expect(fromRemoteStatus('listed')).toBe('for-sale');
    expect(fromRemoteStatus('off-market')).toBe('unrented');
    expect(fromRemoteStatus('late')).toBe('late');
    expect(fromRemoteStatus('owner-occupied')).toBe('owner-occupied');
    expect(fromRemoteStatus('vacant')).toBe('vacant');
  });
});
