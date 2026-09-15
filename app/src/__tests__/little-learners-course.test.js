// =============================================================================
// Little Learners — the gate (DR-0431). Pre-K reading and counting FROM THE WORD.
// =============================================================================
// Darrell 2026-09-15: "the reading is the Word... I want the Word to literally
// be what they're reading while they learn to read... math that is totally
// Word based." Every lesson here is the child text itself; every quoted span
// is verbatim KJV; the check reads its choices aloud; Ari is in child mode.
// PROVEN-TO-CATCH: the whole-span check fails on one altered word.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LITTLE_LEARNERS_MODULES, LITTLE_LEARNERS_META, LITTLE_LEARNERS_TUTOR_META, LITTLE_LEARNERS_SESSION_FLOW } from '../lib/little-learners-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { fleschKincaidGrade, ourProseOnly } from '../../../scripts/reading-level.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'little-learners-class.js'), 'utf8');
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

describe('the course is whole and registered', () => {
  it('six lessons in slice 1, the meta counts them, and the catalog carries the course with a Word-first frame', () => {
    expect(LITTLE_LEARNERS_MODULES.length).toBe(6);
    expect(LITTLE_LEARNERS_META.weeks).toBe(LITTLE_LEARNERS_MODULES.length);
    expect(LITTLE_LEARNERS_META.wordFirst.ref).toMatch(/Deuteronomy 6:7/);
    expect(LITTLE_LEARNERS_META.wordFirst.frame.length).toBeGreaterThan(80);
    const entry = LEARN_CATALOG.find((c) => c.key === 'little-learners');
    expect(entry).toBeTruthy();
    expect(entry.wiring).toBe('self-paced');
    expect(entry.tutorCourseMeta.childMode).toBe(true);
    expect(LITTLE_LEARNERS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBeLessThanOrEqual(15);
  });
});

describe('every lesson is written for a little learner', () => {
  for (const m of LITTLE_LEARNERS_MODULES) {
    it(`${m.id}: short sentences (FK ≤ 2), a hook, a hands-on, a redoable check that reads its choices`, () => {
      expect(m.lesson.length).toBeGreaterThan(1000);
      expect(fleschKincaidGrade(ourProseOnly(m.lesson))).toBeLessThanOrEqual(2.0);
      expect(m.bigIdea.length).toBeGreaterThan(40);
      expect(m.inApp.length).toBeGreaterThan(40);
      expect(m.readOptionsAloud).toBe(true);
      expect(m.quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        for (const o of q.options) expect(o.split(/\s+/).length, `option too long to hear: ${o}`).toBeLessThanOrEqual(6);
        expect(q.explain.length).toBeGreaterThan(20);
      }
      expect(m.facilitator.howToRun).toMatch(/No grown-up is needed/);
    });
    it(`${m.id}: every double-quoted span is verbatim KJV, and every anchor is quoted whole with its label`, () => {
      const start = src.indexOf(`id: '${m.id}'`); expect(start).toBeGreaterThan(-1);
      const rest = src.slice(start); const end = ["\n  { id: '", '\n];'].map((k) => rest.indexOf(k)).filter((i) => i > -1).sort((a, b) => a - b)[0]; const l = end > -1 ? rest.slice(0, end) : rest;
      const { out, balanced } = spans(l);
      expect(balanced).toBe(true);
      const altered = out.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s));
      expect(altered, `not verbatim KJV:\n${altered.map((s) => ` - "${s}"`).join('\n')}`).toEqual([]);
      for (const ref of m.anchor.ref.split(';').map((r) => r.trim())) expect(m.lesson + ' ' + m.anchor.theme, ref).toContain(`(${ref})`);
    });
    it(`${m.id}: our voice names Yahweh, never the generic term, and never capitalizes the adversary`, () => {
      const start = src.indexOf(`id: '${m.id}'`); const rest = src.slice(start); const end = ["\n  { id: '", '\n];'].map((k) => rest.indexOf(k)).filter((i) => i > -1).sort((a, b) => a - b)[0]; const l = end > -1 ? rest.slice(0, end) : rest;
      const o = ours(l);
      expect(o).not.toMatch(/\bGod\b/);
      expect(o).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary)\b/);
    });
  }
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = src.replace('Give us this day our daily bread', 'Give us this day our daily cake');
    const { out } = spans(tampered);
    expect(out.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('daily cake')).length).toBeGreaterThan(0);
  });
});

describe('Ari, for the children', () => {
  it('the child-mode posture carries the four rules: only from the lesson and the Word; never a link; short; a grown-up for the rest', () => {
    const p = LITTLE_LEARNERS_TUTOR_META.posture;
    expect(p).toMatch(/CHILD MODE/);
    expect(p).toMatch(/ONLY from this lesson and from the Bible verses in it/);
    expect(p).toMatch(/Never give a link/);
    expect(p).toMatch(/very short sentences/);
    expect(p).toMatch(/grown-up/);
    expect(p).toMatch(/Never ask the child for their name/);
    expect(p).toMatch(/Say Yahweh for the Father/);
  });
});
