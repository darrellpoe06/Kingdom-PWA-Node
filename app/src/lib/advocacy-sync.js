// =============================================================================
// advocacy-sync — cross-device sync for the Advocacy Case Manager (0132)
// =============================================================================
// The AdvocacyCases surface owns its data lifecycle (monolith frozen, DR-0078).
// One flat table carries BOTH kinds — a `case` header row and its dated `entry`
// rows — grouped by case_slug, the same grouping-by-slug model board_tasks
// proved (0059). Family-instance scoped: the January 2024 case was parents
// documenting FOR the student, so the family builds the file together.
// All methods no-op signed out — the surface works from localStorage alone and
// sync resumes on sign-in (local-first, table-sync contract).
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export const advocacySync = createTableSync({
  localKey: 'advocacyRecords',
  remoteTable: 'advocacy_records',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      slug: item.id,
      kind: item.kind === 'case' ? 'case' : 'entry',
      case_slug: item.caseSlug ?? '',
      title: item.title ?? null,
      student: item.student ?? null,
      institution: item.institution ?? null,
      ask: item.ask ?? null,
      status: item.status ?? null,
      ladder_step: item.ladderStep ?? null,
      entry_type: item.entryType ?? null,
      evidence_tier: item.evidenceTier ?? null,
      occurred_at: item.occurredAt || null,
      parties: item.parties ?? null,
      summary: item.summary ?? null,
      their_words: item.theirWords ?? null,
      follow_up: item.followUp ?? null,
    };
  },

  fromRow(row) {
    return {
      id: row.slug ?? `ar-remote-${row.id}`,
      remoteUuid: row.id,
      kind: row.kind === 'case' ? 'case' : 'entry',
      caseSlug: row.case_slug,
      title: row.title ?? '',
      student: row.student ?? '',
      institution: row.institution ?? '',
      ask: row.ask ?? '',
      status: row.status ?? 'documenting',
      ladderStep: row.ladder_step ?? 'direct',
      entryType: row.entry_type ?? 'incident',
      evidenceTier: row.evidence_tier ?? 'our-witness',
      occurredAt: row.occurred_at ?? null,
      parties: row.parties ?? '',
      summary: row.summary ?? '',
      theirWords: row.their_words ?? '',
      followUp: row.follow_up ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});

// Merge a fresh cloud list with the current local list, preserving any
// locally-created record whose INSERT hasn't landed yet — the same data-loss
// guard the other syncs use.
export function mergeRemoteAdvocacy(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
