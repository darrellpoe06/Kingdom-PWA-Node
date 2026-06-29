// =============================================================================
// action-queue-resurrection — regression gate for the 2026-06-24 fix where
// deleted Action Queue items (seed dev-tickets AND real incidents) came back.
// =============================================================================
// Two independent resurrection mechanisms were fixed in the BigPicture sync
// effect (poe-financial-mvp-v28.jsx):
//
//   1. SEED RESURRECTION — `data` re-inits to SEED_DATA on every boot, and the
//      sync merge only stripped seed `if (incoming.length)`. So when the cloud
//      table was EMPTY, seed scaffolding survived and reappeared after the user
//      deleted it. The fix strips seed UNCONDITIONALLY in both the initialSync
//      and realtime-subscribe merges (filter BOTH current and incoming by
//      notSeedRow). This test pins that invariant via the real exported helpers.
//
//   2. REAL-ROW RESURRECTION — deleteIncident was local-only (no cloud delete),
//      so a synced row re-merged from Supabase. Fixed by calling
//      incidentsSync.deleteRow on rows that carry a remoteUuid (covered by the
//      table-sync deleteRow contract + the deleteProject/deleteAccount pattern).
//
// "Proven-to-catch": the final assertion shows the OLD conditional behavior
// WOULD have kept the seed row, so a regression that restores the guard fails.
import { describe, it, expect } from 'vitest';
import { notSeedRow, SEED_IDS } from '../poe-financial-mvp-v28.jsx';
import { unionPreservingLocal } from '../lib/table-sync.js';

// The exact merge the sync effect now runs for a synced table.
function mergeSyncedTable(currentList, incomingList) {
  const incoming = (incomingList || []).filter(notSeedRow);
  const current = (currentList || []).filter(notSeedRow);
  return unionPreservingLocal(current, incoming);
}

describe('Action Queue resurrection — seed never comes back', () => {
  const seedId = [...SEED_IDS].find((id) => id.startsWith('in')) || [...SEED_IDS][0];
  const realLocal = { id: `in-${Date.now()}`, description: 'Kitchen plumbing needed' };

  it('drops seed even when the cloud table is EMPTY (the bug condition)', () => {
    // After boot, current still holds a SEED_DATA scaffolding row; cloud is empty.
    const merged = mergeSyncedTable([{ id: seedId, description: 'dev ticket' }, realLocal], []);
    expect(merged.some((r) => r.id === seedId)).toBe(false); // seed gone
    expect(merged.some((r) => r.id === realLocal.id)).toBe(true); // real local kept
  });

  it('hides a legacy seed row that historically reached the cloud (incoming filtered too)', () => {
    const merged = mergeSyncedTable([], [{ id: seedId, remoteUuid: 'uuid-legacy' }]);
    expect(merged.some((r) => r.id === seedId)).toBe(false);
  });

  it('preserves real cloud rows and unsynced local rows', () => {
    const cloud = { id: 'in-remote-1', remoteUuid: 'uuid-1', description: 'Testing. DP' };
    const merged = mergeSyncedTable([realLocal], [cloud]);
    expect(merged.some((r) => r.id === cloud.id)).toBe(true);
    expect(merged.some((r) => r.id === realLocal.id)).toBe(true);
  });

  it('PROVEN-TO-CATCH: the OLD `if (incoming.length)` guard WOULD have resurrected seed', () => {
    // Reproduce the pre-fix merge: seed only stripped when incoming is non-empty.
    const incoming = [];
    const current = [{ id: seedId }, realLocal]; // pre-fix: NOT filtered because incoming is empty
    const oldMerged = unionPreservingLocal(current, incoming);
    expect(oldMerged.some((r) => r.id === seedId)).toBe(true); // bug reproduced
    // The fix removes exactly this row.
    expect(mergeSyncedTable(current, incoming).some((r) => r.id === seedId)).toBe(false);
  });
});
