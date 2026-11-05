// =============================================================================
// journeys — THE JOURNEY REGISTRY: every family of surfaces and every module
// names the end-to-end walk that proves a person can use it (DR-1330 D2)
// =============================================================================
// Darrell, 2026-11-05: "various user flows debugging tests so users don't have
// basic bugs... automated." The sweep (D1, scripts/e2e/surface-sweep.mjs)
// proves every surface OPENS. A journey proves a person can DO the thing the
// surface is for — tap through to a lesson, type a note, walk the money tabs,
// book a door — on the built app in a real browser.
//
// ONE REGISTRY, TWO RUNNERS, ONE GUARD:
//   runner 'app-journeys'   scripts/e2e/app-journeys.mjs — the built dist, no
//                           database (a trusted host, signed out). Fast; on
//                           every push in the surface-sweep leg.
//   runner 'door-journeys'  scripts/e2e/door-journeys.mjs — the real schema on
//                           PostgreSQL + PostgREST (DR-0934). Its own leg.
//   guard  scripts/journey-coverage-guard.mjs fails the build when a nav family
//          of app/src/surfaces.js (top · church · books · create) or a module
//          under app/src/modules/ has NO journey here — and when a deferred
//          entry's re-review date has passed (DR-0075: a parked item carries a
//          date, and the date fires).
//
// A journey is REGISTERED HERE from the commit that adds a family or a module
// (HOLD-THE-HAND: a new workflow joins at birth); the guard is what makes that
// a rule rather than a hope. `status: 'deferred'` is lawful only with a `why`
// and a `reReview` date; the guard refuses a bare deferral.
// =============================================================================

export const FAMILIES = ['top', 'church', 'books', 'create'];

export const JOURNEYS = Object.freeze([
  // ── the built app, no database (scripts/e2e/app-journeys.mjs) ────────────
  {
    id: 'lesson-link-lands',
    runner: 'app-journeys',
    family: 'church',
    status: 'active',
    what: 'a shared lesson link opens ON the lesson, never on the Worship tab (the 2026-08-13 miss, now on every push)',
  },
  {
    id: 'learn-by-taps',
    runner: 'app-journeys',
    family: 'church',
    status: 'active',
    what: 'from the Church door a reader taps Learn, taps a course, taps its first lesson, and the lesson opens',
  },
  {
    id: 'top-tabs-by-taps',
    runner: 'app-journeys',
    family: 'top',
    status: 'active',
    what: 'the dock tabs each open their own surface when tapped, and the dock says which is current',
  },
  { id: 'money-tabs-by-taps', runner: 'app-journeys', family: 'books', status: 'active', what: 'the money sections each open when tapped from the dock' },
  {
    id: 'create-takes-words',
    runner: 'app-journeys',
    family: 'create',
    status: 'active',
    what: 'the Create station accepts typed words in the one-voice input and arms Send',
  },
  { id: 'feedback-sheet-opens', runner: 'app-journeys', family: 'top', status: 'active', what: "the dock's Feedback control opens a sheet that takes words" },

  // ── the real schema (scripts/e2e/door-journeys.mjs, DR-0934) ─────────────
  {
    id: 'door-journeys',
    runner: 'door-journeys',
    family: 'top',
    module: 'properties',
    status: 'active',
    what: 'a stranger books two nights, the family confirms and records money, the next guest finds the nights dark, pictures and the public wall (A1..W1, L1)',
  },

  // ── deferred, with the date that fires (DR-0075) ─────────────────────────
  {
    id: 'office-assistant-answers',
    runner: 'app-journeys',
    family: 'top',
    module: 'office-assistant',
    status: 'deferred',
    why: 'the TLC Assistant mounts only for a family or business-tier sign-in; the dist-only runner walks signed out, and the signed-in stand-in (a minted JWT, as door-journeys does) is the next increment of the app runner',
    reReview: '2026-11-19',
  },
]);

export const RUNNERS = Object.freeze(['app-journeys', 'door-journeys']);
