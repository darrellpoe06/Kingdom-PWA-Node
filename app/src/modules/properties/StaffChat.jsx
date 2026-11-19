// =============================================================================
// StaffChat — the door's staff group chat: landlord, managers, the 1099
// workers he adds. The tenant never sees it (DR-1598, migration 0338).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  openStaffChat, loadStaffChat, sendStaffMessage, addStaffMember, removeStaffMember,
  activeMembers, addableToStaffChat, staffName,
} from './staff-chat.js';

const serif = { fontFamily: '"Fraunces", serif' };
const when = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
// ONE object for the life of the module: a default made inside the
// signature is a new object every render, and the open effect below depends
// on it, so it would re-open the chat on every render, forever.
const STAFF_CHAT_API = Object.freeze({ openStaffChat, loadStaffChat, sendStaffMessage, addStaffMember, removeStaffMember });

/**
 * rentalId: the door. me: the signed-in user id. canRun: the owner or a
 * manager (adds and removes people). invites: for names and who can be added.
 * names: Map(userId -> name). livesHere(userId): a tenant or household member
 * of this door (never offered). api: injectable for tests.
 */
export default function StaffChat({
  rentalId, me = null, canRun = false, invites = [], names = null, instanceId = null, livesHere = () => false,
  api = STAFF_CHAT_API,
}) {
  const [chatId, setChatId] = useState(null);
  const [state, setState] = useState('loading');
  const [data, setData] = useState({ members: [], messages: [] });
  const [body, setBody] = useState('');
  const [pick, setPick] = useState('');
  const [said, setSaid] = useState('');
  const reload = useCallback(async (id) => {
    if (!id) return;
    const r = await api.loadStaffChat(id);
    if (r.ok) { setData({ members: r.members, messages: r.messages }); setState('ok'); } else setState(r.reason);
  }, [api]);
  useEffect(() => {
    let live = true;
    setState('loading');
    api.openStaffChat(rentalId).then((r) => {
      if (!live) return;
      if (!r.ok) { setState(r.reason); return; }
      if (!r.chatId) { setState('closed'); return; }
      setChatId(r.chatId);
      reload(r.chatId);
    });
    return () => { live = false; };
  }, [rentalId, api, reload]);
  const members = useMemo(() => activeMembers(data.members), [data.members]);
  const addable = useMemo(() => addableToStaffChat(invites, data.members, { instanceId, livesHere }), [invites, data.members, instanceId, livesHere]);
  if (!rentalId || state === 'closed') return null;
  const nameOf = (uid) => staffName(uid, { members: data.members, names, me });
  const send = async () => {
    const r = await api.sendStaffMessage({ chatId, body, userId: me });
    if (r.ok) { setBody(''); setSaid(''); reload(chatId); } else setSaid(`Not sent: ${r.reason}`);
  };
  const add = async () => {
    const who = addable.find((a) => a.userId === pick);
    if (!who) return;
    const r = await api.addStaffMember({ chatId, userId: who.userId, name: who.name });
    setSaid(r.ok ? `${who.name} was added.` : `Not added: ${r.reason === 'lives-here' ? 'they live at this door' : r.reason}`);
    setPick(''); reload(chatId);
  };
  const remove = async (m) => {
    const r = await api.removeStaffMember({ chatId, userId: m.user_id });
    setSaid(r.ok ? `${nameOf(m.user_id)} was removed. They no longer read this chat.` : `Not removed: ${r.reason}`);
    reload(chatId);
  };
  return (
    <section className="bg-white border-2 border-[#2F5D50] p-3 sm:p-4 mb-3" data-testid="staff-chat">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-1">Staff group chat · the tenant never sees this</h3>
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        For the landlord and the workers and helpers he adds. On the list: {members.length ? members.map((m) => nameOf(m.user_id)).join(', ') : 'nobody yet besides the landlord'}.
      </p>
      {state !== 'ok' && state !== 'loading' && <p className="text-xs text-[#9B2C1E] mb-2" style={serif} role="status">This chat could not be read just now ({state}).</p>}
      <div className="max-h-80 overflow-y-auto mb-2">
        {data.messages.length === 0
          ? <p className="text-xs text-[#5A5751]" style={serif}>{state === 'loading' ? 'Reading…' : 'No staff messages yet.'}</p>
          : data.messages.map((m) => (
            <div key={m.id} className="border-b border-[#F0EDE6] py-2" data-testid="staff-message">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#8A867E]">{nameOf(m.sender_user_id)} · {when(m.sent_at)}</div>
              <div className="text-sm text-[#1A1815]" style={serif}>{m.body}</div>
            </div>
          ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Message the staff (not the tenant)"
        aria-label="Message the staff chat" className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
      <button type="button" className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40" disabled={!body.trim() || !chatId} onClick={send}>Send to staff only</button>
      {canRun && (
        <div className="mt-3 border-t border-[#F0EDE6] pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Add someone to the staff chat"
              className="text-xs border border-[#E8E4DC] px-2 py-2 bg-white" style={serif}>
              <option value="">{addable.length ? 'Add someone…' : 'Everyone who has signed in is on the list'}</option>
              {addable.map((a) => <option key={a.userId} value={a.userId}>{a.name}{a.role === 'manager' ? ' (manager)' : ' (1099 worker)'}</option>)}
            </select>
            <button type="button" className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40" disabled={!pick} onClick={add}>Add</button>
          </div>
          {members.length > 0 && (
            <ul className="list-none p-0 m-0 mt-2">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-xs py-1" style={serif}>
                  <span>{nameOf(m.user_id)}{m.added_at ? ` · added ${when(m.added_at)}` : ''}</span>
                  {m.user_id !== me && <button type="button" className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40" onClick={() => remove(m)}>Remove</button>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {said && <p className="text-xs text-[#5A5751] mt-2" style={serif} role="status">{said}</p>}
    </section>
  );
}
