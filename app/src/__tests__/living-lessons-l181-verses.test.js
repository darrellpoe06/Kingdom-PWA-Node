// @vitest-environment node
// =============================================================================
// L181 — Run It Through the Word: The Two Minds and the Song She Could Not Sing
// =============================================================================
// Darrell's own spoken teaching, 2026-09-19, prefixed "Lesson." His wife was at
// choir rehearsal singing a song whose lyric said she would never let the Holy
// Spirit down, and she stopped -- not from unbelief but from reverence, because
// she did not want to declare an absolute she might not keep in a situation she
// could not foresee. The choir pushed back with their own lenses. They stayed
// in it until the Word settled it, and then everybody sang.
//
// His thesis, in his words: "until you look at the two different minds the word
// talks about, the carnal mind and the spiritual mind, and you process the
// carnal mind's thinking through the spiritual lens to ensure that what it is
// that the word is saying you're okay with, and you can see it in the word and
// it is within the realms of what the word says is okay. That is how you
// reprogram and renew your mind."
//
// MEASURED BEFORE WRITING, against the 179 existing lessons:
//   Romans 8:6 (carnal vs spiritual mind)  11 lessons -- NOT new, and the
//                                          lesson says so rather than claiming
//                                          novelty (L177 is literally "Two
//                                          Minds, and the One You Feed").
//   Ecclesiastes 5:5 (better not to vow)    2 lessons, never applied to a lyric
//   Jude 1:24 (able to keep you falling)    ZERO
// So the doctrine is old here and the RESOLUTION is new -- and the verse that
// resolves it had never been taught in 180 lessons.
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. MAKING HER THE PROBLEM. Treating her hesitation as weak faith would
//      teach the opposite of Ecclesiastes 5:4-5, which backs her instinct
//      outright. Every band must carry the vow caution as legitimate.
//   2. MAKING THE CHOIR THE PROBLEM. They were holding real Scripture --
//      Romans 4:17, Matthew 17:20, and the Daniel 1:8 posture of a purposed
//      heart. Caricaturing them turns a lesson about method into a story about
//      one wise person and some shallow singers.
//   3. THE BOTH-SIDES ENDING. Two sincere readings set beside each other and
//      relabelled "perspective" settles nothing and forms nobody. DR-0098
//      forbids exactly that, and the lesson must NAME the move and refuse it.
//   4. TREATING THE FLESHLY THOUGHT AS A LIE. "I might fail, so I cannot say
//      it" was NOT false -- she might. A carnal thought is often accurate about
//      the flesh and simply blind past it, and a lesson that missed this would
//      teach readers to argue with something partly true.
//   5. RESOLVING IT ON HER STRENGTH. The lyric is singable only because the
//      subject of Jude 1:24 is HIM. If any band lands on her reliability
//      instead of His keeping, the lesson has inverted its own answer.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const ID = 'll181-run-it-through-the-word-the-two-minds-and-the-song-she-could-not-sing';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const verse = (book, ch, n) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  const bk = cache.get(k); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  return chap[Number(n) - 1] == null ? null : norm(chap[Number(n) - 1]);
};
const walk = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, fn);
};

describe('the lesson exists and is wired', () => {
  it('is the 181st Living Lesson and the series count says so', () => {
    expect(L, 'L181 is not in the series').toBeTruthy();
    expect(LIVING_LESSONS_MODULES).toHaveLength(181);
    expect(LIVING_LESSONS_META.weeks).toBe(181);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll180-/);
  });

  it('carries every field the reader and the facilitator need', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
  });

  it('every band clears the fullness floor, and the four are genuinely different', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
    const m = measureDifferentiation(L);
    for (const [pair, score] of Object.entries(m.pairs)) {
      expect(score, `${pair} bands are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('EVERY quotation is the verse it names', () => {
  it('resolves and is letter-for-letter KJV, everywhere in the module', () => {
    const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+)\)/g;
    const faults = [];
    let checked = 0;
    walk(L, '', (text, path) => {
      SPAN.lastIndex = 0;
      let m;
      while ((m = SPAN.exec(text))) {
        checked += 1;
        const real = verse(m[2].trim(), m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!real.includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked, 'the walk found no quotations at all').toBeGreaterThan(90);
    expect(faults).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    walk(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${path}: ${m[1].slice(0, 60)}`);
    });
    expect(elided).toEqual([]);
  });
});

describe('the verse that resolves it, pinned against the KJV', () => {
  it('Jude 1:24 makes HIM the subject — not her', () => {
    // The whole lesson turns on who is able. If this verse ever drifted, the
    // lesson would be resolving the lyric on her own steadiness, which is the
    // exact error it exists to correct.
    const j = verse('Jude', 1, 24);
    expect(j).toBe('Now unto him that is able to keep you from falling, and to present you faultless before the presence of his glory with exceeding joy,');
    expect(j).toContain('him that is able to keep you from falling');
    expect(L.lesson).toContain('able to keep you from falling');
  });

  it('Philippians 2:13 says He works the WILL as well as the DO', () => {
    // This is what answers the choir's instinct more precisely than they said
    // it. Both halves must be in the verse or the claim is overstated.
    const p = verse('Philippians', 2, 13);
    expect(p).toBe('For it is God which worketh in you both to will and to do of his good pleasure.');
    expect(p).toContain('both to will and to do');
  });

  it('and Ecclesiastes really does back her caution', () => {
    expect(verse('Ecclesiastes', 5, 5)).toBe('Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.');
  });
});

describe('the five things it could have got wrong', () => {
  const ALL = [L.lesson, L.bigIdea, L.inApp, ...BANDS.map((b) => L.levels[b])].join(' ');

  it('treats her hesitation as reverence, never as weak faith', () => {
    expect(ALL).toMatch(/reverence/i);
    expect(ALL).toMatch(/not from unbelief|Not because she did not|It was not because she did not/i);
  });

  it('gives the choir their due — they were holding real Scripture', () => {
    expect(ALL).toContain('calleth those things which be not as though they were');
    expect(ALL).toContain('purposed in his heart');
  });

  it('NAMES the both-sides move and refuses it (DR-0098)', () => {
    expect(L.lesson).toMatch(/perspective/i);
    expect(ALL).toMatch(/settled it|settles it|until the Word settled/i);
  });

  it('says plainly that her fleshly thought was not false', () => {
    // The distinction the method depends on.
    expect(ALL).toMatch(/was not stupid|was NOT false|not false|accurate about the flesh/i);
  });

  it('is honest that the two-minds doctrine is NOT new here', () => {
    expect(L.lesson).toMatch(/taught that doctrine before|This series has taught/i);
  });

  it('carries the Tuesday that proved it, not just the rehearsal', () => {
    expect(ALL).toMatch(/feelings had nothing to do with (her )?capability/i);
    expect(ALL).toMatch(/notes/i);
  });
});
