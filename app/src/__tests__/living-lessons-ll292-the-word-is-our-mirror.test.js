// @vitest-environment node
// =============================================================================
// L292 — The Word Is Our Mirror: no condemnation, accountable to Him now and
// after, and a heart that shows itself in deeds
// =============================================================================
// A spoken teaching. Darrell spoke it into the app on 2026-11-10, line by line,
// while the reading and exam records were being made evaluation rather than
// condemnation (DR-1386). The heart is taught from the Word's own usage only,
// as he asked ("according to the biblical scriptures"). (DR-1387.)
//
// THIS LESSON'S DANGERS are three. (1) Teaching no condemnation as no account:
// every text carries both Romans 8:1 and Romans 14:12, with a proof that
// dropping the account is caught. (2) Making the Judge a stranger: every text
// names that all judgment is committed to the Son, and that the One who could
// condemn is the One who died and intercedes. (3) Defining the heart from
// anywhere but the Word: every text teaches where the heart is from Matthew
// 6:21 and what it does from the Word's own verbs.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259).
// The helpers are L291's, copied whole so the gates measure the same way.
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
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll292-the-word-is-our-mirror';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'THE WORD IS OUR MIRROR — no condemnation, accountable to Him now and after, and a heart that shows itself in deeds.';

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
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
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
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
    for (const part of (extra || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

const SPINE = [
  ['Romans 8:1', 'There is therefore now no condemnation to them which are in Christ Jesus'],
  ['John 3:17', 'For God sent not his Son into the world to condemn the world'],
  ['1 John 3:20-21', 'For if our heart condemn us, God is greater than our heart, and knoweth all things.'],
  ['Matthew 7:1-2', 'Judge not, that ye be not judged.'],
  ['James 4:12', 'There is one lawgiver, who is able to save and to destroy: who art thou that judgest another?'],
  ['John 5:22', 'For the Father judgeth no man, but hath committed all judgment unto the Son'],
  ['Romans 8:33-34', 'Who is he that condemneth? It is Christ that died'],
  ['James 1:22-25', 'and straightway forgetteth what manner of man he was.'],
  ['Hebrews 4:12-13', 'and is a discerner of the thoughts and intents of the heart.'],
  ['2 Corinthians 3:18', 'are changed into the same image from glory to glory'],
  ['Proverbs 27:19', 'As in water face answereth to face, so the heart of man to man.'],
  ['Romans 14:10-12', 'So then every one of us shall give account of himself to God.'],
  ['Hebrews 9:27', 'And as it is appointed unto men once to die, but after this the judgment'],
  ['2 Corinthians 5:10', 'For we must all appear before the judgment seat of Christ'],
  ['Ecclesiastes 12:13-14', 'Fear God, and keep his commandments: for this is the whole duty of man.'],
  ['James 4:13-15', 'If the Lord will, we shall live, and do this, or that.'],
  ['Proverbs 16:9', 'A man’s heart deviseth his way: but the LORD directeth his steps.'],
  ['Isaiah 55:8-9', 'so are my ways higher than your ways'],
  ['Proverbs 3:5-6', 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.'],
  ['Mark 12:30', 'with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength'],
  ['1 Samuel 16:7', 'but the LORD looketh on the heart.'],
  ['Jeremiah 17:9-10', 'I the LORD search the heart, I try the reins'],
  ['Ezekiel 36:26-27', 'A new heart also will I give you, and a new spirit will I put within you'],
  ['Matthew 6:19-21', 'For where your treasure is, there will your heart be also.'],
  ['Proverbs 23:7', 'For as he thinketh in his heart, so is he'],
  ['Daniel 1:8', 'But Daniel purposed in his heart that he would not defile himself'],
  ['Romans 10:9-10', 'For with the heart man believeth unto righteousness'],
  ['Matthew 13:15', 'and should understand with their heart'],
  ['1 Peter 3:4', 'But let it be the hidden man of the heart'],
  ['Psalms 119:11', 'Thy word have I hid in mine heart, that I might not sin against thee.'],
  ['Hebrews 8:10', 'I will put my laws into their mind, and write them in their hearts'],
  ['Proverbs 4:23', 'Keep thy heart with all diligence; for out of it are the issues of life.'],
  ['Luke 6:45', 'for of the abundance of the heart his mouth speaketh.'],
  ['1 John 3:18', 'let us not love in word, neither in tongue; but in deed and in truth.'],
  ['Matthew 7:20-21', 'Wherefore by their fruits ye shall know them.'],
  ['Psalms 139:23-24', 'Search me, O God, and know my heart'],
];

describe('L292 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 292 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 292)).toEqual([292]);
  });

  it('sits after ll291 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll291-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-10');
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(36);
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
    const anchors = refs.map(parse);
    const quoted = new Set(
      EVERY_STRING.flatMap((t) =>
        quotedPairs(t)
          .map((p) => p.ref)
          .filter(Boolean)
      )
    );
    const missing = [...quoted].filter((r) => {
      const p = parse(r);
      return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
    });
    expect(missing).toEqual([]);
  });
});

describe('a spoken lesson: his lines rendered, his name given, a reader length', () => {
  it('names Darrell as the one who spoke it in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell spoke this lesson into the app\b/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/Darrell spoke this lesson into the app on 2026-11-10/);
    expect(L.inApp).toMatch(/parables with invented people/);
  });

  it('carries no percentage, and sits inside the reader-length band, measured not claimed', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure of condemnation, the mirror, the account and the heart, in every text', () => {
  it('no condemnation in Christ, and Yahweh greater than the heart that condemns, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('There is therefore now no condemnation to them which are in Christ Jesus');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For God sent not his Son into the world to condemn the world');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For if our heart condemn us, God is greater than our heart, and knoweth all things.');
  });

  it('only He may condemn, all judgment is the Son’s, and the Son who judges is the One who died and intercedes, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('There is one lawgiver, who is able to save and to destroy: who art thou that judgest another?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For the Father judgeth no man, but hath committed all judgment unto the Son');
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain(
        'It is Christ that died, yea rather, that is risen again, who is even at the right hand of God, who also maketh intercession for us.'
      );
  });

  it('the Word is the mirror, and the doer is the one who remembers, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('straightway forgetteth what manner of man he was.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('discerner of the thoughts and intents of the heart.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('changed into the same image from glory to glory');
  });

  it('no condemnation is never taught as no account: every text gives account now and after', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('So then every one of us shall give account of himself to God.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For we must all appear before the judgment seat of Christ');
  });

  it('PROVEN TO CATCH: a band that drops the account is named', () => {
    const youth = L.levels.youth.replace('"So then every one of us shall give account of himself to God." (Romans 14:12).', 'Nothing you do matters.');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('So then every one of us shall give account of himself to God.')).toBe(false);
  });

  it('our projections give way to His Way, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('If the Lord will, we shall live, and do this, or that.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/so are my ways higher than your ways|neither are your ways my ways/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Trust in the LORD with all thine heart; and lean not unto thine own understanding.');
  });

  it('the heart by the Word: where it is and what it does, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For where your treasure is, there will your heart be also.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For as he thinketh in his heart, so is he');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But Daniel purposed in his heart that he would not defile himself');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For with the heart man believeth unto righteousness');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but the LORD looketh on the heart.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy word have I hid in mine heart, that I might not sin against thee.');
  });

  it('from the heart to the deed, and David’s prayer, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('let us not love in word, neither in tongue; but in deed and in truth.');
    for (const k of PLACES)
      expect(TEXTS[k], k).toMatch(/of the abundance of the heart his mouth speaketh|out of the good treasure of his heart bringeth forth that which is good/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Search me, O God, and know my heart');
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(180);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(160);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('There is therefore now no condemnation', 'There is therefore now no judgment');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"for man looketh on the outward appearance, but the LORD looketh on the heart." (1 Samuel 16:7)',
      '"For man looketh on the outward appearance, but the LORD looketh on the heart." (1 Samuel 16:7)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual([
      `(1 Samuel 16:7) is not the verse: ${'For man looketh on the outward appearance, but the LORD looketh on the heart.'.slice(0, 70)}`,
    ]);
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

  it('every double-quoted span carries a reference: his own words are rendered, never put in double quotes', () => {
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

  it('and our own prose is spelled the American way, while the quotations keep the corpus spelling', () => {
    expect(EVERY_STRING.flatMap((t) => findBritish(ourProse(t)))).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic "God" in our voice, copied through unquoted, is refused', () => {
    const planted = 'God gave the officer the sword for good.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('but the LORD looketh on the heart.');
    expect(inQuotes).toContain('so then every one of us shall give account of himself to God.'.replace('so', 'So'));
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the youth friend line names youth and only youth, while the pooled check still reads green', () => {
    const youth = L.levels.youth;
    const friend = /With a friend, talk about one deed you will each do this week[^.]*\./.exec(youth);
    expect(friend, 'the youth band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '') } };
    expect(stripped.levels.youth).not.toBe(youth);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
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
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LEAD), k).toBe(true);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});
