// =============================================================================
// office-assistant/config — the OfficeConfig contract + normalizer
// =============================================================================
// The seam that makes the module reusable: everything office-specific is DATA
// here, so a new office (or a future PoeTech build) is a new config object, never
// a code fork. `defineOfficeConfig(partial)` fills safe defaults, builds the
// geographic-circle objects (deterministic ids — DR-0076, no Math.random), and
// freezes the result so the model/store/UI all read one stable shape.
//
// REQUIRED per office: id, brand, storageKey (unique — two offices must not share
// a persistence namespace), referralCategories, geoCircles. Everything else has a
// sensible default. See configs/_template.js for a copy-paste starting point and
// README.md for how to add an office.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const asNum = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

const DEFAULT_OUTCOMES = [
  { id: 'none', label: 'No response yet', open: true },
  { id: 'interested', label: 'Interested', good: true },
  { id: 'requested-info', label: 'Requested more information', good: true },
  { id: 'call-back', label: 'Call back', open: true },
  { id: 'not-interested', label: 'Not interested' },
];
const DEFAULT_WEEKLY_TARGETS = {
  contacts: { min: 75, max: 100 }, emails: { min: 50, max: 75 }, calls: { min: 25, max: 40 },
  posts: { min: 5, max: 7 }, reels: { min: 2, max: 2 }, flyers: { min: 1, max: 2 },
};
const DEFAULT_PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn'];
const DEFAULT_POST_STATUSES = ['idea', 'drafted', 'scheduled', 'posted'];

// Build the geo-circle objects from raw names OR pass-through pre-built ones.
// Deterministic id = `circle-<index>` (stable across loads).
function normalizeCircles(raw) {
  return asArr(raw).map((c, i) => (typeof c === 'string'
    ? { id: `circle-${i}`, name: c, order: i }
    : { id: asStr(c.id) || `circle-${i}`, name: asStr(c.name), order: asNum(c.order, i) }));
}

// Validate the non-negotiables. Returns { ok } or { ok:false, error }. A caller
// can gate on this (a config guard/test) so a broken office can't ship silently.
export function validateOfficeConfig(partial) {
  const p = partial || {};
  if (!asStr(p.id).trim()) return { ok: false, error: 'config.id is required (a short slug, e.g. "tlc").' };
  if (!asStr(p.brand).trim()) return { ok: false, error: 'config.brand is required (the office name).' };
  if (!asStr(p.storageKey).trim()) return { ok: false, error: 'config.storageKey is required and MUST be unique per office (no shared namespaces).' };
  if (asArr(p.referralCategories).length === 0) return { ok: false, error: 'config.referralCategories must have at least one category.' };
  if (asArr(p.geoCircles).length === 0) return { ok: false, error: 'config.geoCircles must have at least one area.' };
  return { ok: true };
}

export function defineOfficeConfig(partial = {}) {
  const p = partial || {};
  return Object.freeze({
    id: asStr(p.id) || 'office',
    brand: asStr(p.brand) || 'Office',
    brandTagline: asStr(p.brandTagline),
    serviceArea: asStr(p.serviceArea),
    // Persistence namespace — MUST be unique per office (validated above).
    storageKey: asStr(p.storageKey) || `poetech-office-${asStr(p.id) || 'office'}-v1`,
    noPhiNote: asStr(p.noPhiNote)
      || 'Referral sources only — organizations and office contacts, never clients or any protected health information.',
    referralCategories: asArr(p.referralCategories),
    geoCircles: normalizeCircles(p.geoCircles),
    outcomes: asArr(p.outcomes).length ? p.outcomes : DEFAULT_OUTCOMES,
    dailyRotation: p.dailyRotation && typeof p.dailyRotation === 'object' ? p.dailyRotation : {},
    dailyTargetContacts: asNum(p.dailyTargetContacts, 12),
    weeklyTargets: p.weeklyTargets && typeof p.weeklyTargets === 'object' ? p.weeklyTargets : DEFAULT_WEEKLY_TARGETS,
    networkGoal: p.networkGoal && typeof p.networkGoal === 'object' ? p.networkGoal : { low: 2500, high: 3000 },
    dayBlocks: asArr(p.dayBlocks),
    weeklyPlan: asArr(p.weeklyPlan),
    contentThemes: asArr(p.contentThemes),
    socialPlatforms: asArr(p.socialPlatforms).length ? p.socialPlatforms : DEFAULT_PLATFORMS,
    postStatuses: asArr(p.postStatuses).length ? p.postStatuses : DEFAULT_POST_STATUSES,
    emailTemplate: asStr(p.emailTemplate),
    callScript: asStr(p.callScript),
    ceoMeetingQuestions: asArr(p.ceoMeetingQuestions),
    ariAutomationPath: asArr(p.ariAutomationPath),
    ariAutomationNote: asStr(p.ariAutomationNote),
    outboundConstraints: asArr(p.outboundConstraints),
    seedOrgs: asArr(p.seedOrgs),
    seedPosts: asArr(p.seedPosts),
  });
}
