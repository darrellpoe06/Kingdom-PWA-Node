// =============================================================================
// door-cameras — a door shares its cameras with its household (DR-0841)
// =============================================================================
// Darrell, 2026-10-09: "add the Wyze cameras for 805 Prospect Ave Champaign
// Illinois apartments cameras specifically... porch etc... available when we
// want the tenants to have access to the cameras."
//
// The sharing primitive exists (DR-0778): the owner's device mints a GRANT on
// the NAS — a token for a named viewer, a subset of cameras, an expiry — and
// the NAS enforces what the token may see. This file attaches a grant to a
// DOOR: the tenancy row carries the token and a plain note (0258), everyone
// who signs into that door reads it as their Cameras tab, and taking it back
// clears the row and revokes the grant on the NAS. The pure half decides which
// cameras a door suggests, how the grant is named, and what the door says.
import supabase from '../../lib/supabase.js';
import { GRANT_TOKEN } from '../../lib/cameras.js';

const str = (v) => String(v || '').trim();

/** The name a door's grant carries on the NAS: the property and the unit. */
export function doorGrantName(door = {}) {
  return [str(door.property_label), str(door.unit_label)].filter(Boolean).join(' · ') || 'a door';
}

/**
 * The cameras a door most likely means, from the whole list: the ones whose
 * name or id carries a word of the door's address (the house number first:
 * "805" picks every "805 ..." camera). Nothing is picked when nothing matches.
 */
export function suggestDoorCameras(cameras = [], door = {}) {
  const label = str(door.property_label).toLowerCase();
  const words = label.split(/[^a-z0-9]+/).filter((w) => w.length >= 3 || /^\d{2,}$/.test(w));
  const number = (label.match(/^\d+/) || [])[0] || '';
  const hit = (c) => {
    const hay = `${str(c.name)} ${str(c.id)}`.toLowerCase();
    if (number && hay.includes(number)) return true;
    return words.some((w) => w.length >= 4 && hay.includes(w));
  };
  return (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id && hit(c)).map((c) => c.id);
}

/** The plain note the row carries beside the token. */
export function grantNote(cameras = [], picked = [], { days = 0 } = {}) {
  const names = (Array.isArray(cameras) ? cameras : []).filter((c) => picked.includes(c.id)).map((c) => str(c.name) || c.id);
  const when = days > 0 ? ` for ${days} day${days === 1 ? '' : 's'}` : ', until taken back';
  return `${names.length} camera${names.length === 1 ? '' : 's'}: ${names.join(', ')}${when}`;
}

/** The grant's id, from its token (g.<id>.<secret>); '' when it is not a token. */
export function grantIdOf(token) {
  const t = str(token);
  return GRANT_TOKEN.test(t) ? t.split('.')[1] : '';
}

/** What a door's household sees: the state the row carries. */
export function doorCameraState(door) {
  const d = door || {};
  const token = str(d.camera_grant);
  if (!token || !GRANT_TOKEN.test(token)) return { state: 'none', token: '', note: '' };
  return { state: 'shared', token, note: str(d.camera_grant_note) };
}

/** Write the grant onto the door (owner/admin/member of the instance, per 0055). */
export async function setDoorCameraGrant(tenancyId, { token = null, note = null } = {}, client = supabase) {
  try {
    const { error } = await client.from('rental_tenancies').update({ camera_grant: token || null, camera_grant_note: note || null }).eq('id', tenancyId);
    return error ? { ok: false, reason: 'write-failed', error: error.message || String(error) } : { ok: true };
  } catch (e) { return { ok: false, reason: 'unexpected', error: String((e && e.message) || e) }; }
}
