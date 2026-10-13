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
// ONE ENGINE FOR EVERY PRODUCT (DR-0357): the merge-onto-the-original way this
// file proved is now lib/forms-engine.js, product-free. TLC keeps its own
// names, its own floor and its own documents; the machinery is shared with
// PoeTech's household intake and Poe Properties' application.
import {
  defaultForm, normalizeForm, validateForm, liveSections as engineLiveSections,
  requiredCustomKeys as engineRequiredCustomKeys, formKeys as engineFormKeys,
  newCustomKey as engineNewCustomKey, newCustomField as engineNewCustomField,
  CUSTOM_FIELD_TYPES as ENGINE_FIELD_TYPES, CUSTOM_KEY_RE as ENGINE_KEY_RE,
  line, text, lines, clone,
} from './forms-engine.js';

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
export const CUSTOM_FIELD_TYPES = ENGINE_FIELD_TYPES;
export const CUSTOM_KEY_RE = ENGINE_KEY_RE;

// ---------------------------------------------------------------------------
// THE INTAKE FORM
// ---------------------------------------------------------------------------
const OPTS = { floor: FLOOR_REQUIRED };

/** The original, as an editable body. */
export function defaultIntakeForm() { return defaultForm(SECTIONS, OPTS); }

/** A body (from the database, or from an editor) merged onto the original: never less than the original, never a broken field. */
export function normalizeIntakeForm(body) { return normalizeForm(SECTIONS, body, OPTS); }

/** What is wrong with a form the office is about to save. Empty = nothing. */
export function validateIntakeForm(body) { return validateForm(SECTIONS, body, OPTS); }

/** A key for a new question from its label: x_the-label-words, unique among `existing`. */
export function newCustomKey(label, existing = []) { return engineNewCustomKey(label, existing); }

export function newCustomField(type, label, existing = []) { return engineNewCustomField(type, label, existing); }

export function formKeys(form) { return engineFormKeys(form); }

/**
 * The sections the packet form and the readout RENDER: the code field
 * (with its file/image/word rules) under the office's words, hidden ones
 * dropped, custom ones as the form components expect them.
 */
export function liveSections(body) { return engineLiveSections(SECTIONS, body, OPTS); }

/** The keys the office marked required beyond the floor (what the server enforces at submit, 0196). */
export function requiredCustomKeys(body) { return engineRequiredCustomKeys(SECTIONS, body, OPTS); }

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
