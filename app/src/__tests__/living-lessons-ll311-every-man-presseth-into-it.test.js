// L311 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Below it, what is particular to this lesson
// (DR-1488), built from a video on Matthew 11:12 Darrell sent with his summary:
//   1. Matthew 11:11 is never cut in half: wherever it is quoted, the quotation
//      carries "notwithstanding he that is least ... greater than he", and our
//      voice never rewords it as the greatest human being ever born.
//   2. Matthew 11:12 is never taught alone: every text that quotes it also
//      quotes Luke 16:16 (every man presseth into it), the Word's own parallel.
//   3. The juniper tree is the King James word (1 Kings 19:4); our voice never
//      swaps in another tree.
//   4. Machaerus is history outside Scripture: wherever it is named, Josephus is
//      named beside it and the Gospels' silence is said.
//   5. The provenance names the video and that it could not be opened.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll311-every-man-presseth-into-it.js';
import { livingLessonGate, stringsOf, textsOf, quotedPairs, ourVoice } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll311-every-man-presseth-into-it',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 311,
  added: '2026-11-13',
  spine: [
    ['Matthew 11:12', 'the violent take it by force'],
    ['Luke 16:16', 'every man presseth into it'],
    ['Matthew 11:3', 'Art thou he that should come, or do we look for another?'],
    ['Matthew 11:6', 'blessed is he, whosoever shall not be offended in me'],
    ['Matthew 11:11', 'notwithstanding he that is least in the kingdom of heaven is greater than he'],
    ['Genesis 32:26', 'I will not let thee go, except thou bless me'],
    ['1 Kings 19:12', 'a still small voice'],
    ['Mark 5:34', 'thy faith hath made thee whole; go in peace'],
    ['Mark 9:24', 'Lord, I believe; help thou mine unbelief'],
    ['Matthew 11:28', 'Come unto me, all ye that labour and are heavy laden'],
    ['John 10:28', 'out of my hand'],
  ],
});

const TEXTS = textsOf(lesson);
const EVERY = stringsOf(lesson);

/** Every quotation of Matthew 11:11 that stops short of its second half. */
export function halvedEleven(strings) {
  const out = [];
  for (const t of strings)
    for (const { inside, ref } of quotedPairs(t))
      if (ref === 'Matthew 11:11' && /born of women/.test(inside) && !/notwithstanding he that is least/.test(inside)) out.push(inside.slice(0, 60));
  return out;
}

/** Our voice rewording John's honor as a superlative the verse does not say. */
export function rewordedEleven(strings) {
  return strings.filter((t) => /greatest (?:human|man|person)[^.]{0,30}(?:ever )?born/i.test(ourVoice(t))).map((t) => t.slice(0, 60));
}

/** A text that quotes Matthew 11:12 without its parallel, Luke 16:16. */
export function twelveAlone(texts) {
  return Object.entries(texts)
    .filter(([, t]) => quotedPairs(t).some((p) => p.ref === 'Matthew 11:12') && !t.includes('every man presseth into it'))
    .map(([k]) => k);
}

/** Another tree put where the King James text says juniper. */
export function swappedTree(strings) {
  return strings.filter((t) => /\bbroom\b/i.test(ourVoice(t))).map((t) => t.slice(0, 60));
}

/** Machaerus named without Josephus and the Gospels' silence beside it. */
export function machaerusUnmarked(texts) {
  return Object.entries(texts)
    .filter(([, t]) => /Machaerus/.test(t) && !(/Josephus/.test(t) && /Gospels do not name/.test(t) && /outside Scripture/.test(t)))
    .map(([k]) => k);
}

describe('L311 keeps Matthew 11 in its own place', () => {
  it('Matthew 11:11 is quoted whole wherever it is quoted, and never reworded as a superlative in our voice', () => {
    expect(halvedEleven(EVERY)).toEqual([]);
    expect(rewordedEleven(EVERY)).toEqual([]);
    const quotedEleven = EVERY.flatMap((t) => quotedPairs(t)).filter((p) => p.ref === 'Matthew 11:11');
    expect(quotedEleven.length, 'an empty scan cannot pass').toBeGreaterThanOrEqual(6);
  });

  it('every text that quotes Matthew 11:12 also quotes Luke 16:16', () => {
    expect(twelveAlone(TEXTS)).toEqual([]);
    expect(Object.values(TEXTS).filter((t) => quotedPairs(t).some((p) => p.ref === 'Matthew 11:12')).length).toBeGreaterThanOrEqual(5);
  });

  it('the juniper tree stays the King James word', () => {
    expect(swappedTree(EVERY)).toEqual([]);
    expect(EVERY.some((t) => /juniper tree/.test(t))).toBe(true);
  });

  it('Machaerus, wherever named, is marked as history outside Scripture', () => {
    expect(machaerusUnmarked(TEXTS)).toEqual([]);
    expect(Object.values(TEXTS).filter((t) => /Machaerus/.test(t)).length).toBeGreaterThanOrEqual(1);
  });

  it('Jesus is confessed as the Lamb of Yahweh and His Eternal Son in the adult lesson', () => {
    expect(lesson.lesson).toContain('Jesus, the Lamb of Yahweh and His Eternal Son');
  });

  it('the provenance names the video, that it could not be opened, and the re-review date', () => {
    expect(lesson.inApp).toMatch(/could not be opened from here/);
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll311-every-man-presseth-into-it.js'), 'utf8');
    expect(src).toContain('https://youtu.be/_CzUp_gZltk');
    expect(String(UNCHECKED)).toMatch(/www\.youtube\.com/);
    expect(String(UNCHECKED)).toMatch(/re-review: 2026-11-27/);
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    expect(halvedEleven(['"Among them that are born of women there hath not risen a greater than John the Baptist:" (Matthew 11:11)'])).toHaveLength(1);
    expect(rewordedEleven(['Jesus called John the greatest human being ever born.'])).toHaveLength(1);
    expect(twelveAlone({ child: '"the violent take it by force." (Matthew 11:12)' })).toEqual(['child']);
    expect(swappedTree(['Elijah sat under a broom tree.'])).toHaveLength(1);
    expect(machaerusUnmarked({ teen: 'John was held at Machaerus.' })).toEqual(['teen']);
    // and the same words inside a quotation, or with the marks beside them, are left alone
    expect(rewordedEleven(['"greatest man born" (Matthew 11:11)'])).toEqual([]);
    expect(machaerusUnmarked({ adult: 'The Gospels do not name it. Josephus, outside Scripture, names Machaerus.' })).toEqual([]);
  });
});
