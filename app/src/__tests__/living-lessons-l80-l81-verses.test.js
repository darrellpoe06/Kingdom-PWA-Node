// @vitest-environment node
// L80 + L81 — every quoted fragment VERBATIM against the repo's own KJV
// (DR-0076; the DR-0288 discipline; same rail as the l68/l78 pins). Without
// these pins the lessons ride the suite green while quoting from memory —
// the vacuous-gate class this file exists to keep dead.
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

function pinSuite(lessonId, label, PINS) {
  describe(label, () => {
    const lesson = LIVING_LESSONS_MODULES.find((l) => l.id === lessonId);

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
  });
}

pinSuite('ll80-the-four-warnings-of-a-hardening-heart', 'L80 — the four warnings of a hardening heart: verses verbatim', [
  ['Hebrews', 4, 12, 'a discerner of the thoughts and intents of the heart'],
  ['John', 12, 6, 'was a thief, and had the bag'],
  ['1Timothy', 6, 10, 'the love of money is the root of all evil'],
  ['1Timothy', 4, 2, 'having their conscience seared with a hot iron'],
  ['Ephesians', 4, 19, 'past feeling'],
  ['Matthew', 26, 50, 'Friend, wherefore art thou come?'],
  ['Matthew', 27, 3, 'repented himself'],
  ['Matthew', 27, 4, 'I have sinned'],
  ['2Corinthians', 7, 9, 'ye sorrowed to repentance: for ye were made sorry after a godly manner'],
  ['2Corinthians', 7, 10, 'the sorrow of the world worketh death'],
  ['Luke', 22, 62, 'wept bitterly'],
  ['John', 21, 17, 'Feed my sheep'],
  ['2Corinthians', 13, 5, 'Examine yourselves, whether ye be in the faith'],
  ['Hebrews', 3, 13, 'lest any of you be hardened through the deceitfulness of sin'],
  ['Proverbs', 4, 23, 'Keep thy heart with all diligence; for out of it are the issues of life'],
  ['1John', 1, 9, 'If we confess our sins, he is faithful and just to forgive us our sins'],
]);

pinSuite('ll81-tongues-weighed-word-first', 'L81 — tongues weighed Word-first: verses verbatim', [
  ['Acts', 2, 6, 'every man heard them speak in his own language'],
  ['Acts', 2, 8, 'in our own tongue, wherein we were born'],
  ['Acts', 2, 11, 'we do hear them speak in our tongues the wonderful works of God'],
  ['1Corinthians', 14, 19, 'five words with my understanding'],
  ['1Corinthians', 14, 23, 'will they not say that ye are mad'],
  ['1Corinthians', 14, 27, 'by two, or at the most by three, and that by course; and let one interpret'],
  ['1Corinthians', 14, 28, 'if there be no interpreter, let him keep silence in the church'],
  ['1Corinthians', 14, 33, 'God is not the author of confusion, but of peace'],
  ['1Corinthians', 14, 39, 'forbid not to speak with tongues'],
  ['1Corinthians', 14, 40, 'Let all things be done decently and in order'],
  ['1Corinthians', 12, 30, 'do all speak with tongues?'],
  ['1Corinthians', 13, 1, 'the tongues of men and of angels'],
  ['Romans', 8, 26, 'the Spirit itself maketh intercession for us with groanings which cannot be uttered'],
  ['Ephesians', 6, 18, 'Praying always with all prayer and supplication in the Spirit'],
  ['Jude', 1, 20, 'praying in the Holy Ghost'],
  ['Psalms', 62, 8, 'pour out your heart before him'],
]);

describe('PROVEN-TO-CATCH: a one-word tamper fails', () => {
  it('catches a tampered fragment', () => {
    expect(norm(kjv('2Corinthians', 7, 10)).includes('the sorrow of the world worketh life')).toBe(false);
    expect(norm(kjv('2Corinthians', 7, 10)).includes('the sorrow of the world worketh death')).toBe(true);
  });
});
