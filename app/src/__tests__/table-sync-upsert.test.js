// @vitest-environment node
// table-sync-upsert — a write to a row that MAY already exist heals by slug,
// it does not blindly INSERT a duplicate.
// =============================================================================
// The trapped-edits bug (Christina, 2026-09; DR-0374): a family member whose
// device never linked its rental rows to the cloud had every property edit
// silently dropped — updateRental required a pre-existing remoteUuid and skipped
// otherwise. upsert() is the self-heal: resolve the existing row by the
// conflictKey (instance_id, slug) and UPDATE it, or INSERT only when none
// exists. RESOLVE-then-write on purpose — rentals' unique index is PARTIAL
// (WHERE slug IS NOT NULL), which a PostgREST ON CONFLICT arbiter cannot target.
//
// PROVEN-TO-CATCH: the "row exists" case asserts UPDATE ran and INSERT did not.
// Make upsert always insert (the pre-fix behavior) and that assertion fails —
// the door would double in the cloud.
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Staged per test; counters span the fresh builder returned by each from().
let resolveResult = { data: null, error: null }; // what .maybeSingle() returns
let insertResult = { data: { id: 'new-uuid' }, error: null }; // .single() after insert
let updateResult = { error: null };
const calls = { resolve: 0, insert: 0, update: 0, lastUpdatePatch: null };

function builder() {
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(async () => { calls.resolve++; return resolveResult; }),
    single: vi.fn(async () => insertResult),
    insert: vi.fn(() => { calls.insert++; return q; }),
    update: vi.fn((patch) => { calls.update++; calls.lastUpdatePatch = patch; return { eq: vi.fn(async () => updateResult) }; }),
  };
  return q;
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
  localKey: 'rentals',
  remoteTable: 'rentals',
  conflictKey: 'instance_id,slug',
  toRow: (x) => ({ instance_id: 'inst-test', slug: x.id, display_name: x.name, monthly_rent: x.rent || 0 }),
  fromRow: (x) => x,
});

const plainSync = createTableSync({
  localKey: 'flat',
  remoteTable: 'flat',
  // no conflictKey
  toRow: (x) => ({ slug: x.id }),
  fromRow: (x) => x,
});

describe('upsert — heal by slug, never a blind duplicate', () => {
  beforeEach(() => { calls.resolve = 0; calls.insert = 0; calls.update = 0; calls.lastUpdatePatch = null; });

  it('UPDATES the existing row when the conflict key already resolves (no duplicate insert)', async () => {
    resolveResult = { data: { id: 'existing-uuid' }, error: null };
    const res = await sync.upsert({ id: 'r-1508w', name: '1508 Williamsburg', rent: 1150 });
    expect(calls.resolve).toBe(1);
    expect(calls.update).toBe(1);
    expect(calls.insert).toBe(0);                 // the door is NOT duplicated
    expect(res.upserted).toBe(true);
    expect(res.updated).toBe(true);
    expect(res.remoteId).toBe('existing-uuid');
    expect(calls.lastUpdatePatch.monthly_rent).toBe(1150); // the edit actually lands
    expect(calls.lastUpdatePatch.updated_at).toBeTruthy();
  });

  it('INSERTS when the conflict key resolves nothing (a genuinely new door)', async () => {
    resolveResult = { data: null, error: null };
    insertResult = { data: { id: 'brand-new-uuid' }, error: null };
    const res = await sync.upsert({ id: 'r-new', name: '999 New St', rent: 500 });
    expect(calls.resolve).toBe(1);
    expect(calls.insert).toBe(1);
    expect(calls.update).toBe(0);
    expect(res.upserted).toBe(true);
    expect(res.inserted).toBe(true);
    expect(res.remoteId).toBe('brand-new-uuid');
  });

  it('a resolve error is honest (skipped:resolve-error), never a blind insert (DR-0076)', async () => {
    resolveResult = { data: null, error: { message: 'rls/timeout' } };
    const res = await sync.upsert({ id: 'r-x', name: 'x' });
    expect(res.skipped).toBe('resolve-error');
    expect(calls.insert).toBe(0);                 // must NOT fall through to a duplicate insert
    expect(calls.update).toBe(0);
  });

  it('with no conflictKey declared, upsert is a plain insert — it never tries to resolve', async () => {
    insertResult = { data: { id: 'flat-uuid' }, error: null };
    const res = await plainSync.upsert({ id: 'f-1' });
    expect(calls.resolve).toBe(0);                // no slug resolution for a keyless table
    expect(calls.insert).toBe(1);
    expect(res.uploaded).toBe(true);              // upload()'s shape
    expect(res.remoteId).toBe('flat-uuid');
  });
});
