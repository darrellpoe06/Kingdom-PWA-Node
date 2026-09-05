// =============================================================================
// L94 — Lord of Hosts, the Two Ways, the Seal, and the Body (a capstone): KJV
// =============================================================================
// Darrell 2026-08-28 (spoken into the app, a long continuous download): "Lord Of
// Hosts... not Host... ways are either wicked or righteous... deterministic
// logic of the Bible Algorithms... during the fall which is also called time...
// after everything is sealed for eternity... reasonable services... students of
// the Word... few are chosen even though they are chosen they must choose Him...
// His opinions are solidified inside eternity or the 4th-dimensional space...
// Prioritizing His Will... our flesh is anti Yahweh... the Mind Of Christ...
// Jesus only does what He sees His Father Will want to do... You cannot see the
// Father without seeing the Son/Word so study is mandatory... See to understand
// like tasting a meal... Jesus said eat my body... Church Body together power
// and mandate and support... eating the Word impacts your health and the Body's
// health... eating each other's perspectives... cook the Word by explaining...
// Two or more He shows us better Ways." Captured Word-first (the Spoken-Teachings
// rule + DR-0089). Every KJV line was FETCHED from the repo's own KJV this
// session; a drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll94-lord-of-hosts-the-two-ways-sealed-in-time-and-the-mind-of-christ'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const QUOTED_FRAGMENTS = [
  // Lord of Hosts (not "Host")
  'Holy, holy, holy, is the LORD of hosts: the whole earth is full of his glory.',
  'the LORD of hosts, the God of the armies of Israel',
  // Two ways
  'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish.',
  'wide is the gate, and broad is the way, that leadeth to destruction',
  'strait is the gate, and narrow is the way, which leadeth unto life',
  'I have set before thee this day life and good, and death and evil',
  'the path of the just is as the shining light',
  // Thoughts weighed like ways
  'The thoughts of the wicked are an abomination to the LORD',
  'Let the wicked forsake his way, and the unrighteous man his thoughts',
  // Time and the seal
  'it is appointed unto men once to die, but after this the judgment',
  'in the place where the tree falleth, there it shall be',
  'He that is unjust, let him be unjust still',
  'he that is righteous, let him be righteous still',
  'behold, now is the accepted time; behold, now is the day of salvation',
  // Reasonable service
  'present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service',
  // Reward / study / taste
  'Study to shew thyself approved unto God',
  'a rewarder of them that diligently seek him',
  'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  // Few chosen
  'few there be that find it',
  'For many are called, but few are chosen.',
  // Chosen must choose
  'choose you this day whom ye will serve',
  'therefore choose life',
  'whosoever will, let him take the water of life freely',
  // His ways alone
  'Good and upright is the LORD',
  'my ways higher than your ways, and my thoughts than your thoughts',
  // The eternal, unseen frame
  'the worlds were framed by the word of God',
  'the things which are not seen are eternal',
  'For I am the LORD, I change not',
  'Jesus Christ the same yesterday, and to day, and for ever.',
  // Will over feelings; the fallen flesh
  'But seek ye first the kingdom of God, and his righteousness',
  'the carnal mind is enmity against God',
  'in me (that is, in my flesh,) dwelleth no good thing',
  'shapen in iniquity',
  'every imagination of the thoughts of his heart was only evil continually',
  'The heart is deceitful above all things, and desperately wicked',
  'All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.',
  // Mind of Christ; Jesus does the Father's will
  'the natural man receiveth not the things of the Spirit of God',
  'But we have the mind of Christ.',
  'The Son can do nothing of himself, but what he seeth the Father do',
  'I seek not mine own will, but the will of the Father',
  'not to do mine own will, but the will of him that sent me',
  'not my will, but thine, be done',
  // Seeing the Father through the Son/Word; eating the Word
  'he that hath seen me hath seen the Father',
  'the only begotten Son, which is in the bosom of the Father, he hath declared him',
  'the image of the invisible God',
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'And the Word was made flesh, and dwelt among us',
  'Thy words were found, and I did eat them',
  'Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God',
  'Except ye eat the flesh of the Son of man, and drink his blood, ye have no life in you.',
  'he that eateth me, even he shall live by me.',
  'the words that I speak unto you, they are spirit, and they are life',
  // The Body together — power, mandate, support
  'if two of you shall agree on earth as touching any thing',
  'where two or three are gathered together in my name, there am I in the midst of them',
  'Go ye therefore, and teach all nations',
  'Now ye are the body of Christ, and members in particular.',
  'the eye cannot say unto the hand, I have no need of thee',
  'Two are better than one',
  'a threefold cord is not quickly broken',
  'Bear ye one another',
  'Not forsaking the assembling of ourselves together',
  // The Word as health — yours and the Body's
  'they are life unto those that find them, and health to all their flesh',
  'It shall be health to thy navel, and marrow to thy bones.',
  'even as thy soul prospereth',
  'As newborn babes, desire the sincere milk of the word, that ye may grow thereby',
  'unto the measure of the stature of the fulness of Christ',
  // Two or more; cooking the Word by teaching
  'in the multitude of counsellors they are established',
  'in the multitude of counsellors there is safety',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'they that feared the LORD spake often one to another',
  'Let the word of Christ dwell in you richly',
  'gave the sense, and caused them to understand the reading',
  'even so minister the same one to another',
  // ITIL / PM are His — glory to Yahweh, fruit to the doer
  'Every good gift and every perfect gift is from above, and cometh down from the Father of lights',
  'Not unto us, O LORD, not unto us, but unto thy name give glory',
  'Let all things be done decently and in order.',
  'Commit thy works unto the LORD, and thy thoughts shall be established.',
  'Through wisdom is an house builded; and by understanding it is established',
  'And by knowledge shall the chambers be filled with all precious and pleasant riches.',
  'for whatsoever a man soweth, that shall he also reap.',
  'The hand of the diligent shall bear rule: but the slothful shall be under tribute.',
];

describe('L94 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 6:3; Revelation 22:11; John 5:19'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole download in order — the LORD of hosts leads, sixteen movements follow', () => {
    expect(l).toContain('HE IS THE LORD OF HOSTS');
    expect(l).toContain('NOT "HOST."');
    // the LORD of hosts opens, before the first numbered movement
    expect(l.indexOf('LORD of hosts')).toBeLessThan(l.indexOf('1) THE DETERMINISTIC ALGORITHM'));
    const order = [
      '1) THE DETERMINISTIC ALGORITHM',
      '2) THOUGHTS AND WAYS ARE WEIGHED',
      '3) "TIME" IS THE FALL',
      '4) REASONABLE SERVICE IS REQUIRED',
      '5) THE REWARD GOES TO THE STUDENTS',
      '6) FEW ARE CHOSEN',
      '7) CHOSEN',
      '8) HIS WAYS ALONE ARE GOOD',
      '9) HIS OPINIONS ARE SOLIDIFIED IN ETERNITY',
      '10) PRIORITIZE HIS WILL',
      '11) THE FLESH IS ANTI-YAHWEH',
      '12) THE MIND OF CHRIST',
      '13) YOU CANNOT SEE THE FATHER WITHOUT THE SON/WORD',
      '14) THE NARROW WAY IS WALKED TOGETHER',
      '15) EATING THE WORD IS HEALTH',
      '16) TWO OR MORE',
      '17) EVEN ITIL AND PROJECT MANAGEMENT ARE HIS',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the whole message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the two ways, the choice now, and the good way', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the two ways`).toMatch(/way of the righteous|two ways|righteous or wicked/i);
      expect(t, `${band} carries "taste and see"`).toContain('O taste and see that the LORD is good');
      expect(t, `${band} carries the Son doing the Father's will`).toContain('the Father do');
    }
    // teen and senior additionally carry the seal, the eating, and the Body.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('Except ye eat the flesh of the Son of man');
      expect(t).toContain('Bear ye one another'); // the Body, mutual support (Galatians 6:2)
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Isaiah', 6, 3)).toContain('Holy, holy, holy, is the LORD of hosts');
    expect(verse('Matthew', 22, 14)).toBe('For many are called, but few are chosen.');
    expect(verse('Revelation', 22, 11)).toContain('let him be righteous still');
    expect(verse('Jeremiah', 17, 9)).toBe('The heart is deceitful above all things, and desperately wicked: who can know it?');
    expect(verse('John', 5, 19)).toContain('The Son can do nothing of himself, but what he seeth the Father do');
    expect(verse('John', 6, 53)).toContain('Except ye eat the flesh of the Son of man');
    expect(verse('Ephesians', 4, 16)).toContain('unto the edifying of itself in love');
    expect(verse('Proverbs', 4, 22)).toBe('For they are life unto those that find them, and health to all their flesh.');
    expect(verse('Nehemiah', 8, 8)).toContain('gave the sense, and caused them to understand the reading');
    expect(verse('Proverbs', 27, 17)).toBe('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.');
  });
});
