// @vitest-environment node
// =============================================================================
// L180 — He Giveth Thee Power to Get Wealth
// =============================================================================
// Darrell 2026-09-19, mid IP-conversion: "Yahweh says He gives us the ability to
// create wealth, I don't want to miss out on that because I don't have
// knowledge and understanding of these processes, so I'm using faith and the
// only way I know at this time. Lesson."
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. PROSPERITY DOCTRINE. Deuteronomy 8:18 is the most misused verse in this
//      territory. The chapter is a WARNING chapter and verse 17 is the sentence
//      of a man who forgot. Quoting 18 without 17 teaches the exact thing the
//      passage was written against. Both are quoted; the gate requires v17.
//   2. THE READING THAT MAKES IT A PROMISE OF ARRIVAL. The verse says power TO
//      GET, not wealth. That distinction is the whole thesis — capacity handed
//      over, getting still owed. If the bigIdea drifted to "He gives wealth"
//      the lesson would invert. Pinned.
//   3. TREATING THE KNOWLEDGE GAP AS A CHARACTER FLAW. Hosea 4:6 says destroyed
//      for LACK of knowledge — a lack, not a verdict. Darrell named his own gap
//      out loud; a lesson that made that shameful would punish the honesty the
//      platform runs on.
//   4. FAITH WITHOUT THE COUNTERWEIGHT. Hebrews 11:8 (went out not knowing)
//      without Luke 14:28 (count the cost) is recklessness with a proof-text.
//      Both are required here.
//   5. STOPPING THE QUOTATION EARLY. Most citations cut before "that he may
//      establish his covenant", which is the clause that makes the wealth
//      instrumental rather than evidentiary. Required.
//
// SHAPE, MEASURED BEFORE INSERTING (the first draft of this lesson was reverted
// for failing these): four bands not three, each above its fullness floor, the
// child band under the new-lesson reading ceiling, every band naming its own
// title in its opening window, bands differentiated from one another, and no
// quotation carrying the host sentence's punctuation inside it.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll180-he-giveth-thee-power-to-get-wealth';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book);
  if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1];
  if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i);
    else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
  }
};

/** Quoted-with-reference spans that do not match the corpus verbatim. */
const quotationFaults = (text, path = '') => {
  const out = [];
  SPAN_WITH_REF.lastIndex = 0;
  let m;
  while ((m = SPAN_WITH_REF.exec(text))) {
    const real = versesOf(m[2].trim(), m[3], m[4].trim());
    if (real == null) out.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
    else if (!norm(real).includes(norm(m[1]))) {
      out.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
    }
  }
  return out;
};

const ALL_TEXT = (() => { const a = []; walkStrings(L, '', (t) => a.push(t)); return a.join(' \n '); })();

describe('L180 — wired, and the series count stays honest', () => {
  it('is in the catalog with every contract field and all four bands', () => {
    expect(L, 'L180 not found in LIVING_LESSONS_MODULES').toBeTruthy();
    for (const k of ['title', 'bigIdea', 'anchor', 'benefits', 'inApp', 'levels', 'quiz', 'facilitator', 'lesson']) {
      expect(L[k], `L180 missing ${k}`).toBeTruthy();
    }
    // The first draft shipped three bands and was reverted for it.
    for (const b of BANDS) expect(L.levels[b], `L180 missing the ${b} band`).toBeTruthy();
  });

  it('the declared week count equals the real series length', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('anchors on Deuteronomy 8:18, verbatim from the corpus', () => {
    expect(L.anchor.ref).toBe('Deuteronomy 8:18');
    expect(norm(versesOf('Deuteronomy', 8, '18'))).toBe(norm(L.anchor.text));
  });
});

describe('L180 — every quoted verse is verbatim', () => {
  it('no quotation in any field drifts from the KJV', () => {
    const faults = [];
    walkStrings(L, '', (text, path) => faults.push(...quotationFaults(text, path)));
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an altered quotation fails', () => {
    expect(quotationFaults('"for it is he that giveth thee GREAT WEALTH" (Deuteronomy 8:18)', 't').length)
      .toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a real verse cited to the wrong reference fails', () => {
    expect(quotationFaults('"By faith Abraham, when he was called to go out" (Hebrews 12:8)', 't').length)
      .toBeGreaterThan(0);
  });
});

describe('L180 — the shape invariants, measured not asserted', () => {
  it('no band is short of its fullness floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('the child band is under the new-lesson reading ceiling', () => {
    const g = fleschKincaidGrade(ourProseOnly(L.levels.child));
    expect(g, `child band reads at grade ${g}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
  });

  it('the bands are differentiated, not lightly-edited copies of each other', () => {
    const d = measureDifferentiation(L);
    expect(d, 'differentiation unmeasurable — a band is missing').toBeTruthy();
    expect(d.worst, `worst pair overlap ${d.worst}`).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson in its opening window', () => {
    const unnamed = BANDS.filter((b) => !namesItsLesson(L.title, L.levels[b]));
    expect(unnamed, `bands not naming the lesson: ${unnamed.join(', ')}`).toEqual([]);
  });
});

describe('L180 — the five things it could most easily have got wrong', () => {
  it('quotes verse 17 with verse 18, so the warning is not stripped off', () => {
    expect(ALL_TEXT).toMatch(/My power and the might of mine hand hath gotten me this wealth/);
    expect(ALL_TEXT).toMatch(/Deuteronomy 8:17/);
  });

  it('holds the thesis: POWER TO GET, not wealth delivered', () => {
    // The thesis is a DISTINCTION, so the naive "the wrong phrase is absent"
    // check is wrong twice over — the bigIdea must contain that phrase, inside
    // its own negation. Assert the negation, which is the actual property.
    expect(L.bigIdea).toMatch(/POWER TO GET/);
    expect(L.bigIdea).toMatch(/DOES NOT SAY HE GIVES YOU WEALTH/);
  });

  it('names the Knowledge gap as a lack, never a verdict', () => {
    expect(ALL_TEXT).toMatch(/My people are destroyed for lack of knowledge/);
    expect(ALL_TEXT).toMatch(/lack rather than a verdict|not a bad one|never taught/i);
  });

  it('carries faith AND the counterweight, never one alone', () => {
    expect(ALL_TEXT).toMatch(/he went out, not knowing whither he went/);
    expect(ALL_TEXT).toMatch(/counteth the cost/);
  });

  it('reaches the covenant clause most quotations cut off', () => {
    expect(ALL_TEXT).toMatch(/that he may establish his covenant/);
  });

  it('capitalizes the Resources in our own voice (DR-0530), never in a quote', () => {
    expect(ALL_TEXT).toMatch(/Business Systems Knowledge/);
    // The KJV lowercases them inside the verses; the verbatim check above is
    // what proves we did not sweep capitals through quoted Scripture.
    expect(ALL_TEXT).toMatch(/destroyed for lack of knowledge/);
  });
});
