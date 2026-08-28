// =============================================================================
// rescue-upload — the I/O half of the records rescue
// =============================================================================
// planRescue (rescue-local-records.js) decides WHAT would be written and is
// pure. This decides whether it lands, and is the only part that touches a
// network. Split so the decision can be shown to the landlord and tested
// without a database, and so this file stays small enough to read in one sitting.
//
// WHY IT READS BEFORE IT WRITES, instead of upserting.
//
// 0159's idempotency keys are PARTIAL unique indexes — UNIQUE(rental_ref,
// legacy_id) WHERE legacy_id IS NOT NULL — because a note typed directly into
// the record has no legacy id and there may be many of those. PostgREST's
// on_conflict names columns, not predicates, so it emits ON CONFLICT
// (rental_ref, legacy_id), which a partial index does not satisfy: Postgres
// answers "no unique or exclusion constraint matching the ON CONFLICT
// specification" and the whole batch fails. Reading the door's existing
// legacy_ids first and filtering is explicit, survives a schema that changes
// under it, and cannot half-write.
//
// NEVER THROWS. Every path returns { ok, ... } with a reason a person can read,
// because this runs behind a button a landlord presses when he is already
// worried about his records.
// =============================================================================
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';
import { planRescue, describePlan } from './rescue-local-records.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });

// Which table each part of a plan lands in, and which key column identifies its
// door. property_notes is slug-keyed; the rest are UUID-keyed. Getting this
// backwards writes rows nothing will ever read again, so it is stated once.
const TARGETS = Object.freeze([
  { part: 'notes',   table: 'property_notes',         keyed: 'slug' },
  { part: 'rooms',   table: 'property_rooms',         keyed: 'uuid' },
  { part: 'systems', table: 'property_systems',       keyed: 'uuid' },
  { part: 'events',  table: 'property_system_events',  keyed: 'uuid' },
]);

/**
 * The legacy ids already filed against this door in one table. An error here is
 * NOT treated as "nothing is there" — that would re-send everything on the next
 * press. It fails the table instead, and says so.
 */
async function existingLegacyIds(table, rentalRef, client) {
  const { data, error } = await client
    .from(table).select('legacy_id').eq('rental_ref', rentalRef).not('legacy_id', 'is', null);
  if (error) return { ok: false, error };
  return { ok: true, ids: new Set((data || []).map((r) => r.legacy_id).filter(Boolean)) };
}

/**
 * Carry one door's device-local records up to the server.
 *
 * Returns per-table counts and, when something failed, WHICH table and why —
 * never a bare false. A partial success is reported as a partial success: three
 * tables landing and one failing is the truth, and pretending otherwise would
 * send the landlord back to press a button that has already done most of its
 * work.
 */
export async function carryUpRecords(rental, {
  instanceId = null, rentalUuid = null, authorLabel = '', existingNotes = [],
  client = supabase, plan = null,
} = {}) {
  try {
    const tenantId = instanceId || await getInstanceId();
    if (!tenantId) return no('not-signed-in');

    const uuid = rentalUuid || rental?.remoteUuid || null;
    const p = plan || planRescue(rental, {
      instanceId: tenantId, rentalUuid: uuid, existingNotes, authorLabel,
    });
    if (!p.ok) return no(p.reason);
    if (!p.total) return ok({ carried: 0, plan: p, already: true });

    const userId = (await client.auth.getUser())?.data?.user?.id || null;

    const written = {};
    const failed = [];
    let carried = 0;

    for (const { part, table, keyed } of TARGETS) {
      const rows = p[part] || [];
      written[part] = 0;
      if (!rows.length) continue;

      const ref = keyed === 'slug' ? p.slug : uuid;
      if (!ref) { failed.push(`${table}: this property has no server id yet`); continue; }

      const seen = await existingLegacyIds(table, ref, client);
      if (!seen.ok) { failed.push(`${table}: could not check what is already filed (${seen.error.message})`); continue; }

      const fresh = rows.filter((r) => !r.legacy_id || !seen.ids.has(r.legacy_id));
      if (!fresh.length) continue;

      // The instance is stamped HERE, unconditionally, rather than trusting
      // whatever the pure mapper was handed: the mapper has no business knowing
      // whose instance this is, and a caller that guessed must not be able to
      // write a row into the wrong family's data. RLS would refuse it anyway
      // (DR-0060), and this makes the refusal unnecessary.
      const stamped = fresh.map((r) => ({ ...r, instance_id: tenantId, created_by: userId }));
      const { error } = await client.from(table).insert(stamped);
      if (error) { failed.push(`${table}: ${error.message}`); continue; }
      written[part] = stamped.length;
      carried += stamped.length;
    }

    return {
      ok: failed.length === 0,
      reason: failed.length ? 'partly-carried' : 'carried',
      carried, written, failed, plan: p,
    };
  } catch (e) { return no('unexpected', e); }
}

/** What to show after the press. Says the number, and names anything left. */
export function describeResult(res) {
  if (!res) return '';
  if (res.ok && res.already) return 'Everything in this record was already on the server.';
  if (!res.ok && res.reason === 'not-signed-in') return 'Sign in first — the records go to your account.';
  if (!res.ok && !res.carried) return `Nothing was carried up (${res.reason}).`;
  const n = res.carried || 0;
  const head = `Carried ${n} record${n === 1 ? '' : 's'} up to the server.`;
  const left = (res.plan?.deferred || []).concat(res.plan?.skipped || []);
  const bad = res.failed || [];
  return [head, ...bad, ...left].join(' ');
}

export { planRescue, describePlan };
