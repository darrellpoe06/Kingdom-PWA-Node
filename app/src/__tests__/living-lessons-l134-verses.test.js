// @vitest-environment node
// =============================================================================
// L134 — Divers Weights. Verbatim KJV, and the claims this lesson may never lose.
// =============================================================================
// Spoken into the app by Darrell 2026-09-08: a reel in which a man is challenged
// to name five Black inventions, names them, and is dismissed — and the question
// is enlarged twice more so that no answer could ever have sufficed. He sent the
// comment thread with it, and the sharpest voice there was a commenter who said
// the goalposts kept moving, nothing would ever have been good enough, and asked
// whether the better use of the hours was teaching our own people what our
// people have done.
//
// THE LESSON'S SPINE IS THAT THE MOVING GOALPOST IS NAMED IN THE TORAH —
// "divers weights, a great and a small" (Deuteronomy 25:13) — and that the SAME
// verse forbidding a light weight forbids a padded one (Proverbs 11:1). That
// second half is the part a later edit is most likely to soften, because it asks
// something of us and not only of the other side. It is gated hardest here.
//
// This file pins five things. (1) Every double-quoted span is verbatim KJV —
// proven-to-catch below on this lesson's OWN first draft, which trimmed
// Romans 13:7 with an ellipsis and was refused. (2) The divers-weights spine.
// (3) The just-weight discipline applied to OUR side, including the named
// precision corrections and the honest sourcing note. (4) The record itself is
// stated plainly and at length — under-claiming established fact is its own
// failure (DR-0100). (5) The house rules.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll134-divers-weights-when-the-question-keeps-moving-the-record-that-stands-and-the-better-assignment';
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

// Deliberately EMPTY. Our own phrasing never sits inside the marks reserved for
// Scripture — the first draft put the phrase "better assignment" in quotes and
// the gate refused it alongside the trimmed verse.
const NOT_SCRIPTURE = [];

describe('L134 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Deuteronomy 25:13-15/);
    expect(m.anchor.ref).toMatch(/Proverbs 11:1/);
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
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId).toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('every band resolves to real authored prose, and the child text is not an adult wall', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child).not.toBe(m.levels.senior);
    expect(m.levels.child.length).toBeLessThan(m.levels.senior.length);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('every double-quoted span is verbatim KJV from the in-repo corpus', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(80);
    const bad = spans.filter((s) => !NOT_SCRIPTURE.includes(s) && !WHOLE_KJV.includes(s));
    expect(bad, `not verbatim KJV:\n${bad.map((b) => `  "${b}"`).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH — this lesson’s own first draft trimmed Romans 13:7 and was refused', () => {
    // A lesson about just weights had a shaved quotation in it. The gate caught
    // it; the whole verse is quoted instead, and the whole verse is stronger —
    // honour sits in a list with taxes, which IS the argument.
    expect(WHOLE_KJV.includes('Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour.')).toBe(true);
    expect(WHOLE_KJV.includes('Render therefore to all their dues... honour to whom honour.')).toBe(false);
  });

  it('the whole Romans 13:7 is quoted, so honour is visibly listed WITH taxes', () => {
    expect(l).toContain('Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour.');
  });
});

describe('the divers-weights spine cannot drift out', () => {
  it('the moving goalpost is named from the Torah, not offered as a metaphor', () => {
    expect(l).toContain('Thou shalt not have in thy bag divers weights, a great and a small.');
    expect(l).toContain('Thou shalt not have in thine house divers measures, a great and a small.');
    expect(l).toContain('But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have');
    expect(l).toContain('Divers weights, and divers measures, both of them are alike abomination to the LORD.');
    expect(l).toContain('Divers weights are an abomination unto the LORD; and a false balance is not good.');
  });

  it('the two-stones picture is taught concretely, and the verdict is not softened', () => {
    expect(l).toMatch(/heavy one .{0,40}buying/i);
    expect(l).toMatch(/light one .{0,40}selling/i);
    expect(l).toMatch(/abomination/);
  });

  it('Leviticus 19:35 is used for its word order — JUDGMENT before the tools', () => {
    expect(l).toContain('Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.');
    expect(l).toMatch(/IN JUDGMENT first|judgment FIRST|judgment comes first/i);
  });

  it('the reader is told plainly they were not failing a test', () => {
    expect(l).toMatch(/not failing a test/i);
  });

  it('declining a rigged question is grounded in the Master’s own practice', () => {
    expect(l).toContain('But Jesus perceived their wickedness, and said, Why tempt ye me, ye hypocrites?');
    expect(l).toContain('Neither tell I you by what authority I do these things.');
    expect(l).toMatch(/refusing to be weighed on a (?:crooked )?scale|owed them nothing/i);
  });

  it('Proverbs 26:4 and 26:5 are held together and NOT resolved into a rule', () => {
    expect(l).toContain('Answer not a fool according to his folly, lest thou also be like unto him.');
    expect(l).toContain('Answer a fool according to his folly, lest he be wise in his own conceit.');
    expect(l).toMatch(/no formula|not a formula|discernment, not a (?:formula|rule)/i);
  });
});

describe('the just weight is applied to OUR side too — the half most likely to be softened', () => {
  it('the both-directions rule is stated outright', () => {
    expect(l).toContain('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(l).toMatch(/accurate in BOTH directions|forbids both errors|must not be padded/i);
  });

  it('the named precision corrections are present and unhedged', () => {
    expect(l, 'Latimer improved the filament').toMatch(/improved the filament rather than invented the bulb/i);
    expect(l, 'Daniel Hale Williams — pericardium, not first open-heart').toMatch(/pericardium/);
    expect(l).toMatch(/overstates it/i);
    expect(l, 'Shirley Ann Jackson — the caller-ID claim is not well documented').toMatch(/not well documented/i);
  });

  it('a correction is always paired with the stronger uncontested fact, never left as a subtraction', () => {
    expect(l, 'Williams founded Provident Hospital').toMatch(/Provident Hospital/);
    expect(l, "Jackson's real record stands on its own").toMatch(/Nuclear Regulatory Commission/);
  });

  it('the tactical reason is given, and precision is named as armour rather than retreat', () => {
    expect(l).toMatch(/sweep twenty documented ones off the table|one padded claim/i);
    expect(l).toMatch(/Precision is not retreat|Precision is armour/i);
  });

  it('the lesson discloses its OWN sourcing honestly (DR-0076 §8)', () => {
    expect(l).toMatch(/fetched verbatim from the King James text hosted inside this app/i);
    expect(l).toMatch(/documented public record/i);
    expect(l).toMatch(/not from a verified corpus stored in this app/i);
  });
});

describe('the record is stated PLAINLY and at length — under-claiming is its own failure (DR-0100)', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the roll is substantial, not a token list', () => {
    for (const name of [
      'Lewis Howard Latimer', 'Jan Ernst Matzeliger', 'Charles Richard Drew', 'Daniel Hale Williams',
      'Granville T. Woods', 'Alice H. Parker', 'Frederick McKinley Jones', 'Marie Van Brittan Brown',
      'Otis Boykin', 'Mark Dean', 'Patricia Bath', 'George Carruthers', 'Percy Julian',
      'Lonnie Johnson', 'Lewis Temple', 'Andrew Jackson Beard', 'Mae Jemison', 'Elijah McCoy',
      'James E. West', 'Gladys West', 'Thomas L. Jennings', 'Garrett Morgan', 'Sarah Boone',
    ]) expect(l, `${name} missing from the record`).toContain(name);
  });

  it('getting the NAME right is taught as the first installment of the debt', () => {
    expect(l).toMatch(/a man’s name is the first thing owed him/i);
    expect(l).toMatch(/Matzilica/); // the mangled transcript form, named so it can be corrected
  });

  it('invention is framed as Spirit-work, and the image and one blood ground it', () => {
    expect(l).toContain('And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,');
    expect(l).toContain('So God created man in his own image, in the image of God created he him; male and female created he them.');
    expect(l).toContain('And hath made of one blood all nations of men for to dwell on all the face of the earth');
    expect(l).toMatch(/bench is not a lesser altar/i);
  });

  it('it ends on the BETTER ASSIGNMENT — teach your own, not convince the scorner', () => {
    expect(l).toContain('And thou shalt teach them diligently unto thy children');
    expect(l).toContain('Tell ye your children of it, and let your children tell their children, and their children another generation.');
    expect(l).toMatch(/Not one of them says convince the scorner/i);
    expect(l).toContain('And ye shall know the truth, and the truth shall make you free.');
  });

  it('the child level carries the transferable truth without the adult weight', () => {
    const c = m.levels.child;
    expect(c).toContain('Thou shalt not have in thy bag divers weights, a great and a small.');
    expect(c, 'the two stones are explained at a child register').toMatch(/two different measuring stones|heavy one|light one/i);
    expect(c, 'real people, real things a child uses').toMatch(/Lewis Latimer/);
    expect(c).toMatch(/Gladys West/);
    expect(c, 'skill as a gift from Yahweh').toMatch(/Bezaleel/);
    expect(c, 'ends on telling somebody').toMatch(/Go tell it/);
  });
});

describe('the house rules this lesson is bound by', () => {
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

  it('quoted "God" and "LORD" stay EXACTLY as the KJV prints them', () => {
    expect(l).toContain('Divers weights are an abomination unto the LORD; and a false balance is not good.');
    expect(l).toContain('in the image of God created he him');
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Devil', 'Dragon', 'Adversary']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });

  it('DR-0098 — the Word is taught, not a debate staged', () => {
    expect(/scholars (?:disagree|debate)|two views|you decide/i.test(ours)).toBe(false);
  });
});
