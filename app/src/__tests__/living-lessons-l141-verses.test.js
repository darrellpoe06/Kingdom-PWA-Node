// @vitest-environment node
// =============================================================================
// L141 — Separate and Connect. Verbatim KJV, and the claims this lesson may
// never lose.
// =============================================================================
// THE QUESTIONS, spoken by Darrell 2026-09-11 in two messages: "Jesus said He
// came to separate and also connect... how should we work through issues based
// on the biblical scriptures say and how and why do we study to show ourselves
// approved and how do we study if we can't read? Is there a study the Word
// means that we may misunderstand also explaining the tempted vs tests based on
// the Word... and seasonal experience and development and results etc..." and
// "How should we handle each other and enemies in practical Application?"
//
// Eight questions, one spine: the same Sword that DIVIDES is the Word that
// JOINS. The claims that can drift, each pinned below:
//   1. SWORD AND ONENESS are one motion, and Hebrews 4:12 is the mechanism —
//      the Word cuts INSIDE a person first.
//   2. Matthew 18 is a PROCEDURE in order, and its goal is inside the method
//      ("thou hast gained thy brother"). The two Proverbs discipline certainty.
//   3. Study is approval UNTO GOD, and the Word can be divided WRONGLY.
//   4. HEARING is a whole door, not a lesser one (Romans 10:17; Nehemiah 8:8;
//      Acts 8:31) — the illiterate believer is not a second-class student.
//   5. Misreading has a NAMED cause (2 Peter 3:16 "unlearned and unstable") and
//      three cures. Never "you might get it wrong so do not try."
//   6. TEMPTED vs TRIED: James 1:13 absolute, Genesis 22:1 the older English
//      sense, Deuteronomy 8:2 the settlement. Opposite responses: flee / endure.
//   7. The Romans 5 chain is in ORDER and cannot be skipped.
//   8. Enemies: the instruction is PHYSICAL (feed him), vengeance is handed
//      over, and Ephesians 6:12 keeps an opponent from being mistaken for the
//      enemy.
//
// Typography (DR-0210): Yahweh in our own voice; the KJV untouched inside every
// quotation — which is exactly what the verbatim block below enforces.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const { BY_LINE, BY_SPACE } = (() => {
  let byLine = '';
  let bySpace = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) { byLine += `${ch.join('\n')}\n`; bySpace += `${ch.join(' ')}\n`; }
  }
  return { BY_LINE: byLine, BY_SPACE: bySpace };
})();
const inKjv = (part) => BY_LINE.includes(part) || BY_SPACE.includes(part);

// The two parables are authored prose carried as JSON, so every double quote in
// that block is JSON syntax around OUR words rather than a quotation of the
// Word. Scanning it would demand that a story about a blacksmith be verbatim
// KJV. It is dropped from the scan and asserted separately below, so nothing is
// quietly exempted — the rest of the lesson is scanned whole.
const withoutStories = (text) => {
  const i = text.indexOf('    stories: [');
  if (i < 0) return text;
  const j = text.indexOf('\n    title:', i);
  return j < 0 ? text : text.slice(0, i) + text.slice(j);
};

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// Deliberately EMPTY: every double-quoted span in L141 is verbatim KJV.
const NOT_SCRIPTURE = [];

const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L141 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L141 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L141 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    const m = mod();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Matthew 10:34-36/);
    expect(m.anchor.ref).toMatch(/John 17:21/);
    expect(m.anchor.ref).toMatch(/Matthew 18:15-17/);
    expect(m.anchor.ref).toMatch(/2 Timothy 2:15/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of mod().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('every age band resolves to authored prose of its own', () => {
    const m = mod();
    for (const band of AGE_BANDS) {
      const r = resolveForAge(m, band.id);
      expect(typeof r.text === 'string' && r.text.length > 400, `${band.id} must carry real prose`).toBe(true);
    }
  });
});

describe('every quoted span is letter-for-letter KJV', () => {
  it('the quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced, 'unbalanced quotation marks in the L141 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(withoutStories(l));
    expect(spans.length, 'L141 must actually contain quotations').toBeGreaterThan(60);
    const bad = [];
    for (const span of spans) {
      const parts = span.includes('...') ? span.split('...').map((p) => p.trim()) : [span];
      for (const part of parts) {
        if (!part || NOT_SCRIPTURE.includes(part)) continue;
        if (!inKjv(part)) bad.push(part);
      }
    }
    expect(bad, `non-verbatim quoted spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the allowlist is EMPTY and stays honest', () => {
    expect(NOT_SCRIPTURE).toEqual([]);
  });

  it('the parables dropped from the scan are REAL parables, each anchored to a verse', () => {
    // The exemption above is not a hole: the stories are authored teaching
    // fiction, they are labelled as parables, and each one names the verse it
    // is carrying — which is checkable, and checked.
    const m = mod();
    expect(m.stories.length).toBe(2);
    for (const s of m.stories) {
      expect(s.kind).toBe('parable');
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.body.length).toBeGreaterThan(800);
      expect(s.verse).toMatch(/^[0-9A-Za-z ]+ \d+:\d+$/);
    }
    expect(m.stories.map((s) => s.verse)).toEqual(['Job 23:10', 'Proverbs 18:17']);
  });
});

describe('ONE — the Sword and the Oneness are one motion', () => {
  it('both sayings are quoted, not summarised away', () => {
    expect(l).toContain('I came not to send peace, but a sword');
    expect(l).toContain('I tell you, Nay; but rather division');
    expect(l).toContain('That they all may be one');
    expect(l).toContain('hath broken down the middle wall of partition between us');
  });
  it('Hebrews 4:12 carries the mechanism — the cut goes INSIDE a person', () => {
    expect(l).toContain('piercing even to the dividing asunder of soul and spirit');
    expect(l).toMatch(/inside|INSIDE|through a person|THROUGH a person/i);
  });
  it('refuses peace-at-any-price without calling it peace', () => {
    expect(l).toMatch(/truce/i);
  });
});

describe('TWO — the procedure, in order, with its goal inside it', () => {
  it('step one is the one that is skipped, quoted whole', () => {
    expect(l).toContain('go and tell him his fault between thee and him alone: if he shall hear thee, thou hast gained thy brother.');
  });
  it('the widening steps are quoted too, so the order cannot drift', () => {
    expect(l).toContain('take with thee one or two more, that in the mouth of two or three witnesses every word may be established');
  });
  it('the safeguards around it are present', () => {
    expect(l).toContain('first be reconciled to thy brother, and then come and offer thy gift.');
    expect(l).toContain('let not the sun go down upon your wrath');
    expect(l).toContain('restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted.');
  });
  it('the two proverbs that discipline certainty', () => {
    expect(l).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him.');
    expect(l).toContain('He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.');
  });
});

describe('THREE — study is approval unto God, and the Word can be divided wrongly', () => {
  it('the charge is quoted in full', () => {
    expect(l).toContain('Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.');
  });
  it('the method is given, not implied', () => {
    expect(l).toContain('searched the scriptures daily, whether those things were so');
    expect(l).toContain('here a little, and there a little');
    expect(l).toContain('Thy word have I hid in mine heart');
  });
});

describe('FOUR — hearing is a whole door, never a lesser one', () => {
  it('faith cometh by hearing, and the public pattern is Nehemiah 8', () => {
    expect(l).toContain('So then faith cometh by hearing, and hearing by the word of God.');
    expect(l).toContain('read in the book in the law of God distinctly, and gave the sense, and caused them to understand the reading.');
  });
  it('asking for a guide is the METHOD — the Ethiopian said so', () => {
    expect(l).toContain('How can I, except some man should guide me?');
  });
  it('the blessing covers the reader AND the hearer', () => {
    expect(l).toContain('Blessed is he that readeth, and they that hear');
  });
  it('the lesson never calls hearing second-class', () => {
    expect(l).toMatch(/not a lesser way to study|not a failure of it|That counts/);
  });
});

describe('FIVE — misreading has a named cause and real cures', () => {
  it('names the cause in the Word’s own words', () => {
    expect(l).toContain('which they that are unlearned and unstable wrest');
  });
  it('reads the diagnosis honestly — not a lack of intelligence', () => {
    expect(l).toMatch(/Not unintelligent|not a deficit of intelligence|not a lack of intelligence/);
  });
  it('gives the cures, including the Spirit and the opened understanding', () => {
    expect(l).toContain('he will guide you into all truth');
    expect(l).toContain('opened he their understanding, that they might understand the scriptures');
    expect(l).toContain('no prophecy of the scripture is of any private interpretation');
  });
});

describe('SIX — tempted vs tried, and the opposite responses', () => {
  it('James is absolute and Genesis is quoted, both', () => {
    expect(l).toContain('God cannot be tempted with evil, neither tempteth he any man');
    expect(l).toContain('God did tempt Abraham');
  });
  it('Deuteronomy 8:2 settles it — PROVE what was already there', () => {
    expect(l).toContain('to humble thee, and to prove thee, to know what was in thine heart');
  });
  it('the responses are opposite, and both are quoted', () => {
    expect(l).toContain('make a way to escape');
    expect(l).toContain('Blessed is the man that endureth temptation');
    expect(l).toMatch(/taking the class again/);
  });
  it('He is not remote from either', () => {
    expect(l).toContain('in all points tempted like as we are, yet without sin');
  });
});

describe('SEVEN — the season chain, in order', () => {
  it('the Romans 5 chain is quoted whole', () => {
    expect(l).toContain('tribulation worketh patience; And patience, experience; and experience, hope');
  });
  it('James warns against short-circuiting it', () => {
    expect(l).toContain('let patience have her perfect work, that ye may be perfect and entire, wanting nothing.');
  });
  it('the harvest runs on a clock that is not ours', () => {
    expect(l).toContain('in due season we shall reap, if we faint not.');
  });
});

describe('EIGHT — each other, and enemies, in practical application', () => {
  it('the command toward an enemy is quoted, with its reason', () => {
    expect(l).toContain('Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you');
    expect(l).toContain('maketh his sun to rise on the evil and on the good');
  });
  it('the instruction is PHYSICAL, not sentimental', () => {
    expect(l).toContain('if thine enemy hunger, feed him; if he thirst, give him drink');
    expect(l).toMatch(/not asked to feel warmly first|physical, not sentimental|physical rather than sentimental/i);
  });
  it('vengeance is handed over rather than renounced in the abstract', () => {
    expect(l).toContain('Vengeance is mine; I will repay, saith the Lord.');
  });
  it('and the opponent is not the enemy', () => {
    expect(l).toContain('For we wrestle not against flesh and blood, but against principalities');
    expect(l).toMatch(/is not the principality/);
  });
  it('closes on the standard set at the worst hour, and on the peacemakers', () => {
    expect(l).toContain('Father, forgive them; for they know not what they do.');
    expect(l).toContain('Blessed are the peacemakers: for they shall be called the children of God.');
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a quotation that is not KJV', () => {
    expect(inKjv('Study to show yourself approved unto God, a worker who has no need to be ashamed')).toBe(false);
    expect(inKjv('rightly dividing the word of truth')).toBe(true);
  });
  it('CATCHES a lesson that stopped teaching the second half of the question', () => {
    // Darrell asked TWO messages; the second one is the enemies half, and a
    // lesson that answered only the first would pass every other test here.
    expect(l).toMatch(/enem/i);
    expect(l).toContain('overcome evil with good');
  });
});
