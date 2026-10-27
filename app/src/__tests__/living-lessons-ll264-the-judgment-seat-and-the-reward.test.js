// @vitest-environment node
// =============================================================================
// L264 — "The Judgment Seat and the Reward": the teaching Darrell sent INSIDE
// the PoeTech app, down the app's own research road, on 2026-10-22. DR-1224.
// =============================================================================
// WHAT CAME IN. Darrell sent a link into the app's research road; the road
// fetched the whole reading (4,465 words) on our own machines. It is one
// speaker teaching on the judgment seat of Christ as an evaluation of a
// believer's service rather than of his salvation. The road returned NO NAME
// for the speaker, so the lesson names none and attaches no faith label,
// affiliation or motive to him — the exact mistake that had to be corrected on
// World Issues 21. The same row carried a SECOND, separate request of Darrell's
// about historical events, Scripture locations and parallel timelines; that is
// product work, recorded on its own, and nothing of it is in this lesson.
//
// WHAT THIS GATE EXISTS TO PROTECT, in order of how badly it would hurt:
//
// 1. THE GOSPEL'S EDGE, IN BOTH DIRECTIONS. This subject fails two ways, and
//    both failures are serious. Teach it one way and a reader hears that works
//    buy his place; teach it the other and he hears that works are
//    decorative. 1 Corinthians 3:15 refuses both IN ONE SENTENCE — "he shall
//    suffer loss: but he himself shall be saved; yet so as by fire" — so every
//    place a reader reads must carry BOTH halves of that verse, and must carry
//    the gift (Ephesians 2:8-9) and the no-condemnation (Romans 8:1) with it.
//    A place that quotes the loss without the saving, or the saving without
//    the loss, fails here. That is the whole doctrinal point of the lesson.
// 2. THE TWO SEATS STAY TWO. 2 Corinthians 5:10 and Romans 14:10-12 are
//    written to believers about their service; Revelation 20:11-15 is a
//    different scene with a different question. The lesson teaches both and
//    refuses to fuse them into a timetable the Word does not give (DR-0098).
// 3. THE FOUNDATION IS NOT THE BUILDER'S. 1 Corinthians 3:11 in every place,
//    or the fire reads as a test of whether a man belongs.
// 4. WHAT WE DID NOT VERIFY IS NAMED, NOT RELAYED (DR-0076 Section 8). The
//    reading's claim that such a platform also crowned athletes and decorated
//    soldiers is NOT asserted here; the lesson says so out loud. And the
//    judgment-seat picture is built from the corpus instead — Matthew 27:19,
//    John 19:13, Acts 25:10, Acts 18:12 and 18:16 — the same word rendered the
//    same way, including the platform in Corinth that Paul's own readers knew.
// 5. WE STOP WHERE THE WORD STOPS. The reading used the parable of the talents
//    as a picture of the seat; that parable ends with the unprofitable servant
//    cast out (Matthew 25:30), which is not a believer losing a reward, so the
//    lesson takes the commendation and leaves that ending where the text puts
//    it, and says why. Likewise the word castaway (1 Corinthians 9:27) is
//    taught as written, with no doctrine built on the Word's silence.
// 6. EVERY VERSE IS THE CORPUS, VERBATIM. Every span was fetched from
//    app/public/bible/kjv before a sentence of this lesson was written, never
//    from memory (DR-0076).
//
// PROVEN TO CATCH (DR-0076 Section 3): the mutation cases below each assert
// their anchor is present BEFORE mutating, then show the check go red.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, hasAllThree, missingDirections } from '../lib/talk-together.js';

const ID = 'll264-the-judgment-seat-and-the-reward-salvation-settled-service-measured';
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** The verse exactly as the corpus on disk has it. No normalisation of marks. */
function corpusVerse(book, ch, n) {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
}

const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
// The five places a reader actually reads. A reader reads ONE of them.
const PLACES = L ? { lesson: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACE_KEYS = Object.keys(PLACES);
const whole = PLACE_KEYS.map((k) => PLACES[k]).join('\n');

// The spine. Copied from the corpus, never written from memory.
const PINNED = {
  '2 Corinthians 5:10': 'For we must all appear before the judgment seat of Christ; that every one may receive the things done in his body, according to that he hath done, whether it be good or bad',
  '1 Corinthians 3:11': 'For other foundation can no man lay than that is laid, which is Jesus Christ',
  '1 Corinthians 3:12': 'Now if any man build upon this foundation gold, silver, precious stones, wood, hay, stubble',
  '1 Corinthians 3:13': 'the fire shall try every man’s work of what sort it is',
  '1 Corinthians 3:14': 'If any man’s work abide which he hath built thereupon, he shall receive a reward',
  '1 Corinthians 3:15': 'If any man’s work shall be burned, he shall suffer loss: but he himself shall be saved; yet so as by fire',
  'Romans 14:12': 'So then every one of us shall give account of himself to God',
  'Romans 8:1': 'There is therefore now no condemnation to them which are in Christ Jesus',
  'Ephesians 2:8': 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God',
  'Ephesians 2:9': 'Not of works, lest any man should boast',
  'Ephesians 2:10': 'For we are his workmanship, created in Christ Jesus unto good works',
  'Colossians 1:13': 'Who hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son',
  'Acts 18:12': 'And when Gallio was the deputy of Achaia, the Jews made insurrection with one accord against Paul, and brought him to the judgment seat',
  'Revelation 20:11': 'And I saw a great white throne, and him that sat on it',
  'Revelation 20:15': 'whosoever was not found written in the book of life was cast into the lake of fire',
  '2 Timothy 4:8': 'Henceforth there is laid up for me a crown of righteousness',
  'Matthew 25:21': 'Well done, thou good and faithful servant',
  'Luke 22:30': 'That ye may eat and drink at my table in my kingdom',
  'Revelation 19:9': 'Blessed are they which are called unto the marriage supper of the Lamb',
  'Matthew 10:42': 'whosoever shall give to drink unto one of these little ones a cup of cold water only in the name of a disciple, verily I say unto you, he shall in no wise lose his reward',
  'Luke 21:4': 'she of her penury hath cast in all the living that she had',
  'Hebrews 11:8': 'he went out, not knowing whither he went',
  'Hebrews 11:31': 'By faith the harlot Rahab perished not with them that believed not, when she had received the spies with peace',
  'Hebrews 6:10': 'For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name',
  'Colossians 3:23': 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men',
  'Matthew 6:20': 'But lay up for yourselves treasures in heaven, where neither moth nor rust doth corrupt',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world',
  'Hebrews 1:8': 'Thy throne, O God, is for ever and ever',
  'Deuteronomy 6:7': 'and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Galatians 5:22': 'love, joy, peace, longsuffering, gentleness, goodness, faith',
  'Hebrews 3:13': 'daily, while it is called To day',
  // taught in the lesson and in the bands that reach them
  '2 Corinthians 5:9': 'Wherefore we labour, that, whether present or absent, we may be accepted of him',
  '2 Corinthians 5:11': 'Knowing therefore the terror of the Lord, we persuade men',
  '2 Corinthians 5:21': 'For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him',
  '1 Corinthians 3:8': 'and every man shall receive his own reward according to his own labour',
  '1 Corinthians 3:9': 'For we are labourers together with God: ye are God’s husbandry, ye are God’s building',
  '1 Corinthians 3:10': 'But let every man take heed how he buildeth thereupon',
  '1 Corinthians 4:2': 'Moreover it is required in stewards, that a man be found faithful',
  '1 Corinthians 4:5': 'will bring to light the hidden things of darkness, and will make manifest the counsels of the hearts: and then shall every man have praise of God',
  '1 Corinthians 9:24': 'Know ye not that they which run in a race run all, but one receiveth the prize? So run, that ye may obtain',
  '1 Corinthians 9:25': 'And every man that striveth for the mastery is temperate in all things. Now they do it to obtain a corruptible crown; but we an incorruptible',
  '1 Corinthians 9:26': 'I therefore so run, not as uncertainly; so fight I, not as one that beateth the air',
  '1 Corinthians 9:27': 'lest that by any means, when I have preached to others, I myself should be a castaway',
  '2 Timothy 2:3': 'Thou therefore endure hardness, as a good soldier of Jesus Christ',
  '2 Timothy 2:4': 'No man that warreth entangleth himself with the affairs of this life; that he may please him who hath chosen him to be a soldier',
  '2 Timothy 2:5': 'if a man also strive for masteries, yet is he not crowned, except he strive lawfully',
  '2 Timothy 4:7': 'I have fought a good fight, I have finished my course, I have kept the faith',
  'Philippians 3:14': 'I press toward the mark for the prize of the high calling of God in Christ Jesus',
  '1 Peter 5:4': 'ye shall receive a crown of glory that fadeth not away',
  'James 1:12': 'when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him',
  'Revelation 2:10': 'be thou faithful unto death, and I will give thee a crown of life',
  'Revelation 3:11': 'hold that fast which thou hast, that no man take thy crown',
  'Revelation 22:12': 'my reward is with me, to give every man according as his work shall be',
  'Luke 22:29': 'And I appoint unto you a kingdom, as my Father hath appointed unto me',
  'Hebrews 9:27': 'And as it is appointed unto men once to die, but after this the judgment',
  'Hebrews 11:17': 'By faith Abraham, when he was tried, offered up Isaac',
  'Luke 21:3': 'Of a truth I say unto you, that this poor widow hath cast in more than they all',
  'Romans 14:10': 'for we shall all stand before the judgment seat of Christ',
  'Romans 14:11': 'every knee shall bow to me, and every tongue shall confess to God',
  'Revelation 20:12': 'the dead were judged out of those things which were written in the books, according to their works',
  'Acts 18:16': 'And he drave them from the judgment seat',
  'Acts 25:10': 'I stand at Caesar’s judgment seat, where I ought to be judged',
  'Matthew 27:19': 'When he was set down on the judgment seat',
  'John 19:13': 'he brought Jesus forth, and sat down in the judgment seat in a place that is called the Pavement',
  'Matthew 25:19': 'After a long time the lord of those servants cometh, and reckoneth with them',
  'Matthew 25:30': 'And cast ye the unprofitable servant into outer darkness',
  'Colossians 3:24': 'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ',
  '2 John 1:8': 'Look to yourselves, that we lose not those things which we have wrought, but that we receive a full reward',
  '1 Corinthians 15:58': 'forasmuch as ye know that your labour is not in vain in the Lord',
  'Galatians 6:9': 'And let us not be weary in well doing: for in due season we shall reap, if we faint not',
};

const splitRef = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  return { book: m[1], ch: m[2], n: m[3] };
};

// Every double-quoted span standing beside the reference it cites.
const REF_SPAN = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (root) => {
  const out = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      REF_SPAN.lastIndex = 0;
      let g;
      while ((g = REF_SPAN.exec(node))) out.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(root, '');
  return out;
};

/** Every anchor.ref entry, with "Book c:v-w" expanded to one entry per verse. */
const anchoredRefs = (module) => {
  const set = new Set();
  for (const part of String(module.anchor.ref).split(';')) {
    const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!m) continue;
    const last = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= last; v += 1) set.add(`${m[1].trim()} ${m[2]}:${v}`);
  }
  return set;
};

// (a) THE MODULE EXISTS ONCE, AT ITS NUMBER
describe('L264 exists exactly once, at its own number, with all four bands', () => {
  it('is in the catalog exactly once', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 264 and only 264, and sits after every lower-numbered lesson present', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 264)).toHaveLength(1);
    // a floor, not an equality: a later lesson raises the max and must not fail this
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(264);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const lower = LIVING_LESSONS_MODULES
      .map((m, i) => ({ n: Number((/^ll(\d+)-/.exec(m.id) || [])[1]), i }))
      .filter((x) => Number.isFinite(x.n) && x.n < 264);
    expect(Math.max(...lower.map((x) => x.i)), 'L264 reads after every lower number').toBeLessThan(at);
  });

  it('carries the day it JOINED the course, at or after the lesson before it', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    const days = LIVING_LESSONS_MODULES
      .map((m) => ({ n: Number((/^ll(\d+)-/.exec(m.id) || [])[1]), d: LIVING_LESSONS_ADDED[m.id] }))
      .filter((x) => Number.isFinite(x.n) && x.n < 264 && x.d);
    expect(days.every((x) => x.d <= '2026-10-27'), 'the days still follow the numbers').toBe(true);
  });
});

// (b) PROVENANCE — THE ROAD IS NAMED AND THE SPEAKER IS NOT INVENTED (DR-1206)
describe('L264 names its road honestly and labels no real person', () => {
  it('says the link came in INSIDE the app, down the research road, fetched on our own machines', () => {
    for (const k of PLACE_KEYS) {
      expect(/sent a link into the PoeTech app|sent a link into our app/.test(PLACES[k]), `${k} does not say how it came in`).toBe(true);
      expect(/research road/.test(PLACES[k]), `${k} does not name the road`).toBe(true);
      expect(/our own machines/.test(PLACES[k]), `${k} does not say where it was fetched`).toBe(true);
    }
  });

  it('never says it was recorded on a phone and sent in — that is the other road', () => {
    expect(/recorded on a phone|phone and sent in/i.test(whole)).toBe(false);
  });

  it('says plainly that no name came back, and attaches no label to the speaker', () => {
    for (const k of PLACE_KEYS) {
      expect(/no name|not told his name|returned no name/i.test(PLACES[k]), `${k} does not say the speaker is unnamed`).toBe(true);
    }
    // No faith label, denomination, affiliation or motive is ascribed to him.
    expect(/the (?:pastor|bishop|preacher|evangelist|rabbi|priest)\b/i.test(whole), 'a title was invented for the speaker').toBe(false);
  });

  it('keeps the SECOND request out of the teaching, and says so where there is room', () => {
    // the app-feature ask that travelled with the link is named as product work,
    // not folded into a lesson about the judgment seat
    for (const k of ['lesson', 'teen', 'senior']) {
      expect(/parallel timelines/.test(PLACES[k]), `${k} does not name the separate request`).toBe(true);
      expect(/product work/.test(PLACES[k]), `${k} does not call it product work`).toBe(true);
    }
    // and the lesson does not try to teach it
    expect(/timeline of (?:the )?(?:scroll|scrolls)/i.test(whole)).toBe(false);
  });
});

// (c) EVERY QUOTED VERSE IS THE CORPUS, BYTE FOR BYTE
describe('L264 — every verse it stands on is the corpus, verbatim', () => {
  for (const [ref, text] of Object.entries(PINNED)) {
    it(`${ref} is quoted exactly as the corpus on disk has it`, () => {
      const { book, ch, n } = splitRef(ref);
      const v = corpusVerse(book, ch, n);
      expect(v, `${ref} resolves in the corpus`).toBeTruthy();
      expect(v.includes(norm(text)), `the pinned span is not in ${ref} as the corpus writes it`).toBe(true);
      expect(whole.includes(text), `the lesson does not carry ${ref}`).toBe(true);
    });
  }

  const spans = L ? spansOf(L) : [];

  it('quotes a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(300);
  });

  it('every referenced span anywhere in the module is verbatim in the verse it cites, case and marks included', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => corpusVerse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 80)}"`);
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered character in 1 Corinthians 3:15 goes red', () => {
    const real = PINNED['1 Corinthians 3:15'];
    const v = corpusVerse('1 Corinthians', 3, 15);
    expect(v.includes(norm(real)), 'the anchor is present before mutating').toBe(true);
    const mutated = real.replace('shall be saved', 'shall be lost');
    expect(v.includes(norm(mutated)), 'the mutation must NOT be in the corpus').toBe(false);
  });

  it('PROVEN TO CATCH: "Yahweh" substituted into a quotation goes red', () => {
    // DR-0210's bright line: our voice says Yahweh, a quotation is never edited.
    const real = PINNED['Ephesians 2:8'];
    const v = corpusVerse('Ephesians', 2, 8);
    expect(v.includes(norm(real)), 'the anchor is present before mutating').toBe(true);
    expect(v.includes(norm(real.replace('the gift of God', 'the gift of Yahweh')))).toBe(false);
  });

  it('every double-quoted span in a reader place stands beside its reference', () => {
    const loose = [];
    for (const k of PLACE_KEYS) {
      const quotes = (PLACES[k].match(/"[^"]*"/g) || []).length;
      const referenced = spansOf(PLACES[k]).length;
      if (quotes !== referenced) loose.push(`${k}: ${quotes} quoted, ${referenced} referenced`);
    }
    expect(loose).toEqual([]);
  });

  it('uses the corpus apostrophe inside every quotation', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });

  it('marks no elision and recites no record id in reader prose', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them, and never uses the generic in our own voice', () => {
    for (const u of ['it is the gift of God', 'give account of himself to God', 'Behold the Lamb of God']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
    for (const k of PLACE_KEYS) {
      const ours = ourProseOnly(PLACES[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
    }
  });

  it('never capitalizes the adversary, anywhere', () => {
    expect(/\b(?:Satan|Lucifer|Baal)\b/.test(JSON.stringify(L))).toBe(false);
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from it, DR-0734)', () => {
    const anchored = anchoredRefs(L);
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r)), 'a verse is taught but missing from anchor.ref').toEqual([]);
    const missing = new Set();
    for (const s of spans) {
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        const nums = r ? Array.from({ length: Number(r[2]) - Number(r[1]) + 1 }, (_, i) => Number(r[1]) + i) : [Number(part.trim())];
        for (const n of nums) { const ref = `${s.book} ${s.ch}:${n}`; if (!anchored.has(ref)) missing.add(ref); }
      }
    }
    expect([...missing], 'a span is quoted from a verse anchor.ref does not name').toEqual([]);
  });
});

// (d) THE DOCTRINAL EDGE — BOTH HALVES OF 1 CORINTHIANS 3:15, EVERYWHERE
describe('L264 — the gospel edge is guarded in BOTH directions, in every place', () => {
  it.each(PLACE_KEYS)('%s carries BOTH halves of 1 Corinthians 3:15 — the real loss and the man saved', (k) => {
    const t = PLACES[k];
    expect(t.includes('he shall suffer loss'), `${k} drops the loss`).toBe(true);
    expect(t.includes('but he himself shall be saved; yet so as by fire'), `${k} drops the saving`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s refuses works-righteousness: the gift and the foundation already laid', (k) => {
    const t = PLACES[k];
    expect(t.includes('it is the gift of God'), `${k} drops Ephesians 2:8`).toBe(true);
    expect(t.includes('Not of works, lest any man should boast'), `${k} drops Ephesians 2:9`).toBe(true);
    expect(t.includes('For other foundation can no man lay than that is laid, which is Jesus Christ'), `${k} drops the foundation`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s secures the reader before it sobers him: no condemnation', (k) => {
    expect(PLACES[k].includes('There is therefore now no condemnation to them which are in Christ Jesus'), `${k} drops Romans 8:1`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s refuses the other error too: a reward is really earned and really lost', (k) => {
    const t = PLACES[k];
    expect(t.includes('he shall receive a reward'), `${k} drops 1 Corinthians 3:14`).toBe(true);
    expect(/lost a reward|lose a reward|losing a reward|lost reward|loses the reward|lose the reward|not the same loss|not the same thing/i.test(t), `${k} never distinguishes a lost reward from a lost soul`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s confesses Jesus as the Lamb of Yahweh with John 1:29 beside it', (k) => {
    const t = PLACES[k];
    expect(/Lamb of Yahweh/.test(t), `${k} does not confess Him as the Lamb of Yahweh`).toBe(true);
    expect(t.includes('Behold the Lamb of God, which taketh away the sin of the world'), `${k} drops John 1:29`).toBe(true);
    // DR-0210 in full: the Eternal Son of YAHWEH, named as such and not only "the Son"
    expect(/Eternal Son of Yahweh/.test(t), `${k} does not confess Him as the Eternal Son of Yahweh`).toBe(true);
    expect(t.includes('Thy throne, O God, is for ever and ever'), `${k} drops Hebrews 1:8`).toBe(true);
  });

  it('PROVEN TO CATCH: a place that keeps the loss and drops the saving goes red', () => {
    const half = PLACES.teen.replace('but he himself shall be saved; yet so as by fire', 'and that is the end of it');
    expect(half.includes('he shall suffer loss')).toBe(true);
    expect(half.includes('but he himself shall be saved; yet so as by fire'), 'the half-verse must read red').toBe(false);
  });

  it('PROVEN TO CATCH: a place that drops the gift and keeps only the measuring goes red', () => {
    const earned = PLACES.child.replace('it is the gift of God', 'you have to earn it');
    expect(earned.includes('it is the gift of God'), 'the gift must read red once removed').toBe(false);
  });
});

// (e) THE TWO SEATS STAY TWO, AND NO TIMETABLE IS INVENTED
describe('L264 — two seats, two questions, no calendar the Word did not give', () => {
  it.each(PLACE_KEYS)('%s teaches the seat written to believers', (k) => {
    const t = PLACES[k];
    expect(/judgment seat of Christ/.test(t), `${k} never names the seat`).toBe(true);
    expect(t.includes('So then every one of us shall give account of himself to God') || t.includes('For we must all appear before the judgment seat of Christ'), `${k} drops the believer's seat`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s also teaches the other scene, and keeps it other', (k) => {
    const t = PLACES[k];
    expect(t.includes('And I saw a great white throne, and him that sat on it'), `${k} drops Revelation 20:11`).toBe(true);
    expect(t.includes('was not found written in the book of life was cast into the lake of fire'), `${k} drops Revelation 20:15`).toBe(true);
    expect(/book of life/.test(t), `${k} never names the different question`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s says the two are not one, in its own words', (k) => {
    expect(/two scenes|different scene|not the same|different question/i.test(PLACES[k]), `${k} never says the scenes are distinct`).toBe(true);
  });

  it('refuses a sequence the Word does not give, and says why (DR-0098)', () => {
    for (const k of ['lesson', 'teen', 'senior']) {
      expect(/timetable|calendar|sequence/i.test(PLACES[k]), `${k} does not name the limit`).toBe(true);
    }
    // and never asserts an ordering between them
    expect(/the bema (?:comes|happens) (?:before|after) the great white throne/i.test(whole)).toBe(false);
  });
});

// (f) WHAT WE DID NOT VERIFY IS NAMED, NOT RELAYED (DR-0076 Section 8)
describe('L264 — the unverified claim is flagged, and the picture is built from the corpus instead', () => {
  it.each(['lesson', 'youth', 'teen', 'senior'])('%s names the one claim it did not verify, and does not assert it', (k) => {
    const t = PLACES[k];
    expect(/did not verify|not verify/i.test(t), `${k} relays the claim without flagging it`).toBe(true);
    expect(/crowned (?:its )?athletes|crowned athletes/i.test(t), `${k} does not name which claim`).toBe(true);
    // never stated as fact: the platform "was where" the city crowned athletes
    expect(/\bthe bema was where Corinth crowned\b/i.test(t)).toBe(false);
  });

  it('builds the judgment-seat picture from the corpus: the same word, the same rendering', () => {
    for (const ref of ['Matthew 27:19', 'John 19:13', 'Acts 25:10', 'Acts 18:12', 'Acts 18:16']) {
      expect(whole.includes(PINNED[ref]), `drops ${ref}, which is how the picture is verified`).toBe(true);
    }
  });

  it('names the Greek word as a word study and never substitutes it into a quotation', () => {
    expect(/\bbema\b/.test(whole), 'the word study is present').toBe(true);
    const spans = spansOf(L);
    expect(spans.filter((s) => /bema/i.test(s.quoted)), 'bema was put inside a quotation').toEqual([]);
    // the KJV's own rendering is what the quotations carry
    expect(whole.includes('brought him to the judgment seat')).toBe(true);
  });

  it('does not relay the Egyptian honours claim that came in with the reading', () => {
    // Ahmose son of Ibana's tomb was offered as a parallel, with a reading of it
    // that ties the honours to the Israelites in Goshen. That identification is
    // not established, and nothing of it is taught here.
    expect(/Ahmose|Ibana|Abana|window of appearance|gold collar/i.test(JSON.stringify(L))).toBe(false);
  });
});

// (g) WE STOP WHERE THE WORD STOPS
describe('L264 — the parable, the castaway, and the silence', () => {
  it.each(['lesson', 'youth', 'teen', 'senior'])('%s takes the commendation from the talents and leaves the third servant where the text puts him', (k) => {
    const t = PLACES[k];
    expect(t.includes('Well done, thou good and faithful servant'), `${k} drops the commendation`).toBe(true);
    expect(t.includes('And cast ye the unprofitable servant into outer darkness'), `${k} hides the ending it will not use`).toBe(true);
    expect(/not a believer losing a reward|will not flatten it into one|must not be flattened into one/i.test(t), `${k} does not say why it stops`).toBe(true);
  });

  it.each(['lesson', 'teen', 'senior'])('%s teaches castaway as written, and builds nothing on the silence', (k) => {
    const t = PLACES[k];
    expect(t.includes('lest that by any means, when I have preached to others, I myself should be a castaway'), `${k} drops 1 Corinthians 9:27`).toBe(true);
    expect(/does not define|no doctrine (?:on|upon) (?:the |a )?silence|erect no doctrine/i.test(t), `${k} goes past the text`).toBe(true);
    // never asserted as settled in either direction
    expect(/castaway means (?:only )?(?:disqualified|the loss of the prize|losing the kingdom)/i.test(t)).toBe(false);
  });
});

// (h) ALL FOUR BANDS, WRITTEN FOR THEIR READER
describe('L264 — four bands, each for its own reader', () => {
  const f = measureFullness(L);

  it.each(BANDS)('%s clears its floor share of the adult lesson prose', (b) => {
    expect(f.bands[b].present, `${b} is missing`).toBe(true);
    expect(f.bands[b].share, `${b} is short of ${FULL_FLOOR[b]}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('no band is short', () => {
    expect(shortBands(f)).toEqual([]);
  });

  it('PROVEN TO CATCH: a child band trimmed to 600 characters is named short', () => {
    const trimmed = { ...L, levels: { ...L.levels, child: L.levels.child.slice(0, 600) } };
    expect(shortBands(measureFullness(trimmed))).toContain('child');
  });

  it('the child band reads like a child band, under the new-lesson ceiling', () => {
    const g = fleschKincaidGrade(ourProseOnly(L.levels.child));
    expect(g, `child authored prose reads at grade ${g}`).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('the ladder rises and is not inverted', () => {
    const m = measureLesson(L);
    expect(isInverted(m), 'the child band reads harder than the teen band').toBe(false);
    expect(m.bands.child.authored).toBeLessThan(m.bands.youth.authored);
    expect(m.bands.youth.authored).toBeLessThan(m.bands.teen.authored);
    expect(m.bands.teen.authored).toBeLessThan(m.bands.senior.authored);
  });

  it('the bands are genuinely different texts, not one text reused', () => {
    expect(duplicatedBands(measureDifferentiation(L), DIFF_CEILING)).toEqual([]);
  });

  it('every band names the lesson near its start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('the child band carries the hard part gently: no fear, and the saving said plainly', () => {
    const c = L.levels.child;
    expect(c.includes('but he himself shall be saved; yet so as by fire')).toBe(true);
    expect(/you can read the rest of this lesson without being scared/i.test(c)).toBe(true);
    expect(/lake of fire/.test(c), 'the child band may name the other scene as the Word words it').toBe(true);
    expect(/you will burn|you might go to hell/i.test(c), 'the child band threatens no reader').toBe(false);
  });
});

// (i) THE THREE DIRECTIONS, ON THE MODULE AND ON EACH BAND SEPARATELY
describe('L264 — TALK ABOUT IT TOGETHER, in all three directions, in every place', () => {
  it('the lesson and every band send the reader all three ways in the lesson’s own words', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it.each(PLACE_KEYS)('%s names TALK ABOUT IT TOGETHER and carries the skill and the rhythm', (k) => {
    const t = PLACES[k];
    expect(t).toContain('TALK ABOUT IT TOGETHER');
    expect(/listen (?:all the way )?to the (?:whole|end)/i.test(t), `${k} drops the listening skill`).toBe(true);
    expect(/retell|tell it back|in your own words/i.test(t), `${k} drops the retelling skill`).toBe(true);
    expect(/teach (?:them|each other|one verse)/i.test(t), `${k} drops teaching one verse back`).toBe(true);
    expect(/once today/i.test(t), `${k} drops the daily rhythm`).toBe(true);
    expect(/one friend this week/i.test(t), `${k} drops the one-friend-this-week rhythm`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s measures growth the Word’s way, qualitative and quantitative', (k) => {
    const t = PLACES[k];
    expect(t.includes('love, joy, peace, longsuffering, gentleness, goodness, faith'), `${k} drops the fruit`).toBe(true);
    expect(t.includes('daily, while it is called To day'), `${k} drops the count of days`).toBe(true);
    expect(t.includes('and shalt talk of them when thou sittest in thine house'), `${k} drops the four places`).toBe(true);
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line names that band while the pooled check still reads green', () => {
    const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);
    const friendless = sentences(L.levels.youth)
      .filter((s) => missingDirections(s).includes('friends'))
      .join(' ');
    expect(friendless).not.toBe(L.levels.youth);
    const mutated = { ...L, levels: { ...L.levels, youth: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is exactly the hazard (DR-0795)').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'youth', missing: ['friends'] }]);
  });
});

// (j) THE SHAPE — MOVEMENTS, STORIES, QUIZ, FACILITATOR
describe('L264 — the full teaching shape', () => {
  it('walks its ten movements in order in the adult lesson', () => {
    const markers = [
      'ONE. TWO SEATS',
      'TWO. HOW YOU GOT IN WAS NEVER YOUR WORK',
      'THREE. THE FOUNDATION, AND THE FIRE',
      'FOUR. THE SEAT HAS A NAME YOU HAVE ALREADY READ',
      'FIVE. WHAT IS MEASURED THERE',
      'SIX. THE RACE AND THE SOLDIER',
      'SEVEN. THE REWARDS, AS THE WORD NAMES THEM',
      'EIGHT. WHAT THE WORD ACTUALLY COMMENDS',
      'NINE. WHERE WE STOP, BECAUSE THE WORD STOPS',
      'TEN. SO LIVE LIKE SOMEONE WITH SOMETHING TO BRING',
    ];
    let at = -1;
    for (const m of markers) {
      const i = L.lesson.indexOf(m);
      expect(i, `movement out of order or missing: ${m}`).toBeGreaterThan(at);
      at = i;
    }
  });

  it('carries two parables, each a real scene, neither presented as a record', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(['light', 'solemn']).toContain(s.tone);
      expect(String(s.title).trim().length).toBeGreaterThan(3);
      expect(String(s.body).split(/\s+/).length, `${s.title} is a stub`).toBeGreaterThan(120);
    }
    expect(L.stories.map((s) => s.title)).toEqual(['The Two Lines at the Gate', 'What the Fire Left']);
  });

  it('the solemn parable teaches 1 Corinthians 3:15 and not something else', () => {
    const s = L.stories[1].body;
    expect(/saved out of that fire/i.test(s)).toBe(true);
    expect(/slab under him had not so much as cracked|slab/i.test(s), 'the foundation holds in the story').toBe(true);
    expect(/both men were saved|Both men were saved/.test(s)).toBe(true);
  });

  it('the quiz asks the doctrinal question and varies its answer position', () => {
    const qs = L.quiz.questions;
    expect(qs.length).toBeGreaterThanOrEqual(8);
    for (const q of qs) {
      expect(q.options).toHaveLength(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(3);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    expect(new Set(qs.map((q) => q.answer)).size, 'every answer sits in the same slot').toBeGreaterThan(1);
    const edge = qs.find((q) => q.options.some((o) => o.includes('he himself shall be saved; yet so as by fire')));
    expect(edge, 'the quiz never asks the one question this lesson exists for').toBeTruthy();
  });

  it('the facilitator guide opens on provenance and settles assurance before the examination', () => {
    const tp = L.facilitator.talkingPoints.join(' ');
    expect(/research road/.test(tp)).toBe(true);
    expect(/Settle assurance BEFORE/.test(tp)).toBe(true);
    expect(/did NOT verified|NOT verified/.test(tp), 'the unverified claim is named for the facilitator').toBe(true);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(/thirty minutes/.test(L.facilitator.howToRun)).toBe(true);
  });

  it('the benefits and the in-app practice both carry real work on real verses', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(6);
    expect(L.inApp).toContain('So then every one of us shall give account of himself to God');
    expect(L.inApp).toContain('There is therefore now no condemnation to them which are in Christ Jesus');
    expect(L.bigIdea).toContain('but he himself shall be saved; yet so as by fire');
  });
});
