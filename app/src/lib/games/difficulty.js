// =============================================================================
// games/difficulty.js — pickable age/difficulty levels (young -> old)
// =============================================================================
// Darrell, 2026-07-07: "the game is too easy, everyone knows what to pick ...
// we need to be able to pick a level young to old just like the lessons on the
// Learn tab." The reason it's easy is that the board TELEGRAPHS the right answer:
// it previews each choice's score effect, badges the Kingdom option as "a second
// chance," lists the pious choice last every time, and shows Yahweh's perspective
// BEFORE you decide. So difficulty here is a REVEAL POLICY, not a content rewrite:
// as the level rises (child -> youth -> teen -> adult), the game gives away less
// and makes you weigh it yourself.
//
// PURE + DETERMINISTIC (DR-0076): the engine/scoring is untouched and stays
// exactly as tested — this module only decides what the UI reveals and the
// display ORDER of choices (a seeded permutation), so a level can never change
// which choice scores what. The "faithful choice outscores the worldly one"
// invariant is a property of the DATA (real indices), independent of display
// order. Mirrors the Learn tab's LEARN_LEVELS shape on purpose (one mental model
// across the app).
// =============================================================================

// Young -> old. Each carries the age band + what changes, so the picker reads
// like the Learn tab's level chooser.
export const GAME_LEVELS = [
  { id: 'child', label: 'Child',  age: 'ages 5–8',   hint: 'Everything is shown — the score each choice gives, and Yahweh’s perspective first. Learn by seeing what each road does.' },
  { id: 'youth', label: 'Youth',  age: 'ages 9–12',  hint: 'The score hints stay, but the “second chance” tell is hidden — you start to read the choices yourself.' },
  { id: 'teen',  label: 'Teen',   age: 'ages 13–17', hint: 'No score hints, and the choices are shuffled — no option is “the obvious one” by where it sits.' },
  { id: 'adult', label: 'Adult',  age: 'grown',      hint: 'No hints, shuffled, and Yahweh’s perspective comes AFTER you choose — you weigh it in faith, then see how it reads.' },
];

export const DEFAULT_LEVEL = 'child';

export function normalizeLevel(levelId) {
  return GAME_LEVELS.some((l) => l.id === levelId) ? levelId : DEFAULT_LEVEL;
}

export function levelMeta(levelId) {
  const id = normalizeLevel(levelId);
  return GAME_LEVELS.find((l) => l.id === id);
}

// What the UI reveals at a given level. Higher levels reveal less.
//   showEffects        — preview/echo the score chips on choices + applied events
//   showRedemptionHint — badge the redemption ("second chance") choice
//   showLensBeforeChoice — show Yahweh's-perspective + verse ON the decision
//                          (false = withhold until AFTER the choice is made)
//   shuffleChoices     — display choices in a seeded order (kills "pious = last")
export function revealPolicy(levelId) {
  switch (normalizeLevel(levelId)) {
    case 'youth': return { showEffects: true,  showRedemptionHint: false, showLensBeforeChoice: true,  shuffleChoices: false };
    case 'teen':  return { showEffects: false, showRedemptionHint: false, showLensBeforeChoice: true,  shuffleChoices: true };
    case 'adult': return { showEffects: false, showRedemptionHint: false, showLensBeforeChoice: false, shuffleChoices: true };
    case 'child':
    default:      return { showEffects: true,  showRedemptionHint: true,  showLensBeforeChoice: true,  shuffleChoices: false };
  }
}

// A small deterministic hash of a string + numeric seed (no Math.random — the
// display order must be reproducible so tests and a resumed game agree).
function hashSeed(key, seed) {
  let h = (seed >>> 0) ^ 0x811c9dc5;
  const s = String(key || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// The DISPLAY order for a space's choices: an array of length n whose values are
// the REAL choice indices, in the order to render them. Identity when the level
// doesn't shuffle; a seeded Fisher–Yates permutation when it does. The caller
// renders in this order but always dispatches the REAL index, so scoring is
// unchanged. Pure + stable for a given (spaceId, seed, level, n).
export function displayOrder(spaceId, seed, levelId, n) {
  const idx = Array.from({ length: Math.max(0, n | 0) }, (_, i) => i);
  if (!revealPolicy(levelId).shuffleChoices || idx.length < 2) return idx;
  let h = hashSeed(spaceId, seed);
  for (let i = idx.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) >>> 0;
    const j = h % (i + 1);
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return idx;
}
