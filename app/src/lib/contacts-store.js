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
import { upsertContact, readContacts } from './saved-contacts.js';
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
