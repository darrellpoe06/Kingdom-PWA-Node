// =============================================================================
// CommercialRateCard — the team's rate card, edited and discussed in the app
// =============================================================================
// Christina, Director of Ministries for The Love Corner, 2026-08-30, submitting
// the Commercial Event Facility Rental Proposal — and, in the same breath,
// naming what the app owes it:
//
//   "this will need to be able to be updated based on what the whole team and
//    staff would like to see, however it's a great opportunity for default
//    settings to be able to be discussed with the MVP in your account...
//    inside the Love Corner App."
//
// So this surface is not a printout of her document. It is the place the team
// WORKS it: every rate editable, every change attributed, the status visible
// beside the numbers, a one-tap return to her defaults, and the discussion
// itself on the record next to the thing being discussed.
//
// REALITY-TRACE (P15/P16 — named before the code):
//   - Real data: venue_rate_cards + venue_rate_card_notes (migration 0162),
//     live via subscribeRateCard. Nothing on this surface is painted; a field
//     the team has never touched renders Christina's committed default and
//     SAYS it is the default.
//   - The screen: Church > Venues > Rate card, staff only. RLS (owner/admin,
//     both directions) is the real gate; this component only agrees with it.
//   - Honest status: her card is PROPOSED until the team says otherwise, so the
//     status banner rides above every number. A proposal rendered as a settled
//     price would be the painted-number failure on a money surface.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import KpiDot from './KpiDot.jsx';
import {
  RATE_FIELDS, RATE_CARD_STATUSES, RATE_CARD_SOURCE,
  DEFAULT_COMMERCIAL_RATE_CARD, DEFAULT_COMMERCIAL_TERMS,
  quoteCommercialEvent, paymentMilestones, validateRateCardPatch,
} from '../lib/venue-commercial-rates.js';
import {
  saveRateCard, resetRateCardToDefaults, fetchRateCardNotes, sendRateCardNote,
} from '../lib/venue-rental.js';

const serif = { fontFamily: '"Fraunces", serif' };
const labelCls = 'text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold';
const inputCls = 'w-full border border-[#1A1815] px-3 py-2 min-h-[40px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';
const btnDark = 'text-[0.6875rem] uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] disabled:opacity-40';
const btnGhost = 'text-[0.6875rem] uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-40';

export function usd(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// How one field is written and read back — a percent is stored as a share (0.5)
// but typed as a percent (50), because nobody quotes "0.5 of the rental".
function displayValue(field, card) {
  const v = card?.[field.key];
  if (field.kind === 'percent') return String(Math.round((Number(v) || 0) * 100));
  return String(v ?? '');
}
function parseValue(field, typed) {
  if (typed === '' || typed === null || typed === undefined) return '';
  if (field.kind === 'percent') {
    const n = Number(typed);
    return Number.isFinite(n) ? n / 100 : typed;
  }
  return typed;
}
function fieldSuffix(field) {
  return field.kind === 'percent' ? '%' : field.unit;
}
function defaultLabel(field) {
  const d = DEFAULT_COMMERCIAL_RATE_CARD[field.key];
  if (field.kind === 'percent') return `${Math.round(d * 100)}%`;
  if (field.kind === 'money') return usd(d);
  return String(d);
}

// --- The status banner — the first thing read, above every number ------------
function StatusBanner({ card }) {
  const s = RATE_CARD_STATUSES.find((x) => x.id === card.status) || RATE_CARD_STATUSES[0];
  const approved = card.status === 'approved';
  return (
    <div className={`border-l-4 px-3 py-2 mb-4 ${approved ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#B85838] bg-[#FBF2F2]'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <KpiDot status={s.tone} label={s.label} className="text-[0.6875rem]" />
        <span className="text-xs text-[#1A1815]" style={serif}>{s.blurb}</span>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
        {card.isDefault
          ? <>These are the defaults exactly as submitted by <strong>{RATE_CARD_SOURCE.author}</strong> on {RATE_CARD_SOURCE.receivedOn} — nothing has been changed yet.</>
          : <>Edited by the team{card.updatedByEmail ? ` · last change by ${card.updatedByEmail}` : ''}{card.updatedAt ? ` · ${new Date(card.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}. Fields nobody changed still show {RATE_CARD_SOURCE.author}’s defaults.</>}
      </p>
      {!approved && (
        <p className="text-[0.6875rem] text-[#7A1F1F] mt-1 font-semibold" style={serif}>
          Not approved yet — quote from these only with that said out loud.
        </p>
      )}
    </div>
  );
}

// --- The editable card -------------------------------------------------------
export function RateCardPanel({ card }) {
  const [draft, setDraft] = useState({});
  const [terms, setTerms] = useState({});
  const [definition, setDefinition] = useState('');
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [showTerms, setShowTerms] = useState(false);

  // The form seeds from the LIVE card and re-seeds when another staff member
  // saves — so two people editing never silently overwrite what they can see.
  useEffect(() => {
    const seed = {};
    for (const f of RATE_FIELDS) seed[f.key] = displayValue(f, card);
    setDraft(seed);
    const t = {};
    for (const term of card.terms || []) t[term.key] = term.text;
    setTerms(t);
    setDefinition(card.definition || '');
  }, [card]);

  const set = (key) => (e) => {
    setDraft((d) => ({ ...d, [key]: e.target.value }));
    setState('idle');
  };

  // A live preview of what the team's numbers do to a real quote, so a rate
  // change is never abstract: this is the 6-hour example from her document.
  const preview = useMemo(() => {
    const patch = {};
    for (const f of RATE_FIELDS) {
      const v = parseValue(f, draft[f.key]);
      if (v !== '') patch[f.key] = Number(v);
    }
    const { ok, values } = validateRateCardPatch(patch);
    const live = ok ? { ...card, ...values } : card;
    return quoteCommercialEvent({ hours: 6, soundPeople: 3, securityPeople: 8 }, live);
  }, [draft, card]);

  const save = async (extra = {}) => {
    const patch = { ...extra };
    for (const f of RATE_FIELDS) patch[f.key] = parseValue(f, draft[f.key]);
    if (!('terms' in patch)) patch.terms = terms;
    if (!('definition' in patch)) patch.definition = definition;
    setState('saving');
    const res = await saveRateCard(patch);
    if (!res.ok) {
      setErrors(res.errors || {});
      setState('error');
      return;
    }
    setErrors({});
    setState('saved');
  };

  const reset = async () => {
    if (typeof window !== 'undefined'
      && !window.confirm(`Put every rate back to ${RATE_CARD_SOURCE.author}’s proposal? The team’s discussion notes are kept.`)) return;
    setState('saving');
    const res = await resetRateCardToDefaults();
    setState(res.ok ? 'saved' : 'error');
  };

  return (
    <section>
      <StatusBanner card={card} />

      <div className="bg-white border border-[#E8E4DC] p-4 mb-4">
        <h4 className="text-sm font-semibold text-[#1A1815]" style={serif}>What counts as a commercial event</h4>
        <p className="text-xs text-[#5A5751] mt-1" style={serif}>{card.definition}</p>
      </div>

      {/* The rates */}
      <div className="bg-white border border-[#E8E4DC] p-4 mb-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
          <h4 className="text-sm font-semibold text-[#1A1815]" style={serif}>The rates</h4>
          <span className="text-[0.6875rem] text-[#5A5751]" style={serif}>Clear a field to return it to the default.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RATE_FIELDS.map((f) => {
            const changed = (card.changedKeys || []).includes(f.key);
            return (
              <div key={f.key}>
                <label htmlFor={`rate-${f.key}`} className={labelCls}>{f.label}</label>
                <div className="flex items-center gap-2 mt-1">
                  {f.kind === 'money' && <span className="text-sm text-[#1A1815]" style={serif}>$</span>}
                  <input
                    id={`rate-${f.key}`}
                    type="number" min={f.kind === 'percent' ? 0 : f.min} max={f.kind === 'percent' ? 100 : f.max}
                    inputMode="decimal"
                    value={draft[f.key] ?? ''}
                    onChange={set(f.key)}
                    aria-invalid={!!errors[f.key]}
                    aria-describedby={`rate-help-${f.key}`}
                    className={inputCls}
                  />
                  <span className="text-[0.6875rem] text-[#5A5751] whitespace-nowrap">{fieldSuffix(f)}</span>
                </div>
                <p id={`rate-help-${f.key}`} className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
                  {f.help}
                  {changed && <span className="text-[#B85838] font-semibold"> · changed by the team (default {defaultLabel(f)})</span>}
                </p>
                {errors[f.key] && <p className="text-[0.6875rem] text-[#7A1F1F] mt-0.5" aria-live="polite" style={serif}>{errors[f.key]}</p>}
              </div>
            );
          })}
        </div>

        {/* What the numbers DO — her own 6-hour example, priced live */}
        <div className="mt-4 border-t border-[#E8E4DC] pt-3">
          <p className={labelCls}>What that quotes — a 6-hour event, 3 sound, 8 security</p>
          <p className="text-lg text-[#1A1815] mt-1" style={{ ...serif, fontWeight: 600 }}>
            {usd(preview.eventCharges)} <span className="text-xs text-[#5A5751] font-normal">event charges</span>
            <span className="text-xs text-[#5A5751] font-normal"> · plus {usd(preview.refundableDeposit)} refundable deposit held</span>
          </p>
          <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={serif}>
            {usd(preview.schedule.atSigning)} at signing · {usd(preview.schedule.thirtyDaysBefore)} before the event · $0 on the day
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" className={`${btnDark} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`} disabled={state === 'saving'} onClick={() => save()}>
            {state === 'saving' ? 'Saving…' : 'Save the team’s rates'}
          </button>
          <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`} disabled={state === 'saving'} onClick={reset}>
            Reset to {RATE_CARD_SOURCE.author.split(',')[0]}’s proposal
          </button>
        </div>
        {state === 'saved' && <p className="text-xs text-[#1A1815] mt-2" aria-live="polite" style={serif}>Saved — every staff device has it.</p>}
        {state === 'error' && Object.keys(errors).length === 0 && (
          <p className="text-xs text-[#7A1F1F] mt-2" aria-live="assertive" style={serif}>That did NOT save. Check the fields above, or your access, and try again.</p>
        )}
      </div>

      {/* Status — the team's decision, not the code's */}
      <div className="bg-white border border-[#E8E4DC] p-4 mb-4">
        <h4 className="text-sm font-semibold text-[#1A1815]" style={serif}>Where the card stands</h4>
        <p className="text-xs text-[#5A5751] mt-0.5 mb-2" style={serif}>
          {RATE_CARD_SOURCE.author} submitted these as <strong>proposed</strong> — “subject to approval.” Move it when the team actually decides.
        </p>
        <div className="flex flex-wrap gap-2">
          {RATE_CARD_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={state === 'saving' || card.status === s.id}
              onClick={() => save({ status: s.id })}
              className={`${card.status === s.id ? btnDark : btnGhost} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}
            >
              {card.status === s.id ? `${s.label} ✓` : `Mark ${s.label.toLowerCase()}`}
            </button>
          ))}
        </div>
      </div>

      {/* The written terms — editable, because the team owns the wording too */}
      <div className="bg-white border border-[#E8E4DC] p-4 mb-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-[#1A1815]" style={serif}>Additional terms</h4>
          <button type="button" onClick={() => setShowTerms((v) => !v)} className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]">
            {showTerms ? 'Done editing' : 'Edit the wording'}
          </button>
        </div>
        {!showTerms ? (
          <ul className="mt-2 space-y-2">
            {(card.terms || DEFAULT_COMMERCIAL_TERMS).map((t) => (
              <li key={t.key}>
                <p className="text-xs font-semibold text-[#1A1815]" style={serif}>
                  {t.label}{t.edited && <span className="text-[#B85838] font-normal"> · team wording</span>}
                </p>
                <p className="text-xs text-[#5A5751]" style={serif}>{t.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="rate-definition" className={labelCls}>What counts as a commercial event</label>
              <textarea id="rate-definition" rows={3} value={definition} onChange={(e) => setDefinition(e.target.value)} className={`${inputCls} mt-1`} />
            </div>
            {(card.terms || DEFAULT_COMMERCIAL_TERMS).map((t) => (
              <div key={t.key}>
                <label htmlFor={`term-${t.key}`} className={labelCls}>{t.label}</label>
                <textarea
                  id={`term-${t.key}`} rows={2}
                  value={terms[t.key] ?? ''}
                  onChange={(e) => setTerms((s) => ({ ...s, [t.key]: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
            ))}
            <button type="button" className={`${btnDark} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`} disabled={state === 'saving'} onClick={() => save()}>Save the wording</button>
          </div>
        )}
      </div>

      <RateCardDiscussion />
    </section>
  );
}

// --- The discussion, on the record, next to what is being discussed ----------
function RateCardDiscussion() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState('idle');

  const load = useCallback(async () => {
    const { ok, rows } = await fetchRateCardNotes();
    if (ok) setNotes(rows);
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setState('sending');
    const res = await sendRateCardNote(body);
    if (!res.ok) { setState('error'); return; }
    setDraft('');
    setState('idle');
    load();
  };

  return (
    <div className="bg-white border border-[#E8E4DC] p-4">
      <h4 className="text-sm font-semibold text-[#1A1815]" style={serif}>What the team says about these rates</h4>
      <p className="text-xs text-[#5A5751] mt-0.5 mb-2" style={serif}>
        The discussion lives here, beside the numbers, so the reasoning behind an agreed rate outlives whoever typed it. Staff only; nothing here is ever shown to a requester.
      </p>
      {notes.length === 0
        ? <p className="text-xs text-[#5A5751] italic" style={serif}>No notes yet — first word on these rates goes here.</p>
        : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id} className="text-xs" style={serif}>
                <span className="font-semibold text-[#1A1815]">{n.authorEmail || 'Staff'}</span>
                <span className="text-[#5A5751]"> · {n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</span>
                <p className="text-[#1A1815] mt-0.5 whitespace-pre-wrap break-words">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder="Add a note for the team…"
          aria-label="Add a note about the commercial rate card"
          className={inputCls}
        />
        <button type="button" onClick={send} disabled={state === 'sending' || !draft.trim()} className={`${btnGhost} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}>Post</button>
      </div>
      {state === 'error' && <p className="text-xs text-[#7A1F1F] mt-1" aria-live="assertive" style={serif}>That note did NOT post — please try again.</p>}
    </div>
  );
}

// --- The per-booking quote builder ------------------------------------------
// Prices ONE commercial booking off the team's live card. Saves the INPUTS to
// the booking (so it reprices if the team changes a rate) and the event charges
// to quoted_price — the refundable deposit deliberately excluded, because the
// revenue line must never count money the church expects to give back.
export function CommercialQuoteBuilder({ booking, card, onSave }) {
  const saved = booking?.quoteDetail || {};
  const [form, setForm] = useState(() => ({
    hours: saved.hours ?? '',
    soundPeople: saved.soundPeople ?? '',
    soundHours: saved.soundHours ?? '',
    securityPeople: saved.securityPeople ?? '',
    securityHours: saved.securityHours ?? '',
    cleaning: saved.cleaning !== false,
    deposit: saved.deposit !== false,
  }));
  const [state, setState] = useState('idle');

  const quote = useMemo(() => quoteCommercialEvent(form, card), [form, card]);
  const milestones = useMemo(() => paymentMilestones(quote, booking?.eventDate, card), [quote, booking?.eventDate, card]);

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
    setState('idle');
  };

  const save = async () => {
    setState('saving');
    // quotedPrice carries the EVENT CHARGES only — never the held deposit.
    const res = await onSave({ quoteDetail: form, quotedPrice: quote.eventCharges });
    setState(res?.ok === false ? 'error' : 'saved');
  };

  const num = (id, label, key, extra = {}) => (
    <div>
      <label htmlFor={`${id}-${booking.id}`} className={labelCls}>{label}</label>
      <input id={`${id}-${booking.id}`} type="number" min="0" inputMode="decimal" value={form[key]} onChange={set(key)} className={`${inputCls} mt-1`} {...extra} />
    </div>
  );

  return (
    <div className="border border-[#1A1815] bg-[#FAF8F4] p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className={labelCls}>Commercial quote</p>
        <KpiDot
          status={card.status === 'approved' ? 'good' : 'attention'}
          label={card.status === 'approved' ? 'approved rates' : 'proposed rates — subject to approval'}
          className="text-[0.6875rem]"
        />
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 mb-2" style={serif}>
        Hours mean everything reserved and used — setup, sound check, event, breakdown, and load-out. Leave a staffing hours field blank to bill it for the whole window.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {num('q-hours', 'Facility hours', 'hours', { step: '0.25' })}
        {num('q-sound-n', 'Sound people', 'soundPeople', { step: '1' })}
        {num('q-sound-h', 'Sound hours', 'soundHours', { step: '0.25', placeholder: 'same as event' })}
        {num('q-sec-n', 'Security people', 'securityPeople', { step: '1' })}
        {num('q-sec-h', 'Security hours', 'securityHours', { step: '0.25', placeholder: 'same as event' })}
      </div>

      <div className="flex flex-wrap gap-4 mt-2">
        <label className="flex items-center gap-2 text-xs text-[#1A1815]" style={serif}>
          <input type="checkbox" checked={form.cleaning} onChange={set('cleaning')} className="w-4 h-4 accent-[#B85838]" />
          Cleaning / post-event reset
        </label>
        <label className="flex items-center gap-2 text-xs text-[#1A1815]" style={serif}>
          <input type="checkbox" checked={form.deposit} onChange={set('deposit')} className="w-4 h-4 accent-[#B85838]" />
          Refundable damage deposit
        </label>
      </div>

      {quote.notes.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {quote.notes.map((n) => <li key={n} className="text-[0.6875rem] text-[#B85838]" style={serif}>• {n}</li>)}
        </ul>
      )}

      {/* The lines, then the two totals kept apart on purpose */}
      <table className="w-full mt-3 text-xs" style={serif}>
        <caption className="sr-only">Commercial event quote lines</caption>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.key} className="border-t border-[#E8E4DC]">
              <td className="py-1 text-[#1A1815]">
                {l.label}
                {l.refundable && <span className="text-[#5A5751]"> (refundable)</span>}
                <span className="block text-[0.6875rem] text-[#5A5751]">{l.detail}</span>
              </td>
              <td className="py-1 text-right text-[#1A1815] align-top whitespace-nowrap">{usd(l.amount)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#1A1815]">
            <th scope="row" className="py-1 text-left text-[#1A1815]">Event charges (the church’s income)</th>
            <td className="py-1 text-right font-semibold text-[#1A1815]">{usd(quote.eventCharges)}</td>
          </tr>
          <tr>
            <th scope="row" className="py-1 text-left text-[#5A5751] font-normal">Held deposit, returned after inspection</th>
            <td className="py-1 text-right text-[#5A5751]">{usd(quote.refundableDeposit)}</td>
          </tr>
          <tr className="border-t border-[#E8E4DC]">
            <th scope="row" className="py-1 text-left text-[#1A1815]">Total collected before the event</th>
            <td className="py-1 text-right font-semibold text-[#1A1815]">{usd(quote.totalDueBeforeEvent)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3">
        <p className={labelCls}>Payment schedule</p>
        <ul className="mt-1 space-y-1">
          {milestones.map((m) => (
            <li key={m.key} className="text-xs text-[#1A1815] flex justify-between gap-3" style={serif}>
              <span>{m.when}<span className="block text-[0.6875rem] text-[#5A5751]">{m.detail}</span></span>
              <span className="whitespace-nowrap font-semibold">{usd(m.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button type="button" className={`${btnDark} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`} disabled={state === 'saving' || !(Number(form.hours) > 0)} onClick={save}>
          {state === 'saving' ? 'Saving…' : 'Save this quote to the booking'}
        </button>
        {state === 'saved' && <span className="text-xs text-[#1A1815]" aria-live="polite" style={serif}>Saved — {usd(quote.eventCharges)} on the revenue line.</span>}
        {state === 'error' && <span className="text-xs text-[#7A1F1F]" aria-live="assertive" style={serif}>That did NOT save — please try again.</span>}
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
        Only the hours and headcounts are stored. Totals are recomputed from the team’s live rate card every time, so an agreed rate change reprices this booking instead of leaving a stale number on the screen.
      </p>
    </div>
  );
}

export default RateCardPanel;
