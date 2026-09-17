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
import { readFileSync, readdirSync } from 'node:fs';
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

// -----------------------------------------------------------------------------
// The corpus, joined as a reader meets it: verses joined with a SPACE inside
// each chapter, so a contiguous-verse quotation is a true substring.
// -----------------------------------------------------------------------------
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// THE ALLOWLIST IS ALMOST ENTIRELY ONE THING, AND IT IS THE LESSON'S OWN POINT.
// `"the Lord of Host"` is quoted precisely because it is WRONG: the lesson opens
// by correcting it, since He is the LORD of hostS, plural — Commander of all the
// armies of heaven, not one host among many. Quoting an error in order to correct
// it is the same legitimate category as L97's `"Congressman"`, the term that was
// itself under examination. `"TIME"` and `"Time"` are this lesson's own name for
// the present age, and the last two are our own coinages. Every entry is asserted
// absent from the corpus below.
const OUR_OWN_QUOTED = [
  'the Lord of Host', 'the Lord of Host.', 'Host', 'HOST.',    // the WRONG form, under correction
  'TIME', 'Time',                                               // our term for this age
  'best practice', 'deterministic two-way algorithm',           // ours
];

describe('L94 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 6:3; Revelation 22:11; John 5:19'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
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

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV, or one of the listed non-Scripture spans', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'a capstone should carry a large body of quoted Scripture').toBeGreaterThan(300);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('a verse quotation can never hide behind the allowlist', () => {
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('the WRONG form of His name is quoted only to be corrected, never asserted', () => {
    // The whole first movement exists to correct `the Lord of Host`. The gate
    // therefore requires that the wrong form NEVER stands without the plural
    // correction beside it, in every band and in the base prose.
    expect(KJV_FLOW.includes('LORD of hosts')).toBe(true);
    expect(KJV_FLOW.includes('Lord of Host'), 'the singular form is not Scripture').toBe(false);
    const level = (name) => {
      const i = l.indexOf(`${name}: '`);
      const j = l.indexOf("',\n", i);
      return l.slice(i, j);
    };
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} quotes the wrong form`).toContain('the Lord of Host');
      expect(t, `${band} must correct it to the plural`).toMatch(/LORD of hostS|hosts - plural|hostS - plural/);
      expect(t, `${band} must say He commands them all`).toMatch(/commands them all|He commands them all/i);
      expect(t, `${band} must carry Isaiah 6:3 as the witness`).toContain('Holy, holy, holy, is the LORD of hosts');
    }
  });

  it('is PROVEN-TO-CATCH — including the double-defect span this lesson surfaced', () => {
    // L94's audit is what exposed the sixth typographic class. Its Proverbs
    // 15:26 span carried a fabricated comma AND a re-cased first letter at once,
    // which is why the terminal sweep could not see it: that sweep asked only
    // whether moving the mark made the span verbatim.
    expect(KJV_FLOW.includes('The thoughts of the wicked are an abomination to the LORD:')).toBe(true);
    expect(KJV_FLOW.includes('the thoughts of the wicked are an abomination to the LORD,')).toBe(false);
    expect(KJV_FLOW.includes('the thoughts of the wicked are an abomination to the LORD')).toBe(false);
    // And hinges of this lesson, each read from the corpus rather than recalled:
    expect(KJV_FLOW.includes('All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.')).toBe(true);
    expect(KJV_FLOW.includes('All the ways of a man are clean in his own eyes, but the LORD weigheth the spirits.')).toBe(false);
    expect(KJV_FLOW.includes('neither indeed can be')).toBe(true);
    expect(KJV_FLOW.includes('nevertheless not my will, but thine, be done.')).toBe(true);
    expect(KJV_FLOW.includes('nevertheless not my will but thine be done.')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
  });
});

describe('every band is the FULL message, in that age\'s own words (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('youth exists beside the other three, and none is a summary', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(5000);
    }
  });

  it('every band carries all EIGHTY movements of the capstone, not a subset', () => {
    // Measured against the parsed bands, not assumed. The first draft of the
    // child band cleared the word floor at 957 and was still NINETEEN movements
    // short of the other three -- the same failure the L96 measurement caught.
    // Length cannot see a thin band; only this comparison can.
    const EVERY_BAND = [
      'Holy, holy, holy, is the LORD of hosts: the whole earth is full of his glory.',
      'The LORD of hosts, he is the King of glory.',
      'in the name of the LORD of hosts, the God of the armies of Israel',
      'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish.',
      'wide is the gate, and broad is the way, that leadeth to destruction',
      'strait is the gate, and narrow is the way, which leadeth unto life',
      'See, I have set before thee this day life and good, and death and evil',
      'The way of the wicked is as darkness: they know not at what they stumble',
      'the path of the just is as the shining light, that shineth more and more unto the perfect day',
      'The thoughts of the wicked are an abomination to the LORD',
      'Let the wicked forsake his way, and the unrighteous man his thoughts',
      'it is appointed unto men once to die, but after this the judgment',
      'in the place where the tree falleth, there it shall be',
      'let him be righteous still',
      'behold, now is the accepted time; behold, now is the day of salvation.',
      'which is your reasonable service',
      'Study to shew thyself approved unto God',
      'he is a rewarder of them that diligently seek him',
      'O taste and see that the LORD is good',
      'few there be that find it',
      'For many are called, but few are chosen.',
      'choose you this day whom ye will serve',
      'therefore choose life, that both thou and thy seed may live',
      'whosoever will, let him take the water of life freely.',
      'Good and upright is the LORD: therefore will he teach sinners in the way.',
      'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD',
      'Through faith we understand that the worlds were framed by the word of God',
      'visible and invisible',
      'the things which are seen are temporal; but the things which are not seen are eternal.',
      'For I am the LORD, I change not',
      'Jesus Christ the same yesterday, and to day, and for ever.',
      'But seek ye first the kingdom of God, and his righteousness',
      'Because the carnal mind is enmity against God',
      'I know that in me (that is, in my flesh,) dwelleth no good thing',
      'Behold, I was shapen in iniquity',
      'The heart is deceitful above all things, and desperately wicked: who can know it?',
      'All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.',
      'the natural man receiveth not the things of the Spirit of God',
      'But we have the mind of Christ.',
      'The Son can do nothing of himself, but what he seeth the Father do',
      'I seek not mine own will, but the will of the Father which hath sent me',
      'not to do mine own will, but the will of him that sent me',
      'nevertheless not my will, but thine, be done.',
      'he that hath seen me hath seen the Father',
      'the image of the invisible God',
      'he hath declared him',
      'In the beginning was the Word, and the Word was with God, and the Word was God.',
      'And the Word was made flesh, and dwelt among us',
      'Thy words were found, and I did eat them',
      'Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God',
      'Except ye eat the flesh of the Son of man, and drink his blood, ye have no life in you.',
      'he that eateth me, even he shall live by me.',
      'they are spirit, and they are life',
      'if two of you shall agree on earth as touching any thing that they shall ask',
      'where two or three are gathered together in my name, there am I in the midst of them.',
      'Go ye therefore, and teach all nations',
      'the eye cannot say unto the hand, I have no need of thee',
      'Two are better than one',
      'but woe to him that is alone when he falleth',
      'Bear ye one another’s burdens, and so fulfil the law of Christ.',
      'Not forsaking the assembling of ourselves together',
      'For they are life unto those that find them, and health to all their flesh.',
      'It shall be health to thy navel, and marrow to thy bones.',
      'even as thy soul prospereth',
      'As newborn babes, desire the sincere milk of the word, that ye may grow thereby',
      'Without counsel purposes are disappointed',
      'in the multitude of counsellors there is safety.',
      'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
      'teaching and admonishing one another',
      'gave the sense, and caused them to understand the reading.',
      'As every man hath received the gift, even so minister the same one to another',
      'Every good gift and every perfect gift is from above',
      'Not unto us, O LORD, not unto us, but unto thy name give glory',
      'Let all things be done decently and in order.',
      'Commit thy works unto the LORD, and thy thoughts shall be established.',
      'Through wisdom is an house builded',
      'counteth the cost',
      'whatsoever a man soweth, that shall he also reap.',
      'The hand of the diligent shall bear rule',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) expect(t, `${band} lost: ${frag}`).toContain(frag);
    }
  });

  it('every band keeps the INSTRUMENT PROBLEM, which is the lesson\'s spine', () => {
    // Proverbs 16:2 is not one more verse here. Self-assessment reports back
    // clean, which is WHY an outside standard is structural rather than
    // optional. A band that quotes the verse without drawing that conclusion
    // has kept the citation and dropped the teaching.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that self-assessment cannot be trusted`)
        .toMatch(/cannot trust|one tool you cannot trust|part of what is being assessed|about the measuring device|faculty under assessment/i);
      expect(t, `${band} lost that the outside standard is therefore required`)
        .toMatch(/not optional|structural|outside you|outside standard/i);
    }
  });

  it('every band keeps the flesh ACTIVELY opposed, not merely weak', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} softened Romans 8:7 into weakness`)
        .toMatch(/not just weak|not merely weak|not weak, not undecided|on the other side|actively opposed/i);
    }
  });

  it('every band keeps TASTE BEFORE SEE, and study as eating', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost the order of the two senses`).toMatch(/Taste, then see|in that order|orders both senses/i);
      expect(t, `${band} lost that study is eating`).toMatch(/It is EATING|It is eating/);
    }
  });

  it('every band gives Yahweh the glory and the walker the fruit', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the glory/fruit split`)
        .toMatch(/glory for the (algorithm|plan); (receive|you get) the fruit/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // EIGHTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this the..." and
    // instructed a teacher throughout.
    const senior = level('senior');
    expect(senior).not.toMatch(/senior: 'Teach /);
    expect(senior).not.toMatch(/\bTeach this\b/);
    expect(senior).not.toMatch(/\bClose on\b/);
    expect(senior).not.toMatch(/\bDraw the\b/);
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });

  it('the senior band turns each movement toward a reader who HAS the decades', () => {
    // Deleting the teacher's instructions does not by itself address anyone.
    const senior = level('senior');
    expect(senior, 'decades do not calibrate the instrument').toMatch(/decades do not|decades do not fix/i);
    expect(senior, 'the shining path brightens the longer it is walked').toMatch(/the longer it is walked/i);
    expect(senior, 'a narrower window is still an open one').toMatch(/open is the only word/i);
    expect(senior, 'long familiarity is not the same as having eaten today')
      .toMatch(/not the same as having eaten today/i);
    expect(senior, 'receiving help is named as the harder half').toMatch(/harder half/i);
    expect(senior, 'and a career of competence is accounted for, not diminished')
      .toMatch(/finally accounted for/i);
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
