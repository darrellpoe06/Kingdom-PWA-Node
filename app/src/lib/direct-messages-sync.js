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

export * from './direct-messages.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveName(session, explicit) {
  const t = (explicit || '').trim();
  if (t) return t;
  return session?.user?.email?.split('@')[0] || 'Someone';
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
    const fetchAll = async () => {
      const { data, error } = await supabase.from('direct_messages').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('[dm-sync] fetch failed:', error); return null; }
      return (data || []).map((r) => toDmShape(r, myUserId));
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
  const { error } = await supabase.from('direct_messages').insert({
    instance_id: tenantId,
    sender_user_id: session.user.id,
    recipient_user_id: recipientUserId,
    sender_name: resolveName(session, displayName),
    body: text,
  });
  // A blocked send is the RLS gate (users_can_dm) doing its job, not a bug.
  return error ? { skipped: 'send-blocked', error } : { sent: true };
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
