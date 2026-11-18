// @vitest-environment node
// =============================================================================
// sov87 — every quotation is the corpus verbatim, the newsletter's account is
// never told as a checked fact, the lesson is its OWN teaching and not week
// 81's again, our own house is measured, and the lesson is whole in every band
// (DR-1501)
// =============================================================================
// Sovereign A.I. week 87, "Cleanse thou me from secret faults", was built from
// one word Darrell typed above a forwarded IT Brew issue (Site unseen) on
// 2026-11-09 at 21:50 UTC, 3:50 PM CST: Lesson. Gmail thread 1a1c24a55626cb1c.
// The intake lane fell behind; it was built from the backlog on 2026-11-13.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467) and sov82 kept:
// every check drinks from `everyString`, and the book list is DERIVED from the
// quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON.
//   * ONE TEACHING, ONE LESSON (DR-0610). sov81 (DR-1478) already taught the
//     PHP fix that was known and not applied, framed on James 4:17 and
//     Proverbs 27:23. This lesson must NAME week 81 in every teaching place and
//     must not re-quote that frame, so a later edit cannot quietly turn it into
//     a second copy of week 81.
//   * THE NEWSLETTER'S ACCOUNT STAYS ITS ACCOUNT (DR-0076 section 8). The 2014
//     date was not confirmed by any source this session could read, so every
//     sentence that carries it must also say whose account it is.
//   * OUR OWN HOUSE IS READ BACK from the files each figure came from, so a
//     figure that drifts from the code fails here rather than on a reader. The
//     one figure that cannot be read back offline (five single-publisher
//     packages, from the public registry) is required to carry its date.
//   * Nobody but Scripture in double quotation marks (DR-0331).
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov87-cleanse-thou-me-from-secret-faults';
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

// The house writes "Psalm 19:12" and the corpus file is `Psalms.json`, so the
// resolution falls back to the plural form exactly as scripts/sov87-fill.mjs
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

// MEASURED 2026-11-13 on the spliced tree: 128 quotations across 14 books; pinned low-side.
const QUOTATION_FLOOR = 125;
const BOOK_FLOOR = 14;

describe('sov87 is in the catalog and is the whole lesson', () => {
  it('the module exists, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(87);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    expect(STRINGS.length).toBeGreaterThanOrEqual(110);
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
    expect(BOOKS, 'the lesson quotes the psalms').toContain('Psalm');
    expect(bookFileName('Psalm')).toBe('Psalms');
    // Leading-ordinal books are reached by the same derivation, not a typed list.
    for (const b of ['2 Kings', '1 Peter', '1 Corinthians', '1 Timothy']) expect(BOOKS).toContain(b);
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
    const q = QUOTATIONS.find((x) => x.book === '2 Kings');
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the security officer's words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'Tenable\'s officer said "open source is everywhere" in the story.']];
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
    expect(anchor.length).toBe(31);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const secret = () => corpusVerse('Psalm', 19, 12);
  const breaches = () => corpusVerse('2 Kings', 12, 6);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Psalm 19:12`).toContain(secret());
      expect(at(p), `${p} quotes 2 Kings 12:6`).toContain(breaches());
    }
    expect(at('bigIdea')).toMatch(/Psalm 19:12/);
    expect(at('bigIdea')).toMatch(/2 Kings 12:5-6/);
  });

  it('the frame is laid before the newsletter is named and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = text.indexOf(secret());
      const article = text.indexOf('IT Brew');
      const application = text.search(/THREE THINGS THIS WEEK/);
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(article, `${p} names the newsletter`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the newsletter`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('the advertisement and the other stories are left out of every place', () => {
    const forbidden = ['Coveron', 'NordVPN', 'identity bundle', 'dark web', 'Goldblum', 'Will Smith', 'Anex-Ries', 'Adaptavist', 'referral'];
    for (const [p, s] of STRINGS) {
      for (const term of forbidden) expect(s, `${p} must not carry ${term}`).not.toContain(term);
    }
  });

  it('no model identifier appears anywhere in the module', () => {
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d|\bGemini \d/i);
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

  it('Jesus is confessed as the Lamb in every teaching place, and as the Eternal Son in the adult lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) expect(at(p), p).toContain(corpusVerse('John', 1, 29));
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), p).toMatch(/Eternal Son of Yahweh/);
      expect(at(p), `${p} names the Lamb without blemish`).toContain(corpusVerse('1 Peter', 1, 19));
    }
  });

  it('PROVEN-TO-CATCH: the generic name planted in our voice is caught, a quoted one is not', () => {
    const strip = (s) => s.replace(/"[^"]*"\s*\([^)]*\)/g, '');
    expect(/\bGod\b/.test(strip('We thank God for the keepers.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('John', 1, 29)}" (John 1:29)`))).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// ONE TEACHING, ONE LESSON (DR-0610). Week 81 already taught the fix that was
// known and not applied; this week must say so and must not become it again.
// -----------------------------------------------------------------------------
describe('this lesson is its own teaching, not week 81 again', () => {
  const week81 = SOVEREIGN_AI_MODULES.find((m) => m.id === 'sov81-what-hast-thou-that-thou-didst-not-receive');
  const sov81Frame = [corpusVerse('James', 4, 17), corpusVerse('Proverbs', 27, 23)];

  it('week 81 is in the catalog, and every teaching place here names it', () => {
    expect(week81, 'the lesson this one points to must exist').toBeTruthy();
    for (const p of TEACHING_PLACES.filter((x) => x !== 'levels.child')) {
      expect(at(p), `${p} names week 81`).toMatch(/[Ww]eek 81|eighty-first week/);
    }
    expect(at('bigIdea')).toMatch(/Week 81/);
  });

  it("week 81's frame verses are not re-quoted anywhere in this module", () => {
    for (const [p, s] of STRINGS) for (const v of sov81Frame) expect(s.includes(v), `${p} re-quotes week 81's frame`).toBe(false);
  });

  it('the two frames do not overlap: Psalm 19:12 and 2 Kings 12:6 are not week 81’s', () => {
    expect(week81.lesson.includes(corpusVerse('Psalm', 19, 12))).toBe(false);
    expect(week81.lesson.includes(corpusVerse('2 Kings', 12, 6))).toBe(false);
  });

  it('PROVEN-TO-CATCH: a planted James 4:17 quotation would be named', () => {
    const planted = `${at('lesson')} "${sov81Frame[0]}" (James 4:17)`;
    expect(sov81Frame.some((v) => planted.includes(v))).toBe(true);
  });
});

describe("the newsletter's account is never told as a checked fact", () => {
  const ATTRIBUTION = /newsletter|email|reported|the story|its account|what the|said|confirm/i;
  const sentencesWith = (text, needle) =>
    text
      .replace(/"[^"]*"\s*\([^)]*\)/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.includes(needle));

  it('every teaching place names the shut road and carries the dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} names the host it could not open`).toContain('www.itbrew.com');
      expect(at(p), `${p} says what was not checked`).toContain('WHAT WE DID NOT CHECK');
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
    }
    expect(at('bigIdea')).toContain('re-review: 2026-11-27');
  });

  it('every sentence that carries the 2014 date also says whose account it is', () => {
    for (const [p, s] of STRINGS) {
      for (const sentence of sentencesWith(s, '2014')) expect(sentence, `${p}: ${sentence.slice(0, 80)}`).toMatch(ATTRIBUTION);
    }
  });

  it('the established parts are stated plainly, not hedged into nobody-knows (DR-0100)', () => {
    for (const p of TEACHING_PLACES) expect(at(p), p).not.toMatch(/nobody knows|no one knows|experts disagree/i);
  });

  it('PROVEN-TO-CATCH: the date planted as a bare fact is caught', () => {
    const planted = 'The flaw in PHP had been there since 2014. It was found in the fall.';
    expect(sentencesWith(planted, '2014').every((s) => ATTRIBUTION.test(s))).toBe(false);
  });

  it('PROVEN-TO-CATCH: a band with the date stripped is named', () => {
    const stripped = at('levels.child').replace('re-review: 2026-11-27', '');
    expect(stripped.includes('re-review: 2026-11-27')).toBe(false);
    expect(at('levels.child').includes('re-review: 2026-11-27')).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// OUR OWN HOUSE, MEASURED. Each figure the lesson states is read back from the
// file it came from, so the lesson and the code cannot quietly disagree.
// -----------------------------------------------------------------------------
const REPO = join(process.cwd(), '..');
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');

function walkFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

describe('our own house is traced on its real record', () => {
  const pkg = JSON.parse(read('app/package.json'));
  const lock = JSON.parse(read('app/package-lock.json'));
  const installed = Object.entries(lock.packages || {}).filter(([k]) => k.startsWith('node_modules/') || k.includes('/node_modules/'));

  it('eleven shipped and seventeen build-and-test packages are named, as the lesson says', () => {
    // 11 and 17 on 2026-11-13. Ordinary growth of a package or two is tolerated
    // so a lesson does not fail on a routine dependency; a large drift is not.
    const deps = Object.keys(pkg.dependencies || {}).length;
    const dev = Object.keys(pkg.devDependencies || {}).length;
    expect(deps).toBeGreaterThanOrEqual(9);
    expect(deps).toBeLessThanOrEqual(14);
    expect(dev).toBeGreaterThanOrEqual(14);
    expect(dev).toBeLessThanOrEqual(21);
    expect(at('lesson')).toMatch(/eleven packages/);
    expect(at('lesson')).toMatch(/seventeen more/);
  });

  it('the lock file installs about five hundred and seventy-eight, and about one hundred and sixty-one ask for support', () => {
    // 578 installed and 161 with a `funding` entry on 2026-11-13, MEASURED.
    expect(installed.length).toBeGreaterThanOrEqual(520);
    expect(installed.length).toBeLessThanOrEqual(650);
    const funding = installed.filter(([, v]) => v && v.funding).length;
    expect(funding).toBeGreaterThanOrEqual(140);
    expect(funding).toBeLessThanOrEqual(185);
    expect(at('lesson')).toMatch(/five hundred and seventy-eight installed packages/);
    expect(at('lesson')).toMatch(/one hundred and sixty-one carry a note/);
  });

  it('not one file in the repository is written in PHP, so the lesson does not pretend the flaw reached it', () => {
    const files = walkFiles(REPO);
    expect(files.length, 'the walk reaches the repository').toBeGreaterThan(1000);
    expect(files.filter((f) => /\.php\d?$/i.test(f))).toEqual([]);
    expect(at('lesson')).toMatch(/not one file in this app's code is written in PHP/);
  });

  it('PROVEN-TO-CATCH: a PHP file would be found by the same filter', () => {
    expect(['/x/site/index.php', '/x/a.js'].filter((f) => /\.php\d?$/i.test(f))).toEqual(['/x/site/index.php']);
  });

  it('the spreadsheet reader is held with a reason and a date, exactly as the lesson tells it', () => {
    const allow = JSON.parse(read('scripts/dependency-audit-allowlist.json'));
    const x = allow.entries.find((e) => e.name === 'xlsx');
    expect(x, 'the xlsx deferral exists').toBeTruthy();
    expect(x.scope).toBe('prod');
    expect(x.why).toMatch(/no fixed release/);
    expect(x.why).toMatch(/moved off npm/);
    expect(x.why).toMatch(/the signed-in person chooses to upload/);
    expect(x.reReview).toBe('2026-12-05');
    expect(at('lesson')).toMatch(/the fifth of December/);
  });

  it('the registry figure, which cannot be read back offline, carries its date in every place that states it', () => {
    for (const p of TEACHING_PLACES.filter((x) => x !== 'levels.child')) {
      const t = at(p);
      expect(t, `${p} states the single-publisher count`).toMatch(/five of (the )?eleven|eleven packages[^.]*, five/i);
      expect(t, `${p} dates it`).toMatch(/thirteenth of November|November 13/);
    }
  });

  it('the house had no automated eye before late July and no package audit before 5 November; the first found twenty-one', () => {
    expect(read('.github/dependabot.yml')).toMatch(/2026-07-30 access evaluation\): the repo had NO\s*\n#\s*automated eye on dependency CVEs/);
    const guard = read('scripts/dependency-audit-guard.mjs');
    expect(guard).toMatch(/DR-1330 D3 \(2026-11-05\)/);
    expect(guard).toMatch(/ran anywhere in 95 workflows/);
    expect(guard).toMatch(/21 known vulnerabilities \(2 critical, 6\s*\n\/\/\s*high\)\. `npm audit fix` cleared 8 the same hour/);
    expect(at('lesson')).toMatch(/twenty-one known vulnerabilities, two of them critical and six high/);
    expect(at('lesson')).toMatch(/ninety-five automated jobs/);
  });

  it('the habit now in place is real: the guard runs in CI, the ranking is weekly and on the OpsBoard, updates never merge unattended', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/- run: node \.\.\/scripts\/dependency-audit-guard\.mjs/);
    expect(read('.github/workflows/exposure-report.yml')).toMatch(/- cron: '17 14 \* \* 3'/);
    expect(read('app/src/components/OpsBoard.jsx')).toMatch(/<ExposureStrip \/>/);
    expect(read('.github/dependabot.yml')).toMatch(/nothing here ever\s*\n#\s*merges unattended/);
  });

  it('no private person beyond Darrell is named in any reader place', () => {
    for (const p of READER_PLACES) expect(at(p), p).not.toMatch(/Sterling|Shay|Moore Divahs|Korsunsky/);
  });

  it('PROVEN-TO-CATCH: a lesson figure that drifted from the lock file would be caught', () => {
    expect(/five hundred and seventy-eight installed packages/.test(at('lesson').replace('five hundred and seventy-eight', 'four hundred'))).toBe(false);
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
    const broken = { ...MODULE, levels: { ...MODULE.levels, senior: MODULE.levels.senior.replace(/ask a friend this/g, 'ask someone') } };
    const short = places.filter((p) => {
      const t = p === 'lesson' ? broken.lesson : broken.levels[p.split('.')[1]];
      return !/ask a friend this/.test(t);
    });
    expect(short).toEqual(['levels.senior']);
    const pooled = [broken.lesson, ...FOUR_BANDS.map((b) => broken.levels[b])].join('\n');
    expect(/ask a friend this/.test(pooled)).toBe(true);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-13 by scripts/sov87-fill.mjs: adult 2,288 words; child
    // 0.555 / youth 0.681 / teen 0.734 / senior 0.757; grades 1.31 < 3.37 <
    // 4.78 < 8.35. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2200);
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
