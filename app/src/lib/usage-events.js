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
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';

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
    // Token from the persisted session (no navigator.locks) + a direct-REST RPC, so
    // a wedged PoeTech tab holding the client's cross-tab lock can't hang the
    // WHAT'S-USED tab on "Loading…" (Darrell 2026-07-22; DR-0076). restRpc is
    // AbortController-bounded, so this always resolves.
    const token = readSnapshotToken();
    if (!token) return null;
    const { data: flow, error } = await restRpc('usage_flow_metrics', { days_in: days }, token);
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
