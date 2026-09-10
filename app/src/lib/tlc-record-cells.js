// =============================================================================
// tlc-record-cells — a cell for every item on the intake form (DR-0354)
// =============================================================================
// Darrell 2026-09-10: "at least create a place for all items on the intake
// form even if Christina needs to add the data later or even have users add
// their own data... we need the cells to accommodate the data."
//
// The packet already HAS a place for every item (emptyPacket, the office's
// live sections). What was missing was a way to fill a cell outside the
// colleague's own submit: the office filling what it knows, later; a
// colleague correcting their own record at any status. This module is the
// pure middle for that: which cells an editor may fill, the value a cell holds
// now, and the patch (only the cells that changed) the server receives.
//
// What a patch never carries, mirrored from the server's guard (0198):
// a signature, a document pointer, a password, a bank number. Those cells are
// shown by the readout and filled only through the packet form and the wall.
//
// Pure: no React, no network. The seam is tlc-onboarding-sync.js.
// =============================================================================
import { emptyAvailability } from './tlc-onboarding.js';

/** The kinds a cell editor fills. Files and signatures stay in the packet form; banking stays behind the wall. */
export const CELL_TYPES = Object.freeze(['text', 'email', 'tel', 'date', 'textarea', 'select', 'multiselect', 'yesno', 'availability']);

/** The keys the server refuses in any patch (0198 tlc_onboarding_patch_guard). */
export const REFUSED_CELL_KEYS = Object.freeze(['acknowledgments', 'documents', 'caqhPassword', 'password', 'routingNumber', 'accountNumber', 'bankName', 'accountType']);

/** The sections an editor renders: only the cells it may fill, sections with none dropped. */
export function editableSections(sections) {
  const out = [];
  for (const s of Array.isArray(sections) ? sections : []) {
    if (!s || s.id === 'banking') continue;
    const fields = (s.fields || []).filter((f) => f && CELL_TYPES.includes(f.type) && !REFUSED_CELL_KEYS.includes(f.key));
    if (fields.length) out.push({ id: s.id, title: s.title, blurb: s.blurb || '', fields });
  }
  return out;
}

/** The cells an editor leaves to the packet form (files, signatures) — named so the surface can say so. */
export function keptForThePacket(sections) {
  const out = [];
  for (const s of Array.isArray(sections) ? sections : []) {
    for (const f of (s && s.fields) || []) if (f && (f.type === 'file' || f.type === 'acknowledgment')) out.push({ key: f.key, label: f.label, type: f.type });
  }
  return out;
}

/** The value a cell holds now, shaped for its input (a missing cell reads as empty, never undefined). */
export function cellValue(record, field) {
  const v = record && typeof record === 'object' ? record[field.key] : undefined;
  switch (field.type) {
    case 'multiselect': return Array.isArray(v) ? v.slice() : [];
    case 'yesno': return v === true ? true : v === false ? false : null;
    case 'availability': {
      const base = emptyAvailability();
      if (v && typeof v === 'object') for (const d of Object.keys(base)) base[d] = Array.isArray(v[d]) ? v[d].slice() : [];
      return base;
    }
    default: return v == null ? '' : String(v);
  }
}

/** Every editable cell's current value, keyed — the editor's draft starts here. */
export function cellDraft(record, sections) {
  const out = {};
  for (const s of editableSections(sections)) for (const f of s.fields) out[f.key] = cellValue(record, f);
  return out;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Only the cells that changed, never a refused key. Empty object = nothing to save. */
export function cellsPatch(before, after) {
  const out = {};
  for (const k of Object.keys(after || {})) {
    if (REFUSED_CELL_KEYS.includes(k)) continue;
    if (!same(before ? before[k] : undefined, after[k])) out[k] = after[k];
  }
  return out;
}

/** How many cells hold an answer, of how many — the honest count the surface shows. */
export function cellsFilled(draft) {
  let filled = 0; let total = 0;
  for (const v of Object.values(draft || {})) {
    total += 1;
    if (Array.isArray(v) ? v.length > 0
      : v && typeof v === 'object' ? Object.values(v).some((x) => Array.isArray(x) && x.length > 0)
        : v === true || v === false ? true
          : String(v == null ? '' : v).trim() !== '') filled += 1;
  }
  return { filled, total };
}
