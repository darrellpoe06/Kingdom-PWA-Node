// @vitest-environment node
// =============================================================================
// sov85 — every quotation is the corpus verbatim, the house is traced to its
// real code, and the lesson is whole in every band (DR-1500)
// =============================================================================
// Sovereign A.I. week 85, "And it fell not", was built from one word Darrell
// typed above a forwarded Level Up Coding issue, Chaos Engineering Clearly
// Explained, on 2026-11-03 at 14:26 UTC (8:26 AM Central): Lesson. Gmail thread
// 1a1a1c0f5039a929. The scheduled intake fell behind; it was built 2026-11-13.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467) and sov83 kept:
// every check below drinks from `everyString`, which reaches every string in
// the module, and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The lesson teaches chaos engineering
// and then says our own house already practises it in three places and has
// left it undone in one. Each of those house claims is pinned to the file that
// makes it true: the proven-to-catch rule and its live count, the deploy tests
// that inject faults, the outside witness's steady state, the weekly restore
// drill into a scratch database, and the second road in the deploy lane. The
// GAP the lesson names - no drill closes the first road on purpose - is pinned
// too, so the day a drill lands this file goes red and the lesson is re-read.
// The three tiers are held apart: the discipline is ESTABLISHED (stated without
// a hedge, DR-0100), the newsletter's examples are ILLUSTRATIONS, and the
// restore drill's last result is NOT MEASURED, so no reader place may claim it.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point, and it cannot re-read the run logs of 2026-11-13 the lesson
// teaches from; those run ids live in DR-1500 for a reviewer to open.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';

const ID = 'sov85-and-it-fell-not';
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

// The house writes "Psalm 127:1" and the corpus file is `Psalms.json`, so the
// resolution falls back to the plural form exactly as scripts/sov85-fill.mjs
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

/** Every test file under a directory, walked rather than listed. */
function testFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) testFiles(p, out);
    else if (/\.test\.[cm]?[jt]sx?$/.test(name)) out.push(p);
  }
  return out;
}

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];
const TEACHING_PLACES = ['lesson', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior'];
const OLDER_PLACES = ['lesson', 'levels.youth', 'levels.teen', 'levels.senior'];

describe('sov85 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 85, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(85);
    expect(weeks.filter((w) => w === 85)).toHaveLength(1);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 130 strings on 2026-11-13, MEASURED; pinned low-side.
    expect(STRINGS.length).toBeGreaterThanOrEqual(125);
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
    // 120 quotations across 18 books on 2026-11-13, MEASURED.
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(118);
    expect(BOOKS.length).toBeGreaterThanOrEqual(18);
  });

  it('the book list is DERIVED, and every derived book resolves on disk', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    expect(BOOKS).toContain('Psalm');
    expect(bookFileName('Psalm')).toBe('Psalms');
  });

  it('every quotation anywhere in the module matches the KJV on disk', () => {
    expect(verseFaults(QUOTATIONS)).toEqual([]);
  });

  it('every double-quoted span ANYWHERE is Scripture, so no person is put in quotation marks (DR-0331)', () => {
    expect(nonScriptureQuotes(STRINGS)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a drifted word in a non-reader string is caught', () => {
    const q = QUOTATIONS.find((x) => !READER_PLACES.includes(x.path)) || QUOTATIONS[0];
    expect(verseFaults([{ ...q, text: `${q.text} and more` }])).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a quotation attributed to the wrong verse is caught', () => {
    const q = QUOTATIONS.find((x) => x.book === 'Matthew' && x.chapter === 7 && x.verse === 25);
    expect(q, 'Matthew 7:25 is quoted').toBeTruthy();
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the newsletter's words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'The article says "There will be failures." and means it.']];
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
    expect(anchor.length).toBe(32);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const rock = () => corpusVerse('Matthew', 7, 25);
  const fire = () => corpusVerse('1 Corinthians', 3, 13);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Matthew 7:25`).toContain(rock());
      expect(at(p), `${p} quotes Matthew 7:27`).toContain(corpusVerse('Matthew', 7, 27));
      expect(at(p), `${p} quotes 1 Corinthians 3:13`).toContain(fire());
    }
    expect(at('bigIdea')).toMatch(/Matthew 7:25/);
    expect(at('bigIdea')).toMatch(/1 Corinthians 3:13/);
  });

  it('the frame is laid before the article and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = Math.max(text.indexOf(rock()), text.indexOf(fire()));
      const article = text.search(/chaos engineering/i);
      const application = text.indexOf('FOUR THINGS THIS WEEK');
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(article, `${p} names the discipline`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the article`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('each of the five steps is taught from the Word in every teaching place', () => {
    const pins = [
      ['Proverbs', 27, 23], // the steady state
      ['1 Kings', 18, 34], // the test that could fail
      ['Judges', 7, 4], // the realistic failure
      ['Genesis', 32, 8], // the blast radius and the second band
      ['Lamentations', 3, 40], // the review after
    ];
    for (const p of TEACHING_PLACES) {
      for (const [b, c, v] of pins) expect(at(p), `${p} quotes ${b} ${c}:${v}`).toContain(corpusVerse(b, c, v));
    }
  });

  it('the bright line is in every teaching place: we test our own work, never Yahweh (Deuteronomy 6:16)', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Deuteronomy 6:16`).toContain(corpusVerse('Deuteronomy', 6, 16));
      expect(at(p), `${p} names the line`).toMatch(/never test Yahweh|not to test Yahweh|not testing Yahweh|not to put Him to the test|test of Yahweh/);
    }
  });

  it('the sponsor block is left out of every reader place', () => {
    for (const p of READER_PLACES) {
      for (const term of ['Workday', 'Developer Platform', 'Restack', 'Substack']) expect(at(p), `${p} must not carry ${term}`).not.toContain(term);
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
    for (const p of OLDER_PLACES) {
      expect(at(p), p).toContain(corpusVerse('John', 1, 29));
      expect(at(p), p).toMatch(/Eternal Son of Yahweh/);
    }
  });

  it('PROVEN-TO-CATCH: the generic name planted in our voice is caught, a quoted one is not', () => {
    const strip = (s) => s.replace(/"[^"]*"\s*\([^)]*\)/g, '');
    expect(/\bGod\b/.test(strip('We thank God for the drill.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('Deuteronomy', 6, 16)}" (Deuteronomy 6:16)`))).toBe(false);
  });
});

describe('three tiers held apart: established, illustration, and not measured', () => {
  const CLAIMS_DRILL_PASSED = /(last|latest|most recent) (drill|restore|practice)( run)? (passed|succeeded)|the drill (passed|has passed|is passing)/i;

  it('every teaching place states the discipline as established and carries the dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
      expect(at(p), `${p} names the illustrations as made up`).toMatch(
        /not (real events|reported happenings|reported events)|did not really happen|illustrations?, not/i
      );
    }
    for (const p of OLDER_PLACES) expect(at(p), `${p} says it is settled`).toMatch(/ESTABLISHED|established/);
    // DR-0100: under-claiming a verified truth is a failure too.
    for (const p of TEACHING_PLACES) expect(at(p), p).not.toMatch(/experts disagree|some say|nobody knows whether chaos/i);
  });

  it("no reader place claims the restore drill's last result; the server is named as out of reach", () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(CLAIMS_DRILL_PASSED);
      expect(at(p), `${p} says the server was not reached`).toMatch(/out of reach|could not (reach|see)/i);
    }
  });

  it('the house carries no unchecked-material admission, so the third pile is unmoved (DR-1126)', () => {
    for (const [p, s] of STRINGS) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s), `${p} would count as an unchecked admission`).toBe(false);
    }
  });

  it('PROVEN-TO-CATCH: a claimed drill result and a disclosure phrase are both caught', () => {
    expect(CLAIMS_DRILL_PASSED.test('The last drill passed on Sunday.')).toBe(true);
    expect(CLAIMS_DRILL_PASSED.test('We could not see if its last practice went well.')).toBe(false);
    DISCLOSURE.lastIndex = 0;
    expect(DISCLOSURE.test('WHAT WE DID NOT CHECK: the logs.')).toBe(true);
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  it('no check ships until it catches a planted break, and the count the lesson teaches still stands', () => {
    expect(src('CLAUDE.md')).toMatch(/Proven-to-catch \(anti-theater\)\.\*\* A gate that always passes is itself a lie/);
    // 557 of 1,959 test files on main fd36c00, 2026-11-13, MEASURED with
    // `grep -rl PROVEN-TO-CATCH`; pinned low-side, because the lesson says
    // "more than five hundred" and the number only grows.
    const files = testFiles(join(process.cwd(), 'src', '__tests__'));
    const proven = files.filter((f) => readFileSync(f, 'utf8').includes('PROVEN-TO-CATCH'));
    expect(files.length).toBeGreaterThanOrEqual(1900);
    expect(proven.length).toBeGreaterThan(500);
    for (const p of OLDER_PLACES) expect(at(p), p).toMatch(/five hundred|557/);
  });

  it('the deploy tests inject the faults the lesson names: an unreachable site, an absent database, a hung job', () => {
    const t = src('app/src/__tests__/the-deploy-has-more-than-one-road.test.js');
    expect(t).toMatch(/REFUSES a shell that names no hashed assets, and a shell it cannot fetch/);
    expect(t).toMatch(/a replay that could not run \(docker or the database away\) is DEGRADED/);
    expect(t).toMatch(/the wall clock is a hard ceiling: a hung replay is killed/);
  });

  it('the outside witness defines the steady state, and unknown freshness never reads as fresh', () => {
    const y = src('.github/workflows/site-health.yml');
    for (const m of ['1. UP', '2. INTACT', '3. FRESH', '5. USABLE']) expect(y, m).toContain(m);
    expect(y).toMatch(/UNKNOWN never reads as fresh/);
    for (const p of OLDER_PLACES) expect(at(p), p).toMatch(/newest/);
  });

  it('the restore drill runs weekly into a scratch database and never writes to the live one', () => {
    const sh = src('infra/nas-db-backup/db_backup.sh');
    expect(sh).toMatch(/A backup that has never been restored is a claim\./);
    expect(sh).toMatch(/SCRATCH="poetech_restore_drill"/);
    expect(sh).toMatch(/never writes to the live database/);
    expect(sh).toMatch(/DRILL_EVERY_DAYS="\$\{BACKUP_DRILL_EVERY_DAYS:-7\}"/);
    for (const p of OLDER_PLACES) expect(at(p), p).toMatch(/never been restored is (only )?a claim/);
  });

  it('the deploy has a second road and fails closed, keeping the live build', () => {
    const y = src('.github/workflows/deploy-cloudflare-pages.yml');
    expect(y).toMatch(/continue-on-error: true/);
    expect(y).toMatch(/python3 scripts\/served-anon-key\.py/);
    expect(y).toMatch(/anon key road: \$ROAD/);
    expect(y).toMatch(/The live site keeps its current build\./);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/second road|second route/);
  });

  it('THE GAP the lesson names: no drill closes the first road on purpose', () => {
    // WHEN THIS GOES RED because the deploy lane gained a deliberate road-closing
    // drill, the gap is closed: rewrite the day-the-rain-came movement in every
    // band to say so, and close DR-1500's re-review.
    const y = src('.github/workflows/deploy-cloudflare-pages.yml');
    expect(y).not.toMatch(/drill/i);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/on purpose|deliberately/);
    expect(at('lesson')).toMatch(/proven by real storms, not by a drill/);
  });

  it('timed automation carries the brakes the lesson calls abort conditions', () => {
    const c = src('CLAUDE.md');
    expect(c).toMatch(/## Autonomous Automation Requires Three Brakes/);
    expect(c).toMatch(/\*\*A budget\*\*/);
    expect(c).toMatch(/\*\*A concurrency lock\*\*/);
    expect(at('lesson')).toMatch(/brakes/);
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
    // MEASURED 2026-11-13 by scripts/sov85-fill.mjs: adult 2,793 words; child
    // 0.512 / youth 0.612 / teen 0.624 / senior 0.620; grades 1.53 < 4.69 <
    // 5.67 < 9.18. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2750);
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
