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
}) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    // Clear any residual PIN state if this component unmounts.
    return () => { setPin(''); setConfirm(''); };
  }, []);

  const isSet = mode === 'set';
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
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Secure sign-in</div>
        <h2 id="pin-gate-h" className="text-xl sm:text-2xl mb-2"
          style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{heading}</h2>
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>{sub}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="pin-input" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1 font-semibold">
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
              <label htmlFor="pin-confirm" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1 font-semibold">Confirm PIN</label>
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

          <p id="pin-help" className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
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
            className="w-full bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'Working…' : (submitLabel || (isSet ? 'Set PIN' : 'Unlock'))}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between">
          {onForgot ? (
            <button type="button" onClick={onForgot} disabled={busy}
              className="text-[11px] underline text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Forgot your PIN?
            </button>
          ) : <span />}
          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={busy}
              className="text-[11px] underline text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Cancel
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}
