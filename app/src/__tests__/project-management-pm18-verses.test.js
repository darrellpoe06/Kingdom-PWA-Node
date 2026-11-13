// @vitest-environment node
// =============================================================================
// project-management-pm18-verses — the gate for pm18, "What is that in thine hand"
// =============================================================================
// WHO TAUGHT THIS: NOBODY. Gmail thread `1a1892ae1e2618e8`, a LinkedIn
// newsletter (From the CEO's Desk, by the President and CEO of SHRM) forwarded
// out of Darrell's university mailbox on 2026-10-29 at 18:29 UTC, 1:29 PM
// Central, with one word above the forwarded header: Lesson. The column is How
// HR Leaders Can Ease Capability Anxiety and Help Their People Grow. Fifteen days
// stood between his word and this build, and the record keeps that gap.
//
// THE EMAIL IS A TEASER, and these checks hold that limit in place. It stops at
// Keep reading on LinkedIn; the rest was never read. The two reports it names
// were not opened: www.wtwco.com and www.shrm.org both failed to resolve from
// this session. So no figure from either report may appear anywhere in the
// module, and every reader place says what was not read, with the date we try
// again.
//
// THIS GATE IS AS WIDE AS pm17's ON PURPOSE (DR-1467): the verse sweep walks
// EVERY string in the module, the book list is DERIVED from the module's own
// references, and the house's Psalm / Psalms spelling is resolved against the
// corpus rather than assumed.
//
// WHAT THIS GATE DOES NOT COVER (DR-0076 §8): it reads ONE module. The catalog
// suites — project-management-courses, course-band-coverage,
// course-four-bands-hold, decision-chain — were run by name alongside it.
//
// Recorded as DR-1485. Built by scripts/pm18-fill.mjs; every quotation on the
// page was filled from app/public/bible/kjv and never typed (DR-0456 / DR-1468).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { quotesTheWord, lessonBodies } from '../lib/lesson-completeness.js';

const ID = 'pm18-what-is-that-in-thine-hand';
const THREAD = '1a1892ae1e2618e8';
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
// (DR-0402). Ordinary prose in quotation marks is not one.
const SPAN = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\s(\d+):(\d+)\)/g;

/** Every span anywhere in the module: [path, quoted, book, chapter, verse]. */
const spans = () =>
  ALL().flatMap(([path, text]) =>
    [...String(text).matchAll(SPAN)].map((m) => [path, m[1], m[2], Number(m[3]), Number(m[4])])
  );

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

describe('pm18 exists, is whole, and is in the course', () => {
  it('the module is in PROJECT_MANAGEMENT_MODULES with an adult lesson and all four bands', () => {
    expect(M, `${ID} must be in PROJECT_MANAGEMENT_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof M.levels[b], b).toBe('string');
    expect(M.lesson.length).toBeGreaterThan(8000);
  });

  it('the splice left no hole in the array and no duplicate id (measured, not assumed)', () => {
    expect(PROJECT_MANAGEMENT_MODULES.every((m) => m && typeof m.id === 'string')).toBe(true);
    const ids = PROJECT_MANAGEMENT_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[ids.length - 1]).toBe(ID);
  });

  it('the course header tracks the module count rather than a literal (DR-0677)', () => {
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  it('it names the Gmail thread and the forward time, so the repo is a second witness (DR-1414)', () => {
    expect(M.bigIdea).toContain(THREAD);
    expect(M.bigIdea).toMatch(/2026-10-29 at 18:29 UTC \(1:29 PM Central\)/);
    expect(M.lesson).toMatch(/2026-10-29/);
  });

  it('it says plainly that nobody taught it (DR-0719)', () => {
    expect(M.bigIdea).toMatch(/WHO TAUGHT THIS: NOBODY/);
    expect(M.lesson).toMatch(/WHO TAUGHT THIS: NOBODY/);
  });
});

describe('every quoted span anywhere in the module is the corpus verse, verbatim', () => {
  it('the sweep reads a real number of spans, so it cannot pass by checking nothing (DR-0076 §3)', () => {
    expect(spans().length).toBeGreaterThan(150);
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
    expect(books.length).toBeGreaterThan(15);
    const unopenable = books.filter((b) => !bookFile(b));
    expect(unopenable, 'a book this lesson quotes has no corpus file').toEqual([]);
  });

  it('the Psalm / Psalms spelling is handled, proved against the corpus (DR-1467 case 3)', () => {
    expect(existsSync(join(KJV, 'Psalms.json'))).toBe(true);
    expect(existsSync(join(KJV, 'Psalm.json'))).toBe(false);
    expect(bookFile('Psalm')).toBe('Psalms');
    expect(corpusVerse('Psalm', 32, 8)).toBe(corpusVerse('Psalms', 32, 8));
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
      expect(byPlace[p] || 0, `${p} quotes no Scripture with a reference`).toBeGreaterThan(25);
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
    // Exodus 4:11 carries one (man’s mouth), and this lesson quotes it.
    const curlySpan = spans().find(([, q]) => q.includes('’'));
    expect(curlySpan, 'Exodus 4:11 carries U+2019 and is quoted here').toBeTruthy();
    const [, quoted, b, c, v] = curlySpan;
    expect(corpusVerse(b, c, v)).toBe(quoted);
    expect(corpusVerse(b, c, v)).not.toBe(quoted.replace(/’/g, "'"));
  });

  it('EVERY body hands the reader a verse WITH its reference beside it (DR-0402)', () => {
    const bodies = lessonBodies(M);
    expect(bodies.length).toBe(5);
    expect(bodies.filter((b) => !quotesTheWord({ lesson: b })).length).toBe(0);
  });
});

describe('anchor.ref names every verse the lesson stands on, and nothing more (DR-0734)', () => {
  const anchorRefs = () =>
    M.anchor.ref
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

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
      expect(text, `${place}`).toMatch(/teach (?:them|each other) one verse/i);
    }
  });
});

describe('the teaser is named as a teaser in every reader place, with its date (DR-0076 §8 / DR-0190)', () => {
  it('every reader place says what was not read and carries the re-review date', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} has no blocked-road note`).toMatch(/WHAT WE (?:COULD NOT CHECK|DID NOT GET TO READ)/);
      expect(text, `${place} has no dated re-review`).toContain(REVIEW);
    }
    expect(M.bigIdea).toContain(REVIEW);
  });

  it('no figure from an unopened report is taught anywhere in the module', () => {
    // The search index offered SHRM's own 36-40% figure and WTW's 14% / 31% /
    // 72% figures. None of those pages was opened, so none may stand here as
    // if it had been read. A percent sign anywhere in the module is the leak.
    const faults = ALL()
      .filter(([, t]) => /\d\s?%|\bper ?cent\b/i.test(t))
      .map(([p]) => p);
    expect(faults, 'a figure from a report nobody opened leaked into the lesson').toEqual([]);
  });

  it('PROVEN TO CATCH: the leak pattern fires on a figure and not on the refusal', () => {
    const LEAK = /\d\s?%|\bper ?cent\b/i;
    expect(LEAK.test('postings now list 36% more skills')).toBe(true);
    expect(LEAK.test('forty percent more skills')).toBe(true);
    expect(LEAK.test('so no figure from either report is taught')).toBe(false);
  });

  it('the name capability anxiety is tiered as REPORTED, never stated as the firm’s own words', () => {
    expect(M.lesson).toMatch(/is reported to call capability anxiety/);
    expect(M.lesson).toMatch(/did not find the phrase capability anxiety in the firm's own words/);
    expect(M.lesson).not.toMatch(/WTW calls capability anxiety/);
  });

  it('the house’s own gap is named in every reader place — the app holds no picture of a person’s skills', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} never names the app's own gap`).toMatch(
        /(?:no skills inventory|does not know what you can|does not yet keep a list of what a person can do|holds no record of what a person can already do)/i
      );
    }
    expect(M.lesson).toMatch(/church-classes\.js at lines 453 to 456/);
  });
});

describe('Word first, and the frame is fixed before any figure from the send (DR-0127 / DR-0282)', () => {
  it('the first Scripture the adult reader meets is the anxiety itself, Exodus 4:10', () => {
    const first = [...M.lesson.matchAll(SPAN)][0];
    expect(`${first[2]} ${first[3]}:${first[4]}`).toBe('Exodus 4:10');
    expect(first[1]).toBe(corpusVerse('Exodus', 4, 10));
  });

  it('the inventory comes before the instruction: Exodus 4:2 is quoted in every reader place', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place}`).toContain(`"${corpusVerse('Exodus', 4, 2)}" (Exodus 4:2)`);
    }
  });

  it('the three things are each grounded in the Word, in every reader place', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      for (const ref of ['Exodus 4:2', 'Exodus 18:20', 'Mark 3:14', '2 Corinthians 3:5']) {
        expect(text, `${place} misses ${ref}`).toContain(`(${ref})`);
      }
    }
  });

  it('the line between fear and refusal is taught from the text, verse 14 not verse 10', () => {
    expect(M.lesson).toMatch(/kindled at verse 14, not at verse 10/);
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place}`).toContain('(Exodus 4:14)');
      expect(text, `${place}`).toContain('(Exodus 4:15)');
    }
  });

  it('the industry term is named, second, as their word (the course thesis)', () => {
    expect(M.lesson).toMatch(/skills matrix/);
    expect(M.lesson.indexOf('(Exodus 4:2)')).toBeLessThan(M.lesson.indexOf('skills matrix'));
    expect(M.levels.senior).toMatch(/PMBOK/);
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

  it('our voice never uses the generic name, anywhere in the module (DR-0210)', () => {
    const bad = ALL()
      .filter(([, t]) => /\bGod\b/.test(ourVoice(t)))
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });

  it('the adversary is never capitalised as a proper name, anywhere in the module', () => {
    const bad = ALL()
      .filter(([, t]) => /\b(?:Satan|Lucifer|The Devil|The Adversary|Baal)\b/.test(t))
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });

  it('our voice says Yahweh, and the KJV’s own God / the LORD is left exactly as written inside quotations', () => {
    expect((M.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
    const quotedTexts = spans()
      .map(([, q]) => q)
      .join(' ');
    expect(quotedTexts).toMatch(/\bthe LORD\b/);
    expect(quotedTexts).not.toMatch(/Yahweh/);
  });
});

describe('the lesson carries a real teaching, not a recitation of the repo (DR-1467, the sov78 case)', () => {
  it('no reader place, bigIdea or theme recites a decision record', () => {
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
    expect(M.quiz.questions.length).toBeGreaterThanOrEqual(3);
    for (const q of M.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('the seam is new: no other lesson in this course already stands on Exodus 4:2 or Mark 3:14', () => {
    const others = PROJECT_MANAGEMENT_MODULES.filter((m) => m.id !== ID);
    expect(others.some((m) => /Exodus 4:2\b/.test(m.anchor.ref || ''))).toBe(false);
    expect(others.some((m) => /Mark 3:14/.test(m.anchor.ref || ''))).toBe(false);
  });
});
