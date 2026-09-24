// =============================================================================
// decision-readouts — the board's daily record of what it saw, and the trend
// read back from it (DR-0612, Phase 1 of the Decision Intelligence Layer)
// =============================================================================
// One row per instance per day in `decision_readouts` (migration 0230): the
// seven readout counts and how many rows of each kind were read. Written when
// a governor opens the board (upsert on instance + day), read back to show
// "was N on <day>" beside each panel. A day nobody opened the board has no
// row, and the trend says which day it compares against (DR-0076).
// The pure parts (todayIso, trendFor) take their inputs as arguments; the I/O
// takes the Supabase client as an argument, so every path is proven in tests.
// =============================================================================

export const READOUT_KEYS = Object.freeze(['risks', 'dependencies', 'ownershipGaps', 'escalations', 'patterns', 'timelineThreats', 'decisionsRequired']);

export function todayIso(nowMs) {
  const d = new Date(Number.isFinite(nowMs) ? nowMs : 0);
  return d.toISOString().slice(0, 10);
}

/**
 * The comparison for one readout: the most recent recorded day BEFORE today.
 * { prev, prevDay, delta } or null when no earlier day was recorded.
 */
export function trendFor(key, rows, today, current) {
  const earlier = (rows || [])
    .filter((r) => r && r.day && r.day < today && r.counts && Number.isFinite(Number(r.counts[key])))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
  if (!earlier.length) return null;
  const prev = Number(earlier[0].counts[key]);
  return { prev, prevDay: earlier[0].day, delta: Number.isFinite(current) ? current - prev : null };
}

/** Record today's counts for the caller's instance. { ok, reason }. */
export async function recordReadout({ supabase, getInstanceId, counts, read, nowMs = Date.now() }) {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id || null;
    if (!uid) return { ok: false, reason: 'signed-out' };
    const instanceId = await getInstanceId();
    const row = {
      instance_id: instanceId,
      day: todayIso(nowMs),
      counts: Object.fromEntries(READOUT_KEYS.map((k) => [k, Number(counts?.[k]) || 0])),
      read: read || {},
      created_by: uid,
      updated_at: new Date(nowMs).toISOString(),
    };
    const { error } = await supabase.from('decision_readouts').upsert(row, { onConflict: 'instance_id,day' });
    return error ? { ok: false, reason: error.message } : { ok: true, reason: '' };
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}

/** The last `limit` recorded days for the caller's instance, newest first. { ok, rows, reason }. */
export async function fetchReadouts({ supabase, getInstanceId, limit = 60 }) {
  try {
    const instanceId = await getInstanceId();
    const { data, error } = await supabase
      .from('decision_readouts')
      .select('day, counts, read')
      .eq('instance_id', instanceId)
      .order('day', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, rows: [], reason: error.message };
    return { ok: true, rows: data || [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e?.message || 'unknown' };
  }
}
