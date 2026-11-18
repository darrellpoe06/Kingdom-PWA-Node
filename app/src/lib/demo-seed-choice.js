// =============================================================================
// demo-seed-choice — which dataset the app boots with (extracted from the
// shell's useState initializer, DR-0078 ratchet).
//
// Why this exists (2026-11-18 spec-conformance review of the persona picker):
// the public-host security guard (2026-06-03) ran BEFORE the demo branch, so on
// poetech.us every `?demo=<persona>` tile booted the family-of-4 sample — the
// landlord, co-parent, single, solo-practice ... tiles all showed the same
// Reeves household under a different label. The guard's purpose is "never seed
// SEED_DATA (the real family's ops shape) on a public host"; every persona in
// DEMO_DATA_BY_PERSONA is built from the same anonymized overrides as
// family-of-4 (proven in demo-seed-choice.test.js), so honoring the chosen
// persona keeps that guarantee while making each tile show its own life.
//
// Order of precedence:
//   1. A valid demo persona the visitor picked  → that persona's sample.
//   2. Public host or reviewer mode             → family-of-4 sample (never SEED_DATA).
//   3. Picker / first-time landing               → family-of-4 sample.
//   4. Private trusted host (NAS/LAN/dev)        → SEED_DATA.
// =============================================================================

export function pickInitialSeed({ isDemoMode, demoPersona, personas, isPublic, reviewerMode, isPickerMode, isFirstTimeLanding, seed }) {
  const familyOf4 = personas && personas['family-of-4'];
  const chosen = isDemoMode && demoPersona && personas ? personas[demoPersona] : undefined;
  if (chosen) return chosen;
  if (isPublic || reviewerMode) return familyOf4;
  if (isPickerMode || isFirstTimeLanding) return familyOf4;
  return seed;
}
