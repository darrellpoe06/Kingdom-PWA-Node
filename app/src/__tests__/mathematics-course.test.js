// =============================================================================
// Mathematics — the gate (DR-0433). Word-based mathematics, slice 1, Elementary.
// =============================================================================
// Darrell 2026-09-15: "add Mathematics as a Tab"; "math that is totally Word
// based... the math of the Bible... qualitative and quantitative ways of math,
// like engineering." Every number a lesson works with is one the Word
// records; every quoted span is verbatim KJV; the register is elementary
// (FK ≤ 5.0, DR-0417 D3's age number); the working is shown; the check reads
// its choices aloud and can be redone; Ari shows the working and never invents
// a figure. PROVEN-TO-CATCH: the whole-span check fails on one altered word,
// and the arithmetic the lessons state is re-computed here, not trusted.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATHEMATICS_MODULES, MATHEMATICS_META, MATHEMATICS_TUTOR_META, MATHEMATICS_SESSION_FLOW } from '../lib/mathematics-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { fleschKincaidGrade, ourProseOnly } from '../../../scripts/reading-level.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'mathematics-class.js'), 'utf8');
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j; try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();
const unescape = (t) => t.replace(/\\'/g, "'");
const spans = (text) => { const u = unescape(text); const at = [...u.matchAll(/"/g)].map((m) => m.index); const out = []; for (let i = 0; i + 1 < at.length; i += 2) out.push(u.slice(at[i] + 1, at[i + 1])); return { out, balanced: at.length % 2 === 0 }; };
const ours = (text) => spans(text).out.reduce((t, s) => t.replace(`"${s}"`, '""'), unescape(text));
const slice = (id) => { const start = src.indexOf(`id: '${id}'`); const rest = src.slice(start); const end = ["\n  { id: '", '\n];'].map((k) => rest.indexOf(k)).filter((i) => i > -1).sort((a, b) => a - b)[0]; return end > -1 ? rest.slice(0, end) : rest; };

describe('the course is whole and registered as its own department', () => {
  it('eight lessons in slice 1, the meta counts them, Elementary is declared, and the catalog carries it under Mathematics with a Word-first frame', () => {
    expect(MATHEMATICS_MODULES.length).toBe(8);
    expect(MATHEMATICS_META.weeks).toBe(MATHEMATICS_MODULES.length);
    expect(MATHEMATICS_META.programLevel).toBe('Elementary');
    expect(MATHEMATICS_META.wordFirst.ref).toMatch(/Psalms 147:4/);
    expect(MATHEMATICS_META.wordFirst.frame.length).toBeGreaterThan(80);
    const entry = LEARN_CATALOG.find((c) => c.key === 'mathematics');
    expect(entry).toBeTruthy();
    expect(entry.wiring).toBe('self-paced');
    expect(entry.meta.category).toBe('Mathematics');
    expect(MATHEMATICS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBeLessThanOrEqual(25);
  });
  it('the slice covers the eight strands Darrell named the math of the Bible by', () => {
    const ids = MATHEMATICS_MODULES.map((m) => m.id).join(' ');
    for (const strand of ['place-value', 'adding-and-taking-away', 'multiplying-and-sharing', 'fractions', 'measure', 'shapes', 'time-and-cycles', 'quality-and-quantity']) expect(ids).toContain(strand);
  });
});

describe('every lesson: elementary register, the working shown, a redoable check that reads its choices', () => {
  for (const m of MATHEMATICS_MODULES) {
    it(`${m.id}: FK ≤ 5, substantial, a number sentence on the page, quiz ≥ 6 with hearable options`, () => {
      expect(m.lesson.length).toBeGreaterThan(2500);
      expect(fleschKincaidGrade(ourProseOnly(m.lesson))).toBeLessThanOrEqual(5.0);
      expect(m.bigIdea.length).toBeGreaterThan(40);
      expect(m.inApp.length).toBeGreaterThan(40);
      expect(m.readOptionsAloud).toBe(true);
      // the working is SHOWN: at least one written number sentence or a "shared by" step
      expect(ourProseOnly(m.lesson)).toMatch(/\d[\d,]* [+x-] \d[\d,]* = \d[\d,]*|shared by \w+ is|divided by \d+ = \d+/);
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(6);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        for (const o of q.options) expect(o.split(/\s+/).length, `option too long to hear: ${o}`).toBeLessThanOrEqual(9);
        expect(q.explain.length).toBeGreaterThan(20);
      }
      expect(m.facilitator.howToRun).toMatch(/No grown-up is needed/);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(3);
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
    });
    it(`${m.id}: every double-quoted span is verbatim KJV, and every anchor is quoted whole with its label`, () => {
      const l = slice(m.id);
      const { out, balanced } = spans(l);
      expect(balanced).toBe(true);
      expect(out.length).toBeGreaterThanOrEqual(4);
      const altered = out.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s));
      expect(altered, `not verbatim KJV:\n${altered.map((s) => ` - "${s}"`).join('\n')}`).toEqual([]);
      for (const ref of m.anchor.ref.split(';').map((r) => r.trim())) expect(m.lesson + ' ' + m.anchor.theme, ref).toContain(`(${ref})`);
    });
    it(`${m.id}: our voice names Yahweh, never the generic term, and never capitalizes the adversary`, () => {
      const o = ours(slice(m.id));
      expect(o).not.toMatch(/\bGod\b/);
      expect(o).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary)\b/);
    });
  }
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = src.replace('He telleth the number of the stars', 'He telleth the number of the cars');
    const { out } = spans(tampered);
    expect(out.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('the cars')).length).toBeGreaterThan(0);
  });
});

describe('the arithmetic the lessons state is true (re-computed, not trusted — DR-0076 §4)', () => {
  const text = MATHEMATICS_MODULES.map((m) => ourProseOnly(m.lesson)).join(' ');
  const sentences = [...text.matchAll(/(\d[\d,]*) ([+x-]) (\d[\d,]*) = (\d[\d,]*)/g)];
  it('every written number sentence on the page computes', () => {
    expect(sentences.length).toBeGreaterThanOrEqual(12);
    for (const [, a, op, b, c] of sentences) {
      const A = Number(a.replace(/,/g, '')), B = Number(b.replace(/,/g, '')), C = Number(c.replace(/,/g, ''));
      const got = op === '+' ? A + B : op === '-' ? A - B : A * B;
      expect(got, `${a} ${op} ${b} = ${c}`).toBe(C);
    }
  });
  it('the census figure, the jubilee count and the sea’s ratio are the Word’s own numbers', () => {
    expect(text).toContain('603,550');
    expect(text).toMatch(/7 x 7 = 49/);
    expect(text).toMatch(/49 \+ 1 = 50/);
    expect(text).toMatch(/Thirty shared by ten is three/);
    // and the honest line: the Word gives a builder's measure, not a formula
    expect(text).toMatch(/not teaching a formula/);
    expect(text).toMatch(/a little more than three/);
  });
});

describe('Ari, for mathematics', () => {
  it('shows the working, every number from the Word, never invents or rounds a Bible number, names what mathematics adds', () => {
    const p = MATHEMATICS_TUTOR_META.posture;
    expect(p).toMatch(/Show the working/);
    expect(p).toMatch(/never invent a figure/);
    expect(p).toMatch(/never round a Bible number/);
    expect(p).toMatch(/the Word records the measure and mathematics gives it that name/);
    expect(p).toMatch(/Say Yahweh for the Father/);
  });
});
