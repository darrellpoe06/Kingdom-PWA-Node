// =============================================================================
// agent-inbox-sync — sovereign relay for a spoken thought/directive (DR-0218)
// =============================================================================
// The sovereign replacement for the retired n8n thought webhook: a
// directive spoken into the Thinking Space now persists to the RLS-scoped
// agent_inbox table (migration 0127, isolation-proven), scoped to the caller's
// instance via the shared join_default_instance resolver. The sovereign box
// polls this table server-side (service_role) — the DR-0132 outbound-poll bus,
// never an inbound webhook. Best-effort + honest: signed-out returns not-ok and
// the local record stands (exactly the old anonymous-visitor behavior).
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';

/** Relay one thought/directive into the agent inbox. {ok, reason, id}. */
export async function relayThought({ body, tags = [], source = 'thinking-space', directiveId = null }) {
  if (!body || !String(body).trim()) return { ok: false, reason: 'empty-body', id: null };
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id || null;
  if (!uid) return { ok: false, reason: 'signed-out', id: null };
  let instanceId;
  try { instanceId = await getInstanceId(); } catch (e) { return { ok: false, reason: e.message, id: null }; }
  const { data, error } = await supabase
    .from('agent_inbox')
    .insert({ instance_id: instanceId, body: String(body), tags, source, directive_id: directiveId, created_by: uid })
    .select('id')
    .single();
  if (error) return { ok: false, reason: error.message, id: null };
  return { ok: true, reason: '', id: data?.id || null };
}
