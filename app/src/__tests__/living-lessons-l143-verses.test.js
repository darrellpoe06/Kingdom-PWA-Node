// @vitest-environment node
// L143 — Yahweh's Will Be Done on Earth. Verbatim KJV, and the claims this
// lesson may never lose, including the ones that cut toward us.
// =============================================================================
// Spoken by Darrell 2026-09-12, straight through: focusing on Yahweh's will and
// ways guarantees outcomes no programme or degree can; the Word is the highest
// level documentation; these are gifts; mammon is the rival god; we turned our
// children into debtors to educate them; the system's shape is DOCUMENTED, not
// accused; there is more than enough; the Word names restitution; build our own
// system; the segregation-era mutual economy proved it; the seven-year release
// was never about money but quality of life. Then the turn that makes it a
// lesson rather than an indictment: "America stole the wealth however we
// produced it... so its produceable", and "we're in an even better position to
// produce it".
//
// WHY THIS FILE IS STRICT. This lesson makes historical and statistical claims
// about real institutions AND corrects one of its own author's figures. Both
// have to stay true. The corrections are pinned here precisely because they are
// the ones a future edit would be tempted to quietly drop.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll143-yahwehs-will-be-done-on-earth-the-guaranteed-outcome-the-release-and-the-system-we-can-build';
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

describe('L143 — present, whole, and inside the authored floors', () => {
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
    for (const ref of ['Deuteronomy 15:1', 'Matthew 6:24', 'Matthew 6:10']) {
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

describe('L143 — every quoted span is verbatim KJV', () => {
  it('quotation marks are balanced', () => {
    expect(quotedSpans(withoutStories(l)).balanced).toBe(true);
  });
  it('the lesson quotes Scripture heavily (not vacuously few spans)', () => {
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
  it('the parables are marked as parables and balanced in tone', () => {
    for (const s of mod().stories) {
      expect(s.kind).toBe('parable');
      expect(s.body.length).toBeGreaterThan(800);
      expect(s.verse).toMatch(/^[0-9A-Za-z ]+ \d+:\d+$/);
    }
    expect(mod().stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });
});

describe('L143 — the typography this house is bound to', () => {
  it('names Yahweh in our voice and never the generic term', () => {
    const ours = ourVoice();
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
    expect(ours).not.toMatch(/\bGod\b/);
  });
  it('never capitalizes the adversary', () => {
    expect(ourVoice()).not.toMatch(/Satan|Lucifer/);
  });
});

describe('L143 — His economy is legislation with mechanisms, and it carries a guarantee', () => {
  it('the release is a command with a clock', () => {
    expect(verse('Deuteronomy', 15, 1)).toBe('At the end of every seven years thou shalt make a release.');
    expect(l).toContain('At the end of every seven years thou shalt make a release');
  });
  it('THE GUARANTEE is kept — it is the reason His documentation outranks ours', () => {
    expect(verse('Deuteronomy', 15, 4)).toContain('Save when there shall be no poor among you');
    expect(l).toContain('Save when there shall be no poor among you');
  });
  it('usury from a brother is forbidden, and the stated motive is his survival', () => {
    expect(verse('Leviticus', 25, 36)).toContain('that thy brother may live with thee');
    expect(l).toContain('that thy brother may live with thee');
  });
  it('the rival is named, not hinted at', () => {
    expect(verse('Matthew', 6, 24)).toContain('Ye cannot serve God and mammon');
    expect(l).toContain('Ye cannot serve God and mammon');
  });
  it('the power to get wealth is named as a gift, which is Darrell’s opening claim', () => {
    expect(verse('Deuteronomy', 8, 18)).toContain('it is he that giveth thee power to get wealth');
    expect(l).toContain('it is he that giveth thee power to get wealth');
  });
  it('debt is taught as a power relationship, which is why it gets a clock', () => {
    expect(verse('Proverbs', 22, 7)).toContain('the borrower is servant to the lender');
    expect(l).toContain('the borrower is servant to the lender');
  });
});

describe('L143 — the documented record, and the word DOCUMENTED doing its work', () => {
  it('the paperwork is named specifically, not gestured at', () => {
    for (const fact of ['1935', '1860', 'Hill-Burton', 'Wagner Act', 'Social Security']) {
      expect(l, `the lesson must keep the ${fact} record`).toContain(fact);
    }
  });
  it('it says documented AND says nobody present is accused', () => {
    // Darrell was explicit: "I'm not trying to accuse anyone of anything."
    // Losing that sentence changes what the lesson is.
    expect(l).toMatch(/documentation/i);
    expect(l).toMatch(/not accusing anyone|nobody present is accused|is not accusing/i);
  });
  it('unpaid labour is named by the verse that names it exactly', () => {
    expect(verse('Jeremiah', 22, 13)).toContain('useth his neighbour’s service without wages');
    expect(l).toContain('useth his neighbour’s service without wages');
    expect(verse('James', 5, 4)).toContain('kept back by fraud');
    expect(l).toContain('kept back by fraud');
  });
  it('restitution is the Word’s arithmetic, not a feeling', () => {
    expect(verse('Leviticus', 6, 5)).toContain('add the fifth part more thereto');
    expect(l).toContain('add the fifth part more thereto');
    expect(l).toContain('I restore him fourfold');
  });
});

describe('L143 — the turn that makes this a lesson rather than an indictment', () => {
  it('produced therefore producible is kept', () => {
    expect(l).toMatch(/producible/i);
    expect(l, 'the point is that capacity was proven, not that grievance is owed')
      .toMatch(/capacity was never the missing variable|capacity.{0,40}proven|demonstrated/i);
  });
  it('the better-position-now claim is kept, with its promise', () => {
    expect(l).toMatch(/better position/i);
    expect(verse('Haggai', 2, 9)).toContain('The glory of this latter house shall be greater than of the former');
    expect(l).toContain('The glory of this latter house shall be greater than of the former');
  });
  it('it ends on the builder keeping what he built', () => {
    expect(verse('Isaiah', 65, 22)).toContain('They shall not build, and another inhabit');
    expect(l).toContain('They shall not build, and another inhabit');
  });
});

describe('L143 — the corrections that cut toward us, which must never be quietly dropped', () => {
  it('PINNED: the unemployment figure is corrected, not repeated', () => {
    // Darrell said there was "statistically no unemployment" in the segregation
    // era. The census record is that Black unemployment stood SLIGHTLY BELOW the
    // white rate in 1930 and the gap opened in the 1940s. The accurate version is
    // stronger, and correcting our own side's number out loud is the point.
    expect(l).toMatch(/1930/);
    expect(l).toMatch(/slightly below/i);
    expect(l, 'the lesson must refuse the overstatement in its own words')
      .toMatch(/not correct to say there was none|overstates it/i);
  });
  it('PINNED: the modern lending evidence is stated precisely, including what is contested', () => {
    expect(l).toMatch(/Federal Reserve/);
    expect(l, 'the denial gap is the documented part').toMatch(/denial/i);
    expect(l, 'and the argued part must stay named as argued')
      .toMatch(/argued among economists|still argued/i);
  });
  it('PINNED: the mutual-aid record is dated and named, not sentimentalised', () => {
    expect(l).toMatch(/1787/);
    expect(l).toMatch(/1898/);
    expect(l).toMatch(/John Merrick/);
  });
  it('PINNED: the grief of study is admitted before the joy is offered', () => {
    expect(verse('Ecclesiastes', 1, 18)).toContain('For in much wisdom is much grief');
    expect(l).toContain('For in much wisdom is much grief');
    expect(l).toContain('the joy of the LORD is your strength');
  });
});

describe('L143 — what a congregation can do without anyone’s permission', () => {
  it('the Acts community is cited as a working demonstration', () => {
    expect(verse('Acts', 4, 34)).toContain('Neither was there any among them that lacked');
    expect(l).toContain('Neither was there any among them that lacked');
  });
  it('the assignment is here, on earth', () => {
    expect(verse('Matthew', 6, 10)).toContain('Thy will be done in earth, as it is in heaven');
    expect(l).toContain('Thy will be done in earth, as it is in heaven');
  });
  it('and the take-it-with-you is a real action, not a sentiment', () => {
    expect(mod().inApp).toMatch(/give it back|fifth part/i);
  });
});
