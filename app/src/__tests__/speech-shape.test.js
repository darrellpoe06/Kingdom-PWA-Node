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
