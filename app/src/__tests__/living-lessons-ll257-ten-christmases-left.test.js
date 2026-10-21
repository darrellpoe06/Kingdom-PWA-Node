// @vitest-environment node
// =============================================================================
// L257 — "Ten Christmases Left": the teaching the Word gives to a RECORDED
// STREET INTERVIEW that Darrell captured inside the PoeTech app on 2026-10-21.
// The words reached us as a Whisper transcript. DR-1159.
// =============================================================================
// WHAT THE SOURCE IS, and the honesty it demands:
//
// 1. THE SPEAKERS ARE NOT IDENTIFIED. The transcript marks the interviewer S1
//    and the man answering S2/S3 — two labels, one man, split by the
//    transcriber. It names the interviewer "James" exactly once and never
//    names the man answering. There are no voice:BG / voice:DP tags (DR-0712),
//    so this is NOT Darrell teaching and NOT Bishop Gwin teaching (DR-0719).
//    This gate pins the provenance paragraph that says so, and pins that the
//    lesson never asserts a voice.
// 2. EVERY FIGURE IS HIS OWN CLAIM AND THE LESSON ASSERTS NONE OF THEM —
//    thirty-five software companies, a $670M exit, 26 million followers, the
//    age of 67, ten Christmases, the Gulf War in 1991. Nobody here checked one
//    of them, and the lesson says that sentence out loud. The dollar/company/
//    follower figures are pinned ABSENT from every age band.
// 3. THE CLIP CARRIES ADVERTISING — a company plug and a "comment the word
//    plan below" call to action. It is named as advertising, used for nothing,
//    and pinned ABSENT FROM EVERY AGE BAND by the tests below.
// 4. THE TRANSCRIBER MIS-HEARD SEVERAL SPANS ("I've been eating 60
//    billionaires" for interviewing; "LLCs and escorts"; "Which one do you
//    think we made?"). DR-0331 licenses rendering DARRELL'S OWN words for
//    meaning and explicitly does NOT cover a third party's words, which these
//    are. So they are quoted AS THEY STAND, marked as uncertain transcription,
//    and NO teaching rests on a garbled span — pinned below.
// 5. TWO APOSTROPHES, ON PURPOSE. The corpus writes U+2019; the transcript is
//    pure ASCII. So every SCRIPTURE span must carry the corpus apostrophe and
//    every SPOKEN span keeps the straight one it was transcribed with. Both are
//    asserted, because tidying either direction would be a lie about a source.
//
// THE DR-0331 §Consequences MECHANISM (worked example:
// living-lessons-l128-verses.test.js): every spoken span rides an explicit
// NOT_SCRIPTURE allowlist, and this gate asserts that allowlist is HONEST (no
// entry is secretly Scripture) and NOT A DUMPING GROUND (every entry appears in
// the lesson).
//
// EVERY VERSE WAS FETCHED FROM app/public/bible/kjv BEFORE A SENTENCE WAS
// WRITTEN, never from memory (DR-0076). The NAS lesson builder failed this very
// row twice, once on a not-the-verse Psalms 39:4 — whose corpus text carries a
// COLON ("what it is: that I may know how frail I am"), pinned below — and once
// on TALK ABOUT IT TOGETHER missing from bands. Both are gated here.
//
// PROVEN TO CATCH (DR-0076 §3): the in-file mutation cases each assert their
// anchor exists before mutating; DR-1159 records the live-file mutation run.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections, hasAllThree, missingDirections } from '../lib/talk-together.js';

const ID = 'll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them';
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** The verse exactly as the corpus on disk has it. No normalisation of marks. */
function corpusVerse(book, ch, n) {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
}

/** The whole corpus as one normalised string, for the allowlist honesty check. */
let WHOLE = null;
function wholeKjv() {
  if (WHOLE) return WHOLE;
  const buf = [];
  for (const f of readdirSync(KJV)) {
    if (!f.endsWith('.json') || f === 'index.json') continue;
    const d = JSON.parse(readFileSync(join(KJV, f), 'utf8'));
    if (!Array.isArray(d.chapters)) continue;
    for (const ch of d.chapters) buf.push(ch.join(' '));
  }
  WHOLE = norm(buf.join(' '));
  return WHOLE;
}

const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
// The five places a reader actually reads. A reader reads ONE of them.
const PLACES = L ? { lesson: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACE_KEYS = Object.keys(PLACES);
const whole = PLACE_KEYS.map((k) => PLACES[k]).join('\n');

// EVERY SPAN SPOKEN ON THE RECORDING THAT THIS LESSON QUOTES. A third party's
// words, kept exactly as transcribed (DR-0331 does not reach them). Verified
// against the transcript before this gate was written.
const NOT_SCRIPTURE = [
  'Life is very short.',
  'at my age, I probably only had 10 Christmases left',
  'What did combat teach you about life?',
  'I grew up with nothing.',
  "I look at my life now and say, oh Lord, I don't deserve this.",
  'Imagine a farm at the end of a dirt road with no electricity, no indoor plumbing.',
  'You make your money when you exit.',
  'However, invest in the AI capability to serve all other industries.',
  "That's a way to get rich.",
  'You have amazing advice, my friend.',
  'On a scale of 1 to 100, how confident are you that God is real?',
  'The Bible says that every knee shall bow and every tongue shall confess that Jesus Christ is Lord.',
  'Whether or not you accepted him, you will eventually confess.',
  // Advertising. Named as advertising, used for nothing, absent from every band.
  'If people want access, all they have to do is just comment the word plan below.',
  // Uncertain transcription. Quoted as they stand; no teaching rests on them.
  "I've been eating 60 billionaires in the last five years.",
  'So they help people start LLCs and escorts.',
  'Which one do you think we made?',
];

// The three spans the transcriber mis-heard. No teaching may rest on these.
const GARBLED = [
  "I've been eating 60 billionaires in the last five years.",
  'So they help people start LLCs and escorts.',
  'Which one do you think we made?',
];

// The advertising in the clip: the call to action and the company it plugs.
const ADVERTISING = [
  'If people want access, all they have to do is just comment the word plan below.',
  'Bizzy',
];

// Every reference this lesson quotes, with the longest span it quotes of it.
// Copied from the corpus on disk, not from memory.
const PINNED = {
  'Psalms 90:12': 'So teach us to number our days, that we may apply our hearts unto wisdom.',
  // THE VERSE THE NAS BUILDER GOT WRONG TWICE. The corpus writes a COLON here.
  'Psalms 39:4': 'LORD, make me to know mine end, and the measure of my days, what it is: that I may know how frail I am.',
  'Psalms 39:5': 'Behold, thou hast made my days as an handbreadth; and mine age is as nothing before thee',
  'Psalms 39:6': 'he heapeth up riches, and knoweth not who shall gather them',
  'Job 14:5': 'Seeing his days are determined, the number of his months are with thee, thou hast appointed his bounds that he cannot pass;',
  'Matthew 24:36': 'But of that day and hour knoweth no man',
  'James 4:14': 'For what is your life? It is even a vapour, that appeareth for a little time, and then vanisheth away.',
  'James 4:13': 'Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain:',
  'James 4:15': 'For that ye ought to say, If the Lord will, we shall live, and do this, or that.',
  'Psalms 103:15': 'As for man, his days are as grass: as a flower of the field, so he flourisheth.',
  'Psalms 103:16': 'For the wind passeth over it, and it is gone; and the place thereof shall know it no more.',
  'Psalms 103:2': 'Bless the LORD, O my soul, and forget not all his benefits:',
  'Isaiah 40:6': 'All flesh is grass, and all the goodliness thereof is as the flower of the field',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  '1 Peter 1:24': 'For all flesh is as grass, and all the glory of man as the flower of grass',
  '1 Peter 1:25': 'But the word of the Lord endureth for ever',
  'Luke 12:15': 'And he said unto them, Take heed, and beware of covetousness: for a man’s life consisteth not in the abundance of the things which he possesseth.',
  'Luke 12:16': 'And he spake a parable unto them, saying, The ground of a certain rich man brought forth plentifully:',
  'Luke 12:17': 'And he thought within himself, saying, What shall I do, because I have no room where to bestow my fruits?',
  'Luke 12:18': 'And he said, This will I do: I will pull down my barns, and build greater; and there will I bestow all my fruits and my goods.',
  'Luke 12:19': 'Soul, thou hast much goods laid up for many years',
  'Luke 12:20': 'Thou fool, this night thy soul shall be required of thee',
  'Luke 12:21': 'So is he that layeth up treasure for himself, and is not rich toward God.',
  'Ecclesiastes 7:2': 'It is better to go to the house of mourning, than to go to the house of feasting: for that is the end of all men; and the living will lay it to his heart.',
  'Ecclesiastes 5:10': 'He that loveth silver shall not be satisfied with silver; nor he that loveth abundance with increase: this is also vanity.',
  'Ephesians 2:8': 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:',
  'Ephesians 2:9': 'Not of works, lest any man should boast.',
  'Titus 3:5': 'but according to his mercy he saved us',
  'Deuteronomy 8:17': 'And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth.',
  'Deuteronomy 8:18': 'for it is he that giveth thee power to get wealth',
  '1 Corinthians 4:7': 'and what hast thou that thou didst not receive?',
  'James 1:17': 'Every good gift and every perfect gift is from above',
  'Proverbs 10:22': 'The blessing of the LORD, it maketh rich, and he addeth no sorrow with it.',
  '1 Timothy 6:17': 'that they be not highminded, nor trust in uncertain riches, but in the living God',
  '1 Timothy 6:18': 'That they do good, that they be rich in good works, ready to distribute, willing to communicate;',
  '1 Timothy 6:19': 'Laying up in store for themselves a good foundation against the time to come',
  '1 Timothy 6:7': 'For we brought nothing into this world, and it is certain we can carry nothing out.',
  '1 Timothy 6:6': 'But godliness with contentment is great gain.',
  '1 Timothy 6:10': 'For the love of money is the root of all evil',
  'Matthew 6:19': 'Lay not up for yourselves treasures upon earth, where moth and rust doth corrupt, and where thieves break through and steal:',
  'Matthew 6:20': 'But lay up for yourselves treasures in heaven',
  'Matthew 6:21': 'For where your treasure is, there will your heart be also.',
  'Proverbs 11:28': 'He that trusteth in his riches shall fall; but the righteous shall flourish as a branch.',
  'Proverbs 23:4': 'Labour not to be rich: cease from thine own wisdom.',
  'Proverbs 23:5': 'riches certainly make themselves wings; they fly away as an eagle toward heaven',
  'Mark 8:36': 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?',
  'John 14:6': 'I am the way, the truth, and the life',
  'Proverbs 14:12': 'There is a way which seemeth right unto a man, but the end thereof are the ways of death.',
  'Jeremiah 6:16': 'Stand ye in the ways, and see, and ask for the old paths, where is the good way, and walk therein, and ye shall find rest for your souls. But they said, We will not walk therein.',
  'Proverbs 19:21': 'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand.',
  'Proverbs 3:5': 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Proverbs 3:6': 'In all thy ways acknowledge him, and he shall direct thy paths.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  'Philippians 2:10': 'That at the name of Jesus every knee should bow',
  'Philippians 2:11': 'And that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.',
  'Isaiah 45:23': 'That unto me every knee shall bow, every tongue shall swear.',
  'Romans 14:11': 'every knee shall bow to me, and every tongue shall confess to God',
  'James 2:19': 'the devils also believe, and tremble',
  'Romans 10:9': 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.',
  'Romans 10:10': 'For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'Hebrews 1:8': 'Thy throne, O God, is for ever and ever',
  'Colossians 1:16': 'all things were created by him, and for him',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  '2 Corinthians 6:2': 'behold, now is the accepted time',
  'Psalms 90:9': 'For all our days are passed away in thy wrath: we spend our years as a tale that is told.',
  'Psalms 90:10': 'The days of our years are threescore years and ten; and if by reason of strength they be fourscore years, yet is their strength labour and sorrow; for it is soon cut off, and we fly away.',
  'Ephesians 5:16': 'Redeeming the time, because the days are evil.',
  'Hebrews 3:13': 'while it is called To day',
  '1 John 5:11': 'And this is the record, that God hath given to us eternal life, and this life is in his Son.',
  '1 John 5:13': 'that ye may know that ye have eternal life',
  'Psalms 139:16': 'in thy book all my members were written',
  'Deuteronomy 6:7': 'when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
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
describe('L257 exists exactly once, at its own number, dated the day it was captured', () => {
  // DELIBERATELY NOT "is the last lesson". L256's gate asserted exactly that,
  // and `Math.max(...claimed)).toBe(256)` with it, so the next lesson written
  // broke a passing gate that had nothing wrong with the lesson it guards. A
  // pin on "nothing comes after me" is a pin on the catalog never growing,
  // which is the one thing it is certain to do. So this asserts the two things
  // that stay true for good: ll257 appears once, and it sits after ll256.
  it('is in the catalog exactly once, after L256, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll256-'));
    expect(prev, 'L256 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L257 follows L256 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 257 and only 257, right after 256, and fills none of the deliberately empty numbers', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 257)).toHaveLength(1);
    expect(claimed.includes(256), '257 follows 256 — no number was jumped').toBe(true);
    // a floor, not an equality: a later lesson raises the max and must not fail this
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(257);
    expect(claimed.includes(258), '258 is not this lesson’s to claim').toBe(false);
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson’s to fill`).toBe(false);
  });

  it('carries 2026-10-21, the day it was captured, at or after L256’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-21');
    expect(LIVING_LESSONS_ADDED['ll256-the-lords-release-is-for-a-neighbor-loving-a-mixed-multitude-the-way-he-means'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('carries the full teaching shape', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.benefits.length).toBeGreaterThanOrEqual(11);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun.length).toBeGreaterThan(400);
  });
});

// (b) THE PROVENANCE IS SAID PLAINLY, AND NO VOICE IS EVER GUESSED
describe('L257 — what the recording is, said plainly before the teaching', () => {
  it('names the source exactly: a recorded street interview captured INSIDE the app, transcribed by Whisper', () => {
    expect(L.lesson.startsWith('Ten Christmases Left. This lesson is built from a recorded street interview that Darrell captured inside the PoeTech app on the twenty-first of October')).toBe(true);
    expect(L.lesson).toContain('the words reached us as a Whisper transcript');
    // never the wrong story about how it arrived
    expect(/recorded on a phone and sent in|emailed (?:it )?in|forwarded (?:the )?(?:clip|video)/i.test(whole)).toBe(false);
  });

  it('says the speakers are NOT identified, names the one name there is, and guesses no voice', () => {
    expect(L.lesson).toContain('The speakers are not identified.');
    expect(L.lesson).toContain('the two answering marks are one man, split across two labels by the transcriber');
    expect(L.lesson).toContain('calls the interviewer James exactly once');
    expect(L.lesson).toContain('it never guesses a voice');
    // NOT Darrell teaching and NOT Bishop Gwin teaching (DR-0712 / DR-0719)
    expect(L.lesson).toContain('Nothing here is Darrell teaching, and nothing here is Bishop Gwin teaching.');
    expect(/\bvoice:(?:BG|DP)\b/.test(whole), 'this transcript carries no voice tags').toBe(false);
    expect(/\bBishop Gwin (?:taught|teaches|said|explained)\b/i.test(whole)).toBe(false);
  });

  it('attributes every figure to the man on camera and asserts none of them', () => {
    expect(L.lesson).toContain('Every figure in the clip is a speaker’s own claim and this lesson asserts none of them.');
    // the followers claim belongs to the man FILMING, not the man answering
    expect(L.lesson).toContain('the man filming claimed a channel of twenty-six million followers');
    expect(L.lesson).toContain('The man answering claimed thirty-five software companies');
    expect(L.lesson).toContain('Nobody here checked one of them.');
    for (const f of ['thirty-five software companies', 'six hundred and seventy million dollars', 'twenty-six million followers', 'ten Christmases left', 'the Gulf War in 1991']) {
      expect(L.lesson, `provenance drops the claim: ${f}`).toContain(f);
    }
  });

  it('the money, company and follower figures appear in NO age band', () => {
    for (const b of BANDS) {
      for (const f of ['670', 'six hundred and seventy', '26 million', 'twenty-six million', '35 software', 'thirty-five software']) {
        expect(L.levels[b].includes(f), `${b} carries an unchecked figure: ${f}`).toBe(false);
      }
    }
  });

  it('names the advertising AS advertising, uses it for nothing, and keeps it out of every band', () => {
    expect(L.lesson).toContain('The clip also carries advertising, and we name it as advertising and use it for nothing');
    for (const ad of ADVERTISING) expect(L.lesson.includes(ad), `the provenance drops the advertising: ${ad}`).toBe(true);
    for (const b of BANDS) {
      for (const ad of ADVERTISING) {
        expect(L.levels[b].includes(ad), `${b} carries advertising: ${ad}`).toBe(false);
      }
      expect(/comment the word plan/i.test(L.levels[b]), `${b} carries the call to action`).toBe(false);
    }
    // and nowhere does the lesson recommend or repeat the plug as counsel
    expect(/you should (?:try|use|sign up)|we recommend/i.test(whole)).toBe(false);
  });

  it('PROVEN TO CATCH: the advertising leaking into one band is named by that band', () => {
    const adInBands = (module) => BANDS.filter((b) => ADVERTISING.some((ad) => String(module.levels[b] || '').includes(ad)));
    expect(adInBands(L)).toEqual([]);
    const mutated = { ...L, levels: { ...L.levels, child: `${L.levels.child} ${ADVERTISING[0]}` } };
    expect(adInBands(mutated)).toEqual(['child']);
  });

  it('marks the mis-heard spans as uncertain transcription and builds no teaching on them', () => {
    expect(L.lesson).toContain('The transcriber also mis-heard several spans, and we mark them as uncertain transcription rather than tidy them');
    expect(L.lesson).toContain('is almost certainly interviewing');
    expect(L.lesson).toContain('whatever that company does is not recoverable from this recording');
    expect(L.lesson).toContain('is garbled past use');
    expect(L.lesson).toContain('No teaching below rests on any of those spans.');
    // Each garbled span appears ONCE, in the provenance only, and in no band.
    for (const g of GARBLED) {
      expect(whole.split(g).length - 1, `a garbled span is used more than once: ${g}`).toBe(1);
      expect(L.lesson.includes(g), `the provenance drops: ${g}`).toBe(true);
      for (const b of BANDS) expect(L.levels[b].includes(g), `${b} rests on a garbled span`).toBe(false);
    }
  });

  it('says plainly that a stranger’s words are NOT cleaned (DR-0331 does not reach them)', () => {
    expect(L.lesson).toContain('We fix a stranger’s words for nothing.');
    expect(L.lesson).toContain('His words are quoted as they stand, straight apostrophes and all');
  });
});

// (c) HIS WORDS: AN HONEST ALLOWLIST, AND TWO APOSTROPHES ON PURPOSE
describe('L257 — the spoken spans ride an explicit allowlist that is honest and not a dumping ground', () => {
  it('the allowlist is honest — no declared span is secretly Scripture', () => {
    for (const s of NOT_SCRIPTURE) {
      expect(wholeKjv().includes(norm(s)), `declared as spoken word but found in the KJV: ${s}`).toBe(false);
    }
  });

  it('the allowlist is not a dumping ground — every entry appears in the lesson', () => {
    for (const s of NOT_SCRIPTURE) {
      expect(whole.includes(s), `stale allowlist entry: ${s}`).toBe(true);
    }
  });

  it('every double-quoted span in a reader place is EITHER referenced Scripture OR on the allowlist', () => {
    const loose = [];
    for (const k of PLACE_KEYS) {
      const referenced = new Set(spansOf(PLACES[k]).map((s) => s.quoted));
      for (const m of PLACES[k].matchAll(/"([^"]*)"/g)) {
        if (referenced.has(m[1])) continue;
        if (NOT_SCRIPTURE.includes(m[1])) continue;
        loose.push(`${k}: ${JSON.stringify(m[1].slice(0, 70))}`);
      }
    }
    expect(loose, `a quoted span is neither cited Scripture nor a declared spoken span:\n${loose.join('\n')}`).toEqual([]);
  });

  it('every SCRIPTURE span uses the corpus apostrophe; every SPOKEN span keeps its straight one', () => {
    for (const s of spansOf(L)) {
      expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a Scripture quotation`).toBe(false);
    }
    // the transcript is pure ASCII, so tidying a spoken apostrophe would be a lie about the source
    for (const s of ["I look at my life now and say, oh Lord, I don't deserve this.", "That's a way to get rich.", "I've been eating 60 billionaires in the last five years."]) {
      expect(whole.includes(s), `a spoken span was tidied: ${s}`).toBe(true);
    }
  });

  it('his three load-bearing sentences are carried, and the man is never named or invented', () => {
    for (const s of ['Life is very short.', 'I grew up with nothing.', 'The Bible says that every knee shall bow and every tongue shall confess that Jesus Christ is Lord.']) {
      expect(whole.includes(s), `drops a load-bearing spoken span: ${s}`).toBe(true);
    }
    // he is referred to by what he did, never by an invented identity
    expect(L.lesson).toContain('it means the man answering');
    expect(/his name (?:is|was)|the entrepreneur named|a man called [A-Z]/.test(whole)).toBe(false);
  });
});

// (d) EVERY QUOTED VERSE IS THE CORPUS, BYTE FOR BYTE
describe('L257 — every verse it stands on is the corpus, verbatim', () => {
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
    expect(spans.length).toBeGreaterThan(250);
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

  it('Psalms 39:4 is quoted with the corpus COLON — the span the NAS builder got wrong twice', () => {
    expect(whole).toContain('what it is: that I may know how frail I am');
    expect(/what it is; that I may know/.test(whole), 'a semicolon here is not the verse').toBe(false);
  });

  it('marks no elision and recites no record id in reader prose', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them, and never uses the generic in our own voice', () => {
    for (const u of ['it is the gift of God', 'and is not rich toward God', 'the word of our God shall stand for ever']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
    for (const k of PLACE_KEYS) {
      const ours = ourProseOnly(PLACES[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
      expect(/\b(?:Satan|Lucifer|The Devil)\b/.test(PLACES[k]), `${k} capitalises an adversary name`).toBe(false);
    }
  });

  it('confesses Jesus as the Lamb and the Eternal Son of Yahweh (DR-0210), in every place', () => {
    for (const k of PLACE_KEYS) {
      expect(PLACES[k].includes('Jesus is the Lamb of Yahweh'), `${k} drops the Lamb`).toBe(true);
      expect(/Eternal Son of Yahweh|He is the Son of Yahweh/.test(PLACES[k]), `${k} drops the Son`).toBe(true);
      expect(PLACES[k].includes('(John 1:29)'), `${k} drops John 1:29`).toBe(true);
    }
  });

  it('anchor.ref names every verse the lesson stands on (Search it out derives its links from it, DR-0734)', () => {
    const anchored = anchoredRefs(L);
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r)), 'a verse is taught but missing from anchor.ref').toEqual([]);
    // and the other direction: anchor.ref claims no verse the lesson never quotes
    const quoted = new Set();
    for (const s of spansOf(L)) {
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) quoted.add(`${s.book} ${s.ch}:${i}`);
        else if (part.trim()) quoted.add(`${s.book} ${s.ch}:${part.trim()}`);
      }
    }
    expect([...anchored].filter((r) => !quoted.has(r)), 'anchor.ref claims a verse the lesson never quotes').toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word in one quoted verse is named by field and reference', () => {
    const anchor = '"So teach us to number our days, that we may apply our hearts unto wisdom." (Psalms 90:12)';
    expect(L.lesson.includes(anchor), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, lesson: L.lesson.replace(anchor, '"So teach us to count our days, that we may apply our hearts unto wisdom." (Psalms 90:12)') };
    expect(mutated.lesson).not.toBe(L.lesson);
    const bad = spansOf(mutated).filter((s) => {
      const v = corpusVerse(s.book, s.ch, s.label);
      return !v || !norm(v).includes(norm(s.quoted));
    });
    expect(bad.map((b) => `${b.path} :: ${b.book} ${b.ch}:${b.label}`)).toEqual(['lesson :: Psalms 90:12']);
  });
});

// (e) THE THREE DIRECTIONS, ON THE MODULE AND ON EACH BAND SEPARATELY
describe('L257 — TALK ABOUT IT TOGETHER, in all three directions, in every place', () => {
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
    expect(t.includes('(Deuteronomy 6:7)'), `${k} drops the four places`).toBe(true);
    expect(t.includes('(Proverbs 27:17)'), `${k} drops iron sharpening iron`).toBe(true);
    expect(t).toContain('until we see that Yahweh has been right');
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

// (f) THE EIGHT MOVEMENTS, IN ORDER, IN ALL FIVE PLACES
describe('L257 — eight movements, kept distinct and in order, everywhere', () => {
  const MARKERS = [
    'ONE. A MAN COUNTED HIS CHRISTMASES',
    'TWO. WHAT COMBAT TAUGHT HIM, THE WORD SAID FIRST',
    'THREE. THE MAN WHO COUNTED YEARS HE DID NOT HAVE',
    "FOUR. I DON’T DESERVE THIS",
    'FIVE. THE CHARGE ON A MAN WITH MUCH',
    'SIX. ADVICE IS NOT THE WAY',
    'SEVEN. ONE HUNDRED OUT OF ONE HUNDRED',
    'EIGHT. WHAT TO DO WITH TEN CHRISTMASES',
    'TALK ABOUT IT TOGETHER',
  ];

  it.each(PLACE_KEYS)('%s carries all eight movements and the close, in the same order', (k) => {
    const at = MARKERS.map((m) => PLACES[k].indexOf(m));
    expect(MARKERS.filter((m, i) => at[i] < 0), `${k} drops a movement`).toEqual([]);
    for (let i = 1; i < at.length; i += 1) {
      expect(at[i], `${k} has ${MARKERS[i]} out of order`).toBeGreaterThan(at[i - 1]);
    }
  });

  it('PROVEN TO CATCH: a dropped movement is named by its band', () => {
    const missingIn = (module) => {
      const places = { lesson: module.lesson, ...Object.fromEntries(BANDS.map((b) => [b, module.levels[b]])) };
      return Object.entries(places).filter(([, t]) => MARKERS.some((m) => !String(t || '').includes(m))).map(([p]) => p);
    };
    expect(missingIn(L)).toEqual([]);
    const mutated = { ...L, levels: { ...L.levels, teen: L.levels.teen.split('SIX. ADVICE IS NOT THE WAY').join('SIX. REMOVED') } };
    expect(missingIn(mutated)).toEqual(['teen']);
  });

  it.each(PLACE_KEYS)('%s teaches the count as a prayer, not a mood (Psalms 90:12 with its purpose)', (k) => {
    expect(PLACES[k].includes('(Psalms 90:12)'), `${k} drops Psalms 90:12`).toBe(true);
    expect(/wise|wisdom/i.test(PLACES[k]), `${k} drops what the counting is FOR`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s sets the two counting men side by side and names the fault the Word names', (k) => {
    const t = PLACES[k];
    expect(t.includes('(Luke 12:19)'), `${k} drops the many years`).toBe(true);
    expect(t.includes('(Luke 12:20)'), `${k} drops the night his soul was required`).toBe(true);
    expect(t.includes('(Luke 12:21)'), `${k} drops the fault the Word names`).toBe(true);
    expect(/Counting is not (?:the sin|bad)/.test(t), `${k} never separates counting from the sin`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s grounds "I don\'t deserve this" in grace AND in the power to get wealth', (k) => {
    expect(PLACES[k].includes('(Ephesians 2:8)'), `${k} drops grace`).toBe(true);
    expect(PLACES[k].includes('(Deuteronomy 8:18)'), `${k} drops Who gives the power to get wealth`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s charges the man with much rather than condemning or congratulating him', (k) => {
    expect(PLACES[k].includes('(1 Timothy 6:18)'), `${k} drops the charge`).toBe(true);
    expect(PLACES[k].includes('(1 Timothy 6:7)'), `${k} drops the exit terms`).toBe(true);
    expect(/Money is not bad|The Word is not against his pleasure|is not wrong to have/i.test(PLACES[k]), `${k} slides into preaching poverty`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s separates a way to get rich from The Way, and sends the reader to check it', (k) => {
    expect(PLACES[k].includes('(John 14:6)'), `${k} drops The Way`).toBe(true);
    expect(PLACES[k].includes('(Proverbs 14:12)'), `${k} drops the way that seems right`).toBe(true);
    expect(PLACES[k].includes('(Acts 17:11)'), `${k} drops searching it out`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s keeps certainty and confession distinct (James 2:19 beside Romans 10:9)', (k) => {
    expect(PLACES[k].includes('(Romans 10:9)'), `${k} drops the confession that saves`).toBe(true);
    expect(PLACES[k].includes('(Philippians 2:10)') && PLACES[k].includes('(Philippians 2:11)'), `${k} drops the knee and the tongue`).toBe(true);
    expect(PLACES[k].includes('(2 Corinthians 6:2)'), `${k} drops "now"`).toBe(true);
  });

  it('the adult lesson and the older bands carry James 2:19 explicitly, and the child band carries the distinction in a child’s words', () => {
    for (const k of ['lesson', 'youth', 'teen', 'senior']) {
      expect(PLACES[k].includes('(James 2:19)'), `${k} drops the devils who believe and tremble`).toBe(true);
    }
    const c = L.levels.child;
    expect(c).toContain('Knowing Yahweh is real is good');
    expect(c).toContain('Saying yes to Jesus is the hug');
  });

  it.each(PLACE_KEYS)('%s ends on a workable unit of time, not on the decade', (k) => {
    expect(PLACES[k].includes('(Hebrews 3:13)'), `${k} drops "while it is called To day"`).toBe(true);
    expect(PLACES[k].includes('(Ephesians 5:16)'), `${k} drops redeeming the time`).toBe(true);
    expect(PLACES[k].includes('(Psalms 139:16)'), `${k} drops Who wrote the days down first`).toBe(true);
  });

  it('teaches the Word and does not stage human schools as co-equal to it (DR-0098), and takes no position on his market claims (DR-0100 tier 2)', () => {
    expect(/both sides|some say|others believe|scholars (?:debate|disagree)|you decide/i.test(ourProseOnly(whole))).toBe(false);
    expect(L.lesson).toContain('We take no position on whether he is right about the market');
    // never endorse and never attack the unverified business claim
    expect(/he is right that AI|his advice is sound|his advice is false|he is lying/i.test(whole)).toBe(false);
  });

  it('never pronounces a verdict on the man’s own standing', () => {
    expect(L.facilitator.talkingPoints.join('\n')).toContain('which is not ours to judge');
    expect(/he is (?:not )?saved|he is going to hell|he is a believer/i.test(whole)).toBe(false);
  });
});

// (g) FOUR BANDS, EACH CARRYING THE WHOLE MESSAGE (P60)
describe('L257 — four bands, each carrying the whole message', () => {
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

  it('each band is written for its own reader, not trimmed from the one above', () => {
    expect(L.levels.child).toContain('Think about a jar of marbles');
    expect(L.levels.child).toContain('Think about a snowman');
    expect(L.levels.youth).toContain('nobody else is in the room');
    expect(L.levels.teen).toContain('The speakers are not identified.');
    expect(L.levels.senior).toContain('a particular temptation belonging to this decade');
    expect(L.levels.senior).toContain('he had manufactured himself');
  });

  it('the child band carries the hard parts gently: no money figures, no advertising, and no verdict on a stranger', () => {
    const ours = ourProseOnly(L.levels.child);
    expect(/\bmillion\b/i.test(ours)).toBe(false);
    expect(/\bhell\b|\bdamn/i.test(ours)).toBe(false);
    expect(ours).toContain('We do not know his name.');
  });
});

// (h) TWO STORIES AND A QUIZ THAT WORKS
describe('L257 — two stories that teach this lesson, and a quiz that works', () => {
  const words = (s) => String(s).trim().split(/\s+/).length;

  it('carries exactly two parables, one light and one solemn, 180-320 words, with no quoted Scripture', () => {
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(String(s.body)).not.toMatch(/"/);
      expect(words(s.body)).toBeGreaterThanOrEqual(180);
      expect(words(s.body)).toBeLessThanOrEqual(320);
    }
  });

  it('each story’s verse is one the lesson is anchored on', () => {
    const anchored = anchoredRefs(L);
    for (const s of L.stories) {
      for (const part of s.verse.split(';')) {
        const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(part.trim());
        expect(m, `${s.title}: ${part}`).toBeTruthy();
        const last = m[4] ? Number(m[4]) : Number(m[3]);
        for (let v = Number(m[3]); v <= last; v += 1) expect(anchored.has(`${m[1]} ${m[2]}:${v}`), `${s.title}: ${m[1]} ${m[2]}:${v}`).toBe(true);
      }
    }
  });

  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the count made her lighter, not heavier
    expect(/one honest number had cured her of it/.test(light.body)).toBe(true);
    // the barn cancelled, the release kept, and the self-made sentence turned into a question
    expect(/He cancelled the fourth/.test(solemn.body)).toBe(true);
    expect(/forgave the balance in the seventh year/.test(solemn.body)).toBe(true);
    expect(/but he says it as a question/.test(solemn.body)).toBe(true);
  });

  it('the quiz has 6-7 questions, answers are not all in one position, and every answer resolves', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.quiz.questions.length).toBeLessThanOrEqual(7);
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) {
      expect(q.options[q.answer]).toBeTruthy();
      expect(String(q.explain).length).toBeGreaterThan(20);
    }
  });

  it('the facilitator notes name the guard rails this lesson needs', () => {
    const notes = `${L.facilitator.howToRun}\n${L.facilitator.talkingPoints.join('\n')}`;
    expect(/Read the provenance aloud/i.test(notes)).toBe(true);
    expect(/Name the advertising as advertising/i.test(notes)).toBe(true);
    expect(/Do not assert any of the man’s figures/i.test(notes)).toBe(true);
    expect(/Do not tidy a mis-heard span/i.test(notes)).toBe(true);
    expect(/take no position on the market/i.test(notes)).toBe(true);
    expect(/not ours to give/i.test(notes)).toBe(true);
  });
});
