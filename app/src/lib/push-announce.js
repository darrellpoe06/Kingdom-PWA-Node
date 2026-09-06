// =============================================================================
// push-announce — the two calls that actually make a phone buzz
// =============================================================================
// DR-0334 built the plumbing (crypto, service worker, schema, sender) and the
// opt-in control. This is the last piece: the two places the app ASKS for a
// notification to go out.
//
//   announceLive()      a director says the service started
//   notifyNewMessage()  someone sent you a direct message
//
// BOTH ARE FIRE-AND-FORGET BY DESIGN, and that is the most important property
// in this file. A notification is a courtesy on top of an action that has
// already succeeded — the service is live whether or not the push lands, and
// the message is safely in the database before this is called. So a failure
// here must NEVER fail the thing the person actually did. Every path resolves;
// nothing throws; the result says what happened so a caller that wants to show
// it can, and a caller that does not can ignore it.
//
// The sender is same-origin (`/api/push-send`), so the VAPID private key stays
// in the Pages environment and never reaches a browser. Authorization rides the
// caller's own Supabase JWT — for a live announcement the function proves the
// caller is on the church roster by writing `church_live_state` AS THEM and
// letting RLS decide, so there is no second copy of the roster rule to drift.
import { supabase as defaultSupabase } from './supabase.js';
import { liveAnnouncement, messageAnnouncement, dedupeKeyFor } from './push-send-policy.js';

export const PUSH_SEND_URL = '/api/push-send';

/** The app path a notification tap should land on, per topic. */
export const LANDING = {
  live: '/poetech-app/?tab=church',
  message: '/poetech-app/?tab=messages',
};

async function accessToken(supabase) {
  try {
    const { data } = await supabase.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  } catch {
    return null;
  }
}

/**
 * POST to the sender. Never throws; always resolves to a plain result.
 * A 503 `not-configured` is reported distinctly from a failure — the difference
 * between "nobody has set up VAPID yet" and "it broke" is exactly what kept the
 * original gap invisible for months.
 */
async function post(body, { supabase, fetchImpl }) {
  const token = await accessToken(supabase);
  if (!token) return { ok: false, reason: 'signed-out' };
  try {
    const res = await fetchImpl(PUSH_SEND_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* a proxy may answer non-JSON */ }
    if (res.status === 503) return { ok: false, reason: 'not-configured', detail: json && json.missing };
    if (res.status === 403) return { ok: false, reason: 'forbidden' };
    if (!res.ok) return { ok: false, reason: `http-${res.status}`, detail: json && json.error };
    // The sender answers `deduped` when this exact announcement already went
    // out — a double-tapped button is a success, not an error.
    return { ok: true, ...(json || {}) };
  } catch (err) {
    return { ok: false, reason: 'unreachable', detail: String(err && err.message ? err.message : err) };
  }
}

/**
 * Announce that a service has started.
 *
 * `isLive: true` is sent explicitly and the sender REFUSES the announcement
 * without it (push-send-policy). That is deliberate: the app's schedule-window
 * `liveStatus()` is a UI hint that never knows whether a stream actually
 * started, and buzzing a congregation for a service that did not start is a
 * fabricated state delivered into a pocket. Only a real declaration gets here.
 */
export async function announceLive({
  instanceId, churchId, churchName, serviceLabel, videoId,
  supabase = defaultSupabase,
  fetchImpl = typeof fetch !== 'undefined' ? fetch : null,
  at,
} = {}) {
  if (!instanceId || !churchId) return { ok: false, reason: 'missing-church' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'no-fetch' };
  const words = liveAnnouncement({ churchName, serviceLabel });
  return post({
    topic: 'live',
    isLive: true,
    instanceId,
    churchId,
    videoId: videoId || null,
    serviceLabel: serviceLabel || null,
    title: words.title,
    body: words.body,
    url: LANDING.live,
    dedupeKey: dedupeKeyFor({ topic: 'live', churchId, videoId, at }),
  }, { supabase, fetchImpl });
}

/**
 * Tell one person a message is waiting.
 *
 * THE PUSH NAMES THE SENDER AND NEVER THE MESSAGE. Direct messages are
 * end-to-end encrypted (dm-encryption.js) and a push renders on a LOCK SCREEN,
 * in public, to whoever is holding the phone. Putting the text there would
 * quietly undo the encryption for the last three feet and make a prayer request
 * readable over someone's shoulder. The words come from
 * `messageAnnouncement()` so there is exactly one place this decision lives.
 */
export async function notifyNewMessage({
  instanceId, recipientUserId, messageId, senderName,
  supabase = defaultSupabase,
  fetchImpl = typeof fetch !== 'undefined' ? fetch : null,
} = {}) {
  if (!instanceId || !recipientUserId || !messageId) return { ok: false, reason: 'missing-target' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'no-fetch' };
  const words = messageAnnouncement({ senderName });
  return post({
    topic: 'message',
    instanceId,
    messageId,
    userIds: [recipientUserId],
    title: words.title,
    body: words.body,
    url: LANDING.message,
  }, { supabase, fetchImpl });
}
