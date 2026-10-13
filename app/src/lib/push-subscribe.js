// =============================================================================
// push-subscribe — the client half: opt in, persist, and always be able to stop
// =============================================================================
// Darrell, 2026-09-06: "fix that so users are prompted the sermon is live...
// and also to notifications from users who text us."
//
// This module turns a person's YES into a row the sender can reach. Every
// browser-facing dependency is INJECTED (`registration`, `supabase`,
// `notification`), so the whole decision surface is testable without a browser
// — which matters because the interesting cases here are the refusals, and a
// refusal that behaves wrongly is invisible until someone is annoyed or, worse,
// cannot make the buzzing stop.
//
// THREE RULES THIS FILE KEEPS.
//
//   1. NEVER PROMPT UNASKED. `Notification.requestPermission()` can only be
//      called from a user gesture, and a permission prompt fired on page load
//      is how an app gets permanently DENIED — after which no fix reaches that
//      person short of them digging through browser settings. So enabling is
//      always explicit, and `permissionState()` is the read-only check a
//      surface uses to decide what to render.
//   2. UNSUBSCRIBING ALWAYS WORKS. `disablePush` tears down the browser
//      subscription EVEN IF the database delete fails, and reports the partial
//      outcome honestly. A person who wants the notifications to stop must
//      never be held hostage to a network error. (The row is then a dead
//      endpoint the sender prunes on its next 404/410 — see push-fanout.)
//   3. THE ENDPOINT IS THE IDENTITY. Browsers rotate subscriptions; the same
//      person on the same phone can produce a new endpoint at any time. Rows
//      are UPSERTed on `endpoint` (unique index, migration 0170), so
//      re-subscribing updates rather than piling up duplicates that would each
//      buzz the same pocket.
//
// The VAPID public key is PUBLIC by design — it is the identity the push
// service checks the signature against. The private half never leaves the
// sender's environment.

/** The topics a device can opt into. Absent a topic, that device is not sent it. */
export const PUSH_TOPICS = ['live', 'message'];

export const TOPIC_LABELS = {
  live: 'Tell me when a service goes live',
  message: 'Tell me when someone messages me',
};

/** Feature detection — all three pieces are required, and Safari lagged badly. */
export function pushSupported(win = typeof window !== 'undefined' ? window : undefined) {
  return !!(win
    && 'serviceWorker' in (win.navigator || {})
    && 'PushManager' in win
    && 'Notification' in win);
}

/**
 * The current permission, without ever prompting.
 * Returns 'unsupported' | 'default' | 'granted' | 'denied'.
 */
export function permissionState(win = typeof window !== 'undefined' ? window : undefined) {
  if (!pushSupported(win)) return 'unsupported';
  return win.Notification.permission;
}

/** VAPID keys travel as base64url; applicationServerKey wants raw bytes. */
export function vapidKeyToBytes(base64url) {
  const s = String(base64url || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  if (out.length !== 65 || out[0] !== 0x04) {
    throw new Error('VAPID public key must be a 65-byte uncompressed P-256 point');
  }
  return out;
}

/** Turn a PushSubscription into the row shape migration 0170 defines. */
export function subscriptionToRow(subscription, { instanceId, userId, topics, userAgent, label } = {}) {
  const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription;
  const keys = json.keys || {};
  if (!json.endpoint) throw new Error('subscription has no endpoint');
  if (!keys.p256dh || !keys.auth) throw new Error('subscription is missing its keys');
  const wanted = Array.isArray(topics) && topics.length
    ? topics.filter((t) => PUSH_TOPICS.includes(t))
    : PUSH_TOPICS.slice();
  return {
    instance_id: instanceId,
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    topics: wanted,
    user_agent: userAgent || null,
    label: label || null,
    last_seen_at: new Date().toISOString(),
    // A device coming back must not stay disabled from an old prune.
    disabled_at: null,
    disabled_reason: null,
    failure_count: 0,
  };
}

/**
 * Opt this device in. MUST be called from a user gesture.
 *
 * @returns {Promise<{ ok, reason?, subscription?, row? }>} — a refusal is a
 *   RESULT, not an exception, so a caller can render the right explanation.
 */
export async function enablePush({
  registration, supabase, vapidPublicKey, instanceId, userId, topics,
  win = typeof window !== 'undefined' ? window : undefined,
}) {
  if (!pushSupported(win)) return { ok: false, reason: 'unsupported' };
  if (!vapidPublicKey) return { ok: false, reason: 'not-configured' };
  if (!registration || !registration.pushManager) return { ok: false, reason: 'no-service-worker' };
  if (!instanceId || !userId) return { ok: false, reason: 'not-signed-in' };

  // Asking again when already denied is pointless — browsers do not re-prompt.
  // Saying so lets the UI explain the browser-settings route instead of
  // pretending a button will help.
  if (win.Notification.permission === 'denied') return { ok: false, reason: 'denied' };

  if (win.Notification.permission !== 'granted') {
    const granted = await win.Notification.requestPermission();
    if (granted !== 'granted') return { ok: false, reason: granted === 'denied' ? 'denied' : 'dismissed' };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        // Required by every current browser: a push must be user-visible.
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToBytes(vapidPublicKey),
      });
    } catch (err) {
      return { ok: false, reason: 'subscribe-failed', error: String(err && err.message ? err.message : err) };
    }
  }

  const row = subscriptionToRow(subscription, {
    instanceId, userId, topics,
    userAgent: win.navigator && win.navigator.userAgent ? String(win.navigator.userAgent).slice(0, 300) : null,
  });

  // UPSERT on the endpoint: a rotated or repeated subscribe updates one row.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' });
  if (error) return { ok: false, reason: 'save-failed', error: error.message, subscription };

  return { ok: true, subscription, row };
}

/**
 * Opt this device out. Tears the browser subscription down FIRST and reports
 * honestly if the row could not also be removed — stopping the buzzing is the
 * part that must never depend on the network being up.
 */
export async function disablePush({ registration, supabase }) {
  let endpoint = null;
  let unsubscribed = false;

  if (registration && registration.pushManager) {
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      endpoint = sub.endpoint;
      try {
        unsubscribed = await sub.unsubscribe();
      } catch {
        unsubscribed = false;
      }
    }
  }
  if (!endpoint) return { ok: true, unsubscribed, rowDeleted: false, reason: 'not-subscribed' };

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  // The browser subscription is already gone, so the person stops being
  // notified either way; a stale row is pruned by the sender's next 404/410.
  return { ok: true, unsubscribed, rowDeleted: !error, error: error ? error.message : undefined };
}

/** Change which topics this device wants, without re-prompting for permission. */
export async function updateTopics({ registration, supabase, topics }) {
  const wanted = (Array.isArray(topics) ? topics : []).filter((t) => PUSH_TOPICS.includes(t));
  if (!registration || !registration.pushManager) return { ok: false, reason: 'no-service-worker' };
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return { ok: false, reason: 'not-subscribed' };

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ topics: wanted, last_seen_at: new Date().toISOString() })
    .eq('endpoint', sub.endpoint);
  return error ? { ok: false, reason: 'save-failed', error: error.message } : { ok: true, topics: wanted };
}

/**
 * What a surface needs to render the control truthfully: is this device
 * actually subscribed right now, and what is the permission?
 * A UI that shows "notifications on" from a saved preference rather than the
 * live subscription is painting state (Reality-Trace P15).
 */
export async function pushStatus({ registration, win = typeof window !== 'undefined' ? window : undefined }) {
  const permission = permissionState(win);
  if (permission === 'unsupported') return { supported: false, permission, subscribed: false };
  let subscribed = false;
  if (registration && registration.pushManager) {
    subscribed = !!(await registration.pushManager.getSubscription());
  }
  return { supported: true, permission, subscribed };
}
