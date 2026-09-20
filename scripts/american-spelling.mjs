// =============================================================================
// american-spelling — our voice spells it "color", and never touches a quote
// =============================================================================
// Darrell 2026-09-20, reading a lesson on the TV: "Never use colours... it looks
// bad from where I'm from looks like spelling errors.... fix it... its on the
// reader... spell it as color...."
//
// He is right, and the house standard is American English. But this is the most
// dangerous kind of fix to automate, because THE KJV IS FULL OF THESE WORDS.
// "and he made him a coat of many colours" is Genesis 37:3. "Honour thy father
// and thy mother" is Exodus 20:12. Saviour, neighbour, favour, labour — all of
// them, verbatim, hundreds of times. A find-and-replace would silently rewrite
// Scripture to tidy our own prose, which is the precise thing CLAUDE.md forbids
// in the same breath for the same reason (DR-0210's bright line: our voice
// ONLY, never quoted Scripture; DR-0530 repeats it for the Resources).
//
// So the scan reads OUR PROSE ONLY. Double-quoted spans are removed first —
// the same register the reading-level and full-levels gates measure, for the
// same reason (DR-0332: a proxy must measure what it claims to). What is left
// is what we wrote, and only that is corrected.

/** British -our / -re spellings we correct, and what they become. */
export const AMERICAN = Object.freeze({
  colour: 'color', colours: 'colors', coloured: 'colored', colouring: 'coloring',
  colourless: 'colorless', colourful: 'colorful', colourway: 'colorway',
  favour: 'favor', favours: 'favors', favoured: 'favored', favouring: 'favoring',
  favourite: 'favorite', favourites: 'favorites', favouritism: 'favoritism',
  honour: 'honor', honours: 'honors', honoured: 'honored', honouring: 'honoring',
  honourable: 'honorable', honourably: 'honorably',
  neighbour: 'neighbor', neighbours: 'neighbors', neighbourhood: 'neighborhood',
  labour: 'labor', labours: 'labors', laboured: 'labored', labouring: 'laboring',
  saviour: 'savior', saviours: 'saviors',
  behaviour: 'behavior', behaviours: 'behaviors', behavioural: 'behavioral',
  humour: 'humor', humours: 'humors', humoured: 'humored',
  valour: 'valor', rumour: 'rumor', rumours: 'rumors',
  armour: 'armor', armoured: 'armored',
  endeavour: 'endeavor', endeavours: 'endeavors',
  splendour: 'splendor', vigour: 'vigor', odour: 'odor', odours: 'odors',
  fervour: 'fervor', clamour: 'clamor', ardour: 'ardor', rigour: 'rigor',
  succour: 'succor', candour: 'candor', demeanour: 'demeanor',
});

const WORD = new RegExp(`\\b(${Object.keys(AMERICAN).join('|')})\\b`, 'gi');

/**
 * Our authored prose: everything OUTSIDE a double-quoted span.
 *
 * Replaced with spaces rather than removed so every character index in the
 * result still lines up with the original — a report that points at the wrong
 * offset is worse than no report.
 */
export function ourProse(text) {
  return String(text || '').replace(/"[^"]*"/g, (m) => ' '.repeat(m.length));
}

/** Preserve the original capitalisation when swapping a word. */
export function matchCase(original, replacement) {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

/** Every British spelling in OUR prose. Quoted Scripture is never reported. */
export function findBritish(text) {
  const prose = ourProse(text);
  const out = [];
  let m;
  WORD.lastIndex = 0;
  while ((m = WORD.exec(prose))) {
    out.push({ word: m[0], index: m.index, american: matchCase(m[0], AMERICAN[m[0].toLowerCase()]) });
  }
  return out;
}

/**
 * Correct our prose, leaving every quoted span byte-for-byte intact.
 * Built by splicing at the indices the scan reported, so a quotation is
 * untouchable by construction rather than by care.
 */
export function toAmerican(text) {
  const src = String(text || '');
  const hits = findBritish(src);
  if (!hits.length) return src;
  let out = '';
  let at = 0;
  for (const h of hits) {
    out += src.slice(at, h.index) + h.american;
    at = h.index + h.word.length;
  }
  return out + src.slice(at);
}
