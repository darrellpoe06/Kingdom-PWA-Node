// =============================================================================
// kids/word-builder — the Word Builder game's pure rules (Kids Zone, Phase E)
// =============================================================================
// Darrell, 2026-11-13: "Develop the Word Builder and Who Am I? Bible games."
//
// GROUNDED, NOT PAINTED (P15; DR-0076): nothing here types a word of Scripture.
// The game is handed the verse's words by the caller, which loads them from
// the hosted King James text at play time (lib/bible-kjv.js verseText), and
// every word the child spells is one of THOSE words, in the verse's own order.
// A verse the device cannot load has no words, and the surface says so.
//
// Two forms over one engine:
//   • Kids (6–10): spell one word at a time from its shuffled letters, with
//     the verse as the hint (that word blanked) and a letter hint that costs a star.
//   • Teens (11–17): put the verse's phrases back in order, then spell a long
//     word with no hint.
// The shuffle is seeded by the calendar week (lib/youth-zone.js weekIndex),
// so the same verse plays the same way all week on every device.
// Stars are this round's alone: nothing is written about anyone, by design.
// Pure: no React, no I/O, no Date.

/** The letters of a word, lowercase, nothing else. */
export function lettersOf(word) {
  return String(word || '')
    .replace(/[^A-Za-z]/g, '')
    .toLowerCase();
}

/**
 * The words a verse offers, in verse order: `min` letters or more, letters
 * only, the first time each appears. `index` is the token's position in the
 * verse so the hint can blank exactly that token.
 */
export function buildableWords(text, { min = 4 } = {}) {
  const tokens = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  tokens.forEach((token, index) => {
    const letters = lettersOf(token);
    if (letters.length < min || seen.has(letters)) return;
    seen.add(letters);
    out.push({ word: letters, display: token.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ''), index });
  });
  return out;
}

/** A small deterministic generator (mulberry32) so a seed replays the same shuffle. */
export function seededRandom(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates over a copy, driven by the seed. */
export function seededShuffle(items, seed) {
  const arr = Array.isArray(items) ? items.slice() : [];
  const rnd = seededRandom(seed);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * The word's letters, shuffled by the seed, never left in their real order
 * (a word with two or more distinct letters rotates once if the shuffle
 * happens to land on the answer). Returns tiles { id, letter } so a repeated
 * letter is still its own tile.
 */
export function scrambleLetters(word, seed = 0) {
  const letters = lettersOf(word).split('');
  if (letters.length === 0) return [];
  let order = seededShuffle(letters.map((_, i) => i), seed);
  const sameAsWord = order.every((idx, pos) => letters[idx] === letters[pos]);
  if (sameAsWord && new Set(letters).size > 1) order = order.slice(1).concat(order.slice(0, 1));
  return order.map((idx) => ({ id: idx, letter: letters[idx] }));
}

/**
 * The verse as tokens with exactly one token blanked (the word being spelled,
 * by its index). `answer` on the blank is the lowercase letters.
 */
export function hintTokens(text, index) {
  const tokens = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  return tokens.map((token, i) => ({ word: token, blank: i === index, answer: i === index ? lettersOf(token) : null }));
}

/** True when the tiles placed so far are the word's start, in order. */
export function placedSoFarIsRight(word, placed) {
  const w = lettersOf(word);
  const p = (placed || []).map((t) => String(t && t.letter != null ? t.letter : t)).join('').toLowerCase();
  return w.startsWith(p);
}

/** True when the placed tiles spell the whole word. */
export function spelled(word, placed) {
  const w = lettersOf(word);
  const p = (placed || []).map((t) => String(t && t.letter != null ? t.letter : t)).join('').toLowerCase();
  return w.length > 0 && w === p;
}

/** The next letter the child needs, for the "Show a letter" hint. */
export function nextLetter(word, placed) {
  const w = lettersOf(word);
  const n = (placed || []).length;
  return n < w.length ? w[n] : '';
}

/** Stars for a round: the full count, minus one per hint, never below one. */
export function starsFor({ hints = 0, max = 4 } = {}) {
  return Math.max(1, Math.min(max, max - Math.max(0, Number(hints) || 0)));
}

// ---- the teens' form: phrases in order --------------------------------------

/**
 * The verse cut at its own punctuation (; : , .) into phrases of two or more
 * words, in order. A verse with fewer than two phrases returns the whole verse
 * as one, so the surface can say the round is a spelling round instead.
 */
export function phrasesOf(text) {
  const raw = String(text || '')
    .split(/(?<=[;:,.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [];
  raw.forEach((p) => {
    const words = p.split(/\s+/).length;
    if (words < 2 && merged.length) merged[merged.length - 1] += ` ${p}`;
    else merged.push(p);
  });
  return merged.map((phrase, order) => ({ order, phrase }));
}

/** The phrases shuffled by the seed, never left in order when there are two or more. */
export function shufflePhrases(phrases, seed = 0) {
  if (!Array.isArray(phrases) || phrases.length < 2) return (phrases || []).slice();
  let out = seededShuffle(phrases, seed);
  if (out.every((p, i) => p.order === i)) out = out.slice(1).concat(out.slice(0, 1));
  return out;
}

/** True when the arranged phrases are back in the verse's order. */
export function inOrder(arranged) {
  return Array.isArray(arranged) && arranged.length > 0 && arranged.every((p, i) => p && p.order === i);
}

/** The longest buildable word of a verse, for the teens' no-hint spelling round. */
export function longestWord(text) {
  const words = buildableWords(text, { min: 4 });
  return words.reduce((best, w) => (w.word.length > (best ? best.word.length : 0) ? w : best), null);
}
