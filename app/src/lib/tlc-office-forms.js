// =============================================================================
// tlc-office-forms — the office edits its own forms: the intake questions and
// the documents, as data (DR-0352)
// =============================================================================
// Darrell 2026-09-10: "where is the intake form so we can have staff update
// it?! everything needs to be able to be updated by staff!"
//
// The code definitions (SECTIONS in tlc-onboarding.js, the two agreements,
// the handbook) are the ORIGINAL. The office's LIVE definition is a jsonb
// body per key in tlc_office_documents (migration 0196), versioned. This
// module is the pure middle: the original as an editable body, a body
// normalized against the original (so an old or hand-edited body can never
// break the form), the live sections the packet form and the readout render,
// and the documents the reader and the signature record use.
//
// What stays FIXED, and why:
//   - the six floor answers and the three signatures stay required and never
//     hide (the hire, the roster card and the signature record read them);
//   - a base question keeps its key and type (old packets must still read);
//   - a base "choose any" keeps its options (their ids are what the roster
//     and the door read);
//   - sections keep their ids and order; a new question joins a section.
// Everything else is the office's: labels, help lines, required, hidden,
// the choices of a "choose one", the acknowledgment sentence, new questions,
// every word of the three documents.
//
// Pure: no React, no network. The seam is tlc-office-forms-sync.js.
// =============================================================================
import { SECTIONS } from './tlc-onboarding.js';
import { TLC_AGREEMENTS } from './tlc-agreements.js';
import { TLC_HANDBOOK } from './tlc-handbook.js';

export const OFFICE_DOCUMENT_KEYS = Object.freeze(['intake-form', 'policies', 'confidentiality', 'contractorAgreement']);
export const OFFICE_DOCUMENT_LABELS = Object.freeze({
  'intake-form': 'Intake form · the questions',
  policies: 'Handbook · practice policies',
  confidentiality: 'Confidentiality Agreement (NDA)',
  contractorAgreement: 'Independent Contractor Agreement',
});
export const DOCUMENT_KEYS_ONLY = Object.freeze(['policies', 'confidentiality', 'contractorAgreement']);

/** The answers and signatures the server requires no matter how the form is edited (0187, 0196). */
export const FLOOR_REQUIRED = Object.freeze(['firstName', 'lastName', 'phone', 'preferredEmail', 'licenseType', 'employmentStatus']);

/** The kinds of question the office may add. */
export const CUSTOM_FIELD_TYPES = Object.freeze([
  { key: 'text', label: 'Short answer' },
  { key: 'textarea', label: 'Paragraph' },
  { key: 'select', label: 'Choose one' },
  { key: 'multiselect', label: 'Choose any' },
  { key: 'yesno', label: 'Yes / no' },
  { key: 'date', label: 'Date' },
]);
const CUSTOM_TYPE_KEYS = CUSTOM_FIELD_TYPES.map((t) => t.key);
export const CUSTOM_KEY_RE = /^x_[a-z0-9]+(?:-[a-z0-9]+)*$/;

const line = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const text = (v) => String(v == null ? '' : v).trim();
const lines = (v) => (Array.isArray(v) ? v : String(v == null ? '' : v).split('\n')).map((x) => line(x)).filter(Boolean);
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---------------------------------------------------------------------------
// THE INTAKE FORM
// ---------------------------------------------------------------------------
const isFixedRequired = (f) => f.type === 'acknowledgment' || FLOOR_REQUIRED.includes(f.key);

/** The original, as an editable body. */
export function defaultIntakeForm() {
  return {
    sections: SECTIONS.map((s) => ({
      id: s.id, title: s.title, blurb: s.blurb || '',
      fields: s.fields.map((f) => ({
        key: f.key, type: f.type, label: f.label, help: '',
        required: !!f.required, hidden: false, base: true,
        ...(f.type === 'select' ? { options: [...f.options] } : {}),
        ...(f.type === 'acknowledgment' ? { statement: f.statement || '' } : {}),
      })),
    })),
  };
}

function baseFieldByKey(key) {
  for (const s of SECTIONS) for (const f of s.fields) if (f.key === key) return f;
  return null;
}

function normalizeCustomField(raw, taken) {
  if (!raw || typeof raw !== 'object') return null;
  const key = line(raw.key);
  const type = CUSTOM_TYPE_KEYS.includes(raw.type) ? raw.type : null;
  const label = line(raw.label);
  if (!CUSTOM_KEY_RE.test(key) || !type || !label || taken.has(key)) return null;
  const f = { key, type, label, help: line(raw.help), required: raw.required === true, hidden: raw.hidden === true, custom: true };
  if (type === 'select' || type === 'multiselect') f.options = [...new Set(lines(raw.options))];
  return f;
}

/** A body (from the database, or from an editor) merged onto the original: never less than the original, never a broken field. */
export function normalizeIntakeForm(body) {
  const def = defaultIntakeForm();
  const src = body && typeof body === 'object' && Array.isArray(body.sections) ? body.sections : [];
  const taken = new Set();
  const out = { sections: def.sections.map((ds) => {
    const bs = src.find((x) => x && x.id === ds.id) || null;
    const bFields = bs && Array.isArray(bs.fields) ? bs.fields : [];
    const fields = ds.fields.map((df) => {
      taken.add(df.key);
      const bf = bFields.find((x) => x && x.key === df.key) || null;
      if (!bf) return df;
      const fixed = isFixedRequired(df);
      const f = {
        ...df,
        label: line(bf.label) || df.label,
        help: line(bf.help),
        required: fixed ? true : bf.required === true,
        hidden: fixed ? false : bf.hidden === true,
      };
      if (df.type === 'select') {
        const opts = [...new Set(lines(bf.options))];
        f.options = opts.length >= 2 ? opts : df.options;
      }
      if (df.type === 'acknowledgment') f.statement = text(bf.statement) || df.statement;
      return f;
    });
    for (const bf of bFields) {
      if (fields.some((x) => x.key === (bf && bf.key))) continue;
      const cf = normalizeCustomField(bf, taken);
      if (cf) { taken.add(cf.key); fields.push(cf); }
    }
    return { id: ds.id, title: line(bs && bs.title) || ds.title, blurb: bs && typeof bs.blurb === 'string' ? line(bs.blurb) : ds.blurb, fields };
  }) };
  return out;
}

/** What is wrong with a form the office is about to save. Empty = nothing. */
export function validateIntakeForm(body) {
  const errors = [];
  const src = body && typeof body === 'object' && Array.isArray(body.sections) ? body.sections : null;
  if (!src) return ['the form must carry its sections'];
  const seen = new Set();
  for (const s of src) {
    if (!s || !line(s.title)) errors.push(`section ${s && s.id ? s.id : '?'} needs a title`);
    for (const f of (s && Array.isArray(s.fields) ? s.fields : [])) {
      if (!f || !line(f.label)) { errors.push(`a question in ${s.title || s.id} has no label`); continue; }
      const base = baseFieldByKey(f.key);
      if (base) {
        if (isFixedRequired(base) && f.hidden) errors.push(`"${base.label}" is required by the office's own process and cannot be hidden`);
        if (isFixedRequired(base) && f.required === false) errors.push(`"${base.label}" cannot be made optional`);
        if (base.type === 'select' && lines(f.options).length < 2) errors.push(`"${f.label}" needs at least two choices`);
      } else {
        if (!CUSTOM_KEY_RE.test(line(f.key))) errors.push(`"${f.label}" has a malformed key`);
        if (!CUSTOM_TYPE_KEYS.includes(f.type)) errors.push(`"${f.label}" has a kind the form cannot render`);
        if ((f.type === 'select' || f.type === 'multiselect') && lines(f.options).length < 2) errors.push(`"${f.label}" needs at least two choices`);
      }
      if (seen.has(f.key)) errors.push(`two questions share the key ${f.key}`);
      seen.add(f.key);
    }
  }
  return errors;
}

/** A key for a new question: x_ + the label, unique among the keys given. */
export function newCustomKey(label, existing = []) {
  const base = `x_${line(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'question'}`.replace(/-+$/, '');
  let key = base;
  let n = 2;
  const taken = new Set(existing);
  while (taken.has(key)) key = `${base}-${n++}`;
  return key;
}

export function newCustomField(type, label, existing = []) {
  const t = CUSTOM_TYPE_KEYS.includes(type) ? type : 'text';
  const f = { key: newCustomKey(label, existing), type: t, label: line(label), help: '', required: false, hidden: false, custom: true };
  if (t === 'select' || t === 'multiselect') f.options = [];
  return f;
}

/** Every key a form carries (base and custom), for uniqueness. */
export function formKeys(form) {
  const out = [];
  for (const s of (form && form.sections) || []) for (const f of s.fields || []) out.push(f.key);
  return out;
}

/**
 * The sections the packet form and the readout RENDER: the code field
 * (with its file/image/word rules) under the office's words, hidden ones
 * dropped, custom ones as the form components expect them.
 */
export function liveSections(body) {
  const form = normalizeIntakeForm(body);
  return form.sections.map((s) => {
    const code = SECTIONS.find((x) => x.id === s.id);
    return {
      id: s.id, title: s.title, blurb: s.blurb,
      fields: s.fields.filter((f) => !f.hidden).map((f) => {
        const base = code && code.fields.find((x) => x.key === f.key);
        if (base) {
          const out = { ...base, label: f.label, help: f.help || '', required: f.required };
          if (base.type === 'select') out.options = f.options;
          if (base.type === 'acknowledgment') out.statement = f.statement;
          return out;
        }
        const out = { key: f.key, type: f.type, label: f.label, help: f.help || '', required: f.required, custom: true };
        if (f.type === 'select') out.options = f.options;
        if (f.type === 'multiselect') out.options = f.options.map((o) => ({ id: o, label: o, detail: '' }));
        return out;
      }),
    };
  });
}

/** The keys the office marked required beyond the floor (what the server enforces at submit, 0196). */
export function requiredCustomKeys(body) {
  const out = [];
  for (const s of liveSections(body)) for (const f of s.fields) {
    if (f.required && !FLOOR_REQUIRED.includes(f.key) && !['file', 'acknowledgment', 'availability'].includes(f.type)) out.push(f.key);
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE DOCUMENTS
// ---------------------------------------------------------------------------
export function defaultDocument(key) {
  if (key === 'policies') return clone(TLC_HANDBOOK);
  if (TLC_AGREEMENTS[key]) return clone(TLC_AGREEMENTS[key]);
  return null;
}

/** An agreement body normalized: numbered sections, trimmed words, nothing invented. */
function normalizeAgreement(key, body) {
  const def = defaultDocument(key);
  if (!body || typeof body !== 'object') return def;
  const src = body;
  const sections = (Array.isArray(src.sections) ? src.sections : def.sections)
    .filter((s) => s && typeof s === 'object')
    .map((s, i) => {
      const out = { n: i + 1, title: line(s.title) };
      if (text(s.text)) out.text = text(s.text);
      const items = lines(s.items);
      if (items.length) out.items = items;
      if (text(s.after)) out.after = text(s.after);
      return out;
    });
  return { ...def, ...src, title: line(src.title) || def.title, preamble: src.preamble === undefined ? def.preamble : text(src.preamble), sections };
}

function normalizeHandbook(body) {
  const def = defaultDocument('policies');
  if (!body || typeof body !== 'object') return def;
  const src = body;
  const str = (k) => (src[k] === undefined ? def[k] : text(src[k]));
  const sections = (Array.isArray(src.sections) ? src.sections : def.sections)
    .filter((s) => s && typeof s === 'object')
    .map((s, i) => ({
      id: line(s.id) || `section-${i + 1}`,
      title: line(s.title),
      items: (Array.isArray(s.items) ? s.items : []).filter((it) => it && typeof it === 'object').map((it) => ({ label: line(it.label), text: text(it.text) })).filter((it) => it.label || it.text),
    }));
  return {
    ...def, ...src,
    title: line(src.title) || def.title,
    subtitle: src.subtitle === undefined ? def.subtitle : line(src.subtitle),
    welcome: str('welcome'), mission: str('mission'), vision: str('vision'),
    services: src.services === undefined ? def.services : lines(src.services),
    contractorStatus: str('contractorStatus'), acknowledgment: str('acknowledgment'),
    sections,
  };
}

export function normalizeDocument(key, body) {
  if (key === 'policies') return normalizeHandbook(body);
  if (TLC_AGREEMENTS[key]) return normalizeAgreement(key, body);
  return null;
}

export function validateDocument(key, body) {
  const errors = [];
  const doc = normalizeDocument(key, body);
  if (!doc) return ['unknown document'];
  if (!doc.title) errors.push('the document needs a title');
  if (!doc.sections.length) errors.push('the document needs at least one section');
  doc.sections.forEach((s, i) => {
    if (!s.title) errors.push(`section ${i + 1} needs a title`);
    if (key === 'policies' ? !s.items.length : !(s.text || (s.items && s.items.length) || s.after)) errors.push(`section ${i + 1} (${s.title || 'untitled'}) has no words`);
  });
  return errors;
}

// ---------------------------------------------------------------------------
// WHAT THE APP READS: the office's live set, with the original where the
// office has not yet saved a version (version 0).
// ---------------------------------------------------------------------------
export function resolveOfficeDocuments(read) {
  const src = read && typeof read === 'object' ? read : {};
  const at = (k) => (src[k] && typeof src[k] === 'object' ? src[k] : null);
  const form = at('intake-form');
  const out = {
    intakeForm: { form: normalizeIntakeForm(form ? form.body : null), version: form ? Number(form.version || 0) : 0, updatedAt: form ? form.updated_at || null : null, note: form ? form.note || '' : '' },
    documents: {},
  };
  for (const k of DOCUMENT_KEYS_ONLY) {
    const d = at(k);
    out.documents[k] = { doc: normalizeDocument(k, d ? d.body : null), version: d ? Number(d.version || 0) : 0, updatedAt: d ? d.updated_at || null : null, note: d ? d.note || '' : '' };
  }
  return out;
}

/** The documents keyed for the signature record and the reader: { policies: doc, confidentiality: doc, contractorAgreement: doc }. */
export function liveDocuments(resolved) {
  const out = {};
  for (const k of DOCUMENT_KEYS_ONLY) out[k] = resolved && resolved.documents && resolved.documents[k] ? resolved.documents[k].doc : defaultDocument(k);
  return out;
}

export const ORIGINAL = Object.freeze({ intakeForm: normalizeIntakeForm(null), documents: liveDocuments(null) });
