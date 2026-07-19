// @vitest-environment node
// table-sync initialSync — a remotely-DELETED row must never be re-uploaded.
// =============================================================================
// The cloud half of the "duplicates leave and come back after the clear" bug
// (Darrell 2026-07-19). On a storage-full device the snapshot can't save, so stale
// localStorage still holds the just-deleted rows. On the next sign-in initialSync
// uploads every LOCAL row whose slug isn't in the cloud — which RE-INSERTED the
// deleted rows (their old slug was freed by the delete, so the unique index didn't
// stop it), resurrecting them in the cloud itself. Fix: a row that was SYNCED
// (carries a remoteUuid) but is absent from the cloud was deleted remotely — never
// re-upload it. Only genuinely-new local rows (no remoteUuid) upload.
//
// PROVEN-TO-CATCH: the deleted-but-stale row 't-dupe' must NOT appear in the
// uploaded set. Remove the `if (local.remoteUuid) return false` guard and it does.
import { vi, describe, it, expect, beforeEach } from 'vitest';

let cloudRaw = [];   // raw remote rows fetchAll returns (pre-fromRow)
let inserted = [];   // rows passed to insert()

function builder() {
  const b = {
    _row: null,
    select() { return b; },
    eq() { return b; },
    order() { return b; },
    range() { return Promise.resolve({ data: cloudRaw, error: null }); }, // fetchAll terminal
    insert(row) { b._row = row; return b; },
    single() { inserted.push(b._row); return Promise.resolve({ data: { id: 'new-uuid-' + inserted.length, ...b._row }, error: null }); },
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

const sync = createTableSync({
  localKey: 'transactions',
  remoteTable: 'transactions',
  toRow: (x) => ({ slug: x.id, amount: x.amount ?? 0 }),
  fromRow: (r) => ({ id: r.slug, remoteUuid: r.id }),
});

describe('initialSync — never re-upload a remotely-deleted (synced) row', () => {
  beforeEach(() => { inserted = []; });

  it('uploads a genuinely-new row but NOT a synced row absent from the cloud', async () => {
    cloudRaw = [{ id: 'uuid-real', slug: 't-real' }]; // cloud holds only the real row
    const local = [
      { id: 't-real', remoteUuid: 'uuid-real', amount: -50 }, // still in cloud
      { id: 't-dupe', remoteUuid: 'uuid-gone', amount: -50 }, // SYNCED but deleted from cloud
      { id: 't-new', amount: -9 },                             // never synced -> new
    ];
    await sync.initialSync(local);
    const uploadedSlugs = inserted.map((r) => r.slug);
    expect(uploadedSlugs).toContain('t-new');       // genuinely new -> uploaded
    expect(uploadedSlugs).not.toContain('t-dupe');  // deleted row NOT resurrected in the cloud
    expect(uploadedSlugs).not.toContain('t-real');  // already present -> not re-uploaded
  });
});
