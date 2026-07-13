// =============================================================================
// study-guides — the homeschool STUDY-GUIDE + credential-path layer, Ari-guided
// =============================================================================
// Darrell 2026-07-12 (spoken build input): put each state's homeschool path in
// the app as a dropdown, and pool subject courses — core academics, Spanish, and
// A.I./tech — into the $39.99 digital tier, for ANY age, all taught by Ari. The
// goal a family names is "get your high-school diploma inside the app."
//
// Darrell sharpened the model the same day: "We just guide the people; they go
// pass the test — just the study guide and Ari guide." That is the HONEST design
// this file encodes, and it resolves the one real bright line:
//
//   PoeTech is NOT an accredited school and does NOT issue a diploma. It is the
//   STUDY GUIDE + Ari GUIDE that prepares a learner to meet their state's
//   homeschool requirement and to PASS THE OFFICIAL TEST. The credential comes
//   from the recognized source, not from us.
//
// The load-bearing facts (verified, DR-0076 / DR-0100 — state plainly):
//   • A PARENT-ISSUED homeschool diploma + transcript is legal in ALL 50 states
//     and accepted by most colleges and employers. (HSLDA; homeschool.com.)
//   • NO U.S. state requires a homeschool curriculum, program, or diploma to be
//     accredited. "Accredited" means enrolled in an accredited school/online
//     program that issues the record — a separate thing from a parent homeschool.
//   • A state-recognized EQUIVALENCY (for selective colleges, scholarships, some
//     employers/military, or a state that wants it) is the GED or HiSET — a test.
//   So: we GUIDE (curriculum + Ari) → they PASS the test / meet the requirement
//   → the credential is issued by the parent (diploma+transcript) or the test.
//
// NOT LEGAL ADVICE. Homeschool law varies by state and changes; every state entry
// links the authoritative source to verify CURRENT law. We never present a per-
// state rule as settled fact — the tier is a general categorization to verify.
//
// PURE + deterministic (no localStorage / Date.now here). Persistence + Ari-
// tutoring ride the existing learn engine (learn-framework.js, class-tutor.js).
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');

export const STUDY_GUIDES_DISCLAIMER =
  'A study guide, not legal advice. PoeTech guides you to meet your state’s homeschool requirement and pass the official test — it is not an accredited school and does not issue a diploma. Homeschool law varies by state and changes; verify current law with the linked source before you rely on it.';

export const CREDENTIAL_SOURCES =
  'Homeschool-law categories: Home School Legal Defense Association (hslda.org/legal). Diploma/accreditation facts: HSLDA and homeschool.com. GED: GED Testing Service. HiSET: ETS HiSET.';

// ---------------------------------------------------------------------------
// CREDENTIAL_PATHS — the three real, verified routes to a high-school credential.
// These are universally true across all 50 states (the safe, load-bearing core).
// ---------------------------------------------------------------------------
export const CREDENTIAL_PATHS = [
  {
    id: 'parent-diploma',
    label: 'Parent-issued diploma + transcript',
    legalWhere: 'All 50 states',
    summary: 'As the legal administrator of the homeschool, the parent issues the diploma once your state’s requirements are met. Backed by a full transcript, it is accepted by most colleges and employers.',
    weGuide: 'We build the state-aligned course plan, track completion, and generate the transcript + diploma document the parent signs.',
    strength: 'Community colleges and most regional universities accept it without question.',
    watch: 'A few selective universities and some scholarships want third-party-verified records; for those, add GED/HiSET or an accredited umbrella. An unaccredited issuer can also fail some background-check verifications.',
  },
  {
    id: 'ged',
    label: 'GED',
    legalWhere: 'Nationally recognized',
    summary: 'A four-subject test (Reasoning through Language Arts, Mathematical Reasoning, Science, Social Studies). Passing earns a state-issued high-school equivalency credential.',
    weGuide: 'Ari-guided GED prep by subject, with practice and readiness checks, until you test ready.',
    strength: 'A recognized, third-party credential — useful for selective colleges, scholarships, employers, and the military.',
    watch: 'Minimum-age and residency rules vary by state; check your state’s GED page.',
  },
  {
    id: 'hiset',
    label: 'HiSET',
    legalWhere: 'Accepted in many states',
    summary: 'An alternative high-school equivalency test (ETS) — five subtests. Where offered, it earns the same kind of state equivalency credential as the GED.',
    weGuide: 'Ari-guided HiSET prep, the same shape as GED prep, matched to the subtests.',
    strength: 'A second recognized route where a state or testing center favors HiSET.',
    watch: 'Not offered in every state; confirm availability locally.',
  },
];
export const credentialPath = (id) => CREDENTIAL_PATHS.find((p) => p.id === asStr(id)) || null;

// ---------------------------------------------------------------------------
// Regulation tiers — HSLDA's four public categories, encoded as EDUCATION about
// what a state may ask. The per-state tier below is a general categorization to
// VERIFY, never asserted as current law (each state links the source).
// ---------------------------------------------------------------------------
export const REGULATION_TIERS = {
  'no-notice': { label: 'No notice', order: 0, blurb: 'No notification to any government agency required to begin.' },
  low: { label: 'Low', order: 1, blurb: 'Notify your local school district; little else.' },
  moderate: { label: 'Moderate', order: 2, blurb: 'Notify, plus test scores and/or a professional evaluation of progress.' },
  high: { label: 'High', order: 3, blurb: 'Notify + testing/evaluation, plus extra requirements (e.g. curriculum approval or home visits).' },
};
export const regulationTier = (id) => REGULATION_TIERS[asStr(id)] || null;

// ---------------------------------------------------------------------------
// US_JURISDICTIONS — the state dropdown (50 states + DC). `tier` is HSLDA's
// general categorization (VERIFY — laws change); `source` is the authoritative
// link to confirm current law for that state. We deep-link HSLDA's per-state
// path where stable, falling back to the legal hub.
// ---------------------------------------------------------------------------
const hslda = (slug) => `https://hslda.org/legal/${slug}`;
function jur(id, name, tier, slug) {
  return { id, name, tier, source: hslda(slug || name.toLowerCase().replace(/\s+/g, '-')) };
}
export const US_JURISDICTIONS = [
  jur('AL', 'Alabama', 'low'), jur('AK', 'Alaska', 'no-notice'), jur('AZ', 'Arizona', 'low'),
  jur('AR', 'Arkansas', 'moderate'), jur('CA', 'California', 'low'), jur('CO', 'Colorado', 'moderate'),
  jur('CT', 'Connecticut', 'no-notice'), jur('DE', 'Delaware', 'low'), jur('DC', 'District of Columbia', 'moderate', 'district-of-columbia'),
  jur('FL', 'Florida', 'moderate'), jur('GA', 'Georgia', 'moderate'), jur('HI', 'Hawaii', 'moderate'),
  jur('ID', 'Idaho', 'no-notice'), jur('IL', 'Illinois', 'no-notice'), jur('IN', 'Indiana', 'no-notice'),
  jur('IA', 'Iowa', 'low'), jur('KS', 'Kansas', 'low'), jur('KY', 'Kentucky', 'low'),
  jur('LA', 'Louisiana', 'moderate'), jur('ME', 'Maine', 'moderate'), jur('MD', 'Maryland', 'moderate'),
  jur('MA', 'Massachusetts', 'high'), jur('MI', 'Michigan', 'no-notice'), jur('MN', 'Minnesota', 'moderate'),
  jur('MS', 'Mississippi', 'low'), jur('MO', 'Missouri', 'no-notice'), jur('MT', 'Montana', 'low'),
  jur('NE', 'Nebraska', 'low'), jur('NV', 'Nevada', 'low'), jur('NH', 'New Hampshire', 'low'),
  jur('NJ', 'New Jersey', 'no-notice'), jur('NM', 'New Mexico', 'low'), jur('NY', 'New York', 'high'),
  jur('NC', 'North Carolina', 'moderate'), jur('ND', 'North Dakota', 'high'), jur('OH', 'Ohio', 'moderate'),
  jur('OK', 'Oklahoma', 'no-notice'), jur('OR', 'Oregon', 'moderate'), jur('PA', 'Pennsylvania', 'high'),
  jur('RI', 'Rhode Island', 'high'), jur('SC', 'South Carolina', 'moderate'), jur('SD', 'South Dakota', 'low'),
  jur('TN', 'Tennessee', 'moderate'), jur('TX', 'Texas', 'no-notice'), jur('UT', 'Utah', 'low'),
  jur('VT', 'Vermont', 'high'), jur('VA', 'Virginia', 'moderate'), jur('WA', 'Washington', 'moderate'),
  jur('WV', 'West Virginia', 'moderate'), jur('WI', 'Wisconsin', 'low'), jur('WY', 'Wyoming', 'low'),
];
export const jurisdiction = (id) => US_JURISDICTIONS.find((s) => s.id === asStr(id).toUpperCase()) || null;

// The guidance for a chosen state: its tier (to verify) + the credential paths
// (universally true) + the source to confirm. Pure — the surface renders it.
export function stateGuide(stateId) {
  const s = jurisdiction(stateId);
  if (!s) return null;
  const tier = regulationTier(s.tier);
  return {
    id: s.id,
    name: s.name,
    tier: s.tier,
    tierLabel: tier ? tier.label : 'Verify',
    tierBlurb: tier ? tier.blurb : '',
    source: s.source,
    // Every state can reach a credential the same three ways — that part is settled.
    credentialPaths: CREDENTIAL_PATHS,
    verifyNote: `${s.name}’s exact rules can change — confirm current requirements at the linked HSLDA page before you rely on this.`,
  };
}

// ---------------------------------------------------------------------------
// SUBJECT_GUIDES — the Ari-guided study-guide pool (the $39.99 digital tier).
// Any age. Each guide is authored objectives + the grounding Ari teaches from;
// the deep lesson content grows over time (honestly marked), sitting on the
// existing learn-framework so a guide renders + tutors like any other course.
// `credential` links a guide to what it helps satisfy (core academics → diploma
// transcript; ged/hiset → the equivalency test).
// ---------------------------------------------------------------------------
export const GUIDE_STATUS = { seed: 'Starter guide — Ari-ready; deeper lessons growing.', building: 'In authoring.' };

function guide(id, subject, area, credential, objectives, ariGrounding, opts = {}) {
  return {
    id, subject, area, credential,
    ages: opts.ages || 'any',
    objectives,          // what a learner can DO after — the study-guide backbone
    ariGrounding,        // the frame Ari teaches from (passed to class-tutor)
    status: opts.status || 'seed',
  };
}

export const SUBJECT_GUIDES = [
  // ── Core academics — the transcript subjects a diploma is built from ──────
  guide('math-core', 'Mathematics', 'core', 'parent-diploma',
    ['Number sense & operations', 'Pre-algebra → Algebra I & II', 'Geometry', 'Data & probability', 'Applied problem-solving'],
    'Teach math by mastery, one concept at a time, with worked examples and checks for understanding; adapt depth to the learner’s level.'),
  guide('ela-core', 'English / Language Arts', 'core', 'parent-diploma',
    ['Reading comprehension', 'Grammar & mechanics', 'Composition & the essay', 'Vocabulary', 'Literature & analysis'],
    'Build reading and writing through short cycles: read, discuss, write, revise; keep feedback concrete and encouraging.'),
  guide('science-core', 'Science', 'core', 'parent-diploma',
    ['Scientific method & inquiry', 'Life science', 'Physical science', 'Earth & space', 'Lab reasoning'],
    'Teach science as inquiry — a question, a testable idea, evidence — grounding wonder in Yahweh as the Author of an ordered world.'),
  guide('social-core', 'Social Studies & History', 'core', 'parent-diploma',
    ['U.S. history & government', 'World history', 'Geography', 'Civics', 'Economics basics'],
    'Teach history with primary sources and a truthful, non-both-sides-for-ratings posture; name established fact plainly.'),
  // ── Language ─────────────────────────────────────────────────────────────
  guide('spanish', 'Spanish', 'language', 'parent-diploma',
    ['Greetings & everyday phrases', 'Present-tense verbs', 'Vocabulary by theme', 'Reading & simple conversation', 'Past & future tenses'],
    'Teach Spanish conversationally — lots of speaking and listening, small daily reps, gentle correction; scale from novice to intermediate.'),
  // ── A.I. / technology — the cutting-edge pool ────────────────────────────
  guide('ai-foundations', 'A.I. Foundations', 'tech', 'parent-diploma',
    ['What an LLM is and is not', 'Prompting well', 'Verifying A.I. output (never trust slop)', 'Building a simple A.I. tool', 'Using sovereign local models'],
    'Teach A.I. The Way — master the tool, don’t let it master you; verification is the discipline (DR-0076), build kings not slaves.'),
  guide('coding-intro', 'Intro to Coding', 'tech', 'parent-diploma',
    ['How programs run', 'Variables & logic', 'Functions', 'Build & ship a small app', 'Debugging & reading errors'],
    'Teach coding by building something real from lesson one; celebrate shipping; read errors as clues, not failures.'),
  // ── Test prep — the equivalency route ────────────────────────────────────
  guide('ged-prep', 'GED Prep', 'test-prep', 'ged',
    ['Reasoning through Language Arts', 'Mathematical Reasoning', 'Science', 'Social Studies', 'Timed practice & readiness'],
    'Coach toward the GED subtests — diagnose gaps, drill the tested skills, run timed practice until the learner tests ready.'),
  guide('hiset-prep', 'HiSET Prep', 'test-prep', 'hiset',
    ['Language Arts — Reading', 'Language Arts — Writing', 'Mathematics', 'Science', 'Social Studies'],
    'Same readiness coaching as GED, matched to the five HiSET subtests and the state’s testing format.'),
];
export const subjectGuide = (id) => SUBJECT_GUIDES.find((g) => g.id === asStr(id)) || null;

export const GUIDE_AREAS = [
  { id: 'core', label: 'Core academics' },
  { id: 'language', label: 'Language' },
  { id: 'tech', label: 'A.I. & technology' },
  { id: 'test-prep', label: 'Test prep (GED · HiSET)' },
];

export function guidesByArea(area) {
  return SUBJECT_GUIDES.filter((g) => g.area === asStr(area));
}

// A plain roll-up for the surface: how many guides in each area, and the whole
// pool count (real, derived — nothing painted).
export function guidePoolSummary() {
  const byArea = {};
  for (const g of SUBJECT_GUIDES) byArea[g.area] = (byArea[g.area] || 0) + 1;
  return { total: SUBJECT_GUIDES.length, byArea };
}
