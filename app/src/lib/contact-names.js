// =============================================================================
// contact-names — a number or an address you already know is shown as the
//                 person you know, from YOUR OWN contacts (DR-0825)
// =============================================================================
// Darrell 2026-10-09, with Platform Signups open beside his phone's dialer: the
// list showed `12173900498@phone.poetech.us` and nothing else, while the phone
// in his hand already knew whose number that was. "I should know this is her
// based on her data I already have... I want to be able to sync up all
// contacts inside PoeTech App... users should be able to do this."
//
// The contacts are already in the app (DR-0736: the picker, the .vcf, the
// `contacts` table that only its owner reads, the device cache). What was
// missing is the READ BACK: nothing looked a raw number or address up in them.
// This module is that lookup, and it is per viewer by construction: the index
// is built from the rows the viewer owns, so two stewards looking at the same
// account each see the name THEIR OWN phone gave it, and a person with no
// contacts brought in sees exactly what they saw before.
//
// MATCH, NEVER MERGE (DR-0111's first carve-out, as member-contact.js and
// contacts-import.js already state it): a name found here is a label beside
// the account, said as "from your contacts". The account's own display name,
// when it has one, stays first; the contact name is then shown as "in your
// contacts as", never written over it, never written to the account.
//
// Pure except the one loader at the bottom (device cache, then the table).
// =============================================================================

import { nationalDigits, isPhoneDoorEmail, phoneDoorDigits } from './member-contact.js';
import { cachedContacts, loadMyContacts } from './contacts-store.js';

const str = (v) => String(v == null ? '' : v).trim();
const lowerEmail = (e) => str(e).toLowerCase();

/** The empty index: nothing known, nothing named. */
export function emptyIndex() {
  return { byEmail: new Map(), byPhone: new Map(), size: 0, where: 'none', reason: '' };
}

/**
 * Index the viewer's contacts by lowercase email and by the ten national
 * digits of each phone. Accepts both shapes the app keeps:
 *   table rows   { name, phones: [], emails: [] }        (contacts-store.js)
 *   device rows  { name, phone, email }                   (saved-contacts.js)
 * A row with no name names nothing (there is nothing to show). The first row
 * to claim an identifier keeps it, so pass the rows you trust most first.
 */
export function buildContactIndex(rows = []) {
  const idx = emptyIndex();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r) continue;
    const name = str(r.name);
    if (!name) continue;
    const emails = Array.isArray(r.emails) ? r.emails : (r.email ? [r.email] : []);
    const phones = Array.isArray(r.phones) ? r.phones : (r.phone ? [r.phone] : []);
    let used = false;
    for (const e of emails) {
      const k = lowerEmail(e);
      if (k && !idx.byEmail.has(k)) { idx.byEmail.set(k, name); used = true; }
    }
    for (const p of phones) {
      const k = nationalDigits(p);
      if (k && k.length >= 7 && !idx.byPhone.has(k)) { idx.byPhone.set(k, name); used = true; }
    }
    if (used) idx.size += 1;
  }
  return idx;
}

/**
 * The name the viewer's contacts give an identity, or null.
 * A phone-door address (`<digits>@phone.poetech.us`) is looked up as the PHONE
 * it is, never as a mailbox; a real address is looked up as an email; a phone
 * is looked up by its ten digits. The answer says which door matched.
 * @returns {{ name: string, by: 'phone'|'email', from: 'your contacts' } | null}
 */
export function nameFor(index, { email, phone } = {}) {
  const idx = index || emptyIndex();
  const e = lowerEmail(email);
  const doorDigits = phoneDoorDigits(e);
  const digits = nationalDigits(doorDigits || phone);
  if (digits) {
    const hit = idx.byPhone.get(digits);
    if (hit) return { name: hit, by: 'phone', from: 'your contacts' };
  }
  if (e && !isPhoneDoorEmail(e)) {
    const hit = idx.byEmail.get(e);
    if (hit) return { name: hit, by: 'email', from: 'your contacts' };
  }
  return null;
}

/**
 * How a row should read, given what the ACCOUNT says about itself and what
 * the viewer's contacts say. Three honest outcomes:
 *   { shown: <account name>, note: '' }                    nothing known, or the same name
 *   { shown: <contact name>, note: 'from your contacts' }  the account has no name of its own
 *   { shown: <account name>, note: 'in your contacts as X' } both known, and they differ
 * `shown` is never the raw identifier: the caller falls back to that itself.
 */
export function labelFor(index, { ownName, email, phone } = {}) {
  const own = str(ownName);
  const hit = nameFor(index, { email, phone });
  if (!hit) return { shown: own, note: '', by: '' };
  if (!own) return { shown: hit.name, note: 'from your contacts', by: hit.by };
  if (own.toLowerCase() === hit.name.toLowerCase()) return { shown: own, note: '', by: hit.by };
  return { shown: own, note: `in your contacts as ${hit.name}`, by: hit.by };
}

/** How many of these rows the viewer's contacts put a name to. A count, never a chase list. */
export function countNamed(index, rows = [], pick = (r) => r) {
  let n = 0;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r && nameFor(index, pick(r) || {})) n += 1;
  }
  return n;
}

function readDevice(storage) {
  try { return cachedContacts(storage) || []; } catch { return []; }
}

async function readTable(client, timeoutMs) {
  try {
    const timer = new Promise((resolve) => setTimeout(() => resolve({ ok: false, rows: [], reason: `the server did not answer within ${Math.round(timeoutMs / 1000)}s` }), timeoutMs));
    return await Promise.race([loadMyContacts(client ? { client } : {}), timer]);
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

/**
 * Build the viewer's index: the device cache first (instant, offline), then
 * the table (the keeper; its rows outrank the cache when both carry a name for
 * the same identifier, since the table is what survives a lost phone). The
 * result says where it came from, so a surface can say "from this device"
 * when the server did not answer rather than pretending (DR-0076 rule 8).
 * Never throws; a failure is an index with a reason.
 */
export async function loadContactIndex({ client, storage, timeoutMs = 6000 } = {}) {
  const device = readDevice(storage);
  const table = await readTable(client, timeoutMs);
  const idx = buildContactIndex([...(table.ok ? table.rows : []), ...device]);
  idx.where = table.ok ? (device.length ? 'nas+device' : 'nas') : (device.length ? 'device' : 'none');
  idx.reason = table.ok ? '' : (table.reason || '');
  return idx;
}
