// =============================================================================
// family-roster — pure rules for the household roster (DR-0093)
// =============================================================================
// "I'll add my son and daughters so I can explain it to users." (Darrell,
// 2026-07-03.) The safe rails shipped in migrations 0055/0057 — the 'child'
// role RLS-walled out of financials, minor tiers with a GENERATED
// coppa_protected column no guardian can un-set, guardian-only writes — but no
// surface called them. This module is the pure half of that surface: persona
// slugging, provision validation, and row shaping, dependency-free so every
// rule is unit-tested (DR-0076). The IO half is lib/family-messaging-sync.js
// (loadFamilyRoster / provisionChild); the card is components/FamilyRoster.jsx.
//
// THE BRIGHT LINE this surface holds (DATA-AS-EMPOWERMENT, minor protections):
// adding a child NEVER touches the family email allowlist. isFamilyEmail is
// what unlocks the family financials + the imported bank/Gmail PII feed — a
// minor goes through provision_child_member (role 'child', walled by RLS),
// never through that flag. A guard test pins the roster surface to zero
// allowlist imports so the protection is structural, not discipline.
import { MINOR_TIERS } from './family-messaging.js';

export { MINOR_TIERS };

export const TIER_META = {
  under13: { label: 'Under 13', note: 'COPPA-protected (derived — cannot be un-set) · guardian approves outbound messages' },
  teen: { label: 'Teen', note: 'Minor — guardian-managed capabilities' },
  adult: { label: 'Adult', note: 'Full family member controls apply separately' },
};

// Persona key from a display name: lowercase, alphanumeric runs joined by '-'.
// Matches the existing convention ('christian', 'christyn', 'christiana').
export function personaSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate a provision request BEFORE it goes near the RPC. Returns
// { ok: true, value } with normalized fields, or { ok: false, error }.
export function validateProvision({ displayName, persona, minorTier, childUserId } = {}) {
  const name = String(displayName || '').trim();
  if (!name) return { ok: false, error: 'A display name is required.' };
  const slug = personaSlug(persona || name);
  if (!slug) return { ok: false, error: 'The persona key came out empty — use letters or numbers in the name.' };
  if (!MINOR_TIERS.includes(minorTier)) {
    return { ok: false, error: `Tier must be one of: ${MINOR_TIERS.join(', ')}.` };
  }
  const child = String(childUserId || '').trim();
  if (child && !UUID_RE.test(child)) {
    return { ok: false, error: 'The linked account id must be the account UUID from Supabase (or leave it blank to link later).' };
  }
  return {
    ok: true,
    value: { displayName: name, persona: slug, minorTier, childUserId: child || null },
  };
}

// child_capabilities rows -> per-persona config maps ({ persona: { cap: setting } }).
// Fixes the old flatten bug (one shared config across children): one child's
// grant must never bleed onto a sibling. Unknown capabilities are dropped
// (defense, mirroring relationships-sync.configFromRows).
export function configByPersona(rows, policy) {
  const out = {};
  for (const r of rows || []) {
    if (!r || !r.child_persona || !r.capability || !r.setting) continue;
    if (policy && !(r.capability in policy)) continue;
    if (!out[r.child_persona]) out[r.child_persona] = {};
    out[r.child_persona][r.capability] = r.setting;
  }
  return out;
}

// Shape a family_member_profiles row for the card. Null-safe: a missing field
// reads as its honest absence, never a crash.
export function rosterRowShape(row) {
  const tier = row && MINOR_TIERS.includes(row.minor_tier) ? row.minor_tier : 'adult';
  return {
    id: (row && row.id) || null,
    persona: (row && row.member_persona) || '',
    displayName: (row && row.display_name) || '(unnamed)',
    minorTier: tier,
    tierLabel: TIER_META[tier].label,
    tierNote: TIER_META[tier].note,
    coppaProtected: !!(row && row.coppa_protected),
    linked: !!(row && row.member_user_id),
  };
}
