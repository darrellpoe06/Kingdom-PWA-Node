// =============================================================================
// conference-register — the OPEN, no-login congregation registration path
// =============================================================================
// The congregation-facing half of the conference. ANYONE (signed-out included)
// may register; the row lands in conference_public_registrations (migration 0027)
// and is read only by the church owner/admin. This replaces the old device-only
// RSVP that showed "✓" but silently never reached organizers (the named ship-gate
// failure). Mirrors interest-sync.js (the proven app_interest / ?join pattern):
// the ROW is the deliverable, so we SURFACE failure rather than swallow it.
//
// Pure helpers (validate / build / aggregate) are split out so the shapes are
// locked by tests with no live DB (DR-0076: measure, don't claim). The supabase
// calls stay thin and never throw.
import supabase from './supabase.js';
import { MEAL_TYPES, normalizeMealType, aggregateMeals, mealCountRows } from './conference.js';
import { cleanField, fieldsOverCap, FIELD_CAPS } from './sanitize-input.js';

export { MEAL_TYPES, normalizeMealType, aggregateMeals, mealCountRows };

export const REGISTRATION_STATUSES = ['new', 'confirmed', 'cancelled'];

// The user-typed fields on the public form and their caps (subset of FIELD_CAPS).
// conference_name + source are set by the app, not the user, so they are cleaned in
// buildRegistrationRow but not surfaced as user-facing length errors here.
const USER_FIELD_CAPS = {
  name: FIELD_CAPS.name,
  email: FIELD_CAPS.email,
  phone: FIELD_CAPS.phone,
  dietary: FIELD_CAPS.dietary,
  days: FIELD_CAPS.days,
};
const OVER_CAP_MSG = {
  name: `Please shorten your name (max ${FIELD_CAPS.name} characters).`,
  email: `That email is too long (max ${FIELD_CAPS.email} characters).`,
  phone: `That phone number is too long (max ${FIELD_CAPS.phone} characters).`,
  dietary: `Please shorten the allergy / dietary note (max ${FIELD_CAPS.dietary} characters).`,
  days: `Please shorten the days note (max ${FIELD_CAPS.days} characters).`,
};

// Validate a public registration. Name is the only hard requirement — keep the
// barrier to entry as low as possible for a mixed / elderly congregation. Email
// is optional but, if given, must look like an email so an invite can reach them.
// party_size, when given, must be a sane positive count. Over-cap fields are
// rejected with a friendly message (the DB CHECK constraints in migration 0033 are
// the enforceable server-side backstop for anyone who bypasses this form).
export function validateRegistration(form = {}) {
  const errors = {};
  const name = cleanField(form.name, FIELD_CAPS.name);
  if (!name) errors.name = 'Please enter your name so we can check you in.';

  const email = String(form.email ?? '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = 'That email doesn’t look right — or leave it blank.';
  }

  if (form.partySize !== undefined && form.partySize !== '' && form.partySize !== null) {
    const n = Number(form.partySize);
    if (!Number.isFinite(n) || n < 1 || n > 99) {
      errors.partySize = 'How many in your party? (1–99)';
    }
  }

  // Over-length fields (a paste or a hostile oversized payload) get a clear,
  // shorten-it message rather than a silent truncation.
  for (const field of fieldsOverCap(form, USER_FIELD_CAPS)) {
    if (!errors[field]) errors[field] = OVER_CAP_MSG[field] || 'That value is too long — please shorten it.';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// Coerce a free/typed party size to a clean integer >= 1 (defaults to 1).
export function normalizePartySize(v) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 99) : 1;
}

// Build the conference_public_registrations row from the form. Pure + spec-shaped.
// EVERY user-supplied text field is run through cleanField: HTML tags + control /
// invisible / bidi chars stripped, whitespace normalized, length hard-capped. This
// keeps the STORED value inert (defense-in-depth behind React's render escaping) and
// bounded (defense-in-depth behind the 0033 CHECK constraints).
export function buildRegistrationRow(form = {}) {
  return {
    conference_name: cleanField(form.conferenceName, FIELD_CAPS.conferenceName) || null,
    name: cleanField(form.name, FIELD_CAPS.name),
    email: cleanField(form.email, FIELD_CAPS.email) || null,
    phone: cleanField(form.phone, FIELD_CAPS.phone) || null,
    meal_type: normalizeMealType(form.mealType),
    dietary: cleanField(form.dietary, FIELD_CAPS.dietary) || null,
    days: cleanField(form.days, FIELD_CAPS.days) || null,
    party_size: normalizePartySize(form.partySize),
    source: cleanField(form.source, FIELD_CAPS.source) || 'public-link',
    status: 'new',
  };
}

// DB row -> camelCase shape for the organizer view. checkedInAt/checkedInHeads
// (migration 0031) are the ACTUAL arrival: a NULL checkedInAt = not arrived yet /
// a no-show; checkedInHeads = how many of the party actually came.
export function toRegistrationShape(row) {
  return {
    id: row.id,
    conferenceName: row.conference_name ?? null,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    mealType: normalizeMealType(row.meal_type),
    dietary: row.dietary ?? null,
    days: row.days ?? null,
    partySize: Number.isFinite(row.party_size) ? row.party_size : (row.party_size ?? 1),
    source: row.source ?? null,
    status: row.status ?? 'new',
    createdAt: row.created_at ?? null,
    checkedInAt: row.checked_in_at ?? null,
    checkedInHeads: Number.isFinite(row.checked_in_heads) ? row.checked_in_heads : (row.checked_in_heads ?? null),
  };
}

// Whether a registration has been checked in (actually arrived).
export function isCheckedIn(reg) {
  return !!(reg && reg.checkedInAt);
}

// Total HEADS across registrations (sum of party_size, excluding cancelled) — the
// real attendance number, not just the row count.
export function totalHeads(registrations) {
  return (registrations || [])
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + normalizePartySize(r.partySize), 0);
}

// Generate a client-side row id so the registrant's own browser KNOWS the id of
// the row it just created — without any read-back (anon has no SELECT on the roll).
// That id is what the optional account on-ramp later passes to the claim RPC to
// LINK this registration to the new account (see lib/conference-link.js). The
// table's PK accepts a supplied uuid (overriding gen_random_uuid()); a duplicate
// would simply fail the insert (no overwrite, no leak). Falls back to null on
// ancient browsers without crypto.randomUUID — registration still works; only the
// link step is skipped.
function newRegistrationId() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch { /* fall through */ }
  return null;
}

// Submit one public registration. Best-effort but HONEST: returns {ok:true, id} or
// {ok:false, error}; never throws (a thrown insert must not break the form), but
// the caller MUST surface a false result — the row is the deliverable. The returned
// id (when present) lets the OPTIONAL account on-ramp link this registration.
export async function submitRegistration(form = {}) {
  const row = buildRegistrationRow(form);
  if (!row.name) return { ok: false, error: { message: 'name-required' } };
  const id = newRegistrationId();
  if (id) row.id = id;
  try {
    const { error } = await supabase.from('conference_public_registrations').insert(row);
    if (error) {
      console.warn('[conference-register] submit failed:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true, id: id || null };
  } catch (e) {
    console.warn('[conference-register] submit threw:', e);
    return { ok: false, error: e };
  }
}

// Organizer: fetch the registration roll, newest first. RLS returns nothing to a
// non owner/admin, so this is safe to call from any organizer surface.
export async function fetchRegistrations() {
  try {
    const { data, error } = await supabase
      .from('conference_public_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error, rows: [] };
    return { ok: true, rows: (data || []).map(toRegistrationShape) };
  } catch (e) {
    return { ok: false, error: e, rows: [] };
  }
}

// Organizer: live subscription (realtime) — re-fetch on any change so the roll +
// meal counts update as the congregation signs up. Returns an unsubscribe fn.
export function subscribeRegistrations(onChange) {
  let channel = null;
  let cancelled = false;
  const load = async () => {
    const { ok, rows } = await fetchRegistrations();
    if (ok && !cancelled) onChange(rows);
  };
  load();
  try {
    channel = supabase
      .channel('conference_public_registrations-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conference_public_registrations' }, () => { load(); })
      .subscribe();
  } catch { /* realtime optional; the initial load still ran */ }
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* noop */ } }
  };
}

// Organizer: confirm / cancel a registration.
export async function setRegistrationStatus(id, status) {
  if (!REGISTRATION_STATUSES.includes(status)) return { ok: false, error: 'bad-status' };
  try {
    const { error } = await supabase.from('conference_public_registrations').update({ status }).eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Check a registration IN — the ACTUAL arrival capture (the greeter's one tap).
// heads defaults to the registered party size; a greeter may record fewer if some
// of the party didn't come. checkedInAt is the server clock (now()). Owner/admin
// only (RLS); fails soft + honest like every other write here.
export async function checkInRegistration(id, heads) {
  if (!id) return { ok: false, error: { message: 'id-required' } };
  const h = Math.max(1, Math.floor(Number(heads)) || 1);
  try {
    const { error } = await supabase
      .from('conference_public_registrations')
      .update({ checked_in_at: new Date().toISOString(), checked_in_heads: h })
      .eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Undo a check-in (a greeter tapped the wrong row) — clears the ACTUAL arrival.
export async function undoCheckIn(id) {
  if (!id) return { ok: false, error: { message: 'id-required' } };
  try {
    const { error } = await supabase
      .from('conference_public_registrations')
      .update({ checked_in_at: null, checked_in_heads: null })
      .eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Meal aggregation for catering — exact counts per category + the allergy list,
// over the non-cancelled roll. Reuses aggregateMeals (single-sourced shapes).
export function aggregateRegistrationMeals(registrations) {
  return aggregateMeals((registrations || []).filter((r) => r.status !== 'cancelled'));
}
