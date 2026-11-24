// =============================================================================
// profiles-sync — one full profile per person, seen by those who may message you
// =============================================================================
// Darrell, 2026-09-09: "we want users to have full profiles etc.... Robust
// Architecture and development and design" — "scalability is key." The server
// side is migration 0186 (DR-0342): one row per auth user, RLS to the owner,
// get_profile(other) for everyone else (exactly the people users_can_dm
// allows, narrowed by the owner's visibility), upsert_my_profile() as the one
// write. THIS module is the client's honest seam: every read goes by id, the
// only picture is a small thumbnail (the list never carries the bytes,
// DR-0303), and a card is cached once fetched so a thread never re-asks.
import supabase from './supabase.js';
import { humanizeServerError } from './server-error-text.js';
import { compressImageFile } from './image.js';

export const VISIBILITY = ['members', 'leaders', 'private'];
export const PHOTO_THUMB_MAX_CHARS = 32000;
export const PHOTO_THUMB_PX = 160;
export const TESTIMONY_MAX = 2000;
export const MINISTRIES_MAX = 12;

// Pure: a server row → the shape every surface reads.
export function profileShape(row) {
  if (!row || !row.user_id) return null;
  return {
    userId: row.user_id,
    displayName: row.display_name || 'Member',
    photoThumb: row.photo_thumb || null,
    house: row.house || '',
    ministries: Array.isArray(row.ministries) ? row.ministries.filter(Boolean) : [],
    favoriteVerse: row.favorite_verse || '',
    testimony: row.testimony || '',
    visibility: VISIBILITY.includes(row.visibility) ? row.visibility : 'members',
    updatedAt: row.updated_at || null,
    fullView: row.full_view !== false,
  };
}

// Pure: what the editor sends. Trims, caps, and refuses what the server would
// refuse — so a bad save never leaves the device.
export function validateProfileFields(f = {}) {
  const errors = [];
  const displayName = String(f.displayName || '').trim();
  if (displayName.length < 1 || displayName.length > 80) errors.push('a display name is 1 to 80 characters');
  const visibility = VISIBILITY.includes(f.visibility) ? f.visibility : 'members';
  const photoThumb = f.photoThumb || null;
  if (photoThumb && (!/^data:image\//.test(photoThumb) || photoThumb.length > PHOTO_THUMB_MAX_CHARS)) errors.push('the picture must be a small thumbnail');
  const ministries = String(f.ministries || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).slice(0, MINISTRIES_MAX);
  const testimony = String(f.testimony || '').trim().slice(0, TESTIMONY_MAX);
  const house = String(f.house || '').trim().slice(0, 80);
  const favoriteVerse = String(f.favoriteVerse || '').trim().slice(0, 40);
  return { ok: errors.length === 0, errors, fields: { displayName, photoThumb, house, ministries, favoriteVerse, testimony, visibility } };
}

// Initials for a person with no picture — never a blank circle.
export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// A profile picture is a THUMBNAIL: ~160px, JPEG, capped. A phone photo of
// several MB lands under 20 KB. Over the cap, we shrink again once; then refuse
// honestly rather than ship a heavy row.
export async function photoThumbFromFile(file) {
  let url = await compressImageFile(file, PHOTO_THUMB_PX, 0.72);
  if (url.length > PHOTO_THUMB_MAX_CHARS) url = await compressImageFile(file, 120, 0.6);
  if (url.length > PHOTO_THUMB_MAX_CHARS) throw new Error('that picture could not be made small enough — try a simpler photo');
  return url;
}

const cache = new Map();
export function __resetProfileCache() { cache.clear(); }

export async function loadProfile(userId) {
  if (!userId) return null;
  if (cache.has(userId)) return cache.get(userId);
  const { data, error } = await supabase.rpc('get_profile', { other: userId });
  if (error) { console.warn('[profiles] get_profile failed:', error); return null; }
  const row = Array.isArray(data) ? data[0] : data;
  const p = profileShape(row);
  cache.set(userId, p);
  return p;
}

// MY OWN PROFILE IS KEPT ON MY DEVICE (DR-1624). Darrell 2026-11-24, with the
// road to the NAS dark: "No longer shows my picture on my image spot!!!! Why?"
// The picture lives in his profiles row, the read failed, and the header fell
// to his initial. A person's own profile is theirs: the last good read is kept
// on the device under their own user id and shown when the read cannot be made
// (`fromDevice: true`). It is never shown to another account, and a successful
// read always replaces it, a deleted row included.
const MY_PROFILE_KEY = (uid) => `poe-my-profile-${uid}`;

export function keepMyProfile(uid, profile, store = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    if (!store || !uid) return;
    if (profile) store.setItem(MY_PROFILE_KEY(uid), JSON.stringify(profile));
    else store.removeItem(MY_PROFILE_KEY(uid));
  } catch (_) { /* storage full or blocked: the live read still works */ }
}

export function keptMyProfile(uid, store = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    if (!store || !uid) return null;
    const p = JSON.parse(store.getItem(MY_PROFILE_KEY(uid)) || 'null');
    return p && p.userId === uid ? { ...p, fromDevice: true } : null;
  } catch (_) { return null; }
}

// The user id of the sign-in stored on this device, read from the client's own
// slot. Kept local so the many suites that mock ./supabase.js need no new export.
function storedUserId() {
  try {
    const key = supabase?.auth?.storageKey;
    if (!key || typeof localStorage === 'undefined') return null;
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    return (s && s.user && s.user.id) || null;
  } catch (_) { return null; }
}

export async function loadMyProfile() {
  let uid = null;
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    uid = session?.user?.id || null;
  } catch (_) { /* fall through to the stored session */ }
  // getSession answers null with an error while a refresh cannot reach the
  // server (DR-1618); the stored sign-in still says whose device this is.
  if (!uid) uid = storedUserId();
  if (!uid) return null;
  let data;
  let error;
  try {
    ({ data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle());
  } catch (e) { error = e; }
  if (error) { console.warn('[profiles] own read failed:', error); return keptMyProfile(uid); }
  const p = profileShape(data ? { ...data, full_view: true } : null);
  keepMyProfile(uid, p);
  return p;
}

export async function saveMyProfile(fields) {
  const v = validateProfileFields(fields);
  if (!v.ok) return { saved: false, errors: v.errors };
  const f = v.fields;
  const { data, error } = await supabase.rpc('upsert_my_profile', {
    display_name_in: f.displayName,
    photo_thumb_in: f.photoThumb,
    house_in: f.house || null,
    ministries_in: f.ministries,
    favorite_verse_in: f.favoriteVerse || null,
    testimony_in: f.testimony || null,
    visibility_in: f.visibility,
  });
  // Never the raw body: a Cloudflare error page once printed itself into the
  // form's status line (2026-09-09). Words, and what did not happen.
  if (error) return { saved: false, errors: [humanizeServerError(error, { did: 'Nothing was saved' })] };
  const p = profileShape(Array.isArray(data) ? data[0] : data);
  if (p) cache.set(p.userId, { ...p, fullView: true });
  if (p) keepMyProfile(p.userId, { ...p, fullView: true });
  return { saved: true, profile: p };
}
