// =============================================================================
// properties/coliving — the dual operating model, and the gate that guards it
// =============================================================================
// SOURCE (read before writing, DR-0076 §8): the spec Darrell commissioned —
// docs/99-session-notes/2026-06-09-poe-properties-dual-model-coliving-
// supportive-housing-spec.md, DR-026 … DR-030. Nothing here is invented; the
// room price, the occupancy range, the privacy line and the checklist items are
// that document's, carried into code so they bind instead of being remembered.
//
// TWO MODES, PER PROPERTY (DR-026): whole-unit lease (today's model) or
// rent-by-the-room co-living. The switch is per door, never global — different
// doors run different models at the same time.
//
// ── THE GATE IS THE POINT (DR-029, BINDING) ─────────────────────────────────
// "A property MUST NOT switch to by-room mode until a per-property legal /
// zoning / licensing checklist is cleared and recorded." Rent-by-the-room is
// not single-family-with-more-leases: it frequently triggers a different legal
// regime that varies by jurisdiction and even by parcel. So the switch is a
// FUNCTION THAT REFUSES, not a toggle with a warning next to it — and clearing
// an item records WHO cleared it and WHEN, because the module records *that*
// counsel cleared it, never the legal determination itself.
//
// ── THE PRIVACY LINE (DR-028, BINDING) ──────────────────────────────────────
// Smart locks and access logs live AT THE DOOR. No surveillance inside rooms —
// ever. `assertNoRoomSurveillance()` exists so that line is enforceable by a
// test rather than trusted to whoever edits this next.
//
// PURE: no I/O, no React.
// =============================================================================

export const OPERATING_MODES = Object.freeze(['whole-unit', 'by-room']);

/** The room economics the spec fixes (DR-027). Utilities included. */
export const ROOM_DEFAULTS = Object.freeze({
  monthlyRent: 1000,
  utilitiesIncluded: true,
  occupancyMin: 1,
  occupancyMax: 2,
  waitlist: true,
  furnishing: 'single bed, small fridge, smart lock',
  shared: 'living room and bathrooms, under explicit house rules',
});

/**
 * The per-property checklist (DR-029). Every item is a legal question a human
 * must answer for THIS parcel — the module records the clearance, not the
 * determination. `routesTo` carries the spec's routing (DR-010 / DR-005).
 */
export const COMPLIANCE_CHECKLIST = Object.freeze([
  Object.freeze({ id: 'zoning', label: 'Zoning', question: 'Is rooming-house / co-living use permitted at this parcel?', routesTo: 'real-estate counsel' }),
  Object.freeze({ id: 'licensing', label: 'Boarding / rooming-house licensing', question: 'Does the municipality require a license or registration to rent rooms separately?', routesTo: 'real-estate counsel' }),
  Object.freeze({ id: 'occupancy', label: 'Occupancy caps', question: 'What is the local limit on unrelated occupants per dwelling? It constrains the room count and the per-room setting.', routesTo: 'real-estate counsel' }),
  Object.freeze({ id: 'fire-code', label: 'Building / fire code', question: 'Egress, smoke and CO detectors per room, hallway and exit standards for converted rooming use.', routesTo: 'real-estate counsel' }),
  Object.freeze({ id: 'insurance', label: 'Insurance', question: 'Does the landlord policy cover room-rental and multiple unrelated tenancies, or is a different policy required?', routesTo: 'the insurer' }),
  Object.freeze({ id: 'per-room-law', label: 'Per-room lease / tenant law', question: 'Per-room tenancy, deposits, notice and eviction rules can differ from a whole-unit lease.', routesTo: 'real-estate counsel' }),
]);

export const CHECKLIST_IDS = Object.freeze(COMPLIANCE_CHECKLIST.map((c) => c.id));

/** One cleared item, as it is recorded: who, when — never the determination. */
export function clearanceRecord({ itemId, clearedBy, clearedAt, reference } = {}) {
  if (!CHECKLIST_IDS.includes(itemId)) return { ok: false, reason: 'unknown-item' };
  if (!String(clearedBy || '').trim()) return { ok: false, reason: 'no-one-named' };
  if (!clearedAt) return { ok: false, reason: 'no-date' };
  return {
    ok: true,
    record: {
      item_id: itemId,
      cleared_by: String(clearedBy).trim(),   // the person or firm who cleared it
      cleared_at: clearedAt,
      reference: String(reference || '').trim() || null,   // their letter, permit number, policy
    },
  };
}

/** What is still outstanding for this door. */
export function outstandingItems(clearances = []) {
  const done = new Set(clearances.filter((c) => c && c.item_id).map((c) => c.item_id));
  return COMPLIANCE_CHECKLIST.filter((c) => !done.has(c.id));
}

/**
 * THE GATE. Refuses the switch to by-room until every checklist item is cleared
 * and recorded. Returns { ok, reason, outstanding } — a caller that ignores the
 * reason still cannot get a mode out of it.
 */
export function canSwitchToByRoom(clearances = []) {
  const outstanding = outstandingItems(clearances);
  if (outstanding.length) {
    return {
      ok: false,
      reason: 'checklist-incomplete',
      outstanding: outstanding.map((c) => c.id),
      message: `Rent-by-the-room is a different legal regime for this parcel. ${outstanding.length} item${outstanding.length === 1 ? '' : 's'} still need a person to clear ${outstanding.length === 1 ? 'it' : 'them'}: ${outstanding.map((c) => c.label).join(', ')}.`,
    };
  }
  return { ok: true, reason: '', outstanding: [], message: '' };
}

/**
 * Set a door's operating mode. Whole-unit is always allowed (it is the safer
 * direction); by-room passes through the gate. There is no argument that
 * bypasses it — that is deliberate.
 */
export function setOperatingMode(mode, { clearances = [] } = {}) {
  if (!OPERATING_MODES.includes(mode)) return { ok: false, reason: 'unknown-mode' };
  if (mode === 'whole-unit') return { ok: true, mode, reason: '' };
  const gate = canSwitchToByRoom(clearances);
  if (!gate.ok) return { ok: false, reason: gate.reason, outstanding: gate.outstanding, message: gate.message };
  return { ok: true, mode, reason: '' };
}

/** Rooms as rentable sub-units (DR-027). Occupancy is bounded by the spec. */
export function buildRoom({ rentalRef, name, occupancy = 1, monthlyRent = ROOM_DEFAULTS.monthlyRent, smartLock = true } = {}) {
  const occ = Math.min(ROOM_DEFAULTS.occupancyMax, Math.max(ROOM_DEFAULTS.occupancyMin, Number(occupancy) || 1));
  return {
    rental_ref: rentalRef || null,
    name: String(name || '').trim(),
    occupancy: occ,
    monthly_rent: Number(monthlyRent) || ROOM_DEFAULTS.monthlyRent,
    utilities_included: ROOM_DEFAULTS.utilitiesIncluded,
    smart_lock: !!smartLock,
    // Housemates are a UNIT, reusing the existing group layer — never a new one.
    shared_spaces: ROOM_DEFAULTS.shared,
  };
}

/**
 * The privacy line, enforceable (DR-028). Locks and logs at the DOOR; nothing
 * that watches inside a room may be configured, at any level, ever.
 */
const SURVEILLANCE_TERMS = Object.freeze(['camera', 'cctv', 'webcam', 'microphone', 'mic_', 'listen', 'recording', 'motion_sensor', 'occupancy_sensor']);

export function assertNoRoomSurveillance(config = {}) {
  const flat = JSON.stringify(config).toLowerCase();
  const hit = SURVEILLANCE_TERMS.find((t) => flat.includes(t));
  if (hit) {
    return {
      ok: false, term: hit,
      message: `"${hit}" cannot be configured for a room. Smart locks and access logs live at the DOOR; there is no surveillance inside a room, ever (DR-028).`,
    };
  }
  return { ok: true, term: '', message: '' };
}

/** An access-log entry: the door, the person, the moment. Nothing more. */
export function accessLogEntry({ roomId, personId, action, at } = {}) {
  const verb = ['granted', 'revoked', 'entered'].includes(action) ? action : 'granted';
  return { room_id: roomId || null, person_id: personId || null, action: verb, at: at || null };
}

/**
 * Supportive housing (DR-030) — carried as a POSTURE with its wall named, not
 * as a feature that quietly grows clinical. Housing plus wraparound services is
 * in scope; clinical / SUD treatment is out, behind the TLC ISO-1 / HIPAA
 * boundary. The spec's default stands until Darrell says otherwise.
 */
export const SUPPORTIVE_HOUSING = Object.freeze({
  inScope: Object.freeze(['housing', 'assessment', 'case-management', 'skill-upgrade', 'cohort-team', '1099-work', 'outcome-reporting']),
  outOfScope: Object.freeze(['clinical-treatment', 'sud-treatment', 'diagnosis', 'medication', 'therapy-notes']),
  wall: 'TLC ISO-1 / HIPAA boundary — clinical scope lives behind it and never in the property module.',
  status: 'housing-only, clinical-walled (the spec’s default; changing it is the Governor’s call)',
});

export function supportiveHousingAllows(activity = '') {
  const a = String(activity || '').toLowerCase().replace(/\s+/g, '-');
  if (SUPPORTIVE_HOUSING.outOfScope.some((o) => a.includes(o.split('-')[0]))) {
    return { ok: false, message: `"${activity}" is clinical scope. It lives behind the ${SUPPORTIVE_HOUSING.wall}` };
  }
  return { ok: SUPPORTIVE_HOUSING.inScope.some((i) => a.includes(i.split('-')[0])), message: '' };
}
