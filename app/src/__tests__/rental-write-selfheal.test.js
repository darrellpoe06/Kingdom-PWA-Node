// @vitest-environment node
// rental-write-selfheal — an edit routes to updateRow when linked, and SELF-HEALS
// by upsert when the local row never linked to the cloud (DR-0374).
// =============================================================================
// The trapped-edits bug (Christina, 2026-09): a family member whose device never
// completed the balance-verify gate had every property edit silently dropped —
// the old path required a remoteUuid and skipped otherwise. syncRentalEdit now
// upserts by (instance_id, slug) when there is no uuid, so the edit lands and the
// row links (onLink stamps the returned id).
//
// PROVEN-TO-CATCH: the no-uuid case asserts upsert ran and onLink stamped the id.
// Restore the old "skip when no remoteUuid" and both assertions fail.
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { syncRentalEdit } from '../lib/rental-write.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

let sync;
beforeEach(() => {
  sync = {
    updateRow: vi.fn(async () => ({ updated: true })),
    upsert: vi.fn(async () => ({ upserted: true, remoteId: 'healed-uuid' })),
  };
});

describe('syncRentalEdit — link when present, self-heal when absent', () => {
  it('a LINKED row updates by uuid with the patch, never upserts', async () => {
    const res = syncRentalEdit(sync, { local: { id: 'r-1', remoteUuid: 'u-1' }, updates: { rent: 1150 } });
    expect(res.routed).toBe('update');
    await flush();
    expect(sync.updateRow).toHaveBeenCalledWith('u-1', expect.objectContaining({ monthly_rent: 1150 }));
    expect(sync.upsert).not.toHaveBeenCalled();
  });

  it('an UNLINKED row self-heals via upsert and stamps the returned id (onLink)', async () => {
    const onLink = vi.fn();
    const res = syncRentalEdit(sync, { local: { id: 'r-2', name: '1508 Williamsburg' }, updates: { rent: 1150 }, onLink });
    expect(res.routed).toBe('upsert');
    await flush();
    expect(sync.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'r-2', rent: 1150 }));
    expect(sync.updateRow).not.toHaveBeenCalled();
    expect(onLink).toHaveBeenCalledWith('healed-uuid'); // the row now links for next time
  });

  it('a device-local-only edit (empty cloud patch) makes NO network call', () => {
    const res = syncRentalEdit(sync, { local: { id: 'r-3', remoteUuid: 'u-3' }, updates: { rooms: [{ id: 'rm-1' }] } });
    expect(res.skipped).toBe('device-local-only');
    expect(sync.updateRow).not.toHaveBeenCalled();
    expect(sync.upsert).not.toHaveBeenCalled();
  });

  it('no local row → no-op, never a stray write', () => {
    const res = syncRentalEdit(sync, { local: null, updates: { rent: 1 } });
    expect(res.skipped).toBe('no-target');
    expect(sync.updateRow).not.toHaveBeenCalled();
    expect(sync.upsert).not.toHaveBeenCalled();
  });
});
