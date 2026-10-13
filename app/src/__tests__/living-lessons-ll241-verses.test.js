// =============================================================================
// ll241 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// Darrell forwarded The Daily Upside's "Under the Finfluence" (2026-10-12) into
// the lesson lane with one word on it: "Lessons." This pins the twelve verses
// ll241 teaches from against the corpus on disk, because a lesson that
// misquotes the Word to make a point about false weights has become the thing
// it is warning about.
//
// WHY THE CORPUS AND NOT MEMORY (DR-0076): writing these from memory would have
// shipped "The thoughts of the diligent tend to plenteousness" for
// Proverbs 21:5. The corpus reads "tend ONLY to plenteousness". One word, and
// it is the word that carries the verse's force.
//
// Proven-to-catch: drop or alter a character of any pinned text and the
// matching case fails, naming the reference.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

// Every verse ll241 quotes, with the text this lesson shipped.
const PINNED = {
  'Proverbs 11:14': 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'Proverbs 28:20': 'A faithful man shall abound with blessings: but he that maketh haste to be rich shall not be innocent.',
  'Proverbs 28:22': 'He that hasteth to be rich hath an evil eye, and considereth not that poverty shall come upon him.',
  'Proverbs 21:5': 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'Proverbs 11:1': 'A false balance is abomination to the LORD: but a just weight is his delight.',
  '1 Timothy 6:9': 'But they that will be rich fall into temptation and a snare, and into many foolish and hurtful lusts, which drown men in destruction and perdition.',
  '1 Timothy 6:10': 'For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows.',
  'Proverbs 13:11': 'Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
};

const lesson = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll241-'));
const everyPlace = () => [lesson.lesson, ...Object.values(lesson.levels)];

describe('ll241 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  for (const [ref, text] of Object.entries(PINNED)) {
    it(`${ref} matches the corpus on disk`, () => {
      expect(text).toBe(corpusText(ref));
    });
  }

  it('every pinned verse actually appears somewhere in the lesson', () => {
    const all = everyPlace().join('\n');
    const absent = Object.values(PINNED).filter((t) => !all.includes(t));
    expect(absent, 'a verse is pinned here but quoted nowhere in the lesson').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from these)', () => {
    const anchored = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    const missing = Object.keys(PINNED).filter((r) => !anchored.has(r));
    expect(missing, 'a verse is taught but not in anchor.ref').toEqual([]);
  });
});

describe('ll241 — every band sends the reader in all three directions', () => {
  // DR-0795: a reader reads ONE band. The pooled check can read green while a
  // single band sends its reader nowhere, so the directions are asserted where
  // that reader meets them.
  it('no place is short of a direction', () => {
    expect(placesMissingDirections(lesson)).toEqual([]);
  });

  it('the per-band check catches what the pooled check hides', () => {
    // Remove every sentence in ONE band that supplies the friend direction.
    const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);
    const friendless = sentences(lesson.levels.teen)
      .filter((s) => placesMissingDirections({ lesson: s }).some((p) => p.missing.includes('friends')))
      .join(' ');
    const mutated = { ...lesson, levels: { ...lesson.levels, teen: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is the hazard').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'teen', missing: ['friends'] }]);
  });
});
