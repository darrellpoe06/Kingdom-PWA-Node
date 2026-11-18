// @vitest-environment node
// =============================================================================
// sov89 - every quotation is the corpus verbatim, the house is traced to its
// real files, and the lesson is whole in every band (DR-1546)
// =============================================================================
// Sovereign A.I. week 89, "Take thee again another roll", was built from one
// word Darrell typed above a forwarded Level Up Coding issue, Redis vs
// Memcached (2026-11-16): Lesson. Gmail thread 1a1e43310d023259. Built
// 2026-11-18 by scripts/sov89-fill.mjs.
//
// SHAPE. sov88's one-traversal shape: every check drinks from `everyString`,
// and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The tiers are held apart: the near copy
// and both tools are ESTABLISHED; each tool's limits and defaults are REPORTED
// as the newsletter's; the house is MEASURED; what Immich keeps in its Valkey
// is NOT VERIFIED and that store's memory use is NOT MEASURED, so no reader
// place may put a number on it. The house claims are pinned to the files that
// make them true - the Immich compose file, the SearXNG seed, the service
// worker and the clip cache - so if those move, this file goes red and the
// lesson is re-read.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';

const ID = 'sov89-take-thee-again-another-roll';
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
// resolution falls back to the plural form exactly as scripts/sov89-fill.mjs
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

// MEASURED 2026-11-18 on the spliced module: 134 strings, 122 quotations across
// 13 books, 30 anchor references. Floors pinned a
// little low; the anchor exact.
const STRINGS_FLOOR = 130;
const QUOTATIONS_FLOOR = 118;
const BOOKS_FLOOR = 13;
const ANCHOR_COUNT = 30;

describe('sov89 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 89, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks.filter((w) => w === 89)).toHaveLength(1);
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
    ]) {
      expect(paths, `${p} must be swept`).toContain(p);
    }
    expect(QUOTATIONS.filter((q) => !READER_PLACES.includes(q.path)).length, 'the sweep must reach past the reader places').toBeGreaterThan(0);
  });
});

describe('every quotation is the corpus verbatim', () => {
  it('there are quotations to check, across the books the module itself names', () => {
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(QUOTATIONS_FLOOR);
    expect(BOOKS.length).toBeGreaterThanOrEqual(BOOKS_FLOOR);
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    for (const b of ['Genesis', 'Exodus', 'Jeremiah']) expect(BOOKS).toContain(b);
  });

  it('every quotation anywhere in the module matches the KJV on disk', () => {
    expect(verseFaults(QUOTATIONS)).toEqual([]);
  });

  it('every double-quoted span ANYWHERE is Scripture, so no person is put in quotation marks (DR-0331)', () => {
    expect(nonScriptureQuotes(STRINGS)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a drifted word, a wrong verse, and a quoted newsletter line are each caught', () => {
    const q = QUOTATIONS.find((x) => x.book === 'Jeremiah' && x.chapter === 36 && x.verse === 28);
    expect(q, 'Jeremiah 36:28 is quoted').toBeTruthy();
    expect(verseFaults([{ ...q, text: `${q.text} and more` }])).toHaveLength(1);
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
    expect(nonScriptureQuotes([['lesson', 'The newsletter says "A good cache needs the right responsibilities." plainly.']])).toHaveLength(1);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const anchor = (MODULE?.anchor?.ref || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const readerQuoted = new Set(QUOTATIONS.filter((q) => READER_PLACES.includes(q.path)).map((q) => `${q.book} ${q.chapter}:${q.verse}`));

  it('the anchor and the reader quotations are the same set, and it resolves', () => {
    expect(anchor.filter((r) => !readerQuoted.has(r))).toEqual([]);
    expect([...readerQuoted].filter((r) => !anchor.includes(r))).toEqual([]);
    expect(anchor.length).toBe(ANCHOR_COUNT);
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const store = () => corpusVerse('Genesis', 41, 35);
  const roll = () => corpusVerse('Jeremiah', 36, 28);

  it('every teaching place quotes both frame verses before the cache and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      expect(text, `${p} quotes Genesis 41:35`).toContain(store());
      expect(text, `${p} quotes Jeremiah 36:28`).toContain(roll());
      const frame = Math.max(text.indexOf(store()), text.indexOf(roll()));
      const article = text.search(/\bcache\b/i);
      const application = text.indexOf('FOUR THINGS THIS WEEK');
      expect(article, `${p} names the cache`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the cache`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
    expect(at('bigIdea')).toMatch(/Genesis 41:35-36/);
    expect(at('bigIdea')).toMatch(/Jeremiah 36:28/);
  });

  it('every teaching place names both tools and carries the manna, the stampede and the durable record', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).toContain('Memcached');
      expect(at(p), p).toContain('Redis');
      expect(at(p), `${p} quotes Exodus 16:24`).toContain(corpusVerse('Exodus', 16, 24));
      expect(at(p), `${p} quotes Genesis 41:56`).toContain(corpusVerse('Genesis', 41, 56));
      expect(at(p), `${p} quotes Exodus 16:33`).toContain(corpusVerse('Exodus', 16, 33));
    }
  });

  it('the sponsor block is left out, neither tool is ranked, and no model identifier or DR is recited at a reader', () => {
    for (const p of READER_PLACES) {
      expect(at(p), p).not.toMatch(/Tempo|portfolio management/i);
      expect(at(p), `${p} recites a decision record`).not.toMatch(/DR-\d{4}/);
    }
    for (const [p, s] of STRINGS) {
      expect(s, p).not.toMatch(/(the )?best (tool|cache|choice)|is the winner|clearly better than/i);
      expect(s, p).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d/i);
    }
  });

  it('our voice names Yahweh, not the generic name, outside quotations (DR-0210), and confesses the Lamb and the Eternal Son', () => {
    for (const [p, s] of STRINGS) expect(s.replace(/"[^"]*"\s*\([^)]*\)/g, ''), p).not.toMatch(/\bGod\b/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), p).toContain(corpusVerse('John', 1, 29));
      expect(at(p), p).toMatch(/Eternal Son of Yahweh/);
    }
  });

  it('adversary names never appear capitalized', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(/\b(Satan|Lucifer|Baal)\b/);
  });
});

describe('the tiers held apart: established, reported, measured, not verified, not measured', () => {
  it('every teaching place carries the dated re-review and says the limits came from the newsletter', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-12-18');
      expect(at(p), p).toMatch(/REPORTED|Reported|reported as given|came only from the email|came from the newsletter/);
      expect(at(p), p).toMatch(/real/);
      expect(at(p), p).not.toMatch(/nobody knows what a cache|experts disagree|some say/i);
    }
  });

  it('no reader place puts a number on the Valkey store’s memory, and each says it was not measured or counted', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/Valkey[^.]{0,80}\b\d+\s?(MB|GB|megabytes|gigabytes)\b/i);
      expect(at(p), `${p} says it was not measured`).toMatch(/not (counted|measured)|did not count|has not been measured|was not measured/i);
    }
  });

  it('the house carries no unchecked-material admission, so the third pile is unmoved (DR-1126)', () => {
    for (const [p, s] of STRINGS) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s), `${p} would count as an unchecked admission`).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the files', () => {
  it('the app and our own NAS code run no Redis and no Memcached client', () => {
    const appPkg = src('app/package.json');
    expect(appPkg).not.toMatch(/"(redis|ioredis|memcached|memjs|valkey)[^"]*"\s*:/);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/(does not|do not) (run|use) (Redis|Memcached)|runs? no Redis|neither Redis nor Memcached/);
  });

  it('the one Redis-family store is Valkey 9 in the Immich stack, with no memory limit, no policy and no volume set', () => {
    const compose = src('infra/nas-immich/docker-compose.yml');
    expect(compose).toMatch(/redis:\n\s+image: docker\.io\/valkey\/valkey:9@sha256:/);
    const block = compose.slice(compose.indexOf('  redis:'), compose.indexOf('  database:'));
    expect(block).toContain('poetech-immich-valkey');
    expect(block).not.toMatch(/maxmemory|volumes:|command:/);
    expect(compose).toMatch(/REDIS_HOSTNAME: "redis"/);
    expect(compose).toMatch(/the photos are still a folder of files/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) expect(at(p), p).toMatch(/Valkey/);
  });

  it('PROVEN-TO-CATCH: a maxmemory line added to the Valkey service would turn the pin red', () => {
    const planted = '  redis:\n    image: x\n    command: valkey-server --maxmemory 256mb\n  database:';
    expect(planted.slice(planted.indexOf('  redis:'), planted.indexOf('  database:'))).toMatch(/maxmemory|volumes:|command:/);
  });

  it('the search engine runs its limiter off because the house runs no Valkey for it', () => {
    const seed = src('infra/nas-research/searxng.seed.yml');
    expect(seed).toMatch(/the limiter needs a valkey we do\s*\n\s*# not run/);
    expect(seed).toMatch(/limiter: false/);
  });

  it('the service worker keeps one store per build and deletes the rest on activate, save the keep caches', () => {
    const sw = src('app/public/sw.js');
    expect(sw).toMatch(/const CACHE = 'poetech-' \+ SW_VERSION;/);
    expect(sw).toMatch(/var KEEP_PREFIX = 'poetech-keep-';/);
    expect(sw).toMatch(/k !== CACHE && k\.indexOf\(KEEP_PREFIX\) !== 0\)\.map\(\(k\) => caches\.delete\(k\)\)/);
  });

  it('the clip store is cache-aside on IndexedDB, least recently played over a 300 MB cap, downloads held, two in flight', async () => {
    const cc = src('app/src/lib/clip-cache.js');
    expect(cc).toMatch(/least-recently-played clips go first/);
    expect(cc).toMatch(/never evicted while held/);
    const mod = await import('../lib/clip-cache.js');
    expect(mod.DEFAULT_CAP_MB).toBe(300);
    expect(mod.AHEAD_CONCURRENCY).toBe(2);
    for (const p of TEACHING_PLACES.filter((x) => x !== 'levels.child'))
      expect(at(p), p).toMatch(/two (clips )?(at a time|at once)|exactly two|only two clips/);
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
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements hold their ladder', () => {
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2400);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    for (const b of FOUR_BANDS) expect(overlapOf(MODULE.levels[b], MODULE.lesson)).toBeLessThan(0.25);
  });

  it('every band names its lesson at its start', () => {
    for (const b of FOUR_BANDS) expect(MODULE.levels[b].startsWith(MODULE.title)).toBe(true);
  });
});
