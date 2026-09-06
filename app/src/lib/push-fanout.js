// =============================================================================
// push-fanout — deliver one notification to many devices, honestly and once.
// =============================================================================
// The orchestration half of Web Push, kept PURE and injectable so it can be
// tested deterministically: it takes the subscription rows, a `fetch`, and the
// VAPID keys, and returns a measured result. No network setup, no Supabase, no
// environment — the Pages Function in app/functions/api/push-send.js supplies
// those and does nothing else.
//
// WHY THE SHAPE IS THIS SHAPE — the three things that go wrong when a system
// starts buzzing people's pockets, each answered here rather than discovered
// later in an apology:
//
//   1. DOUBLE-BUZZING. A retried webhook or a double-tapped Go Live button must
//      not notify a congregation twice. The caller holds the dedupe lock (a
//      UNIQUE dedupe_key insert, migration 0170); this module refuses to run at
//      all without a dedupe key so the lock can never be skipped by accident.
//   2. DEAD SUBSCRIPTIONS ACCUMULATING. A push service answers 404/410 when a
//      subscription is permanently gone (the app was uninstalled, the browser
//      cleared). Those rows must be PRUNED, not retried forever — otherwise
//      every future send drags a growing tail of failures and the success rate
//      stops meaning anything.
//   3. AN UNBOUNDED FAN-OUT. A send is a real cost and a real intrusion, so the
//      device count is capped and the result reports the cap being hit rather
//      than silently truncating. This is the budget half of the three-brakes
//      rule (CLAUDE.md, 2026-06-08) applied to notifications; the dedupe key is
//      the lock half, and the caller's own `disabled_at`/topic opt-in is the
//      stop path.
//
// Every outcome is COUNTED and returned. "Did the notification go out?" must
// have a measured answer — the absence of one is exactly what made Darrell's
// question on 2026-09-06 unanswerable.
import { encryptPushPayload, vapidAuthorization } from './webpush-crypto.js';

/** Hard ceiling on devices touched by a single send (the budget brake). */
export const MAX_DEVICES_PER_SEND = 2000;
/** How many push requests are in flight at once. */
export const DEFAULT_CONCURRENCY = 12;
/** How long a push service has to answer before we call it a failure. */
export const DEFAULT_TIMEOUT_MS = 10_000;
/** Push services reject large payloads; this is the safe practical ceiling. */
export const MAX_PAYLOAD_BYTES = 3800;

/** Status codes meaning "this subscription is gone for good — delete the row". */
export const GONE_STATUSES = [404, 410];

/**
 * Build the JSON body the service worker's push handler parses.
 * Kept here so the sender and the SW agree on one shape, and so the shape is
 * asserted in one place.
 */
export function buildPushPayload({ kind, title, body, url, tag, renotify }) {
  if (!title || typeof title !== 'string') throw new Error('a push must carry a title');
  const payload = { kind: kind || 'generic', title };
  if (typeof body === 'string' && body) payload.body = body;
  // Only same-origin paths survive; the SW enforces this too, but a sender that
  // never emits one is the better place to stop it.
  if (typeof url === 'string' && url.charAt(0) === '/' && url.charAt(1) !== '/' && url.charAt(1) !== '\\') {
    payload.url = url;
  }
  if (typeof tag === 'string' && tag) payload.tag = tag;
  if (renotify === true) payload.renotify = true;

  const json = JSON.stringify(payload);
  if (new TextEncoder().encode(json).length > MAX_PAYLOAD_BYTES) {
    throw new Error(`push payload exceeds ${MAX_PAYLOAD_BYTES} bytes`);
  }
  return json;
}

/** A subscription row is only usable if it carries all three browser values. */
export function isSendableSubscription(row) {
  return !!(row
    && typeof row.endpoint === 'string' && /^https:\/\//.test(row.endpoint)
    && typeof row.p256dh === 'string' && row.p256dh
    && typeof row.auth === 'string' && row.auth
    && !row.disabled_at);
}

/** Run `tasks` with bounded concurrency, preserving input order in the output. */
async function pooled(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Send one notification to one device.
 * Never throws: a transport failure is a RESULT, because one unreachable phone
 * must not abort the send to the rest of the congregation.
 */
export async function sendOne({
  subscription, payload, vapid, fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS, now,
}) {
  const endpoint = subscription.endpoint;
  try {
    const { body } = await encryptPushPayload({
      payload, p256dh: subscription.p256dh, auth: subscription.auth,
    });
    const auth = await vapidAuthorization({
      endpoint,
      subject: vapid.subject,
      publicKey: vapid.publicKey,
      privateKey: vapid.privateKey,
      now,
    });

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    let res;
    try {
      res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          ...auth,
          'Content-Encoding': 'aes128gcm',
          'Content-Type': 'application/octet-stream',
          // RFC 8030 §5.2 — how long the service should hold it for a phone
          // that is currently offline. A service starting is time-sensitive;
          // an hour is long enough to reach a phone that was in a pocket and
          // short enough that nobody is told about it after it ended.
          TTL: '3600',
          Urgency: 'normal',
        },
        body,
        signal: controller ? controller.signal : undefined,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }

    const status = res.status;
    if (status >= 200 && status < 300) return { endpoint, ok: true, status };
    return {
      endpoint,
      ok: false,
      status,
      // The one distinction that matters: gone forever vs. try again later.
      gone: GONE_STATUSES.includes(status),
    };
  } catch (err) {
    return { endpoint, ok: false, status: 0, gone: false, error: String(err && err.message ? err.message : err) };
  }
}

/**
 * Deliver one notification to every eligible device.
 *
 * @param {object} o
 * @param {Array}  o.subscriptions Rows from push_subscriptions.
 * @param {string} o.payload       The JSON body (from buildPushPayload).
 * @param {object} o.vapid         { subject, publicKey, privateKey }.
 * @param {string} o.dedupeKey     REQUIRED — proof the caller took the lock.
 * @param {Function} o.fetchImpl   Injected fetch.
 * @returns {Promise<{ attempted, succeeded, failed, gone, skipped, capped, results }>}
 */
export async function fanOut({
  subscriptions, payload, vapid, dedupeKey, fetchImpl,
  concurrency = DEFAULT_CONCURRENCY, timeoutMs = DEFAULT_TIMEOUT_MS,
  maxDevices = MAX_DEVICES_PER_SEND, now,
}) {
  // The lock is the caller's to take, but skipping it is not an option they
  // get to exercise silently. Refusing here is what makes the dedupe real.
  if (!dedupeKey || typeof dedupeKey !== 'string') {
    throw new Error('fanOut requires a dedupeKey — the double-send lock is not optional');
  }
  if (!vapid || !vapid.subject || !vapid.publicKey || !vapid.privateKey) {
    throw new Error('fanOut requires VAPID { subject, publicKey, privateKey }');
  }
  if (typeof fetchImpl !== 'function') throw new Error('fanOut requires a fetch implementation');

  const all = Array.isArray(subscriptions) ? subscriptions : [];
  const sendable = all.filter(isSendableSubscription);
  const skipped = all.length - sendable.length;
  const capped = sendable.length > maxDevices;
  const targets = capped ? sendable.slice(0, maxDevices) : sendable;

  const results = await pooled(
    targets.map((s) => () => sendOne({ subscription: s, payload, vapid, fetchImpl, timeoutMs, now })),
    concurrency,
  );

  const succeeded = results.filter((r) => r.ok).length;
  const gone = results.filter((r) => !r.ok && r.gone).map((r) => r.endpoint);
  return {
    attempted: targets.length,
    succeeded,
    failed: results.length - succeeded,
    gone,
    skipped,
    capped,
    results,
  };
}
