// @vitest-environment node
// =============================================================================
// L182 — Two Witnesses: Jesus Counted Them Himself
// =============================================================================
// Darrell 2026-09-19, prefixed "Lesson.", sending a debate between a GodLogic
// representative and a student of Gino Jennings on the Father and the Son --
// John 8:16-18 and the law of witnesses, and Hebrews 1:2 on whether the Son
// existed before creation or was "premeditated" in the mind of God.
//
// THE POSTURE HE SET, which corrected a drift toward false symmetry in the
// first draft: "This is different because someone is using the Word to explain
// the Word... one is not... stay focused on the Word and those who agree are
// with Him...."
//
// So this is NOT a both-sides lesson and staging it as one would BE the
// violation. DR-0098's own standard is that the Word explains the Word. One
// reading lets John 8:17-18 mean what it says by the evidence rule Jesus
// Himself cited; the other brings a prior system and makes the text yield. The
// lesson lands the answer (DR-0100: established truth is stated, not hedged)
// while naming no camps and no teachers -- the measure is agreement with the
// WORD, never with a man.
//
// MEASURED BEFORE WRITING, against the 181 existing lessons:
//   John 8:16   1 lesson (ll136)
//   John 8:17   ZERO
//   John 8:18   ZERO
//   "modalis*"  ZERO -- this house had never named that fight
//   "Trinity"   1 lesson; "Godhead" 185 hits across 30 -- so the house's own
//               vocabulary is GODHEAD, and Colossians 2:9 shows it is the
//               Word's own word, said of Christ.
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//   1. SCORING A DEBATE. Naming the men or their camps turns a passage into a
//      team sport and half the room stops reading to defend somebody.
//   2. FALSE SYMMETRY. Presenting both readings as equally text-derived would
//      be the ratings-style move DR-0098 forbids.
//   3. LANDING ON PHILOSOPHY. Defining personhood as a rational agent and then
//      testing the Godhead against the definition is the SAME error the lesson
//      corrects, entering from the other side. A definition men built is a
//      tool, never the authority.
//   4. THE OPPOSITE DITCH. Distinguishing Father and Son does not yield two
//      gods or three. Deuteronomy 6:4 must stand untouched in every band.
//   5. WINNING CRUELLY. The people who hold the other view were mostly taught
//      it by someone who loved them. Every band ends by teaching the passage
//      rather than the argument.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const ID = 'll182-two-witnesses-jesus-counted-them-himself';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const verse = (book, ch, n) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  const bk = cache.get(k); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  return chap[Number(n) - 1] == null ? null : norm(chap[Number(n) - 1]);
};
let CORPUS = null;
const corpus = () => {
  if (CORPUS === null) {
    const { readdirSync } = require('node:fs');
    let all = '';
    for (const f of readdirSync(KJV)) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      const bk = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
      if (Array.isArray(bk.chapters)) for (const ch of bk.chapters) all += ` ${ch.join(' ')}`;
    }
    CORPUS = norm(all);
  }
  return CORPUS;
};
const walk = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, fn);
};

// Quoted spans that are deliberately NOT Scripture: the child band's playground
// dialogue, and one sentence the Lord explicitly did NOT say. Enumerated by
// exact text so the exemption cannot widen into a pattern (DR-0076).
const NOT_SCRIPTURE = new Set([
  'I did all my chores.',
  'Prove it.',
  'Yes, he did them all,',
  'Can you show me where?',
  'I am the boss, so I do not need a rule.',
]);

describe('the lesson exists and is wired', () => {
  it('is the 182nd Living Lesson and sits after L181', () => {
    expect(L, 'L182 is not in the series').toBeTruthy();
    // The count is an INVARIANT here, not a literal. Pinning the number was
    // itself the defect: L181, L182 and L183 each appended one lesson and each
    // append broke a hardcoded total in a file that had nothing to do with the
    // new lesson -- which teaches the next author to bump a digit instead of
    // reading the assertion. What must be true is that the series length and
    // the declared week count agree. That is what is pinned now.
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll181-/);
  });

  it('carries every field, and every band clears its floor and differs from its neighbours', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(shortBands(measureFullness(L))).toEqual([]);
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('EVERY quotation is His words', () => {
  it('every referenced span is letter-for-letter the verse it names', () => {
    const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+)\)/g;
    const faults = []; let checked = 0;
    walk(L, '', (text, path) => {
      SPAN.lastIndex = 0; let m;
      while ((m = SPAN.exec(text))) {
        checked += 1;
        const real = verse(m[2].trim(), m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!real.includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM — ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked).toBeGreaterThan(100);
    expect(faults).toEqual([]);
  });

  it('an unreferenced quotation is either declared non-Scripture or verbatim KJV', () => {
    // The child band re-quotes fragments a sentence after citing them in full,
    // which is ordinary teaching prose. Those must still be His words.
    const bad = [];
    walk(L, '', (text, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(text))) {
        if (m[2]) continue;
        const q = m[1];
        if (NOT_SCRIPTURE.has(q)) continue;
        const bare = norm(q).replace(/[.,]+$/, '');
        if (!corpus().includes(bare)) bad.push(`${path}: ${q.slice(0, 60)}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('carries no ellipsis inside any quotation (DR-0459)', () => {
    const elided = [];
    walk(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]*(?:\.\.\.|…)[^"]*)"/g)) elided.push(`${path}: ${m[1].slice(0, 50)}`);
    });
    expect(elided).toEqual([]);
  });
});

describe('the argument the lesson turns on, pinned against the KJV', () => {
  it('He ruled His own solo testimony insufficient BEFORE the two-witness claim', () => {
    // Without John 5:31 the argument is an inference. With it, it is His own mouth.
    expect(verse('John', 5, 31)).toBe('If I bear witness of myself, my witness is not true.');
  });

  it('the law He cited refuses ONE witness and requires two', () => {
    const d = verse('Deuteronomy', 19, 15);
    expect(d).toContain('One witness shall not rise up against a man');
    expect(d).toContain('at the mouth of two witnesses');
  });

  it('and He counted Himself one and the Father the other', () => {
    expect(verse('John', 8, 17)).toBe('It is also written in your law, that the testimony of two men is true.');
    expect(verse('John', 8, 18)).toBe('I am one that bear witness of myself, and the Father that sent me beareth witness of me.');
    expect(verse('John', 8, 16)).toContain('I am not alone, but I and the Father that sent me');
  });

  it('Hebrews 1:2 says the worlds were made BY Him, and the Father calls Him God', () => {
    expect(verse('Hebrews', 1, 2)).toContain('by whom also he made the worlds');
    expect(verse('Hebrews', 1, 8)).toContain('Thy throne, O God, is for ever and ever');
  });

  it('and the tense in His prayer is past, and WITH thee', () => {
    expect(verse('John', 17, 5)).toContain('the glory which I had with thee before the world was');
    expect(verse('John', 17, 24)).toContain('thou lovedst me before the foundation of the world');
  });

  it('GODHEAD is the Word’s own word, said of Christ', () => {
    expect(verse('Colossians', 2, 9)).toBe('For in him dwelleth all the fulness of the Godhead bodily.');
  });
});

describe('the five things it could have got wrong', () => {
  const ALL = [L.lesson, L.bigIdea, L.inApp, ...BANDS.map((b) => L.levels[b])].join(' ');

  it('names no teacher and no camp as a team to join', () => {
    expect(ALL).not.toMatch(/Jennings/i);
    expect(ALL).not.toMatch(/GodLogic/i);
  });

  it('refuses the both-sides ending and says so', () => {
    expect(L.lesson).toMatch(/not going to score a debate/i);
    expect(L.lesson).toMatch(/not going to name camps/i);
  });

  it('keeps a man-made definition subordinate to the Word', () => {
    expect(ALL).toMatch(/is a tool|instruments and not as authorities|not the authority/i);
    expect(ALL).toContain('the Father that sent me');
  });

  it('guards the opposite ditch — one LORD, in every band', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} band drops the one-LORD guard`).toMatch(/The LORD our God is one LORD/);
    }
    expect(ALL).toMatch(/[Dd]istinct(ion)? is not separat|not the same as separate/);
  });

  it('ends by teaching the passage rather than winning the argument', () => {
    expect(ALL).toMatch(/not your enemy|are not your enemy|not an enemy/i);
    expect(ALL).toMatch(/John 5:31, then Deuteronomy 19:15, then John 8:17-18/);
  });
});
