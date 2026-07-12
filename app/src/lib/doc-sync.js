// =============================================================================
// doc-sync — the jsonb-doc table-sync rail for small personal/family lists
// =============================================================================
// 2026-07-05 live-data rails: five collections the tabs render as if shared
// were still device-local (the static-vs-live audit): game saves, the
// subscriptions audit, Dev/Ops skill profiles, prayer requests, and One Voice
// notes. Each is a flat list of small objects whose shape the app owns and
// evolves freely — so instead of one hand-mapped column set per table (the
// v2.2 phantom-column trap, LESSONS-LEARNED P13), every row here is
//   instance_id + created_by + slug (the stable local id) + doc (the whole item)
// and the doc jsonb IS the record. No column drift is possible: what the app
// saves is exactly what any device loads. Same proven table-sync base
// (realtime + fail-soft + initialSync dedup by slug->id) as recipes/projects.
//
// The five tables ship in infra/supabase/migrations-auto/0077-live-data-rails.sql
// (applied by Darrell's hand, per the db-migrate gap). Until the migration is
// applied every call fails soft (table-sync logs + skips) and the app keeps
// working from localStorage — sync self-heals the moment the tables exist.
import { createTableSync } from './table-sync.js';

// One doc-shaped controller. localKey = the data.* list name; remoteTable =
// the 0077 table. The whole local item rides in `doc`; `slug` carries the
// stable local id so initialSync can dedup and re-uploads stay idempotent.
export function createDocTableSync({ localKey, remoteTable }) {
  return createTableSync({
    localKey,
    remoteTable,
    toRow(item, { tenantId, userId }) {
      return {
        instance_id: tenantId,
        created_by: userId,
        slug: item?.id || `${localKey}-${Date.now()}`,
        doc: item ?? {},
      };
    },
    fromRow(row) {
      const doc = row?.doc && typeof row.doc === 'object' ? row.doc : {};
      return {
        ...doc,
        id: doc.id || row.slug,
        remoteUuid: row.id,
      };
    },
    idOf(item) {
      return item?.id;
    },
  });
}

// The wholesale-replace patch for updateRow: the doc column is the record, so
// an update pushes the whole updated item (no per-field column mapping to
// drift out of sync — every local field always lands).
export function docPatch(item) {
  return { doc: item ?? {} };
}

// ---- the five 0077 controllers -------------------------------------------
// Games hub saves — a game started on the phone resumes on the family PC.
export const gameSavesSync = createDocTableSync({ localKey: 'gameSaves', remoteTable: 'game_saves' });
// Books · Subscriptions audit — the recurring-purchase list is family money
// state; it belongs to the family instance, not one device.
export const subscriptionsSync = createDocTableSync({ localKey: 'subscriptions', remoteTable: 'family_subscriptions' });
// Dev/Ops skill profiles — the opportunity matcher's inputs follow the family.
export const skillProfilesSync = createDocTableSync({ localKey: 'skillProfiles', remoteTable: 'skill_profiles' });
// Church Home prayer requests — a request logged on one phone is visible to
// the household (the surface's copy already implies the office sees it).
export const prayerRequestsSync = createDocTableSync({ localKey: 'prayerRequests', remoteTable: 'prayer_requests' });
// One Voice notes — spoken/typed voice notes routed to the church surfaces.
export const churchVoiceSync = createDocTableSync({ localKey: 'churchVoice', remoteTable: 'church_voice' });
// Steward giving records — cash gifts + bulk-imported giving (Givelify/Zelle/
// Cash App/PayPal/check), the one ledger behind the transparent monthly report.
// Steward-only by RLS (owner/admin); the doc carries the normalized gift
// (lib/giving-records.js). Migration 0096-giving-records-rail.sql.
export const givingRecordsSync = createDocTableSync({ localKey: 'givingRecords', remoteTable: 'giving_records' });
