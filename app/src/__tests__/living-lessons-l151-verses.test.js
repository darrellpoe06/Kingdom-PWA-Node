// @vitest-environment node
// L151 — Crying Because of All the Dying: Slow, Vicious, But Yahweh
// =============================================================================
// Darrell spoke this one into the channel while a fix was being verified:
// "Crying because of all the dying... slow and vicious... but Yahweh!!!!!!"
// and then, a few minutes later, the sustaining half: "Only strength is Joy!!!!"
//
// It is built as a spoken teaching (the standing rule: his word gets captured,
// verified and shipped the same session), and the method he set in the same
// hour governs it: "Why not just get it from the record.... like we get it from
// the Word!!!" So every quoted span in this lesson was pulled out of
// public/bible/kjv at generation time. None of it passed through recall.
//
// THE SPINE, and every movement is his phrase answered from the Word:
//   1. CRYING is marked, not corrected — Jeremiah 9:1 asks for MORE tears;
//      Ezekiel 9:4 sets the preserving mark on the men that sigh and cry;
//      John 11:35 / Isaiah 53:3 make it Christlike.
//   2. SLOW has a cause — Hosea 4:6, and the second clause is the sharp one:
//      because thou hast REJECTED knowledge. A harvest, not an accident.
//      Isaiah 57:1 names the silence around it (no man layeth it to heart).
//   3. TWO SLOWNESSES, opposites — Habakkuk 1:2 is allowed to voice the
//      complaint; 2 Peter 3:9 answers it: not slack, but longsuffering.
//   4. VICIOUS has an author, and it is not the Father — Ezekiel 18:32 / 33:11
//      (no pleasure; turn, and live) with Hebrews 2:14-15 naming the devil and,
//      in the same clause, his destruction.
//   5. THE LAMENT GETS WORK — Proverbs 24:11-12 forbids forbearing and refuses
//      "we knew it not"; Matthew 9:36 forbids the contempt trap.
//   6. BUT YAHWEH — Psalms 73:26 supplies the literal grammar, held in three
//      tenses: Lamentations 3:22-23 (not consumed), Isaiah 25:8 /
//      1 Corinthians 15:54-55 (swallowed up), Revelation 21:4-5 (no more).
//   7. THE ONLY STRENGTH IS JOY — Nehemiah 8:10 said to a WEEPING crowd;
//      Hebrews 12:2 puts joy upstream of endurance; Habakkuk 3:17-18 proves the
//      "only" by removing every other support by name before the Yet;
//      Isaiah 61:3 issues the oil of joy to mourners.
//
// WHY THIS FILE IS STRICT. A lesson about dying that misquotes comfort is worse
// than no lesson. The load-bearing pins are asserted by hand, verse by verse,
// because a shortening edit that drops any one of them turns this into either
// sentiment or fatalism — the two failures it exists to refuse.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';
import { measureLesson, CHILD_CEILING } from '../../../scripts/reading-level.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh';
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

describe('L151 — present, whole, and inside the authored floors', () => {
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
    expect(m.questions.length).toBeGreaterThanOrEqual(10);
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

  it('the reading bands are MEASURED here, not claimed in a commit message', () => {
    // I wrote "bands 4.4 / 6.4 / 12.7" into this lesson's commit message
    // without measuring them. The real values, measured with the same scanner
    // the reading-level gate uses, are child 0 / teen 7.7 / senior 12.9. A
    // number stated from memory is the exact failure this session was spent
    // correcting, so the number now lives in a check instead of in prose.
    //
    // Only the ORDER is asserted strictly; the values are asserted loosely
    // enough to survive an honest edit, because a gate that pins a float to
    // one decimal breaks on a comma and teaches people to update it blindly.
    const b = measureLesson(mod()).bands;
    expect(b.child.authored).toBeLessThanOrEqual(b.teen.authored);
    expect(b.teen.authored).toBeLessThanOrEqual(b.senior.authored);
    expect(b.child.authored).toBeLessThanOrEqual(CHILD_CEILING);
    expect(b.teen.authored).toBeGreaterThan(5);
    expect(b.senior.authored).toBeGreaterThan(10);
  });
});

describe('L151 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily', () => {
    expect(quotedSpans(withoutStories(l)).spans.length).toBeGreaterThan(35);
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

describe('L151 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(10);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
    expect(l).not.toMatch(/\bThe devil\b/);
  });
});

describe('L151 — the crying is marked, not corrected (movement 1)', () => {
  it('asks for MORE tears rather than fewer', () => {
    expect(verse('Jeremiah', 9, 1)).toBe('Oh that my head were waters, and mine eyes a fountain of tears, that I might weep day and night for the slain of the daughter of my people!');
    expect(l).toContain('a fountain of tears');
  });
  it('puts the preserving mark on the people who sigh and cry', () => {
    expect(verse('Ezekiel', 9, 4)).toContain('set a mark upon the foreheads of the men that sigh and that cry');
    expect(l).toContain('the men that sigh and that cry');
  });
  it('and grounds it in the Son Himself', () => {
    expect(verse('John', 11, 35)).toBe('Jesus wept.');
    expect(l).toContain('Jesus wept.');
    expect(verse('Isaiah', 53, 3)).toContain('a man of sorrows, and acquainted with grief');
    expect(l).toContain('acquainted with grief');
  });
});

describe('L151 — the slow has a cause, and the cause is rejected knowledge (movement 2)', () => {
  it('quotes Hosea 4:6 far enough to reach the second clause', () => {
    expect(verse('Hosea', 4, 6)).toContain('because thou hast rejected knowledge');
    // The whole point: not merely absent knowledge. If a shortening edit drops
    // this clause the lesson becomes fatalism.
    expect(l).toContain('because thou hast rejected knowledge');
  });
  it('and names the silence around a slow dying', () => {
    expect(verse('Isaiah', 57, 1)).toContain('and no man layeth it to heart');
    expect(l).toContain('no man layeth it to heart');
  });
});

describe('L151 — two slownesses, and they are opposites (movement 3)', () => {
  it('lets the complaint be voiced', () => {
    expect(verse('Habakkuk', 1, 2)).toContain('how long shall I cry');
    expect(l).toContain('how long shall I cry');
  });
  it('and answers it with longsuffering, not slackness', () => {
    expect(verse('2 Peter', 3, 9)).toContain('but is longsuffering to us-ward, not willing that any should perish');
    expect(l).toContain('not willing that any should perish');
    expect(l).toMatch(/two slownesses/i);
  });
});

describe('L151 — the vicious has an author, and it is not the Father (movement 4)', () => {
  it('removes any pleasure in the dying from Yahweh, with the remedy attached', () => {
    expect(verse('Ezekiel', 18, 32)).toContain('I have no pleasure in the death of him that dieth');
    expect(l).toContain('no pleasure in the death of him that dieth');
    expect(verse('Ezekiel', 33, 11)).toContain('turn ye, turn ye from your evil ways');
    expect(l).toContain('turn ye, turn ye from your evil ways');
  });
  it('names who held the power of death and what was done about him', () => {
    expect(verse('Hebrews', 2, 14)).toContain('him that had the power of death, that is, the devil');
    expect(l).toContain('that is, the devil');
    expect(verse('Hebrews', 2, 15)).toContain('through fear of death were all their lifetime subject to bondage');
    expect(l).toContain('subject to bondage');
  });
});

describe('L151 — the lament is given work, and guarded from contempt (movement 5)', () => {
  it('forbids forbearing, and refuses the plea of ignorance', () => {
    expect(verse('Proverbs', 24, 11)).toContain('deliver them that are drawn unto death');
    expect(l).toContain('deliver them that are drawn unto death');
    expect(verse('Proverbs', 24, 12)).toContain('Behold, we knew it not');
    expect(l).toContain('Behold, we knew it not');
  });
  it('and forbids the contempt the seeing can curdle into', () => {
    expect(verse('Matthew', 9, 36)).toContain('as sheep having no shepherd');
    expect(l).toContain('as sheep having no shepherd');
    expect(l).toMatch(/contempt/i);
  });
});

describe('L151 — but Yahweh, in three tenses (movement 6)', () => {
  it('supplies the hinge verbatim', () => {
    expect(verse('Psalms', 73, 26)).toBe('My flesh and my heart faileth: but God is the strength of my heart, and my portion for ever.');
    expect(l).toContain('My flesh and my heart faileth: but God is the strength of my heart');
  });
  it('present tense: not consumed, measured against a destroyed city', () => {
    expect(verse('Lamentations', 3, 22)).toContain('that we are not consumed');
    expect(l).toContain('that we are not consumed');
    expect(verse('Lamentations', 3, 23)).toBe('They are new every morning: great is thy faithfulness.');
    expect(l).toContain('They are new every morning');
  });
  it('and the tears are collected, not merely witnessed', () => {
    expect(verse('Psalms', 56, 8)).toContain('put thou my tears into thy bottle');
    expect(l).toContain('put thou my tears into thy bottle');
  });
  it('future tense: death swallowed up', () => {
    expect(verse('Isaiah', 25, 8)).toContain('He will swallow up death in victory');
    expect(l).toContain('He will swallow up death in victory');
    expect(verse('1 Corinthians', 15, 55)).toBe('O death, where is thy sting? O grave, where is thy victory?');
    expect(l).toContain('O death, where is thy sting?');
  });
  it('consummated: no more death at all, on a warrant', () => {
    expect(verse('Revelation', 21, 4)).toContain('there shall be no more death');
    expect(l).toContain('there shall be no more death');
    expect(verse('Revelation', 21, 5)).toContain('these words are true and faithful');
    expect(l).toContain('true and faithful');
  });
  it('sorrow is kept and hopelessness is what is forbidden', () => {
    expect(verse('1 Thessalonians', 4, 13)).toContain('that ye sorrow not, even as others which have no hope');
    expect(l).toContain('even as others which have no hope');
  });
});

describe('L151 — the only strength is joy (movement 7, his own words)', () => {
  it('quotes Nehemiah 8:10, which was said to a weeping congregation', () => {
    expect(verse('Nehemiah', 8, 10)).toContain('for the joy of the LORD is your strength');
    expect(l).toContain('the joy of the LORD is your strength');
    // The same verse forbids the sorrow AND sends portions out; both matter.
    expect(verse('Nehemiah', 8, 10)).toContain('send portions unto them for whom nothing is prepared');
    expect(l).toContain('send portions unto them for whom nothing is prepared');
    expect(l).toMatch(/weeping/i);
  });
  it('puts joy UPSTREAM of endurance, which is the whole correction', () => {
    expect(verse('Hebrews', 12, 2)).toContain('who for the joy that was set before him endured the cross');
    expect(l).toContain('who for the joy that was set before him endured the cross');
    expect(l).toMatch(/upstream of endurance/i);
  });
  it('proves the ONLY by removing every other support before the Yet', () => {
    expect(verse('Habakkuk', 3, 17)).toContain('Although the fig tree shall not blossom');
    expect(l).toContain('Although the fig tree shall not blossom');
    expect(verse('Habakkuk', 3, 18)).toBe('Yet I will rejoice in the LORD, I will joy in the God of my salvation.');
    expect(l).toContain('Yet I will rejoice in the LORD');
  });
  it('issues the oil of joy to mourners, so grieving is the qualification', () => {
    expect(verse('Isaiah', 61, 3)).toContain('the oil of joy for mourning');
    expect(l).toContain('the oil of joy for mourning');
    expect(l).toMatch(/mourning is the qualification|issued to mourners|to mourners/i);
  });
  it('and the joy cannot be taken by any man', () => {
    expect(verse('John', 16, 22)).toContain('your joy no man taketh from you');
    expect(l).toContain('your joy no man taketh from you');
  });
});

describe('L151 — the honest posture where the scale exceeds sight', () => {
  it('models thou knowest rather than a forecast or a denial', () => {
    expect(verse('Ezekiel', 37, 3)).toContain('can these bones live?');
    expect(l).toContain('can these bones live?');
    expect(l).toContain('thou knowest');
  });
  it('and leaves the balm indictment standing', () => {
    expect(verse('Jeremiah', 8, 22)).toContain('Is there no balm in Gilead');
    expect(l).toContain('Is there no balm in Gilead');
  });
  it('closing on a question rather than a conclusion', () => {
    expect(verse('John', 11, 26)).toContain('Believest thou this?');
    expect(l).toContain('Believest thou this?');
  });
});

describe('PROVEN-TO-CATCH — the two failures this lesson refuses', () => {
  it('fatalism: dropping the rejected-knowledge clause would leave the dying causeless', () => {
    const fatalist = 'My people are destroyed for lack of knowledge.';
    expect(fatalist.includes('rejected knowledge')).toBe(false);
    expect(l).toContain('because thou hast rejected knowledge');
  });
  it('sentiment: joy taught as the reward AFTER endurance inverts Hebrews 12:2', () => {
    const inverted = 'Endure the cross, and joy will be given to you afterward.';
    expect(/for the joy .* endured/.test(inverted)).toBe(false);
    expect(l).toContain('who for the joy that was set before him endured the cross');
  });
  it('and contempt: the lesson must name the trap, not only avoid it', () => {
    expect(l).toMatch(/contempt/i);
    expect(l).toContain('as sheep having no shepherd');
  });
});
