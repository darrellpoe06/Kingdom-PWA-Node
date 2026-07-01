// =============================================================================
// reactions-sync — Supabase wiring for the reusable in-app reaction primitive.
// =============================================================================
// Backs content_reactions (migration 0064). CONTENT-AGNOSTIC: the caller passes
// contentType ('sermon' | 'decision' | 'study' | 'song' | 'post' | ...) and the
// resolved instanceId, so the SAME wiring serves every surface (the ONE-primitive
// rule). The pure map/score/reception math lives in reactions.js.
//
// SINGLE-PICK toggle (fixes the buggy double-count heart): read my one row, then
//   * same key   -> delete  (toggle off)
//   * other key  -> update  (switch cleanly)
//   * none       -> insert  (react)
// RLS scopes every write to auth.uid(); the UNIQUE makes it unambiguous.
//
// Every read degrades to empty on error (RLS-deny / un-migrated cloud), so a
// surface shows the palette with no counts rather than throwing.
// =============================================================================
import supabase from './supabase.js';
import { buildReactionMap, isReactionKey } from './reactions.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Aggregate per-item counts via the SECURITY DEFINER RPC (no user id leak).
async function fetchCounts(instanceId, contentType) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('content_reaction_counts', { p_instance: instanceId, p_content_type: contentType });
  if (error) { console.warn('[reactions] counts failed:', error); return []; }
  return (data || []).map((r) => ({ contentId: r.content_id, reactionKey: r.reaction_key, count: Number(r.count) || 0 }));
}

// The caller's OWN picks (RLS own-only) — lights each item's toggle state.
async function fetchMine(instanceId, contentType) {
  if (!instanceId) return [];
  const { data, error } = await supabase
    .from('content_reactions')
    .select('content_id,reaction_key')
    .eq('instance_id', instanceId)
    .eq('content_type', contentType);
  if (error) { console.warn('[reactions] mine failed:', error); return []; }
  return (data || []).map((r) => ({ contentId: r.content_id, reactionKey: r.reaction_key }));
}

// The full per-item reaction map for a surface (counts + my picks). Signed-out ->
// an empty map (palette shows, no counts), never an error.
export async function fetchReactionMap({ instanceId, contentType } = {}) {
  const session = await currentSession();
  if (!session || !instanceId) return {};
  const [counts, mine] = await Promise.all([
    fetchCounts(instanceId, contentType),
    fetchMine(instanceId, contentType),
  ]);
  return buildReactionMap({ counts, mine });
}

// Subscribe: initial load + live recompute whenever content_reactions changes.
// Returns an unsubscribe fn. Signed-out -> delivers an empty map once.
export function subscribeReactions(onMap, { instanceId, contentType } = {}) {
  let cancelled = false;
  let channel = null;
  const refresh = () => { fetchReactionMap({ instanceId, contentType }).then((m) => { if (!cancelled) onMap(m); }); };
  (async () => {
    const session = await currentSession();
    if (cancelled) return;
    if (!session || !instanceId) { onMap({}); return; }
    refresh();
    channel = supabase
      .channel(`content-reactions-${contentType}-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_reactions' }, refresh)
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// Toggle the caller's OWN reaction on one item (single-pick). Fails soft.
export async function toggleReaction({ instanceId, contentType, contentId, reactionKey, displayName } = {}) {
  if (!contentId) return { skipped: 'no-content' };
  if (!isReactionKey(reactionKey)) return { skipped: 'bad-reaction' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  if (!instanceId) return { skipped: 'no-instance' };
  const userId = session.user.id;

  const { data: existing, error: readErr } = await supabase
    .from('content_reactions')
    .select('id,reaction_key')
    .eq('instance_id', instanceId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (readErr) return { skipped: 'read-error', error: readErr };

  if (existing) {
    if (existing.reaction_key === reactionKey) {
      const { error } = await supabase.from('content_reactions').delete().eq('id', existing.id);
      return error ? { skipped: 'delete-error', error } : { removed: true };
    }
    const { error } = await supabase
      .from('content_reactions')
      .update({ reaction_key: reactionKey, display_name: displayName || null })
      .eq('id', existing.id);
    return error ? { skipped: 'update-error', error } : { switched: true, reactionKey };
  }
  const { error } = await supabase.from('content_reactions').insert({
    instance_id: instanceId, content_type: contentType, content_id: contentId,
    user_id: userId, reaction_key: reactionKey, display_name: displayName || null,
  });
  return error ? { skipped: 'insert-error', error } : { added: true, reactionKey };
}

// WHO reacted on one item (reaction_key + display_name), instance-member gated by
// the RPC. Returns [] for a non-member or on error. Used by the "tap shows who"
// affordance (community-default visibility).
export async function fetchReactors({ instanceId, contentType, contentId } = {}) {
  if (!instanceId || !contentId) return [];
  const { data, error } = await supabase.rpc('content_reactors', {
    p_instance: instanceId, p_content_type: contentType, p_content_id: contentId,
  });
  if (error) { console.warn('[reactions] reactors failed:', error); return []; }
  return (data || []).map((r) => ({ reactionKey: r.reaction_key, displayName: r.display_name || 'Someone' }));
}
