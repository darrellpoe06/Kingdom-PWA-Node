// @vitest-environment node
// =============================================================================
// L240 — HE SAID IT AND DID NOT DO IT: every span verbatim
// =============================================================================
// WHERE THE LESSON CAME FROM. On 2026-10-12 Darrell sent a photograph of his
// own open Bible into this lane — Numbers 14:8-12 in the ESV, every verse of
// that span marked in his own hand — with one line over it, "Lesson... He
// said! 'I will make of you a nation greater and mightier than they.'", and
// then a question: "Did that happen or is it happening according to the Word?"
//
// His question is the whole shape of the lesson, because the honest answer is
// BOTH, and a lesson that answers only one half mishandles the chapter:
//   * it did NOT happen to Moses — he refused the offer twice and stood in the
//     breach instead (Psalm 106:23), and Yahweh pardoned (Numbers 14:20);
//   * it DID happen to that generation, slowly, over forty years (14:22-29);
//   * a greater nation WAS made — out of the children their parents had named
//     as the excuse for turning back (14:3 against 14:31);
//   * and it IS happening, because the Word itself puts the chapter in the
//     present tense for the reader (1 Corinthians 10:11-12; Hebrews 3:19),
//     while an Intercession that never steps out of the gap continues
//     (Hebrews 7:25).
//
// WHY THIS FILE EXISTS. The lesson stands on thirty-three verses and its whole
// weight rests on them saying what we claim they say. The screenshot Darrell
// sent is the ESV; every verse quoted in the lesson is the KJV on this device,
// so each double-quoted span in every band is compared against
// app/public/bible/kjv with a STRICT comparison: whitespace is normalized and
// NOTHING else. Apostrophes are not normalized and case is not normalized,
// because a verse that continues a sentence begins lowercase and "correcting"
// it would be an alteration we made and then hid.
//
// IT ALREADY EARNED ITS KEEP. While the verse table for this lesson was being
// written, 1 Peter 2:9 was typed as "an holy priesthood". The corpus says "an
// holy nation" — the one word the whole lesson turns on. It was caught by
// comparing the table against the corpus before generating, which is the same
// check this file makes permanent.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { placesMissingDirections } from '../lib/talk-together.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');

// 'Psalm 106:23' is cited the way the lesson cites it; the corpus file is Psalms.
const FILE = {
  Genesis: 'Genesis', Exodus: 'Exodus', Numbers: 'Numbers', Deuteronomy: 'Deuteronomy',
  Psalm: 'Psalms', Proverbs: 'Proverbs', Romans: 'Romans', Hebrews: 'Hebrews',
  '1 Corinthians': '1Corinthians', '1 Peter': '1Peter',
};

const cache = new Map();
function verse(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const file = FILE[m[1].trim()];
  if (!file) return null;
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')));
  const ch = cache.get(file).chapters[Number(m[2]) - 1];
  return ch ? ch[Number(m[3]) - 1] : null;
}

// Whitespace only. Never apostrophes, never case.
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

const L240 = LIVING_LESSONS_MODULES.find((m) => m && m.id && m.id.startsWith('ll240-'));
const FIELDS = (m) => [m.lesson, m.levels.child, m.levels.youth, m.levels.teen, m.levels.senior];
// Our citation shape: **KJV — Ref:** *"span"*
const SPAN = /\*\*KJV — ([^:]+:\d+):\*\*\s*\*"([^"]*)"\*/g;

describe('L240 is mounted and whole', () => {
  it('is in the catalog with all four bands and an adult lesson', () => {
    // A green on a MISSING module is worth nothing: the first run of this
    // lesson's own check reported every band whole while the module had been
    // inserted into LIVING_LESSONS_SESSION_FLOW by mistake and was not in the
    // catalog at all. So existence is asserted before anything else.
    expect(L240, 'll240 is not in LIVING_LESSONS_MODULES').toBeTruthy();
    for (const b of ['child', 'youth', 'teen', 'senior']) {
      expect(L240.levels[b], `${b} band`).toBeTruthy();
      expect(L240.levels[b].length, `${b} band length`).toBeGreaterThan(2000);
    }
    expect(L240.lesson.length).toBeGreaterThan(2000);
  });

  it('says where it came from, in his own words, in every band', () => {
    for (const text of FIELDS(L240)) {
      expect(text).toMatch(/Darrell/);
      expect(text).toMatch(/Numbers 14:8-12|Numbers 14/);
    }
    // The provenance names the photograph and the question, not a vague "he asked".
    expect(L240.lesson).toMatch(/photograph|picture/i);
    expect(L240.bigIdea).toMatch(/Did that happen or is it happening/);
  });
});

describe('EVERY quoted span is verbatim KJV (DR-0076)', () => {
  it('every band, every span, compared strictly', () => {
    const bad = [];
    let n = 0;
    for (const text of FIELDS(L240)) {
      for (const m of String(text).matchAll(SPAN)) {
        n += 1;
        const real = verse(m[1].trim());
        if (real === null) { bad.push(`${m[1]}: no such verse in the corpus`); continue; }
        if (norm(real) !== norm(m[2])) bad.push(`${m[1]}\n    ours: ${m[2]}\n    kjv : ${real}`);
      }
    }
    expect(n, 'the spans were not found at all — the citation shape changed').toBeGreaterThan(80);
    expect(bad, `spans that are not verbatim:\n${bad.join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: one altered word in one span fails', () => {
    const tampered = L240.lesson.replace(
      'an holy nation',
      'an holy priesthood',
    );
    const bad = [];
    for (const m of tampered.matchAll(SPAN)) {
      const real = verse(m[1].trim());
      if (real && norm(real) !== norm(m[2])) bad.push(m[1]);
    }
    expect(bad, 'the exact slip made while writing this lesson must be caught').toContain('1 Peter 2:9');
  });

  it('every verse the lesson stands on is also in anchor.ref (DR-0734)', () => {
    const refs = new Set(String(L240.anchor.ref).split(';').map((s) => s.trim()));
    const missing = [];
    for (const text of FIELDS(L240)) {
      for (const m of String(text).matchAll(SPAN)) {
        const r = m[1].trim();
        if (!refs.has(r)) missing.push(r);
      }
    }
    expect([...new Set(missing)], 'quoted but not in anchor.ref, so Search it out cannot find it').toEqual([]);
  });
});

describe('the answer is BOTH halves, in every band', () => {
  it('names the refusal AND the forty years, so neither half is dropped', () => {
    for (const text of FIELDS(L240)) {
      expect(text, 'the breach').toMatch(/breach/i);
      expect(text, 'the refusal').toMatch(/refus|said no|declin|handed it back/i);
      expect(text, 'the slow judgment').toMatch(/forty years|wilderness/i);
    }
  });

  it('names the reversal — the children used as the excuse are the inheritance', () => {
    for (const text of FIELDS(L240)) {
      expect(text).toMatch(/little ones|children/i);
      expect(text).toMatch(/prey/i);
    }
    // 14:3 (the excuse) and 14:31 (the inheritance) must BOTH be quoted somewhere.
    const all = FIELDS(L240).join('\n');
    expect(all).toMatch(/\*\*KJV — Numbers 14:3:\*\*/);
    expect(all).toMatch(/\*\*KJV — Numbers 14:31:\*\*/);
  });

  it('says the diagnosis is unbelief and not the giants, in every band', () => {
    for (const text of FIELDS(L240)) {
      expect(text).toMatch(/unbelief|believe/i);
    }
    expect(FIELDS(L240).join('\n')).toMatch(/\*\*KJV — Hebrews 3:19:\*\*/);
  });

  it('carries the Intercession that never steps out, in every band', () => {
    for (const text of FIELDS(L240)) {
      expect(text).toMatch(/ever liveth/);
    }
  });

  it('keeps the honest flag on Numbers 14:34 rather than quietly avoiding it', () => {
    // DR-0076 rule 8: honest uncertainty is a required output, not an omission.
    // The clause is hard; the lesson says so and builds nothing on it.
    const flagged = [L240.lesson, L240.levels.teen].filter((t) => /breach of promise/.test(t));
    expect(flagged.length, 'the hard clause must be named out loud somewhere').toBeGreaterThan(0);
    for (const t of flagged) expect(t).toMatch(/builds nothing|builds no argument|leans on that verse/i);
  });
});

describe('it sends the reader to someone (DR-0733 / DR-0795)', () => {
  it('the lesson AND every band send all three directions', () => {
    const gaps = placesMissingDirections(L240);
    expect(gaps, `places short of a direction: ${JSON.stringify(gaps)}`).toEqual([]);
  });

  it('each band carries the skill and the rhythm in its own words', () => {
    for (const text of FIELDS(L240)) {
      expect(text, 'the skill: listen to the end').toMatch(/listen/i);
      expect(text, 'the skill: retell').toMatch(/retell|tell them/i);
      expect(text, 'the rhythm: Deuteronomy 6:7 places').toMatch(/at the table|bedtime|first thing/i);
      expect(text, 'the rhythm: one friend this week').toMatch(/one friend this week|friend this week/i);
    }
  });
});
