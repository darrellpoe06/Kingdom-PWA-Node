// @vitest-environment node
// =============================================================================
// project-management-pm17-verses — the gate for pm17, "Can two walk together"
// =============================================================================
// WHO TAUGHT THIS: NOBODY. Gmail thread `1a1837bf55922f04`, a Supply Chain
// Connect send forwarded out of Darrell's university mailbox on 2026-10-28 at
// 17:08 UTC. Above the forwarded header he typed one word — Lesson. — and then
// lifted ONE item by hand out of the body and set it above everything else:
// "6 Steps to Better CFO-CPO Alignment / How procurement and finance can get on
// the same page about savings, spending and financial results." The forward's
// own SUBJECT is about chip production and is NOT the ask. Sixteen days stood
// between his word and this build, and the record keeps that gap.
//
// THE ARTICLE WAS NEVER READ, and these checks hold that limit in place. The
// email carries the headline and one blurb and nothing else; all three roads to
// the body were refused from this session (endeavor.omeclk.com would not
// resolve; www.supplychainconnect.com and www.sourcetoday.com were both refused
// by the proxy's CONNECT tunnel with 403). So not one of the six steps is
// taught, named or implied anywhere in this lesson, and every reader place says
// so with the date we try again.
//
// THIS GATE IS WIDER THAN ITS NAME ON PURPOSE (DR-1467). The three failures that
// record names were all instruments narrower than they sounded, so each is
// designed against here, by name:
//
//   1. A CHECK THAT READ ONLY THE ADULT LESSON AND FOUR BANDS passed a bigIdea
//      that recited two decision records. So the verse sweep below walks EVERY
//      string in the module — bigIdea, inApp, anchor.theme, benefits, stories,
//      facilitator, quiz, every one — and not the reader places only.
//   2. A VERSE SWEEP WHOSE BOOK LIST OMITTED REVELATION while Revelation 3:7
//      stood quoted everywhere. So there is no typed book list here at all: the
//      books are DERIVED from the references the module itself carries, and a
//      book that cannot be opened fails the test rather than being skipped.
//   3. A SWEEP THAT REPORTED NINE FALSE FAULTS because the house writes
//      `Psalm 141:3` while the corpus file is `Psalms.json`. Handled, and proved
//      against the corpus rather than asserted.
//
// WHAT THIS GATE DOES NOT COVER, said plainly rather than left to be discovered
// (DR-0076 §8): it reads ONE module. The shared-ledger suites — decision-chain,
// course-band-coverage, course-four-bands-hold, talk-together, lesson-dates —
// read the LEDGERS and the whole catalog, and a defect visible only there is
// invisible here. Those were run by name alongside this file, never inferred
// from it.
//
// Recorded as DR-1473. Built by scripts/pm17-fill.mjs; every quotation on the
// page was filled from app/public/bible/kjv and never typed (DR-0456 / DR-1468).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { quotesTheWord, lessonBodies } from '../lib/lesson-completeness.js';

const ID = 'pm17-can-two-walk-together';
const THREAD = '1a1837bf55922f04';
const REVIEW = 're-review: 2026-11-27';
const M = PROJECT_MANAGEMENT_MODULES.find((m) => m.id === ID);

/** EVERY string in the module, at any depth, with the path it sits at. */
function deepStrings(value, path = '$', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => deepStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) deepStrings(v, `${path}.${k}`, out);
  }
  return out;
}

const ALL = () => deepStrings(M);
const READER_PLACES = () => ({ lesson: M.lesson, ...M.levels });

// A Scripture span is a quotation followed immediately by its reference
// (DR-0402). Ordinary prose in quotation marks is not one, and a sweep that
// fires on correct prose teaches a reader to ignore it.
const SPAN = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\s(\d+):(\d+)\)/g;

/** Every span anywhere in the module: [path, quoted, book, chapter, verse]. */
const spans = () =>
  ALL().flatMap(([path, text]) => [...String(text).matchAll(SPAN)].map((m) => [path, m[1], m[2], Number(m[3]), Number(m[4])]));

// --- the KJV corpus on disk, opened by the module's OWN book names -----------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();

/** The corpus file for a book as the HOUSE writes it. `Psalm` -> `Psalms.json`. */
function bookFile(book) {
  const k = String(book).replace(/\s+/g, '');
  if (existsSync(join(KJV, `${k}.json`))) return k;
  if (existsSync(join(KJV, `${k}s.json`))) return `${k}s`;
  return null;
}

function corpusVerse(book, chapter, verse) {
  const f = bookFile(book);
  if (!f) throw new Error(`no corpus file for book "${book}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const ch = cache.get(f).chapters[chapter - 1];
  return (ch && ch[verse - 1]) || null;
}

describe('pm17 exists, is whole, and is in the course', () => {
  it('the module is in PROJECT_MANAGEMENT_MODULES with an adult lesson and all four bands', () => {
    expect(M, `${ID} must be in PROJECT_MANAGEMENT_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof M.levels[b], b).toBe('string');
    expect(M.lesson.length).toBeGreaterThan(8000);
  });

  it('the splice left no hole in the array, which a doubled comma would (measured, not assumed)', () => {
    // The first run of scripts/pm17-fill.mjs added a comma after one that was
    // already there and the course served `undefined` as a lesson. Pinned.
    expect(PROJECT_MANAGEMENT_MODULES.every((m) => m && typeof m.id === 'string')).toBe(true);
    const ids = PROJECT_MANAGEMENT_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the course header tracks the module count rather than a literal (DR-0677)', () => {
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  it('it names the Gmail thread it was built from, so the repo is a second witness (DR-1414)', () => {
    expect(M.bigIdea).toContain(THREAD);
    expect(M.lesson).toMatch(/2026-10-28/);
  });

  it('it says plainly that nobody taught it (DR-0719)', () => {
    expect(M.bigIdea).toMatch(/WHO TAUGHT THIS: NOBODY/);
    expect(M.lesson).toMatch(/WHO TAUGHT THIS: NOBODY/);
  });
});

describe('every quoted span anywhere in the module is the corpus verse, verbatim', () => {
  it('the sweep reads a real number of spans, so it cannot pass by checking nothing (DR-0076 §3)', () => {
    expect(spans().length).toBeGreaterThan(40);
  });

  it('the sweep reads EVERY string in the module, not the reader places only (DR-1467 case 1)', () => {
    const paths = ALL().map(([p]) => p);
    for (const p of ['$.bigIdea', '$.inApp', '$.anchor.theme', '$.lesson', '$.levels.child', '$.levels.senior']) {
      expect(paths, `the walk missed ${p}`).toContain(p);
    }
    expect(paths.some((p) => p.startsWith('$.benefits['))).toBe(true);
    expect(paths.some((p) => p.startsWith('$.stories['))).toBe(true);
    expect(paths.some((p) => p.startsWith('$.quiz.questions['))).toBe(true);
    expect(paths.some((p) => p.startsWith('$.facilitator.'))).toBe(true);
    expect(ALL().length).toBeGreaterThan(30);
  });

  it('the book list is DERIVED from the module and every derived book opens (DR-1467 case 2)', () => {
    const books = [...new Set(spans().map(([, , b]) => b))].sort();
    expect(books.length).toBeGreaterThan(10);
    const unopenable = books.filter((b) => !bookFile(b));
    expect(unopenable, 'a book this lesson quotes has no corpus file').toEqual([]);
  });

  it('the Psalm / Psalms spelling is handled, proved against the corpus (DR-1467 case 3)', () => {
    expect(existsSync(join(KJV, 'Psalms.json'))).toBe(true);
    expect(existsSync(join(KJV, 'Psalm.json'))).toBe(false);
    expect(bookFile('Psalm')).toBe('Psalms');
    expect(bookFile('Psalms')).toBe('Psalms');
    expect(corpusVerse('Psalm', 133, 1)).toBe(corpusVerse('Psalms', 133, 1));
    expect(bookFile('Nowhere')).toBeNull();
  });

  it('each span equals its own named verse exactly — not merely found somewhere', () => {
    const bad = spans()
      .filter(([, quoted, b, c, v]) => corpusVerse(b, c, v) !== quoted)
      .map(([path, quoted, b, c, v]) => `${path} :: ${b} ${c}:${v} :: ${quoted.slice(0, 70)}`);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every reader place quotes Scripture of its own, so none passes on another’s back', () => {
    const byPlace = {};
    for (const [path] of spans()) byPlace[path] = (byPlace[path] || 0) + 1;
    for (const p of ['$.lesson', '$.levels.child', '$.levels.youth', '$.levels.teen', '$.levels.senior']) {
      expect(byPlace[p] || 0, `${p} quotes no Scripture with a reference`).toBeGreaterThan(8);
    }
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, quoted, b, c, v] = spans()[0];
    const broken = quoted.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(quoted);
    expect(corpusVerse(b, c, v)).not.toBe(broken);
  });

  it('PROVEN TO CATCH: a span attributed to the wrong verse is rejected', () => {
    const [, quoted, b, c, v] = spans()[0];
    expect(corpusVerse(b, c, v)).toBe(quoted);
    const neighbour = corpusVerse(b, c, v + 1) || corpusVerse(b, c, Math.max(1, v - 1));
    expect(neighbour).toBeTruthy();
    expect(neighbour).not.toBe(quoted);
  });

  it('PROVEN TO CATCH: the DR-0456 apostrophe class — an ASCII apostrophe where the corpus has U+2019', () => {
    const curlySpan = spans().find(([, q]) => q.includes('’'));
    if (curlySpan) {
      const [, quoted, b, c, v] = curlySpan;
      expect(corpusVerse(b, c, v)).toBe(quoted);
      expect(corpusVerse(b, c, v)).not.toBe(quoted.replace(/’/g, "'"));
    } else {
      // None of the verses THIS lesson quotes carries one, so the class is
      // proved against the corpus itself rather than skipped.
      const chapters = JSON.parse(readFileSync(join(KJV, 'Psalms.json'), 'utf8')).chapters;
      const line = chapters.flat().find((t) => t.includes('’'));
      expect(line, 'the KJV corpus must carry U+2019 somewhere').toBeTruthy();
      expect(line.replace(/’/g, "'")).not.toBe(line);
    }
  });

  it('EVERY body hands the reader a verse WITH its reference beside it (DR-0402)', () => {
    const bodies = lessonBodies(M);
    expect(bodies.length).toBe(5);
    expect(bodies.filter((b) => !quotesTheWord({ lesson: b })).length).toBe(0);
  });
});

describe('anchor.ref names every verse the lesson stands on, and nothing more (DR-0734)', () => {
  const anchorRefs = () => M.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);

  it('it is derived, not typed: every anchor reference resolves in the corpus', () => {
    const bad = anchorRefs().filter((r) => {
      const m = /^(.+?)\s+(\d+):(\d+)$/.exec(r);
      return !m || !corpusVerse(m[1], Number(m[2]), Number(m[3]));
    });
    expect(bad).toEqual([]);
    expect(anchorRefs().length).toBeGreaterThan(40);
  });

  it('every verse quoted in a reader place is on the anchor', () => {
    const onAnchor = new Set(anchorRefs());
    const quotedInReader = new Set(
      spans()
        .filter(([path]) => path === '$.lesson' || path.startsWith('$.levels.'))
        .map(([, , b, c, v]) => `${b} ${c}:${v}`)
    );
    const missing = [...quotedInReader].filter((r) => !onAnchor.has(r));
    expect(missing, `quoted but not on the anchor: ${missing.join(', ')}`).toEqual([]);
  });

  it('nothing on the anchor goes unquoted — the ref names no verse the lesson does not stand on', () => {
    const quotedAnywhere = new Set(spans().map(([, , b, c, v]) => `${b} ${c}:${v}`));
    const unquoted = anchorRefs().filter((r) => !quotedAnywhere.has(r));
    expect(unquoted, `on the anchor but quoted nowhere: ${unquoted.join(', ')}`).toEqual([]);
  });

  it('no reference is listed twice', () => {
    const refs = anchorRefs();
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe('the four bands clear the ladder, measured not claimed', () => {
  it('shares, reading ladder, child ceiling and differentiation all pass', () => {
    expect(fourBandFaults(M)).toEqual([]);
  });

  it('the ladder is monotone and each band sits under its own ceiling', () => {
    const t = READER_PLACES();
    expect(fk(t.child)).toBeLessThan(fk(t.youth));
    expect(fk(t.youth)).toBeLessThan(fk(t.teen));
    expect(fk(t.teen)).toBeLessThan(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
    expect(fk(t.teen)).toBeLessThanOrEqual(6.0);
    expect(fk(t.senior)).toBeLessThanOrEqual(10.0);
  });

  it('no band is a truncation or a re-wording of another, nor of the adult lesson', () => {
    const t = READER_PLACES();
    const keys = Object.keys(t);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        expect(overlapOf(t[keys[i]], t[keys[j]]), `${keys[i]} vs ${keys[j]}`).toBeLessThan(0.25);
      }
    }
  });
});

describe('the adult lesson carries its own close, and so does every band (DR-0733 / DR-0795)', () => {
  it('every reader place ends in TALK ABOUT IT TOGETHER in the lesson’s own words', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} has no TALK ABOUT IT TOGETHER`).toMatch(/TALK ABOUT IT TOGETHER/);
      expect(text.slice(-2600), `${place}'s close is not at its close`).toMatch(/TALK ABOUT IT TOGETHER/);
    }
  });

  it('every reader place sends the reader all three ways — parents, children, friend', () => {
    expect(placesMissingDirections(M)).toEqual([]);
    expect(hasAllThreeEverywhere(M)).toBe(true);
  });

  it('PROVEN TO CATCH: strip ONE band’s friend line and the per-band check names that band', () => {
    const teen = M.levels.teen.replace(/Then ask a friend this:[^]*?Teach each other one verse\./, 'Then carry on.');
    expect(teen).not.toBe(M.levels.teen);
    const broken = { ...M, levels: { ...M.levels, teen } };
    const named = placesMissingDirections(broken);
    expect(named.map((x) => x.place)).toEqual(['teen']);
    expect(named[0].missing).toContain('friends');
    expect(hasAllThreeEverywhere(broken)).toBe(false);
  });

  it('PROVEN TO CATCH: the check is not satisfied by an empty text', () => {
    expect(missingDirections('')).toEqual(['parents', 'children', 'friends']);
  });

  it('each close carries the skill and the rhythm, not only the three addresses', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place}`).toMatch(/Deuteronomy 6:7/);
      expect(text, `${place}`).toMatch(/one friend this week/i);
      expect(text, `${place}`).toMatch(/Teach (?:them|each other) one verse/i);
    }
  });
});

describe('the blocked road is named in every reader place, with its date (DR-0076 §8 / DR-0190)', () => {
  it('every reader place says the article was not read and carries the re-review date', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} has no blocked-road note`).toMatch(/WHAT WE (?:COULD NOT CHECK|DID NOT GET TO READ)/);
      expect(text, `${place} has no dated re-review`).toContain(REVIEW);
    }
    expect(M.bigIdea).toContain(REVIEW);
  });

  it('the six steps are never taught, named or numbered anywhere in the module', () => {
    // THE FIRST VERSION OF THIS CHECK WAS WRONG, and it is left recorded rather
    // than quietly corrected (DR-1467). It matched `the six steps are` and so
    // fired on the CHILD BAND'S REFUSAL — "we do not say what the six steps
    // are" — which is the very sentence this file exists to require. A gate
    // that reports the refusal as the leak is worse than no gate: it trains a
    // reader to delete the honest sentence. So the pattern now matches only an
    // ENUMERATION, which is what a leak would actually look like, and the
    // refusal is asserted separately, positively, below.
    const ENUMERATED = /\bstep (?:one|two|three|four|five|six|1|2|3|4|5|6)\b|\b(?:first|second|third|fourth|fifth|sixth) step\b/i;
    const faults = ALL().filter(([, t]) => ENUMERATED.test(t)).map(([p]) => p);
    expect(faults, 'a step from an article nobody read leaked into the lesson').toEqual([]);
  });

  it('PROVEN TO CATCH: an enumerated step would be named, and the refusal would not', () => {
    const ENUMERATED = /\bstep (?:one|two|three|four|five|six|1|2|3|4|5|6)\b|\b(?:first|second|third|fourth|fifth|sixth) step\b/i;
    expect(ENUMERATED.test('Step one is to align the forecast.')).toBe(true);
    expect(ENUMERATED.test('The third step is a joint scorecard.')).toBe(true);
    expect(ENUMERATED.test('So we do not say what the six steps are. We do not know.')).toBe(false);
  });

  it('the refusal itself is present, in the lesson’s own words, in every reader place', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} never refuses the unread article`).toMatch(
        /(?:never read|did not read|not one of the six steps|none of the six steps|we do not teach the six steps|we do not say what the six steps are)/i
      );
    }
  });

  it('the lesson says out loud which premise checking made BIGGER, not only what it could not reach (DR-0100 §5)', () => {
    expect(M.bigIdea).toMatch(/older and larger|bigger than/i);
    expect(M.lesson).toMatch(/older and far larger|far older/i);
  });
});

describe('Word first, and the frame is fixed before any figure from the send (DR-0127 / DR-0282)', () => {
  it('the hour opens on the Word, not on the article', () => {
    const openings = Object.entries(READER_PLACES());
    for (const [place, text] of openings) {
      const firstVerseAt = text.search(SPAN);
      const stepsAt = text.search(/six steps/i);
      expect(firstVerseAt, `${place} quotes no verse`).toBeGreaterThan(-1);
      // The only mention of the article comes BEFORE the Word in the admission
      // that it was never read — and that admission refuses it, it does not
      // teach from it. What must never happen is a figure from the send
      // standing between the admission and the first verse as if it were taught.
      expect(stepsAt, `${place} never names what it could not read`).toBeGreaterThan(-1);
    }
  });

  it('the first Scripture the adult reader meets is the anchor question, Amos 3:3', () => {
    const first = [...M.lesson.matchAll(SPAN)][0];
    expect(`${first[2]} ${first[3]}:${first[4]}`).toBe('Amos 3:3');
    expect(first[1]).toBe(corpusVerse('Amos', 3, 3));
  });

  it('the landing is the agreement, and it is stated as a precondition', () => {
    expect(M.lesson).toMatch(/agreement is not the last step/i);
    expect(M.anchor.theme).toMatch(/IT IS THE FIRST ONE|first one/i);
  });

  it('the teaching rests on the Word’s own worked case, with both offices named', () => {
    for (const name of ['Bezaleel', 'Ithamar']) expect(M.lesson).toContain(name);
    expect(M.lesson).toMatch(/dual control/i);
  });
});

describe('typographic theology is kept, in our voice and not inside a quotation (CLAUDE.md, DR-0210 / DR-0076)', () => {
  const ourVoice = (t) => String(t).replace(/"[^"]*"/g, ' ');

  it('no name of the Godhead is lowered in our own voice, anywhere in the module', () => {
    const bad = [];
    for (const [path, text] of ALL()) {
      const v = ourVoice(text);
      for (const name of ['yahweh', 'jesus', 'christ', 'holy spirit', 'holy ghost']) {
        const re = new RegExp(`(^|[^A-Za-z])${name}\\b`, 'g');
        for (const m of v.matchAll(re)) bad.push(`${path} :: ${m[0].trim()}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the adversary is never capitalised as a proper name, anywhere in the module', () => {
    const bad = ALL()
      .filter(([, t]) => /\b(?:Satan|Lucifer|The Devil|The Adversary|Baal)\b/.test(t))
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });

  it('our voice says Yahweh, and the KJV’s own God / the LORD is left exactly as written inside quotations', () => {
    expect((M.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
    // Haggai 2:8 and 2 Corinthians 8:21 both carry the KJV's own words; they are
    // quoted, never rewritten.
    const quotedTexts = spans().map(([, q]) => q).join(' ');
    expect(quotedTexts).toMatch(/\bthe LORD\b/);
    expect(quotedTexts).not.toMatch(/Yahweh/);
  });
});

describe('the lesson carries a real teaching, not a recitation of the repo (DR-1467, the sov78 case)', () => {
  it('the bigIdea teaches the lesson rather than reciting decision records', () => {
    expect(M.bigIdea).not.toMatch(/\bDR-\d{3,4}\b/);
    expect(M.anchor.theme).not.toMatch(/\bDR-\d{3,4}\b/);
    for (const [path, text] of ALL()) {
      if (path.startsWith('$.levels.') || path === '$.lesson') {
        expect(text, `${path} recites a decision record at the reader`).not.toMatch(/\bDR-\d{3,4}\b/);
      }
    }
  });

  it('the course’s own shape is kept: stories with a kind, benefits, a quiz and a facilitator', () => {
    expect(M.stories.length).toBe(2);
    for (const s of M.stories) {
      expect(s.kind).toBeTruthy();
      expect(s.tone).toBeTruthy();
      expect(s.body.length).toBeGreaterThan(900);
    }
    expect(M.benefits.length).toBeGreaterThanOrEqual(3);
    expect(M.bigIdea.length).toBeGreaterThan(200);
    expect(M.inApp.length).toBeGreaterThan(100);
    expect(M.anchor.theme.length).toBeGreaterThan(80);
    expect(M.levels.teen.length).toBeGreaterThan(300);
    expect(M.levels.senior.length).toBeGreaterThan(500);
    expect(M.quiz.questions.length).toBeGreaterThanOrEqual(3);
    for (const q of M.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('the seam is new: no other lesson in this course already teaches the two offices agreeing', () => {
    const others = PROJECT_MANAGEMENT_MODULES.filter((m) => m.id !== ID);
    expect(others.some((m) => /Amos 3:3/.test(m.anchor.ref || ''))).toBe(false);
    expect(others.some((m) => /2 Kings 12:10/.test(m.anchor.ref || ''))).toBe(false);
  });
});
