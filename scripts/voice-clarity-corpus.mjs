// =============================================================================
// voice-clarity-corpus — the pieces the clarity witness listens to, cut by the
// reader's own pipeline (DR-1130)
// =============================================================================
// Darrell, 2026-10-20, a Living Lessons week on the phone: "Our app is still
// mumbling in sections of the tts.... fix it so it can be fully functional
// without defective speaking parts of the lessons".
//
// "Still": DR-0653 (one short piece at a time) and DR-0851 (short, closed
// sentences) each changed what the Piper voice is handed, and each was proven
// on the TEXT — word counts, sentence ends. Nothing ever listened to the
// result. This corpus is what .github/workflows/voice-clarity-witness.yml
// synthesizes through /voice-lite and transcribes back with speech
// recognition, so "it mumbles" becomes a word-error number per piece and per
// pace, measured on the clips the reader plays (DR-0076 §4: measure, never
// claim).
//
// Every entry is a piece exactly as the reader cuts it (chunkForClips) and the
// text exactly as the voice is handed it (forSynthesis(toSpokenForm())), from
// the live catalog, so the fixture can never drift from the pipeline: the test
// regenerates it and compares. Groups:
//   screenshot   the paragraph in his screenshot, including the piece that was
//                lit when he took it;
//   photographed the three pieces photographed on 2026-10-09 (DR-0851);
//   longest      the catalog pieces whose spoken sentences are still the
//                longest after DR-0851's shaping (its 894 "no safe cut" class);
//   citation-led pieces that open on a quotation mark and a reference, the
//                shape both photographed pieces and the screenshot share;
//   ordinary     short, plain pieces, sampled evenly: the control.
//
// Run from the repo root:  node scripts/voice-clarity-corpus.mjs --write
// Pure apart from --write. The selection is deterministic.
// =============================================================================
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chunkForClips } from '../app/src/lib/clip-queue.js';
import { toSpokenForm } from '../app/src/lib/speech-text.js';
import { forSynthesis, longestSentenceWords } from '../app/src/lib/synthesis-text.js';
import { LIVING_LESSONS_MODULES } from '../app/src/lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FIXTURE = join(HERE, '..', 'infra', 'nas-voice-lite', 'fixtures', 'clarity-corpus.json');

/** His screenshot, 2026-10-20: the lit piece opens it, the KJV paragraph follows. Verbatim. */
export const SCREENSHOT_TEXT = '" (Leviticus 19:34) This week teaches what an education IS before it argues about how long one should be - and names plainly that we read a digest, not one full article. KJV: "But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil." (Hebrews 5:14) That is the architecture of this week. A person\'s discernment is a trained capacity, and training is time spent doing the thing under somebody who already can. So an education is not a product with a price and a delivery date; it is a forming with a clock in it, and the clock cannot be bought out. Around that one sentence stand the week\'s other anchors. Luke 2:52 shows the pattern on the Lord Jesus Himself - increase over time, in four directions at once.';

/** The three pieces photographed on 2026-10-09 (DR-0851), verbatim. */
export const PHOTOGRAPHED = [
  'Rendered for meaning: reading the Word for the Spirit; doing the Word for competent conversations and learning skills; and never reading just to say I got you,',
  "(Matthew 7:21) A reading done to win produces a person who can quote and cannot follow, and that is not a small defect; by the Lord's words it can be the whole defect.",
  'Change why you open the Book, and say the reason out loud before each reading: not to say I got you, but to become a better person His Way, and then to do His Way.',
];

export const LONGEST_N = 20;
export const CITATION_LED_N = 10;
export const ORDINARY_N = 16;
export const ORDINARY_MAX_WORDS = 12;

const spokenOf = (written) => forSynthesis(toSpokenForm(written));
const entry = (group, source, written, i) => ({
  id: `${group}-${String(i + 1).padStart(2, '0')}`,
  group,
  source,
  written,
  spoken: spokenOf(written),
  longestSentenceWords: longestSentenceWords(toSpokenForm(written)),
});

/** Every piece of every Living Lesson, in catalog order, with its lesson id. */
export function catalogPieces(modules = LIVING_LESSONS_MODULES) {
  const out = [];
  for (const L of modules) {
    for (const c of chunkForClips(L.lesson)) out.push({ lesson: L.id, written: c.text });
  }
  return out;
}

/** The corpus, deterministic for a given catalog. */
export function buildCorpus(modules = LIVING_LESSONS_MODULES) {
  const all = catalogPieces(modules);
  const seen = new Set();
  // Takes the first n pieces not yet in the corpus, marking ONLY those taken
  // (a filter over the whole list would mark every piece as seen).
  const take = (list, n) => {
    const out = [];
    for (const p of list) {
      if (out.length >= n) break;
      if (seen.has(p.written)) continue;
      seen.add(p.written); out.push(p);
    }
    return out;
  };

  const screenshot = chunkForClips(SCREENSHOT_TEXT).map((c, i) => entry('screenshot', 'Living Lessons week digest, 2026-10-20 screenshot', c.text, i));
  const photographed = PHOTOGRAPHED.map((t, i) => entry('photographed', 'L227 pieces photographed 2026-10-09 (DR-0851)', t, i));
  for (const e of [...screenshot, ...photographed]) seen.add(e.written);

  const scored = all.map((p) => ({ ...p, n: longestSentenceWords(toSpokenForm(p.written)) }));
  // longest first; ties in catalog order (sort is stable)
  const longest = take([...scored].sort((a, b) => b.n - a.n), LONGEST_N)
    .map((p, i) => entry('longest', p.lesson, p.written, i));

  // Opens on a quotation mark and a reference, and carries a sentence of its own after it.
  const citationLed = take(scored.filter((p) => /^["']?\s*\([1-3]?\s?[A-Z][a-z]+ \d[^)]*\)\s+[A-Za-z]/.test(p.written) && p.written.length >= 80), CITATION_LED_N)
    .map((p, i) => entry('citation-led', p.lesson, p.written, i));

  const plain = scored.filter((p) => p.n <= ORDINARY_MAX_WORDS && p.written.length >= 60 && !seen.has(p.written));
  const step = Math.max(1, Math.floor(plain.length / ORDINARY_N));
  const ordinary = take(plain.filter((_, i) => i % step === 0), ORDINARY_N)
    .map((p, i) => entry('ordinary', p.lesson, p.written, i));

  return {
    about: 'Pieces as the reader cuts them (chunkForClips) and as the voice is handed them (forSynthesis(toSpokenForm())). Regenerated by scripts/voice-clarity-corpus.mjs; pinned by a test. DR-1130.',
    catalogPieces: all.length,
    pieces: [...screenshot, ...photographed, ...longest, ...citationLed, ...ordinary],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const corpus = buildCorpus();
  if (process.argv.includes('--write')) {
    writeFileSync(FIXTURE, `${JSON.stringify(corpus, null, 2)}\n`);
    console.log(`wrote ${corpus.pieces.length} pieces (of ${corpus.catalogPieces} in the catalog) to ${FIXTURE}`);
  } else {
    for (const p of corpus.pieces) console.log(`${p.id}\t${p.longestSentenceWords}w\t${p.spoken}`);
  }
}
