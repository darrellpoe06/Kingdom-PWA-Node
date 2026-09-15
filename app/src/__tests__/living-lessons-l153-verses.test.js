// =============================================================================
// L153 — Precept Upon Precept: the Voice That Programs the World. Verbatim KJV,
// and the rules this lesson is bound by.
// =============================================================================
// Spoken by Darrell 2026-09-15 from the mechanical room: a line-numbered
// control program reads top to bottom, jumps by the numbers outside the code,
// and exists to fix reality (supply, return and exhaust fans; valves) — "Yahweh
// programs the world with His voice." Then: "The biblical scriptures work like
// a program to me also," and "the brain retains information better if it uses
// something it knows to remember something new... use same program with
// tweeks." And: "Also add to the living lessons... education for those out
// there who don't know."
//
// Built on L127's program with tweaks (his own principle applied to the build):
// numbered sections, every verse verbatim from app/public/bible/kjv with its
// reference beside it, three age bands, quiz, facilitator notes. This gate
// holds the lesson to that shape and to the house rules. PROVEN-TO-CATCH: the
// whole-span check fails on a single altered word inside any double quote; the
// DR-0210 check fails on one generic "God" in our own voice.
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
const ID = 'll153-precept-upon-precept-the-voice-that-programs-the-world';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
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

// Interpret JS escapes the way the engine does, so the span check sees the
// same characters the reader sees (’ → ’, \' → ').
const unescape = (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'");
const quotedSpans = (text) => {
  const u = unescape(text);
  const at = [...u.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(u.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// Every double-quoted span in this lesson is Scripture. Nothing of ours wears
// quotation marks — Darrell's words are carried in our prose, unquoted, so a
// quote mark in this lesson always means: these are the exact words of the KJV.
const NOT_SCRIPTURE = [];

const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L153 is registered with its full shape (the L127 program, with tweaks)', () => {
  it('the module exists and is in the live series, last in order', () => {
    expect(start, 'L153 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L153 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1].id).toBe(ID);
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
    expect(m.anchor.ref).toMatch(/Isaiah 28:10/);
    expect(m.anchor.ref).toMatch(/Psalms 33:9/);
    expect(m.anchor.ref).toMatch(/Hebrews 11:3/);
  });

  it('reads as numbered sections — FIRST through TENTH — the L127 flow, not a wall', () => {
    const { items, sectionCount } = formatLessonText(m.lesson);
    expect(sectionCount).toBe(10);
    const heads = items.filter((it) => it.kind === 'heading').map((it) => it.n);
    expect(heads).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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

describe('Darrell’s four sentences are all in the lesson, as build input (CLAUDE.md: always add it)', () => {
  it('the program frame, in his words', () => {
    expect(m.lesson).toMatch(/reads the code from top to bottom/);
    expect(m.lesson).toMatch(/numbers that sit outside the code/);
    expect(m.lesson).toMatch(/supply, return and exhaust fans/);
    expect(m.lesson).toMatch(/Yahweh programs the world with His voice/);
  });
  it('the Scriptures work like a program too', () => {
    expect(m.lesson).toMatch(/THE SCRIPTURES WORK LIKE A PROGRAM TOO/);
    expect(m.levels.teen).toMatch(/Scriptures work like a program/);
  });
  it('the brain keeps a new thing on an old hook — same program with tweaks', () => {
    expect(m.lesson).toMatch(/uses something it already knows to hold something new/);
    expect(m.lesson).toMatch(/Same program; the tweak is the Author/);
    expect(m.levels.child).toMatch(/hanging them on things you already know/);
  });
  it('education for those who do not know: the honest word about chapter and verse numbers is told in every band', () => {
    for (const t of [m.lesson, m.levels.teen, m.levels.senior]) {
      expect(t).toMatch(/Langton/);
      expect(t).toMatch(/1551/);
    }
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  it('child, teen and senior levels are all authored, and none is a stub', () => {
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    expect(typeof m.lesson).toBe('string');
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
    expect(c).toMatch(/Genesis 1:3/);
    expect(c).toMatch(/Isaiah 28:10/);
    expect(c, 'the child is told to RUN a line, not only hear it').toMatch(/Do it today/);
    for (const heavy of ['crucifixion', 'slaughter', 'massacre', 'execution', 'sexual', 'actuator', 'hydrological']) {
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
    expect(spans.length).toBeGreaterThan(120);
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
    expect(m.anchor.theme).toContain(`"${verse('Isaiah', 28, 10)}" (Isaiah 28:10)`);
    expect(m.anchor.theme).toContain(`"${verse('Psalms', 33, 9)}" (Psalms 33:9)`);
    expect(m.anchor.theme).toContain(`"${verse('Hebrews', 11, 3)}" (Hebrews 11:3)`);
    expect(m.lesson).toContain(`"${verse('Isaiah', 28, 10)}" (Isaiah 28:10)`);
    expect(m.lesson).toContain(`"${verse('Psalms', 33, 9)}" (Psalms 33:9)`);
    expect(m.lesson).toContain(`"${verse('Hebrews', 11, 3)}" (Hebrews 11:3)`);
  });

  it('the load-bearing lines are exact — the boat, the setpoint, the build order', () => {
    expect(m.lesson).toContain(`"${verse('Mark', 4, 39)}" (Mark 4:39)`);
    expect(m.lesson).toContain(`"${verse('Job', 38, 11)}" (Job 38:11)`);
    expect(m.lesson).toContain(`"${verse('Isaiah', 28, 13)}" (Isaiah 28:13)`);
    expect(m.lesson).toContain(`"${verse('2Peter', 1, 5)}" (2 Peter 1:5)`);
    expect(m.lesson).toContain(`"${verse('James', 1, 22)}" (James 1:22)`);
    expect(m.lesson).toContain(`"${verse('2Timothy', 3, 16)}" (2 Timothy 3:16)`);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('he spake, and it was done', 'he spoke, and it was done');
    const { spans } = quotedSpans(tampered);
    const bad = spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('he spoke, and it was done'));
    expect(bad.length).toBeGreaterThan(0);
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
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });

  it('DR-0100 — the chapter/verse-number history is stated as established fact, named, not hedged', () => {
    expect(m.lesson).toMatch(/Stephen Langton/);
    expect(m.lesson).toMatch(/Robert Estienne/);
    expect(m.lesson).not.toMatch(/some say|it is believed|no one knows/i);
  });

  it('the edge of the picture is stated — He is not a machine (the hook is fenced from becoming an idol)', () => {
    expect(m.lesson).toMatch(/WHERE THE PICTURE STOPS/);
    expect(m.lesson).toMatch(/Yahweh is not a machine/);
    expect(m.lesson).toMatch(/A controller cannot love the building/);
    expect(m.levels.teen).toMatch(/not a machine/);
    expect(m.levels.senior).toMatch(/not a machine/);
  });

  it('Word first — the Word explains the Word: every section teaches from quoted Scripture, not from the analogy alone', () => {
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
