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

export { MEAL_TYPES, normalizeMealType, aggregateMeals, mealCountRows };

export const REGISTRATION_STATUSES = ['new', 'confirmed', 'cancelled'];

// Validate a public registration. Name is the only hard requirement — keep the
// barrier to entry as low as possible for a mixed / elderly congregation. Email
// is optional but, if given, must look like an email so an invite can reach them.
// party_size, when given, must be a sane positive count.
export function validateRegistration(form = {}) {
  const errors = {};
  const name = String(form.name ?? '').trim();
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
  return { ok: Object.keys(errors).length === 0, errors };
}

// Coerce a free/typed party size to a clean integer >= 1 (defaults to 1).
export function normalizePartySize(v) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 99) : 1;
}

// Build the conference_public_registrations row from the form. Pure + spec-shaped.
export function buildRegistrationRow(form = {}) {
  return {
    conference_name: String(form.conferenceName ?? '').trim() || null,
    name: String(form.name ?? '').trim(),
    email: String(form.email ?? '').trim() || null,
    phone: String(form.phone ?? '').trim() || null,
    meal_type: normalizeMealType(form.mealType),
    dietary: String(form.dietary ?? '').trim() || null,
    days: String(form.days ?? '').trim() || null,
    party_size: normalizePartySize(form.partySize),
    source: form.source || 'public-link',
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

// Submit one public registration. Best-effort but HONEST: returns {ok:true} or
// {ok:false, error}; never throws (a thrown insert must not break the form), but
// the caller MUST surface a false result — the row is the deliverable.
export async function submitRegistration(form = {}) {
  const row = buildRegistrationRow(form);
  if (!row.name) return { ok: false, error: { message: 'name-required' } };
  try {
    const { error } = await supabase.from('conference_public_registrations').insert(row);
    if (error) {
      console.warn('[conference-register] submit failed:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true };
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
