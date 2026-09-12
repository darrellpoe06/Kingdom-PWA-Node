// @vitest-environment node
// L142 — It Is Written Again. Verbatim KJV, and the claims this lesson may never lose.
// =============================================================================
// THE OCCASION, spoken into the app by Darrell 2026-09-11/12 while relaying a
// friend's position and answering it. The friend's four planks: he rejects
// indoctrination from others or self-imposed and will not give his power to
// others to dictate at their interpretation; he wholeheartedly holds loving
// others as you do yourself as the fundamental principle of the Bible; he does
// not believe Yahweh is good because of hell, his biggest point being that
// Yahweh is finding reasons to put people there; and he points at slave
// owners, the Klan, and white churches that excluded black people.
//
// Darrell's answer, which is this lesson's spine: the friend takes Yahweh out
// of context to make his arguments while claiming he understands the Word as
// well as anyone — "like the devil... I said that too" — and "churches were
// planted in the Word out of context for gaining slaves and saying Yahweh
// agreed with them."
//
// WHY THIS FILE EXISTS. This lesson makes historical charges about real
// institutions and answers a man's sincere objection with Scripture. Both
// halves have to stay exactly true. Every double-quoted span in the module must
// be verbatim KJV from the in-repo corpus, and the load-bearing claims below
// must survive every future edit — including the ones that would be convenient
// to soften.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll142-it-is-written-again-the-clause-that-gets-left-out-and-the-name-that-gets-put-on-it';
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

const NOT_SCRIPTURE = [];
const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);
const ourVoice = () => {
  const m = mod();
  return [m.bigIdea, m.lesson, m.anchor.theme, m.inApp, ...Object.values(m.levels), ...m.benefits,
    ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts, m.facilitator.howToRun,
    ...m.quiz.questions.flatMap((q) => [q.q, q.explain, ...q.options])].join(' ').replace(/"[^"]*"/g, ' ');
};

describe('L142 — the lesson is present and whole', () => {
  it('exists in the source and in the live array', () => {
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
    for (const ref of ['Matthew 4:6', 'Matthew 4:7', 'Psalms 91:11', 'Genesis 3:1']) {
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
      const text = resolveForAge(mod(), band.id).text;
      expect(text.length, band.id).toBeGreaterThan(400);
    }
  });
});

describe('L142 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });

  it('the lesson actually quotes Scripture heavily (not vacuously few spans)', () => {
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
    expect(NOT_SCRIPTURE).toEqual([]);
  });

  it('the parables are marked as parables, not passed off as Scripture', () => {
    for (const s of mod().stories) {
      expect(s.kind).toBe('parable');
      expect(s.body.length).toBeGreaterThan(800);
      expect(s.verse).toMatch(/^[0-9A-Za-z ]+ \d+:\d+$/);
    }
    // Diversity: the series wants a light and a solemn.
    expect(mod().stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });
});

describe('L142 — the typography this house is bound to', () => {
  it('names Yahweh in our own voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
    expect(ours).not.toMatch(/\bGod\b/);
  });

  it('never capitalizes the adversary', () => {
    const ours = ourVoice();
    expect(ours).not.toMatch(/Satan/);
    expect(ours).not.toMatch(/Lucifer/);
  });
});

describe('L142 — the method claim, which is the whole lesson', () => {
  it('the corpus itself proves the clause was dropped from the psalm', () => {
    // This is the exhibit. Matthew 4:6 quotes Psalm 91 accurately and omits the
    // governing clause; the omission is provable from the corpus, not asserted.
    const psalm = verse('Psalms', 91, 11);
    const tempt = verse('Matthew', 4, 6);
    expect(psalm).toContain('to keep thee in all thy ways');
    expect(tempt).toContain('He shall give his angels charge concerning thee');
    expect(tempt, 'if this ever contains the clause, the lesson’s central claim is void')
      .not.toContain('to keep thee in all thy ways');
  });

  it('the answer modelled is restoration, not denial', () => {
    expect(verse('Matthew', 4, 7)).toContain('It is written again');
    expect(l).toContain('It is written again');
  });

  it('the garden edit is shown against what Yahweh actually said', () => {
    expect(verse('Genesis', 2, 16)).toContain('thou mayest freely eat');
    expect(verse('Genesis', 3, 1)).toContain('Yea, hath God said');
    expect(l).toContain('Of every tree of the garden thou mayest freely eat');
  });

  it('Peter names BOTH causes — unlearned and unstable — and the lesson keeps both', () => {
    expect(verse('2 Peter', 3, 16)).toContain('unlearned and unstable');
    expect(l).toMatch(/unlearned/i);
    expect(l).toMatch(/wrest/i);
  });
});

describe('L142 — the four planks keep their true halves and their whole pages', () => {
  it('loving your neighbour is taught as the SECOND, with the first restored', () => {
    expect(verse('Matthew', 22, 38)).toBe('This is the first and great commandment.');
    expect(verse('Matthew', 22, 40)).toContain('On these two commandments hang all the law and the prophets');
    expect(l).toContain('This is the first and great commandment');
    expect(l).toContain('On these two commandments hang all the law and the prophets');
  });

  it('the suspicion of man’s interpretation is COMMENDED, then completed', () => {
    expect(verse('Acts', 17, 11)).toContain('searched the scriptures daily');
    expect(verse('2 Peter', 1, 20)).toContain('no prophecy of the scripture is of any private interpretation');
    expect(l).toContain('searched the scriptures daily');
    expect(l).toContain('private interpretation');
  });

  it('the hell plank is answered by direction of travel, and the fire’s purpose is kept', () => {
    expect(verse('Ezekiel', 33, 11)).toContain('I have no pleasure in the death of the wicked');
    expect(verse('Matthew', 25, 41)).toContain('prepared for the devil and his angels');
    expect(verse('John', 3, 17)).toContain('to condemn the world');
    expect(l).toContain('I have no pleasure in the death of the wicked');
    expect(l, 'the fire was prepared for the adversary, not built for people')
      .toContain('prepared for the devil and his angels');
  });

  it('the historical record is stated PLAINLY and never softened', () => {
    // DR-0100 tier 1: documented damage is spoken as fact, not hedged.
    for (const fact of ['1845', '1838', '1787', '1915', '1807']) {
      expect(l, `the lesson must keep the ${fact} record`).toContain(fact);
    }
    expect(l).toMatch(/two hundred and seventy-two/);
    expect(l).toMatch(/Klan/);
  });

  it('the Word out-charges the objection rather than excusing those men', () => {
    expect(verse('Exodus', 21, 16)).toContain('he that stealeth a man');
    expect(verse('1 Timothy', 1, 10)).toContain('menstealers');
    expect(verse('Matthew', 7, 23)).toContain('I never knew you');
    expect(l).toContain('he that stealeth a man');
    expect(l).toContain('menstealers');
    expect(l).toContain('I never knew you');
  });

  it('putting His name on your own business is named as the sin it is', () => {
    expect(verse('Jeremiah', 23, 31)).toContain('use their tongues, and say, He saith');
    expect(verse('2 Peter', 2, 3)).toContain('with feigned words make merchandise of you');
    expect(l).toContain('use their tongues, and say, He saith');
    expect(l).toContain('with feigned words make merchandise of you');
  });
});

describe('L142 — the oldest instance, and why it answers the objection', () => {
  it('religious leadership used the government against Him', () => {
    expect(verse('John', 18, 31)).toContain('It is not lawful for us to put any man to death');
    expect(verse('John', 19, 15)).toContain('We have no king but Caesar');
    expect(l).toContain('It is not lawful for us to put any man to death');
    expect(l).toContain('We have no king but Caesar');
  });

  it('Jesus predicted religious atrocity by name', () => {
    expect(verse('John', 16, 2)).toContain('whosoever killeth you will think that he doeth God service');
    expect(l).toContain('whosoever killeth you will think that he doeth God service');
  });

  it('paper and perception are refused as proof; Yahweh reads the heart', () => {
    expect(verse('1 Samuel', 16, 7)).toContain('man looketh on the outward appearance');
    expect(l).toContain('man looketh on the outward appearance');
    expect(l).toContain('by their fruits ye shall know them');
  });

  it('Yahweh described human government before Israel had one', () => {
    expect(verse('1 Samuel', 8, 18)).toContain('ye shall cry out in that day because of your king');
    expect(verse('Isaiah', 9, 6)).toContain('the government shall be upon his shoulder');
    expect(l).toContain('ye shall cry out in that day because of your king');
    expect(l).toContain('the government shall be upon his shoulder');
  });
});

describe('L142 — touched, untouchable, and the invitation that ends it', () => {
  it('the body is reachable and the soul is not', () => {
    expect(verse('Matthew', 10, 28)).toContain('fear not them which kill the body');
    expect(l).toContain('fear not them which kill the body');
  });

  it('the High Priest was touched by this exact device', () => {
    expect(verse('Hebrews', 4, 15)).toContain('in all points tempted like as we are');
    expect(l).toContain('in all points tempted like as we are');
  });

  it('the fourth man in the fire is kept', () => {
    expect(verse('Daniel', 3, 25)).toContain('the form of the fourth is like the Son of God');
    expect(l).toContain('the form of the fourth is like the Son of God');
  });

  it('it ends on an invitation, not a proof', () => {
    expect(verse('Psalms', 34, 8)).toContain('O taste and see that the LORD is good');
    expect(l).toContain('O taste and see that the LORD is good');
  });

  it('and it invites the reader to audit the lesson itself', () => {
    expect(mod().facilitator.discussionPrompts.join(' ') + mod().inApp + l)
      .toMatch(/whole chapter/i);
  });
});
