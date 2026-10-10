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

/**
 * The words a door goes by, from its tenancy record OR, when the unit has no
 * tenancy record yet, from the rentals row itself (display_name / address /
 * unit). An empty door is still a door with a porch camera (DR-0870).
 */
export function doorWords(door = {}) {
  const d = door || {};
  const label = str(d.property_label) || str(d.display_name) || str(d.address);
  const unit = str(d.unit_label) || (str(d.display_name) && str(d.unit) && !str(d.display_name).includes(str(d.unit)) ? str(d.unit) : '');
  return { label, unit };
}

/** The name a door's grant carries on the NAS: the property and the unit. */
export function doorGrantName(door = {}) {
  const { label, unit } = doorWords(door);
  return [label, unit].filter(Boolean).join(' · ') || 'a door';
}

/**
 * WHO SEES A DOOR'S CAMERAS (Darrell, 2026-10-10: "It allows giving access to
 * who?!"). The grant rides the tenancy row, and the only faces that read it as
 * a Cameras tab are the TENANT and their HOUSEHOLD signed into this door
 * (model.js TENANT_TABS). A 1099 worker, a guest with the problem card, and an
 * applicant never see it. So the answer is the real people on this door with
 * those roles, by name — or, plainly, nobody yet.
 */
export function whoSeesDoorCameras({ door = null, people = [] } = {}) {
  const viewers = [];
  const seen = new Set();
  for (const p of Array.isArray(people) ? people : []) {
    if (!p || !['tenant', 'household'].includes(p.roleLabel)) continue;
    const k = str(p.name).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    viewers.push({ name: str(p.name) || 'Someone not named', role: p.roleName || p.roleLabel, joined: !!p.joined });
  }
  const onLease = str(door && door.tenant_name);
  if (onLease && !seen.has(onLease.toLowerCase())) {
    viewers.unshift({ name: onLease, role: 'Tenant on the record', joined: !!(door && door.tenant_user_id) });
  }
  return viewers;
}

/**
 * The cameras a door most likely means, from the whole list: the ones whose
 * name or id carries a word of the door's address (the house number first:
 * "805" picks every "805 ..." camera). Nothing is picked when nothing matches.
 */
export function suggestDoorCameras(cameras = [], door = {}) {
  const label = doorWords(door).label.toLowerCase();
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

// -----------------------------------------------------------------------------
// ASKED FOR AND GIVEN (DR-0915, 0266). Darrell, 2026-10-10: "I want the camera
// to be there for users needing to login and request for certain ones... like
// the porch... we can just give new tenants and 1099 workers.. and Airbnb
// guests... whoever we want to".
// -----------------------------------------------------------------------------

/** The ways the family names who it is giving to. */
export const GIVE_ROLES = Object.freeze([
  { id: 'guest', label: 'Short-stay guest' },
  { id: 'tenant', label: 'Tenant' },
  { id: 'worker', label: '1099 worker' },
  { id: 'other', label: 'Someone else' },
]);
const ROLE_WORD = { tenant: 'Tenant', household: 'Household member', worker: '1099 worker', manager: 'Manager', guest: 'Short-stay guest', family: 'Family', other: 'Someone else' };
export const roleWord = (r) => ROLE_WORD[r] || r || 'Someone';

/** How long access lasts, as the NAS takes it (0 = until taken back). */
export const ACCESS_DAYS = Object.freeze([
  { days: 1, label: '1 day' }, { days: 3, label: '3 days' }, { days: 7, label: 'A week' },
  { days: 30, label: '30 days' }, { days: 365, label: 'A year' }, { days: 0, label: 'Until taken back' },
]);

/** The last day access holds, from today; null when it runs until taken back. */
export function expiresOn(days, today = new Date()) {
  const n = Number(days) || 0;
  if (n <= 0) return null;
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + n));
  return d.toISOString().slice(0, 10);
}

/** Split a door's ledger into what the family acts on and what it can see. */
export function accessBook(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    asks: list.filter((r) => r.kind === 'request' && r.status === 'requested'),
    holding: list.filter((r) => r.status === 'granted' && r.grant_token),
    past: list.filter((r) => ['declined', 'revoked'].includes(r.status)),
  };
}

/** One line for a ledger row: who, which cameras, the state, until when. */
export function accessLine(r) {
  if (!r) return '';
  const cams = (r.camera_names && r.camera_names.length ? r.camera_names : r.cameras || []).join(', ');
  const who = `${str(r.person_label)} (${roleWord(r.person_role)})`;
  if (r.status === 'requested') return `${who} asks for ${cams}${r.reason ? `: "${str(r.reason)}"` : ''}`;
  if (r.status === 'granted') return `${who} can see ${cams}${r.expires_on ? ` until ${r.expires_on}` : ', until taken back'}`;
  if (r.status === 'declined') return `${who} was not given ${cams}${r.decision_note ? `: "${str(r.decision_note)}"` : ''}`;
  return `${who} had ${cams}; taken back`;
}

/** The person's own grant on this door that still holds, newest first. */
export function myLiveGrant(rows = [], me = null, today = new Date()) {
  const day = today.toISOString().slice(0, 10);
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && me && r.person_user_id === me && r.status === 'granted' && r.grant_token && (!r.expires_on || r.expires_on >= day))
    .sort((a, b) => String(b.decided_at || b.created_at || '').localeCompare(String(a.decided_at || a.created_at || '')))[0] || null;
}

/** The text a guest is sent: the link, what it opens, and until when. */
export function accessText({ name = '', door = '', cameras = [], link = '', days = 0 } = {}) {
  const until = days > 0 ? ` for ${days} day${days === 1 ? '' : 's'}` : '';
  const hi = str(name) ? `Hi ${str(name)}, ` : '';
  return `${hi}here is your camera access at ${str(door) || 'the property'} (${cameras.join(', ')})${until}. Open it on your phone: ${link} . No account or password needed.`;
}
