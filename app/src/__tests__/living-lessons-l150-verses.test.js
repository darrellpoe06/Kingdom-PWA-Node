// @vitest-environment node
// L150 — How Can the Son Not Know What the Father Knows?
// =============================================================================
// Darrell asked it straight: "How can the Son not know what The Father knows?
// Lesson." It is one of the sharpest questions thrown at the faith, and it is
// IN the Word because Jesus said it (Mark 13:32 / Matthew 24:36). The lesson
// answers it Word-first (DR-0098): it does NOT dodge the sentence, and it does
// NOT solve it by making the Son a lesser being. The spine, all seven strands:
//   1. THE QUESTION is real and Jesus said it — Mark 13:32, Matthew 24:36.
//   2. HE KNOWS ALL — John 21:17, John 16:30, John 2:24-25, Colossians 2:3,
//      Matthew 11:27 — so this is never subordinationism.
//   3. THE KENOSIS — Philippians 2:5-8 / 2 Corinthians 8:9 — He emptied the
//      USE, not the deity ("in the form of God" WHILE He did it).
//   4. A REAL HUMAN MIND — Luke 2:52 "increased", Hebrews 5:8 "learned",
//      Hebrews 2:17 / 4:15.
//   5. ORDER, NOT RANK — John 5:19, John 5:30, John 8:28, Acts 1:7, Mark 10:40;
//      "my Father is greater than I" (John 14:28) is order, and the same Son
//      takes worship — John 20:28, Hebrews 1:8.
//   6. GLORY DOWN AND UP — John 17:5 asked back, Matthew 28:18, Philippians
//      2:9-11.
//   7. WHO HE IS — the Lamb of Yahweh (John 1:29), by whom all things consist
//      (Colossians 1:16-17), Worthy (Revelation 5:12); and where the Word is
//      quiet on HOW, we stop (Deuteronomy 29:29 / Isaiah 55:9).
//
// WHY THIS FILE IS STRICT. Every quoted span must be verbatim KJV (DR-0076):
// putting a paraphrase of Scripture inside quotation marks on THIS topic is the
// exact failure that produces heresy. The three load-bearing pins are asserted
// by hand: the not-knowing sentence, the emptying text, and the worship the
// same Son receives — because a shortening edit that drops any one of the three
// turns the lesson into the false answer it exists to refuse.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll150-how-can-the-son-not-know-what-the-father-knows';
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

describe('L150 — present, whole, and inside the authored floors', () => {
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
    expect(m.facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(8);
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

describe('L150 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily', () => {
    expect(quotedSpans(withoutStories(l)).spans.length).toBeGreaterThan(60);
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

describe('L150 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(10);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L150 — the question is faced, not dodged (strand 1)', () => {
  it('quotes the not-knowing sentence verbatim, from the Son’s own mouth', () => {
    expect(verse('Mark', 13, 32)).toBe('But of that day and that hour knoweth no man, no, not the angels which are in heaven, neither the Son, but the Father.');
    expect(l).toContain('neither the Son, but the Father');
    expect(verse('Matthew', 24, 36)).toBe('But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only.');
    expect(l).toContain('but my Father only');
  });
});

describe('L150 — the false answer is refused (strand 2)', () => {
  it('holds that the Son knows all', () => {
    expect(verse('John', 21, 17)).toContain('Lord, thou knowest all things');
    expect(l).toContain('Lord, thou knowest all things');
    expect(verse('Colossians', 2, 3)).toBe('In whom are hid all the treasures of wisdom and knowledge.');
    expect(l).toContain('are hid all the treasures of wisdom and knowledge');
  });
  it('and that He is fully Yahweh the Son, not a lesser being', () => {
    expect(verse('John', 1, 1)).toContain('and the Word was God');
    expect(l).toContain('In the beginning was the Word, and the Word was with God, and the Word was God');
    expect(verse('Colossians', 2, 9)).toBe('For in him dwelleth all the fulness of the Godhead bodily.');
    expect(l).toContain('For in him dwelleth all the fulness of the Godhead bodily');
    // DR-0098: the wrong answer is NAMED to walk past it, not platformed.
    expect(l).toMatch(/wrong answer/i);
    expect(l).toMatch(/lesser being|lesser, created|created, lesser/i);
  });
});

describe('L150 — the emptying: the USE laid down, not the deity (strand 3)', () => {
  it('quotes the kenosis text verbatim across the verses', () => {
    expect(verse('Philippians', 2, 6)).toBe('Who, being in the form of God, thought it not robbery to be equal with God:');
    expect(verse('Philippians', 2, 7)).toContain('made himself of no reputation, and took upon him the form of a servant');
    expect(l).toContain('Who, being in the form of God, thought it not robbery to be equal with God: But made himself of no reputation, and took upon him the form of a servant');
  });
  it('and teaches that He was still in the form of God WHILE He did it', () => {
    expect(l).toContain('made himself of no reputation');
    expect(verse('2 Corinthians', 8, 9)).toContain('though he was rich, yet for your sakes he became poor');
    expect(l).toContain('though he was rich, yet for your sakes he became poor');
    expect(l).toMatch(/laid down the free USE|laid down the USE|the USE of it/i);
  });
});

describe('L150 — a real human mind (strand 4)', () => {
  it('a mind that grew and learned', () => {
    expect(verse('Luke', 2, 52)).toBe('And Jesus increased in wisdom and stature, and in favour with God and man.');
    expect(l).toContain('And Jesus increased in wisdom and stature, and in favour with God and man');
    expect(verse('Hebrews', 5, 8)).toContain('yet learned he obedience by the things which he suffered');
    expect(l).toContain('yet learned he obedience by the things which he suffered');
    expect(verse('Hebrews', 4, 15)).toContain('was in all points tempted like as we are, yet without sin');
    expect(l).toContain('was in all points tempted like as we are, yet without sin');
  });
});

describe('L150 — order, not rank; greater is not better (strand 5)', () => {
  it('the Son keeps the Father’s order and the timing is the Father’s', () => {
    expect(verse('John', 5, 19)).toContain('The Son can do nothing of himself, but what he seeth the Father do');
    expect(l).toContain('The Son can do nothing of himself, but what he seeth the Father do');
    expect(verse('Acts', 1, 7)).toContain('It is not for you to know the times or the seasons, which the Father hath put in his own power');
    expect(l).toContain('the Father hath put in his own power');
  });
  it('"greater" sits in the same breath as the worship the same Son receives', () => {
    expect(verse('John', 14, 28)).toContain('my Father is greater than I');
    expect(l).toContain('my Father is greater than I');
    expect(verse('John', 20, 28)).toContain('My Lord and my God');
    expect(l).toContain('My Lord and my God');
    expect(verse('Hebrews', 1, 8)).toContain('Thy throne, O God, is for ever and ever');
    expect(l).toContain('Thy throne, O God, is for ever and ever');
  });
});

describe('L150 — glory laid down and taken up (strand 6)', () => {
  it('the glory is asked BACK, which proves the emptying was no subtraction', () => {
    expect(verse('John', 17, 5)).toContain('the glory which I had with thee before the world was');
    expect(l).toContain('the glory which I had with thee before the world was');
    expect(verse('Matthew', 28, 18)).toContain('All power is given unto me in heaven and in earth');
    expect(l).toContain('All power is given unto me in heaven and in earth');
  });
  it('and He is exalted to the highest name', () => {
    expect(verse('Philippians', 2, 9)).toBe('Wherefore God also hath highly exalted him, and given him a name which is above every name:');
    expect(l).toContain('Wherefore God also hath highly exalted him, and given him a name which is above every name');
    expect(l).toContain('That at the name of Jesus every knee should bow');
  });
});

describe('L150 — who He is, and where we stop (strand 7)', () => {
  it('the Lamb of Yahweh, by whom all things consist, Worthy', () => {
    expect(verse('John', 1, 29)).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(verse('Colossians', 1, 17)).toBe('And he is before all things, and by him all things consist.');
    expect(l).toContain('all things consist');
    expect(verse('Revelation', 5, 12)).toContain('Worthy is the Lamb that was slain to receive power, and riches, and wisdom');
    expect(l).toContain('Worthy is the Lamb that was slain to receive power, and riches, and wisdom');
  });
  it('and teaching stops where the Word goes quiet (DR-0076 honest uncertainty)', () => {
    expect(verse('Deuteronomy', 29, 29)).toContain('The secret things belong unto the LORD our God');
    expect(l).toContain('The secret things belong unto the LORD our God');
    expect(l).toMatch(/not laid out on the page|the Word does not|we go quiet|Teaching stops where the text stops/i);
  });
  it('and it turns personal — the mind of Christ', () => {
    expect(verse('Philippians', 2, 5)).toBe('Let this mind be in you, which was also in Christ Jesus:');
    expect(l).toContain('Let this mind be in you, which was also in Christ Jesus');
    expect(verse('1 Corinthians', 2, 16)).toContain('we have the mind of Christ');
    expect(l).toContain('we have the mind of Christ');
  });
});
