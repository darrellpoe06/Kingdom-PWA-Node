// =============================================================================
// ceu-sync — cross-device sync for logged continuing-education (CE/CEU) activities
// =============================================================================
// A CE entry is one logged continuing-education activity a licensed social worker
// completes toward renewing the license. This wrapper pools those on the family/
// practice instance so a CE record logged on one device shows up everywhere the
// licensee signs in. Flat-table wholesale pattern (like forecast/incidents): every
// local field maps to a column. See migration 0055-practice-ceu-renewal.sql.
//
// The state CE RULESET (required hours, mandated topics) is NOT synced — it lives in
// lib/ceu-tracker.js as configurable app data. Only the licensee's own entries sync;
// progress is derived client-side. Local-first: a no-op when signed out.
import { createTableSync } from './table-sync.js';

// The full column set for one CE entry. Mirrors makeCeEntry's shape.
export function ceuColumns(item) {
  return {
    slug:            item.id,
    learner_email:   item.learnerEmail || '',
    state:           item.state || 'IL',
    credential:      item.credential || '',
    ce_date:         item.date || null,
    hours:           Number(item.hours) || 0,
    topic:           item.topic || 'general',
    title:           item.title || '',
    provider:        item.provider || '',
    approval_number: item.approvalNumber || '',
    note:            item.note || '',
  };
}

export const ceuSync = createTableSync({
  localKey: 'practiceCeus',
  remoteTable: 'practice_ceu_entries',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      ...ceuColumns(item),
    };
  },

  fromRow(row) {
    return {
      id:             row.slug || `ce-remote-${row.id}`,
      remoteUuid:     row.id,
      learnerEmail:   row.learner_email || '',
      state:          row.state || 'IL',
      credential:     row.credential || '',
      date:           row.ce_date || null,
      hours:          Number(row.hours) || 0,
      topic:          row.topic || 'general',
      title:          row.title || '',
      provider:       row.provider || '',
      approvalNumber: row.approval_number || '',
      note:           row.note || '',
      createdAt:      row.created_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
