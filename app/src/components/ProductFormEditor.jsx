// =============================================================================
// ProductFormEditor — each office edits its OWN questions and documents
// =============================================================================
// DR-0357 named this gap in its own record and dated it: the forms engine was
// generalized to every product, but the EDITOR was not. TlcFormEditor is bound
// to the TLC store (tlc_office_documents_*), so the church office could not
// change a single question of the member intake it is asking its own people to
// answer. Darrell, 2026-09-10, at the TLC editor: "where is the intake form so
// we can have staff update it?! everything needs to be able to be updated by
// staff!" — and 2026-09-11: "We need the staff to be able to edit all surfaces
// so the Ai team nor any other team has to update their surfaces or tabs."
//
// This is that editor for the SHARED engine (product_forms, 0200): hand it a
// product key and the instance that runs it, and it edits whatever the registry
// says that product has — the church's member intake and covenant, the
// household's record and covenant, the landlord's application.
//
// WHY NOT JUST REUSE TlcFormEditor. Because the two read different stores, and
// pretending otherwise would be the lie. TLC's forms live in its own table with
// its own RPCs; the engine's live in product_forms, scoped by instance_id. This
// takes the SHAPE the TLC editor proved — one form at a time, a note on every
// save, the version shown, "see it as they meet it" — and points it at the
// shared store. Migrating TLC onto product_forms is a separate change with real
// risk to a live practice, and is not what was asked for.
//
// THREE THINGS AN OFFICE MAY NOT DO, and the reasons are in the engine, not
// here:
//   * remove or un-require a FLOOR question — the process needs it
//   * add a question whose key collides with one the code ships
//   * save a form the engine says is broken — the errors show, the save stops
// Every save is a new VERSION with a note, and "Reset to the original" is
// itself a version, so the history never has a hole in it.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  productDef, productFormKeys, originalFor, normalizeFor, validateFor,
  liveSectionsFor, resolveProduct,
} from '../lib/product-forms.js';
// The three field helpers come from the ENGINE, not the registry: they are
// product-free by construction, which is exactly why this editor can be too.
import { CUSTOM_FIELD_TYPES, formKeys, newCustomField } from '../lib/forms-engine.js';
import { readProductForms, saveProductForm } from '../lib/product-forms-sync.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const SMALL = 'w-full min-h-[36px] px-2 py-1 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_RUST = 'min-h-[36px] px-4 py-2 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CHIP = (on) => `text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'} focus:outline focus:outline-2 focus:outline-[#B85838]`;

// How a person ANSWERS each kind, in plain words. The label cell reads as if
// the answer went there — it does not; the answer is a calendar, a list, two
// buttons, on the form itself. (Darrell said exactly this at the TLC editor.)
const ANSWERED_WITH = {
  text: 'a short answer box', email: 'an email box', tel: 'a phone box', date: 'a calendar',
  textarea: 'a paragraph box', select: 'one choice from a list', multiselect: 'any choices from a list',
  yesno: 'Yes / No buttons', file: 'a file upload', availability: 'the week, hour by hour',
  acknowledgment: 'the checkbox and a typed signature',
};

/** A question the office may not remove or un-require. */
const isFloorField = (field, floor = []) =>
  field.type === 'acknowledgment' || floor.includes(field.key);

// ---------------------------------------------------------------------------
// THE QUESTIONS
// ---------------------------------------------------------------------------
function FieldRow({ field, floor, onChange, onRemove }) {
  const locked = isFloorField(field, floor);
  const set = (k, v) => onChange({ ...field, [k]: v });
  const id = `pfe-${field.key}`;
  return (
    <li className="border border-[#E8E4DC] p-2 space-y-1.5" aria-label={`Question: ${field.label}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
          {field.custom ? 'Your question' : 'Original question'} · answered with {ANSWERED_WITH[field.type] || field.type}
          {locked ? ' · required by the process' : ''}
        </span>
        {field.custom && <button type="button" onClick={onRemove} className={`${BTN_WARN} ml-auto min-h-[36px] py-1 text-xs`}>Remove</button>}
      </div>
      <label htmlFor={`${id}-label`} className="block text-xs text-[#5A5751]">Label
        <input id={`${id}-label`} value={field.label} onChange={(e) => set('label', e.target.value)} className={`${SMALL} mt-0.5`} />
      </label>
      <label htmlFor={`${id}-help`} className="block text-xs text-[#5A5751]">Help line (optional)
        <input id={`${id}-help`} value={field.help || ''} onChange={(e) => set('help', e.target.value)} className={`${SMALL} mt-0.5`} />
      </label>
      {(field.type === 'select' || field.type === 'multiselect') && (
        <label htmlFor={`${id}-options`} className="block text-xs text-[#5A5751]">Choices, one per line
          <textarea id={`${id}-options`} rows={3} value={(field.options || []).join('\n')}
            onChange={(e) => set('options', e.target.value.split('\n'))} className={`${SMALL} mt-0.5`} />
        </label>
      )}
      {field.type === 'acknowledgment' && (
        <label htmlFor={`${id}-statement`} className="block text-xs text-[#5A5751]">The sentence they read above the checkbox
          <textarea id={`${id}-statement`} rows={3} value={field.statement || ''}
            onChange={(e) => set('statement', e.target.value)} className={`${SMALL} mt-0.5`} />
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1815] min-h-[36px]">
          <input type="checkbox" checked={field.required === true} disabled={locked}
            onChange={(e) => set('required', e.target.checked)}
            className="h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" /> Required
        </label>
        {field.type !== 'acknowledgment' && (
          <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1815] min-h-[36px]">
            <input type="checkbox" checked={field.hidden === true} disabled={locked}
              onChange={(e) => set('hidden', e.target.checked)}
              className="h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" /> Hidden from the form
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
    <form aria-label="Add a question" className="flex flex-wrap items-end gap-2 border border-dashed border-[#1A1815] p-2"
      onSubmit={(e) => { e.preventDefault(); if (label.trim()) { onAdd(type, label); setLabel(''); } }}>
      <label className="block text-xs text-[#5A5751] grow min-w-[12rem]">New question
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What do you want to ask?" className={`${SMALL} mt-0.5`} />
      </label>
      <label className="block text-xs text-[#5A5751]">Kind
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${SMALL} mt-0.5`}>
          {CUSTOM_FIELD_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </label>
      <button type="submit" disabled={!label.trim()} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add</button>
    </form>
  );
}

function QuestionsEditor({ form, floor, onChange }) {
  const keys = formKeys(form);
  const setSection = (i, patch) => onChange({ sections: form.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setField = (i, k, field) => setSection(i, { fields: form.sections[i].fields.map((f) => (f.key === k ? field : f)) });
  const removeField = (i, k) => setSection(i, { fields: form.sections[i].fields.filter((f) => f.key !== k) });
  const addField = (i, type, label) => setSection(i, { fields: [...form.sections[i].fields, newCustomField(type, label, keys)] });
  return (
    <div className="space-y-4">
      {form.sections.map((s, i) => (
        <section key={s.id} className="border border-[#1A1815] bg-white p-3" aria-label={`Section: ${s.title}`}>
          <label htmlFor={`psec-${s.id}-title`} className="block text-xs text-[#5A5751]">Section title
            <input id={`psec-${s.id}-title`} value={s.title} onChange={(e) => setSection(i, { title: e.target.value })}
              className={`${INPUT} mt-0.5 font-semibold`} />
          </label>
          <label htmlFor={`psec-${s.id}-blurb`} className="block text-xs text-[#5A5751] mt-2">Under the title
            <input id={`psec-${s.id}-blurb`} value={s.blurb || ''} onChange={(e) => setSection(i, { blurb: e.target.value })}
              className={`${SMALL} mt-0.5`} />
          </label>
          <ul className="space-y-2 mt-3">
            {s.fields.map((f) => (
              <FieldRow key={f.key} field={f} floor={floor}
                onChange={(nf) => setField(i, f.key, nf)} onRemove={() => removeField(i, f.key)} />
            ))}
          </ul>
          <div className="mt-2"><AddQuestion onAdd={(type, label) => addField(i, type, label)} /></div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE DOCUMENTS — the numbered-sections shape every covenant in this system uses
// ---------------------------------------------------------------------------
function DocumentEditor({ doc, onChange }) {
  const set = (k, v) => onChange({ ...doc, [k]: v });
  const setSection = (i, patch) => set('sections', doc.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const remove = (i) => set('sections', doc.sections.filter((_, j) => j !== i).map((s, j) => ({ ...s, n: j + 1 })));
  const add = () => set('sections', [...doc.sections, { n: doc.sections.length + 1, title: '', text: '' }]);
  return (
    <div className="space-y-3">
      <label htmlFor="pdoc-title" className="block text-xs text-[#5A5751]">Title
        <input id="pdoc-title" value={doc.title} onChange={(e) => set('title', e.target.value)} className={`${INPUT} mt-0.5 font-semibold`} />
      </label>
      <label htmlFor="pdoc-preamble" className="block text-xs text-[#5A5751]">Opening
        <textarea id="pdoc-preamble" rows={3} value={doc.preamble || ''} onChange={(e) => set('preamble', e.target.value)} className={`${SMALL} mt-0.5`} />
      </label>
      <ol className="space-y-2">
        {doc.sections.map((s, i) => (
          <li key={s.n || i} className="border border-[#E8E4DC] p-2 space-y-1.5" aria-label={`Section ${i + 1}`}>
            <div className="flex items-center gap-2">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Section {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className={`${BTN_WARN} ml-auto min-h-[36px] py-1 text-xs`}>Remove</button>
            </div>
            <label className="block text-xs text-[#5A5751]">Heading
              <input value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} className={`${SMALL} mt-0.5`} />
            </label>
            <label className="block text-xs text-[#5A5751]">Text
              <textarea rows={3} value={s.text || ''} onChange={(e) => setSection(i, { text: e.target.value })} className={`${SMALL} mt-0.5`} />
            </label>
            <label className="block text-xs text-[#5A5751]">Points, one per line
              <textarea rows={3} value={(s.items || []).join('\n')} onChange={(e) => setSection(i, { items: e.target.value.split('\n') })} className={`${SMALL} mt-0.5`} />
            </label>
            <label className="block text-xs text-[#5A5751]">After the points
              <textarea rows={2} value={s.after || ''} onChange={(e) => setSection(i, { after: e.target.value })} className={`${SMALL} mt-0.5`} />
            </label>
          </li>
        ))}
      </ol>
      <button type="button" onClick={add} className={`${BTN} min-h-[36px] py-1 text-xs`}>Add a section</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEE IT AS THEY MEET IT
// ---------------------------------------------------------------------------
function FormPreview({ product, formKey, form }) {
  const sections = liveSectionsFor(product, formKey, form);
  return (
    <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-3 space-y-3" aria-label="The form as they meet it">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">As they meet it</div>
      {sections.length === 0 && <p className="text-xs text-[#5A5751]">Every question is hidden. Nobody would see a thing.</p>}
      {sections.map((s) => (
        <section key={s.id}>
          <h4 className="text-sm font-bold text-[#1A1815]">{s.title}</h4>
          {s.blurb && <p className="text-xs text-[#5A5751]" style={SERIF}>{s.blurb}</p>}
          <ul className="mt-1 space-y-0.5">
            {s.fields.map((f) => (
              <li key={f.key} className="text-xs text-[#1A1815]">
                {f.label}{f.required ? <span className="text-[#B85838]"> *</span> : ''}
                <span className="text-[#8A857C]"> — {ANSWERED_WITH[f.type] || f.type}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE EDITOR
// ---------------------------------------------------------------------------
export default function ProductFormEditor({
  product,
  instanceId = null,
  title = '',
  load = readProductForms,
  save = saveProductForm,
}) {
  const def = productDef(product);
  const keys = useMemo(() => productFormKeys(product), [product]);
  const [state, setState] = useState({ loaded: false, resolved: null, message: '' });
  const [active, setActive] = useState(keys[0] || '');
  const [drafts, setDrafts] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(false);

  const refresh = useCallback(async () => {
    const res = await load(product, instanceId);
    if (res && res.ok) {
      setState({ loaded: true, resolved: res.resolved, message: '' });
      setDrafts({});
    } else {
      // A read that failed is SAID, and the original is shown so the office is
      // not staring at an empty screen — but nothing is saved from it until the
      // read works, because saving over a form you could not read is how an
      // office loses its own words.
      setState({ loaded: true, resolved: resolveProduct(product, null), message: (res && res.message) || 'Could not read the saved forms.' });
    }
  }, [load, product, instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!def) {
    return <p className="text-sm text-[#7A1F1F]">There is no product called “{String(product)}” in the registry.</p>;
  }
  if (!state.loaded) return <p className="text-sm text-[#5A5751]">Opening the forms…</p>;

  const entry = state.resolved ? state.resolved[active] : null;
  const formDef2 = def.forms[active] || {};
  const isForm = entry && entry.kind === 'form';
  const body = drafts[active] !== undefined
    ? drafts[active]
    : (isForm ? entry.form : (entry && entry.doc));
  const dirty = drafts[active] !== undefined;

  const change = (patch) => {
    setErrors([]);
    setDrafts({ ...drafts, [active]: { ...body, ...patch } });
  };

  const doSave = async (nextBody, whatChanged) => {
    const problems = validateFor(product, active, nextBody);
    if (problems.length) { setErrors(problems); return; }
    if (!note.trim()) { setErrors(['Say what changed and why — one line is enough. It goes on the version.']); return; }
    setBusy(true); setFlash('');
    const res = await save(product, active, nextBody, note.trim(), instanceId);
    setBusy(false);
    if (!res || !res.ok) { setErrors([(res && res.message) || 'That did not save.']); return; }
    setNote('');
    setDrafts((d) => { const n = { ...d }; delete n[active]; return n; });
    // The seam returns `saved`, not a version number, so this line does not
    // print one: a number this screen invented would be a number nobody
    // measured (DR-0076). The version line under these buttons carries the
    // real one, from the re-read below.
    setFlash(`Saved. ${whatChanged}`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{def.label}</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>{title || 'The questions you ask, and the words you ask them in'}</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed" style={SERIF}>
          These are your office&apos;s own forms. Change a label, add a question, hide one you do not use, or rewrite a document —
          every save becomes the next version with your note on it, and nothing is ever overwritten.
          A few questions are held by the process and cannot be removed; they say so on the row.
        </p>
        {state.message && <p className="text-xs text-[#7A1F1F] mt-2">{state.message}</p>}
      </section>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Which form">
        {keys.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={active === k}
            onClick={() => { setActive(k); setErrors([]); setFlash(''); }}
            className={CHIP(active === k)}>
            {def.forms[k].label}
            {state.resolved && state.resolved[k] ? ` · v${state.resolved[k].version}` : ''}
          </button>
        ))}
      </div>

      {formDef2.purpose && (
        <p className="text-xs text-[#5A5751]" style={SERIF}><b>Why this exists:</b> {formDef2.purpose}</p>
      )}

      {errors.length > 0 && (
        <ul className="border border-[#B85838] bg-white p-3 text-xs text-[#7A1F1F] list-disc pl-6 space-y-0.5">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      {flash && <p className="text-xs text-[#3F5226]" style={SERIF}>{flash}</p>}

      {isForm && preview && <FormPreview product={product} formKey={active} form={body} />}

      {isForm
        ? <QuestionsEditor form={body} floor={formDef2.floor || []} onChange={change} />
        : (body ? <DocumentEditor doc={body} onChange={change} /> : null)}

      <section className="bg-white border border-[#E8E4DC] p-3 space-y-2">
        <label htmlFor="pfe-note" className="block text-xs text-[#5A5751]">
          What changed, and why (goes on the version)
          <input id="pfe-note" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Added a question about the bus run they ride." className={`${SMALL} mt-0.5`} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy || !dirty} className={`${BTN_RUST}`}
            onClick={() => doSave(body, 'Everyone filling this in from now on sees your words.')}>
            {busy ? 'Saving…' : 'Save as the next version'}
          </button>
          {isForm && (
            <button type="button" onClick={() => setPreview((p) => !p)} className={BTN}>
              {preview ? 'Hide the preview' : 'See it as they meet it'}
            </button>
          )}
          {dirty && (
            <button type="button" className={`${BTN}`}
              onClick={() => setDrafts((d) => { const n = { ...d }; delete n[active]; return n; })}>
              Undo my edits
            </button>
          )}
          <button type="button" disabled={busy} className={`${BTN_WARN}`}
            onClick={() => doSave(normalizeFor(product, active, originalFor(product, active)), 'The original is back — as a new version, so the history keeps what you had.')}>
            Reset to the original
          </button>
        </div>
        {entry && (
          <p className="text-[0.6875rem] text-[#8A857C]">
            {entry.version === 0
              ? 'Never edited — this is the original the app ships.'
              : `Version ${entry.version}${entry.updatedAt ? ` · saved ${String(entry.updatedAt).slice(0, 10)}` : ''}${entry.note ? ` · “${entry.note}”` : ''}`}
          </p>
        )}
      </section>
    </div>
  );
}

export { QuestionsEditor, DocumentEditor, FormPreview, isFloorField };
