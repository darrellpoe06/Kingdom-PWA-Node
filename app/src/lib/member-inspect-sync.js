// =============================================================================
// member-inspect-sync — supabase I/O for member_stewardship (0122)
// =============================================================================
// Thin I/O over the pure rules in member-inspect.js. RLS is the real gate
// (leader-only read/insert); these helpers never widen it, they just carry
// honest {ok, reason} results so the surface can tell the truth on failure.
import supabase from './supabase.js';
import { buildObservation } from './member-inspect.js';

/** All observations for a space, newest first (leader-only via RLS). */
export async function loadObservations(instanceId) {
  if (!instanceId) return { ok: false, reason: 'no-instance', rows: [] };
  const { data, error } = await supabase
    .from('member_stewardship')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return { ok: false, reason: error.message, rows: [] };
  return { ok: true, reason: '', rows: data || [] };
}

/** Record one observation. Validates via the pure builder before any I/O. */
export async function addObservation(fields) {
  const built = buildObservation(fields);
  if (!built.ok) return { ok: false, reason: built.problems.join(','), row: null };
  const { data, error } = await supabase
    .from('member_stewardship')
    .insert(built.row)
    .select()
    .single();
  if (error) return { ok: false, reason: error.message, row: null };
  return { ok: true, reason: '', row: data };
}
