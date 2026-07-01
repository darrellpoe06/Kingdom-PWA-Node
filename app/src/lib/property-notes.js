// =============================================================================
// property-notes.js — the reusable per-unit NOTE primitive (pure logic)
// =============================================================================
// Darrell 2026-07-01: "I can't add notes per unit right now." A note must
// attach to a SPECIFIC door and persist. This is the landlord's OWN record
// (PROPERTY MEMORY, kept across tenant turnover) — distinct from tenant_notices
// (which the tenant reads). The DB half is property_notes (migration 0062,
// instance-scoped, never tenant-visible); the persistence adapter is in
// relationships-sync.js; the display reuses the app-wide RecordsLog primitive.
// This file is the pure rules: the note shape, validation, and the builder.
//
// Reusable by design: a note keys off (rental_ref) — any door/unit/entity id —
// so the SAME primitive gives every unit its notes with no per-surface rebuild.
//
// PURE: no I/O, no React, no Supabase. `clock` is an injected ISO string
// (no Date.now()) so it stays deterministic + unit-testable.
// =============================================================================

export const NOTE_KINDS = Object.freeze([
  'general',      // anything
  'maintenance',  // repair / condition observation
  'tenant',       // about the tenant / occupancy
  'financial',    // rent / deposit / cost
  'inspection',   // walkthrough / condition of record
  'follow-up',    // a thing to come back to
]);

const clean = (s, cap) => String(s ?? '').trim().slice(0, cap);

// Build a note row ready to persist against a specific unit door. Throws on the
// two things that make a note useless: no target door, or an empty body.
export function buildPropertyNote(form = {}, clock) {
  const rentalRef = clean(form.rentalRef, 200);
  if (!rentalRef) throw new Error('a note must attach to a specific unit');
  const body = clean(form.body, 8000);
  if (!body) throw new Error('a note needs text');
  const kind = NOTE_KINDS.includes(form.kind) ? form.kind : 'general';
  return {
    rental_ref: rentalRef,
    unit_label: clean(form.unitLabel, 120) || null,
    body,
    kind,
    pinned: !!form.pinned,
    // The date the note is ABOUT (drives the RecordsLog date axis); defaults to
    // the injected clock's date when the caller doesn't name one.
    note_date: clean(form.noteDate, 10) || (clock ? String(clock).slice(0, 10) : null),
  };
}

// The date a RecordsLog row sorts on: the note's own note_date, else its
// created_at. Kept here so the display accessor has one source of truth.
export const noteDateOf = (n) => (n && (n.note_date || (n.created_at ? String(n.created_at).slice(0, 10) : ''))) || '';

// Newest-first, pinned notes floated to the top within their day — a small,
// pure sort the surface can apply before handing rows to RecordsLog.
export function sortNotes(notes = []) {
  return [...(notes || [])].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return String(noteDateOf(b)).localeCompare(String(noteDateOf(a)));
  });
}

// Only this unit's notes (defense in depth over the RLS + the query filter).
export const notesForUnit = (notes = [], rentalRef) =>
  (notes || []).filter((n) => n && n.rental_ref === rentalRef);
