// =============================================================================
// PasswordAuth — sign in YOUR way: the emailed link first, a password only by choice
// =============================================================================
// Darrell 2026-06-16: login must be simple. Darrell 2026-07-10 (live): "I can't
// even download the PoeTech App unless I have a password... I only use my PIN —
// can I do that only, and/or my fingerprint? Some people use email and password,
// some a PIN, some fingerprints." COMMUNITY-FIRST commitment 2 is binding: "No
// required password-typing — magic-link or biometric or device-trust where
// possible." So the DEFAULT door asks for name + email only and emails the
// Royalty Link (no password exists unless the person WANTS one); the password
// form lives behind an explicit "use a password instead" choice. After the first
// sign-in, the existing multi-point machinery takes over: trust the device, set
// a PIN or enroll a fingerprint, and that's all this device ever asks for.
//
// The signed-in session is picked up by the app's existing onAuthChange. No
// lockout path: every mode links to every other mode.
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary, #7A1F1F
// error, #B85838 focus ring, labelled inputs, >=44px targets, aria-live status.
import React, { useState } from 'react';
import {
  signUpWithPassword, signInWithPassword, validateCredentials, sendRoyaltyLink,
  signUpWithPhonePin, signInWithPhonePin, validatePhonePin,
} from '../lib/supabase.js';

// `embedded` hides this component's own eyebrow + big heading + intro line so it
// can sit inside a frame that already supplies them (e.g. AuthModal). The form,
// the create/sign-in toggle, and the Royalty Link fallback are unchanged — so
// there is still no lockout path no matter where it renders.
// `brand` skins the entry for a specific door (DR-0174: the church door wears
// "The Love Corner" + the church logo, not "PoeTech"). Null = PoeTech's own
// front door, unchanged. Shape: { name, eyebrow, logo }.
export default function PasswordAuth({ mode: initialMode = 'signup', onSignedIn = null, embedded = false, brand = null }) {
  const brandName = (brand && brand.name) || 'PoeTech';
  const brandEyebrow = (brand && (brand.eyebrow || brand.name)) || 'PoeTech';
  const brandLogo = (brand && brand.logo) || null;
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  const [usePassword, setUsePassword] = useState(false); // the LINK is the default door
  const [usePhonePin, setUsePhonePin] = useState(false); // phone + PIN, no email (DR-0172)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', pin: '', pinConfirm: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done | linksent
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isSignup = mode === 'signup';

  // Phone + PIN door (Darrell 2026-07-11: "not everyone has an email so
  // cellphone and pin"). Validated locally first; the real phone + name ride in
  // user_metadata; email is added later, never required to start.
  const submitPhonePin = async (e) => {
    e.preventDefault();
    setError('');
    const v = validatePhonePin(form.phone, form.pin);
    if (v.error) { setError(v.error.message); return; }
    if (isSignup) {
      if (!form.name.trim()) { setError('Please add your name.'); return; }
      if (form.pin !== form.pinConfirm) { setError('The two PINs don’t match.'); return; }
    }
    setStatus('working');
    const res = isSignup
      ? await signUpWithPhonePin(form.phone, form.pin, form.name)
      : await signInWithPhonePin(form.phone, form.pin);
    if (res.error) {
      setStatus('idle');
      setError(res.error.message || 'That didn’t work — please check your phone number and PIN.');
      return;
    }
    const hasSession = !!res.data?.session;
    setStatus('done');
    if (hasSession && onSignedIn) onSignedIn(res.data.session);
    if (!hasSession && isSignup) setError('Account created — you can sign in now with your phone and PIN.');
  };

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
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter your email address.'); return; }
    if (isSignup && !usePassword && !form.name.trim()) { setError('Please add your name.'); return; }
    setStatus('working');
    const { error } = await sendRoyaltyLink(form.email, { name: form.name });
    if (error) { setStatus('idle'); setError(error.message || 'Could not send the sign-in link.'); return; }
    setStatus('linksent');
  };

  const linkSubmit = (e) => { e.preventDefault(); tryLink(); };

  const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
  const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';

  if (status === 'done' && !error) {
    return (
      <div className="max-w-sm" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>You’re in 🎉</h3>
        <p className="text-sm text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Welcome to {brandName}. This device will stay signed in.</p>
      </div>
    );
  }
  if (status === 'linksent') {
    return (
      <div className="max-w-sm" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Sign-in link sent</h3>
        <p className="text-sm text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Check {form.email || 'your email'} and tap the link — that’s the whole sign-in. No password.</p>
        <button type="button" onClick={() => setStatus('idle')} className="mt-3 text-xs uppercase tracking-wider underline text-[#5A6E3D]">Back</button>
      </div>
    );
  }

  // THE PHONE + PIN DOOR — no email at all (DR-0172). Name (first time) + phone
  // + a 6-digit PIN, and you're in. Email is added later, in settings, and is
  // never required to start. Reachable from both other doors; links back so
  // there is never a lockout.
  if (usePhonePin) {
    return (
      <div className={embedded ? '' : 'max-w-sm'}>
        {!embedded && (
          <>
            {brandLogo && <img src={brandLogo} alt="" className="h-10 w-10 mb-1.5" />}
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{brandEyebrow}</div>
            <h2 className="text-2xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {isSignup ? 'Create your profile' : 'Welcome back'}
            </h2>
          </>
        )}
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          No email needed — just your phone number and a 6-digit PIN. {isSignup ? 'You can add an email later if you ever want one.' : 'Enter the PIN you set up.'}
        </p>
        <form onSubmit={submitPhonePin} noValidate>
          {isSignup && (
            <div className="mb-3">
              <label htmlFor="pa-name" className={labelCls}>Your name</label>
              <input id="pa-name" type="text" value={form.name} onChange={set('name')} className={inputCls} autoComplete="name" />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="pa-phone" className={labelCls}>Cell phone number</label>
            <input id="pa-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} className={inputCls} autoComplete="tel" placeholder="(555) 555-5555" />
          </div>
          <div className="mb-3">
            <label htmlFor="pa-pin" className={labelCls}>{isSignup ? 'Choose a 6-digit PIN' : 'Your 6-digit PIN'}</label>
            <input id="pa-pin" type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={set('pin')} className={inputCls} autoComplete={isSignup ? 'new-password' : 'current-password'} />
          </div>
          {isSignup && (
            <div className="mb-3">
              <label htmlFor="pa-pinconfirm" className={labelCls}>Confirm your PIN</label>
              <input id="pa-pinconfirm" type="password" inputMode="numeric" maxLength={6} value={form.pinConfirm} onChange={set('pinConfirm')} className={inputCls} autoComplete="new-password" />
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
          <button type="button" onClick={() => { setUsePhonePin(false); setError(''); }} className="underline hover:text-[#1A1815]">Use email instead</button>
        </div>
      </div>
    );
  }

  // THE DEFAULT DOOR — no password exists here. Name (first time) + email, one
  // button, and the emailed link signs them in. The password form is a CHOICE.
  if (!usePassword) {
    return (
      <div className={embedded ? '' : 'max-w-sm'}>
        {!embedded && (
          <>
            {brandLogo && <img src={brandLogo} alt="" className="h-10 w-10 mb-1.5" />}
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{brandEyebrow}</div>
            <h2 className="text-2xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {isSignup ? 'Create your profile' : 'Welcome back'}
            </h2>
          </>
        )}
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          No password needed — we email you a sign-in link. After the first time, this
          device can unlock with just your PIN or fingerprint.
        </p>
        <form onSubmit={linkSubmit} noValidate>
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
          {error && <p className="text-xs text-[#7A1F1F] mb-2" role="alert" aria-live="assertive">{error}</p>}
          <button type="submit" disabled={status === 'working'} className="w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
            {status === 'working' ? 'One moment…' : 'Email me my sign-in link →'}
          </button>
        </form>
        {/* No-email members are the point (COMMUNITY-FIRST — the deacon with a
            flip phone, DR-0172). The phone+PIN way is a PROMINENT option here,
            not fine print, so it's found without scrolling past email copy. */}
        <div className="mt-3 flex items-center gap-2" aria-hidden="true">
          <span className="h-px flex-1 bg-[#E8E4DC]"></span>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">or</span>
          <span className="h-px flex-1 bg-[#E8E4DC]"></span>
        </div>
        <button type="button" onClick={() => { setUsePhonePin(true); setError(''); }}
          className="mt-3 w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          No email? Use your phone number + a PIN
        </button>
        <div className="mt-4 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          {isSignup ? (
            <button type="button" onClick={() => { setMode('signin'); setError(''); }} className="underline hover:text-[#1A1815]">Already have a profile? Sign in</button>
          ) : (
            <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="underline hover:text-[#1A1815]">New here? Create a profile</button>
          )}
          <span className="mx-2 text-[#E8E4DC]">|</span>
          <button type="button" onClick={() => { setUsePassword(true); setError(''); }} className="underline hover:text-[#1A1815]">Prefer a password? Use one</button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'max-w-sm'}>
      {!embedded && (
        <>
          {brandLogo && <img src={brandLogo} alt="" className="h-10 w-10 mb-1.5" />}
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{brandEyebrow}</div>
          <h2 className="text-2xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {isSignup ? 'Create your profile' : 'Welcome back'}
          </h2>
          <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            {isSignup ? 'Name, email, and a password — that’s it. This device stays signed in.' : 'Sign in with your email and password.'}
          </p>
        </>
      )}

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
        <button type="button" onClick={() => { setUsePassword(false); setError(''); }} className="underline hover:text-[#1A1815]">No password — email me a link instead</button>
      </div>
      <div className="mt-2 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        <button type="button" onClick={() => { setUsePhonePin(true); setError(''); }} className="underline hover:text-[#1A1815]">No email? Use a phone number + PIN</button>
      </div>
    </div>
  );
}
