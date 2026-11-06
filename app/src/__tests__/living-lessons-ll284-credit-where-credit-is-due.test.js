// @vitest-environment node
// =============================================================================
// L284 — Credit Where Credit Is Due: names stay in, the fruit is the data, and
// assessment is not condemnation
// =============================================================================
// Darrell spoke this as a correction on 2026-11-06, two messages minutes apart,
// and said it was a lesson for the app and for the one who builds it: "We give
// credit where credit is due in these lessons. My name should be in the
// lessons. The people who say stuff should be in the lessons... Don't take
// names out. Leave them in and say what they said and research if they said it
// or not and put it in." And: "Yahweh's Word can rebut... there is judgment,
// which means we're needing to make an assessment, not to condemn you, but to
// assess. Is this person doing evil things? We can see it... let's set them to
// the side. Let the law, whatever it is, take care of that. But to ignore it
// is ridiculous." (DR-1353.)
//
// THIS LESSON'S DANGERS are three. (1) Teaching naming as cruelty: the Word's
// own habit of naming good AND evil is pinned in every band (Nehemiah 3,
// Romans 16, 2 Timothy 4, 3 John). (2) Collapsing assessment into
// condemnation, or the reverse: John 7:24 and Luke 6:37 are pinned together in
// every band, with a proof that dropping either half is caught. (3) Letting
// "set them aside" become "ignore": Leviticus 5:1 and Proverbs 17:15 are pinned
// in every band. This lesson is also the first under the reader-length band
// (new-lessons-keep-a-reader-length.test.js), and its own case pins that.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L271's, copied whole so the gates measure the same way. A verse
// is never spent (DR-1317).
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
import { isSpokenByDarrell, bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll284-credit-where-credit-is-due';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'CREDIT WHERE CREDIT IS DUE — names stay in, the fruit is the data, and assessment is not condemnation.';

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
  ['Romans 13:7', 'honour to whom honour'],
  ['Proverbs 3:27', 'Withhold not good from them to whom it is due'],
  ['1 Thessalonians 5:12-13', 'to know them which labour among you'],
  ['Hebrews 6:10', 'For God is not unrighteous to forget your work and labour of love'],
  ['Nehemiah 3:1-2', 'And next to them builded Zaccur the son of Imri.'],
  ['Romans 16:1-4', 'I commend unto you Phebe our sister'],
  ['2 Timothy 1:16-18', 'The Lord give mercy unto the house of Onesiphorus'],
  ['Acts 9:36', 'a certain disciple named Tabitha'],
  ['Matthew 26:13', 'be told for a memorial of her.'],
  ['Esther 6:1-3', 'What honour and dignity hath been done to Mordecai for this?'],
  ['Ecclesiastes 9:15-16', 'yet no man remembered that same poor man.'],
  ['Luke 1:3-4', 'That thou mightest know the certainty of those things'],
  ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him.'],
  ['Proverbs 18:17', 'but his neighbour cometh and searcheth him.'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Deuteronomy 19:15', 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.'],
  ['Exodus 20:16', 'Thou shalt not bear false witness against thy neighbour.'],
  ['Matthew 7:16-20', 'Ye shall know them by their fruits.'],
  ['Luke 6:43-45', 'For every tree is known by his own fruit.'],
  ['Proverbs 20:11', 'Even a child is known by his doings'],
  ['Jeremiah 17:10', 'according to the fruit of his doings.'],
  ['2 Timothy 4:14-15', 'Alexander the coppersmith did me much evil'],
  ['2 Timothy 4:10-11', 'Only Luke is with me.'],
  ['3 John 1:9-12', 'Demetrius hath good report of all men, and of the truth itself'],
  ['Isaiah 8:20', 'To the law and to the testimony: if they speak not according to this word, it is because there is no light in them.'],
  ['Deuteronomy 30:15', 'See, I have set before thee this day life and good, and death and evil;'],
  ['Malachi 3:18', 'discern between the righteous and the wicked'],
  ['Hebrews 5:14', 'exercised to discern both good and evil.'],
  ['John 7:24', 'judge righteous judgment.'],
  ['John 7:51', 'Doth our law judge any man, before it hear him, and know what he doeth?'],
  ['Matthew 7:1-5', 'then shalt thou see clearly to cast out the mote out of thy brother’s eye.'],
  ['Luke 6:37', 'condemn not, and ye shall not be condemned'],
  ['John 3:17', 'For God sent not his Son into the world to condemn the world'],
  ['Romans 14:4', 'to his own master he standeth or falleth.'],
  ['Ezekiel 33:11', 'that the wicked turn from his way and live'],
  ['Romans 13:1-4', 'For rulers are not a terror to good works, but to the evil.'],
  ['1 Peter 2:13-14', 'for the punishment of evildoers, and for the praise of them that do well.'],
  ['1 Corinthians 5:12-13', 'Therefore put away from among yourselves that wicked person.'],
  ['Romans 16:17', 'mark them which cause divisions and offences contrary to the doctrine which ye have learned; and avoid them.'],
  ['2 Thessalonians 3:14-15', 'Yet count him not as an enemy, but admonish him as a brother.'],
  ['1 Corinthians 15:33', 'evil communications corrupt good manners.'],
  ['Proverbs 17:15', 'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.'],
  ['Isaiah 5:20', 'Woe unto them that call evil good, and good evil'],
  ['Amos 5:14-15', 'Hate the evil, and love the good, and establish judgment in the gate'],
  ['Ephesians 5:11', 'have no fellowship with the unfruitful works of darkness, but rather reprove them.'],
  ['Leviticus 5:1', 'if he do not utter it, then he shall bear his iniquity.'],
  [
    'Ecclesiastes 8:11',
    'Because sentence against an evil work is not executed speedily, therefore the heart of the sons of men is fully set in them to do evil.',
  ],
  ['Zechariah 8:16', 'Speak ye every man the truth to his neighbour; execute the judgment of truth and peace in your gates:'],
  ['1 Samuel 2:30', 'them that honour me I will honour, and they that despise me shall be lightly esteemed.'],
  ['Proverbs 10:7', 'The memory of the just is blessed: but the name of the wicked shall rot.'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world.'],
  ['Hebrews 1:8', 'Thy throne, O God, is for ever and ever'],
];

describe('L284 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 284 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 284)).toEqual([284]);
  });

  it('sits after ll283 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll283-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-06');
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
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
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
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const anchors = String(L.anchor.ref)
      .split(';')
      .map((s) => parse(s.trim()))
      .filter(Boolean);
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

describe('the lesson practises what it teaches: it names Darrell and keeps a reader length', () => {
  it('its own provenance says Darrell spoke it, and it carries no bare teacher in any string', () => {
    expect(isSpokenByDarrell(L)).toBe(true);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell\b/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('his spine, in his order, in the lesson and in every band', () => {
  it('opens on the rule as he gave it: credit where credit is due, names stay in', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/credit where credit is due/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('honour to whom honour');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Withhold not good from them to whom it is due');
  });

  it('shows the Word keeping names, good and evil alike, and the one nobody remembered', () => {
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain('Then Eliashib the high priest rose up with his brethren the priests, and they builded the sheep gate');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I commend unto you Phebe our sister');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('What honour and dignity hath been done to Mordecai for this?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('yet no man remembered that same poor man.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Alexander the coppersmith did me much evil');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Only Luke is with me.');
  });

  it('carries his three steps: say what they said, research whether they said it, put it in', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('searched the scriptures daily, whether those things were so.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not bear false witness against thy neighbour.');
  });

  it('reads the fruit as data, in his words and the Word’s', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bdata\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Ye shall know them by their fruits.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For every tree is known by his own fruit.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Even a child is known by his doings');
  });

  it('puts the standard in the Word that rebuts, not in anyone’s taste', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/rebut/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('To the law and to the testimony');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('See, I have set before thee this day life and good, and death and evil;');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('exercised to discern both good and evil.');
  });

  it('keeps assessment and condemnation apart, with both halves in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/assess/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('judge righteous judgment.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Doth our law judge any man, before it hear him');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('condemn not, and ye shall not be condemned');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For God sent not his Son into the world to condemn the world');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/no pleasure in the death of the wicked|that the wicked turn from his way and live/);
  });

  it('PROVEN TO CATCH: a band that keeps the assessment and drops the condemnation half is named', () => {
    const teen = L.levels.teen.replace('condemn not, and ye shall not be condemned', 'judge not');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('condemn not, and ye shall not be condemned')).toBe(false);
  });

  it('sets evil aside and hands it to the law, in his words and the Word’s', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/set (them|it) (to the side|aside)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For rulers are not a terror to good works, but to the evil.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for the punishment of evildoers, and for the praise of them that do well.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Therefore put away from among yourselves that wicked person.');
  });

  it('refuses to ignore it, with the silent witness charged in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/ignore it is ridiculous|pretend you did not see|pretend not to have seen|DO NOT PRETEND/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('if he do not utter it, then he shall bear his iniquity.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Woe unto them that call evil good, and good evil');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Hate the evil, and love the good');
  });

  it('PROVEN TO CATCH: a band that drops the silent-witness verse is named', () => {
    const youth = L.levels.youth.replace('if he do not utter it, then he shall bear his iniquity.', 'he should speak up.');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('if he do not utter it, then he shall bear his iniquity.')).toBe(false);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });

  it('stakes no figure: no band or lesson states a percentage or a statistic', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });

  it('says plainly in inApp that it was built from two messages and points at the Research tab', () => {
    expect(L.inApp).toMatch(/two messages/);
    expect(L.inApp).toMatch(/Research tab/);
    expect(L.inApp).toMatch(/parables with invented characters/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(350);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(325);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('Ye shall know them by their fruits.', 'Ye shall know them by their works.');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"honour to whom honour." (Romans 13:7)', '"Honour to whom honour." (Romans 13:7)');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Romans 13:7) is not the verse: Honour to whom honour.']);
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
    const planted = 'God tells us the difference between good and evil.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('For God sent not his Son into the world to condemn the world');
    expect(inQuotes).toContain('even they both are abomination to the LORD');
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
    const friend = /Friends, tell one friend this week about one person you have been quoting without checking[^.]*\./.exec(youth);
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
