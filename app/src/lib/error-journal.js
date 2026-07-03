// =============================================================================
// error-journal — the app records its own runtime failures (DR-0092)
// =============================================================================
// "Make sure it has proactive error correcting algorithms so qualitative and
// quantitative errors are minor because of our procedures." (Darrell, 2026-07-03.)
//
// Before this existed, a runtime error's whole life was one console.error line
// — invisible after the moment, invisible to the steward, invisible to the
// quality loops (the P3/P5 gap: system observability without OUTCOME
// observability). This journal is the missing memory: every caught error —
// a surface render crash (boundary), an uncaught window error, an unhandled
// promise rejection — is recorded to a capped, device-local journal that the
// Quality & Throughput board reads as a REAL number. An error that recurs
// bumps a count instead of flooding the cap (the repeat IS the signal).
//
// POSTURE (DR-0083): this is the WATCHING layer. Recording can never throw,
// never blocks, never retries the failed work itself — observing a failure
// must never cause another one. Device-local by design (localStorage): errors
// are the user's own diagnostic data; nothing egresses (DATA-AS-EMPOWERMENT).
// Dependency-free + injectable so every path is unit-tested (DR-0076).

export const ERROR_JOURNAL_KEY = 'poe-error-journal';
export const ERROR_JOURNAL_CAP = 30;
export const ERROR_KINDS = ['render', 'runtime', 'promise'];

function safeStorage(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    return w && w.localStorage && typeof w.localStorage.getItem === 'function'
      ? w.localStorage
      : null;
  } catch {
    return null; // private mode / blocked storage
  }
}

// Read the journal, newest first. Corrupt/missing storage reads as [] — honest
// empty, never a crash in the watcher.
export function readErrorJournal(win) {
  const ls = safeStorage(win);
  if (!ls) return [];
  try {
    const raw = JSON.parse(ls.getItem(ERROR_JOURNAL_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((e) => e && typeof e === 'object' && e.message) : [];
  } catch {
    return [];
  }
}

// Pure core: append an entry to a journal array, deduping a repeat of the
// newest entry (same source + message) into a count bump. Capped.
export function appendError(entries, entry, cap = ERROR_JOURNAL_CAP) {
  const list = Array.isArray(entries) ? entries.slice() : [];
  const head = list[0];
  if (head && head.source === entry.source && head.message === entry.message) {
    list[0] = { ...head, at: entry.at, count: (Number(head.count) || 1) + 1 };
    return list;
  }
  list.unshift({ ...entry, count: 1 });
  return list.slice(0, cap);
}

// Record one error. Never throws; a failure to record is silently dropped
// (the journal is best-effort memory, not a gate).
export function recordError({ source = 'app', kind = 'runtime', message = '' } = {}, win, at) {
  try {
    const ls = safeStorage(win);
    if (!ls) return false;
    const entry = {
      at: at || new Date().toISOString(),
      source: String(source).slice(0, 80),
      kind: ERROR_KINDS.includes(kind) ? kind : 'runtime',
      message: String(message || 'unknown error').slice(0, 300),
    };
    ls.setItem(ERROR_JOURNAL_KEY, JSON.stringify(appendError(readErrorJournal(win), entry)));
    return true;
  } catch {
    return false;
  }
}

export function clearErrorJournal(win) {
  const ls = safeStorage(win);
  if (!ls) return;
  try { ls.removeItem(ERROR_JOURNAL_KEY); } catch { /* nothing to do */ }
}

// Roll-up for the Quality & Throughput board. `total` counts occurrences
// (dedupe counts included), `recent` counts occurrences in the last 24h of
// `nowMs` — the "is it happening NOW" signal that drives the status dot.
export function errorJournalSummary(entries, nowMs) {
  const list = Array.isArray(entries) ? entries : [];
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  let total = 0;
  let recent = 0;
  for (const e of list) {
    const n = Number(e.count) || 1;
    total += n;
    const t = Date.parse(e.at || '');
    if (Number.isFinite(t) && now - t < 24 * 60 * 60 * 1000) recent += n;
  }
  const last = list[0] || null;
  const status = recent > 0 ? 'attention' : total > 0 ? 'good' : 'good';
  const label = recent > 0
    ? `${recent} in 24h`
    : total > 0 ? 'None in 24h' : 'None recorded';
  return { total, recent, distinct: list.length, last, status, label };
}

// Wire the global capture: uncaught errors + unhandled promise rejections.
// Returns an unsubscribe fn. Guarded for non-browser contexts; the handlers
// themselves can never throw.
export function installGlobalErrorCapture(win) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  if (!w || typeof w.addEventListener !== 'function') return () => {};
  const onError = (event) => {
    try {
      const msg = (event && (event.message || (event.error && event.error.message))) || 'uncaught error';
      recordError({ source: 'window', kind: 'runtime', message: msg }, w);
    } catch { /* watcher never throws */ }
  };
  const onRejection = (event) => {
    try {
      const r = event && event.reason;
      const msg = (r && (r.message || String(r))) || 'unhandled rejection';
      recordError({ source: 'promise', kind: 'promise', message: msg }, w);
    } catch { /* watcher never throws */ }
  };
  w.addEventListener('error', onError);
  w.addEventListener('unhandledrejection', onRejection);
  return () => {
    try {
      w.removeEventListener('error', onError);
      w.removeEventListener('unhandledrejection', onRejection);
    } catch { /* nothing to do */ }
  };
}
