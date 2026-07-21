// =============================================================================
// ChurchTeam — the church dev/ops team roster (Darrell 2026-07-21)
// =============================================================================
// "A dedicated church 'dev/ops team' surface with its own cross-app tester role."
// Owner/admin MANAGE the team (add/remove/change role); anyone on the team SEES
// it. Adding a helper invites them to the church instance at the access their
// team-role maps to (tester → VIEW ONLY) — so "tester only" is enforced by RLS,
// not just a label (church-team-sync.js + migration 0109).
//
// Access states are honest (DR-0076): signed-out, unverified (refresh your
// sign-in — never mistake a lapsed session for "not on the team"), and the gentle
// not-a-member state.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getTeamAccess, subscribeTeam, addTeamMember, removeTeamMember, updateTeamMemberRole,
  teamRoleToInstanceRole, teamRoleLabel, TEAM_ROLES,
} from '../lib/church-team-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';

// A tester is view-only; the other roles trend toward edit — the badge color says
// which at a glance (green = view-only helper, rust = a builder with edit).
const roleBadgeCls = (r) => (teamRoleToInstanceRole(r) === 'viewer'
  ? 'bg-[#5A6E3D] text-white'
  : r === 'lead' ? 'bg-[#1A1815] text-white' : 'bg-[#B85838] text-white');
const accessNote = (r) => {
  const inst = teamRoleToInstanceRole(r);
  return inst === 'viewer' ? 'view only — looks & gives feedback, changes nothing'
    : inst === 'admin' ? 'edit — a co-director / lead'
      : 'view (member) — can be widened per surface later';
};

export default function ChurchTeam() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canManage: false, unverified: false });
  const [members, setMembers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ displayName: '', email: '', teamRole: 'tester', notes: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  useEffect(() => {
    let alive = true;
    if (!signedIn) { setAccess({ canSee: false, canManage: false, unverified: false }); return undefined; }
    getTeamAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, [signedIn]);
  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsub = subscribeTeam(setMembers, (e) => setErr(`Could not load the team (${e?.message || 'error'}).`));
    return () => { try { unsub && unsub(); } catch { /* noop */ } };
  }, [signedIn, access.canSee]);

  const report = (r, okMsg) => {
    if (r && r.skipped) { setErr(`Could not save (${r.skipped}). Nothing was changed — try again.`); return false; }
    setErr('');
    const invited = r && r.invited;
    setMsg(invited && invited.invited ? `${okMsg} Invite sent to ${f.email || 'them'} — access starts on their next sign-in.` : okMsg);
    return true;
  };
  const submit = async () => {
    if (!f.displayName.trim()) return;
    const r = await addTeamMember({ ...f, email: f.email.trim() || null });
    if (report(r, `Added ${f.displayName.trim()} as ${teamRoleLabel(f.teamRole)}.`)) {
      setF({ displayName: '', email: '', teamRole: 'tester', notes: '' });
      setAdding(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · team">Dev / Ops Team</SectionTitle>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to see the church's dev/ops team.</p>
      </div>
    );
  }
  if (!access.canSee) {
    const unverified = !!access.unverified;
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · team">Dev / Ops Team</SectionTitle>
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          {unverified ? (
            <>
              <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>We couldn't confirm your team access.</p>
              <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>You're signed in, but your church sign-in on this device may have lapsed. <strong>Sign out and back in</strong> to refresh, then reopen this tab.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>This is the church's dev/ops team.</p>
              <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Ask a church admin to add you to the team. If you were already added and don't see it, sign out and back in to refresh your church sign-in.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · team">Dev / Ops Team</SectionTitle>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        The people who help build, run, and test the Love Corner app. A <strong>Tester</strong> is view-only — they can look and give feedback but change nothing; a Dev/Ops helper sees more; a Team lead can edit. Adding someone emails them an invite; their access starts on their next sign-in and always matches their role here.
      </p>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}
      {msg && <div role="status" className="bg-[#FAF8F4] border border-[#5A6E3D] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{msg}</div>}

      {access.canManage && (adding ? (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Add a team member</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className={LABEL} htmlFor="ct-name">Name</label><input id="ct-name" className={FIELD} value={f.displayName} onChange={(e) => setF((p) => ({ ...p, displayName: e.target.value }))} placeholder="e.g. Doug" /></div>
            <div><label className={LABEL} htmlFor="ct-email">Email (for their invite)</label><input id="ct-email" type="email" className={FIELD} value={f.email} onChange={(e) => setF((p) => ({ ...p, email: e.target.value }))} placeholder="helper@email.com" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={LABEL} htmlFor="ct-role">Role</label>
              <select id="ct-role" className={FIELD} value={f.teamRole} onChange={(e) => setF((p) => ({ ...p, teamRole: e.target.value }))}>
                {TEAM_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div><label className={LABEL} htmlFor="ct-notes">Notes (optional)</label><input id="ct-notes" className={FIELD} value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} placeholder="What they're helping with" /></div>
          </div>
          <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{teamRoleLabel(f.teamRole)} → <strong>{accessNote(f.teamRole)}</strong>.</p>
          <div className="flex gap-2">
            <button type="button" disabled={!f.displayName.trim()} onClick={submit} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Add member</button>
            <button type="button" onClick={() => { setAdding(false); setMsg(''); }} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => { setAdding(true); setMsg(''); }} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add team member</button>)}

      {members.length ? (
        <div className="bg-white border border-[#1A1815]">
          {members.map((m) => (
            <div key={m.id} className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <div className="min-w-0">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.displayName}</span>
                <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 ml-2 ${roleBadgeCls(m.teamRole)}`}>{teamRoleLabel(m.teamRole)}</span>
                {m.email && <span className="text-[0.6875rem] text-[#5A5751] ml-2 break-all">{m.email}</span>}
                {m.notes && <p className="text-[0.6875rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{m.notes}</p>}
              </div>
              {access.canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <label className="sr-only" htmlFor={`ct-role-${m.id}`}>Change role for {m.displayName}</label>
                  <select id={`ct-role-${m.id}`} className="text-[0.6875rem] bg-white border border-[#E8E4DC] px-1 py-0.5 focus:outline focus:outline-2 focus:outline-[#B85838]"
                    value={m.teamRole} onChange={async (e) => { report(await updateTeamMemberRole(m, e.target.value), `Updated ${m.displayName} to ${teamRoleLabel(e.target.value)}.`); }}>
                    {TEAM_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <button type="button" onClick={async () => { if (typeof confirm !== 'function' || confirm(`Remove ${m.displayName} from the team?`)) report(await removeTeamMember(m.id), `Removed ${m.displayName}.`); }} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No one on the team yet.{access.canManage ? ' Add your first helper above — start someone as a Tester (view only).' : ''}</p>}
    </div>
  );
}

export { ChurchTeam };
