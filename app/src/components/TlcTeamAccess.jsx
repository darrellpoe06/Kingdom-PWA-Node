// =============================================================================
// TlcTeamAccess — Christina's control for granting ASSISTANT rights (DR-0271)
// =============================================================================
// Christina 2026-08-04: "I will need something on my end that I can use to give
// this person assistant rights... I do want them to see everything in the
// assistant tab right now" — and nothing on the other tabs. This panel is that
// control, mounted as a tab INSIDE the Assistant workspace (the app is the
// primary artifact — DR-0065), visible only to an owner/admin of the space.
//
// The flow is the platform's two-party handshake (DR-0187 — no email channel
// ever required):
//   1. GRANT: enter the assistant's email -> a one-time claim LINK is minted
//      (role 'assistant'). Deliver it however you already reach them.
//   2. They open the link, sign in (or create a login), and CLAIM it.
//   3. CONFIRM: their claim appears here; one tap grants membership.
//   4. REVOKE: remove them from the list any time.
// The database is the wall (DR-0074): an assistant account reaches the shared
// office workspace + their own messages/feedback/settings, and RLS returns
// zero rows everywhere else (migration 0130's scope overlay, proven by the
// assistant-scope smoke + guard).
import React, { useEffect, useState } from 'react';
import { inviteToInstance, listPendingClaims, confirmInvite } from '../lib/family-invite.js';
import { listInstanceMembers, removeInstanceMember, roleLabel } from '../lib/member-roles.js';
import { useInstanceRole, canManageTeam } from '../lib/instance-role.js';
import UiIcon from './UiIcon.jsx';

export default function TlcTeamAccess() {
  const roleState = useInstanceRole();
  const manager = canManageTeam(roleState);
  const [email, setEmail] = useState('');
  const [minted, setMinted] = useState(null);      // { email, link } after a grant
  const [error, setError] = useState('');
  const [claims, setClaims] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = React.useCallback(async () => {
    if (!manager || !roleState.instanceId) return;
    const [claimRes, memberList] = await Promise.all([
      listPendingClaims(),
      listInstanceMembers(roleState.instanceId),
    ]);
    setClaims(claimRes.ok ? claimRes.claims.filter((c) => c.role === 'assistant') : []);
    setMembers(memberList.filter((m) => m.role === 'assistant'));
  }, [manager, roleState.instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!roleState.loaded) return <p className="text-sm text-[#5A5751]">Checking your access…</p>;
  if (!manager) {
    return (
      <div className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">Team access is managed by the office owner.</p>
        <p className="text-xs text-[#5A5751] leading-relaxed">Granting or removing assistant access is an owner/admin control.</p>
      </div>
    );
  }

  const grant = async () => {
    setError(''); setMinted(null); setBusy(true);
    const res = await inviteToInstance(email, 'assistant', roleState.instanceId);
    setBusy(false);
    if (!res.ok) { setError(res.error || 'That email could not be invited.'); return; }
    setMinted({ email: res.email, link: res.link });
    setEmail('');
    refresh();
  };

  const confirm = async (inviteId) => {
    setBusy(true);
    await confirmInvite(inviteId);
    setBusy(false);
    refresh();
  };

  const revoke = async (userId) => {
    setBusy(true);
    await removeInstanceMember(roleState.instanceId, userId);
    setBusy(false);
    refresh();
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(minted.link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — the link is shown as text either way */ }
  };

  return (
    <div className="space-y-4">
      {/* 1. Grant */}
      <div className="border border-[#1A1815] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-1">Give someone assistant rights</div>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3">
          They get <b>everything in this Assistant workspace</b> — the referral database, outreach,
          content calendar, schedule, and goals — shared live with you. They get <b>nothing else</b>:
          no books, no family spaces, no other tabs (the database enforces it, not just the screen).
        </p>
        <div className="flex items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); grant(); } }}
            placeholder="assistant@email.com"
            aria-label="Assistant's email"
            type="email"
            className="flex-1 p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button type="button" onClick={grant} disabled={busy}
            className="px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
            Create invite link
          </button>
        </div>
        {error && <p className="text-xs text-[#B85838] mt-2" role="alert">{error}</p>}
        {minted && (
          <div className="mt-3 border border-[#5A6E3D] bg-[#F0F4EA] p-3">
            <div className="text-xs font-semibold text-[#3F5226] mb-1">Invite ready for {minted.email}</div>
            <p className="text-xs text-[#5A5751] leading-relaxed mb-2">
              Send them this one-time link any way you like (text, WhatsApp, in person). They open it,
              sign in, and their request appears below for your confirmation — access is granted only
              after you confirm (two-party, so a forwarded link alone grants nothing).
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[0.6875rem] break-all bg-white border border-[#E8E4DC] p-2">{minted.link}</code>
              <button type="button" onClick={copyLink}
                className="px-2 py-2 text-xs font-semibold border border-[#1A1815] whitespace-nowrap hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Confirm pending claims */}
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-2">Waiting for your confirmation</div>
        {claims.length === 0 ? (
          <p className="text-xs text-[#5A5751]">No one is waiting. When your assistant opens their invite link and signs in, they appear here.</p>
        ) : (
          <ul className="divide-y divide-[#E6E0D6]">
            {claims.map((c) => (
              <li key={c.invite_id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-[#1A1815] truncate">{c.claimed_email || c.email}</div>
                  <div className="text-[0.6875rem] text-[#5A5751]">invited as {roleLabel(c.role)}</div>
                </div>
                <button type="button" onClick={() => confirm(c.invite_id)} disabled={busy}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Confirm access
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Current assistants + revoke */}
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-2">Assistants with access</div>
        {members.length === 0 ? (
          <p className="text-xs text-[#5A5751]">No assistants yet.</p>
        ) : (
          <ul className="divide-y divide-[#E6E0D6]">
            {members.map((m) => (
              <li key={m.userId} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-[#1A1815] truncate">{m.displayName || m.email}</div>
                  <div className="text-[0.6875rem] text-[#5A5751]">{m.email} · {roleLabel(m.role)}</div>
                </div>
                <button type="button" onClick={() => revoke(m.userId)} disabled={busy}
                  aria-label={`Remove access for ${m.displayName || m.email}`}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Remove access
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed flex items-start gap-1.5">
        <UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          An assistant account is walled at the database: the office workspace here, their own
          messages/feedback/settings, and nothing else — no books, no CRM, no family data. Every
          grant, role change, and removal is written to the audit log.
        </span>
      </p>
    </div>
  );
}
