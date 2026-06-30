// =============================================================================
// tlc-training-tracks — the AUDIENCES/TRACKS the one training backbone serves, with
// GROUNDED Illinois / CSWE hour requirements mapped across a 24-month minimum
// =============================================================================
// Declared by Darrell 2026-06-29. ONE backbone (the course library + certificate
// catalog + supervised-hours ledger) serves MULTIPLE audiences, each on its own TRACK
// with its own requirements:
//
//   1. MSW students DURING program — field/practicum hours (CSWE field standard).
//   2. NEW GRADS — post-MSW supervised clinical hours toward the Illinois LCSW
//      (IL: supervised clinical experience over a minimum of 2 years = 24 months).
//   3. LICENSED Illinois therapists — continuing education (lib/ceu-tracker.js).
//   4. 1099 CONTRACTORS — onboarding + training + certificates + hours (the existing
//      "TLC Contractor Onboarding — Certificate" becomes one track here).
//
// Build once, serve all. Each track maps to its own requirement; the course library
// supplies the TRAINING/didactic hours, while client-facing FIELD and SUPERVISED
// CLINICAL hours are logged in the supervised-hours ledger (lib/practice-academy.js).
// Hours are hours — logged honestly, no worker-classification or compliance moralizing.
//
// GROUNDED, NOT GUESSED (DR-0076 + placeholder-text-not-fact): the figures below come
// from the cited CSWE field-education standard and the Illinois Clinical Social Work &
// Social Work Practice Act / IDFPR. Each requirement is flagged `confirmed: false`
// until Christina (LCSW, licensed in IL) ratifies the exact current specifics, and
// open items carry `smeConfirm`. No figure is invented; sources are attached.
//
// PURE: no Date.now()/Math.random(); callers pass values. Safe in Node + browser + tests.
// =============================================================================

// Citable sources for the figures below (so any number is traceable).
export const TRACK_SOURCES = {
  cswe: { label: 'CSWE EPAS — field education (signature pedagogy)', url: 'https://www.cswe.org/accreditation/standards/2022-epas/' },
  ilAct: { label: 'IL Clinical Social Work & Social Work Practice Act (225 ILCS 20)', url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=1431' },
  idfpr: { label: 'IDFPR — Social Work licensure (LSW/LCSW)', url: 'https://idfpr.illinois.gov/profs/socialwork.html' },
  idfprCe: { label: 'IDFPR Social Work CE (68 Ill. Adm. Code 1470.95)', url: 'https://www.ilga.gov/commission/jcar/admincode/068/068014700000950R.html' },
};

// The minimum Illinois supervised-experience window everything maps across.
export const IL_MIN_MONTHS = 24;

// ---------------------------------------------------------------------------
// THE TRACKS. `requirement.kind`:
//   'field'      — CSWE field/practicum hours (client-facing), during the MSW.
//   'supervised' — IL post-MSW supervised clinical hours toward LCSW.
//   'ce'         — post-license continuing education (renewal cycle).
//   'onboarding' — internal contractor onboarding + ongoing training.
// `curriculumRole`:
//   'complements' — the course library is didactic prep ALONGSIDE the client-facing
//                   hours that satisfy the requirement (the ledger logs those).
//   'supplies'    — the course library’s training hours directly serve the requirement.
// ---------------------------------------------------------------------------
export const TLC_TRAINING_TRACKS = [
  {
    key: 'msw-field',
    label: 'MSW student — field placement',
    audience: 'Current MSW students (during the program)',
    blurb: 'Field/practicum hours during the MSW, plus the curriculum as didactic preparation alongside placement.',
    curriculumRole: 'complements',
    requirement: {
      kind: 'field',
      hours: 900,
      perWeekTypical: null,
      months: IL_MIN_MONTHS,
      label: 'CSWE field education (MSW)',
      note: 'CSWE accreditation sets a minimum of 900 hours of field education for an MSW (a BSW field minimum is 400 hours). The exact hours a given program requires can be higher.',
      source: TRACK_SOURCES.cswe,
      confirmed: false,
      smeConfirm: 'Confirm the placement-site hours and any program-specific total with the student’s MSW program and Christina.',
    },
  },
  {
    key: 'lcsw-supervised',
    label: 'Post-MSW — supervised clinical toward IL LCSW',
    audience: 'New MSW graduates earning hours toward the Illinois LCSW',
    blurb: 'Supervised clinical experience over a minimum of two years (24 months) toward the Illinois LCSW, with the curriculum as ongoing clinical training.',
    curriculumRole: 'complements',
    requirement: {
      kind: 'supervised',
      hours: 3000,
      months: IL_MIN_MONTHS,
      label: 'IL LCSW supervised clinical experience',
      note: 'Illinois requires supervised clinical professional experience completed over a minimum of two years (24 months) under a qualified supervisor toward the LCSW. The widely-referenced figure is 3,000 hours.',
      source: TRACK_SOURCES.ilAct,
      confirmed: false,
      smeConfirm: 'Confirm the exact current hour count, the face-to-face supervision-hour minimum, and supervisor qualifications against the IL Act / IDFPR with Christina (LCSW).',
    },
  },
  {
    key: 'licensed-ce',
    label: 'Licensed IL therapist — continuing education',
    audience: 'Licensed Illinois LSW / LCSW clinicians',
    blurb: 'Continuing learning toward license renewal; the curriculum supplies training hours (accreditation optional metadata).',
    curriculumRole: 'supplies',
    requirement: {
      kind: 'ce',
      hours: 30,
      months: IL_MIN_MONTHS,
      label: 'IL CE per renewal cycle',
      note: 'Illinois requires 30 CE contact hours per 2-year renewal cycle (with mandated topics within it). Tracked in the CEU renewal tracker; the library’s training hours are learning toward this, accreditation optional.',
      source: TRACK_SOURCES.idfprCe,
      confirmed: false,
      smeConfirm: 'CEU specifics are tracked and SME-confirmed in lib/ceu-tracker.js (Christina ratifies).',
    },
  },
  {
    key: 'contractor',
    label: '1099 contractor — onboarding + training',
    audience: 'TLC 1099 contract clinicians',
    blurb: 'Onboarding plus ongoing training and certificates on the same backbone; the existing Contractor Onboarding certificate is this track’s entry point.',
    curriculumRole: 'supplies',
    requirement: {
      kind: 'onboarding',
      hours: null,
      months: IL_MIN_MONTHS,
      label: 'TLC contractor onboarding + ongoing training',
      note: 'An internal training track (not a state hour mandate): onboarding to TLC’s standards plus ongoing courses and certificates. Hours are logged as professional-development training hours.',
      source: null,
      confirmed: true,
      smeConfirm: null,
    },
  },
];

export function getTrack(key) {
  return TLC_TRAINING_TRACKS.find((t) => t.key === key) || null;
}

export function listTracks() {
  return TLC_TRAINING_TRACKS.map((t) => ({ key: t.key, label: t.label, audience: t.audience, kind: t.requirement.kind }));
}

// ---------------------------------------------------------------------------
// The 24-month structure for a track: how the requirement spreads across the window,
// and how the course library's training hours fit. Pure. `libraryHours` = total real
// training hours the library currently supplies; `hoursPerMonth` = the plan rate.
// Returns an HONEST structure — never claims didactic training satisfies a clinical
// requirement; it states the role.
// ---------------------------------------------------------------------------
export function trackHoursStructure(track, { libraryHours = 0, hoursPerMonth = 24 } = {}) {
  if (!track) return null;
  const req = track.requirement;
  const months = req.months || IL_MIN_MONTHS;
  const perMonth = req.hours ? Math.round((req.hours / months) * 10) / 10 : null;
  const trainingOverWindow = Math.round(hoursPerMonth * months);
  return {
    trackKey: track.key,
    requirementHours: req.hours,
    months,
    requirementPerMonth: perMonth,           // requirement hours / 24 (null for onboarding)
    curriculumRole: track.curriculumRole,    // 'complements' | 'supplies'
    trainingHoursPerMonth: hoursPerMonth,
    trainingOverWindow,                      // didactic hours the plan lays out over the window
    libraryHours,
    confirmed: !!req.confirmed,
    note: track.curriculumRole === 'supplies'
      ? `The library’s training hours count toward this track directly (${req.label}).`
      : `The library is didactic preparation ALONGSIDE the ${req.label.toLowerCase()}; the client-facing hours are logged in the supervised-hours ledger.`,
  };
}

export function tracksSummary({ libraryHours = 0, hoursPerMonth = 24 } = {}) {
  return TLC_TRAINING_TRACKS.map((t) => ({
    track: t,
    structure: trackHoursStructure(t, { libraryHours, hoursPerMonth }),
  }));
}

// True only when every track's requirement is SME-confirmed. Surfaced so an
// unratified figure is visible, not silently trusted.
export function allTracksConfirmed() {
  return TLC_TRAINING_TRACKS.every((t) => t.requirement.confirmed);
}

// ---------------------------------------------------------------------------
// BUSINESS POSITIONING — the UIUC student pipeline (captured as business-dev context;
// not a clinical requirement). Champaign-Urbana is home to UIUC, Illinois’s largest
// land-grant university, with a School of Social Work — a steady stream of BSW/MSW
// students needing field placements and, later, supervised hours toward the LCSW. TLC
// positions as their local training + SUPERVISION home; the curriculum + hours ledger
// is the service. Christiana Poe (Darrell’s daughter) enters UIUC’s School of Social
// Work on a BSW→MSW accelerated pathway in fall 2026 — both a CONNECTION embedded in
// the program TLC recruits from AND a future student who will need field + supervised
// hours herself. Recruitment target: MSW students (during-program field hours +
// post-MSW supervised hours toward the IL LCSW).
// ---------------------------------------------------------------------------
export const UIUC_PIPELINE = {
  market: 'Champaign-Urbana — home to the University of Illinois Urbana-Champaign, the state’s largest land-grant university, with a School of Social Work.',
  opportunity: 'A steady pipeline of BSW/MSW students needing field placements and supervised hours toward the Illinois LCSW. TLC positions as their local training + supervision home; the curriculum + hours ledger is the service.',
  recruitment: 'TLC recruits MSW students from UIUC for field placements and post-MSW supervised hours.',
  connection: {
    name: 'Christiana Poe',
    relationship: 'Darrell’s daughter; entering UIUC’s School of Social Work on a BSW→MSW accelerated pathway, fall 2026.',
    role: 'Both a connection embedded directly in the program TLC recruits from (knows the cohort) AND a future student who will need field + supervised hours herself.',
    note: 'Family connection handled respectfully — she is an adult beginning college.',
  },
  ties: 'Adopter / business systems, the relationships model, the SKOS experience-based marketplace, and the hours ledger.',
};
