// @vitest-environment node
// =============================================================================
// sov88 — every quotation is the corpus verbatim, the house is traced to its
// real code, and the lesson is whole in every band (DR-1504)
// =============================================================================
// Sovereign A.I. week 88, "Every man by his own standard", was built from one
// word Darrell typed above a forwarded ByteByteGo issue, EP232, 6 Frequently
// Used Orchestration Frameworks in an AI system, on 2026-11-09 at 13:29 UTC
// (7:29 AM Central): Lesson. Gmail thread 1a1b6e6085128724. The scheduled
// intake fell behind; it was built 2026-11-13.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467) and sov81-83 kept:
// every check below drinks from `everyString`, which reaches every string in
// the module, and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. Four tiers are held apart: the
// engineering and the six frameworks' existence are ESTABLISHED, the one-line
// account of each framework is REPORTED and never ranked, the house is
// MEASURED, and the hours the landing train has cost are NOT MEASURED, so no
// reader place may put a number on them. The house claims are pinned to the
// code that makes them true - the reservation referee, the capacity budget
// (re-derived from its own pure function with the reading taken that day), the
// held weeks, the Ops board's lane rule and the ledger resolver - so if the
// code moves, this file goes red and the lesson is re-read.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's. And the live count
// (seven of fourteen pieces of work in conflict at 17:10 UTC) was read from
// GitHub once; no test can re-read a moment, so it is pinned as the lesson's
// own words and recorded with its time in the DR.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';
import { budget } from '../../../scripts/capacity-budget.mjs';
import { classifyLane } from '../lib/github-ops.js';

const ID = 'sov88-every-man-by-his-own-standard';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');

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

// A reference may name a book in the singular ("Psalm 15:4") while the corpus
// file is plural (`Psalms.json`), so the
// resolution falls back to the plural form exactly as scripts/sov88-fill.mjs
// does (the false-fault class sov80 recorded).
function bookFileName(book) {
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

/** The file's text, or '' — the house claims below read the real code. */
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];
const TEACHING_PLACES = ['lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];

// MEASURED 2026-11-13 on the spliced module: 135 strings, 136 quotations across
// 11 books, 35 anchor references. Floors pinned a little low; the anchor exact.
const STRINGS_FLOOR = 130;
const QUOTATIONS_FLOOR = 130;
const BOOKS_FLOOR = 11;
const ANCHOR_COUNT = 35;

describe('sov88 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 88, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(88);
    expect(weeks.filter((w) => w === 88)).toHaveLength(1);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    expect(STRINGS.length).toBeGreaterThanOrEqual(STRINGS_FLOOR);
    const paths = STRINGS.map(([p]) => p);
    for (const p of [
      ...READER_PLACES,
      'title',
      'anchor.theme',
      'rpe.research',
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
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(QUOTATIONS_FLOOR);
    expect(BOOKS.length).toBeGreaterThanOrEqual(BOOKS_FLOOR);
  });

  it('the book list is DERIVED, and every derived book resolves on disk', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    expect(BOOKS).toContain('Numbers');
    expect(BOOKS).toContain('1 Corinthians');
    expect(bookFileName('Psalm')).toBe('Psalms');
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
    const q = QUOTATIONS.find((x) => x.book === 'Numbers' && x.chapter === 2 && x.verse === 2);
    expect(q, 'Numbers 2:2 is quoted').toBeTruthy();
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the newsletter's words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'The newsletter says "No separate layer for orchestration exists." and means it.']];
    expect(nonScriptureQuotes(planted)).toHaveLength(1);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const anchor = (MODULE?.anchor?.ref || '')
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
    expect(anchor.length).toBe(ANCHOR_COUNT);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const head = () => corpusVerse('Colossians', 2, 19);
  const standard = () => corpusVerse('Numbers', 2, 2);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Colossians 2:19`).toContain(head());
      expect(at(p), `${p} quotes Numbers 2:2`).toContain(standard());
    }
    expect(at('bigIdea')).toMatch(/Colossians 2:19/);
    expect(at('bigIdea')).toMatch(/Numbers 2:2/);
  });

  it('the frame is laid before the orchestrator and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = Math.max(text.indexOf(head()), text.indexOf(standard()));
      const article = text.search(/orchestrat/i);
      const application = text.indexOf('FOUR THINGS THIS WEEK');
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(article, `${p} names orchestration`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the orchestrator`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('all six frameworks are taught in every teaching place, each beside its own verse', () => {
    const six = ['LangGraph', 'CrewAI', 'Microsoft Agent Framework', 'OpenAI Agents SDK', 'Agent Development Kit', 'Claude Agent SDK'];
    const pins = [
      ['Numbers', 4, 49],
      ['Numbers', 9, 8],
      ['Deuteronomy', 1, 17],
      ['Numbers', 2, 3],
      ['Proverbs', 16, 9],
    ];
    for (const p of TEACHING_PLACES) {
      for (const name of six) expect(at(p), `${p} names ${name}`).toContain(name);
      for (const [b, c, v] of pins) expect(at(p), `${p} quotes ${b} ${c}:${v}`).toContain(corpusVerse(b, c, v));
      // The graph's verse is Numbers 33:1 or 33:2, whichever the band chose.
      expect(at(p).includes(corpusVerse('Numbers', 33, 1)) || at(p).includes(corpusVerse('Numbers', 33, 2)), `${p} quotes Numbers 33`).toBe(true);
    }
  });

  it('weeks 70 and 84 are linked, not repeated: no Nehemiah 3, Exodus 18 or 1 Corinthians 12 is quoted', () => {
    const repeats = QUOTATIONS.filter(
      (q) => (q.book === 'Nehemiah' && q.chapter === 3) || (q.book === 'Exodus' && q.chapter === 18) || (q.book === '1 Corinthians' && q.chapter === 12)
    );
    expect(repeats.map((q) => `${q.path}: ${q.book} ${q.chapter}:${q.verse}`)).toEqual([]);
    for (const p of ['lesson', 'levels.senior']) expect(at(p), `${p} links week seventy`).toMatch(/week seventy|Week seventy/);
  });

  it('the sponsor blocks and the issue’s other items are left out of every reader place', () => {
    for (const p of READER_PLACES) {
      for (const term of [
        'Strands',
        'INFER/CON',
        'Datadog',
        'Byte/VIP',
        'Semantic cache',
        'semantic cache',
        'Prompt caching',
        'quantization',
        'distillation',
      ]) {
        expect(at(p), `${p} must not carry ${term}`).not.toContain(term);
      }
    }
  });

  it('no framework is ranked above another', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(/(the )?best (framework|of the six|one to use)|is the winner|clearly better than/i);
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
    expect(/\bGod\b/.test(strip('We thank God for the orchestrator.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('John', 1, 29)}" (John 1:29)`))).toBe(false);
  });
});

describe('four tiers held apart: established, reported, measured, not measured', () => {
  it('every teaching place carries the dated re-review and names the reported account as the newsletter’s', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
      expect(at(p), `${p} says how each tool works came from the newsletter`).toMatch(
        /REPORTED|Reported|reported as given|came from the email|newsletter told how/
      );
      expect(at(p), `${p} says the frameworks are real`).toMatch(/real/);
    }
    for (const p of TEACHING_PLACES) expect(at(p), p).not.toMatch(/nobody knows what orchestration|experts disagree|some say/i);
  });

  it('no reader place puts a number on the hours the conflicts cost, and each says it was not counted', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|dozens of) hours (were |was )?(lost|wasted)/i);
      expect(at(p), `${p} says the hours were not counted`).toMatch(/not (counted|measured)|did not count|has not been measured/i);
    }
  });

  it('the house carries no unchecked-material admission, so the third pile is unmoved (DR-1126)', () => {
    for (const [p, s] of STRINGS) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s), `${p} would count as an unchecked admission`).toBe(false);
    }
  });

  it('PROVEN-TO-CATCH: a guessed hour count and a disclosure phrase are both caught', () => {
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|dozens of) hours (were |was )?(lost|wasted)/i.test('In all, 40 hours were lost to the train.')
    ).toBe(true);
    DISCLOSURE.lastIndex = 0;
    expect(DISCLOSURE.test('WHAT WE DID NOT CHECK: the manuals.')).toBe(true);
  });
});

describe('our own camp: every claim the lesson makes is still true of the code', () => {
  it('the orchestrator integrates lanes in order and never hand-edits (the operating model)', () => {
    const md = src('docs/decisions/DR-0077-orchestrated-lanes-one-orchestrator-operating-model.md');
    expect(md).toMatch(/integrates lanes into\s+`main` in order\*\* — it never hand-edits/);
    expect(md).toMatch(/\*\*Each lane self-verifies\*\*/);
    expect(at('lesson')).toMatch(/never editing the work by hand/);
  });

  it('the number referee is the server, by exact name, and knows only dr and ll spellings (reserve-ref)', () => {
    const js = src('scripts/lib/reserve-ref.mjs');
    expect(js).toMatch(/--force-with-lease=\$\{ref\}:/);
    expect(js).toMatch(/export const KINDS = Object\.freeze\(\{ dr: 4, ll: 0 \}\)/);
    // WHEN THIS GOES RED because the course gained a kind of its own, the
    // spelling-convention gap is closed: say so in movement four of every band.
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/spell/i);
  });

  it('the capacity budget, re-run on the reading taken that day, says room for three and over by one', () => {
    const b = budget({ availGb: 11.8, diskFreeGb: 12.7, wanted: 4 });
    expect(b.byMem).toBe(3);
    expect(b.fits).toBe(3);
    expect(b.ok).toBe(false);
    expect(src('scripts/capacity-budget.mjs')).toMatch(/const BUILDER_GB = Number\(process\.env\.BUILDER_GB \|\| 3\.1\)/);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/three/);
    for (const p of TEACHING_PLACES) expect(at(p), p).toContain(corpusVerse('Luke', 14, 31));
  });

  it('PROVEN-TO-CATCH: a budget that would fit four is not the one the lesson teaches', () => {
    expect(budget({ availGb: 14.5, diskFreeGb: 12.7, wanted: 4 }).ok).toBe(true);
  });

  it('the course holds weeks in order, and this week is taught as waiting behind 84 to 87', () => {
    const t = src('app/src/__tests__/sovereign-ai-class.test.js');
    expect(t).toMatch(/const HELD_IN_FLIGHT = \[/);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/eighty-four/i);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/eighty-eight/i);
  });

  it('the Ops board serializes only the monolith and migrations, so a ledger-only PR reads parallel-safe', () => {
    expect(classifyLane(['docs/decisions/INDEX.md', 'app/src/lib/ai-usage-ledger.json', 'app/src/lib/sovereign-ai-class.js'])).toBe('parallel-safe');
    expect(classifyLane(['app/src/poe-financial-mvp-v28.jsx'])).toBe('must-serialize');
    // WHEN THIS GOES RED because the board learned the shared ledgers, the
    // blind spot is closed: rewrite the board paragraph in every band.
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/Ops board|holy tent/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) expect(at(p), p).toMatch(/Ops board/);
  });

  it('the ledger resolver names the cost ledger and the five hand resolutions the lesson teaches', () => {
    const js = src('scripts/resolve-ledger-conflicts.mjs');
    expect(js).toMatch(/app\/src\/lib\/ai-usage-ledger\.json/);
    expect(js).toMatch(/resolved BY HAND five\s*\n\/\/\s+times in one afternoon across nine/);
    expect(at('lesson')).toMatch(/five times across nine/);
  });

  it('the landing train is taught with the count read that afternoon: seven of fourteen, the ledger in six', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).toMatch(/fourteen/i);
      expect(at(p), p).toMatch(/[Ss]even/);
      expect(at(p), p).toContain(corpusVerse('Numbers', 1, 53));
    }
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior'])
      expect(at(p), p).toMatch(/six of (the|them|those) seven|six of them|in six of/i);
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
    // MEASURED 2026-11-13 by scripts/sov88-fill.mjs: adult 2,753 words; child
    // 0.567 / youth 0.705 / teen 0.648 / senior 0.849; grades 1.76 < 3.23 <
    // 3.93 < 9.40. Pinned with tolerance.
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
