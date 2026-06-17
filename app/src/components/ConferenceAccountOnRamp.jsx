// =============================================================================
// ConferenceAccountOnRamp — the OPTIONAL "stay connected" step of the funnel
// =============================================================================
// Shown AFTER a successful open registration (ConferenceRegisterForm's sent state).
// The registration is already complete and saved; this is a purely optional
// invitation to create a PoeTech account so the one-time attendee becomes an app
// member — and so this very registration LINKS to that account (no re-entering).
//
// Truly optional (Darrell 2026-06-17): a registrant who skips is fully registered,
// no lockout. Three paths:
//   - Already signed in (the in-app front door)  -> auto-link, "added to your account".
//   - Google (PRIMARY, no email sent, no rate limit) -> park the link, redirect; the
//     full app claims it on return (lib/conference-link.wirePendingConferenceLink).
//   - Email + password (SECONDARY; shares the built-in 2/hr email wall) -> link
//     immediately if a session is returned, else "saved — will link when you sign in".
//
// Accessibility (WCAG 2.1 AA on white, mirrors ConferenceRegisterForm): #1A1815
// body, #5A5751 secondary, #7A1F1F error, #B85838 eyebrow/focus, >=44px targets,
// labelled inputs, aria-live status.
import React, { useEffect, useState } from 'react';
import supabase, { signInWithGoogle, signUpWithPassword, validateCredentials } from '../lib/supabase.js';
import { signInWithGooglePopup } from '../lib/oauth-popup.js';
import { setPendingConferenceLink, resolvePendingConferenceLink, claimConferenceRegistration } from '../lib/conference-link.js';

const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

export default function ConferenceAccountOnRamp({ regId = null, name = '', email = '' }) {
  // states: checking | offer | email | working | linked | email-sent | already | dismissed
  const [state, setState] = useState('checking');
  const [form, setForm] = useState({ email: email || '', password: '' });
  const [error, setError] = useState('');

  // On mount, if the person is ALREADY signed in (in-app front door), link their
  // just-made registration straight to their account — no need to offer sign-up.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data && data.session) {
          if (regId) await claimConferenceRegistration(regId);
          if (!cancelled) setState('already');
        } else {
          setState('offer');
        }
      } catch {
        if (!cancelled) setState('offer');
      }
    })();
    return () => { cancelled = true; };
  }, [regId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const startGoogle = async () => {
    setError('');
    // Park the link FIRST so it resolves whether we sign in via the in-place
    // popup OR fall back to a full-page redirect.
    setPendingConferenceLink(regId);
    let res;
    try {
      res = await signInWithGooglePopup();
    } catch {
      res = { error: { message: 'Could not start Google sign-in.' } };
    }
    if (res && res.ok) {
      // Signed in WITHOUT leaving the page — claim the parked registration now.
      const linked = await resolvePendingConferenceLink();
      setState(linked && linked.ok ? 'linked' : 'email-sent');
      return;
    }
    if (res && res.cancelled) return; // popup closed without signing in — stay on the offer
    // Popup blocked/unsupported/failed: classic full-page redirect. The link is
    // already parked, so the full app claims it on return.
    try {
      const { error: oauthErr } = await signInWithGoogle();
      if (oauthErr) setError(oauthErr.message || 'Could not start Google sign-in — please try again, or use email below.');
    } catch {
      setError('Could not start Google sign-in — please try again, or use email below.');
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    setError('');
    const v = validateCredentials(form.email, form.password);
    if (v.error) { setError(v.error.message); return; }
    setState('working');
    // Park the link first so it completes even if the session is delayed (email
    // confirmation on / rate-limited): the next successful sign-in will link it.
    setPendingConferenceLink(regId);
    let res;
    try {
      res = await signUpWithPassword(form.email, form.password, name);
    } catch (err) {
      res = { error: err };
    }
    if (res.error) {
      setState('email');
      setError(res.error.message || 'That didn’t work — please try again.');
      return;
    }
    const hasSession = !!(res.data && res.data.session);
    if (hasSession) {
      const linked = await resolvePendingConferenceLink();
      setState(linked.ok ? 'linked' : 'email-sent');
    } else {
      // No session yet (email confirmation on). Account is created; the pending
      // link stays parked and resolves on the next sign-in.
      setState('email-sent');
    }
  };

  if (state === 'dismissed') return null;

  // A signed-in member just linked their registration in place.
  if (state === 'already' || state === 'linked') {
    return (
      <div className="mt-4 pt-4 border-t border-[#E8E4DC]" aria-live="polite">
        <p className="text-sm font-semibold text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
          ✓ Added to your PoeTech account
        </p>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Your registration is connected to your account, so it’ll be right there when you open the app.
        </p>
      </div>
    );
  }

  // Email/password account created but session pending (confirmation/rate limit).
  if (state === 'email-sent') {
    return (
      <div className="mt-4 pt-4 border-t border-[#E8E4DC]" aria-live="polite">
        <p className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Account started — one more step</p>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Check {form.email || 'your email'} to confirm your account, then sign in. Your conference registration is saved and will connect to your account automatically when you sign in.
        </p>
      </div>
    );
  }

  // While we check the session, render a quiet placeholder (no flicker of the offer).
  if (state === 'checking') {
    return <div className="mt-4 pt-4 border-t border-[#E8E4DC]" aria-hidden="true" />;
  }

  // The optional offer (signed-out registrant).
  return (
    <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Optional · Free</div>
      <h4 className="text-base font-semibold text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        Your church, all in one place
      </h4>
      <p className="text-xs text-[#5A5751] mt-1 mb-3 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        Create a free PoeTech account and your registration, Assembly updates, and church resources stay together in one app — built for our community, never sold. Totally optional; you’re already registered.
      </p>

      {error && <p className="text-xs text-[#7A1F1F] mb-2" role="alert" aria-live="assertive">{error}</p>}

      {state === 'offer' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={startGoogle}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.59-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => { setState('email'); setError(''); }}
            className="w-full text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Use email & password instead
          </button>
          <button
            type="button"
            onClick={() => setState('dismissed')}
            className="w-full text-xs text-[#5A5751] underline px-4 py-2.5 min-h-[44px] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            No thanks — I’m all set
          </button>
        </div>
      )}

      {(state === 'email' || state === 'working') && (
        <form onSubmit={submitEmail} noValidate className="space-y-3">
          <div>
            <label htmlFor="cr-acct-email" className={labelCls}>Email</label>
            <input id="cr-acct-email" type="email" value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="cr-acct-pass" className={labelCls}>Password <span className="text-[#5A5751] font-normal">(at least 8 characters)</span></label>
            <input id="cr-acct-pass" type="password" value={form.password} onChange={set('password')} className={inputCls} autoComplete="new-password" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="submit" disabled={state === 'working'} className="text-xs uppercase tracking-wider px-5 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              {state === 'working' ? 'Creating…' : 'Create account →'}
            </button>
            <button type="button" onClick={() => { setState('offer'); setError(''); }} className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] text-[#5A5751] underline hover:text-[#1A1815]">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
