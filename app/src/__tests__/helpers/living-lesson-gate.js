// =============================================================================
// living-lesson-gate — the per-lesson gate every new Living Lesson shares (DR-1477)
// =============================================================================
// L305, L306, L307 and L308 each carried ~500 lines of test, most of them the
// same checks copied whole: spine verses in every band, the verbatim quote
// sweep with its own count, band shares and overlap, the reading ladder, our
// voice naming Yahweh, the three talk-together directions per band, and
// Darrell's words never put in double quotes. This module holds those checks
// once, as pure functions that return faults, and `livingLessonGate()` turns
// them into a describe block. A new lesson's test is then a few lines naming its
// spine, plus whatever is particular to that lesson.
//
// The existing L302–L308 tests are NOT rewritten onto it; only new lessons use
// it (scripts/new-lesson.mjs writes the test that calls it).
// living-lesson-gate.test.js plants each defect and proves each check names it.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, buildLivingLessonsSchedule } from '../../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../../scripts/band-differentiation.mjs';
import { placesMissingDirections } from '../../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../../scripts/quotation-integrity.mjs';

export const BANDS = ['child', 'youth', 'teen', 'senior'];
const KJV = join(__dirname, '..', '..', '..', 'public', 'bible', 'kjv');

// ---------------------------------------------------------------------------
// Reading the corpus and the quotations (L301's helpers, as L305–L308 copy them)
// ---------------------------------------------------------------------------
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}

/** The corpus text of a reference ("Romans 2:14-15; John 3:16"), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}

/** Every double-quoted span and the reference that follows it, split on the quote character (DR-1258). */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}

/** Every string anywhere in a module. */
export function stringsOf(node) {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(stringsOf);
  if (node && typeof node === 'object') return Object.values(node).flatMap(stringsOf);
  return [];
}

/** The adult lesson and the four bands, by name. */
export function textsOf(L) {
  return { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
}

/** The text outside double quotes: our own voice. */
export const ourVoice = (t) =>
  String(t)
    .split('"')
    .filter((_, i) => i % 2 === 0)
    .join(' ');

/** How many quoted spans carry a reference. */
export const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// ---------------------------------------------------------------------------
// The checks. Each returns a list of faults; an empty list is a pass.
// ---------------------------------------------------------------------------

/** Every quoted span with a reference is the corpus verbatim (a mid-verse capital is not). */
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}

/** Each spine span is in its verse, and in the adult lesson and every band. */
export function spineFaults(L, spine) {
  const faults = [];
  const texts = textsOf(L);
  for (const [ref, span] of spine) {
    const verse = corpusText(ref);
    if (verse == null) faults.push(`spine ${ref} does not resolve`);
    else if (!verse.includes(span)) faults.push(`spine ${ref}: "${span}" is not in the verse`);
    for (const [place, text] of Object.entries(texts)) if (!String(text).includes(span)) faults.push(`${place} drops ${ref}`);
  }
  return faults;
}

/** A double-quoted span with no reference after it: his words, or anyone's, put in quotes (DR-0331). */
export function bareQuoteFaults(L) {
  const out = [];
  for (const t of stringsOf(L)) for (const p of quotedPairs(t)) if (!p.ref) out.push(p.inside.slice(0, 60));
  return out;
}

/** Yahweh is never put inside a quotation (DR-0210 bright line). */
export function yahwehInQuoteFaults(L) {
  const out = [];
  for (const t of stringsOf(L))
    for (const { inside, ref } of quotedPairs(t)) if (/\bYahweh\b/.test(inside)) out.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
  return out;
}

/**
 * A generic God, GOD or LORD in our own voice (DR-0210); the anchor's reference
 * list is skipped. `allow` names what a lesson may print in its own voice and
 * why it is not our voice: a song title, a book title (each a RegExp, /g).
 */
export function voiceFaults(L, allow = []) {
  const out = [];
  for (const t of stringsOf(L)) {
    if (L.anchor && t === L.anchor.ref) continue;
    const voice = allow.reduce((v, re) => v.replace(re, ' '), ourVoice(t));
    for (const m of voice.match(/\b(God|GOD|LORD)\b/g) || []) out.push(`${m} :: ${t.slice(0, 60)}`);
  }
  return out;
}

/** The adversary is never capitalised. */
export function adversaryFaults(L) {
  return (
    stringsOf(L)
      .join(' ')
      .match(/\b(Satan|Lucifer|Devil|Baal)\b/g) || []
  );
}

/** Each place (adult and every band) sends the reader all three ways (DR-0733 / DR-0795). */
export function directionFaults(L) {
  return placesMissingDirections(L).map((p) => `${p.place} is missing ${p.missing.join(', ')}`);
}

/** Each band is a real share of the adult lesson (full-levels floor). */
export function bandShareFaults(L) {
  return shortBands(measureFullness(L), FULL_FLOOR).map((b) => (typeof b === 'string' ? b : JSON.stringify(b)));
}

/** No band is a reworded copy of another. */
export function overlapFaults(L) {
  return duplicatedBands(measureDifferentiation(L), DIFF_CEILING).map((d) => (typeof d === 'string' ? d : JSON.stringify(d)));
}

/** The bands read as a ladder, child inside its ceiling. */
export function ladderFaults(L) {
  const g = measureLesson(L);
  const out = [];
  if (isInverted(g)) out.push('the bands read out of order');
  if (g.bands.child.authored > NEW_LESSON_CHILD_CEILING) out.push(`child reads at grade ${g.bands.child.authored} (ceiling ${NEW_LESSON_CHILD_CEILING})`);
  for (let i = 1; i < BANDS.length; i += 1) {
    if (!(g.bands[BANDS[i]].authored > g.bands[BANDS[i - 1]].authored)) out.push(`${BANDS[i]} does not read above ${BANDS[i - 1]}`);
  }
  return out;
}

/** A quiz of `questions` questions, each answer in range with an explanation. */
export function quizFaults(L, questions = 10) {
  const qs = (L.quiz && L.quiz.questions) || [];
  const out = [];
  if (qs.length !== questions) out.push(`the quiz has ${qs.length} questions, not ${questions}`);
  qs.forEach((q, i) => {
    if (!(q.answer >= 0 && q.answer < (q.options || []).length)) out.push(`question ${i + 1}: answer out of range`);
    if (String(q.explain || '').length <= 40) out.push(`question ${i + 1}: no real explanation`);
  });
  return out;
}

/** Two parables, one light and one solemn, each on a verse that resolves. */
export function storyFaults(L) {
  const s = L.stories || [];
  const out = [];
  if (s.length !== 2) out.push(`${s.length} stories, not 2`);
  for (const st of s) {
    if (st.kind !== 'parable') out.push(`a story of kind ${st.kind}`);
    if (String(st.body).trim().split(/\s+/).length < 100) out.push(`"${st.title}" is under 100 words`);
    if (corpusText(st.verse) == null) out.push(`"${st.title}" stands on ${st.verse}, which does not resolve`);
  }
  if (
    s
      .map((x) => x.tone)
      .sort()
      .join() !== 'light,solemn'
  )
    out.push('the stories are not one light and one solemn');
  return out;
}

/** All of the above, by name. */
export function lessonGateFaults(L, { spine = [], questions = 10, voiceAllow = [] } = {}) {
  const strings = stringsOf(L);
  return {
    spine: spineFaults(L, spine),
    verbatim: verbatimFaults(strings),
    bareQuotes: bareQuoteFaults(L),
    yahwehInQuotes: yahwehInQuoteFaults(L),
    voice: voiceFaults(L, voiceAllow),
    adversary: adversaryFaults(L),
    directions: directionFaults(L),
    bandShares: bandShareFaults(L),
    overlap: overlapFaults(L),
    ladder: ladderFaults(L),
    quiz: quizFaults(L, questions),
    stories: storyFaults(L),
    elided: elidedQuotations(L),
    records: recitedRecords(L),
  };
}

// ---------------------------------------------------------------------------
// The gate a new lesson's test calls.
// ---------------------------------------------------------------------------
/**
 * livingLessonGate({ id, lesson, ORDER, ADDED, order, added, spine, UNCHECKED, minQuoted, questions })
 *
 * `order` / `added` are what the test expects; ORDER / ADDED are the module's
 * own exports. `spine` is [[ref, span], ...]: spans every text must quote.
 * `UNCHECKED`, when the module exports it, must carry a `re-review:` date.
 * `voiceAllow` lists titles the lesson prints that carry "God" (see voiceFaults).
 */
export function livingLessonGate({ id, lesson, ORDER, ADDED, order, added, spine, UNCHECKED, minQuoted = 100, questions = 10, voiceAllow = [] }) {
  describe(`L${order} — ${id}: the shared Living Lesson gate`, () => {
    const L = LIVING_LESSONS_MODULES.find((m) => m.id === id);

    it('is in the catalog exactly once, on its own number and day, and is this file', () => {
      expect(L, `${id} is not in the catalog`).toBe(lesson);
      expect(LIVING_LESSONS_MODULES.filter((m) => m.id === id)).toHaveLength(1);
      expect(ORDER).toBe(order);
      expect(id.startsWith(`ll${order}-`), 'the id carries its number').toBe(true);
      expect(ADDED).toBe(added);
      expect(buildLivingLessonsSchedule().find((m) => m.id === id).added).toBe(added);
    });

    it('names a spine, and every spine verse is quoted in the lesson and every band', () => {
      expect(spine.length, 'name at least five spans the lesson cannot teach without').toBeGreaterThanOrEqual(5);
      expect(spineFaults(L, spine)).toEqual([]);
    });

    it('every referenced quotation in every string is the corpus verbatim, and the sweep counts itself', () => {
      expect(verbatimFaults(stringsOf(L))).toEqual([]);
      expect(referencedCount(stringsOf(L)), 'an empty sweep cannot read as a pass').toBeGreaterThanOrEqual(minQuoted);
      expect(elidedQuotations(L)).toEqual([]);
      expect(recitedRecords(L)).toEqual([]);
    });

    it('our voice names Yahweh: no generic God, GOD or LORD outside a quotation, none inside one altered, no capitalised adversary', () => {
      expect(voiceFaults(L, voiceAllow)).toEqual([]);
      expect(yahwehInQuoteFaults(L)).toEqual([]);
      expect(adversaryFaults(L)).toEqual([]);
    });

    it('every double-quoted span carries its reference: spoken words are rendered, never put in quotes', () => {
      expect(bareQuoteFaults(L)).toEqual([]);
    });

    it('the lesson and every band carry their own three talk-together directions', () => {
      expect(directionFaults(L)).toEqual([]);
    });

    it('the four bands are four bands: real shares, a ladder, no reworded copy', () => {
      expect(bandShareFaults(L)).toEqual([]);
      expect(ladderFaults(L)).toEqual([]);
      expect(overlapFaults(L)).toEqual([]);
    });

    it(`two parables and a ${questions}-question quiz`, () => {
      expect(storyFaults(L)).toEqual([]);
      expect(quizFaults(L, questions)).toEqual([]);
    });

    if (UNCHECKED !== undefined) {
      it('UNCHECKED names what was not read back, with a date to look again', () => {
        expect(String(UNCHECKED)).toMatch(/re-review: \d{4}-\d{2}-\d{2}/);
      });
    }
  });
}
