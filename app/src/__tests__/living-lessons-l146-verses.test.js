// @vitest-environment node
// L146 — He Said It First. Verbatim KJV, both halves, and the nine teachings
// Darrell spoke into it, each pinned separately.
// =============================================================================
// Spoken 2026-09-13, in pieces, across one afternoon. The first half is the love
// language: Yahweh tells us how much He loves us, He has what people call game,
// and reading the Word through the lens of Him loving you makes you feel deeply
// loved. Then, unprompted and in the same breath, he refused to let the lesson
// be only that and named the HARD passages himself — the she-bears, the inn
// where Yahweh met Moses, the furnace. Then four more: Job's hedge, loving us
// first while in sin with an escape His own Word allows, the 4th-dimensional
// work done mostly without us, and the longsuffering across all generations.
// Then five more, the hardest: even in hell Jesus is the Witness and must be
// with us ("sad and amazing"), the benefit of the Presence withdrawn, time's up,
// back into eternity where you came from, and one shot at the Crown of Life.
//
// WHY THIS FILE IS STRICT. A lesson that keeps only the sweet half is flattery,
// and one that keeps only the hard half is fear. Every one of the nine is pinned
// here because a future edit shortening this lesson would cut the hard ones
// first — they are the uncomfortable paragraphs — and the lesson would quietly
// become the thing it was written to refuse.
//
// DOUBLE QUOTES ARE RESERVED FOR THE WORD (the L145 convention). Darrell's own
// spoken directive is rendered as reported speech, never in quotation marks, so
// the verbatim gate below can treat EVERY quoted span as a Scripture claim.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll146-he-said-it-first-what-it-sounds-like-when-yahweh-tells-you-how-he-feels';
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

describe('L146 — present, whole, and inside the authored floors', () => {
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
});

describe('L146 — every quoted span is verbatim KJV', () => {
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
  it('Darrell\'s spoken directive is NOT dressed as Scripture', () => {
    // The convention that makes the gate above meaningful: his words are
    // reported, never quoted, so a quoted span is always a Scripture claim.
    expect(l).toMatch(/Darrell, 2026-09-13, spoken/);
    expect(l).not.toContain('spoken: "Yahweh tells us how much He loves us');
  });
});

describe('L146 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L146 — the FIRST half: He says it, and the receipt is already filed', () => {
  it('the word game is turned over rather than dodged', () => {
    expect(l).toMatch(/[Gg]ame is what we call talk a man cannot back/);
  });
  it('ALREADY is the hinge — He said it in the past tense', () => {
    expect(verse('Romans', 5, 8)).toContain('while we were yet sinners, Christ died for us');
    expect(l).toContain('while we were yet sinners, Christ died for us');
    expect(verse('1 John', 4, 19)).toBe('We love him, because he first loved us.');
    expect(l).toContain('We love him, because he first loved us');
  });
  it('His own sentences are present, not summarized', () => {
    expect(l).toContain('I have loved thee with an everlasting love');
    expect(l).toContain('I have graven thee upon the palms of my hands');
    expect(l).toContain('he will joy over thee with singing');
  });
});

describe('L146 — the HARD half Darrell named himself', () => {
  it('the she-bears at Bethel are in it, not edited out', () => {
    expect(verse('2 Kings', 2, 24)).toContain('two she bears out of the wood');
    expect(l).toContain('two she bears out of the wood');
  });
  it('the inn where Yahweh met Moses, framed in his own phrase', () => {
    expect(verse('Exodus', 4, 24)).toContain('the LORD met him, and sought to kill him');
    expect(l).toContain('the LORD met him, and sought to kill him');
    expect(l).toMatch(/for him while against him/i);
    expect(l).toContain('he let him go');
  });
  it('the furnace, with BUT IF NOT as the hinge', () => {
    expect(verse('Daniel', 3, 18)).toContain('But if not, be it known unto thee, O king');
    expect(l).toContain('But if not, be it known unto thee, O king');
    expect(l).toMatch(/BUT IF NOT/);
  });
  it('and both halves are held under the Word\'s own category', () => {
    expect(verse('Romans', 11, 22)).toContain('Behold therefore the goodness and severity of God');
    expect(l).toContain('Behold therefore the goodness and severity of God');
  });
});

describe('L146 — THE HEDGE: Job was never touched unwilling', () => {
  it('the hedge is quoted as the ACCUSATION it is', () => {
    expect(verse('Job', 1, 10)).toContain('Hast not thou made an hedge about him');
    expect(l).toContain('Hast not thou made an hedge about him');
  });
  it('both permissions carry their limit in the same sentence', () => {
    expect(verse('Job', 1, 12)).toContain('only upon himself put not forth thine hand');
    expect(l).toContain('only upon himself put not forth thine hand');
    expect(verse('Job', 2, 6)).toContain('he is in thine hand; but save his life');
    expect(l).toContain('he is in thine hand; but save his life');
  });
  it('refuses to make the loss small, and names it BOUNDED instead', () => {
    expect(l).toMatch(/ten children is not arithmetic|Ten children is not arithmetic/);
    expect(l).toMatch(/BOUNDED/);
  });
  it('and keeps that Job is never shown the fence', () => {
    expect(l).toMatch(/never shown the fence|Job is never shown/i);
  });
});

describe('L146 — loving us first, with an escape His own Word allows', () => {
  it('the timing is pinned in all three of Paul\'s descriptions', () => {
    expect(verse('Romans', 5, 6)).toContain('when we were yet without strength');
    expect(l).toContain('when we were yet without strength');
    expect(l).toContain('when we were enemies, we were reconciled');
  });
  it('the escape is built INSIDE the law, not around it', () => {
    expect(verse('1 Corinthians', 10, 13)).toContain('will with the temptation also make a way to escape');
    expect(l).toContain('will with the temptation also make a way to escape');
    expect(l).toMatch(/corrupt|never binding/i);
  });
});

describe('L146 — the 4th-dimensional work, and the longsuffering', () => {
  it('names the frame CLAUDE.md is already bound to', () => {
    expect(verse('Hebrews', 11, 3)).toContain('the worlds were framed by the word of God');
    expect(l).toContain('the worlds were framed by the word of God');
    expect(l).toContain('by him all things consist');
    expect(l).toMatch(/4th-dimensional and 3rd-dimensional/);
  });
  it('keeps Darrell\'s own "with us and most times without us"', () => {
    expect(l).toMatch(/with us and most times WITHOUT us|with us and most times without us/);
  });
  it('longsuffering is quoted from His own self-introduction', () => {
    expect(verse('Exodus', 34, 6)).toContain('merciful and gracious, longsuffering');
    expect(l).toContain('merciful and gracious, longsuffering');
    expect(verse('2 Peter', 3, 9)).toContain('not willing that any should perish');
    expect(l).toContain('not willing that any should perish');
  });
});

describe('L146 — THE HARDEST: present as Witness, the benefit withdrawn, and the clock', () => {
  // "Even in hell Jesus is the witness and must be with us!!! Wow.... sad and
  // amazing" / "However we don't get the benefit of the Presence anymore.... In
  // hell..." — the distinction is the whole doctrine and neither half alone is.
  it('He is THERE — the second half of Psalms 139:8 is not dropped', () => {
    expect(verse('Psalms', 139, 8)).toContain('if I make my bed in hell, behold, thou art there');
    expect(l).toContain('if I make my bed in hell, behold, thou art there');
  });
  it('IN THE PRESENCE OF THE LAMB is quoted, not softened', () => {
    expect(verse('Revelation', 14, 10)).toContain('in the presence of the holy angels, and in the presence of the Lamb');
    expect(l).toContain('in the presence of the holy angels, and in the presence of the Lamb');
  });
  it('and the other half is quoted too, so the doctrine is coherent', () => {
    expect(verse('2 Thessalonians', 1, 9)).toContain('punished with everlasting destruction from the presence of the Lord');
    expect(l).toContain('punished with everlasting destruction from the presence of the Lord');
    expect(l).toMatch(/BENEFIT of the Presence/);
  });
  it('the rich man asks for one drop and is answered with geography', () => {
    expect(verse('Luke', 16, 26)).toContain('between us and you there is a great gulf fixed');
    expect(l).toContain('between us and you there is a great gulf fixed');
  });
  it('the clock: once to die, then back where you came from', () => {
    expect(verse('Hebrews', 9, 27)).toContain('it is appointed unto men once to die, but after this the judgment');
    expect(l).toContain('it is appointed unto men once to die, but after this the judgment');
    expect(verse('Ecclesiastes', 12, 7)).toContain('the spirit shall return unto God who gave it');
    expect(l).toContain('the spirit shall return unto God who gave it');
  });
  it('ONE SHOT — the Crown of Life, and the window is now', () => {
    expect(verse('Revelation', 2, 10)).toContain('be thou faithful unto death, and I will give thee a crown of life');
    expect(l).toContain('be thou faithful unto death, and I will give thee a crown of life');
    expect(verse('2 Corinthians', 6, 2)).toContain('behold, now is the accepted time');
    expect(l).toContain('behold, now is the accepted time');
    expect(l).toMatch(/one shot|One shot/);
  });
  it('closes on the way out, not on the fear', () => {
    expect(verse('John', 14, 6)).toContain('I am the way, the truth, and the life');
    expect(l).toContain('I am the way, the truth, and the life');
  });
  it('and says WHY both halves are in one lesson', () => {
    expect(l).toMatch(/only ever tells you the sweet half is managing you|only ever says the sweet half/i);
  });
});
