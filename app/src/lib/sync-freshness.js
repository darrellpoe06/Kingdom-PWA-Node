// =============================================================================
// sync-freshness — when did THIS device last hear the family database, per table
// =============================================================================
// 2026-09-30, Darrell and Christina on the same build: Books -> Imported showed
// 258 September rows on her phone and 183 on his desktop, and nothing on either
// screen said how old its picture was. A ledger that cannot say when it last
// spoke to the database lets two honest screens disagree with no way to tell
// which one is current (DR-0708).
//
// The stamp is written ONLY by table-sync, and only after a read the database
// actually answered in full (a complete paged read, or both legs of a delta).
// A partial or failed read never stamps; it records the failure instead.
// Nothing is persisted: a device that has not heard the database since this
// page loaded has NO stamp, and no stamp reads as "not confirmed", never as
// fresh (DR-0076: unknown freshness never reads as fresh).
// =============================================================================

const stamps = new Map();      // table -> { at, rows, mode }
const failures = new Map();    // table -> { at, reason }
const resyncers = new Map();   // table -> () => Promise<void>
const listeners = new Set();

function emit(table) {
  for (const fn of listeners) { try { fn(table); } catch { /* a listener never breaks sync */ } }
}

/** table-sync calls this after a read the database answered in full. */
export function markSynced(table, { at = Date.now(), rows = null, mode = 'full' } = {}) {
  stamps.set(table, { at, rows, mode });
  failures.delete(table);
  emit(table);
}

/** table-sync calls this when a read failed or came back partial. */
export function markSyncFailed(table, reason = 'read-failed', at = Date.now()) {
  failures.set(table, { at, reason: String(reason) });
  emit(table);
}

export function getSyncStamp(table) {
  return { stamp: stamps.get(table) || null, failure: failures.get(table) || null };
}

/** Subscribe to stamp changes; returns an unsubscribe function. */
export function onSyncFreshness(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** table-sync registers how to re-read a table in full ("Sync now"). */
export function registerResync(table, fn) {
  resyncers.set(table, fn);
  return () => { if (resyncers.get(table) === fn) resyncers.delete(table); };
}

/** Ask the table's live controller for a full re-read. Resolves false if none is running. */
export async function requestResync(table) {
  const fn = resyncers.get(table);
  if (!fn) return false;
  await fn();
  return true;
}

export const FRESH_MS = 2 * 60 * 1000;
export const STALE_MS = 15 * 60 * 1000;

function ago(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

/**
 * Pure: the words and the state a screen shows for a stamp.
 * state: 'unknown' | 'failed' | 'fresh' | 'recent' | 'stale'
 * Only 'fresh' and 'recent' may be styled as current.
 */
export function describeFreshness({ stamp, failure } = {}, nowMs = Date.now()) {
  if (failure && (!stamp || failure.at >= stamp.at)) {
    const since = stamp ? ` The last full read was ${ago(nowMs - stamp.at)}.` : '';
    return {
      state: 'failed',
      text: `The last read of the family database did not complete on this device, so these numbers may be out of date.${since}`,
    };
  }
  if (!stamp || !Number.isFinite(stamp.at)) {
    return {
      state: 'unknown',
      text: 'Not yet confirmed with the family database on this device. These numbers may be out of date until it is.',
    };
  }
  const age = nowMs - stamp.at;
  const when = new Date(stamp.at);
  const clock = Number.isNaN(when.getTime()) ? '' : ` (${when.toLocaleString()})`;
  if (age <= FRESH_MS) return { state: 'fresh', text: `Synced with the family database ${ago(age)}${clock}.` };
  if (age <= STALE_MS) return { state: 'recent', text: `Last synced with the family database ${ago(age)}${clock}.` };
  return { state: 'stale', text: `Last synced with the family database ${ago(age)}${clock}. Tap Sync now for the current ledger.` };
}

/** Test-only: forget every stamp. */
export function __resetSyncFreshness() {
  stamps.clear(); failures.clear(); resyncers.clear(); listeners.clear();
}
