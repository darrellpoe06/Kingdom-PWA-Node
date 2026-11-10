// =============================================================================
// lesson-queue-census — what waits in the lesson queue, as the NAS counted it
// =============================================================================
// THE ROAD THIS REPLACES (DR-1360). "What is waiting?" was answered by a runner
// reaching INTO the NAS: join the tailnet, ssh in, run psql. That key expired on
// 2026-11-04 (64 workflows red for two days) and again by 2026-11-10, when the
// reader failed three runs straight and the PRIORITY lane's queue could not be
// read at all — while the queue itself sat on the NAS the whole time.
//
// So the NAS counts its own queue and writes one row (infra/nas-loops/
// lesson-queue-census.py), and this reads it. No tailnet, no runner, no GitHub
// between the count and the reader.
//
// THE COUNT IS NEVER ASSUMED TO BE FRESH (DR-0076). A census is a stamp, and a
// stamp with no clock behind it is a guess. `censusStatus` judges it against the
// services-sync cycle exactly as nas-heartbeat.js does, and an unread or absent
// row reads as `never`/`unreadable` — NEVER as an empty queue. A queue nobody
// could count is not a queue with nothing in it (DR-1186), which is the error
// `inbox-lessons-waiting.yml` was rewritten to stop making.
//
// AND IT CARRIES ITS OWN DEFINITION. The row says which tags it excluded, so a
// reader can tell which question was asked. On 2026-11-10 a census was taken
// with an abbreviated exclusion list and counted rows a person had marked
// not-a-lesson or WITHDRAWN (DR-1142) as work waiting to be built; a count
// whose definition travels with it cannot be misread that way again.
export const CENSUS_TAG = 'lesson-queue-census';

// The services-sync cycle, as nas-heartbeat.js reads it.
export const CLOCK_MIN = 15;
export const LATE_AFTER_MIN = CLOCK_MIN * 2;
export const SILENT_AFTER_MIN = CLOCK_MIN * 4;

// The five exclusions scripts/lesson-inbox-waiting.sql applies. Kept here so
// the reader can say plainly when a row was counted under a DIFFERENT question.
export const EXPECTED_EXCLUDES = Object.freeze([
  'lesson-captured',
  'lesson-building',
  'awaiting-review',
  'not-a-lesson',
  'withdrawn',
]);

const NAME = /^[a-z0-9][a-z0-9-]{0,59}$/;
const counts = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out = {};
  for (const [k, n] of Object.entries(v)) {
    if (NAME.test(k) && Number.isInteger(n) && n >= 0) out[k] = n;
  }
  return out;
};

/** The stamp the row carries: {at, host, total, byRoad, byShape, oldest, excludes}. */
export function censusOf(row) {
  if (!row) return null;
  let body = null;
  try {
    body = typeof row.body === 'string' ? JSON.parse(row.body) : row.body;
  } catch {
    body = null;
  }
  if (!body || typeof body !== 'object') return null;
  const t = Date.parse(body.at || row.created_at || '');
  if (!Number.isFinite(t)) return null;
  const total = Number.isInteger(body.total) && body.total >= 0 ? body.total : null;
  const oldest = typeof body.oldest_waiting === 'string' ? Date.parse(body.oldest_waiting) : NaN;
  return {
    at: t,
    host: typeof body.host === 'string' ? body.host : '',
    total,
    byRoad: counts(body.by_road),
    byShape: counts(body.by_shape),
    oldest: Number.isFinite(oldest) ? oldest : null,
    excludes: Array.isArray(body.excludes) ? body.excludes.filter((x) => typeof x === 'string') : [],
  };
}

/**
 * Whether the row was counted under the question this house means by "waiting".
 * Returns '' when it matches, or a plain sentence naming the difference.
 */
export function definitionDrift(census) {
  if (!census) return '';
  const got = [...census.excludes].sort();
  const want = [...EXPECTED_EXCLUDES].sort();
  if (got.length === want.length && got.every((x, i) => x === want[i])) return '';
  const missing = want.filter((x) => !got.includes(x));
  const extra = got.filter((x) => !want.includes(x));
  const parts = [];
  if (missing.length) parts.push(`did not exclude ${missing.join(', ')}`);
  if (extra.length) parts.push(`also excluded ${extra.join(', ')}`);
  return `counted under a different question: it ${parts.join('; ')}`;
}

/** How long the oldest waiting row has waited, in whole days, or null. */
export function oldestWaitDays(census, now = Date.now()) {
  if (!census || !census.oldest) return null;
  return Math.max(0, Math.floor((now - census.oldest) / 86400000));
}

/**
 * @returns {{state:'fresh'|'late'|'stale'|'never'|'unreadable', ageMin:number|null,
 *   total:number|null, label:string, kpi:string, drift:string, census:object|null}}
 */
export function censusStatus(row, { now = Date.now(), reason = '' } = {}) {
  if (reason) {
    return { state: 'unreadable', ageMin: null, total: null, label: `Lesson queue unreadable: ${reason}`, kpi: 'attention', drift: '', census: null };
  }
  const census = censusOf(row);
  if (!census) {
    // NOT "nothing is waiting": nobody has counted (DR-1186).
    return { state: 'never', ageMin: null, total: null, label: 'Lesson queue never counted: the NAS has written no census yet', kpi: 'attention', drift: '', census: null };
  }
  const ageMin = Math.max(0, Math.round((now - census.at) / 60000));
  const drift = definitionDrift(census);
  const n = census.total;
  const waiting = n === null ? 'an unstated number of' : String(n);
  const days = oldestWaitDays(census, now);
  const oldestPart = days === null ? '' : `, oldest waiting ${days} day${days === 1 ? '' : 's'}`;
  if (ageMin <= LATE_AFTER_MIN) {
    const kpi = n === 0 ? 'good' : 'attention';
    return { state: 'fresh', ageMin, total: n, label: `${waiting} lesson row(s) waiting${oldestPart}, counted ${ageMin} min ago`, kpi, drift, census };
  }
  if (ageMin <= SILENT_AFTER_MIN) {
    return { state: 'late', ageMin, total: n, label: `Lesson queue count is late: ${waiting} waiting as of ${ageMin} min ago`, kpi: 'attention', drift, census };
  }
  const hours = Math.floor(ageMin / 60);
  const when = hours >= 48 ? `${Math.floor(hours / 24)} days` : hours >= 1 ? `${hours} h` : `${ageMin} min`;
  return { state: 'stale', ageMin, total: n, label: `Lesson queue count is stale: last counted ${when} ago`, kpi: 'problem', drift, census };
}

/** The newest census row, or {row:null, reason} when the table could not be read. */
export async function fetchLessonQueueCensus({ supabase } = {}) {
  if (!supabase) return { row: null, reason: 'no database client' };
  try {
    const { data, error } = await supabase
      .from('agent_inbox')
      .select('id, body, tags, created_at')
      .contains('tags', JSON.stringify([CENSUS_TAG]))
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return { row: null, reason: error.message || 'read failed' };
    return { row: Array.isArray(data) && data.length ? data[0] : null, reason: '' };
  } catch (e) {
    return { row: null, reason: String(e && e.message ? e.message : e) };
  }
}
