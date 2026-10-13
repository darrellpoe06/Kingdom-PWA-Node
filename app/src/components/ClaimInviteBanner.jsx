// =============================================================================
// ClaimInviteBanner — the invitee's claim entry point (DR-0187)
// =============================================================================
// When a guardian sends a family invite, the app mints a one-time link
// (poetech.us/?join=<token>) that the guardian DELIVERS however they reach the
// person ("DMs not SMS"). Opening that link lands here: this banner reads the
// token, and — once the person is signed in — lets them CLAIM it. Claiming only
// records a pending claim; the guardian then re-confirms ("Approve") before any
// membership is granted. Two-party binding; knowing an email is not enough.
//
// Self-contained + fail-soft: renders NOTHING unless a ?join= token is present,
// never throws, and clears the token from the URL after a successful claim so a
// refresh doesn't re-prompt.
import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase.js';
import { readClaimTokenFromUrl, claimInvite } from '../lib/family-invite.js';

export default function ClaimInviteBanner() {
  const [token] = useState(() => readClaimTokenFromUrl());
  const [signedIn, setSignedIn] = useState(null); // null = still checking
  const [state, setState] = useState('idle'); // idle | claiming | done | invalid | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    Promise.resolve(supabase.auth.getSession())
      .then(({ data }) => { if (alive) setSignedIn(!!(data && data.session)); })
      .catch(() => { if (alive) setSignedIn(false); });
    return () => { alive = false; };
  }, [token]);

  const doClaim = useCallback(async () => {
    setState('claiming');
    const res = await claimInvite(token);
    if (!res.ok) { setState('error'); setMsg('Something went wrong — please open your link again.'); return; }
    if (res.status === 'invalid') { setState('invalid'); return; }
    setState('done');
    setMsg(res.instanceName
      ? `You've claimed your invite to ${res.instanceName}. Ask them to approve you — then you're in.`
      : `You've claimed your invite. Ask them to approve you — then you're in.`);
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('join');
      window.history.replaceState({}, '', u.toString());
    } catch { /* history not available — harmless */ }
  }, [token]);

  if (!token) return null;

  return (
    <div className="bg-[#B85838] text-[#FAF8F4] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap print:hidden" aria-live="polite" data-read-skip>
      {state === 'done' ? (
        <span className="text-[0.8125rem] font-semibold">✓ {msg}</span>
      ) : state === 'invalid' ? (
        <span className="text-[0.8125rem]">This invite link is no longer valid — ask the person who sent it for a new one.</span>
      ) : state === 'error' ? (
        <span className="text-[0.8125rem]">{msg}</span>
      ) : signedIn === false ? (
        <span className="text-[0.8125rem]">You have a family invite. Sign in (top right) to claim it — this link will still be here.</span>
      ) : signedIn === true ? (
        <>
          <span className="text-[0.8125rem] font-semibold">You've been invited to a family. Claim it to join.</span>
          <button
            type="button"
            onClick={doClaim}
            disabled={state === 'claiming'}
            className="text-[0.6875rem] uppercase tracking-wider px-4 py-2 min-h-[44px] bg-[#FAF8F4] text-[#1A1815] font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#FAF8F4] disabled:opacity-60 shrink-0"
          >
            {state === 'claiming' ? 'Claiming…' : 'Claim my invite'}
          </button>
        </>
      ) : (
        <span className="text-[0.8125rem]">Checking your family invite…</span>
      )}
    </div>
  );
}
