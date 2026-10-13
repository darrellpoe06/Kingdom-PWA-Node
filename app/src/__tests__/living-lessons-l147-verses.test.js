// @vitest-environment node
// L147 — The Due He Is Owed. Every place the Word shows Jesus worshipped, the
// control group that makes the silence mean something, and the verse almost
// nobody uses.
// =============================================================================
// Darrell, 2026-09-13, spoken: all places in the Word where Jesus was
// worshipped, acknowledged and made clear for those who do not give Him His
// due, all across the biblical Scriptures.
//
// WHY THIS FILE IS STRICT. The lesson is an ARGUMENT BUILT ENTIRELY OUT OF THE
// TEXT, and it has exactly four load-bearing parts. Remove any one and it stops
// proving anything:
//   1. the standard, stated by Jesus Himself ("him only shalt thou serve") —
//      without it the lesson looks like it lowered the bar to fit its answer;
//   2. the ELEVEN scenes — a proof by accumulation, not by proof text, so a
//      shortened edit that keeps "a few examples" has destroyed the argument
//      while appearing to keep it;
//   3. the CONTROL GROUP — Peter, Paul and Barnabas, and the angel refusing
//      John TWICE — because silence only means something once refusal is shown
//      to be the settled rule for every creature;
//   4. Revelation 1:17, where the SAME John falls at the feet of the risen
//      Christ and is told only "Fear not" — the sharpest verse in the case and
//      the first one a length-edit would cut.
// Each is pinned separately below, and the count in (2) is asserted as a NUMBER
// so that quietly dropping scenes fails rather than passes.
//
// DOUBLE QUOTES ARE RESERVED FOR THE WORD (the convention DR-0380 established),
// so every quoted span here is a Scripture claim and the gate can require all
// of them to be letter-for-letter KJV with no carve-out.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll147-the-due-he-is-owed-every-place-the-word-shows-jesus-worshipped-and-the-one-thing-that-never-happens';
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


describe('L147 — present, whole, and inside the authored floors', () => {
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
  it('the run-of-show parses into real parts, so the presenter is not one slide', () => {
    expect(mod().facilitator.howToRun.split('|').length).toBeGreaterThanOrEqual(8);
  });
});

describe('L147 — every quoted span is verbatim KJV', () => {
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
  it("Darrell's spoken directive is reported, never dressed as Scripture", () => {
    expect(l).toMatch(/Darrell, 2026-09-13, spoken/);
    expect(l).not.toMatch(/spoken: "/);
  });
});

describe('L147 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L147 — PART ONE: the standard is set by the accused Himself', () => {
  // Without this the lesson reads as though it lowered the bar to fit its answer.
  it('quotes Jesus stating that worship belongs to Yahweh alone', () => {
    expect(verse('Matthew', 4, 10)).toContain('Thou shalt worship the Lord thy God, and him only shalt thou serve');
    expect(l).toContain('Thou shalt worship the Lord thy God, and him only shalt thou serve');
    expect(l).toMatch(/HIM ONLY/);
  });
  it("and Yahweh's own fence around His glory", () => {
    expect(verse('Isaiah', 42, 8)).toContain('my glory will I not give to another');
    expect(l).toContain('my glory will I not give to another');
    expect(verse('Exodus', 20, 3)).toBe('Thou shalt have no other gods before me.');
    expect(l).toContain('Thou shalt have no other gods before me');
  });
});

describe('L147 — PART TWO: the ELEVEN scenes, pinned as a count and one by one', () => {
  // A proof by accumulation. An edit that keeps "a few examples" has destroyed
  // the argument while appearing to keep it, so the number is asserted.
  const SCENES = [
    ['Matthew', 2, 11, 'fell down, and worshipped him'],
    ['Matthew', 8, 2, 'there came a leper and worshipped him'],
    ['Matthew', 9, 18, 'there came a certain ruler, and worshipped him'],
    ['Matthew', 14, 33, 'Of a truth thou art the Son of God'],
    ['Matthew', 15, 25, 'Then came she and worshipped him, saying, Lord, help me'],
    ['Matthew', 20, 20, 'worshipping him'],
    ['Mark', 5, 6, 'ran and worshipped him'],
    ['John', 9, 38, 'Lord, I believe. And he worshipped him'],
    ['Matthew', 28, 9, 'held him by the feet, and worshipped him'],
    ['Matthew', 28, 17, 'when they saw him, they worshipped him'],
    ['Luke', 24, 52, 'worshipped him, and returned to Jerusalem with great joy'],
  ];
  it('there are eleven of them', () => {
    expect(SCENES.length).toBe(11);
  });
  it.each(SCENES)('%s %d:%d is quoted verbatim and present in the lesson', (book, ch, num, fragment) => {
    expect(verse(book, ch, num)).toContain(fragment);
    expect(l).toContain(fragment);
  });
  it('says out loud that He never once stops it', () => {
    expect(l).toMatch(/in not one of them does He stop it|never once stops/i);
  });
});

describe('L147 — PART THREE: the control group, which is what makes the silence mean something', () => {
  it('Peter lifts Cornelius off the floor', () => {
    expect(verse('Acts', 10, 26)).toContain('Stand up; I myself also am a man');
    expect(l).toContain('Stand up; I myself also am a man');
  });
  it('Paul and Barnabas tear their clothes, and the lesson says what that gesture meant', () => {
    expect(verse('Acts', 14, 14)).toContain('rent their clothes');
    expect(l).toContain('rent their clothes');
    expect(verse('Acts', 14, 15)).toContain('We also are men of like passions with you');
    expect(l).toContain('We also are men of like passions with you');
    expect(l).toMatch(/blasphemy/i);
  });
  it('the angel refuses John TWICE, and the lesson says the number', () => {
    expect(verse('Revelation', 19, 10)).toContain('See thou do it not');
    expect(verse('Revelation', 22, 9)).toContain('See thou do it not');
    expect(l).toContain('See thou do it not');
    expect(l).toContain('worship God');
    expect(l).toMatch(/Twice\./);
  });
});

describe('L147 — PART FOUR: the verse almost nobody uses', () => {
  // The first thing a length-edit would cut, and the sharpest thing in the case.
  it('the SAME John falls at the feet of the risen Christ', () => {
    expect(verse('Revelation', 1, 17)).toContain('I fell at his feet as dead');
    expect(l).toContain('I fell at his feet as dead');
  });
  it('and gets no refusal — only a hand and Fear not', () => {
    expect(verse('Revelation', 1, 17)).toContain('he laid his right hand upon me, saying unto me, Fear not; I am the first and the last');
    expect(l).toContain('he laid his right hand upon me, saying unto me, Fear not; I am the first and the last');
  });
  it('and the contrast is stated as the three falls it is', () => {
    expect(l).toMatch(/three falls|Three falls/);
  });
});

describe('L147 — the corroboration, from every direction at once', () => {
  it('the hostile witnesses understood the claim', () => {
    expect(verse('Matthew', 21, 16)).toContain('Hearest thou what these say?');
    expect(l).toContain('Hearest thou what these say?');
    expect(verse('Matthew', 21, 16)).toContain('Out of the mouth of babes and sucklings thou hast perfected praise');
    expect(l).toContain('Out of the mouth of babes and sucklings thou hast perfected praise');
  });
  it('Thomas is blessed rather than corrected', () => {
    expect(verse('John', 20, 28)).toContain('My Lord and my God');
    expect(l).toContain('My Lord and my God');
    expect(verse('John', 20, 29)).toContain('blessed are they that have not seen, and yet have believed');
    expect(l).toContain('blessed are they that have not seen, and yet have believed');
  });
  it('the Father commands the angels to do it, and names the Son by the title', () => {
    expect(verse('Hebrews', 1, 6)).toContain('let all the angels of God worship him');
    expect(l).toContain('let all the angels of God worship him');
    expect(verse('Hebrews', 1, 8)).toContain('Thy throne, O God, is for ever and ever');
    expect(l).toContain('Thy throne, O God, is for ever and ever');
  });
  it('heaven worships the Father and the Lamb in one breath', () => {
    expect(verse('Revelation', 5, 12)).toContain('Worthy is the Lamb that was slain');
    expect(l).toContain('Worthy is the Lamb that was slain');
    expect(verse('Revelation', 5, 13)).toContain('unto him that sitteth upon the throne, and unto the Lamb');
    expect(l).toContain('unto him that sitteth upon the throne, and unto the Lamb');
  });
});

describe('L147 — why it is not trivia, and where it lands', () => {
  it("states the cost in His own words — Darrell's whole reason for asking", () => {
    expect(verse('John', 5, 23)).toContain('He that honoureth not the Son honoureth not the Father which hath sent him');
    expect(l).toContain('He that honoureth not the Son honoureth not the Father which hath sent him');
    expect(l).toMatch(/EVEN AS/);
  });
  it('and closes to the glory of the Father, not away from Him', () => {
    expect(verse('Philippians', 2, 11)).toContain('to the glory of God the Father');
    expect(l).toContain('to the glory of God the Father');
    expect(l).toMatch(/has never taken one thing from the Father|road by which the Father is glorified/i);
  });
  it('ends on the desperate people who got there first, not on the argument', () => {
    expect(l).toMatch(/a leper, a ruler, a mother, a man from the tombs/i);
    expect(l).toMatch(/desperate, and they were right/i);
  });
});
