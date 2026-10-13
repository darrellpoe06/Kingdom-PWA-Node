// =============================================================================
// A partial read is a failed read too -- the loss of 2026-09-14
// =============================================================================
// Darrell: "Yesterday my wife's rental doors information!!!!!" and "Tenant
// information another issue!!!!!! Still frustrated!!!!!" -- on a MacBook that
// "has a login issue currently."
//
// WHAT THE DATABASE SAID, asked of the one the app actually reads, with
// statistics that have NEVER been reset, so the counters are its full history:
//
//   rentals            13 rows   13 ever inserted   0 ever deleted
//   rental_tenancies    0 rows    0 ever inserted   0 ever deleted
//   tenancy_household   0 rows    0 ever inserted   0 ever deleted
//   tenancy_notes       0 rows    0 ever inserted   0 ever deleted
//   rent_records        0 rows    0 ever inserted   0 ever deleted
//   property_rooms      0 rows    0 ever inserted   0 ever deleted
//
// Nothing was deleted from any of them. Nothing was ever inserted into the
// tenant tables either -- because for the family-OS rentals path those fields
// have no cloud columns at all (rentals-sync.js header: "Still device-local
// (no columns): rooms, equipment, maintenanceLog, conversationLog, lat/lon,
// market/lease/tenant sub-objects"). For those fields the device IS the
// database, and a broken login meant the cloud snapshot never took them.
//
// The old merge guarded exactly ONE failure: a read that returned ZERO rows.
// A read that returned SOME rows but not hers -- an instance mismatch, a
// partial RLS visibility hiccup, a half-applied membership after the sovereign
// repoint -- went into the drop branch and deleted those doors locally with
// the only copy of every field above.
//
// These reproduce that read and pin the fix. PROVEN-TO-CATCH: the old
// zero-rows-only rule is implemented here and shown to destroy the same data
// these checks now protect.
import { describe, it, expect } from 'vitest';
import { mergeRemoteRentals, readLooksBroken, hasLocalOnlyDetail } from '../lib/rentals-sync.js';

// Thirteen doors, each synced once and each carrying detail that is on this
// device and nowhere else -- the shape of the real portfolio.
const portfolio = () => Array.from({ length: 13 }, (_, i) => ({
  id: `r-${i + 1}`,
  remoteUuid: `uuid-${i + 1}`,
  name: `Door ${i + 1}`,
  tenantName: `Household ${i + 1}`,
  rooms: [{ id: `rm-${i}`, name: 'Bedroom' }],
  lease: { start: '2026-01-01', end: '2026-12-31', monthlyRent: 1200 },
  mortgage: {},
}));

describe('THE REPORTED CASE: a read that returns none of her doors', () => {
  it('a read carrying somebody else\'s rows destroys nothing', () => {
    const local = portfolio();
    // Not empty -- this is the point. An instance mismatch returns rows, just
    // not hers, and the old guard only ever checked for length === 0.
    const someoneElses = [{ id: 'r-x', remoteUuid: 'uuid-x', name: 'Not Hers', mortgage: {} }];
    const merged = mergeRemoteRentals(local, someoneElses);
    expect(merged).toHaveLength(13);
    expect(merged.every((r) => r.rooms && r.rooms.length === 1)).toBe(true);
    expect(merged.every((r) => r.lease && r.lease.monthlyRent === 1200)).toBe(true);
    expect(merged.every((r) => r.tenantName)).toBe(true);
  });

  it('and a read missing three or more at once is treated as broken, not as deletions', () => {
    const local = portfolio();
    const partial = local.slice(0, 10).map((r) => ({ ...r }));   // 3 vanished
    expect(readLooksBroken(local, partial)).toBe(true);
    expect(mergeRemoteRentals(local, partial)).toHaveLength(13);
  });

  it('a single door disappearing is still a real deletion when nothing local-only is at stake', () => {
    const plain = [
      { id: 'r-a', remoteUuid: 'uuid-a', name: 'A', mortgage: {} },
      { id: 'r-b', remoteUuid: 'uuid-b', name: 'B', mortgage: {} },
    ];
    const merged = mergeRemoteRentals(plain, [plain[1]]);
    expect(merged.map((r) => r.remoteUuid)).toEqual(['uuid-b']);
  });
});

describe('what counts as a copy that exists nowhere else', () => {
  it('rooms, equipment, logs, photos, lease, tenant, market and coordinates all count', () => {
    expect(hasLocalOnlyDetail({ rooms: [{ name: 'Kitchen' }] })).toBe(true);
    expect(hasLocalOnlyDetail({ equipment: [{ name: 'Furnace' }] })).toBe(true);
    expect(hasLocalOnlyDetail({ maintenanceLog: [{ note: 'roof' }] })).toBe(true);
    expect(hasLocalOnlyDetail({ conversationLog: [{ note: 'called' }] })).toBe(true);
    expect(hasLocalOnlyDetail({ photos: [{ src: 'x' }] })).toBe(true);
    expect(hasLocalOnlyDetail({ lease: { start: '2026-01-01' } })).toBe(true);
    expect(hasLocalOnlyDetail({ tenant: { name: 'A' } })).toBe(true);
    expect(hasLocalOnlyDetail({ market: { rentEstimate: 1200 } })).toBe(true);
    expect(hasLocalOnlyDetail({ lat: 40.1, lon: -88.2 })).toBe(true);
  });

  it('a door whose every field has a cloud column does not', () => {
    // These all map to columns in toRow, so dropping this door loses nothing.
    expect(hasLocalOnlyDetail({
      id: 'r-1', name: 'Plain', address: '1 Main', city: 'X', state: 'IL',
      tenantName: 'Named', rent: 1000, status: 'paying', mortgage: { balance: 1 },
    })).toBe(false);
  });

  it('empty containers do not count -- an empty array is not a copy of anything', () => {
    expect(hasLocalOnlyDetail({ rooms: [], lease: {}, photos: [] })).toBe(false);
    expect(hasLocalOnlyDetail({})).toBe(false);
    expect(hasLocalOnlyDetail(null)).toBe(false);
  });
});

describe('PROVEN-TO-CATCH -- the rule that shipped destroys this data', () => {
  // The old guard, exactly: abort ONLY when the read is empty.
  const oldMerge = (localItems, remoteItems) => {
    if (remoteItems.length === 0 && localItems.some((l) => l.remoteUuid)) return localItems;
    const present = new Set(remoteItems.map((r) => r.remoteUuid));
    return localItems.filter((l) => !l.remoteUuid || present.has(l.remoteUuid));
  };

  it('the old rule deletes all thirteen doors on a read that returns one foreign row', () => {
    const local = portfolio();
    const someoneElses = [{ id: 'r-x', remoteUuid: 'uuid-x', name: 'Not Hers' }];
    expect(oldMerge(local, someoneElses)).toHaveLength(0);        // every door gone
    expect(mergeRemoteRentals(local, someoneElses)).toHaveLength(13);
  });

  it('the old rule is indifferent to whether a copy exists anywhere else', () => {
    const withRooms = [{ id: 'r-1', remoteUuid: 'uuid-1', rooms: [{ name: 'Kitchen' }] }];
    const otherDoor = [{ id: 'r-2', remoteUuid: 'uuid-2' }];
    // A non-empty read that does not contain it: the Kitchen is discarded.
    expect(oldMerge([...withRooms, ...otherDoor], otherDoor)).toHaveLength(1);
    const now = mergeRemoteRentals([...withRooms, ...otherDoor], otherDoor);
    expect(now.find((r) => r.remoteUuid === 'uuid-1').rooms).toEqual([{ name: 'Kitchen' }]);
  });
});
