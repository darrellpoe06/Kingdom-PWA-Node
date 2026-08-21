// =============================================================================
// FamilyDoors — instant access for the family, from inside the Admin tab
// =============================================================================
// Darrell 2026-08-21, mid-lockout: "I'm inside the app... why can't I do
// solution inside the PoeTech App? instead of this dumb process" — "I should
// be able to give access instantly to her or anyone.... especially my family."
// This card is that solution made literal (DR-0065: the app is the primary
// artifact): pick the person, Generate (or type) a password, Set — they sign
// in immediately with email + password. No SSH, no terminal, no email
// delivery in the path. The database enforces who may do this and to whom
// (migration 0142); this surface never logs or stores the password anywhere.
import React, { useState } from 'react';
import { setFamilyPassword, generatePassword, FAMILY_DOOR_SUGGESTIONS } from '../lib/family-doors.js';
import UiIcon from './UiIcon.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

export default function FamilyDoors() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  function handleGenerate() {
    try {
      setPassword(generatePassword());
      setResult(null);
    } catch (e) {
      setResult({ ok: false, message: e.message });
    }
  }

  async function handleSet(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const r = await setFamilyPassword(email, password);
    setBusy(false);
    setResult(r);
  }

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
        <UiIcon name="lock" /> Family doors — instant access
      </div>
      <p className="text-sm text-[#1A1815] mt-2 leading-relaxed" style={serif}>
        Set a sign-in password for a family member, right here, right now. They sign in the moment you
        hand it to them — no email delivery in the path. Works only for your family and people already
        in your spaces; the database itself refuses anything else.
      </p>
      <form onSubmit={handleSet} className="mt-3 space-y-2.5">
        <div>
          <label htmlFor="fd-email" className="text-xs uppercase tracking-wider text-[#5A5751]">Their sign-in email</label>
          <input
            id="fd-email"
            type="email"
            list="fd-suggestions"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setResult(null); }}
            placeholder="mrspoe06@gmail.com"
            className="mt-1 w-full text-sm text-[#1A1815] bg-[#FAF8F4] border border-[#1A1815] px-2.5 py-2 focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <datalist id="fd-suggestions">
            {FAMILY_DOOR_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="fd-password" className="text-xs uppercase tracking-wider text-[#5A5751]">New password (8+ characters)</label>
          <div className="mt-1 flex gap-2">
            <input
              id="fd-password"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setResult(null); }}
              placeholder="tap Generate →"
              className="flex-1 min-w-0 text-sm text-[#1A1815] bg-[#FAF8F4] border border-[#1A1815] px-2.5 py-2"
              style={mono}
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="text-[0.6875rem] uppercase tracking-wider border-2 border-[#1A1815] text-[#1A1815] px-3 py-2 hover:bg-[#1A1815] hover:text-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Generate
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full text-[0.6875rem] uppercase tracking-wider bg-[#B85838] text-[#FAF8F4] px-3 py-2.5 hover:bg-[#a04d30] focus:outline focus:outline-2 focus:outline-[#1A1815] disabled:opacity-60"
        >
          {busy ? 'Setting…' : 'Set their password now'}
        </button>
      </form>
      {result && (
        <p
          aria-live="polite"
          className={`text-sm mt-2.5 leading-relaxed ${result.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
          style={serif}
        >
          {result.message}
        </p>
      )}
      <p className="text-[0.625rem] text-[#5A5751] italic mt-3" style={serif}>
        The password is bcrypt-hashed in the family database the moment you set it — it is never logged,
        never emailed, never stored in this browser. Read it to them or text it; they can change it after.
      </p>
    </section>
  );
}
