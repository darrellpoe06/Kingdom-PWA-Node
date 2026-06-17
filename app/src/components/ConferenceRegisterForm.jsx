// =============================================================================
// ConferenceRegisterForm — the ONE simple, open registration the congregation uses
// =============================================================================
// No account, no friction: name + meal + (always-offered) allergy/dietary, plus
// optional email/phone/days/party. Writes a REAL row to
// conference_public_registrations (migration 0027) that organizers see — replacing
// the old device-only RSVP that falsely confirmed and never synced. Shared by the
// standalone public page (?register=1) and the in-app front door so there is ONE
// code path and one source of truth.
//
// Accessibility (WCAG 2.1 AA on white, mirrors AppInterestCapture): #1A1815 body,
// #5A5751 secondary, #7A1F1F error, #B85838 focus ring, >=44px targets, labelled
// inputs, aria-live on the result + errors. Honeypot swallows bot submissions.
import React, { useState } from 'react';
import { MEAL_TYPES, validateRegistration, submitRegistration } from '../lib/conference-register.js';
import ConferenceAccountOnRamp from './ConferenceAccountOnRamp.jsx';

const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

export default function ConferenceRegisterForm({ conferenceName = '', source = 'public-link', onDone = null }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', mealType: 'Regular', dietary: '', days: '', partySize: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [regId, setRegId] = useState(null); // the just-created row id, for the optional account link
  const [hp, setHp] = useState(''); // honeypot — bots fill it, humans never see it

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (hp) { setState('sent'); return; } // silently swallow bot submissions
    const v = validateRegistration(form);
    setErrors(v.errors);
    if (!v.ok) return;
    setState('sending');
    const res = await submitRegistration({ ...form, conferenceName, source });
    if (res.ok) setRegId(res.id || null);
    setState(res.ok ? 'sent' : 'error');
  };

  if (state === 'sent') {
    return (
      <div className="max-w-md" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>You’re registered 🎉</h3>
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Thank you{form.name ? `, ${form.name.trim().split(/\s+/)[0]}` : ''} — we’ve got your registration{conferenceName ? ` for ${conferenceName}` : ''}. We look forward to seeing you. If anything changes, just register again or let a leader know.
        </p>
        <button
          type="button"
          onClick={() => { setForm({ name: '', email: '', phone: '', mealType: 'Regular', dietary: '', days: '', partySize: '' }); setErrors({}); setRegId(null); setState('idle'); if (onDone) onDone(); }}
          className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          Register someone else
        </button>

        {/* OPTIONAL second step of the funnel: create an account so this very
            registration carries into app membership. Skipping it changes nothing —
            the registration above is already saved. */}
        <ConferenceAccountOnRamp regId={regId} name={form.name} email={form.email} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md">
      <div className="mb-3">
        <label htmlFor="cr-name" className={labelCls}>Your name</label>
        <input id="cr-name" type="text" value={form.name} onChange={set('name')} className={inputCls} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cr-name-err' : undefined} />
        {errors.name && <p id="cr-name-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="mb-1">
          <label htmlFor="cr-email" className={labelCls}>Email <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="cr-email" type="email" value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'cr-email-err' : undefined} />
          {errors.email && <p id="cr-email-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.email}</p>}
        </div>
        <div className="mb-1">
          <label htmlFor="cr-phone" className={labelCls}>Phone <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="cr-phone" type="tel" value={form.phone} onChange={set('phone')} className={inputCls} autoComplete="tel" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <div className="mb-1">
          <label htmlFor="cr-meal" className={labelCls}>Meal preference</label>
          <select id="cr-meal" value={form.mealType} onChange={set('mealType')} className={inputCls}>
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="mb-1">
          <label htmlFor="cr-party" className={labelCls}>How many in your party? <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="cr-party" type="number" min="1" max="99" inputMode="numeric" value={form.partySize} onChange={set('partySize')} className={inputCls} placeholder="1" aria-invalid={!!errors.partySize} aria-describedby={errors.partySize ? 'cr-party-err' : undefined} />
          {errors.partySize && <p id="cr-party-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.partySize}</p>}
        </div>
      </div>

      {/* Allergy / dietary — ALWAYS offered (not hidden behind "Other"), so a Vegan
          or Gluten-free guest with a nut allergy can still tell catering. */}
      <div className="mb-3 mt-2">
        <label htmlFor="cr-dietary" className={labelCls}>Allergy or specific dietary need <span className="text-[#5A5751] font-normal">(optional)</span></label>
        <input id="cr-dietary" type="text" value={form.dietary} onChange={set('dietary')} className={inputCls} placeholder="e.g., nut allergy, no pork" />
      </div>

      <div className="mb-3">
        <label htmlFor="cr-days" className={labelCls}>Which days will you come? <span className="text-[#5A5751] font-normal">(optional)</span></label>
        <input id="cr-days" type="text" value={form.days} onChange={set('days')} className={inputCls} placeholder="e.g., Fri & Sat, or all week" />
      </div>

      {/* honeypot: visually hidden, off-tab; bots fill it, people don't */}
      <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      <p className="text-[11px] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        We only use this to plan seating + meals and to reach you about the Assembly. Your info stays with the church — never sold, never shared.
      </p>

      {state === 'error' && (
        <p className="text-xs text-[#7A1F1F] mb-2" aria-live="assertive">
          Something went wrong saving your registration — it did NOT go through. Please check your connection and try again, or let a leader know.
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="text-xs uppercase tracking-wider px-5 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          {state === 'sending' ? 'Registering…' : 'Register →'}
        </button>
      </div>
    </form>
  );
}
