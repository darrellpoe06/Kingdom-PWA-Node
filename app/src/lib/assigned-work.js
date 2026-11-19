// =============================================================================
// assigned-work — the jobs sent to ME, across every door (DR-1594)
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!?"
//
// Two gaps after the access fix (0337) let a worker read a job sent to them:
//   * the Work tab read ONE door's record (loadDoorRecord of the selected
//     door), so a worker saw a job only if he happened to pick its door; and
//   * nothing told him a job had been sent: the text goes from the
//     landlord's phone only if he presses send.
//
// This file is the core half both fixes share: one RLS-bound read of
// my_assigned_work_orders() (0337: the caller's jobs only, with the door's
// label and street and nothing else of the rental), the open ones, where each
// one is, and the bell's arrivals for them. No SMS is sent from here or
// anywhere; the bell and the phone's own notification are the notice.
// =============================================================================

/**
 * The bell's "seen" event and the kinds My work orders marks seen. The same
 * strings as lib/arrivals.js ARRIVALS_SEEN_EVENT / SCREEN_KINDS (a test pins
 * them equal), held here so the Poe Properties module does not load the
 * bell's whole model just to say "looked at".
 */
export const SEEN_EVENT = 'poetech:arrivals-seen';
export const JOB_KINDS = Object.freeze(['job-new']);

/** The statuses a job is still open in (dispatch-roster.js DISPATCHABLE). */
export const OPEN_JOB_STATUSES = Object.freeze(['submitted', 'received', 'scheduled', 'in-progress']);

/** A read of this many seconds is abandoned: the last list stands. */
export const ASSIGNED_TIMEOUT_MS = 8000;

/**
 * The caller's assigned work orders. Never throws; a failed read is a failure
 * (`ok: false`), never an empty list, and a database without 0337 says so.
 */
export async function loadMyAssignedWork(client, { timeoutMs = ASSIGNED_TIMEOUT_MS } = {}) {
  if (!client || typeof client.rpc !== 'function') return { ok: false, reason: 'no-client' };
  let timer = null;
  try {
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs); });
    const res = await Promise.race([client.rpc('my_assigned_work_orders'), timeout]);
    if (res && res.timedOut) return { ok: false, reason: 'timeout' };
    if (res && res.error) {
      const msg = String(res.error.message || res.error);
      return { ok: false, reason: /my_assigned_work_orders.*does not exist/i.test(msg) ? 'not-enabled-yet' : 'read-failed' };
    }
    return { ok: true, jobs: Array.isArray(res && res.data) ? res.data : [] };
  } catch {
    return { ok: false, reason: 'unexpected' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The open ones, urgent first, then newest. */
export function openAssigned(jobs = []) {
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 };
  return (Array.isArray(jobs) ? jobs : [])
    .filter((j) => j && OPEN_JOB_STATUSES.includes(j.status))
    .sort((a, b) => (rank[a.priority] ?? 2) - (rank[b.priority] ?? 2)
      || String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

/** The id the Poe Properties door is opened with: the tenancy when there is one, else the door. */
export function jobDoorId(job) {
  return (job && (job.tenancy_id || job.rental_id)) || null;
}

/** Where the job is, in words: "805 N Prospect · Apt 2 — 805 North Prospect Ave, Davenport, IA". */
export function jobWhere(job) {
  if (!job) return '';
  const name = [job.door_label, job.unit_label].filter(Boolean).join(' · ');
  const street = [job.address, [job.city, job.state].filter(Boolean).join(', ')].filter(Boolean).join(', ');
  const label = String(job.door_label || '').trim().toLowerCase();
  if (street && (!name || (label && street.toLowerCase().startsWith(label)))) return [street, job.unit_label].filter(Boolean).join(' · ');
  if (name && street) return `${name} — ${street}`;
  return name || 'Address not on file';
}

/** A map link for the street, or '' when there is no street to look up. */
export function jobMapHref(job) {
  const street = [job && job.address, job && job.city, job && job.state, job && job.zip].filter(Boolean).join(', ');
  return street ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(street)}` : '';
}

/**
 * The bell's arrivals: one per OPEN job sent to me. The seen mark is per job,
 * so a job rings once; one that closes leaves the list. `at` is when it was
 * filed, so the newest job sorts first beside the rest of the bell.
 */
export function jobArrivals(jobs = []) {
  return openAssigned(jobs).map((j) => ({
    kind: 'job-new',
    id: `job-new:${j.id}`,
    at: j.created_at || '',
    title: `New job for you: ${String(j.title || '').trim() || 'a work order'}`,
    detail: `${jobWhere(j)}. Opens in Poe Properties.`,
    screen: 'properties-jobs',
    door: jobDoorId(j),
  }));
}

/** Where a tap on a job arrival lands: the Poe Properties door, on My jobs, at that door. */
export function jobLanding(item) {
  if (!item || item.kind !== 'job-new') return null;
  const q = new URLSearchParams({ p: 'jobs' });
  if (item.door) q.set('door', item.door);
  return `/properties/app/?${q.toString()}`;
}
