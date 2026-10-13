// =============================================================================
// TlcFieldInputs — the intake form's field inputs, one source (DR-0344, DR-0354)
// =============================================================================
// The packet form (TlcOnboardingForm) and the record editor (TlcRecordEditor)
// render the SAME question kinds: short answer, paragraph, choose one, choose
// any, yes/no, date, the week of availability. One set of inputs, so a cell
// looks and behaves the same wherever it is filled. Presentation only: the
// spec is data (lib/tlc-onboarding.js, lib/tlc-office-forms.js).
//
// idPrefix keeps ids unique when two surfaces render the same key on one page
// (the form uses "f", the editor "c").
import React from 'react';
import { DAYS, AVAILABILITY_SLOTS, NO_CLIENTS, wordCount } from '../lib/tlc-onboarding.js';

export const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
export const CHIP = (on) => `min-h-[36px] px-2.5 py-1 text-xs border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`;

export function Label({ htmlFor, field, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#1A1815] mb-1">
      {children || field.label}{field && field.required && <span className="text-[#B85838]" aria-hidden="true"> *</span>}
      {field && field.help ? <span className="block font-normal text-[#5A5751]">{field.help}</span> : null}
    </label>
  );
}

export function TextField({ field, value, onChange, editable, idPrefix = 'f' }) {
  const id = `${idPrefix}-${field.key}`;
  const common = { id, value: value || '', disabled: !editable, onChange: (e) => onChange(e.target.value), className: INPUT };
  const words = field.words ? wordCount(value) : null;
  return (
    <div className="mb-3">
      <Label htmlFor={id} field={field} />
      {field.type === 'textarea'
        ? <textarea rows={field.words ? 8 : 3} {...common} />
        : field.type === 'select'
          ? <select {...common}><option value="">Choose…</option>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          : <input type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'} autoComplete={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'off'} {...common} />}
      {field.words && <p className={`text-xs mt-1 ${words > field.words[1] ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>{words} words · TLC asks for {field.words[0]}–{field.words[1]}</p>}
    </div>
  );
}

export function YesNo({ field, value, onChange, editable, idPrefix = 'f' }) {
  return (
    <fieldset className="mb-3" disabled={!editable}>
      <legend className="text-xs font-semibold text-[#1A1815] mb-1">{field.label}{field.required && <span className="text-[#B85838]" aria-hidden="true"> *</span>}{field.help ? <span className="block font-normal text-[#5A5751]">{field.help}</span> : null}</legend>
      <div className="flex gap-2">
        {[['Yes', true], ['No', false]].map(([l, v]) => (
          <label key={l} className={CHIP(value === v) + ' inline-flex items-center gap-1.5 cursor-pointer'}>
            <input type="radio" name={`${idPrefix}-${field.key}`} checked={value === v} onChange={() => onChange(v)} className="sr-only" />{l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MultiSelect({ field, value, onChange, editable }) {
  const list = Array.isArray(value) ? value : [];
  const toggle = (id) => onChange(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <fieldset className="mb-3" disabled={!editable}>
      <legend className="text-xs font-semibold text-[#1A1815] mb-1">{field.label}{field.required && <span className="text-[#B85838]" aria-hidden="true"> *</span>}{field.help ? <span className="block font-normal text-[#5A5751]">{field.help}</span> : null}</legend>
      <ul className="space-y-1">
        {field.options.map((o) => (
          <li key={o.id}>
            <label className="flex items-start gap-2 min-h-[36px] cursor-pointer">
              <input type="checkbox" checked={list.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" />
              <span className="text-sm text-[#1A1815]"><b>{o.label}</b>{o.detail ? <span className="text-[#5A5751]"> — {o.detail}</span> : null}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export function Availability({ value, onChange, editable }) {
  const avail = value || {};
  const set = (day, slots) => onChange({ ...avail, [day]: slots });
  const toggle = (day, slot) => {
    const cur = Array.isArray(avail[day]) ? avail[day] : [];
    if (slot === NO_CLIENTS) return set(day, cur.includes(NO_CLIENTS) ? [] : [NO_CLIENTS]);
    const without = cur.filter((s) => s !== NO_CLIENTS);
    set(day, without.includes(slot) ? without.filter((s) => s !== slot) : [...without, slot]);
  };
  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const cur = Array.isArray(avail[day]) ? avail[day] : [];
        return (
          <fieldset key={day} disabled={!editable}>
            <legend className="text-xs font-semibold text-[#1A1815] mb-1">{day}</legend>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => toggle(day, NO_CLIENTS)} aria-pressed={cur.includes(NO_CLIENTS)} className={CHIP(cur.includes(NO_CLIENTS))}>{NO_CLIENTS}</button>
              {AVAILABILITY_SLOTS.map((slot) => (
                <button key={slot} type="button" onClick={() => toggle(day, slot)} aria-pressed={cur.includes(slot)} className={CHIP(cur.includes(slot))}>{slot}</button>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
