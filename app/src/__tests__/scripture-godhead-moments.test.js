// @vitest-environment node
//
// scripture-godhead-moments — SEE the Godhead working together (Darrell 2026-07-04).
// HONESTY tests (DR-0076 + DR-0098): every anchor resolves in the shipped KJV, and
// every quoted phrase in the teaching is verbatim in the verse it cites — the panel
// teaches what the Word says, never a fabrication. Also pins the Creation moment
// showing all three Persons (Father speaks / Son is the Word & Light / Spirit moves).
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef, chapterVerses, __setBibleFetcher } from '../lib/bible-kjv.js';
import {
  GODHEAD_MOMENTS, PERSONS, momentsForChapter, getMoment, personOf, allMomentRefs, GODHEAD_SOURCE,
} from '../lib/scripture-godhead-moments.js';

const KJV_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');

beforeAll(() => {
  __setBibleFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(KJV_ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

async function verseText(ref) {
  const p = parseRef(ref);
  const verses = await chapterVerses(p.book, p.chapter);
  return (verses.find((v) => v.v === p.v1) || {}).text || '';
}

// Pull the "quoted" pieces out of a note: text inside the smart quotes “ … ”, then
// split each on an ellipsis (a quote may join two adjacent verses with “…”), so each
// PIECE must be verbatim in one cited verse on its own.
function quotedFragments(note) {
  const out = [];
  const re = /“([^”]+)”/g;
  let m = re.exec(note);
  while (m) {
    for (const piece of m[1].split(/…|\.\.\./)) { const p = piece.trim(); if (p) out.push(p); }
    m = re.exec(note);
  }
  return out;
}
// Normalize for a verbatim-words comparison: the teaching capitalizes His-pronouns
// (He/His/Him) for reverence where the KJV lowercases them, so compare case-
// insensitively; strip leading/trailing punctuation (a quote may end on a “.” where
// the verse has “:”). The WORDS must still be verbatim and in order.
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/^[\s"'“”.,;:!?—-]+|[\s"'“”.,;:!?—-]+$/g, '').trim();

describe('the moments are well-formed and show the Godhead together', () => {
  it('each moment names a real book/chapter, a range, and roles from known Persons', () => {
    const persons = new Set(PERSONS.map((p) => p.key));
    for (const m of GODHEAD_MOMENTS) {
      expect(m.id).toBeTruthy();
      expect(m.book).toBeTruthy();
      expect(Number.isInteger(m.chapter)).toBe(true);
      expect(Array.isArray(m.verses) && m.verses.length === 2).toBe(true);
      expect(m.lead, `${m.id} lead`).toBeTruthy();
      expect(m.roles.length).toBeGreaterThan(0);
      for (const r of m.roles) {
        expect(persons.has(r.person), `${m.id}: unknown person ${r.person}`).toBe(true);
        expect(r.refs.length).toBeGreaterThan(0);
      }
    }
  });
  it('the Creation moment shows Father + Son + Spirit in Genesis 1', () => {
    const [m] = momentsForChapter('Genesis', 1);
    expect(m).toBeTruthy();
    expect(new Set(m.roles.map((r) => r.person))).toEqual(new Set(['father', 'son', 'spirit']));
    // the Son's role carries the union out to John 1 and John 8:12 (the Word & the Light)
    const son = m.roles.find((r) => r.person === 'son');
    expect(son.refs).toEqual(expect.arrayContaining(['John 1:1', 'John 8:12']));
    expect(momentsForChapter('Genesis', 2)).toEqual([]); // not every chapter has one
  });
  it('personOf maps to a voice color; getMoment resolves by id; provenance is honest', () => {
    expect(personOf('son').voice).toBe('jesus');   // the Son wears red (the Blood)
    expect(personOf('father').voice).toBe('father');
    expect(getMoment('creation-beginning')).toBeTruthy();
    expect(GODHEAD_SOURCE.note).toMatch(/verified verbatim/);
  });
});

describe('HONESTY: every anchor resolves and every quote is verbatim in the Word', () => {
  it('resolves every anchor reference to a real verse', async () => {
    for (const ref of allMomentRefs()) {
      const t = await verseText(ref);
      expect(t.trim().length, `${ref} — not found in the shipped KJV`).toBeGreaterThan(0);
    }
  });
  it('every quoted fragment appears verbatim in one of its role’s cited verses', async () => {
    for (const m of GODHEAD_MOMENTS) {
      for (const r of m.roles) {
        const texts = [];
        for (const ref of r.refs) texts.push(norm(await verseText(ref)));
        for (const frag of quotedFragments(r.note)) {
          const f = norm(frag);
          const found = texts.some((t) => t.includes(f));
          expect(found, `${m.id}/${r.person}: quote not verbatim in its refs — "${frag}"`).toBe(true);
        }
      }
    }
  });
});
