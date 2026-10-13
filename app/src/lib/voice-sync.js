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

// ANYONE SIGNED IN MAY ENROL THEIR OWN VOICE (Darrell, 2026-09-22: "fix the
// recorder so anyone signed in can enroll").
//
// WHAT WAS WRONG. Migration 0047's insert policy already says the right thing:
// any member of the instance may create a voice row, and only for themselves
// (created_by = auth.uid()). The DATABASE had the doctrine right. The APP then
// narrowed it to a three-name hardcoded map -- so of the 20 email accounts and
// 9 phone-PIN accounts on the sovereign database, exactly two could reach a
// Record button, and everyone else opened the Voice tab to find no recorder
// rendered at all. The wall was in the wrong layer, and it was tighter than the
// rule it was supposedly enforcing.
//
// These two helpers are the fix's whole substance and they are PURE, so who
// gets a key and what they are called is decided in a test rather than inside a
// component: a named persona keeps its stable key, and everybody else gets a
// key derived from their own auth id.

/**
 * The person_key to enrol under. A known persona keeps its historical key
 * ('darrell', 'christina') so an existing enrolment is never orphaned; anyone
 * else is keyed by their own auth user id, which is stable across devices and
 * unique per person -- the two properties the (instance_id, person_key) unique
 * index actually needs. Returns '' when there is nobody to key, which the
 * caller treats as "not signed in" rather than inventing an identity.
 */
export function personKeyFor({ personaKey = null, userId = null } = {}) {
  if (personaKey && String(personaKey).trim()) return String(personaKey).trim();
  if (userId && String(userId).trim()) return `user:${String(userId).trim()}`;
  return '';
}

/**
 * What to call this voice in a list other members of the instance can see.
 * A known persona keeps its full name. Otherwise: the name the person gave
 * their own account, then the email local-part, then a neutral fallback -- and
 * NEVER the raw email, because voice_profiles is readable by every member of
 * the instance and an address is not a display name.
 */
export function displayNameFor({ personaKey = null, personaNames = {}, user = null } = {}) {
  if (personaKey && personaNames[personaKey]) return personaNames[personaKey];
  const meta = (user && user.user_metadata) || {};
  const given = meta.full_name || meta.name || meta.display_name;
  if (given && String(given).trim()) return String(given).trim();
  const email = String((user && user.email) || '');
  const local = email.includes('@') ? email.split('@')[0] : '';
  // A phone-door account's local part is a phone number. Never show it.
  if (local && !/^\+?\d{7,}$/.test(local)) return local;
  return 'My voice';
}

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
/**
 * Enrol the SIGNED-IN person's own LIKENESS (DR-0430): the consent stamp rides
 * the same voice_profiles row (meta.likeness_consent_at), upserted on
 * (instance_id, person_key) so it is idempotent and RLS keeps it self-only.
 * The portrait itself stays on the device (likeness-reference.js); this is
 * the auditable record that they said yes.
 */
export async function enrollMyLikeness({ instanceId, userId, personKey, displayName } = {}) {
  if (!supabase) return { error: { message: 'No backend' } };
  if (!instanceId || !userId || !personKey) return { error: { message: 'Sign in to enroll your likeness.' } };
  const { data: existing } = await supabase.from('voice_profiles').select('meta, consent_scope').eq('instance_id', instanceId).eq('person_key', personKey).maybeSingle();
  const meta = { ...((existing && existing.meta) || {}), likeness_consent_at: new Date().toISOString(), likeness_scope: 'lesson-teacher' };
  const row = { ...enrollmentToRow({ instanceId, userId, personKey, displayName, scope: (existing && existing.consent_scope) || 'read-aloud-narration' }), meta };
  const { data, error } = await supabase.from('voice_profiles').upsert(row, { onConflict: 'instance_id,person_key' }).select().maybeSingle();
  if (error) return { error };
  return { profile: data ? profileFromRow(data) : null, error: null };
}

/** Withdraw the likeness consent only (the voice row stays as it was). */
export async function revokeMyLikeness(remoteId, meta = {}) {
  if (!supabase) return { error: { message: 'No backend' } };
  if (!remoteId) return { error: { message: 'Nothing to withdraw.' } };
  const next = { ...(meta || {}) }; delete next.likeness_consent_at; delete next.likeness_scope;
  const { error } = await supabase.from('voice_profiles').update({ meta: { ...next, likeness_revoked_at: new Date().toISOString() } }).eq('id', remoteId);
  return { error: error || null };
}

export async function revokeMyVoice(remoteId) {
  if (!supabase) return { error: { message: 'No backend' } };
  if (!remoteId) return { error: { message: 'Nothing to withdraw.' } };
  const { error } = await supabase
    .from('voice_profiles')
    .update({ consent_state: CONSENT.REVOKED, consent_at: new Date().toISOString() })
    .eq('id', remoteId);
  return { error: error || null };
}
