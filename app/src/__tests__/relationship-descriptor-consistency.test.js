// =============================================================================
// relationship-descriptor-consistency.test.js — the DESCRIPTOR-CONSISTENCY gate
// =============================================================================
// THE WAY THIS ENFORCES (DR-0113, grounding DESCRIPTOR-CONSISTENCY; the machine
// backstop for the post-feature alignment review, REV-0011 / DR-0102 / DR-0104):
//
//   When the relationship permission model (lib/relationships.js — the SINGLE
//   source of truth) gains or changes a relationship, every OTHER location that
//   DESCRIBES the model in hardcoded prose must be swept to match. The Matrix
//   surface self-aligns because it renders live from the model (DR-0076 "no
//   painted permissions"); hardcoded copy does NOT — it drifts silently. On
//   2026-07-06 adding the landlord↔manager (1099) relationship left the help
//   copy, the Data-Systems course lesson, and the onboarding step still saying
//   "three relationships." This gate makes that drift FAIL THE BUILD instead of
//   depending on someone remembering to look.
//
// THE OTHER LOCATIONS TO REVIEW (the registry Darrell asked for — the answer to
// "what else describes this feature?"). When you add/rename a relationship, this
// list is what you sweep; the gate below proves you did:
//
//   • app/src/lib/help-content.js        — the in-app "?" help for Relationships
//   • app/src/lib/datasystems-course.js  — the roles-and-permissions lesson
//   • app/src/lib/adopter-onboarding.js  — the "Add your people" step
//
// This is a PROVEN-TO-CATCH gate (DR-0076 anti-theater): it was written by first
// confirming it went RED against the pre-sweep copy, then GREEN after the sweep.
// It checks OMISSION (a modeled relationship no descriptor names), the single
// failure mode that actually bit — not phrasing, which stays the author's.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELATIONSHIPS, RELATIONSHIP_TYPES } from '../lib/relationships.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(SRC, p), 'utf8');

// The registered descriptor locations — every place that describes the model in
// prose. Adding a location here extends the sweep the gate enforces.
const DESCRIPTOR_LOCATIONS = [
  { file: 'lib/help-content.js', label: 'in-app Relationships help' },
  { file: 'lib/datasystems-course.js', label: 'roles-and-permissions lesson' },
  { file: 'lib/adopter-onboarding.js', label: 'onboarding "Add your people"' },
];

// Distinctive tokens each relationship MUST be named by, in every descriptor. All
// tokens in a set must co-occur in the file (co-occurrence keeps a stray word
// from passing the check). A new relationship type with no entry here fails the
// registration assertion below — the forcing function that makes the author
// consciously register it AND sweep the descriptors.
const REL_TOKENS = {
  [RELATIONSHIP_TYPES.GUARDIAN_CHILD]: [/guardian/i, /child/i],
  [RELATIONSHIP_TYPES.FAMILY]: [/family/i],
  [RELATIONSHIP_TYPES.LANDLORD_TENANT]: [/landlord/i, /tenant/i],
  [RELATIONSHIP_TYPES.LANDLORD_MANAGER]: [/1099/i, /manager/i],
};

describe('descriptor-consistency: the model and every place that describes it stay in sync', () => {
  it('every modeled relationship type is registered with distinctive tokens (register + sweep on add)', () => {
    for (const rel of RELATIONSHIPS) {
      expect(
        REL_TOKENS[rel.type],
        `New relationship "${rel.type}" is not registered in REL_TOKENS. Register it here AND sweep every DESCRIPTOR_LOCATIONS file so its prose names the new relationship.`,
      ).toBeTruthy();
    }
  });

  for (const loc of DESCRIPTOR_LOCATIONS) {
    it(`${loc.label} (${loc.file}) names every modeled relationship`, () => {
      const text = read(loc.file);
      for (const rel of RELATIONSHIPS) {
        const tokens = REL_TOKENS[rel.type] || [];
        for (const token of tokens) {
          expect(
            token.test(text),
            `${loc.file} does not mention "${rel.label}" (missing ${token}). A relationship exists in the model that this surface's copy never names — sweep it to match relationships.js.`,
          ).toBe(true);
        }
      }
    });
  }

  it('the help copy\'s hardcoded relationship COUNT matches the model (no "three" while four exist)', () => {
    const help = read('lib/help-content.js');
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    const n = RELATIONSHIPS.length;
    // The Relationships help `what` states "It models <N> relationships —". Pin
    // that the written-out count equals the real number of modeled relationships.
    expect(
      new RegExp(`models ${words[n]} relationships`, 'i').test(help),
      `help-content.js should say "models ${words[n]} relationships" to match the ${n} types in relationships.js.`,
    ).toBe(true);
  });
});
