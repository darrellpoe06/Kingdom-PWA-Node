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
import { toDmShape, toSecurityReportShape } from './direct-messages.js';
import {
  ensureDmKeypair, deriveDmKey, encryptDmBody, decryptDmBody,
  isEncryptedBody, LOCKED_PLACEHOLDER,
} from './dm-encryption.js';

export * from './direct-messages.js';
export { isEncryptedBody, LOCKED_PLACEHOLDER } from './dm-encryption.js';

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
// My keypair is created on first use; my PUBLIC key is published to
// dm_public_keys (0118) so others can encrypt TO me. Pair keys are derived
// once per correspondent and cached for the session.
const pairKeyCache = new Map(); // otherUserId -> Promise<CryptoKey|null>

async function myKeypair(userId) {
  try { return await ensureDmKeypair(userId); } catch { return null; }
}

// Publish (upsert) my public key so anyone allowed to DM me can encrypt to me.
// Fire-and-forget from the surfaces; failures degrade to plaintext honestly.
export async function publishDmPublicKey() {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const kp = await myKeypair(session.user.id);
  if (!kp) return { skipped: 'no-crypto' };
  const { error } = await supabase
    .from('dm_public_keys')
    .upsert({ user_id: session.user.id, public_jwk: kp.publicJwk }, { onConflict: 'user_id' });
  return error ? { skipped: 'publish-error', error } : { published: true };
}

async function fetchPublicKey(userId) {
  const { data, error } = await supabase
    .from('dm_public_keys').select('public_jwk').eq('user_id', userId).maybeSingle();
  if (error) return null;
  return data?.public_jwk ?? null;
}

// The AES pair key I share with `otherUserId` (ECDH symmetry: both of us derive
// the same key). Null when either side has no key — callers fall back.
function sharedKeyWith(myUserId, otherUserId) {
  if (!pairKeyCache.has(otherUserId)) {
    pairKeyCache.set(otherUserId, (async () => {
      const kp = await myKeypair(myUserId);
      if (!kp) return null;
      const theirs = await fetchPublicKey(otherUserId);
      if (!theirs) return null;
      return deriveDmKey(kp.privateJwk, theirs);
    })().catch(() => null));
  }
  return pairKeyCache.get(otherUserId);
}

// Decrypt a shaped DM in place: encrypted bodies become plaintext when this
// device can derive the pair key, and the honest LOCKED_PLACEHOLDER when not.
async function decryptShape(m, myUserId) {
  if (!isEncryptedBody(m.body)) return { ...m, encrypted: false, locked: false };
  const key = m.otherUserId ? await sharedKeyWith(myUserId, m.otherUserId) : null;
  const text = key ? await decryptDmBody(m.body, key) : null;
  return {
    ...m,
    encrypted: true,
    locked: text == null,
    body: text ?? LOCKED_PLACEHOLDER,
  };
}

// --- Direct messages ---------------------------------------------------------
// Stream every DM I'm a party to (RLS already scopes to participant rows), then
// map to shapes from MY perspective. The surface groups them into threads.
export function subscribeDirectMessages(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    // Make this device encryptable-to as soon as messaging opens anywhere.
    publishDmPublicKey().catch(() => {});
    const fetchAll = async () => {
      const { data, error } = await supabase.from('direct_messages').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('[dm-sync] fetch failed:', error); return null; }
      return Promise.all((data || []).map((r) => decryptShape(toDmShape(r, myUserId), myUserId)));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('direct_messages-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() { cancelled = true; if (channel) supabase.removeChannel(channel); };
}

export async function sendDirectMessage(recipientUserId, body, displayName) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };
  if (!recipientUserId) return { skipped: 'no-recipient' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-instance' };
  // Encrypt end-to-end whenever the recipient has published a key; otherwise
  // the body ships plaintext (still RLS-guarded) and the result says so — the
  // surface tells the truth instead of pretending (DR-0076).
  let wire = text;
  let encrypted = false;
  try {
    const key = await sharedKeyWith(session.user.id, recipientUserId);
    if (key) {
      const sealed = await encryptDmBody(text, key);
      if (sealed) { wire = sealed; encrypted = true; }
    }
  } catch { /* plaintext fallback */ }
  const { error } = await supabase.from('direct_messages').insert({
    instance_id: tenantId,
    sender_user_id: session.user.id,
    recipient_user_id: recipientUserId,
    sender_name: resolveName(session, displayName),
    body: wire,
  });
  // A blocked send is the RLS gate (users_can_dm) doing its job, not a bug.
  return error ? { skipped: 'send-blocked', error } : { sent: true, encrypted };
}

// The contact list the app-wide Messages surface offers (RPC list_dm_contacts,
// 0118 — mirrors users_can_dm). Deduped by user, preferring the leader row.
export async function loadDmContacts() {
  const session = await currentSession();
  if (!session) return [];
  const { data, error } = await supabase.rpc('list_dm_contacts');
  if (error) { console.warn('[dm-sync] contacts failed:', error); return []; }
  const by = new Map();
  for (const r of data || []) {
    if (!r?.user_id) continue;
    const prev = by.get(r.user_id);
    if (!prev || (r.role === 'owner' || r.role === 'admin')) {
      by.set(r.user_id, { userId: r.user_id, displayName: r.display_name || 'Member', role: r.role || 'member' });
    }
  }
  return [...by.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
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
