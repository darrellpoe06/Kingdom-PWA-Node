// @vitest-environment node
// =============================================================================
// project-management-pm19-verses — the gate for pm19, "Let these also first be proved"
// =============================================================================
// WHO TAUGHT THIS: NOBODY. Gmail thread `1a1b17065b1eee52`, Western Governors
// University's LinkedIn digest IgnitED, edition Proving Readiness in a Changing
// Job Market, forwarded out of Darrell's university mailbox TWICE on
// 2026-11-06: at 15:18 UTC (9:18 AM Central) with one word, Lesson, and at
// 15:24 UTC (9:24 AM Central) with the fuller copy of all three pieces. The
// pieces were read in full; the reports they cite were not opened (the proxy
// refused www.wgu.edu, www.weforum.org, www.linkedin.com and Craft Education's
// site with 403), so every figure is taught at its tier.
//
// THIS GATE IS WIDE ON PURPOSE (DR-1467), modelled on the pm17 and pm18 gates:
// the verse sweep walks EVERY string in the module, the book list is DERIVED
// from the module's own references, and the Psalm / Psalms spelling is proved
// against the corpus. Two checks are new to this lesson:
//   - THE FIGURE TIER. pm18 forbade every percent sign because its figures
//     were never read. Here the figures ARE in hand, from the pieces, so the
//     rule is different and stricter in another direction: every sentence that
//     carries a figure must name who reported it (WGU, or the World Economic
//     Forum), and the one figure the piece gives with no source must never be
//     stated as a percent or as fact.
//   - THE ORDER. pm19 follows pm18 and never lands without it; the week
//     numbers stay contiguous. It is checked as "follows pm18", not as "is
//     last", so pm20 owes this file no edit (the trap pm18's own gate set).
//
// WHAT THIS GATE DOES NOT COVER (DR-0076 §8): it reads ONE module. The ledger
// suites - decision-chain, course-band-coverage, course-four-bands-hold,
// talk-together, lesson-dates - were run by name beside it. And it proves each
// quotation is the verse it names, not that it was the right verse for the point.
//
// Recorded as DR-1496. Built by scripts/pm19-fill.mjs; every quotation was
// filled from app/public/bible/kjv and never typed (DR-0456 / DR-1468).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { hasAllThreeEverywhere, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { quotesTheWord, lessonBodies } from '../lib/lesson-completeness.js';

const ID = 'pm19-let-these-also-first-be-proved';
const PREV = 'pm18-what-is-that-in-thine-hand';
const THREAD = '1a1b17065b1eee52';
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

// A Scripture span is a quotation followed immediately by its reference (DR-0402).
const SPAN = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\s(\d+):(\d+)\)/g;

const spans = () => ALL().flatMap(([path, text]) => [...String(text).matchAll(SPAN)].map((m) => [path, m[1], m[2], Number(m[3]), Number(m[4])]));

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();

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

// Our prose only: quotations removed, then split into sentences.
const ourVoice = (t) => String(t).replace(/"[^"]*"/g, ' ');
const sentences = (t) => ourVoice(t).split(/(?<=[.!?])\s+/);
const FIGURE = /\d\s?%|\bper ?cent\b/i;
const REPORTER = /\b(?:WGU|university|World Economic Forum|Forum)\b/;

describe('pm19 exists, is whole, and sits after pm18', () => {
  it('the module is in PROJECT_MANAGEMENT_MODULES with an adult lesson and all four bands', () => {
    expect(M, `${ID} must be in PROJECT_MANAGEMENT_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof M.levels[b], b).toBe('string');
    expect(M.lesson.length).toBeGreaterThan(8000);
  });

  it('the splice left no hole and no duplicate, and pm19 follows pm18 (contiguous weeks)', () => {
    expect(PROJECT_MANAGEMENT_MODULES.every((m) => m && typeof m.id === 'string')).toBe(true);
    const ids = PROJECT_MANAGEMENT_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.indexOf(PREV)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(ID)).toBe(ids.indexOf(PREV) + 1);
    expect(ids.indexOf(ID) + 1).toBe(19);
  });

  it('the course header tracks the module count rather than a literal (DR-0677)', () => {
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  it('it names the Gmail thread and BOTH forward times, so the repo is a second witness (DR-1414)', () => {
    expect(M.bigIdea).toContain(THREAD);
    expect(M.bigIdea).toMatch(/15:18 UTC \(9:18 AM Central\)/);
    expect(M.bigIdea).toMatch(/15:24 UTC \(9:24 AM Central\)/);
    expect(M.lesson).toMatch(/2026-11-06/);
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
    for (const pre of ['$.benefits[', '$.stories[', '$.quiz.questions[', '$.facilitator.']) {
      expect(
        paths.some((p) => p.startsWith(pre)),
        pre
      ).toBe(true);
    }
  });

  it('the book list is DERIVED from the module and every derived book opens (DR-1467 case 2)', () => {
    const books = [...new Set(spans().map(([, , b]) => b))].sort();
    expect(books.length).toBeGreaterThan(15);
    expect(books.filter((b) => !bookFile(b))).toEqual([]);
  });

  it('the Psalm / Psalms spelling is handled, proved against the corpus (DR-1467 case 3)', () => {
    expect(existsSync(join(KJV, 'Psalms.json'))).toBe(true);
    expect(existsSync(join(KJV, 'Psalm.json'))).toBe(false);
    expect(bookFile('Psalm')).toBe('Psalms');
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
    // Daniel 1:4 carries one (king’s palace), and this lesson quotes it.
    const curly = spans().find(([, q, b, c, v]) => b === 'Daniel' && c === 1 && v === 4);
    expect(curly, 'Daniel 1:4 is quoted here').toBeTruthy();
    const [, quoted] = curly;
    expect(quoted).toContain('’');
    expect(corpusVerse('Daniel', 1, 4)).toBe(quoted);
    expect(corpusVerse('Daniel', 1, 4)).not.toBe(quoted.replace(/’/g, "'"));
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

  it('every verse quoted in a reader place is on the anchor, and nothing on the anchor goes unquoted', () => {
    const onAnchor = new Set(anchorRefs());
    const quotedInReader = new Set(
      spans()
        .filter(([path]) => path === '$.lesson' || path.startsWith('$.levels.'))
        .map(([, , b, c, v]) => `${b} ${c}:${v}`)
    );
    expect([...quotedInReader].filter((r) => !onAnchor.has(r))).toEqual([]);
    const quotedAnywhere = new Set(spans().map(([, , b, c, v]) => `${b} ${c}:${v}`));
    expect(anchorRefs().filter((r) => !quotedAnywhere.has(r))).toEqual([]);
    expect(new Set(anchorRefs()).size).toBe(anchorRefs().length);
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

describe('every reader place carries its own close (DR-0733 / DR-0795)', () => {
  it('every reader place ends in TALK ABOUT IT TOGETHER and sends the reader all three ways', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text.slice(-2600), `${place}'s close is not at its close`).toMatch(/TALK ABOUT IT TOGETHER/);
      expect(text, `${place}`).toMatch(/Deuteronomy 6:7/);
      expect(text, `${place}`).toMatch(/one friend this week/i);
      expect(text, `${place}`).toMatch(/teach (?:them|each other) one verse/i);
    }
    expect(placesMissingDirections(M)).toEqual([]);
    expect(hasAllThreeEverywhere(M)).toBe(true);
  });

  it('PROVEN TO CATCH: strip ONE band’s friend line and the per-band check names that band', () => {
    const youth = M.levels.youth.replace(/Then ask a friend this:[^]*?Teach each other one verse\./, 'Then carry on.');
    expect(youth).not.toBe(M.levels.youth);
    const named = placesMissingDirections({ ...M, levels: { ...M.levels, youth } });
    expect(named.map((x) => x.place)).toEqual(['youth']);
    expect(named[0].missing).toContain('friends');
    expect(missingDirections('')).toEqual(['parents', 'children', 'friends']);
  });
});

describe('every figure is taught at its tier (DR-0100 / DR-0076 §8)', () => {
  it('every reader place names what was not opened and carries the re-review date', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} has no shut-road note`).toMatch(/WHAT WE (?:COULD NOT CHECK|DID NOT GET TO READ)/);
      expect(text, `${place} has no dated re-review`).toContain(REVIEW);
    }
    expect(M.bigIdea).toContain(REVIEW);
  });

  it('every sentence that carries a figure names who reported it, anywhere in the module', () => {
    const faults = [];
    for (const [path, text] of ALL()) {
      for (const s of sentences(text)) if (FIGURE.test(s) && !REPORTER.test(s)) faults.push(`${path} :: ${s.slice(0, 90)}`);
    }
    expect(faults, faults.join('\n')).toEqual([]);
  });

  it('PROVEN TO CATCH: an orphan figure is named, a tiered one is not', () => {
    const orphan = (s) => sentences(s).filter((x) => FIGURE.test(x) && !REPORTER.test(x));
    expect(orphan('Most employers, 60% of them, now distrust resumes.')).toHaveLength(1);
    expect(orphan('WGU reports that 60% say the tools make skills harder to judge.')).toHaveLength(0);
  });

  it('the figure given with no source is named as unsourced and never stated as a percent', () => {
    expect(M.lesson).toMatch(/one in three early-career workers[^.]*no source; we do not teach that number/);
    for (const [path, text] of ALL()) {
      expect(text, path).not.toMatch(/\b3[0-9]\s?% of (?:early-career|young|entry-level)/i);
    }
  });

  it('the WGU survey is tiered as WGU reporting its own survey, and its interest is said plainly', () => {
    expect(M.lesson).toMatch(/a university reporting its own survey/);
    expect(M.lesson).toMatch(/WGU sells degrees and certificates, and it is reporting its own survey/);
    expect(M.lesson).toMatch(/That is a forecast employers gave, not a count/);
  });

  it('the house’s own gap is named in every reader place — completion is recorded, the work is not', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place} never names the app's own gap`).toMatch(
        /(?:nothing in the learn surfaces records the work|does not save the real work|does not keep the real work|keeps no record of the work)/i
      );
    }
    expect(M.lesson).toMatch(/course-pace\.js, lines 223 to 231/);
    expect(M.lesson).toMatch(/ChurchLearn\.jsx, line 1555/);
    expect(M.lesson).toMatch(/practice-academy\.js, lines 302 to 313/);
  });
});

describe('Word first, and the seam is its own (DR-0127 / DR-0610)', () => {
  it('1 Timothy 3:10 is quoted in every reader place', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      expect(text, `${place}`).toContain(`"${corpusVerse('1 Timothy', 3, 10)}" (1 Timothy 3:10)`);
    }
  });

  it('the trial, the letter, the use and the gift are each grounded in every reader place', () => {
    for (const [place, text] of Object.entries(READER_PLACES())) {
      for (const ref of ['Daniel 1:12', 'Acts 18:27', 'Hebrews 5:14', 'Philippians 2:22', '1 Timothy 5:18', 'Ephesians 2:9']) {
        expect(text, `${place} misses ${ref}`).toContain(`(${ref})`);
      }
    }
  });

  it('the industry term is named, second, as their word (the course thesis)', () => {
    expect(M.lesson).toMatch(/work-sample test/);
    expect(M.lesson.indexOf('(1 Timothy 3:10)')).toBeLessThan(M.lesson.indexOf('work-sample test'));
    expect(M.lesson.indexOf('(Acts 16:3)')).toBeLessThan(M.lesson.indexOf('degree apprenticeship, earn-and-learn'));
    expect(M.levels.senior).toMatch(/registered apprenticeship/);
  });

  it('the seam is new: no other lesson in this course stands on 1 Timothy 3:10, Daniel 1:12 or Philippians 2:22', () => {
    const others = PROJECT_MANAGEMENT_MODULES.filter((m) => m.id !== ID);
    for (const ref of ['1 Timothy 3:10', 'Daniel 1:12', 'Philippians 2:22']) {
      const re = new RegExp(`${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      expect(
        others.filter((m) => re.test(m.anchor.ref || '')).map((m) => m.id),
        ref
      ).toEqual([]);
    }
  });

  it('it does not re-preach its siblings: no pm12 or pm18 anchor verse is on this anchor', () => {
    const mine = M.anchor.ref;
    for (const ref of ['Exodus 4:2', 'Mark 3:14', '1 Samuel 16:7', 'Matthew 7:20', '2 Corinthians 3:2']) {
      expect(mine, ref).not.toMatch(new RegExp(`(^|; )${ref}(;|$)`));
    }
  });
});

describe('typographic theology is kept, in our voice and not inside a quotation (CLAUDE.md, DR-0210)', () => {
  it('no name of the Godhead is lowered in our own voice, anywhere in the module', () => {
    const bad = [];
    for (const [path, text] of ALL()) {
      const v = ourVoice(text);
      for (const name of ['yahweh', 'jesus', 'christ', 'holy spirit', 'holy ghost']) {
        for (const m of v.matchAll(new RegExp(`(^|[^A-Za-z])${name}\\b`, 'g'))) bad.push(`${path} :: ${m[0].trim()}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('our voice never uses the generic name, anywhere in the module (DR-0210)', () => {
    expect(
      ALL()
        .filter(([, t]) => /\bGod\b/.test(ourVoice(t)))
        .map(([p]) => p)
    ).toEqual([]);
  });

  it('the adversary is never capitalised as a proper name, anywhere in the module', () => {
    expect(
      ALL()
        .filter(([, t]) => /\b(?:Satan|Lucifer|The Devil|The Adversary|Baal)\b/.test(t))
        .map(([p]) => p)
    ).toEqual([]);
  });

  it('our voice says Yahweh, and the KJV’s own God / the LORD is left exactly as written inside quotations', () => {
    expect((M.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
    const quoted = spans()
      .map(([, q]) => q)
      .join(' ');
    expect(quoted).toMatch(/\bthe LORD\b/);
    expect(quoted).not.toMatch(/Yahweh/);
  });

  it('the close confesses Jesus as the Lamb and the Eternal Son of Yahweh', () => {
    expect(M.lesson).toMatch(/the Lamb, "[^"]+" \(John 1:29\) the Eternal Son of Yahweh/);
  });
});

describe('the lesson carries a real teaching, not a recitation of the repo (DR-1467)', () => {
  it('no reader place, bigIdea or theme recites a decision record', () => {
    expect(M.bigIdea).not.toMatch(/\bDR-\d{3,4}\b/);
    expect(M.anchor.theme).not.toMatch(/\bDR-\d{3,4}\b/);
    for (const [place, text] of Object.entries(READER_PLACES())) expect(text, place).not.toMatch(/\bDR-\d{3,4}\b/);
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
});
