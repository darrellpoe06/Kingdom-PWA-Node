// =============================================================================
// TlcFormPreview — the intake form as a colleague meets it, to SEE (DR-0352)
// =============================================================================
// Darrell 2026-09-10, looking at a copy of the old Google form: "Where is the
// intake form, and why can't we see it?" The editor showed the questions as
// editable rows; the packet showed them only to the invited colleague. This
// is the form itself, read-only, in order: every section, its blurb, every
// question with its kind, its help line, its choices, the required mark, the
// three signatures and the direct-deposit fields — from the office's LIVE
// definition, the same one the packet renders (lib/tlc-office-forms.js).
// Shown on Team → Documents for every staff member and beside the editor.
// =============================================================================
import React from 'react';
import { liveSections } from '../lib/tlc-office-forms.js';
import { BANKING_FIELDS, DAYS, AVAILABILITY_SLOTS, NO_CLIENTS } from '../lib/tlc-onboarding.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const KIND = {
  text: 'short answer', email: 'email', tel: 'phone', date: 'date', textarea: 'paragraph',
  select: 'choose one', multiselect: 'choose any', yesno: 'yes / no', file: 'a file to upload',
  availability: 'the week, hour by hour', acknowledgment: 'read, check, and sign by typing your full name',
};

function Question({ field, n }) {
  const options = field.type === 'select' ? field.options : field.type === 'multiselect' ? field.options.map((o) => (typeof o === 'string' ? o : o.label)) : null;
  return (
    <li className="py-2 border-t border-[#F0ECE4] first:border-t-0" aria-label={`Question ${n}: ${field.label}`}>
      <div className="text-sm text-[#1A1815]" style={{ ...SERIF, fontWeight: 600 }}>
        {n}. {field.label}{field.required && <span className="text-[#B85838]" aria-label="required"> *</span>}
      </div>
      {field.help && <div className="text-xs text-[#5A5751]">{field.help}</div>}
      <div className="text-[0.6875rem] uppercase tracking-wider text-[#8A857C] mt-0.5">{KIND[field.type] || field.type}{field.custom ? ' · added by the office' : ''}{field.words ? ` · ${field.words[0]}–${field.words[1]} words` : ''}</div>
      {options && options.length > 0 && <ul className="mt-1 flex flex-wrap gap-1">{options.map((o) => <li key={o} className="text-[0.6875rem] px-2 py-0.5 border border-[#E8E4DC] text-[#5A5751]">{o}</li>)}</ul>}
      {field.type === 'acknowledgment' && field.statement && <p className="text-xs text-[#5A5751] mt-1 leading-relaxed" style={SERIF}>{field.statement}</p>}
      {field.type === 'availability' && <p className="text-xs text-[#5A5751] mt-1">{DAYS.join(' · ')} — {AVAILABILITY_SLOTS[0]} to {AVAILABILITY_SLOTS[AVAILABILITY_SLOTS.length - 1]}, or “{NO_CLIENTS}”.</p>}
    </li>
  );
}

export default function TlcFormPreview({ form = null, version = 0, compact = false }) {
  const sections = liveSections(form);
  let n = 0;
  const total = sections.reduce((t, s) => t + s.fields.length, 0) + BANKING_FIELDS.length;
  return (
    <div className={compact ? '' : 'bg-white border-2 border-[#1A1815] p-4 sm:p-5'} aria-label="Intake form preview">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">The intake form, as a colleague sees it</div>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF}>{total} questions in {sections.length} sections · {version > 0 ? `version ${version}` : 'the original'}. A colleague opens it from an invite, or by signing in with the invited email; the office edits it under Onboarding · Form &amp; documents.</p>
      <ol className="space-y-3">
        {sections.map((s) => (
          <li key={s.id} className="border border-[#E8E4DC] p-3" aria-label={`Section: ${s.title}`}>
            <h4 className="text-base text-[#1A1815]" style={{ ...SERIF, fontWeight: 600 }}>{s.title}</h4>
            {s.blurb && <p className="text-xs text-[#5A5751] mb-1" style={SERIF}>{s.blurb}</p>}
            <ol className="mt-1">
              {s.id === 'banking' && BANKING_FIELDS.map((f) => { n += 1; return <Question key={f.key} field={{ ...f, help: f.key === 'routingNumber' ? 'nine digits; stored behind the wall, never in the packet' : '' }} n={n} />; })}
              {s.fields.map((f) => { n += 1; return <Question key={f.key} field={f} n={n} />; })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
