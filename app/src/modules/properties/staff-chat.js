// =============================================================================
// staff-chat — the landlord and his workers talk apart from the tenant (DR-1598)
// =============================================================================
// Darrell, 2026-11-19: "Only in group chats... one with the tenants being able
// to see what's happening and another for sensitive information... so 1099
// and landlord can discuss and others who we want can be added etc..."
//
// Two group chats per door, side by side, never mixed:
//   * the TENANT group chat is tenant_messages (unchanged): the tenant, their
//     household, the landlord, a manager, and a worker the door included;
//   * the STAFF group chat is 0338's property_staff_*: the landlord and
//     admins always, and the members on its list. Its tenant and household
//     never read it (the database refuses them even with a member row).
// The place is the choice: each chat has its own box, so a message cannot
// go to the wrong one. Reads and writes go through RLS and 0338's functions;
// nothing here can widen them. Never throws.
// =============================================================================
import supabase from '../../lib/supabase.js';

const ok = (x = {}) => ({ ok: true, ...x });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });
export const STAFF_CHAT_TIMEOUT_MS = 8000;
const bounded = (p) => {
  let t;
  return Promise.race([
    p,
    new Promise((r) => {
      t = setTimeout(() => r({ timedOut: true }), STAFF_CHAT_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(t));
};
const missing = (e) => /does not exist|schema cache/i.test(String((e && e.message) || e || ''));

/** The door's staff chat id (made on first open by whoever runs it), or null when this person may not open it. */
export async function openStaffChat(rentalId, client = supabase) {
  if (!rentalId) return no('no-door');
  try {
    const res = await bounded(client.rpc('open_staff_chat', { p_rental: rentalId }));
    if (res.timedOut) return no('timeout');
    if (res.error) return no(missing(res.error) ? 'not-enabled-yet' : 'read-failed', res.error);
    return ok({ chatId: res.data || null });
  } catch (e) {
    return no('unexpected', e);
  }
}

/** The members (active and removed: the list keeps both) and the messages of one chat. */
export async function loadStaffChat(chatId, client = supabase) {
  if (!chatId) return no('no-chat');
  try {
    const [m, msg] = await Promise.all([
      bounded(
        client
          .from('property_staff_chat_members')
          .select('id, user_id, display_name, added_by, added_at, removed_by, removed_at')
          .eq('chat_id', chatId)
          .order('added_at', { ascending: true })
      ),
      bounded(client.from('property_staff_messages').select('id, sender_user_id, body, sent_at').eq('chat_id', chatId).order('sent_at', { ascending: true })),
    ]);
    if (m.timedOut || msg.timedOut) return no('timeout');
    if (m.error || msg.error) return no('read-failed', m.error || msg.error);
    return ok({ members: m.data || [], messages: msg.data || [] });
  } catch (e) {
    return no('unexpected', e);
  }
}

export async function sendStaffMessage({ chatId, body, userId }, client = supabase) {
  const text = String(body || '').trim();
  if (!chatId) return no('no-chat');
  if (!text) return no('empty');
  if (text.length > 4000) return no('too-long');
  try {
    const res = await bounded(client.from('property_staff_messages').insert({ chat_id: chatId, sender_user_id: userId, body: text, instance_id: null }));
    if (res.timedOut) return no('timeout');
    return res.error ? no('write-failed', res.error) : ok();
  } catch (e) {
    return no('unexpected', e);
  }
}

export async function addStaffMember({ chatId, userId, name }, client = supabase) {
  try {
    const res = await bounded(client.rpc('staff_chat_add_member', { p_chat: chatId, p_user: userId, p_name: name || null }));
    if (res.timedOut) return no('timeout');
    if (res.error) return no('refused', res.error);
    return res.data === 'added' || res.data === 'already' ? ok({ result: res.data }) : no(res.data || 'refused');
  } catch (e) {
    return no('unexpected', e);
  }
}

export async function removeStaffMember({ chatId, userId }, client = supabase) {
  try {
    const res = await bounded(client.rpc('staff_chat_remove_member', { p_chat: chatId, p_user: userId }));
    if (res.timedOut) return no('timeout');
    if (res.error) return no('refused', res.error);
    return res.data === 'removed' ? ok() : no(res.data || 'refused');
  } catch (e) {
    return no('unexpected', e);
  }
}

/** Where things are in this tenancy's home: the systems the landlord shared (name, kind, where). */
export async function loadWhereThingsAre(tenancyId, client = supabase) {
  if (!tenancyId) return ok({ things: [] });
  try {
    const res = await bounded(client.rpc('where_things_are', { p_tenancy: tenancyId }));
    if (res.timedOut) return no('timeout');
    if (res.error) return no(missing(res.error) ? 'not-enabled-yet' : 'read-failed', res.error);
    return ok({ things: res.data || [] });
  } catch (e) {
    return no('unexpected', e);
  }
}

// ── pure ────────────────────────────────────────────────────────────────────

/** The people on the list now. */
export function activeMembers(members = []) {
  return (Array.isArray(members) ? members : []).filter((m) => m && !m.removed_at);
}

/**
 * Who could be added: people who have SIGNED IN through an invitation to this
 * space (a 1099 worker or a manager: a real account to add), not already on
 * the list, never a tenant or household member of this door. The database
 * refuses those too; the list does not offer them.
 */
export function addableToStaffChat(
  invites = [],
  members = [],
  { instanceId = null, livesHere = () => false, nameOf = (i) => i.display_name || 'Someone' } = {}
) {
  const on = new Set(activeMembers(members).map((m) => m.user_id));
  const seen = new Set();
  const out = [];
  for (const i of Array.isArray(invites) ? invites : []) {
    if (!i || i.revoked || !i.claimed_by || on.has(i.claimed_by) || seen.has(i.claimed_by)) continue;
    if (!['field_worker', 'manager'].includes(i.role_label)) continue;
    if (instanceId && i.instance_id && i.instance_id !== instanceId) continue;
    if (livesHere(i.claimed_by)) continue;
    seen.add(i.claimed_by);
    out.push({ userId: i.claimed_by, name: nameOf(i), role: i.role_label });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** The name a message or a member is shown under: the list's own name, else the invite's; never a guessed role. */
export function staffName(userId, { members = [], names = null, me = null } = {}) {
  if (userId && userId === me) return 'You';
  const m = (Array.isArray(members) ? members : []).find((x) => x && x.user_id === userId && x.display_name);
  if (m) return m.display_name;
  if (names && typeof names.get === 'function' && names.get(userId)) return names.get(userId);
  return 'Someone on the staff chat';
}
