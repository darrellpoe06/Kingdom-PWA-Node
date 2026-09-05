// =============================================================================
// L127 — The Firsts: what Yahweh did in each century that had never been done
// before. Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Built from Darrell's messages of 2026-09-05: research what Yahweh did that was
// NEW to each century; why it was needed; how it was, is, and will be used; what
// ended; the promises fulfilled; the backward 100-year reference; and — his own
// framing — the same events read without His perspective and with, "like a
// puzzle", with the provisions and without them.
//
// The lesson teaches from a verified spine (lib/yahweh-by-century.js), which has
// its own gate (yahweh-by-century.test.js). This file guards the LESSON.
//
// PROVEN-TO-CATCH, from this lesson's own authoring — every one of these was a
// real defect in the first draft, caught here or by the spine's gate:
//   • "since the days of Joshua" — Nehemiah 8:17 says JESHUA the son of Nun.
//   • "The father shall be divided..." quoted with a lowercase opening; Genesis
//     8:22, Joshua 24:2, John 1:6, Isaiah 10:7 and Deuteronomy 8:4 likewise.
//   • "blindness in part is happened to Israel, UNTIL..." — an emphasis capital
//     inserted INSIDE a quotation, which alters the text.
//   • Acts 1:11 quoted with a capitalised "This" and its closing clause dropped.
//   • Six uses of the generic "God" in our own authored voice (DR-0210), where
//     the fix is to name Him or quote the verse properly — never a blind sweep.
//   • Our own emphasis ("like a puzzle", "with Him") wearing quotation marks, so
//     it read as a citation. Same family the L126 sweep caught ten of.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll127-the-firsts-what-yahweh-did-in-each-century-that-had-never-been-done-before';
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

// Quoted spans in this lesson that are NOT Scripture. Every entry is deliberate:
// Darrell's own spoken words, and one illustration in the child level. Our own
// emphasis is NOT on this list — emphasis wearing quotation marks is the defect
// this gate exists to catch, and it was removed rather than allowlisted.
const NOT_SCRIPTURE = [
  'what century was that?',                                 // our own rhetorical question
  'why did the covenant have to change',                    // our own section question
  'the 100 years are backwards compatible for reference',   // Darrell, 2026-09-05
  'backwards compatible for reference',                     // Darrell, 2026-09-05
  'blind only UNTIL, and then they thrive',                 // Darrell, 2026-09-05
  'I like you,',                                            // child-level illustration
];

describe('L127 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L127 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L127 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Genesis 3:8/);
  });

  it('opens the century spine in the app rather than only describing it', () => {
    expect(m.explore, 'the lesson must surface the real spine (DR-0065)').toBe('centuries');
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
    // 48 lessons in this series currently have no adult-depth prose and are
    // served the senior text by learn-framework's emergency fallback. L127 must
    // not add to that debt, so it carries a base `lesson`.
    expect(typeof m.lesson, 'L127 must carry a base lesson for the adult band').toBe('string');
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

  it('the child level teaches the real thing without adult freight', () => {
    const c = m.levels.child;
    expect(c, 'the child must be taught the goal, not just the miracles').toMatch(/walk/i);
    expect(c).toMatch(/Genesis 3:8/);
    for (const heavy of ['crucifixion', 'slaughter', 'massacre', 'execution', 'sexual']) {
      expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
    }
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV or a declared non-Scripture quotation', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(40);
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

  it('the specific defects this lesson was corrected for stay corrected', () => {
    expect(l, 'Nehemiah 8:17 names JESHUA the son of Nun').not.toContain('since the days of Joshua');
    expect(l, 'Acts 1:11 opens lowercase and keeps its closing clause').not.toContain('"This same Jesus, which is taken up');
    expect(l, 'no emphasis capital inserted inside a quotation').not.toMatch(/Israel, UNTIL the fulness/);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0098, DR-0100)', () => {
  const ours = (() => {
    const { spans } = quotedSpans(l);
    let out = l.replace(/\\'/g, "'");
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

  it('the canon fence is taught explicitly — providence is not revelation', () => {
    expect(l).toMatch(/the faith which was once delivered unto the saints/);
    expect(l, 'the firsts stop with the apostles').toMatch(/firsts STOP|FIRSTS STOP|firsts END/);
    expect(l).toMatch(/[Pp]rovidence/);
  });

  it('DR-0100 — the without-Him reading is given fairly, and the claim is bounded', () => {
    expect(l, 'a strawman would be a lie').toMatch(/strawman would be a lie/);
    expect(l, 'coherence, not proof').toMatch(/[Cc]oherence, not (a )?proof/);
  });

  it('the comparison is fenced pastorally — blind UNTIL, then they thrive', () => {
    expect(l).toMatch(/blind only until they are not|blind only UNTIL/i);
    expect(l).toContain('Nevertheless when it shall turn to the Lord, the vail shall be taken away');
    expect(l, 'the teacher was in that column too').toMatch(/were in that column|was in that column|were once in|was once there/i);
  });

  it('no end date is printed anywhere, because the Word withholds it', () => {
    expect(l).toMatch(/Acts 1:7/);
    expect(l).toMatch(/Matthew 24:36/);
    expect(/the end will come in \d{4}|returns? in \d{4}|by the year \d{4}/i.test(l)).toBe(false);
  });

  it('the three dating tiers are taught before any date is used', () => {
    expect(l, 'no BC date is claimed for the early record').toMatch(/no BC date|NO BC date|assigns no BC/i);
    expect(l, 'the computed position is labelled').toMatch(/computed/i);
    expect(l, 'the fork is named rather than hidden').toMatch(/thirteenth-century|13th-century/i);
  });

  it('Darrell’s four spoken teachings of 2026-09-05 are all carried', () => {
    expect(l, 'the normal walk').toMatch(/normal with us/);
    expect(l, 'integrity cannot be faked').toMatch(/[Ii]ntegrity cannot be faked/);
    expect(l, 'blind until').toMatch(/blind only/i);
    expect(l, 'the wilderness').toMatch(/wilderness/);
  });
});
