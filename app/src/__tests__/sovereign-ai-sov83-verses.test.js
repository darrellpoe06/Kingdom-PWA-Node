// @vitest-environment node
// =============================================================================
// sov83 — every quotation is the corpus verbatim, the house is traced to its
// real code, and the lesson is whole in every band (DR-1489)
// =============================================================================
// Sovereign A.I. week 83, "That they may continue many days", was built from
// one word Darrell typed above a forwarded Level Up Coding issue, ACID Clearly
// Explained, on 2026-10-30 at 12:54 UTC (7:54 AM Central): Lesson. Gmail thread
// 1a18cd240a3a03eb. The scheduled intake fell behind; it was built 2026-11-13.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467) and sov81 kept:
// every check below drinks from `everyString`, which reaches every string in
// the module, and the book list is DERIVED from the quotations, never typed.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The whole article came inside the email,
// so there is no shut road to name; instead three tiers are held apart and
// asserted: the four guarantees are ESTABLISHED and stated without a hedge
// (DR-0100), the newsletter's transfer and last item are ILLUSTRATIONS, and the
// live tables are NOT MEASURED, so no reader place may claim a seat was sold
// twice. And because the lesson applies ACID to our own house, the house
// claims it makes are pinned to the code that makes them true: if the code
// moves, this file goes red and the lesson is re-read.
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

const ID = 'sov83-that-they-may-continue-many-days';
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

// The house writes "Psalm 15:4" and the corpus file is `Psalms.json`, so the
// resolution falls back to the plural form exactly as scripts/sov83-fill.mjs
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

describe('sov83 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 83, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(83);
    expect(weeks.filter((w) => w === 83)).toHaveLength(1);
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b], `${b} band`).toBe('string');
  });

  it('the sweep reaches every string in the module, not a hand-listed few', () => {
    // 129 strings on 2026-11-13, MEASURED; pinned low-side.
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
    // 158 quotations across 19 books on 2026-11-13, MEASURED.
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(155);
    expect(BOOKS.length).toBeGreaterThanOrEqual(19);
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

  it('PROVEN-TO-CATCH: a drifted word in a QUIZ or FACILITATOR string is caught', () => {
    const q = QUOTATIONS.find((x) => !READER_PLACES.includes(x.path)) || QUOTATIONS[0];
    expect(verseFaults([{ ...q, text: `${q.text} and more` }])).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: a quotation attributed to the wrong verse is caught', () => {
    const q = QUOTATIONS.find((x) => x.book === 'Jeremiah' && x.chapter === 32 && x.verse === 14);
    expect(q, 'Jeremiah 32:14 is quoted').toBeTruthy();
    expect(verseFaults([{ ...q, verse: q.verse + 1 }])).toHaveLength(1);
  });

  it("PROVEN-TO-CATCH: the newsletter's words put in quotation marks would be caught", () => {
    const planted = [['lesson', 'The database says "Transaction complete." and means it.']];
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
    expect(anchor.length).toBe(40);
    for (const r of anchor) {
      const m = /^([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, `${r} is not Book C:V`).toBeTruthy();
      expect(corpusVerse(m[1].trim(), Number(m[2]), Number(m[3])), `${r} resolves`).toBeTruthy();
    }
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  const yea = () => corpusVerse('Matthew', 5, 37);
  const vessel = () => corpusVerse('Jeremiah', 32, 14);

  it('every teaching place quotes both frame verses verbatim', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} quotes Matthew 5:37`).toContain(yea());
      expect(at(p), `${p} quotes Jeremiah 32:14`).toContain(vessel());
    }
    expect(at('bigIdea')).toMatch(/Matthew 5:37/);
    expect(at('bigIdea')).toMatch(/Jeremiah 32:14/);
  });

  it('the frame is laid before the database and before the household application', () => {
    for (const p of TEACHING_PLACES) {
      const text = at(p);
      const frame = Math.max(text.indexOf(yea()), text.indexOf(vessel()));
      const article = text.search(/\bdatabase/i);
      const application = text.indexOf('FOUR THINGS THIS WEEK');
      expect(frame, `${p} carries the frame`).toBeGreaterThan(-1);
      expect(article, `${p} names the database`).toBeGreaterThan(-1);
      expect(application, `${p} carries the application`).toBeGreaterThan(-1);
      expect(frame, `${p}: the Word comes before the database`).toBeLessThan(article);
      expect(frame, `${p}: the Word comes before the application`).toBeLessThan(application);
    }
  });

  it('each of the four guarantees is taught from the Word in every teaching place', () => {
    const pins = [
      ['Joshua', 11, 15],
      ['Hebrews', 8, 10],
      ['Genesis', 27, 38],
      ['Jeremiah', 32, 10],
    ];
    for (const p of TEACHING_PLACES) {
      for (const [b, c, v] of pins) expect(at(p), `${p} quotes ${b} ${c}:${v}`).toContain(corpusVerse(b, c, v));
    }
  });

  it('the sponsor block is left out of every reader place', () => {
    for (const p of READER_PLACES) {
      for (const term of ['Oracle', 'RAG', 'Restack', 'vector search', 'Hybrid search']) expect(at(p), `${p} must not carry ${term}`).not.toContain(term);
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
    expect(/\bGod\b/.test(strip('We thank God for the database.'))).toBe(true);
    expect(/\bGod\b/.test(strip(`"${corpusVerse('John', 1, 29)}" (John 1:29)`))).toBe(false);
  });
});

describe('three tiers held apart: established, illustration, and not measured', () => {
  it('every teaching place states the engineering as established and carries the dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} carries the re-review date`).toContain('re-review: 2026-11-27');
      expect(at(p), `${p} names the illustrations as made up`).toMatch(/not (real events|reported happenings|really happen)|illustrations?, not/i);
    }
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), `${p} names the database`).toMatch(/PostgreSQL/);
      expect(at(p), `${p} says it is settled`).toMatch(/ESTABLISHED|established|not in dispute/);
    }
    // DR-0100: under-claiming a verified truth is a failure too.
    for (const p of TEACHING_PLACES) expect(at(p), p).not.toMatch(/nobody knows what ACID|experts disagree|some say/i);
  });

  it('no reader place claims a seat WAS sold twice; the live tables are named as out of reach', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), p).not.toMatch(/(a|the) seat (was|has been) (sold|given) twice|we (sold|double sold) (a|the) seat/i);
      expect(at(p), `${p} says the live data was not reached`).toMatch(
        /could not (reach|look at|see)|out of reach|not reachable|beyond reach|cannot see the live/i
      );
    }
  });

  it('the house carries no unchecked-material admission, so the third pile is unmoved (DR-1126)', () => {
    for (const [p, s] of STRINGS) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s), `${p} would count as an unchecked admission`).toBe(false);
    }
  });

  it('PROVEN-TO-CATCH: a claimed double sale and a disclosure phrase are both caught', () => {
    expect(/(a|the) seat (was|has been) (sold|given) twice/i.test('In March the seat was sold twice.')).toBe(true);
    DISCLOSURE.lastIndex = 0;
    expect(DISCLOSURE.test('WHAT WE DID NOT CHECK: the manual.')).toBe(true);
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  it('the payments ledger refuses a negative amount and a doubled event (0116)', () => {
    const sql = src('infra/supabase/migrations-auto/0116-payments-ledger.sql');
    expect(sql).toMatch(/amount_cents\s+integer NOT NULL CHECK \(amount_cents >= 0\)/);
    expect(sql).toMatch(/UNIQUE \(provider, provider_event_id\)/);
    expect(at('lesson')).toMatch(/refuses a negative amount and refuses to record one processor event twice/);
  });

  it('the payment path writes money and grant in separate requests, finished by retry (not atomic)', () => {
    const js = src('app/functions/api/stripe-webhook.js');
    const ledger = js.indexOf('/rest/v1/payments?on_conflict=provider,provider_event_id');
    const seat = js.indexOf('/rest/v1/workshop_registrations?on_conflict=event_id,user_id');
    const member = js.indexOf('/rest/v1/member_subscriptions?on_conflict=user_id');
    expect(ledger).toBeGreaterThan(-1);
    expect(seat).toBeGreaterThan(ledger);
    expect(member).toBeGreaterThan(ledger);
    expect(js).toMatch(/resolution=ignore-duplicates/);
    expect(js).toMatch(/A failed write answers 500 so Stripe retries/);
    for (const p of ['lesson', 'levels.youth', 'levels.teen', 'levels.senior']) {
      expect(at(p), `${p} names the two-step payment honestly`).toMatch(/not atomic|NOT one all-or-nothing|not one\.|two transactions/i);
    }
  });

  it('a workshop seat is counted at checkout and written later with no recount: the hole the lesson names', () => {
    const checkout = src('app/functions/api/checkout.js');
    expect(checkout).toMatch(/ev\.seatsLeft <= 0\) return \{ error: 'sold-out' \}/);
    const js = src('app/functions/api/stripe-webhook.js');
    const from = js.indexOf('workshop_registrations?on_conflict');
    const block = js.slice(from - 400, from + 600);
    expect(block, 'the seat write still does not count seats').not.toMatch(/seats_left|capacity/);
    const sql = src('infra/supabase/migrations-auto/0323-a-workshop-is-sold-by-the-seat.sql');
    expect(sql).toMatch(/capacity integer NOT NULL CHECK \(capacity > 0\)/);
    // WHEN THIS GOES RED because a recount or a capacity trigger landed, the
    // hole is closed: rewrite the isolation movement in every band to say so.
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/last seat|one seat left/);
  });

  it('the exam rule lives in the database: best score stands, attempts never shrink (0313)', () => {
    const sql = src('infra/supabase/migrations-auto/0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql');
    expect(sql).toMatch(/best_pct := GREATEST\(COALESCE\(OLD\.quiz_pct, -1\), COALESCE\(NEW\.quiz_pct, -1\)\)/);
    expect(sql).toMatch(/NEW\.quiz_attempts := GREATEST\(/);
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/best score (stands|stays)/i);
  });

  it('the learner record left the phone for a synced table (0250)', () => {
    const sql = src('infra/supabase/migrations-auto/0250-a-learners-record-reaches-the-governor.sql');
    expect(sql).toMatch(/Neither is in any synced table, so neither ever left/);
    expect(sql).toMatch(/PRIMARY KEY \(user_id, lesson_id\)/);
    expect(sql).toMatch(/CHECK \(quiz_pct IS NULL OR \(quiz_pct BETWEEN 0 AND 100\)\)/);
  });

  it('the number referee compares exact names and knows only dr and ll spellings (reserve-ref)', () => {
    const js = src('scripts/lib/reserve-ref.mjs');
    expect(js).toMatch(/--force-with-lease=\$\{ref\}:/);
    expect(js).toMatch(/export const KINDS = Object\.freeze\(\{ dr: 4, ll: 0 \}\)/);
    // WHEN THIS GOES RED because the course gained a kind of its own, the
    // two-spellings hole is closed: say so in the isolation movement.
    for (const p of TEACHING_PLACES) expect(at(p), p).toMatch(/dash/);
    expect(at('lesson')).toContain(corpusVerse('Proverbs', 20, 10));
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
    // MEASURED 2026-11-13 by scripts/sov83-fill.mjs: adult 2,740 words; child
    // 0.524 / youth 0.637 / teen 0.617 / senior 0.666; grades 1.23 < 4.38 <
    // 5.91 < 7.74. Pinned with tolerance.
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
