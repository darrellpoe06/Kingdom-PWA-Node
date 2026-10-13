// =============================================================================
// L157 — What is love, in depth and in range: action-based, Word first.
// Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Darrell 2026-09-15, spoken: "the word love... what is love in a depth way,
// in a range way... how do we love each other? Really, and what exactly did
// Yahweh ask... love a person as soon as you meet him... But there's wolves...
// you're still expected to love your enemy and love your neighbour as
// yourself while staying diligent... action based... word first."
//
// Built to the L127/L154 program: ten numbered sections, every verse verbatim
// from app/public/bible/kjv with its reference beside it, four authored bands
// (child, youth, teen, senior — DR-0418), quiz, facilitator notes.
// PROVEN-TO-CATCH: the whole-span check fails on one altered word inside any
// double quote.
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
const ID = 'll157-what-is-love-in-depth-and-in-range-action-based-word-first';
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

describe('L157 is in the series, whole', () => {
  it('exists, follows L156, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll156-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('1 Corinthians 13:4-7; 1 John 4:19; Matthew 22:37-39')).toBe(true);
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
  it('the directive: depth, range, love on meeting, and the wolves', () => {
    expect(m.lesson).toMatch(/THE DIRECTIVE\. Darrell, 2026-09-15, spoken/);
    expect(m.lesson).toMatch(/FIRST, THE WORD DEFINES LOVE BY ITS VERBS\./);
    expect(m.lesson).toMatch(/THIRD, THE RANGE, AND EVERY POINT ON IT IS COMMANDED\./);
    expect(m.lesson).toMatch(/FOURTH, LOVE ON MEETING, AND WHAT IT DOES NOT MEAN\./);
    expect(m.lesson).toMatch(/FIFTH, THE WOLVES ARE REAL, AND LOVE IS NOT NAIVE\./);
    expect(m.lesson).toMatch(/SEVENTH, THE COWORKER, AND WHAT THEY SAID TO EACH OTHER\./);
  });
  it('love is owed now and trust is built; the enemy is fed with the door locked', () => {
    expect(m.lesson).toMatch(/Love is owed immediately; trust is built\./);
    expect(m.lesson).toMatch(/while you keep your door locked/);
    for (const ref of ['1 Corinthians 13:4', '1 John 4:19', 'Matthew 22:39', 'Leviticus 19:34', 'Matthew 5:44', 'Luke 10:33', 'John 2:24', 'Matthew 10:16', '1 Peter 5:8', 'Romans 12:20', 'John 16:33', '1 John 3:18', 'John 21:17']) expect(m.lesson).toContain(`(${ref})`);
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
  it('the child level teaches the real thing: the verbs, the rings, love now and trust built, and the enemy fed', () => {
    const c = m.levels.child;
    expect(c).toMatch(/1 Corinthians 13:4/);
    expect(c).toMatch(/Love comes first\. Trust gets built\./);
    expect(c).toMatch(/Love your enemies/);
    expect(c).toMatch(/Pick one person\. Do one kind thing for them\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter', 'fornication']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
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
    for (const [book, ch, v, label] of [['1 Corinthians', 13, 4, '1 Corinthians 13:4'], ['1 John', 4, 19, '1 John 4:19'], ['Matthew', 22, 39, 'Matthew 22:39'], ['Matthew', 5, 44, 'Matthew 5:44'], ['Luke', 10, 33, 'Luke 10:33'], ['Matthew', 10, 16, 'Matthew 10:16'], ['Romans', 12, 20, 'Romans 12:20'], ['1 John', 3, 18, '1 John 3:18'], ['John', 21, 17, 'John 21:17']]) {
      const file = book.replace(/ /g, '');
      expect(m.lesson, label).toContain(`"${verse(file, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('1Corinthians', 13, 4)}" (1 Corinthians 13:4)`);
    expect(m.anchor.theme).toContain(`"${verse('1John', 3, 18)}" (1 John 3:18)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('Charity suffereth long, and is kind', 'Charity suffereth long, and is nice');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('is nice')).length).toBeGreaterThan(0);
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
  it('the answer to lovest thou me was an assignment', () => {
    expect(m.lesson).toMatch(/Feed my sheep/);
  });
});
