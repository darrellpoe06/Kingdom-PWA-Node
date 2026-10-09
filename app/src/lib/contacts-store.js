// =============================================================================
// contacts-store — your address book, kept on the NAS, yours alone by default
// =============================================================================
// saved-contacts.js keeps the list on the device (localStorage) and its own
// header names cloud sync as the follow-on. This is that follow-on: migration
// 0247 adds `contacts`, one row per (owner, contact key), and RLS lets only the
// owner read or write their rows. The device list stays the offline cache and
// the surface's fast path; this is the keeper, so a lost phone does not lose
// the list. One write path: save here, then mirror into the device list.
//
// Demo and signed-out: nothing is written to the table. The device list still
// takes the contacts and the caller says where they were kept (DR-0076 rule 8:
// a plain reason, never a silent half-save).
// =============================================================================

import supabase from './supabase.js';
import { upsertContact, readContacts, removeContact } from './saved-contacts.js';
import { importKey, toSavedContact } from './contacts-import.js';

export const CONTACT_SOURCES = ['picker', 'file', 'manual'];

/** The table row for one planned import row. Pure. */
export function toTableRow(row, { ownerId, source = 'file' } = {}) {
  const c = row.contact || row;
  return {
    owner_id: ownerId,
    contact_key: row.key || importKey(c),
    name: c.name || '',
    phones: (c.phones || []).slice(0, 10),
    emails: (c.emails || []).slice(0, 10),
    addresses: (c.addresses || []).slice(0, 5),
    org: c.org || '',
    note: c.note || '',
    source: CONTACT_SOURCES.includes(source) ? source : 'file',
    matched_user: (row.match && row.match.userId) || null,
  };
}

async function currentUserId(client) {
  try {
    const { data } = await client.auth.getSession();
    return data && data.session && data.session.user ? data.session.user.id : '';
  } catch { return ''; }
}

/**
 * Keep the planned rows: on the NAS when signed in, and always in the device list.
 * @returns {{ kept: number, where: 'nas+device'|'device', reason: string, error: string }}
 */
export async function saveImportedContacts(rows = [], { source = 'file', client = supabase, storage, at } = {}) {
  const list = Array.isArray(rows) ? rows.filter((r) => r && r.key) : [];
  let stamp = at;
  if (!stamp) { try { stamp = new Date().toISOString(); } catch { stamp = ''; } }
  for (const r of list) upsertContact(storage, toSavedContact(r, source === 'manual' ? 'saved' : 'saved'), stamp);
  const ownerId = client ? await currentUserId(client) : '';
  if (!ownerId) {
    return { kept: list.length, where: 'device', reason: 'Not signed in, so they are kept on this device only; sign in and bring them in again to keep them on your own server.', error: '' };
  }
  const payload = list.map((r) => toTableRow(r, { ownerId, source }));
  if (!payload.length) return { kept: 0, where: 'device', reason: 'Nothing to keep.', error: '' };
  try {
    const { error } = await client.from('contacts').upsert(payload, { onConflict: 'owner_id,contact_key' });
    if (error) return { kept: list.length, where: 'device', reason: 'Kept on this device; the server did not take them.', error: error.message || String(error) };
    return { kept: list.length, where: 'nas+device', reason: 'Kept on your own server and on this device.', error: '' };
  } catch (e) {
    return { kept: list.length, where: 'device', reason: 'Kept on this device; the server could not be reached.', error: e && e.message ? e.message : String(e) };
  }
}

/** Your own rows from the table (RLS returns nobody else's), newest first. */
export async function loadMyContacts({ client = supabase } = {}) {
  try {
    const { data, error } = await client.from('contacts')
      .select('contact_key,name,phones,emails,addresses,org,note,source,matched_user,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, rows: [], reason: error.message || String(error) };
    return { ok: true, rows: Array.isArray(data) ? data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

/** The device list, so a surface can show contacts before the table answers. */
export function cachedContacts(storage) {
  return readContacts(storage);
}

// ── THE KEEPER PULLS BACK (DR-0826) ───────────────────────────────────────────
// DR-0736 wrote every import to the table AND the device; the Messages list
// read only the device. So a contact brought in on the phone never showed on
// the Fold, and one added by hand never reached the server at all. Darrell
// 2026-10-09: "Names and cellphone numbers are not being synchronized!!" The
// three roads below close it: pull the table into this device's list on open,
// keep a hand-added contact on the server too, and forget on the server what
// is forgotten here (else it returns on the next pull).

function race(promise, timeoutMs, onTimeout) {
  const timer = new Promise((resolve) => setTimeout(() => resolve(onTimeout), timeoutMs));
  return Promise.race([promise, timer]);
}

/** The device-list row for a table row: name, first phone, first email. */
export function tableRowToDevice(row = {}) {
  return {
    name: row.name || '',
    phone: (row.phones || [])[0] || '',
    email: (row.emails || [])[0] || '',
    status: 'saved',
  };
}

/**
 * Pull your rows from the table into this device's list, merging onto the
 * same people (saved-contacts.js matches on a shared phone or email), so every
 * phone you sign in on shows the same contacts.
 * @returns {{ ok: boolean, pulled: number, reason: string }}
 */
export async function pullMyContacts({ client = supabase, storage, timeoutMs = 6000 } = {}) {
  let r;
  try {
    r = await race(loadMyContacts({ client }), timeoutMs, { ok: false, rows: [], reason: `the server did not answer within ${Math.round(timeoutMs / 1000)}s` });
  } catch (e) {
    r = { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
  if (!r.ok) return { ok: false, pulled: 0, reason: r.reason || 'the server did not answer' };
  let pulled = 0;
  for (const row of r.rows) {
    const c = tableRowToDevice(row);
    if (!c.name && !c.phone && !c.email) continue;
    try { upsertContact(storage, c, row.created_at || ''); pulled += 1; } catch { /* a bad row never stops the rest */ }
  }
  return { ok: true, pulled, reason: '' };
}

/**
 * Keep a contact added by hand on the server too (source 'manual'). The
 * device list is the caller's; this is the keeper's half. Never throws.
 * @returns {{ ok: boolean, reason: string }}
 */
export async function keepContactOnServer(contact = {}, { client = supabase } = {}) {
  try {
    const key = importKey({ name: contact.name, phones: contact.phone ? [contact.phone] : [], emails: contact.email ? [String(contact.email).toLowerCase()] : [] });
    if (!key) return { ok: false, reason: 'nothing identifying to keep' };
    const ownerId = await currentUserId(client);
    if (!ownerId) return { ok: false, reason: 'Not signed in, so it is kept on this device only.' };
    const row = toTableRow({ key, contact: { name: contact.name || '', phones: contact.phone ? [contact.phone] : [], emails: contact.email ? [String(contact.email).toLowerCase()] : [], addresses: [], org: '', note: '' } }, { ownerId, source: 'manual' });
    const { error } = await client.from('contacts').upsert([row], { onConflict: 'owner_id,contact_key' });
    if (error) return { ok: false, reason: error.message || String(error) };
    return { ok: true, reason: '' };
  } catch (e) {
    return { ok: false, reason: e && e.message ? e.message : String(e) };
  }
}

/**
 * Forget a contact here AND on the server, by its stable key. Only the owner's
 * row can match (RLS). Never throws.
 * @returns {{ ok: boolean, reason: string }}
 */
export async function forgetContactEverywhere(id, { client = supabase, storage } = {}) {
  try { removeContact(storage, id); } catch { /* device best effort */ }
  if (!id) return { ok: false, reason: 'no key' };
  try {
    const { error } = await client.from('contacts').delete().eq('contact_key', id);
    if (error) return { ok: false, reason: error.message || String(error) };
    return { ok: true, reason: '' };
  } catch (e) {
    return { ok: false, reason: e && e.message ? e.message : String(e) };
  }
}
