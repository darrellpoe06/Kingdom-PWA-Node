// =============================================================================
// ux-signals — a device-local record of what the user actually uses, so the app
// can adapt its UI/UX to their real history
// =============================================================================
// Darrell 2026-07-15: "a better UIUX view functional and users preferences based
// on historical data about uiux." This is the reusable capability that lets a
// surface put the user's OWN most-recent / most-used items first -- the first
// increment (wired into the Learn lesson picker: "Recently opened").
//
// PRIVACY-FIRST, BY CONSTRUCTION (DATA-AS-EMPOWERMENT, the bright line):
//   • Lives ONLY in this device's localStorage. It is NEVER sent to a server,
//     never aggregated, never joined to an account.
//   • Stores opaque surface KEYS only (e.g. a lesson id) + a count and a last-
//     seen timestamp. No PII, no content, no free text.
//   • The user owns it: clearSignals() wipes it, and it is capped so it cannot
//     grow without bound.
//   • Fail-soft: no window / blocked storage / bad JSON -> it simply does nothing
//     and every reader returns empty. It can never break a render.
//
// Pure over an injected `storage` + `now`, so the ranking logic is unit-tested
// without a browser (DR-0076).
// =============================================================================

const KEY = 'poe-ux-signals';
const MAX_KEYS = 200; // cap: evict least-recently-seen beyond this.

function defaultStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
}

function read(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch { return {}; }
}

function write(storage, obj) {
  try { if (storage) storage.setItem(KEY, JSON.stringify(obj)); } catch { /* quota / private mode — ignore */ }
}

/**
 * Record one use of a surface key (a lesson id, a tab key, etc.).
 * @param {string} key - opaque surface key (no PII)
 * @param {{storage?:Storage, now?:number}} [opts]
 */
export function recordUse(key, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage || !key || typeof key !== 'string') return;
  const now = typeof opts.now === 'number' ? opts.now : nowMs();
  const data = read(storage);
  const cur = data[key] || { n: 0, last: 0 };
  data[key] = { n: cur.n + 1, last: now };
  const keys = Object.keys(data);
  if (keys.length > MAX_KEYS) {
    keys.sort((a, b) => (data[a].last || 0) - (data[b].last || 0));
    for (const k of keys.slice(0, keys.length - MAX_KEYS)) delete data[k];
  }
  write(storage, data);
}

/** The most-recently-used keys, newest first. */
export function recentUsed(limit = 5, opts = {}) {
  const storage = opts.storage || defaultStorage();
  const data = read(storage);
  return Object.entries(data)
    .sort((a, b) => (b[1].last || 0) - (a[1].last || 0))
    .slice(0, Math.max(0, limit))
    .map(([k]) => k);
}

/** The most-USED keys (by count, ties broken by recency). */
export function topUsed(limit = 5, opts = {}) {
  const storage = opts.storage || defaultStorage();
  const data = read(storage);
  return Object.entries(data)
    .sort((a, b) => (b[1].n - a[1].n) || ((b[1].last || 0) - (a[1].last || 0)))
    .slice(0, Math.max(0, limit))
    .map(([k]) => k);
}

/** How many uses a key has (0 if never / unavailable). */
export function useCount(key, opts = {}) {
  const storage = opts.storage || defaultStorage();
  const data = read(storage);
  return (data[key] && data[key].n) || 0;
}

/** The user's control: wipe all UX signals from this device. */
export function clearSignals(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try { if (storage) storage.removeItem(KEY); } catch { /* ignore */ }
}

// Timestamp source, isolated so the reader stays obvious. Uses the wall clock in
// the browser; tests inject `now` and never hit this.
function nowMs() {
  try { return Date.now(); } catch { return 0; }
}
