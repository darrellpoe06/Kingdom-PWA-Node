// =============================================================================
// DeviceLinkApprove — the phone approves the TV (poetech.us/link?c=CODE)
// =============================================================================
// The other half of PhoneSignInPanel (DR-0658). The TV's QR opens this on the
// phone already in your hand: sign in here if you are not (Google, or phone
// number + PIN, the same doors as everywhere), see which screen is asking, and
// approve or deny. Approving is the ONLY step that can make a television
// signed in, and it needs a signed-in human, which is what makes the short
// code safe to show on a screen (lib/device-link.js).
//
// A lean boot (main.jsx `?link=`), like ?login=1: the full app never loads on
// the phone for a ten-second job. Google's full-page redirect fallback drops
// the query string, so the code is stashed in sessionStorage first and main.jsx
// comes back here (lib/device-link.js stashLinkCode / readLinkStash).
//
// Colors on white: #1A1815 17.4:1, #5A5751 7.0:1, #7A1F1F 10.6:1; focus ring
// #B85838. Targets >= 48px. No red (DR-0099).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import PasswordAuth from './PasswordAuth.jsx';
import { supabase, signInWithGoogle, identityLabel } from '../lib/supabase.js';
import { signInWithGooglePopup } from '../lib/oauth-popup.js';
import {
  normalizeUserCode, formatUserCode, isUserCode, askedAgo,
  stashLinkCode, clearLinkStash, USER_CODE_LEN,
} from '../lib/device-link.js';
import { describeLink, decideLink, linkErrorMessage } from '../lib/device-link-client.js';

const store = () => { try { return window.sessionStorage; } catch { return null; } };

const btnDark = 'w-full inline-flex items-center justify-center text-sm font-semibold uppercase tracking-wider px-4 py-3 min-h-[52px] bg-[#1A1815] text-white hover:bg-[#2E2B26] disabled:opacity-60 focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-[#B85838]';
const btnLight = 'w-full inline-flex items-center justify-center text-sm font-semibold uppercase tracking-wider px-4 py-3 min-h-[52px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] disabled:opacity-60 focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-[#B85838]';

export default function DeviceLinkApprove({ initialCode = '', client = supabase }) {
  const [code, setCode] = useState(() => normalizeUserCode(initialCode));
  const [typed, setTyped] = useState(() => formatUserCode(normalizeUserCode(initialCode)));
  const [session, setSession] = useState(undefined); // undefined = still asking
  const [info, setInfo] = useState(null); // describe row | 'none'
  const [phase, setPhase] = useState('look'); // look | ready | approving | approved | denied | stale
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  // Who is signed in on this phone, kept live (a popup or PIN sign-in lands here).
  useEffect(() => {
    let alive = true;
    client.auth.getSession().then(({ data }) => { if (alive) setSession((data && data.session) || null); })
      .catch(() => { if (alive) setSession(null); });
    const { data: sub } = client.auth.onAuthStateChange((_e, s) => { if (alive) setSession(s || null); });
    return () => { alive = false; try { sub.subscription.unsubscribe(); } catch { /* gone */ } };
  }, [client]);

  // Signed in with a whole code: ask which screen is waiting on it.
  useEffect(() => {
    if (!session || !isUserCode(code)) return undefined;
    let alive = true;
    setInfo(null); setError(''); setPhase('look');
    describeLink(client, code)
      .then((row) => {
        if (!alive) return;
        if (!row) { setInfo('none'); setPhase('stale'); return; }
        setInfo(row);
        setPhase(row.approvable ? 'ready' : 'stale');
      })
      .catch((e) => { if (alive) { setError(linkErrorMessage(e)); setPhase('stale'); } });
    return () => { alive = false; };
  }, [session, code, client]);

  const decide = useCallback(async (approve) => {
    setPhase('approving'); setError('');
    try {
      const ok = await decideLink(client, code, approve);
      clearLinkStash(store());
      if (!ok) { setPhase('stale'); setInfo((i) => (i && i !== 'none' ? { ...i, approvable: false } : i)); return; }
      setPhase(approve ? 'approved' : 'denied');
    } catch (e) {
      setPhase('ready'); setError(linkErrorMessage(e));
    }
  }, [client, code]);

  const google = async () => {
    setGoogleBusy(true); setError('');
    stashLinkCode(store(), code);
    let res;
    try { res = await signInWithGooglePopup({ client }); } catch (e) { res = { error: e }; }
    // The popup kept this page, so the stash is not needed: drop it now.
    if (res && res.ok) { clearLinkStash(store()); setGoogleBusy(false); return; }
    if (res && (res.blocked || res.unsupported || res.error)) {
      const fb = await signInWithGoogle();
      if (fb && fb.error) { setGoogleBusy(false); setError(fb.error.message || 'Google sign-in is not available right now. Use your phone number and PIN.'); }
      return;
    }
    setGoogleBusy(false);
  };

  const submitTyped = (e) => {
    e.preventDefault();
    const n = normalizeUserCode(typed);
    if (!isUserCode(n)) { setError(`The code on the TV is ${USER_CODE_LEN} letters and numbers, like ACDE-FGHJ.`); return; }
    setError('');
    setCode(n);
  };

  let body;
  if (!isUserCode(code)) {
    body = (
      <form onSubmit={submitTyped} noValidate>
        <label htmlFor="link-code" className="block text-sm font-semibold text-[#1A1815] mb-1">The code on your TV</label>
        <input
          id="link-code"
          data-testid="link-code-input"
          value={typed}
          onChange={(e) => setTyped(formatUserCode(normalizeUserCode(e.target.value)))}
          autoCapitalize="characters"
          autoComplete="one-time-code"
          spellCheck={false}
          className="w-full border-2 border-[#1A1815] px-3 py-3 min-h-[52px] text-2xl tracking-[0.2em] text-center text-[#1A1815] focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-[#B85838]"
          style={{ fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace' }}
          placeholder="ACDE-FGHJ"
        />
        <button type="submit" className={`${btnDark} mt-3`}>Continue</button>
      </form>
    );
  } else if (session === undefined) {
    body = <p className="text-sm text-[#5A5751]" role="status">One moment…</p>;
  } else if (!session) {
    body = (
      <div>
        <p className="text-sm text-[#1A1815] mb-3">Sign in on this phone first. Then you can let the TV in.</p>
        <button type="button" onClick={google} disabled={googleBusy} className="w-full inline-flex items-center justify-center text-sm font-semibold uppercase tracking-wider px-4 py-3 min-h-[52px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] disabled:opacity-60 focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-[#B85838]">
          {googleBusy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <div className="flex items-center gap-3 my-4" aria-hidden="true">
          <span className="h-px flex-grow bg-[#E8E4DC]" />
          <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">or</span>
          <span className="h-px flex-grow bg-[#E8E4DC]" />
        </div>
        <PasswordAuth mode="signin" embedded onSignedIn={(s) => { if (s) setSession(s); }} />
      </div>
    );
  } else if (phase === 'approved') {
    body = (
      <div data-testid="link-approved">
        <p className="text-lg font-semibold text-[#1A1815]">Done. The TV is signing in now.</p>
        <p className="text-sm text-[#5A5751] mt-1">It will show your account in a few seconds. You can put the phone down.</p>
      </div>
    );
  } else if (phase === 'denied') {
    body = (
      <div data-testid="link-denied">
        <p className="text-lg font-semibold text-[#1A1815]">Turned down. The TV stays signed out.</p>
        <p className="text-sm text-[#5A5751] mt-1">If that was your TV after all, press “Show a new code” on it and scan again.</p>
      </div>
    );
  } else if (phase === 'stale') {
    body = (
      <div data-testid="link-stale">
        <p className="text-lg font-semibold text-[#1A1815]">
          {info === 'none' ? 'We could not find that code.' : 'That code is no longer waiting.'}
        </p>
        <p className="text-sm text-[#5A5751] mt-1">
          {info === 'none'
            ? 'Check the letters on the TV, or press “Show a new code” there and scan again.'
            : 'It was used, turned down, or it ran past its 10 minutes. Press “Show a new code” on the TV and scan again.'}
        </p>
        <button type="button" className={`${btnLight} mt-4`} onClick={() => { setCode(''); setTyped(''); setInfo(null); setPhase('look'); }}>
          Type a different code
        </button>
      </div>
    );
  } else if (phase === 'look' || !info || info === 'none') {
    body = <p className="text-sm text-[#5A5751]" role="status">Looking up the TV…</p>;
  } else {
    body = (
      <div data-testid="link-ask">
        <h2 className="text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Sign in the TV in front of you?
        </h2>
        <p className="text-sm text-[#1A1815] mt-2" data-testid="link-device">
          <span className="font-semibold">{info.device_label || 'A screen'}</span>
          {info.created_at ? `, asked ${askedAgo(info.created_at)}` : ''}
        </p>
        <p className="text-sm text-[#5A5751] mt-1">
          Code <span className="font-semibold text-[#1A1815]" style={{ fontFamily: 'ui-monospace, monospace' }}>{formatUserCode(code)}</span>.
          Approve only if this code is on your own screen right now.
        </p>
        <p className="text-sm text-[#5A5751] mt-1">It will be signed in as <span className="font-semibold text-[#1A1815]">{identityLabel(session) || 'you'}</span>.</p>
        <div className="grid gap-3 mt-4">
          <button type="button" data-testid="link-approve" onClick={() => decide(true)} disabled={phase === 'approving'} className={btnDark}>
            {phase === 'approving' ? 'One moment…' : 'Approve'}
          </button>
          <button type="button" data-testid="link-deny" onClick={() => decide(false)} disabled={phase === 'approving'} className={btnLight}>
            Deny
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] flex items-start justify-center p-4 sm:p-10" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div className="w-full bg-white border border-[#1A1815] p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Sign in a TV</div>
        {body}
        {error && <p className="text-sm text-[#7A1F1F] mt-3" role="alert" data-testid="link-error">{error}</p>}
      </div>
    </main>
  );
}
