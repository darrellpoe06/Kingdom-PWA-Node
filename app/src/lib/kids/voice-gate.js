// =============================================================================
// kids/voice-gate — the content rule for every line the Kids Zone says in OUR
// voice (DR-1508)
// =============================================================================
// Darrell, 2026-11-13: "Everything must be Christ-centered, biblically
// accurate, and appropriate for our church. No magic, spells, occult themes,
// or fantasy-based supernatural devices. Biblical miracles should be presented
// faithfully as acts of God."
//
// This gate scans OUR authored strings only: the guides' captions, episode
// blurbs, game copy, questions. It never scans or alters Scripture (DR-0076;
// the Word says "sorcerers" in Exodus and "witch" in 1 Samuel and we leave it
// exactly as written). A caption that fails the gate fails the build: every
// storybook test runs it over every caption, and the gate is proven to catch
// with a deliberately bad line.
// Pure: no React, no I/O.

/** Words that mark a fantasy or occult device. Whole words, any case. */
export const FANTASY_DEVICES = Object.freeze([
  'magic', 'magical', 'magician', 'spell', 'spells', 'wand', 'wizard', 'wizards', 'witch', 'witches', 'witchcraft',
  'fairy', 'fairies', 'genie', 'potion', 'potions', 'curse', 'cursed', 'enchanted', 'enchantment', 'sorcery', 'sorcerer',
  'superpower', 'superpowers', 'superhero', 'mystical', 'occult', 'zombie', 'zombies', 'ghost', 'ghosts', 'vampire', 'dragon',
  'unicorn', 'wish', 'wishes', 'luck', 'lucky', 'fortune', 'horoscope', 'crystal', 'spirit guide', 'mana',
]);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DEVICE_RE = new RegExp(`\\b(${FANTASY_DEVICES.map(escapeRe).join('|')})\\b`, 'i');

/**
 * The words that pass over a line in our voice. Returns `{ ok, hits }`; `hits`
 * names every device word found so the failing line can be fixed, not guessed.
 */
export function checkVoice(text) {
  const s = String(text || '');
  const hits = [];
  const re = new RegExp(DEVICE_RE.source, 'gi');
  for (const m of s.matchAll(re)) hits.push(m[1].toLowerCase());
  return { ok: hits.length === 0, hits };
}

/**
 * Every line of a surface's own voice, checked at once. Returns the failures
 * as `[{ where, text, hits }]`, empty when all is well.
 */
export function checkVoices(lines) {
  const out = [];
  for (const { where, text } of lines || []) {
    const r = checkVoice(text);
    if (!r.ok) out.push({ where, text: String(text || ''), hits: r.hits });
  }
  return out;
}
