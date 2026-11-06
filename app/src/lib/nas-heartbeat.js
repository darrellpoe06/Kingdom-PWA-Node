// =============================================================================
// nas-heartbeat — the house's own witness, read where the work is (DR-1354)
// =============================================================================
// Darrell, 2026-11-06: "Why would I willingly want to depend on other systems...
// that can and do fail." Measured that day: the runner's tailnet key died on
// 2026-11-04 and every probe of the NAS died with it, because each probe ran
// on the same key as the work it watched. Nobody knew for two days.
//
// This is the witness that does not share the road. The NAS writes ONE row per
// clock cycle into agent_inbox (the table it already writes lesson transcripts
// to), tagged `nas-heartbeat`, from its own machine on its own 15-minute clock
// (infra/nas-loops/heartbeat.py). The OpsBoard reads the newest such row. A
// dead key, a dead clock or a dead NAS then shows here within two cycles, with
// no GitHub, no runner and no tailnet between the NAS and the reader.
//
// HONEST BY CONSTRUCTION (DR-0076): the age is computed from the row's own
// stamp against the reader's clock; "never" is said when no row exists; an
// unreadable table says unreadable. Nothing is painted.
// =============================================================================

export const HEARTBEAT_TAG = 'nas-heartbeat';
/** The NAS clock is 15 minutes (infra/nas-loops/install-clock.sh). */
export const CLOCK_MIN = 15;
/** Up to two cycles late is the clock's own jitter; past that the house is silent. */
export const LATE_AFTER_MIN = CLOCK_MIN * 2;
export const SILENT_AFTER_MIN = CLOCK_MIN * 4;

/** The stamp the row carries: its body is JSON {at, host, services, cycle}; created_at is the fallback. */
export function stampOf(row) {
  if (!row) return null;
  try {
    const body = typeof row.body === 'string' ? JSON.parse(row.body) : row.body;
    if (body && body.at) {
      const t = Date.parse(body.at);
      if (Number.isFinite(t)) return { at: t, host: body.host || '', services: body.services ?? null, cycle: body.cycle || '' };
    }
  } catch { /* a body that is not JSON falls back to created_at */ }
  const t = Date.parse(row.created_at || '');
  return Number.isFinite(t) ? { at: t, host: '', services: null, cycle: '' } : null;
}

/**
 * @returns {{state:'alive'|'late'|'silent'|'never'|'unreadable', ageMin:number|null, label:string, kpi:string, stamp:object|null}}
 */
export function heartbeatStatus(row, { now = Date.now(), reason = '' } = {}) {
  if (reason) return { state: 'unreadable', ageMin: null, label: `NAS heartbeat unreadable: ${reason}`, kpi: 'attention', stamp: null };
  const stamp = stampOf(row);
  if (!stamp) return { state: 'never', ageMin: null, label: 'NAS never seen: no heartbeat row yet', kpi: 'attention', stamp: null };
  const ageMin = Math.max(0, Math.round((now - stamp.at) / 60000));
  if (ageMin <= LATE_AFTER_MIN) return { state: 'alive', ageMin, label: `NAS seen ${ageMin} min ago`, kpi: 'good', stamp };
  if (ageMin <= SILENT_AFTER_MIN) return { state: 'late', ageMin, label: `NAS late: last seen ${ageMin} min ago`, kpi: 'attention', stamp };
  const hours = Math.floor(ageMin / 60);
  const when = hours >= 48 ? `${Math.floor(hours / 24)} days` : hours >= 1 ? `${hours} h` : `${ageMin} min`;
  return { state: 'silent', ageMin, label: `NAS silent: last seen ${when} ago`, kpi: 'problem', stamp };
}

/** The newest heartbeat row, or {row:null, reason} when the table could not be read. */
export async function fetchNasHeartbeat({ supabase } = {}) {
  if (!supabase) return { row: null, reason: 'no database client' };
  try {
    const { data, error } = await supabase
      .from('agent_inbox')
      .select('id, body, tags, created_at')
      .contains('tags', JSON.stringify([HEARTBEAT_TAG]))
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return { row: null, reason: error.message || 'read failed' };
    return { row: Array.isArray(data) && data.length ? data[0] : null, reason: '' };
  } catch (e) {
    return { row: null, reason: String(e && e.message ? e.message : e) };
  }
}
