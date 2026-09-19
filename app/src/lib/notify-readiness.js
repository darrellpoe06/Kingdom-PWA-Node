// =============================================================================
// notify-readiness — is this device actually reachable, and does the app say so
// =============================================================================
// Darrell, 2026-09-17, with a photo of his own home screen: "Why doesn't it
// show notifications on the apps?" — Google carried a badge; PoeTech and The
// Love Corner carried nothing. Then: "Christina text me and I didn't realize
// it was a new one... I was even inside the Love Corner App... I believe it
// should be able to give a better response."
//
// MEASURED FIRST (DR-0076), against the live database, before a line was
// written:
//
//   select count(*) from push_subscriptions  ->  0
//   select count(*) from push_sends          ->  0
//
// ZERO. Not one device has ever been subscribed, and the sender has therefore
// never once attempted a delivery. The whole Web Push stack of DR-0334 /
// DR-0336 — the service-worker push handler, the RFC 8291 crypto, the
// same-origin sender, the VAPID pair installed from a workflow — is built,
// tested and live, and it has never had a single subscriber to reach.
//
// THE CAUSE IS NOT THE PLUMBING, IT IS THE DOOR. The one control in the app
// that can create a subscription is `<PushNotifications topic="message" />`,
// and it renders in exactly ONE place: part-way down the Messages tab. To be
// reachable by a notification you must first go looking, inside the surface
// the notification exists to save you from having to open. Nothing anywhere
// else in the app ever mentions that notifications are off. That is the
// silent-failure class this house treats as a defect in its own right: the
// off-state was never false, it was never SAID.
//
// THREE STATES, THREE DIFFERENT TRUTHS, and conflating any two of them is how
// this stayed invisible:
//   • 'unconfigured' — this deployment has no VAPID key. Nobody's fault, and
//     no control can help; say nothing rather than offer a dead button.
//   • 'blocked'      — the browser refused and will not ask again. Only the
//     site settings can undo it, so point there, never at a button.
//   • 'off'          — genuinely available and not turned on. THIS is the one
//     that earns an offer, and the one the app had no way to show.
//
// This module is the pure half: the state machine, the words, the snooze, and
// the in-app arrival decision. It renders nothing and touches no browser API,
// so every branch is testable without a phone.
//
// THE IN-APP HALF IS THE EXACT COMPLEMENT OF THE DOORBELL. `notifyDecision` in
// dm-notify.js deliberately never rings while the app is on screen — correct,
// because an OS notification for something you are looking at is noise. But
// the app then showed NOTHING either: the "(N)" title badge has no title bar
// inside an installed PWA, the launcher badge is behind the app you are in,
// and the unread count only appears once you are already on Messages. So a
// message could land while Darrell was inside The Love Corner and the app
// would be, by design, completely silent. `inAppSignal` covers precisely the
// case `notifyDecision` refuses: the count GREW and the app is VISIBLE.
// Between them there is no overlap and, more importantly, no gap.

/** How long a dismissed offer stays quiet. Long enough not to nag; short
 *  enough that "not now" never becomes "never", which is how a person ends up
 *  unreachable for a year without choosing to be. */
export const NOTIFY_SNOOZE_DAYS = 14;

/** How long a failed ATTEMPT stays quiet. Shorter than a dismissal -- the
 *  person wants this and we owe them another try -- but never zero, because
 *  zero is the nag. */
export const NOTIFY_ATTEMPT_QUIET_DAYS = 1;

/** The in-page event the app-wide watcher raises on every unread change, so
 *  one subscription feeds every listener (a second `subscribeDirectMessages`
 *  would mean a second channel and a second heartbeat for the same rows). */
export const DM_UNREAD_EVENT = 'poetech:dm-unread';

const DAY_MS = 86400000;

/**
 * The readiness of THIS device, from facts only — the browser's own permission
 * string, whether a subscription genuinely exists right now, and whether this
 * deployment has a key at all. Never a stored preference: a saved
 * "notifications: on" flag will happily claim ON after the browser rotated the
 * subscription away, which tells someone they are covered when they are not.
 *
 * @param {object} f
 * @param {boolean} [f.supported]   the browser can do notifications at all
 * @param {boolean} [f.configured]  this deployment serves a VAPID key
 * @param {string}  [f.permission]  'granted' | 'denied' | 'default' | 'unsupported'
 * @param {boolean} [f.subscribed]  a live push subscription exists on this device
 * @returns {{state: string, headline: string, detail: string, canAct: boolean}}
 */
export function readinessFrom({
  supported = true, configured = true, permission = 'default', subscribed = false,
} = {}) {
  if (!supported || permission === 'unsupported') {
    return {
      state: 'unsupported',
      headline: 'This browser cannot show notifications.',
      detail: 'Install the app to your home screen, or open it in Chrome or Safari, and the option appears here.',
      canAct: false,
    };
  }
  if (!configured) {
    return {
      state: 'unconfigured',
      headline: 'Notifications are not set up on this deployment yet.',
      detail: 'Nothing is wrong with your phone — the server has no notification key installed.',
      canAct: false,
    };
  }
  if (permission === 'denied') {
    return {
      state: 'blocked',
      headline: 'Your browser is blocking notifications for this app.',
      detail: 'We cannot ask again from here. Turn them back on in your browser’s settings for this site.',
      canAct: false,
    };
  }
  // ALREADY SAID YES, BUT NOT REGISTERED. Darrell, 2026-09-19, with a
  // screenshot of the offer on his phone: "I get a lot of requests for getting
  // notifications however why does it keep asking after agreeing to?"
  //
  // He had agreed. The browser had granted. What had NOT happened is the
  // subscription -- and the old code only ever asked `subscribed && granted`,
  // so a failed registration fell through to the plain 'off' branch and the
  // same "Turn on notifications" card came back every time the app loaded.
  // Agreement was never what the offer measured, which is why agreeing could
  // not silence it.
  //
  // This is its own state, for two reasons. The copy was a LIE to someone who
  // had already said yes -- it asked him to do a thing he had done. And the
  // real failure is OURS (the subscribe step), so the card must say that
  // rather than send him back around the same loop.
  if (permission === 'granted' && !subscribed) {
    return {
      state: 'permitted',
      headline: 'You said yes — this device just is not registered yet.',
      detail: 'Your browser already allows notifications. The step that registers this '
        + 'device did not finish, so try once more.',
      canAct: true,
    };
  }
  if (subscribed && permission === 'granted') {
    return {
      state: 'on',
      headline: 'Notifications are on for this device.',
      detail: 'You will be told when a message arrives and when the service goes live.',
      canAct: false,
    };
  }
  return {
    state: 'off',
    headline: 'Turn on notifications so you know when someone messages you.',
    detail: 'Your phone will tell you a message arrived even when the app is closed.',
    canAct: true,
  };
}

/** Is a dismissal still inside its quiet window? An absent or unparseable
 *  stamp is NOT a dismissal — it must never silence the offer by accident. */
export function snoozeActive(dismissedAt, now = Date.now(), days = NOTIFY_SNOOZE_DAYS) {
  if (!dismissedAt) return false;
  const t = typeof dismissedAt === 'number' ? dismissedAt : Date.parse(String(dismissedAt));
  if (!Number.isFinite(t)) return false;
  return (Number(now) - t) < (days * DAY_MS);
}

/**
 * Should the app offer to turn notifications on, here, now?
 *
 * Only for the 'off' state — an unsupported, unconfigured or blocked browser
 * gets the truth on the Notifications screen where someone went looking, and
 * is never interrupted with an offer that cannot work. Only for someone signed
 * in, because a subscription is bound to a person's device row. And never
 * inside a snooze.
 */
export function shouldOfferNotifications(
  readiness,
  { signedIn = false, dismissedAt = null, attemptedAt = null, now = Date.now() } = {},
) {
  if (!readiness) return false;
  if (!signedIn) return false;
  // 'permitted' is offered too -- the person can still finish -- but it is a
  // RETRY, not the original ask, and it carries its own quiet window.
  if (readiness.state !== 'off' && readiness.state !== 'permitted') return false;
  if (snoozeActive(dismissedAt, now)) return false;
  // An ATTEMPT quiets the offer the same way a dismissal does. Without this a
  // failed registration re-asks on every load, which is exactly the nag
  // Darrell reported: he acted, it failed silently, and the card returned.
  return !snoozeActive(attemptedAt, now, NOTIFY_ATTEMPT_QUIET_DAYS);
}

/**
 * The IN-APP arrival signal: the case the OS doorbell refuses.
 *
 * Fires only when the unread count GREW (never on a shrink — reading a message
 * must not announce itself) and only while the app is VISIBLE (hidden belongs
 * to `notifyDecision`, which rings the OS instead). `count` is the new total,
 * so the pill can say how many are waiting rather than just "something
 * happened".
 */
export function inAppSignal(prevUnread, nextUnread, { visible = false } = {}) {
  const prev = Number(prevUnread) || 0;
  const next = Number(nextUnread) || 0;
  return { show: next > prev && !!visible && next > 0, count: next };
}

/** The words on the in-app pill. Pure so the copy is pinned by a test. */
export function arrivalText({ count = 1, senderName = '' } = {}) {
  const who = String(senderName || '').trim();
  if (count > 1) return `${count} new messages${who ? ` — latest from ${who}` : ''}`;
  return who ? `New message from ${who}` : 'New message';
}

/**
 * The newest unread incoming message, for the pill's words and its landing.
 * Pure over the shaped rows the DM stream already produces; null when nothing
 * is unread, so a caller never has to guess.
 */
export function newestUnreadFrom(rows = []) {
  let best = null;
  for (const m of rows || []) {
    if (!m || m.mine || m.readAt) continue;
    if (!best || String(m.createdAt) > String(best.createdAt)) best = m;
  }
  if (!best) return null;
  return {
    peerUserId: best.otherUserId || null,
    senderName: best.senderName || '',
    at: best.createdAt || null,
    messageId: best.id || null,
  };
}
