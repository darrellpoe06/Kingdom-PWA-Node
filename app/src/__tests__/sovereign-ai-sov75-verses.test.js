// =============================================================================
// sovereign-ai-sov75-verses — the gate for sov75, "Safely - a tool and not a
// friend, the answer you check, the child you guard, and the thinking that
// stays your own"
// =============================================================================
// WHERE IT CAME FROM. On 2026-11-12, straight after the video that became sov74,
// Darrell sent a second, https://youtu.be/dXxZwwCoO04 -- Sinead Bovell with
// Natalie Monbiot at SXSW EDU 2025 on A.I. and the future of education -- with a
// timestamped summary. His very next message was one word: Safely. That word is
// the spine. THE BUILD DID NOT WATCH THE VIDEO (this session cannot reach
// YouTube); a web search confirmed the session on the festival's own pages, and
// every claim about her argument is credited to her, from the summary.
//
// WHAT IS GATED. Safe use in five practices, each from the Word first, and each
// REQUIRED IN EVERY BAND so a reader of one band is never short a practice:
// a tool and not a friend; validate every answer; guard the child's data;
// guard against addiction and atrophy (not brought under the power of any);
// keep the thinking our own. The quiz is held to test each of the five.
// The tie to sov74 and to the learner record (DR-1439, DR-1440) is required too.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov75-safely-a-tool-and-not-a-friend';
const VIDEO = 'dXxZwwCoO04';
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
  'Exodus',
  'Psalms',
  'Proverbs',
  'Matthew',
  'John',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  '1 Thessalonians',
  '2 Timothy',
  'Hebrews',
  '2 Peter',
].flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov75 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it is the week after sov74, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov74-/);
  });

  it('the adult lesson runs in eight numbered movements, in order', () => {
    const order = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].map((n) => M.lesson.indexOf(`MOVEMENT ${n}:`));
    expect(
      order.every((p) => p > 0),
      `movements found at ${order.join(',')}`
    ).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('every lesson has a test: the quiz is present and every answer points at a real option', () => {
    const qs = M.quiz.questions;
    expect(qs.length).toBeGreaterThanOrEqual(7);
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
      expect(String(t), `${band} must say the video was not watched`).toMatch(/did not watch|could not watch|was not watched|not watched/i);
    }
  });

  it('Bovell’s points are credited to her, with the summary’s timestamps, in the adult lesson', () => {
    for (const mark of ['03:11-04:28', '05:01-05:36', '17:33-18:04', '12:49-13:13', '22:51-23:58', '39:46-43:30']) {
      expect(M.lesson, mark).toContain(mark);
    }
    for (const [band, t] of Object.entries(TEXTS())) expect(String(t), band).toMatch(/Bovell/);
  });

  it('the adult lesson carries WHAT WE DID NOT CHECK, naming the video, her words, and the atrophy and addiction research', () => {
    const i = M.lesson.indexOf('WHAT WE DID NOT CHECK.');
    expect(i).toBeGreaterThan(0);
    const section = M.lesson.slice(i, M.lesson.indexOf('TALK TOGETHER.'));
    expect(section).toMatch(/video itself was not watched/);
    expect(section).toMatch(/timestamp/);
    expect(section).toMatch(/atrophy/);
    expect(section).toMatch(/addictive|addiction/);
    expect(section).toMatch(/given here as her claims/);
  });

  it('the one word, Safely, is named as the spine', () => {
    expect(M.bigIdea).toMatch(/one word: Safely/);
    for (const [band, t] of Object.entries(TEXTS())) expect(String(t), band).toMatch(/Safely|safely/);
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

describe('safe use: the five practices are in EVERY band, each with its Word', () => {
  const PRACTICES = {
    'a tool, not a friend': /tool,? (and )?not a friend|not a friend/i,
    'validate every answer': /check every answer|validate every answer|validating the answers|Check the answer|check what it tells you/i,
    'guard the child': /Matthew 18:10/,
    'addiction and atrophy': /I will not be brought under the power of any/,
    'the thinking our own':
      /thinking (stays |one's |your |our )?own|your own thinking|Think for yourself|thinking first|do the weighing yourself|weighing remains ours/i,
  };

  it('every text carries all five', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      for (const [name, re] of Object.entries(PRACTICES)) expect(String(t), `${band} must carry: ${name}`).toMatch(re);
    }
  });

  it('every text grounds safety in wisdom kept (Proverbs 3:21-23)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/Then shalt thou walk in thy way safely, and thy foot shall not stumble\." \(Proverbs 3:(21-)?23\)/);
    }
  });

  it('PROVEN TO CATCH: a band with one practice stripped fails by name', () => {
    const stripped = String(M.levels.child).replace(/I will not be brought under the power of any/g, 'I will use it');
    expect(PRACTICES['addiction and atrophy'].test(stripped)).toBe(false);
  });

  it('the quiz tests each of the five practices', () => {
    const q = M.quiz.questions.map((x) => `${x.q} ${x.options.join(' ')} ${x.explain}`).join('\n');
    expect(q).toMatch(/not a friend/);
    expect(q).toMatch(/Validate it|validate/i);
    expect(q).toMatch(/child/);
    expect(q).toMatch(/brought under the power of any/);
    expect(q).toMatch(/thinking your own/);
    expect(q).toMatch(/Proverbs 3:21-23/);
  });
});

describe('the tie to sov74 and to this house’s own record (DR-1439, DR-1440) is taught, and its limit is said', () => {
  it('the adult lesson names last week’s word, Proverbs 4:7', () => {
    expect(M.lesson).toMatch(/with all thy getting get understanding/);
  });

  it('every text teaches that every try is study and that the crown goes to the temperate (1 Corinthians 9:25)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band}: every try is study`).toMatch(/counts it as study|counts as study|counted as study|recorded as study/);
      expect(s, `${band}: the crown`).toMatch(/crown/);
    }
    for (const band of ['adult', 'youth', 'teen', 'senior']) {
      expect(String(TEXTS()[band]), band).toMatch(/striveth for the mastery is temperate in all things/);
    }
  });

  it('every text admits the record cannot see a machine beside the learner', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/cannot (see|tell|perceive)/);
    }
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
