// =============================================================================
// arrivals-watch — the app-wide watcher behind the bell and the icon badge
// (DR-0728)
// =============================================================================
// One watcher, started once at boot (main.jsx), the way dm-notify's is. It
// holds the whole picture — unread messages from the DM watcher's event, the
// person's own lesson rows, the Governor's member queue, the person's own
// feedback notes — and on every change it:
//   1. sets the LAUNCHER badge and the "(N)" title badge to the COMBINED count
//      (before this, dm-notify set them to unread messages alone);
//   2. raises ARRIVALS_EVENT so the header bell shows the same number and list;
//   3. rings a local notification for a NEW non-message arrival while the app
//      is hidden and permission was already granted (never asked for here);
//   4. hears ARRIVALS_SEEN_EVENT from a screen that opened and marks that
//      kind seen for this account, on this device.
//
// Occurrence first, clock as the net (the dm-notify rule): the agent_inbox
// realtime stream is the trigger when healthy (migration 0246 adds the table
// to the publication); a 60 s heartbeat and a refetch on becoming visible are
// the net under a sick stream.
//
// The lesson modules carry the lesson catalog; they are imported HERE, after
// sign-in, so the boot chunk stays as light as it was.
import { supabase, onAuthChange } from './supabase.js';
import { applyAppBadge, applyTitleBadge } from './dm-notify.js';
import { DM_UNREAD_EVENT } from './notify-readiness.js';
import {
  ARRIVALS_EVENT, ARRIVALS_SEEN_EVENT, lessonArrivals, queueArrivals, feedbackArrivals, messageArrival,
  combineArrivals, loadSeen, saveSeen, markSeen, unseenArrivals, arrivalCount, badgeText, ringableIds, newSince,
  arrivalNotification, arrivalLanding,
} from './arrivals.js';

export const ARRIVALS_HEARTBEAT_MS = 60000;

/** The latest picture, for a bell that mounts after the first event. */
export function currentArrivals(win = typeof window !== 'undefined' ? window : undefined) {
  const s = win && win.__ptArrivals;
  return s && typeof s === 'object' ? s : { count: 0, items: [], all: [] };
}

/** Show a local notification through the registration (so a tap lands by the
 *  door's own worker, DR-0444), else the bare Notification. Never throws. */
export async function showArrivalNotification(win, item, { registration } = {}) {
  const words = arrivalNotification(item);
  if (!words) return 'none';
  const url = arrivalLanding({ pathname: win.location?.pathname, search: win.location?.search, item }) || win.location?.pathname || '/';
  const reg = registration || win.__pwaReg;
  try {
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(words.title, { body: words.body, tag: words.tag, data: { url } });
      return 'registration';
    }
    if (win.Notification) {
      const n = new win.Notification(words.title, { body: words.body, tag: words.tag });
      n.onclick = () => { try { win.focus(); win.location.assign(url); } catch { /* noop */ } };
      return 'window';
    }
  } catch { /* a notification that cannot show must never break the app */ }
  return 'none';
}

/** Should a local notification ring for `added` items? Hidden + granted only. */
export function ringDecision(added, { hidden = false, permission = 'denied', primed = false } = {}) {
  return primed && Array.isArray(added) && added.length > 0 && hidden && permission === 'granted';
}

const defaultLoaders = {
  lessons: async () => (await import('./lesson-inbox.js')).fetchMyLessons,
  queue: async () => (await import('./member-lesson-review.js')).fetchMemberLessonQueue,
  feedback: async () => (await import('./feedback-sync.js')).fetchMyFeedback,
};

/**
 * Start the watcher. Safe anywhere: no-ops without a window, follows sign-in
 * and sign-out, returns a stop function. `deps` are injected for tests.
 */
export function startArrivalsWatch(win = typeof window !== 'undefined' ? window : undefined, deps = {}) {
  if (!win) return () => {};
  const client = deps.supabase || supabase;
  const loaders = { ...defaultLoaders, ...(deps.loaders || {}) };
  const subscribeAuth = deps.onAuthChange || onAuthChange;
  let stop = null;

  const publish = (state) => {
    const all = combineArrivals(state.parts);
    const items = unseenArrivals(all, state.seen);
    const count = arrivalCount(all, state.seen);
    applyTitleBadge(win.document, badgeText(count));
    applyAppBadge(win.navigator, count);
    const snapshot = { count, items, all, uid: state.uid };
    win.__ptArrivals = snapshot;
    try {
      win.dispatchEvent(new win.CustomEvent(ARRIVALS_EVENT, { detail: snapshot }));
    } catch { /* a page without CustomEvent still has the badge above */ }
    // Ring for what is new since the last publish, only once the first read
    // has landed (a cold boot must not announce everything already waiting).
    const added = newSince(items, state.known);
    if (ringDecision(added, {
      hidden: win.document?.visibilityState === 'hidden',
      permission: (win.Notification && win.Notification.permission) || 'denied',
      primed: state.primed,
    })) {
      for (const it of added.slice(0, 3)) showArrivalNotification(win, it);
    }
    state.known = ringableIds(items);
    state.primed = true;
  };

  const start = (session) => {
    const uid = session.user.id;
    const state = {
      uid,
      seen: loadSeen(win.localStorage, uid),
      parts: { message: null, lessons: [], queue: [], feedback: [] },
      known: [],
      primed: false,
      owner: false,
    };
    let cancelled = false;
    let timer = null;
    let channel = null;

    const onUnread = (e) => {
      const d = (e && e.detail) || {};
      state.parts.message = messageArrival({ count: d.next, newest: d.newest });
      publish(state);
    };
    const onSeen = (e) => {
      const kinds = (e && e.detail && e.detail.kinds) || [];
      state.seen = markSeen(state.seen, combineArrivals(state.parts), kinds);
      saveSeen(win.localStorage, uid, state.seen);
      publish(state);
    };
    win.addEventListener(DM_UNREAD_EVENT, onUnread);
    win.addEventListener(ARRIVALS_SEEN_EVENT, onSeen);

    const refresh = async () => {
      try {
        const fetchMyLessons = await loaders.lessons();
        const res = await fetchMyLessons({ supabase: client });
        if (cancelled) return;
        if (res && res.ok) {
          state.owner = !!res.owner;
          state.parts.lessons = lessonArrivals(res.items, { owner: state.owner });
          if (state.owner) {
            const fetchQueue = await loaders.queue();
            const q = await fetchQueue({ supabase: client });
            if (!cancelled && q && q.ok) state.parts.queue = queueArrivals(q.rows);
          }
        }
        const fetchMyFeedback = await loaders.feedback();
        const fb = await fetchMyFeedback(client);
        if (!cancelled && fb && fb.ok) state.parts.feedback = feedbackArrivals(fb.items);
      } catch { /* a read that fails leaves the last picture standing */ }
      if (!cancelled) publish(state);
    };
    // Publish the message part at once (the DM watcher may already have fired),
    // then read the rest.
    publish(state);
    refresh();
    try {
      channel = client
        .channel('arrivals-agent_inbox')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_inbox' }, () => { refresh(); })
        .subscribe();
    } catch { channel = null; }
    timer = setInterval(() => { refresh(); }, ARRIVALS_HEARTBEAT_MS);
    const onVisible = () => { if (win.document?.visibilityState === 'visible') refresh(); };
    win.document?.addEventListener?.('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      win.removeEventListener(DM_UNREAD_EVENT, onUnread);
      win.removeEventListener(ARRIVALS_SEEN_EVENT, onSeen);
      win.document?.removeEventListener?.('visibilitychange', onVisible);
      if (timer) clearInterval(timer);
      if (channel) { try { client.removeChannel(channel); } catch { /* noop */ } }
    };
  };

  const offAuth = subscribeAuth((session) => {
    if (stop) { try { stop(); } catch { /* noop */ } stop = null; }
    if (!session || !session.user) {
      applyTitleBadge(win.document, '');
      applyAppBadge(win.navigator, 0);
      win.__ptArrivals = { count: 0, items: [], all: [], uid: null };
      try { win.dispatchEvent(new win.CustomEvent(ARRIVALS_EVENT, { detail: win.__ptArrivals })); } catch { /* noop */ }
      return;
    }
    stop = start(session);
  });
  return () => { if (stop) stop(); if (typeof offAuth === 'function') offAuth(); };
}
