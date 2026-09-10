// =============================================================================
// TlcGovernance — the office governs itself from the TLC app (DR-0346)
// =============================================================================
// Darrell 2026-09-10: "Owners and managers etc need to be able to govern
// using the same app." For the office owner/admin, on Team: the hierarchy
// (who reports to whom, what each seat governs and reaches), the live
// members of the office with their seats and guarded role changes, an
// invite by email with a role, and removal. The RPCs behind member-roles.js
// (set_member_role, invite_to_instance, remove_instance_member,
// list_instance_members) are the enforcement; this is their surface.
import React, { useEffect, useState, useCallback } from 'react';
import { TLC_POSITIONS, TLC_RESOURCES, resourceMatrix, positionForRole, GOVERNANCE_NOTE } from '../lib/tlc-governance.js';
import { listInstanceMembersStrict, setMemberRole, grantableRoles, roleLabel, removeInstanceMember, inviteToSpace, isInviteEmail } from '../lib/member-roles.js';
import UiIcon from './UiIcon.jsx';

const BTN = 'min-h-[36px] px-3 py-2 text-xs font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';
const WARN = 'min-h-[36px] px-3 py-2 text-xs font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';
const FIELD = 'min-h-[36px] px-2 py-1.5 text-sm border border-[#E8E4DC] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

function Chart() {
  return (
    <ol className="space-y-2">
      {TLC_POSITIONS.map((p) => (
        <li key={p.key} className={`border p-3 ${p.key === 'owner' ? 'border-[#1A1815]' : 'border-[#E8E4DC]'}`}>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-sm font-bold text-[#1A1815]">{p.title}</div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{p.role ? roleLabel(p.role) : 'no office role'}{p.reportsTo ? ` · reports to ${TLC_POSITIONS.find((x) => x.key === p.reportsTo).title}` : ' · the top of the chart'}</div>
          </div>
          <div className="text-xs text-[#5A5751] mt-0.5">{p.holder}</div>
          <p className="text-xs text-[#1A1815] leading-relaxed mt-1"><b>Governs.</b> {p.governs}</p>
          <ul className="list-disc pl-4 text-xs text-[#5A5751] mt-1">{p.may.map((m) => <li key={m}>{m}</li>)}</ul>
        </li>
      ))}
    </ol>
  );
}

function Matrix() {
  const rows = resourceMatrix();
  return (
    <div className="overflow-x-auto">
      <table className="text-[0.6875rem] w-full border-collapse" aria-label="Which seat reaches which part of the app">
        <thead>
          <tr><th scope="col" className="text-left p-1.5 border-b border-[#E8E4DC]">Resource</th>{TLC_POSITIONS.map((p) => <th key={p.key} scope="col" className="p-1.5 border-b border-[#E8E4DC] text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{p.title.split(' ·')[0].split(' (')[0]}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.resource.id} className="border-b border-[#F0ECE4]">
              <td className="p-1.5 text-[#1A1815]">{r.resource.label}</td>
              {r.seats.map((s) => <td key={s.key} className="p-1.5 text-center" aria-label={`${s.key}: ${s.reaches ? 'reaches' : 'no'}`}>{s.reaches ? <UiIcon name="check" className="w-3.5 h-3.5 inline text-[#5A6E3D]" /> : <span className="text-[#C9BFA8]">·</span>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TlcGovernance({ instanceId, myRole, myUserId = null }) {
  const [members, setMembers] = useState({ status: 'loading', list: [], error: '' });
  const [invite, setInvite] = useState({ email: '', role: 'member', busy: false, result: null });
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    if (!instanceId) { setMembers({ status: 'error', list: [], error: 'No office instance on this sign-in.' }); return; }
    setMembers((p) => ({ ...p, status: 'loading' }));
    try { const list = await listInstanceMembersStrict(instanceId); setMembers({ status: 'ok', list, error: '' }); }
    catch (e) { setMembers({ status: 'error', list: [], error: (e && e.message) || 'could not read the members' }); }
  }, [instanceId]);
  useEffect(() => { load(); }, [load]);

  const change = async (m, role) => {
    const r = await setMemberRole(instanceId, m.userId, role);
    if (r && r.skipped) { setMsg((r.error && r.error.message) || r.skipped); return; }
    setMsg(`${m.displayName || m.email} is now ${roleLabel(role)}.`);
    load();
  };
  const remove = async (m) => {
    const r = await removeInstanceMember(instanceId, m.userId);
    if (r && r.skipped) { setMsg((r.error && r.error.message) || r.skipped); return; }
    setMsg(`${m.displayName || m.email} was removed from the office.`);
    load();
  };
  const send = async () => {
    if (!isInviteEmail(invite.email)) { setInvite((p) => ({ ...p, result: { ok: false, reason: 'Enter a valid email.' } })); return; }
    setInvite((p) => ({ ...p, busy: true }));
    const r = await inviteToSpace('family', invite.email, invite.role, instanceId);
    setInvite((p) => ({ ...p, busy: false, result: r, email: r.ok ? '' : p.email }));
  };

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">The office, top down</div>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2">{GOVERNANCE_NOTE}</p>
        <Chart />
      </section>

      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Who reaches what</div>
        <Matrix />
      </section>

      <section className="bg-white border border-[#1A1815] p-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Members of the office · live</div>
          <button type="button" onClick={load} className={`${BTN}`}>Refresh</button>
        </div>
        {msg && <p className="text-xs text-[#5A5751] mb-2" role="status">{msg}</p>}
        {members.status === 'loading' && <p className="text-xs text-[#5A5751]">Reading the members…</p>}
        {members.status === 'error' && <p className="text-xs text-[#B85838]" role="alert">The members could not be read: {members.error} Tap Refresh.</p>}
        {members.status === 'ok' && members.list.length === 0 && <p className="text-xs text-[#5A5751]">No members yet.</p>}
        {members.status === 'ok' && members.list.length > 0 && (
          <ul className="divide-y divide-[#E8E4DC]">
            {members.list.map((m) => {
              const seat = positionForRole(m.role);
              const options = grantableRoles(myRole, m.role, { isSelf: !!myUserId && m.userId === myUserId });
              return (
                <li key={m.userId} className="py-2 flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm text-[#1A1815] font-semibold">{m.displayName || m.email || m.userId}</div>
                    <div className="text-[0.6875rem] text-[#5A5751]">{m.email}{seat ? ` · ${seat.title}` : ''} · {roleLabel(m.role)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {options.length > 0 ? (
                      <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Seat
                        <select aria-label={`Role for ${m.displayName || m.email}`} value={m.role || ''} onChange={(e) => change(m, e.target.value)} className={`${FIELD} ml-1`}>
                          {!options.includes(m.role) && <option value={m.role || ''}>{roleLabel(m.role)}</option>}
                          {options.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      </label>
                    ) : <span className="text-[0.625rem] uppercase tracking-wider text-[#8A857C]">{m.role === 'owner' ? 'owner · untouchable' : 'not yours to change'}</span>}
                    {options.length > 0 && <button type="button" onClick={() => remove(m)} aria-label={`Remove ${m.displayName || m.email} from the office`} className={WARN}>Remove</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Admit someone to the office</div>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2">A one-time link with a seat. They open it signed in; the claim waits for your confirmation before anything is granted (the DR-0187 handshake). A therapist joins through Onboarding’s intake; this is for an assistant, a reviewer, or a manager.</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Email
            <input type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} placeholder="person@email.com" className={`${FIELD} w-full`} />
          </label>
          <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Seat
            <select aria-label="Seat for the invite" value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))} className={`${FIELD} block`}>
              {(myRole === 'owner' ? ['admin', 'member', 'assistant', 'viewer'] : ['member', 'assistant', 'viewer']).map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </label>
          <button type="button" onClick={send} disabled={invite.busy} className={`${BTN}`}>Create invite link</button>
        </div>
        {invite.result && (invite.result.ok
          ? <p className="text-xs text-[#3F5226] mt-2 break-all" role="status">Invite ready for {invite.result.email}: <span className="font-mono">{invite.result.link || 'link minted'}</span></p>
          : <p className="text-xs text-[#B85838] mt-2" role="alert">{invite.result.reason === 'rpc-error' ? invite.result.error : invite.result.reason}</p>)}
      </section>
      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed">Resources: {TLC_RESOURCES.length} parts of the app, {TLC_POSITIONS.length} seats. Every change writes the audit log.</p>
    </div>
  );
}
