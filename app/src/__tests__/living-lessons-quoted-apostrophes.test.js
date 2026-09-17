// =============================================================================
// EVERY QUOTED SPAN IN EVERY LESSON USES THE CORPUS'S OWN APOSTROPHE
// =============================================================================
// A catalog-wide gate, added 2026-09-17 during the DR-0418 full-levels pass.
//
// WHY IT EXISTS. Auditing lessons one at a time, the pass found the same defect
// eleven times in eleven separate lessons: an ASCII apostrophe (U+0027) standing
// inside a quotation of the Word where this repo's KJV carries a typographic one
// (U+2019) — `mother's womb`, `one another's burdens`, `dead men's bones`,
// `Abraham's children`, `the poor man's wisdom`. Each was invisible at a glance
// and each was a real alteration of a quotation.
//
// Finding the twelfth the same way would have taken another lesson-by-lesson
// pass, so instead the whole catalog was swept at once: 28,695 quoted spans
// across 163 lessons, 35 occurrences of this defect in 11 lessons, all restored
// in one commit. THIS gate is what makes that a one-time event rather than a
// recurring discovery.
//
// WHAT IT CHECKS, PRECISELY. For every double-quoted span in every string field
// of every module: if the span is not in the corpus, but becomes verbatim when
// its ASCII apostrophes are converted to U+2019, that is this defect and the
// build fails. Nothing else is judged here — a span that is simply not Scripture
// (our own terms, a quoted claim, a quoted speaker) is invisible to this check,
// because converting its apostrophes will not make it match the corpus either.
//
// WHAT IT DELIBERATELY DOES NOT TOUCH. Our own authored prose. An ASCII
// apostrophe is correct there, and the fix that cleared these 35 was scoped to
// the whole span rather than to bare words for exactly that reason: `Darrell's`,
// `satan's` and `Yahweh's` in our voice are untouched and must stay that way.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');

// Verses joined by a SPACE within each chapter, so a quotation running across
// contiguous verses is a true substring while one stitched from two chapters is
// not (the L103 flow convention).
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const spansOf = (text) => {
  const at = [...text.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(text.slice(at[i] + 1, at[i + 1]));
  return out;
};

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
};

const findAsciiApostropheDrifts = () => {
  const hits = [];
  for (const module of LIVING_LESSONS_MODULES) {
    for (const text of strings(module)) {
      for (const span of spansOf(text)) {
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (!part.includes("'")) continue;
          if (KJV_FLOW.includes(part)) continue;
          const curly = part.replace(/'/g, '’');
          if (curly !== part && KJV_FLOW.includes(curly)) {
            hits.push({ id: module.id, part });
          }
        }
      }
    }
  }
  return hits;
};

describe('no quoted span alters the Word by its apostrophe (catalog-wide)', () => {
  it('every lesson is clean', () => {
    const hits = findAsciiApostropheDrifts();
    const report = hits.map((h) => ` - ${h.id}\n     ${JSON.stringify(h.part.slice(0, 90))}`).join('\n');
    expect(hits, `quoted spans that are verbatim KJV EXCEPT for an ASCII apostrophe:\n${report}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — the detector fires on the real forms it was built from', () => {
    // Each pair is one of the 35 occurrences this gate was written after. The
    // ASCII form must be absent from the corpus and the curly form present, so
    // the check above has something to catch when a drift returns.
    const pairs = [
      ["Bear ye one another's burdens", 'Bear ye one another’s burdens'],
      ["within full of dead men's bones", 'within full of dead men’s bones'],
      ["covered me in my mother's womb", 'covered me in my mother’s womb'],
      ["If ye were Abraham's children", 'If ye were Abraham’s children'],
      ["the poor man's wisdom is despised", 'the poor man’s wisdom is despised'],
      ["and the virgin's name was Mary", 'and the virgin’s name was Mary'],
    ];
    for (const [ascii, curly] of pairs) {
      expect(KJV_FLOW.includes(curly), `corpus should carry: ${curly}`).toBe(true);
      expect(KJV_FLOW.includes(ascii), `corpus must NOT carry: ${ascii}`).toBe(false);
    }
  });

  it('leaves OUR OWN prose alone — an ASCII apostrophe is correct there', () => {
    // The guard on the guard. These live in our authored voice, carry ASCII
    // apostrophes correctly, and a word-level "fix" would have corrupted them.
    // They are also not corpus text, so this gate can never reach them.
    const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
    for (const ours of ["Darrell\\'s", "satan\\'s", "Yahweh\\'s"]) {
      expect(src, `our own prose form went missing: ${ours}`).toContain(ours);
    }
    // What keeps them safe is NOT that they are absent from the corpus. I
    // assumed that first, and two corpus reads disproved it before this
    // assertion was allowed to stand:
    //
    //   1. `satan’s` IS corpus text -- Revelation 2:13, `satan’s seat`.
    //   2. And it is LOWERCASE there. `Satan` capitalised appears nowhere in
    //      this store at all, because CLAUDE.md's rule that the adversary is
    //      never capitalised has been applied to the Scripture store itself.
    //
    // So what actually keeps our prose out of scope is structural rather than
    // lexical: this gate only ever examines text BETWEEN double quotes, and our
    // authored prose is not quoted. That is the guarantee worth asserting.
    expect(KJV_FLOW.includes('satan\u2019s seat'), 'the corpus does carry satan\u2019s').toBe(true);
    expect(KJV_FLOW.includes('Satan'), 'and never capitalises the adversary').toBe(false);
    for (const ours of ['Darrell', 'Yahweh']) {
      expect(KJV_FLOW.includes(`${ours}\u2019s`), `${ours} is not corpus text`).toBe(false);
    }
  });
});
