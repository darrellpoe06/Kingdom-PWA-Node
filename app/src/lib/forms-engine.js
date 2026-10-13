// =============================================================================
// forms-engine — one engine for every product's forms and documents (DR-0357)
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for PoeTech and
// Poe Properties Apps... make sure they fit the requirements of the product it
// claims to be."
//
// What TLC proved (DR-0352 → DR-0356) is a WAY, not a TLC feature: the code
// definition is the ORIGINAL; the office's live definition is a versioned
// body merged onto it so an old or hand-edited body can never break the form;
// the floor (the answers the process depends on, the signatures) can never be
// un-required or hidden; every word of a document is the office's; a
// signature pins the version it signed. This module is that way with the
// product lifted out: every function takes the ORIGINAL it normalizes onto.
// lib/tlc-office-forms.js keeps its API and delegates here; lib/product-forms.js
// registers PoeTech's household forms and Poe Properties' application.
//
// Pure: no React, no network.
// =============================================================================

/** The kinds of question an office may add. */
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

export const line = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
export const text = (v) => String(v == null ? '' : v).trim();
export const lines = (v) => (Array.isArray(v) ? v : String(v == null ? '' : v).split('\n')).map((x) => line(x)).filter(Boolean);
export const clone = (v) => JSON.parse(JSON.stringify(v));

// ---------------------------------------------------------------------------
// THE FORM (the questions)
// ---------------------------------------------------------------------------

/**
 * The original, as an editable body.
 * @param {Array} sections  [{ id, title, blurb, fields: [{ key, type, label, required, options?, statement?, help? }] }]
 */
export function defaultForm(sections, { floor = [] } = {}) {
  return {
    sections: (sections || []).map((s) => ({
      id: s.id, title: s.title, blurb: s.blurb || '',
      fields: (s.fields || []).map((f) => ({
        key: f.key, type: f.type, label: f.label, help: f.help || '',
        // An acknowledgment is required BY DEFINITION, and so is a floor
        // question — a default form that failed its own validation would be a
        // trap for the next product. (No change for TLC: its six floor
        // questions and three signatures are authored required already.)
        required: !!f.required || f.type === 'acknowledgment' || floor.includes(f.key), hidden: false, base: true,
        ...(f.type === 'select' ? { options: [...f.options] } : {}),
        ...(f.type === 'acknowledgment' ? { statement: f.statement || '' } : {}),
      })),
    })),
  };
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

/**
 * A body (from the database, or from an editor) merged onto the original:
 * never less than the original, never a broken field. `floor` names the keys
 * that stay required and never hide; acknowledgments always do.
 */
export function normalizeForm(sections, body, { floor = [] } = {}) {
  const def = defaultForm(sections, { floor });
  const src = body && typeof body === 'object' && Array.isArray(body.sections) ? body.sections : [];
  const taken = new Set();
  const isFixed = (f) => f.type === 'acknowledgment' || floor.includes(f.key);
  return { sections: def.sections.map((ds) => {
    const bs = src.find((x) => x && x.id === ds.id) || null;
    const bFields = bs && Array.isArray(bs.fields) ? bs.fields : [];
    const fields = ds.fields.map((df) => {
      taken.add(df.key);
      const bf = bFields.find((x) => x && x.key === df.key) || null;
      if (!bf) return df;
      const fixed = isFixed(df);
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
}

/**
 * What is wrong with a form an office is about to save. Empty = nothing.
 * A BASE question (one the code defines) keeps its key and kind, so only its
 * words, its choices and its rules are checked; an ADDED question is checked
 * whole. The floor and the acknowledgments can be neither hidden nor made
 * optional — that is the promise the process rests on.
 */
export function validateForm(sections, body, { floor = [] } = {}) {
  const errors = [];
  const src = body && typeof body === 'object' && Array.isArray(body.sections) ? body.sections : null;
  if (!src) return ['the form must carry its sections'];
  const seen = new Set();
  const baseByKey = new Map();
  for (const s of sections || []) for (const f of s.fields || []) baseByKey.set(f.key, f);
  const isFixed = (f) => f.type === 'acknowledgment' || floor.includes(f.key);
  for (const s of src) {
    if (!s || !line(s.title)) errors.push(`section ${s && s.id ? s.id : '?'} needs a title`);
    for (const f of (s && Array.isArray(s.fields) ? s.fields : [])) {
      if (!f || !line(f.label)) { errors.push(`a question in ${(s && (s.title || s.id)) || '?'} has no label`); continue; }
      const base = baseByKey.get(f.key);
      if (base) {
        if (isFixed(base) && f.hidden) errors.push(`"${base.label}" is required by the office's own process and cannot be hidden`);
        if (isFixed(base) && f.required === false) errors.push(`"${base.label}" cannot be made optional`);
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

/** A key for a new question from its label: x_the-label-words, unique among `existing`. */
export function newCustomKey(label, existing = []) {
  const base = `x_${line(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'question'}`;
  let key = base; let n = 2;
  while (existing.includes(key)) { key = `${base}-${n}`; n += 1; }
  return key;
}

export function newCustomField(type, label, existing = []) {
  const t = CUSTOM_TYPE_KEYS.includes(type) ? type : 'text';
  const f = { key: newCustomKey(label, existing), type: t, label: line(label), help: '', required: false, hidden: false, custom: true };
  if (t === 'select' || t === 'multiselect') f.options = [];
  return f;
}

export function formKeys(form) {
  const out = [];
  for (const s of (form && form.sections) || []) for (const f of s.fields || []) out.push(f.key);
  return out;
}

/**
 * The sections a form and its readout RENDER: the code field (with its file /
 * image / word rules) under the office's words, hidden ones dropped, custom
 * ones as the form components expect them.
 */
export function liveSections(sections, body, { floor = [] } = {}) {
  const form = normalizeForm(sections, body, { floor });
  return form.sections.map((s) => {
    const code = (sections || []).find((x) => x.id === s.id);
    return {
      id: s.id, title: s.title, blurb: s.blurb,
      fields: s.fields.filter((f) => !f.hidden).map((f) => {
        const base = code && (code.fields || []).find((x) => x.key === f.key);
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

/** The keys the office marked required beyond the floor (what the server enforces at submit). */
export function requiredCustomKeys(sections, body, { floor = [] } = {}) {
  const out = [];
  for (const s of liveSections(sections, body, { floor })) for (const f of s.fields) {
    if (f.required && !floor.includes(f.key) && !['file', 'acknowledgment', 'availability'].includes(f.type)) out.push(f.key);
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE DOCUMENTS (numbered-section agreements)
// ---------------------------------------------------------------------------

/** A numbered-section document (preamble + sections of text/items/after) merged onto its original. */
export function normalizeAgreement(original, body) {
  const def = clone(original);
  if (!body || typeof body !== 'object') return def;
  const out = { ...def, title: line(body.title) || def.title, preamble: typeof body.preamble === 'string' ? text(body.preamble) : def.preamble };
  const srcSections = Array.isArray(body.sections) ? body.sections : null;
  if (srcSections && srcSections.length) {
    out.sections = srcSections.map((s, i) => ({
      n: i + 1,
      title: line(s && s.title) || `Section ${i + 1}`,
      text: s && typeof s.text === 'string' ? text(s.text) : '',
      ...(s && Array.isArray(s.items) && s.items.length ? { items: lines(s.items) } : {}),
      ...(s && typeof s.after === 'string' && text(s.after) ? { after: text(s.after) } : {}),
    }));
  }
  return out;
}

export function validateAgreement(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['the document must be an object'];
  if (!line(body.title)) errors.push('the document needs a title');
  const sections = Array.isArray(body.sections) ? body.sections : [];
  if (!sections.length) errors.push('the document needs at least one section');
  sections.forEach((s, i) => { if (!s || !line(s.title)) errors.push(`section ${i + 1} needs a heading`); });
  return errors;
}

/**
 * Live-or-original for a whole product: `read` is the rows the office saved
 * ({ [key]: { body, version, updated_at, note } }); `registry` names each
 * key's original and how to normalize it.
 * @returns {{ [key]: { doc|form, version, updatedAt, note } }}
 */
export function resolveProductForms(read, registry) {
  const rows = read && typeof read === 'object' ? read : {};
  const out = {};
  for (const key of Object.keys(registry || {})) {
    const r = rows[key] || null;
    const def = registry[key];
    const body = r && r.body ? r.body : null;
    out[key] = {
      kind: def.kind,
      version: r && Number.isFinite(Number(r.version)) ? Number(r.version) : 0,
      updatedAt: (r && r.updated_at) || null,
      note: (r && r.note) || '',
      ...(def.kind === 'form'
        ? { form: normalizeForm(def.sections, body, { floor: def.floor || [] }) }
        : { doc: normalizeAgreement(def.original, body) }),
    };
  }
  return out;
}
