// @vitest-environment node
// =============================================================================
// L263 — "Not One Stone": the Word's own answer to a link Darrell sent into the
// research road inside the PoeTech app, on the fall of Jerusalem in AD 70.
// DR-1227.
// =============================================================================
// WHAT THE SOURCE IS, and the honesty it demands:
//
// 1. THE SPEAKER IS NOT NAMED. Nothing that reached us identifies the person in
//    the video — no name, no affiliation, no stated conviction. There are no
//    voice:BG / voice:DP marks (DR-0712), so this is NOT Darrell teaching and
//    NOT Bishop Gwin teaching (DR-0719). The gate pins the provenance sentence
//    that says so, and pins that the lesson never guesses a voice and never
//    pins a label or a motive on a living person (the World Issues 21
//    correction).
// 2. NO HISTORIAN IS QUOTED, ANYWHERE, ON PURPOSE. Only the King James corpus
//    on disk could be read word for word, so only Scripture is quoted. What
//    Josephus and Tacitus record is paraphrased in our own words and credited
//    to the man who wrote it. This is a STRONGER contract than the usual
//    allowlist (cf. living-lessons-ll257): instead of declaring spoken spans as
//    not-Scripture, this lesson declares that EVERY double-quoted span in every
//    reader place resolves verbatim to the corpus — which is asserted below
//    across the whole module, 452 spans, not only the prose a reader scrolls.
// 3. THREE TIERS OF HISTORY, KEPT DISTINCT (DR-0100). The siege, the fall, the
//    burning and dismantling of the temple, the end of sacrifice, the mass
//    death, the enslavement and the Gentile possession of the city are
//    ESTABLISHED and are stated plainly, un-hedged — pinned here. Josephus's
//    casualty figures, his claim that Titus gave no order, the factional
//    grain-burning and the famine are ONE MAN'S REPORT and are labelled as his
//    — pinned here. The omens are recorded by both historians, left
//    UNINTERPRETED because the Word does not interpret them — pinned here.
// 4. GRAVITY WITHOUT APPETITE. The famine is one sentence and the lesson says
//    out loud why it stops there. The child band carries no casualty figure and
//    no famine detail at all; both are pinned absent from it.
// 5. NO END-TIMES SPECULATION, AND NO STAGED DISPUTE (DR-0098). The lesson
//    names that the passage has been read more than one way exactly in order to
//    get past it, teaches the two columns the text itself gives (fulfilled in
//    that generation / not fulfilled then), and hands no date, no chart and no
//    camp. No party label is used, and the absence is pinned.
//
// EVERY VERSE WAS PRINTED FROM app/public/bible/kjv BEFORE A SENTENCE WAS
// WRITTEN, never from memory (DR-0076). The spine is His own speech, so a
// paraphrase anywhere in it would have voided the lesson: Matthew 24:1-2,
// Luke 19:41-44 and Luke 21:20-24 are each pinned span by span below.
//
// PROVEN TO CATCH (DR-0076 §3): six mutation cases, each asserting its anchor
// exists before mutating it — an altered verse named by field and reference, a
// dropped movement named by its band, one band's friend line stripped while the
// pooled check still reads green, a trimmed band, a casualty figure leaked into
// the child band, and an un-hedged established fact turned into "some say".
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
import { placesMissingDirections, hasAllThree, hasAllThreeEverywhere, missingDirections } from '../lib/talk-together.js';

const ID = 'll263-not-one-stone-the-word-jesus-spoke-over-jerusalem-and-the-year-it-came-true';
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** The verse exactly as the corpus on disk has it. No normalisation of marks. */
function corpusVerse(book, ch, n) {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
}

/** The whole corpus as one normalised string, for the no-historian check. */
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

// THE TEN MOVEMENTS AND THE CLOSE, identical in all five places on purpose: a
// reader who only ever opens one band still gets the same ten-beat spine.
const MARKERS = [
  'ONE. HE SAID IT ABOUT THE STONES THEY WERE ADMIRING',
  'TWO. HE WEPT WHILE HE SAID IT',
  'THREE. THE WARNING WAS ALSO A WAY OUT',
  'FOUR. HE SAID WHEN, AND HE SAID WHY HE TOLD THEM EARLY',
  'FIVE. WHAT THE HISTORIANS WROTE DOWN',
  'SIX. THE WORD HAD ALREADY SAID WHAT THIS LOOKS LIKE',
  'SEVEN. THIS IS NOT A REASON TO LOOK DOWN ON ANYONE',
  'EIGHT. STOP WHERE THE WORD STOPS',
  'NINE. WHAT WAS STILL STANDING WHEN THE STONES CAME DOWN',
  'TEN. SO WHAT DO WE DO WITH IT',
  'TALK ABOUT IT TOGETHER',
];

// THE SPINE. His own recorded speech, copied from the corpus on disk, not from
// memory. A prophecy lesson whose verses are paraphrased is worthless, so the
// three speeches the lesson stands on are pinned span by span.
const SPINE = {
  'Matthew 24:1': 'And Jesus went out, and departed from the temple: and his disciples came to him for to shew him the buildings of the temple',
  'Matthew 24:2': 'And Jesus said unto them, See ye not all these things? verily I say unto you, There shall not be left here one stone upon another, that shall not be thrown down',
  'Luke 19:41': 'And when he was come near, he beheld the city, and wept over it,',
  'Luke 19:42': 'Saying, If thou hadst known, even thou, at least in this thy day, the things which belong unto thy peace! but now they are hid from thine eyes',
  'Luke 19:43': 'For the days shall come upon thee, that thine enemies shall cast a trench about thee, and compass thee round, and keep thee in on every side,',
  // The clause the whole lesson turns on: He names a missed visit, never Rome.
  'Luke 19:44': 'And shall lay thee even with the ground, and thy children within thee; and they shall not leave in thee one stone upon another; because thou knewest not the time of thy visitation',
  'Luke 21:20': 'And when ye shall see Jerusalem compassed with armies, then know that the desolation thereof is nigh',
  'Luke 21:21': 'Then let them which are in Judaea flee to the mountains; and let them which are in the midst of it depart out; and let not them that are in the countries enter thereinto',
  'Luke 21:22': 'For these be the days of vengeance, that all things which are written may be fulfilled',
  'Luke 21:23': 'But woe unto them that are with child, and to them that give suck, in those days! for there shall be great distress in the land, and wrath upon this people',
  'Luke 21:24': 'And they shall fall by the edge of the sword, and shall be led away captive into all nations: and Jerusalem shall be trodden down of the Gentiles, until the times of the Gentiles be fulfilled',
};

// The other verses the lesson stands on, with the longest span it quotes of each.
const PINNED = {
  ...SPINE,
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up',
  'Deuteronomy 18:22': 'When a prophet speaketh in the name of the LORD, if the thing follow not, nor come to pass, that is the thing which the LORD hath not spoken, but the prophet hath spoken it presumptuously: thou shalt not be afraid of him',
  'Deuteronomy 28:64': 'And the LORD shall scatter thee among all people, from the one end of the earth even unto the other; and there thou shalt serve other gods, which neither thou nor thy fathers have known, even wood and stone',
  'Deuteronomy 28:65': 'And among these nations shalt thou find no ease, neither shall the sole of thy foot have rest: but the LORD shall give thee there a trembling heart, and failing of eyes, and sorrow of mind:',
  'Deuteronomy 28:68': 'And the LORD shall bring thee into Egypt again with ships, by the way whereof I spake unto thee, Thou shalt see it no more again: and there ye shall be sold unto your enemies for bondmen and bondwomen, and no man shall buy you',
  'Deuteronomy 29:29': 'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law',
  '2 Chronicles 36:15': 'And the LORD God of their fathers sent to them by his messengers, rising up betimes, and sending; because he had compassion on his people, and on his dwelling place:',
  '2 Chronicles 36:16': 'But they mocked the messengers of God, and despised his words, and misused his prophets, until the wrath of the LORD arose against his people, till there was no remedy',
  '2 Chronicles 36:19': 'And they burnt the house of God, and brake down the wall of Jerusalem, and burnt all the palaces thereof with fire, and destroyed all the goodly vessels thereof',
  '2 Chronicles 36:20': 'And them that had escaped from the sword carried he away to Babylon; where they were servants to him and his sons until the reign of the kingdom of Persia:',
  '2 Chronicles 36:21': 'To fulfil the word of the LORD by the mouth of Jeremiah, until the land had enjoyed her sabbaths: for as long as she lay desolate she kept sabbath, to fulfil threescore and ten years',
  'Proverbs 27:17': 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever',
  'Isaiah 46:10': 'Declaring the end from the beginning, and from ancient times the things that are not yet done, saying, My counsel shall stand, and I will do all my pleasure:',
  'Jeremiah 7:4': 'Trust ye not in lying words, saying, The temple of the LORD, The temple of the LORD, The temple of the LORD, are these',
  'Jeremiah 7:14': 'Therefore will I do unto this house, which is called by my name, wherein ye trust, and unto the place which I gave to you and to your fathers, as I have done to Shiloh',
  'Lamentations 1:1': 'How doth the city sit solitary, that was full of people! how is she become as a widow! she that was great among the nations, and princess among the provinces, how is she become tributary!',
  'Lamentations 2:17': 'The LORD hath done that which he had devised; he hath fulfilled his word that he had commanded in the days of old: he hath thrown down, and hath not pitied',
  'Ezekiel 10:18': 'Then the glory of the LORD departed from off the threshold of the house, and stood over the cherubims',
  'Ezekiel 11:23': 'And the glory of the LORD went up from the midst of the city, and stood upon the mountain which is on the east side of the city',
  'Daniel 9:26': 'the people of the prince that shall come shall destroy the city and the sanctuary',
  'Daniel 12:1': 'And at that time shall Michael stand up, the great prince which standeth for the children of thy people: and there shall be a time of trouble, such as never was since there was a nation even to that same time',
  'Daniel 12:2': 'And many of them that sleep in the dust of the earth shall awake, some to everlasting life, and some to shame and everlasting contempt',
  'Amos 3:7': 'Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets',
  'Matthew 23:37': 'O Jerusalem, Jerusalem, thou that killest the prophets, and stonest them which are sent unto thee, how often would I have gathered thy children together, even as a hen gathereth her chickens under her wings, and ye would not!',
  'Matthew 23:38': 'Behold, your house is left unto you desolate',
  'Matthew 24:4': 'And Jesus answered and said unto them, Take heed that no man deceive you',
  'Matthew 24:5': 'For many shall come in my name, saying, I am Christ; and shall deceive many',
  'Matthew 24:15': 'When ye therefore shall see the abomination of desolation, spoken of by Daniel the prophet, stand in the holy place, (whoso readeth, let him understand:)',
  'Matthew 24:16': 'Then let them which be in Judaea flee into the mountains:',
  'Matthew 24:29': 'Immediately after the tribulation of those days shall the sun be darkened, and the moon shall not give her light, and the stars shall fall from heaven, and the powers of the heavens shall be shaken:',
  'Matthew 24:30': 'And then shall appear the sign of the Son of man in heaven: and then shall all the tribes of the earth mourn, and they shall see the Son of man coming in the clouds of heaven with power and great glory',
  'Matthew 24:31': 'And he shall send his angels with a great sound of a trumpet, and they shall gather together his elect from the four winds, from one end of heaven to the other',
  'Matthew 24:34': 'Verily I say unto you, This generation shall not pass, till all these things be fulfilled',
  'Matthew 24:35': 'Heaven and earth shall pass away, but my words shall not pass away',
  'Matthew 24:36': 'But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only',
  'Mark 13:1': 'Master, see what manner of stones and what buildings are here!',
  'Mark 13:2': 'Seest thou these great buildings? there shall not be left one stone upon another, that shall not be thrown down',
  'Luke 1:32': 'He shall be great, and shall be called the Son of the Highest: and the Lord God shall give unto him the throne of his father David:',
  'Luke 19:40': 'I tell you that, if these should hold their peace, the stones would immediately cry out',
  'Luke 21:5': 'And as some spake of the temple, how it was adorned with goodly stones and gifts, he said,',
  'Luke 21:6': 'As for these things which ye behold, the days will come, in the which there shall not be left one stone upon another, that shall not be thrown down',
  'Luke 21:8': 'And he said, Take heed that ye be not deceived: for many shall come in my name, saying, I am Christ; and the time draweth near: go ye not therefore after them',
  'Luke 21:33': 'Heaven and earth shall pass away: but my words shall not pass away',
  'Luke 23:28': 'But Jesus turning unto them said, Daughters of Jerusalem, weep not for me, but weep for yourselves, and for your children',
  'John 1:29': 'The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life',
  'John 4:21': 'Jesus saith unto her, Woman, believe me, the hour cometh, when ye shall neither in this mountain, nor yet at Jerusalem, worship the Father',
  'John 4:23': 'But the hour cometh, and now is, when the true worshippers shall worship the Father in spirit and in truth: for the Father seeketh such to worship him',
  'John 13:19': 'Now I tell you before it come, that, when it is come to pass, ye may believe that I am he',
  'John 14:29': 'And now I have told you before it come to pass, that, when it is come to pass, ye might believe',
  'Acts 1:7': 'And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power',
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  'Romans 11:1': 'I say then, Hath God cast away his people? God forbid. For I also am an Israelite, of the seed of Abraham, of the tribe of Benjamin',
  'Romans 11:2': 'God hath not cast away his people which he foreknew',
  'Romans 11:20': 'Well; because of unbelief they were broken off, and thou standest by faith. Be not highminded, but fear:',
  'Romans 11:21': 'For if God spared not the natural branches, take heed lest he also spare not thee',
  'Romans 11:22': 'Behold therefore the goodness and severity of God: on them which fell, severity; but toward thee, goodness, if thou continue in his goodness: otherwise thou also shalt be cut off',
  '1 Corinthians 10:11': 'Now all these things happened unto them for ensamples: and they are written for our admonition, upon whom the ends of the world are come',
  '1 Corinthians 10:12': 'Wherefore let him that thinketh he standeth take heed lest he fall',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Colossians 1:16': 'all things were created by him, and for him',
  'Colossians 1:17': 'And he is before all things, and by him all things consist',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom',
  'Hebrews 3:13': 'while it is called To day',
  'Hebrews 7:12': 'For the priesthood being changed, there is made of necessity a change also of the law',
  'Hebrews 7:14': 'For it is evident that our Lord sprang out of Juda; of which tribe Moses spake nothing concerning priesthood',
  'Hebrews 7:16': 'Who is made, not after the law of a carnal commandment, but after the power of an endless life',
  'Hebrews 7:17': 'For he testifieth, Thou art a priest for ever after the order of Melchisedec',
  'Hebrews 7:25': 'Wherefore he is able also to save them to the uttermost that come unto God by him, seeing he ever liveth to make intercession for them',
  'Hebrews 8:13': 'In that he saith, A new covenant, he hath made the first old. Now that which decayeth and waxeth old is ready to vanish away',
  'Hebrews 10:12': 'But this man, after he had offered one sacrifice for sins for ever, sat down on the right hand of God;',
  'Hebrews 10:14': 'For by one offering he hath perfected for ever them that are sanctified',
  '2 Peter 2:1': 'But there were false prophets also among the people, even as there shall be false teachers among you, who privily shall bring in damnable heresies, even denying the Lord that bought them, and bring upon themselves swift destruction',
  '2 Peter 3:14': 'Wherefore, beloved, seeing that ye look for such things, be diligent that ye may be found of him in peace, without spot, and blameless',
  '2 Peter 3:18': 'But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen',
  'Revelation 5:5': 'behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book, and to loose the seven seals thereof',
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
describe('L263 exists exactly once, at its own number, dated the day it was built', () => {
  // DELIBERATELY NOT "is the last lesson", and deliberately not "261 is
  // absent": ll256's gate pinned exactly that and the next lesson written broke
  // a passing gate that had nothing wrong with the lesson it guards. A pin on
  // "nothing comes after me" is a pin on the catalog never growing, which is
  // the one thing it is certain to do.
  //
  // THE NUMBER IS A FIXED ASSIGNMENT, NOT A COMPUTED ONE, and this gate is
  // written so that it does not care. ll263 was assigned centrally; mid-build a
  // "take the lowest free id above ll258" instruction moved this lesson to
  // ll260, and a final fixed assignment moved it back to ll263 — because five
  // of eight parallel builders computed the same "lowest free" answer at once,
  // which is the race a central register exists to prevent. A sibling branch
  // holds ll260 today.
  //
  // So nothing here asserts contiguity or a neighbour's number.
  // living-lessons-numbers-are-unique owns the hole question: it pins
  // KNOWN_GAPS at two entries (211, 212), and any lower unclaimed id between
  // the min and the max is registered and retired centrally, not by this gate.
  // What is asserted is only what stays true for good: ll263 appears once, and
  // it sits after ll258.
  it('is in the catalog exactly once, after L258, with all four bands', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const prev = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll258-'));
    expect(prev, 'L258 is in the catalog').toBeGreaterThan(-1);
    expect(at, 'L263 follows L258 in reading order').toBeGreaterThan(prev);
    expect(Object.keys(L.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('claims 263 and only 263, and the catalog may grow past it', () => {
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 263)).toHaveLength(1);
    // a floor, not an equality: a later lesson raises the max and must not fail this
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(263);
    // and any neighbour that lands later sits after this one in reading order
    const at = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    for (const n of [264, 265, 266, 267]) {
      const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith(`ll${n}-`));
      if (i >= 0) expect(i, `ll${n} follows ll263`).toBeGreaterThan(at);
    }
  });

  it('carries 2026-10-27, the day the waiting row was worked, at or after L258’s', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-27');
    expect(LIVING_LESSONS_ADDED['ll258-he-gave-us-everything-we-need-until-we-want-what-he-wants'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });

  it('carries the full teaching shape', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.benefits.length).toBeGreaterThanOrEqual(11);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(L.facilitator.howToRun.length).toBeGreaterThan(400);
  });
});

// (b) THE PROVENANCE IS SAID PLAINLY, AND NO PERSON IS LABELLED
describe('L263 — what the source is, said plainly before the teaching', () => {
  it('names the road exactly: a link sent INSIDE the app, into the research road', () => {
    expect(L.lesson.startsWith('Not One Stone — the Word Jesus Spoke Over Jerusalem, and the Year It Came True. This lesson was built from a link Darrell sent into the PoeTech app')).toBe(true);
    expect(L.lesson).toContain("own research road with one word on it");
    // the reading step never completed, so the captions are the whole of it
    expect(L.lesson).toContain('the reading step never ran, so those captions are the whole of the research');
    expect(L.lesson).toContain('machine-made captions');
    // never the wrong story about how it arrived
    expect(/recorded on a phone and sent in|emailed (?:it )?in|forwarded (?:the )?(?:clip|video)/i.test(whole)).toBe(false);
  });

  it('says the speaker is not named, names none, and pins no label on anybody', () => {
    expect(L.lesson).toContain('The speaker in that video is not named in anything that reached us, so this lesson names no speaker and pins no label, affiliation or motive on anybody.');
    // no voice tags on this road (DR-0712), so no teacher is asserted (DR-0719)
    expect(/\bvoice:(?:BG|DP)\b/.test(whole), 'this intake carries no voice marks').toBe(false);
    expect(/\bBishop Gwin\b/.test(whole)).toBe(false);
    expect(/\bDarrell (?:taught|teaches|said|explained|preached)\b/.test(whole)).toBe(false);
    // and no faith label or motive is attached to the two named historians
    // beyond what their own position states (the World Issues 21 correction)
    for (const k of PLACE_KEYS) {
      expect(/Josephus (?:was|is) a (?:believer|Christian|liar|fraud)/i.test(PLACES[k]), `${k} labels Josephus`).toBe(false);
      expect(/Tacitus (?:was|is) a (?:believer|Christian|liar|fraud)/i.test(PLACES[k]), `${k} labels Tacitus`).toBe(false);
    }
  });

  it('states the four rules that govern the teaching, in the lesson’s own words', () => {
    expect(L.lesson).toContain('His words carry it, and the history stands beside Him as a witness, never as a substitute.');
    expect(L.lesson).toContain("What is established is said plainly, and what rests on one man's report is named as one man's report.");
    expect(L.lesson).toContain('we teach it with gravity and no appetite');
    expect(L.lesson).toContain('we teach what was fulfilled and stop where the Word stops');
    expect(L.lesson).toContain('You will not be handed a side to pick, a chart, or a date.');
  });
});

// (c) NO HISTORIAN IS QUOTED — THE STRONGER CONTRACT
describe('L263 — only the Word is quoted; the historians are paraphrased and credited', () => {
  it('says so out loud, in the lesson and in every band', () => {
    expect(L.lesson).toContain('this lesson quotes Him at length and quotes no historian at all');
    for (const b of BANDS) {
      expect(/no historian is quoted|quotes no historian|no (?:sentence|line) of Josephus|not one line of Josephus/i.test(L.levels[b]), `${b} drops the no-historian rule`).toBe(true);
    }
  });

  it('EVERY double-quoted span in every reader place is a referenced Scripture span', () => {
    const loose = [];
    for (const k of PLACE_KEYS) {
      const referenced = new Set(spansOf(PLACES[k]).map((s) => s.quoted));
      for (const m of PLACES[k].matchAll(/"([^"]*)"/g)) {
        if (referenced.has(m[1])) continue;
        loose.push(`${k}: ${JSON.stringify(m[1].slice(0, 70))}`);
      }
    }
    expect(loose, `a quoted span is not cited Scripture — this lesson has no allowlist:\n${loose.join('\n')}`).toEqual([]);
  });

  it('and the same holds for the WHOLE module, not only the prose a reader scrolls', () => {
    const referenced = new Set(spansOf(L).map((s) => s.quoted));
    const loose = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const m of node.matchAll(/"([^"]*)"/g)) if (!referenced.has(m[1])) loose.push(`${path}: ${JSON.stringify(m[1].slice(0, 60))}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(loose, `an uncited quotation survives in the module:\n${loose.join('\n')}`).toEqual([]);
  });

  it('names both historians and their positions honestly, without whispering it', () => {
    expect(L.lesson).toContain('That he wrote under Roman patronage is honest context, not a disclaimer');
    expect(L.lesson).toContain('The Jewish War');
    expect(L.lesson).toContain('Histories');
    expect(L.lesson).toContain('a Roman senator');
    expect(L.lesson).toContain('were not friends, not co-religionists and not collaborators');
  });
});

// (d) THE THREE TIERS OF HISTORY, KEPT DISTINCT (DR-0100)
describe('L263 — established fact stated plainly, single-source labelled, omens uninterpreted', () => {
  it('states the established facts without hedging, and says they are facts', () => {
    expect(L.lesson).toContain('What is established is stated here plainly and not hedged.');
    for (const f of [
      'Rome besieged Jerusalem in AD 70 under the general Titus',
      'The city fell',
      'The temple was burned and then dismantled',
      'The sacrifices stopped and have never resumed',
      'passed into Gentile hands for centuries',
    ]) {
      expect(L.lesson.includes(f), `the established tier drops: ${f}`).toBe(true);
    }
    expect(L.lesson).toContain('Those are facts, not opinions.');
  });

  it('PROVEN TO CATCH: softening an established fact into "some say" is detectable', () => {
    const hedged = (text) => /some say (?:Rome|the temple|the city)|it is (?:claimed|alleged) that Rome|may or may not have/i.test(text);
    expect(hedged(whole)).toBe(false);
    const mutated = L.lesson.replace('Rome besieged Jerusalem in AD 70 under the general Titus.', 'Some say Rome besieged Jerusalem in AD 70.');
    expect(mutated).not.toBe(L.lesson);
    expect(hedged(mutated)).toBe(true);
  });

  it('labels the single-source material as one man’s report and asserts none of it', () => {
    expect(L.lesson).toContain("Other details rest on one man's report, and each is named as that and no more.");
    expect(L.lesson).toContain('that is his claim, questioned since antiquity, and not ours');
    expect(L.lesson).toContain('are his count, they are debated, and this lesson reports them as his and asserts nothing');
    // the figures are never stated as the lesson's own
    expect(/there were more than a million dead|a million people died/i.test(whole)).toBe(false);
  });

  it('leaves the omens uninterpreted, because the Word does not interpret them', () => {
    expect(L.lesson).toContain('It is not Scripture, the Word does not interpret it for us, and neither will we.');
    for (const b of BANDS) {
      expect(/(?:does not|nowhere) (?:tell us what|interpret)|decline to supply an interpretation/i.test(L.levels[b]), `${b} drops the uninterpreted rule`).toBe(true);
    }
    // and no omen is turned into a claim about Yahweh's own movements
    expect(/the glory (?:of Yahweh )?departed in AD 6[0-9]|the Presence left the second temple/i.test(whole)).toBe(false);
  });

  it('teaches the famine with gravity and says out loud why it stops there', () => {
    expect(L.lesson).toContain('would dishonour the dead and the One who wept');
    // one sentence on the famine, not a catalogue
    expect(L.lesson.split('famine').length - 1, 'the famine is named once in the adult lesson').toBe(1);
  });

  it('the child band carries no casualty figure and no famine detail at all', () => {
    const c = L.levels.child;
    for (const f of ['million', '97,000', 'ninety-seven thousand', 'famine', 'refuse', 'scraps']) {
      expect(c.includes(f), `the child band carries: ${f}`).toBe(false);
    }
    // but it does not pretend nothing happened
    expect(c).toContain('Many people were hurt and many died.');
    expect(c).toContain('We do not make it fun.');
  });

  it('PROVEN TO CATCH: a casualty figure leaked into one band is named by that band', () => {
    const figuresIn = (module) => BANDS.filter((b) => /million|ninety-seven thousand|97,000/.test(String(module.levels[b] || '')));
    expect(figuresIn(L)).toEqual(['youth', 'teen', 'senior'].filter((b) => /million|ninety-seven thousand|97,000/.test(L.levels[b])));
    expect(figuresIn(L).includes('child'), 'the child band is clean today').toBe(false);
    const mutated = { ...L, levels: { ...L.levels, child: `${L.levels.child} Over a million died.` } };
    expect(figuresIn(mutated)).toContain('child');
  });
});

// (e) EVERY QUOTED VERSE IS THE CORPUS, BYTE FOR BYTE
describe('L263 — every verse it stands on is the corpus, verbatim', () => {
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
    expect(spans.length).toBeGreaterThan(400);
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

  it('the three speeches the lesson stands on appear in EVERY reader place', () => {
    // A reader reads ONE band. A prophecy lesson whose band drops the prophecy
    // is not the lesson.
    for (const k of PLACE_KEYS) {
      expect(PLACES[k].includes('(Matthew 24:2)'), `${k} drops the stone He named`).toBe(true);
      expect(PLACES[k].includes('(Luke 19:41)'), `${k} drops His tears`).toBe(true);
      expect(PLACES[k].includes('(Luke 19:44)'), `${k} drops the visitation clause`).toBe(true);
      expect(PLACES[k].includes('(Luke 21:20)'), `${k} drops the sign`).toBe(true);
      expect(PLACES[k].includes('(Luke 21:21)'), `${k} drops the flight`).toBe(true);
      expect(PLACES[k].includes('(Matthew 24:34)'), `${k} drops the deadline`).toBe(true);
      expect(PLACES[k].includes('(Matthew 24:35)'), `${k} drops what outlasted the stones`).toBe(true);
    }
  });

  it('marks no elision and recites no record id in reader prose', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('quotes no verse with an ellipsis, because an elided quote is verbatim nowhere', () => {
    for (const s of spans) {
      expect(s.quoted, `${s.book} ${s.ch}:${s.label} is elided`).not.toMatch(/\.\.\.|…/);
    }
  });

  it('leaves "God" and "the LORD" exactly as the verses carry them, and never uses the generic in our own voice', () => {
    for (const u of ['Hath God cast away his people? God forbid', 'but the word of our God shall stand for ever', 'Surely the Lord GOD will do nothing']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
    for (const k of PLACE_KEYS) {
      const ours = ourProseOnly(PLACES[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'|’)?s?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
      expect(/\bLORD\b/.test(ours), `${k} uses "the LORD" in our own voice`).toBe(false);
      expect(/\b(?:Satan|Lucifer|The Devil)\b/.test(PLACES[k]), `${k} capitalises an adversary name`).toBe(false);
    }
  });

  it('confesses Jesus as the Lamb and the Eternal Son of Yahweh (DR-0210), in every place', () => {
    for (const k of PLACE_KEYS) {
      expect(PLACES[k].includes('Lamb of Yahweh'), `${k} drops the Lamb`).toBe(true);
      expect(PLACES[k].includes('Eternal Son of Yahweh'), `${k} drops the Son`).toBe(true);
      expect(PLACES[k].includes('(John 1:29)'), `${k} drops John 1:29`).toBe(true);
      expect(PLACES[k].includes('(John 3:16)'), `${k} drops John 3:16`).toBe(true);
      expect(PLACES[k].includes('(Hebrews 1:8)'), `${k} drops the throne for ever`).toBe(true);
    }
  });

  it('anchor.ref names every verse the lesson stands on, and claims none it never quotes (DR-0734)', () => {
    const anchored = anchoredRefs(L);
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r)), 'a verse is taught but missing from anchor.ref').toEqual([]);
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
    const anchor = '"There shall not be left here one stone upon another, that shall not be thrown down" (Matthew 24:2)';
    expect(L.bigIdea.includes(anchor), 'the mutation anchor must exist before it proves anything').toBe(true);
    const mutated = { ...L, bigIdea: L.bigIdea.replace(anchor, '"There shall not be left here one stone upon another, that shall not be cast down" (Matthew 24:2)') };
    expect(mutated.bigIdea).not.toBe(L.bigIdea);
    const bad = spansOf(mutated).filter((s) => {
      const v = corpusVerse(s.book, s.ch, s.label);
      return !v || !norm(v).includes(norm(s.quoted));
    });
    expect(bad.map((b) => `${b.path} :: ${b.book} ${b.ch}:${b.label}`)).toEqual(['bigIdea :: Matthew 24:2']);
  });

  it('PROVEN TO CATCH: a straightened apostrophe fails, so the curly ones in the corpus are real', () => {
    const v = corpusVerse('Ezekiel', 10, 19);
    expect(v).toContain('LORD’s');
    expect(norm(v.replace('LORD’s', "LORD's"))).not.toBe(norm(v));
  });

  it('PROVEN TO CATCH: changed case fails, so a lowercase verse opening is never "fixed"', () => {
    const v = corpusVerse('Matthew', 24, 16);
    expect(v.startsWith('Then')).toBe(true);
    expect(norm(`then${v.slice(4)}`)).not.toBe(norm(v));
  });
});

// (f) THE TEN MOVEMENTS, IN ORDER, IN ALL FIVE PLACES
describe('L263 — ten movements, kept distinct and in order, everywhere', () => {
  it.each(PLACE_KEYS)('%s carries all ten movements and the close, in the same order', (k) => {
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
    const mutated = { ...L, levels: { ...L.levels, teen: L.levels.teen.split('EIGHT. STOP WHERE THE WORD STOPS').join('EIGHT. REMOVED') } };
    expect(missingIn(mutated)).toEqual(['teen']);
  });

  it.each(PLACE_KEYS)('%s puts the tears BEFORE the siege works, because the order is the teaching', (k) => {
    const t = PLACES[k];
    const tears = t.indexOf('(Luke 19:41)');
    const works = t.indexOf('(Luke 19:44)');
    expect(tears, `${k} drops the tears`).toBeGreaterThan(-1);
    expect(works, `${k} drops the ground-levelling`).toBeGreaterThan(-1);
    expect(works, `${k} describes the ruin before it shows Him weeping`).toBeGreaterThan(tears);
  });

  it.each(PLACE_KEYS)('%s teaches the warning as a way out, not only a verdict', (k) => {
    const t = PLACES[k];
    expect(t.includes('(Luke 21:20)'), `${k} drops the watchable sign`).toBe(true);
    expect(t.includes('(Luke 21:21)'), `${k} drops the instruction to flee`).toBe(true);
    expect(/door|way out|exit|escape/i.test(t), `${k} never says the warning was a way out`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s grounds His foreknowledge in the Word’s own falsifiable test', (k) => {
    expect(PLACES[k].includes('(Deuteronomy 18:22)'), `${k} drops the prophet test`).toBe(true);
    expect(PLACES[k].includes('(John 13:19)'), `${k} drops why He told them early`).toBe(true);
    expect(PLACES[k].includes('(Isaiah 46:10)'), `${k} drops declaring the end from the beginning`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s reads AD 70 on the covenant pattern the Word had already published', (k) => {
    const t = PLACES[k];
    expect(t.includes('(2 Chronicles 36:16)'), `${k} drops the first temple's reason`).toBe(true);
    expect(t.includes('(2 Chronicles 36:15)'), `${k} drops the long patience`).toBe(true);
    expect(t.includes('(Jeremiah 7:4)'), `${k} drops the slogan Jeremiah attacked`).toBe(true);
    expect(t.includes('(Lamentations 1:1)'), `${k} drops the lament`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s installs the Word’s own guard against contempt', (k) => {
    const t = PLACES[k];
    expect(t.includes('(Romans 11:1)'), `${k} drops "God forbid"`).toBe(true);
    expect(t.includes('(Romans 11:20)'), `${k} drops "Be not highminded"`).toBe(true);
    expect(t.includes('(1 Corinthians 10:12)'), `${k} drops take heed lest he fall`).toBe(true);
    expect(/sneer|smug|look down|superior|proud about|satisfaction/i.test(t), `${k} never names the posture it forbids`).toBe(true);
  });

  it.each(PLACE_KEYS)('%s sets the two columns side by side and then stops, with no date and no camp', (k) => {
    const t = PLACES[k];
    expect(t.includes('(Matthew 24:29)'), `${k} drops the cosmic signs that did not happen then`).toBe(true);
    expect(t.includes('(Matthew 24:30)'), `${k} drops the Son of man seen by all`).toBe(true);
    expect(t.includes('(Matthew 24:36)'), `${k} drops "knoweth no man"`).toBe(true);
    expect(t.includes('(Deuteronomy 29:29)'), `${k} drops the secret things`).toBe(true);
    expect(t.includes('(Matthew 24:4)'), `${k} drops His own warning about the date-sellers`).toBe(true);
  });

  it('never resolves or stages the dispute, and never names a camp (DR-0098)', () => {
    // The dispute may be NAMED in order to educate past it. It may not be staged.
    for (const k of PLACE_KEYS) {
      expect(/(?:read|taken)[^.!?]{0,40}more than one (?:way|direction)/i.test(PLACES[k]), `${k} never names the reading difference at all`).toBe(true);
    }
    const ours = ourProseOnly(whole);
    expect(/\bpreterist|\bfuturist|\bpartial preterism|\bdispensational/i.test(ours), 'a camp is named, which stages the dispute').toBe(false);
    // THE PATTERN IS ABOUT STAGED READINGS, NOT THE WORDS "both sides".
    // A bare /both sides/ fired on movement SIX, where the teen band says the
    // covenant terms were "spelled out on both sides" — blessing and curse,
    // which is the Word's own frame and the opposite of a staged dispute. The
    // instrument was blunt, not the band (the same correction the three band
    // patterns above needed), and rewriting sound prose to satisfy a counter is
    // the trade this repo refuses. So the tell is a staged READING or VIEW.
    expect(/both sides of (?:the|this) (?:debate|argument|question|issue)|both views|two views|(?:here are|there are) (?:two|three) (?:views|readings|camps)|you decide|pick a side for yourself|scholars (?:debate|disagree) (?:the|this) (?:interpretation|meaning)|some say the Word means/i.test(ours)).toBe(false);
    // and no date, year or countdown is ever offered for the unfulfilled half
    expect(/will (?:happen|return|come) (?:in|by) (?:19|20|21)\d\d|within (?:the next )?(?:ten|twenty|forty) years|the generation alive today will see/i.test(whole)).toBe(false);
  });

  it('PROVEN TO CATCH: a staged dispute, a named camp and a date each fail, while the covenant sense passes', () => {
    const STAGED = /both sides of (?:the|this) (?:debate|argument|question|issue)|both views|two views|(?:here are|there are) (?:two|three) (?:views|readings|camps)|you decide|pick a side for yourself|scholars (?:debate|disagree) (?:the|this) (?:interpretation|meaning)|some say the Word means/i;
    const CAMP = /\bpreterist|\bfuturist|\bpartial preterism|\bdispensational/i;
    const DATE = /will (?:happen|return|come) (?:in|by) (?:19|20|21)\d\d|within (?:the next )?(?:ten|twenty|forty) years|the generation alive today will see/i;
    // the covenant sentence this lesson really carries must NOT read as staging
    expect(L.levels.teen).toContain('spelled out on both sides');
    expect(STAGED.test(ourProseOnly(L.levels.teen)), 'the covenant sense is not a staged dispute').toBe(false);
    // and each forbidden shape is caught when it is actually present
    expect(STAGED.test('Here are two views, and you decide which one is right.')).toBe(true);
    expect(STAGED.test('Both sides of the debate have serious scholars behind them.')).toBe(true);
    expect(CAMP.test('The preterist reading takes all of it as past.')).toBe(true);
    expect(DATE.test('The generation alive today will see it.')).toBe(true);
    // none of which is anywhere in the lesson
    const ours = ourProseOnly(whole);
    expect([STAGED, CAMP].filter((re) => re.test(ours))).toEqual([]);
    expect(DATE.test(whole)).toBe(false);
  });

  it.each(PLACE_KEYS)('%s ends on His word outlasting the building, and on what did not burn', (k) => {
    const t = PLACES[k];
    expect(t.includes('(Isaiah 40:8)'), `${k} drops the word that stands for ever`).toBe(true);
    expect(t.includes('(Hebrews 10:12)'), `${k} drops the one finished offering`).toBe(true);
    expect(t.includes('(Hebrews 7:16)'), `${k} drops the Priest of an endless life`).toBe(true);
    expect(t.includes('(John 4:23)'), `${k} drops worship in spirit and in truth`).toBe(true);
    expect(t.includes('(2 Peter 3:14)'), `${k} drops the readiness Peter actually named`).toBe(true);
    expect(t.includes('(Acts 17:11)'), `${k} drops searching it out`).toBe(true);
    expect(t.includes('(Hebrews 3:13)'), `${k} drops "while it is called To day"`).toBe(true);
    expect(t.includes('(Galatians 5:22)'), `${k} drops His own measure of growth`).toBe(true);
  });

  it('points the reader at the lessons that already hold the genealogy ground rather than teaching it twice', () => {
    expect(L.lesson).toContain('One thing from that year is taught elsewhere in this house and is not re-taught here.');
    expect(L.lesson).toContain('The Firsts');
    expect(L.lesson).toContain('the people of Judah and the people of The Way');
    // and the neighbours it names really are in the catalog
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll127-'))).toBe(true);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id.startsWith('ll140-'))).toBe(true);
  });
});

// (g) THE THREE DIRECTIONS, ON THE MODULE AND ON EACH BAND SEPARATELY
describe('L263 — TALK ABOUT IT TOGETHER, in all three directions, in every place', () => {
  it('the lesson and every band send the reader all three ways in the lesson’s own words', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThree(L)).toBe(true);
    expect(hasAllThreeEverywhere(L)).toBe(true);
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

// (h) FOUR BANDS, EACH CARRYING THE WHOLE MESSAGE (P60)
describe('L263 — four bands, each carrying the whole message', () => {
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
    expect(L.levels.child).toContain('A hen tucks her chicks under her wings.');
    expect(L.levels.child).toContain('The temple was Yahweh');
    expect(L.levels.youth).toContain('That is a dated, checkable claim about a real building');
    expect(L.levels.teen).toContain('people who inflate it into a prophecy chart');
    expect(L.levels.teen).toContain('a salvage operation, not by a demolition order');
    expect(L.levels.senior).toContain('if you have buried friends and watched institutions you trusted close their doors');
    expect(L.levels.senior).toContain('an elder who stops speculating in public gives the younger ones permission to stop as well');
    // the senior band addresses the elder's own side of the table
    expect(L.levels.senior).toContain('Grandparents and parents, ask the children in your family');
  });
});

// (i) TWO PARABLES AND A QUIZ THAT WORKS
describe('L263 — two stories that teach this lesson, and a quiz that works', () => {
  const words = (s) => String(s).trim().split(/\s+/).length;

  it('carries two parables, one light and one solemn, neither quoting Scripture', () => {
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.kind)).toEqual(['parable', 'parable']);
    expect(L.stories.map((s) => s.tone)).toEqual(['light', 'solemn']);
    expect(L.stories.map((s) => s.title)).toEqual(['The Notch on the Third Fence Post', 'The Mason Who Trusted His Own Wall']);
    for (const s of L.stories) expect(String(s.body), s.title).not.toMatch(/"/);
  });

  it('each keeps the 180-320 word band', () => {
    for (const s of L.stories) {
      expect(words(s.body), s.title).toBeGreaterThanOrEqual(180);
      expect(words(s.body), s.title).toBeLessThanOrEqual(320);
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
    // the sign was a kindness, cut where a child could see it
    expect(/The notch was never a threat/.test(light.body)).toBe(true);
    expect(/believe him on a wet morning before breakfast/.test(light.body)).toBe(true);
    // the wall was trusted instead of the thing it was built to protect
    expect(/guarding a room he had quietly stopped using/.test(solemn.body)).toBe(true);
    expect(/the wall had been faithful and he had not/.test(solemn.body)).toBe(true);
  });

  it('the quiz has 6-7 questions, answers are spread, and every answer resolves', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(6);
    expect(L.quiz.questions.length).toBeLessThanOrEqual(7);
    expect(new Set(L.quiz.questions.map((q) => q.answer)).size).toBeGreaterThan(2);
    for (const q of L.quiz.questions) {
      expect(q.options[q.answer]).toBeTruthy();
      expect(String(q.explain).length).toBeGreaterThan(20);
    }
  });

  it('the facilitator notes name the guard rails this lesson needs', () => {
    const notes = `${L.facilitator.howToRun}\n${L.facilitator.talkingPoints.join('\n')}`;
    expect(/Read the provenance paragraph aloud/i.test(notes)).toBe(true);
    expect(/quotes no historian at all/i.test(notes)).toBe(true);
    expect(/name no speaker and pin no label/i.test(notes)).toBe(true);
    expect(/Josephus’s own count/i.test(notes)).toBe(true);
    expect(/the Word does not interpret them/i.test(notes)).toBe(true);
    expect(/Stop the room if anyone begins drawing a chart or naming a year/i.test(notes)).toBe(true);
    expect(/gravity and no appetite/i.test(notes)).toBe(true);
    // and the record's own road is named where a steward can find it (DR-1206)
    expect(L.facilitator.howToRun).toContain('6130c486-a7c0-4a8e-978d-a37ad1533b79');
    expect(L.facilitator.howToRun).toContain('a32f4cc4-c46b-40a0-bde1-bc2e882ce229');
  });
});

// (j) THE CORPUS IS THE ONLY QUOTED SOURCE — a direct check on the claim
describe('L263 — the no-historian claim is true, not merely stated', () => {
  it('every quoted span in the module is found in the KJV corpus itself', () => {
    const kjv = wholeKjv();
    const notScripture = spansOf(L).filter((s) => !kjv.includes(norm(s.quoted)));
    expect(notScripture.map((s) => `${s.path} :: "${s.quoted.slice(0, 60)}"`), 'a quoted span is not in the corpus at all').toEqual([]);
  });

  it('PROVEN TO CATCH: a sentence of Josephus put in quotation marks would fail that check', () => {
    const kjv = wholeKjv();
    const invented = 'the whole city was filled with the sound of lamentation';
    expect(kjv.includes(invented), 'the control phrase must NOT be in the corpus').toBe(false);
    const mutated = { ...L, lesson: `${L.lesson} Josephus writes, "${invented}" (Luke 21:24).` };
    const caught = spansOf(mutated).filter((s) => !kjv.includes(norm(s.quoted)));
    expect(caught.map((s) => s.quoted)).toEqual([invented]);
  });
});
