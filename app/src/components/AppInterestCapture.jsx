// =============================================================================
// AppInterestCapture — "Get the app / I'm having trouble" consented form
// =============================================================================
// The visitor-facing half of the invite list (project_download_attempt_admin_list).
// Shows the RIGHT install steps for the person's phone (fixes the church folks who
// "keep having issues" — almost always iOS Add-to-Home-Screen friction) AND lets
// them consent to leave name/email so Darrell + Christina can send a real invite.
// A browser can't tell us who they are; this asks, with consent, in exchange for
// help. Reachable from the InstallPrompt banner and as a shareable ?join=1 link.
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary, #7A1F1F /
// #5A6E3D accents, labelled inputs, #B85838 focus ring, >=44px targets, aria-live
// on the result + errors.
//
// One-tap install (2026-07-10, Darrell: "it should be easy — why can't I just
// push a button to download?"): the old `canPrompt` prop was NEVER passed by any
// caller, so this page showed manual menu-steps even while the browser was
// holding a captured beforeinstallprompt that could fire the native install
// dialog in one tap. Now the component asks install-app.js directly: when the
// one-tap is possible it leads with a real INSTALL BUTTON; the manual steps
// remain the fallback for iOS and for browsers that never handed the event over.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { detectPlatform, installSteps, validateInterest, isStandalone } from '../lib/install-help.js';
import { canPromptInstall, promptInstall } from '../lib/install-app.js';
import UiIcon from './UiIcon.jsx';
import { submitInterest } from '../lib/interest-sync.js';
import { FIELD_CAPS, looksLikeBot } from '../lib/sanitize-input.js';

export default function AppInterestCapture({ onClose = null, source = 'app' }) {
  const platform = useMemo(() => detectPlatform(), []);
  const [canTap, setCanTap] = useState(() => canPromptInstall());
  const [install, setInstall] = useState('idle'); // idle | installing | accepted
  useEffect(() => {
    // Chrome may hand beforeinstallprompt over AFTER this page mounts — arm the
    // one-tap button the moment it lands instead of missing it by a beat.
    if (canTap || typeof window === 'undefined') return undefined;
    const onPrompt = () => setCanTap(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [canTap]);
  const help = useMemo(() => installSteps(platform, canTap), [platform, canTap]);

  const doInstall = async () => {
    if (install === 'installing') return;
    setInstall('installing');
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstall('accepted');
    } else {
      // Declined or the event was already spent — fall back honestly to the
      // manual steps (canPromptInstall is false now that the event is used).
      setInstall('idle');
      setCanTap(canPromptInstall());
    }
  };
  const [form, setForm] = useState({ name: '', email: '', phone: '', issue: '', isMinor: false, parentConfirmed: false });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [hp, setHp] = useState(''); // honeypot — bots fill it, humans never see it
  const openedAt = useRef(Date.now()); // for the timing trap

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    // Anti-bot, invisible to humans: honeypot filled OR submitted impossibly fast.
    if (looksLikeBot({ honeypot: hp, elapsedMs: Date.now() - openedAt.current })) { setState('sent'); return; }
    const v = validateInterest(form);
    setErrors(v.errors);
    if (!v.ok) return;
    setState('sending');
    const res = await submitInterest({ ...form, platform, source });
    setState(res.ok ? 'sent' : 'error');
  };

  const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';
  const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

  if (state === 'sent') {
    return (
      <div className="max-w-md" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>You’re on the list 🎉</h3>
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Darrell or Christina will reach out with your invite and help you get PoeTech set up. In the meantime, the steps for your device are below.
        </p>
        <OneTapInstall canTap={canTap} install={install} onInstall={doInstall} />
        <InstallSteps help={help} />
        {onClose && (
          <button type="button" onClick={onClose} className="mt-4 text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Done</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Get the PoeTech app</div>
      <h3 className="text-lg font-semibold text-[#1A1815] mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
        {isStandalone() ? 'You’re already running the app' : 'Want it on your phone, or stuck installing?'}
      </h3>
      <p className="text-sm text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Follow the steps for your device — and if you’d like a personal invite + a hand getting set up, leave your name below and we’ll reach out.
      </p>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-4">
        <OneTapInstall canTap={canTap} install={install} onInstall={doInstall} />
        <InstallSteps help={help} />
      </div>

      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="ai-name" className={labelCls}>Your name</label>
          <input id="ai-name" type="text" maxLength={FIELD_CAPS.name} value={form.name} onChange={set('name')} className={inputCls} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'ai-name-err' : undefined} />
          {errors.name && <p id="ai-name-err" className="text-[0.6875rem] text-[#7A1F1F] mt-1" aria-live="polite">{errors.name}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="ai-email" className={labelCls}>Email <span className="text-[#5A5751] font-normal">(where we send your invite)</span></label>
          <input id="ai-email" type="email" maxLength={FIELD_CAPS.email} value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'ai-email-err' : undefined} />
          {errors.email && <p id="ai-email-err" className="text-[0.6875rem] text-[#7A1F1F] mt-1" aria-live="polite">{errors.email}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="ai-phone" className={labelCls}>Phone <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="ai-phone" type="tel" maxLength={FIELD_CAPS.phone} value={form.phone} onChange={set('phone')} className={inputCls} autoComplete="tel" />
        </div>
        <div className="mb-3">
          <label htmlFor="ai-issue" className={labelCls}>What’s going on? <span className="text-[#5A5751] font-normal">(optional — tell us what’s not working)</span></label>
          <textarea id="ai-issue" rows={2} maxLength={FIELD_CAPS.issue} value={form.issue} onChange={set('issue')} className={inputCls} />
        </div>

        <label className="flex items-start gap-2 mb-2 text-xs text-[#1A1815]">
          <input type="checkbox" checked={form.isMinor} onChange={set('isMinor')} className="mt-0.5 min-h-[20px] min-w-[20px]" />
          <span style={{ fontFamily: '"Fraunces", serif' }}>This is for someone under 18</span>
        </label>
        {form.isMinor && (
          <label className="flex items-start gap-2 mb-2 text-xs text-[#1A1815]">
            <input type="checkbox" checked={form.parentConfirmed} onChange={set('parentConfirmed')} className="mt-0.5 min-h-[20px] min-w-[20px]" aria-invalid={!!errors.parentConfirmed} />
            <span style={{ fontFamily: '"Fraunces", serif' }}>A parent or guardian has said it’s okay and will help them get set up.</span>
          </label>
        )}
        {errors.parentConfirmed && <p className="text-[0.6875rem] text-[#7A1F1F] mb-2" aria-live="polite">{errors.parentConfirmed}</p>}

        {/* honeypot: visually hidden, off-tab; bots fill it, people don't */}
        <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

        <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          We only use this to send your invite and help you get set up. Your info stays with PoeTech — never sold, never shared.
        </p>

        {state === 'error' && (
          <p className="text-xs text-[#7A1F1F] mb-2" aria-live="assertive">
            Something went wrong sending that. Please try again, or email darrellpoe06@gmail.com.
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={state === 'sending'} className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
            {state === 'sending' ? 'Sending…' : 'Send me an invite →'}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border border-[#5A5751] text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Close</button>
          )}
        </div>
      </form>
    </div>
  );
}

// The button Darrell asked for: when the browser handed us its install event,
// ONE TAP fires the native install dialog right here. Hidden when the app is
// already installed (standalone) or the event isn't available (steps carry it).
function OneTapInstall({ canTap, install, onInstall }) {
  if (isStandalone()) return null;
  if (install === 'accepted') {
    return (
      <p className="text-sm font-semibold text-[#5A6E3D] mb-2" role="status" aria-live="polite">
        ✓ Installing — PoeTech is landing on your home screen.
      </p>
    );
  }
  if (!canTap) return null;
  return (
    <button
      type="button"
      onClick={onInstall}
      disabled={install === 'installing'}
      className="w-full mb-3 inline-flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider px-4 py-3 min-h-[44px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#B85838] disabled:opacity-60 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
    >
      <UiIcon name="phone" />
      {install === 'installing' ? 'Opening the install…' : 'Install PoeTech on this device'}
    </button>
  );
}

function InstallSteps({ help }) {
  return (
    <div>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">{help.title}</div>
      <ol className="list-decimal pl-5 space-y-1">
        {help.steps.map((s, i) => (
          <li key={i} className="text-xs text-[#1A1815] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
