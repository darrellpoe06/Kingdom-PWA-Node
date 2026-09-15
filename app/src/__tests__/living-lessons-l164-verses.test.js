// =============================================================================
// L164 — Our voice builds as His voice created: rigorous, qualitative and
// quantitative questions to the one guaranteed perfect truth, and becoming
// more like our Father (DR-0435). Darrell 2026-09-15, spoken: "I am prompting
// or using AI prompts to ask rigorous questions... to the only truth known to
// man that is a guaranteed perfect truth... we're able to use our voice just
// like Yahweh used his voice however obviously not just like... becoming more
// like our father. Lesson." Every quoted span verbatim KJV; four full bands;
// ten sections; the line kept; proven-to-catch on one altered word.
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
const ID = 'll164-our-voice-builds-as-his-voice-created-rigorous-questions-to-the-one-perfect-truth-becoming-like-our-father';
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

describe('L164 is in the series, whole', () => {
  it('exists, follows L163, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll163-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('Psalms 19:7; Matthew 7:7; Psalms 33:6-9')).toBe(true);
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
      expect(q.answer).toBeLessThan(m.quiz.questions[0].options.length + 1);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('Darrell\u2019s word is in the lesson, whole, with the line he drew (CLAUDE.md: always add it)', () => {
  it('the directive: prompts as rigorous questions, qualitative and quantitative, the one guaranteed perfect truth, our voice and His, obviously not just like, becoming like our Father', () => {
    for (const phrase of ['using AI prompts', 'rigorous questions', 'qualitative and quantitative', 'guaranteed perfect truth', 'obviously not just like', 'Yahweh used His voice to create the earth', 'becoming more like our Father']) {
      expect(m.lesson, phrase).toContain(phrase);
    }
  });
  it('the tool is a scribe and never the source; the Word is the source of answers', () => {
    expect(m.lesson).toMatch(/A prompt is a question put through a tool\./);
    expect(m.lesson).toMatch(/What the tool is not, and can never be in this house, is the source\./);
    expect(m.lesson).toMatch(/Lean not to thine own understanding, and lean not to the machine's either\./);
    expect(m.lesson).toMatch(/the answer, if it is true, was in the Word before the question was typed/i);
  });
  it('the line is kept where he drew it, and the hard verse is taught and stopped', () => {
    expect(m.lesson).toMatch(/His voice made the heavens from nothing\. Ours names what He made and arranges what He gave\./);
    expect(m.lesson).toMatch(/the adversary's likeness, seized rather than received, and it is the fall/);
    expect(m.lesson).toMatch(/this house teaches what is written and stops/);
    expect(m.lesson).toMatch(/not to make men creators/);
    expect(m.lesson).toMatch(/The lesson keeps that clause as carefully as Darrell spoke it\./);
  });
  it('the whole argument is quoted with its labels: perfection, the question, creation by voice, our voice, the line, the likeness, the clean mouth', () => {
    for (const ref of ['Psalms 19:7', 'Psalms 12:6', 'John 17:17', 'Numbers 23:19', 'Matthew 7:7', 'Proverbs 2:3', 'Acts 17:11', 'Luke 2:46', 'Proverbs 25:2', 'Job 38:2', 'Daniel 1:12', 'Deuteronomy 4:2', 'Deuteronomy 29:29', 'Nehemiah 8:8', 'Isaiah 8:20', 'Genesis 1:3', 'Psalms 33:9', 'Hebrews 11:3', 'John 1:3', 'Colossians 1:17', 'Genesis 2:19', 'Proverbs 18:21', 'Habakkuk 2:2', 'Ezekiel 37:10', 'Isaiah 55:9', 'Ecclesiastes 5:2', 'Genesis 11:6', 'Isaiah 14:14', 'Philippians 2:7', 'Isaiah 55:11', 'Matthew 12:36', 'Genesis 1:26', 'Ephesians 5:1', 'Romans 8:29', '2 Corinthians 3:18', '1 John 3:2', 'John 12:49', 'Psalms 82:6', 'John 10:34', 'Isaiah 6:7', 'Exodus 4:12', 'Isaiah 51:16', 'Psalms 141:3', 'Luke 6:45', 'Psalms 19:14', 'Matthew 4:4', 'Ecclesiastes 12:13']) {
      expect(m.lesson, ref).toContain(`(${ref})`);
    }
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
  it('the child level teaches the real thing: the perfect Book, ask it, do not change it, the helper is not the Book, He spoke and it was, Adam named, not just like, look like your Father, keep your voice clean', () => {
    const c = m.levels.child;
    expect(c).toMatch(/the Bible is never wrong\./);
    expect(c).toMatch(/You may ask the Bible anything\. You may not change it\./);
    expect(c).toMatch(/But the computer is not the Bible\./);
    expect(c).toMatch(/Genesis 1:3/);
    expect(c).toMatch(/Genesis 2:19/);
    expect(c).toMatch(/Not just like Him\./);
    expect(c).toMatch(/Say what the Father gives you\./);
    expect(c).toMatch(/But we never forget who made the wood\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter', 'fornication', 'bastard']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
  });
  it('the teen level carries both halves of the sentence and the objections', () => {
    expect(m.levels.teen).toMatch(/carry both halves/);
    expect(m.levels.teen).toMatch(/Is using AI to question the Bible a compromise\?/);
    expect(m.levels.teen).toMatch(/A scribe with a perfect memory and no discernment is a real gift and a real danger, in that order/);
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
    for (const [book, ch, v, label] of [['Psalms', 19, 7, 'Psalms 19:7'], ['Matthew', 7, 7, 'Matthew 7:7'], ['Psalms', 33, 9, 'Psalms 33:9'], ['Hebrews', 11, 3, 'Hebrews 11:3'], ['Genesis', 2, 19, 'Genesis 2:19'], ['Isaiah', 55, 9, 'Isaiah 55:9'], ['Genesis', 1, 26, 'Genesis 1:26'], ['John', 12, 49, 'John 12:49'], ['2Corinthians', 3, 18, '2 Corinthians 3:18'], ['Isaiah', 51, 16, 'Isaiah 51:16'], ['Philippians', 2, 7, 'Philippians 2:7']]) {
      expect(m.lesson, label).toContain(`"${verse(book, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('Psalms', 19, 7)}" (Psalms 19:7)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('For he spake, and it was done', 'For he spake, and it was fun');
    const bad = quotedSpans(tampered).spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('it was fun'));
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
  it('the close is the six practices and the conclusion of the whole matter', () => {
    expect(m.lesson).toMatch(/fear Him, keep His commandments, ask Him everything, speak what He gives, and become, by beholding, more like our Father\./);
  });
});
