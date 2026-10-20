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
// WHERE A LONG SENTENCE IS CUT WHEN IT HAS NO COMMA AND NO JOINER (DR-1131).
// Darrell 2026-10-20: "still mumbling in sections". DR-0851 left 894 catalog
// pieces handed whole at 19 to 37 words because nothing in this file could cut
// them; the clarity witness's "longest" group is drawn from exactly those. Two
// more places a reader breathes, used only when the two above are not there:
//   * an ASIDE IN PARENTHESES — nearly always a citation, "(Psalm 34 verse 8)",
//     sitting in the middle of a quotation that runs on: the reader pauses
//     before it and after it, so it is spoken as its own short sentence;
//   * a SUBORDINATOR — that / who / where / when / before / after / if / as /
//     than / until / unless / though / for / or / nor / yet: a clause boundary
//     without a comma, and the least natural cut of the three, so it is last.
const SUBORDINATORS = /^(that|who|whom|whose|where|when|before|after|until|unless|though|although|if|as|than|for|nor|or|yet)$/i;
const ASIDE = /^(.*?)\s*\(([^()]*[A-Za-z][^()]*)\)\s*(.*)$/;
const hasWords = (s) => /[A-Za-z0-9]/.test(s);
const closed = (s) => (ENDS_WITH_STOP.test(s) ? s : `${s.replace(/[,;:]+(["'’”)]*)$/, '$1')}.`);

function cutBefore(words, test, from, to, step) {
  for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
    if (test(words[i + 1])) return `${words.slice(0, i + 1).join(' ')}. ${cutLong(words.slice(i + 1).join(' '))}`;
  }
  return null;
}

function cutLong(sentence) {
  const words = sentence.split(' ');
  if (words.length <= MAX_SENTENCE_WORDS) return sentence;
  // an aside in parentheses is its own sentence; what is before and after it
  // is cut on its own (a lone quotation mark left before it is not a word)
  const aside = sentence.match(ASIDE);
  if (aside) {
    const [, head, inner, tail] = aside;
    // the clause mark that joined the aside to its neighbour is spoken as the
    // stop that now stands there, not as a dangling comma
    const rest = tail.replace(/^[\s,;:]+/, '');
    const parts = [];
    if (hasWords(head)) parts.push(cutLong(closed(head.trim())));
    parts.push(cutLong(closed(inner.trim())));
    if (hasWords(rest)) parts.push(cutLong(rest));
    return parts.join(' ');
  }
  const hi = Math.min(MAX_SENTENCE_WORDS - 1, words.length - 2);
  // the last comma inside the window, never inside a number ("2,450" is one word)
  for (let i = hi; i >= MIN_CUT_WORDS - 1; i--) {
    if (/,["'’”)]*$/.test(words[i])) {
      const head = words.slice(0, i + 1).join(' ').replace(/,(["'’”)]*)$/, '.$1');
      return `${head} ${cutLong(words.slice(i + 1).join(' '))}`;
    }
  }
  // else before a joiner word, else before a subordinator, inside the window
  const joined = cutBefore(words, (w) => JOINERS.test(w), hi, MIN_CUT_WORDS - 1, -1)
    || cutBefore(words, (w) => SUBORDINATORS.test(w), hi, MIN_CUT_WORDS - 1, -1);
  if (joined) return joined;
  // No safe cut inside the window: cut at the FIRST comma or joiner after it,
  // so the head is as short as the text allows rather than the whole run.
  for (let i = hi + 1; i <= words.length - 2; i++) {
    if (/,["'’”)]*$/.test(words[i])) {
      const head = words.slice(0, i + 1).join(' ').replace(/,(["'’”)]*)$/, '.$1');
      return `${head} ${cutLong(words.slice(i + 1).join(' '))}`;
    }
    if (JOINERS.test(words[i + 1])) return `${words.slice(0, i + 1).join(' ')}. ${cutLong(words.slice(i + 1).join(' '))}`;
  }
  // else the first subordinator after the window
  return cutBefore(words, (w) => SUBORDINATORS.test(w), hi + 1, words.length - 2, 1)
    || sentence; // nothing safe to cut anywhere: handed whole
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
      // a part with no word in it (a quotation mark an aside left behind) is not spoken
      if (p && hasWords(p)) out.push(closed(p));
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
