// @vitest-environment node
// =============================================================================
// L133 — How to See the Whole Torah at Once. Verbatim KJV, and the claims this
// lesson may never lose.
// =============================================================================
// Darrell, 2026-09-08, after the Torah pattern map shipped: he still needed a
// lesson with all of that information in it, because it was too good not to be
// taught, and it had to live where users actually process things — the lessons
// section.
//
// AND HE CAUGHT A REAL DESIGN ERROR MID-BUILD. The first draft's in-app step
// told him to take a page and three columns and hand-build the map himself,
// then compare it with the app's. His answer — why do I need to do all that to
// see the map — was correct: the map already exists, and assigning a reader to
// reconstruct it is homework standing between them and the thing that was built
// for them to see. The `inApp` step is now LOOKING, not rebuilding, and this
// gate pins that so a future edit cannot quietly turn it back into a project.
//
// The gate pins four things. (1) Every double-quoted span is verbatim KJV from
// the in-repo corpus, single-verse — proven-to-catch below. (2) The lesson does
// not send the reader away to build anything before they are allowed to see.
// (3) The spine cannot drift: named-vs-shown taught first, the four plurals, the
// Spirit across all five books, the likeness as self-giving, the substitution
// chain, the three moves, the knowing-rebellion pattern, and Deuteronomy 29:4
// as the humility that closes it. (4) The house rules.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll133-how-to-see-the-whole-torah-at-once-the-twelve-patterns-and-the-two-questions-that-opened-them';
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

// Deliberately EMPTY. Darrell's own words are rendered for MEANING without
// quotation marks (DR-0331) — the first draft put his sentence in double quotes
// and the gate correctly refused it as non-corpus text.
const NOT_SCRIPTURE = [];

describe('L133 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L133 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L133 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Genesis 1:2/);
    expect(m.anchor.ref).toMatch(/Deuteronomy 29:4/);
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

describe('the reader is shown the map, never sent away to rebuild it', () => {
  // Darrell, mid-build: why do I need to do all that to see the map. The first
  // draft assigned a three-column reconstruction before the payoff. This is the
  // gate on that correction.
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the in-app step is LOOKING, and says so plainly', () => {
    expect(m.inApp).toMatch(/You do not have to build anything to see this/);
    expect(m.inApp).toMatch(/JUST LOOK/);
    expect(m.inApp).toMatch(/not so you could redraw it/);
  });

  it('the in-app step tells the reader exactly where the map already is', () => {
    expect(m.inApp).toMatch(/Eternal Algorithms/);
    expect(m.inApp).toMatch(/Torah pattern map/);
  });

  it('it never assigns a reconstruction of the map as the price of seeing it', () => {
    expect(/take one page and three columns/i.test(m.inApp)).toBe(false);
    expect(/compare your page with it/i.test(m.inApp)).toBe(false);
  });

  it('the lesson itself carries the whole picture, so reading IS the work', () => {
    expect(m.lesson).toMatch(/the reading itself is the work/i);
    expect(m.lesson).toMatch(/Nothing here asks you to go build something before you are allowed to see it/);
  });
});

describe('every age band is served text authored for IT', () => {
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

  it('each band gets genuinely different prose', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child.length).toBeLessThan(m.levels.senior.length);
  });

  it('the child level teaches patterns as patterns, at a child register', () => {
    const c = m.levels.child;
    expect(c, 'a child is told what a pattern IS first').toMatch(/what a pattern is/i);
    expect(c).toContain('Let us make man in our image, after our likeness');
    expect(c).toContain('And the Spirit of God moved upon the face of the waters.');
    expect(c, 'the likeness is taught as giving').toMatch(/being like Yahweh looks like/i);
    expect(c, 'a child gets the three moves').toMatch(/three tricks/i);
    expect(c, 'a child is left with Jesus').toMatch(/points to Jesus|see Him everywhere/);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('every double-quoted span is verbatim KJV from the in-repo corpus', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const bad = spans.filter((s) => !NOT_SCRIPTURE.includes(s) && !WHOLE_KJV.includes(s));
    expect(bad, `not verbatim KJV:\n${bad.map((b) => `  "${b}"`).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH — an ellipsis-joined span is not corpus text', () => {
    // The first draft carried exactly this, and the gate refused it.
    expect(WHOLE_KJV.includes('saw the daughters of men that they were fair')).toBe(true);
    expect(WHOLE_KJV.includes('they took them wives of all which they chose')).toBe(true);
    expect(WHOLE_KJV.includes('saw... and they took them wives of all which they chose')).toBe(false);
  });

  it('stays inside the first five books for its Torah claims', () => {
    for (const ref of ['Genesis 1:2', 'Genesis 1:26', 'Genesis 5:3', 'Genesis 44:33',
      'Exodus 23:21', 'Leviticus 16:22', 'Numbers 22:12', 'Deuteronomy 29:4']) {
      expect(l, `${ref} must be cited`).toContain(ref);
    }
  });
});

describe('the spine of the teaching cannot drift out', () => {
  it('NAMED vs SHOWN is taught FIRST, as the discipline that makes the rest safe', () => {
    const discipline = l.indexOf('THE DISCIPLINE THAT MAKES EVERYTHING ELSE SAFE');
    const firstPattern = l.indexOf('THE THREE ARE ON THE FIRST PAGE');
    expect(discipline).toBeGreaterThan(-1);
    expect(firstPattern).toBeGreaterThan(discipline);
    expect(l).toMatch(/OUR CONFESSION/);
    expect(l).toMatch(/the study has started lying in a way nobody in the room can detect/);
  });

  it('the four plurals are all present, and the oneness is kept beside them', () => {
    expect(l).toContain('Let us make man in our image, after our likeness');
    expect(l).toContain('the man is become as one of us');
    expect(l).toContain('Go to, let us go down, and there confound their language');
    expect(l).toContain('Then the LORD rained upon Sodom and upon Gomorrah brimstone and fire from the LORD out of heaven;');
    expect(l).toContain('Hear, O Israel: The LORD our God is one LORD:');
    expect(l).toMatch(/never treats the plural as an embarrassment and never surrenders the oneness/);
  });

  it('the Spirit is shown across all five books, including the craftsman', () => {
    expect(l).toContain('My spirit shall not always strive with man');
    expect(l).toContain('a man in whom the Spirit of God is');
    expect(l).toContain('And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,');
    expect(l).toContain('a man in whom is the spirit');
    expect(l, 'skilled work is named as Spirit-work').toMatch(/skilled work is Spirit-work/);
  });

  it('the likeness answer keeps all three of its legs', () => {
    expect(l).toContain('So God created man in his own image, in the image of God created he him; male and female created he them.');
    expect(l).toContain('begat a son in his own likeness, after his image');
    expect(l).toContain('let thy servant abide instead of the lad a bondman to my lord; and let the lad go up with his brethren');
    expect(l).toContain('The sceptre shall not depart from Judah');
    expect(l).toContain('blot me, I pray thee, out of thy book which thou hast written');
    expect(l).toContain('And he stood between the dead and the living; and the plague was stayed.');
    expect(l).toMatch(/the likeness includes giving your life for love/i);
  });

  it('the substitution chain is taught as ONE chain', () => {
    for (const span of [
      'Unto Adam also and to his wife did the LORD God make coats of skins, and clothed them.',
      'My son, God will provide himself a lamb for a burnt offering: so they went both of them together.',
      'in the stead of his son',
      'when I see the blood, I will pass over you',
      'it is the blood that maketh an atonement for the soul',
      'shall bear upon him all their iniquities unto a land not inhabited',
      'when he looketh upon it, shall live',
    ]) expect(l).toContain(span);
    expect(l).toMatch(/one chain rather than seven stories/);
  });

  it('the enemy’s three moves are named in order, and he stays a creature', () => {
    expect(l).toContain('Now the serpent was more subtil than any beast of the field which the LORD God had made.');
    expect(l).toMatch(/A QUESTION about the Word/);
    expect(l).toMatch(/A flat CONTRADICTION of it/);
    expect(l).toMatch(/A PROMOTION offered for taking it/);
  });

  it('the knowing-rebellion pattern is carried with its evidence, in order', () => {
    expect(l).toContain('The serpent beguiled me, and I did eat.');
    expect(l).toContain('Because thou hast hearkened unto the voice of thy wife');
    expect(l).toContain('offered strange fire before the LORD, which he commanded them not');
    expect(l).toContain('seek ye the priesthood also?');
    expect(l).toContain('Thou shalt not go with them; thou shalt not curse the people: for they are blessed.');
    expect(l).toMatch(/the more direct the access, the more the record reads as choice/i);
  });

  it('it closes on humility, never on cleverness', () => {
    expect(l).toContain('Yet the LORD hath not given you an heart to perceive, and eyes to see, and ears to hear, unto this day.');
    expect(l).toMatch(/Whatever you saw in this lesson, you did not manufacture/);
    // The facilitator is told explicitly not to end that section on Balaam.
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m.facilitator.talkingPoints.join(' ')).toMatch(/Never end that section on Balaam/);
  });

  it('DR-0098 — the Word is taught, not a debate staged', () => {
    expect(/scholars (?:disagree|debate)|some (?:say|argue)|two views|you decide/i.test(l)).toBe(false);
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
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });

  it('DR-0210 — Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    expect(ours).toMatch(/Lamb of Yahweh/);
    expect(ours).toMatch(/Eternal Son of Yahweh/);
  });

  it('quoted "God" and "LORD" stay EXACTLY as the KJV prints them', () => {
    expect(l).toContain('And the Spirit of God moved upon the face of the waters.');
    expect(l).toContain('And God said, Let there be light: and there was light.');
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Baalpeor', 'Devil', 'Dragon', 'Adversary', 'Molech', 'Serpent']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
  });
});
