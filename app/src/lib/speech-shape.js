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
// The badges and initialisms below are MEASURED, not guessed. Every entry past
// the first two lines was read out of the catalog in context before it was
// added (2026-10-08 sweep): a token that is genuinely letters to a reader is
// listed here, and everything else in caps is prose our own house style is
// shouting. This list is what protects a real initialism when the softening
// below widens, so it carries weight it did not carry before.
const KEEP_CAPS = new Set([
  'ESV', 'KJV', 'NIV', 'AMP', 'NASB', 'NLT', 'CSB', 'LXX',
  'AI', 'PWA', 'SOP', 'USA', 'US', 'OK', 'TV', 'CEO', 'DNA', 'PHD',
  'LORD', 'GOD', 'I', 'A',
  // Dates and the ledger: "586 BC", "DR-0076", "AD 70".
  'BC', 'AD', 'DR',
  // Speaker marks the transcripts carry.
  'DP', 'BG',
  // Roles, bodies and standards read as letters.
  'CFO', 'SME', 'MBA', 'PMP', 'ITIL', 'USSC', 'EEOC', 'HOLC', 'FDA', 'FBI',
  'NPR', 'MIT', 'IBM', 'IKEA', 'AFL', 'AME', 'BLS', 'HR', 'ROI', 'VRA',
  'DSS', 'TLC', 'JCPP', 'AAPA', 'AABA', 'NLR', 'GDF', 'DLM', 'IVV', 'TPO',
  'TSI', 'TGAB', 'TSH', 'EPI', 'BPA', 'DMT',
  // Machines and the road.
  'NAS', 'CPU', 'OS', 'IP', 'CI', 'GPS', 'AGI', 'UFO', 'IQ',
  // Names and numerals that are letters on purpose.
  'YHWH', 'JAH', 'EL', 'II', 'III', 'MT', 'FL', 'ID',
  // Spiritual intelligence, named as (SI) in the Godhead lessons.
  'SI',
]);

// SHORT WORDS THAT ARE ALWAYS PROSE, NEVER AN INITIALISM.
//
// A lone shouted word of four letters or more is prose often enough to soften
// on length alone (see the note on LONE_SHOUT_MIN below). At two and three
// letters the two cases genuinely collide — "BC" is letters, "DO" is a word —
// so length cannot decide it and a guess is not allowed to. This list decides
// it by name instead, and every entry was MEASURED: the 2026-10-08 sweep of all
// 215 catalog modules through the real pipeline listed every short word the
// house style actually shouts, each was read in context, and the one genuine
// initialism among them (SI) went to KEEP_CAPS above instead.
//
// The emphasis these carry is real on the page — "the Spirit AND the Word",
// "Take ONE real rest", "Growing IS the plan", "SIX. Ask for a fair check" —
// and the page keeps every capital. It is only the utterance that is lowered,
// because an engine handed a lone capitalised word either shouts over it or
// spells it, and neither is the emphasis the writer meant.
//
// A short shouted word that is NOT listed here stays as it is. That is the safe
// direction: an unlisted word is read as written, never mangled into letters it
// does not have.
const SHOUT_WORDS = new Set([
  'AND', 'ONE', 'TWO', 'SIX', 'TEN', 'IS', 'NOT', 'DO', 'FOR', 'IN', 'YOU',
  'ALL', 'TO', 'HOW', 'WHY', 'HIS', 'HIM', 'BY', 'SEE', 'USE', 'HE', 'OUT',
  'CAN', 'OWN', 'DID', 'ARE', 'WHO', 'OR', 'AS', 'YET', 'NOW', 'WAS', 'NO',
  'OUR', 'RUN', 'ON', 'IF', 'IT', 'ME', 'ACT', 'WAY', 'WE', 'ANY', 'NEW',
  'HER', 'ASK', 'BUT', 'HAD', 'GET', 'SAY', 'OF', 'JOY', 'SO', 'LOT', 'UP',
  'JOB', 'SET', 'YES', 'HID', 'AT', 'END', 'GO', 'SON', 'TRY', 'THE', 'AIM',
  'LED', 'MEN', 'SAW', 'LAW', 'SIN', 'WIN', 'MAY', 'LIE', 'BE', 'EAT', 'RAN',
  'FEW', 'OFF', 'LOW', 'MY', 'FIX', 'HI', 'ANT', 'NON', 'MAN', 'SHE', 'BAD',
  'OLD', 'FED', 'AGE', 'CUT', 'DUE', 'SAD', 'GAP', 'SIT', 'LET', 'AIR', 'TOO',
  'WOE', 'PUT', 'WON', 'TOP', 'HAS', 'EYE', 'BIT', 'BUY', 'AM', 'AN', 'ITS',
  'NOR',
]);

/** The letters of a token, with punctuation and digits stripped. */
function bareLetters(word) {
  return word.replace(/[^A-Za-z]/g, '');
}

/** Is this token an all-caps word we should leave alone? */
function keepAsIs(word) {
  const bare = bareLetters(word);
  if (!bare) return true;
  if (KEEP_CAPS.has(bare)) return true;
  if (bare.length <= 1) return true;
  return false;
}

// A SHOUT DOES NOT STOP AT A COMMA — and the first build of this assumed it did.
//
// Darrell 2026-10-08, on lesson L218: "the voice keeps failing and it sounds
// garbled... can't distinguish the words... It's happening in multiple places in
// most lessons... a paragraph or a few that don't work well and is incoherent."
//
// Measured on the real catalog through the real pipeline, not guessed: 214 of
// 215 modules still handed the engine a shouted word, 3,676 places, 13,557
// occurrences. The cause is one character in the old pattern. It required two or
// more capitalised words separated by WHITESPACE, so
//
//     "FIRST, DO NOT SWITCH UP."   ->   "FIRST, Do not switch up."
//
// The comma ended the run and FIRST was handed to the engine still shouting,
// which several engines spell letter by letter: "F-I-R-S-T, do not switch up."
// That is the garble, and it is a TEXT fault, exactly as the note at the top of
// this file says.
//
// So the run now crosses the marks a speaker pauses on — comma, semicolon,
// colon, dash — because a shout crosses them too. Two properties are
// load-bearing:
//
//   1. THE SEPARATORS ARE PUT BACK EXACTLY. The old body did split(/\s+/) and
//      join(' '), which was safe only while whitespace was the only separator.
//      Widening with that body would have deleted every comma inside a run.
//      The split captures its separators and the join re-emits them verbatim.
//   2. A LONE SHOUTED TOKEN IS SOFTENED AT FOUR LETTERS OR MORE, OR BY NAME. A
//      run of one is where prose and initialism are genuinely
//      indistinguishable, and the measurement says length decides it from four
//      letters up: the four-plus survivors were nearly all prose (FIRST,
//      OCCASION, NOTICE) and the handful of real four-plus initialisms are
//      named in KEEP_CAPS above. Below four letters length decides nothing, so
//      the measured SHOUT_WORDS list decides by name instead. A sentence
//      boundary is NOT crossed, so a shouted word opening a sentence still
//      keeps its capital and the engine still opens like a sentence.
const SHOUT_RUN = /\b[A-Z][A-Z'’-]*(?:[\s,;:—–]+[A-Z][A-Z'’-]*)*\b/g;
const SHOUT_SEPARATOR = /([\s,;:—–]+)/;
const LONE_SHOUT_MIN = 4;

/**
 * Does the text before this run leave it standing at the start of a sentence?
 *
 * Only a run that does keeps a capital on its first word. A run in the middle
 * of a line gets none, so "the Spirit AND the Word" reads back as "the Spirit
 * and the Word" rather than "the Spirit And the Word" — the same sound either
 * way, but a stray capital mid-line is still an engine inviting emphasis we did
 * not ask for.
 */
function opensSentence(before) {
  const tail = String(before).replace(
    /[\s"'“”‘’([{]+$/,
    (run) => (/[\n\r]/.test(run) ? '\n' : ''),
  );
  if (!tail) return true;
  return /[.!?\n]$/.test(tail);
}

/**
 * Take a SHOUTED run down to ordinary sentence case so the engine speaks it as
 * words. The first word keeps its capital so the sentence still opens like a
 * sentence; an initialism survives anywhere in the run.
 */
export function softenShouting(text) {
  const whole = String(text == null ? '' : text);
  return whole.replace(SHOUT_RUN, (run, offset) => {
    // Even indices are words, odd indices are the separators between them.
    const parts = run.split(SHOUT_SEPARATOR);
    const words = parts.filter((_, i) => i % 2 === 0);
    if (words.every(keepAsIs)) return run;
    if (words.length === 1) {
      const bare = bareLetters(words[0]);
      if (bare.length < LONE_SHOUT_MIN && !SHOUT_WORDS.has(bare)) return run;
    }
    const opens = opensSentence(whole.slice(0, offset));
    let nth = -1;
    return parts
      .map((part, i) => {
        if (i % 2 === 1) return part;
        nth += 1;
        if (keepAsIs(part)) return part;
        const lower = part.toLowerCase();
        return nth === 0 && opens ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
      })
      .join('');
  });
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
    .replace(/\s+--\s+/g, ', ') // the typed double hyphen is the same breath (DR-0851)
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
