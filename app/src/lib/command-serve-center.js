// =============================================================================
// command-serve-center.js — the C2S (Command, Control & Serve Center) model
// =============================================================================
// "Building and solidifying the app while working inside the command and control
//  and serve center module to build all other modules and see." (Darrell,
//  2026-06-17.)
//
// This is the pure, testable spine of the C2S seat: the single cockpit inside the
// PoeTech app from which the steward DIRECTS the build (command), MANAGES the work
// (control), FRAMES access as servant-leadership (serve), and OBSERVES real system
// state (see). It owns no UI and fetches nothing — it declares the faculty model,
// resolves who is seated, and reports — honestly — which faculties are LIVE on
// main today versus still WIRING in an in-flight lane.
//
// Servant-king ontology (the "serve" is deliberate): one commands in order to
// SERVE and steward, never to dominate. The seat exists to make the steward more
// able to lift the family and the community — not to extract from them.
//
// VERIFICATION DOCTRINE (DR-0076): every status below is the REAL state of a real
// surface on main, asserted in code and traceable to a named component — not a
// painted number. A faculty that is not fully wired says so; it is never shown as
// green when it is not. THREE BRAKES (CLAUDE.md, post-2026-06-06): this module is
// the READ/DECIDE/HAND-OFF loop only. Autonomous execution stays behind the Cage
// (budget cap + concurrency lock + kill-switch, owned by the wake-orchestrator
// engine). "Go" is always the steward's; the center never goes off-leash.

// ---------------------------------------------------------------------------
// The four faculties of the seat. Order is the reading order in the UI:
// SEE first (you cannot command what you cannot see), then COMMAND, CONTROL,
// and SERVE as the framing the other three operate within.
// ---------------------------------------------------------------------------
export const FACULTIES = [
  {
    key: 'see',
    label: 'See',
    glyph: '👁',
    tagline: 'Clear vision — before, during, and after the build.',
    // Real surfaces composed under this faculty (all live on main today).
    surfaces: ['OpsBoard', 'QualityProof', 'KpiLegend'],
  },
  {
    key: 'command',
    label: 'Command',
    glyph: '⚡',
    tagline: 'Direct what gets built — clicks become API calls, held behind the Cage.',
    surfaces: ['WakeOrchestrator', 'ConflictLoop'],
  },
  {
    key: 'control',
    label: 'Control',
    glyph: '🎛',
    tagline: 'Manage the work — projects, priorities, discussions, decisions.',
    surfaces: ['ProjectsWrapper'],
  },
  {
    key: 'serve',
    label: 'Serve',
    glyph: '🕊',
    tagline: 'Command in order to serve — the steward at the helm, for the family and the community.',
    surfaces: [],
  },
];

export const FACULTY_KEYS = FACULTIES.map((f) => f.key);

// ---------------------------------------------------------------------------
// seatOf — who is seated, and what they steward.
// Resolves the displayed steward from the REAL signed-in identity. No invented
// king/governor hierarchy beyond what the app already enforces: the gate is
// `isFamily` (isFamilyEmail), which is the Governor/owner scope. A persona key
// (from personaOf) names the seated steward; absent that, the seat is shown as
// the Governor seat without a personal name. Outside that scope, no one is
// seated — the center is not theirs to command (no-leak).
// ---------------------------------------------------------------------------
export function seatOf({ email = null, persona = null, isFamily = false } = {}) {
  if (!isFamily) {
    return {
      seated: false,
      name: null,
      roleLabel: null,
      charge: null,
    };
  }
  const name = persona
    ? persona.charAt(0).toUpperCase() + persona.slice(1)
    : null;
  return {
    seated: true,
    name,
    email: email || null,
    roleLabel: 'Steward at the helm',
    // The charge is the standing test for every action taken from this seat
    // (GOVERNANCE-EXECUTION-ADVISORY): does this lift the family AND the
    // community, and create rather than extract.
    charge: 'Lift the family and the community — create, never extract.',
  };
}

// ---------------------------------------------------------------------------
// centerReadiness — honest per-faculty status (Verification Doctrine).
// 'live'    = every surface under the faculty is real on main today.
// 'partial' = the faculty has a live surface AND a piece still wiring up.
// 'wiring'  = nothing of the faculty is on main yet.
// Each carries a `note` that names the real situation. These are asserted from
// known repo state at authoring time; a test pins them so a drift (e.g. the
// CONTROL cockpit landing) forces an honest update here rather than silently
// going stale.
// ---------------------------------------------------------------------------
export function centerReadiness() {
  return {
    see: {
      status: 'live',
      note: 'Operations, Quality / Proof, the KPI key, and the conflict-rate loop are live on main — real state, no painted numbers.',
    },
    command: {
      // The CONTROL surface (arm / disarm / kill, budget, concurrency, handoff
      // log) is live on main; the ENGINE it drives ships INERT behind the Cage.
      status: 'partial',
      note: 'The orchestrator cockpit (arm / disarm / kill, budget, concurrency) is live on main and ships INERT — kill-switch engaged, feed not deployed. Arming stays a deliberate, attended act. The deep autonomous self-build stays staged and braked.',
    },
    control: {
      // The base Projects/Build surface is live; the priorities + discussions
      // cockpit is in-flight in the projects-mgmt lane (not on main yet).
      status: 'partial',
      note: 'Projects and the Build board are live on main. The priorities + discussions cockpit is wiring up in the projects-management lane; this seat links to the live surface today and composes the cockpit once that lane lands (sequenced, not collided).',
    },
    serve: {
      // The framing + role-scoping IS the seat; it is live. Community-serving
      // surfaces beyond the seat are a forward build.
      status: 'live',
      note: 'The seat itself is the serve faculty — role-scoped access, the steward at the helm, command-in-order-to-serve. Outward community-serving surfaces build from here.',
    },
  };
}

// ---------------------------------------------------------------------------
// The self-hosting loop, stated as discrete stages so the BRAKE is structural,
// not a comment. READ and DECIDE happen in the seat; HAND-OFF crosses into the
// Cage, where the three brakes live. EXECUTE is never autonomous from here.
// ---------------------------------------------------------------------------
export const SELF_HOSTING_LOOP = [
  { key: 'read',    label: 'Read',    what: 'Observe real system state — Operations, Quality, conflicts, KPIs.', inSeat: true },
  { key: 'decide',  label: 'Decide',  what: 'The steward sets what gets built and at what priority.', inSeat: true },
  { key: 'handoff', label: 'Hand off', what: 'Pass the directive to the braked orchestrator. Budget cap, concurrency lock, kill-switch all apply.', inSeat: false },
  { key: 'verify',  label: 'Verify',  what: 'Real results return to the See faculty — evidence, not claims.', inSeat: true },
];

// Whether the center is allowed to act on its own. Always false in this rung:
// the seat reads, decides, and hands off; the Cage executes only when armed,
// attended. Exposed as a function so the brake is asserted, not assumed.
export function autonomousExecutionEnabled() {
  return false;
}

// A one-line, honest readout for the brake banner.
export function brakeStatusLine() {
  return autonomousExecutionEnabled()
    ? 'Autonomous execution ARMED — attended.'
    : 'Staged + braked — the center reads, decides, and hands off. "Go" is the steward\'s. Autonomous execution stays behind the Cage (budget · concurrency lock · kill-switch).';
}
