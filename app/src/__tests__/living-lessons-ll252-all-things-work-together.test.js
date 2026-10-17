// @vitest-environment node
// =============================================================================
// L252 — "All Things Work Together": the teaching Darrell SPOKE into the house
// on 2026-10-17 and sharpened the same day, built the same session (a spoken
// teaching is build input). DR-1092.
// =============================================================================
// His first sentence, verbatim: "All things work together... like integrated
// systems... for or against depending on the Will and Way.... make sense...
// lesson". His sharpening, verbatim: "Must have the Will and Way of Yahweh...
// however... paths He's directing according to... make sense... we don't know
// our path... we know The Way and He directs us daily... He's into the details
// of all things!!!!!"
//
// WHAT THIS GATE EXISTS TO PROTECT, in order of how badly it would hurt:
//
// 1. ROMANS 8:28 IS NEVER PRINTED WITHOUT WHO IT IS FOR. The promise and its
//    condition were written in one sentence, and the half usually dropped is
//    the half that names the people: "to them that love God, to them who are
//    the called according to his purpose". So every quoted span in this lesson
//    that carries "all things work together for good" must also carry "to them
//    that love God" — the lesson may never hand a reader the promise stripped
//    of its condition.
// 2. THE TWO HALVES OF DARRELL'S DISTINCTION TRAVEL TOGETHER. "The Way is
//    known" and "our own path is not" are two different claims, and a reader
//    who gets only the second half is handed despair. Both literals are
//    required in all five places a reader actually reads, per place, so one
//    band cannot carry the known half for another band's reader.
// 3. HIS THREE MOVES, IN HIS ORDER, EVERYWHERE. all things work together ->
//    like integrated systems -> for or against. Asserted by the movement
//    markers so a band cannot reorder his thought.
// 4. EVERY VERSE IS THE CORPUS, VERBATIM. Fetched from app/public/bible/kjv
//    before a sentence of this lesson was written, never from memory (DR-0076).
//
// PROVEN TO CATCH (DR-0076 Section 3) — four mutations run against this file
// before commit, each anchored to text asserted present first, each restored
// byte-identical (verified with cmp):
//   a) one word altered inside a quoted verse  -> the corpus case for that ref
//   b) the friend line stripped from ONE band  -> placesMissingDirections names
//      that band while hasAllThree(module) still reads green (the DR-0795
//      hazard)
//   c) Romans 8:28 quoted in one place without its condition -> the condition
//      case names that place
//   d) "The Way is known" deleted from one band -> the pairing case names that
//      band
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

const ID = 'll252-all-things-work-together-the-integrated-system-and-which-way-it-runs';
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

// Every reference this lesson quotes, with the longest span it quotes of it.
// Written from the corpus, not from memory.
const PINNED = {
  'Romans 8:26': 'Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered',
  'Romans 8:27': 'he maketh intercession for the saints according to the will of God',
  'Romans 8:28': 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose',
  'Romans 8:29': 'For whom he did foreknow, he also did predestinate to be conformed to the image of his Son',
  'Colossians 1:16': 'For by him were all things created, that are in heaven, and that are in earth, visible and invisible',
  'Colossians 1:17': 'And he is before all things, and by him all things consist',
  'Hebrews 11:3': 'Through faith we understand that the worlds were framed by the word of God',
  'Ephesians 1:11': 'him who worketh all things after the counsel of his own will',
  '1 Corinthians 12:12': 'For as the body is one, and hath many members, and all the members of that one body, being many, are one body',
  '1 Corinthians 12:21': 'And the eye cannot say unto the hand, I have no need of thee',
  '1 Corinthians 12:25': 'That there should be no schism in the body; but that the members should have the same care one for another',
  '1 Corinthians 12:26': 'And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it',
  'Genesis 50:20': 'ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive',
  'Galatians 6:7': 'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap',
  'Galatians 6:8': 'For he that soweth to his flesh shall of the flesh reap corruption; but he that soweth to the Spirit shall of the Spirit reap life everlasting',
  'Deuteronomy 30:19': 'I have set before you life and death, blessing and cursing: therefore choose life, that both thou and thy seed may live',
  'Isaiah 1:19': 'If ye be willing and obedient, ye shall eat the good of the land',
  'Isaiah 1:20': 'But if ye refuse and rebel, ye shall be devoured with the sword: for the mouth of the LORD hath spoken it',
  'Jeremiah 6:16': 'Thus saith the LORD, Stand ye in the ways, and see, and ask for the old paths, where is the good way, and walk therein, and ye shall find rest for your souls. But they said, We will not walk therein',
  'John 14:6': 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me',
  'Acts 9:2': 'if he found any of this way, whether they were men or women',
  'Proverbs 20:24': 'Man’s goings are of the LORD; how can a man then understand his own way?',
  'Jeremiah 10:23': 'O LORD, I know that the way of man is not in himself: it is not in man that walketh to direct his steps',
  'Proverbs 16:9': 'A man’s heart deviseth his way: but the LORD directeth his steps',
  'Proverbs 19:21': 'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand',
  'Proverbs 3:5': 'Trust in the LORD with all thine heart; and lean not unto thine own understanding',
  'Proverbs 3:6': 'In all thy ways acknowledge him, and he shall direct thy paths',
  'Psalms 37:23': 'The steps of a good man are ordered by the LORD: and he delighteth in his way',
  'Isaiah 30:21': 'And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left',
  'Psalms 119:105': 'Thy word is a lamp unto my feet, and a light unto my path',
  'Lamentations 3:22': 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not',
  'Lamentations 3:23': 'They are new every morning: great is thy faithfulness',
  'Luke 9:23': 'If any man will come after me, let him deny himself, and take up his cross daily, and follow me',
  'Matthew 6:11': 'Give us this day our daily bread',
  'Matthew 6:34': 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself',
  'Matthew 10:29': 'Are not two sparrows sold for a farthing? and one of them shall not fall on the ground without your Father',
  'Matthew 10:30': 'But the very hairs of your head are all numbered',
  'Luke 12:7': 'Fear not therefore: ye are of more value than many sparrows',
  'Psalms 139:16': 'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written',
  'Isaiah 55:8': 'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD',
  'Isaiah 55:9': 'For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts',
  'Isaiah 55:11': 'So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall accomplish that which I please, and it shall prosper in the thing whereto I sent it',
  'Hebrews 12:11': 'Now no chastening for the present seemeth to be joyous, but grievous: nevertheless afterward it yieldeth the peaceable fruit of righteousness unto them which are exercised thereby',
  '2 Corinthians 4:17': 'For our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory',
  'James 1:2': 'count it all joy when ye fall into divers temptations',
  'James 1:3': 'Knowing this, that the trying of your faith worketh patience',
  'James 1:4': 'But let patience have her perfect work, that ye may be perfect and entire, wanting nothing',
  'Philippians 1:6': 'Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ',
  'Deuteronomy 6:7': 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend',
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
describe('L252 exists exactly once, at its own number, dated the day it was spoken', () => {
  it('is in the catalog exactly once', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 252 and only 252, and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 252)).toHaveLength(1);
    for (const n of [79, 211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });

  it('carries the spoken day, on or after L250’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-17');
    expect(LIVING_LESSONS_ADDED['ll250-they-which-do-hunger-shall-be-filled-and-the-critical-path'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('names Darrell as the one who spoke it, and carries his sentence and his sharpening', () => {
    expect(/spoken into this house by Darrell/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('all things work together, like integrated systems, for or against depending on the Will and Way');
    expect(L.lesson).toContain('we do not know our path, we know The Way, and He directs us daily');
    expect(L.lesson).toContain('He is into the details of all things');
  });
});

// (b) EVERY QUOTED VERSE IS THE CORPUS, BYTE FOR BYTE
describe('L252 — every verse it stands on is the corpus, verbatim', () => {
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
    expect(spans.length).toBeGreaterThan(200);
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

  it('uses the corpus apostrophe inside every quotation', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });

  it('marks no elision and recites no record id in reader prose', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them, and never uses the generic in our own voice', () => {
    for (const u of ['to them that love God', 'but God meant it unto good', 'the worlds were framed by the word of God']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
    for (const k of PLACE_KEYS) {
      const ours = ourProseOnly(PLACES[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
    }
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from it, DR-0734)', () => {
    const anchored = anchoredRefs(L);
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r)), 'a verse is taught but missing from anchor.ref').toEqual([]);
  });
});

// (c) THE THREE DIRECTIONS, ON THE MODULE AND ON EACH BAND SEPARATELY
describe('L252 — TALK ABOUT IT TOGETHER, in all three directions, in every place', () => {
  it('the lesson and every band send the reader all three ways in the lesson’s own words', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
  });

  it.each(PLACE_KEYS)('%s names TALK ABOUT IT TOGETHER and carries the skill and the rhythm', (k) => {
    const t = PLACES[k];
    expect(t).toContain('TALK ABOUT IT TOGETHER');
    expect(/listen (?:all the way )?to the (?:whole|end)/i.test(t) || /listen to the whole/i.test(t), `${k} drops the listening skill`).toBe(true);
    expect(/retell|tell it back|in your own words/i.test(t), `${k} drops the retelling skill`).toBe(true);
    expect(/teach (?:them|each other|one verse)/i.test(t), `${k} drops teaching one verse back`).toBe(true);
    expect(/once today/i.test(t), `${k} drops the daily rhythm`).toBe(true);
    expect(/one friend this week|friend this week/i.test(t), `${k} drops the one-friend-this-week rhythm`).toBe(true);
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line names that band while the pooled check still reads green', () => {
    const sentences = (s) => String(s).split(/(?<=[.!?])\s+/);
    const friendless = sentences(L.levels.teen)
      .filter((s) => missingDirections(s).includes('friends'))
      .join(' ');
    const mutated = { ...L, levels: { ...L.levels, teen: friendless } };
    expect(hasAllThree(mutated), 'pooled still reads whole — that is exactly the hazard (DR-0795)').toBe(true);
    expect(placesMissingDirections(mutated)).toEqual([{ place: 'teen', missing: ['friends'] }]);
  });
});

// (d) HIS THREE MOVES, IN HIS ORDER, IN ALL FIVE PLACES
describe('L252 — Darrell’s three moves, kept distinct and in his order, everywhere', () => {
  // The movement markers carry his order. ONE is "all things work together",
  // TWO is "like integrated systems", THREE is "for or against". A band may
  // say them in its own register but may not reorder his thought.
  const MARKERS = [
    'ONE. ALL THINGS WORK TOGETHER',
    'TWO. LIKE INTEGRATED SYSTEMS',
    'THREE. FOR OR AGAINST',
    'FOUR. THE WAY IS KNOWN',
    'FIVE. OUR OWN PATH IS NOT',
    'SIX. HE DIRECTS US DAILY',
    'SEVEN. HE IS INTO THE DETAILS OF ALL THINGS',
    'EIGHT. HIS WAYS ARE HIGHER',
    'NINE.',
    'TEN.',
  ];

  it.each(PLACE_KEYS)('%s carries all ten movements, in the same order', (k) => {
    const at = MARKERS.map((m) => PLACES[k].indexOf(m));
    expect(MARKERS.filter((m, i) => at[i] < 0), `${k} drops a movement`).toEqual([]);
    for (let i = 1; i < at.length; i += 1) {
      expect(at[i], `${k} has ${MARKERS[i]} out of order`).toBeGreaterThan(at[i - 1]);
    }
  });

  it.each(PLACE_KEYS)('%s carries his own three moves in his own words', (k) => {
    const t = PLACES[k];
    for (const phrase of ['all things work together', 'integrated system', 'for or against', 'directs us daily', 'into the details of all things']) {
      expect(t.includes(phrase), `${k} drops "${phrase}"`).toBe(true);
    }
  });

  it.each(PLACE_KEYS)('%s teaches the integration on a body, and both signs of the one system', (k) => {
    const t = PLACES[k];
    expect(t.includes('(1 Corinthians 12:26)'), `${k} drops the body’s coupling`).toBe(true);
    expect(t.includes('(Genesis 50:20)'), `${k} drops the two signs on one set of events`).toBe(true);
    expect(t.includes('(Galatians 6:7)'), `${k} drops the mechanism`).toBe(true);
    expect(t.includes('(Jeremiah 6:16)'), `${k} drops the verse that carries both signs at once`).toBe(true);
  });

  it('the adult lesson keeps Romans 8:28 inside its own paragraph: the Spirit before it, the purpose after it', () => {
    const i26 = L.lesson.indexOf('(Romans 8:26)');
    const i28 = L.lesson.indexOf('(Romans 8:28)');
    const i29 = L.lesson.indexOf('(Romans 8:29)');
    expect(i28).toBeGreaterThan(-1);
    expect(i26).toBeGreaterThan(i28); // 8:26-27 taught within movement ONE, after the promise is set down
    expect(i29).toBeGreaterThan(i26);
  });

  it.each(PLACE_KEYS)('%s carries the Spirit’s intercession and the purpose, not the promise alone', (k) => {
    expect(PLACES[k].includes('(Romans 8:26)'), `${k} drops Romans 8:26`).toBe(true);
    expect(PLACES[k].includes('(Romans 8:29)'), `${k} drops Romans 8:29`).toBe(true);
  });
});

// (e) THE PROMISE IS NEVER PRINTED WITHOUT WHO IT IS FOR
describe('L252 — Romans 8:28 is never quoted without its condition', () => {
  const PROMISE = 'all things work together for good';
  const CONDITION = 'to them that love God';

  const strippedPlaces = (module) => {
    const out = [];
    const places = { lesson: module.lesson, ...Object.fromEntries(BANDS.map((b) => [b, module.levels[b]])) };
    for (const [place, text] of Object.entries(places)) {
      for (const m of String(text || '').matchAll(/"([^"]*)"/g)) {
        if (m[1].includes(PROMISE) && !m[1].includes(CONDITION)) out.push(place);
      }
    }
    return [...new Set(out)];
  };

  it('every place quotes the promise at least once', () => {
    for (const k of PLACE_KEYS) {
      expect(PLACES[k].includes(PROMISE), `${k} never quotes the promise`).toBe(true);
    }
  });

  it('no quoted span anywhere carries the promise without the condition', () => {
    expect(strippedPlaces(L)).toEqual([]);
    // and the whole module, not only the reader places
    const bad = [];
    for (const s of spansOf(L)) {
      if (s.quoted.includes(PROMISE) && !s.quoted.includes(CONDITION)) bad.push(s.path);
    }
    expect(bad, 'a span prints the promise stripped of who it is for').toEqual([]);
  });

  it('PROVEN TO CATCH: dropping the condition from one place names that place', () => {
    const FULL = `${PROMISE} ${CONDITION}, to them who are the called according to his purpose`;
    // A mutation whose anchor is absent did not mutate and proves nothing.
    expect(L.levels.youth.includes(FULL), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, levels: { ...L.levels, youth: L.levels.youth.split(FULL).join(PROMISE) } };
    expect(mutated.levels.youth).not.toBe(L.levels.youth);
    expect(mutated.levels.youth.includes(PROMISE), 'the promise is still printed').toBe(true);
    expect(strippedPlaces(mutated)).toEqual(['youth']);
  });
});

// (f) THE KNOWN AND THE UNKNOWN TRAVEL TOGETHER
describe('L252 — "The Way is known" and "our own path is not" travel together', () => {
  const KNOWN = 'The Way is known';
  const NOT_OURS = 'our own path is not';

  /** Places that say the path is not ours WITHOUT also saying The Way is known. */
  const unpaired = (module) => {
    const places = { lesson: module.lesson, ...Object.fromEntries(BANDS.map((b) => [b, module.levels[b]])) };
    return Object.entries(places)
      .filter(([, t]) => String(t || '').includes(NOT_OURS) && !String(t || '').includes(KNOWN))
      .map(([place]) => place);
  };

  it.each(PLACE_KEYS)('%s carries both halves of the distinction', (k) => {
    expect(PLACES[k].includes(KNOWN), `${k} drops the known half`).toBe(true);
    expect(PLACES[k].includes(NOT_OURS), `${k} drops the unknown half`).toBe(true);
    expect(PLACES[k].includes('(John 14:6)'), `${k} drops the Way as a Person`).toBe(true);
    expect(PLACES[k].includes('(Proverbs 20:24)'), `${k} drops the path that is not ours to understand`).toBe(true);
  });

  it('no place hands the reader the "you cannot know" half alone', () => {
    expect(unpaired(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: deleting the known half from one band names that band', () => {
    expect(L.levels.senior.includes(KNOWN), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, levels: { ...L.levels, senior: L.levels.senior.split(KNOWN).join('the route is given') } };
    expect(mutated.levels.senior).not.toBe(L.levels.senior);
    expect(unpaired(mutated)).toEqual(['senior']);
  });

  it('the lesson keeps He-directs-daily at the size of a day, with the lamp said explicitly', () => {
    for (const k of PLACE_KEYS) {
      expect(PLACES[k].includes('(Psalms 119:105)'), `${k} drops the lamp`).toBe(true);
      expect(/next (?:step|bit)/i.test(PLACES[k]), `${k} never says the lamp shows the next step`).toBe(true);
      expect(PLACES[k].includes('(Matthew 6:11)'), `${k} drops this day’s bread`).toBe(true);
      expect(PLACES[k].includes('(Matthew 10:29)'), `${k} drops the sparrow`).toBe(true);
    }
  });

  it('does not turn Romans 8:28 into a promise that everything feels good, and quotes the hard half honestly', () => {
    expect(L.lesson).toContain('This is not a promise that everything will feel good');
    expect(L.lesson.includes('(Hebrews 12:11)')).toBe(true);
    expect(L.lesson.includes('(Isaiah 1:20)')).toBe(true);
    expect(/never as a club to frighten anyone with/.test(L.lesson), 'the against branch must be taught, not weaponised').toBe(true);
  });

  it('closes on the One who finishes what He began', () => {
    for (const k of PLACE_KEYS) expect(PLACES[k].includes('(Philippians 1:6)'), `${k} drops the finish`).toBe(true);
  });
});

// (g) FOUR BANDS, EACH CARRYING THE WHOLE MESSAGE (P60)
describe('L252 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);

  it.each(BANDS)('%s clears its floor share of the adult lesson’s prose', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, youth: L.levels.youth.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('youth');
  });

  it('every band names its own lesson near its start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });

  it('the reading ladder ascends and the child band sits under the new-lesson ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(PLACES[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });

  it('the child band teaches integrated systems in a child’s own words, without losing it', () => {
    const t = L.levels.child;
    expect(/stub your toe/.test(t), 'the body, felt').toBe(true);
    expect(/bike|pedal/.test(t), 'the bicycle').toBe(true);
    expect(/kitchen at dinner/.test(t), 'the kitchen where every job touches the others').toBe(true);
  });
});

// (h) TWO STORIES, A WORKING QUIZ, AND NO DOUBLE-QUOTED SPAN IN A STORY
describe('L252 — two stories that teach this lesson, and a quiz that works', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });

  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the same wheel, turned the other way: one system, two signs
    expect(/it was the same wheel/.test(light.body)).toBe(true);
    // the harvest matched the sowing, and the next few feet were always enough
    expect(/only the next few feet of it/.test(solemn.body)).toBe(true);
  });

  it('the quiz answers are not all in one position and every answer resolves', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });

  it('the facilitator notes name the guard rails this lesson needs', () => {
    const notes = `${L.facilitator.howToRun}\n${L.facilitator.talkingPoints.join('\n')}`;
    expect(/do not let the against branch be used to frighten anyone/i.test(notes)).toBe(true);
    expect(/promise that everything will feel good/i.test(notes)).toBe(true);
  });
});
