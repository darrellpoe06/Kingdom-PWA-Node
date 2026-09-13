// =============================================================================
// speech-shape — make the reader sound like a person, not a terminal
// =============================================================================
// Darrell 2026-09-13: "the text to speak aspect needs to be better at the words
// sounds... can we get close to humans when talking or do we still have to
// sound like a computer no offense?"
//
// None taken, and the honest answer is that most of what made it sound like a
// computer was NOT the voice engine. It was what we handed the engine. Four
// faults, all in our own text, all fixable without touching a single displayed
// word:
//
//   1. PHRASES CUT IN HALF. tts.js segmentText() splits on . ! ? and then
//      word-wraps anything over 180 characters at whatever word happens to
//      land there. A long sentence therefore gets a hard stop in the middle of
//      a clause — the single most robotic thing a reader can do, because no
//      human breathes mid-phrase. Clause boundaries (; — : ,) are where a
//      person actually breathes, and they were being ignored.
//
//   2. SHOUTING. The house style writes lead clauses in capitals — measured:
//      313 of them across the corpus. Speech engines treat an ALL-CAPS run
//      inconsistently: some shout it, some spell it letter by letter. "THE
//      DIRECTIVE." becoming "T-H-E D-I-R-E-C-T-I-V-E" is not a voice problem,
//      it is a text problem. Lower-casing for SPEECH ONLY fixes it, and the
//      screen is untouched.
//
//   3. PUNCTUATION READ ALOUD. A verse reference like "(1 John 1:8, ESV)"
//      comes out as "one John one COLON eight comma E S V". Humans say "First
//      John one eight". The colon is the offender.
//
//   4. TYPOGRAPHY THE ENGINE DOES NOT KNOW. Em-dashes, curly quotes and
//      ellipses are variously read as "dash", skipped, or allowed to flatten
//      the prosody.
//
// THE BRIGHT LINE (DR-0076 / the verse-pin gates): this NEVER alters what is
// displayed or shared. It produces a separate speech string. Words are never
// added, removed or reordered — only case, punctuation and breath points move,
// and a test asserts the word sequence is identical.
// =============================================================================

// Initialisms that should stay upper case because they ARE letters to a reader:
// translation badges and the like. Everything else in caps is prose being
// shouted by our own house style.
import { segmentByReferences } from './verse-refs.js';
const KEEP_CAPS = new Set([
  'ESV', 'KJV', 'NIV', 'AMP', 'NASB', 'NLT', 'CSB', 'LXX',
  'AI', 'PWA', 'SOP', 'USA', 'US', 'OK', 'TV', 'CEO', 'DNA', 'PHD',
  'LORD', 'GOD', 'I', 'A',
]);

/** Is this token an all-caps word we should leave alone? */
function keepAsIs(word) {
  const bare = word.replace(/[^A-Za-z]/g, '');
  if (!bare) return true;
  if (KEEP_CAPS.has(bare)) return true;
  if (bare.length <= 1) return true;
  return false;
}

/**
 * Take a SHOUTED run down to ordinary sentence case so the engine speaks it as
 * words. Only runs of two or more capitalised words are touched, so an
 * initialism standing alone survives, and the first word keeps its capital so
 * the sentence still opens like a sentence.
 */
export function softenShouting(text) {
  return String(text == null ? '' : text).replace(
    /\b[A-Z][A-Z'’-]*(?:\s+[A-Z][A-Z'’-]*)+\b/g,
    (run) => {
      const words = run.split(/\s+/);
      if (words.every(keepAsIs)) return run;
      return words
        .map((w, i) => {
          if (keepAsIs(w)) return w;
          const lower = w.toLowerCase();
          return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
        })
        .join(' ');
    },
  );
}

// REFERENCES ARE NOT HANDLED HERE, DELIBERATELY. A first draft of this module
// carried its own "John 1:8 -> John 1 8" pass before lib/speech-text.js was
// read properly. That file already does the job and does it BETTER — it says
// "First John, chapter one, verse eight", knows a psalm is numbered rather than
// chaptered, and expands roman numerals. Keeping a second, worse copy is
// exactly the two-registry mistake that cost Moore Divahs every order for
// months (0215). One registry: toSpokenForm owns references, this owns shouting
// and typography, and they compose.

/**
 * Typography the engine mishandles, replaced with what it reads correctly.
 * An em-dash becomes a comma-and-space: a real breath, which is what the dash
 * was doing on the page. Curly quotes are flattened. Ellipses become a period
 * so the engine actually pauses instead of trailing into the next clause.
 */
export function plainTypography(text) {
  return String(text == null ? '' : text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/…/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Title-case a SHOUTED book name that is about to be followed by a reference.
 *
 * Measured, not hypothesised: the corpus carries 6 of these — "HEBREWS 2:14",
 * "GENESIS 22:8", "LEVITICUS 17:7" and the like, where the house style shouted
 * a whole clause that happened to contain a verse. speech-text.js matches a
 * CAPITALISED book name, so a shouted one slips past every reference rule and
 * the engine then says "Hebrews two COLON fourteen".
 *
 * Runs before the reference expansion so the matcher sees what it expects. Only
 * a word standing immediately before chapter:verse is touched, so ordinary
 * shouting is left for softenShouting to handle.
 */
export function unshoutBookNames(text) {
  return String(text == null ? '' : text).replace(
    /\b([A-Z]{2,})(?=\s+\d{1,3}:\d{1,3})/g,
    (w) => w.charAt(0) + w.slice(1).toLowerCase(),
  );
}

/** The full shaping pass: what we hand the engine instead of the raw page text. */
// A LONG RUN OF BARE REFERENCES IS A LIST, NOT A SENTENCE — DO NOT READ IT.
//
// Darrell 2026-09-13, listening to a lesson's Anchor block: "don't read long
// list of references together... especially in these.... just when the word or
// a point is needed."
//
// He is right, and the failure is the same CLASS as the chrome the reader used
// to speak (CONTROLS ARE NOT CONTENT, TTSControl). An anchor line can carry
// eighty references separated by semicolons. Read aloud one by one that becomes
// four minutes of "Matthew chapter four verse ten, Isaiah chapter forty-two
// verse eight, Exodus chapter twenty verse three..." before a single word of
// teaching arrives, and a listener has no way to skip it. It is an INDEX being
// performed as prose.
//
// A reference inside a sentence is the opposite — it is the point, and it is
// exactly what he wants spoken ("just when the word or a point is needed"). So
// the rule is about RUNS, not about references: three or more back to back,
// separated by nothing but punctuation, are collapsed to one short sentence
// that says how many and where they are. One or two stay spoken in full,
// because that is a citation doing work in a line of teaching.
//
// The matcher is the shared scanner (verse-refs -> video-harvest findScriptureRefs),
// so what counts as a reference is still decided in exactly one place.
const RUN_SEPARATOR = /^[\s;,.·—–-]*$/;

export function collapseReferenceRuns(text, min = 3) {
  const s = typeof text === 'string' ? text : '';
  if (!s) return '';
  const segs = segmentByReferences(s);
  if (!segs.length) return s;
  const raw = (seg) => (seg.type === 'ref' ? (seg.raw ?? seg.value) : seg.value);
  const out = [];
  let i = 0;
  while (i < segs.length) {
    if (segs[i].type !== 'ref') { out.push(raw(segs[i])); i += 1; continue; }
    // How far does this run go? References, and only punctuation between them.
    let j = i;
    let count = 0;
    while (j < segs.length) {
      if (segs[j].type === 'ref') { count += 1; j += 1; continue; }
      const bridgesToAnotherRef = RUN_SEPARATOR.test(segs[j].value)
        && j + 1 < segs.length && segs[j + 1].type === 'ref';
      if (bridgesToAnotherRef) { j += 1; continue; }
      break;
    }
    if (count >= min) {
      // Say how many and where, so a listener knows something is there rather
      // than wondering what was skipped. Never silently drop content.
      out.push(`${count} Scripture references are listed on the screen`);
      i = j;
    } else {
      out.push(raw(segs[i]));
      i += 1;
    }
  }
  return out.join('');
}

export function shapeForSpeech(text) {
  return plainTypography(softenShouting(text));
}

// Where a person actually breathes, in the order a breath is preferred. A
// segment is cut at the LAST of these inside the limit, so the cut lands on a
// real boundary rather than on whichever word crossed 180 characters.
// PUNCTUATION breaths end AFTER the mark — that is where the pause belongs.
const PUNCT_BREATHS = ['; ', ': ', ', '];
// CONJUNCTION breaths end BEFORE the word, because a segment that finishes on
// a dangling "and" is worse than no break at all: the engine drops its pitch on
// the conjunction and the next utterance starts cold. The first draft here cut
// AFTER them and produced exactly that — "...(1 John 1 8, ESV), and" — caught
// by listening to the output rather than by reading the code.
const WORD_BREATHS = [' and ', ' but ', ' so ', ' because ', ' which ', ' when ', ' where ', ' while '];

/**
 * Split shaped text into utterances that END WHERE A PERSON WOULD.
 *
 * Same job as tts.js segmentText — short utterances so a rate change can
 * restart the current one and Chrome's long-utterance cutoff is avoided — but
 * a long sentence is broken at a clause boundary instead of at an arbitrary
 * word. That single change is most of the difference between reading and
 * reciting.
 *
 * Pure, deterministic, and every word survives in order (pinned by test).
 */
export function speechSegments(text, maxLen = 180) {
  return clauseSegments(shapeForSpeech(text), maxLen);
}

/**
 * SPLIT ONLY — every segment is an exact substring of the whitespace-normalized
 * input, and that property is load-bearing rather than incidental.
 *
 * read-follow.js locates each spoken segment in the DISPLAYED text with
 * `text.indexOf(seg, cursor)` so it can draw the highlight a listener follows.
 * If the segment had been shaped — shouting lowered, a colon turned to a space,
 * an em-dash to a comma — every one of those lookups would return -1 and the
 * follow-along highlight would silently stop, with nothing failing loudly. So
 * the two jobs are kept apart: this splits, shapeForSpeech() smooths, and the
 * engine gets the smoothed version of a segment whose raw form still matches
 * the page.
 */
export function clauseSegments(text, maxLen = 180) {
  const clean = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const out = [];
  const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  for (const raw of sentences) {
    let s = raw.trim();
    if (!s) continue;
    while (s.length > maxLen) {
      // `end` is the exclusive index the head stops at.
      let end = -1;
      for (const b of PUNCT_BREATHS) {
        const at = s.lastIndexOf(b, maxLen);
        if (at > 40) end = Math.max(end, at + b.length - 1);   // keep the mark
      }
      for (const b of WORD_BREATHS) {
        const at = s.lastIndexOf(b, maxLen);
        if (at > 40) end = Math.max(end, at);                  // stop before the word
      }
      if (end <= 0) {
        // No clause boundary in range — fall back to a word boundary, which is
        // what we always did. Better than exceeding the engine's limit.
        end = s.lastIndexOf(' ', maxLen);
        if (end <= 0) break;
      }
      const head = s.slice(0, end).trim();
      if (head) out.push(head);
      s = s.slice(end).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

/**
 * The words, in order, ignoring case and punctuation. The gate that keeps this
 * module honest: shaping may change how a thing SOUNDS, never what is said.
 */
export function wordSequence(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
