// =============================================================================
// ministry-ops-sync — Supabase I/O for the Ministry Ops workspace.
// =============================================================================
// Mirrors choir/bus sync: writeContext() resolves the CHURCH tenant before any
// write (RLS passes), realtime stream keeps devices live. Backed by ministry_ops
// (0099). Staff (owner/admin) manage; the RLS read policy already scopes what a
// non-staff member can fetch to member_visible rows, so the same subscription
// safely powers both the staff board and the member digest. Pure logic
// (shapes/groupings/digest) lives in ministry-ops.js and is re-exported here.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { toOpsShape, canManageOps } from './ministry-ops.js';

export * from './ministry-ops.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveName(session, explicit) {
  const t = (explicit || '').trim();
  if (t) return t;
  return session?.user?.email?.split('@')[0] || 'Steward';
}
async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveName(session, displayName) };
}

export async function getOpsAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canManage: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canManage: false, tenantId: null, role: null };
  const { data: role } = await supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId });
  return { signedIn: true, canManage: canManageOps(role), tenantId, role: role ?? null };
}

export function subscribeOps(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('ministry_ops').select('*').order('week_of', { ascending: false });
      if (error) { console.warn('[ministry-ops] fetch failed:', error); return null; }
      return (data || []).map((r) => toOpsShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('ministry_ops-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ministry_ops' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() { cancelled = true; if (channel) supabase.removeChannel(channel); };
}

export async function saveOpsItem(item, displayName) {
  const text = (item.title || '').trim();
  if (!text) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    ministry: item.ministry ?? 'general',
    title: text,
    detail: item.detail ?? null,
    status: item.status ?? 'todo',
    week_of: item.weekOf ?? null,
    owner_name: item.ownerName ?? null,
    owner_user_id: item.ownerUserId ?? null,
    member_visible: item.memberVisible === true,
  };
  if (item.id) {
    const { error } = await supabase.from('ministry_ops').update({ ...row, updated_by: ctx.userId }).eq('id', item.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('ministry_ops').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function removeOpsItem(id) {
  const { error } = await supabase.from('ministry_ops').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
export async function setOpsStatus(id, status) {
  const { error } = await supabase.from('ministry_ops').update({ status }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
// Publish / unpublish an item to the paid members' curated digest.
export async function setMemberVisible(id, visible) {
  const { error } = await supabase.from('ministry_ops').update({ member_visible: !!visible }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
