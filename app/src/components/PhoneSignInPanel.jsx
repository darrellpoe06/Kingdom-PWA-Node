// =============================================================================
// PhoneSignInPanel — the TV shows a code, the phone in your hand signs it in
// =============================================================================
// Darrell on the Fire TV, 2026-09-25 02:30 UTC: "Hard to sign in on a
// Firestick... what happened to the qr code ways?" (and 2026-09-20: "I'd
// rather just be able to use a QR code to access the login quicker and
// faster"). The flow and its security split live in lib/device-link.js; the
// I/O in lib/device-link-client.js; the session is minted by
// functions/api/device-link.js (DR-0658).
//
// ONE BUTTON, ONE PLACE FOR FOCUS. A remote has no Tab and no pointer. The
// same <button> starts the flow and, once a code is up, offers a fresh one, so
// focus never falls off the panel when the QR appears: Enter on the TV's OK
// key shows the code, and the D-pad can still reach every other door.
//
// Colors on white: #1A1815 text 17.4:1, #5A5751 secondary 7.0:1, #7A1F1F
// error 10.6:1, #B85838 focus ring (non-text, 4.56:1). No red is used (DR-0099).
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase.js';
import { awaitPersistedSession } from '../lib/session-handoff.js';
import { isNativeShell, HOUSE_ORIGIN } from '../lib/native-shell.js';
import {
  formatUserCode, qrTarget, stateMessage, shouldKeepPolling, STATE, POLL_INTERVAL_MS,
} from '../lib/device-link.js';
import {
  startLink, pollLink, claimLink, finishSignIn, linkErrorMessage,
} from '../lib/device-link-client.js';

function claimMessage(res) {
  if (res && res.error === 'not-configured') return linkErrorMessage({ message: 'not-configured' });
  if (res && res.error === 'no-email') return 'That account has no sign-in address yet. Use Google or your phone number and PIN below.';
  if (res && res.error === 'not-claimable') return stateMessage(res.state || STATE.UNKNOWN);
  return 'Your phone approved it, but the TV could not finish signing in. Press the button for a fresh code.';
}

export default function PhoneSignInPanel({ tv = false, buttonRef = null, onSignedIn = null, autoStart = false, client = supabase }) {
  const [phase, setPhase] = useState('idle'); // idle | starting | waiting | signing | done | stopped
  const [link, setLink] = useState(null); // { userCode, deviceHash, deviceCode, expiresAt }
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const timer = useRef(null);
  const run = useRef(0); // a newer start silences an older poll loop
  const localRef = useRef(null);
  const btnRef = buttonRef || localRef;

  const stop = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => () => { run.current += 1; stop(); }, []);

  const finish = useCallback(async (deviceCode, myRun) => {
    setPhase('signing');
    setMessage(stateMessage(STATE.APPROVED));
    const res = await claimLink(deviceCode);
    if (myRun !== run.current) return;
    if (!res.ok) { setPhase('stopped'); setMessage(''); setError(claimMessage(res)); return; }
    try {
      const session = await finishSignIn(client, res.session);
      await awaitPersistedSession();
      if (myRun !== run.current) return;
      setPhase('done');
      setMessage('Signed in.');
      if (onSignedIn) onSignedIn(session);
    } catch (e) {
      setPhase('stopped'); setMessage(''); setError(claimMessage({ error: String(e && e.message) }));
    }
  }, [client, onSignedIn]);

  const start = useCallback(async () => {
    stop();
    run.current += 1;
    const myRun = run.current;
    setPhase('starting'); setError(''); setMessage('');
    let l;
    try {
      l = await startLink(client, { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '' });
    } catch (e) {
      if (myRun !== run.current) return;
      setPhase('stopped'); setError(linkErrorMessage(e));
      return;
    }
    if (myRun !== run.current) return;
    setLink(l);
    setPhase('waiting');
    setMessage(stateMessage(STATE.PENDING));

    const tick = async () => {
      if (myRun !== run.current) return;
      const state = await pollLink(client, l.deviceHash);
      if (myRun !== run.current) return;
      if (state === STATE.APPROVED) { finish(l.deviceCode, myRun); return; }
      // UNKNOWN is a blip (a dropped request), not an ending: keep asking
      // until the link's own deadline says otherwise.
      const expired = l.expiresAt && Date.now() >= Date.parse(l.expiresAt);
      if (shouldKeepPolling(state) || (state === STATE.UNKNOWN && !expired)) {
        timer.current = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      setPhase('stopped');
      setMessage('');
      setError(stateMessage(expired && state === STATE.UNKNOWN ? STATE.EXPIRED : state));
    };
    timer.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [client, finish]);

  useEffect(() => { if (autoStart) start(); }, [autoStart, start]);

  const showing = link && (phase === 'waiting' || phase === 'signing');
  // The phone opens the QR in its own browser, so it must name the house, never
  // the native shell's local asset server (DR-0570).
  const origin = (typeof window === 'undefined' || isNativeShell(window)) ? HOUSE_ORIGIN : window.location.origin;
  const target = link ? qrTarget(origin, link.userCode) : '';
  const shownHost = origin.replace(/^https?:\/\//, '');
  const qrSize = tv ? 168 : 152;

  const label = phase === 'starting' ? 'Getting a code…'
    : (showing || phase === 'stopped') ? 'Show a new code'
      : 'Sign in with your phone';

  return (
    <section aria-labelledby="phone-signin-h" data-testid="phone-signin" className="border-2 border-[#1A1815] p-3 bg-white">
      <h3 id="phone-signin-h" className="text-sm font-semibold text-[#1A1815]">
        Sign in with your phone
      </h3>
      <p className="text-xs text-[#5A5751] mt-0.5 mb-2">
        Scan the code with the phone you already sign in on, then approve. Nothing to type with the remote.
      </p>

      {showing && (
        <div className={tv ? 'flex items-center gap-3 mb-2' : 'flex flex-col items-center gap-2 mb-2'}>
          <div className="bg-white p-1.5 border border-[#E8E4DC] shrink-0" data-testid="phone-signin-qr">
            <QRCodeSVG value={target} size={qrSize} level="M" includeMargin={false} aria-label="QR code: open this on your phone to sign in the TV" role="img" />
          </div>
          <div className={tv ? 'min-w-0' : 'text-center'}>
            <p className="text-xs text-[#5A5751]">Or open <span className="font-semibold text-[#1A1815]">{shownHost}/link</span> and enter</p>
            <p
              data-testid="phone-signin-code"
              className="text-2xl font-bold tracking-[0.15em] text-[#1A1815] mt-0.5"
              style={{ fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace' }}
              aria-label={`Code ${link.userCode.split('').join(' ')}`}
            >
              {formatUserCode(link.userCode)}
            </p>
            <p className="text-xs text-[#5A5751] mt-1">The code works for 10 minutes, once.</p>
          </div>
        </div>
      )}

      <p className="text-xs text-[#1A1815] min-h-[1rem]" role="status" aria-live="polite" data-testid="phone-signin-status">{message}</p>
      {error && <p className="text-xs text-[#7A1F1F] mb-1" role="alert" data-testid="phone-signin-error">{error}</p>}

      <button
        ref={btnRef}
        type="button"
        onClick={start}
        disabled={phase === 'starting' || phase === 'signing' || phase === 'done'}
        data-testid="phone-signin-button"
        className="w-full mt-1 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-3 min-h-[48px] bg-[#1A1815] text-white hover:bg-[#2E2B26] disabled:opacity-60 focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-[#B85838]"
      >
        <svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="12" height="16" rx="2" /><path d="M5.5 14h3" /></svg>
        {label}
      </button>
    </section>
  );
}
