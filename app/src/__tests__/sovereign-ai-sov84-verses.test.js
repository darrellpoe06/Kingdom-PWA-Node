// @vitest-environment node
// =============================================================================
// sov84 - every quotation is the corpus verbatim, the Word stands before the
// article's own material, the figures stay the newsletter's, and our own house
// is measured rather than painted (DR-1497)
// =============================================================================
// Sovereign A.I. week 84, "The body hath many members", was built from one word
// Darrell typed above a forwarded ByteByteGo newsletter (How Nvidia's New
// Nemotron Model Works) on 2026-11-03 at 14:15:52 UTC, 8:15 AM CST: Lesson.
// Gmail thread 1a19d26ba0e00ab4. The intake lane fell behind; it was built from
// the backlog on 2026-11-13, ten days later, and the gap is on the record.
//
// SHAPE. The one-traversal shape sov80 settled on (DR-1467): every check below
// drinks from `everyString`, and the book list is DERIVED from the quotations
// rather than typed, so a new book added to the lesson is covered automatically.
//
// WHAT THIS FILE ADDS FOR THIS LESSON.
//  1 THE FRAME GATE IS MEASURED AGAINST THE ARTICLE'S OWN MATERIAL, not against
//    a word that merely appears in honest text. Seven builds in a row shipped a
//    frame gate narrower than its name; the sov82 one searched for the word
//    "newsletter" and therefore fired on the PROVENANCE paragraph, which stands
//    before the frame ON PURPOSE - a check that would have trained an author to
//    delete the provenance to get green. So this gate takes the list of the
//    ARTICLE'S MECHANISM TERMS (mamba, mixture of experts, router, key-value
//    cache, quantisation, speculative drafting and the rest) and requires a
//    quoted verse to stand before the first of them in every teaching place,
//    while SEPARATELY requiring the provenance sentence to be present and to
//    stand before the frame. Naming who sent a thing is not teaching its
//    material, and the two claims are now two assertions.
//  2 THE FIGURES STAY THE NEWSLETTER'S. developer.nvidia.com, huggingface.co and
//    arxiv.org were all refused (403 CONNECT) from the build session, so no
//    reader place may state Nvidia's numbers as checked fact; every teaching
//    place carries the shut-road paragraph with a dated re-review (DR-0076 s8).
//  3 THE ONE ROAD THAT OPENED IS NAMED. Nvidia's own configuration was read
//    through a public code host, and it carried a SHARED expert the article
//    never mentions. A lesson that quietly dropped that finding would be
//    smaller than what was actually verified, so every band must keep it.
//  4 OUR OWN HOUSE IS READ BACK FROM ITS SOURCE. The corpus figures are counted
//    from app/public/bible/kjv, the band floors are read from
//    scripts/full-levels.mjs, and the decision-record floor is counted from
//    docs/decisions - so a figure that drifts fails here, not on a reader.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves every quotation
// IS the verse it names, and that the frame precedes the article's material. It
// cannot prove the lesson chose the RIGHT verse for the point, nor that the
// shared-expert reading of 1 Corinthians 13 is the best one. That is the
// author's eye and the reviewer's, and it is not claimed here.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov84-the-body-hath-many-members';
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
      out.push({ path, text: m[1], book: m[2].trim(), chapter: Number(m[3]), verse: Number(m[4]), index: m.index });
    }
  }
  return out;
}

const QUOTATIONS = everyQuotation();
const BOOKS = [...new Set(QUOTATIONS.map((q) => q.book))].sort();

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = new Map();

// The lesson writes "Psalm 119:11" and the corpus file is `Psalms.json`, so the
// resolution falls back to the plural form exactly as scripts/sov84-fill.mjs
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

export function verseFaults(quotations) {
  const out = [];
  for (const q of quotations) {
    const actual = corpusVerse(q.book, q.chapter, q.verse);
    if (actual == null) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} does not resolve in the corpus`);
    else if (actual !== q.text) out.push(`${q.path}: ${q.book} ${q.chapter}:${q.verse} is not the corpus text`);
  }
  return out;
}

/** Every double-quoted span in a set of strings that is NOT a corpus verse. */
export function nonScriptureQuotes(strings) {
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

// MEASURED 2026-11-13 on the spliced tree: 168 quotations across 19 books; pinned low-side.
const QUOTATION_FLOOR = 160;
const BOOK_FLOOR = 18;

// -----------------------------------------------------------------------------
// The article's OWN material. Naming the source is not teaching its material,
// so "ByteByteGo", "Nemotron", "Nvidia" and the subject line are deliberately
// NOT on this list - they are what an honest provenance paragraph says. These
// are the MECHANISMS the article explains, which is the thing the Word must
// stand before (the narrower-than-its-name defect, recorded in the header).
// -----------------------------------------------------------------------------
export const ARTICLE_MATERIAL = [
  'mamba',
  'mixture of experts',
  'router',
  'routed expert',
  'key-value cache',
  'grouped-query attention',
  'autoregressive',
  'speculative',
  'quantiz',
  'quantis',
  'distillation',
  'feed-forward',
  'attention head',
];

export function firstArticleMaterial(text) {
  const low = String(text).toLowerCase();
  let best = -1;
  for (const term of ARTICLE_MATERIAL) {
    const i = low.indexOf(term);
    if (i >= 0 && (best < 0 || i < best)) best = i;
  }
  return best;
}

export function firstQuotation(text) {
  const m = String(text).match(/"[^"]+"\s*\([1-3]?\s?[A-Za-z][A-Za-z ]*?\s+\d+:\d+\)/);
  return m ? m.index : -1;
}

/** The frame must stand before the article's own material in a teaching place. */
export function frameFaults(places) {
  const out = [];
  for (const [path, text] of places) {
    const q = firstQuotation(text);
    const a = firstArticleMaterial(text);
    if (q < 0) out.push(`${path}: no quoted verse at all`);
    else if (a >= 0 && a < q) out.push(`${path}: the article's own material stands before the first verse`);
  }
  return out;
}

describe('sov84 is in the catalog and is the whole lesson', () => {
  it('the module exists, at week 84, with all four bands', () => {
    expect(MODULE, `${ID} is not in SOVEREIGN_AI_MODULES`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)?.[1] || 0));
    expect(weeks).toContain(84);
    expect(weeks.filter((w) => w === 84)).toHaveLength(1);
    for (const b of FOUR_BANDS) expect(String(MODULE.levels?.[b] || '').trim().length, `${b} band is empty`).toBeGreaterThan(0);
  });

  it('every reader place carries the lesson', () => {
    for (const p of READER_PLACES) expect(at(p).length, `${p} is empty`).toBeGreaterThan(400);
  });
});

describe('sov84 quotes the corpus and nothing but the corpus', () => {
  it('carries the measured weight of Scripture', () => {
    expect(QUOTATIONS.length).toBeGreaterThanOrEqual(QUOTATION_FLOOR);
    expect(BOOKS.length).toBeGreaterThanOrEqual(BOOK_FLOOR);
  });

  it('every quotation is the corpus text verbatim', () => {
    expect(verseFaults(QUOTATIONS)).toEqual([]);
  });

  it('every book the lesson quotes resolves to a corpus file', () => {
    for (const b of BOOKS) expect(bookFileName(b), `${b} has no corpus file`).toBeTruthy();
  });

  it('nothing but Scripture stands in double quotation marks', () => {
    expect(nonScriptureQuotes(STRINGS)).toEqual([]);
  });

  it('anchor.ref names every verse quoted in a reader place and nothing more', () => {
    const quotedInReaderPlaces = new Set();
    for (const q of QUOTATIONS) {
      const base = q.path.replace(/\[\d+\]$/, '');
      if (READER_PLACES.includes(base)) quotedInReaderPlaces.add(`${q.book} ${q.chapter}:${q.verse}`);
    }
    const onAnchor = new Set(
      String(MODULE.anchor.ref)
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const missing = [...quotedInReaderPlaces].filter((r) => !onAnchor.has(r));
    const extra = [...onAnchor].filter((r) => !quotedInReaderPlaces.has(r));
    expect(missing, 'quoted in a reader place but not on the anchor').toEqual([]);
    expect(extra, 'on the anchor but never quoted in a reader place').toEqual([]);
  });
});

describe('sov84 puts the Word before the article, and says who sent it', () => {
  it('the frame stands before the article’s own material in every teaching place', () => {
    expect(frameFaults(TEACHING_PLACES.map((p) => [p, at(p)]))).toEqual([]);
  });

  it('the provenance is present, and stands before the frame in the adult lesson', () => {
    const lesson = at('lesson');
    expect(lesson).toMatch(/Lesson/);
    expect(lesson.toLowerCase()).toContain('bytebytego');
    const prov = lesson.toLowerCase().indexOf('bytebytego');
    expect(prov, 'the provenance must be named').toBeGreaterThanOrEqual(0);
    expect(prov, 'the provenance stands BEFORE the frame on purpose').toBeLessThan(firstQuotation(lesson));
  });

  it('the opening frame is 1 Corinthians 12 in every teaching place', () => {
    for (const p of TEACHING_PLACES) {
      const first = everyQuotation([[p, at(p)]])[0];
      expect(first, `${p} quotes nothing`).toBeTruthy();
      expect(`${first.book} ${first.chapter}`, `${p} does not open on 1 Corinthians 12`).toBe('1 Corinthians 12');
    }
  });

  it('every teaching place keeps the ten-day gap between the send and the build', () => {
    for (const p of TEACHING_PLACES) expect(at(p), `${p} drops the build date`).toMatch(/ten days|thirteenth|2026-11-13/i);
  });
});

describe('sov84 keeps the shut roads shut and names the one that opened', () => {
  it('every teaching place carries the shut-road paragraph with a dated re-review', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} drops the re-review date`).toContain('re-review: 2026-11-27');
      expect(at(p), `${p} does not say what was not checked`).toMatch(/could not|would not open|refused|blocked/i);
    }
  });

  it('the three refused hosts are named where the reader can see them', () => {
    const big = at('bigIdea');
    for (const host of ['developer.nvidia.com', 'huggingface.co', 'arxiv.org']) {
      expect(big, `bigIdea does not name ${host}`).toContain(host);
    }
  });

  it('the figures are told as the newsletter’s claim, never as checked fact', () => {
    for (const p of TEACHING_PLACES) {
      const t = at(p);
      if (/thirty billion|hundred and twenty-eight|128 experts/i.test(t)) {
        expect(t, `${p} states a figure without marking whose claim it is`).toMatch(/newsletter|article|email|letter said/i);
      }
    }
  });

  it('the road that opened, and what it added, survives in every band', () => {
    for (const b of FOUR_BANDS) {
      const t = MODULE.levels[b];
      expect(t, `${b} drops the shared expert`).toMatch(/shared expert|helper that never sits down/i);
      expect(t, `${b} does not say the code was read`).toMatch(/code/i);
    }
    expect(at('lesson')).toMatch(/shared expert/i);
  });
});

describe('sov84 measures our own house instead of painting it', () => {
  it('the corpus figures the lesson states are the corpus as it actually ships', () => {
    const files = readdirSync(KJV).filter((f) => f.endsWith('.json') && f !== 'index.json');
    let chapters = 0;
    let verses = 0;
    for (const f of files) {
      const bk = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
      for (const ch of bk.chapters) {
        chapters += 1;
        verses += ch.length;
      }
    }
    expect(files.length).toBe(66);
    expect(chapters).toBe(1189);
    expect(verses).toBe(31102);
    // and the lesson says exactly those numbers, in words, where a reader meets them
    expect(at('lesson')).toMatch(/sixty-six books/i);
    expect(at('lesson')).toMatch(/one thousand one hundred and eighty-nine chapters/i);
    expect(at('lesson')).toMatch(/thirty-one thousand one hundred and two verses/i);
  });

  it('the band floors the lesson quotes are the floors the code actually enforces', async () => {
    const { FULL_FLOOR } = await import('../../../scripts/full-levels.mjs');
    expect(FULL_FLOOR.child).toBe(0.5);
    expect(FULL_FLOOR.youth).toBe(0.6);
    expect(FULL_FLOOR.teen).toBe(0.6);
    expect(FULL_FLOOR.senior).toBe(0.6);
    // "at least half" for the child band, "three fifths" for the other three
    expect(at('lesson')).toMatch(/at least half the words of the adult lesson/i);
    expect(at('lesson')).toMatch(/three fifths/i);
  });

  it('the decision-record floor the lesson states is true of the tree', () => {
    const dir = join(process.cwd(), '..', 'docs', 'decisions');
    const records = readdirSync(dir).filter((f) => /^DR-\d+.*\.md$/.test(f));
    expect(records.length).toBeGreaterThanOrEqual(1300);
    expect(at('lesson')).toMatch(/more than thirteen hundred decision records/i);
  });
});

describe('sov84 honours the typographic theology', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    const faults = [];
    for (const [path, s] of STRINGS) {
      for (const m of s.matchAll(/\b(Satan|Lucifer|The Devil|The Adversary|Baal)\b/g)) {
        faults.push(`${path}: ${m[1]}`);
      }
    }
    expect(faults).toEqual([]);
  });

  it('Yahweh is named in our own voice in every teaching place', () => {
    for (const p of TEACHING_PLACES) expect(at(p), `${p} never names Yahweh`).toContain('Yahweh');
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} drops the Lamb`).toMatch(/Lamb/);
      expect(at(p), `${p} drops the Eternal Son`).toMatch(/Eternal Son of Yahweh|Son of Yahweh/);
    }
  });

  it('the KJV’s own "God" and "the LORD" are left verbatim inside quotations', () => {
    // DR-0076 / DR-0210 bright line: our voice says Yahweh, a quotation is untouched.
    const inQuote = QUOTATIONS.filter((q) => /\bGod\b|\bLORD\b/.test(q.text));
    expect(inQuote.length, 'the lesson quotes verses that carry God or the LORD').toBeGreaterThan(0);
    expect(verseFaults(inQuote)).toEqual([]);
  });
});

describe('sov84 closes the hour in every band', () => {
  it('each band carries the TALK close with the four occasions', () => {
    for (const b of FOUR_BANDS) {
      expect(MODULE.levels[b], `${b} drops the TALK close`).toMatch(/TALK ABOUT IT TOGETHER/);
      expect(MODULE.levels[b], `${b} drops the four occasions`).toMatch(/Deuteronomy 6:7/);
    }
    expect(at('lesson')).toMatch(/TALK ABOUT IT TOGETHER/);
  });

  it('each band ends on the Word and on members in particular', () => {
    for (const p of TEACHING_PLACES) {
      expect(at(p), `${p} drops John 1`).toMatch(/John 1:14/);
      expect(at(p), `${p} drops the closing word on the body`).toMatch(/1 Corinthians 12:27/);
    }
  });
});

describe('sov84 passes the four-band ladder', () => {
  it('carries no four-band fault', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measured ladder and shares are what the record states', () => {
    const adult = words(MODULE.lesson);
    const share = Object.fromEntries(FOUR_BANDS.map((b) => [b, words(MODULE.levels[b]) / adult]));
    expect(share.child).toBeGreaterThanOrEqual(0.5);
    expect(share.youth).toBeGreaterThanOrEqual(0.6);
    expect(share.teen).toBeGreaterThanOrEqual(0.6);
    expect(share.senior).toBeGreaterThanOrEqual(0.6);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      expect(overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson)).toBeLessThanOrEqual(0.25);
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
        expect(overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]])).toBeLessThanOrEqual(0.25);
      }
    }
  });
});

// =============================================================================
// PROVEN TO CATCH (DR-0060 / DR-0076 section 3). A gate that always passes is
// itself a lie, so each check above is shown here failing on a planted defect.
// =============================================================================
describe('sov84 gates are proven to catch', () => {
  it('catches a drifted verse, a wrong reference and a missing book', () => {
    const good = everyQuotation([['lesson', at('lesson')]])[0];
    expect(verseFaults([good])).toEqual([]);
    expect(verseFaults([{ ...good, text: `${good.text} and a little more` }])).toHaveLength(1);
    expect(verseFaults([{ ...good, verse: good.verse + 40 }])).toHaveLength(1);
    expect(verseFaults([{ ...good, book: 'Hezekiah' }])).toHaveLength(1);
  });

  it('catches a quoted person, and passes a quoted verse', () => {
    const verse = everyQuotation([['lesson', at('lesson')]])[0];
    const asWritten = `"${verse.text}" (${verse.book} ${verse.chapter}:${verse.verse})`;
    expect(nonScriptureQuotes([['probe', asWritten]])).toEqual([]);
    expect(nonScriptureQuotes([['probe', 'He said "this is the main thing" to the room.']])).toHaveLength(1);
  });

  it('catches the article’s own material standing before the frame', () => {
    const verse = everyQuotation([['lesson', at('lesson')]])[0];
    const asWritten = `"${verse.text}" (${verse.book} ${verse.chapter}:${verse.verse})`;
    expect(frameFaults([['ok', `The Word first. ${asWritten} Then a mamba layer keeps a compact state.`]])).toEqual([]);
    expect(frameFaults([['bad', `A mamba layer keeps a compact state. Then the Word. ${asWritten}`]]), 'material before the frame must fail').toHaveLength(1);
    expect(frameFaults([['none', 'No Scripture here at all, only a router and some experts.']])).toHaveLength(1);
  });

  it('does NOT fire on a provenance paragraph that names the source before the frame', () => {
    // The defect the previous seven builds shipped: a frame gate that fired on
    // honest provenance and would have trained the author to delete it.
    const verse = everyQuotation([['lesson', at('lesson')]])[0];
    const asWritten = `"${verse.text}" (${verse.book} ${verse.chapter}:${verse.verse})`;
    const withProvenance = `WHO SENT THIS. Darrell forwarded a ByteByteGo newsletter, How Nvidia's New Nemotron Model Works, and typed one word: Lesson. THE WORD FIRST. ${asWritten} Then the mixture of experts.`;
    expect(frameFaults([['provenance', withProvenance]]), 'naming the source is not teaching its material').toEqual([]);
  });

  it('catches a capitalised adversary and a stripped re-review date', () => {
    const faults = [];
    for (const m of 'Then Satan answered'.matchAll(/\b(Satan|Lucifer|The Devil|The Adversary|Baal)\b/g)) faults.push(m[1]);
    expect(faults).toHaveLength(1);
    expect('a note with no date'.includes('re-review: 2026-11-27')).toBe(false);
    expect(at('lesson').includes('re-review: 2026-11-27')).toBe(true);
  });

  it('catches a thin band and a repeated band', () => {
    const thin = { ...MODULE, levels: { ...MODULE.levels, child: 'Too short to be a lesson.' } };
    expect(fourBandFaults(thin).length).toBeGreaterThan(0);
    const repeated = { ...MODULE, levels: { ...MODULE.levels, teen: MODULE.levels.youth } };
    expect(fourBandFaults(repeated).some((f) => /near copy|ladder/.test(f))).toBe(true);
  });

  it('catches a drifted house figure', () => {
    expect(/sixty-six books/i.test(at('lesson'))).toBe(true);
    expect(/sixty-seven books/i.test(at('lesson'))).toBe(false);
  });
});
