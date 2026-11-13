// @vitest-environment node
// =============================================================================
// sov86 — every quotation is the corpus verbatim, the disclosure stands in
// every teaching place, a reported claim about a maker is never told as fact,
// our own house is measured, and the lesson is whole in every band (DR-1502)
// =============================================================================
// Sovereign A.I. week 86, "All the works of this pattern", was built from one
// word Darrell typed above the forwarded TLDR daily digest of 2026-11-06
// (subject: Anthropic IPO doubts, datacenter bans, GitHub's new storage) at
// 20:46 UTC, 2:46 PM CST: Lesson. Gmail thread 1a1b29d09bf45870. The intake
// lane fell behind; it was built from the backlog on 2026-11-13.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467) and sov82 kept:
// every check below drinks from `everyString`, which reaches every string in
// the module, and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The item taught concerns Anthropic, the
// company that makes the A.I. tool this app is built with and this lesson was
// drafted with. So: (1) every teaching place DISCLOSES that relationship before
// the digest is described; (2) nothing about the company or any person is
// told as more than REPORTED -- no verdict, and no person named anywhere in the
// module; (3) the lesson is even-handed by the Word: reasoning and doing good
// are quoted as commended BEFORE the warning; (4) the teaching is applied to
// every maker, the local open models included. The household application is
// MEASURED from this repository, and each fact the lesson states is read back
// here from the file it came from.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { SEED_PROVIDERS } from '../lib/llm-providers.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov86-all-the-works-of-this-pattern';
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
// resolution falls back to the plural form exactly as scripts/sov86-fill.mjs does.
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

// MEASURED 2026-11-13 on the spliced tree: 153 quotations across 16 books, 124 strings; pinned low-side.
const QUOTATION_FLOOR = 148;
const BOOK_FLOOR = 16;

describe('sov86 is in the catalog and is the whole lesson', () => {
  it('the module exists, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(86);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 124 strings on 2026-11-13, MEASURED; pinned low-side.
    expect(STRINGS.length).toBeGreaterThanOrEqual(118);
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
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(QUOTATION_FLOOR);
    expect(BOOKS.length).toBeGreaterThanOrEqual(BOOK_FLOOR);
  });

  it('the book list is DERIVED, and every derived book resolves on disk', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    // Leading-ordinal books are reached by the same derivation, not a typed list.
    for (const b of ['1 Chronicles', '2 Chronicles', '1 Kings', '1 Corinthians', '1 John', '1 Thessalonians']) expect(BOOKS).toContain(b);
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
    const q = QUOTATIONS.find((x) => x.book === 'Daniel');
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the profile's own words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'The profile says the two schools "form the foundation" of the company.']];
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
    expect(anchor.length).toBe(37);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no headline stands above it', () => {
  const pattern = () => corpusVerse('1 Chronicles', 28, 19);
  const beware = () => corpusVerse('Colossians', 2, 8);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes 1 Chronicles 28:19`).toContain(pattern());
      expect(at(p), `${p} quotes Colossians 2:8`).toContain(beware());
    }
    expect(at('bigIdea')).toMatch(/1 Chronicles 28:11-12 and 19/);
    expect(at('bigIdea')).toMatch(/Colossians 2:8/);
  });

  it('the frame is laid before the disclosure, the digest and the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = text.indexOf(pattern());
      const disclosure = text.indexOf('A DISCLOSURE');
      const digest = text.indexOf('TLDR');
      const application = text.search(/THREE THINGS THIS WEEK/);
      for (const [name, i] of [
        ['disclosure', disclosure],
        ['digest', digest],
        ['application', application],
      ]) {
        expect(i, `${p} carries the ${name}`).toBeGreaterThan(-1);
        expect(frame, `${p}: the Word comes before the ${name}`).toBeLessThan(i);
      }
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
    }
  });

  it('the advertisements are left out of every place', () => {
    const forbidden = ['Cognition', 'Devin', 'Azure', 'context engine', 'Score your docs', 'referral'];
    for (const [p, s] of STRINGS) {
      for (const term of forbidden) expect(s, `${p} must not carry ${term}`).not.toContain(term);
    }
  });

  it('no model identifier appears anywhere in the module', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d|\bqwen|\bgemini/i);
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
    expect(at('levels.child')).toContain(corpusVerse('John', 1, 29));
  });
});

// -----------------------------------------------------------------------------
// THE DISCLOSURE AND THE TIERS. The item concerns the maker of the tool this
// app is built with, so the relationship is disclosed in every place a reader
// may read alone, and the reported claim is never hardened into a verdict.
// -----------------------------------------------------------------------------
const VERDICT =
  /\b(Anthropic|the company|the maker|its chief executive|the chief executive|the leader|he) (is|was|are) (wicked|evil|godless|dangerous|deceptive|corrupt|deceived|trustworthy|righteous|safe)\b/gi;
/**
 * Verdicts asserted, not denied. The lesson's own guard sentence, "Not that
 * the maker is wicked", DENIES a verdict and must stay legal; the same words
 * without the denial in front of them assert one.
 */
export function verdictsIn(s) {
  return [...String(s).matchAll(VERDICT)].filter((m) => !/\bnot that\s+$/i.test(String(s).slice(Math.max(0, m.index - 12), m.index)));
}
const AS_FACT = /\bthe profile (shows|proves|reveals|demonstrates|establishes)\b/i;
const NAMES = /Amodei|Dario|Daniela|Altman|Brockman/;

describe('the disclosure stands in every teaching place, and the tiers hold', () => {
  it('every teaching place discloses that the app is built with the maker’s tool and the lesson was drafted with it', () => {
    for (const p of TEACHING_PLACES) {
      const t = at(p);
      expect(t, `${p} opens a disclosure`).toContain('A DISCLOSURE');
      expect(t, `${p} names the company`).toContain('Anthropic');
      expect(t, `${p} says the lesson was written with the tool`).toMatch(/(drafted|written) with (that|the) (same )?(tool|helper)/);
    }
    expect(at('bigIdea')).toContain('A DISCLOSURE');
  });

  it('every teaching place keeps the claim in the reported pile and names the shut road with its date', () => {
    for (const p of TEACHING_PLACES) {
      const t = at(p);
      expect(t, `${p} says reported`).toMatch(/reported/);
      expect(t, `${p} says what was not checked`).toContain('WHAT WE DID NOT CHECK');
      expect(t, `${p} names the listed publisher`).toContain('The New York Times');
      expect(t, `${p} tells the report in the other direction`).toMatch(/does not (count|call|regard) himself/);
      expect(t, `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
    }
    expect(at('bigIdea')).toContain('re-review: 2026-11-27');
  });

  it('no verdict on the company or any person, and no reported claim told as shown or proven', () => {
    for (const [p, s] of STRINGS) {
      expect(
        verdictsIn(s).map((m) => m[0]),
        p
      ).toEqual([]);
      expect(s, p).not.toMatch(AS_FACT);
    }
  });

  it('no person is named anywhere in the module', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(NAMES);
  });

  it('even-handed by the Word: reasoning and doing good are quoted as commended before the warning of 1 Corinthians 13', () => {
    const reason = corpusVerse('Isaiah', 1, 18);
    const good = corpusVerse('Galatians', 6, 10);
    const love = corpusVerse('1 Corinthians', 13, 2);
    for (const p of TEACHING_PLACES) {
      const t = at(p);
      for (const v of [reason, good, love]) expect(t, p).toContain(v);
      expect(t.indexOf(reason), `${p}: reasoning commended first`).toBeLessThan(t.indexOf(love));
      expect(t.indexOf(good), `${p}: doing good commended first`).toBeLessThan(t.indexOf(love));
    }
  });

  it('the teaching is applied to every maker, the local open models included', () => {
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/every maker|every company|every tool/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) expect(at(p), p).toMatch(/open models|open engines|free engines/);
  });

  it('PROVEN-TO-CATCH: a planted verdict, a planted "shows", and a planted name are each caught', () => {
    expect(verdictsIn('In the end the company is dangerous to families.')).toHaveLength(1);
    expect(verdictsIn('Not that the maker is wicked, or the tool forbidden.')).toHaveLength(0);
    expect(verdictsIn('The company is in the news this week.')).toHaveLength(0);
    expect(AS_FACT.test('The profile shows the company is built on rationalism.')).toBe(true);
    expect(NAMES.test('a profile of Dario Amodei')).toBe(true);
  });

  it('PROVEN-TO-CATCH: stripping the disclosure from ONE band names that band while the pooled module still carries it', () => {
    const teen = at('levels.teen').replace(/A DISCLOSURE[^\n]*\n/, '');
    const bands = { ...MODULE.levels, teen };
    const short = FOUR_BANDS.filter((b) => !bands[b].includes('A DISCLOSURE'));
    expect(short).toEqual(['teen']);
    expect([MODULE.lesson, ...FOUR_BANDS.map((b) => bands[b])].join('\n')).toContain('A DISCLOSURE');
  });
});

// -----------------------------------------------------------------------------
// OUR OWN HOUSE, MEASURED. Each fact the lesson states is read back from the
// file it came from, so the lesson and the house cannot quietly disagree.
// -----------------------------------------------------------------------------
const REPO = join(process.cwd(), '..');
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');

/** Entries in the house's own A.I. work log up to and including a date, and how many name this maker's tool. */
export function ledgerByMaker(entries, through) {
  const upTo = entries.filter((e) => String(e.date || '') <= through);
  const fromMaker = upTo.filter((e) => /^claude/i.test(String(e.model || '')));
  return { total: upTo.length, fromMaker: fromMaker.length };
}

describe('our own house is traced on its real record', () => {
  it('the house log: every entry through the build day names a tool from the same maker, roughly one hundred and fifty', () => {
    const { entries } = JSON.parse(read('app/src/lib/ai-usage-ledger.json'));
    const { total, fromMaker } = ledgerByMaker(entries, '2026-11-13');
    // 149 before this lesson's own entry on 2026-11-13; siblings landing the
    // same day add a few. The lesson says roughly one hundred and fifty.
    expect(total).toBeGreaterThanOrEqual(145);
    expect(total).toBeLessThanOrEqual(165);
    expect(fromMaker).toBe(total);
    for (const p of ['lesson', 'levels.senior']) expect(at(p), p).toMatch(/roughly one hundred and fifty entries/);
  });

  it('PROVEN-TO-CATCH: an entry from another maker on the build day would break the every-entry claim', () => {
    const { fromMaker, total } = ledgerByMaker(
      [
        { date: '2026-11-13', model: 'claude-x' },
        { date: '2026-11-13', model: 'another-maker-1' },
      ],
      '2026-11-13'
    );
    expect(fromMaker).not.toBe(total);
  });

  it('the house rule: the tool does not improvise theology or treat its training as canonical, and says when unsure', () => {
    const rules = read('CLAUDE.md');
    expect(rules).toMatch(/## The Source of Answers/);
    expect(rules).toMatch(/does NOT improvise theology and does NOT cite training-data theology as if it were canonical/);
    expect(rules).toMatch(/surfaces the uncertainty rather than fabricating certainty/);
    expect(rules).toMatch(/The human governs the bright lines/);
    expect(at('lesson')).toMatch(/not to improvise theology/);
    expect(at('lesson')).toMatch(/Darrell governs/);
  });

  it('the verses come from the stored text, and a gate fails a hand-typed one', () => {
    expect(read('app/src/__tests__/the-author-never-types-a-verse.test.js')).toMatch(/The author never types a verse/);
    expect(read('scripts/sov86-fill.mjs')).toContain("join(ROOT, 'app', 'public', 'bible', 'kjv')");
    expect(at('lesson')).toMatch(/typed by hand/);
  });

  it('the engine list marks the maker’s model not sovereign and costly, reserves it, and keeps two other makers and local engines beside it', () => {
    const vendor = SEED_PROVIDERS.find((p) => p.id === 'vendor-claude');
    expect(vendor.kind).toBe('vendor');
    expect(vendor.sovereign).toBe(false);
    expect(vendor.costTier).toBe('high');
    expect(vendor.notes).toMatch(/Reserve for work the local tier cannot do well/);
    const others = SEED_PROVIDERS.filter((p) => p.kind === 'vendor' && p.id !== 'vendor-claude');
    expect(others.map((p) => p.id).sort()).toEqual(['vendor-gemini', 'vendor-openai']);
    expect(SEED_PROVIDERS.filter((p) => p.kind === 'local').length).toBeGreaterThan(0);
    expect(read('app/src/lib/llm-providers.js')).toMatch(/church GPU node/);
    expect(at('lesson')).toMatch(/two other companies/);
    expect(at('lesson')).toMatch(/not sovereign/);
  });

  it('PROVEN-TO-CATCH: a lesson figure that drifted from the record would be caught', () => {
    expect(/two other companies/.test(at('lesson').replace('two other companies', 'three other companies'))).toBe(false);
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
    const broken = { ...MODULE, levels: { ...MODULE.levels, youth: MODULE.levels.youth.replace(/ask a friend this/g, 'ask someone') } };
    const short = places.filter((p) => {
      const t = p === 'lesson' ? broken.lesson : broken.levels[p.split('.')[1]];
      return !/ask a friend this/.test(t);
    });
    expect(short).toEqual(['levels.youth']);
    const pooled = [broken.lesson, ...FOUR_BANDS.map((b) => broken.levels[b])].join('\n');
    expect(/ask a friend this/.test(pooled)).toBe(true);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-13 by scripts/sov86-fill.mjs: adult 2,098 words; child
    // 0.587 / youth 0.630 / teen 0.636 / senior 0.839; grades 1.85 < 3.59 <
    // 4.22 < 9.30. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2050);
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
