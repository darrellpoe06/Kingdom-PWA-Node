// @vitest-environment node
// EVERY ANCHOR IS NAMED IN THE LESSON, WHERE IT IS DISCUSSED — AND A QUOTE
// NEVER CLOSES WHERE AN APOSTROPHE BELONGS.
// =============================================================================
// Darrell 2026-09-14, in order:
//   "Keep all anchors just spread out in the lessons!!!!! Why don't you
//    understand that!??!!!!!!"
//   "Just sit where they were discussed!!!"
//   "Was not ever in need of a list until we tried to fix it!!!!!"
//
// MEASURED (this session): the 139 lessons that existed before 2026-09-12
// name their references in the body beside the quote (L133-L140: quoted 66 /
// named 65 … quoted 273 / named 266) and every anchor is discussed in the
// prose. L141 (09-12) broke it in one step: quoted 57, named 0, and every
// reference moved into anchor.ref instead. The verse gates only ever checked
// that a quoted span is VERBATIM (living-lessons-l*-verses.test.js) and that
// the anchor LIST holds the refs; ZERO of 52 asserted a reference is NAMED in
// the body. We built to the gate we had. This is the gate we did not have.
//
// THREE RULES, each proven-to-catch (DR-0076 §3):
//   1. A verse whose KJV text is quoted in the body carries its reference
//      beside the quote (a range label "Exodus 20:3-5" names 20:3, 20:4, 20:5).
//   2. Every anchor reference is named somewhere in the lesson — spread out,
//      not listed. Lessons still OWED that authoring are named below with the
//      count they are owed; the count may only fall. A lesson not on the list
//      owes zero. Silence is not an exemption.
//   3. No `<letter>" <letter>` in a lesson restores to a KJV `'s` — that is a
//      possessive apostrophe that became a closing quote (L141 had three:
//      "man's foes", "Christ's sake" ×2), invisible to a substring gate.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { LIVING_LESSONS_MODULES as MS } from '../lib/living-lessons-class.js';
import { BIBLE_INDEX, parseRef } from '../lib/bible-kjv.js';

const KJV_DIR = resolve(import.meta.dirname, '../../public/bible/kjv');
const fold = (s) => String(s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
const REF = /(?:[1-3]\s)?[A-Z][a-z]+\s\d+:\d+(?:-\d+)?/g;

const books = new Map();
function book(file) {
  if (!books.has(file)) { const p = join(KJV_DIR, `${file}.json`); books.set(file, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return books.get(file);
}
function verseText(ref) {
  const p = parseRef(ref); if (!p) return '';
  const b = book(p.file); const ch = b && b.chapters[p.chapter - 1]; if (!ch) return '';
  const out = []; for (let v = p.v1; v <= p.v2; v += 1) { if (ch[v - 1] == null) break; out.push(ch[v - 1]); }
  return fold(out.join(' '));
}
let HAY = null;
function haystack() {
  if (HAY) return HAY;
  let h = ''; for (const b of BIBLE_INDEX) { const bk = book(b.file); if (bk) h += ' ' + bk.chapters.flat().join(' '); }
  HAY = fold(h).toLowerCase(); return HAY;
}
const lessonText = (x) => fold([x.lesson, x.bigIdea, x.anchor?.theme, x.levels?.child, x.levels?.teen, x.levels?.senior, ...(x.benefits || [])].join(' '));
const anchorsOf = (x) => [...new Set((fold(x.anchor?.ref).match(REF) || []))];

/** Is `ref` named in `text`? Exactly, or by any reference of the same book+chapter
 *  whose verses OVERLAP it — the on-shape lessons cite one verse beside a
 *  two-verse quote ("(John 12:24)" beside John 12:24-25), and that is naming. */
function isNamed(text, ref) {
  const low = text.toLowerCase();
  if (low.includes(ref.toLowerCase())) return true;
  const r = parseRef(ref); if (!r) return false;
  for (const m of text.match(REF) || []) {
    const q = parseRef(m); if (!q || q.file !== r.file || q.chapter !== r.chapter) continue;
    if (q.v1 <= r.v2 && r.v1 <= q.v2) return true;
  }
  return false;
}

// Lessons still owed the authoring that puts a verse INTO the teaching. The
// number is what they owe today; it may only go down. Dated (DR-0404).
const OWED = {
  // This week's lessons (L141+), measured 2026-09-14 after the naming pass:
  'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies': 1,
  // PRE-EXISTING, not this week's: two original lessons whose anchor names a
  // range the body only paraphrases. Recorded so they are seen, not exempted.
  'll54-the-same-word-different-soil-the-parable-of-the-sower': 2,
  'll81-tongues-weighed-word-first': 1,
};

describe('a quoted verse carries its reference beside the quote', () => {
  it('no lesson quotes a KJV verse from its anchor without naming it', () => {
    const offenders = [];
    for (const x of MS) {
      const text = lessonText(x);
      for (const ref of anchorsOf(x)) {
        if (isNamed(text, ref)) continue;
        const t = verseText(ref); if (!t) continue;
        if (text.includes(t.slice(0, 40))) offenders.push(`${x.id.slice(0, 30)} quotes ${ref} and never names it`);
      }
    }
    expect(offenders, offenders.slice(0, 8).join('\n')).toEqual([]);
  });
  it('a range label names every verse inside it (proven-to-catch)', () => {
    expect(isNamed('… (Exodus 20:3-5) …', 'Exodus 20:5')).toBe(true);
    expect(isNamed('… (Exodus 20:3-5) …', 'Exodus 20:6')).toBe(false);
    expect(isNamed('… Exodus 20:3 …', 'Exodus 20:5')).toBe(false);
    // one verse named beside a two-verse quote is the originals' own practice
    expect(isNamed('… (John 12:24) …', 'John 12:24-25')).toBe(true);
    expect(isNamed('… (John 12:26) …', 'John 12:24-25')).toBe(false);
  });
});

describe('every anchor is spread through the lesson, not listed', () => {
  it('a lesson not on the owed list names every anchor; an owed lesson never owes MORE than recorded', () => {
    const over = [];
    for (const x of MS) {
      const text = lessonText(x);
      const unnamed = anchorsOf(x).filter((r) => !isNamed(text, r)).length;
      const allowed = OWED[x.id] ?? 0;
      if (unnamed > allowed) over.push(`${x.id.slice(0, 40)}: ${unnamed} unnamed anchors (allowed ${allowed})`);
    }
    expect(over, over.join('\n')).toEqual([]);
  });
  it('the owed list is exact, not padded — each entry owes what it says, not less', () => {
    // If authoring lands and the number falls, this fails so the record is lowered in the same commit.
    const stale = [];
    for (const [id, allowed] of Object.entries(OWED)) {
      const x = MS.find((m) => m.id === id); if (!x) { stale.push(`${id} no longer exists`); continue; }
      const unnamed = anchorsOf(x).filter((r) => !isNamed(lessonText(x), r)).length;
      if (unnamed < allowed) stale.push(`${id.slice(0, 40)} owes ${unnamed}, list says ${allowed} — lower it`);
    }
    expect(stale, stale.join('\n')).toEqual([]);
  });
  it('of the 139 lessons that set the shape, exactly two carry a pre-existing gap (3 references) and no more', () => {
    const owedOld = MS.slice(0, 139).filter((x) => OWED[x.id]).map((x) => x.id);
    expect(owedOld.length).toBe(2);
    expect(owedOld.every((id) => id.startsWith('ll54-') || id.startsWith('ll81-'))).toBe(true);
  });
});

describe('a quote never closes where an apostrophe belongs', () => {
  it('no lesson has a `"` that restores to a KJV possessive', () => {
    const hay = haystack();
    const hits = [];
    for (const x of MS) {
      const t = lessonText(x); const re = /([a-z])" ([a-z])/g; let m;
      while ((m = re.exec(t))) {
        const before = t.slice(Math.max(0, m.index - 24), m.index + 1).toLowerCase();
        const after = t.slice(m.index + 2, m.index + 22).toLowerCase();
        if (hay.includes((before + "'s " + after).replace(/\s+/g, ' '))) hits.push(`${x.id.slice(0, 30)}: …${before}" ${after}…`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
  it('the detector sees the exact L141 shape (proven-to-catch)', () => {
    const hay = haystack();
    const t = 'against her mother in law. And a man" foes shall be they of his own household.';
    const m = /([a-z])" ([a-z])/.exec(t);
    const probe = (t.slice(Math.max(0, m.index - 24), m.index + 1) + "'s " + t.slice(m.index + 2, m.index + 22)).toLowerCase().replace(/\s+/g, ' ');
    expect(hay.includes(probe)).toBe(true);
  });
});
