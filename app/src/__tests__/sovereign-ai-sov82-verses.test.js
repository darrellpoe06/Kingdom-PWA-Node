// @vitest-environment node
// =============================================================================
// sov82 — every quotation is the corpus verbatim, a preview is never told as
// the article, our own house is measured, and the lesson is whole in every
// band (DR-1486)
// =============================================================================
// Sovereign A.I. week 82, "How beautiful are the feet", was built from one word
// Darrell typed above a forwarded ByteByteGo newsletter (Data Movement
// Strategies In System Design) on 2026-10-29 at 18:38 UTC, 1:38 PM CDT: Lesson.
// Gmail thread 1a1885689c5c2ffc. The intake lane fell behind; it was built
// from the backlog on 2026-11-13.
//
// SHAPE. The same one-traversal shape sov80 settled on (DR-1467): every check
// below drinks from `everyString`, which reaches every string in the module,
// and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The email was a PREVIEW of a paid
// article (four paragraphs and nine topics), and the article itself would not
// open from our network. So nothing the article says is reported: the lesson
// may not attribute any benefit or any choosing advice to the newsletter, and
// every teaching place names the shut road with a dated re-review (DR-0076
// section 8). The strategies are taught as established engineering (DR-0100).
// The household application is MEASURED from this repository and each figure
// the lesson states is pinned below against the code it came from, so a
// figure that drifts from the code fails here rather than on a reader. And
// the lesson puts nobody but Scripture in double quotation marks (DR-0331).
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names. It cannot prove the lesson chose the RIGHT verse for
// the point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov82-how-beautiful-are-the-feet';
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
// resolution falls back to the plural form exactly as scripts/sov82-fill.mjs
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

// MEASURED 2026-11-13 on the spliced tree: 161 quotations across 15 books, 127 strings; pinned low-side.
const QUOTATION_FLOOR = 155;
const BOOK_FLOOR = 15;

describe('sov82 is in the catalog and is the whole lesson', () => {
  it('the module exists, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(82);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 127 strings on 2026-11-13, MEASURED; pinned low-side.
    expect(STRINGS.length).toBeGreaterThanOrEqual(120);
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
    // 161 quotations across 15 books on 2026-11-13, MEASURED (the floors above).
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(QUOTATION_FLOOR);
    expect(BOOKS.length).toBeGreaterThanOrEqual(BOOK_FLOOR);
  });

  it('the book list is DERIVED, and every derived book resolves on disk', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} must resolve to a file on disk`).toBeTruthy();
    expect(BOOKS, 'the lesson quotes the psalms').toContain('Psalm');
    expect(bookFileName('Psalm')).toBe('Psalms');
    // Leading-ordinal books are reached by the same derivation, not a typed list.
    for (const b of ['2 Samuel', '1 Kings']) expect(BOOKS).toContain(b);
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
    const q = QUOTATIONS.find((x) => x.book === '2 Samuel');
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: Darrell's August question put in quotation marks would be caught", () => {
    const planted = [['lesson', 'Darrell asked "why does it need to be time based" in August.']];
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
    expect(anchor.length).toBe(43);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const sent = () => corpusVerse('Romans', 10, 15);
  const faithful = () => corpusVerse('Proverbs', 25, 13);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Romans 10:15`).toContain(sent());
      expect(at(p), `${p} quotes Proverbs 25:13`).toContain(faithful());
    }
    expect(at('bigIdea')).toMatch(/Romans 10:14-15/);
    expect(at('bigIdea')).toMatch(/Proverbs 25:13/);
  });

  it('the frame is laid before the newsletter is named and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = text.indexOf(sent());
      const article = text.indexOf('ByteByteGo');
      const application = text.search(/THREE THINGS THIS WEEK/);
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(article, `${p} names the newsletter`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the newsletter`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('the advertisement is left out of every place', () => {
    const forbidden = ['Proton', 'password manager', 'Claim a free month', 'CLOUD Act', 'Switzerland'];
    for (const [p, s] of STRINGS) {
      for (const term of forbidden) expect(s, `${p} must not carry ${term}`).not.toContain(term);
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
    expect(/\bGod\b/.test(strip('We thank God for the runners.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('John', 1, 29)}" (John 1:29)`))).toBe(false);
  });
});

describe('a preview is never told as the article', () => {
  it('every teaching place names the shut road, says it was a preview, and carries the dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} names the host it could not open`).toContain('blog.bytebytego.com');
      expect(at(p), `${p} says what was not checked`).toContain('WHAT WE DID NOT CHECK');
      expect(at(p), `${p} says it was only a preview`).toMatch(/preview|only the start/);
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
    }
    expect(at('bigIdea')).toContain('re-review: 2026-11-27');
  });

  it('nothing is attributed to the article that the preview did not contain', () => {
    // The preview held four paragraphs and nine topic headings. A sentence that
    // reports what ByteByteGo SAYS, RECOMMENDS, ADVISES or ARGUES would be a
    // claim nobody read (DR-0076 section 8).
    const attributed =
      /ByteByteGo (says|said|recommends|recommended|advises|advised|argues|argued|suggests|warns)|the (article|newsletter) (says|recommends|advises|argues|suggests|warns)/i;
    for (const [p, s] of STRINGS) expect(s, p).not.toMatch(attributed);
  });

  it('the strategies are taught plainly as established, not hedged into nobody-knows (DR-0100)', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/nobody knows|no one knows|experts disagree/i);
    }
    expect(at('lesson')).toMatch(/established/);
    expect(at('levels.senior')).toMatch(/established/);
  });

  it('PROVEN-TO-CATCH: a planted attribution to the article is caught', () => {
    const attributed =
      /ByteByteGo (says|said|recommends|recommended|advises|advised|argues|argued|suggests|warns)|the (article|newsletter) (says|recommends|advises|argues|suggests|warns)/i;
    expect(attributed.test('ByteByteGo recommends push for every case.')).toBe(true);
    expect(attributed.test('The newsletter was ByteByteGo.')).toBe(false);
  });

  it('PROVEN-TO-CATCH: a band with the date stripped is named', () => {
    const stripped = at('levels.child').replace('re-review: 2026-11-27', '');
    expect(stripped.includes('re-review: 2026-11-27')).toBe(false);
    expect(at('levels.child').includes('re-review: 2026-11-27')).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// OUR OWN HOUSE, MEASURED. Each figure the lesson states is read back from the
// code it came from, so the lesson and the code cannot quietly disagree.
// -----------------------------------------------------------------------------
const REPO = join(process.cwd(), '..');
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');

function walkSources(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '__tests__' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkSources(p, out);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('our own house is traced on its real record', () => {
  const sources = walkSources(join(process.cwd(), 'src'));

  it('the count of files that listen for database changes is the measured one', () => {
    const listeners = sources.filter((f) => readFileSync(f, 'utf8').includes('postgres_changes'));
    // 37 on 2026-11-13. The lesson says thirty-seven; a drift of a few files is
    // tolerated so ordinary growth does not fail a lesson, a large one is not.
    expect(listeners.length).toBeGreaterThanOrEqual(33);
    expect(listeners.length).toBeLessThanOrEqual(45);
    expect(at('lesson')).toMatch(/thirty-seven files/);
  });

  it('the message surface listens for changes and reads the record again on each notice', () => {
    const dm = read('app/src/lib/direct-messages-sync.js');
    expect(dm).toMatch(/\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'direct_messages' \}, \(\) => \{ refresh\(\); \}\)/);
    expect(dm).toMatch(/const DM_HEARTBEAT_MS = 15000;/);
    expect(dm).toMatch(/document\.visibilityState === 'hidden'\) return;/);
    expect(read('app/src/components/Messages.jsx')).toMatch(
      /\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'group_messages' \}, refresh\)/
    );
    expect(at('lesson')).toMatch(/every fifteen seconds and never while the screen is hidden/);
  });

  it('no long polling and no server-sent events in the app’s own code, as the lesson says', () => {
    const fnDir = join(process.cwd(), 'functions');
    // Lesson catalogs TEACH these words; they are prose, not transport code.
    const isCatalog = (f) => /-class\.js$|[\\/]living-lessons[\\/]|-course\.js$/.test(f);
    const all = [...sources, ...(existsSync(fnDir) ? walkSources(fnDir) : [])].filter((f) => !isCatalog(f));
    expect(all.length, 'the scan reaches the app code').toBeGreaterThan(200);
    const sse = all.filter((f) => /new EventSource|text\/event-stream/.test(readFileSync(f, 'utf8')));
    const longPoll = all.filter((f) => /long[- ]?poll/i.test(readFileSync(f, 'utf8')));
    expect(sse).toEqual([]);
    expect(longPoll).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an EventSource in app code would be found by the same scan', () => {
    expect(/new EventSource|text\/event-stream/.test("const es = new EventSource('/n8n/stream');")).toBe(true);
  });

  it('the Inbound screen polls every five minutes', () => {
    expect(read('app/src/components/Inbound.jsx')).toMatch(/setInterval\(fetchInbound, 5 \* 60 \* 1000\)/);
  });

  it('the site checker is requested every ten minutes and its measured cadence is the one the lesson tells', () => {
    const wf = read('.github/workflows/site-health.yml');
    expect(wf).toMatch(/- cron: '\*\/10 \* \* \* \*'/);
    expect(wf).toMatch(/MEASURED cadence is ~67 min \(range 38–154 across\s*\n\s*#\s*28 scheduled runs/);
    expect(at('lesson')).toMatch(/twenty-eight runs/);
    expect(at('lesson')).toMatch(/sixty-seven minutes/);
  });

  it('the June finding is the real one: ten tables subscribed to and never published', () => {
    const sql = read('infra/supabase/schema-v2.14-realtime-publication.sql');
    expect(sql).toMatch(/subscribe\(\) is a silent no-op/);
    const names = /ARRAY\[([\s\S]*?)\]/.exec(sql)[1].match(/'[a-z_0-9]+'/g);
    expect(names).toHaveLength(10);
    expect(at('lesson')).toMatch(/ten family tables/);
  });

  it('the outbox is written in the same step and drained separately, only when switched on', () => {
    const sql = read('infra/supabase/migrations-auto/0220-a-new-door-fault-enqueues-an-office-push-the-outbox.sql');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.push_outbox/);
    expect(sql).toMatch(/no row is lost, nothing is sent/);
    const drain = read('.github/workflows/push-outbox-drain.yml');
    expect(drain).toMatch(/- cron: '\*\/15 \* \* \* \*'/);
    expect(drain).toMatch(/if: \$\{\{ vars\.PUSH_OUTBOX_DRAIN_ENABLED == 'true' \}\}/);
    expect(at('lesson')).toMatch(/every fifteen minutes and only when it has been switched on/);
  });

  it('the open line is a WebSocket in the database library the app is built on', () => {
    const p = join(process.cwd(), 'node_modules', '@supabase', 'realtime-js', 'dist', 'main', 'RealtimeClient.js');
    expect(existsSync(p), 'the realtime client is installed').toBe(true);
    expect(readFileSync(p, 'utf8')).toMatch(/WebSocket/);
  });

  it('no private person beyond Darrell is named in any reader place', () => {
    for (const p of READER_PLACES) expect(at(p), p).not.toMatch(/Sterling|Shay|Moore Divahs/);
  });

  it('PROVEN-TO-CATCH: a lesson figure that drifted from the code would be caught', () => {
    expect(/thirty-seven files/.test(at('lesson').replace('thirty-seven files', 'forty files'))).toBe(false);
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
    // MEASURED 2026-11-13 by scripts/sov82-fill.mjs: adult 2,813 words; child
    // 0.514 / youth 0.609 / teen 0.635 / senior 0.620; grades 1.10 < 3.55 <
    // 4.85 < 7.14. Pinned with tolerance.
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
