// =============================================================================
// TlcFormEditor — the office edits its own intake form and documents (DR-0352)
// =============================================================================
// Darrell 2026-09-10: "where is the intake form so we can have staff update
// it?! everything needs to be able to be updated by staff!"
//
// Under Onboarding, for the owner/admin. Four things, each versioned: the
// intake questions (labels, help lines, required, hidden, the choices of a
// "choose one", the acknowledgment sentence, new questions per section) and
// the three documents (every word). Every save asks for a note and becomes
// the next version; "Reset to the original" puts the code definition back
// as a new version. The packet form, the readout, the Team reader and the
// signature record read what is saved here (lib/tlc-office-forms.js).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  OFFICE_DOCUMENT_KEYS, OFFICE_DOCUMENT_LABELS, CUSTOM_FIELD_TYPES, FLOOR_REQUIRED,
  defaultIntakeForm, normalizeIntakeForm, validateIntakeForm, newCustomField, formKeys,
  defaultDocument, normalizeDocument, validateDocument,
} from '../lib/tlc-office-forms.js';
import { readOfficeDocuments, saveOfficeDocument } from '../lib/tlc-office-forms-sync.js';
import { formatDate } from '../lib/tlc-onboarding.js';
import TlcFormPreview from './TlcFormPreview.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };
const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const SMALL = 'w-full min-h-[36px] px-2 py-1 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_RUST = 'min-h-[36px] px-4 py-2 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CHIP = (on) => `text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'} focus:outline focus:outline-2 focus:outline-[#B85838]`;

const isFloor = (f) => f.type === 'acknowledgment' || FLOOR_REQUIRED.includes(f.key);
// How a colleague ANSWERS each kind, in plain words (Darrell 2026-09-10, at
// this editor: the label cell reads as if the answer went there — it does
// not; the answer is a calendar, a list, two buttons, on the form itself).
const ANSWERED_WITH = {
  text: 'a short answer box', email: 'an email box', tel: 'a phone box', date: 'a calendar', textarea: 'a paragraph box',
  select: 'one choice from a list', multiselect: 'any choices from a list', yesno: 'Yes / No buttons', file: 'a file upload',
  availability: 'the week, hour by hour', acknowledgment: 'the checkbox and a typed signature',
};

// ---------------------------------------------------------------------------
// The questions
// ---------------------------------------------------------------------------
function FieldRow({ field, onChange, onRemove }) {
  const floor = isFloor(field);
  const set = (k, v) => onChange({ ...field, [k]: v });
  const id = `fe-${field.key}`;
  return (
    <li className="border border-[#E8E4DC] p-2 space-y-1.5" aria-label={`Question: ${field.label}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{field.custom ? 'Your question' : 'Original question'} · answered with {ANSWERED_WITH[field.type] || field.type}{floor ? ' · required by the process' : ''}</span>
        {field.custom && <button type="button" onClick={onRemove} className={`${BTN_WARN} ml-auto min-h-[36px] py-1 text-xs`}>Remove</button>}
      </div>
      <label htmlFor={`${id}-label`} className="block text-xs text-[#5A5751]">Label
        <input id={`${id}-label`} value={field.label} onChange={(e) => set('label', e.target.value)} className={`${SMALL} mt-0.5`} />
      </label>
      <label htmlFor={`${id}-help`} className="block text-xs text-[#5A5751]">Help line (optional)
        <input id={`${id}-help`} value={field.help || ''} onChange={(e) => set('help', e.target.value)} className={`${SMALL} mt-0.5`} />
      </label>
      {(field.type === 'select' || (field.custom && field.type === 'multiselect')) && (
        <label htmlFor={`${id}-options`} className="block text-xs text-[#5A5751]">Choices, one per line
          <textarea id={`${id}-options`} rows={3} value={(field.options || []).join('\n')} onChange={(e) => set('options', e.target.value.split('\n'))} className={`${SMALL} mt-0.5`} />
        </label>
      )}
      {field.type === 'acknowledgment' && (
        <label htmlFor={`${id}-statement`} className="block text-xs text-[#5A5751]">The acknowledgment sentence the colleague reads above the checkbox
          <textarea id={`${id}-statement`} rows={3} value={field.statement || ''} onChange={(e) => set('statement', e.target.value)} className={`${SMALL} mt-0.5`} />
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1815] min-h-[36px]">
          <input type="checkbox" checked={field.required === true} disabled={floor} onChange={(e) => set('required', e.target.checked)} className="h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" /> Required
        </label>
        {field.type !== 'acknowledgment' && (
          <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1815] min-h-[36px]">
            <input type="checkbox" checked={field.hidden === true} disabled={floor} onChange={(e) => set('hidden', e.target.checked)} className="h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" /> Hidden from the form
          </label>
        )}
      </div>
    </li>
  );
}

function AddQuestion({ onAdd }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) { onAdd(type, label); setLabel(''); } }} className="flex flex-wrap items-end gap-2 border border-dashed border-[#1A1815] p-2" aria-label="Add a question">
      <label className="block text-xs text-[#5A5751] grow min-w-[12rem]">New question
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What do you want to ask?" className={`${SMALL} mt-0.5`} />
      </label>
      <label className="block text-xs text-[#5A5751]">Kind
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${SMALL} mt-0.5`}>{CUSTOM_FIELD_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
      </label>
      <button type="submit" disabled={!label.trim()} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add</button>
    </form>
  );
}

function QuestionsEditor({ form, onChange }) {
  const keys = formKeys(form);
  const setSection = (i, patch) => onChange({ sections: form.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setField = (i, k, field) => setSection(i, { fields: form.sections[i].fields.map((f) => (f.key === k ? field : f)) });
  const removeField = (i, k) => setSection(i, { fields: form.sections[i].fields.filter((f) => f.key !== k) });
  const addField = (i, type, label) => setSection(i, { fields: [...form.sections[i].fields, newCustomField(type, label, keys)] });
  return (
    <div className="space-y-4">
      {form.sections.map((s, i) => (
        <section key={s.id} className="border border-[#1A1815] bg-white p-3" aria-label={`Section: ${s.title}`}>
          <label htmlFor={`sec-${s.id}-title`} className="block text-xs text-[#5A5751]">Section title
            <input id={`sec-${s.id}-title`} value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} className={`${INPUT} mt-0.5 font-semibold`} />
          </label>
          <label htmlFor={`sec-${s.id}-blurb`} className="block text-xs text-[#5A5751] mt-2">Under the title
            <input id={`sec-${s.id}-blurb`} value={s.blurb || ''} onChange={(e) => setSection(i, { blurb: e.target.value })} className={`${SMALL} mt-0.5`} />
          </label>
          {s.id === 'banking' && <p className="text-xs text-[#5A5751] mt-2" style={SERIF}>Direct deposit is collected here and written behind the wall; its three fields are fixed by the process.</p>}
          <ul className="space-y-2 mt-3">
            {s.fields.map((f) => <FieldRow key={f.key} field={f} onChange={(nf) => setField(i, f.key, nf)} onRemove={() => removeField(i, f.key)} />)}
          </ul>
          {s.id !== 'banking' && <div className="mt-2"><AddQuestion onAdd={(type, label) => addField(i, type, label)} /></div>}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The documents
// ---------------------------------------------------------------------------
function AgreementEditor({ doc, onChange }) {
  const set = (k, v) => onChange({ ...doc, [k]: v });
  const setSection = (i, patch) => set('sections', doc.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const remove = (i) => set('sections', doc.sections.filter((_, j) => j !== i).map((s, j) => ({ ...s, n: j + 1 })));
  const add = () => set('sections', [...doc.sections, { n: doc.sections.length + 1, title: '', text: '' }]);
  return (
    <div className="space-y-3">
      <label htmlFor="doc-title" className="block text-xs text-[#5A5751]">Title<input id="doc-title" value={doc.title} onChange={(e) => set('title', e.target.value)} className={`${INPUT} mt-0.5 font-semibold`} /></label>
      <label htmlFor="doc-preamble" className="block text-xs text-[#5A5751]">Opening<textarea id="doc-preamble" rows={3} value={doc.preamble || ''} onChange={(e) => set('preamble', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <ol className="space-y-2">
        {doc.sections.map((s, i) => (
          <li key={i} className="border border-[#E8E4DC] p-2 space-y-1.5" aria-label={`Section ${i + 1}`}>
            <div className="flex items-center gap-2"><span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Section {i + 1}</span><button type="button" onClick={() => remove(i)} className={`${BTN_WARN} ml-auto min-h-[36px] py-1 text-xs`}>Remove</button></div>
            <label className="block text-xs text-[#5A5751]">Heading<input value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} className={`${SMALL} mt-0.5`} /></label>
            <label className="block text-xs text-[#5A5751]">Text<textarea rows={3} value={s.text || ''} onChange={(e) => setSection(i, { text: e.target.value })} className={`${SMALL} mt-0.5`} /></label>
            <label className="block text-xs text-[#5A5751]">Points, one per line<textarea rows={3} value={(s.items || []).join('\n')} onChange={(e) => setSection(i, { items: e.target.value.split('\n') })} className={`${SMALL} mt-0.5`} /></label>
            <label className="block text-xs text-[#5A5751]">After the points<textarea rows={2} value={s.after || ''} onChange={(e) => setSection(i, { after: e.target.value })} className={`${SMALL} mt-0.5`} /></label>
          </li>
        ))}
      </ol>
      <button type="button" onClick={add} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add a section</button>
    </div>
  );
}

function HandbookEditor({ doc, onChange }) {
  const set = (k, v) => onChange({ ...doc, [k]: v });
  const setSection = (i, patch) => set('sections', doc.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const setItem = (i, k, patch) => setSection(i, { items: doc.sections[i].items.map((it, m) => (m === k ? { ...it, ...patch } : it)) });
  const removeItem = (i, k) => setSection(i, { items: doc.sections[i].items.filter((_, m) => m !== k) });
  const addItem = (i) => setSection(i, { items: [...doc.sections[i].items, { label: '', text: '' }] });
  const remove = (i) => set('sections', doc.sections.filter((_, j) => j !== i));
  const add = () => set('sections', [...doc.sections, { id: `section-${doc.sections.length + 1}`, title: '', items: [{ label: '', text: '' }] }]);
  return (
    <div className="space-y-3">
      <label htmlFor="hb-title" className="block text-xs text-[#5A5751]">Title<input id="hb-title" value={doc.title} onChange={(e) => set('title', e.target.value)} className={`${INPUT} mt-0.5 font-semibold`} /></label>
      <label className="block text-xs text-[#5A5751]">Subtitle<input value={doc.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <label className="block text-xs text-[#5A5751]">Welcome<textarea rows={3} value={doc.welcome || ''} onChange={(e) => set('welcome', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <label className="block text-xs text-[#5A5751]">Mission<textarea rows={2} value={doc.mission || ''} onChange={(e) => set('mission', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <label className="block text-xs text-[#5A5751]">Vision<textarea rows={2} value={doc.vision || ''} onChange={(e) => set('vision', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <label className="block text-xs text-[#5A5751]">What we provide, one per line<textarea rows={3} value={(doc.services || []).join('\n')} onChange={(e) => set('services', e.target.value.split('\n'))} className={`${SMALL} mt-0.5`} /></label>
      <label className="block text-xs text-[#5A5751]">Independent contractor status<textarea rows={2} value={doc.contractorStatus || ''} onChange={(e) => set('contractorStatus', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
      <ol className="space-y-2">
        {doc.sections.map((s, i) => (
          <li key={s.id || i} className="border border-[#E8E4DC] p-2 space-y-1.5" aria-label={`Handbook section ${i + 1}`}>
            <div className="flex items-center gap-2"><span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Section {i + 1}</span><button type="button" onClick={() => remove(i)} className={`${BTN_WARN} ml-auto min-h-[36px] py-1 text-xs`}>Remove</button></div>
            <label className="block text-xs text-[#5A5751]">Heading<input value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} className={`${SMALL} mt-0.5`} /></label>
            <ul className="space-y-1.5">
              {s.items.map((it, k) => (
                <li key={k} className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,1fr)_3fr_auto] gap-1.5 items-start">
                  <input aria-label="Point label" value={it.label} onChange={(e) => setItem(i, k, { label: e.target.value })} className={SMALL} />
                  <textarea aria-label="Point text" rows={2} value={it.text} onChange={(e) => setItem(i, k, { text: e.target.value })} className={SMALL} />
                  <button type="button" onClick={() => removeItem(i, k)} className={`${BTN_WARN} min-h-[36px] py-1 text-xs`}>Remove</button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => addItem(i)} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add a point</button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={add} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add a section</button>
      <label className="block text-xs text-[#5A5751]">The acknowledgment line at the end<textarea rows={2} value={doc.acknowledgment || ''} onChange={(e) => set('acknowledgment', e.target.value)} className={`${SMALL} mt-0.5`} /></label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The editor: one document at a time, a note on every save, the version shown
// ---------------------------------------------------------------------------
export default function TlcFormEditor({ load = readOfficeDocuments, save = saveOfficeDocument }) {
  const [state, setState] = useState({ loaded: false, resolved: null, message: '' });
  const [active, setActive] = useState('intake-form');
  const [drafts, setDrafts] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [errors, setErrors] = useState([]);
  // SEE IT (Darrell: "why can't we see it?"): the form as a colleague meets
  // it, read from the draft, beside the rows that edit it.
  const [preview, setPreview] = useState(false);

  const refresh = useCallback(async () => {
    const res = await load();
    setState({ loaded: true, resolved: res.resolved, message: res.ok ? '' : res.message || '' });
    setDrafts({});
  }, [load]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!state.loaded || !state.resolved) return <p className="text-sm text-[#5A5751]">Opening the office forms…</p>;
  const meta = active === 'intake-form' ? state.resolved.intakeForm : state.resolved.documents[active];
  const saved = active === 'intake-form' ? state.resolved.intakeForm.form : state.resolved.documents[active].doc;
  const draft = drafts[active] || saved;
  const dirty = drafts[active] !== undefined && JSON.stringify(drafts[active]) !== JSON.stringify(saved);
  const setDraft = (v) => { setDrafts((d) => ({ ...d, [active]: v })); setErrors([]); setFlash(''); };
  const original = () => setDraft(active === 'intake-form' ? defaultIntakeForm() : defaultDocument(active));

  const doSave = async () => {
    const body = active === 'intake-form' ? normalizeIntakeForm(draft) : normalizeDocument(active, draft);
    const errs = active === 'intake-form' ? validateIntakeForm(body) : validateDocument(active, body);
    if (errs.length) { setErrors(errs); return; }
    if (note.trim().length < 3) { setErrors(['Say in a few words what changed.']); return; }
    setBusy(true);
    const res = await save(active, body, note.trim());
    setBusy(false);
    if (!res.ok) { setErrors(res.errors && res.errors.length ? res.errors : [res.message]); return; }
    setFlash(`Saved as version ${res.saved && res.saved.version ? res.saved.version : '?'}. Every packet opened from now on reads it.`);
    setNote('');
    await refresh();
  };

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5" aria-label="The office forms">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Office forms</div>
      <h2 className="text-xl mb-1" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>The intake form and the documents, yours to change</h2>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF}>Every save is a new version with a note; a colleague's signature pins the version they signed. The six answers the hire depends on and the three signatures stay required.</p>
      {state.message && <p className="text-xs text-[#B85838] mb-2" role="alert">The office forms could not be read: {state.message}. You are looking at the original.</p>}
      <div className="flex flex-wrap gap-1.5 mb-3" role="tablist" aria-label="Office documents">
        {OFFICE_DOCUMENT_KEYS.map((k) => {
          const m = k === 'intake-form' ? state.resolved.intakeForm : state.resolved.documents[k];
          return <button key={k} type="button" role="tab" aria-selected={active === k} onClick={() => { setActive(k); setErrors([]); setFlash(''); }} className={CHIP(active === k)}>{OFFICE_DOCUMENT_LABELS[k]} · v{m.version}{drafts[k] !== undefined ? ' · edited' : ''}</button>;
        })}
      </div>
      <p className="text-xs text-[#5A5751] mb-3">
        {meta.version === 0 ? 'The original, as the app shipped it; nothing saved by the office yet.' : `Version ${meta.version}${meta.updatedAt ? `, saved ${formatDate(meta.updatedAt)}` : ''}${meta.note ? ` — “${meta.note}”` : ''}.`}
      </p>

      {active === 'intake-form' && (
        <div className="mb-3">
          <button type="button" onClick={() => setPreview((v) => !v)} aria-pressed={preview} className={`${BTN}`}>{preview ? 'Back to editing' : 'Preview the form as a colleague sees it'}</button>
          {!preview && (
            <p className="text-xs text-[#5A5751] mt-2 leading-relaxed" style={SERIF}>
              You are editing the <b>questions</b>, not answering them. Each card holds one question&apos;s wording, its help line and its rules; the answer cells are on the form itself, where a date is a calendar, a choice is a list and a yes/no is two buttons. Nothing typed here is ever an answer.
            </p>
          )}
        </div>
      )}
      {active === 'intake-form'
        ? (preview ? <TlcFormPreview form={draft} version={meta.version} /> : <QuestionsEditor form={draft} onChange={setDraft} />)
        : active === 'policies'
          ? <HandbookEditor doc={draft} onChange={setDraft} />
          : <AgreementEditor doc={draft} onChange={setDraft} />}

      <div className="mt-4 border-t border-[#E8E4DC] pt-3 space-y-2">
        {errors.length > 0 && <ul className="text-xs text-[#B85838] list-disc pl-4" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {flash && <p className="text-xs text-[#3F5226]" role="status">{flash}</p>}
        <label htmlFor="fe-note" className="block text-xs text-[#5A5751]">What changed, in a few words (kept with the version)
          <input id="fe-note" value={note} onChange={(e) => setNote(e.target.value)} className={`${INPUT} mt-0.5`} placeholder="e.g. added a pronouns question; clarified the non-compete" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={doSave} disabled={busy || (!dirty && meta.version > 0)} className={`${BTN_RUST}`}>{busy ? 'Saving…' : 'Save as a new version'}</button>
          <button type="button" onClick={original} className={`${BTN}`}>Reset to the original</button>
          {dirty && <button type="button" onClick={() => { setDrafts((d) => { const n = { ...d }; delete n[active]; return n; }); setErrors([]); }} className={`${BTN}`}>Discard my edits</button>}
        </div>
      </div>
    </section>
  );
}
