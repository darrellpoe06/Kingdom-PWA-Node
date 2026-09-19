// @vitest-environment node
// =============================================================================
// L186 — The Unreasonable Standard and the Honest Error Log
// =============================================================================
// Darrell 2026-09-19, prefixed "Lesson", sending a Stephen Petro breakdown of
// China's gaokao — not to admire the system but to strip a method out of it:
// an unreasonable standard, a CLOSED curriculum, retrieval plus an error log,
// aiming past the finish line, and an open lane of roughly a fifth of the time.
//
// THEN THE CORRECTIONS THAT MADE THE LESSON. Mid-build he sent three, and each
// one is load-bearing rather than decorative:
//
//   "Our reason for learning is Yahweh!!!!!!!!"
//   "Eternal Energy-Efficiency!!!!!!"
//   "We get Him!!!!!!!!!!!!!!!!!!!!"
//   "All these experts and we have Yahweh!!!! No other voice needed!!!!!!!!!"
//
// The first caught a real gap: the draft was all method and never said WHY.
// 2 Timothy 2:15 had been fetched during the build and left out of the lesson,
// which is the single most on-point verse in the set. The second is his own
// framing, and Paul had already set both strivings side by side with identical
// effort and different outcomes (1 Corinthians 9:25). The third is the payoff,
// and it turned out to be inside the lesson's own spine — the passage used for
// aiming past the finish line says why Paul aimed past it: "That I may know
// him" (Philippians 3:10). The fourth is about AUTHORITY, and it is why the
// lesson ends by listing every move and showing the verse that was already
// under it.
//
// THE TRAP, NAMED BEFORE THE METHOD IS PRAISED. The video itself grants the
// system's pressure can be damaging, and a framework this effective is exactly
// what a driven adult turns on a child. DR-0100 tier 3: keep the true method,
// correct the over-reach. Rest is legislated (Exodus 20:9-10), its direction is
// fixed (Mark 2:27), and Solomon said much study wearies the flesh.
//
// WHAT THE BUILD GOT WRONG AND THE GATES CAUGHT, recorded because a gate that
// has never caught anything is not evidence:
//   1. I wrote THREE mistake categories. There are FOUR — I had missed
//      RECOGNITION, which is the one that connects to transfer and the one
//      Jesus names in Matthew 16:3. Darrell's brief corrected it.
//   2. The reference gate caught SIX spans crossing a verse boundary while
//      citing only the first verse (James 1:23 into :24, 1 Corinthians 3:12
//      into :13) — the quotations verbatim, the references wrong.
//   3. The child band rendered ONE numbered point, because its heading "FIRST
//      YOU NEED A REAL FINISH LINE" begins with an ordinal, which the renderer
//      reads as author-numbering and which switches the caps-heading pass off
//      for the WHOLE band. Renamed; the band renders 22 points.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { lessonSectionPlan } from '../lib/lesson-format.js';

const ID = 'll186-the-unreasonable-standard-and-the-honest-error-log';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const book = (b) => {
  const k = String(b).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))
      : (existsSync(alt) ? JSON.parse(readFileSync(alt, 'utf8')) : null));
  }
  return cache.get(k);
};
const verse = (b, ch, spec) => {
  const bk = book(b); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const [a, z] = String(spec).split('-').map(Number);
  const last = Number.isFinite(z) ? z : a;
  const out = [];
  for (let n = a; n <= last; n += 1) { if (chap[n - 1] == null) return null; out.push(chap[n - 1]); }
  return norm(out.join(' '));
};
let CORPUS = null;
const corpus = () => {
  if (CORPUS === null) {
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

// Quoted spans that are deliberately NOT Scripture: the named reasoning
// structures a reader is taught to say out loud, and the worked examples of a
// vague goal against a specific one. Enumerated by exact text so the exemption
// cannot widen into a pattern (DR-0076).
const NOT_SCRIPTURE = new Set([
  'that is correlation being treated as causation,',
  'there is a hidden assumption under that,',
  'get better at piano.',
  'play this exact song, all the way through, with no mistakes, by Christmas.',
  'get better at drawing',
  'draw a human hand from life, correctly, twenty times, by March.',
  'Get better at writing',
  'Publish three thousand words that survive an editor, by June',
]);

describe('the lesson exists and is wired', () => {
  it('is the newest Living Lesson and the count stays honest', () => {
    expect(L, 'L186 is not in the series').toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    const here = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    expect(here).toBeGreaterThan(-1);
    expect(LIVING_LESSONS_MODULES[here - 1].id).toMatch(/^ll185-/);
  });

  it('carries every field, and every band clears its floor and differs from its neighbours', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(16);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
    expect(shortBands(measureFullness(L))).toEqual([]);
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });

  it('PROVEN-TO-CATCH: no band opens a heading with an ordinal word', () => {
    // The child band rendered ONE numbered point because its heading began
    // "FIRST ...". lesson-format treats an ordinal at a sentence start as the
    // author's own numbering and switches the caps-heading pass off for the
    // entire text. This asserts the RENDERED result, not the intent.
    const ORDINAL = /^(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b/;
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      const plan = lessonSectionPlan(t);
      expect(plan.hasExplicit, `${k} tripped the explicit-marker path — every caps heading is now invisible`).toBe(false);
      expect(plan.total, `${k} renders too few numbered points`).toBeGreaterThanOrEqual(15);
      for (const h of plan.headings) {
        const head = h.text.split(/[.:—]/)[0].trim();
        expect(ORDINAL.test(head), `${k}: heading starts with an ordinal -- ${head}`).toBe(false);
        expect(head.split(/\s+/).length, `${k}: heading too long -- ${head}`).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('EVERY quotation is His words, and names the verses it actually spans', () => {
  it('every referenced span is letter-for-letter the verse or range it names', () => {
    const SPAN = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):(\d+(?:-\d+)?)\)/g;
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
    expect(checked).toBeGreaterThan(150);
    expect(faults).toEqual([]);
  });

  it('a span crossing a verse boundary cites the RANGE, and fails against the first verse alone', () => {
    for (const [b, ch, range, tail] of [
      ['James', 1, '23-24', 'straightway forgetteth'],
      ['1 Corinthians', 3, '12-13', 'the fire shall try every man'],
    ]) {
      const whole = verse(b, ch, range);
      expect(whole, `${b} ${ch}:${range} did not resolve`).toBeTruthy();
      expect(whole).toContain(tail);
      expect(verse(b, ch, String(range).split('-')[0]), `${tail} must NOT be in the opening verse alone`).not.toContain(tail);
    }
  });

  it('an unreferenced quotation is either declared non-Scripture or verbatim KJV', () => {
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

describe('Darrell’s four corrections are load-bearing, not decorative', () => {
  it('every register says WHY we learn, and names the examiner', () => {
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      expect(t, `${k} never says the reason for learning`).toMatch(/reason for learning is Yahweh/i);
      expect(t, `${k} drops 2 Timothy 2:15 — the examiner`).toContain('2 Timothy 2:15');
      expect(verse('2 Timothy', 2, '15')).toContain('Study to shew thyself approved unto God');
    }
  });

  it('eternal energy-efficiency is carried with the verse that makes it true', () => {
    // Identical striving, identical cost, different crown. That IS the idea.
    expect(verse('1 Corinthians', 9, '25')).toContain('they do it to obtain a corruptible crown; but we an incorruptible');
    for (const t of [L.lesson, L.levels.child, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t).toMatch(/corruptible crown; but we an incorruptible/);
    }
  });

  it('the reward is HIM, and the lesson’s own spine already said so', () => {
    expect(verse('Genesis', 15, '1')).toContain('I am thy shield, and thy exceeding great reward');
    expect(verse('Philippians', 3, '10')).toContain('That I may know him');
    for (const t of [L.lesson, L.levels.child, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t).toContain('exceeding great reward');
    }
  });

  it('no other voice is needed — and it is stated as AUTHORITY, not as anti-learning', () => {
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      expect(t, `${k} never lands the authority point`).toMatch(/no other voice/i);
      // The honest guard: this lesson came out of a video, so it must not be
      // read as a ban on learning from anyone.
      expect(t, `${k} must not read as anti-learning`).toMatch(/came (from|out of) a video|not anti-learning|never the warrant|never get to outrank/i);
    }
  });
});

describe('the trap, and the parts that must not be overstated', () => {
  it('every band refuses the grinding before it praises the method', () => {
    for (const [k, t] of [['lesson', L.lesson], ...BANDS.map((b) => [b, L.levels[b]])]) {
      expect(t, `${k} omits the sabbath`).toMatch(/Exodus 20:9|Mark 2:27/);
      expect(t, `${k} omits that much study wearies the flesh`).toContain('Ecclesiastes 12:12');
    }
  });

  it('the error log has FOUR categories — recognition is not dropped', () => {
    for (const [k, t] of [['lesson', L.lesson], ['youth', L.levels.youth], ['teen', L.levels.teen], ['senior', L.levels.senior]]) {
      for (const kind of ['KNOWLEDGE', 'RECOGNITION', 'PROCEDURAL', 'PRESSURE']) {
        expect(t, `${k} is missing the ${kind} category`).toContain(kind);
      }
    }
  });

  it('recognition is taught with the verse where Jesus names it', () => {
    expect(verse('Matthew', 16, '3')).toContain('ye can discern the face of the sky; but can ye not discern the signs of the times');
    for (const t of [L.lesson, L.levels.child, L.levels.youth, L.levels.teen, L.levels.senior]) {
      expect(t).toContain('Matthew 16:3');
    }
  });

  it('the video’s own claims are attributed, never asserted as measured by us', () => {
    for (const [k, t] of [['lesson', L.lesson], ['teen', L.levels.teen], ['senior', L.levels.senior]]) {
      expect(t, `${k} states the post-entry research as fact`).toMatch(/not verified by us|attributed here and not asserted|reported here, not verified/i);
    }
  });
});
