// =============================================================================
// arrivals — one count for everything that came in and has not been looked
// at yet (DR-0728)
// =============================================================================
// Darrell 2026-10-01, in the installed app on his phone, beside a launcher
// badge reading "19" on another app: "Why don't the PoeTech App have those
// types of notifications and the number of them if I haven't checked them
// yet?" Measured that day: the launcher badge and the "(N)" title badge
// counted UNREAD DIRECT MESSAGES only (lib/dm-notify.js). A lesson that
// finished building, a lesson that went live, a member's lesson waiting for
// his review and a steward's answer on a note all arrived in silence: each had
// a screen, none had a number.
//
// This is the pure model. It knows every KIND of arrival, turns the rows each
// screen already reads into one list, keeps a per-account "seen" mark for each
// kind, and says how many are not yet seen. It renders nothing and touches no
// network; lib/arrivals-watch.js does the watching, components/ArrivalsBell.jsx
// the showing.
//
// THE KINDS, each read from real rows (DR-0076), never inferred:
//   message          an unread direct message (the DM stream's own read state
//                    is the seen mark: reading the thread drops it)
//   lesson-ready     your lesson finished building: the row moved from
//                    `lesson-building` to `awaiting-review` (DR-0669)
//   lesson-review    the Governor decided on your lesson request (approved or
//                    declined, DR-0635); members only
//   lesson-published your lesson went live: `lesson-published` + `lesson-id:`
//   review-queue     a member's lesson waits for the Governor (his queue only)
//   feedback         a steward answered a note you sent: its triage status left
//                    'new' (DR-0616)
//
// THE SEEN MARK is a set of arrival ids per account, kept in localStorage on
// THIS DEVICE (said plainly: per device for this first cut; the Messages kind
// is the exception, because the database holds its read state). Opening the
// screen an arrival lives on marks that whole kind seen; the bell itself
// marks nothing, so a glance at the list never silences what it lists.
// =============================================================================
import { arrivalText } from './notify-readiness.js';
import { buildStageTimes } from './lesson-pipeline.js';
import { currentDoor, messageLandingHere } from './app-doors.js';

export const ARRIVAL_KINDS = Object.freeze(['message', 'lesson-ready', 'lesson-review', 'lesson-published', 'review-queue', 'feedback']);

/** The kinds a screen marks seen when it opens. One source for every screen. */
export const SCREEN_KINDS = Object.freeze({
  'your-lessons': ['lesson-ready', 'lesson-review', 'lesson-published'],
  decide: ['review-queue'],
  feedback: ['feedback'],
});

/** The in-page event the watcher raises on every change: { count, items, all }. */
export const ARRIVALS_EVENT = 'poetech:arrivals';
/** The in-page event a screen raises when it opens: { kinds }. */
export const ARRIVALS_SEEN_EVENT = 'poetech:arrivals-seen';

export const SEEN_KEY_PREFIX = 'poetech:arrivals-seen:';
/** Seen ids kept per account; the oldest fall off, so the store stays small. */
export const SEEN_CAP = 400;

const has = (tags, t) => Array.isArray(tags) && tags.includes(t);
const iso = (s) => (s && Number.isFinite(Date.parse(s)) ? String(s) : '');

/**
 * The lesson arrivals in a person's own lessons (lessonItems() entries).
 * `owner` is the Governor: his lessons need no review, so the only decision
 * his `awaiting-review` names is his own.
 */
export function lessonArrivals(items, { owner = false } = {}) {
  const out = [];
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || !it.id) continue;
    const tags = Array.isArray(it.progressTags) ? it.progressTags : [];
    const times = buildStageTimes(tags);
    const built = has(tags, 'lesson-captured') || !!times.pushed || !!times.published;
    if (!built && (has(tags, 'awaiting-review') || times['awaiting-review'])) {
      out.push({
        kind: 'lesson-ready',
        id: `lesson-ready:${it.id}`,
        at: iso(times['awaiting-review']) || iso(it.transcriptAt) || iso(it.createdAt),
        title: owner ? 'Your lesson is ready to review' : 'Your lesson is written',
        detail: owner
          ? 'Every version is written and waits for your choice.'
          : 'It waits for the Governor to choose a version.',
        screen: 'your-lessons',
      });
    }
    if (!owner && it.review && (it.review.state === 'approved' || it.review.state === 'declined')) {
      out.push({
        kind: 'lesson-review',
        id: `lesson-review:${it.id}`,
        at: iso(it.createdAt),
        title: it.review.state === 'approved' ? 'Your lesson request was approved' : 'Your lesson request has an answer',
        detail: String(it.review.line || ''),
        screen: 'your-lessons',
      });
    }
    if (it.published) {
      const label = [it.published.number, it.published.title].filter(Boolean).join(' ') || it.published.lessonId || '';
      out.push({
        kind: 'lesson-published',
        id: `lesson-published:${it.id}`,
        at: iso(times.published) || iso(it.createdAt),
        title: 'Your lesson is published',
        detail: label,
        screen: 'your-lessons',
        href: it.published.href || '',
      });
    }
  }
  return out;
}

/** The Governor's queue rows (member_lesson_queue) as arrivals. */
export function queueArrivals(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && r.id).map((r) => ({
    kind: 'review-queue',
    id: `review-queue:${r.id}`,
    at: iso(r.created_at),
    title: 'A member’s lesson waits for your review',
    detail: String(r.sender_name || 'A member'),
    screen: 'decide',
  }));
}

/** The sender's own notes a steward has moved off 'new' (fetchMyFeedback items). */
export function feedbackArrivals(items) {
  const out = [];
  for (const f of Array.isArray(items) ? items : []) {
    if (!f || !f.id) continue;
    const status = String(f.triageStatus || f.triage_status || 'new');
    if (status === 'new') continue;
    const note = String(f.triageNotes || f.triage_notes || '').trim();
    out.push({
      kind: 'feedback',
      id: `feedback:${f.id}`,
      // The database keeps no time for the triage move (DR-0616); the note's
      // own time orders it, and the row says so rather than inventing one.
      at: iso(f.submittedAt || f.submitted_at || f.createdAt),
      title: 'Your feedback was answered',
      detail: note || `Now: ${status.replace(/-/g, ' ')}.`,
      screen: 'feedback',
    });
  }
  return out;
}

/** The one row for unread direct messages, from the DM watcher's event detail. */
export function messageArrival({ count = 0, newest = null } = {}) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  const who = (newest && newest.senderName) || '';
  return {
    kind: 'message',
    id: `message:${(newest && newest.messageId) || 'unread'}`,
    at: iso(newest && newest.at),
    title: arrivalText({ count: n, senderName: who }),
    detail: '',
    screen: 'messages',
    count: n,
    peerUserId: (newest && newest.peerUserId) || null,
  };
}

/** Every arrival, newest first. An item with no time sorts last, never first. */
export function combineArrivals({ message = null, lessons = [], queue = [], feedback = [] } = {}) {
  const all = [...(message ? [message] : []), ...lessons, ...queue, ...feedback];
  return all.sort((a, b) => {
    if (a.at && b.at) return a.at < b.at ? 1 : a.at > b.at ? -1 : 0;
    if (a.at) return -1;
    if (b.at) return 1;
    return 0;
  });
}

// ── the seen mark ────────────────────────────────────────────────────────────

export const EMPTY_SEEN = Object.freeze({ v: 1, ids: [] });

export function seenKey(uid) { return `${SEEN_KEY_PREFIX}${uid}`; }

/** Read this account's seen set. Unreadable or absent = nothing seen. */
export function loadSeen(storage, uid) {
  if (!storage || !uid) return { ...EMPTY_SEEN, ids: [] };
  try {
    const raw = storage.getItem(seenKey(uid));
    const parsed = raw ? JSON.parse(raw) : null;
    const ids = parsed && Array.isArray(parsed.ids) ? parsed.ids.filter((x) => typeof x === 'string') : [];
    return { v: 1, ids };
  } catch {
    return { v: 1, ids: [] };
  }
}

/** Write it; a storage-blocked browser simply keeps counting until next time. */
export function saveSeen(storage, uid, seen) {
  if (!storage || !uid) return false;
  try { storage.setItem(seenKey(uid), JSON.stringify({ v: 1, ids: (seen && seen.ids) || [] })); return true; } catch { return false; }
}

/** Mark every current item of these kinds seen. Pure: returns the new set. */
export function markSeen(seen, items, kinds) {
  const want = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  const ids = new Set((seen && seen.ids) || []);
  for (const it of Array.isArray(items) ? items : []) {
    if (it && want.has(it.kind) && it.kind !== 'message') ids.add(it.id);
  }
  const list = [...ids];
  return { v: 1, ids: list.length > SEEN_CAP ? list.slice(list.length - SEEN_CAP) : list };
}

/** Is this one item still unseen? Messages carry their own read state. */
export function isUnseen(item, seen) {
  if (!item) return false;
  if (item.kind === 'message') return (Number(item.count) || 0) > 0;
  return !((seen && seen.ids) || []).includes(item.id);
}

/** The items not yet seen, in the order given. */
export function unseenArrivals(items, seen) {
  return (Array.isArray(items) ? items : []).filter((it) => isUnseen(it, seen));
}

/** The number on the icon and the bell: unread messages plus every other unseen item. */
export function arrivalCount(items, seen) {
  let n = 0;
  for (const it of unseenArrivals(items, seen)) n += it.kind === 'message' ? (Number(it.count) || 0) : 1;
  return n;
}

/** The ids of items of the kinds a local notification may ring for (never messages: dm-notify rings those). */
export function ringableIds(items) {
  return (Array.isArray(items) ? items : []).filter((it) => it && it.kind !== 'message').map((it) => it.id);
}

/** The items that are new since the last look, by id. */
export function newSince(items, knownIds) {
  const known = new Set(Array.isArray(knownIds) ? knownIds : []);
  return (Array.isArray(items) ? items : []).filter((it) => it && it.kind !== 'message' && !known.has(it.id));
}

// ── where a tap lands ────────────────────────────────────────────────────────

/**
 * The URL a tap on an arrival opens, IN THE DOOR THE PERSON IS ALREADY IN
 * (app-doors.js, DR-0444): a message opens its thread; a lesson arrival opens
 * Your lessons; the Governor's queue opens Lessons to decide. Feedback has no
 * URL: its replies live in the Feedback sheet the footer button opens, so the
 * bell presses that button instead (null here).
 */
export function arrivalLanding({ pathname = '', search = '', item } = {}) {
  if (!item) return null;
  if (item.kind === 'message') return messageLandingHere({ pathname, search, peerUserId: item.peerUserId });
  const door = currentDoor(pathname, search).path;
  if (item.screen === 'your-lessons') return `${door}?view=create&panel=your-lessons`;
  if (item.screen === 'decide') return `${door}?view=create&panel=decide`;
  return null;
}

/** The words a local notification carries for a non-message arrival. */
export function arrivalNotification(item) {
  if (!item) return null;
  return {
    title: String(item.title || 'Something new arrived'),
    body: String(item.detail || 'Open the app to see it.').slice(0, 160),
    tag: `poetech-arrival:${item.id}`,
  };
}

/** The "(N) " title prefix; '' at zero. */
export function badgeText(count) {
  const n = Number(count) || 0;
  return n > 0 ? `(${n}) ` : '';
}

/**
 * Tell the watcher a screen opened: every item of these kinds is seen. Pure
 * except for the one dispatch; a page with no watcher simply hears nothing.
 */
export function markArrivalsSeen(kinds, win = typeof window !== 'undefined' ? window : undefined) {
  if (!win || typeof win.dispatchEvent !== 'function' || typeof win.CustomEvent !== 'function') return false;
  try {
    win.dispatchEvent(new win.CustomEvent(ARRIVALS_SEEN_EVENT, { detail: { kinds: Array.isArray(kinds) ? kinds : [kinds] } }));
    return true;
  } catch {
    return false;
  }
}
