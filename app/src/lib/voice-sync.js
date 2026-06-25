// =============================================================================
// voice-sync — persist voice ENROLLMENT + CONSENT (the voice_profiles table)
// =============================================================================
// The registry (lib/voice-registry.js) decides what's allowed; this persists the
// real consent state so an enrollment made on one device shows up on another, and
// so the consent record is an auditable row, not a localStorage guess.
//
// SELF-CONSENT is the bright line, enforced two ways:
//   - DB (0047 RLS): INSERT/UPDATE require created_by = auth.uid() — you can only
//     create/move YOUR OWN voice row; you cannot grant consent on someone else's.
//   - App: enrollMyVoice always stamps created_by = the signed-in user and a
//     person_key drawn from that user's own persona, never an arbitrary one.
//
// Pure row<->item mappers are exported for unit tests; the async helpers are thin
// wrappers over the shared supabase client and are null-safe (a signed-out or
// offline caller gets a clear { error } and the UI stays usable locally).
import { supabase } from './supabase.js';
import { CONSENT, ENTITLEMENT, PROVIDER } from './voice-registry.js';

/** voice_profiles row -> registry profile shape (what mergeVoiceCatalog expects). */
export function profileFromRow(row) {
  return {
    remoteId:     row.id,
    instanceId:   row.instance_id,
    createdBy:    row.created_by ?? null,
    personKey:    row.person_key,
    displayName:  row.display_name ?? row.person_key,
    consentState: row.consent_state ?? CONSENT.NONE,
    consentScope: row.consent_scope ?? null,
    consentAt:    row.consent_at ?? null,
    entitlement:  row.entitlement ?? ENTITLEMENT.SUBSCRIBER,
    providerHint: row.provider_hint ?? PROVIDER.SOVEREIGN_CLONE,
    aiLabel:      row.ai_label !== false,
    meta:         row.meta && typeof row.meta === 'object' ? row.meta : {},
  };
}

/** Build the row for an enrollment (self-consent). created_by is the caller. */
export function enrollmentToRow({ instanceId, userId, personKey, displayName, scope }) {
  return {
    instance_id:   instanceId,
    created_by:    userId,
    person_key:    personKey,
    display_name:  displayName || personKey,
    consent_state: CONSENT.GRANTED,
    consent_scope: scope || 'read-aloud-narration',
    consent_at:    new Date().toISOString(),
    entitlement:   ENTITLEMENT.SUBSCRIBER,
    provider_hint: PROVIDER.SOVEREIGN_CLONE,
    ai_label:      true,
  };
}

/** Load all enrolled/invited voice profiles for the caller's instance (RLS-scoped). */
export async function loadVoiceProfiles() {
  if (!supabase) return { profiles: [], error: { message: 'No backend' } };
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return { profiles: [], error };
  return { profiles: (data || []).map(profileFromRow), error: null };
}

/**
 * Enroll the SIGNED-IN person's own voice (grant consent). Upserts on
 * (instance_id, person_key) so re-enrolling is idempotent. The person_key MUST be
 * the caller's own persona — the caller passes it; RLS guarantees created_by = self.
 */
export async function enrollMyVoice({ instanceId, userId, personKey, displayName, scope } = {}) {
  if (!supabase) return { error: { message: 'No backend' } };
  if (!instanceId || !userId || !personKey) {
    return { error: { message: 'Sign in to enroll your voice.' } };
  }
  const row = enrollmentToRow({ instanceId, userId, personKey, displayName, scope });
  const { data, error } = await supabase
    .from('voice_profiles')
    .upsert(row, { onConflict: 'instance_id,person_key' })
    .select()
    .maybeSingle();
  if (error) return { error };
  return { profile: data ? profileFromRow(data) : null, error: null };
}

/** Withdraw consent for your own voice (revoke). Only the row's creator may do this (RLS). */
export async function revokeMyVoice(remoteId) {
  if (!supabase) return { error: { message: 'No backend' } };
  if (!remoteId) return { error: { message: 'Nothing to withdraw.' } };
  const { error } = await supabase
    .from('voice_profiles')
    .update({ consent_state: CONSENT.REVOKED, consent_at: new Date().toISOString() })
    .eq('id', remoteId);
  return { error: error || null };
}
