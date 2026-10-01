// =============================================================================
// direct-messages-sync — Supabase I/O for 1:1 DMs + report-to-security.
// =============================================================================
// The privacy model is enforced server-side (RLS + users_can_dm) in
// infra/supabase/migrations-auto/0096-direct-messages-security.sql. This client
// just calls, streams, and never invents access. Pure threading/shapes live in
// lib/direct-messages.js and are re-exported here.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { notifyNewMessage } from './push-announce.js';
import { toDmShape, toSecurityReportShape } from './direct-messages.js';
import {
  ensureDmKeypair, deriveDmKey, encryptDmBody, decryptDmBody,
  isEncryptedBody, isSealedV2, sealedEnvelope, sealedForDevice, sealForDevices, openSealed,
  ensureDmDeviceId, LOCKED_PLACEHOLDER, LOCKED_BEFORE_THIS_DEVICE,
} from './dm-encryption.js';
import { deviceLabel } from './device-trust.js';

export * from './direct-messages.js';
export { isEncryptedBody, isSealedV2, LOCKED_PLACEHOLDER, LOCKED_BEFORE_THIS_DEVICE } from './dm-encryption.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveName(session, explicit) {
  const t = (explicit || '').trim();
  if (t) return t;
  return session?.user?.email?.split('@')[0] || 'Someone';
}

// --- End-to-end encryption (dm-encryption.js; keys live on the device) -------
// My keypair is created on first use on THIS device. My public key is
// published two ways: to dm_device_keys (0249, one row per user AND device,
// DR-0737) so a sender can seal to every device I hold, and still to
// dm_public_keys (0118, one row per user) so an app that has not updated yet
// can seal v1 to my latest key. A message is sealed ONCE and its content key
// is wrapped for every device of both people, so it opens on each of the
// recipient's devices and on the sender's own other devices too.
//
// WHY (Darrell 2026-10-01: "sometimes I can see it and others not on the same
// device... I actually want it to work on multiple devices"): with one key per
// account, every device that opened Messages published over the last one, so
// a message was sealed to whichever device had published most recently, and
// which messages a phone could open flipped each time another device opened
// Messages. Measured 2026-10-01 on the live database (sovereign-read dm_keys).
const pairKeysCache = new Map();   // `${me}|${other}` -> Promise<CryptoKey[]> (v1: every key they ever published that we know)
const deviceKeysCache = new Map(); // userId -> Promise<[{deviceId, publicJwk, label, lastSeenAt}]>
const DEVICE_KEYS_TTL_MS = 60 * 1000;
const deviceKeysAt = new Map();    // userId -> when fetched

/** Tests and sign-out: every remembered key is forgotten. */
export function resetDmKeyCaches() {
  pairKeysCache.clear(); deviceKeysCache.clear(); deviceKeysAt.clear();
}

async function myKeypair(userId) {
  try { return await ensureDmKeypair(userId); } catch { return null; }
}
function myDeviceId() {
  try { return ensureDmDeviceId(); } catch { return null; }
}
function myDeviceLabel() {
  try { return String(deviceLabel() || '').slice(0, 80) || null; } catch { return null; }
}

// Publish my public key for THIS device (and the v1 row), so anyone allowed
// to DM me can seal to me here. Fire-and-forget from the surfaces; failures
// degrade to plaintext honestly.
export async function publishDmPublicKey() {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const kp = await myKeypair(session.user.id);
  if (!kp) return { skipped: 'no-crypto' };
  const deviceId = myDeviceId();
  const out = { published: true, deviceId };
  const { error } = await supabase
    .from('dm_public_keys')
    .upsert({ user_id: session.user.id, public_jwk: kp.publicJwk }, { onConflict: 'user_id' });
  if (error) { out.published = false; out.skipped = 'publish-error'; out.error = error; }
  if (deviceId) {
    const r = await supabase
      .from('dm_device_keys')
      .upsert({ user_id: session.user.id, device_id: deviceId, public_jwk: kp.publicJwk, label: myDeviceLabel(), last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,device_id' });
    if (r && r.error) { out.deviceError = r.error; } else { out.devicePublished = true; }
    deviceKeysCache.delete(session.user.id); deviceKeysAt.delete(session.user.id);
  }
  return out;
}

async function fetchPublicKey(userId) {
  const { data, error } = await supabase
    .from('dm_public_keys').select('public_jwk').eq('user_id', userId).maybeSingle();
  if (error) return null;
  return data?.public_jwk ?? null;
}

// Every device a person has published a key for. Cached briefly; a decrypt
// that meets an unknown sending device refreshes it (below).
function deviceKeysOf(userId, { fresh = false } = {}) {
  const at = deviceKeysAt.get(userId) || 0;
  if (fresh || !deviceKeysCache.has(userId) || Date.now() - at > DEVICE_KEYS_TTL_MS) {
    deviceKeysAt.set(userId, Date.now());
    deviceKeysCache.set(userId, (async () => {
      const { data, error } = await supabase
        .from('dm_device_keys').select('device_id,public_jwk,label,last_seen_at').eq('user_id', userId);
      if (error || !Array.isArray(data)) return [];
      return data.filter((r) => r && r.device_id && r.public_jwk)
        .map((r) => ({ deviceId: r.device_id, publicJwk: r.public_jwk, label: r.label || null, lastSeenAt: r.last_seen_at || null }));
    })().catch(() => []));
  }
  return deviceKeysCache.get(userId);
}

/** The devices that can open MY sealed messages: mine, with this one marked. */
export async function loadMyDmDevices() {
  const session = await currentSession();
  if (!session) return [];
  const me = myDeviceId();
  const rows = await deviceKeysOf(session.user.id, { fresh: true });
  return rows.map((r) => ({ ...r, thisDevice: r.deviceId === me }))
    .sort((a, b) => (a.thisDevice ? -1 : b.thisDevice ? 1 : String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || ''))));
}

/** Forget one of my devices: new messages are no longer sealed for it. Never this one. */
export async function forgetDmDevice(deviceId) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  if (!deviceId || deviceId === myDeviceId()) return { skipped: 'this-device' };
  const { error } = await supabase.from('dm_device_keys').delete().eq('user_id', session.user.id).eq('device_id', deviceId);
  deviceKeysCache.delete(session.user.id); deviceKeysAt.delete(session.user.id);
  return error ? { skipped: 'delete-error', error } : { forgotten: true };
}

// v1: every AES pair key I may share with `otherUserId` — one per public key
// of theirs we know (the v1 row first, then each device key). Symmetric, so a
// v1 body opens if ANY of them was the key in force when it was sealed. Null
// list when either side has no key — callers fall back.
function pairKeysWith(myUserId, otherUserId) {
  const slot = `${myUserId}|${otherUserId}`;
  if (!pairKeysCache.has(slot)) {
    pairKeysCache.set(slot, (async () => {
      const kp = await myKeypair(myUserId);
      if (!kp) return [];
      const jwks = [];
      const legacy = await fetchPublicKey(otherUserId);
      if (legacy) jwks.push(legacy);
      for (const d of await deviceKeysOf(otherUserId)) jwks.push(d.publicJwk);
      const keys = [];
      const seen = new Set();
      for (const jwk of jwks) {
        const id = JSON.stringify(jwk);
        if (seen.has(id)) continue;
        seen.add(id);
        const k = await deriveDmKey(kp.privateJwk, jwk);
        if (k) keys.push(k);
      }
      return keys;
    })().catch(() => []));
  }
  return pairKeysCache.get(slot);
}

// The public key of the device that sealed a v2 message: my own when it was
// this device, else fetched (and fetched again once if it is new to us).
async function senderDevicePublic(from, myUserId, kp) {
  const me = myDeviceId();
  if (from.userId === myUserId && from.deviceId === me) return kp ? kp.publicJwk : null;
  const find = (rows) => { const r = rows.find((d) => d.deviceId === from.deviceId); return r ? r.publicJwk : null; };
  let jwk = find(await deviceKeysOf(from.userId));
  if (!jwk) jwk = find(await deviceKeysOf(from.userId, { fresh: true }));
  return jwk;
}

// Open a shaped DM in place: a sealed body becomes plaintext when this
// device can open it, and an honest placeholder when not. v2 says WHY in its
// own words: sealed for the other devices before this one joined. Exported so
// the multi-device proof can run it per device without the stream.
export async function openDmShape(m, myUserId) {
  if (!isEncryptedBody(m.body)) return { ...m, encrypted: false, locked: false };
  let text = null;
  let placeholder = LOCKED_PLACEHOLDER;
  if (isSealedV2(m.body)) {
    const env = sealedEnvelope(m.body);
    const me = myDeviceId();
    if (env && me && sealedForDevice(m.body, myUserId, me)) {
      const kp = await myKeypair(myUserId);
      const senderPub = kp ? await senderDevicePublic(env.from, myUserId, kp) : null;
      text = senderPub ? await openSealed(m.body, { myPrivateJwk: kp.privateJwk, me: { userId: myUserId, deviceId: me }, senderPublicJwk: senderPub }) : null;
    } else {
      placeholder = LOCKED_BEFORE_THIS_DEVICE;
    }
  } else {
    const keys = m.otherUserId ? await pairKeysWith(myUserId, m.otherUserId) : [];
    for (const key of keys) {
      text = await decryptDmBody(m.body, key);
      if (text != null) break;
    }
  }
  return {
    ...m,
    encrypted: true,
    locked: text == null,
    body: text ?? placeholder,
  };
}

// --- Direct messages ---------------------------------------------------------
// Stream every DM I'm a party to (RLS already scopes to participant rows), then
// map to shapes from MY perspective. The surface groups them into threads.
// The realtime stream is the FAST path, never the ONLY path (measured
// 2026-08-22, Darrell + Christina both live: "I had to go out and come back in
// to see I had new messages" — the sovereign realtime leg is the stack's one
// sick container, so a surface that waits on its events waits forever). Three
// independent triggers keep the thread honest: the stream when it works, a
// 15-second heartbeat poll always, and an immediate refetch when the tab
// becomes visible again. The returned unsubscribe function also carries
// `.refresh()` so the surface can pull truth the instant the user acts
// (send, open, read) instead of waiting for any of the three.
const DM_HEARTBEAT_MS = 15000;
export function subscribeDirectMessages(onChange) {
  let channel = null;
  let cancelled = false;
  let timer = null;
  let onVisible = null;
  let refresh = async () => {};
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    // Make this device encryptable-to as soon as messaging opens anywhere.
    publishDmPublicKey().catch(() => {});
    const fetchAll = async () => {
      const { data, error } = await supabase.from('direct_messages').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('[dm-sync] fetch failed:', error); return null; }
      return Promise.all((data || []).map((r) => openDmShape(toDmShape(r, myUserId), myUserId)));
    };
    refresh = async () => {
      const rows = await fetchAll();
      if (rows && !cancelled) onChange(rows);
    };
    await refresh();
    channel = supabase
      .channel('direct_messages-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => { refresh(); })
      .subscribe();
    // Occurrence-based delivery stays PRIMARY (the stream fires per message);
    // the heartbeat is the net under a sick stream — and it never ticks while
    // the app is off-screen (Darrell 2026-08-22: "why does it need to be time
    // based instead of occurrence based?" — it doesn't; this is the backstop).
    timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      refresh();
    }, DM_HEARTBEAT_MS);
    if (typeof document !== 'undefined' && document.addEventListener) {
      onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
      document.addEventListener('visibilitychange', onVisible);
    }
  })();
  function unsubscribe() {
    cancelled = true;
    if (timer) clearInterval(timer);
    if (onVisible && typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    if (channel) supabase.removeChannel(channel);
  }
  unsubscribe.refresh = () => refresh();
  return unsubscribe;
}

// THE SPACE A THREAD BELONGS TO, AS THE NOTIFIER NEEDS IT (2026-09-16, DR-0444).
//
// Darrell: "I text Christina from the Love Corner App and receive a text from
// the PoeTech App... I also need the message to be sent from and received from
// the group it belongs to originally." The SEND half was already right --
// resolveDmInstance() below stamps the thread with the contact's own instance.
// The RECEIVE half had nothing to work with: the notification's landing was a
// hard-coded path into the personal door, because the only fact the send path
// held was an instance UUID, and a door is keyed by SLUG (app-doors.js). (That
// path is deliberately not written out here: client-path-parity scans source
// for same-origin path literals and rightly demands a provider for each one.)
//
// So this reads the two facts a notification needs about the thread's space --
// its slug (which door to open) and its display name (which house is calling,
// shown in the push body). `list_dm_contacts` does not project either, and
// widening an RPC used by every messaging surface for this is a bigger blast
// radius than one read; a member may SELECT their own instances already
// (instances_member_read, migration 0056), so no grant and no migration is
// needed. Cached per instance for the session -- a space's slug does not
// change while a phone is on -- and cached ONLY on success, so a network blip
// cannot pin "unknown" for the rest of the session. Every failure path resolves
// to nulls, which lands the notification on the personal door: the same place
// it landed before this existed, never an unopenable link.
const instanceFactsCache = new Map();

export async function instanceSpaceFacts(instanceId, client = supabase) {
  if (!instanceId) return { slug: null, name: null };
  if (instanceFactsCache.has(instanceId)) return instanceFactsCache.get(instanceId);
  try {
    const { data, error } = await client
      .from('instances')
      .select('slug,display_name')
      .eq('id', instanceId)
      .maybeSingle();
    if (!error && data) {
      const facts = { slug: data.slug || null, name: data.display_name || null };
      instanceFactsCache.set(instanceId, facts);
      return facts;
    }
  } catch { /* fall through to unknown */ }
  return { slug: null, name: null };
}

// The instance a DM rides: the contact's OWN space when the roster carried it
// (0124/review GAP 2 — a non-church-space contact must not be stamped with the
// church instance, or RLS correctly blocks the send), else the church fallback.
export function resolveDmInstance(contactInstanceId, fallbackInstanceId) {
  return contactInstanceId || fallbackInstanceId || null;
}

// `opts.requireEncryption` (DR-0639): a sender that must never ship plaintext
// — the lesson-review Messages, which carry a member's own situation — gets
// { skipped: 'no-key' } instead of the plaintext fallback, and nothing is sent.
export async function sendDirectMessage(recipientUserId, body, displayName, contactInstanceId, opts = {}) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };
  if (!recipientUserId) return { skipped: 'no-recipient' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const fallback = contactInstanceId ? null : await churchInstanceId(displayName);
  const tenantId = resolveDmInstance(contactInstanceId, fallback);
  if (!tenantId) return { skipped: 'no-instance' };
  // Seal end-to-end whenever the recipient has published a key; otherwise
  // the body ships plaintext (still RLS-guarded) and the result says so — the
  // surface tells the truth instead of pretending (DR-0076).
  // SEALED FOR EVERY DEVICE OF BOTH PEOPLE (DR-0737): every device key the
  // recipient has published, and every one of mine (this device included,
  // whether or not its row has landed yet), so my own words open on my other
  // phone too. A recipient with only a v1 key gets a v1 body, as before.
  let wire = text;
  let encrypted = false;
  let sealedFor = 0;
  try {
    const myId = session.user.id;
    const kp = await myKeypair(myId);
    const me = myDeviceId();
    if (kp && me) {
      const theirs = await deviceKeysOf(recipientUserId, { fresh: true });
      if (theirs.length) {
        const mine = await deviceKeysOf(myId, { fresh: true });
        const devices = [
          ...theirs.map((d) => ({ userId: recipientUserId, deviceId: d.deviceId, publicJwk: d.publicJwk })),
          ...mine.filter((d) => d.deviceId !== me).map((d) => ({ userId: myId, deviceId: d.deviceId, publicJwk: d.publicJwk })),
          { userId: myId, deviceId: me, publicJwk: kp.publicJwk },
        ];
        const sealed = await sealForDevices(text, { myPrivateJwk: kp.privateJwk, from: { userId: myId, deviceId: me }, devices });
        if (sealed) { wire = sealed; encrypted = true; sealedFor = devices.length; }
      }
    }
    if (!encrypted) {
      const keys = await pairKeysWith(session.user.id, recipientUserId);
      if (keys.length) {
        const sealed = await encryptDmBody(text, keys[0]);
        if (sealed) { wire = sealed; encrypted = true; }
      }
    }
  } catch { /* plaintext fallback */ }
  if (opts && opts.requireEncryption && !encrypted) return { skipped: 'no-key' };
  const senderName = resolveName(session, displayName);
  // `select('id')` so the new row's id is available as the push dedupe key —
  // a message is a unique row, so its id IS the natural key and a retried
  // notification for the same message can never buzz twice (DR-0334).
  const { data: inserted, error } = await supabase.from('direct_messages').insert({
    instance_id: tenantId,
    sender_user_id: session.user.id,
    recipient_user_id: recipientUserId,
    sender_name: senderName,
    body: wire,
  }).select('id').maybeSingle();
  // A blocked send is the RLS gate (users_can_dm) doing its job, not a bug.
  if (error) return { skipped: 'send-blocked', error };

  // TELL THEIR PHONE (DR-0334). Deliberately fire-and-forget and deliberately
  // AFTER the insert succeeded: the message is already safely delivered, so a
  // push that fails — VAPID unset, the device never opted in, the network gone
  // — must never turn a sent message into a failed one. Nothing is awaited into
  // the return value and nothing can throw out of here.
  //
  // The push carries the SENDER'S NAME and never the message text: these bodies
  // are end-to-end encrypted above, and a lock screen is public.
  // The report rides the result (2026-09-09: "I text my self and never got
  // it... why?" — the screen that sent it must be able to say what the push
  // did). Still never awaited into `sent`, still never throws.
  let push = null;
  if (inserted && inserted.id) {
    push = Promise.resolve()
      // The thread's OWN space decides where the tap lands and which house the
      // push names (DR-0444). A failed read is nulls, never a thrown send.
      .then(() => instanceSpaceFacts(tenantId))
      .then((space) => notifyNewMessage({
        instanceId: tenantId,
        instanceSlug: space.slug,
        spaceName: space.name,
        senderUserId: session.user.id,
        recipientUserId,
        messageId: inserted.id,
        senderName,
      }))
      .catch(() => ({ ok: false, reason: 'unreachable' }));
  }
  return { sent: true, encrypted, sealedFor, push };
}

// Pure dedupe for list_dm_contacts rows: one entry per user, preferring the
// leader row, KEEPING the row's instance_id (review GAP 2 — dropping it forced
// every send onto the church instance and blocked non-church contacts).
export function dedupeDmContacts(rows) {
  const by = new Map();
  for (const r of rows || []) {
    if (!r?.user_id) continue;
    const prev = by.get(r.user_id);
    if (!prev || (r.role === 'owner' || r.role === 'admin')) {
      by.set(r.user_id, {
        userId: r.user_id,
        displayName: r.display_name || 'Member',
        role: r.role || 'member',
        instanceId: r.instance_id || prev?.instanceId || null,
      });
    }
  }
  return [...by.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// Pure shape for list_dm_invited rows (0124): the leader's open invites,
// rendered as visible-but-pending chips — never an invisible empty world.
export function invitedFromRows(rows) {
  return (rows || [])
    .filter((r) => r && r.email)
    .map((r) => ({
      inviteId: r.invite_id || r.id || r.email,
      email: r.email,
      instanceId: r.instance_id || null,
      role: r.invite_role || 'member',
    }));
}

// The contact list the app-wide Messages surface offers (RPC list_dm_contacts,
// 0118 — mirrors users_can_dm). Materializes my own membership FIRST (an
// email-invited person's instance_members row is created by join_church_instance,
// which only sendDirectMessage used to reach — so an invited person could sign
// in, open Messages, and still see an empty roster; review GAP 1 ordering).
export async function loadDmContacts() {
  const session = await currentSession();
  if (!session) return [];
  await churchInstanceId().catch(() => null);
  const { data, error } = await supabase.rpc('list_dm_contacts');
  if (error) { console.warn('[dm-sync] contacts failed:', error); return []; }
  return dedupeDmContacts(data);
}

// The leader's open invites (0124). Degrades to [] before the migration lands
// or for non-leaders — the surface simply shows no pending chips.
export async function loadDmInvited() {
  const session = await currentSession();
  if (!session) return [];
  const { data, error } = await supabase.rpc('list_dm_invited');
  if (error) return [];
  return invitedFromRows(data);
}

// Mark every unread incoming message in a thread as read (RLS: recipient only).
export async function markThreadRead(otherUserId) {
  const session = await currentSession();
  if (!session || !otherUserId) return { skipped: 'noop' };
  const { error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_user_id', session.user.id)
    .eq('sender_user_id', otherUserId)
    .is('read_at', null);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// --- Security reports --------------------------------------------------------
export function subscribeSecurityReports(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('security_reports').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('[dm-sync] security fetch failed:', error); return null; }
      return (data || []).map((r) => toSecurityReportShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('security_reports-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_reports' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() { cancelled = true; if (channel) supabase.removeChannel(channel); };
}

// Anyone in the instance may report to security (RLS: user_in_instance).
export async function reportToSecurity(body, location, displayName) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-instance' };
  const { error } = await supabase.from('security_reports').insert({
    instance_id: tenantId,
    reporter_user_id: session.user.id,
    reporter_name: resolveName(session, displayName),
    body: text,
    location: (location || '').trim() || null,
  });
  return error ? { skipped: 'insert-error', error } : { sent: true };
}

// Security team triages (RLS: user_in_security). new -> acknowledged -> resolved.
export async function setSecurityReportStatus(id, status) {
  const session = await currentSession();
  const patch = { status };
  if (status === 'acknowledged') {
    patch.acknowledged_by = session?.session?.user?.id ?? null;
    patch.acknowledged_at = new Date().toISOString();
  }
  const { error } = await supabase.from('security_reports').update(patch).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// Is the signed-in user on the security team here? (Gates the triage view.)
export async function amISecurity(displayName) {
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return false;
  const { data, error } = await supabase.rpc('user_in_security', { instance_uuid: tenantId });
  if (error) { console.warn('[dm-sync] user_in_security failed:', error); return false; }
  return !!data;
}
