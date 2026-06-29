// =============================================================================
// scriptures + scripture-teaching — proven-to-catch gate (DR-0076 Verification
// Doctrine). What is tested here is Yahweh's Word; the gate exists so a broken
// reference, a fabricated verse, a dangling cross-reference, a malformed test
// answer, or a privacy regression FAILS the build rather than shipping.
// =============================================================================
// Each block asserts the catch (the property AND that a violation is caught):
//   1. ACCURACY — every curated reference resolves to real verified KJV text;
//      kjvText returns null for an unknown ref (no silent fabrication).
//   2. INTEGRITY — every theme has the lens (perspective/heart/love), the soul
//      aim, three depth tiers, verses, and verified tests; every `backs` id and
//      every evenhanded `view` scripture is real.
//   3. TESTS — every retention question’s answer index is in range and its cited
//      ref resolves (you cannot test the Word against a verse that isn’t there).
//   4. DEPTH — resolveDepth never returns empty; fit-to-budget keeps the core.
//   5. PERSONALIZATION — consent gates ranking; no consent preserves order.
//   6. SPACED REPETITION + GRADING — Leitner advance/reset; mastery vs pass.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  KJV, THEMES, SURFACES, VERSE_ROLES,
  kjvText, hasVerse, normalizeRef, allVerses, findByRef, versesForSurface,
  versesForTheme, crossRefsFor, searchVerses, readOnline, exportLibraryMarkdown,
} from '../lib/scriptures.js';
import {
  DEPTH_TIERS, EXPERIENCE_LEVELS, GOVERNING_LENS,
  resolveDepth, fitDepthToBudget, resolveLevel,
  rankByInterest, interestScore,
  gradeTest, encouragement, nextBox, reviewIntervalDays, dueForReview, reviewCardAfter,
  MASTERY_RATIO, PASS_RATIO,
} from '../lib/scripture-teaching.js';

const surfaceIds = new Set(Object.keys(SURFACES));

describe('accuracy — verified KJV text only, no fabrication', () => {
  it('has a substantial, verified verse set', () => {
    expect(Object.keys(KJV).length).toBeGreaterThanOrEqual(150);
  });

  it('every curated theme verse resolves to real KJV text', () => {
    const unresolved = [];
    for (const t of THEMES) for (const v of t.verses) if (!kjvText(v.ref)) unresolved.push(`${t.id}:${v.ref}`);
    expect(unresolved).toEqual([]);
  });

  it('kjvText returns null for an unknown reference (no silent fabrication)', () => {
    expect(kjvText('Hezekiah 3:16')).toBeNull();
    expect(hasVerse('John 3:16')).toBe(true);
  });

  it('normalizeRef folds the Psalms/Psalm book-name variant', () => {
    expect(normalizeRef('Psalms 23:1')).toBe('Psalm 23:1');
    // a sermon citing the singular form still resolves
    expect(kjvText('Psalm 34:3')).toEqual(KJV['Psalm 34:3']);
  });

  it('no verse text is an empty/placeholder string', () => {
    for (const [ref, text] of Object.entries(KJV)) {
      expect(typeof text, ref).toBe('string');
      expect(text.trim().length, ref).toBeGreaterThan(0);
    }
  });
});

describe('integrity — every theme carries the lens, soul, depths, and clean cross-references', () => {
  it('each theme has the full lens (His perspective / heart / love) and a soul aim', () => {
    for (const t of THEMES) {
      expect(t.lens && t.lens.perspective && t.lens.heart && t.lens.love, t.id).toBeTruthy();
      expect(t.soul, t.id).toBeTruthy();
    }
  });

  it('each theme has all three depth tiers authored', () => {
    for (const t of THEMES) {
      expect(t.depths && t.depths.essential && t.depths.standard && t.depths.deep, t.id).toBeTruthy();
    }
  });

  it('every theme `backs` and verse `backs` references a real surface', () => {
    const bad = [];
    for (const t of THEMES) {
      for (const s of (t.surfaces || [])) if (!surfaceIds.has(s)) bad.push(`${t.id} theme:${s}`);
      for (const v of t.verses) for (const s of (v.backs || [])) if (!surfaceIds.has(s)) bad.push(`${t.id} ${v.ref}:${s}`);
    }
    expect(bad).toEqual([]);
  });

  it('every evenhanded view cites real, resolvable scripture', () => {
    for (const t of THEMES) {
      for (const view of (t.views || [])) {
        for (const s of (view.scriptures || [])) expect(kjvText(s), `${t.id}/${view.name}/${s}`).toBeTruthy();
      }
    }
  });

  it('every verse role is a known role', () => {
    for (const t of THEMES) for (const v of t.verses) expect(VERSE_ROLES[v.role || 'truth'], `${t.id}:${v.ref}`).toBeTruthy();
  });

  it('the high-sensitivity themes are handled evenhandedly with a textual-honesty note', () => {
    const godhead = THEMES.find((t) => t.id === 'the-godhead');
    expect(godhead.views.length).toBeGreaterThanOrEqual(2); // Trinitarian + Oneness, presented fairly
    expect(godhead.textNote.toLowerCase()).toContain('comma'); // Comma Johanneum flagged honestly
    const grace = THEMES.find((t) => t.id === 'grace-and-truth');
    expect(grace.views.length).toBeGreaterThanOrEqual(2); // main hell views presented fairly
  });

  it('the governing lens carries grace-and-truth, no-condemnation, and the souls telos', () => {
    expect(GOVERNING_LENS.graceAndTruth).toBeTruthy();
    expect(GOVERNING_LENS.noCondemnation.toLowerCase()).toContain('condemn');
    expect(GOVERNING_LENS.soulsTelos.toLowerCase()).toContain('soul');
  });
});

describe('retention tests — verified answers, never against a missing verse', () => {
  it('every theme ships at least one comprehension question', () => {
    for (const t of THEMES) expect((t.tests && t.tests.questions || []).length, t.id).toBeGreaterThanOrEqual(1);
  });

  it('every test answer index is in range and every cited ref resolves', () => {
    for (const t of THEMES) {
      for (const q of (t.tests.questions || [])) {
        expect(Array.isArray(q.options) && q.options.length >= 2, `${t.id}:${q.q}`).toBe(true);
        expect(q.answer, `${t.id}:${q.q}`).toBeGreaterThanOrEqual(0);
        expect(q.answer, `${t.id}:${q.q}`).toBeLessThan(q.options.length);
        if (q.ref) expect(kjvText(q.ref), `${t.id}:${q.ref}`).toBeTruthy();
      }
    }
  });

  it('grades correctly and distinguishes mastery from a pass', () => {
    const test = { questions: [{ q: 'a', options: ['x', 'y'], answer: 1 }, { q: 'b', options: ['x', 'y'], answer: 0 }, { q: 'c', options: ['x', 'y'], answer: 1 }, { q: 'd', options: ['x', 'y'], answer: 0 }, { q: 'e', options: ['x', 'y'], answer: 1 }] };
    const perfect = gradeTest(test, { 0: 1, 1: 0, 2: 1, 3: 0, 4: 1 });
    expect(perfect.pct).toBe(100);
    expect(perfect.mastered).toBe(true);
    const partial = gradeTest(test, { 0: 1, 1: 0, 2: 1, 3: 1, 4: 0 }); // 3/5 = 60%
    expect(partial.passed).toBe(false);
    expect(MASTERY_RATIO).toBeGreaterThan(PASS_RATIO);
  });

  it('feedback is encouraging, never punitive — even for a zero', () => {
    const zero = encouragement(gradeTest({ questions: [{ q: 'a', options: ['x', 'y'], answer: 1 }] }, { 0: 0 }));
    expect(zero.toLowerCase()).toContain('another try');
    expect(zero.toLowerCase()).not.toContain('fail');
  });
});

describe('depth tiers — adaptive, core meaning never dropped', () => {
  it('resolveDepth returns the requested tier and never empty', () => {
    const t = THEMES[0];
    for (const tier of DEPTH_TIERS) {
      const r = resolveDepth(t, tier.id);
      expect(r.text.trim().length, tier.id).toBeGreaterThan(0);
    }
  });

  it('resolveDepth falls back without returning empty for a bad tier', () => {
    const r = resolveDepth(THEMES[0], 'nonsense');
    expect(r.text.trim().length).toBeGreaterThan(0);
  });

  it('fit-to-budget picks the richest tier that fits, and still returns core when budget is tiny', () => {
    const t = THEMES[0];
    const big = fitDepthToBudget(t, 100000);
    expect(big.tierId).toBe('deep'); // richest fits a huge budget
    const tiny = fitDepthToBudget(t, 5);
    expect(tiny.text.trim().length).toBeGreaterThan(0); // essential floor — core preserved
  });

  it('resolveLevel returns a non-empty framing for every experience level', () => {
    for (const t of THEMES) for (const l of EXPERIENCE_LEVELS) {
      expect(resolveLevel(t, l.id).text.trim().length, `${t.id}/${l.id}`).toBeGreaterThan(0);
    }
  });
});

describe('personalization — consented + owner-scoped, served not surveilled', () => {
  it('no consent preserves the authored order (no surveillance reorder)', () => {
    const ranked = rankByInterest(THEMES, { consented: false, interests: ['worship'] });
    expect(ranked.map((t) => t.id)).toEqual(THEMES.map((t) => t.id));
  });

  it('consent + a matching interest surfaces that theme first', () => {
    const ranked = rankByInterest(THEMES, { consented: true, interests: ['worship'], youtube: [] });
    expect(ranked[0].id).toBe('worship');
  });

  it('a YouTube viewing signal feeds the same ranking', () => {
    const ranked = rankByInterest(THEMES, { consented: true, interests: [], youtube: [{ topic: 'suffering', weight: 5 }] });
    expect(ranked[0].id).toBe('suffering-for-him');
  });

  it('interestScore is zero without consent (no signal leaks)', () => {
    const worship = THEMES.find((t) => t.id === 'worship');
    expect(interestScore(worship, { consented: false, interests: ['worship'] })).toBe(0);
  });
});

describe('spaced repetition — Leitner, gentle (missed → more reps, not punishment)', () => {
  it('a correct recall advances the box; a miss resets to daily', () => {
    expect(nextBox(0, true)).toBe(1);
    expect(nextBox(3, true)).toBe(4);
    expect(nextBox(4, false)).toBe(0);
  });

  it('higher boxes are reviewed less often (the Word held long-term)', () => {
    expect(reviewIntervalDays(1)).toBeLessThan(reviewIntervalDays(5));
  });

  it('a new/never-reviewed card is due now', () => {
    expect(dueForReview(null, 0)).toBe(true);
    const card = reviewCardAfter(null, true, 1000);
    expect(card.box).toBe(1);
    expect(dueForReview(card, 1000)).toBe(false); // not yet due
    expect(dueForReview(card, 1000 + 2 * 86400000)).toBe(true); // due after the interval
  });
});

describe('helpers — resolve, cross-reference, search, links, export', () => {
  it('findByRef returns every theme a reference lives in (cross-reference overlap)', () => {
    const cols = findByRef('Colossians 3:23'); // worship + wisdom-skill
    const themes = new Set(cols.map((v) => v.themeId));
    expect(themes.size).toBeGreaterThanOrEqual(2);
  });

  it('crossRefsFor returns related verses and excludes the verse itself', () => {
    const cr = crossRefsFor('John 3:16');
    expect(cr.length).toBeGreaterThan(0);
    expect(cr.every((v) => normalizeRef(v.ref) !== 'John 3:16')).toBe(true);
  });

  it('versesForSurface and versesForTheme return resolved text', () => {
    expect(versesForSurface('choir').length).toBeGreaterThan(0);
    const wt = versesForTheme('worship');
    expect(wt.length).toBeGreaterThan(0);
    expect(wt.every((v) => typeof v.kjv === 'string' && v.kjv.length)).toBe(true);
  });

  it('search spans reference, theme, gloss, and verse text', () => {
    expect(searchVerses('joyful').some((v) => v.ref.startsWith('Psalm 100'))).toBe(true);
    expect(searchVerses('born again').some((v) => v.ref === 'John 3:3')).toBe(true);
  });

  it('readOnline links to a copyrighted translation rather than reproducing it', () => {
    const url = readOnline('John 3:16', 'ESV');
    expect(url).toContain('biblegateway.com');
    expect(url).toContain('ESV');
  });

  it('exportLibraryMarkdown renders every theme with its verified KJV text', () => {
    const md = exportLibraryMarkdown();
    expect(md).toContain('# Scripture Library');
    for (const t of THEMES) expect(md, t.id).toContain(t.title);
    expect(md).toContain('Public Domain');
    // a known verse text appears verbatim
    expect(md).toContain('For God so loved the world');
  });

  it('allVerses carries resolved text + role + theme for every curated entry', () => {
    const all = allVerses();
    expect(all.length).toBeGreaterThan(150);
    expect(all.every((v) => typeof v.kjv === 'string' && v.kjv.length && v.themeId && v.role)).toBe(true);
  });
});
