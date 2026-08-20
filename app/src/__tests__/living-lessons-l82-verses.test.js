// @vitest-environment node
// L82 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l68/l78/l80-l81 pins).
// Capture note: the spoken teaching's verbatim wording was lost to a session
// compaction, so the LESSON stands on Romans 13:8-14 itself plus Darrell's
// named cross-texts — which makes these pins the lesson's whole spine, and
// this file the proof the spine is Scripture and not memory.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

function kjv(book, ch, vs) {
  const d = JSON.parse(readFileSync(new URL(`../../public/bible/kjv/${book}.json`, import.meta.url), 'utf8'));
  const chapters = d.chapters || d;
  const verses = Array.isArray(chapters) ? chapters[ch - 1] : chapters[String(ch)];
  const v = Array.isArray(verses) ? verses[vs - 1] : verses[String(vs)];
  return typeof v === 'string' ? v : (v.text || v.t);
}

const norm = (x) => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

const PINS = [
  ['Romans', 13, 8, 'Owe no man any thing, but to love one another'],
  ['Romans', 13, 8, 'he that loveth another hath fulfilled the law'],
  ['Romans', 13, 9, 'briefly comprehended'],
  ['Romans', 13, 10, 'Love worketh no ill to his neighbour'],
  ['Romans', 13, 10, 'love is the fulfilling of the law'],
  ['Romans', 13, 11, 'now it is high time to awake out of sleep'],
  ['Romans', 13, 11, 'now is our salvation nearer than when we believed'],
  ['Romans', 13, 12, 'The night is far spent, the day is at hand'],
  ['Romans', 13, 12, 'cast off the works of darkness'],
  ['Romans', 13, 12, 'put on the armour of light'],
  ['Romans', 13, 13, 'Let us walk honestly, as in the day'],
  ['Romans', 13, 14, 'put ye on the Lord Jesus Christ'],
  ['Romans', 13, 14, 'make not provision for the flesh'],
  ['Deuteronomy', 6, 5, 'love the LORD thy God with all thine heart, and with all thy soul, and with all thy might'],
  ['Leviticus', 19, 18, 'thou shalt love thy neighbour as thyself: I am the LORD'],
  ['Matthew', 22, 40, 'On these two commandments hang all the law and the prophets'],
  ['Isaiah', 59, 17, 'righteousness as a breastplate, and an helmet of salvation upon his head'],
  ['Isaiah', 60, 1, 'Arise, shine; for thy light is come'],
  ['Isaiah', 60, 2, 'darkness shall cover the earth, and gross darkness the people'],
  ['Isaiah', 61, 10, 'he hath clothed me with the garments of salvation'],
  ['Isaiah', 61, 10, 'covered me with the robe of righteousness'],
  ['Matthew', 23, 23, 'weightier matters'],
  ['Matthew', 23, 23, 'judgment, mercy, and faith'],
  ['Colossians', 4, 5, 'Walk in wisdom toward them that are without, redeeming the time'],
  ['Colossians', 4, 6, 'Let your speech be alway with grace, seasoned with salt'],
  ['1Thessalonians', 5, 5, 'Ye are all the children of light'],
];

describe('L82 — love fulfils the law, wake up and get dressed: verses verbatim', () => {
  const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === 'll82-love-fulfils-the-law-wake-up-and-get-dressed');

  it('the lesson is published', () => {
    expect(lesson).toBeTruthy();
  });

  it('every pinned fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const [book, ch, vs, frag] of PINS) {
      if (!norm(kjv(book, ch, vs)).includes(norm(frag))) failures.push(`${book} ${ch}:${vs} — "${frag}"`);
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the lesson (no stale pin list)', () => {
    const blob = JSON.stringify(lesson).replace(/[’‘]/g, "'");
    const missing = PINS.filter(([, , , frag]) => !blob.includes(frag)).map(([b, c, v]) => `${b} ${c}:${v}`);
    expect(missing).toEqual([]);
  });

  it('the Isaiah wardrobe arc is intact — armor, dawn, garments, in consecutive chapters', () => {
    const blob = JSON.stringify(lesson);
    for (const frag of ['Isaiah 59:17', 'Isaiah 60:1', 'Isaiah 61:10']) {
      expect(blob).toContain(frag);
    }
  });
});

describe('PROVEN-TO-CATCH: a one-word tamper fails', () => {
  it('catches a tampered fragment', () => {
    expect(norm(kjv('Romans', 13, 12)).includes('put on the armour of night')).toBe(false);
    expect(norm(kjv('Romans', 13, 12)).includes('put on the armour of light')).toBe(true);
  });
});
