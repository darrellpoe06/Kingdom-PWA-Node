// =============================================================================
// practice-leads-sync — cross-device sync for the practice_leads CRM table
// =============================================================================
// A lead captured on Darrell's laptop (a practice that responded to a YouTube
// angle) should show up on Christina's phone without a re-export — the same
// proven table-sync path inquiries / discussions / projects ride. Built on the
// generic createTableSync + unionPreservingLocal helpers.
//
// A practice_lead is the CRM object of the client-acquisition workflow (the
// 4-stage "revenue agent team"). It is PRE-INTAKE / contact-level only — there
// are NO clinical fields here by design (the PHI wall is structural, mirroring
// the Practice inquiry lane). The B2B path (selling TLC Therapy Solutions to
// practices) is not PHI-bound; the patient path stays contact-level only.
//
// Local shape (see lib/client-acquisition.js newLead):
//   { id:'lead-...', audiencePresetKey, name, org, role, contactMethod,
//     contactValue, source, sourceDetail, stage, fitScore, signalTags:[],
//     notes, consent:{outreachOk,capturedAt,note}, nurtureStep, history:[],
//     createdAt, updatedAt }
//
// Remote shape (0045 practice_leads row): jsonb for signal_tags / consent /
// history; flat columns for the rest.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function leadToRow(item, { tenantId, userId }) {
  return {
    instance_id:        tenantId,
    created_by:         userId,
    slug:               item.id,
    audience_preset_key: item.audiencePresetKey ?? 'b2b-practices',
    name:               item.name ?? '',
    org:                item.org ?? null,
    role:               item.role ?? null,
    contact_method:     item.contactMethod ?? 'email',
    contact_value:      item.contactValue ?? null,
    source:             item.source ?? 'other',
    source_detail:      item.sourceDetail ?? null,
    stage:              item.stage ?? 'new',
    fit_score:          item.fitScore == null ? null : item.fitScore,
    signal_tags:        Array.isArray(item.signalTags) ? item.signalTags : [],
    notes:              item.notes ?? null,
    consent:            item.consent && typeof item.consent === 'object' ? item.consent : { outreachOk: false, capturedAt: null, note: '' },
    nurture_step:       item.nurtureStep == null ? 0 : item.nurtureStep,
    history:            Array.isArray(item.history) ? item.history : [],
  };
}

export function leadFromRow(row) {
  return {
    id:                row.slug ?? `lead-remote-${row.id}`,
    remoteUuid:        row.id,
    tenantId:          row.instance_id,
    createdBy:         row.created_by ?? null,
    audiencePresetKey: row.audience_preset_key ?? 'b2b-practices',
    name:              row.name ?? '',
    org:               row.org ?? '',
    role:              row.role ?? '',
    contactMethod:     row.contact_method ?? 'email',
    contactValue:      row.contact_value ?? '',
    source:            row.source ?? 'other',
    sourceDetail:      row.source_detail ?? '',
    stage:             row.stage ?? 'new',
    fitScore:          row.fit_score == null ? null : row.fit_score,
    signalTags:        Array.isArray(row.signal_tags) ? row.signal_tags : [],
    notes:             row.notes ?? '',
    consent:           row.consent && typeof row.consent === 'object' ? row.consent : { outreachOk: false, capturedAt: null, note: '' },
    nurtureStep:       row.nurture_step == null ? 0 : row.nurture_step,
    history:           Array.isArray(row.history) ? row.history : [],
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

export const practiceLeadsSync = createTableSync({
  localKey: 'practiceLeads',
  remoteTable: 'practice_leads',
  toRow: leadToRow,
  fromRow: leadFromRow,
  idOf: (item) => item.id,
});

// Local field -> column map for the monolith's updateLead patch builder (mirrors
// DISCUSSION_COLUMN_OF). Only editable columns; instance_id / created_by never patch.
export const LEAD_COLUMN_OF = {
  audiencePresetKey: 'audience_preset_key',
  name:          'name',
  org:           'org',
  role:          'role',
  contactMethod: 'contact_method',
  contactValue:  'contact_value',
  source:        'source',
  sourceDetail:  'source_detail',
  stage:         'stage',
  fitScore:      'fit_score',
  signalTags:    'signal_tags',
  notes:         'notes',
  consent:       'consent',
  nurtureStep:   'nurture_step',
  history:       'history',
};

// Field-preserving merge for a realtime refetch (same contract as
// mergeRemoteDiscussions): cloud is authoritative for synced rows; keep any
// never-uploaded local-only lead (non-UUID id) so an offline capture isn't dropped.
export function mergeRemoteLeads(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
