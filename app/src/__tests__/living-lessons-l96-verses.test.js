// =============================================================================
// L96 — Doers of the Word: competence by doing, the mind's tactics, purity by
// the Spirit, the highest knowledge (to know Him), and how the family of Yahweh
// is known — by doing. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-28 (spoken into the app, a long continuous download): "Clarify
// and gain competence in the Word by DOING it, not just hearing or reading...
// doing the Word or you are deceiving yourself... The Bible has tactics and
// strategies for even how to think and what to think about... not just mind
// tactical comprehension also tactical actions like reading and studying His
// Word... getting married or not and no sexual relationship... the flesh can't
// and won't want to do this without the Holy Spirit of Yahweh, over a lifetime...
// He gives us the ability to create wealth, not light — He IS the Light or
// Knowledge... the highest knowledge for a human being, above all other
// creatures, however we have the test of time to process... how do we determine
// if we are Family Of Yahweh or not — you decide with actions, say less, humbly...
// ways that seem right end in death... prefrontal cortex issues align with
// biblical scriptures." Captured Word-first (the Spoken-Teachings rule + DR-0089).
// Every KJV line was FETCHED from the repo's own KJV this session; a drift fails.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily'");
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
  // hearer vs doer / the mirror
  'But be ye doers of the word, and not hearers only, deceiving your own selves.',
  'beholding his natural face in a glass',
  'straightway forgetteth what manner of man he was',
  'a doer of the work, this man shall be blessed in his deed.',
  // doing verifies truth
  'If any man will do his will, he shall know of the doctrine',
  'If ye know these things, happy are ye if ye do them.',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  // two kinds of doing
  'searched the scriptures daily',
  'rightly dividing the word of truth',
  'faith, if it hath not works, is dead, being alone',
  'be ye transformed by the renewing of your mind',
  'if ye through the Spirit do mortify the deeds of the body, ye shall live',
  // competence by use
  'by reason of use have their senses exercised to discern both good and evil',
  // mind-tactics + prefrontal note
  'to the pulling down of strong holds',
  'bringing into captivity every thought to the obedience of Christ',
  'think on these things',
  'Set your affection on things above',
  'prefrontal cortex',
  'sound mind',
  'temperance',
  // reasonable commands + cause/effect
  'which is your reasonable service',
  'his commandments are not grievous',
  'my yoke is easy, and my burden is light',
  'to steal, and to kill, and to destroy',
  'whatsoever a man soweth, that shall he also reap',
  'therefore choose life',
  'There is a way which seemeth right unto a man, but the end thereof are the ways of death',
  // purity / marriage-or-celibacy
  'that ye should abstain from fornication',
  'your body is the temple of the Holy Ghost',
  'better to marry than to burn',
  'Marriage is honourable in all, and the bed undefiled',
  'which have made themselves eunuchs for the kingdom of heaven',
  // only by the Spirit
  'so that ye cannot do the things that ye would',
  'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',
  'without me ye can do nothing',
  'Not by might, nor by power, but by my spirit',
  'it is God which worketh in you both to will and to do',
  // wealth not light; He is the Light and Knowledge
  'it is he that giveth thee power to get wealth',
  'I am the light of the world',
  'In whom are hid all the treasures of wisdom and knowledge',
  // above creatures, the test of time, the highest knowledge
  'crowned him with glory and honour',
  'dominion over the works of thy hands',
  'to humble thee, and to prove thee, to know what was in thine heart',
  'when he is tried, he shall receive the crown of life',
  'let him that glorieth glory in this, that he understandeth and knoweth me',
  'this is life eternal, that they might know thee the only true God',
  'the excellency of the knowledge of Christ Jesus my Lord',
  'The fear of the LORD is the beginning of knowledge',
  'find the knowledge of God',
  // daily; seek/do/teach
  'meditate therein day and night, that thou mayest observe to do',
  'in his law doth he meditate day and night',
  'heareth these sayings of mine, and doeth them',
  'to seek the law of the LORD, and to do it, and to teach',
  // family of Yahweh — known by doing, humbly
  'the same is my brother, and sister, and mother',
  'by their fruits ye shall know them',
  'every one that doeth righteousness is born of him',
  'whosoever doeth not righteousness is not of God',
  'as many as are led by the Spirit of God, they are the sons of God',
  'ye would do the works of Abraham',
  'do not your alms before men, to be seen of them',
  'walk humbly with thy God',
  'Let your light so shine before men, that they may see your good works',
];

// -----------------------------------------------------------------------------
// The corpus itself, joined the way a reader meets it. Verses are joined with a
// SPACE inside each chapter, so a contiguous-verse quotation is a true substring
// while one stitched across chapters is not.
// -----------------------------------------------------------------------------
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
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

// THREE LEGITIMATE KINDS OF QUOTED SPAN, and this lesson carries two of them.
//   (2) a quoted SPEAKER — the mother in the child band's opening story. Her
//       words are dialogue, and the comma inside `"put on your coat,"` is
//       dialogue punctuation, correct exactly as it stands.
//   (3) OUR OWN term — `"Doing the Word"` in the quiz, which is the phrase the
//       question is naming, not a claim about a verse.
// Nothing here may be Scripture; the check below that follows asserts it.
const OUR_OWN_QUOTED = [
  'put on your coat,', 'okay',        // the mother, and the child answering
  'Doing the Word',                    // our own term, in a quiz stem
];

describe('L96 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'James 1:22; 2 Corinthians 10:5; Jeremiah 9:24'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole download in order — the doer leads, fourteen movements follow', () => {
    expect(l).toContain('DOING THE WORD IS HOW YOU LEARN IT');
    const order = [
      '1) HEARING IS NOT ENOUGH',
      '2) THE MAN WHO FORGETS THE MIRROR',
      '3) DOING IS HOW YOU KNOW IT IS TRUE',
      '4) TWO KINDS OF DOING',
      '5) COMPETENCE COMES BY USE',
      '6) THE WORD HAS TACTICS FOR THE MIND',
      '7) HIS COMMANDS ARE REASONABLE',
      '8) A TACTICAL ACTION THE FLESH WILL NOT DO',
      '9) IMPOSSIBLE WITHOUT THE HOLY SPIRIT',
      '10) HE GIVES US POWER TO CREATE WEALTH',
      '11) THE HIGHEST KNOWLEDGE FOR A HUMAN',
      '12) APPLY IT DAILY',
      '13) SEEK IT, DO IT, TEACH IT',
      '14) HOW YOU KNOW YOU ARE FAMILY OF YAHWEH',
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

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(200);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (OUR_OWN_QUOTED.includes(part)) continue;   // a speaker, or our own term
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

  it('OUR OWN paraphrase never wears quotation marks beside its reference', () => {
    // `"cast it down"` stood inside quotation marks beside 2 Corinthians 10:5,
    // in the inApp block and in the child band. The verse reads `Casting down
    // imaginations`. Our compression of it is a fine teaching phrase and it is
    // KEPT — as ours, unquoted, with the reference still pointing where the
    // reader can check it.
    expect(l, 'our paraphrase must not be quoted as the verse').not.toContain('"cast it down');
    expect(l, 'and the verse it compresses is quoted correctly').toContain('Casting down imaginations');
    expect(KJV_FLOW.includes('cast it down')).toBe(false);
    expect(KJV_FLOW.includes('Casting down imaginations')).toBe(true);
  });

  it('is PROVEN-TO-CATCH — and records a claim of mine that measurement DISPROVED', () => {
    // I carried into this lesson the belief that `"better to marry than to
    // burn,"` was a second false attribution, on the reasoning that the verse
    // reads `it is better to marry than to burn`. The corpus says otherwise:
    // the fragment WITHOUT the leading `it is` is a true contiguous substring,
    // so the quotation is legitimate and always was. What had actually been
    // wrong was the trailing comma, and the catalog-wide terminal sweep fixed
    // it before this lesson was opened. One false attribution here, not two.
    expect(KJV_FLOW.includes('better to marry than to burn')).toBe(true);
    expect(KJV_FLOW.includes('better to marry than to burn,')).toBe(false);
    // The Psalms 8:5 span this pass DID have to fix — the verse closes with a
    // period, so the host sentence's comma belonged outside the quote.
    expect(KJV_FLOW.includes('a little lower than the angels, and hast crowned him with glory and honour')).toBe(true);
    expect(KJV_FLOW.includes('crowned him with glory and honour,')).toBe(false);
    // Proverbs 2:5 begins with a capital, which is why a remembered lowercase
    // `then shalt thou` would have failed this gate rather than passing quietly.
    expect(KJV_FLOW.includes('Then shalt thou understand the fear of the LORD')).toBe(true);
    expect(KJV_FLOW.includes('then shalt thou understand the fear of the LORD')).toBe(false);
    // And two hinges of this lesson, each reading exactly:
    expect(KJV_FLOW.includes('faith, if it hath not works, is dead, being alone')).toBe(true);
    expect(KJV_FLOW.includes('faith, if it hath no works, is dead, being alone')).toBe(false);
    // AND A SECOND CLAIM OF MINE THIS GATE DISPROVED ON THE SPOT. I wrote
    // `that seemeth right` as the drift of Proverbs 14:12's `which seemeth
    // right` and asserted it absent. It is present: Proverbs 16:25 is the same
    // sentence with `that`, and both verses are in this corpus. So a swap
    // between them is invisible to a substring check, and the guard has to be
    // the REFERENCE the lesson prints beside the words, not the words alone.
    expect(KJV_FLOW.includes('There is a way which seemeth right unto a man')).toBe(true);
    expect(KJV_FLOW.includes('There is a way that seemeth right unto a man')).toBe(true);
    expect(l, 'the lesson quotes the `which` form, so it must cite 14:12')
      .toContain('There is a way which seemeth right unto a man, but the end thereof are the ways of death" (Proverbs 14:12)');
    expect(l, 'and never mislabels that form as 16:25')
      .not.toContain('which seemeth right unto a man, but the end thereof are the ways of death" (Proverbs 16:25)');
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(4000);
    }
  });

  it('every band carries all the movements, not a subset', () => {
    // Measured against the parsed bands, not assumed. Fifty-six fragments that
    // every one of the four bands must carry; the two that are age-gated get
    // their own check below, with the reason stated.
    const EVERY_BAND = [
      'be ye doers of the word, and not hearers only',            // 1 hearing is not enough
      'straightway forgetteth what manner of man he was',         // 2 the mirror
      'this man shall be blessed in his deed',                    //   the blessing is in the deed
      'he shall know of the doctrine',                            // 3 doing verifies truth
      'happy are ye if ye do them',
      'and do not the things which I say?',
      'bringing into captivity every thought to the obedience of Christ',  // 6 mind tactics
      'think on these things',
      'Set your affection on things above',
      'prefrontal cortex',                                        //   the brain, named in every band
      'sound mind',
      'temperance',
      'searched the scriptures daily',                            // 4 studying IS an action
      'rightly dividing the word of truth',
      'faith, if it hath not works, is dead, being alone',
      'be ye transformed by the renewing of your mind',
      'do mortify the deeds of the body, ye shall live',
      'by reason of use',                                         // 5 competence by use
      'which is your reasonable service',                         // 7 reasonable commands
      'his commandments are not grievous',
      'my yoke is easy, and my burden is light',
      'to steal, and to kill, and to destroy',
      'whatsoever a man soweth, that shall he also reap',
      'therefore choose life',
      'There is a way which seemeth right unto a man',            //   and the caution with it
      'your body is the temple of the Holy Ghost',                // 8 the long action
      'Marriage is honourable in all, and the bed undefiled',
      'ye cannot do the things that ye would',                    // 9 impossible without Him
      'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',
      'without me ye can do nothing',
      'Not by might, nor by power, but by my spirit',
      'it is God which worketh in you both to will and to do',
      'it is he that giveth thee power to get wealth',             // 10 wealth, not light
      'I am the light of the world',
      'In whom are hid all the treasures of wisdom and knowledge',
      'a little lower than the angels, and hast crowned him with glory and honour',  // 11 the summit
      'dominion over the works of thy hands',
      'to humble thee, and to prove thee, to know what was in thine heart',
      'he shall receive the crown of life',
      'Let not the wise man glory in his wisdom',
      'that he understandeth and knoweth me',
      'they might know thee the only true God',
      'the excellency of the knowledge of Christ Jesus my Lord',
      'The fear of the LORD is the beginning of knowledge',
      'that thou mayest observe to do according to all that is written therein',  // 12 daily
      'in his law doth he meditate day and night',
      'heareth these sayings of mine, and doeth them',
      'to seek the law of the LORD, and to do it, and to teach in Israel',        // 13 seek, do, teach
      'the same is my brother, and sister, and mother',                          // 14 family by doing
      'by their fruits ye shall know them',
      'every one that doeth righteousness is born of him',
      'they are the sons of God',
      'ye would do the works of Abraham',
      'do not your alms before men, to be seen of them',
      'walk humbly with thy God',
      'that they may see your good works',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) {
        expect(t, `${band} lost: ${frag}`).toContain(frag);
      }
    }
  });

  it('the purity movement reaches every band, and is age-gated ONLY in its explicit clauses', () => {
    // Darrell spoke this lesson with purity as its worked example ("getting
    // married or not and no sexual relationship"), so no band may drop the
    // movement — the child band carries the sanctification command, the temple,
    // and that marriage is honourable, which is the whole shape of it.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost the sanctification command`).toContain('this is the will of God, even your sanctification');
      expect(t, `${band} lost that it is held for a lifetime`).toMatch(/whole life|for decades|across a lifetime|for a lifetime|years and years/i);
      expect(t, `${band} lost that singleness for the Kingdom is honoured`).toContain('Matthew 19:12');
    }
    // The two clauses naming the sexual act explicitly stay out of the band
    // written for a six-year-old, and are REQUIRED in the other three. This is
    // the age-appropriateness screen doing its job, not the message thinning.
    for (const band of ['youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} must carry the explicit command`).toContain('that ye should abstain from fornication');
      expect(t, `${band} must carry 1 Corinthians 7:9`).toContain('better to marry than to burn');
    }
    expect(level('child')).not.toContain('abstain from fornication');
    expect(level('child')).not.toContain('better to marry than to burn');
  });

  it('every band keeps the HONEST clause — the flesh will not do it, and He supplies both halves', () => {
    // Leaving this out is what would make the lesson cruel: a lifetime standard
    // with no power named for it. Both halves are the point — the wanting AND
    // the doing, from Him, not resolve.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that willpower is not the remedy`)
        .toMatch(/not trying harder|not gritting your teeth|never resolve|not willpower|willpower will not/i);
      expect(t, `${band} lost that He supplies BOTH halves`)
        .toMatch(/both parts|both halves|both the appetite and the act|BOTH parts/i);
    }
  });

  it('every band keeps the neuroscience UNDER the Word, not beside it as a rival', () => {
    // DR-0100: the documented finding is stated plainly as true, and its place
    // is stated too. A band that drops the ordering invites the reader to read
    // it as the Word needing science's endorsement.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that He commanded it first`)
        .toMatch(/before anybody had a machine|before anyone could scan a brain|before anyone imaged a brain|before any instrument/i);
    }
    for (const band of ['youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that the finding sits UNDER His Word`)
        .toMatch(/sits UNDER|sits beneath|under His Word|not against it|never beside it as a rival|not beside it as a competitor/i);
    }
  });

  it('every band keeps the deed measured by the Word, not by how right it felt', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost the measured-by-the-Word rule`)
        .toMatch(/not because it felt right|never by how right it felt|not by how right it felt/i);
    }
  });

  it('every band keeps teaching LAST in Ezra\'s order', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that teaching comes last`).toMatch(/teach it LAST|Teaching comes LAST|teaching is LAST|teaching is third|teaching stands third/i);
      expect(t, `${band} lost why it comes last`).toMatch(/have not done|has not done|not done yet|but not done/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // SIXTEENTH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard. It opened "Teach this as the difference
    // between information and formation" and carried instructions to the
    // teacher throughout — "Draw the delegated/reserved line", "Close on the
    // daily dosage and the arc", "Take the sharpest, longest example".
    const senior = level('senior');
    expect(senior).not.toContain('Teach this as the difference');
    expect(senior).not.toMatch(/\bDraw the delegated/);
    expect(senior).not.toMatch(/^\s*senior: 'Teach /);
    expect(senior).not.toMatch(/\bClose on the\b/);
    expect(senior).not.toMatch(/\bL\d{2,3}\b/);
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });

  it('the senior band speaks to the years rather than ignoring them', () => {
    // A reader's lesson for a senior is not merely the teacher's notes with the
    // instructions removed — the movements are addressed to someone who has the
    // decades. Competence-by-use reads as encouragement, not as a rebuke.
    const senior = level('senior');
    expect(senior, 'the years spent doing are the training, not a loss')
      .toMatch(/not a loss but the training/i);
    expect(senior, 'and the brain can still be reshaped late').toMatch(/late in life/i);
    expect(senior, 'and being asked for counsel is named as the live temptation')
      .toMatch(/asked for counsel/i);
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('James', 1, 22)).toBe('But be ye doers of the word, and not hearers only, deceiving your own selves.');
    expect(verse('Galatians', 5, 17)).toContain('so that ye cannot do the things that ye would');
    expect(verse('Philippians', 2, 13)).toContain('it is God which worketh in you both to will and to do');
    expect(verse('Deuteronomy', 8, 18)).toContain('it is he that giveth thee power to get wealth');
    expect(verse('Colossians', 2, 3)).toBe('In whom are hid all the treasures of wisdom and knowledge.');
    expect(verse('Jeremiah', 9, 24)).toContain('that he understandeth and knoweth me');
    expect(verse('John', 17, 3)).toContain('that they might know thee the only true God');
    expect(verse('Proverbs', 14, 12)).toBe('There is a way which seemeth right unto a man, but the end thereof are the ways of death.');
    expect(verse('Matthew', 12, 50)).toContain('the same is my brother, and sister, and mother');
    expect(verse('Ezra', 7, 10)).toContain('to seek the law of the LORD, and to do it, and to teach');
    expect(verse('1Thessalonians', 4, 3)).toContain('that ye should abstain from fornication');
  });
});
