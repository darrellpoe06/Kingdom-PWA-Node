// =============================================================================
// VenueRequestForm — the ONE simple "request a space" form the community uses
// =============================================================================
// No account, no friction: the community asks to use the church's campuses a lot
// (funerals, weddings, gatherings). Name + campus + space + event type + date is
// all that's required; everything else is optional. Writes a REAL row to
// venue_bookings (migration 0030) that staff see and manage — the same honest
// closed loop as the conference public registration. Shared by the standalone
// public page (?request-space=1) and the in-app front door so there is ONE code
// path and one source of truth.
//
// Accessibility (WCAG 2.1 AA on white, mirrors ConferenceRegisterForm): #1A1815
// body, #5A5751 secondary, #7A1F1F error, #B85838 focus ring, >=44px targets,
// labelled inputs, aria-live on the result + errors. Honeypot swallows bots.
import React, { useState } from 'react';
import {
  CAMPUSES, EVENT_TYPES, spacesForCampus, validateBookingRequest, submitSpaceRequest,
} from '../lib/venue-rental.js';

const labelCls = 'block text-xs font-semibold text-[#1A1815] mb-1';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2.5 min-h-[44px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

const BLANK = {
  requesterName: '', requesterEmail: '', requesterPhone: '', organization: '',
  campus: 'north', spaceId: '', eventType: 'community', eventTitle: '',
  eventDate: '', startTime: '', endTime: '', expectedAttendance: '', notes: '',
};

export default function VenueRequestForm({ source = 'public-request', onDone = null }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [hp, setHp] = useState(''); // honeypot — bots fill it, humans never see it

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      // Changing campus clears a now-invalid space choice.
      if (k === 'campus') return { ...f, campus: v, spaceId: '' };
      return { ...f, [k]: v };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (hp) { setState('sent'); return; } // silently swallow bot submissions
    const v = validateBookingRequest(form);
    setErrors(v.errors);
    if (!v.ok) return;
    setState('sending');
    const res = await submitSpaceRequest({ ...form, source });
    setState(res.ok ? 'sent' : 'error');
  };

  if (state === 'sent') {
    return (
      <div className="max-w-md" aria-live="polite">
        <h3 className="text-lg font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Request received 🙏</h3>
        <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Thank you{form.requesterName ? `, ${form.requesterName.trim().split(/\s+/)[0]}` : ''} — we’ve got your request to use the church’s space. A church leader will review it and reach out to confirm availability and details. Nothing is booked until a leader confirms with you.
        </p>
        <button
          type="button"
          onClick={() => { setForm(BLANK); setErrors({}); setState('idle'); if (onDone) onDone(); }}
          className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          Make another request
        </button>
      </div>
    );
  }

  const spaces = spacesForCampus(form.campus);

  return (
    <form onSubmit={submit} noValidate className="max-w-md">
      <div className="mb-3">
        <label htmlFor="vr-name" className={labelCls}>Your name</label>
        <input id="vr-name" type="text" value={form.requesterName} onChange={set('requesterName')} className={inputCls} autoComplete="name" aria-invalid={!!errors.requesterName} aria-describedby={errors.requesterName ? 'vr-name-err' : undefined} />
        {errors.requesterName && <p id="vr-name-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.requesterName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="mb-1">
          <label htmlFor="vr-email" className={labelCls}>Email <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="vr-email" type="email" value={form.requesterEmail} onChange={set('requesterEmail')} className={inputCls} autoComplete="email" aria-invalid={!!errors.requesterEmail} aria-describedby={errors.requesterEmail ? 'vr-email-err' : undefined} />
          {errors.requesterEmail && <p id="vr-email-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.requesterEmail}</p>}
        </div>
        <div className="mb-1">
          <label htmlFor="vr-phone" className={labelCls}>Phone <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="vr-phone" type="tel" value={form.requesterPhone} onChange={set('requesterPhone')} className={inputCls} autoComplete="tel" />
        </div>
      </div>

      <div className="mb-3 mt-1">
        <label htmlFor="vr-org" className={labelCls}>Organization / family name <span className="text-[#5A5751] font-normal">(optional)</span></label>
        <input id="vr-org" type="text" value={form.organization} onChange={set('organization')} className={inputCls} placeholder="e.g., the Johnson family, a community group" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="mb-1">
          <label htmlFor="vr-campus" className={labelCls}>Which campus?</label>
          <select id="vr-campus" value={form.campus} onChange={set('campus')} className={inputCls} aria-invalid={!!errors.campus} aria-describedby={errors.campus ? 'vr-campus-err' : undefined}>
            {CAMPUSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.campus && <p id="vr-campus-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.campus}</p>}
        </div>
        <div className="mb-1">
          <label htmlFor="vr-space" className={labelCls}>Which space?</label>
          <select id="vr-space" value={form.spaceId} onChange={set('spaceId')} className={inputCls} aria-invalid={!!errors.spaceId} aria-describedby={errors.spaceId ? 'vr-space-err' : undefined}>
            <option value="">Choose a space…</option>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.spaceId && <p id="vr-space-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.spaceId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <div className="mb-1">
          <label htmlFor="vr-type" className={labelCls}>Type of event</label>
          <select id="vr-type" value={form.eventType} onChange={set('eventType')} className={inputCls} aria-invalid={!!errors.eventType} aria-describedby={errors.eventType ? 'vr-type-err' : undefined}>
            {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.eventType && <p id="vr-type-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.eventType}</p>}
        </div>
        <div className="mb-1">
          <label htmlFor="vr-date" className={labelCls}>Date</label>
          <input id="vr-date" type="date" value={form.eventDate} onChange={set('eventDate')} className={inputCls} aria-invalid={!!errors.eventDate} aria-describedby={errors.eventDate ? 'vr-date-err' : undefined} />
          {errors.eventDate && <p id="vr-date-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.eventDate}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <div className="mb-1">
          <label htmlFor="vr-start" className={labelCls}>Start time <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="vr-start" type="time" value={form.startTime} onChange={set('startTime')} className={inputCls} />
        </div>
        <div className="mb-1">
          <label htmlFor="vr-end" className={labelCls}>End time <span className="text-[#5A5751] font-normal">(optional)</span></label>
          <input id="vr-end" type="time" value={form.endTime} onChange={set('endTime')} className={inputCls} aria-invalid={!!errors.endTime} aria-describedby={errors.endTime ? 'vr-end-err' : undefined} />
          {errors.endTime && <p id="vr-end-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.endTime}</p>}
        </div>
      </div>

      <div className="mb-3 mt-1">
        <label htmlFor="vr-att" className={labelCls}>About how many people? <span className="text-[#5A5751] font-normal">(optional)</span></label>
        <input id="vr-att" type="number" min="0" max="5000" inputMode="numeric" value={form.expectedAttendance} onChange={set('expectedAttendance')} className={inputCls} placeholder="estimate is fine" aria-invalid={!!errors.expectedAttendance} aria-describedby={errors.expectedAttendance ? 'vr-att-err' : undefined} />
        {errors.expectedAttendance && <p id="vr-att-err" className="text-[11px] text-[#7A1F1F] mt-1" aria-live="polite">{errors.expectedAttendance}</p>}
      </div>

      <div className="mb-3">
        <label htmlFor="vr-notes" className={labelCls}>Anything we should know? <span className="text-[#5A5751] font-normal">(optional)</span></label>
        <textarea id="vr-notes" rows={3} value={form.notes} onChange={set('notes')} className={inputCls} placeholder="Catering, AV/livestream, accessibility needs, setup help…" />
      </div>

      {/* honeypot: visually hidden, off-tab; bots fill it, people don't */}
      <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      <p className="text-[11px] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        This is a request, not a confirmed booking. A church leader reviews every request and will reach out to confirm availability, details, and any cost. Your info stays with the church — never sold, never shared.
      </p>

      {state === 'error' && (
        <p className="text-xs text-[#7A1F1F] mb-2" aria-live="assertive">
          Something went wrong sending your request — it did NOT go through. Please check your connection and try again, or call the church office.
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="text-xs uppercase tracking-wider px-5 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          {state === 'sending' ? 'Sending…' : 'Request this space →'}
        </button>
      </div>
    </form>
  );
}
