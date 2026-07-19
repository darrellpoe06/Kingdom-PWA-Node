// @vitest-environment node
// table-sync deleteRows — the BATCHED, chunked cloud delete.
// =============================================================================
// The books dedupe removes THOUSANDS of rows at once. Firing that many single
// deleteRow() calls floods the browser's ~6-connection cap and the PostgREST rate
// limit, so most silently never land — the cloud stays doubled and the duplicates
// are "back on refresh" (Darrell 2026-07-19) even with every resurrection path
// already closed. deleteRows batches them into `.in()` deletes of CHUNK ids,
// AWAITED sequentially so it never floods, and returns the count actually removed.
//
// PROVEN-TO-CATCH: 450 ids delete in exactly 3 chunks (200+200+50) with the total
// counted from the returned rows. A regression to one-request-per-id changes the
// call count; a regression that drops the count fails the deleted assertion.
import { vi, describe, it, expect, beforeEach } from 'vitest';

let inCalls = []; // the id arrays passed to each .in()

function builder() {
  const b = {
    delete() { return b; },
    in(_col, ids) { inCalls.push(ids); b._ids = ids; return b; },
    select() { return Promise.resolve({ data: b._ids.map((id) => ({ id })), error: null }); },
  };
  return b;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => builder()),
    rpc: vi.fn(async () => ({ data: 'inst-test', error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u-1' } } } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { createTableSync } from '../lib/table-sync.js';

const sync = createTableSync({ localKey: 'transactions', remoteTable: 'transactions', toRow: (x) => x, fromRow: (x) => x });

describe('deleteRows — chunked batch delete', () => {
  beforeEach(() => { inCalls = []; });

  it('deletes 450 ids in 3 chunks (200+200+50) and counts what was removed', async () => {
    const ids = Array.from({ length: 450 }, (_, i) => 'uuid-' + i);
    const res = await sync.deleteRows(ids);
    expect(inCalls.length).toBe(3);                 // NOT 450 single requests
    expect(inCalls.map((c) => c.length)).toEqual([200, 200, 50]);
    expect(res.deleted).toBe(450);
    expect(res.requested).toBe(450);
  });

  it('dedupes + drops falsy ids, and is a no-op on empty input', async () => {
    const res = await sync.deleteRows(['a', 'a', null, undefined, 'b']);
    expect(inCalls.length).toBe(1);
    expect(inCalls[0].sort()).toEqual(['a', 'b']);
    expect(res.deleted).toBe(2);
    inCalls = [];
    expect((await sync.deleteRows([])).deleted).toBe(0);
    expect(inCalls.length).toBe(0);                 // no request fired for nothing
  });
});
