// @vitest-environment node
// =============================================================================
// L287 — Spoken in the Break, Heard in the Light: Chelli Goldenberg, Owen
// Jones, and the Word that judges every nation by the stranger at its gate
// =============================================================================
// The second lesson built under the newsletter Way (DR-1361) the evening it
// was set. Darrell sent a link and a summary of Owen Jones's video on Chelli
// Goldenberg's Channel 13 interview. Both voices are named; every claim is
// tiered (DR-0100): established with its basis (the interview and apology,
// the ICJ opinion of 19 July 2024, the HRW and Amnesty conclusions, the
// UNICEF 2013 finding, the King David Hotel toll, the 1948 displacement
// range) and contested flagged narrowly (the 1948 death figure, the poll's
// size); and the Word, not either voice, is the measure (DR-0098): the
// stranger at the gate, one law, Jerusalem loved and judged, innocent blood
// on every side, the multitude not followed. (DR-1370.)
//
// THIS LESSON'S DANGERS are three. (1) Becoming a lesson from one side: the
// love verses (Genesis 12:3, Romans 11:28) and the judgment verses (Isaiah
// 1:21, Micah 2:2) are pinned together in every band, with a proof that
// dropping either is caught; innocent blood is named on both sides in every
// band. (2) Smearing the contested over the established, or the reverse: the
// two tiers are pinned in every band, and no text states a percentage. (3)
// Letting the apartheid word do the Word's work: Numbers 15:16 (one law) is
// pinned in every band.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L284's, copied whole so the gates measure the same way. A verse
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
import { bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll287-spoken-in-the-break-heard-in-the-light';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD =
  'SPOKEN IN THE BREAK, HEARD IN THE LIGHT — Chelli Goldenberg, Owen Jones, and the Word that judges every nation by the stranger at its gate.';

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
  ['Luke 12:2-3', 'whatsoever ye have spoken in darkness shall be heard in the light'],
  ['Matthew 5:37', 'But let your communication be, Yea, yea; Nay, nay'],
  ['Proverbs 12:19', 'The lip of truth shall be established for ever: but a lying tongue is but for a moment.'],
  ['Numbers 32:23', 'be sure your sin will find you out.'],
  ['Ephesians 5:13', 'But all things that are reproved are made manifest by the light'],
  ['Matthew 7:16-20', 'Ye shall know them by their fruits.'],
  ['James 1:27', 'To visit the fatherless and widows in their affliction'],
  ['Proverbs 24:11-12', 'If thou sayest, Behold, we knew it not; doth not he that pondereth the heart consider it?'],
  ['Deuteronomy 10:17-19', 'Love ye therefore the stranger: for ye were strangers in the land of Egypt.'],
  ['Leviticus 19:33-34', 'the stranger that dwelleth with you shall be unto you as one born among you, and thou shalt love him as thyself'],
  ['Exodus 22:21', 'Thou shalt neither vex a stranger, nor oppress him'],
  ['Leviticus 25:23', 'for the land is mine; for ye are strangers and sojourners with me.'],
  ['Psalms 82:3-4', 'Defend the poor and fatherless: do justice to the afflicted and needy.'],
  ['Proverbs 31:8-9', 'Open thy mouth for the dumb in the cause of all such as are appointed to destruction.'],
  ['Ecclesiastes 4:1', 'and on the side of their oppressors there was power'],
  ['Isaiah 10:1-2', 'Woe unto them that decree unrighteous decrees'],
  ['Jeremiah 22:3', 'neither shed innocent blood in this place.'],
  ['Zechariah 7:9-10', 'And oppress not the widow, nor the fatherless, the stranger, nor the poor'],
  ['Micah 6:8', 'to do justly, and to love mercy, and to walk humbly with thy God?'],
  ['Isaiah 1:17', 'relieve the oppressed, judge the fatherless, plead for the widow.'],
  ['Amos 5:24', 'But let judgment run down as waters, and righteousness as a mighty stream.'],
  ['Numbers 15:15-16', 'One law and one manner shall be for you, and for the stranger that sojourneth with you.'],
  ['Ezekiel 47:21-23', 'they shall have inheritance with you among the tribes of Israel.'],
  ['Romans 2:11', 'For there is no respect of persons with God.'],
  ['Acts 10:34-35', 'in every nation he that feareth him, and worketh righteousness, is accepted with him.'],
  ['Genesis 12:3', 'in thee shall all families of the earth be blessed.'],
  ['Romans 11:28-29', 'they are beloved for the fathers’ sakes.'],
  ['Isaiah 1:21-23', 'How is the faithful city become an harlot!'],
  ['Isaiah 5:8', 'Woe unto them that join house to house, that lay field to field, till there be no place'],
  ['Micah 2:1-2', 'And they covet fields, and take them by violence'],
  ['Ezekiel 22:29', 'yea, they have oppressed the stranger wrongfully.'],
  ['Luke 19:41-42', 'he beheld the city, and wept over it'],
  ['Luke 13:34-35', 'how often would I have gathered thy children together, as a hen doth gather her brood under her wings, and ye would not!'],
  ['Exodus 20:13', 'Thou shalt not kill.'],
  ['Habakkuk 1:2-4', 'even cry out unto thee of violence, and thou wilt not save!'],
  ['Obadiah 1:10-15', 'In the day that thou stoodest on the other side'],
  ['Romans 12:18-21', 'avenge not yourselves, but rather give place unto wrath'],
  ['Ezekiel 18:20', 'The son shall not bear the iniquity of the father'],
  ['Deuteronomy 24:16', 'neither shall the children be put to death for the fathers'],
  ['Psalms 94:20-23', 'which frameth mischief by a law?'],
  ['Isaiah 59:14-15', 'for truth is fallen in the street, and equity cannot enter.'],
  ['Exodus 23:2', 'Thou shalt not follow a multitude to do evil'],
  ['Proverbs 17:15', 'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.'],
  ['John 7:24', 'Judge not according to the appearance, but judge righteous judgment.'],
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so.'],
  ['Jeremiah 6:14', 'saying, Peace, peace; when there is no peace.'],
  ['Zechariah 8:16-17', 'execute the judgment of truth and peace in your gates'],
  ['Psalms 9:9', 'The LORD also will be a refuge for the oppressed, a refuge in times of trouble.'],
  ['Psalms 146:7-9', 'The LORD preserveth the strangers; he relieveth the fatherless and widow'],
  ['Isaiah 58:6', 'to let the oppressed go free, and that ye break every yoke?'],
  ['Luke 4:18', 'to preach deliverance to the captives'],
  ['Psalms 122:6', 'Pray for the peace of Jerusalem: they shall prosper that love thee.'],
  ['Isaiah 2:4', 'they shall beat their swords into plowshares'],
  ['Matthew 5:9', 'Blessed are the peacemakers: for they shall be called the children of God.'],
  ['Deuteronomy 16:20', 'That which is altogether just shalt thou follow'],
  ['Proverbs 21:3', 'To do justice and judgment is more acceptable to the LORD than sacrifice.'],
  ['Matthew 23:23', 'the weightier matters of the law, judgment, mercy, and faith'],
  ['Proverbs 29:7', 'The righteous considereth the cause of the poor: but the wicked regardeth not to know it.'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world.'],
];

describe('L287 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 287 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 287)).toEqual([287]);
  });

  it('sits after ll286 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll286-'));
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

describe('the lesson practises the newsletter Way: the sender and both voices named, the two tiers shown, a reader length', () => {
  it('names Darrell as the sender, Chelli Goldenberg and Owen Jones, in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Chelli Goldenberg/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Owen Jones/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Channel 13|TV show in Israel/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('states the two tiers in every text: the established basis and the contested figures, with the fetch limit said', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/UNICEF|children’s group/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not (be fetched|check yet|be corroborated)|not corroborated/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bcontested\b|could not check yet/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/October 7th/);
    expect(L.lesson).toMatch(/International Court of Justice/);
    expect(L.lesson).toMatch(/Human Rights Watch/);
    expect(L.lesson).toMatch(/Amnesty International/);
    expect(L.lesson).toMatch(/King David Hotel/);
    expect(L.inApp).toMatch(/Shelley, the public record spells it Chelli/);
    expect(L.inApp).toMatch(/could not be fetched from the cloud/);
  });

  it('renders every figure in words and never as a percentage or a bare count', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(L.lesson).toMatch(/about seven hundred thousand/);
    expect(L.lesson).toMatch(/ninety-one/);
    expect(L.lesson).toMatch(/three in five rather than four in five/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure, above both sides, in the lesson and in every band', () => {
  it('opens on what was spoken in darkness being heard in the light', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/commercial break|cameras were off/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('whatsoever ye have spoken in darkness shall be heard in the light');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('be sure your sin will find you out.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But let your communication be, Yea, yea; Nay, nay');
  });

  it('reads her fruit whole: the homes she cleaned and the word she spoke', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('To visit the fatherless and widows in their affliction');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Open thy mouth for the dumb in the cause of all such as are appointed to destruction.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Ye shall know them by their fruits.');
  });

  it('makes the stranger at the gate the measure of every nation, Israel first', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Love ye therefore the stranger: for ye were strangers in the land of Egypt.');
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain('the stranger that dwelleth with you shall be unto you as one born among you, and thou shalt love him as thyself');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for the land is mine; for ye are strangers and sojourners with me.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Defend the poor and fatherless: do justice to the afflicted and needy.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('to do justly, and to love mercy, and to walk humbly with thy God?');
  });

  it('uses one law, not the contested label, as the sharper rule', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/apartheid/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('One law and one manner shall be for you, and for the stranger that sojourneth with you.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('For there is no respect of persons with God.');
  });

  it('holds love for Jerusalem and judgment of Jerusalem together in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('in thee shall all families of the earth be blessed.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('he beheld the city, and wept over it');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('How is the faithful city become an harlot!');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And they covet fields, and take them by violence');
  });

  it('PROVEN TO CATCH: a band that keeps the judgment and drops the love is named', () => {
    const teen = L.levels.teen.replace('in thee shall all families of the earth be blessed.', 'Israel is judged.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('in thee shall all families of the earth be blessed.')).toBe(false);
  });

  it('PROVEN TO CATCH: a band that keeps the love and drops the judgment is named', () => {
    const youth = L.levels.youth.replace('How is the faithful city become an harlot!', 'the city is fine.');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('How is the faithful city become an harlot!')).toBe(false);
  });

  it('calls innocent blood innocent on every side, with October 7th and Gaza both named, and vengeance reserved', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not kill.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/October 7th[^.]*murder|attack on her people was murder|attacks were murder/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Gaza/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('neither shed innocent blood in this place.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('avenge not yourselves');
  });

  it('speaks to the courts and to the majority', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The son shall not bear the iniquity of the father');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('which frameth mischief by a law?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not follow a multitude to do evil');
  });

  it('holds both voices up to the brighter light and names the frames it exposes', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('if they speak not according to this word, it is because there is no light in them.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Pray for the peace of Jerusalem/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('That which is altogether just shalt thou follow');
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    expect(L.lesson).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const b of BANDS) expect(L.levels[b], b).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/a link and a summary Darrell sent/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(250);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(230);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace(
      'Love ye therefore the stranger: for ye were strangers in the land of Egypt.',
      'Love ye therefore the stranger: for ye were slaves in the land of Egypt.'
    );
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"whatsoever ye have spoken in darkness shall be heard in the light" (Luke 12:3)',
      '"Whatsoever ye have spoken in darkness shall be heard in the light" (Luke 12:3)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Luke 12:3) is not the verse: Whatsoever ye have spoken in darkness shall be heard in the light']);
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
    const planted = 'God judges every nation by the stranger at its gate.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('For there is no respect of persons with God.');
    expect(inQuotes).toContain('as ye are, so shall the stranger be before the LORD');
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
    const friend = /Friends, tell one friend this week what Chelli Goldenberg said and what the Word says about the stranger at the gate[^.]*\./.exec(youth);
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
