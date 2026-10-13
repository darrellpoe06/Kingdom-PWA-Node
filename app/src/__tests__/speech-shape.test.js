// =============================================================================
// Sounding like a person: what we hand the engine, not which engine we use
// =============================================================================
// Darrell 2026-09-13: "the text to speak aspect needs to be better at the words
// sounds... can we get close to humans when talking or do we still have to
// sound like a computer no offense?"
//
// The honest finding is that most of what sounded mechanical was OUR TEXT, not
// the voice. Four faults, all fixable without changing one displayed word:
//   1. segmentText split on . ! ? then word-wrapped a long sentence at whatever
//      word crossed 180 chars — a hard stop mid-clause. Nobody breathes there.
//   2. The house style writes lead clauses in capitals (313 of them, measured).
//      Engines spell some ALL-CAPS runs letter by letter.
//   3. "1 John 1:8" read as "one John one COLON eight".
//   4. Em-dashes, curly quotes and ellipses flatten the prosody.
//
// THE BRIGHT LINE: shaping changes how a thing SOUNDS, never what is said, and
// never what is displayed. The word-sequence test below is that gate.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  softenShouting, plainTypography, shapeForSpeech, clauseSegments, speechSegments, wordSequence,
} from '../lib/speech-shape.js';
import { segmentText } from '../lib/tts.js';
import { toSpokenForm } from '../lib/speech-text.js';

describe('shouting is lowered for the VOICE, never for the screen', () => {
  it('a shouted lead clause becomes ordinary sentence case', () => {
    expect(softenShouting('THE DIRECTIVE. He named it.')).toBe('The directive. He named it.');
  });

  it('keeps translation badges and real initialisms as letters', () => {
    expect(softenShouting('Quoted ESV and KJV here')).toContain('ESV');
    expect(softenShouting('THE WORD, ESV')).toMatch(/ESV/);
  });

  it('leaves a single capitalised word alone — that is not shouting', () => {
    expect(softenShouting('Yahweh is the Father')).toBe('Yahweh is the Father');
    expect(softenShouting('GOD')).toBe('GOD');
  });

  it('does not touch ordinary Title Case prose', () => {
    const s = 'The Church of the Living God met on Sunday';
    expect(softenShouting(s)).toBe(s);
  });
});

describe('typography the engine mishandles', () => {
  it('an em-dash becomes a real breath instead of a spoken word', () => {
    expect(plainTypography('the point — and this is it')).toBe('the point, and this is it');
  });

  it('curly quotes and ellipses are flattened', () => {
    expect(plainTypography('“quoted” and…')).toBe('"quoted" and.');
  });
});

describe('references are NOT handled here — one registry, not two', () => {
  it('speech-text.js owns them, and does it better than a second copy would', () => {
    expect(toSpokenForm('1 John 1:8')).toMatch(/1st John chapter 1 verse 8/);
    expect(toSpokenForm('Psalm 40:6')).toMatch(/Psalm 40 verse 6/);
  });

  it('shapeForSpeech leaves a colon alone, because it is not its job', () => {
    expect(shapeForSpeech('John 1:8')).toContain(':');
  });

  it('the two compose in the engine: references FIRST, then shouting', () => {
    // Lowering first would hide "1 JOHN" from the reference matcher entirely.
    expect(toSpokenForm('READ 1 JOHN 1:8 NOW')).toMatch(/1st John chapter 1 verse 8/i);
  });
});

describe('segments end where a person breathes', () => {
  const long = 'Paul says the thing plainly and at length, because the English word has drifted '
    + 'badly over four centuries of ordinary use, so the reader who meets it today hears '
    + 'something the writer never said, which is the whole difficulty.';

  it('cuts at a clause boundary, not at whatever word crossed the limit', () => {
    const segs = clauseSegments(long, 90);
    expect(segs.length).toBeGreaterThan(1);
    for (const s of segs.slice(0, -1)) {
      expect(s, `segment ends mid-phrase: "${s}"`).toMatch(/[,;:]$|[.!?]$|\b(?=\w)/);
    }
  });

  it('never ends a segment on a dangling conjunction', () => {
    for (const s of clauseSegments(long, 90)) {
      expect(s.trim(), `dangling conjunction: "${s}"`).not.toMatch(/\b(and|but|so|because|which|when|where|while)$/i);
    }
  });

  it('no segment exceeds the engine limit', () => {
    for (const s of clauseSegments(long, 90)) expect(s.length).toBeLessThanOrEqual(120);
  });
});

describe('THE GATE: follow-along still finds every segment in the page text', () => {
  const page = 'THE DIRECTIVE. Paul says "if we say we have no sin" (1 John 1:8, ESV) — and that '
    + 'is the point, because the English word has drifted badly over four centuries of use.';

  it('every segment is an EXACT substring of the displayed text', () => {
    // read-follow.js locates each segment with indexOf. A shaped segment would
    // return -1 and the highlight would silently stop — nothing would fail
    // loudly. This is the assertion that keeps splitting and shaping apart.
    const norm = page.replace(/\s+/g, ' ').trim();
    for (const s of segmentText(page)) {
      expect(norm.includes(s), `segment not found in page text: "${s}"`).toBe(true);
    }
  });

  it('segmentText and clauseSegments agree, so tts and read-follow cannot drift', () => {
    expect(segmentText(page, 90)).toEqual(clauseSegments(page, 90));
  });
});

describe('THE GATE: shaping changes sound, never words', () => {
  const samples = [
    'THE DIRECTIVE. He named it and stated the reason.',
    'Paul says "if we say we have no sin, we deceive ourselves" — and that settles it.',
    'AND IT ANSWERS WHY PEOPLE QUESTION HIM AT ALL, which is the point.',
  ];

  it('the word sequence survives shaping unchanged', () => {
    for (const s of samples) {
      expect(wordSequence(shapeForSpeech(s)), `words changed for: ${s}`).toEqual(wordSequence(s));
    }
  });

  it('the word sequence survives SEGMENTING unchanged', () => {
    for (const s of samples) {
      expect(wordSequence(speechSegments(s, 60).join(' '))).toEqual(wordSequence(s));
    }
  });

  it('nothing is dropped when the text is one long unbroken run', () => {
    const run = 'word '.repeat(80).trim();
    expect(wordSequence(clauseSegments(run, 50).join(' '))).toEqual(wordSequence(run));
  });
});

// =============================================================================
// A SHOUT DOES NOT STOP AT A COMMA (2026-10-08)
// =============================================================================
// Darrell, on lesson L218: "At this exact spot in this lesson... the voice keeps
// failing and it sounds garbled... can't distinguish the words... It's happening
// in multiple places in most lessons... a paragraph or a few that don't work
// well and is incoherent."
//
// Located, not guessed. The spot is the utterance "FIRST, DO NOT SWITCH UP."
// The old run pattern required two or more capitalised words separated by
// WHITESPACE, so the comma ended the run and FIRST was handed to the engine
// still shouting — which several engines spell letter by letter. Measured
// through the real pipeline before the fix: 214 of 215 catalog modules, 3,676
// places, 13,557 occurrences. After: zero.
//
// Each case below fails on the pre-fix code. That is the point of them.
// =============================================================================
describe('a shout crosses punctuation, and a lone shouted word is still a shout', () => {
  it('the L218 utterance is fully softened, comma and all', () => {
    // The exact string Darrell was listening to when the voice garbled.
    expect(toSpokenForm('FIRST, DO NOT SWITCH UP.')).toBe('First, do not switch up.');
  });

  it('a shout crosses a comma, a semicolon, a colon and a dash', () => {
    expect(softenShouting('NOTICE, TEST; CAPTURE: REDIRECT')).toBe('Notice, test; capture: redirect');
    expect(softenShouting('EIGHT — PSYOPS, AND KNOWN BY LOVE')).toBe('Eight — psyops, and known by love');
  });

  it('a whole shouted sentence crosses its own commas', () => {
    // Real, from the creation lesson: the house style shouts the entire line.
    // Whitespace-only runs leave "SEA" shouting in the middle of it, because a
    // lone three-letter token cannot be told from an initialism by length.
    expect(softenShouting('FIFTH, DAY THREE: LAND, SEA, AND PLANTS.'))
      .toBe('Fifth, day three: land, sea, and plants.');
  });

  it('the separators come back EXACTLY — none is turned into a space', () => {
    // The pre-fix body did split(/\s+/) + join(' '), which was safe only while
    // whitespace was the only separator. Widening with that body would have
    // deleted every comma in the run.
    const out = softenShouting('ONE, TWO;  THREE:   FOUR');
    expect(out).toBe('One, two;  three:   four');
  });

  it('a lone shouted word of four letters or more is softened', () => {
    expect(softenShouting('the TEST is the filter')).toBe('the test is the filter');
    expect(softenShouting('OCCASION is the word Paul uses')).toBe('Occasion is the word Paul uses');
  });

  it('a lone shouted SHORT word is softened when it is a word, by name', () => {
    expect(softenShouting('the Spirit AND the Word')).toBe('the Spirit and the Word');
    expect(softenShouting('Take ONE real rest')).toBe('Take one real rest');
    expect(softenShouting('SIX. Ask for a fair check.')).toBe('Six. Ask for a fair check.');
  });

  it('a real initialism survives, alone and inside a softened run', () => {
    expect(softenShouting('In 586 BC, AND IN AD 70')).toBe('In 586 BC, and in AD 70');
    expect(softenShouting('Read the ESV, KJV AND NIV')).toBe('Read the ESV, KJV and NIV');
    expect(softenShouting('logged to DR-0076 AND THE LEDGER')).toBe('logged to DR-0076 and the ledger');
    expect(softenShouting('Spiritual intelligence (SI), not ours')).toBe('Spiritual intelligence (SI), not ours');
    expect(softenShouting('THE NAS IS SOVEREIGN')).toBe('The NAS is sovereign');
  });

  it('a short token that is neither a listed word nor a known initialism is left alone', () => {
    // The safe direction: read it as written rather than mangle it.
    expect(softenShouting('the XYQ reading')).toBe('the XYQ reading');
  });

  it('a capital is kept only where a sentence opens', () => {
    expect(softenShouting('THE DIRECTIVE. He named it.')).toBe('The directive. He named it.');
    expect(softenShouting('He named THE DIRECTIVE today.')).toBe('He named the directive today.');
  });

  it('the words are unchanged by every one of these', () => {
    const samples = [
      'FIRST, DO NOT SWITCH UP.',
      'NOTICE, TEST; CAPTURE: REDIRECT',
      'In 586 BC, AND IN AD 70',
      'SIX. Ask for a fair check.',
    ];
    for (const s of samples) {
      expect(wordSequence(softenShouting(s)), `words changed for: ${s}`).toEqual(wordSequence(s));
    }
  });
});
