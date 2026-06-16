// =============================================================================
// conference.js — pure logic for the Conference module (meals + Service<->Choir)
// =============================================================================
// Extracted so the surface in ConferenceModule.jsx stays a thin view over real
// state and the shapes are locked by tests (DR-0076: measure, don't claim).
//
// TWO concerns, both shaped sync-ready:
//   1. Meals / dietary — the RSVP becomes a small registration. Each record is
//      shaped to the ingestion spec's `event_participants.dietary` column
//      (docs/99-session-notes/2026-06-08-...-data-ingestion.md, line 117):
//      a categorical `mealType` + a freeform `dietary` (allergies / specific
//      need). Aggregation gives catering exact counts + the allergy list with
//      NO manual tally.
//   2. Service <-> Choir — a conference session may be a "Main Service" that
//      REFERENCES a choir sermon (by id) and a set of choir songs (by id). The
//      sermon/song DATA stays in choir_sermons / choir_songs (single source of
//      truth, owned by the Choir module); the conference stores only the ids and
//      resolves them LIVE from the subscribed lists. Reference, never duplicate.
// =============================================================================

// The meal-preference categories (task shape: regular / vegetarian / vegan /
// gluten-free / other). Order is the display order in the picker + summary.
export const MEAL_TYPES = ['Regular', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'];

// Snap any incoming value to a known category (case-insensitive); default Regular
// so a stray/legacy value never breaks the tally.
export function normalizeMealType(t) {
  const v = String(t ?? '').trim();
  const hit = MEAL_TYPES.find((m) => m.toLowerCase() === v.toLowerCase());
  return hit || 'Regular';
}

// Build the spec-shaped RSVP record. id + at are supplied by the caller (the
// component owns Date.now) so this stays pure + testable. Matches the eventual
// event_participants row: { name, mealType, dietary } (+ local id/at).
export function buildRsvp({ name, mealType, dietary, id, at }) {
  return {
    id: id ?? null,
    name: String(name ?? '').trim(),
    mealType: normalizeMealType(mealType),
    dietary: String(dietary ?? '').trim(),
    at: at ?? null,
  };
}

// Organizer aggregation: exact counts per mealType + the allergy/dietary notes
// list, so Chef Mario / catering plan exact quantities with no manual tally.
// counts is keyed by every category present (>0); notes carries only RSVPs that
// actually wrote an allergy/specific need.
export function aggregateMeals(rsvps) {
  const counts = {};
  const notes = [];
  for (const r of rsvps || []) {
    const t = normalizeMealType(r.mealType);
    counts[t] = (counts[t] || 0) + 1;
    const d = String(r.dietary ?? '').trim();
    if (d) notes.push({ name: String(r.name ?? '').trim(), mealType: t, dietary: d });
  }
  return { counts, notes, total: (rsvps || []).length };
}

// counts object -> ordered [type, n] pairs (MEAL_TYPES order, only non-zero) for
// stable display.
export function mealCountRows(counts) {
  return MEAL_TYPES.map((t) => [t, counts?.[t] || 0]).filter(([, n]) => n > 0);
}

// --- Meal menu (what's served each day) --------------------------------------
// conf.meals = [{ id, day, mealName, options[], notes }]. options is a real
// array (sync-ready); the editor types a "·"/comma string we parse on save.
export function parseMealOptions(str) {
  return String(str ?? '')
    .split(/[,·\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatMealOptions(options) {
  return (options || []).join(' · ');
}

export function buildMeal({ day, mealName, options, notes, id }) {
  return {
    id: id ?? null,
    day: String(day ?? '').trim(),
    mealName: String(mealName ?? '').trim(),
    options: Array.isArray(options) ? options : parseMealOptions(options),
    notes: String(notes ?? '').trim(),
  };
}

// --- Service <-> Choir link (reference, never duplicate) ---------------------
// A Main Service is a schedule session flagged kind:'main' that references a
// choir sermon (sermonId) + an ordered set of choir songs (songIds). The data
// lives in choir_sermons / choir_songs; we resolve it live from the lists the
// choir-sync subscribers deliver.

export function isMainService(session) {
  return !!(session && session.kind === 'main');
}

// The linked sermon object from the live choir_sermons list, or null.
export function resolveServiceSermon(session, sermons) {
  if (!session || !session.sermonId) return null;
  return (sermons || []).find((s) => s && s.id === session.sermonId) || null;
}

// The linked songs from the live choir_songs list, IN the order the organizer
// set on the session (not the song list's own order). Unknown ids drop out.
export function resolveServiceSongs(session, songs) {
  const ids = (session && session.songIds) || [];
  const byId = new Map((songs || []).map((s) => [s && s.id, s]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

// The full linked view for a session: whether it's a Main Service, plus its live
// sermon + ordered song set. The conference render reads this; the data is never
// copied into conference state.
export function linkedServiceView(session, sermons, songs) {
  return {
    isMain: isMainService(session),
    sermon: resolveServiceSermon(session, sermons),
    songs: resolveServiceSongs(session, songs),
  };
}

// Toggle a song id in/out of a session's ordered songIds set (UI helper for the
// music-set picker). Adds to the end, preserving organizer order.
export function toggleSongId(songIds, id) {
  const ids = songIds || [];
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
