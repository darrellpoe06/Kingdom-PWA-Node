// =============================================================================
// sovereign-ai-sov76-verses — the gate for sov76, "The model in your hand"
// =============================================================================
// WHERE IT CAME FROM. On 2026-10-27 at 15:53 UTC Darrell forwarded ByteByteGo's
// account of how Apple fits a three-billion-parameter language model onto an
// iPhone, out of his university mailbox, with ONE WORD typed above the forwarded
// header: Lesson. Gmail thread `1a17e0a2846ca5b7`. His word is the ask; the
// article is only the occasion, and sixteen days stood between the two.
//
// WORD FIRST, NOT ARTICLE FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on
// Deuteronomy 30:11-14, where Yahweh rules out two distances BY NAME -- not in
// heaven, so none need ascend and bring it down; not beyond the sea, so none need
// cross and return with it -- and gives the reason that governs everything after
// it: that thou mayest do it. A word you must send for is a word you cannot obey
// at the hour obedience is asked. That is gated below in every reader place,
// because a lesson that opened on the engineering would have borrowed its frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. Apple's own research pages were NOT read by this build:
// machinelearning.apple.com and its mirror both refused at this session's network
// boundary, as did arxiv.org and every publisher host tried. An independent search
// road was walked on each load-bearing number instead, and the checking CHANGED
// three things, each gated here: the 37.5 per cent is the SHARE OF LAYERS reusing
// the earlier block's keys and values (what a 5:3 split of depth makes three
// eighths of) rather than a separately measured memory saving; the 1.39 and six
// gigabyte figures are arithmetic and were re-derived; and two things the digest
// dropped were added back -- Apple's own 3.5-bits-per-weight statement and the
// eight-bit holding of the working notes. The Google Cloud and NVIDIA line checked
// out STRONGER than the one sentence it got, so it is stated plainly (DR-0100 §1,
// no under-claiming), and the blocked host is named in every band (DR-0076 §8).
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov76-the-model-in-your-hand';
const THREAD = '1a17e0a2846ca5b7';
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
  'Leviticus',
  'Deuteronomy',
  'Joshua',
  '1 Samuel',
  '2 Kings',
  'Psalms',
  'Proverbs',
  'Zechariah',
  'Jeremiah',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  '1 Corinthians',
  '2 Corinthians',
  'Ephesians',
  'Colossians',
  '2 Timothy',
  '2 Peter',
].flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov76 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it is the week after sov75, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov75-/);
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

describe('the Word goes first, not the article (DR-0127 / DR-0282 / DR-1326)', () => {
  it('the adult lesson reaches Yahweh’s frame BEFORE it reports any engineering', () => {
    const word = M.lesson.indexOf('MOVEMENT ONE: NOT FAR OFF');
    const article = M.lesson.indexOf('MOVEMENT TWO:');
    expect(word).toBeGreaterThan(0);
    expect(article).toBeGreaterThan(word);
    // And no figure from the article appears before the Word does.
    const opening = M.lesson.slice(0, word);
    expect(opening).not.toMatch(/\bbits?\b|gigabyte|parameter|3\.7|37\.5/);
  });

  it('every reader place opens on nearness and carries the reason He gives', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must quote the nearness of the word`).toMatch(
        /"[^"]*the word is very nigh unto thee, in thy mouth, and in thy heart, that thou mayest do it\.?" \(Deuteronomy 30:(11-)?14\)/
      );
      expect(s, `${band} must say WHY it is near`).toMatch(/that thou mayest do it/);
    }
  });

  it('every reader place teaches that a word you must send for cannot be obeyed in time', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/send for|go get them|look up|had to look up/i);
    }
  });

  it('the hour names the article as the occasion and the Word as the authority', () => {
    expect(M.bigIdea).toMatch(/the article is the occasion/i);
    expect(M.lesson).toMatch(/the article is not the foundation|The Word is/);
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
    for (const place of [M.bigIdea, M.lesson, M.levels.teen, M.levels.senior]) {
      expect(String(place)).toMatch(/[Ss]ixteen days/);
    }
  });
});

describe('trust but verify: the note says what was checked, what tier, and what CHANGED (DR-0190 §5)', () => {
  const NOTE = () => {
    const i = M.lesson.indexOf('WHAT WE CHECKED AND WHAT WE DID NOT.');
    expect(i, 'the adult lesson must carry the trust-but-verify note').toBeGreaterThan(0);
    return M.lesson.slice(i, M.lesson.indexOf('TALK ABOUT IT TOGETHER'));
  };

  it('the newsletter is named a lead and never the citation', () => {
    expect(NOTE()).toMatch(/newsletter is a lead and never the citation/);
  });

  it('the BLOCKED primary host is named, and the read is not claimed as independent (DR-0076 §8)', () => {
    const note = NOTE();
    expect(note).toContain('machinelearning.apple.com');
    expect(note).toMatch(/NOT read by this session|refused at the session/);
    expect(note).toMatch(/no figure here rests on a primary-source read/);
    // Said in EVERY band, not only to the adult reader: a blocked road must never
    // read as a verified claim to whoever happens to open the child band.
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say the primary pages were not read`).toMatch(
        /could not read the company papers|were not read by this build|were not read by this session|were not reachable from this build/i
      );
    }
  });

  it('what the checking CHANGED is stated, not just that checking happened', () => {
    const note = NOTE();
    // (1) the 37.5 per cent re-framed as a share of layers, not a measured saving
    expect(note).toMatch(/37\.5 per cent is the share of layers/);
    // (2) the gigabyte figures re-derived as arithmetic
    expect(note).toMatch(/arithmetic, re-derived here rather than repeated/);
    // (3) two things the digest dropped, added back
    expect(note).toMatch(/3\.5 bits per weight costs no significant quality/);
    expect(note).toMatch(/eight-bit holding of the working notes/);
  });

  it('the correction is taught in the body too, with the 5:3 depth split that makes it three eighths', () => {
    expect(M.lesson).toMatch(/SHARE OF THE LAYERS in the second block/);
    expect(M.lesson).toMatch(/five-to-three split of depth makes three eighths/);
  });

  it('a claim that checked out STRONGER than the digest is stated plainly (DR-0100, no under-claiming)', () => {
    expect(M.lesson).toMatch(/Google Cloud machines with NVIDIA processors/);
    expect(M.lesson).toMatch(/append-only ledger/);
    expect(M.bigIdea).toMatch(/checked out STRONGER/);
  });

  it('what was NOT checked is listed, and the secondary-only names are attributed rather than asserted', () => {
    const note = NOTE();
    expect(note).toMatch(/Not checked at all/);
    expect(note).toMatch(/Attributed and not asserted/);
    expect(note).toMatch(/palettization/);
    expect(note).toMatch(/secondary coverage/);
  });

  it('the publication’s own disclaimer is passed on rather than hidden', () => {
    expect(NOTE()).toMatch(/assembled from publicly shared details and invites correction/);
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
    const four = bookOf('Deuteronomy').chapters[29];
    const reordered = [four[13], four[12]].join(' ');
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
    expect(fk(t.teen)).toBeLessThanOrEqual(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
    expect(fk(t.teen)).toBeLessThanOrEqual(6.0);
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
      expect(tail, `${band}: the skill -- ask, listen to the end, retell or teach one verse`).toMatch(/ask|Ask/);
      expect(tail, `${band}: listen to the end`).toMatch(
        /listen all the way|all the way to the end|hear it to the end|hear the whole|Listen to the whole|hear the whole of it/i
      );
      expect(tail, `${band}: teach one verse`).toMatch(/teach (?:them |each other |one another )?(?:one verse|Deuteronomy)/i);
      expect(tail, `${band}: the rhythm -- once today in one of the four places, one friend this week`).toMatch(/once today|Do it once today/i);
      expect(tail, `${band}: one friend this week`).toMatch(/one friend this week/i);
    }
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line alone names that band while the pooled check stays green', () => {
    const FRIEND = 'Then ask a friend this: which of your answers are borrowed, and which are in your own house? Teach each other one verse.';
    expect(M.levels.teen).toContain(FRIEND);
    const bent = { ...M, levels: { ...M.levels, teen: M.levels.teen.replace(FRIEND, '') } };
    expect(placesMissingDirections(bent)).toEqual([{ place: 'teen', missing: ['friends'] }]);
    // The whole reason DR-0795 exists: the pooled check cannot see this.
    expect(hasAllThree(bent)).toBe(true);
  });
});

describe('the teaching itself: eight movements, each from the Word', () => {
  const MOVEMENTS = {
    'not far off': /Deuteronomy 30:(11-)?14/,
    'little but exceeding wise': /There be four things which are little upon the earth, but they are exceeding wise/,
    'what hast thou in the house': /what hast thou in the house/,
    'the bread you do not borrow': /I have nothing to set before him/,
    'one foundation, many gifts': /other foundation can no man lay than that is laid, which is Jesus Christ/,
    'every small matter they shall judge': /every small matter they shall judge/,
    'remembrance is an ordinance': /Joshua 4:(6-)?7|What mean ye by these stones/,
  };

  it('every reader place carries all seven threads', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      for (const [name, re] of Object.entries(MOVEMENTS)) {
        expect(String(t), `${band} must carry: ${name}`).toMatch(re);
      }
    }
  });

  it('PROVEN TO CATCH: a band with one thread stripped fails by name', () => {
    const stripped = String(M.levels.child).replace(/what hast thou in the house/g, 'what do you own');
    expect(MOVEMENTS['what hast thou in the house'].test(stripped)).toBe(false);
  });

  it('the loss is said honestly rather than hidden: compression costs detail, on a just weight', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name the loss`).toMatch(/lose some|does lose detail|loses detail|lose a little/i);
      expect(String(t), `${band} must hold a just weight`).toMatch(/Just balances, just weights/);
    }
  });

  it('the two bright lines are kept in every band: the Foundation is not a base model, and no machine searches a heart', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band}: the Foundation is a Person, not a swappable base`).toMatch(/Lamb of Yahweh/);
      expect(s, `${band}: only Yahweh searches a heart`).toMatch(/I the LORD search the heart/);
      expect(s, `${band}: the Comforter is a Person, not a buffer`).toMatch(/bring all things to your remembrance/);
    }
  });

  it('the quiz tests the frame, the corrections and the bright lines', () => {
    const q = M.quiz.questions.map((x) => `${x.q} ${x.options.join(' ')} ${x.explain}`).join('\n');
    expect(q).toMatch(/that thou mayest do it/);
    expect(q).toMatch(/exceeding wise/);
    expect(q).toMatch(/what hast thou in the house/i);
    expect(q).toMatch(/nothing to set before him/);
    expect(q).toMatch(/every small matter/i);
    expect(q).toMatch(/37\.5 per cent/);
    expect(q).toMatch(/Lamb of Yahweh/);
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
      expect(String(t), `${band} must say Yahweh in our own voice`).toMatch(/Yahweh/);
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
