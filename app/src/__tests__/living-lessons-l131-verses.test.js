// @vitest-environment node
// =============================================================================
// L131 — Joy Is Not Happiness: three days, one strength. Verbatim KJV, and the
// claims this lesson may never lose.
// =============================================================================
// Spoken into the app by Darrell on 2026-09-08: happiness depends on what
// happens — good day, good mood; joy is a steady strength carried IN, even on a
// hard day; the Word says the joy of the LORD is your strength to people who
// were crying at the time; you do not have to wait for things to get good to
// have it. His ask: what do a bad day, an okay day and a great day look like,
// run on the Word as the code to the process?
//
// The gate pins three things. (1) Every double-quoted span is verbatim KJV from
// the in-repo corpus, single-verse only — the L130 lesson (a welded 2:14+2:15
// span) is re-proven below on THIS lesson's own material: 1 Thessalonians
// 5:16-17 welded into one span is NOT corpus text, so the gate would catch it.
// (2) The teaching's spine cannot drift out: the weeping crowd of Nehemiah 8:9
// is read before 8:10, Habakkuk's Yet follows his six failures, the okay day is
// named the dangerous one, the great day is re-sourced by Luke 10:20, and the
// Lamb of Yahweh carries the worst day on joy (Hebrews 12:2). (3) The house
// rules: Yahweh in our voice, quoted "God" untouched, the adversary lowercase.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them';
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

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// Deliberately EMPTY: every double-quoted span in L131 is verbatim KJV. Darrell's
// spoken words are rendered for meaning without quotation marks (DR-0331), and
// our own emphasis uses capitals, never quotes.
const NOT_SCRIPTURE = [];

describe('L131 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L131 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L131 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Nehemiah 8:9-10/);
    expect(m.anchor.ref).toMatch(/Habakkuk 3:17-19/);
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

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('child, teen and senior levels are all authored, and none is a stub', () => {
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    expect(typeof m.lesson, 'L131 must carry a base lesson for the adult band').toBe('string');
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId, 'the adult band must resolve to its own depth').toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('each band gets genuinely different prose, not the same text relabelled', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child).not.toBe(m.levels.senior);
    expect(m.levels.child.length, 'a child does not read an adult wall of text').toBeLessThan(m.levels.senior.length);
  });

  it('the child level teaches the real distinction and all three days, warmly', () => {
    const c = m.levels.child;
    expect(c, 'a child is told the two kinds of glad').toMatch(/two different kinds of glad/);
    expect(c, 'a child hears the anchor verse').toContain('the joy of the LORD is your strength');
    expect(c, 'a child is told the crowd was crying').toMatch(/crying/);
    expect(c).toMatch(/BAD day/);
    expect(c).toMatch(/OKAY day/);
    expect(c).toMatch(/GREAT day/);
    expect(c, 'a child is left with Jesus').toMatch(/Jesus is the best example/);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('every double-quoted span is verbatim KJV from the in-repo corpus (single-verse spans)', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(40);
    const bad = spans.filter((s) => !NOT_SCRIPTURE.includes(s) && !WHOLE_KJV.includes(s));
    expect(bad, `not verbatim KJV:\n${bad.map((b) => `  "${b}"`).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH — a welded two-verse span is not corpus text, so the gate would refuse it', () => {
    // 1 Thessalonians 5:16 and 5:17 are quoted separately in the lesson; welded
    // into one span they are not verbatim (the corpus keeps the verse boundary).
    expect(WHOLE_KJV.includes('Rejoice evermore.')).toBe(true);
    expect(WHOLE_KJV.includes('Pray without ceasing.')).toBe(true);
    expect(WHOLE_KJV.includes('Rejoice evermore. Pray without ceasing.')).toBe(false);
  });

  it('the anchor verses are quoted as written — LORD (Yahweh) and Lord (Adonai) kept apart in Nehemiah 8:10', () => {
    expect(l).toContain('neither be ye sorry; for the joy of the LORD is your strength');
    expect(l).toContain('For all the people wept, when they heard the words of the law.');
    expect(l).toContain('Yet I will rejoice in the LORD, I will joy in the God of my salvation.');
    expect(l).toContain('The LORD God is my strength');
    expect(l).toContain('These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.');
  });
});

describe('the spine of the teaching cannot drift out', () => {
  it('the distinction is stated up front and committed to (DR-0100)', () => {
    expect(l).toMatch(/JOY IS NOT HAPPINESS/);
    expect(l).toMatch(/Happiness is weather\. Joy is the power line\. Strength is on the power line\./);
    expect(l).toMatch(/You do not have to wait for things to get good to have it/);
  });

  it('the weeping crowd is the argument — Nehemiah 8:9 is read before 8:10', () => {
    const wept = l.indexOf('For all the people wept, when they heard the words of the law.');
    const strength = l.indexOf('neither be ye sorry; for the joy of the LORD is your strength');
    expect(wept).toBeGreaterThan(-1);
    expect(strength).toBeGreaterThan(-1);
    expect(l).toMatch(/Read Nehemiah 8:9 BEFORE 8:10/);
  });

  it('the four-line code is named and runs the same on every day', () => {
    for (const line of ['READ', 'SOURCE', 'ACT', 'STRENGTH']) expect(l).toMatch(new RegExp(`\\b${line}\\b`));
    expect(l).toMatch(/the four lines do not change when the day does/);
  });

  it('all three days are worked, in order, from the Word', () => {
    const bad = l.indexOf('DAY ONE — THE BAD DAY');
    const okay = l.indexOf('DAY TWO — THE OKAY DAY');
    const great = l.indexOf('DAY THREE — THE GREAT DAY');
    expect(bad).toBeGreaterThan(-1);
    expect(okay).toBeGreaterThan(bad);
    expect(great).toBeGreaterThan(okay);
    // Bad day: Habakkuk's six failures, then the Yet.
    expect(l).toContain('Although the fig tree shall not blossom, neither shall fruit be in the vines; the labour of the olive shall fail, and the fields shall yield no meat; the flock shall be cut off from the fold, and there shall be no herd in the stalls:');
    expect(l).toMatch(/Six failures/);
    // Okay day: named the dangerous one; rejoicing attached to the Maker of the day.
    expect(l).toMatch(/This is the dangerous one/);
    expect(l).toContain('This is the day which the LORD hath made; we will rejoice and be glad in it.');
    // Great day: re-sourced, not removed.
    expect(l).toContain('Notwithstanding in this rejoice not, that the spirits are subject unto you; but rather rejoice, because your names are written in heaven.');
    expect(l).toMatch(/He did not take their joy away; He moved it off the result/);
    expect(l).toContain('My power and the might of mine hand hath gotten me this wealth');
  });

  it('the proof case is the Lamb of Yahweh, and the theft-proof clause seals it', () => {
    expect(l).toContain('who for the joy that was set before him endured the cross');
    expect(l).toContain('your joy no man taketh from you');
  });

  it('the empty day is given a prayer, never a demand to feel better', () => {
    expect(l).toContain('Restore unto me the joy of thy salvation');
    expect(l).toMatch(/a prayer, not a performance/);
  });

  it('DR-0098 — the Word is taught, not a debate staged (no camps, no both-sides)', () => {
    expect(/scholars (?:disagree|debate)|some (?:say|argue)|two views|you decide/i.test(l)).toBe(false);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0099)', () => {
  const ours = (() => {
    const { spans } = quotedSpans(l);
    let out = l.replace(/\\'/g, "'");
    for (const s of spans) out = out.split(`"${s}"`).join(' ');
    return out;
  })();

  it('DR-0210 — our authored voice names Yahweh, never the generic "God"', () => {
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(6);
  });

  it('DR-0210 — Jesus is confessed as the Lamb of Yahweh, and quoted "God" stays untouched', () => {
    expect(ours).toMatch(/Lamb of Yahweh/);
    expect(l, 'Hebrews 12:2 is quoted verbatim with its own "God" untouched').toContain('is set down at the right hand of the throne of God.');
    expect(l, '1 Thessalonians 5:18 keeps "the will of God"').toContain('In every thing give thanks: for this is the will of God in Christ Jesus concerning you.');
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Devil', 'Dragon', 'Adversary']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
    expect(ours).toMatch(/the adversary does his quietest work/);
  });
});
