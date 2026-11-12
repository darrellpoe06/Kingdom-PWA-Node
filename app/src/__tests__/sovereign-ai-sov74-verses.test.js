// =============================================================================
// sovereign-ai-sov74-verses — the gate for sov74, "With all thy getting get
// understanding - the schools that met the machine, and the test it cannot
// take for you"
// =============================================================================
// WHERE IT CAME FROM. On 2026-11-12 Darrell sent a video into the lesson lane,
// https://youtu.be/g_gRHW4SJtI, a report on how A.I. is changing schools around
// the world, with one word of his own over it: Lesson. A point-by-point summary
// with timestamps came with it. THE BUILD DID NOT WATCH THE VIDEO: this session
// cannot reach YouTube. So every claim the lesson makes about the video is a
// claim about that summary, and the lesson says so in every band.
//
// WHERE IT LANDS. Proverbs 4:7 -- with all thy getting get understanding. A
// machine can hand a student an answer; it cannot hand him the getting. The
// video's principles (responsible use not bans; rules by level; fact-checking
// and data stewardship taught on purpose; the tool supports, never replaces;
// tests that verify understanding) are taught Word-first, and the lesson shows
// that this app's own learner record, settled the same night (DR-1439,
// DR-1440), already reads that way: reading counts, every try is study, order
// means nothing, every answer right means most, and finished courses earn
// crowns on Proverbs 14:18, Proverbs 4:7-9 and 1 Corinthians 9:25.
//
// WHAT WAS NOT CHECKED IS SAID ON THE PAGE (DR-0076 §8). The adult lesson
// carries a WHAT WE DID NOT CHECK section, and this gate holds it there.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456).
// The sweep below re-derives that from disk and is proven able to fail.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov74-with-all-thy-getting-get-understanding';
const VIDEO = 'g_gRHW4SJtI';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

const allStrings = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => allStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => allStrings(v, out));
  return out;
};

// --- the KJV corpus on disk --------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();
const bookOf = (b) => {
  const f = b.replace(/\s+/g, '');
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  return bookCache.get(f);
};
/** Every chapter of every book this lesson touches, verses joined by one space,
 *  so a CONTIGUOUS range is a substring while a reordered span is not. */
const CHAPTERS = [
  'Deuteronomy',
  'Proverbs',
  'Isaiah',
  'Daniel',
  'Hosea',
  'Luke',
  'Acts',
  '1 Corinthians',
  'Galatians',
  'Colossians',
  '1 Thessalonians',
  '2 Timothy',
  'Hebrews',
  'James',
].flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov74 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it is the week after sov73, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov73-/);
  });

  it('the adult lesson runs in seven numbered movements, in order', () => {
    const order = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'].map((n) => M.lesson.indexOf(`MOVEMENT ${n}:`));
    expect(
      order.every((p) => p > 0),
      `movements found at ${order.join(',')}`
    ).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('every lesson has a test: the quiz is present and every answer points at a real option', () => {
    const qs = M.quiz.questions;
    expect(qs.length).toBeGreaterThanOrEqual(6);
    for (const q of qs) {
      expect(q.options.length, q.q).toBeGreaterThanOrEqual(3);
      expect(q.answer, q.q).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.q).toBeLessThan(q.options.length);
      expect(q.explain.length, q.q).toBeGreaterThan(40);
    }
  });
});

describe('the provenance is honest', () => {
  it('it names the video it was built from, so the repo is a second witness (DR-0076 §8)', () => {
    expect(M.bigIdea).toContain(VIDEO);
    expect(M.lesson).toContain(VIDEO);
  });

  it('it says plainly, in every text, that the video itself was not watched', () => {
    expect(M.bigIdea).toMatch(/DID NOT WATCH THE VIDEO/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say the video was not watched`).toMatch(
        /did not watch|could not watch|was not watched|not watched|could not open|never watched/i
      );
    }
  });

  it('the adult lesson carries WHAT WE DID NOT CHECK, naming the video, the teacher and the India figure', () => {
    const i = M.lesson.indexOf('WHAT WE DID NOT CHECK.');
    expect(i).toBeGreaterThan(0);
    const section = M.lesson.slice(i, M.lesson.indexOf('TALK TOGETHER.'));
    expect(section).toMatch(/video itself was not watched/);
    expect(section).toMatch(/Karmen Kisel/);
    expect(section).toMatch(/India/);
    expect(section).toMatch(/cheating/);
  });

  it('the researcher is named as he spells his name, and the summary spelling is recorded only as a correction', () => {
    expect(M.lesson).toMatch(/Hany Farid/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t).replace(/spelled Hani in that summary/, ''), band).not.toMatch(/\bHani\b/);
    }
  });
});

describe('every quoted span is verbatim the KJV on disk', () => {
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(/"([^"]+)"/g)].map((m) => [band, m[1]]));

  it('the sweep looks at a real number of spans, so it cannot pass by checking nothing', () => {
    expect(spans().length).toBeGreaterThan(60);
  });

  it('each span is a contiguous span of its own chapter', () => {
    const bad = spans().filter(([, s]) => !CHAPTERS.some((c) => c.includes(s)));
    expect(bad.map(([b, s]) => `${b}: ${s.slice(0, 70)}`)).toEqual([]);
  });

  it('every double-quoted span anywhere in the module is Scripture, so no one else is put in quotation marks (DR-0331)', () => {
    const quoted = allStrings(M).flatMap((s) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
    expect(quoted.filter((s) => !CHAPTERS.some((c) => c.includes(s)))).toEqual([]);
  });

  it('each quoted verse carries its reference beside it in every band (DR-0402)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect([...String(t).matchAll(/"[^"]+" \([1-3]?\s?[A-Z][a-z]+ \d+:\d+(-\d+)?\)/g)].length, band).toBeGreaterThan(10);
    }
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, first] = spans()[0];
    const broken = first.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(first);
    expect(CHAPTERS.some((c) => c.includes(broken))).toBe(false);
  });

  it('PROVEN TO CATCH: the DR-0456 apostrophe class -- an ASCII apostrophe where the corpus has U+2019', () => {
    const withCurly = spans().filter(([, s]) => s.includes('’'));
    expect(withCurly.length, 'the lesson must quote at least one verse carrying U+2019').toBeGreaterThan(0);
    const retyped = withCurly[0][1].replace(/’/g, "'");
    expect(CHAPTERS.some((c) => c.includes(retyped))).toBe(false);
  });
});

describe('the four bands clear the gate, measured not claimed', () => {
  it('shares, ladder, child ceiling and differentiation all pass', () => {
    expect(fourBandFaults(M)).toEqual([]);
  });

  it('the ladder is monotone and the child band is under the new-lesson ceiling', () => {
    const t = TEXTS();
    expect(fk(t.child)).toBeLessThan(fk(t.youth));
    expect(fk(t.youth)).toBeLessThan(fk(t.teen));
    expect(fk(t.teen)).toBeLessThanOrEqual(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
  });

  it('no band is a truncation of another', () => {
    const t = TEXTS();
    const keys = Object.keys(t);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        expect(overlapOf(t[keys[i]], t[keys[j]]), `${keys[i]} vs ${keys[j]}`).toBeLessThan(0.5);
      }
    }
  });

  it('every text sends the reader to parents, to children and to a friend (DR-0795)', () => {
    expect(placesMissingDirections(M)).toEqual([]);
  });
});

describe('the landing is understanding, and every band carries it', () => {
  it('every text quotes Proverbs 4:7, the verse the week stands on', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/with all thy getting get understanding\." \(Proverbs 4:7(-9)?\)/);
    }
  });

  it('every text teaches checking by the Bereans (Acts 17:11) and keeping one’s own data', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/searched the scriptures daily/);
      expect(String(t), `${band} must teach data stewardship`).toMatch(/type|data|keeping/i);
    }
  });

  it('every text draws the line: the tool supports and never is the one who understood', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/(never|do not)[^.]{0,40}(the one who|the party that) (understood|learns)/i);
    }
  });
});

describe('the tie to this house’s own record (DR-1439, DR-1440) is taught, and its limit is said', () => {
  it('every text teaches that reading counts, every try is study, and understanding means every answer right', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band}: reading counts`).toMatch(/Reading counts|Reading is counted/);
      expect(s, `${band}: every try is study`).toMatch(/studied three times|counts as study|recorded as study|counted as study/);
      expect(s, `${band}: every answer right`).toMatch(/every answer (right|correct)|all six/);
      expect(s, `${band}: the crown`).toMatch(/crown/);
    }
  });

  it('the adult lesson quotes all three crown verses, verbatim, with their references', () => {
    expect(M.lesson).toMatch(/"The simple inherit folly: but the prudent are crowned with knowledge\." \(Proverbs 14:18\)/);
    expect(M.lesson).toMatch(/a crown of glory shall she deliver to thee\." \(Proverbs 4:8-9\)/);
    expect(M.lesson).toMatch(/but we an incorruptible\." \(1 Corinthians 9:25\)/);
  });

  it('every text admits the record cannot see a machine beside the learner', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/cannot (see|tell|perceive)/);
    }
  });

  it('PROVEN TO CATCH: a band with the limit stripped fails the check by name', () => {
    const stripped = String(M.levels.teen).replace(/cannot (see|tell|perceive)/g, 'sees');
    expect(/cannot (see|tell|perceive)/.test(stripped)).toBe(false);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    for (const s of allStrings(M)) {
      expect(s, s.slice(0, 60)).not.toMatch(/\bSatan\b|\bLucifer\b|\bThe Devil\b/);
    }
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    expect(M.lesson).toMatch(/Yahweh/);
    for (const [band, t] of Object.entries(TEXTS())) {
      const quoted = [...String(t).matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
      expect(quoted, `${band}: a quotation must never have Yahweh substituted into it`).not.toMatch(/Yahweh/);
    }
  });

  it('no decision-record number is recited to the reader', () => {
    for (const [band, t] of Object.entries(TEXTS())) expect(String(t), band).not.toMatch(/DR-\d{4}/);
  });
});

describe('the parables are invented people', () => {
  it('two stories, and neither names a member', () => {
    expect(M.stories).toHaveLength(2);
    for (const s of M.stories) {
      expect(s.kind).toBe('parable');
      expect(s.body.length).toBeGreaterThan(400);
      expect(s.body).not.toMatch(/Darrell/);
    }
  });
});
