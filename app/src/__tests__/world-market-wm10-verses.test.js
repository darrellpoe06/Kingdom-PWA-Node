// @vitest-environment node
// =============================================================================
// wm10 — The name and the proof: what a seller's reputation is worth when the
// works are checked
// =============================================================================
// Darrell forwarded a Retail Dive newsletter to himself on 2026-10-08 with one
// word typed above the body: Lessons. It had been waiting three weeks.
//
// THE SOURCE IS THIN AND THE LESSON SAYS SO. That email is, in its entirety, a
// sponsor placement for the Kearney Consumer Institute's report "The future
// consumer" -- "brought to you by" across the top, a banner, four links to the
// same report, a Chicago address, social icons and a media-kit pitch. There is
// no Retail Dive reporting in it at all. The standing rule is that advertising
// is ignored unless the advertisement is itself germane, and the only reason
// this one is germane is the reason the lesson is built on: what it sells is a
// report about TRUST, delivered by a name asking to be believed.
//
// THIS LESSON'S PARTICULAR DANGER IS NOT WM9'S. wm9 (the cost of staying warm)
// had to teach the provenance of a FIGURE -- who said it, on what day -- because
// its numbers arrived inside an email and no publisher page could be reached.
// wm10's numbers DID read back off the publisher's own page from a GitHub runner
// (lesson-sources.json carries the row; the witness run is in DR-1280). That
// makes the danger the OPPOSITE one, and much easier to miss: a green read-back
// invites the lesson to imply the claim was verified. IT WAS NOT. A read-back
// proves ATTRIBUTION -- the publisher asserts the figure on its own page -- and
// here the publisher is also the party SELLING the report, so the witness is the
// seller. The lesson's spine is exactly that distinction, and the checks below
// require it in the adult text AND in all four bands: we asked the name whether
// the name said it, and we did not test the works.
//
// WHAT NOBODY HERE VERIFIED, and it is on every reader-facing surface rather
// than in this header alone: the report itself was never read (it is sold, not
// given); nothing was established about the study's method, whether 21,500
// people were in fact surveyed, or what question produced that 86; and the
// email's "additional 80 minutes a day" is ABSENT from the publisher's page, so
// it stands as the email's claim and nothing further.
//
// PINS ARE CONFIRMED UNIQUE BEFORE THEY ARE TRUSTED. Every figure in this lesson
// occurs TWICE in each adult-register band -- once where the claim is stated and
// again in the list of what read back -- so pinning a figure to prove a
// disclosure exists would pass with the disclosure deleted. That is the trap
// DR-1275 hit with `367,000` and DR-1278 hit with `Mitch Berk`. The disclosure
// pins below were each counted across all five places first and each occurs
// EXACTLY ONCE, in the disclosure, and the strip proofs re-run the break.
//
// The SPINE is literal text read off the corpus on disk before it was written,
// never produced by the same resolver the sweep uses -- a witness that shares
// the thing it is witnessing is not a witness.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD_MARKET_MODULES, WORLD_MARKET_META } from '../lib/world-market-course.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';
import sources from '../lib/lesson-sources.json';

const ID = 'wm10-the-name-and-the-proof';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = WORLD_MARKET_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names (plain or range), or null. */
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it. Split on the quote
 *  character rather than a {10,} regex, so a short span cannot slip the sweep. */
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// THE SPINE, pinned by literal text. Every span was read out of the corpus on
// disk before it was written, and one span stands for each anchored reference
// the lesson quotes. Proverbs 20:14 in particular is why this is literal and not
// remembered: the KJV reads "but when he is gone his way", and memory supplies
// "and when he is gone his way".
const SPINE = [
  ['Proverbs 22:1', 'A good name is rather to be chosen than great riches, and loving favour rather than silver and gold'],
  ['Ecclesiastes 7:1', 'A good name is better than precious ointment'],
  ['Proverbs 27:2', 'Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips'],
  ['Revelation 3:1', 'I know thy works, that thou hast a name that thou livest, and art dead'],
  ['Matthew 7:16', 'Ye shall know them by their fruits. Do men gather grapes of thorns, or figs of thistles?'],
  ['James 2:18', 'shew me thy faith without thy works, and I will shew thee my faith by my works'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good'],
  ['Proverbs 14:15', 'The simple believeth every word: but the prudent man looketh well to his going'],
  ['1 Samuel 16:7', 'for man looketh on the outward appearance, but the LORD looketh on the heart'],
  ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much'],
  ['Proverbs 20:14', 'It is naught, it is naught, saith the buyer: but when he is gone his way, then he boasteth'],
  ['Proverbs 11:1', 'A false balance is abomination to the LORD: but a just weight is his delight'],
  ['Proverbs 20:10', 'Divers weights, and divers measures, both of them are alike abomination to the LORD'],
  ['Leviticus 19:36', 'Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt'],
  ['Ephesians 5:16', 'Redeeming the time, because the days are evil'],
  ['2 Corinthians 8:21', 'Providing for honest things, not only in the sight of the Lord, but also in the sight of men'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['John 3:16', 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life'],
  ['Deuteronomy 6:7', 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up'],
  ['Galatians 5:22', 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith'],
  ['Hebrews 3:13', 'But exhort one another daily, while it is called To day'],
];

// THE HONEST LIMIT, as five signals that must appear in EVERY place -- the adult
// lesson and all four bands. Each was counted across all five places before it
// was pinned and each occurs EXACTLY ONCE, in the disclosure itself, which is
// what makes the strip proofs below mean anything. A figure would NOT do: every
// figure in this lesson occurs twice per adult band.
const LIMIT = [
  ['the works were not tested', /we did not test the works/i],
  ['the read-back proves attribution only', /proves ATTRIBUTION|establishes ATTRIBUTION|only proves the firm SAID it/i],
  ['the 80 minutes did not read back', /absent from the page|not on the page at all/i],
  ['the report itself was never read', /sold rather than given|is not free/i],
  ['the source is wholly an advertisement', /(?:entire|whole) email (?:is|was) an ad(?:vertisement)?\b/i],
];

// The provenance every place must carry, so no reader meets a figure without it.
const PROVENANCE = [
  ['the publication', /Retail Dive/],
  ['the firm whose study it is', /Kearney/],
  ['the one word above the body', /Lessons/],
];

describe('wm10 is in the course, numbered, and whole', () => {
  it('exists exactly once as the tenth module with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(WORLD_MARKET_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(WORLD_MARKET_MODULES).toHaveLength(10);
    expect(WORLD_MARKET_MODULES[WORLD_MARKET_MODULES.length - 1].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('the course numbers run 1 to 10 with no gap and no duplicate', () => {
    // Counted off BOTH id shapes the catalogs use, because reading one shape
    // only is how a maximum gets read wrong (the-third-pile-is-a-worklist).
    const numbers = WORLD_MARKET_MODULES.map((m) => Number(/^wm(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'world-market-course.js'), 'utf8');
    const ids = [...src.matchAll(/\bid:\s*'(wm\d+-[^']+)'|"id"\s*:\s*"(wm\d+-[^"]+)"/g)].map((m) => m[1] || m[2]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(ID);
  });

  it('the course meta counts ten lessons rather than the nine it carried before', () => {
    expect(WORLD_MARKET_META.weeks).toBe(10);
    expect(WORLD_MARKET_META.weeks).toBe(WORLD_MARKET_MODULES.length);
    expect(WORLD_MARKET_META.format).toContain('10 lessons');
  });

  it('carries a quiz whose answers are in range, and two stories', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    expect(L.stories).toHaveLength(2);
  });
});

describe('a fabricated story is never labelled true', () => {
  // THE BRIGHT LINE. `kind: 'testimony'` renders to the reader as a TRUE STORY
  // told with the person's consent. This lesson is built from an advertisement:
  // nobody's life is in it, and nobody here holds a narrator or a consent. So
  // both stories are parables -- told to teach, which is what they are -- and
  // the point of this block is that the label can never drift to 'testimony'
  // to satisfy a gate.
  it('both stories are parables and neither claims to be a testimony', () => {
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    for (const s of L.stories) {
      expect(s.kind).not.toBe('testimony');
      expect(String(s.title).length).toBeGreaterThan(8);
      expect(String(s.body).length).toBeGreaterThan(400);
    }
  });

  it('and both are told in the third person, so no narrator is invented to speak', () => {
    // A parable in the first person would be a testimony wearing the other
    // label, which is the same lie by a longer road.
    for (const s of L.stories) {
      expect(s.body, s.title).not.toMatch(/\b(?:I|I'd|I'm|my|we)\b\s/);
      expect(s.body, s.title).toMatch(/^A (?:man|woman)\b/);
    }
  });

  it('PROVEN-TO-CATCH: the testimony label is detectable, not merely absent', () => {
    // A zero rule nobody can make fail is the anti-theatre case (DR-0076 §3).
    const asTestimony = L.stories.map((s) => ({ ...s, kind: 'testimony' }));
    expect(asTestimony.every((s) => s.kind === 'testimony')).toBe(true);
    expect(asTestimony.map((s) => s.kind)).not.toEqual(['parable', 'parable']);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the spine is verbatim off the corpus on disk, span by span', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve in the corpus`).toBeTruthy();
      expect(verse, `${ref} is not what the corpus holds`).toContain(span);
    }
  });

  it('and each spine span is actually carried by the adult lesson', () => {
    // Otherwise the block above would verify the corpus against itself and say
    // nothing whatever about this lesson.
    for (const [ref, span] of SPINE) {
      expect(L.lesson, `the adult lesson drops ${ref}`).toContain(span);
    }
  });

  it('every referenced span in every place is verbatim, and the sweep is not empty', () => {
    const texts = Object.values(TEXTS);
    expect(referencedCount(texts), 'the sweep read no referenced spans at all').toBe(105);
    expect(verbatimFaults(texts)).toEqual([]);
  });

  it('no quotation is elided and no record id is recited to a reader', () => {
    expect(elidedQuotations(EVERY_STRING)).toEqual([]);
    expect(recitedRecords(EVERY_STRING)).toEqual([]);
    for (const s of EVERY_STRING) {
      expect(s, 'a decision record id reached a reader-facing string').not.toMatch(/DR-\d{4}/);
      expect(s, 'a Gmail thread id reached a reader-facing string').not.toMatch(/\b[0-9a-f]{16}\b/);
    }
  });

  it('PROVEN-TO-CATCH: one altered word inside a verse is found', () => {
    const bent = 'He says "I know thy works, that thou hast a name that thou livest, and art alive." (Revelation 3:1)';
    expect(verbatimFaults([bent])).toHaveLength(1);
    expect(verbatimFaults(['He says "I know thy works, that thou hast a name that thou livest, and art dead." (Revelation 3:1)'])).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the apostrophe class, which is what actually bites', () => {
    // The corpus carries the typographic apostrophe. A straight one is a
    // different byte and a different quotation, and this is the single most
    // common fault class in this house.
    const corpus = corpusText('Ecclesiastes 7:1');
    expect(corpus).toContain('the day of death than the day of one’s birth');
    expect(corpus).not.toContain("the day of death than the day of one's birth");
    expect(verbatimFaults([`x "and the day of death than the day of one's birth" (Ecclesiastes 7:1)`])).toHaveLength(1);
  });
});

describe('the anchor names every verse the lesson stands on, both directions', () => {
  it('every anchor reference resolves and is named in the adult lesson', () => {
    const refs = anchorRefs(L);
    expect(refs.length).toBe(21);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r} does not resolve`).toBeTruthy();
      expect(L.lesson, `anchor ref ${r} is never named in the lesson`).toContain(r);
    }
  });

  it('and every reference the lesson quotes is covered by the anchor', () => {
    // Search it out derives its links from anchor.ref and never from a typed
    // list (DR-0734), so a quoted verse missing from the anchor is a verse the
    // reader cannot follow.
    const refs = new Set(anchorRefs(L));
    const quoted = new Set();
    for (const t of Object.values(TEXTS)) for (const p of quotedPairs(t)) if (p.ref) quoted.add(p.ref);
    expect([...quoted].filter((r) => !refs.has(r))).toEqual([]);
    expect(quoted.size).toBeGreaterThan(15);
  });

  it('PROVEN-TO-CATCH: an anchor reference the lesson never names is found', () => {
    const planted = [...anchorRefs(L), 'Obadiah 1:4'];
    expect(planted.filter((r) => !L.lesson.includes(r))).toEqual(['Obadiah 1:4']);
  });
});

describe('the honest limit is on every surface a reader can open', () => {
  it.each(LIMIT)('%s — in the adult lesson and in all four bands', (_label, re) => {
    for (const p of PLACES) expect(TEXTS[p], `${p} drops this disclosure`).toMatch(re);
  });

  it('each disclosure signal occurs EXACTLY ONCE per place, which is what makes the strip proof real', () => {
    // The bug this prevents: DR-1275 pinned `367,000` and the strip proof passed
    // with the disclosure deleted, because the figure also sat in the body. A
    // pin that occurs twice proves nothing about either occurrence.
    for (const [label, re] of LIMIT) {
      const global = new RegExp(re.source, `${re.flags.replace('g', '')}g`);
      for (const p of PLACES) {
        expect((TEXTS[p].match(global) || []).length, `${label} is not unique in ${p}`).toBe(1);
      }
    }
  });

  it.each(PROVENANCE)('%s is named in every place', (_label, re) => {
    for (const p of PLACES) expect(TEXTS[p], `${p} names no provenance`).toMatch(re);
  });

  it('the figures the lesson states are exactly the strings the witness reads back', () => {
    // The row and the lesson must not drift apart: a `says` string the lesson
    // no longer carries, or a figure in the lesson with no row behind it, is
    // how a read-back stops witnessing anything.
    const row = sources[ID];
    expect(row, 'wm10 has no row in lesson-sources.json').toBeTruthy();
    expect(row).toHaveLength(1);
    expect(row[0].publisher).toBe('Kearney Consumer Institute');
    expect(row[0].says.length).toBeGreaterThan(0);
    for (const says of row[0].says) {
      expect(L.lesson, `the lesson no longer carries the witnessed string ${says}`).toContain(says);
    }
  });

  it('and the lesson never upgrades that read-back into a verified claim', () => {
    // The whole spine. A read-back proves the publisher said it; the publisher
    // is also the seller; so the lesson must say both halves and never only the
    // flattering one.
    //
    // THE FIRST VERSION OF THIS CHECK FIRED ON CORRECT CONTENT, which is the
    // failure plain-before-the-term's header forbids, and it is recorded here
    // rather than quietly rewritten. It refused the phrase "the study is sound"
    // anywhere — and the youth band carries it inside a NEGATION: "It
    // establishes nothing about whether the study is sound". A negative regex
    // over prose will always catch the negated form of the thing it forbids, so
    // the strings below are ones that cannot appear inside a denial, and they
    // were counted absent across all five places before being trusted.
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} claims more than attribution`).not.toMatch(/we (?:have )?(?:independently )?verified|we tested the works|we confirmed (?:the|that)|the figures are verified/i);
      expect(TEXTS[p], `${p} drops the seller-is-the-witness half`).toMatch(/we did not test the works/i);
    }
  });

  it('PROVEN-TO-CATCH: deleting the disclosure from ONE band names that band', () => {
    const [, re] = LIMIT[0];
    const global = new RegExp(re.source, 'gi');
    const stripped = { ...TEXTS, teen: TEXTS.teen.replace(global, 'the works were tested') };
    const missing = PLACES.filter((p) => !re.test(stripped[p]));
    expect(missing).toEqual(['teen']);
    // and the unbroken article still reads green, so the check is not always-red
    expect(PLACES.filter((p) => !re.test(TEXTS[p]))).toEqual([]);
  });
});

describe('the lesson teaches both halves of a name, and never only one', () => {
  it('a good name is real property AND is not its own witness, in every place', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} drops the half that a good name is worth having`).toMatch(/good name is rather to be chosen|good name is better than precious ointment/);
      expect(TEXTS[p], `${p} drops the half that a name does not certify itself`).toMatch(/not thine own mouth|when a name brags about itself/);
    }
  });

  it('the TURN is in every place: the buyer holds a weight too', () => {
    // Without this a reader leaves better at suspecting sellers and no better
    // at weighing his own claim, which is the wrong half taken with care.
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} drops Proverbs 20:14`).toMatch(/saith the buyer/);
      expect(TEXTS[p], `${p} never puts the weight in the buyer's own hand`).toMatch(/(?:false weight|trick) in the BUYER’S hand/i);
    }
  });

  it('and it names no company as trustworthy or untrustworthy', () => {
    // The lesson is the TEST, never a verdict on a name -- which is also the
    // only reason an advertisement could be taught at all.
    for (const s of EVERY_STRING) {
      expect(s).not.toMatch(/Kearney is (?:a )?(?:trustworthy|untrustworthy|reliable|dishonest)/i);
      expect(s).not.toMatch(/Retail Dive is (?:trustworthy|untrustworthy|dishonest)/i);
    }
    const joined = EVERY_STRING.join(' ');
    expect(joined).toMatch(/accuses that firm of dishonesty and nothing here knows|We are not saying those people lied/);
  });
});

describe('every band sends the reader all three ways', () => {
  it('the module pooled carries all three directions', () => {
    expect(hasAllThree(L)).toBe(true);
  });

  it('and so does every single place, because a reader reads ONE band', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it.each(PLACES)('%s carries parents-to-children, children-to-parents and friend-to-friend by literal text', (p) => {
    const t = TEXTS[p];
    expect(t).toMatch(/TALK ABOUT IT TOGETHER/);
    expect(t, 'parents to children').toMatch(/Parents, ask your children one open question/);
    expect(t, 'children to parents').toMatch(/Children, ask your mom, dad or grandparent/);
    expect(t, 'friend to friend').toMatch(/Friends, tell one friend this week/);
    expect(t, 'the skill: listen to the end').toMatch(/listen all the way to the end/);
    expect(t, 'the skill: retell').toMatch(/retell it in their own words/);
    expect(t, 'the skill: teach one verse').toMatch(/teach them one verse back/);
    expect(t, "the rhythm: one of Deuteronomy 6:7's four places").toMatch(/when thou sittest in thine house/);
    expect(t, 'growth measured qualitatively, by the fruit').toMatch(/fruit of the Spirit/);
    expect(t, 'growth measured quantitatively, by the days').toMatch(/exhort one another daily/);
  });

  it('PROVEN-TO-CATCH: stripping ONE band’s friend line names that band while the pool stays green', () => {
    // Exactly the proof the builder brief asks for (DR-0795): the per-band check
    // must name the short band while hasAllThree(module) still reads green,
    // because the pool is satisfied by any other band carrying the line.
    // placesMissingDirections returns [{ place, missing }], not bare names.
    const bent = { ...L, levels: { ...L.levels, child: L.levels.child.replace(/Friends, tell one friend this week[^.]*\./, '') } };
    const named = placesMissingDirections(bent);
    expect(named.map((x) => x.place)).toContain('child');
    expect(named.find((x) => x.place === 'child').missing.length).toBeGreaterThan(0);
    expect(hasAllThree(bent), 'the pooled check cannot see a single short band').toBe(true);
    // and the real article is short nowhere
    expect(placesMissingDirections(L)).toEqual([]);
  });
});

describe('the four bands are measured, not claimed', () => {
  it('no band is short of its floor', () => {
    const measured = measureFullness(L);
    expect(measured.adultWords).toBeGreaterThan(1500);
    expect(shortBands(measured, FULL_FLOOR)).toEqual([]);
    expect(measured.bands.child.share).toBeGreaterThanOrEqual(0.5);
    for (const b of ['youth', 'teen', 'senior']) {
      expect(measured.bands[b].share, b).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('the reading ladder ascends and the child band is under the new-lesson ceiling', () => {
    // measureLesson returns { id, bands: { child: { authored, full }, ... } };
    // `authored` is the grade with quoted Scripture stripped, which is the only
    // register it is fair to score an author on.
    const m = measureLesson(L);
    expect(isInverted(m), `the ladder is not strictly ascending: ${JSON.stringify(m.bands)}`).toBe(false);
    const g = Object.fromEntries(BANDS.map((b) => [b, m.bands[b].authored]));
    expect(g.child).toBeLessThan(NEW_LESSON_CHILD_CEILING);
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
  });

  it('the bands are four versions rather than one repeated', () => {
    // duplicatedBands takes the MEASUREMENT, not the module.
    const d = measureDifferentiation(L);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
    expect(duplicatedBands(d)).toEqual([]);
  });

  it('and each band names the lesson in its own opening', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
});
