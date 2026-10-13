// @vitest-environment node
// L148 — Remember Is a Verb. What the Word says about His knowing, His
// withholding, and the sea.
// =============================================================================
// Darrell, 2026-09-13, spoken, and asked honestly rather than rhetorically:
// "You have to hate Love to actually go to hell, there is no other way
// according to the Word, Yahweh will desire us until death at least... not sure
// after because of the sea of forgetfulness so we forget those who are lost...
// however I'm not sure He can block His own knowledge and understanding can he
// according to the biblical scriptures? I know He can ignore... or not tell you
// something until He wants to tell you. Word first lesson."
//
// WHY THIS FILE IS STRICT. The lesson makes four claims that are easy to state
// and easy to lose, and losing any one of them turns a Word-first answer back
// into an opinion:
//   1. REMEMBER IS AN ACTION WORD — proven from four places where the verb is
//      followed immediately by an act, not from an assertion about Hebrew;
//   2. THE SEA TAKES SINS, NOT PEOPLE — and the phrase "sea of forgetfulness"
//      is NOT in the Word, which the lesson says out loud;
//   3. KNOWING and TELLING are different questions with opposite answers —
//      infinite understanding on one side, sealed scrolls on the other;
//   4. WHERE THE WORD IS SILENT WE SAY SO — the lesson must NOT claim the
//      redeemed forget particular people, because Scripture does not say it.
// (4) is the one a well-meaning edit would "improve" by adding comfort, so it
// is pinned as an ABSENCE as well as a presence. And Mark 13:32 must stay in,
// unexplained, because a lesson that drops its hardest verse is managing the
// reader rather than teaching them (DR-0098 / DR-0076 §8).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll148-remember-is-a-verb-what-the-word-says-about-his-knowing-his-withholding-and-the-sea';
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



describe('L148 — present, whole, and inside the authored floors', () => {
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

describe('L148 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily', () => {
    expect(quotedSpans(withoutStories(l)).spans.length).toBeGreaterThan(80);
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

describe('L148 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(5);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L148 — CLAIM ONE: remember is an action word, PROVEN from the text', () => {
  // Not asserted about Hebrew — shown, from places where the verb is followed
  // immediately by an act. Drop these and the lesson is just a claim.
  it('Noah — He remembered, and the wind moved, in one verse', () => {
    expect(verse('Genesis', 8, 1)).toContain('And God remembered Noah');
    expect(verse('Genesis', 8, 1)).toContain('God made a wind to pass over the earth');
    expect(l).toContain('And God remembered Noah');
    expect(l).toContain('God made a wind to pass over the earth');
  });
  it('Abraham — He remembered, and Lot is carried out', () => {
    expect(verse('Genesis', 19, 29)).toContain('God remembered Abraham, and sent Lot out of the midst of the overthrow');
    expect(l).toContain('God remembered Abraham, and sent Lot out of the midst of the overthrow');
  });
  it('Hannah — He remembered, and a son is born', () => {
    expect(verse('1 Samuel', 1, 19)).toContain('the LORD remembered her');
    expect(l).toContain('the LORD remembered her');
  });
  it('and the thief, who is asking to be ACTED FOR', () => {
    expect(verse('Luke', 23, 42)).toContain('Lord, remember me when thou comest into thy kingdom');
    expect(l).toContain('Lord, remember me when thou comest into thy kingdom');
    expect(l).toMatch(/ACTED FOR/);
  });
  it('so the covenant sentence is read as a VERDICT rather than amnesia', () => {
    expect(verse('Hebrews', 8, 12)).toContain('their sins and their iniquities will I remember no more');
    expect(l).toContain('their sins and their iniquities will I remember no more');
    expect(verse('Jeremiah', 31, 34)).toContain('I will forgive their iniquity, and I will remember their sin no more');
    expect(l).toContain('I will forgive their iniquity, and I will remember their sin no more');
    expect(l).toMatch(/verdict, not amnesia|VERDICT, NOT AMNESIA/i);
  });
});

describe('L148 — CLAIM TWO: the sea takes SINS, and the famous phrase is not in the Word', () => {
  it('quotes Micah on what is actually cast in', () => {
    expect(verse('Micah', 7, 19)).toContain('thou wilt cast all their sins into the depths of the sea');
    expect(l).toContain('thou wilt cast all their sins into the depths of the sea');
  });
  it('says out loud that the phrase itself is absent from Scripture', () => {
    expect(l).toMatch(/is not in the Word|not there/i);
    // and it must NOT be dressed as a quotation, since it is not one
    expect(l).not.toContain('"the sea of forgetfulness"');
  });
  it('keeps the sister promises, whose object is always the RECORD', () => {
    expect(verse('Isaiah', 43, 25)).toContain('blotteth out thy transgressions');
    expect(l).toContain('blotteth out thy transgressions');
    expect(verse('Psalms', 103, 12)).toContain('so far hath he removed our transgressions from us');
    expect(l).toContain('so far hath he removed our transgressions from us');
  });
  it('and says why the precision is load-bearing rather than pedantic', () => {
    expect(l).toMatch(/managed ignorance/i);
  });
});

describe('L148 — CLAIM THREE: knowing and telling are different questions', () => {
  it('KNOWING — infinite, with no verse showing a fact deleted', () => {
    expect(verse('Psalms', 147, 5)).toContain('his understanding is infinite');
    expect(l).toContain('his understanding is infinite');
    expect(verse('1 John', 3, 20)).toContain('knoweth all things');
    expect(l).toContain('knoweth all things');
    expect(verse('Hebrews', 4, 13)).toContain('all things are naked and opened unto the eyes of him');
    expect(l).toContain('all things are naked and opened unto the eyes of him');
    expect(l).toMatch(/no edge to fall off/i);
  });
  it('TELLING — withheld, sealed, and not for us to know', () => {
    expect(verse('Deuteronomy', 29, 29)).toContain('The secret things belong unto the LORD our God');
    expect(l).toContain('The secret things belong unto the LORD our God');
    expect(verse('Daniel', 12, 4)).toContain('shut up the words, and seal the book, even to the time of the end');
    expect(l).toContain('shut up the words, and seal the book, even to the time of the end');
    expect(verse('Revelation', 10, 4)).toContain('Seal up those things which the seven thunders uttered, and write them not');
    expect(l).toContain('Seal up those things which the seven thunders uttered, and write them not');
    expect(verse('Acts', 1, 7)).toContain('It is not for you to know the times or the seasons');
    expect(l).toContain('It is not for you to know the times or the seasons');
  });
  it('and states the distinction the whole question turns on', () => {
    expect(l).toMatch(/SEALED IS NOT DESTROYED|Sealed is not destroyed/);
    expect(verse('Amos', 3, 7)).toContain('he revealeth his secret unto his servants the prophets');
    expect(l).toContain('he revealeth his secret unto his servants the prophets');
  });
  it('reads the HARD verse instead of stepping around it', () => {
    expect(verse('Mark', 13, 32)).toContain('neither the Son, but the Father');
    expect(l).toContain('neither the Son, but the Father');
    expect(l).toMatch(/stop where the text stops/i);
  });
});

describe('L148 — CLAIM FOUR: where the Word is silent, the lesson says so', () => {
  // The one a well-meaning edit would "improve" by adding comfort. Pinned as an
  // ABSENCE as well as a presence.
  it('promises the OUTCOME, quoting it', () => {
    expect(verse('Isaiah', 65, 17)).toContain('the former shall not be remembered, nor come into mind');
    expect(l).toContain('the former shall not be remembered, nor come into mind');
    expect(verse('Revelation', 21, 4)).toContain('God shall wipe away all tears from their eyes');
    expect(l).toContain('God shall wipe away all tears from their eyes');
  });
  it('and explicitly declines to publish a mechanism', () => {
    expect(l).toMatch(/does not publish the mechanism|not something the Word states/i);
    expect(l).toMatch(/fabricat/i);
  });
  it('NEVER claims the redeemed will forget particular people', () => {
    const m = mod();
    const everything = [m.lesson, m.bigIdea, ...Object.values(m.levels), ...m.benefits].join(' ');
    expect(everything).not.toMatch(/we will forget (?:them|those|the lost|people)/i);
    expect(everything).not.toMatch(/you will not remember (?:them|your loved)/i);
  });
});

describe('L148 — the first claim was right, and the Word says it plainly', () => {
  it('hating Love is named by Wisdom herself', () => {
    expect(verse('Proverbs', 8, 36)).toContain('all they that hate me love death');
    expect(l).toContain('all they that hate me love death');
  });
  it('light CAME and was refused — not withheld', () => {
    expect(verse('John', 3, 19)).toContain('men loved darkness rather than light');
    expect(l).toContain('men loved darkness rather than light');
    expect(verse('2 Thessalonians', 2, 10)).toContain('they received not the love of the truth');
    expect(l).toContain('they received not the love of the truth');
    expect(l).toMatch(/LOVE of it|love of it/);
  });
  it('and nobody in Matthew 23:37 is being kept out', () => {
    expect(verse('Matthew', 23, 37)).toContain('how often would I have gathered thy children together');
    expect(l).toContain('how often would I have gathered thy children together');
    expect(l).toMatch(/YE WOULD NOT|ye would not/);
  });
  it('He swears by His own life about the alternative', () => {
    expect(verse('Ezekiel', 33, 11)).toContain('I have no pleasure in the death of the wicked');
    expect(l).toContain('I have no pleasure in the death of the wicked');
    expect(l).toContain('why will ye die');
  });
  it('and the window is named, with WHILE doing the work', () => {
    expect(verse('Isaiah', 55, 6)).toContain('Seek ye the LORD while he may be found');
    expect(l).toContain('Seek ye the LORD while he may be found');
    expect(l).toMatch(/WHILE is load-bearing/i);
    expect(verse('Isaiah', 55, 7)).toContain('he will abundantly pardon');
    expect(l).toContain('he will abundantly pardon');
  });
});
