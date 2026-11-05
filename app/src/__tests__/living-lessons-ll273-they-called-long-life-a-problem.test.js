// @vitest-environment node
// =============================================================================
// L273 — They Called Long Life a Problem: the city Yahweh measures by both ends
// =============================================================================
// The oldest genuinely-unbuilt send in the Gmail lesson-intake lane. Darrell
// forwarded a Morning Brew issue on 2026-09-16 14:47 UTC (thread
// 1a0aab01a0b1746e) with one word typed above it, Lessons, and one instruction:
// "Ignore ads of course unless they are related to the lessons." Built
// 2026-11-03 (DR-1300).
//
// THE ONE ITEM THAT CARRIED A TEACHING. The issue held an interest-rate story,
// a run of world headlines, a Canadian investment pitch, a cybersecurity share
// note and a trivia game, and none of those carry a teaching. One item did: a
// report that Japan has passed a hundred thousand people over a hundred for the
// first time, filed under a section headed old news, beneath a headline calling
// it a problematic age gap, with the sentence "the surge of centenarians ... is
// straining the country's resources" (the newsletter's words, rendered here in
// a comment, never in the lesson's own double quotes). The teaching is in the
// framing, not in the arithmetic.
//
// THIS LESSON'S DANGERS, and what each one made this gate assert.
//  (1) STAKING THE TEACHING ON UNVERIFIED FIGURES. Every link in the forwarded
//      mail is a tracking redirect and not one of them opened: WebFetch
//      returned `getaddrinfo ENOTFOUND links.morningbrew.com` and curl returned
//      `403 Forbidden` with the tunnel refused. So the limit must be stated in
//      the lesson AND in every band, and no band may print a percentage.
//  (2) UNDER-CLAIMING THE REAL COST. DR-0100's three tiers: the fiscal work is
//      real, the figures are unchecked and SAID to be, and only the framing is
//      corrected. Each band must carry the real-work half as well as the
//      correction, or the lesson becomes a denial of arithmetic.
//  (3) THE CORPUS'S OWN LOWERCASE satan AND ITS "in in". Luke 13:16 in
//      app/public/bible/kjv reads "whom satan hath bound" lowercase, so the
//      quotation needs no exception; Job 5:26 reads "cometh in in his season",
//      a real doubled word in the Word. So the adversary-capitalisation and
//      doubled-word checks here scan OUR VOICE ONLY (outside double quotes),
//      which is the correct scope for both rules anyway (CLAUDE.md's bright
//      line: never alter a quotation).
//  (4) ANCHORS ALREADY SPENT. Measured before writing, across the 269 Living
//      Lessons on origin/main (706 distinct anchor chapters): Leviticus 19,
//      Proverbs 16, Proverbs 17, Proverbs 20, Proverbs 23, Psalms 127,
//      Ephesians 6, Exodus 20, Mark 7, Matthew 15, 1 Timothy 5, Job 12,
//      Deuteronomy 28, Titus 2 and Malachi 4 were all SPENT. The seventeen
//      chapters this lesson stands on were each measured FREE, and the test
//      asserts the anchor is built only from them.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ID = 'll273-they-called-long-life-a-problem';
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

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names (plain, range, or "Book c:v, c:v"), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
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
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
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
/** Referenced spans that are not what the corpus holds. Contiguous only: no elision is accepted. */
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
/** Our authored voice: the even segments between double quotes. */
const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');

const TITLE_LINE = 'THEY CALLED LONG LIFE A PROBLEM — the grey head, the empty cradle, and the city Yahweh measures by both.';

// The seventeen anchor chapters, each measured absent from the 269 lessons on
// origin/main before a word was written. Nothing outside this set may appear.
// The chapters this lesson DECLARES it stands on. Not a claim that no other
// lesson uses them (DR-1317): a verse is never spent.
const FREE_CHAPTERS = [
  'Zechariah 8', 'Job 5', 'Psalms 71', 'Deuteronomy 5', '1 Kings 12',
  '2 Chronicles 10', 'Numbers 11', 'Numbers 8', 'Genesis 47', 'Genesis 48',
  'Luke 13', 'Ezekiel 22', 'Isaiah 3', 'Lamentations 5', 'Judges 2',
  'Psalms 113', '1 Samuel 12',
];

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one of these was fetched from the corpus on disk before it was written.
const SPINE = [
  ['Zechariah 8:4', 'There shall yet old men and old women dwell in the streets of Jerusalem, and every man with his staff in his hand for very age'],
  ['Zechariah 8:5', 'And the streets of the city shall be full of boys and girls playing in the streets thereof'],
  ['Zechariah 8:3', 'and Jerusalem shall be called a city of truth'],
  ['Zechariah 8:6', 'should it also be marvellous in mine eyes?'],
  ['Job 5:26', 'Thou shalt come to thy grave in a full age, like as a shock of corn cometh in in his season'],
  ['Psalms 71:9', 'Cast me not off in the time of old age; forsake me not when my strength faileth'],
  ['Psalms 71:18', 'until I have shewed thy strength unto this generation, and thy power to every one that is to come'],
  ['Deuteronomy 5:16', 'Honour thy father and thy mother, as the LORD thy God hath commanded thee; that thy days may be prolonged'],
  ['1 Kings 12:7', 'then they will be thy servants for ever'],
  ['1 Kings 12:8', 'But he forsook the counsel of the old men, which they had given him'],
  ['1 Kings 12:16', 'So Israel departed unto their tents'],
  ['2 Chronicles 10:8', 'But he forsook the counsel which the old men gave him'],
  ['Numbers 11:17', 'and they shall bear the burden of the people with thee, that thou bear it not thyself alone'],
  ['Numbers 8:26', 'But shall minister with their brethren in the tabernacle of the congregation, to keep the charge, and shall do no service'],
  ['Genesis 47:12', 'And Joseph nourished his father, and his brethren, and all his father’s household, with bread, according to their families'],
  ['Genesis 48:11', 'I had not thought to see thy face: and, lo, God hath shewed me also thy seed'],
  ['Luke 13:16', 'being a daughter of Abraham, whom satan hath bound, lo, these eighteen years'],
  ['Ezekiel 22:7', 'In thee have they set light by father and mother'],
  ['Isaiah 3:5', 'the child shall behave himself proudly against the ancient, and the base against the honourable'],
  ['Lamentations 5:14', 'The elders have ceased from the gate, the young men from their musick'],
  ['Judges 2:10', 'which knew not the LORD, nor yet the works which he had done for Israel'],
  ['Psalms 113:9', 'and to be a joyful mother of children'],
];

describe('L273 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 273 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 273)).toEqual([273]);
  });

  it('carries its BUILD day, not the day it was sent', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-03');
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => { const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r); return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) }; };
    const anchors = String(L.anchor.ref).split(';').map((s) => parse(s.trim())).filter(Boolean);
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref).filter(Boolean)));
    const missing = [...quoted].filter((r) => { const p = parse(r); return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b); });
    expect(missing).toEqual([]);
  });

  // CORRECTED 2026-11-05 (DR-1317). This case was titled "stands only on anchor
  // chapters measured FREE of the department (DR-0610)", and that attribution was
  // FALSE in both directions. DR-0610 does not require a lesson's chapters to be
  // unused elsewhere -- it forbids two lessons LANDING on the same message -- and
  // this case never checked the department at all: it compares the lesson's own
  // anchors against its own declared list, which is an integrity pin and a good
  // one. The false sentence mattered because it read as authoritative and taught
  // the spent-verse rule to anyone who opened it. Darrell, 2026-11-05: "How can
  // we have only reference one scripture ever?! Doesn't make any sense!" A verse
  // is never spent; shared ground is how lessons connect (search-it-out's
  // `sharedGround` links them by it, DR-0734).
  it('stands on exactly the anchor chapters it declares, and no others', () => {
    const chapters = new Set(String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean)
      .map((r) => { const m = /^(.+?)\s+(\d+):/.exec(r); return m && `${m[1]} ${m[2]}`; }).filter(Boolean));
    expect([...chapters].filter((c) => !FREE_CHAPTERS.includes(c))).toEqual([]);
    expect(chapters.size).toBe(FREE_CHAPTERS.length);
  });
});

describe('the newsletter is material, the limit on it is stated, and no figure carries the teaching', () => {
  it('names what was forwarded and the one word above it, in the lesson and in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lessons\b/);
    expect(L.lesson).toMatch(/forwarded into the app on 2026-09-16/);
    expect(L.inApp).toMatch(/Morning Brew newsletter Darrell forwarded on 2026-09-16/);
  });

  it('reports the measured fetch failure in the tool’s own words, not a polite evasion', () => {
    expect(L.lesson).toContain('getaddrinfo ENOTFOUND links.morningbrew.com');
    for (const k of PLACES) expect(TEXTS[k], `${k}: the refused number`).toMatch(/\b403\b/);
  });

  it('says in every band, in one word, that the figures are unchecked', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bunchecked\b/);
  });

  it('PROVEN TO CATCH: a band that drops the unchecked-figures limit is named, and only it', () => {
    const youth = L.levels.youth.replace(/unchecked/g, 'confirmed');
    expect(youth).not.toBe(L.levels.youth);
    const short = Object.entries({ ...TEXTS, youth })
      .filter(([, t]) => !/\bunchecked\b/.test(t)).map(([k]) => k);
    expect(short).toEqual(['youth']);
  });

  it('stakes no figure: no band or lesson states a percentage', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });

  it('holds DR-0100’s three tiers apart in every band: the work is real AND the framing is corrected', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: the real work`).toMatch(/real|sums|arithmetic/i);
      expect(TEXTS[k], `${k}: honest provision`).toMatch(/honest provision|real job/i);
      expect(TEXTS[k], `${k}: the correction`).toMatch(/\bharvest\b/);
    }
    expect(L.lesson).toMatch(/Calling the aged themselves the strain is where the sentence went false\./);
  });
});

describe('his spine, in order, in the lesson and in every band', () => {
  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LINE), k).toBe(true);
  });

  it('carries the city measured by BOTH ends, in the lesson and every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Zechariah 8:4`).toContain('(Zechariah 8:4)');
      expect(TEXTS[k], `${k}: Zechariah 8:5`).toContain('(Zechariah 8:5)');
      expect(TEXTS[k], `${k}: the staff`).toMatch(/staff|stick/);
    }
  });

  it('names the staff as the reason he is in the street, never a reason to shut him in', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/reason (he|they) (is|are) (out )?there|why he can be out there/i);
  });

  it('carries honour with its own wage, and the generation that knew not, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Deuteronomy 5:16`).toContain('(Deuteronomy 5:16)');
      expect(TEXTS[k], `${k}: Judges 2:10`).toContain('(Judges 2:10)');
    }
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/(Eternal )?Son of Yahweh/);
  });

  it('gives the bowed woman her name from the text, in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: Luke 13:16`).toContain('(Luke 13:16)');
      expect(TEXTS[k], `${k}: daughter of Abraham`).toMatch(/A daughter of Abraham/);
    }
  });

  it('PROVEN TO CATCH: a band that lets the daughter of Abraham become a category again is named', () => {
    const child = L.levels.child.replace(/A daughter of Abraham\./g, 'A hard case.');
    expect(child).not.toBe(L.levels.child);
    expect(/A daughter of Abraham/.test(child)).toBe(false);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(200);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(180);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('and every man with his staff in his hand for very age', 'and every man with his cane in his hand for very age');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.lesson.replace('"the child shall behave himself proudly against the ancient, and the base against the honourable."', '"The child shall behave himself proudly against the ancient, and the base against the honourable."');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken])).toEqual(['(Isaiah 3:5) is not the verse: The child shall behave himself proudly against the ancient, and the ba']);
  });

  it('Yahweh is never put inside a quotation, in any string of the module', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
      }
    }
    expect(planted).toEqual([]);
  });

  it('every double-quoted span carries a reference: the newsletter’s words are rendered, never put in double quotes', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic God copied through unquoted is refused', () => {
    const planted = 'A ledger that cannot carry both ends of a life is not God’s ledger.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Thus saith the LORD of hosts');
    expect(inQuotes).toContain('lo, God hath shewed me also thy seed');
  });

  it('never capitalises the adversary in our voice, and leaves the corpus’s own lowercase satan alone', () => {
    expect(EVERY_STRING.map(ourVoice).join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
    // Luke 13:16 in the corpus on disk is lowercase, so the quotation agrees
    // with the rule rather than needing an exception to it.
    expect(corpusText('Luke 13:16')).toContain('whom satan hath bound');
    expect(corpusText('Luke 13:16')).not.toContain('Satan');
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the senior friend line names senior and only senior, while the pooled check still reads green', () => {
    const senior = L.levels.senior;
    const friend = /Friends, tell one friend this week[^.]*\./.exec(senior);
    expect(friend, 'the senior band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, senior: senior.replace(friend[0], '') } };
    expect(stripped.levels.senior).not.toBe(senior);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'senior', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(15);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in OUR voice, while the corpus keeps its own', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of ourVoice(t).match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
    // Job 5:26 really does read "cometh in in his season" — scoping the check
    // to our voice is what lets the quotation stay verbatim.
    expect(corpusText('Job 5:26')).toContain('cometh in in his season');
  });
});
