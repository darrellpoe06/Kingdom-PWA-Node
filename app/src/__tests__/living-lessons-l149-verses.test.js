// @vitest-environment node
// L149 — Cultural Competency. The same word in three mouths, the man nobody
// believed, and the fourth reading that takes the word all the way back.
// =============================================================================
// Darrell, 2026-09-13, spoken across a dozen messages while this was being
// built. The spine: "Game is read by some cultures as a person going through
// the game of life taking all the abuse and still having Joy... so game can
// mean a man who tells you all the truth from the beginning and it sounds like
// a lie because you meant it from the first time you saw her... because she
// loves Him more than she love you... so you start to prove your love like
// never before!!!" Then: "It was all a game until Him and the her!!!" "Then
// her!!!" "Without Him I would have never seen her!!!" "Got my family and kids
// from His Ways!!!" "Money can't buy this... ever." "He gave me the game in
// Proverbs and psalms!!!" "Be true!!!" "Prudence etc...." "When you hear
// information like it's game you take the good with the bad information in
// stride... then pray to Yahweh to help." "HE told me about me and her!" And
// the last word: "It's game until you believe Him then He's Him!!!"
//
// WHY THIS FILE IS STRICT. The lesson is FOUR readings of one word plus a
// method, and every one of them is load-bearing:
//   1. talk a man cannot back — the pejorative, and it is honest;
//   2. the game of LIFE — the beating taken, the joy kept;
//   3. truth told too early and too whole, which sounds manufactured;
//   4. WISDOM — and Proverbs states that purpose on its own first page.
// Reading 4 is the one that redeems the word, and it is the one a shortening
// edit would cut first because it arrives last. The COUNT is asserted.
//
// Two further things are pinned because they are the heart rather than the
// trim: the told-in-advance explanation (certainty with NO VISIBLE BASIS is
// the definition of a line, which is why proving is the only road out), and
// the ORDER — Him, then her — because reversing it makes a person into an idol.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll149-cultural-competency-the-same-word-in-three-mouths-and-the-man-nobody-believed';
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




describe('L149 — present, whole, and inside the authored floors', () => {
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

describe('L149 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily', () => {
    expect(quotedSpans(withoutStories(l)).spans.length).toBeGreaterThan(70);
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
  it('the word being TAUGHT is never dressed as Scripture', () => {
    // "game" is the lesson's subject, not a quotation. Quoting it would put our
    // own vocabulary inside the Word's quotation marks.
    expect(l).not.toContain('"game"');
  });
});

describe('L149 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(10);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L149 — FOUR readings, and the count is asserted', () => {
  it('says there are four, not three', () => {
    expect(l).toMatch(/READING FOUR|FOURTH READING|fourth reading/);
  });
  it('ONE — talk a man cannot back', () => {
    expect(l).toMatch(/talk a man cannot back/i);
  });
  it('TWO — the game of LIFE, the beating taken and the joy kept', () => {
    expect(verse('Habakkuk', 3, 18)).toContain('Yet I will rejoice in the LORD');
    expect(l).toContain('Yet I will rejoice in the LORD');
    expect(verse('Nehemiah', 8, 10)).toContain('the joy of the LORD is your strength');
    expect(l).toContain('the joy of the LORD is your strength');
    expect(verse('James', 1, 2)).toContain('count it all joy when ye fall into divers temptations');
    expect(l).toContain('count it all joy when ye fall into divers temptations');
  });
  it('THREE — truth told too early, so its wholeness sounds manufactured', () => {
    expect(l).toMatch(/too complete to be credible|sound manufactured|sounds manufactured/i);
  });
  it('FOUR — WISDOM, with Proverbs stating that purpose on its own first page', () => {
    expect(verse('Proverbs', 1, 4)).toContain('To give subtilty to the simple, to the young man knowledge and discretion');
    expect(l).toContain('To give subtilty to the simple, to the young man knowledge and discretion');
    expect(l).toMatch(/SUBTILTY TO THE SIMPLE/);
    expect(l).toMatch(/Proverbs and Psalms/);
  });
  it('and names PRUDENCE, with what it looks like walking around', () => {
    expect(verse('Proverbs', 8, 12)).toContain('I wisdom dwell with prudence');
    expect(l).toContain('I wisdom dwell with prudence');
    expect(verse('Proverbs', 14, 15)).toContain('The simple believeth every word: but the prudent man looketh well to his going');
    expect(l).toContain('The simple believeth every word: but the prudent man looketh well to his going');
    expect(l).toMatch(/not timidity/i);
  });
  it('and prices it where no money reaches it', () => {
    expect(verse('Song of Solomon', 8, 7)).toContain('if a man would give all the substance of his house for love, it would utterly be contemned');
    expect(l).toContain('if a man would give all the substance of his house for love, it would utterly be contemned');
    expect(verse('Proverbs', 3, 15)).toContain('She is more precious than rubies');
    expect(l).toContain('She is more precious than rubies');
  });
});

describe('L149 — misreading is named by the Word, not by us', () => {
  it('folly and shame, not merely unkindness', () => {
    expect(verse('Proverbs', 18, 13)).toBe('He that answereth a matter before he heareth it, it is folly and shame unto him.');
    expect(l).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him');
    expect(l).toMatch(/FOLLY AND SHAME/);
  });
  it('and the command about how to judge at all', () => {
    expect(verse('John', 7, 24)).toContain('Judge not according to the appearance, but judge righteous judgment');
    expect(l).toContain('Judge not according to the appearance, but judge righteous judgment');
  });
});

describe('L149 — Paul made the study a POLICY, and did it in a real city', () => {
  it('states the policy in his own words', () => {
    expect(verse('1 Corinthians', 9, 22)).toContain('I am made all things to all men, that I might by all means save some');
    expect(l).toContain('I am made all things to all men, that I might by all means save some');
  });
  it('and at Athens opens from their altar and their poets', () => {
    expect(verse('Acts', 17, 23)).toContain('TO THE UNKNOWN GOD');
    expect(l).toContain('TO THE UNKNOWN GOD');
    expect(verse('Acts', 17, 28)).toContain('as certain also of your own poets have said');
    expect(l).toContain('as certain also of your own poets have said');
    expect(l).toMatch(/bought him a hearing/i);
  });
  it('and lived two honourable readings in one sentence about himself', () => {
    expect(verse('2 Corinthians', 6, 8)).toContain('as deceivers, and yet true');
    expect(l).toContain('as deceivers, and yet true');
    expect(verse('2 Corinthians', 6, 10)).toContain('As sorrowful, yet alway rejoicing');
    expect(l).toContain('As sorrowful, yet alway rejoicing');
  });
});

describe('L149 — the man nobody believed, taught with both sides reasonable', () => {
  it('Saul tells the truth and is not believed', () => {
    expect(verse('Acts', 9, 26)).toContain('they were all afraid of him, and believed not that he was a disciple');
    expect(l).toContain('they were all afraid of him, and believed not that he was a disciple');
  });
  it('and the lesson says the suspicion was EARNED by his own past', () => {
    expect(l).toMatch(/earned/i);
    expect(l).toMatch(/not by their small hearts/i);
  });
  it('Barnabas supplies EVIDENCE, not a plea for charity', () => {
    expect(verse('Acts', 9, 27)).toContain('But Barnabas took him, and brought him to the apostles');
    expect(l).toContain('But Barnabas took him, and brought him to the apostles');
    expect(l).toMatch(/EVIDENCE/);
  });
  it('and time delivers the verdict', () => {
    expect(verse('Galatians', 1, 23)).toContain('he which persecuted us in times past now preacheth the faith which once he destroyed');
    expect(l).toContain('he which persecuted us in times past now preacheth the faith which once he destroyed');
  });
});

describe('L149 — THE HEART: told in advance, so the certainty has no visible basis', () => {
  // The deepest point, and the first thing a length-edit would cut because it
  // arrives late. It is what turns "prove it" from wounded pride into method.
  it('he knew because he was TOLD', () => {
    expect(verse('Psalms', 25, 14)).toContain('The secret of the LORD is with them that fear him');
    expect(l).toContain('The secret of the LORD is with them that fear him');
    expect(verse('Psalms', 32, 8)).toContain('I will instruct thee and teach thee in the way which thou shalt go');
    expect(l).toContain('I will instruct thee and teach thee in the way which thou shalt go');
  });
  it('and states WHY that sounds exactly like a line', () => {
    expect(l).toMatch(/NO VISIBLE BASIS/);
    expect(l).toMatch(/definition of a line/i);
  });
  it('so proving is the road out, and the Son did the same', () => {
    expect(verse('John', 14, 11)).toContain('or else believe me for the very works');
    expect(l).toContain('or else believe me for the very works');
    expect(verse('1 John', 3, 18)).toContain('let us not love in word, neither in tongue; but in deed and in truth');
    expect(l).toContain('let us not love in word, neither in tongue; but in deed and in truth');
  });
});

describe('L149 — THE ORDER: Him, then her', () => {
  it('she is ADDED, never the foundation', () => {
    expect(verse('Matthew', 6, 33)).toContain('all these things shall be added unto you');
    expect(l).toContain('all these things shall be added unto you');
    expect(l).toMatch(/idol/i);
  });
  it('and the stated reason she was worth wanting', () => {
    expect(verse('Proverbs', 31, 30)).toContain('a woman that feareth the LORD, she shall be praised');
    expect(l).toContain('a woman that feareth the LORD, she shall be praised');
    expect(l).toMatch(/not a threat/i);
  });
  it('the family and children came from His Ways', () => {
    expect(verse('Psalms', 127, 3)).toContain('children are an heritage of the LORD');
    expect(l).toContain('children are an heritage of the LORD');
  });
});

describe('L149 — the method, and the last word on the word', () => {
  it('prove all things, hold fast the good part', () => {
    expect(verse('1 Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
    expect(l).toContain('Prove all things; hold fast that which is good');
    expect(l).toMatch(/Not swallow all things/i);
  });
  it('then ask, and He does not upbraid you for asking', () => {
    expect(verse('James', 1, 5)).toContain('upbraideth not');
    expect(l).toContain('upbraideth not');
    expect(l).toMatch(/UPBRAIDETH NOT/);
  });
  it('BE TRUE is kept as the instruction that precedes all proving', () => {
    expect(verse('Proverbs', 3, 3)).toContain('Let not mercy and truth forsake thee');
    expect(l).toContain('Let not mercy and truth forsake thee');
    expect(l).toMatch(/BE TRUE/);
  });
  it('and the last word: it is game until you believe Him, then He is Him', () => {
    expect(verse('John', 4, 42)).toContain('Now we believe, not because of thy saying: for we have heard him ourselves');
    expect(l).toContain('Now we believe, not because of thy saying: for we have heard him ourselves');
    expect(l).toMatch(/NOT BECAUSE OF THY SAYING/);
    expect(l).toMatch(/where the word stops applying/i);
  });
  it('and the testimony keeps BOTH halves', () => {
    expect(l).toMatch(/It was all a game/);
    expect(verse('1 Timothy', 1, 13)).toContain('Who was before a blasphemer, and a persecutor, and injurious: but I obtained mercy');
    expect(l).toContain('Who was before a blasphemer, and a persecutor, and injurious: but I obtained mercy');
  });
});

describe('L149 — the instruction the whole lesson reduces to', () => {
  // "know how to play the game ask Yahweh and read His Word!!!!" — Darrell's
  // own summary, and the only part of an hour-long lesson that has to survive
  // in someone's memory on the walk to the car.
  it('says ASK and READ, in those words', () => {
    expect(l).toMatch(/ASK YAHWEH AND READ HIS WORD/);
    expect(mod().inApp).toMatch(/ask Yahweh and read His Word/i);
  });
  it('and backs each half with its verse', () => {
    expect(verse('James', 1, 5)).toContain('let him ask of God');
    expect(l).toContain('let him ask of God');
    expect(verse('Proverbs', 4, 7)).toContain('Wisdom is the principal thing; therefore get wisdom');
    expect(l).toContain('Wisdom is the principal thing; therefore get wisdom');
  });
  it('and says both moves are free, because that is the point', () => {
    expect(mod().inApp).toMatch(/both of them are free/i);
  });
});
