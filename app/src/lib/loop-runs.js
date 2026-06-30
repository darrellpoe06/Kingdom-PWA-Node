// =============================================================================
// loop-runs — the run-state CONTRACT every loop emits + the read-only store
// =============================================================================
// DR-0083: the DOING layer (a loop) emits its execution outcome — ran-when,
// processed-count, status, detail — and the WATCHING layer (🩺 Loops) reads it.
// The two are one-way and non-blocking: recording is wrapped so a write that
// fails can NEVER break the loop that's doing the work (observing the n8n engine
// is exactly what used to take it down). Real run records only — never painted.
//
// A run record (the shared shape a plain Python NAS job will also write):
//   { key, at (ISO), status: 'success'|'error'|'empty', processed (number), detail }
//
// For in-app loops the store is localStorage (per-device "what happened here",
// matching the existing snapshot-marker pattern in LoopHealth). NAS jobs write
// the same shape to a file the app reads when reachable — same contract, two
// emitters. The pure helpers (appendRun / latestRun) carry the logic so they
// unit-test without a browser.
// =============================================================================

const STORE_KEY = 'poe-loop-runs';
const CAP = 50; // keep the newest N runs; this is a window, not a ledger of record

export const RUN_STATUS = ['success', 'error', 'empty'];

// Append a record to the list, newest-LAST, capped to the most recent CAP. Pure.
export function appendRun(runs, record, cap = CAP) {
  const list = Array.isArray(runs) ? runs : [];
  const next = [...list, record];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

// Latest run for a loop key (by `at`, newest wins). Pure. null when none.
export function latestRun(runs, key) {
  const list = Array.isArray(runs) ? runs : [];
  let best = null;
  for (const r of list) {
    if (!r || r.key !== key) continue;
    if (best == null || String(r.at || '') > String(best.at || '')) best = r;
  }
  return best;
}

// Read the whole window from localStorage. Never throws (returns [] on any issue).
export function readLoopRuns() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Emit a run record from a loop's DOING path. Non-blocking by contract: any
// failure here is swallowed so it can never break the caller's real work.
// Returns the record on success, null if recording was skipped/failed.
export function recordLoopRun({ key, status = 'success', processed = 0, detail = '' } = {}) {
  try {
    if (!key) return null;
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const record = {
      key,
      at: new Date().toISOString(),
      status: RUN_STATUS.includes(status) ? status : 'success',
      processed: Number(processed) || 0,
      detail: String(detail || '').slice(0, 200),
    };
    const next = appendRun(readLoopRuns(), record);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return record;
  } catch (e) {
    return null; // observing must never break doing
  }
}
