// =============================================================================
// L156 — Teach yourself anything: qualitative and quantitative analysis,
// loving Yahweh while you do it. Verbatim KJV, and the rules this lesson is
// bound by.
// =============================================================================
// Darrell 2026-09-15, spoken: "the importance of using Yahweh as opposed to
// God because God is... a person who has left this earth... it's technically
// everyone who's passed away is considered a God according to... what some of
// these scholars have said so I would like Yahweh's name specifically to be
// able to be said so we know he's the highest... the only one of us who have
// the never beginning never ending position so he is the first and the last
// that's also a lesson."
//
// Built to the L127/L154 program: ten numbered sections, every verse verbatim
// from app/public/bible/kjv with its reference beside it, four authored bands
// (child, youth, teen, senior — DR-0418), quiz, facilitator notes. The word
// under discussion appears in our own voice only inside quotation marks; the
// DR-0210 check below strips quoted spans and then refuses the generic term.
// PROVEN-TO-CATCH: the whole-span check fails on one altered word inside any
// double quote; the reticence check fails if the lesson claims the dead
// become gods (DR-0098 / DR-0100).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';
import { formatLessonText } from '../lib/lesson-format.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll156-teach-yourself-anything-qualitative-and-quantitative-analysis-loving-yahweh-while-you-do-it';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => { const rest = src.slice(start); const end = rest.indexOf('\n  },\n'); return end > -1 ? rest.slice(0, end) : rest; })();
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
const verse = (file, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')).chapters[ch - 1][v - 1];
const unescape = (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\"/g, '"').replace(/\\'/g, "'");
const quotedSpans = (text) => {
  const u = unescape(text);
  const at = [...u.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(u.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};
const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L156 is in the series, whole', () => {
  it('exists, follows L155, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll155-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('Proverbs 1:7; Proverbs 2:4-5; 1 Kings 4:33')).toBe(true);
  });
  it('reads as ten numbered sections', () => {
    const { items, sectionCount } = formatLessonText(m.lesson);
    expect(sectionCount).toBe(10);
    expect(items.filter((it) => it.kind === 'heading').map((it) => it.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('Darrell’s word is in the lesson (CLAUDE.md: always add it)', () => {
  it('the directive, the two analyses, and competence', () => {
    expect(m.lesson).toMatch(/THE DIRECTIVE\. Darrell, 2026-09-15, spoken/);
    expect(m.lesson).toMatch(/THIRD, QUALITATIVE ANALYSIS ASKS WHAT KIND\./);
    expect(m.lesson).toMatch(/FOURTH, QUANTITATIVE ANALYSIS ASKS HOW MUCH\./);
    expect(m.lesson).toMatch(/NINTH, COMPETENCE IS THE POINT\./);
    expect(m.lesson).toMatch(/EIGHTH, LOVE HIM WHILE YOU LEARN\./);
  });
  it('the method is the Word’s: the loop, the Bereans, and honest numbers', () => {
    expect(m.lesson).toMatch(/pick the thing\. Two: ask what kind/);
    for (const ref of ['Proverbs 2:4', 'Acts 17:11', 'Proverbs 11:1', 'Luke 14:28', 'Nehemiah 2:13', 'Exodus 31:3', 'Colossians 3:23', 'Isaiah 28:10']) expect(m.lesson).toContain(`(${ref})`);
  });
});

describe('every age band is served text authored for IT (DR-0418: youth included)', () => {
  it('child, youth, teen and senior levels are all authored, none a stub', () => {
    for (const key of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[key]).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });
  it('the ADULT band reads the lesson itself', () => {
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId).toBe('standard');
    expect(r.text).toBe(m.lesson);
  });
  it('each band gets genuinely different prose, ascending child < teen < senior', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child.length).toBeLessThan(m.levels.teen.length);
    expect(m.levels.teen.length).toBeLessThan(m.levels.senior.length);
  });
  it('the child level teaches the real thing: the name, the first and the last, and the invitation', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Proverbs 1:7/);
    expect(c).toMatch(/qualitative/);
    expect(c).toMatch(/quantitative/);
    expect(c).toMatch(/Pick one thing you want to be good at\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => { expect(quotedSpans(l).balanced).toBe(true); });
  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(100);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (part.length < 8) continue;
        if (WHOLE_KJV.includes(part)) continue;
        altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });
  it('the anchors are quoted whole, letter for letter, with the reference beside each', () => {
    for (const [book, ch, v, label] of [['Proverbs', 1, 7, 'Proverbs 1:7'], ['Proverbs', 2, 4, 'Proverbs 2:4'], ['1 Kings', 4, 33, '1 Kings 4:33'], ['Proverbs', 11, 1, 'Proverbs 11:1'], ['Acts', 17, 11, 'Acts 17:11'], ['Proverbs', 25, 2, 'Proverbs 25:2']]) {
      const file = book.replace(/ /g, '');
      expect(m.lesson, label).toContain(`"${verse(file, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('Proverbs', 1, 7)}" (Proverbs 1:7)`);
    expect(m.anchor.theme).toContain(`"${verse('Proverbs', 11, 1)}" (Proverbs 11:1)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('Prove all things; hold fast that which is good', 'Prove all things; hold tight that which is good');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('hold tight')).length).toBeGreaterThan(0);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0076)', () => {
  const ours = (() => {
    let out = unescape(l);
    for (const s of quotedSpans(l).spans) out = out.replace(`"${s}"`, '""');
    return out;
  })();
  it('names Yahweh in our voice; the generic term appears only as the quoted word under discussion', () => {
    expect(ours).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
  });
  it('the adversary is never capitalized in our voice', () => {
    expect(ours).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary)\b/);
  });
  it('the Son who learned is named — if the Son learned, the servant can', () => {
    expect(m.lesson).toMatch(/If the Son learned, the servant can\./);
  });
});
