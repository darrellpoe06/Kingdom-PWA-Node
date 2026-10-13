// =============================================================================
// upload-retry — make a single-row cloud upload SURVIVE a transient failure
// =============================================================================
// Christina's books, 2026-07-18: a reset-and-re-import fires hundreds of separate
// INSERTs in a burst; table-sync.upload had NO retry and the caller only warned
// on failure, so any row that hit a transient error (rate-limit / network blip /
// timeout) was silently local-only and never reached the cloud. The Imported view
// reads the CLOUD, so the highest-volume month (June, 323 rows) lost the most —
// which matched the symptom exactly, while the SAME file imported cleanly through
// the pure app modules (parse/group/audit) with 0 loss. So the bug is the write
// path, not the data (Christina was right).
//
// This is the pure, testable core: classify an upload error as TRANSIENT (worth a
// retry — the write can still succeed) vs PERMANENT (a validation / RLS / unique
// conflict that a retry cannot fix), and a retry driver that backs off between
// attempts. table-sync.upload wraps its INSERT in withUploadRetry so a burst no
// longer silently drops rows.
// =============================================================================

// Postgres/PostgREST error CODES that a retry can NEVER fix — do not waste
// attempts (or risk a double-insert) on these. Everything else is treated as
// transient (network blip, 429 rate-limit, 503, timeout) and retried.
const PERMANENT_CODES = new Set([
  '23505', // unique_violation — the row is already there; retrying can't help
  '23503', // foreign_key_violation
  '23502', // not_null_violation
  '23514', // check_violation
  '42501', // insufficient_privilege — RLS refused; a retry refuses again
  '22P02', // invalid_text_representation
  'PGRST301', // JWT / auth — retrying with the same token fails the same way
]);

const PERMANENT_HINT = /(duplicate key|violates|row-level security|permission denied|not-null|invalid input|jwt)/i;

// classifyUploadError(error) -> 'permanent' | 'transient'. A null/undefined error
// means success upstream; callers pass only real errors, but be safe. Default is
// TRANSIENT (retry) — an unknown blip is more likely a network/rate issue than a
// hard rejection, and a retry of a truly-permanent error still terminates on the
// code/hint the next time.
export function classifyUploadError(error) {
  if (!error) return 'transient';
  const code = String(error.code || error.status || '').trim();
  if (PERMANENT_CODES.has(code)) return 'permanent';
  const msg = String(error.message || error.details || error.hint || '');
  if (PERMANENT_HINT.test(msg)) return 'permanent';
  return 'transient';
}

// Backoff (ms) for attempt N (0-based): 250, 500, 1000, capped. Small — the goal
// is to ride out a brief rate-limit/blip during a burst, not to stall the import.
export function backoffMs(attempt) {
  return Math.min(250 * (2 ** attempt), 2000);
}

// withUploadRetry(doInsert, { retries, sleep }) — run an insert thunk that returns
// { error } (PostgREST shape), retrying TRANSIENT failures up to `retries` times
// with backoff. Returns the FIRST successful result, or the last failure. `sleep`
// is injected so tests run instantly and it stays pure/deterministic. Never
// throws — a thrown insert is caught and treated as a transient error result.
export async function withUploadRetry(doInsert, { retries = 3, sleep = defaultSleep } = {}) {
  let last = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let res;
    try {
      res = await doInsert();
    } catch (e) {
      res = { error: e || { message: 'threw' } };
    }
    if (!res || !res.error) return res;              // success
    last = res;
    if (classifyUploadError(res.error) === 'permanent') return res; // hopeless — stop
    if (attempt < retries) await sleep(backoffMs(attempt));         // transient — wait + retry
  }
  return last;
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
