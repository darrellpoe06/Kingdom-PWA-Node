// =============================================================================
// lesson-share-record — the record of who shared which lesson, and whether the
// link worked when it was opened
// =============================================================================
// Darrell 2026-09-30: "also keep record of who does what send links etc... so
// we know they work and don't etc..."
//
// TWO RECORDS, both in the database the app reads (migration 0244, DR-0698):
//
//   * lesson_shares — one row per share: the token, the signed-in sharer
//     (auth.uid(), forced on the server, never taken from this payload), the
//     course and lesson, the link, how it went out (the device's share sheet or
//     a copy), and when.
//   * lesson_share_opens — one row per time a shared link is opened: the token,
//     when, whether the lesson showed ('ok') or not ('failed'), and why not.
//     NOTHING about the person who opened it: no IP, no account, no device.
//
// Both writes go through SECURITY DEFINER functions that a signed-out browser
// can call (the person opening a texted link has no account, which is the
// point), that validate shape, and that carry flood limits. Reading is signed
// in only: a sharer sees their own shares with their open counts, the Governor
// sees all.
//
// NEVER THROWS. A record failing must not turn a share, or a lesson someone was
// sent, into an error on their screen. The result says what happened so a
// caller can say it honestly; most callers ignore it.
// =============================================================================
import supabase from './supabase.js';
import { readShareToken, isShareToken } from './lesson-share.js';

/** 'shared' (the device's sheet) → 'native'; 'copied' (the clipboard fallback) → 'copy'. */
export function shareMethod(result) {
  if (result === 'shared') return 'native';
  if (result === 'copied') return 'copy';
  return '';
}

/**
 * Record one share. `share` is the payload the ShareButton handed out, which
 * carries its own token, course, lesson and link (see lessonSharePayload).
 */
export async function recordLessonShare(share, result, { client = supabase } = {}) {
  const s = share || {};
  const method = shareMethod(result);
  if (!method || !isShareToken(s.token) || !s.courseKey || !s.lessonId || !s.url) {
    return { ok: false, error: 'incomplete' };
  }
  try {
    const { error } = await client.rpc('lesson_share_record', {
      p_token: s.token,
      p_payload: {
        door: s.door || 'church',
        kind: s.kind || 'lesson',
        courseKey: String(s.courseKey),
        lessonId: String(s.lessonId),
        lessonTitle: String(s.title || ''),
        method,
        url: String(s.url),
      },
    });
    if (error) { console.warn('[lesson-share] not recorded:', error.message || error); return { ok: false, error: error.message || 'rpc' }; }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'threw' };
  }
}

/** Record one open of a shared link. */
export async function recordShareOpen(token, outcome, reason = '', { client = supabase } = {}) {
  if (!isShareToken(token) || (outcome !== 'ok' && outcome !== 'failed')) return { ok: false, error: 'incomplete' };
  try {
    const { data, error } = await client.rpc('lesson_share_open', {
      p_token: token,
      p_outcome: outcome,
      p_reason: String(reason || '').slice(0, 120),
    });
    if (error) return { ok: false, error: error.message || 'rpc' };
    return { ok: data !== false };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'threw' };
  }
}

// --- the open, watched from boot to the lesson on screen ----------------------
//
// The DR-0296 lesson: a link can be perfect and the lesson still never appear,
// because the shell routed somewhere else and the lesson surface never mounted.
// A surface can only report what it sees, and a surface that never mounted sees
// nothing. So the open is captured at BOOT (main.jsx, before the history seed
// rewrites the URL), and a watchdog records 'failed' if no surface reports the
// lesson on screen in time. The surface that does show it reports 'ok'; a
// surface that finds the link stale reports 'failed' with the reason.

export const OPEN_WATCHDOG_MS = 30000;
const SEEN_KEY = 'pt.lessonShare.opened.';

let pending = null; // { token, timer, sink }

function alreadyCounted(token, store) {
  try { return !!(store && store.getItem(SEEN_KEY + token)); } catch (_) { return false; }
}
function markCounted(token, store) {
  try { if (store) store.setItem(SEEN_KEY + token, '1'); } catch (_) { /* storage blocked: count it anyway */ }
}

/**
 * Called once at boot. Returns the token being watched, or '' when this page
 * was not opened from a shared link (or this tab already counted it: a reload
 * of the same page is not a second open).
 */
export function captureShareOpen(search, {
  timeoutMs = OPEN_WATCHDOG_MS,
  sink = recordShareOpen,
  store = (typeof sessionStorage !== 'undefined' ? sessionStorage : null),
  setTimer = (fn, ms) => setTimeout(fn, ms),
} = {}) {
  const token = readShareToken(search);
  if (!token || pending || alreadyCounted(token, store)) return '';
  // Counted when REPORTED, not when captured: a reload before the lesson
  // showed is still the same open, and it still gets its one row.
  const report = (outcome, reason) => { markCounted(token, store); return sink(token, outcome, reason); };
  const timer = setTimer(() => {
    if (!pending || pending.token !== token) return;
    pending = null;
    report('failed', `lesson not on screen within ${Math.round(timeoutMs / 1000)}s`);
  }, timeoutMs);
  pending = { token, timer, sink: (t, outcome, reason) => report(outcome, reason) };
  return token;
}

/** The token this page was opened with and has not yet reported ('' when none). */
export function pendingShareToken() {
  return pending ? pending.token : '';
}

/**
 * The surface that serves the linked lesson reports what happened. The first
 * report wins; later ones are ignored, so one open is one row.
 */
export function reportShareLanded({ ok, reason = '' } = {}, { clearTimer = (t) => clearTimeout(t) } = {}) {
  if (!pending) return false;
  const { token, timer, sink } = pending;
  pending = null;
  try { clearTimer(timer); } catch (_) { /* nothing to clear */ }
  sink(token, ok ? 'ok' : 'failed', ok ? '' : reason);
  return true;
}

/**
 * Resolve true once an element with this id is in the document (the lesson
 * card really rendered), false if it never appears within `timeoutMs`.
 */
export function waitForElement(id, {
  doc = (typeof document !== 'undefined' ? document : null),
  timeoutMs = 8000,
  everyMs = 150,
} = {}) {
  return new Promise((resolve) => {
    if (!doc || !id) { resolve(false); return; }
    const started = Date.now();
    const tick = () => {
      let found;
      try { found = doc.getElementById(id); } catch (_) { found = null; }
      if (found) { resolve(true); return; }
      if (Date.now() - started >= timeoutMs) { resolve(false); return; }
      setTimeout(tick, everyMs);
    };
    tick();
  });
}

/** Tests only. */
export function resetShareOpenForTest() {
  if (pending) { try { clearTimeout(pending.timer); } catch (_) { /* none */ } }
  pending = null;
}

// --- the ledger -----------------------------------------------------------------

/**
 * The shares this viewer may see, with their open counts. `all` asks for every
 * share (honoured for the Governor only; the database decides, not this flag).
 */
export async function listLessonShares({ all = false, client = supabase } = {}) {
  try {
    const { data, error } = await client.rpc('lesson_share_ledger', { p_all: !!all });
    if (error) return { ok: false, rows: [], error: error.message || 'rpc' };
    return { ok: true, rows: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false, rows: [], error: (e && e.message) || 'threw' };
  }
}

/** Totals over ledger rows, for the header line. Counted, never typed. */
export function ledgerTotals(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let opens = 0; let ok = 0; let failed = 0; let neverOpened = 0;
  for (const r of list) {
    const o = Number(r && r.opens) || 0;
    opens += o;
    ok += Number(r && r.ok_opens) || 0;
    failed += Number(r && r.failed_opens) || 0;
    if (o === 0) neverOpened += 1;
  }
  return { shares: list.length, opens, ok, failed, neverOpened };
}
