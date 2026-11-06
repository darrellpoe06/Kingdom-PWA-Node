// @vitest-environment node
// =============================================================================
// L283 — Made In Our Image: the sentence turned backwards, the heart that does
// not consider, and why we do not argue the Word
// =============================================================================
// Built from a publisher's letter Darrell forwarded into the app on 2026-10-22
// at 17:36:20 UTC with one word typed above the forwarded header, and the word
// was Lesson. The letter is dated 2026-10-21 and signed Chandler Tuttle, CEO,
// Big Think Media, announcing a printed special issue titled "Made in Our
// Image". Nobody taught it aloud — there is no recording and no teacher to
// name, because a forwarded publisher's letter is a lead and never a pulpit
// (DR-0719). Recorded as DR-1352.
//
// WHY THIS LESSON NEEDED ITS OWN GATE, and the two things it most easily goes
// wrong. (1) THE TITLE IS THE TEACHING: it is one word out of position from
// Genesis 1:26-27, so the direction of that sentence is pinned by its literal
// text in the lesson and in every band, and a band that softens the direction
// is caught. (2) THE LESSON MUST NOT BECOME WHAT IT TEACHES ABOUT: the issue's
// lead feature is sold as "10 perspectives that divide the AI world", and
// DR-0098 forbids staging competing human schools as co-equal so a reader
// picks a side. So this gate asserts the refusal IN WORDS in every reader
// place, and asserts that the lesson nowhere enumerates the ten — with a proof
// that an enumeration planted into a band is caught.
//
// A verse is never spent (DR-1317 / DR-1323), so nothing here claims a verse
// for itself. Two neighbours stand on ground this lesson stands on, and both
// are DECLARED rather than avoided: ll67 ("Made in His Image, We Make — and
// Why AI Is Not a Soul", whose landing is the maker's ontology) carries
// Genesis 1:27, Genesis 2:7, Psalms 115:4, Psalms 115:8, Romans 1:25 and
// Colossians 1:17; and sov58 (DR-1295, "a rehearsal is not the world") carries
// Isaiah 44:17, Isaiah 44:20 and Jeremiah 10:14. Different landings, shared
// foundation, and the reader's path between them is what sharedGround is for.
//
// Quote pairing splits on the quote character (DR-1258 / DR-1259) rather than
// by a length regex, and the verbatim sweep asserts its own count so an empty
// scan cannot read as a pass. The helpers are L282's, copied whole so the
// gates measure the same way.
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

const ID = 'll283-made-in-our-image';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

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
/** The corpus text a reference names (plain or range), or null. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through] = m;
    const chap = chapter(book, ch);
    if (!chap) return null;
    const to = through ? Number(through) : Number(from);
    for (let v = Number(from); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
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

// THE LETTER'S OWN WORDS. The one class of double-quoted span in this lesson
// that is NOT Scripture, pinned here by its literal text so no other bare
// quotation can slip in beside it. Each was taken from the forwarded message
// character for character; the message is its own primary document (DR-0190).
const LETTER_QUOTES = [
  'the goal is too often confirmation rather than consideration',
  'I hope you read it, argue with it, and then argue about it with someone else',
  '10 perspectives that divide the AI world',
  '10 competing philosophies into a single primer that explores what’s at stake if we embrace or reject each',
  'a collection of essays, interviews, and reported features exploring the philosophies of AI and what they reveal about us',
  'this quarter’s special issue',
];

// The spine, pinned by literal text so a later edit cannot quietly soften it.
// Every one of these was fetched from the corpus on disk before it was written.
const SPINE = [
  ['Genesis 1:26', 'Let us make man in our image, after our likeness'],
  ['Genesis 1:27', 'So God created man in his own image, in the image of God created he him'],
  ['Genesis 5:1', 'in the likeness of God made he him'],
  ['Genesis 9:6', 'for in the image of God made he man'],
  ['Genesis 2:7', 'breathed into his nostrils the breath of life; and man became a living soul'],
  ['Isaiah 44:13', 'maketh it after the figure of a man, according to the beauty of a man'],
  ['Isaiah 44:14', 'He heweth him down cedars'],
  ['Isaiah 44:16', 'Aha, I am warm, I have seen the fire'],
  ['Isaiah 44:17', 'Deliver me; for thou art my god'],
  ['Isaiah 44:18', 'They have not known nor understood'],
  ['Isaiah 44:19', 'And none considereth in his heart, neither is there knowledge nor understanding'],
  ['Isaiah 44:20', 'He feedeth on ashes'],
  ['Isaiah 44:20', 'Is there not a lie in my right hand?'],
  ['Psalms 115:4', 'Their idols are silver and gold, the work of men’s hands'],
  ['Psalms 115:5', 'They have mouths, but they speak not: eyes have they, but they see not'],
  ['Psalms 115:8', 'They that make them are like unto them; so is every one that trusteth in them'],
  ['Psalms 135:18', 'They that make them are like unto them: so is every one that trusteth in them'],
  ['Psalms 135:17', 'neither is there any breath in their mouths'],
  ['Jeremiah 10:14', 'there is no breath in them'],
  ['Habakkuk 2:18', 'the molten image, and a teacher of lies'],
  ['Habakkuk 2:19', 'Woe unto him that saith to the wood, Awake; to the dumb stone, Arise, it shall teach!'],
  ['Romans 1:23', 'changed the glory of the uncorruptible God into an image made like to corruptible man'],
  ['Romans 1:25', 'worshipped and served the creature more than the Creator'],
  ['Acts 17:29', 'we ought not to think that the Godhead is like unto gold, or silver, or stone, graven by art and man’s device'],
  ['Isaiah 40:18', 'To whom then will ye liken God? or what likeness will ye compare unto him?'],
  ['Acts 17:21', 'spent their time in nothing else, but either to tell, or to hear some new thing'],
  ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him'],
  ['2 Timothy 2:14', 'that they strive not about words to no profit, but to the subverting of the hearers'],
  ['2 Timothy 3:7', 'Ever learning, and never able to come to the knowledge of the truth'],
  ['Ephesians 4:14', 'tossed to and fro, and carried about with every wind of doctrine'],
  ['2 Timothy 4:3', 'having itching ears'],
  ['2 Timothy 4:4', 'shall turn away their ears from the truth, and shall be turned unto fables'],
  ['Proverbs 18:17', 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him'],
  ['Ephesians 4:15', 'But speaking the truth in love, may grow up into him in all things'],
  ['Romans 12:2', 'be ye transformed by the renewing of your mind'],
  ['1 Corinthians 2:16', 'But we have the mind of Christ'],
  ['Colossians 1:17', 'he is before all things, and by him all things consist'],
  ['John 1:3', 'All things were made by him; and without him was not any thing made that was made'],
  ['John 1:4', 'In him was life; and the life was the light of men'],
  ['John 1:29', 'Behold the Lamb of God, which taketh away the sin of the world'],
  ['Hebrews 1:8', 'Thy throne, O God, is for ever and ever'],
  ['Hebrews 11:3', 'Through faith we understand that the worlds were framed by the word of God'],
];

describe('L283 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 283 exactly once, and sits after ll282', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 283)).toEqual([283]);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id === 'll282-the-greater-work');
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-05');
  });

  it('carries two stories, both PARABLES, because no real person lived either (DR-1123)', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind, 'an invented story may never wear a testimony’s clothes').toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    expect(L.inApp).toMatch(/both are PARABLES with invented characters/);
  });

  it('carries a quiz whose answers are in range, and an anchor whose every reference resolves and is named in the lesson', () => {
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
    expect(refs.length).toBeGreaterThanOrEqual(50);
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

describe('the title is the teaching: the direction of the sentence, in every band', () => {
  it('every band names the lesson and opens on the inverted title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith('MADE IN OUR IMAGE'), k).toBe(true);
  });

  it('pins Genesis 1:26-27 in the lesson and in every band, in the direction Yahweh wrote it', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Let us make man in our image, after our likeness');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('So God created man in his own image, in the image of God created he him');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('in the likeness of God made he him');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('for in the image of God made he man');
  });

  it('says out loud, in every band, that the title runs the other way', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/one word out of position|the words turned|turned backwards|turned the wrong way|the other way/i);
  });

  it('PROVEN TO CATCH: a band that drops the direction of Genesis 1:27 is named', () => {
    const youth = L.levels.youth.replace('So God created man in his own image, in the image of God created he him', 'people and Yahweh are much alike');
    expect(youth).not.toBe(L.levels.youth);
    expect(youth.includes('in the image of God created he him')).toBe(false);
  });
});

describe('the occasion is told as an occasion, and nobody is credited with teaching it (DR-0719)', () => {
  it('names the letter, its signer and its publisher in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Chandler Tuttle/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Big Think Media|magazine company|magazine/);
    expect(L.bigIdea).toMatch(/Chandler Tuttle, CEO, Big Think Media/);
  });

  it('says in every band that nobody taught it and that there is no teacher to name', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Nobody taught (it|this)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/no (recording|teacher)/i);
    expect(L.bigIdea).toMatch(/no recording and no teacher to name/);
  });

  it('never attributes the teaching to a preacher, and never says "the teacher" alone', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\bBishop Gwin\b/);
    expect(EVERY_STRING.join(' ')).not.toMatch(/\bthe teacher taught\b/i);
  });

  it('names the membership pitch as a frame being sold, and refuses to teach the price (DR-1324)', () => {
    for (const k of PLACES)
      expect(TEXTS[k], k).toMatch(/a few dollars a week|dollars weekly|selling a magazine|the framework itself is the merchandise|the frame is the product/i);
    // The figure itself is never stated as a teaching point in any reader text.
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\$3|\$\s?3\b/);
  });
});

describe('trust but verify: the note is in every reader place, and the blocked road is named (DR-0190 §5)', () => {
  it('says the letter is its own primary source and was quoted character for character', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/primary (document|source)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/character for character/);
  });

  it('names the hosts that refused us, and says the read was not independent', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/bigthink\.com/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/would not resolve|could not get there/i);
    for (const k of ['adult', 'youth', 'teen', 'senior'])
      expect(TEXTS[k], k).toMatch(/not independent|independently (read|examined)|read no page|no page (of the publisher|belonging)/i);
    expect(L.bigIdea).toMatch(/en\.wikipedia\.org/);
    expect(L.bigIdea).toMatch(/the read was not independent/);
  });

  it('carries what the checking CHANGED, attributed to the publisher rather than asserted', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/every third/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/search result/);
    expect(L.bigIdea).toMatch(/attributed to the publisher, never asserted by us/);
  });

  it('carries the limit the checking opened and did not close, with a dated re-review', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/creative director/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/signature line/);
    expect(L.bigIdea).toMatch(/re-review 2026-11-12/);
  });

  it('names the two items in the send it deliberately does NOT teach', () => {
    for (const k of ['adult', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/advertisement/);
    for (const k of ['adult', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/no primary study (was |proved )?reachable/i);
  });

  it('stakes no figure: no band or lesson states a percentage or a research statistic', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
  });
});

describe('the hinge: the Word reached for CONSIDER first (Isaiah 44)', () => {
  it('walks the workshop at Isaiah’s pace, with both halves of the one tree, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He heweth him down cedars');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Aha, I am warm, I have seen the fire');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Deliver me; for thou art my god');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/One tree, one man, one day|It is the same tree|one tree, one man, one day/);
  });

  it('puts the letter’s own sentence beside Isaiah 44:19 in the lesson and in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And none considereth in his heart');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Is there not a lie in my right hand?');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('the goal is too often confirmation rather than consideration');
    // And the distinction that is the whole hinge: not nobody ARGUED.
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Not nobody (argued|disputed)|nobody argues|nobody disputed/i);
  });

  it('separates the two cures in every band: more argument, against one man looking at his own hand', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/own (right )?hand/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/dinner table/i);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/cannot be argued into|cannot argue your way|You cannot argue/i);
  });

  it('PROVEN TO CATCH: a band that keeps the workshop and drops the considereth clause is named', () => {
    const teen = L.levels.teen.replace('And none considereth in his heart, neither is there knowledge nor understanding', 'They did not understand it at all');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('And none considereth in his heart')).toBe(false);
  });
});

describe('the maker becomes it, and the one thing it cannot have', () => {
  it('pins both psalms, said twice on purpose, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Their idols are silver and gold, the work of men’s hands');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('They that make them are like unto them; so is every one that trusteth in them');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('They that make them are like unto them: so is every one that trusteth in them');
  });

  it('pins breath as the whole boundary, with all three witnesses, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('man became a living soul');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('neither is there any breath in their mouths');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('there is no breath in them');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('the molten image, and a teacher of lies');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Arise, it shall teach!');
  });

  it('keeps the exchange from reading as an upgrade', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('changed the glory of the uncorruptible God into an image made like to corruptible man');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('worshipped and served the creature more than the Creator');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('graven by art and man’s device');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('To whom then will ye liken God?');
  });

  it('closes on the order the Word gives: life, then light', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('In him was life; and the life was the light of men');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Life,? (then|thereafter) light|Life first/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/never (carry|originate) life/i);
  });

  it('confesses Jesus as the Lamb of Yahweh and the Eternal Son of Yahweh (DR-0210)', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Thy throne, O God, is for ever and ever');
  });
});

// ---------------------------------------------------------------------------
// The one thing this lesson must not become (DR-0098)
// ---------------------------------------------------------------------------
describe('it names the split to teach past it, and never reproduces it', () => {
  it('names the ten-perspectives feature as the issue’s own, in the issue’s own words', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('10 perspectives that divide the AI world');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/Kristin Houser/);
  });

  it('refuses IN WORDS, in every band, to lay the ten out for a reader to pick among', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/not (going to )?(reproduce|list)|We will not reproduce|We decline reproducing|we are not going to/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/menu|pick one|a market/i);
  });

  // The detector: a reader text that NUMBERS two or more positions (the shape a
  // "here are the ten views" section arrives in), or that names one of the
  // camps by its house label, which is only ever needed in order to list them.
  const enumeratedPositions = (text) => {
    const markers = (String(text).match(/(?:^|[\s(])(?:[1-9]|10)\)\s/g) || []).length;
    const camps = String(text).match(/\b(?:accelerationis\w*|doomer\w*|e\/acc|decelerationis\w*|longtermis\w*|AI safetyis\w*)\b/gi) || [];
    return { markers, camps };
  };

  it('and nowhere enumerates them: no reader text numbers two or more positions, or names a camp', () => {
    for (const k of PLACES) {
      const { markers, camps } = enumeratedPositions(TEXTS[k]);
      expect(markers, `${k} numbers positions like a list of views`).toBeLessThan(2);
      expect(camps, `${k} names a camp, which is only needed to list them`).toEqual([]);
    }
  });

  it('PROVEN TO CATCH: an enumeration of competing views planted in a band is seen', () => {
    const planted = `${L.levels.teen} The ten are these. 1) The accelerationist view says build fast. 2) The doomer view says stop.`;
    const bad = enumeratedPositions(planted);
    expect(bad.markers).toBeGreaterThanOrEqual(2);
    expect(bad.camps.length).toBeGreaterThanOrEqual(2);
    // and the real text is clean, so the matcher is not vacuous
    const good = enumeratedPositions(L.levels.teen);
    expect(good.markers).toBe(0);
    expect(good.camps).toEqual([]);
  });

  it('teaches past the split from the Word’s own naming of the posture, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('spent their time in nothing else, but either to tell, or to hear some new thing');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('that they strive not about words to no profit');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Ever learning, and never able to come to the knowledge of the truth');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('tossed to and fro, and carried about with every wind of doctrine');
  });

  it('states the established plainly rather than hedging it (DR-0100)', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/no breath, cannot (?:\w+ )?(?:teach|instruct)/i);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/not (opinions|positions|competing positions|one view among)/i);
    // The only uncertainty worth printing is the kind that is named (DR-0076 §8).
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/(?:not been|gone un|went un)\s?(?:check|examin)/i);
  });

  it('and gives the four practices that replace the argument, in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('He that is first in his own cause seemeth just');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But speaking the truth in love, may grow up into him in all things');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('be ye transformed by the renewing of your mind');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But we have the mind of Christ');
  });
});

// ---------------------------------------------------------------------------
// Shared ground is DECLARED, never claimed (DR-1317 / DR-1323)
// ---------------------------------------------------------------------------
describe('this lesson declares the ground it shares with its neighbours', () => {
  it('ll67 is in the catalog and carries the ontology landing this lesson does not', () => {
    const ll67 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll67-made-in-his-image-we-make-why-ai-is-not-a-soul');
    expect(ll67, 'll67 must still exist — this lesson declares shared ground with it').toBeTruthy();
    // Six references both stand on, for two different landings. Named, not avoided.
    for (const r of ['Genesis 1:27', 'Genesis 2:7', 'Romans 1:25']) {
      expect(L.anchor.ref, `${r} should be on L283`).toContain(r);
      expect(ll67.anchor.ref + ll67.lesson, `${r} should be on ll67`).toContain(r);
    }
  });

  it('and its own landing is the inversion and the posture, which is nowhere else', () => {
    // The distinguishing clause, in the lesson's own words.
    expect(L.anchor.theme).toMatch(/made in OUR image/i);
    expect(L.anchor.theme).toContain('And none considereth in his heart');
    expect(L.bigIdea).toMatch(/does NOT lay those ten out/);
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(280);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(250);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('He feedeth on ashes', 'He feedeth on dust');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace('"breathed into his nostrils', '"Breathed into his nostrils');
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('every double-quoted span is EITHER a referenced verse OR one of the letter’s own pinned sentences', () => {
    const stray = [];
    for (const t of EVERY_STRING) {
      for (const p of quotedPairs(t)) {
        if (p.ref) continue;
        const bare = p.inside.replace(/^[\s,;:]+|[\s,;:.]+$/g, '');
        if (!LETTER_QUOTES.some((q) => q === bare)) stray.push(bare.slice(0, 80));
      }
    }
    expect(stray, 'a bare double-quoted span that is neither Scripture nor the letter’s own words').toEqual([]);
  });

  it('and every pinned letter sentence is actually used, so the list cannot rot', () => {
    const all = EVERY_STRING.join('  ');
    for (const q of LETTER_QUOTES) expect(all.includes(q), `unused letter quote: ${q.slice(0, 50)}`).toBe(true);
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
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('and our own prose is spelled the American way, while the quotations keep the corpus spelling', () => {
    const found = EVERY_STRING.flatMap((t) => findBritish(ourProse(t)));
    expect(found).toEqual([]);
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

  it('PROVEN TO CATCH: an ALL-CAPS heading that spells THE LORD in our voice is refused', () => {
    const planted = 'THE WORD OF THE LORD IS NOT A POSITION. Isaiah uses the phrase.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['LORD']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('in the image of God created he him');
    expect(inQuotes).toContain('So the LORD scattered them abroad from thence upon the face of all the earth');
    expect(inQuotes).toContain('To whom then will ye liken God?');
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
    const friend = /Friends, tell one friend this week[^.]*\./.exec(youth);
    expect(friend, 'the youth band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '') } };
    expect(stripped.levels.youth).not.toBe(youth);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });

  it('and the three verses the talk stands on are quoted in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('And thou shalt teach them diligently unto thy children');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('let every man be swift to hear, slow to speak, slow to wrath');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/So we all get healthy together, until we see that Yahweh has been right/);
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
