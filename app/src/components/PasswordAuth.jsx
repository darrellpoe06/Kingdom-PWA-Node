// =============================================================================
// PasswordAuth — the SIMPLE login: create your profile (or sign in) at install
// =============================================================================
// Darrell 2026-06-16: login must be simple. See "Download app" → install → create
// a profile RIGHT HERE (name + email + password) → you're in, and the installed
// app stays signed in on the phone. No link to click, nothing that looks like a
// virus. Email is only ever used to verify/recover.
//
// This is the self-contained form (calls the email+password helpers in
// supabase.js). The signed-in session that signUp/signIn returns is picked up by
// the app's existing onAuthChange — so wiring this in front of the access gate
// ("no profile, no access") is a separate, reviewed step. The Royalty Link stays
// as a small "trouble?" fallback so no one is ever locked out.
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary, #7A1F1F
// error, #B85838 focus ring, labelled inputs, >=44px targets, aria-live status.
import React, { useState } from 'react';
import { signUpWithPassword, signInWithPassword, validateCredentials, sendRoyaltyLink } from '../lib/supabase.js';

export default function PasswordAuth({ mode: initialMode = 'signup', onSignedIn = null }) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done | linksent
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isSignup = mode === 'signup';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    // Shared email + password rules (8-char min) live in validateCredentials.
    const v = validateCredentials(form.email, form.password);
    if (v.error) { setError(v.error.message); return; }
    if (isSignup) {
      if (!form.name.trim()) { setError('Please add your name.'); return; }
      if (form.password !== form.confirm) { setError('The two passwords don’t match.'); return; }
    }
    setStatus('working');
    const res = isSignup
      ? await signUpWithPassword(form.email, form.password, form.name)
      : await signInWithPassword(form.email, form.password);
    if (res.error) {
      setStatus('idle');
      setError(res.error.message || 'That didn’t work — please try again.');
      return;
    }
    // A session here means the app's onAuthChange will sign them in. If email
    // confirmation is still ON in the dashboard, signUp returns no session yet —
    // say so honestly rather than pretending they're in.
    const hasSession = !!res.data?.session;
    setStatus('done');
    if (hasSession && onSignedIn) onSignedIn(res.data.session);
    if (!hasSession && isSignup) setError('Account created — check your email to confirm, then sign in. (Ask Darrell to turn off email confirmation for instant access.)');
  };

  const tryLink = async () => {
    setError('');
    const { error } = await sendRoyaltyLink(form.email);
    if (error) { setError(error.message || 'Could not send the sign-in link.'); return; }
    setStatus('linksent');
  };

  const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
  const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';

  if (status === 'done' && !error) {
    return (
      <div className="max-w-sm" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>You’re in 🎉</h3>
        <p className="text-sm text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Welcome to PoeTech. This device will stay signed in.</p>
      </div>
    );
  }
  if (status === 'linksent') {
    return (
      <div className="max-w-sm" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Sign-in link sent</h3>
        <p className="text-sm text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Check {form.email || 'your email'} and tap the link to finish. Or go back and use your password.</p>
        <button type="button" onClick={() => setStatus('idle')} className="mt-3 text-xs uppercase tracking-wider underline text-[#5A6E3D]">Back to password</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">PoeTech</div>
      <h2 className="text-2xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
        {isSignup ? 'Create your profile' : 'Welcome back'}
      </h2>
      <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        {isSignup ? 'Name, email, and a password — that’s it. This device stays signed in.' : 'Sign in with your email and password.'}
      </p>

      <form onSubmit={submit} noValidate>
        {isSignup && (
          <div className="mb-3">
            <label htmlFor="pa-name" className={labelCls}>Your name</label>
            <input id="pa-name" type="text" value={form.name} onChange={set('name')} className={inputCls} autoComplete="name" />
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="pa-email" className={labelCls}>Email</label>
          <input id="pa-email" type="email" value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" />
        </div>
        <div className="mb-3">
          <label htmlFor="pa-password" className={labelCls}>Password <span className="text-[#5A5751] font-normal">(at least 8 characters)</span></label>
          <input id="pa-password" type="password" value={form.password} onChange={set('password')} className={inputCls} autoComplete={isSignup ? 'new-password' : 'current-password'} />
        </div>
        {isSignup && (
          <div className="mb-3">
            <label htmlFor="pa-confirm" className={labelCls}>Confirm password</label>
            <input id="pa-confirm" type="password" value={form.confirm} onChange={set('confirm')} className={inputCls} autoComplete="new-password" />
          </div>
        )}

        {error && <p className="text-xs text-[#7A1F1F] mb-2" role="alert" aria-live="assertive">{error}</p>}

        <button type="submit" disabled={status === 'working'} className="w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          {status === 'working' ? 'One moment…' : (isSignup ? 'Create profile & enter →' : 'Sign in →')}
        </button>
      </form>

      <div className="mt-4 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        {isSignup ? (
          <button type="button" onClick={() => { setMode('signin'); setError(''); }} className="underline hover:text-[#1A1815]">Already have a profile? Sign in</button>
        ) : (
          <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="underline hover:text-[#1A1815]">New here? Create a profile</button>
        )}
        <span className="mx-2 text-[#E8E4DC]">|</span>
        <button type="button" onClick={tryLink} className="underline hover:text-[#1A1815]">Trouble? Email me a sign-in link</button>
      </div>
    </div>
  );
}
