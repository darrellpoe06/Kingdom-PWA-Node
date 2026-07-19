// @vitest-environment node
// table-sync-delete-noop — the delete that removed 0 rows must NOT report success.
// =============================================================================
// The resurrection bug (Darrell 2026-07-19: "no matter how many times it clears
// they all come back"): a DELETE the RLS USING clause blocks (a non-owner on the
// books — 0100 makes DELETE owner/admin only) returns NO error and removes
// NOTHING, yet the old deleteRow reported `{ deleted: true }`. The caller trusted
// it, dropped the row locally, and the surviving cloud row re-hydrated on the next
// merge. deleteRow now asks for the deleted rows back (.select) and treats a
// 0-row result as a no-op — an honest signal (DR-0076), not a false success.
//
// PROVEN-TO-CATCH: the "blocked" case asserts skipped:'no-op'. Restore the old
// `return { deleted: true }` (ignore the row count) and that assertion fails.
import { vi, describe, it, expect, beforeEach } from 'vitest';

// A tiny fake of the supabase delete builder: from(t).delete().eq(c,v).select(c)
// resolves to the { data, error } we stage per test.
let deleteResult = { data: [{ id: 'uuid-1' }], error: null };
const selectSpy = vi.fn(async () => deleteResult);

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ select: selectSpy })),
      })),
    })),
    rpc: vi.fn(async () => ({ data: 'inst-test', error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u-1' } } } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { createTableSync } from '../lib/table-sync.js';

const sync = createTableSync({
  localKey: 'transactions',
  remoteTable: 'transactions',
  toRow: (x) => x,
  fromRow: (x) => x,
});

describe('deleteRow — a 0-row delete is an honest no-op, not a false success', () => {
  beforeEach(() => selectSpy.mockClear());

  it('reports deleted:true when a row was actually removed', async () => {
    deleteResult = { data: [{ id: 'uuid-1' }], error: null };
    const res = await sync.deleteRow('uuid-1');
    expect(res.deleted).toBe(true);
    expect(res.affected).toBe(1);
  });

  it('reports skipped:no-op when RLS blocked the delete (0 rows, no error)', async () => {
    deleteResult = { data: [], error: null }; // the silent-block shape
    const res = await sync.deleteRow('uuid-blocked');
    expect(res.deleted).toBeUndefined();
    expect(res.skipped).toBe('no-op');
    expect(res.affected).toBe(0);
  });

  it('surfaces a hard error as skipped:delete-error', async () => {
    deleteResult = { data: null, error: { message: 'boom' } };
    const res = await sync.deleteRow('uuid-err');
    expect(res.skipped).toBe('delete-error');
  });
});
