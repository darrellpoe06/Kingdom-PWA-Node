// @vitest-environment node
// =============================================================================
// L130 — Three Days and Three Nights. Verbatim KJV, and the fences this lesson
// is bound by.
// =============================================================================
// Built from the question asked on 2026-09-07: "Did Jesus destroy the devil when
// He went to hell for 3 days and nights according to the biblical scriptures?
// What happened and why, how do we use this information, and what was Yahweh's
// perspectives and points for the body of Christ?"
//
// The lesson is doctrinally load-bearing in BOTH directions, which is why the
// gate is written the way it is. Over-claiming (a fight scene Scripture never
// narrates) and under-claiming (a defeat the Word plainly dates at the cross)
// are both lies, and DR-0076 forbids each of them. So this file pins the claim
// on both sides: the disarming is dated at the CROSS, and the adversary is NOT
// annihilated. Neither half may drift out.
//
// PROVEN-TO-CATCH, from this lesson's own authoring — real defects, caught here
// or by the whole-span verifier before the lesson shipped:
//   • A quotation welded Colossians 2:14 and 2:15 into one span ("nailing it to
//     his cross; And having spoiled principalities and powers..."). The corpus
//     stores verses separately, so the concatenation is NOT verbatim text — it
//     silently deletes the verse boundary. Split into two cited quotes.
//   • The child level said Jesus "has the keys of death", dropping half of what
//     Revelation 1:18 actually says (the keys of hell AND of death). Under-
//     claiming inside a paraphrase is the DR-0100 failure, at child level.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll130-three-days-and-three-nights-what-he-did-in-the-place-of-the-dead-and-why-the-devil-is-defeated-but-not-destroyed';
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

// Quoted spans in this lesson that are NOT Scripture. The list is deliberately
// EMPTY: every double-quoted span in L130 is verbatim KJV. Our own emphasis does
// not wear quotation marks here, because emphasis-in-quotes is the defect class
// the sibling gates were written to catch, not a thing to allowlist.
const NOT_SCRIPTURE = [];

describe('L130 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L130 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L130 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Hebrews 2:14-15/);
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
    expect(typeof m.lesson, 'L130 must carry a base lesson for the adult band').toBe('string');
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

  it('the child level teaches the real answer without the adult freight', () => {
    const c = m.levels.child;
    expect(c, 'a child is told the victory was already finished').toMatch(/It is finished/);
    expect(c, 'a child is told who holds the keys').toMatch(/keys/i);
    expect(c, 'a child is left with Jesus, not with the enemy').toMatch(/Lamb of Yahweh/);
    for (const heavy of ['crucifixion', 'torment', 'lake of fire', 'brimstone', 'damned']) {
      expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
    }
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
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

  it('PROVEN-TO-CATCH — the welded Colossians 2:14-15 span this lesson was corrected for fails the same check', () => {
    // The exact string the first draft carried. Both halves are real KJV; the
    // concatenation across the verse boundary is not, and that is the defect.
    const welded = 'nailing it to his cross; And having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it.';
    expect(WHOLE_KJV.includes(welded), 'the welded span must NOT read as verbatim').toBe(false);
    expect(WHOLE_KJV.includes('nailing it to his cross')).toBe(true);
    expect(WHOLE_KJV.includes('And having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it.')).toBe(true);
    expect(l, 'the corrected lesson must not carry the welded span').not.toContain(welded);
  });

  it('PROVEN-TO-CATCH — the child level no longer under-quotes Revelation 1:18', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(WHOLE_KJV).toContain('have the keys of hell and of death');
    expect(m.levels.child, 'the child paraphrase must not drop half the verse').not.toMatch(/has the keys of death now/);
  });
});

describe('the doctrinal fences — both directions, because both are lies (DR-0076, DR-0100)', () => {
  it('the victory is DATED AT THE CROSS, not at a fight in the place of the dead', () => {
    expect(l).toContain('It is finished');
    expect(l).toContain('And having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it.');
    expect(l, 'the weapon named by Hebrews is the death itself').toContain('that through death he might destroy him that had the power of death, that is, the devil;');
    expect(l, 'the lesson must say plainly that no combat is recorded').toMatch(/not one of them is fight|no combat|never a combatant/i);
  });

  it('the adversary is DEFEATED BUT NOT ANNIHILATED — the post-resurrection witnesses are cited', () => {
    expect(l, '1 Peter 5:8 — still walking, written after the resurrection').toContain('as a roaring lion, walketh about');
    expect(l, 'Revelation 12:12 — he knows the clock').toContain('because he knoweth that he hath but a short time');
    expect(l, 'Revelation 20:10 — the execution is still future').toContain('was cast into the lake of fire and brimstone');
  });

  it('the katargeō precision is taught — power destroyed, person not erased', () => {
    expect(l).toMatch(/katargeō/);
    expect(l).toMatch(/G2673/);
    expect(l, '1 John 3:8 names the WORKS as the object').toContain('that he might destroy the works of the devil');
  });

  it('the hadēs / geenna distinction is taught from the Word, not asserted', () => {
    expect(l).toMatch(/G86/);
    expect(l).toMatch(/G1067/);
    expect(l, 'Revelation 20:14 is the Word proving the two are distinct').toContain('And death and hell were cast into the lake of fire. This is the second death.');
    expect(l, 'Luke 23:43 forecloses the torment reading').toContain('To day shalt thou be with me in paradise');
  });

  it('the three dates are kept apart — verdict, binding, fire', () => {
    expect(l).toContain('now shall the prince of this world be cast out');
    expect(l).toContain('bound him a thousand years');
    expect(l).toMatch(/must be loosed a little season/);
  });

  it('DR-0098 — the Word’s silence is marked, and no unwritten narrative is supplied', () => {
    expect(l).toContain('The secret things belong unto the LORD our God');
    expect(l, 'the lesson must state that Scripture does not narrate those hours').toMatch(/never narrates those hours|does not narrate those hours|Scripture never tells the story/i);
    // No invented account may creep in later.
    expect(/wrestled with (the )?(devil|satan)|three-day (fight|battle|duel) (in|down)|paid a ransom to (the )?(devil|satan)/i.test(l)).toBe(false);
  });

  it('DR-0100 — the answer commits in BOTH directions rather than hedging', () => {
    expect(l, 'the short answer is stated up front, not withheld').toMatch(/THE SHORT ANSWER/);
    expect(l).toMatch(/his POWER was destroyed|He destroyed his POWER|POWER was destroyed/);
    expect(l).toMatch(/not annihilated|did not destroy his PERSON|PERSON was not annihilated/i);
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
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(10);
  });

  it('DR-0210 — Jesus is confessed as the Lamb of Yahweh and the Eternal Son', () => {
    expect(ours).toMatch(/Lamb of Yahweh/);
    expect(l, 'John 1:29 is quoted verbatim, with its own "God" untouched').toContain('Behold the Lamb of God, which taketh away the sin of the world.');
    expect(l, 'Hebrews 1:8 grounds the Eternal Son').toContain('Thy throne, O God, is for ever and ever');
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Devil', 'Dragon']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });

  it('the proportion rule is taught, not merely observed — the Lamb keeps the center', () => {
    expect(l).toMatch(/four Gospels/i);
    expect(l).toContain('for thou wast slain, and hast redeemed us to God by thy blood');
  });
});
