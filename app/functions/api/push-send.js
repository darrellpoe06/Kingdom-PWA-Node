// =============================================================================
// /api/push-send — the sender. One announcement, many phones, exactly once.
// =============================================================================
// Darrell, 2026-09-06: "My phone didn't notify me of the livestream inside the
// Love Corner App... why not... fix that so users are prompted the sermon is
// live... and also to notifications from users who text us."
//
// This function is deliberately THIN. Everything that can be reasoned about
// lives in tested modules — push-send-policy.js (what a send may claim),
// push-fanout.js (delivery, pruning, the budget cap), webpush-crypto.js (RFC
// 8291 encryption and RFC 8292 VAPID). What is left here is I/O: authorize,
// take the lock, read, send, record.
//
// ── AUTHORIZATION IS PROVEN BY THE DATABASE, NOT RE-IMPLEMENTED HERE ────────
// The obvious design is to re-check "is this caller allowed to announce?" in
// function code. That duplicates the roster rule and lets the two drift, and a
// drifted authorization check is how someone eventually buzzes a congregation
// they do not belong to. Instead, for a `live` send the function first writes
// `church_live_state` USING THE CALLER'S OWN JWT. That table's RLS already
// restricts writes to people on the church roster (migration 0170). If the
// write succeeds, the caller was authorized — by the same policy every other
// surface obeys. If RLS rejects it, so do we. The write is also the point:
// the live state is recorded before anything is announced, so the app's own
// surfaces and the notification always agree.
//
// The SERVICE KEY is used only AFTER that check, and only for the two things a
// user genuinely cannot do themselves: read other people's subscription rows,
// and write the send ledger. It never reaches a browser.
//
// ── THE THREE BRAKES (CLAUDE.md, 2026-06-08) ────────────────────────────────
// This is event-driven, not timer-driven — nothing here fires on a clock, so
// it is not the runaway class. It still carries the brakes that matter for
// something that buzzes people:
//   BUDGET — MAX_DEVICES_PER_SEND in push-fanout, plus payload and audience
//            caps in push-send-policy.
//   LOCK   — the UNIQUE dedupe_key insert below. A duplicate insert returns
//            409 and the function STOPS, having sent nothing.
//   STOP   — per-device opt-in (`topics`), `disabled_at`, and a subscriber's
//            own delete. Absence of consent is the default state.
import { validateSendRequest } from '../../src/lib/push-send-policy.js';
import { fanOut, buildPushPayload } from '../../src/lib/push-fanout.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

function rest(supabaseUrl, path) {
  return `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`;
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const supabaseUrl = asStr(env.SUPABASE_URL);
  const serviceKey = asStr(env.SUPABASE_SERVICE_KEY);
  const anonKey = asStr(env.SUPABASE_ANON_KEY) || asStr(env.VITE_SUPABASE_ANON_KEY);
  const vapid = {
    subject: asStr(env.VAPID_SUBJECT),
    publicKey: asStr(env.VAPID_PUBLIC_KEY),
    privateKey: asStr(env.VAPID_PRIVATE_KEY),
  };

  // A missing key is reported as NOT CONFIGURED rather than as a failure to
  // send. The difference matters: one is "nobody set this up yet", the other is
  // "it broke". Conflating them is how the original gap stayed invisible.
  if (!supabaseUrl || !serviceKey) return json({ error: 'not-configured', missing: 'supabase' }, 503);
  if (!vapid.subject || !vapid.publicKey || !vapid.privateKey) {
    return json({ error: 'not-configured', missing: 'vapid' }, 503);
  }

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'bad-json' }, 400); }

  const check = validateSendRequest(body);
  if (!check.ok) return json({ error: 'bad-request', detail: check.error }, 400);
  const req = check.value;

  // ── 1. AUTHORIZE ─────────────────────────────────────────────────────────
  const authz = asStr(context.request.headers.get('authorization'));
  const userJwt = /^Bearer\s+(.+)$/i.exec(authz)?.[1] || '';
  const machineToken = asStr(context.request.headers.get('x-push-token'));
  const machineOk = !!asStr(env.PUSH_SEND_TOKEN) && machineToken === asStr(env.PUSH_SEND_TOKEN);

  if (!userJwt && !machineOk) return json({ error: 'unauthorized' }, 401);

  if (req.topic === 'live') {
    // The write IS the authorization check (see the header note). A machine
    // caller carrying PUSH_SEND_TOKEN writes with the service key and records
    // source 'nas'; a person writes with their own JWT and RLS decides.
    const useKey = machineOk && !userJwt ? serviceKey : anonKey;
    const useAuth = machineOk && !userJwt ? serviceKey : userJwt;
    if (!useKey) return json({ error: 'not-configured', missing: 'anon-key' }, 503);

    let wrote;
    try {
      wrote = await fetch(rest(supabaseUrl, 'church_live_state?on_conflict=instance_id,church_id'), {
        method: 'POST',
        headers: {
          apikey: useKey,
          Authorization: `Bearer ${useAuth}`,
          'content-type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify([{
          instance_id: req.instanceId,
          church_id: req.churchId,
          is_live: true,
          video_id: req.videoId,
          title: req.title,
          service_label: asStr(body.serviceLabel) || null,
          started_at: new Date().toISOString(),
          ended_at: null,
          source: machineOk && !userJwt ? 'nas' : 'director',
          updated_at: new Date().toISOString(),
        }]),
      });
    } catch {
      return json({ error: 'live-state-unreachable' }, 502);
    }
    if (wrote.status === 401 || wrote.status === 403) {
      return json({ error: 'forbidden', detail: 'not on this church roster' }, 403);
    }
    if (!wrote.ok) return json({ error: `live-state-${wrote.status}` }, 502);
  } else if (!machineOk && !userJwt) {
    return json({ error: 'unauthorized' }, 401);
  }

  // ── 2. TAKE THE LOCK ─────────────────────────────────────────────────────
  // A unique dedupe_key. If this insert conflicts, the announcement has
  // already gone out and we send NOTHING. This is what makes a double-tapped
  // Go Live button, or a webhook retried by an impatient upstream, harmless.
  let sendRow;
  try {
    const res = await fetch(rest(supabaseUrl, 'push_sends'), {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{
        instance_id: req.instanceId,
        topic: req.topic,
        dedupe_key: req.dedupeKey,
        title: req.title,
        body: req.body || null,
        url: req.url,
      }]),
    });
    if (res.status === 409) {
      return json({ ok: true, deduped: true, dedupeKey: req.dedupeKey, sent: 0 });
    }
    if (!res.ok) return json({ error: `ledger-${res.status}` }, 502);
    sendRow = (await res.json())[0];
  } catch {
    return json({ error: 'ledger-unreachable' }, 502);
  }

  // ── 3. READ THE AUDIENCE ─────────────────────────────────────────────────
  // Only devices that opted into THIS topic and are not disabled. Absence of
  // an opt-in is a no, always.
  let subs = [];
  try {
    const params = new URLSearchParams();
    params.set('select', 'id,endpoint,p256dh,auth,user_id,disabled_at');
    params.set('instance_id', `eq.${req.instanceId}`);
    params.set('topics', `cs.{${req.topic}}`);
    params.set('disabled_at', 'is.null');
    if (req.userIds && req.userIds.length) params.set('user_id', `in.(${req.userIds.join(',')})`);
    const res = await fetch(`${rest(supabaseUrl, 'push_subscriptions')}?${params}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return json({ error: `subscribers-${res.status}` }, 502);
    subs = await res.json();
  } catch {
    return json({ error: 'subscribers-unreachable' }, 502);
  }

  // ── 4. SEND ──────────────────────────────────────────────────────────────
  const payload = buildPushPayload({
    kind: req.topic, title: req.title, body: req.body, url: req.url, tag: req.dedupeKey,
  });
  const result = await fanOut({
    subscriptions: subs, payload, vapid, dedupeKey: req.dedupeKey, fetchImpl: fetch,
  });

  // ── 5. PRUNE AND RECORD ──────────────────────────────────────────────────
  // A 404/410 means the subscription is gone for good. Deleting it keeps the
  // success rate meaningful instead of dragging a growing tail of dead rows.
  let pruned = 0;
  if (result.gone.length) {
    try {
      const list = result.gone.map((e) => `"${e.replace(/"/g, '\\"')}"`).join(',');
      const res = await fetch(`${rest(supabaseUrl, 'push_subscriptions')}?endpoint=in.(${encodeURIComponent(list)})`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'return=minimal' },
      });
      if (res.ok) pruned = result.gone.length;
    } catch { /* pruning is best-effort; the next send tries again */ }
  }

  if (sendRow && sendRow.id) {
    try {
      await fetch(`${rest(supabaseUrl, 'push_sends')}?id=eq.${sendRow.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          device_count: result.attempted,
          success_count: result.succeeded,
          failure_count: result.failed,
          pruned_count: pruned,
        }),
      });
    } catch { /* the send already happened; the ledger count is not worth a 502 */ }
  }

  // The response is the measured answer to "did it go out?" — the question
  // that had none before this existed.
  return json({
    ok: true,
    dedupeKey: req.dedupeKey,
    attempted: result.attempted,
    succeeded: result.succeeded,
    failed: result.failed,
    skipped: result.skipped,
    pruned,
    capped: result.capped,
  });
}

/** Anything but POST is refused outright — no GET side effects, ever. */
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'method-not-allowed' }, 405);
}
