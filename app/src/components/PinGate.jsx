// =============================================================================
// PinGate — the PIN set / enter overlay (multi-point auth P3, 2026-06-14)
// =============================================================================
// One reusable modal for both the account PIN (the >= 2-points knowledge factor)
// and the family persona PIN (shared-device picker gate). It NEVER stores or
// logs the PIN: the value lives only in transient component state, is passed to
// onSubmit (which calls the server RPC), and is cleared on success/unmount.
//
// modes:
//   'set'   — create a PIN: enter + confirm (must match), then onSubmit(pin).
//   'enter' — verify a PIN: one field, onSubmit(pin) returns the server verdict.
//
// onSubmit(pin) must resolve to:
//   { ok, locked?, retryAfterSeconds?, attemptsRemaining?, error? }
//
// WCAG 2.1 AA: role=dialog + aria-modal, labelled heading, real <label>s,
// numeric inmode, role="alert" for errors, visible focus outlines, disabled
// states, and a focus trap is unnecessary because the gate is the only
// interactive surface (it blocks the app beneath it).
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { isValidPinFormat } from '../lib/pin.js';

export default function PinGate({
  mode = 'enter',
  title,
  subtitle,
  onSubmit,
  onForgot,
  onCancel,
  submitLabel,
  // Biometric fast-unlock (optional). When onBiometric is provided AND we're in
  // 'enter' mode, a prominent fingerprint/Face button appears ABOVE the PIN, and
  // the PIN stays right below it as the always-available fallback. onBiometric
  // resolves to { ok, reason? }; on ok the parent unmounts the gate.
  onBiometric,
  biometricLabel,
}) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    // Clear any residual PIN state if this component unmounts.
    return () => { setPin(''); setConfirm(''); };
  }, []);

  const isSet = mode === 'set';
  const showBiometric = !isSet && typeof onBiometric === 'function';

  async function handleBiometric() {
    setError(''); setInfo('');
    setBioBusy(true);
    let res;
    try { res = await onBiometric(); }
    catch (_) { res = { ok: false, reason: 'error' }; }
    setBioBusy(false);
    if (res && res.ok) return; // parent unmounts on success
    // Any failure (cancelled, no match, unsupported) just falls back to the PIN.
    if (res && res.reason === 'cancelled') {
      setInfo('No problem — enter your PIN instead.');
    } else {
      setError('Fingerprint / Face didn’t verify. Enter your PIN to continue.');
    }
    if (firstRef.current) firstRef.current.focus();
  }
  const heading = title || (isSet ? 'Create your PIN' : 'Enter your PIN');
  const sub = subtitle || (isSet
    ? 'Pick a 4–8 digit PIN. This is your second key — you’ll use it with this device or your email sign-in.'
    : 'Enter your PIN to continue.');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (!isValidPinFormat(pin)) {
      setError('PIN must be 4–8 digits and not a single repeated digit.');
      return;
    }
    if (isSet && pin !== confirm) {
      setError('The two PINs don’t match. Try again.');
      return;
    }
    setBusy(true);
    let res;
    try { res = await onSubmit(pin); }
    catch (_) { res = { ok: false, error: { message: 'Something went wrong. Try again.' } }; }
    setBusy(false);

    if (res && res.ok) {
      setPin(''); setConfirm('');
      return; // parent unmounts the gate on success
    }
    if (res && res.locked) {
      const secs = res.retryAfterSeconds || 30;
      setError(`Too many attempts. Please wait ${secs} second${secs === 1 ? '' : 's'} and try again.`);
    } else if (res && typeof res.attemptsRemaining === 'number') {
      setError(`That PIN didn’t match. ${res.attemptsRemaining} attempt${res.attemptsRemaining === 1 ? '' : 's'} left before a short pause.`);
    } else if (res && res.error && res.error.message) {
      setError(res.error.message);
    } else {
      setError('That didn’t work. Try again.');
    }
    setPin(''); setConfirm('');
    if (firstRef.current) firstRef.current.focus();
  }

  const inputClass = 'w-full text-center tracking-[0.5em] text-2xl bg-white text-[#1A1815] border border-[#1A1815] px-3 py-3 focus:outline focus:outline-2 focus:outline-[#B85838] placeholder-[#9A958C]';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pin-gate-h"
      className="fixed inset-0 z-[60] bg-[#1A1815]/95 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-sm w-full p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Secure sign-in</div>
        <h2 id="pin-gate-h" className="text-xl sm:text-2xl mb-2"
          style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{heading}</h2>
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>{sub}</p>

        {showBiometric && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleBiometric}
              disabled={bioBusy || busy}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 disabled:cursor-not-allowed">
              {/* Fingerprint glyph (decorative; the label carries the meaning). */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 11c0 2.5 0 5-1 7" />
                <path d="M7 11a5 5 0 0 1 10 0c0 3 0 5-1 8" />
                <path d="M9.5 11a2.5 2.5 0 0 1 5 0c0 3.5-.5 6-1.5 8.5" />
                <path d="M4.5 9a8 8 0 0 1 15 0v2" />
              </svg>
              {bioBusy ? 'Waiting for fingerprint / Face…' : (biometricLabel || 'Unlock with fingerprint / Face')}
            </button>
            <div className="flex items-center gap-3 my-3" aria-hidden="true">
              <span className="h-px bg-[#1A1815]/20 flex-1" />
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">or enter your PIN</span>
              <span className="h-px bg-[#1A1815]/20 flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="pin-input" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1 font-semibold">
              {isSet ? 'New PIN' : 'PIN'}
            </label>
            <input
              id="pin-input"
              ref={firstRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={busy}
              aria-describedby="pin-help"
              className={inputClass}
              placeholder="••••"
            />
          </div>
          {isSet && (
            <div>
              <label htmlFor="pin-confirm" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1 font-semibold">Confirm PIN</label>
              <input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={busy}
                className={inputClass}
                placeholder="••••"
              />
            </div>
          )}

          <p id="pin-help" className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Digits only. Never share your PIN — we will never ask for it by email or phone.
          </p>

          {error && (
            <p role="alert" className="text-sm text-[#9A3412] bg-[#FDE7DC] border border-[#9A3412] px-3 py-2" style={{ fontFamily: '"Fraunces", serif' }}>{error}</p>
          )}
          {info && (
            <p role="status" className="text-sm text-[#3F5A2A]" style={{ fontFamily: '"Fraunces", serif' }}>{info}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 disabled:cursor-wait">
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                {/* Progress cue: the PIN is verified against a bcrypt hash on the
                    server (deliberately slow — that IS the security). A spinner +
                    "Checking securely" reassures during the ~2s wait so a normal
                    check doesn't read as a hang (Darrell 2026-07-14). */}
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Checking securely…
              </span>
            ) : (submitLabel || (isSet ? 'Set PIN' : 'Unlock'))}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between">
          {onForgot ? (
            <button type="button" onClick={onForgot} disabled={busy}
              className="text-[0.6875rem] underline text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Forgot your PIN?
            </button>
          ) : <span />}
          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={busy}
              className="text-[0.6875rem] underline text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Cancel
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}
