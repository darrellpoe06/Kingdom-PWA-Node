// =============================================================================
// synthesis-text — what a VITS voice is handed: short sentences, every one closed
// =============================================================================
// Darrell 2026-10-09, L227 read aloud in the NAS voice, two photographs of the
// highlighted piece: "Fix the voice in all locations where it babbles... it
// undermines understanding for those who can't read", "Everytime it reads this
// section!!!", "Gibberish!!!", and then the clarification that settles what is
// measured: "Not get skipped... just slurred sounds.... not clear anymore...
// nothing is skipped".
//
// WHAT THE TWO PIECES HAVE IN COMMON, MEASURED (DR-0076). Both are one clause
// run with no full stop inside: "Rendered for meaning: reading the Word for
// the Spirit; doing the Word for competent conversations and learning skills;
// and never reading just to say I got you," (160 characters, 29 words, three
// clause marks, no sentence end) and "(Matthew 7:21) A reading done to win
// produces a person who can quote and cannot follow, and that is not a small
// defect; by the Lord's words it can be the whole defect." (30 words). The
// reader cuts a piece at about 180 characters where a person breathes
// (clip-queue.js PIECE_CUT), which is right for the ear; but Piper ends a
// SENTENCE only at . ! ? and runs each sentence as one inference, so a
// 30-word clause run reaches the model as one utterance. That is the same
// shape DR-0653 measured on L191 at 570 characters ("degrades into
// undetectable gibberish... after initially sounding like a man"), at a
// smaller size, and it is the piece that slurs every time, because the text
// is the same every time.
//
// THE FIX IS STRUCTURAL, NOT A RE-TRY. Before a piece is handed to the voice:
//   1. a clause mark that ends a thought (; or : followed by a word) becomes a
//      full stop, so each clause is its own short inference with Piper's own
//      0.2 s sentence gap between (a breath where the writer put a breath);
//   2. a sentence still longer than MAX_SENTENCE_WORDS is cut at its last
//      comma, or before and / but / so / because / which, into two;
//   3. every piece ends with a stop, so the model closes the utterance instead
//      of trailing off a comma into the next piece.
// Numbers keep their shape: "John chapter 3 verse 16" has no colon by now
// (speech-text.js), "2,450" has no space after its comma, "3:16 pm" has no
// space after its colon, so none of them is cut.
//
// This is the SPOKEN form only. The page, the highlight and the follow map
// still see the written piece; the cache key is made from what is sent, so a
// piece spoken the old way is never served from the device cache for the new.
// Pure, unit-tested, proven-to-catch on the two photographed pieces.
// =============================================================================

/** The most words one Piper inference is handed (a VITS voice stays clear here). */
export const MAX_SENTENCE_WORDS = 18;
/** Never cut a sentence shorter than this many words at a comma. */
export const MIN_CUT_WORDS = 4;

const CLOSERS = `["'’”)\\]]*`;
const ENDS_WITH_STOP = new RegExp(`[.!?]${CLOSERS}$`);
const SENTENCE_SPLIT = new RegExp(`(?<=[.!?]${CLOSERS})\\s+`);
const JOINERS = /^(and|but|so|because|which|while|then)$/i;

function cutLong(sentence) {
  const words = sentence.split(' ');
  if (words.length <= MAX_SENTENCE_WORDS) return sentence;
  const hi = Math.min(MAX_SENTENCE_WORDS - 1, words.length - 2);
  // the last comma inside the window, never inside a number ("2,450" is one word)
  for (let i = hi; i >= MIN_CUT_WORDS - 1; i--) {
    if (/,["'’”)]*$/.test(words[i])) {
      const head = words.slice(0, i + 1).join(' ').replace(/,(["'’”)]*)$/, '.$1');
      return `${head} ${cutLong(words.slice(i + 1).join(' '))}`;
    }
  }
  // else before a joiner word
  for (let i = hi; i >= MIN_CUT_WORDS - 1; i--) {
    if (JOINERS.test(words[i + 1])) {
      return `${words.slice(0, i + 1).join(' ')}. ${cutLong(words.slice(i + 1).join(' '))}`;
    }
  }
  // No safe cut inside the window: cut at the FIRST comma or joiner after it,
  // so the head is as short as the text allows rather than the whole run.
  for (let i = hi + 1; i <= words.length - 2; i++) {
    if (/,["'’”)]*$/.test(words[i])) {
      const head = words.slice(0, i + 1).join(' ').replace(/,(["'’”)]*)$/, '.$1');
      return `${head} ${cutLong(words.slice(i + 1).join(' '))}`;
    }
    if (JOINERS.test(words[i + 1])) return `${words.slice(0, i + 1).join(' ')}. ${cutLong(words.slice(i + 1).join(' '))}`;
  }
  return sentence; // nothing safe to cut anywhere: handed whole
}

/** The sentences a piece is spoken as, each ≤ MAX_SENTENCE_WORDS where a cut was safe. */
export function synthesisSentences(text) {
  let s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!s) return [];
  s = s
    .replace(/\s*;\s+(?=["'“‘(]?[A-Za-z])/g, '. ')
    .replace(/\s*:\s+(?=["'“‘(]?[A-Za-z])/g, '. ');
  const out = [];
  for (const sentence of s.split(SENTENCE_SPLIT)) {
    const t = sentence.trim();
    if (!t) continue;
    for (const part of cutLong(t).split(SENTENCE_SPLIT)) {
      const p = part.trim();
      if (p) out.push(ENDS_WITH_STOP.test(p) ? p : `${p.replace(/[,;:]+(["'’”)]*)$/, '$1')}.`);
    }
  }
  return out;
}

/** The text a VITS voice is handed for one piece. */
export function forSynthesis(text) {
  return synthesisSentences(text).join(' ');
}

/** The longest sentence, in words, a voice would be handed for this text. */
export function longestSentenceWords(text) {
  return synthesisSentences(text).reduce((m, s) => Math.max(m, s.split(' ').length), 0);
}

export default forSynthesis;
