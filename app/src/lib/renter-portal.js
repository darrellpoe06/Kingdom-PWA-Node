// =============================================================================
// renter-portal — the tenant self-view client half (rentals build step b3b)
// =============================================================================
// Pairs with infra/supabase/schema-v2.10-renter-portal-auth.sql (the access-
// token hook + invite RPC) and the ALREADY-LIVE schema-v2.9 Pattern-D read
// policies. Two sides:
//
//   OWNER side — inviteRenterPortal(renterId): links a renter to a portal
//     identity (external_users, type 'renter') and marks them invited, so that
//     WHEN the tenant signs in with that email AND Darrell has enabled the
//     custom access token hook, their JWT carries external_user_id and the v2.9
//     policies serve them their own rows.
//
//   TENANT side — loadMyRentHistory(): reads the signed-in tenant's OWN leases +
//     rent_payments. The RLS does the scoping (own rows only); this is a plain
//     read that returns nothing until the tenant is recognized (hook enabled).
//
// INERT UNTIL ENABLED (DR-0225): every function degrades honestly — the RPC is
// absent until the migration applies (graceful reason), and the tenant read is
// simply empty until the hook is on. Nothing here grants access; the database
// policies are the gate (DR-0060). Never throws.
// =============================================================================
import supabase from './supabase.js';
import { paidPercent, statusFor } from './rent-payments.js';

/** Owner action: invite one of your renters to the self-view portal. */
export async function inviteRenterPortal(renterId, client = supabase) {
  if (!renterId) return { ok: false, reason: 'no-renter' };
  try {
    const { data, error } = await client.rpc('invite_renter_portal', { renter_uuid: renterId });
    if (error) {
      // The RPC won't exist until schema-v2.10 is applied — say so, don't crash.
      const msg = error.message || String(error);
      const reason = /function .*invite_renter_portal.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return { ok: false, reason, error: msg };
    }
    return { ok: true, externalUserId: data };
  } catch (e) { return { ok: false, reason: 'unexpected', error: (e && e.message) || 'error' }; }
}

/**
 * Tenant action: load MY rent history — the leases the signed-in tenant is on,
 * each with its payment rows (newest month first). Empty until the tenant is
 * recognized by the portal (hook enabled + invited). Returns
 * { ok, doors: [{ leaseId, monthlyRent, start, end, rows: [...] }] }.
 */
export async function loadMyRentHistory(client = supabase) {
  try {
    // Pattern-D leases_renter_portal_read returns only the tenant's own leases.
    const leaseRes = await client.from('leases')
      .select('id, monthly_rent, lease_start, lease_end, rental_id, status')
      .eq('status', 'active');
    if (leaseRes.error || !Array.isArray(leaseRes.data)) return { ok: true, doors: [] };
    const leases = leaseRes.data;
    if (leases.length === 0) return { ok: true, doors: [] };

    const ids = leases.map((l) => l.id);
    // Pattern-D rent_payments_renter_portal_read returns only the tenant's own rows.
    const payRes = await client.from('rent_payments')
      .select('id, lease_id, period_month, expected_amount, received_amount, received_at, method, status, lifecycle')
      .in('lease_id', ids).order('period_month', { ascending: false });
    const payRows = (!payRes.error && Array.isArray(payRes.data)) ? payRes.data : [];

    const doors = leases.map((l) => ({
      leaseId: l.id,
      monthlyRent: Number(l.monthly_rent) || 0,
      start: l.lease_start,
      end: l.lease_end,
      rows: payRows.filter((p) => p.lease_id === l.id).map((r) => ({
        id: r.id,
        month: String(r.period_month || '').slice(0, 7),
        expected: Number(r.expected_amount) || 0,
        received: Number(r.received_amount) || 0,
        percent: paidPercent(r.received_amount, r.expected_amount),
        status: r.status || statusFor(r.received_amount, r.expected_amount),
        events: (r.lifecycle && Array.isArray(r.lifecycle.log)) ? r.lifecycle.log.filter((e) => e && e.kind === 'payment') : [],
      })),
    }));
    return { ok: true, doors };
  } catch (e) { return { ok: false, reason: 'unexpected', error: (e && e.message) || 'error', doors: [] }; }
}
