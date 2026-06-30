// =============================================================================
// family-messaging-sync.js — persistence for in-app family messaging (0057)
// =============================================================================
// Thin, FAIL-SOFT adapter over the family_messages + family_member_profiles
// tables. The pure rules live in family-messaging.js; RLS (migration 0057) does
// the real gating — sender/recipient/guardian scope on read, sender = auth.uid()
// on insert, recipient must be in the same instance. This layer trusts nothing of
// its own; it shuttles rows and degrades to empty/not-saved on any error.
// =============================================================================
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';
import { composeFamilyMessage, decideFamilySend } from './family-messaging.js';

const ok = (data) => ({ ok: true, data });
const fail = (error) => ({ ok: false, error: String(error && error.message ? error.message : error), data: null });

async function currentUserId() {
  try { return (await supabase.auth.getUser()).data?.user?.id || null; } catch { return null; }
}

// --- roster (family members + minor tiers) ----------------------------------

export async function loadFamilyRoster() {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    const { data, error } = await supabase
      .from('family_member_profiles')
      .select('*')
      .eq('instance_id', instanceId)
      .order('display_name', { ascending: true });
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

// Guardian-only (RLS enforces): provision/refresh a child member + tier.
export async function provisionChild({ persona, displayName, minorTier = 'under13', childUserId = null }) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return fail('not signed in');
    const { data, error } = await supabase.rpc('provision_child_member', {
      p_instance: instanceId,
      p_persona: persona,
      p_display_name: displayName,
      p_minor_tier: minorTier,
      p_child_user_id: childUserId,
    });
    if (error) return fail(error);
    return ok(data || null);
  } catch (e) { return fail(e); }
}

// --- messages ---------------------------------------------------------------

// Load the messages the signed-in user is allowed to see (RLS already scopes to
// sender/recipient/guardian). Optional recipient/sender filters for a thread view.
export async function loadFamilyMessages({ withUserId = null } = {}) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    const { data, error } = await supabase
      .from('family_messages')
      .select('*')
      .eq('instance_id', instanceId)
      .order('sent_at', { ascending: true });
    if (error) return fail(error);
    let rows = data || [];
    if (withUserId) {
      rows = rows.filter((m) => m.sender_user_id === withUserId || m.recipient_user_id === withUserId);
    }
    return ok(rows);
  } catch (e) { return fail(e); }
}

// Send a family message. `gate` is the decideFamilySend() result the caller
// already computed (so the UI can show approval state); we set requires_guardian_ok
// from it and refuse a denied send. The sender is always the signed-in user.
export async function sendFamilyMessage({
  recipientUserId = null,
  recipientPersona = null,
  body,
  kind = 'message',
  context = null,
  senderPersona = null,
  gate = null,
}) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return fail('not signed in');
    const senderUserId = await currentUserId();
    if (!senderUserId) return fail('not signed in');

    const decision = gate || decideFamilySend({ senderRole: 'member' });
    if (!decision.allowed && !decision.requiresApproval) {
      return fail(decision.reason || 'not allowed to send this message');
    }

    const row = composeFamilyMessage({
      senderUserId,
      senderPersona,
      recipientUserId,
      recipientPersona,
      body,
      kind,
      context,
      requiresGuardianOk: !!decision.requiresApproval,
    });
    const { data, error } = await supabase
      .from('family_messages')
      .insert({ ...row, instance_id: instanceId })
      .select();
    if (error) return fail(error);
    return ok((data && data[0]) || null);
  } catch (e) { return fail(e); }
}

// Recipient marks a message read (RLS: only the recipient can patch their row).
export async function markMessageRead(id) {
  try {
    const { data, error } = await supabase
      .from('family_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) return fail(error);
    return ok((data && data[0]) || null);
  } catch (e) { return fail(e); }
}
