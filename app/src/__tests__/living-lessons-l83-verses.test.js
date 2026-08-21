// @vitest-environment node
// L83 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l78/l80-l82 pins).
// Capture note: Darrell spoke the lesson REQUEST 2026-08-21 — "how do we guard
// our hearts and minds according to the Word and what specific requirements
// and conditions are we being prepared to meet and discuss before and after
// studying for growth" — and the lesson stands on the texts his two questions
// name: the guard (Proverbs 4:23's wellspring, Philippians 4:6-8's garrison
// and Test, the gates, 2 Corinthians 10:5's patrol) and the if/then conditions
// of growth on both sides of study. These pins prove the spine is Scripture,
// not memory; every verse was fetched from public/bible/kjv before writing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

const PINS = [
  ['Proverbs', 4, 23, 'Keep thy heart with all diligence; for out of it are the issues of life'],
  ['Proverbs', 23, 7, 'as he thinketh in his heart, so is he'],
  ['Philippians', 4, 6, 'by prayer and supplication with thanksgiving'],
  ['Philippians', 4, 7, 'the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus'],
  ['Philippians', 4, 8, 'whatsoever things are true'],
  ['Philippians', 4, 8, 'think on these things'],
  ['Psalms', 101, 3, 'I will set no wicked thing before mine eyes'],
  ['Mark', 4, 24, 'Take heed what ye hear'],
  ['Luke', 8, 18, 'Take heed therefore how ye hear'],
  ['2Corinthians', 10, 5, 'Casting down imaginations'],
  ['2Corinthians', 10, 5, 'bringing into captivity every thought to the obedience of Christ'],
  ['Ephesians', 6, 16, 'the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked'],
  ['Ephesians', 6, 17, 'the helmet of salvation, and the sword of the Spirit, which is the word of God'],
  ['2Timothy', 2, 15, 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth'],
  ['James', 1, 21, 'receive with meekness the engrafted word'],
  ['James', 1, 21, 'lay apart all filthiness'],
  ['1Peter', 2, 2, 'desire the sincere milk of the word, that ye may grow thereby'],
  ['Psalms', 119, 18, 'Open thou mine eyes, that I may behold wondrous things out of thy law'],
  ['Proverbs', 2, 4, 'If thou seekest her as silver, and searchest for her as for hid treasures'],
  ['Proverbs', 2, 5, 'Then shalt thou understand the fear of the LORD'],
  ['Matthew', 5, 6, 'hunger and thirst after righteousness'],
  ['James', 1, 22, 'be ye doers of the word, and not hearers only, deceiving your own selves'],
  ['James', 1, 25, 'blessed in his deed'],
  ['Joshua', 1, 8, 'thou shalt meditate therein day and night, that thou mayest observe to do'],
  ['Psalms', 1, 2, 'in his law doth he meditate day and night'],
  ['Psalms', 1, 3, 'like a tree planted by the rivers of water'],
  ['Hebrews', 5, 14, 'by reason of use have their senses exercised'],
  ['Romans', 12, 2, 'prove what is that good, and acceptable, and perfect, will of God'],
  ['Colossians', 3, 16, 'Let the word of Christ dwell in you richly in all wisdom'],
  ['Colossians', 3, 16, 'teaching and admonishing one another'],
  ['1Peter', 3, 15, 'a reason of the hope that is in you with meekness and fear'],
  ['2Peter', 3, 18, 'grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ'],
];

describe('L83 — keep thy heart, the conditions of growth: verses verbatim', () => {
  const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === 'll83-keep-thy-heart-the-conditions-of-growth');

  it('the lesson is published and the catalog counts it', () => {
    expect(lesson).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('every pinned fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const [book, ch, vs, frag] of PINS) {
      const text = norm(kjv(book, ch, vs));
      if (!text.includes(norm(frag))) failures.push(`${book} ${ch}:${vs} does not contain "${frag}" — verse reads: ${text}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('every pinned fragment actually appears in the lesson body (the pins are not decorative)', () => {
    const body = norm(JSON.stringify(lesson));
    const missing = PINS.map(([, , , f]) => f).filter((f) => !body.includes(norm(f)));
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('the lesson carries the two halves Darrell asked for: the guard AND the before/after conditions', () => {
    const body = norm(JSON.stringify(lesson)).toLowerCase();
    for (const marker of ['guard', 'gate', 'garrison', 'before', 'after', 'condition', 'discuss', 'grow']) {
      expect(body, `missing marker: ${marker}`).toContain(marker);
    }
  });

  it('PROVEN-TO-CATCH: a tampered fragment fails the verbatim gate', () => {
    const text = norm(kjv('Proverbs', 4, 23));
    expect(text.includes(norm('Keep thy heart with SOME diligence'))).toBe(false);
  });
});
