// =============================================================================
// sovereign-ai-sov77-verses — the gate for sov77, "Prove all things"
// =============================================================================
// WHERE IT CAME FROM. On 2026-10-27 at 19:34 UTC Darrell forwarded The Neuron's
// daily issue, subject line "OpenAI's Terra can enter your invoices," out of his
// university mailbox, with ONE WORD typed above the forwarded header: Lesson.
// Gmail thread `1a17edb181a9c1f6`. His word is the ask; the newsletter is only
// the occasion, and SIXTEEN DAYS stood between the two.
//
// WORD FIRST, NOT ARTICLE FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on
// 1 Thessalonians 5:21 -- Prove all things; hold fast that which is good -- a
// command rather than a mood, which does not stop at suspicion where most people
// stop but ends in commitment. The Bereans are called noble for readiness AND
// daily searching, and the risen Lord Jesus puts the trying of false apostles
// inside a commendation. The newsletter's own closing question was how do you
// check the work; Scripture asked it first and named whose proving is final.
// That is gated below in every reader place, and no figure from the article is
// permitted above the frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. NO primary host was read by this build: openai.com, arxiv.org and
// sec.gov were not reachable at this session's egress boundary, so no figure on
// the page rests on a primary-source read, and that is said in EVERY band
// (DR-0076 §8) with a dated re-review. An independent search road was walked on
// each load-bearing number, and the checking CHANGED four things, each gated
// here: (1) the 80.75 billion dollar loss is almost all a NON-CASH revaluation,
// about 72.39 billion of it in changed fair value of convertible notes and
// similar instruments, with the operating loss near 693 million; (2) the digest
// UNDER-stated the revenue rise, which against the filing's own half-year
// comparison is about fourteen-fold rather than about 1,200 percent; (3) what
// the proof-checker verified is NARROWER than the headline, the published scope
// note not covering the sharper running-time estimate; (4) a parallel result
// from a second laboratory the same day had been dropped. Two things checked out
// and are stated plainly rather than under-claimed (DR-0100 §1): the roughly
// 27 percent of staff figure, which arithmetic puts at 26.9 percent, and the
// one-dollar and five-dollar token prices at half the larger model's rate.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456),
// by scripts/sov77-fill.mjs, and swept against that corpus below.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov77-prove-all-things';
const THREAD = '1a17edb181a9c1f6';
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
 *  so a CONTIGUOUS span is a substring while a reordered one is not. */
const CHAPTERS = [
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  '1 Kings',
  'Psalms',
  'Proverbs',
  'Isaiah',
  'Jeremiah',
  'Haggai',
  'Malachi',
  'Matthew',
  'John',
  'Acts',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  '1 Thessalonians',
  'Hebrews',
  'James',
  '1 John',
  'Revelation',
  'Job',
].flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov77 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it is the week after sov76, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov76-/);
  });

  it('the adult lesson runs in eight numbered movements, in order', () => {
    const order = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].map((n) => M.lesson.indexOf(`MOVEMENT ${n}:`));
    expect(order.every((p) => p > 0), `movements found at ${order.join(',')}`).toBe(true);
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

describe('the Word goes first, not the article (DR-0127 / DR-0282 / DR-1326)', () => {
  it('the adult lesson reaches Yahweh’s frame BEFORE it reports any engineering', () => {
    const word = M.lesson.indexOf('MOVEMENT ONE: PROVE ALL THINGS');
    const article = M.lesson.indexOf('MOVEMENT TWO:');
    expect(word).toBeGreaterThan(0);
    expect(article).toBeGreaterThan(word);
    // No figure from the article may appear before the Word does.
    const opening = M.lesson.slice(0, word);
    expect(opening).not.toMatch(/9\.4|17\.3|1\.8 times|72\.39|26\.9|16\.286|1,200 percent|27 percent/);
  });

  it('every reader place opens on the command and carries where the verse ENDS', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must quote the command verbatim`).toMatch(
        /"Prove all things; hold fast that which is good\." \(1 Thessalonians 5:21\)/
      );
      expect(s, `${band} must carry where it ends, not stop at suspicion`).toMatch(/hold fast that which is good/);
    }
  });

  it('every reader place teaches that a claim you never ran is a claim you never tasted', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/never (?:run|tried) .{0,40}never tasted|never tried a thing, you never tasted/i);
    }
  });

  it('the hour names the article as the occasion and the Word as the authority', () => {
    expect(M.bigIdea).toMatch(/the article is the occasion/i);
    expect(M.lesson).toMatch(/the article is not the foundation/);
  });
});

describe('the provenance is honest', () => {
  it('it names the Gmail thread it was built from, so the repo is a second witness (DR-0076 §8)', () => {
    expect(M.bigIdea).toContain(THREAD);
  });

  it('it says in every reader place that one word was typed above the forward', () => {
    expect(M.bigIdea).toMatch(/ONE WORD typed above the forwarded header: Lesson/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name his word`).toMatch(/\bLesson\b/);
    }
  });

  it('the sixteen days between his word and this build are on the record, not smoothed', () => {
    for (const place of [M.bigIdea, M.lesson, M.levels.child, M.levels.youth, M.levels.teen, M.levels.senior]) {
      expect(String(place)).toMatch(/[Ss]ixteen days|[Ss]ixteen days went by/);
    }
  });
});

describe('trust but verify: the note says what was checked, what tier, and what CHANGED (DR-0190 §5)', () => {
  const NOTE = () => {
    const i = M.lesson.indexOf('WHAT WE CHECKED AND WHAT WE DID NOT.');
    expect(i, 'the adult lesson must carry the trust-but-verify note').toBeGreaterThan(0);
    return M.lesson.slice(i, M.lesson.indexOf('MOVEMENT EIGHT:'));
  };

  it('the newsletter is named a lead and never the citation', () => {
    expect(NOTE()).toMatch(/newsletter is a lead and never the citation/);
  });

  it('every BLOCKED primary host is named, and the read is not claimed as independent (DR-0076 §8)', () => {
    const note = NOTE();
    for (const host of ['openai.com', 'arxiv.org', 'sec.gov']) expect(note, host).toContain(host);
    expect(note).toMatch(/NOT reachable from this build/);
    expect(note).toMatch(/no figure here rests on a primary-source read/);
    // Said in EVERY band, not only to the adult reader: a blocked road must never
    // read as a verified claim to whoever happens to open the child band.
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say the primary pages were not read`).toMatch(
        /were not reachable from this build|No primary host was read|not reachable at this session|were not read by this build/i
      );
    }
  });

  it('a dated re-review stands against the blocked roads in every band (DR-0075)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must carry a dated re-review or name one`).toMatch(/re-review: 2026-11-26|dated re-review|date on our page to go back/i);
    }
  });

  it('what the checking CHANGED is stated, not just that checking happened', () => {
    const note = NOTE();
    const body = M.lesson;
    // (1) the headline loss re-framed as a non-cash revaluation
    expect(body).toMatch(/non-cash revaluation/);
    expect(body).toMatch(/72\.39 billion/);
    expect(body).toMatch(/operating loss near 693 million/i);
    // (2) the UNDER-stated revenue rise corrected upward (DR-0100 §5)
    expect(body).toMatch(/16\.286 billion against 1\.163 billion/);
    expect(body).toMatch(/fourteen-fold/);
    // (3) the proof-checker's scope
    expect(body).toMatch(/does not cover the sharper running-time estimate/);
    // (4) the dropped parallel result
    expect(body).toMatch(/parallel result/);
    expect(note).toMatch(/what the checking changed is listed above/);
  });

  it('a claim that checked out is stated plainly rather than under-claimed (DR-0100 §1)', () => {
    expect(M.lesson).toMatch(/26\.9 percent/);
    expect(M.lesson).toMatch(/223,000 full-time employees/);
    expect(M.bigIdea).toMatch(/checked out STRONGER/);
  });

  it('what was NOT checked is listed, and the secondary-only claims are attributed rather than asserted', () => {
    const note = NOTE();
    expect(note).toMatch(/Not checked at all/);
    expect(note).toMatch(/Attributed and not asserted/);
    expect(note).toMatch(/secondary coverage/);
  });

  it('the unconfirmed headline is NOT taught as fact (DR-0100 tier 2, DR-1326)', () => {
    expect(M.lesson).toMatch(/does not teach the hypothesis as overturned/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must leave the claim open rather than settled`).toMatch(
        /not yet|will take months|had not given a verdict|returned no verdict|does not teach it as settled/i
      );
    }
  });
});

describe('every quoted span is verbatim the KJV on disk', () => {
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(/"([^"]+)"/g)].map((m) => [band, m[1]]));

  it('the sweep looks at a real number of spans, so it cannot pass by checking nothing', () => {
    expect(spans().length).toBeGreaterThan(190);
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
      expect([...String(t).matchAll(/"[^"]+" \([1-3]?\s?[A-Z][a-z]+ \d+:\d+(-\d+)?\)/g)].length, band).toBeGreaterThan(25);
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

  it('PROVEN TO CATCH: a reordered span of the same chapter is not contiguous', () => {
    const thirteen = bookOf('Numbers').chapters[12];
    const reordered = [thirteen[31], thirteen[26]].join(' ');
    expect(CHAPTERS.some((c) => c.includes(reordered))).toBe(false);
  });
});

describe('anchor.ref names every verse the lesson stands on, and nothing it does not (DR-0734)', () => {
  const normalise = (r) => r.trim().replace(/^Psalms /, 'Psalm ');
  const declared = () => new Set(M.anchor.ref.split(';').map(normalise));

  it('it is a real list, and its books are the books the lesson quotes', () => {
    expect(declared().size).toBeGreaterThan(40);
  });

  it('every book quoted in a reader place is represented in anchor.ref', () => {
    const quotedBooks = new Set(Object.values(TEXTS()).flatMap((t) => [...String(t).matchAll(/" \(([1-3]? ?[A-Z][a-z]+) \d+:\d+/g)].map((m) => m[1])));
    const declaredBooks = new Set([...declared()].map((r) => r.replace(/\s+\d+:.*$/, '')));
    expect([...quotedBooks].filter((b) => !declaredBooks.has(b))).toEqual([]);
  });

  it('no declared reference points at a verse the lesson never quotes', () => {
    const quoted = Object.values(TEXTS()).join('  ');
    const orphans = [...declared()].filter((ref) => {
      const [bookChapter] = ref.split(':');
      return !quoted.includes(`(${bookChapter}:`);
    });
    expect(orphans, 'Search it out derives its links from these refs; an orphan sends a reader to a verse the hour never taught').toEqual([]);
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
    expect(fk(t.teen)).toBeLessThan(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
    expect(fk(t.teen)).toBeLessThanOrEqual(6.0);
    expect(fk(t.senior)).toBeLessThanOrEqual(10.0);
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
});

describe('TALK ABOUT IT TOGETHER, in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  const PLACES = () => TEXTS();

  it('every place carries the heading, so the reader’s tail folds (DR-1372)', () => {
    for (const [band, t] of Object.entries(PLACES())) {
      expect(String(t), `${band} drops the heading`).toContain('TALK ABOUT IT TOGETHER');
    }
  });

  it('every place sends the reader to parents, to children and to a friend', () => {
    expect(placesMissingDirections(M)).toEqual([]);
  });

  it('every place carries the skill and the rhythm in the lesson’s own words', () => {
    for (const [band, t] of Object.entries(PLACES())) {
      const tail = String(t).slice(String(t).indexOf('TALK ABOUT IT TOGETHER'));
      expect(tail, `${band}: the skill -- ask`).toMatch(/ask|Ask/);
      expect(tail, `${band}: listen to the end`).toMatch(
        /listen all the way|all the way to the end|hear the whole|Hear the whole/i
      );
      expect(tail, `${band}: teach one verse`).toMatch(/teach (?:them |each other |one another )?(?:one verse|Deuteronomy)/i);
      expect(tail, `${band}: the rhythm -- once today in one of the four places`).toMatch(/once today|Do it once today/i);
      expect(tail, `${band}: one friend this week`).toMatch(/one friend this week/i);
    }
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line alone names that band while the pooled check stays green', () => {
    const FRIEND = 'Then ask a friend this: what is the one chore you would race two tools on, and how would you score it so the score means something?';
    expect(M.levels.teen).toContain(FRIEND);
    const bent = { ...M, levels: { ...M.levels, teen: M.levels.teen.replace(FRIEND, '') } };
    expect(placesMissingDirections(bent)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    // The whole reason DR-0795 exists: the pooled check cannot see this.
    expect(hasAllThree(bent)).toBe(true);
  });
});

describe('the teaching itself: eight movements, each from the Word', () => {
  const THREADS = {
    'prove all things': /Prove all things; hold fast that which is good/,
    'the Bereans searched daily': /searched the scriptures daily, whether those things were so/,
    'the ear trieth words': /Doth not the ear try words\?|For the ear trieth words/,
    'the neighbour cometh and searcheth him': /but his neighbour cometh and searcheth him/,
    'prove his own work': /let every man prove his own work/,
    'a just weight': /Just balances, just weights/,
    'if the thing follow not': /if the thing follow not, nor come to pass/,
    'the half was not told me': /the half was not told me/,
    'I the LORD search the heart': /I the LORD search the heart/,
  };

  it('every reader place carries all nine threads', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      for (const [name, re] of Object.entries(THREADS)) {
        expect(String(t), `${band} must carry: ${name}`).toMatch(re);
      }
    }
  });

  it('PROVEN TO CATCH: a band with one thread stripped fails by name', () => {
    const stripped = String(M.levels.child).replace(/Just balances, just weights/g, 'fair scales');
    expect(THREADS['a just weight'].test(stripped)).toBe(false);
  });

  it('the loss is said honestly rather than hidden: the cheapest tool was right one run in three', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name the loss`).toMatch(/one run (?:out )?(?:of|in) (?:the )?three|one time out of three/i);
      expect(String(t), `${band} must hold a just weight`).toMatch(/Just balances, just weights/);
    }
  });

  it('the bright lines are kept in every band: only Yahweh searches a heart, and the one Word proved is a Person', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band}: only Yahweh searches a heart`).toMatch(/I the LORD search the heart/);
      expect(s, `${band}: the one Word proved all the way down is a Person`).toMatch(/Lamb of Yahweh/);
      expect(s, `${band}: fruit is the test He gives us for people`).toMatch(/by their fruits/i);
    }
  });

  it('we teach the Word rather than debate it (DR-0098): the Word is the ruler, not the thing on the scale', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must keep the Word as the measure`).toMatch(
        /the ruler we measure other things by|the thing we check other things BY|the Word is the authority/i
      );
    }
  });

  it('the quiz tests the frame, the corrections and the bright lines', () => {
    const q = M.quiz.questions.map((x) => `${x.q} ${x.options.join(' ')} ${x.explain}`).join('\n');
    expect(q).toMatch(/hold fast that which is good/);
    expect(q).toMatch(/searched the scriptures daily/);
    expect(q).toMatch(/seemeth just/);
    expect(q).toMatch(/[Mm]easuring themselves by themselves/);
    expect(q).toMatch(/Just balances, just weights/);
    expect(q).toMatch(/half was not told me/);
    expect(q).toMatch(/search the heart/);
    expect(q).toMatch(/formalisation|formalization/);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    for (const s of allStrings(M)) {
      expect(s, s.slice(0, 60)).not.toMatch(/\bSatan\b|\bLucifer\b|\bThe Devil\b|\bBaal\b/);
    }
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    expect(M.lesson).toMatch(/Yahweh/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say Yahweh in our own voice`).toMatch(/Yahweh/);
      const quoted = [...String(t).matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
      expect(quoted, `${band}: a quotation must never have Yahweh substituted into it`).not.toMatch(/Yahweh/);
    }
  });

  it('no decision-record number is recited to the reader', () => {
    for (const [band, t] of Object.entries(TEXTS())) expect(String(t), band).not.toMatch(/DR-\d{4}/);
  });

  it('our own prose spells American, while the KJV’s own spellings inside a quote are untouched', () => {
    // The known gate gap: american-spelling.test.js reads only
    // living-lessons-class.js, so a course file's British spelling passes green.
    // This checks OUR prose with the quotations removed, and leaves honour,
    // neighbour, favour and laboured alone wherever the corpus wrote them.
    const BRITISH = /\b(memorise|summaris|capitalis|realis|generalis|formalis|organis|recognis|colour|favour|honour|labour|neighbour|behaviour|centre|metre|defence|offence|licence|programme|whilst|amongst|judgement|manoeuvre|per cent)\b/i;
    for (const [band, t] of Object.entries(TEXTS())) {
      const ours = String(t).replace(/"[^"]*"/g, ' ');
      const hit = ours.match(BRITISH);
      expect(hit && hit[0], `${band}: British spelling in our own voice`).toBeFalsy();
    }
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
