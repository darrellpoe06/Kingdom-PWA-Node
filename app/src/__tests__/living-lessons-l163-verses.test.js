// =============================================================================
// L163 — The build we are going for, and why, according to the Word: the school
// of intuitive engineering, technology and people, Yahweh first (DR-0434; the
// school DR-0432; Mathematics DR-0433). Darrell 2026-09-15: "Lesson also to
// explain the build we are going for and why we are going for it according to
// the Word." Every quoted span verbatim KJV; four full bands; ten sections;
// the directive present in the text; proven-to-catch on one altered word.
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
const ID = 'll163-the-build-we-are-going-for-and-why-according-to-the-word-a-school-yahweh-first';
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

describe('L163 is in the series, whole', () => {
  it('exists, follows L162, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll162-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('Exodus 25:9; Exodus 31:3-5; Daniel 1:4')).toBe(true);
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

describe('Darrell\u2019s directive is in the lesson, and the build it describes is the real one (CLAUDE.md: always add it)', () => {
  it('the directive: courses as a tab, Eternal Algorithms inside Learn, Mathematics as a tab, a college and elementary program, intuitive engineering, stakeholders equally, and the lesson itself', () => {
    for (const phrase of ['put the courses in as a tab', 'put the Eternal Algorithms inside Learn', 'add Mathematics as a tab', 'college and an elementary school', 'intuitive engineering', 'hybrid development skills', 'stakeholders supporting their children', 'a lesson to explain the build']) {
      expect(m.lesson, phrase).toContain(phrase);
    }
  });
  it('describes the build as it is shipped: departments, codes, Little Learners, Mathematics from the Word\u2019s numbers, every age, Ari, the Teacher, our own machines', () => {
    for (const phrase of ['Departments across the top', 'catalog code', 'Little Learners', 'every number it works with is a number the Word records', 'written at every age', 'Ari, the tutor', 'labelled AI likeness', 'infrastructure this house owns']) {
      expect(m.lesson, phrase).toContain(phrase);
    }
    expect(m.lesson).toMatch(/It is not a metaphor\. It is running\./);
  });
  it('engineering by name, intuition as instruction, the mandate and the limit, four dimensions, the stakeholders, the cost, and the day of small things', () => {
    for (const ref of ['Exodus 31:3', 'Exodus 36:1', '2 Chronicles 2:14', 'Daniel 1:4', '1 Kings 4:33', 'Isaiah 28:26', 'Isaiah 28:29', 'Genesis 1:28', 'Genesis 2:15', 'Deuteronomy 8:18', 'Luke 2:52', 'Ephesians 4:12', 'Matthew 25:15', '1 Corinthians 12:14', 'Exodus 35:34', 'Exodus 18:21', 'Deuteronomy 6:7', 'Psalms 78:6', 'Isaiah 54:13', 'Judges 2:10', 'Hosea 4:6', 'Isaiah 58:12', 'Matthew 7:24', 'Proverbs 24:27', 'Luke 14:28', 'Zechariah 4:10']) {
      expect(m.lesson, ref).toContain(`(${ref})`);
    }
    expect(m.lesson).toMatch(/Understanding science\. It is in the text\./);
    expect(m.lesson).toMatch(/An app that makes a person more able to follow Him is a tool\. An app that makes a person need it is a trap/);
    expect(m.lesson).toMatch(/the parent is not asked to do what the app can do, and the app is not allowed to do what the parent must/);
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
  it('the child level teaches the real thing: the halls, the plan from Yahweh, Bezaleel, tools serve people, four ways to grow, parents teach, why we build, start small, do one lesson', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Those are like the halls in a school\./);
    expect(c).toMatch(/Exodus 25:9/);
    expect(c).toMatch(/Exodus 31:3/);
    expect(c).toMatch(/Tools serve people\. People do not serve tools\./);
    expect(c).toMatch(/Luke 2:52/);
    expect(c).toMatch(/Deuteronomy 6:7/);
    expect(c).toMatch(/Hosea 4:6/);
    expect(c).toMatch(/Zechariah 4:10/);
    expect(c).toMatch(/That is building on the rock\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter', 'fornication', 'bastard']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
  });
  it('the teen level answers the objections honestly, including that the school is not accredited and does not claim to be', () => {
    expect(m.levels.teen).toMatch(/Is it accredited\? No, and it does not claim to be\./);
    expect(m.levels.teen).toMatch(/Is this indoctrination\?/);
    expect(m.levels.youth).toMatch(/It is not a diploma mill/);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson\u2019s double quotes are balanced', () => { expect(quotedSpans(l).balanced).toBe(true); });
  it('EVERY double-quoted span is verbatim KJV', () => {
    const bad = [];
    for (const span of quotedSpans(l).spans) {
      for (const piece of span.split('...')) {
        const p = piece.trim();
        if (p.length >= 8 && !WHOLE_KJV.includes(p)) bad.push(p.slice(0, 120));
      }
    }
    expect(bad, `not verbatim KJV:\n  ${bad.join('\n  ')}`).toEqual([]);
  });
  it('the anchors are quoted whole, letter for letter, with the reference beside each', () => {
    for (const [book, ch, v, label] of [['Exodus', 25, 9, 'Exodus 25:9'], ['Exodus', 31, 3, 'Exodus 31:3'], ['Daniel', 1, 4, 'Daniel 1:4'], ['Isaiah', 28, 26, 'Isaiah 28:26'], ['Proverbs', 24, 3, 'Proverbs 24:3'], ['Luke', 2, 52, 'Luke 2:52'], ['Deuteronomy', 6, 7, 'Deuteronomy 6:7'], ['Hosea', 4, 6, 'Hosea 4:6'], ['Isaiah', 58, 12, 'Isaiah 58:12']]) {
      expect(m.lesson, label).toContain(`"${verse(book, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('Exodus', 25, 9)}" (Exodus 25:9)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('understanding science', 'understanding sorcery');
    const bad = quotedSpans(tampered).spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('sorcery'));
    expect(bad.length).toBeGreaterThan(0);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0076)', () => {
  const ours = (() => {
    let out = unescape(l);
    for (const s of quotedSpans(l).spans) out = out.replace(`"${s}"`, '""');
    return out;
  })();
  it('names Yahweh in our voice; the generic term appears only inside quoted Scripture', () => {
    expect(ours).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
  });
  it('the adversary is never capitalized in our voice', () => {
    expect(ours).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary)\b/);
  });
  it('the close is the assignment: open Learn, one lesson with a child, the first Mathematics lesson, two levels, then say what is missing', () => {
    expect(m.lesson).toMatch(/press the button in the course that says you want more, and tell Darrell what is missing\./);
  });
});
