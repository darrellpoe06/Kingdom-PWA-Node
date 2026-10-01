// =============================================================================
// contacts-import — from the phone in your hand into the PoeTech App
// =============================================================================
// Darrell 2026-10-01: "upload phone contacts into PoeTech from the cellphone."
// Two doors bring contacts in, and both land here as the same plain shape:
//   * the browser's Contact Picker (navigator.contacts.select) — pick one, some
//     or all, on a phone that has it (Android Chrome in the installed app);
//   * a contacts file (.vcf) the phone or Google Contacts shares — every phone
//     can export all of them at once (vcard-parse.js reads it).
// Then the PLAN: each incoming contact is matched against what is already
// saved and against the people already on PoeTech — by email, or by the ten
// digits of a phone (member-contact.js) — and named as one of
//   new · already saved · already on PoeTech.
// MATCH, NEVER MERGE: two rows that look like one person are shown side by
// side with the reason; nothing is joined by a heuristic (DR-0111's first
// carve-out; member-contact.js states the same rule for the roster).
//
// Pure: no DOM, no network. The picker's result and the saved list are inputs.
// =============================================================================

import { nationalDigits } from './member-contact.js';
import { contactKey } from './saved-contacts.js';

/** True when this browser can hand us contacts the person picks. */
export function pickerSupported(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  try { return !!(nav && nav.contacts && typeof nav.contacts.select === 'function'); } catch { return false; }
}

/** The fields the picker is asked for; address only where the phone offers it. */
export function pickerProperties(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  const base = ['name', 'tel', 'email'];
  try {
    const have = nav && nav.contacts && typeof nav.contacts.getProperties === 'function' ? null : [];
    if (have === null) return base; // decided asynchronously by the caller (getProperties)
  } catch { /* fall through */ }
  return base;
}

const str = (v) => String(v == null ? '' : v).trim();
const uniq = (arr) => { const seen = new Set(); const out = []; for (const v of arr) { const k = str(v); if (k && !seen.has(k.toLowerCase())) { seen.add(k.toLowerCase()); out.push(k); } } return out; };

/** Picker results ([{name:[], tel:[], email:[], address:[]}]) -> plain contacts. */
export function fromPickerResults(results = []) {
  const rows = Array.isArray(results) ? results : [];
  return rows.map((r) => ({
    name: str((r && r.name && r.name[0]) || ''),
    phones: uniq(r && r.tel ? r.tel : []),
    emails: uniq((r && r.email ? r.email : []).map((e) => str(e).toLowerCase())),
    addresses: uniq((r && r.address ? r.address : []).map(addressLine)),
    org: '',
    note: '',
  })).filter((c) => c.name || c.phones.length || c.emails.length);
}

function addressLine(a) {
  if (!a) return '';
  if (typeof a === 'string') return a;
  const parts = [].concat(a.addressLine || [], a.city || '', a.region || '', a.postalCode || '', a.country || '');
  return parts.map(str).filter(Boolean).join(', ');
}

/** The stable key for an incoming contact: email, then phone digits, then name. */
export function importKey(c = {}) {
  return contactKey({ email: (c.emails || [])[0] || c.email || '', phone: (c.phones || [])[0] || c.phone || '', name: c.name || '' });
}

function identifiers(c = {}) {
  const emails = new Set((c.emails || (c.email ? [c.email] : [])).map((e) => str(e).toLowerCase()).filter(Boolean));
  const phones = new Set((c.phones || (c.phone ? [c.phone] : [])).map((p) => nationalDigits(p)).filter(Boolean));
  return { emails, phones };
}

function shares(a, b) {
  for (const e of a.emails) if (b.emails.has(e)) return { by: 'email', value: e };
  for (const p of a.phones) if (b.phones.has(p)) return { by: 'phone', value: p };
  return null;
}

/**
 * Plan an import.
 * @param incoming  contacts from the picker or the file
 * @param saved     the address book already kept (saved-contacts rows)
 * @param members   people already on PoeTech: [{ userId, displayName, email, phone, ... }]
 * @returns {{ rows: Array, summary: {total, new, alreadySaved, onPoetech, duplicatesInFile} }}
 *   rows[i] = { contact, key, status: 'new'|'saved'|'on-poetech', match: {by, value, who} | null }
 */
export function planImport(incoming = [], saved = [], members = []) {
  const rows = [];
  const seen = new Map();
  let duplicatesInFile = 0;
  const savedIds = (Array.isArray(saved) ? saved : []).map((s) => ({ row: s, ids: identifiers(s) }));
  const memberIds = (Array.isArray(members) ? members : []).map((m) => ({ row: m, ids: identifiers(m) }));
  for (const c of Array.isArray(incoming) ? incoming : []) {
    const key = importKey(c);
    if (!key) continue;
    const ids = identifiers(c);
    // The same person twice in one file (two cards sharing a phone or email):
    // keep the first, count the second, never save two rows.
    let dup = seen.has(key);
    if (!dup) for (const prev of seen.values()) { if (shares(ids, prev)) { dup = true; break; } }
    if (dup) { duplicatesInFile += 1; continue; }
    seen.set(key, ids);

    let status = 'new';
    let match = null;
    const onPoetech = memberIds.map((m) => ({ m, hit: shares(ids, m.ids) })).find((x) => x.hit);
    if (onPoetech) {
      status = 'on-poetech';
      match = { by: onPoetech.hit.by, value: onPoetech.hit.value, who: onPoetech.m.row.displayName || onPoetech.m.row.email || '', userId: onPoetech.m.row.userId || '' };
    } else {
      const already = savedIds.map((s) => ({ s, hit: shares(ids, s.ids) || (s.row.id === key ? { by: 'key', value: key } : null) })).find((x) => x.hit);
      if (already) { status = 'saved'; match = { by: already.hit.by, value: already.hit.value, who: already.s.row.name || '' }; }
    }
    rows.push({ contact: c, key, status, match });
  }
  const summary = {
    total: rows.length,
    new: rows.filter((r) => r.status === 'new').length,
    alreadySaved: rows.filter((r) => r.status === 'saved').length,
    onPoetech: rows.filter((r) => r.status === 'on-poetech').length,
    duplicatesInFile,
  };
  return { rows, summary };
}

/** "3 new · 1 already saved · 2 already on PoeTech" — only the parts that are not zero. */
export function summaryLine(summary = {}) {
  const parts = [];
  if (summary.new) parts.push(`${summary.new} new`);
  if (summary.alreadySaved) parts.push(`${summary.alreadySaved} already saved`);
  if (summary.onPoetech) parts.push(`${summary.onPoetech} already on PoeTech`);
  if (summary.duplicatesInFile) parts.push(`${summary.duplicatesInFile} repeated in the file`);
  return parts.length ? parts.join(' · ') : 'nothing to bring in';
}

/** The row the local address book keeps for an imported contact (first phone, first email). */
export function toSavedContact(row, status = 'saved') {
  const c = row.contact || row;
  return {
    name: c.name || '',
    phone: (c.phones || [])[0] || '',
    email: (c.emails || [])[0] || '',
    status: row.status === 'on-poetech' ? 'on-poetech' : status,
  };
}
