// =============================================================================
// crm-sync — cross-device sync for the shared CRM backbone (crm_leads)
// =============================================================================
// Mirrors inquiries-sync / discussions-sync. A lead captured or moved on one
// device shows up on another, scoped by the same instance-membership RLS that
// protects every other domain row. The pure model is lib/crm-engine.js; this is
// the persistence adapter (toRow / fromRow) over createTableSync, plus a small
// helper to append a touchpoint to crm_activities.
//
// PII / no-PHI: a lead row carries contact-level data only (the table has no
// clinical or payment columns by design — see 0046-crm-backbone-leads.sql). This
// sync therefore stays inside the standard instance-scoped RLS; no special
// encryption at this layer.
// =============================================================================
import supabase from './supabase.js';
import { createTableSync } from './table-sync.js';
import { newLead, attributeSource } from './crm-engine.js';

// Pure mappers — exported so a test can pin the round-trip without a live DB.
export function toCrmLeadRow(item, { tenantId, userId } = {}) {
  return {
    instance_id:    tenantId ?? null,
    created_by:     userId ?? null,
    slug:           item.id ?? null,
    business:       item.business ?? 'tlc',
    pipeline:       item.pipeline ?? 'tlc-client-intake',
    stage:          item.stage ?? 'new',
    name:           item.name ?? '',
    org:            item.org ?? null,
    role:           item.role ?? null,
    contact_method: item.contactMethod ?? 'email',
    contact_value:  item.contactValue ?? null,
    source:         attributeSource(item.source),
    source_detail:  item.sourceDetail ?? null,
    fit_score:      item.fitScore == null ? null : item.fitScore,
    signal_tags:    Array.isArray(item.signalTags) ? item.signalTags : [],
    notes:          item.notes ?? null,
    consent:        item.consent ?? { outreachOk: false, channels: [], capturedAt: null, note: '' },
    nurture_step:   item.nurtureStep == null ? 0 : item.nurtureStep,
    sequence_key:   item.sequenceKey ?? null,
    owner_user_id:  item.ownerUserId ?? null,
    seed:           item.seed === true,
    links:          item.links ?? {},
    history:        Array.isArray(item.history) ? item.history : [],
  };
}

// Re-hydrate a row into the engine's canonical lead shape so the surface and the
// pure helpers see one consistent object regardless of origin.
export function fromCrmLeadRow(row) {
  return { ...newLead({
    id:            row.slug ?? `lead-remote-${row.id}`,
    business:      row.business,
    pipeline:      row.pipeline,
    stage:         row.stage,
    name:          row.name,
    org:           row.org,
    role:          row.role,
    contactMethod: row.contact_method,
    contactValue:  row.contact_value,
    source:        row.source,
    sourceDetail:  row.source_detail,
    fitScore:      row.fit_score,
    signalTags:    Array.isArray(row.signal_tags) ? row.signal_tags : [],
    notes:         row.notes,
    consent:       row.consent,
    nurtureStep:   row.nurture_step,
    sequenceKey:   row.sequence_key,
    ownerUserId:   row.owner_user_id,
    seed:          row.seed === true,
    links:         row.links,
    history:       Array.isArray(row.history) ? row.history : [],
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  }), remoteUuid: row.id }; // remoteUuid = the DB uuid, needed to target updates/deletes
}

export const crmLeadsSync = createTableSync({
  localKey: 'crmLeads',
  remoteTable: 'crm_leads',
  toRow: toCrmLeadRow,
  fromRow: fromCrmLeadRow,
  idOf: (item) => item.id, // the local slug; dedup at initialSync time
});

// -----------------------------------------------------------------------------
// addActivity — append a touchpoint to a lead's activity trail. Best-effort
// (no-op + structured skip when signed out), same posture as engagement-sync.
// `leadRemoteId` is the crm_leads.id (uuid). Drafts are stored with kind
// 'outreach-draft'; a human marking one sent stores 'outreach-sent'. The engine
// NEVER sends — this only records what a human did.
// -----------------------------------------------------------------------------
export async function addActivity({ leadRemoteId, kind = 'note', channel = null, direction = null, summary = '', body = '', meta = {} } = {}) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess?.session) return { skipped: 'signed-out' };
  if (!leadRemoteId) return { skipped: 'no-lead' };

  // Resolve the lead's instance so the activity is correctly tenant-scoped.
  const { data: lead, error: leadErr } = await supabase
    .from('crm_leads').select('instance_id').eq('id', leadRemoteId).single();
  if (leadErr || !lead) return { skipped: 'lead-not-found', error: leadErr };

  const row = {
    instance_id: lead.instance_id,
    lead_id:     leadRemoteId,
    created_by:  sess.session.user.id,
    slug:        `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind, channel, direction,
    summary: summary || null,
    body: body || null,
    meta: meta || {},
    at: new Date().toISOString(),
  };
  const { error } = await supabase.from('crm_activities').insert(row);
  if (error) {
    console.warn('[crm-sync] activity insert failed:', error);
    return { skipped: 'insert-error', error };
  }
  return { added: true };
}

// fetchActivities — the touchpoint trail for one lead, newest-first.
export async function fetchActivities(leadRemoteId) {
  if (!leadRemoteId) return [];
  const { data, error } = await supabase
    .from('crm_activities').select('*').eq('lead_id', leadRemoteId).order('at', { ascending: false });
  if (error) { console.warn('[crm-sync] activity fetch failed:', error); return []; }
  return data || [];
}

// captureLead — the API seam wrapper. Calls the SECURITY DEFINER crm_capture_lead
// RPC so a form / inbound channel lands a forced-safe lead (first stage, explicit-
// only consent, pinned instance). Returns the new lead id, or a structured skip.
export async function captureLead(pipeline, instanceSlug, payload = {}) {
  const { data, error } = await supabase.rpc('crm_capture_lead', {
    p_pipeline: pipeline,
    p_instance_slug: instanceSlug,
    p_payload: payload,
  });
  if (error) { console.warn('[crm-sync] capture failed:', error); return { skipped: 'capture-error', error }; }
  return { captured: true, id: data };
}
