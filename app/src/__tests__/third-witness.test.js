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
import { WITNESS_SOURCES, WITNESS_TAGLINE, witnessVerse, witnessClientModule, witnessWellnessModule, witnessClientModules, witnessScienceOnly } from '../lib/third-witness.js';
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

describe('third-witness: the fasting cluster (2026-07-04) is present and balanced', () => {
  const clusterIds = [
    'w3-tre-circadian', 'w3-therapeutic-fasting', 'w3-fasting-brain',
    'w3-water-fasting-supervised', 'w3-fasting-timeline', 'w3-fasting-as-discipline',
    'w3-women-fueling-counter',
  ];

  it('all seven fasting sources are present, each fully cited and paired', () => {
    for (const id of clusterIds) {
      const s = WITNESS_SOURCES.find((x) => x.id === id);
      expect(s, `${id} missing`).toBeTruthy();
      expect(s.source.expert, id).toBeTruthy();
      expect(s.pairs.length, id).toBeGreaterThan(0);
    }
  });

  it('carries the Dr. Stacy Sims COUNTER-witness so the mixture is never a one-size law', () => {
    const counter = WITNESS_SOURCES.find((s) => s.id === 'w3-women-fueling-counter');
    expect(counter).toBeTruthy();
    expect(counter.source.expert).toBe('Dr. Stacy Sims');
    // The counter-witness must name fueling / eating as the wiser move for some
    // bodies — Elijah's "arise and eat" is the anchor.
    const arise = counter.pairs.find((p) => p.refs.includes('1 Kings 19:5-8'));
    expect(arise, 'the arise-and-eat counter-pair').toBeTruthy();
  });
});

describe('third-witness: witnessScienceOnly is the separation (science only, expert still cited)', () => {
  it('every source renders a science-only view carrying NO Scripture, all claims + cites kept', () => {
    for (const src of WITNESS_SOURCES) {
      const sci = witnessScienceOnly(src);
      // expert credit survives the separation (honour to whom honour)
      expect(sci.source.expert, src.id).toBeTruthy();
      expect(sci.points.length, src.id).toBe(src.pairs.length);
      // no Scripture rides along — not in topic, summary, or any point
      expect(sci.topic, `${src.id} topic leaks Scripture`).not.toMatch(SCRIPTURE_MARKS);
      expect(sci.summary, `${src.id} summary leaks Scripture`).not.toMatch(SCRIPTURE_MARKS);
      for (const pt of sci.points) {
        expect(pt.claim, `${src.id}/${pt.id} claim`).toBeTruthy();
        expect(pt.cite, `${src.id}/${pt.id} cite`).toBeTruthy();
        expect(pt.claim, `${src.id}/${pt.id} claim leaks Scripture`).not.toMatch(SCRIPTURE_MARKS);
        // the separation drops the bridge and the verses entirely
        expect(pt.bridge, `${src.id}/${pt.id} keeps a bridge`).toBeUndefined();
        expect(pt.refs, `${src.id}/${pt.id} keeps refs`).toBeUndefined();
      }
    }
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

describe('third-witness: inform, don\'t guard (2026-07-04) — wellness is OFFERED to clients', () => {
  it('the metabolic-wellness module carries NO Scripture and reaches all learner levels', () => {
    const mod = witnessWellnessModule();
    for (const lvl of ['child', 'teen', 'standard', 'senior']) {
      expect(mod.levels[lvl], `wellness module missing ${lvl} level`).toBeTruthy();
      expect(mod.levels[lvl], `wellness ${lvl} leaks Scripture into the clinical space`).not.toMatch(SCRIPTURE_MARKS);
    }
    expect(mod.bigIdea).not.toMatch(/Yahweh|Jesus|Scripture|KJV/);
  });

  it('safety is by INFORMING, not guarding: every level names the physician + the counter-view is present', () => {
    const mod = witnessWellnessModule();
    // consult-your-physician frame is on the module and reachable
    expect(mod.bigIdea.toLowerCase()).toContain('physician');
    for (const lvl of ['standard', 'senior']) {
      expect(mod.levels[lvl].toLowerCase(), `${lvl} should point to a doctor/physician`).toMatch(/physician|doctor/);
    }
    // the counter-view (fueling can beat fasting) is carried so it is never one-size
    const quizText = JSON.stringify(mod.quiz).toLowerCase();
    expect(quizText).toMatch(/suboptimal|harmful|fuel/);
  });

  it('BOTH witness modules (setback + wellness) are offered in the TLC client track', () => {
    expect(witnessClientModules().map((m) => m.id)).toEqual([
      'cl4-bouncing-back-setbacks', 'cl5-metabolic-wellness-informed',
    ]);
    const ids = TLC_LESSON_TRACKS.client.modules.map((m) => m.id);
    expect(ids).toContain('cl4-bouncing-back-setbacks');
    expect(ids).toContain('cl5-metabolic-wellness-informed');
  });
});
