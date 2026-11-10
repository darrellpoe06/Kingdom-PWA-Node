// @vitest-environment node
// =============================================================================
// L289 — Why the Oppressed Still Call on Him: the Lamb who was despised, the
// Bible the slaveholders cut, and the Word on whose side Yahweh stands
// =============================================================================
// The fourth send read under the newsletter Way (DR-1361) the evening it was
// set: Garrison Hayes's video asking why Black Americans still identify as
// Christians when the faith was a tool of slavery, with Claudia Allen for the
// faith and Dr. Anthony B. Pinn against it. The research pass found the three
// voices on the record, checked the figure (Pew 2021 nearly eight in ten; the
// newest study about three in four), and confirmed the 1807 Slave Bible and
// Douglass's 1845 appendix. The lesson names Dr. Pinn's question and answers
// it from the Word, which asked it first (DR-0098). (DR-1380.)
//
// THIS LESSON'S DANGERS are three. (1) Staging the debate: every band names
// the question and answers it from the Word, with the Word asking it first
// (Habakkuk 1:2, Matthew 27:46) pinned. (2) Teaching that suffering is good or
// that a people is favored: every band carries "no respecter of persons" and
// the sentence that He never calls oppression good, with proofs that dropping
// either is caught. (3) Softening the Lamb into a mirror: every band confesses
// Him as the Lamb of Yahweh and the Eternal Son of Yahweh, with John 1:29.
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

const ID = 'll289-why-the-oppressed-still-call-on-him';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'WHY THE OPPRESSED STILL CALL ON HIM — the Lamb who was despised, the Bible the slaveholders cut, and the Word on whose side Yahweh stands.';

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
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Habakkuk 1:2-4', 'O LORD, how long shall I cry, and thou wilt not hear!'],
  ['Psalms 13:1-2', 'How long wilt thou forget me, O LORD? for ever?'],
  ['Matthew 27:46', 'My God, my God, why hast thou forsaken me?'],
  ['Exodus 2:23-25', 'And God heard their groaning, and God remembered his covenant with Abraham, with Isaac, and with Jacob.'],
  [
    'Exodus 3:7-9',
    'I have surely seen the affliction of my people which are in Egypt, and have heard their cry by reason of their taskmasters; for I know their sorrows; And I am come down to deliver them',
  ],
  ['Acts 7:34', 'I have seen, I have seen the affliction of my people'],
  ['Psalms 103:6', 'The LORD executeth righteousness and judgment for all that are oppressed.'],
  ['Psalms 146:7-9', 'The LORD looseth the prisoners'],
  ['Psalms 10:12-14', 'the poor committeth himself unto thee; thou art the helper of the fatherless.'],
  [
    'Deuteronomy 7:7-8',
    'The LORD did not set his love upon you, nor choose you, because ye were more in number than any people; for ye were the fewest of all people: But because the LORD loved you',
  ],
  ['Amos 2:6-7', 'because they sold the righteous for silver, and the poor for a pair of shoes'],
  [
    'Acts 10:34-35',
    'Of a truth I perceive that God is no respecter of persons: But in every nation he that feareth him, and worketh righteousness, is accepted with him.',
  ],
  ['Galatians 3:28', 'There is neither Jew nor Greek, there is neither bond nor free, there is neither male nor female: for ye are all one in Christ Jesus.'],
  ['Luke 13:3', 'except ye repent, ye shall all likewise perish.'],
  ['Isaiah 53:3', 'He is despised and rejected of men; a man of sorrows, and acquainted with grief'],
  ['Matthew 2:13-15', 'flee into Egypt, and be thou there until I bring thee word: for Herod will seek the young child to destroy him.'],
  ['Luke 4:18-19', 'he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted, to preach deliverance to the captives'],
  ['Philippians 2:7-8', 'became obedient unto death, even the death of the cross.'],
  [
    'Hebrews 4:15',
    'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.',
  ],
  ['John 1:29', 'which taketh away the sin of the world.'],
  [
    'Isaiah 53:4-5',
    'he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.',
  ],
  ['Numbers 12:1', 'And Miriam and Aaron spake against Moses because of the Ethiopian woman whom he had married'],
  ['Jeremiah 38:7-13', 'Ebedmelech the Ethiopian, one of the eunuchs which was in the king’s house'],
  ['Luke 23:26', 'one Simon, a Cyrenian'],
  ['Acts 8:27', 'a man of Ethiopia, an eunuch of great authority'],
  ['Psalms 68:31', 'Princes shall come out of Egypt; Ethiopia shall soon stretch out her hands unto God.'],
  ['Acts 17:26', 'And hath made of one blood all nations of men for to dwell on all the face of the earth'],
  ['Exodus 21:16', 'And he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death.'],
  ['Deuteronomy 23:15-16', 'Thou shalt not deliver unto his master the servant which is escaped from his master unto thee'],
  ['1 Timothy 1:9-10', 'for manslayers, For whoremongers, for them that defile themselves with mankind, for menstealers'],
  [
    'Ephesians 6:9',
    'ye masters, do the same things unto them, forbearing threatening: knowing that your Master also is in heaven; neither is there respect of persons with him.',
  ],
  ['Galatians 5:1', 'Stand fast therefore in the liberty wherewith Christ hath made us free, and be not entangled again with the yoke of bondage.'],
  ['Isaiah 1:17', 'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.'],
  ['Micah 6:8', 'what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?'],
  [
    '1 Corinthians 6:9-11',
    'And such were some of you: but ye are washed, but ye are sanctified, but ye are justified in the name of the Lord Jesus, and by the Spirit of our God.',
  ],
  ['Ecclesiastes 7:29', 'Lo, this only have I found, that God hath made man upright; but they have sought out many inventions.'],
  ['Isaiah 10:1-2', 'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed'],
  ['Deuteronomy 30:19', 'therefore choose life'],
  ['James 1:13-15', 'Let no man say when he is tempted, I am tempted of God: for God cannot be tempted with evil, neither tempteth he any man'],
  ['Exodus 22:21-24', 'If thou afflict them in any wise, and they cry at all unto me, I will surely hear their cry; And my wrath shall wax hot'],
  ['Proverbs 14:31', 'He that oppresseth the poor reproacheth his Maker'],
  ['Genesis 50:20', 'ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.'],
  ['Acts 2:36', 'God hath made that same Jesus, whom ye have crucified, both Lord and Christ.'],
  ['2 Corinthians 4:8-10', 'Persecuted, but not forsaken; cast down, but not destroyed'],
  ['Romans 8:35-39', 'Who shall separate us from the love of Christ?'],
  ['Revelation 21:4', 'And God shall wipe away all tears from their eyes'],
  ['Habakkuk 2:3', 'though it tarry, wait for it; because it will surely come, it will not tarry.'],
  ['Romans 3:4', 'let God be true, but every man a liar'],
  ['Psalms 73:16-17', 'When I thought to know this, it was too painful for me; Until I went into the sanctuary of God; then understood I their end.'],
  ['John 9:2-3', 'Neither hath this man sinned, nor his parents: but that the works of God should be made manifest in him.'],
  ['Matthew 25:40', 'Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.'],
];

describe('L289 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 289 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 289)).toEqual([289]);
  });

  it('sits after ll288 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll288-'));
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

describe('the lesson practises the newsletter Way: the voices named, the figure checked, the reading shown, a reader length', () => {
  it('names Darrell as the sender and all three of the video’s voices in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Garrison Hayes/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Claudia Allen/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Dr\. Anthony B\. Pinn/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('shows the reading: the video not fetched, the figure checked against Pew, the Slave Bible and Douglass found, no percentage', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not be fetched|could not get the video/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Pew/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/nearly eight in ten/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/about three in four/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/1807/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Douglass/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/1845/);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(L.lesson).toMatch(/rest on the summary until the transcript lands/);
    expect(L.lesson).toMatch(/widest possible difference/);
    expect(L.lesson).toMatch(/No advertising rides the send/);
  });

  it('names the question Dr. Pinn asks and answers it from the Word, which asked it first (DR-0098), in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/asked (it|that question) first|ASKED THE QUESTION FIRST/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('O LORD, how long shall I cry, and thou wilt not hear!');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('My God, my God, why hast thou forsaken me?');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/favored community|favorites?\b/);
  });

  it('does not stage the debate the video names on gender and sexuality: one door and one call, from the Word', () => {
    expect(L.lesson).toMatch(/does not stage the argument/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('And such were some of you: but ye are washed');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('ye are all one in Christ Jesus.');
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure of the question, the people, the Lamb and the suffering, in the lesson and in every band', () => {
  it('says whose side He stands on in His own first-person words', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And God heard their groaning');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I have surely seen the affliction of my people which are in Egypt, and have heard their cry');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The LORD executeth righteousness and judgment for all that are oppressed.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The LORD looseth the prisoners');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the helper of the fatherless.');
  });

  it('teaches that no people is favored and that being oppressed is not righteousness, in every band', () => {
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain('The LORD did not set his love upon you, nor choose you, because ye were more in number than any people');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('God is no respecter of persons');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('except ye repent, ye shall all likewise perish.');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/a condition He hears, not a merit He rewards/);
  });

  it('PROVEN TO CATCH: a band that drops "no respecter of persons" is named', () => {
    const youth = L.levels.youth.replace(
      '"God is no respecter of persons: But in every nation he that feareth him, and worketh righteousness, is accepted with him." (Acts 10:34-35).',
      'He loves everyone.'
    );
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('God is no respecter of persons')).toBe(false);
  });

  it('meets the Lamb who was despised, hunted, poor and executed, and confesses Him as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He is despised and rejected of men; a man of sorrows');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('flee into Egypt');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('took upon him the form of a servant');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('tempted like as we are, yet without sin.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('which taketh away the sin of the world.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('wounded for our transgressions');
  });

  it('puts Africa in the Word before any ship sailed', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Ethiopian woman|Ethiopia/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Ebedmelech/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Simon/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Ethiopia shall soon stretch out her hands unto God.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('hath made of one blood all nations of men');
  });

  it('reads the two verses the Slave Bible cut, whole, in every text', () => {
    for (const k of PLACES)
      expect(TEXTS[k], k).toContain('And he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thou shalt not deliver unto his master the servant which is escaped from his master unto thee');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/man-stealer|steals a person|stealing people/i);
  });

  it('lays the suffering at the feet of human choice, never at His, and never calls oppression good', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but they have sought out many inventions.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('therefore choose life');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that oppresseth the poor reproacheth his Maker');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/never calls (oppression|the whip|being hurt) (good|a gift)|never says being hurt is good/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('but God meant it unto good');
  });

  it('PROVEN TO CATCH: a band that drops the sentence that He never calls oppression good is named', () => {
    const youth = L.levels.youth.replace(
      'It never calls oppression good or the whip a gift; this lesson does not teach that the suffering was good, and no band of it does.',
      'Suffering is good for you.'
    );
    expect(youth).not.toBe(L.levels.youth);
    expect(youth).not.toMatch(/never calls (oppression|the whip|being hurt) (good|a gift)|never says being hurt is good/);
  });

  it('ends on the day He has set and the hand He offers, and holds the whole video up to the brighter light', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Who shall separate us from the love of Christ?');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And God shall wipe away all tears from their eyes');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Prove all things; hold fast that which is good.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/offered a mirror\. He offered a hand|gave them a picture\. He gave them His hand/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.');
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/a link and a summary Darrell sent/);
    expect(L.inApp).toMatch(/parables with invented people/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(270);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(255);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('He that oppresseth the poor reproacheth his Maker', 'He that oppresseth the poor insults his Maker');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"except ye repent, ye shall all likewise perish." (Luke 13:3)',
      '"Except ye repent, ye shall all likewise perish." (Luke 13:3)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Luke 13:3) is not the verse: Except ye repent, ye shall all likewise perish.']);
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
    expect(inQuotes).toContain('Of a truth I perceive that God is no respecter of persons');
    expect(inQuotes).toContain('The LORD executeth righteousness and judgment for all that are oppressed.');
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
    const friend = /Friends, tell one friend this week about the Bible with the pages missing[^.]*\./.exec(youth);
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
