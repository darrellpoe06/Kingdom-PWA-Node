// @vitest-environment node
// =============================================================================
// renter-portal — tenant self-view client half, proven (rentals build b3b)
// =============================================================================
// INERT-UNTIL-ENABLED is the contract under test (DR-0225/DR-0076): the invite
// RPC degrades to a NAMED 'not-enabled-yet' when schema-v2.10 hasn't applied
// (never a crash), and the tenant read returns only what the RLS hands back
// (empty until the hook recognizes them). All I/O via a fake client — this lib
// grants nothing; the database policies are the gate.
import { describe, it, expect, vi } from 'vitest';
// The lib binds a default supabase client (browser-only) at import; mock it so
// the node suite loads. Every test injects its own fake client anyway.
vi.mock('../lib/supabase.js', () => ({ default: {} }));
import { inviteRenterPortal, loadMyRentHistory } from '../lib/renter-portal.js';

function fakeClient({ rpc, tables } = {}) {
  return {
    rpc: rpc || (async () => ({ data: null, error: null })),
    from(table) {
      const rows = (tables && tables[table]) || [];
      const chain = {
        select() { return chain; },
        eq() { return chain; },
        in() { return chain; },
        order() { return Promise.resolve({ data: rows, error: null }); },
        then(resolve) { resolve({ data: rows, error: null }); },
      };
      return chain;
    },
  };
}

describe('inviteRenterPortal — owner links a renter, degrades honestly', () => {
  it('CATCHES a missing renter id', async () => {
    expect((await inviteRenterPortal(null, fakeClient())).reason).toBe('no-renter');
  });
  it('returns the external_user id on success', async () => {
    const c = fakeClient({ rpc: async () => ({ data: 'ext-1', error: null }) });
    expect(await inviteRenterPortal('r1', c)).toEqual({ ok: true, externalUserId: 'ext-1' });
  });
  it('names not-enabled-yet when the RPC is absent (migration not applied)', async () => {
    const c = fakeClient({ rpc: async () => ({ data: null, error: { message: 'function public.invite_renter_portal(uuid) does not exist' } }) });
    const r = await inviteRenterPortal('r1', c);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('not-enabled-yet');
  });
  it('names a generic rpc-error otherwise, never throws', async () => {
    const c = fakeClient({ rpc: async () => ({ data: null, error: { message: 'permission denied' } }) });
    expect((await inviteRenterPortal('r1', c)).reason).toBe('rpc-error');
  });
});

describe('loadMyRentHistory — reads only what RLS returns (own rows)', () => {
  it('groups the tenant’s own payment rows under their lease(s)', async () => {
    const c = fakeClient({ tables: {
      leases: [{ id: 'L1', monthly_rent: 950, lease_start: '2026-01-01', lease_end: '2026-12-31', rental_id: 'd1', status: 'active' }],
      rent_payments: [
        { id: 'P1', lease_id: 'L1', period_month: '2026-07-01', expected_amount: 950, received_amount: 600, status: 'partial', lifecycle: { log: [{ kind: 'payment', amount: 600 }] } },
      ],
    } });
    const { ok, doors } = await loadMyRentHistory(c);
    expect(ok).toBe(true);
    expect(doors).toHaveLength(1);
    expect(doors[0]).toMatchObject({ leaseId: 'L1', monthlyRent: 950 });
    expect(doors[0].rows[0]).toMatchObject({ month: '2026-07', received: 600, expected: 950, percent: 63, status: 'partial' });
    expect(doors[0].rows[0].events).toHaveLength(1);
  });
  it('returns an empty list (not an error) when RLS hands back nothing — the inert default', async () => {
    const { ok, doors } = await loadMyRentHistory(fakeClient({ tables: { leases: [] } }));
    expect(ok).toBe(true);
    expect(doors).toEqual([]);
  });
});
