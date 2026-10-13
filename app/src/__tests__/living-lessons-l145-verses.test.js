// @vitest-environment node
// L145 — I Will Not Go Out Free. Verbatim KJV, and the provisions in the text
// that do the actual work of answering the objection.
// =============================================================================
// The same friend from L142 says Yahweh wants us to be His slaves, and laughs.
// Darrell's answer, 2026-09-13, is the spine: bond servants whom He created and
// died for to repurchase, because of His love for them.
//
// WHY THIS FILE IS STRICT. The lesson works ONLY if three provisions stay in it
// — automatic release, compulsory severance, and permanence requiring the
// servant's own spoken declaration of love. Drop any one and the comparison to
// chattel slavery stops collapsing and the lesson becomes an assertion. Each is
// pinned separately, and so is the concession that opens it: a defence that
// denies the Word's servant vocabulary has lost before it starts.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll145-i-will-not-go-out-free-the-bondservant-the-price-and-the-ear-at-the-door';
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
  for (const f of readdirSync(KJV_DIR)) {
    if (!f.endsWith('.json') || f === 'index.json') continue;
    const book = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8'));
    for (const ch of book.chapters) { byLine += `${ch.join('\n')}\n`; bySpace += `${ch.join(' ')} `; }
  }
  return { BY_LINE: byLine, BY_SPACE: bySpace };
})();
const inKjv = (part) => BY_LINE.includes(part) || BY_SPACE.includes(part);
const verse = (book, chapter, num) => {
  const file = join(KJV_DIR, `${book.replace(/\s+/g, '')}.json`);
  return JSON.parse(readFileSync(file, 'utf8')).chapters[chapter - 1][num - 1];
};

const withoutStories = (text) => {
  const i = text.indexOf('stories: [');
  if (i < 0) return text;
  const j = text.indexOf('\n    ],', i);
  return text.slice(0, i) + text.slice(j < 0 ? i : j);
};
const quotedSpans = (text) => {
  const body = text.replace(/\\'/g, "'");
  const marks = (body.match(/"/g) || []).length;
  const parts = body.split('"');
  const spans = [];
  for (let i = 1; i < parts.length; i += 2) spans.push(parts[i]);
  return { spans, balanced: marks % 2 === 0 };
};
const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);
const ourVoice = () => {
  const m = mod();
  return [m.bigIdea, m.lesson, m.anchor.theme, m.inApp, ...Object.values(m.levels), ...m.benefits,
    ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts, m.facilitator.howToRun,
    ...m.quiz.questions.flatMap((q) => [q.q, q.explain, ...q.options])].join(' ').replace(/"[^"]*"/g, ' ');
};


describe('L145 — present, whole, and inside the authored floors', () => {
  it('exists in source and in the live array', () => {
    expect(start).toBeGreaterThan(-1);
    expect(mod()).toBeTruthy();
  });
  it('the painted lesson count matches the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the authored floors', () => {
    const m = mod();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    for (const ref of ['Exodus 21:2', 'Exodus 21:5', 'Psalms 40:6']) {
      expect(m.anchor.ref).toContain(ref);
    }
  });
  it('every quiz question is answerable and explained', () => {
    for (const q of mod().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
  it('every age band resolves to real authored prose', () => {
    for (const band of AGE_BANDS) {
      expect(resolveForAge(mod(), band.id).text.length, band.id).toBeGreaterThan(400);
    }
  });
});

describe('L145 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily', () => {
    expect(quotedSpans(withoutStories(l)).spans.length).toBeGreaterThan(40);
  });
  it('EVERY double-quoted span appears letter-for-letter in the KJV corpus', () => {
    const bad = [];
    for (const span of quotedSpans(withoutStories(l)).spans) {
      for (const piece of span.split('...')) {
        const p = piece.trim();
        if (p && !inKjv(p)) bad.push(p.slice(0, 120));
      }
    }
    expect(bad, `not verbatim KJV:\n  ${bad.join('\n  ')}`).toEqual([]);
  });
});

describe('L145 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L145 — it CONCEDES the servant language before answering', () => {
  // A defence that begins by denying the vocabulary has lost and deserves to.
  it('says the language is everywhere and names doulos', () => {
    expect(l).toMatch(/doulos/);
    expect(l).toMatch(/has lost the argument and has earned the loss|lost the argument/i);
  });
  it('frames the error as a DEFINITION error, not a moral one', () => {
    expect(l).toMatch(/nineteenth-century institution|reading a nineteenth-century/i);
    expect(mod().facilitator.talkingPoints.join(' ')).toMatch(/definition error/i);
  });
});

describe('L145 — THE THREE PROVISIONS, each pinned, because the argument dies without any one', () => {
  it('ONE: freedom is automatic, on a clock, and free to the servant', () => {
    expect(verse('Exodus', 21, 2)).toBe('If thou buy an Hebrew servant, six years he shall serve: and in the seventh he shall go out free for nothing.');
    expect(l).toContain('six years he shall serve: and in the seventh he shall go out free for nothing');
  });
  it('TWO: the master must fund the departure', () => {
    expect(verse('Deuteronomy', 15, 13)).toContain('thou shalt not let him go away empty');
    expect(l).toContain('thou shalt not let him go away empty');
    expect(verse('Deuteronomy', 15, 14)).toContain('Thou shalt furnish him liberally out of thy flock');
    expect(l).toContain('Thou shalt furnish him liberally out of thy flock');
  });
  it('THREE: permanence requires the servant\'s OWN spoken declaration of love', () => {
    expect(verse('Exodus', 21, 5)).toContain('I love my master, my wife, and my children; I will not go out free');
    expect(l).toContain('I love my master, my wife, and my children; I will not go out free');
    expect(verse('Deuteronomy', 15, 16)).toContain('because he loveth thee and thine house');
    expect(l).toContain('because he loveth thee and thine house');
  });
  it('and the mark is made AT THE DOOR — the exit he refused', () => {
    expect(verse('Exodus', 21, 6)).toContain('to the door, or unto the door post');
    expect(l).toContain('to the door, or unto the door post');
    expect(l).toMatch(/marked at the exit he refused|stood in an open door/i);
  });
  it('states the test that makes the comparison collapse', () => {
    expect(l).toMatch(/No slave code in human history|no slave code in history/i);
    expect(l).toMatch(/dissolve the institution/i);
  });
});

describe('L145 — the purchase is inverted, and the standing is raised in His own words', () => {
  it('silver and gold are NAMED and refused', () => {
    expect(verse('1 Peter', 1, 18)).toContain('not redeemed with corruptible things, as silver and gold');
    expect(l).toContain('not redeemed with corruptible things, as silver and gold');
    expect(verse('1 Peter', 1, 19)).toContain('the precious blood of Christ');
    expect(l).toContain('the precious blood of Christ');
  });
  it('keeps Darrell\'s own sentence — He died to repurchase them out of love', () => {
    expect(l).toMatch(/died for to repurchase them because of His love|died to repurchase/i);
  });
  it('servant becomes friend, then son, then heir — with the REASON given', () => {
    expect(verse('John', 15, 15)).toContain('but I have called you friends');
    expect(l).toContain('but I have called you friends');
    expect(l).toMatch(/servant knoweth not what his lord doeth/);
    expect(verse('Galatians', 4, 7)).toContain('no more a servant, but a son');
    expect(l).toContain('no more a servant, but a son');
  });
  it('removes fear by the text rather than by reassurance', () => {
    expect(verse('Romans', 8, 15)).toContain('not received the spirit of bondage again to fear');
    expect(l).toContain('not received the spirit of bondage again to fear');
  });
});

describe('L145 — the premise is denied, and the Son takes the mark', () => {
  it('nobody is unowned, so the choice was never service against freedom', () => {
    expect(verse('Romans', 6, 16)).toContain('his servants ye are to whom ye obey');
    expect(l).toContain('his servants ye are to whom ye obey');
    expect(l).toMatch(/Nobody is unowned/i);
  });
  it('both masters publish their accounts, and only one pays wages', () => {
    expect(verse('Romans', 6, 23)).toContain('the wages of sin is death; but the gift of God is eternal life');
    expect(l).toContain('the wages of sin is death; but the gift of God is eternal life');
  });
  it('THE CLOSE: the Son takes the bondservant\'s opened ear', () => {
    // This is the turn the objection cannot follow, and the first thing a
    // shortened edit would cut for length.
    expect(verse('Psalms', 40, 6)).toContain('mine ears hast thou opened');
    expect(l).toContain('mine ears hast thou opened');
    expect(l).toMatch(/Hebrews/);
    expect(l).toMatch(/would not go out free/);
  });
  it('answers the laugh without flinching and without preaching', () => {
    expect(l).toMatch(/laughing at something that is not there/i);
    expect(l).toMatch(/Do not flinch and do not preach/i);
    // It ends on a question handed over, not on a summary.
    expect(mod().lesson.trim().endsWith('?'), 'it must hand over a question, not a summary').toBe(true);
  });
});
