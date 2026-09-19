// @vitest-environment node
// =============================================================================
// L184 — He Sings: Yahweh Over You, Jesus in the Midst of You
// =============================================================================
// Darrell, 2026-09-19, spoken straight into the channel:
//
//   "Jesus Sings!!!!!!!!! Amazing!!!! Yahweh sings!!!!!! I never actually
//    thought about it until I learned He sings!!! Lesson... made me feel
//    closer to Him... I know Him better"
//
// A spoken teaching, so CLAUDE.md binds it to ship the same session. What makes
// it a lesson rather than a nice thought is that it is not a new idea about
// Him; it is a part of Him that was written down the whole time and never got
// taught here. MEASURED BEFORE WRITING, against the 178 existing lessons:
// Zephaniah 3:17 appears in exactly 2 (L109, L146). Hebrews 2:12 appears in 0.
// Matthew 26:30 appears in 0. So the Father's singing was already in the
// series and the SON's singing was not — which is why this lesson says so out
// loud instead of presenting the whole thing as new.
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. THE PSALM 22 / HEBREWS 2:12 RENDERING STATED LOOSELY. The entire weight
//      of the lesson rests on one observation: Psalms 22:22 reads "will I
//      praise thee" and Hebrews 2:12 renders the same line "will I sing praise
//      unto thee." If that is overstated by a single word the lesson collapses,
//      so it is pinned here against the KJV in both directions rather than
//      asserted in prose.
//   2. THE COURAGE MADE CHEAP. "He sang before the cross" becomes a slogan the
//      moment it implies He did not feel it. He tells them in that same garden
//      His soul is exceeding sorrowful, even unto death. Grief and song in one
//      hour is the teaching; a band that dropped the grief would be teaching
//      stoicism with a verse attached.
//   3. INVENTING THE HYMN. The text does not say which hymn was sung. It has
//      been supposed for centuries. DR-0098 says stay where the Word stays, so
//      the lesson names the silence rather than filling it, and this file pins
//      that the lesson never claims to know.
//   4. THE FATHER'S HALF PRESENTED AS NEW. It is not; two lessons already carry
//      Zephaniah 3:17. Claiming novelty we do not have is the over-claim
//      DR-0076 forbids, so the lesson states the overlap itself.
//   5. SINGING REDUCED TO FEELING. Colossians 3:16 ties it to teaching and
//      admonishing, and 1 Corinthians 14:15 insists on spirit AND understanding.
//      A lesson about singing that drifted into atmosphere would have missed
//      what the apostles actually said it is for.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const ID = 'll184-he-sings-yahweh-over-you-jesus-in-the-midst-of-you';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  return cache.get(k);
};
const verse = (book, ch, n) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  return chap[Number(n) - 1] == null ? null : norm(chap[Number(n) - 1]);
};

const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};

// Spans that are deliberately NOT Scripture: Darrell's own spoken words, which
// this lesson is built from and quotes as his. Declared by exact text so a
// future edit cannot quietly smuggle an unreferenced Scripture span in beside
// them (DR-0076 — the exemption is enumerated, never a pattern).
const SPOKEN = new Set([
  'Jesus Sings!!!!!!!!! Amazing!!!! Yahweh sings!!!!!! I never actually thought about it until I learned He sings!!!',
  'made me feel closer to Him,',
  'I know Him better',
  'I know Him better.',
]);

describe('the lesson exists and is wired', () => {
  it('is the last Living Lesson and the series count says so', () => {
    expect(L, 'L184 is not in the series').toBeTruthy();
    // The count is an INVARIANT here, not a literal. Pinning the number was
    // itself the defect: L181, L182 and L183 each appended one lesson and each
    // append broke a hardcoded total in a file that had nothing to do with the
    // new lesson -- which teaches the next author to bump a digit instead of
    // reading the assertion. What must be true is that the series length and
    // the declared week count agree. That is what is pinned now.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    // Relative order rather than an end-offset, for the reason recorded in
    // L179's file. He Sings was minted as L180 on this branch; main's He
    // Giveth Thee Power to Get Wealth reached 180 first, so this lesson
    // renumbered to L184 on merge (DR-0052) and now sits after L183.
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(here, 'L184 is not in the series').toBeGreaterThan(-1);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll183-/);
  });

  it('carries every field the reader and the facilitator need', () => {
    expect(L.title).toBe('He Sings: Yahweh Over You, Jesus in the Midst of You');
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
  });

  it('every band and the adult lesson clear the fullness floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('the four bands are genuinely different teachings, not one text simplified', () => {
    const m = measureDifferentiation(L);
    for (const [pair, score] of Object.entries(m.pairs)) {
      expect(score, `${pair} bands are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('EVERY quotation is the verse it names', () => {
  const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+)\)/g;

  it('resolves and is letter-for-letter KJV, everywhere in the module', () => {
    const faults = [];
    let checked = 0;
    walkStrings(L, '', (text, path) => {
      SPAN.lastIndex = 0;
      let m;
      while ((m = SPAN.exec(text))) {
        checked += 1;
        const real = verse(m[2].trim(), m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!real.includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked, 'the walk found no quotations at all').toBeGreaterThan(60);
    expect(faults).toEqual([]);
  });

  it('no double-quoted span is unattributed, except Darrell’s own declared words', () => {
    const orphans = [];
    walkStrings(L, '', (text, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(text))) if (!m[2] && !SPOKEN.has(m[1])) orphans.push(`${path}: ${m[1].slice(0, 70)}`);
    });
    expect(orphans).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    walkStrings(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${path}: ${m[1].slice(0, 60)}`);
    });
    expect(elided).toEqual([]);
  });
});

describe('the observation the whole lesson rests on, pinned against the KJV', () => {
  it('Psalms 22:22 says PRAISE and Hebrews 2:12 says SING PRAISE — in both directions', () => {
    const psalm = verse('Psalms', 22, 22);
    const heb = verse('Hebrews', 2, 12);
    // The psalm says praise, and does NOT say sing.
    expect(psalm).toBe('I will declare thy name unto my brethren: in the midst of the congregation will I praise thee.');
    expect(psalm).toContain('will I praise thee');
    expect(psalm).not.toContain('sing');
    // Hebrews quotes it and DOES say sing.
    expect(heb).toBe('Saying, I will declare thy name unto my brethren, in the midst of the church will I sing praise unto thee.');
    expect(heb).toContain('will I sing praise unto thee');
    // And the lesson makes the claim rather than leaving it implied.
    expect(L.lesson).toContain('sing praise');
  });

  it('Psalm 22 really does open with the cry from the cross', () => {
    // The arc is the lesson: the same psalm holds the dereliction and the song.
    expect(verse('Psalms', 22, 1)).toContain('My God, my God, why hast thou forsaken me?');
    expect(verse('Psalms', 22, 3)).toContain('thou that inhabitest the praises of Israel');
  });

  it('Matthew and Mark record the hymn in identical words', () => {
    expect(verse('Matthew', 26, 30)).toBe('And when they had sung an hymn, they went out into the mount of Olives.');
    expect(verse('Mark', 14, 26)).toBe('And when they had sung an hymn, they went out into the mount of Olives.');
  });

  it('Zephaniah 3:17 really ends on the singing, which is the clause nobody quotes', () => {
    expect(verse('Zephaniah', 3, 17)).toContain('he will joy over thee with singing');
  });
});

describe('the five things it could have got wrong', () => {
  const ALL = [L.lesson, L.bigIdea, L.inApp, ...BANDS.map((b) => L.levels[b])].join(' ');

  it('never claims to know WHICH hymn was sung', () => {
    // DR-0098: where the Word is reticent, we stay with what it says.
    expect(L.lesson).toMatch(/does not tell us which hymn/i);
    expect(ALL).not.toMatch(/\bHallel\b/);
  });

  it('keeps the grief beside the song, so the courage is never made cheap', () => {
    expect(L.lesson).toMatch(/exceeding sorrowful/i);
  });

  it('says out loud that the Father’s half is already taught here', () => {
    expect(L.lesson).toMatch(/already appears in two lessons|two lessons in this series already carry/i);
  });

  it('holds singing to teaching and to understanding, not to atmosphere', () => {
    expect(ALL).toContain('teaching and admonishing one another');
    expect(ALL).toContain('I will sing with the understanding also');
  });

  it('ties it to the seats that serve the room, which is what Darrell asked for', () => {
    // His Music/Serve the House insight: the church's physical systems ARE the
    // classroom, and Hebrews 2:12 makes that seat a place He is singing in.
    expect(ALL).toMatch(/soundboard/i);
  });
});

describe('PROVEN-TO-CATCH — the gate goes red on the defects this lesson could ship', () => {
  const faultsIn = (text) => {
    const out = [];
    const re = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+)\)/g;
    let m;
    while ((m = re.exec(text))) {
      const real = verse(m[2].trim(), m[3], m[4]);
      if (real == null || !real.includes(norm(m[1]))) out.push(m[1]);
    }
    return out;
  };

  it('a quotation cited to the neighbouring verse is caught', () => {
    // Hebrews 2:12 attributed to 2:11 — the exact class of defect that four
    // spans of L104 shipped with (Haggai 1:7 text cited to 1:5).
    expect(faultsIn('"in the midst of the church will I sing praise unto thee" (Hebrews 2:12)')).toEqual([]);
    expect(faultsIn('"in the midst of the church will I sing praise unto thee" (Hebrews 2:11)')).toHaveLength(1);
  });

  it('a single altered word inside the quotation marks is caught', () => {
    expect(faultsIn('"And when they had sung an hymn, they went out into the mount of Olives." (Matthew 26:30)')).toEqual([]);
    expect(faultsIn('"And when they had sung a hymn, they went out into the mount of Olives." (Matthew 26:30)')).toHaveLength(1);
  });

  it('a lowered capital His verse carries is caught', () => {
    expect(faultsIn('"Sing praises to God, sing praises" (Psalms 47:6)')).toEqual([]);
    expect(faultsIn('"sing praises to God, sing praises" (Psalms 47:6)')).toHaveLength(1);
  });
});
