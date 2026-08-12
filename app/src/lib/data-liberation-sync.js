// =============================================================================
// data-liberation-sync — cross-device sync for "Your Data" (DR-0291)
// =============================================================================
// Darrell 2026-08-11: "persist the progress locally and also sync across my
// devices because I already have that... of course users will want it to."
//
// He is right that the plumbing exists — createTableSync is the same courier
// Advocacy, Forecast and the boards ride. But the SCOPE here is deliberately
// different from Advocacy's, and copying Advocacy would have been wrong.
//
// WHY USER-SCOPED, NOT INSTANCE-SCOPED (USER-ACCOUNTS-AND-HISTORIES-STANDARD):
// advocacy_records is family-wide on purpose — its own header says "the family
// builds the file together," because parents document FOR a student. This is
// the opposite: it is one person's own Google/Apple/Amazon account, their own
// photographs, and their own decision to delete them. The standard is explicit
// — "Each user sees only their own history" — so the row is readable only by
// the person who created it. instance_id is still carried (DR-0060 keeps every
// table instance-scoped), but the read policy narrows to auth.uid() on top of
// it. A household sharing one instance does not share this.
//
// That is not only a privacy nicety. The two confirmations are ATTESTATIONS —
// "I opened the files", "I compared the count". Family-wide rows would let one
// person's tick unlock a delete button on another person's phone, for photos
// they never checked. User-scoped rows make that structurally impossible, and
// the recorded who/when (see attest() in data-liberation.js) keeps it honest
// even where a login is genuinely shared.
//
// Local-first, per the table-sync contract: every method no-ops signed out, the
// surface works from localStorage alone, and sync resumes on sign-in.
// =============================================================================
import { createTableSync } from './table-sync.js';
import { STAGE } from './data-liberation.js';

export const dataLiberationSync = createTableSync({
  localKey: 'dataLiberationProgress',
  remoteTable: 'data_liberation_progress',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      slug: item.id,                       // the vendor id — one row per service
      vendor_id: item.id,
      stage: item.stage ?? STAGE.NOT_STARTED,
      bytes_verified: item.bytesVerified === true,
      completeness_confirmed: item.completenessConfirmed === true,
      bytes_verified_by: item.bytesVerifiedBy ?? null,
      bytes_verified_at: item.bytesVerifiedAt ?? null,
      completeness_confirmed_by: item.completenessConfirmedBy ?? null,
      completeness_confirmed_at: item.completenessConfirmedAt ?? null,
    };
  },

  fromRow(row) {
    return {
      id: row.vendor_id ?? row.slug ?? `dl-remote-${row.id}`,
      remoteUuid: row.id,
      stage: row.stage ?? STAGE.NOT_STARTED,
      // Never coerce a null into a truthy claim — an attestation is true only
      // when it was explicitly recorded true (mirrors canDelete()'s === true).
      bytesVerified: row.bytes_verified === true,
      completenessConfirmed: row.completeness_confirmed === true,
      bytesVerifiedBy: row.bytes_verified_by ?? undefined,
      bytesVerifiedAt: row.bytes_verified_at ?? undefined,
      completenessConfirmedBy: row.completeness_confirmed_by ?? undefined,
      completenessConfirmedAt: row.completeness_confirmed_at ?? undefined,
    };
  },
});

/**
 * Merge the cloud's rows over local, preserving anything local-only.
 *
 * The conflict that matters: the same vendor edited on two devices. Progress
 * only ever moves FORWARD through the stages, so the furthest-along wins and a
 * stale phone can never drag a laptop backwards to "not started."
 *
 * Attestations are merged the other way — the STRICTER side wins. If either
 * device says a check was not done, it is not done. Sync must never manufacture
 * a confirmation nobody made; that is the one thing standing between a user and
 * deleting originals against an incomplete copy.
 */
export function mergeRemoteLiberation(local, remote, stageIndexOf) {
  // NOTE: deliberately NOT unionPreservingLocal here. That helper de-dupes by
  // key and keeps one side, which is right for append-only record lists — but
  // this table has ONE row per vendor that both devices edit, so we must see
  // both copies to compare them. Using the union helper silently made the
  // forward-stage and stricter-attestation rules below unreachable (caught by
  // "a stale device cannot drag progress backwards").
  const byId = new Map();
  const consider = (item) => {
    if (!item || !item.id) return;
    const prev = byId.get(item.id);
    if (!prev) { byId.set(item.id, item); return; }
    const ahead = stageIndexOf(item.stage) >= stageIndexOf(prev.stage) ? item : prev;
    const behind = ahead === item ? prev : item;
    byId.set(item.id, {
      ...behind,
      ...ahead,
      // Stricter wins, independent of which row was further along. If either
      // device says a check was not done, it was not done.
      bytesVerified: ahead.bytesVerified === true && behind.bytesVerified === true,
      completenessConfirmed:
        ahead.completenessConfirmed === true && behind.completenessConfirmed === true,
    });
  };
  for (const item of Array.isArray(local) ? local : []) consider(item);
  for (const item of Array.isArray(remote) ? remote : []) consider(item);
  return Array.from(byId.values());
}
