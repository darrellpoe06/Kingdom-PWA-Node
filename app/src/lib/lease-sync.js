// =============================================================================
// lease-sync — the leases sub-object reaches the cloud (rentals per-door build)
// =============================================================================
// Darrell 2026-07-27: "Start the lease sync build now" — step (a) of the
// per-door paid-vs-due build. The cloud schema has had `leases` +
// `rent_payments` since v2.2 (expected vs received per lease-month, partial
// status, RLS) but the app never uploaded a lease: the monolith's own comment
// says "the lease/tenant/market sub-objects stay device-local (leases +
// rent_payments sync is the follow-up)". This module IS that follow-up's first
// half: each door's device-local lease sub-object ({ start, end, monthlyRent,
// deposit, signedDocURL }) is upserted to the cloud `leases` table, keyed to
// the door's remote row — so rent_payments (step b) has a real lease_id to
// hang paid-vs-due on.
//
// Cloud constraints honored (schema-v2.2-rentals.sql):
//   · leases.renter_id is NOT NULL → a `renters` row is found-or-created from
//     the door's tenantName (display_name is renters' only required field).
//   · leases requires lease_start, lease_end, monthly_rent → a lease is only
//     synced when COMPLETE (leaseComplete below); an empty/partial sub-object
//     stays device-local — never a fabricated date to satisfy a constraint
//     (DR-0076: the surface tells the truth or stays home).
//   · one ACTIVE lease per door: upsert = find active by rental_id → update,
//     else insert. Idempotent; safe to run on every boot.
//
// HONEST LIMIT (DR-0076): sync fires on door upload and on the boot/sign-in
// initial sync (rentals-sync decorates both), so a lease edited mid-session
// reaches the cloud on the NEXT boot; instant per-edit sync lands with the
// rent-payments entry UI (step b), which gives the edit a natural save moment.
// Money never moves in-app (DR-0094) — this records lease terms, nothing else.
//
// PURE + injectable: mappers and the completeness test are pure; all I/O takes
// a client argument so tests prove insert/update/skip with a fake client.
// =============================================================================

/** A lease sub-object is cloud-ready only when the NOT NULL columns are real. */
export function leaseComplete(rental) {
  const l = rental && rental.lease;
  if (!l) return false;
  const rent = Number(l.monthlyRent) || Number(rental.rent) || 0;
  return Boolean(l.start && l.end && rent > 0 && String(rental.tenantName || '').trim());
}

/** Map a door's lease sub-object to a cloud `leases` row (ids supplied). */
export function toLeaseRow(rental, { tenantId, userId, rentalUuid, renterUuid }) {
  const l = rental.lease || {};
  return {
    instance_id:      tenantId,
    created_by:       userId,
    rental_id:        rentalUuid,
    renter_id:        renterUuid,
    lease_start:      l.start,
    lease_end:        l.end,
    monthly_rent:     Number(l.monthlyRent) || Number(rental.rent) || 0,
    security_deposit: Number(l.deposit) || null,
    document_uri:     l.signedDocURL || null,
    status:           'active',
  };
}

/** Find-or-create the renter row for this door's tenant. Returns uuid or null. */
export async function ensureRenter(client, { tenantId, userId, displayName }) {
  const name = String(displayName || '').trim();
  if (!name) return null;
  const found = await client.from('renters').select('id')
    .eq('instance_id', tenantId).eq('display_name', name).limit(1);
  if (found.error) return null;
  if (found.data && found.data.length) return found.data[0].id;
  const ins = await client.from('renters')
    .insert({ instance_id: tenantId, created_by: userId, display_name: name })
    .select('id').single();
  return ins.error ? null : ins.data.id;
}

/**
 * Upsert the door's active lease. Never throws (fire-and-forget safe).
 * Returns { ok, action: 'insert'|'update'|'skip', reason? , leaseId? }.
 */
export async function syncLeaseForRental(client, rental, { tenantId, userId }) {
  try {
    if (!client || !tenantId || !userId) return { ok: false, action: 'skip', reason: 'signed-out' };
    if (!rental || !rental.remoteUuid) return { ok: false, action: 'skip', reason: 'door-not-synced' };
    if (!leaseComplete(rental)) return { ok: false, action: 'skip', reason: 'lease-incomplete' };

    const renterUuid = await ensureRenter(client, { tenantId, userId, displayName: rental.tenantName });
    if (!renterUuid) return { ok: false, action: 'skip', reason: 'renter-failed' };

    const row = toLeaseRow(rental, { tenantId, userId, rentalUuid: rental.remoteUuid, renterUuid });
    const existing = await client.from('leases').select('id')
      .eq('rental_id', rental.remoteUuid).eq('status', 'active').limit(1);
    if (existing.error) return { ok: false, action: 'skip', reason: 'lookup-failed' };

    if (existing.data && existing.data.length) {
      const id = existing.data[0].id;
      const upd = await client.from('leases').update({
        renter_id: row.renter_id, lease_start: row.lease_start, lease_end: row.lease_end,
        monthly_rent: row.monthly_rent, security_deposit: row.security_deposit,
        document_uri: row.document_uri, updated_by: userId, updated_at: new Date().toISOString(),
      }).eq('id', id);
      return upd.error ? { ok: false, action: 'skip', reason: 'update-failed' } : { ok: true, action: 'update', leaseId: id };
    }
    const ins = await client.from('leases').insert(row).select('id').single();
    return ins.error ? { ok: false, action: 'skip', reason: 'insert-failed' } : { ok: true, action: 'insert', leaseId: ins.data.id };
  } catch {
    return { ok: false, action: 'skip', reason: 'unexpected' };
  }
}

/** Sync every cloud-ready lease in a list of doors. Returns per-door results. */
export async function syncAllLeases(client, rentals, ids) {
  const out = [];
  for (const r of rentals || []) {
    // Sequential on purpose: a handful of doors, and renters find-or-create
    // must not race itself into duplicate tenant rows.
    out.push({ id: r && r.id, ...(await syncLeaseForRental(client, r, ids)) });
  }
  return out;
}

/** Load leaseId + monthly_rent per door (rental_id) — step (b)'s lookup. */
export async function loadLeasesByRental(client, tenantId) {
  const res = await client.from('leases')
    .select('id, rental_id, monthly_rent, lease_start, lease_end, status')
    .eq('instance_id', tenantId).eq('status', 'active');
  if (res.error || !Array.isArray(res.data)) return {};
  const map = {};
  for (const row of res.data) map[row.rental_id] = { leaseId: row.id, monthlyRent: Number(row.monthly_rent) || 0, start: row.lease_start, end: row.lease_end };
  return map;
}
