// Data-safety regression tests for the 2026-06-12 production-hardening pass.
// These lock in the two data-loss fixes from the PR #24 review:
//   1. unionPreservingLocal — a cloud list arriving must never delete a
//      locally-created row whose upload failed or hasn't landed.
//   2. mergeRemoteRentals — an EMPTY cloud read against a synced local list
//      is a failed read (RLS returns 200/0-rows on membership hiccups), not
//      a mass deletion; rooms/photos/logs must survive it.
import { describe, it, expect } from 'vitest';
import { unionPreservingLocal } from '../lib/table-sync.js';
import { mergeRemoteRentals } from '../lib/rentals-sync.js';

const UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('unionPreservingLocal', () => {
  it('keeps a locally-created (non-UUID id) row absent from the cloud list', () => {
    const local = [{ id: 'inc-1749680000000', description: 'leaking sink' }];
    const remote = [{ id: UUID, description: 'cloud row' }];
    const out = unionPreservingLocal(local, remote);
    expect(out).toHaveLength(2);
    expect(out.some((i) => i.id === 'inc-1749680000000')).toBe(true);
  });

  it('lets a genuine cross-device deletion propagate (UUID row absent stays dropped)', () => {
    const local = [{ id: UUID, description: 'deleted elsewhere' }];
    const out = unionPreservingLocal(local, []);
    expect(out).toHaveLength(0);
  });

  it('does not duplicate a row already represented remotely', () => {
    const local = [{ id: UUID, description: 'synced' }];
    const remote = [{ id: UUID, description: 'synced (cloud copy)' }];
    expect(unionPreservingLocal(local, remote)).toHaveLength(1);
  });

  it('returns the remote list untouched when there is nothing local to keep', () => {
    const remote = [{ id: UUID }];
    expect(unionPreservingLocal([], remote)).toBe(remote);
  });
});

describe('mergeRemoteRentals — empty-read guard', () => {
  const syncedLocal = [{
    id: 'r-805', remoteUuid: UUID, name: '805 N Prospect',
    rooms: [{ id: 'rm1', photos: ['data:image/jpeg;base64,xyz'] }],
    maintenanceLog: [{ at: '2026-06-01', note: 'furnace filter' }],
  }];

  it('an empty remote read against synced local items aborts the merge unchanged', () => {
    const out = mergeRemoteRentals(syncedLocal, []);
    expect(out).toBe(syncedLocal);
    expect(out[0].rooms[0].photos).toHaveLength(1);
  });

  it('a never-synced local list still merges normally against an empty read', () => {
    const local = [{ id: 'r-new', name: 'New Property' }]; // no remoteUuid
    const out = mergeRemoteRentals(local, []);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('r-new');
  });

  it('a single-property deletion still propagates when the read returns the remaining rows', () => {
    const local = [
      ...syncedLocal,
      { id: 'r-gone', remoteUuid: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Sold Property' },
    ];
    const remaining = [{ id: 'r-805', remoteUuid: UUID, name: '805 N Prospect', mortgage: {} }];
    const out = mergeRemoteRentals(local, remaining);
    expect(out.some((r) => r.id === 'r-gone')).toBe(false);
    expect(out.some((r) => r.id === 'r-805')).toBe(true);
  });
});
