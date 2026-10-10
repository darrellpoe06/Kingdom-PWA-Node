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
import React, { useState, useEffect } from 'react';
import { authErrorMessage } from '../lib/auth-error-message.js';
import {
  signUpWithPassword, signInWithPassword, validateCredentials, validateSignIn, sendRoyaltyLink,
  signUpWithPhonePin, signInWithPhonePin, validatePhonePin, signInWithGoogle,
} from '../lib/supabase.js';
import { signInWithGooglePopup } from '../lib/oauth-popup.js';
import { primeAuthProviders, guardProviderCached, guardProvider, resetAuthProvidersCache, cachedProviderStatus } from '../lib/auth-providers.js';

// `embedded` hides this component's own eyebrow + big heading + intro line so it
// can sit inside a frame that already supplies them (e.g. AuthModal). The form,
// the create/sign-in toggle, and the Royalty Link fallback are unchanged — so
// there is still no lockout path no matter where it renders.
// `brand` skins the entry for a specific door (DR-0174: the church door wears
// "The Love Corner" + the church logo, not "PoeTech"). Null = PoeTech's own
// front door, unchanged. Shape: { name, eyebrow, logo }.
export default function PasswordAuth({ mode: initialMode = 'signup', onSignedIn = null, embedded = false, brand = null, startWith = 'phone' }) {
  const brandName = (brand && brand.name) || 'PoeTech';
  const brandEyebrow = (brand && (brand.eyebrow || brand.name)) || 'PoeTech';
  const brandLogo = (brand && brand.logo) || null;
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  // PASSWORD LEADS THE EMAIL DOOR (2026-09-07). On the sovereign stack email
  // sending is deliberately out of auth's critical path (DR-0307 §3) — the
  // witness measures it: SMTP not wired, 184 mailer complaints in one log
  // tail. Shay chose "email", was led to the LINK first, saw "Sign-in link
  // sent", and waited on a promise the server could not keep. Her account has
  // a password; that door was one tap further and labelled as the alternate.
  // The door now opens on what works and demotes the link to the alternate.
  const [usePassword, setUsePassword] = useState(true);
  // Phone + PIN is the DEFAULT door (DR-0307 §3: on the sovereign stack SMTP
  // is deliberately out of auth's critical path — phone+PIN and password lead,
  // magic links are a later optional add). The email link led here until
  // 2026-08-19, when the first post-cutover sign-in walked straight into the
  // one path the backend cannot serve yet and read "we can't reach our
  // service" — the door must lead with what works.
  // phone + PIN, no email (DR-0172) — the default door, and what leads for the
  // congregation (DR-0307 §3). A caller whose IDENTITY IS an email address opts
  // out with startWith="email": the Poe Properties door recognizes an invited
  // tenant or 1099 worker by the exact address their landlord invited, so
  // leading with phone+PIN there would hand them a login that cannot match
  // their invitation (caught on the door's first render check, 2026-08-26).
  const [usePhonePin, setUsePhonePin] = useState(startWith !== 'email');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', pin: '', pinConfirm: '' });
  const [error, setError] = useState('');
  // The backend's raw words, rendered SMALL under the friendly sentence so a
  // screenshot diagnoses itself (2026-08-19: three historical incidents share
  // one friendly message; the differentiating detail lived only in the console).
  const [errorDetail, setErrorDetail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done | linksent

  // =========================================================================
  // A DOOR THAT NEEDS NO EMAIL AT ALL (Darrell, 2026-10-10, locked out of Poe
  // Properties on his own phone: "Never sent an email link to let me in!!!!!!?!")
  // =========================================================================
  // He was right and the app was wrong. SMTP has never been wired on the
  // family server, so the Royalty Link cannot arrive -- and THIS component,
  // which is the Poe Properties door (PropertiesDoor.jsx:422), offered email
  // and phone and nothing else. Google was already built, already guarded,
  // already proven in AuthModal, DeviceLinkApprove and ConferenceAccountOnRamp
  // -- and was simply absent from the one door he was standing at, while his
  // own address is a gmail address.
  //
  // So the same proven path comes here: ask GoTrue what is actually switched
  // on BEFORE navigating (auth-providers, born of the 2026-09-11 church
  // meeting where a dead provider put raw JSON on a member's screen), popup
  // first, full-page redirect as the fallback. A provider that is off says so
  // in words; it never dead-ends and never shows JSON.
  const [oauthBusy, setOauthBusy] = useState(false);
  // WHAT THE SERVER SAYS GOOGLE IS (2026-10-10, Darrell on the "Link
  // requested" screen: "Need to work with Google... doesn't work!!!!!!!").
  // This door offered Google on every screen whether or not the family server
  // had it switched on, and on the "Link requested" screen the guard's refusal
  // was written to an error this screen never drew -- so the tap did nothing
  // at all. DR-0361's rule is that a provider switched OFF is never offered:
  // once the probe says 'disabled' the button is replaced by a sentence that
  // says so, and every refusal from this door is drawn right under it.
  const [googleState, setGoogleState] = useState(() => cachedProviderStatus('google'));
  const [googleError, setGoogleError] = useState('');
  useEffect(() => {
    let live = true;
    Promise.resolve(primeAuthProviders()).then(() => { if (live) setGoogleState(cachedProviderStatus('google')); });
    return () => { live = false; };
  }, []);
  const googleOff = googleState === 'disabled';

  const handleGoogle = async () => {
    setError(''); setErrorDetail(''); setGoogleError('');
    setOauthBusy(true);
    // Read the primed probe SYNCHRONOUSLY: awaiting here would spend the user
    // gesture that window.open needs. Not-yet-known proceeds, as in AuthModal.
    const gate = guardProviderCached('google');
    if (!gate.ok) { setOauthBusy(false); setGoogleError(gate.message); setGoogleState('disabled'); return; }
    let res;
    try {
      res = await signInWithGooglePopup();
    } catch (e) {
      res = { error: { message: (e && e.message) || 'Google sign-in could not start.' } };
    }
    if (res && res.ok) { setOauthBusy(false); if (onSignedIn) onSignedIn(); return; }
    if (res && (res.blocked || res.unsupported || res.error)) {
      const fb = await signInWithGoogle();
      if (fb && fb.error) {
        setOauthBusy(false);
        setGoogleError(fb.error.message || 'Google sign-in isn’t available right now — use a password or your phone below.');
      }
      return; // a started redirect navigates away
    }
    // Closed with no session: usually a cancel, but it is also what a dead
    // provider looks like when the probe could not reach GoTrue. Ask once more.
    setOauthBusy(false);
    resetAuthProvidersCache();
    const recheck = await guardProvider('google');
    if (!recheck.ok) { setGoogleError(recheck.message); setGoogleState('disabled'); }
  };

  const googleDoor = (
    <>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 bg-[#E8E4DC]"></span>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">or</span>
        <span className="h-px flex-1 bg-[#E8E4DC]"></span>
      </div>
      {googleOff ? (
        <p className="mt-3 text-xs text-[#5A5751] leading-relaxed" data-testid="google-door-off" role="status" style={{ fontFamily: '"Fraunces", serif' }}>
          Google sign-in is not switched on at the family server yet. Use your password, or your phone number and PIN.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthBusy}
          data-testid="google-door"
          className="mt-3 w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {oauthBusy ? 'One moment…' : 'Continue with Google — no email needed'}
        </button>
      )}
      {googleError && !googleOff && (
        <p className="mt-2 text-xs text-[#B85838]" role="alert" data-testid="google-door-error">{googleError}</p>
      )}
    </>
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isSignup = mode === 'signup';

  // Phone + PIN door (Darrell 2026-07-11: "not everyone has an email so
  // cellphone and pin"). Validated locally first; the real phone + name ride in
  // user_metadata; email is added later, never required to start.
  const submitPhonePin = async (e) => {
    e.preventDefault();
    setError(''); setErrorDetail('');
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
      const m1 = authErrorMessage(res.error, 'That didn’t work — please check your phone number and PIN.');
      setError(m1.text); setErrorDetail(m1.detail);
      return;
    }
    const hasSession = !!res.data?.session;
    setStatus('done');
    if (hasSession && onSignedIn) onSignedIn(res.data.session);
    if (!hasSession && isSignup) setError('Account created — you can sign in now with your phone and PIN.');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrorDetail('');
    // Signing UP sets a credential and may demand 8 characters; signing IN
    // checks one that already exists and may not second-guess its length.
    // Christina's six-character password was refused here before any network
    // call, which locked her out of her own account (see lib/supabase.js).
    const v = isSignup
      ? validateCredentials(form.email, form.password)
      : validateSignIn(form.email, form.password);
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
      const m2 = authErrorMessage(res.error);
      setError(m2.text); setErrorDetail(m2.detail);
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
    setError(''); setErrorDetail('');
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter your email address.'); return; }
    if (isSignup && !usePassword && !form.name.trim()) { setError('Please add your name.'); return; }
    setStatus('working');
    const { error } = await sendRoyaltyLink(form.email, { name: form.name });
    if (error) { setStatus('idle'); const m3 = authErrorMessage(error, 'Could not send the sign-in link.'); setError(m3.text); setErrorDetail(m3.detail); return; }
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
        {/* SAY ONLY WHAT IS KNOWN (DR-0076 §1, DR-0100). This screen knows the
            REQUEST was accepted. It does not know the mail left the server —
            and on the family server it measurably does not (SMTP unwired,
            2026-09-07 witness). "Sign-in link sent" was a claim the app could
            not back, and Shay waited on it. The headline now states the
            request, the body states the limit, and the working door is a
            BUTTON here — not a hint to go back and find. */}
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Link requested</h3>
        <p className="text-sm text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>We asked the server to email {form.email || 'you'} a sign-in link. If it arrives, tap it — that’s the whole sign-in.</p>
        <p className="text-xs text-[#5A5751] mt-2 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          No email after a couple of minutes? Don’t keep waiting — email sending is not set up on the
          family server, so the link cannot arrive at all. Use one of the doors below instead: {googleOff ? '' : 'Google needs no email, and '}a
          password works without one IF you set a password when you signed up.
        </p>
        <button type="button" onClick={() => { setUsePassword(true); setStatus('idle'); setError(''); }}
          className="mt-3 w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          Sign in with my password instead →
        </button>
        {/* The door that needs no email at all, ON the screen where the email
            door just failed. This is where Darrell was standing. */}
        {googleDoor}
        <p className="text-xs text-[#5A5751] mt-2 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Forgot it, or never set one? It can’t be emailed to you — there is no password-reset email either.{' '}
          {googleOff ? null : <><strong>Continue with Google</strong> above needs no email at all. </>}Otherwise use the
          <strong> phone number + PIN</strong> door if you set one up, or ask the person who runs this
          server to set a password on your account.
        </p>
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
          {error && errorDetail && errorDetail !== error && <p className="text-[0.625rem] text-[#5A5751] mb-2 break-all" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{errorDetail}</p>}
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
          {error && errorDetail && errorDetail !== error && <p className="text-[0.625rem] text-[#5A5751] mb-2 break-all" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{errorDetail}</p>}
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
        {googleDoor}
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
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{brandEyebrow}</div>
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
          {error && errorDetail && errorDetail !== error && <p className="text-[0.625rem] text-[#5A5751] mb-2 break-all" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{errorDetail}</p>}

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
      {/* The phone+PIN way stays PROMINENT from here too (COMMUNITY-FIRST, the
          deacon with a flip phone, DR-0172) — now that the password form is
          the email door's first screen, this is where that reader lands. */}
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 bg-[#E8E4DC]"></span>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">or</span>
        <span className="h-px flex-1 bg-[#E8E4DC]"></span>
      </div>
      <button type="button" onClick={() => { setUsePhonePin(true); setError(''); }}
        className="mt-3 w-full text-xs uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
        No email? Use your phone number + a PIN
      </button>
      {googleDoor}
    </div>
  );
}
