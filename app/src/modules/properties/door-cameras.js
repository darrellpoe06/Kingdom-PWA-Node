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
 * THE UNIT A NAME IS ABOUT, or '' when it is about no particular unit. A unit
 * is read only where it is MARKED — "apt 2", "unit B", "#3", "suite 101" — so
 * the house number in "805 porch floodlight" is never mistaken for a unit and a
 * common-area camera stays common.
 */
export function unitOf(text) {
  const t = str(text).toLowerCase();
  const m = t.match(/\b(?:apt|apartment|unit|ste|suite|rm|room)\.?\s*#?\s*([a-z0-9]{1,4})\b/) || t.match(/#\s*([a-z0-9]{1,4})\b/);
  return m ? m[1] : '';
}

/** The unit a DOOR is, from its own unit label ("Apt 4" -> "4", "B" -> "b"). */
export function doorUnit(door = {}) {
  const u = doorWords(door).unit;
  if (!u) return '';
  return unitOf(u) || (str(u).toLowerCase().match(/([a-z0-9]{1,4})\s*$/) || ['', ''])[1];
}

/**
 * WHO CAN ACTUALLY OPEN THIS DOOR'S CAMERAS (DR-1179).
 *
 * Darrell, 2026-10-21: *"Also I gave apt 2 and 1 camera access in way that
 * allowed me too... they didn't get it... why not.... fix it!!!!!"*
 *
 * WHY THEY DID NOT GET IT, traced rather than guessed. The grant was minted
 * correctly on the NAS and written correctly onto the tenancy row. The tenant
 * never reached it because they could not read the ROW. `loadMyDoors`
 * (cloud.js:154) selects `camera_grant` and leans entirely on RLS, and the
 * policy — `rental_tenancies_read`, migration 0150 — admits a tenant through
 * exactly two arms:
 *
 *     tenant_user_id = auth.uid()          -- a claimed invite
 *     user_is_tenancy_household(id)        -- a row in tenancy_household,
 *                                             member_user_id = auth.uid(),
 *                                             active = true
 *
 * A tenant who exists only as a NAME on the row — never invited, never claimed
 * — satisfies neither. `loadMyDoors` returns them no row at all, so there is no
 * door to carry the grant, and the Cameras tab truthfully reports that nothing
 * is shared. Minting a grant for a door nobody has joined can never deliver.
 *
 * AND THE TAB SAID SO IN THE WRONG PLACE, which is the defect this closes. The
 * notice that would have caught it tested `viewers.length === 0` — but
 * whoSeesDoorCameras COUNTS a lease name as a viewer (`joined: false`), so a
 * door with a tenant_name and no tenant_user_id has one viewer, the notice
 * never rendered, and the only hint was the words "has not signed in yet"
 * appended to a name inside the lower, collapsed "Who has access" region —
 * underneath a cheerful "Shared with this door: 2 cameras". Success at the top,
 * the blocking fact buried.
 *
 * The right test is not how many names are on the door. It is whether ANYONE on
 * it has actually joined.
 */
export function whoCanOpen({ door = null, people = [] } = {}) {
  const viewers = whoSeesDoorCameras({ door, people });
  const joined = viewers.filter((v) => v.joined);
  const waiting = viewers.filter((v) => !v.joined);
  if (joined.length > 0) {
    return { canOpen: true, joined, waiting, words: `${joined.map((v) => v.name).join(', ')} ${joined.length === 1 ? 'is' : 'are'} signed into this door and will see them.` };
  }
  if (waiting.length > 0) {
    const names = waiting.map((v) => v.name).join(', ');
    return {
      canOpen: false,
      joined,
      waiting,
      words: `${names} ${waiting.length === 1 ? 'is' : 'are'} on this door's record but ${waiting.length === 1 ? 'has' : 'have'} not signed in, so ${waiting.length === 1 ? 'they' : 'they'} cannot open a camera yet — the cameras only reach a signed-in account. Invite ${waiting.length === 1 ? 'them' : 'them'} in People; what is shared appears the moment they accept.`,
    };
  }
  return { canOpen: false, joined, waiting, words: 'Nobody is on this door yet, so nothing shared here can be opened. Add the tenant or a household member in People first.' };
}

/**
 * WHO THE ASK MENU ACTUALLY REACHES (DR-1179).
 *
 * Darrell, 2026-10-21: *"I checked the anyone can see section for apt 2 cameras
 * including short stays... did it work?!!!!!!!!!!!!!!!!!!!!!"*
 *
 * It did what it does, which is NOT grant access — and that is the trap.
 * "Cameras people can ask for at this door" plus "Save what can be asked for"
 * publishes a MENU (`saveCameraMenu`). Nobody receives a camera from it. A
 * person on the door then has to ASK, and the owner has to press Give it.
 *
 * AND FOR A SHORT-STAY GUEST IT DOES NOTHING AT ALL. Ticking a guest's name in
 * that list cannot reach a guest, because a guest never signs into the door:
 * `resolveFace` gives the `cameras` tab to TENANT_TABS only (tenant and
 * household), a 1099 worker's WORKER_TABS has no cameras tab, and a short-stay
 * guest is not a door role at all. A guest is reached by **Give access to
 * anyone**, which mints their grant and hands back a link to text — the only
 * control on this tab that actually delivers a camera to someone with no
 * account.
 *
 * So the menu now says, in words, what saving it does and does not do, and
 * points a short-stay at the control that works. Returns the sentence; the
 * surface decides where to put it.
 */
export function menuReach({ saved = 0 } = {}) {
  return {
    grants: false,
    words: saved > 0
      ? `Saved. This is a MENU, not access: the ${saved} camera${saved === 1 ? '' : 's'} named here can be ASKED for by the tenant and their household signed into this door, and they see nothing until you press Give it on their ask. A 1099 worker and a short-stay guest never see this list at all — reach them with “Give access to anyone” below, which mints their access and hands you a link to text.`
      : 'This is a MENU, not access. Naming a camera here lets the tenant and their household ask for it; they see nothing until you press Give it. A 1099 worker or a short-stay guest cannot see this list — use “Give access to anyone” below for them.',
  };
}

/**
 * WHETHER A PERSON IN THIS ROLE CAN OPEN A CAMERA AT ALL, and by what means
 * (DR-1179). Darrell, 2026-10-21: *"What about the landlords and owners...
 * etc..."* — whoCanOpen answers for the HOUSEHOLD, which is only one of the
 * faces at a door. The rest answer differently, and the differences are real:
 *
 *   owner / admin / member — by the FAMILY KEY their own device holds
 *     (`bridgeToken()`), never by a grant. They are not in whoCanOpen's count
 *     and they do not need to be; nothing has to be shared with them.
 *   tenant / household — by the DOOR'S grant on the tenancy row, and only once
 *     they have signed in (the RLS arms in migration 0150).
 *   1099 worker / short-stay guest / anyone else — by a grant of THEIR OWN,
 *     per person (DR-0938), delivered as a link. Never by the door's grant,
 *     and never by the ask menu, which they cannot see.
 */
export const CAMERA_REACH = Object.freeze({
  owner: { by: 'family key', words: 'Your own device holds the family camera key, so you see every camera without anything being shared with you.' },
  admin: { by: 'family key', words: 'An admin on this instance reads the cameras with the family key, not with a grant.' },
  member: { by: 'family key', words: 'A member on this instance reads the cameras with the family key, not with a grant.' },
  tenant: { by: 'door grant', words: 'The tenant sees what is shared with this door, once they have signed in.' },
  household: { by: 'door grant', words: 'A household member sees what is shared with this door, once they have signed in.' },
  worker: { by: 'own grant', words: 'A 1099 worker is given cameras one person at a time — not by the door and not by the ask menu, which they cannot see.' },
  guest: { by: 'own grant', words: 'A short-stay guest never signs into the door. Give them access by name and send the link; that is the only way a camera reaches them.' },
});
export function cameraReach(role) {
  return CAMERA_REACH[role] || { by: 'own grant', words: 'Anyone who is not on this door and not on the family key is given cameras by name, with a link.' };
}

/**
 * The cameras a door most likely means, from the whole list: the ones whose
 * name or id carries a word of the door's address (the house number first:
 * "805" picks every "805 ..." camera) — AND THEN, at a multi-unit address, the
 * ones that are not plainly ANOTHER unit's.
 *
 * ANOTHER TENANT'S HALLWAY IS NOT THIS TENANT'S DOOR (DR-1177). Darrell asked
 * it straight on 2026-10-21: "Tenants only get their door right?" By mechanism
 * the answer was already yes — a grant names its cameras, the NAS returns only
 * those on /list and answers 403 not-your-camera for any other
 * (cams_forwarder.py:4061, proven in its own self-test at :5255-5260). By
 * DEFAULT the answer was no: this function matched on the house number alone
 * and never read the unit, so Apt 1's door and Apt 2's door arrived pre-ticked
 * with the SAME set — the neighbour's hallway among them — and a landlord who
 * pressed Share without unticking handed it over. Measured, not recalled: the
 * suite pins that the two sets were identical and both held `805_apt2_hallway`.
 *
 * Now a camera marked for a DIFFERENT unit is left unticked. Common-area
 * cameras — the porch, the back door, the lot, anything with no unit marked —
 * are untouched and still suggested, because those are what a door's household
 * is normally given. The landlord can still tick anything in the list by hand:
 * this changes what is OFFERED by default, never what is ALLOWED, and the owner
 * stays the one who decides (DR-0841).
 */
export function suggestDoorCameras(cameras = [], door = {}) {
  const label = doorWords(door).label.toLowerCase();
  const words = label.split(/[^a-z0-9]+/).filter((w) => w.length >= 3 || /^\d{2,}$/.test(w));
  const number = (label.match(/^\d+/) || [])[0] || '';
  const mine = doorUnit(door);
  const hit = (c) => {
    const hay = `${str(c.name)} ${str(c.id)}`.toLowerCase();
    if (number && hay.includes(number)) return true;
    return words.some((w) => w.length >= 4 && hay.includes(w));
  };
  // A door with no unit label is a whole house: there is nothing to narrow, and
  // narrowing it would wrongly drop a camera that happens to carry a unit word.
  const notAnothersUnit = (c) => {
    if (!mine) return true;
    const u = unitOf(`${str(c.name)} ${str(c.id)}`);
    return !u || u === mine;
  };
  return (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id && hit(c) && notAnothersUnit(c)).map((c) => c.id);
}

/**
 * WHERE A CAMERA IS, AND WHO IS OFFERED IT (DR-1164). Darrell, 2026-10-21, on
 * the manager's Cameras tab listing all 33 cameras on the NAS, his home's among
 * them: "my personal home cameras should be an option only I can give... not a
 * property manager... camera location should be a significant issue... so
 * they shouldn't be able to see my home cameras unless I give them that."
 *
 * A camera's place is read from its name the way suggestDoorCameras reads it
 * (the house number first, then a word of the address). From the NAS's whole
 * list a door sorts three groups:
 *   here       carrying this door's address (805 ... for the 805 doors)
 *   elsewhere  carrying another house number (another property)
 *   unplaced   no address in the name at all: the family's own home cameras
 *              (front_cam, basketball_cam, Kitchen 2) or a camera not yet named
 * The location is a finding on its own (the KPI he named): a camera nobody
 * can place is said, never silently offered.
 */
export function splitCamerasByDoor(cameras = [], door = {}) {
  const list = (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id);
  const hereIds = new Set(suggestDoorCameras(list, door));
  const numbered = (c) => /(^|[^0-9])\d{2,}([^0-9]|$)/.test(`${str(c.name)} ${str(c.id)}`);
  const rest = list.filter((c) => !hereIds.has(c.id));
  return {
    here: list.filter((c) => hereIds.has(c.id)),
    elsewhere: rest.filter(numbered),
    unplaced: rest.filter((c) => !numbered(c)),
  };
}

/**
 * The cameras a face may be offered on this door. A MANAGER is offered the
 * cameras at the door's address and no others: a camera at another address or
 * the family's own is never listed, named or counted for them. The OWNER is
 * offered everything, the door's own first and the rest set apart with a
 * warning, because sharing one of those to a door hands another address, or
 * the home, to its household.
 */
export function offeredCameras(role, split) {
  const s = split || { here: [], elsewhere: [], unplaced: [] };
  if (role === 'manager') return [...s.here];
  return [...s.here, ...s.elsewhere, ...s.unplaced];
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

/**
 * WHAT THE TENANT SEES, AND WHAT THEY DO NOT (Darrell, 2026-10-21: "show the
 * allowed cameras for the tenants located in the app and what they have or
 * dont have access to... this will show and tell us owners when they do or
 * don't have access"). From the NAS's list, the door's grant as the NAS holds
 * it, and the boxes ticked on this screen:
 *   seen      the cameras the door's grant opens (what the tenant's tab shows)
 *   notSeen   every other camera on the NAS
 *   toAdd     ticked here, not in the grant yet (Share gives them)
 *   toRemove  in the grant, unticked here (Share takes them out)
 * `grant` is the NAS's own record ({cameras: [...] | '*'}) or null when the NAS
 * did not say; then nothing is claimed as seen.
 */
export function doorCameraView({ cameras = [], grant = null, picked = [] } = {}) {
  const list = (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id);
  const all = grant && grant.cameras === '*';
  const inGrant = new Set(all ? list.map((c) => c.id) : (grant && Array.isArray(grant.cameras) ? grant.cameras : []));
  const ticked = new Set(Array.isArray(picked) ? picked : []);
  const seen = list.filter((c) => inGrant.has(c.id));
  const notSeen = list.filter((c) => !inGrant.has(c.id));
  return {
    seen,
    notSeen,
    toAdd: list.filter((c) => ticked.has(c.id) && !inGrant.has(c.id)),
    toRemove: seen.filter((c) => !ticked.has(c.id)),
  };
}

/** The ids a door's grant opens, for the picker's first ticks; null when the NAS did not say. */
export function grantCameraIds(grant, cameras = []) {
  if (!grant) return null;
  if (grant.cameras === '*') return (Array.isArray(cameras) ? cameras : []).map((c) => c.id);
  return Array.isArray(grant.cameras) ? [...grant.cameras] : [];
}

/** One plain line for a camera's answer to the door's own grant. */
export function tenantFrameLine({ status = 0, body = null } = {}) {
  const err = body && typeof body.error === 'string' ? body.error : '';
  if (status === 200) return { ok: true, text: 'The tenant sees this, live' };
  if (status === 401) return { ok: false, text: 'Refused: the door\'s grant is not valid on the NAS (taken back or expired)' };
  if (status === 403) return { ok: false, text: 'Refused: the door\'s grant does not include this camera' };
  if (err === 'wyze-offline') return { ok: false, text: 'Shared, but Wyze says the camera is offline' };
  if (status === 504 || err === 'frame-timeout') return { ok: false, text: 'Shared, but the camera gave no picture in time' };
  if (status === 0) return { ok: false, text: 'The camera road did not answer' };
  return { ok: false, text: `Shared, but the NAS answered HTTP ${status}${err ? ` (${err})` : ''}` };
}

/** Write the grant onto the door (owner/admin/member of the instance, per 0055). */
export async function setDoorCameraGrant(tenancyId, { token = null, note = null } = {}, client = supabase) {
  try {
    const { error } = await client.from('rental_tenancies').update({ camera_grant: token || null, camera_grant_note: note || null }).eq('id', tenancyId);
    return error ? { ok: false, reason: 'write-failed', error: error.message || String(error) } : { ok: true };
  } catch (e) { return { ok: false, reason: 'unexpected', error: String((e && e.message) || e) }; }
}

// -----------------------------------------------------------------------------
// ASKED FOR AND GIVEN (DR-0938, 0266). Darrell, 2026-10-10: "I want the camera
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
