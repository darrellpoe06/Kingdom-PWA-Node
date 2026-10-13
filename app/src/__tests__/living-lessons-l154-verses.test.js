// =============================================================================
// L154 — Why do we have to pay for our fathers' sins? We don't; and it needs
// what we do here. Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Darrell 2026-09-15, a question from his cousin, with his answer and frame in
// five messages: "Why do we have to pay for our father's sins? Answer we
// don't... however it needs what we do here.... Word first responses..." —
// "We have the same familiar spirits etc..." — "Same potential outcomes because
// of our bloodlines etc..." — "Spirit follow framework still out rules
// that..." — "Word life can't be cursed..."
//
// Built on L127's program with tweaks: ten numbered sections, every verse
// verbatim from app/public/bible/kjv with its reference beside it, three age
// bands, quiz, facilitator notes. PROVEN-TO-CATCH: the whole-span check fails
// on a single altered word inside any double quote; the DR-0210 check fails on
// one generic "God" in our own voice; the DR-0100 check fails if the visiting
// texts (Exodus 20:5) are dropped to make the answer easier.
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
const ID = 'll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  // The module closes at the first two-space `},` after its id — inner objects
  // close deeper — so the span never swallows the NEXT lesson's header comment.
  const rest = src.slice(start);
  const end = rest.indexOf('\n  },\n');
  return end > -1 ? rest.slice(0, end) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();
const verse = (file, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')).chapters[ch - 1][v - 1];

const unescape = (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'");
const quotedSpans = (text) => {
  const u = unescape(text);
  const at = [...u.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(u.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// Every double-quoted span in this lesson is Scripture. Darrell's and his
// cousin's words are carried in our prose, unquoted.
const NOT_SCRIPTURE = [];

const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L154 is registered with its full shape (the L127 program, with tweaks)', () => {
  it('the module exists and is in the live series, in order', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll153-'), 'L154 follows L153').toBe(true);
  });
  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape — the rigor of the house, not a light week', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref).toBe('Ezekiel 18:20; Romans 8:2; Proverbs 26:2');
  });
  it('reads as numbered sections — FIRST through TENTH — the L127 flow, not a wall', () => {
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

describe('Darrell’s five sentences are all in the lesson, in his order (CLAUDE.md: always add it)', () => {
  it('the question, and the two-part answer', () => {
    expect(m.lesson).toMatch(/why do we have to pay for our fathers’ sins\?/);
    expect(m.lesson).toMatch(/we don’t — however, it needs what we do here/);
    expect(m.lesson).toMatch(/FIRST, THE STRAIGHT ANSWER: WE DON’T/);
    expect(m.lesson).toMatch(/FIFTH, HOWEVER — IT NEEDS WHAT WE DO HERE/);
  });
  it('the same familiar spirits', () => {
    expect(m.lesson).toMatch(/THIRD, THE SAME FAMILIAR SPIRITS/);
    expect(m.lesson).toMatch(/Familiar means of the family/);
  });
  it('same potential outcomes because of our bloodlines', () => {
    expect(m.lesson).toMatch(/FOURTH, SAME POTENTIAL OUTCOMES BECAUSE OF OUR BLOODLINES/);
    expect(m.lesson).toMatch(/a bloodline is a potential and never a verdict/);
  });
  it('the Spirit-follow framework still overrules that — and points to the how (Lesson 58)', () => {
    expect(m.lesson).toMatch(/SIXTH, THE SPIRIT-FOLLOW FRAMEWORK STILL OVERRULES THAT/);
    expect(m.lesson).toMatch(/Lesson 58, The Wind You Can Hear/);
    expect(LIVING_LESSONS_MODULES.some((x) => x.id === 'll58-the-wind-you-can-hear-perceiving-the-holy-spirit'), 'the lesson it points to must exist').toBe(true);
  });
  it('a Word life cannot be cursed', () => {
    expect(m.lesson).toMatch(/EIGHTH, A WORD LIFE CANNOT BE CURSED/);
    expect(m.levels.child).toMatch(/cannot be cursed/);
    expect(m.levels.teen).toMatch(/a Word life cannot be cursed/);
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  it('child, teen and senior levels are all authored, and none is a stub', () => {
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key]).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });
  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId).toBe('standard');
    expect(r.text).toBe(m.lesson);
  });
  it('each band gets genuinely different prose, ascending in length', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child.length).toBeLessThan(m.levels.teen.length);
    expect(m.levels.teen.length).toBeLessThan(m.levels.senior.length);
  });
  it('the child level teaches the real thing without adult freight', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Ezekiel 18:20/);
    expect(c).toMatch(/We don’t\./);
    expect(c, 'the child is told what to DO here').toMatch(/do the opposite thing one time today/);
    for (const heavy of ['crucifixion', 'slaughter', 'massacre', 'execution', 'sexual', 'necromancer', 'divorce']) {
      expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
    }
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });
  it('EVERY double-quoted span is verbatim KJV (no declared non-Scripture quotation exists in this lesson)', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (part.length < 8) continue;
        if (WHOLE_KJV.includes(part)) continue;
        if (NOT_SCRIPTURE.some((n) => part.includes(n) || n.includes(part))) continue;
        altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });
  it('the three anchors are quoted whole, letter for letter, with the reference beside each', () => {
    for (const [book, ch, v, label] of [['Ezekiel', 18, 20, 'Ezekiel 18:20'], ['Romans', 8, 2, 'Romans 8:2'], ['Proverbs', 26, 2, 'Proverbs 26:2']]) {
      expect(m.anchor.theme).toContain(`"${verse(book, ch, v)}" (${label})`);
      expect(m.lesson).toContain(`"${verse(book, ch, v)}" (${label})`);
    }
  });
  it('the load-bearing lines are exact — the question in the text, the visiting, the son who turns, the tree, the door', () => {
    for (const [book, ch, v, label] of [
      ['Ezekiel', 18, 19, 'Ezekiel 18:19'], ['Ezekiel', 18, 14, 'Ezekiel 18:14'], ['Ezekiel', 18, 31, 'Ezekiel 18:31'], ['Ezekiel', 18, 32, 'Ezekiel 18:32'],
      ['Exodus', 34, 7, 'Exodus 34:7'], ['Deuteronomy', 24, 16, 'Deuteronomy 24:16'], ['Galatians', 3, 13, 'Galatians 3:13'],
      ['Romans', 8, 14, 'Romans 8:14'], ['John', 1, 13, 'John 1:13'], ['Numbers', 23, 23, 'Numbers 23:23'], ['Luke', 15, 20, 'Luke 15:20'],
    ]) {
      expect(m.lesson, label).toContain(`"${verse(book, ch, v)}" (${label})`);
    }
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('The son shall not bear the iniquity of the father', 'The son shall not carry the iniquity of the father');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('shall not carry')).length).toBeGreaterThan(0);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0098, DR-0100)', () => {
  const ours = (() => {
    const { spans } = quotedSpans(l);
    let out = unescape(l);
    for (const s of spans) out = out.split(`"${s}"`).join(' ');
    return out;
  })();
  it('DR-0210 — our authored voice names Yahweh, never the generic "God"', () => {
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(8);
  });
  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Devil']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });
  it('DR-0100 — the hard texts are TAUGHT, not hidden: the visiting (Exodus 20:5), Achan and Korah', () => {
    expect(m.lesson).toContain('(Exodus 20:5)');
    expect(m.lesson).toContain('(Lamentations 5:7)');
    expect(m.lesson).toContain('(Joshua 7:24)');
    expect(m.lesson).toContain('(Numbers 16:32)');
    expect(m.levels.teen).toContain('Exodus 20:5');
    expect(m.levels.senior).toContain('Exodus 20:5');
  });
  it('DR-0098 — the Word explains the Word: the visiting is read by its own clause, and the two silent houses are not explained past the text', () => {
    expect(m.lesson).toMatch(/of them that hate me/);
    expect(m.lesson).toMatch(/The Word does not explain those two the way it explains Ezekiel 18; it records them/);
    expect(m.lesson).not.toMatch(/scholars debate|some say|theologians disagree/i);
  });
  it('guilt and consequence are kept apart, with David as the proof (2 Samuel 12:14)', () => {
    expect(m.lesson).toMatch(/Guilt never transfers; consequence lands in a house/);
    expect(m.lesson).toContain('(2 Samuel 12:14)');
  });
  it('honour is never cancelled — the father is honoured while his sin is refused', () => {
    expect(m.lesson).toContain('(Exodus 20:12)');
    expect(m.lesson).toMatch(/honour is owed, imitation is not/);
  });
  it('Word first — every section teaches from quoted Scripture, not from the frame alone', () => {
    const { items } = formatLessonText(m.lesson);
    const sections = [];
    for (const it of items) {
      if (it.kind === 'heading') sections.push('');
      else if (sections.length) sections[sections.length - 1] += ` ${it.text}`;
    }
    expect(sections).toHaveLength(10);
    for (const s of sections) expect((s.match(/\([1-3]?\s?[A-Z][a-z]+ \d+:\d+(?:-\d+)?\)/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
