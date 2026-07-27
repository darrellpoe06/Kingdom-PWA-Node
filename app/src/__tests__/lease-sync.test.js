// @vitest-environment node
// =============================================================================
// lease-sync — the door's lease reaches the cloud, honestly (DR-0076)
// =============================================================================
// Step (a) of the rentals per-door paid-vs-due build (Darrell 2026-07-27:
// "Start the lease sync build now"). Proven-to-catch with an injected fake
// client: a complete lease INSERTS (creating its renter), an existing active
// lease UPDATES instead of duplicating, an incomplete lease SKIPS with a named
// reason (never a fabricated date to satisfy a NOT NULL), a signed-out or
// unsynced door skips, and the by-rental lookup map feeds step (b).
import { describe, it, expect } from 'vitest';
import {
  leaseComplete, toLeaseRow, ensureRenter, syncLeaseForRental, syncAllLeases, loadLeasesByRental,
} from '../lib/lease-sync.js';

const DOOR = {
  id: 'r-1', remoteUuid: 'uuid-door-1', tenantName: 'Shay Example', rent: 950,
  lease: { start: '2026-01-01', end: '2026-12-31', monthlyRent: 950, deposit: 950, signedDocURL: 'https://x/lease.pdf' },
};
const IDS = { tenantId: 'inst-1', userId: 'user-1' };

// A tiny scriptable Supabase stand-in: table -> handlers for select/insert/update.
function fakeClient(script) {
  const calls = [];
  return {
    calls,
    from(table) {
      const t = script[table] || {};
      const q = { _table: table, _filters: {}, _op: null, _payload: null };
      const runSelect = () => (t.select ? t.select(q) : { data: [], error: null });
      const chain = {
        select(cols) { if (!q._op) { q._op = 'select'; q._cols = cols; return chain; } q._returning = cols; return chain; },
        insert(payload) { q._op = 'insert'; q._payload = payload; calls.push({ table, op: 'insert', payload }); return chain; },
        update(payload) { q._op = 'update'; q._payload = payload; calls.push({ table, op: 'update', payload }); return chain; },
        eq(col, val) { q._filters[col] = val; if (q._op === 'update' && t.update) { /* resolved at await */ } return chain; },
        limit() { return Promise.resolve(runSelect()); },
        single() { return Promise.resolve(t.insert ? t.insert(q) : { data: null, error: { message: 'no insert handler' } }); },
        then(resolve) { // awaiting a bare select or an update chain
          if (q._op === 'select') { resolve(runSelect()); return; }
          resolve(t.update ? t.update(q) : { data: null, error: null });
        },
      };
      return chain;
    },
  };
}

describe('leaseComplete — only real leases travel', () => {
  it('true for the complete door; false when any NOT NULL ingredient is missing', () => {
    expect(leaseComplete(DOOR)).toBe(true);
    expect(leaseComplete({ ...DOOR, lease: { ...DOOR.lease, start: '' } })).toBe(false);
    expect(leaseComplete({ ...DOOR, lease: { ...DOOR.lease, end: null } })).toBe(false);
    expect(leaseComplete({ ...DOOR, tenantName: '  ' })).toBe(false);
    expect(leaseComplete({ ...DOOR, lease: undefined })).toBe(false);
  });
  it('falls back to the door rent when the lease sub-object has no amount', () => {
    expect(leaseComplete({ ...DOOR, lease: { ...DOOR.lease, monthlyRent: 0 } })).toBe(true); // rent: 950
    expect(leaseComplete({ ...DOOR, rent: 0, lease: { ...DOOR.lease, monthlyRent: 0 } })).toBe(false);
  });
});

describe('toLeaseRow — the cloud row carries the paid-vs-due backbone', () => {
  it('maps every NOT NULL column + deposit/document, status active', () => {
    const row = toLeaseRow(DOOR, { ...IDS, rentalUuid: 'uuid-door-1', renterUuid: 'uuid-renter-1' });
    expect(row).toMatchObject({
      instance_id: 'inst-1', created_by: 'user-1', rental_id: 'uuid-door-1', renter_id: 'uuid-renter-1',
      lease_start: '2026-01-01', lease_end: '2026-12-31', monthly_rent: 950,
      security_deposit: 950, document_uri: 'https://x/lease.pdf', status: 'active',
    });
  });
});

describe('syncLeaseForRental — insert, update, and honest skips', () => {
  it('INSERTS a new active lease, creating the renter first', async () => {
    const c = fakeClient({
      renters: { select: () => ({ data: [], error: null }), insert: () => ({ data: { id: 'uuid-renter-1' }, error: null }) },
      leases: { select: () => ({ data: [], error: null }), insert: () => ({ data: { id: 'uuid-lease-1' }, error: null }) },
    });
    const res = await syncLeaseForRental(c, DOOR, IDS);
    expect(res).toMatchObject({ ok: true, action: 'insert', leaseId: 'uuid-lease-1' });
    expect(c.calls.some((x) => x.table === 'renters' && x.op === 'insert')).toBe(true);
  });

  it('UPDATES the existing active lease — never a duplicate row per door', async () => {
    const c = fakeClient({
      renters: { select: () => ({ data: [{ id: 'uuid-renter-1' }], error: null }) },
      leases: { select: () => ({ data: [{ id: 'uuid-lease-1' }], error: null }), update: () => ({ data: null, error: null }) },
    });
    const res = await syncLeaseForRental(c, { ...DOOR, lease: { ...DOOR.lease, monthlyRent: 1000 } }, IDS);
    expect(res).toMatchObject({ ok: true, action: 'update', leaseId: 'uuid-lease-1' });
    const upd = c.calls.find((x) => x.table === 'leases' && x.op === 'update');
    expect(upd.payload.monthly_rent).toBe(1000);
    expect(c.calls.some((x) => x.table === 'leases' && x.op === 'insert')).toBe(false);
  });

  it('SKIPS with named reasons: incomplete lease, unsynced door, signed out — and never throws', async () => {
    const c = fakeClient({});
    expect(await syncLeaseForRental(c, { ...DOOR, lease: null }, IDS)).toMatchObject({ action: 'skip', reason: 'lease-incomplete' });
    expect(await syncLeaseForRental(c, { ...DOOR, remoteUuid: null }, IDS)).toMatchObject({ action: 'skip', reason: 'door-not-synced' });
    expect(await syncLeaseForRental(c, DOOR, { tenantId: null, userId: null })).toMatchObject({ action: 'skip', reason: 'signed-out' });
  });

  it('ensureRenter reuses an existing tenant row (no duplicate renters)', async () => {
    const c = fakeClient({ renters: { select: () => ({ data: [{ id: 'uuid-renter-9' }], error: null }) } });
    expect(await ensureRenter(c, { ...IDS, displayName: 'Shay Example' })).toBe('uuid-renter-9');
    expect(c.calls.some((x) => x.op === 'insert')).toBe(false);
  });
});

describe('the sweep and the step-(b) lookup', () => {
  it('syncAllLeases reports per-door results (ready doors sync, bare doors skip)', async () => {
    const c = fakeClient({
      renters: { select: () => ({ data: [{ id: 'uuid-renter-1' }], error: null }) },
      leases: { select: () => ({ data: [], error: null }), insert: () => ({ data: { id: 'uuid-lease-2' }, error: null }) },
    });
    const out = await syncAllLeases(c, [DOOR, { id: 'r-2', remoteUuid: 'uuid-door-2' }], IDS);
    expect(out[0]).toMatchObject({ id: 'r-1', ok: true, action: 'insert' });
    expect(out[1]).toMatchObject({ id: 'r-2', action: 'skip', reason: 'lease-incomplete' });
  });

  it('loadLeasesByRental maps rental_id -> { leaseId, monthlyRent } for paid-vs-due', async () => {
    const c = fakeClient({
      leases: { select: () => ({ data: [{ id: 'L1', rental_id: 'uuid-door-1', monthly_rent: '950.00', lease_start: '2026-01-01', lease_end: '2026-12-31', status: 'active' }], error: null }) },
    });
    const map = await loadLeasesByRental(c, 'inst-1');
    expect(map['uuid-door-1']).toMatchObject({ leaseId: 'L1', monthlyRent: 950 });
  });
});
