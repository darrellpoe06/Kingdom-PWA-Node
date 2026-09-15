// =============================================================================
// L159 — We are all children of Yahweh; no matter how old, for ever children
// to Him. Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Darrell 2026-09-15, spoken: "We are all children of Yahweh!!!" "Lesson!!!"
// "No matter how old we will for ever be children to Him!!!"
//
// Built to the L127/L154 program: ten numbered sections, every verse verbatim
// from app/public/bible/kjv with its reference beside it, four authored bands
// (child, youth, teen, senior — DR-0418), quiz, facilitator notes. The two
// floors the Word keeps are kept and pinned: offspring by making (Acts 17),
// sons by receiving Him (John 1:12) — never collapsed (DR-0098 / DR-0076).
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
const ID = 'll159-we-are-all-children-of-yahweh-no-matter-how-old-for-ever-children-to-him';
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

describe('L159 is in the series, whole', () => {
  it('exists, follows L158, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll158-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('Malachi 2:10; Acts 17:28-29; Luke 3:38')).toBe(true);
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
  it('the directive: all children of Yahweh; no matter how old, for ever children to Him', () => {
    expect(m.lesson).toMatch(/THE DIRECTIVE\. Darrell, 2026-09-15, spoken/);
    expect(m.lesson).toMatch(/we are all children of Yahweh; no matter how old we get, we will for ever be children to Him/);
    expect(m.lesson).toMatch(/FIRST, ONE FATHER MADE US ALL\./);
    expect(m.lesson).toMatch(/FOURTH, A CHILD IS THE DOOR, NOT THE STAGE\./);
    expect(m.lesson).toMatch(/FIFTH, NO MATTER HOW OLD, HE CARRIES YOU\./);
    expect(m.lesson).toMatch(/SEVENTH, HE CALLS GROWN MEN LITTLE CHILDREN\./);
  });
  it('the two floors are kept, never collapsed: offspring by making, sons by receiving Him', () => {
    expect(m.lesson).toMatch(/Being His offspring by making is true of all\. Being His son or daughter by receiving Him is offered to all, and it is received, not assumed\./);
    expect(m.lesson).toMatch(/Everyone is His child by making, and He wants everyone in the house by adoption, and the door is open\./);
    for (const ref of ['Malachi 2:10', 'Acts 17:28', 'Luke 3:38', 'Matthew 6:9', 'Romans 8:15', 'John 1:12', 'Galatians 4:7', '1 John 3:1', 'Matthew 18:3', 'Psalms 131:2', 'Isaiah 46:4', 'Hosea 11:3', 'Hebrews 12:8', 'John 13:33', 'Luke 15:20', 'Psalms 27:10', 'John 14:18', 'Luke 6:35']) expect(m.lesson).toContain(`(${ref})`);
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
  it('the child level teaches the real thing: one Father, Our Father, the door, carried when old, never an orphan', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Psalms 100:3/);
    expect(c).toMatch(/Our Father\. Not Our King\./);
    expect(c).toMatch(/Isaiah 46:4/);
    expect(c).toMatch(/Psalms 27:10/);
    expect(c).toMatch(/Thank You that I will never be too old\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter', 'fornication', 'bastard']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
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
    for (const [book, ch, v, label] of [['Malachi', 2, 10, 'Malachi 2:10'], ['Acts', 17, 28, 'Acts 17:28'], ['Matthew', 6, 9, 'Matthew 6:9'], ['John', 1, 12, 'John 1:12'], ['Matthew', 18, 3, 'Matthew 18:3'], ['Isaiah', 46, 4, 'Isaiah 46:4'], ['Hebrews', 12, 6, 'Hebrews 12:6'], ['John', 13, 33, 'John 13:33'], ['Luke', 15, 20, 'Luke 15:20'], ['Psalms', 27, 10, 'Psalms 27:10']]) {
      const file = book.replace(/ /g, '');
      expect(m.lesson, label).toContain(`"${verse(file, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('Malachi', 2, 10)}" (Malachi 2:10)`);
    expect(m.anchor.theme).toContain(`"${verse('Isaiah', 46, 4)}" (Isaiah 46:4)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('even to hoar hairs will I carry you', 'even to hoar hairs will I carry thee');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('carry thee')).length).toBeGreaterThan(0);
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
  it('the close is the family word, prayed and meant', () => {
    expect(m.lesson).toMatch(/Say Father, and mean it, and let Him carry you\./);
  });
});
