// =============================================================================
// third-witness tests — the 3rd-dimension witness catalog stays honest
// =============================================================================
// Darrell 2026-07-03: "All experts cited however Yahweh's Perspectives are 4th
// dimensional so we mix with high quality 3rd-dimensional data and information
// intertwined for Yahweh's Way to make even more sense."
// The gates: every source fully cited (no anonymous "studies show"), every
// verse verbatim from the verified fetch (never model memory), every pair
// carrying both sides of the intertwine.
import { describe, it, expect } from 'vitest';
import { WITNESS_SOURCES, WITNESS_TAGLINE, witnessVerse, witnessClientModule } from '../lib/third-witness.js';
import { TLC_LESSON_TRACKS } from '../lib/tlc-lessons.js';

const allPairs = WITNESS_SOURCES.flatMap((s) => s.pairs);

// The separation lives in the Practice ONLY (the study room stays mixed, per
// Darrell): the clinical module must carry NO Scripture marks. A leak fails
// the build. (Case-insensitive on purpose — proven-to-catch found capitalized
// names slipping a case-sensitive draft.)
const SCRIPTURE_MARKS = /KJV|verse|scripture|yahweh|jesus|christ|bible|\b(?:[1-3]\s)?[a-z]+\s\d+:\d+/i;

describe('third-witness: citation integrity (honour to whom honour)', () => {
  it('every source names its expert, credential, and work — no anonymous science', () => {
    for (const s of WITNESS_SOURCES) {
      expect(s.source.expert, s.id).toBeTruthy();
      expect(s.source.credential, s.id).toBeTruthy();
      expect(s.source.work, s.id).toBeTruthy();
    }
  });

  it('every pair cites where in the work its claim lives', () => {
    for (const p of allPairs) expect(p.cite, p.id).toBeTruthy();
  });
});

describe('third-witness: verse truth (DR-0076 — never from memory)', () => {
  it('every ref resolves to verbatim KJV text from the verified fetch', () => {
    for (const p of allPairs) {
      for (const r of p.refs) {
        expect(witnessVerse(r), `${p.id}: ${r} has no fetched text`).toBeTruthy();
      }
    }
  });

  it('spot-check: Proverbs 13:12 carries the hope-deferred text verbatim', () => {
    expect(witnessVerse('Proverbs 13:12')).toBe(
      'Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.',
    );
  });

  it('spot-check: Proverbs 24:16 carries the falls-seven-times text verbatim', () => {
    expect(witnessVerse('Proverbs 24:16')).toContain('For a just man falleth seven times, and riseth up again');
  });
});

describe('third-witness: shape (both sides of the intertwine present)', () => {
  it('ids are unique across sources and pairs', () => {
    const ids = [...WITNESS_SOURCES.map((s) => s.id), ...allPairs.map((p) => p.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every pair holds a 3rd-dimensional claim, at least one ref, and the bridge', () => {
    for (const p of allPairs) {
      expect(p.claim, p.id).toBeTruthy();
      expect(p.refs.length, p.id).toBeGreaterThan(0);
      expect(p.bridge, p.id).toBeTruthy();
    }
  });

  it('the tagline carries the 4th-dimensional framing (Isaiah 55 posture)', () => {
    expect(WITNESS_TAGLINE).toMatch(/4th-dimensional/);
    expect(WITNESS_TAGLINE).toMatch(/heavens/);
  });

  it('the seed source is the Dr. Tracey Marks setback-neuroscience witness, fully paired', () => {
    const seed = WITNESS_SOURCES.find((s) => s.id === 'w3-setback-neuroscience');
    expect(seed).toBeTruthy();
    expect(seed.source.expert).toBe('Dr. Tracey Marks');
    expect(seed.pairs.length).toBeGreaterThanOrEqual(9);
  });
});

describe('third-witness: the separation is for the Practice ONLY (the study room stays mixed)', () => {
  it('the study room content is the mixture: every pair keeps its claim AND its bridge', () => {
    for (const p of allPairs) {
      expect(p.claim, p.id).toBeTruthy();
      expect(p.bridge, p.id).toBeTruthy();
      expect(p.word, `${p.id} carries a word-only rendering — the study room stays mixed; the separation lives in Practice`).toBeUndefined();
    }
  });

  it('the Practice client module carries NO Scripture — the separation for those who don\'t want the mixture', () => {
    const mod = witnessClientModule();
    for (const [lvl, text] of Object.entries(mod.levels)) {
      expect(text, `client module ${lvl} leaks Scripture into the clinical space`).not.toMatch(SCRIPTURE_MARKS);
    }
    expect(mod.bigIdea).not.toMatch(/Yahweh|Jesus|Scripture|KJV/);
  });

  it('the Practice client module reaches all learner levels (child through senior) with a valid quiz', () => {
    const mod = witnessClientModule();
    for (const lvl of ['child', 'teen', 'standard', 'senior']) {
      expect(mod.levels[lvl], `client module missing ${lvl} level`).toBeTruthy();
    }
    for (const q of mod.quiz.questions) {
      expect(q.options[q.answer], mod.id).toBeTruthy();
      expect(q.explain, mod.id).toBeTruthy();
    }
    expect(mod.source).toContain('Dr. Tracey Marks');
  });

  it('the client module actually ships in the TLC client track (same content for Practice)', () => {
    const ids = TLC_LESSON_TRACKS.client.modules.map((m) => m.id);
    expect(ids).toContain('cl4-bouncing-back-setbacks');
  });
});
