// =============================================================================
// FamilyInvitePanel — the in-app "invite people to the family" grant control
// =============================================================================
// The deliberate-steward grant action for the 'Invites & access' tab, now a
// two-party handshake (DR-0187) that needs NO external channel — so it works
// even for someone whose email is locked (Darrell's uncle):
//   1. A governor types one email or a whole family, picks a role, and Sends.
//      This mints a one-time CLAIM LINK per person (instance_invites + the
//      invite_to_instance RPC) — it does NOT grant anything yet.
//   2. The governor DELIVERS each link however they already reach that person
//      (their own text / WhatsApp / email / in person — "DMs not SMS").
//   3. The person opens the link, signs in, and CLAIMS it (pending).
//   4. The governor RE-CONFIRMS the claim here ("Approve") — ONLY THEN is
//      membership granted. Two-party binding closes the old bare-email
//      self-claim gap (knowing an email is no longer enough).
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary,
// #B85838 focus ring, >=44px targets, aria-live on results + errors.
import React, { useState, useCallback, useEffect } from 'react';
import { inviteFamily, parseInviteEmails, INVITE_ROLES, listPendingClaims, confirmInvite } from '../lib/family-invite.js';

const labelCls = 'block text-[0.6875rem] font-semibold text-[#1A1815] mb-1 uppercase tracking-wider';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';
const btnCls = 'text-[0.6875rem] uppercase tracking-wider px-4 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

export default function FamilyInvitePanel() {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('member');
  const [state, setState] = useState('idle'); // idle | sending | done
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [pending, setPending] = useState([]);
  const [pendingState, setPendingState] = useState('idle'); // idle | loading | ready
  const [approving, setApproving] = useState('');

  const preview = parseInviteEmails(emails);

  const loadPending = useCallback(async () => {
    setPendingState('loading');
    const res = await listPendingClaims();
    setPending(res.ok ? res.claims : []);
    setPendingState('ready');
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const send = useCallback(async () => {
    if (preview.valid.length === 0) return;
    setState('sending');
    const res = await inviteFamily(emails, role);
    setResult(res);
    setState('done');
    if (res.failed.length === 0) setEmails('');
  }, [emails, role, preview.valid.length]);

  const copy = useCallback(async (link, key) => {
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(link);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch { /* clipboard blocked — the link is still visible to copy by hand */ }
  }, []);

  const approve = useCallback(async (inviteId) => {
    setApproving(inviteId);
    const res = await confirmInvite(inviteId);
    setApproving('');
    if (res.ok) await loadPending();
  }, [loadPending]);

  return (
    <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
        Invite people to the family
      </div>
      <p className={note + ' mt-1 mb-3'}>
        Enter one email or a whole family — separated by commas or new lines. Sending
        makes a one-time link for each person. Send it to them however you reach
        them — a text, a message, or in person. They open it, sign in, and claim;
        then you approve them below. No one is added until you approve.
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls} htmlFor="fi-emails">Emails</label>
          <textarea
            id="fi-emails"
            rows={3}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="son@example.com, spouse@example.com"
            className={inputCls + ' resize-y min-h-[72px]'}
          />
          {preview.valid.length > 0 && (
            <p className={note + ' mt-1'}>{preview.valid.length} valid email{preview.valid.length === 1 ? '' : 's'} ready{preview.invalid.length ? ` · ${preview.invalid.length} ignored` : ''}.</p>
          )}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className={labelCls} htmlFor="fi-role">Role</label>
            <select
              id="fi-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputCls + ' min-h-[44px]'}
            >
              {INVITE_ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={send} disabled={state === 'sending' || preview.valid.length === 0} className={btnCls}>
            {state === 'sending' ? 'Sending…' : `Make link${preview.valid.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {state === 'done' && result && (
          <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-2.5">
            {result.invited.length > 0 && (
              <>
                <p className="text-[0.75rem] text-[#5A6E3D] font-semibold mb-1.5">
                  {result.invited.length} link{result.invited.length === 1 ? '' : 's'} ready — send each person their link, then approve them below.
                </p>
                <ul className="flex flex-col gap-2">
                  {result.invited.map((r) => (
                    <li key={r.email} className="flex flex-col gap-1">
                      <span className="text-[0.6875rem] font-semibold text-[#1A1815]">{r.email}</span>
                      {r.link ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input readOnly value={r.link} aria-label={`Claim link for ${r.email}`} className={inputCls + ' flex-1 min-w-[12rem] text-[0.6875rem]'} onFocus={(e) => e.target.select()} />
                          <button type="button" onClick={() => copy(r.link, r.email)} className={btnCls}>
                            {copied === r.email ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ) : (
                        <span className={note}>Link created — reopen this panel to copy it.</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {result.failed.length > 0 && (
              <p className="text-[0.75rem] text-[#7A1F1F] mt-1">
                Couldn't invite {result.failed.map((f) => f.email).join(', ')}. Try again.
              </p>
            )}
            {result.ignored.length > 0 && (
              <p className={note + ' mt-1'}>Ignored (not valid emails): {result.ignored.join(', ')}.</p>
            )}
          </div>
        )}
      </div>

      {/* Guardian re-confirm — approve who has claimed (DR-0187, two-party bind). */}
      <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Approve who claimed</div>
          <button type="button" onClick={loadPending} disabled={pendingState === 'loading'} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838] min-h-[44px] px-1">
            {pendingState === 'loading' ? 'Checking…' : 'Refresh'}
          </button>
        </div>
        <p className={note + ' mt-1 mb-2'}>
          When someone opens their link and claims, they appear here. Approving them is what actually adds them — so you confirm it's really them.
        </p>
        <div aria-live="polite">
          {pendingState === 'ready' && pending.length === 0 && (
            <p className={note}>No one is waiting for approval right now.</p>
          )}
          {pending.length > 0 && (
            <ul className="flex flex-col gap-2">
              {pending.map((c) => (
                <li key={c.invite_id} className="flex items-center justify-between gap-2 flex-wrap border border-[#E8E4DC] bg-[#FAF8F4] p-2">
                  <span className="text-[0.6875rem] text-[#1A1815]">
                    <span className="font-semibold">{c.claimed_email || c.email}</span>
                    <span className="text-[#5A5751]"> · {c.role}{c.claimed_email && c.email && c.claimed_email !== c.email ? ` · invited as ${c.email}` : ''}</span>
                  </span>
                  <button type="button" onClick={() => approve(c.invite_id)} disabled={approving === c.invite_id} className={btnCls}>
                    {approving === c.invite_id ? 'Approving…' : 'Approve'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
