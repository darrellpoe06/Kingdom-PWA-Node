// =============================================================================
// FamilyInvitePanel — the in-app "invite people to the family" grant control
// =============================================================================
// The deliberate-steward grant action for the 'Invites & access' tab. A governor
// types one email or a whole family (comma / newline separated), picks a role,
// and sends real invites (instance_invites rows via the invite_to_instance RPC).
// Each invitee AUTO-JOINS the family instance on their next sign-in with the
// invited role — no code change, no deploy. This replaces hand-editing the
// join_default_instance allowlist for every new person.
//
// Consistent with the surface's posture: granting access is a DELIBERATE human
// action (the governor clicks Send) — it is never automatic. The panel only
// creates invites; a person becomes a member when THEY sign in and accept.
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary,
// #B85838 focus ring, >=44px targets, aria-live on the result + errors.
import React, { useState, useCallback } from 'react';
import { inviteFamily, parseInviteEmails, INVITE_ROLES } from '../lib/family-invite.js';

const labelCls = 'block text-[0.6875rem] font-semibold text-[#1A1815] mb-1 uppercase tracking-wider';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';

export default function FamilyInvitePanel() {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('member');
  const [state, setState] = useState('idle'); // idle | sending | done
  const [result, setResult] = useState(null);

  const preview = parseInviteEmails(emails);

  const send = useCallback(async () => {
    if (preview.valid.length === 0) return;
    setState('sending');
    const res = await inviteFamily(emails, role);
    setResult(res);
    setState('done');
    if (res.failed.length === 0) setEmails('');
  }, [emails, role, preview.valid.length]);

  return (
    <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
        Invite people to the family
      </div>
      <p className={note + ' mt-1 mb-3'}>
        Enter one email or a whole family — separated by commas or new lines. They
        join the family on their next sign-in; no one is added until they accept.
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
          <button
            type="button"
            onClick={send}
            disabled={state === 'sending' || preview.valid.length === 0}
            className="text-[0.6875rem] uppercase tracking-wider px-4 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {state === 'sending' ? 'Sending…' : `Send invite${preview.valid.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {state === 'done' && result && (
          <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-2.5">
            {result.invited.length > 0 && (
              <p className="text-[0.75rem] text-[#5A6E3D] font-semibold">
                Invited {result.invited.length} — they'll join the family on their next sign-in.
              </p>
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
    </div>
  );
}
