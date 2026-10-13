// =============================================================================
// usage-calendar-sync — the governor's read of usage_calendar_metrics (0259)
// =============================================================================
// The same road fetchUsageFlow takes: the persisted session's token and a
// direct, bounded REST RPC, so a wedged tab cannot hang the surface. Null when
// signed out, unreachable or refused (the poe-family gate), so the surface
// says so instead of painting zeros.
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';

export async function fetchUsageCalendar(days = 90) {
  try {
    const token = readSnapshotToken();
    if (!token) return null;
    const { data, error } = await restRpc('usage_calendar_metrics', { days_in: days }, token);
    if (error) { console.warn('[usage-calendar] fetch failed:', error); return null; }
    return Array.isArray(data) ? data : [];
  } catch (err) { console.warn('[usage-calendar] fetch failed:', err); return null; }
}
