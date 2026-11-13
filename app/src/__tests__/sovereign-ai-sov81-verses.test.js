// @vitest-environment node
// =============================================================================
// sov81 — every quotation is the corpus verbatim, the reported is never told
// as the established, and the lesson is whole in every band (DR-1478)
// =============================================================================
// Sovereign A.I. week 81, "What hast thou that thou didst not receive", was
// built from one word Darrell typed above a forwarded IT Brew issue on
// 2026-11-12 at 17:31 UTC: Lesson. Gmail thread 1a1d0d054cd67ed2. The
// scheduled intake missed it; it was built the next day.
//
// SHAPE. The same one-traversal shape sov80 settled on (DR-1467): every check
// below drinks from `everyString`, which reaches every string in the module,
// and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The newsletter carried two stories, and
// the build could read neither article behind it. So three tiers are held
// apart in every reader place and asserted here: the lawyer's counsel is
// REPORTED, the human-authorship requirement is ESTABLISHED and stated without
// a hedge (DR-0100), and the security story's particulars are the newsletter's
// account with a dated re-review (DR-0076 section 8). And because the lesson
// teaches honest authorship, it may put nobody but Scripture in double
// quotation marks (DR-0331): every double-quoted span is a corpus verse.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov81-what-hast-thou-that-thou-didst-not-receive';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

/** Every string anywhere in the module, with the path that reaches it. */
function everyString(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => everyString(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) everyString(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

const STRINGS = MODULE ? everyString(MODULE) : [];
const at = (p) => {
  const hit = STRINGS.find(([k]) => k === p);
  return hit ? hit[1] : '';
};

const QUOTE = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)\)/g;

function everyQuotation(strings = STRINGS) {
  const out = [];
  for (const [path, s] of strings) {
    for (const m of s.matchAll(QUOTE)) {
      out.push({ path, text: m[1], book: m[2].trim(), chapter: Number(m[3]), verse: Number(m[4]) });
    }
  }
  return out;
}

const QUOTATIONS = everyQuotation();
const BOOKS = [...new Set(QUOTATIONS.map((q) => q.book))].sort();

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();

// The house writes "Psalm 24:1" and the corpus file is `Psalms.json`, so the
// resolution falls back to the plural form exactly as scripts/sov81-fill.mjs
// does (the false-fault class sov80 recorded).
export function bookFileName(book) {
  const k = String(book).replace(/\s+/g, '');
  if (existsSync(join(KJV, `${k}.json`))) return k;
  if (existsSync(join(KJV, `${k}s.json`))) return `${k}s`;
  return null;
}

function corpusVerse(book, chapter, verse) {
  const key = bookFileName(book);
  if (!key) return null;
  if (!cache.has(key)) {
    const p = join(KJV, `${key}.json`);
    cache.set(key, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  const bk = cache.get(key);
  if (!bk) return null;
  const chap = bk.chapters[chapter - 1];
  return (chap && chap[verse - 1]) || null;
}

function verseFaults(quotations) {
  const out = [];
  for (const q of quotations) {
    const actual = corpusVerse(q.book, q.chapter, q.verse);
    if (actual == null) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} does not resolve in the corpus`);
    else if (actual !== q.text) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} is not the corpus text`);
  }
  return out;
}

/** Every double-quoted span in a set of strings that is NOT a corpus verse. */
function nonScriptureQuotes(strings) {
  const out = [];
  for (const [path, s] of strings) {
    for (const m of s.matchAll(/"([^"]+)"(\s*\(([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)\))?/g)) {
      const ok = m[2] && corpusVerse(m[3].trim(), Number(m[4]), Number(m[5])) === m[1];
      if (!ok) out.push(`${path}: "${m[1].slice(0, 60)}"`);
    }
  }
  return out;
}

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];
const TEACHING_PLACES = ['lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];

describe('sov81 is in the catalog and is the whole lesson', () => {
  it('the module exists, as the newest week, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(81);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 132 strings on 2026-11-13, MEASURED; pinned low-side.
    expect(STRINGS.length).toBeGreaterThanOrEqual(130);
    const paths = STRINGS.map(([p]) => p);
    for (const p of [
      ...READER_PLACES,
      'title',
      'anchor.theme',
      'rpe.research',
      'rpe.plan',
      'rpe.execute',
      'benefits[0]',
      'stories[0].body',
      'quiz.questions[0].explain',
      'facilitator.howToRun',
      'facilitator.talkingPoints[0]',
      'facilitator.discussionPrompts[0]',
    ]) {
      expect(paths, `${p} must be swept`).toContain(p);
    }
    const outside = QUOTATIONS.filter((q) => !READER_PLACES.includes(q.path));
    expect(outside.length, 'the sweep must reach past the reader places').toBeGreaterThan(0);
  });
});

describe('every quotation is the corpus verbatim', () => {
  it('there are quotations to check, across the books the module itself names', () => {
    // 162 quotations across 20 books on 2026-11-13, MEASURED.
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(160);
    expect(BOOKS.length).toBeGreaterThanOrEqual(20);
  });

  it('the book list is DERIVED, and every derived book resolves on disk', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    expect(BOOKS, 'the lesson quotes the psalms').toContain('Psalm');
    expect(bookFileName('Psalm')).toBe('Psalms');
    // Leading-ordinal books are reached by the same derivation, not a typed list.
    for (const b of ['1 Corinthians', '2 Thessalonians', '1 Chronicles', '2 Corinthians']) expect(BOOKS).toContain(b);
  });

  it('every quotation anywhere in the module matches the KJV on disk', () => {
    expect(verseFaults(QUOTATIONS)).toEqual([]);
  });

  it('every double-quoted span ANYWHERE is Scripture, so no person is put in quotation marks (DR-0331)', () => {
    expect(nonScriptureQuotes(STRINGS)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a drifted word in a QUIZ or FACILITATOR string is caught', () => {
    const q = QUOTATIONS.find((x) => !READER_PLACES.includes(x.path)) || QUOTATIONS[0];
    expect(verseFaults([{ ...q, text: `${q.text} and more` }])).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a quotation attributed to the wrong verse is caught', () => {
    const q = QUOTATIONS.find((x) => x.book === '1 Corinthians');
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the lawyer's words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'He said "documentation of authorship" matters.']];
    expect(nonScriptureQuotes(planted)).toHaveLength(1);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const anchor = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const readerQuoted = new Set(QUOTATIONS.filter((q) => READER_PLACES.includes(q.path)).map((q) => `${q.book} ${q.chapter}:${q.verse}`));

  it('the anchor carries no reference that is not quoted to a reader', () => {
    expect(anchor.filter((r) => !readerQuoted.has(r))).toEqual([]);
  });

  it('no verse is quoted to a reader without standing on the anchor', () => {
    expect([...readerQuoted].filter((r) => !anchor.includes(r))).toEqual([]);
  });

  it('the anchor resolves, end to end', () => {
    expect(anchor.length).toBe(45);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const receive = () => corpusVerse('1 Corinthians', 4, 7);
  const knoweth = () => corpusVerse('James', 4, 17);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes 1 Corinthians 4:7`).toContain(receive());
      expect(at(p), `${p} quotes James 4:17`).toContain(knoweth());
    }
    for (const p of ['bigIdea']) {
      expect(at(p)).toMatch(/1 Corinthians 4:7/);
      expect(at(p)).toMatch(/James 4:17/);
    }
  });

  it('the frame is laid before the article and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = text.indexOf(receive());
      const article = text.search(/lawyer/i);
      const application = text.search(/THREE THINGS THIS WEEK/);
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the lawyer`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('the advertisement and the untaught items are left out of every teaching place', () => {
    const forbidden = ['Proton', 'Easy Switch', 'Black Friday', 'StorMagic', 'CollabWORK', 'unemployment', 'valuation'];
    for (const p of TEACHING_PLACES) {
      for (const term of forbidden) expect(at(p), `${p} must not carry ${term}`).not.toContain(term);
    }
  });

  it('no model identifier appears anywhere in the module', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d/i);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(at(p), `${p} recites a decision record`).not.toMatch(/DR-\d{4}/);
  });

  it('our voice names Yahweh, not the generic name, outside quotations (DR-0210)', () => {
    for (const [p, s] of STRINGS) {
      const prose = s.replace(/"[^"]*"\s*\([^)]*\)/g, '');
      expect(prose, p).not.toMatch(/\bGod\b/);
    }
  });

  it('Jesus is confessed as the Lamb and the Eternal Son in the adult lesson and the older bands', () => {
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), p).toContain(corpusVerse('John', 1, 29));
      expect(at(p), p).toMatch(/Eternal Son of Yahweh/);
    }
  });

  it('PROVEN-TO-CATCH: the generic name planted in our voice is caught, a quoted one is not', () => {
    const strip = (s) => s.replace(/"[^"]*"\s*\([^)]*\)/g, '');
    expect(/\bGod\b/.test(strip('We thank God for the tools.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('John', 1, 29)}" (John 1:29)`))).toBe(false);
  });
});

describe('three tiers held apart: reported, established, and not checked', () => {
  it('every teaching place names the shut road and carries the dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} names the host it could not open`).toContain('www.itbrew.com');
      expect(at(p), `${p} says what was not checked`).toContain('WHAT WE DID NOT CHECK');
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
    }
  });

  it('the human-authorship requirement is stated plainly as established, never hedged', () => {
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), `${p} states the requirement`).toMatch(/human author/);
      expect(at(p), `${p} says it is settled`).toMatch(/not in doubt|settled|established|not up for debate/i);
    }
    // DR-0100: under-claiming a verified truth is a failure too.
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/nobody knows whether|no one knows whether|unclear whether a human/i);
    }
  });

  it('the security particulars are attributed to the newsletter, never asserted', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/70%|seventy percent/i);
      expect(at(p), p).not.toMatch(/OpenAI/);
    }
    expect(at('lesson')).toMatch(/newsletter's account/);
    expect(at('bigIdea')).toMatch(/LESS certain/);
  });

  it('our own house is traced on its real record, and the figure is the measured one', () => {
    expect(at('lesson')).toContain('1,895 of 2,980 commits');
    expect(at('lesson')).toMatch(/twenty-four things/);
    expect(at('inApp')).toMatch(/Books, then Legal/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), `${p} names the honest middle label`).toMatch(/human-directed and (AI|machine)-(expressed|written)/);
    }
  });

  it('PROVEN-TO-CATCH: a band with the date stripped is named', () => {
    const stripped = at('levels.child').replace('re-review: 2026-11-27', '');
    expect(stripped.includes('re-review: 2026-11-27')).toBe(false);
    expect(at('levels.child').includes('re-review: 2026-11-27')).toBe(true);
  });

  it('PROVEN-TO-CATCH: a hedged requirement would be caught', () => {
    expect(/nobody knows whether|no one knows whether|unclear whether a human/i.test('It is unclear whether a human author is needed.')).toBe(true);
  });
});

describe('TALK ABOUT IT TOGETHER is whole in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  const places = ['lesson', ...FOUR_BANDS.map((b) => `levels.${b}`)];

  it('all three directions are present in each place, by their own words', () => {
    for (const p of places) {
      const t = at(p);
      expect(t, `${p} opens the close`).toContain('TALK ABOUT IT TOGETHER');
      expect(t, `${p}: parents to children`).toMatch(/Parents|Grandparents/);
      expect(t, `${p}: children to parents`).toMatch(/Children, ask your/);
      expect(t, `${p}: friend to friend`).toMatch(/ask a friend this/);
      expect(t, `${p}: listening to the end`).toMatch(/all the way to the end|whole story|whole of it/);
      expect(t, `${p}: retell`).toMatch(/retell|say it back|tell it back/);
      expect(t, `${p}: teach one verse`).toMatch(/teach (them|each other) one verse/i);
      expect(t, `${p}: the rhythm`).toContain('Deuteronomy 6:7');
      expect(t, `${p}: one friend this week`).toContain('one friend this week');
    }
  });

  it('PROVEN-TO-CATCH: stripping ONE band’s friend line names that band while the pooled module still looks whole', () => {
    const broken = { ...MODULE, levels: { ...MODULE.levels, teen: MODULE.levels.teen.replace(/ask a friend this/g, 'ask someone') } };
    const short = places.filter((p) => {
      const t = p === 'lesson' ? broken.lesson : broken.levels[p.split('.')[1]];
      return !/ask a friend this/.test(t);
    });
    expect(short).toEqual(['levels.teen']);
    const pooled = [broken.lesson, ...FOUR_BANDS.map((b) => broken.levels[b])].join('\n');
    expect(/ask a friend this/.test(pooled)).toBe(true);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-13 by scripts/sov81-fill.mjs: adult 2,736 words; child
    // 0.511 / youth 0.610 / teen 0.610 / senior 0.622; grades 0.98 < 3.45 <
    // 3.91 < 7.02. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2700);
    const share = Object.fromEntries(FOUR_BANDS.map((b) => [b, words(MODULE.levels[b]) / adult]));
    expect(share.child).toBeGreaterThanOrEqual(0.5);
    expect(share.youth).toBeGreaterThanOrEqual(0.6);
    expect(share.teen).toBeGreaterThanOrEqual(0.6);
    expect(share.senior).toBeGreaterThanOrEqual(0.6);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
        worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      }
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });

  it('every band names its lesson at its start', () => {
    for (const b of FOUR_BANDS) expect(MODULE.levels[b].startsWith(MODULE.title)).toBe(true);
  });
});
