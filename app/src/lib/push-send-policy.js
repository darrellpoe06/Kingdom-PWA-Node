// =============================================================================
// push-send-policy — what a send request must say, and what it is allowed to say
// =============================================================================
// The pure decision layer under app/functions/api/push-send.js. It exists apart
// from the function so the rules that decide WHO gets buzzed and WHY can be
// tested without a network, an environment, or a database.
//
// The governing idea: a notification is an intrusion into someone's pocket, so
// every send must be able to answer three questions before it happens —
//   • WHAT is being claimed? (a title, always; never an empty buzz)
//   • WHY is it true? (the live topic requires a real state transition, not a
//     schedule guess — see migration 0170 and church-live.js)
//   • HAS IT ALREADY BEEN SAID? (a deterministic dedupe key, so a retried
//     webhook or a double-tapped button cannot buzz a congregation twice)
// A request that cannot answer all three is refused here, before any device is
// touched.

export const SENDABLE_TOPICS = ['live', 'message'];

/** Titles/bodies are shown on a lock screen; keep them short and unsurprising. */
export const MAX_TITLE = 80;
export const MAX_BODY = 160;

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * A deterministic dedupe key. The SAME real-world event must always produce the
 * SAME key, or the lock does not lock.
 *
 * For `live`, the key is the church plus the go-live minute: a double click
 * inside the same minute is one announcement, while a genuinely new service
 * later that day is a new one. (Minute rather than second, because two clicks
 * two seconds apart are the case this is defending against.)
 */
export function dedupeKeyFor({ topic, churchId, videoId, messageId, at }) {
  if (topic === 'live') {
    const minute = new Date(at || Date.now()).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    return `live:${churchId || 'church'}:${videoId || 'none'}:${minute}`;
  }
  if (topic === 'message') {
    // A message is a unique row; its id IS the natural key.
    return `message:${messageId}`;
  }
  return `${topic}:${str(churchId) || 'x'}:${new Date(at || Date.now()).toISOString()}`;
}

/**
 * Validate an incoming send request.
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateSendRequest(body) {
  const b = body && typeof body === 'object' ? body : {};
  const topic = str(b.topic);
  if (!SENDABLE_TOPICS.includes(topic)) {
    return { ok: false, error: `topic must be one of ${SENDABLE_TOPICS.join(', ')}` };
  }
  const instanceId = str(b.instanceId);
  if (!instanceId) return { ok: false, error: 'instanceId is required' };

  const title = str(b.title);
  if (!title) return { ok: false, error: 'title is required — a push with no claim is just a buzz' };

  // A `live` announcement is the loudest thing this system does. It may only be
  // sent for a REAL transition into live, never on a schedule guess (DR-0076;
  // church-live.js is explicit that a painted LIVE badge is a fabricated state).
  if (topic === 'live') {
    if (b.isLive !== true) {
      return { ok: false, error: 'a live announcement requires isLive:true — we never announce a service we cannot confirm started' };
    }
    if (!str(b.churchId)) return { ok: false, error: 'churchId is required for a live announcement' };
  }

  if (topic === 'message' && !str(b.messageId)) {
    return { ok: false, error: 'messageId is required for a message notification (it is the dedupe key)' };
  }

  const url = str(b.url);
  const sameOrigin = url && url.charAt(0) === '/' && url.charAt(1) !== '/' && url.charAt(1) !== '\\';

  return {
    ok: true,
    value: {
      topic,
      instanceId,
      churchId: str(b.churchId) || null,
      videoId: str(b.videoId) || null,
      messageId: str(b.messageId) || null,
      isLive: b.isLive === true,
      title: title.slice(0, MAX_TITLE),
      body: str(b.body).slice(0, MAX_BODY),
      url: sameOrigin ? url : null,
      // An explicit audience (a DM's recipient); absent, everyone opted in.
      userIds: Array.isArray(b.userIds) ? b.userIds.filter((u) => typeof u === 'string' && u) : null,
      dedupeKey: str(b.dedupeKey) || dedupeKeyFor({
        topic, churchId: str(b.churchId), videoId: str(b.videoId),
        messageId: str(b.messageId), at: b.at,
      }),
    },
  };
}

/**
 * The words a congregation actually sees when a service starts.
 * Deliberately plain: it states what happened and nothing more. No hype, no
 * claim we cannot stand behind, and the service's own label when we have one.
 */
export function liveAnnouncement({ churchName, serviceLabel } = {}) {
  const who = str(churchName) || 'The Love Corner';
  const what = str(serviceLabel);
  return {
    title: `${who} is live`.slice(0, MAX_TITLE),
    body: (what ? `${what} has started.` : 'The service has started.').slice(0, MAX_BODY),
  };
}

/**
 * The words for an inbound message. The SENDER'S NAME is shown; the message
 * BODY is not.
 *
 * That is deliberate and it is a privacy decision, not an oversight. A push
 * notification renders on a LOCK SCREEN, in public, to whoever is holding the
 * phone. Direct messages in this app are end-to-end encrypted
 * (app/src/lib/dm-encryption.js) — putting the plaintext into a push would
 * quietly undo that for the last three feet, and a prayer request or a pastoral
 * confidence would be readable over someone's shoulder on a bus. So the push
 * says who, and the app says what.
 */
export function messageAnnouncement({ senderName } = {}) {
  const who = str(senderName) || 'Someone';
  return {
    title: `${who} sent you a message`.slice(0, MAX_TITLE),
    body: 'Open the app to read it.',
  };
}

/**
 * WHO is read from `push_subscriptions` for this send — as PostgREST query
 * params, built in one tested place.
 *
 * A `live` announcement is a CONGREGATION: every device in the church's
 * instance that opted into `live`. A `message` is a PERSON: the recipient's
 * devices wherever they turned notifications on. That second half is the
 * 2026-09-09 fix — a phone is filed under whichever instance was active when
 * its owner tapped ON (the family space, the church door, a ministry), and the
 * message's tenant is whichever space the two people share. Filtering a
 * person's phone by the message's instance found nothing and buzzed nobody,
 * with every layer reporting success. The person IS the authorization here
 * (the row's user_id is theirs; `users_can_dm` already gated the message), so
 * the instance is dropped whenever an explicit audience is named.
 *
 * @returns {URLSearchParams}
 */
export function audienceQuery({ topic, instanceId, userIds }) {
  const params = new URLSearchParams();
  params.set('select', 'id,endpoint,p256dh,auth,user_id,disabled_at');
  params.set('topics', `cs.{${topic}}`);
  params.set('disabled_at', 'is.null');
  const people = Array.isArray(userIds) ? userIds.filter((u) => typeof u === 'string' && u) : [];
  if (people.length) {
    params.set('user_id', `in.(${people.join(',')})`);
  } else {
    params.set('instance_id', `eq.${instanceId}`);
  }
  return params;
}

/**
 * ONE PERSON, TWO DOORS, EVERY PHONE (2026-09-09, Darrell: "I text my self and
 * never got it... why?"). He was signed in as his phone account and messaged
 * "darrellpoe06" — his email account, a second auth.users row linked to the
 * same person by `person_links` (0141, DR-0311). His phone's subscription is
 * filed under the account that tapped ON; the message named the other. A
 * person's audience is every user id that IS that person: the ids named plus
 * every id `person_links` joins to them, either direction. Pure over the rows
 * the sender read; order-free; never drops the ids it was given.
 *
 * @param {string[]} userIds   the recipients named by the send
 * @param {Array<{primary_user:string, door_user:string}>} linkRows  person_links rows touching any of them
 * @returns {string[]} the union, deduplicated
 */
export function expandAudience(userIds, linkRows) {
  const out = new Set((userIds || []).filter((u) => typeof u === 'string' && u));
  for (const r of linkRows || []) {
    if (!r) continue;
    const a = typeof r.primary_user === 'string' ? r.primary_user : '';
    const b = typeof r.door_user === 'string' ? r.door_user : '';
    if ((a && out.has(a)) || (b && out.has(b))) { if (a) out.add(a); if (b) out.add(b); }
  }
  return [...out];
}
