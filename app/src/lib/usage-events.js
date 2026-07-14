// =============================================================================
// usage-events — measure how the app is used, to make it better (Darrell
// 2026-07-04: "we have to know number of users... most used tab etc"). Sovereign
// (family NAS), governor-aggregate only, each person owns + can delete their own
// trail (migration 0073). DATA-TO-SERVE, not extract.
//
// recordView  — fire-and-forget on a tab open; never blocks or throws into the
//               render (fail-soft); signed-out is a no-op (nothing to attribute).
// fetchUsageFlow — the governor's AGGREGATE (poe-family gate lives in the RPC);
//               null when signed out / unreachable / not authorized so the
//               surface degrades gracefully (DR-0076 honest fallback).
// topViews    — PURE shape of the most-used list for the surface (node-testable).
// =============================================================================
import { supabase } from './supabase.js';
import { withTimeout, SNAPSHOT_TIMEOUT_MS } from './access-metrics-sync.js';

export async function recordView(name) {
  const v = String(name || '').trim();
  if (!v) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return false;
    const { error } = await supabase.from('usage_events').insert({ kind: 'view', name: v });
    return !error;
  } catch { return false; }
}

export async function fetchUsageFlow(days = 30) {
  try {
    // Time-box getSession + the RPC so a resumed-tab stall can't hang the
    // WHAT'S-USED tab on "Loading…" forever (DR-0076, same guard as the snapshot).
    const sessionRes = await withTimeout(supabase.auth.getSession(), SNAPSHOT_TIMEOUT_MS, null);
    if (!sessionRes || !sessionRes.data || !sessionRes.data.session) return null;
    const { data: flow, error } = await withTimeout(
      supabase.rpc('usage_flow_metrics', { days_in: days }),
      SNAPSHOT_TIMEOUT_MS,
      { data: null, error: { message: 'usage_flow_metrics-timeout', timedOut: true } },
    );
    if (error) { console.warn('[usage-events] flow fetch failed:', error); return null; }
    return flow || null;
  } catch (err) { console.warn('[usage-events] flow fetch failed:', err); return null; }
}

// The most-used tabs, biggest first, capped. Pure over the RPC's aggregate rows.
export function topViews(flow, limit = 15) {
  const rows = flow && Array.isArray(flow.views) ? flow.views : [];
  return rows
    .filter((r) => r && typeof r.name === 'string')
    .map((r) => ({ name: r.name, count: Number(r.count) || 0, users: Number(r.users) || 0 }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
    .slice(0, Math.max(0, limit));
}

// A tiny share-of-total for a bar width (0..1). Pure.
export function viewShare(row, flow) {
  const total = flow && Number(flow.total_views) ? Number(flow.total_views) : 0;
  if (!total || !row) return 0;
  return Math.max(0, Math.min(1, (Number(row.count) || 0) / total));
}
