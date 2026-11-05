// @vitest-environment node
// =============================================================================
// L278 — Say What You Get: the gate, the ten witnesses, and the honest no
// =============================================================================
// Captured by the Gmail-lesson-intake Way from thread 1a1594cdb35eb4e4, one
// message, forwarded 2026-10-20 12:31:04 UTC from dpoe@illinois.edu to
// darrellpoe06@gmail.com, subject Fw: Dimon's Private Pentagon — a The Daily
// Upside of 2026-10-20 — with one word typed above the forwarded header in his
// own hand: Lessons. Built and landing 2026-11-05 (DR-1319).
//
// WHAT THIS GATE EXISTS TO HOLD, and what each check is paying for.
//  (1) THE TEACHING IS THE HALO, NOT THE PROMISE. Three of the digest's four
//      candidate items are refused by WHERE their teaching would LAND, never by
//      the verses they would use. The promise/performance reading of
//      the two gift-shaped announcements is sov65 (DR-1314), built the same day
//      on Numbers 30:2, Deuteronomy 23:21-22 and Matthew 21:28-31; the
//      market item read as a seller's clock is sov59; the steel item read as a
//      just weight or a renamed problem is ll98, ll111, ll134, ll144, ll97,
//      ll236 and ll178. This lesson lands somewhere none of them do: on whether
//      a man says out loud what HE gets. The checks below pin that landing by
//      measurement rather than by prose.
//  (2) A VERSE IS NEVER SPENT. 1 Samuel 13:19-22 is also ll215's
//      ground and Ruth 4:7, 9 is also prop5's. Both foundations are taught HERE
//      in full, carried to a different point, and NOT ONE verse was dropped for
//      being used elsewhere. The overlap is how lessons connect.
//  (3) EVERY LESSON STANDS ALONE. No reader text points at another
//      lesson, because a reader may open exactly one. That is proven-to-catch:
//      a planted cross-reference reddens the check.
//  (4) NO SIDE, AND THE ABSENCE IS A MACHINE CHECK. The source is a business
//      digest carrying a defence-contracting item. A lesson that names a
//      company, a bank, a person or a party hands the reader a team. The
//      forbidden-names sweep runs over EVERY string of the module at any depth.
//  (5) THE THREE TIERS HELD APART (DR-0100) in all five reader texts, with the
//      documented half stated FLAT rather than hedged.
//  (6) NOT STAKING THE TEACHING ON A FIGURE. The publisher refused twice; the
//      exact refusals are quoted, and no reader text states a dollar figure, a
//      percentage or a source magnitude. The two surviving numerals are the
//      quoted error code and the chapter number, and both are named here.
//  (7) THE GATES' OWN FUNCTIONS ARE RUN, not re-implemented (the ll269
//      finding): measureFullness/shortBands, measureLesson/isInverted,
//      measureDifferentiation/duplicatedBands, fourBandFaults,
//      hasAllThree/placesMissingDirections, unnamedBands, formatLessonText,
//      elidedQuotations/recitedRecords, findBritish and censusLesson.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { censusLesson } from '../lib/library-census.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish } from '../../../scripts/american-spelling.mjs';
import { fourBandFaults } from './fixtures/four-band-ladder.js';

const ID = 'll278-say-what-you-get';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

// ---------------------------------------------------------------------------
// The corpus on disk is the only authority for a quoted span.
// ---------------------------------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names, or null when it does not resolve. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*(?:\d+:)?\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    let lastCh = ch;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const mm = /^(?:(\d+):)?(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm) return null;
      if (mm[1]) lastCh = mm[1];
      if (!push(lastCh, mm[2], mm[3])) return false;
    }
  }
  return out.join(' ');
}
/** Every quoted span with the reference that follows it; odd split indices are inside quotes. */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
/** Referenced spans that are not what the corpus holds. Contiguous only: no elision accepted. */
export function verbatimFaults(texts) {
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
const bareSpans = (texts) => texts.flatMap((t) => quotedPairs(t).filter((p) => !p.ref).map((p) => p.inside.slice(0, 60)));
/** Our authored voice: the even segments between double quotes. */
const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');
const insideQuotes = (t) => String(t).split('"').filter((_, i) => i % 2 === 1).join(' ');

// ---------------------------------------------------------------------------
// THE SPINE. Every reference the lesson stands on, and the exact span quoted
// for it, so no reference can be listed without the Word actually being taught
// for it. Each fragment is asserted to be a substring of THAT verse in the
// corpus AND present in the ADULT lesson.
// ---------------------------------------------------------------------------
export const SPINE = [
  ['Ruth 4:1', 'Then went Boaz up to the gate, and sat him down there'],
  ['Ruth 4:2', 'And he took ten men of the elders of the city, and said, Sit ye down here'],
  ['Ruth 4:3', 'selleth a parcel of land, which was our brother Elimelech’s'],
  ['Ruth 4:4', 'and I am after thee'],
  ['Ruth 4:5', 'thou must buy it also of Ruth the Moabitess, the wife of the dead'],
  ['Ruth 4:6', 'I cannot redeem it for myself, lest I mar mine own inheritance'],
  ['Ruth 4:7', 'a man plucked off his shoe, and gave it to his neighbour: and this was a testimony in Israel'],
  ['Ruth 4:8', 'Buy it for thee. So he drew off his shoe'],
  ['Ruth 4:9', 'Ye are witnesses this day, that I have bought all that was Elimelech’s'],
  ['Ruth 4:10', 'have I purchased to be my wife'],
  ['Ruth 4:11', 'And all the people that were in the gate, and the elders, said, We are witnesses'],
  ['Proverbs 11:26', 'but blessing shall be upon the head of him that selleth it'],
  ['Deuteronomy 25:4', 'Thou shalt not muzzle the ox when he treadeth out the corn'],
  ['1 Timothy 5:18', 'The labourer is worthy of his reward'],
  ['2 Thessalonians 3:8', 'that we might not be chargeable to any of you'],
  ['Acts 20:34', 'these hands have ministered unto my necessities'],
  ['Acts 20:35', 'It is more blessed to give than to receive'],
  ['Matthew 6:1', 'Take heed that ye do not your alms before men, to be seen of them'],
  ['Matthew 6:2', 'They have their reward'],
  ['Matthew 6:3', 'let not thy left hand know what thy right hand doeth'],
  ['Matthew 6:4', 'That thine alms may be in secret'],
  ['Proverbs 25:14', 'Whoso boasteth himself of a false gift is like clouds and wind without rain'],
  ['Acts 5:3', 'to keep back part of the price of the land'],
  ['Acts 5:4', 'Whiles it remained, was it not thine own?'],
  ['1 Samuel 13:19', 'Now there was no smith found throughout all the land of Israel'],
  ['1 Samuel 13:20', 'to sharpen every man his share, and his coulter, and his axe, and his mattock'],
  ['1 Samuel 13:22', 'there was neither sword nor spear found in the hand of any of the people'],
  ['Nehemiah 4:17', 'every one with one of his hands wrought in the work, and with the other hand held a weapon'],
  ['Philippians 2:4', 'Look not every man on his own things, but every man also on the things of others'],
  ['Psalms 24:1', 'The earth is the LORD’s, and the fulness thereof'],
  ['Romans 13:7', 'Render therefore to all their dues'],
  ['2 Corinthians 4:2', 'But have renounced the hidden things of dishonesty'],
  ['Galatians 5:22', 'But the fruit of the Spirit is love, joy, peace, longsuffering'],
  ['Deuteronomy 6:7', 'when thou walkest by the way, and when thou liest down, and when thou risest up'],
  ['Hebrews 3:13', 'But exhort one another daily, while it is called To day'],
  ['Luke 2:52', 'And Jesus increased in wisdom and stature'],
  ['Isaiah 53:11', 'He shall see of the travail of his soul, and shall be satisfied'],
  ['Hebrews 12:2', 'who for the joy that was set before him endured the cross, despising the shame'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['John 3:16', 'For God so loved the world, that he gave his only begotten Son'],
  ['Hebrews 1:8', 'Thy throne, O God, is for ever and ever'],
];

// The names this lesson refuses to carry: every company, bank, person, party,
// country and branded particular the digest put in front of it.
export const FORBIDDEN_NAMES = [
  'JPMorgan', 'JP Morgan', 'Dimon', 'Anthropic', 'Claude', 'Musk', 'SpaceX', 'xAI', 'Grok',
  'CoreWeave', 'Intel', 'Nvidia', 'AMD', 'Micron', 'Meta', 'Barclays', 'Goldman', 'FactSet',
  'Cleveland-Cliffs', 'Goncalves', 'Hadrian', 'Castelion', 'Perpetua', 'Berkshire', 'Combs',
  'Trump', 'Republican', 'Democrat', 'China', 'Chinese', 'Beijing', 'Oracle', 'NetSuite',
  'Yahoo', 'Ford', 'General Motors', 'Chevy', 'PlayStation', 'Daily Upside', 'Semafor',
  'Vinted', 'Blackbeard', 'Stibnite', 'antimony', 'Pentagon', 'Idaho', 'Maryland', 'Ukraine',
  'Section 232', 'Nasdaq', 'Wall Street', 'Virginia-class', 'Anduril',
];

const REFUSED = [
  'The publisher could not be reached from here.',
  'CONNECT tunnel failed, response 403',
  'the host could not be found',
];

describe('L278 is mounted, whole, and dated', () => {
  it('the module exists in Living Lessons', () => {
    expect(L, `${ID} is not in LIVING_LESSONS_MODULES`).toBeTruthy();
  });

  it('it carries every component and every version — the library ratchet (DR-1266)', () => {
    const c = censusLesson(L);
    expect(c.missingComponents).toEqual([]);
    expect(c.missingVersions).toEqual([]);
    expect(c.whole).toBe(true);
    expect(c.short).toBe(false);
    expect(c.adultWords).toBeGreaterThan(1200);
  });

  it('it is dated, and the date is the build day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-05');
  });

  it('the exam, the benefits, the talking points and the run of show are real', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(12);
    expect(L.benefits.length).toBeGreaterThanOrEqual(12);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(12);
    expect(L.facilitator.howToRun.split(/\s+/).length).toBeGreaterThan(150);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
  });
});

describe('every verse is the corpus on disk', () => {
  it('no referenced span across the whole module differs from the KJV by one character', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('the sweep is actually reading something — it asserts its own count', () => {
    const n = referencedCount(EVERY_STRING);
    expect(n).toBeGreaterThanOrEqual(150);
    expect(referencedCount(PLACES.map((p) => TEXTS[p]))).toBeGreaterThanOrEqual(120);
  });

  it('no bare double-quoted span anywhere: every quotation carries its reference', () => {
    expect(bareSpans(EVERY_STRING)).toEqual([]);
  });

  it('every double-quote mark is paired in every reader place', () => {
    for (const p of PLACES) {
      expect((TEXTS[p].match(/"/g) || []).length % 2, `${p} has an unpaired quote mark`).toBe(0);
    }
  });

  it('no elided quotation and no decision record recited to a reader', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation reddens the sweep', () => {
    const broken = L.lesson.replace(
      'but blessing shall be upon the head of him that selleth it',
      'but blessing shall be upon the head of him that giveth it',
    );
    expect(broken, 'the span to break was not found — this gate proves nothing').not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a straightened apostrophe reddens the sweep (the DR-1273 fault class)', () => {
    const broken = L.lesson.replace('The earth is the LORD’s', "The earth is the LORD's");
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: changed case reddens the sweep', () => {
    const broken = L.lesson.replace('Then went Boaz up to the gate', 'then went Boaz up to the gate');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });
});

describe('the spine: the anchor names every verse and every named verse is taught', () => {
  it('anchor.ref is EXACTLY the pinned spine, in order (DR-0734)', () => {
    expect(L.anchor.ref).toBe(SPINE.map(([r]) => r).join('; '));
  });

  it('every pinned fragment really is that verse, and is quoted in the ADULT lesson', () => {
    for (const [ref, frag] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve in the corpus`).toBeTruthy();
      expect(verse.includes(frag), `${ref}: the pinned fragment is not in the verse`).toBe(true);
      expect(L.lesson.includes(frag), `${ref}: the adult lesson never quotes it`).toBe(true);
    }
  });

  it('nothing is quoted that the anchor does not name', () => {
    const named = new Set(SPINE.map(([r]) => r));
    const quoted = new Set();
    for (const t of EVERY_STRING) {
      for (const { ref } of quotedPairs(t)) {
        if (!ref) continue;
        for (const piece of ref.split(';').map((s) => s.trim())) {
          const m = /^((?:[1-3]\s)?[A-Za-z]+)\s+(\d+):(\d+)/.exec(piece);
          if (m) quoted.add(`${m[1]} ${m[2]}:${m[3]}`);
          else quoted.add(piece);
        }
      }
    }
    expect([...quoted].filter((r) => !named.has(r))).toEqual([]);
  });

  it('the hinge is present in EVERY reader place: Moreover, and the gain named out loud', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} loses the hinge word`).toMatch(/Moreover/);
      expect(TEXTS[p], `${p} never quotes the gain`).toContain('have I purchased to be my wife');
    }
  });

  it('the blessing on the seller is present in EVERY reader place', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} drops Proverbs 11:26`).toContain('blessing shall be upon the head of him that selleth it');
    }
  });

  it('A VERSE IS NEVER SPENT: the two shared foundations are taught here in full', () => {
    // 1 Samuel 13:19-22 is also ll215's ground; Ruth 4:7, 9 is also prop5's.
    // Neither was dropped. Both are taught, with the Word quoted for them.
    expect(L.anchor.ref).toContain('1 Samuel 13:19');
    expect(L.anchor.ref).toContain('Ruth 4:7');
    expect(L.lesson).toContain('Now there was no smith found throughout all the land of Israel');
    expect(L.lesson).toContain('a testimony in Israel');
  });
});

describe('every lesson stands alone', () => {
  const POINTS_ELSEWHERE = /\b(ll\d{2,3}|sov\d{1,3}|prop\d{1,2}|L\d{2,3}\b)|another lesson in this course|this course already teaches|as taught in lesson/i;

  it('no reader text points the reader at another lesson', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} carries a cross-reference that belongs in the record`).not.toMatch(POINTS_ELSEWHERE);
    }
    expect(L.bigIdea).not.toMatch(POINTS_ELSEWHERE);
    expect(L.anchor.theme).not.toMatch(POINTS_ELSEWHERE);
    expect(L.inApp).not.toMatch(POINTS_ELSEWHERE);
  });

  it('PROVEN TO CATCH: a planted cross-reference reddens the check', () => {
    const broken = `${L.lesson} This course already teaches that verse in ll215.`;
    expect(broken).toMatch(POINTS_ELSEWHERE);
  });
});

describe('no side: the charged source is taught without a team (DR-0098)', () => {
  it('no company, bank, person, party or branded particular appears in ANY string of the module', () => {
    const all = EVERY_STRING.join('\n');
    const found = FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(all));
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: one planted name reddens the sweep', () => {
    const broken = [...EVERY_STRING, 'The bank was JPMorgan.'].join('\n');
    const found = FORBIDDEN_NAMES.filter((n) => new RegExp(`\\b${n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(broken));
    expect(found.length).toBeGreaterThan(0);
  });

  // SCOPED, and the scope is the point. The child and youth bands carry the
  // principle and NONE of the particulars (DR-0100 as ll274 applied it), so
  // they have no names to disclaim and no removes to count. The three texts
  // that DO carry the particulars must carry the whole disclosure.
  it('every text that carries the particulars says out loud that it names nobody, with the reason', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} never states the no-names rule`)
        .toMatch(/no company,(?: no)? bank,(?: no)? person (?:and no|or) party is named/i);
      expect(TEXTS[p], `${p} never gives the reason`).toMatch(/side to (join|take|pick)/i);
    }
  });
});

describe('the three tiers are held apart in all five reader texts (DR-0100)', () => {
  it('the documented half is stated FLAT, never hedged into some say', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} does not state the documented half`).toMatch(/one hundred percent commercial/i);
      expect(TEXTS[p], `${p} hedges a documented thing`).not.toMatch(/\bsome say\b|\ballegedly\b|\bit is claimed that\b/i);
    }
  });

  it('the child and youth bands carry the principle and keep the particulars out', () => {
    for (const b of ['child', 'youth']) {
      expect(ourVoice(TEXTS[b]), `${b} carries a particular it must not`)
        .not.toMatch(/\bmining\b|\bmissiles?\b|\bdefence\b|\bdefense\b|\bbank\b|\bnewsletter\b|\bcommercial\b|\bphilanthropy\b/i);
    }
  });

  it('the teen, senior and adult texts name all three piles and list the unchecked one', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} is missing the documented pile`).toMatch(/[Dd]ocumented/);
      expect(TEXTS[p], `${p} is missing the open pile`).toMatch(/genuinely open/i);
      expect(TEXTS[p], `${p} is missing the unchecked pile`).toMatch(/[Nn]ever checked/);
      expect(TEXTS[p], `${p} does not list the unchecked items`).toMatch(/item by item|one at a time/i);
    }
  });

  it('the refused roads are QUOTED, not paraphrased (DR-0108), in the three texts that name them', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} does not quote the first refusal`).toContain('CONNECT tunnel failed, response 403');
      expect(TEXTS[p], `${p} does not quote the second refusal`).toMatch(/host could not be found/);
    }
    expect(REFUSED.length).toBe(3);
  });

  it('PROVEN TO CATCH: stripping the unchecked pile from the teen band alone names teen', () => {
    const stripped = TEXTS.teen.replace(/Never checked here/g, 'Also');
    expect(stripped).not.toBe(TEXTS.teen);
    expect(/[Nn]ever checked/.test(stripped)).toBe(false);
    expect(/[Nn]ever checked/.test(TEXTS.senior), 'the senior band must still carry it').toBe(true);
  });
});

describe('the teaching rests on no figure from the source', () => {
  const ANCHOR_BOOKS = [...new Set(String(L.anchor.ref).split(';')
    .map((r) => /^\s*((?:[1-3]\s)?[A-Za-z]+)\s+\d+:/.exec(r)).filter(Boolean).map((m) => m[1]))]
    .sort((a, b) => b.length - a.length);

  // SCOPED, not hollowed. A Scripture reference lives in our-voice prose by
  // design (DR-0734), so every reference built from this lesson's own anchor
  // books is removed first, along with any parenthetical carrying a digit.
  // The only numerals that may survive are the quoted error code and the
  // chapter number the close sends the reader to.
  const ALLOWED = new Set(['403', '4']);
  const scrub = (text) => {
    let s = ourVoice(text);
    for (const b of ANCHOR_BOOKS) s = s.replace(new RegExp(`\\b${b}\\s+\\d+(?::\\d+(?:-\\d+)?)?`, 'g'), ' ');
    return s.replace(/\([^)]*\d[^)]*\)/g, ' ');
  };

  it('no currency symbol, percentage sign or unexplained figure in any reader place', () => {
    for (const p of PLACES) {
      const hits = (scrub(TEXTS[p]).match(/[$%]|\b\d[\d,.]*\b/g) || []).filter((h) => !ALLOWED.has(h));
      expect(hits, `${p} stakes a figure from the source`).toEqual([]);
    }
    for (const field of [L.bigIdea, L.anchor.theme, L.inApp]) {
      const hits = (scrub(field).match(/[$%]|\b\d[\d,.]*\b/g) || []).filter((h) => !ALLOWED.has(h));
      expect(hits).toEqual([]);
    }
  });

  it('PROVEN TO CATCH: one planted dollar figure reddens the check', () => {
    const broken = `${L.lesson} The programme was $1.5 trillion over ten years.`;
    const hits = (scrub(broken).match(/[$%]|\b\d[\d,.]*\b/g) || []).filter((h) => !ALLOWED.has(h));
    expect(hits.length).toBeGreaterThan(0);
  });

  it('every text that names the source says who taught it: nobody, because it is a newsletter', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} does not say no teacher taught it`).toMatch(/no teacher|none taught it|nobody taught (this|it)/i);
    }
  });

  it('every text that names the source counts the removes between it and this app', () => {
    for (const p of ['adult', 'teen', 'senior']) {
      expect(TEXTS[p], `${p} does not count the removes`).toMatch(/remove/i);
    }
  });
});

describe('the four bands are four compositions, measured not claimed', () => {
  it('fourBandFaults is empty — the whole ladder in one call', () => {
    expect(fourBandFaults(L)).toEqual([]);
  });

  it('no band is short: the gate\'s own measure', () => {
    const f = measureFullness(L);
    expect(shortBands(f)).toEqual([]);
    for (const b of BANDS) expect(f.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('the reading ladder rises and the child band is under the new-lesson ceiling', () => {
    const m = measureLesson(L);
    expect(isInverted(m)).toBe(false);
    expect(m.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    const g = ['child', 'youth', 'teen', 'senior'].map((b) => m.bands[b].authored);
    expect(g, 'the authored ladder must rise').toEqual([...g].sort((a, b) => a - b));
  });

  it('no band is a near copy of another: the differentiation gate\'s own measure', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    // The per-lesson LADDER is stricter than DIFF_CEILING (0.25 against 0.5),
    // and fourBandFaults above holds it. Recorded so the next builder reading
    // only DIFF_CEILING does not ship a near copy the stricter line refuses.
    expect(DIFF_CEILING).toBeGreaterThan(0.25);
  });

  it('every band names its lesson in its opening', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('every band renders without losing a word, and the headings number straight through', () => {
    for (const p of PLACES) {
      const out = formatLessonText(TEXTS[p]);
      const ns = out.items.filter((i) => i.kind === 'heading').map((i) => i.n);
      expect(ns.length, `${p} has no headings`).toBeGreaterThan(5);
      expect(ns).toEqual(ns.map((_, i) => i + 1));
    }
  });

  it('our prose is American where the house requires it, and the KJV is left alone', () => {
    for (const p of PLACES) expect(findBritish(ourVoice(TEXTS[p])), `${p}`).toEqual([]);
    expect(insideQuotes(L.lesson)).toMatch(/labourer|neighbour|honour|favour/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson AND every band carry all three directions, by the gate\'s own measure', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it('every reader place carries the three directions by their literal text', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} does not send parents to children`).toMatch(/\b(Parents|Grandparents)\b/);
      expect(TEXTS[p], `${p} does not send children to parents`).toMatch(/your (mom|dad|parents|grandparents)/i);
      expect(TEXTS[p], `${p} does not send friend to friend`).toMatch(/\bFriends\b/);
    }
  });

  it('every reader place carries the skill and the rhythm, and the aim', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} drops the skill`).toMatch(/listen all the way to the end|listen to the whole answer/i);
      expect(TEXTS[p], `${p} drops the retell`).toMatch(/retell|tell the story back|in their own words/i);
      expect(TEXTS[p], `${p} drops teaching a verse back`).toMatch(/teach (them|him|her) one verse back/i);
      expect(TEXTS[p], `${p} drops the rhythm`).toContain('at the table, on the way, at bedtime or first thing');
      expect(TEXTS[p], `${p} drops one friend this week`).toContain('one friend this week');
      expect(TEXTS[p], `${p} drops the aim`).toContain('So we all get healthy together, until we see that Yahweh has been right.');
    }
  });

  it('PROVEN TO CATCH: stripping ONE band\'s friend line names that band while the pooled check stays green', () => {
    const idx = TEXTS.child.indexOf('Friends, tell one friend this week');
    expect(idx, 'the child band friend line was not found — this gate proves nothing').toBeGreaterThan(-1);
    const end = TEXTS.child.indexOf('.', TEXTS.child.indexOf('hides why', idx)) + 1;
    const stripped = TEXTS.child.slice(0, idx) + TEXTS.child.slice(end);
    const broken = { ...L, levels: { ...L.levels, child: stripped } };
    const missing = placesMissingDirections(broken);
    expect(missing.map((m) => m.place)).toEqual(['child']);
    expect(missing[0].missing).toEqual(['friends']);
    // and the POOLED check still reads green, which is the whole point of DR-0795
    expect(hasAllThree(broken)).toBe(true);
  });
});

describe('growth is measured the Word\'s way, never imported', () => {
  it('the qualitative measure is the fruit and the quantitative is occasions and days', () => {
    const where = [L.lesson, L.inApp, L.anchor.theme].join('\n');
    expect(where).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering');
    expect(where).toMatch(/Galatians 5:22/);
    expect(where).toMatch(/Deuteronomy 6:7/);
    expect(where).toMatch(/Hebrews 3:13/);
    expect(where).toMatch(/occasions and days/);
  });

  it('no imported metric is used as the measure of growth', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} imports a metric`).not.toMatch(/\bKPI\b|net promoter|engagement score|percentile/i);
    }
  });

  it('the close sends the reader back into the text', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} does not send the reader back to the chapter`).toMatch(/[Rr]ead (it yourself|Ruth)|Ruth chapter 4/);
    }
  });
});

describe('the confession and the typographic theology (DR-0210 / CLAUDE.md)', () => {
  it('every reader place confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} does not confess Him`).toMatch(/the Lamb of Yahweh and the Eternal Son of Yahweh/);
    }
    expect(L.bigIdea).toMatch(/the Lamb of Yahweh and the Eternal Son of Yahweh/);
    expect(L.anchor.theme).toMatch(/the Lamb of Yahweh and the Eternal Son of Yahweh/);
  });

  it('no generic God in OUR authored voice, anywhere in the module', () => {
    const faults = [];
    for (const t of EVERY_STRING) {
      const v = ourVoice(t);
      if (/\bGod\b/.test(v)) faults.push(v.match(/.{0,50}\bGod\b.{0,50}/)[0]);
    }
    expect(faults).toEqual([]);
  });

  it('the KJV\'s own God and LORD are left EXACTLY as written inside every quotation', () => {
    const q = insideQuotes(EVERY_STRING.join('\n'));
    expect(q).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(q).toContain('For God so loved the world, that he gave his only begotten Son');
    expect(q).toContain('Thy throne, O God, is for ever and ever');
    expect(q).toContain('The earth is the LORD’s');
  });

  it('Yahweh never appears inside a quotation', () => {
    expect(insideQuotes(EVERY_STRING.join('\n'))).not.toMatch(/Yahweh/);
  });

  it('PROVEN TO CATCH: a Yahweh planted inside a quoted span is caught twice over', () => {
    const broken = L.lesson.replace(
      'For God so loved the world',
      'For Yahweh so loved the world',
    );
    expect(broken).not.toBe(L.lesson);
    expect(insideQuotes(broken)).toMatch(/Yahweh/);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('no adversary name is capitalized anywhere, and the corpus\'s own lowercase satan is kept', () => {
    const all = EVERY_STRING.join('\n');
    expect(all).not.toMatch(/\b(Satan|Lucifer|Baal|The Devil)\b/);
    expect(insideQuotes(all)).toContain('why hath satan filled thine heart');
  });
});

describe('the landing is this lesson\'s own (DR-0610, read as where a lesson lands)', () => {
  it('the lesson lands on naming your own gain, and says so in every reader place', () => {
    for (const p of PLACES) {
      expect(TEXTS[p], `${p} loses the landing`).toMatch(/say what you get/i);
      expect(TEXTS[p], `${p} loses the second half of the rule`).toMatch(/[Kk]eep (your giving|what you GIVE) quiet/);
    }
  });

  it('it does NOT land on promise-and-performance, and carries none of that ground', () => {
    // sov65 (DR-1314) holds that landing, on Numbers 30:2, Deuteronomy 23:21-22
    // and Matthew 21:28-31. None of those is in this spine, and the refusal is
    // pinned as a measurement rather than as a sentence in a record.
    for (const ref of ['Numbers 30', 'Deuteronomy 23', 'Matthew 21', 'Genesis 29', 'Genesis 31', 'Malachi 1', '1 Kings 10']) {
      expect(L.anchor.ref, `${ref} belongs to the promise landing`).not.toContain(ref);
      expect(EVERY_STRING.join('\n')).not.toContain(ref);
    }
  });

  it('it does not land on the just weight either', () => {
    for (const ref of ['Proverbs 11:1', 'Leviticus 19:35', 'Leviticus 19:36', 'Deuteronomy 25:13', 'Deuteronomy 25:15', 'Micah 6:11']) {
      expect(L.anchor.ref).not.toContain(ref);
    }
    expect(EVERY_STRING.join('\n')).not.toMatch(/just weight|divers weights|false balance/i);
  });

  it('the in-app step is a real action a reader can take today', () => {
    expect(L.inApp).toMatch(/say the second half out loud/i);
    expect(L.inApp).toMatch(/Ruth 4/);
    expect(L.inApp.split(/\s+/).length).toBeGreaterThan(60);
  });
});
