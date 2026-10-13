// =============================================================================
// A QUOTED VERSE IS THE CORPUS, VERBATIM (DR-0076 bright line; DR-0987)
// =============================================================================
// CLAUDE.md states the bright line in as many words:
//
//   "this governs ONLY our authored voice, NEVER quoted Scripture. The KJV's
//    'God'/'the LORD' inside any quotation is fetched verbatim and left EXACTLY
//    as written — we never substitute 'Yahweh' into a Bible quote, and a blind
//    God→Yahweh sweep of existing content is forbidden (it would corrupt the
//    text)."
//
// Nothing enforced it on godhead-study-verses.json, and SEVEN of its 347
// verses had drifted — six of them live in the app for weeks. Measured
// 2026-10-13 against app/public/bible/kjv/. ONE cause, THREE rules broken:
//
//   THE ADVERSARY WAS CAPITALIZED (3) — against CLAUDE.md's lowercase rule,
//   which says plainly it "applies to file content ... and every other
//   artifact". The corpus on disk already prints `satan`:
//     Matthew 4:10   "Get thee hence, Satan"  -> "satan"
//     Job 1:6        "and Satan came also"    -> "satan"
//     Acts 5:3       "why hath Satan filled"  -> "satan"
//
//   `Lord` WAS WRITTEN `LORD` INSIDE THE QUOTE (3):
//     1 Corinthians 15:31  "Christ Jesus our LORD"   -> "our Lord"
//     2 Corinthians 3:18   "Spirit of the LORD"      -> "Spirit of the Lord"
//     Nehemiah 8:10        "holy unto our LORD"      -> "holy unto our Lord"
//       (the SECOND LORD in that verse — "the joy of the LORD" — was already
//        correct; only the first had drifted, which is why eyeballing it reads
//        as fine)
//
//   OUR OWN CAPITALIZATION OF A TITLE (1):
//     Deuteronomy 32:8-9   "the Most High divided"   -> "the most High divided"
//
// Six were already on `main`; only 2 Corinthians 3:18 arrived with PR #1217.
//
// The common cause is one thing: our house conventions reaching into a
// quotation by habit. It is not cosmetic. The KJV prints LORD for the
// Tetragrammaton and Lord for Adonai/Kyrios, so "the Spirit of the LORD" in
// 2 Corinthians 3:18 asserts a different underlying word than the text has —
// precisely the corruption the bright line forbids, arriving one verse at a
// time rather than by a sweep.
//
// This gate reads the corpus on disk — the repository's declared source of
// truth, "every verse verbatim from the KJV corpus on disk" — and fails on any
// drift, in either direction.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import VERSES from '../lib/godhead-study-verses.json';

const ROOT = join(__dirname, '../../..');
const KJV = join(ROOT, 'app/public/bible/kjv');

// `Psalm X:Y` lives in Psalms.json; `1 Peter` in 1Peter.json.
const BOOK_FILE = { Psalm: 'Psalms' };

/** The corpus text for a ref, or a reason it could not be resolved. */
export function corpusText(ref) {
  const m = /^(\d?\s?[A-Za-z ]+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref).trim());
  if (!m) return { error: 'unparsed reference' };
  const book = BOOK_FILE[m[1].trim()] || m[1].trim();
  const file = join(KJV, `${book.replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return { error: `no corpus file for "${book}"` };
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const chapter = data.chapters?.[Number(m[2]) - 1];
  if (!chapter) return { error: `no chapter ${m[2]}` };
  const from = Number(m[3]);
  const to = m[4] ? Number(m[4]) : from;
  const out = [];
  for (let v = from; v <= to; v += 1) {
    if (chapter[v - 1] === undefined) return { error: `no verse ${v}` };
    out.push(chapter[v - 1]);
  }
  return { text: out.join(' ') };
}

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const refs = Object.keys(VERSES);

describe('every Godhead Study verse is the KJV corpus verbatim', () => {
  it('has verses to check, and every reference resolves in the corpus', () => {
    // A TRUNCATION GUARD, not a census. An exact count here would have to be
    // edited on every verse added, which makes it a maintenance trap that
    // teaches people to bump numbers until tests pass. The real assertions are
    // per-verse, below.
    expect(refs.length).toBeGreaterThan(250);
    const unresolvable = refs.map((r) => [r, corpusText(r)]).filter(([, c]) => c.error);
    expect(unresolvable.map(([r, c]) => `${r}: ${c.error}`)).toEqual([]);
  });

  // One assertion per verse, so a failure names the verse rather than a count.
  for (const ref of refs) {
    it(`${ref} matches the corpus`, () => {
      const c = corpusText(ref);
      expect(c.error).toBeUndefined();
      expect(norm(VERSES[ref])).toBe(norm(c.text));
    });
  }

  it('no duplicate keys — JSON.parse would swallow one silently', () => {
    const raw = readFileSync(join(ROOT, 'app/src/lib/godhead-study-verses.json'), 'utf8');
    const keys = [...raw.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)].map((m) => m[1]);
    const dups = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dups).toEqual([]);
    expect(keys.length).toBe(refs.length);
  });
});

// PROVEN TO CATCH (DR-0076 §3) on the REAL seven, verbatim as they stood.
// A gate that cannot fail is not a gate, and these are not invented inputs.
describe('the gate catches the drift that was actually there', () => {
  // The real before-texts, verbatim as they stood — one per rule broken.
  const WAS_WRONG = {
    'Matthew 4:10': 'Then saith Jesus unto him, Get thee hence, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.',
    '1 Corinthians 15:31': 'I protest by your rejoicing which I have in Christ Jesus our LORD, I die daily.',
    'Deuteronomy 32:8-9': 'When the Most High divided to the nations their inheritance, when he separated the sons of Adam, he set the bounds of the people according to the number of the children of Israel. For the LORD’s portion is his people; Jacob is the lot of his inheritance.',
    'Nehemiah 8:10': 'Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our LORD: neither be ye sorry; for the joy of the LORD is your strength.',
  };

  for (const [ref, wrong] of Object.entries(WAS_WRONG)) {
    it(`would have failed on the old ${ref}`, () => {
      const c = corpusText(ref);
      expect(c.error).toBeUndefined();
      expect(norm(wrong)).not.toBe(norm(c.text));   // the drift is real
      expect(norm(VERSES[ref])).toBe(norm(c.text)); // and the shipped text is right
    });
  }

  it('the adversary is lowercase in the corpus, so a capitalized Satan is drift', () => {
    expect(corpusText('Matthew 4:10').text).toContain('Get thee hence, satan');
    expect(corpusText('Job 1:6').text).toContain('and satan came also');
    expect(corpusText('Acts 5:3').text).toContain('why hath satan filled');
  });

  it('the corpus prints Lord where these verses render Adonai/Kyrios, and LORD where it is the Name', () => {
    // Asserted against the corpus, not claimed. Nehemiah 8:10 carries BOTH in
    // one verse, which is the whole reason the first one drifted unnoticed.
    expect(corpusText('2 Corinthians 3:18').text).toContain('Spirit of the Lord');
    expect(corpusText('1 Corinthians 15:31').text).toContain('Christ Jesus our Lord');
    expect(corpusText('Nehemiah 8:10').text).toContain('holy unto our Lord');
    expect(corpusText('Nehemiah 8:10').text).toContain('the joy of the LORD');
    expect(corpusText('Deuteronomy 32:8-9').text).toContain('the most High divided');
    expect(corpusText('Job 1:6').text).toContain('before the LORD');
  });

  it('an unresolvable reference is reported, never passed', () => {
    expect(corpusText('Nonesuch 1:1').error).toMatch(/no corpus file/);
    expect(corpusText('not a reference').error).toBe('unparsed reference');
    expect(corpusText('Job 999:1').error).toBe('no chapter 999');
    expect(corpusText('Job 1:999').error).toBe('no verse 999');
  });
});
