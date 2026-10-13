// =============================================================================
// group-messages — every role's group chat, in the app, no phone number
// =============================================================================
// DR-0231 P1 (Darrell 2026-07-23). The privacy model is enforced SERVER-SIDE
// (RLS + user_in_group, migration 0117): a group is (instance, roster) —
// 'members' is the whole instance; 'choir'/'bus'/'security' are the ministry
// rosters; leaders sit in every thread. This client calls, streams, and never
// invents access (the 0096 DM pattern). Append-only: the conversation is
// remembered as written. Pure helpers exported for tests; I/O takes an
// injectable client.

export const GROUP_ROSTERS = Object.freeze([
  { key: 'members', label: 'Everyone', blurb: 'The whole instance — family, team, or congregation.' },
  { key: 'choir', label: 'Choir', blurb: 'The choir roster.' },
  { key: 'bus', label: 'Bus ministry', blurb: 'The bus-driver roster.' },
  { key: 'security', label: 'Security team', blurb: 'The security roster.' },
]);

// Row -> the shape surfaces render. Pure.
export function toGroupMessageShape(row, myUserId) {
  return {
    id: row.id,
    roster: row.roster || 'members',
    senderName: row.sender_name || 'Someone',
    mine: !!myUserId && row.sender_user_id === myUserId,
    body: row.body || '',
    atIso: row.created_at || null,
  };
}

// Group rows into per-roster threads, oldest-first within each. Pure.
export function threadsByRoster(rows = [], myUserId) {
  const out = {};
  for (const r of rows) {
    const shape = toGroupMessageShape(r, myUserId);
    (out[shape.roster] = out[shape.roster] || []).push(shape);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => String(a.atIso).localeCompare(String(b.atIso)));
  return out;
}

// Load the recent messages of one instance (RLS scopes rosters server-side —
// a non-choir member simply never receives choir rows).
export async function loadGroupMessages(client, instanceId, { limit = 200 } = {}) {
  const { data, error } = await client
    .from('group_messages')
    .select('id,roster,sender_user_id,sender_name,body,created_at')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, rows: [] };
  return { ok: true, rows: (data || []).reverse() };
}

// Send into a roster thread. The server's user_in_group is the gate; a denial
// comes back honest, never swallowed (the MessageThread rule: the draft is
// the caller's to keep on failure).
export async function sendGroupMessage(client, { instanceId, roster, body, senderUserId, senderName }) {
  const text = String(body || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  const { error } = await client.from('group_messages').insert({
    instance_id: instanceId, roster, body: text,
    sender_user_id: senderUserId, sender_name: senderName || 'Someone',
  });
  if (error) return { ok: false, reason: error.code === '42501' ? 'not-in-group' : 'network' };
  return { ok: true };
}
