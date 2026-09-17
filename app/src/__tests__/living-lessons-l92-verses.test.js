// =============================================================================
// L92 — Yahweh Standardized Love (obedience, deeds, thoughts, temple): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (spoken into the app): "Yahweh standardized Love... if you
// love Me Obey Me... deterministic logic... Judge by deeds... and those deeds
// are also thought to be thoughts that were not cast down... and studying that
// never occurred... what does it mean to be His Body and Church and or Council?
// Kingdom is everywhere and nowhere... inside of us as temples of Yahweh."
// Captured Word-first (the Spoken-Teachings rule + DR-0089). Every KJV line was
// FETCHED from the repo's own KJV this session; a drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll92-yahweh-standardized-love-obedience-deeds-thoughts-and-the-temple-kingdom'");
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

// Fetched verbatim from app/public/bible/kjv (this session).
const KJV = {
  'John 14:15': 'If ye love me, keep my commandments.',
  '1 John 5:3': 'For this is the love of God, that we keep his commandments: and his commandments are not grievous.',
  'Luke 6:46': 'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Matthew 7:21': 'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven.',
  '1 John 3:18': 'My little children, let us not love in word, neither in tongue; but in deed and in truth.',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them.',
  '2 Corinthians 10:5 (fragment)': 'bringing into captivity every thought to the obedience of Christ',
  'Matthew 15:19 (fragment)': 'out of the heart proceed evil thoughts',
  'Proverbs 23:7 (fragment)': 'as he thinketh in his heart, so is he',
  '2 Timothy 2:15': 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'James 4:17': 'Therefore to him that knoweth to do good, and doeth it not, to him it is sin.',
  '1 Corinthians 12:27': 'Now ye are the body of Christ, and members in particular.',
  'Matthew 18:20': 'For where two or three are gathered together in my name, there am I in the midst of them.',
  'Acts 15:28 (fragment)': 'For it seemed good to the Holy Ghost, and to us',
  'Luke 17:21': 'Neither shall they say, Lo here! or, lo there! for, behold, the kingdom of God is within you.',
  'John 18:36 (fragment)': 'My kingdom is not of this world',
};

const QUOTED_FRAGMENTS = [
  'If ye love me, keep my commandments.',
  'He that hath my commandments, and keepeth them, he it is that loveth me',
  'If a man love me, he will keep my words',
  'For this is the love of God, that we keep his commandments: and his commandments are not grievous.',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven.',
  'so faith without works is dead also.',
  'let us not love in word, neither in tongue; but in deed and in truth.',
  'he shall reward every man according to his works',
  'render to every man according to his deeds',
  'by their fruits ye shall know them.',
  'the dead were judged out of those things which were written in the books, according to their works.',
  'Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ',
  'hath committed adultery with her already in his heart',
  'out of the heart proceed evil thoughts, murders, adulteries',
  'as he thinketh in his heart, so is he',
  'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'to him that knoweth to do good, and doeth it not, to him it is sin.',
  'My people are destroyed for lack of knowledge',
  'be ye transformed by the renewing of your mind',
  'Now ye are the body of Christ, and members in particular.',
  'one body in Christ, and every one members one of another.',
  'he is the head of the body, the church',
  'upon this rock I will build my church; and the gates of hell shall not prevail against it.',
  'where two or three are gathered together in my name, there am I in the midst of them',
  'For it seemed good to the Holy Ghost, and to us',
  'fellowcitizens with the saints, and of the household of God',
  'The kingdom of God cometh not with observation',
  'the kingdom of God is within you',
  'My kingdom is not of this world',
  'righteousness, and peace, and joy in the Holy Ghost.',
  'ye are the temple of God, and that the Spirit of God dwelleth in you',
  'your body is the temple of the Holy Ghost which is in you',
  'lively stones, are built up a spiritual house',
  'an habitation of God through the Spirit.',
];

// -----------------------------------------------------------------------------
// The corpus, joined as a reader meets it.
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

// OUR OWN WORDS, in three of the legitimate kinds this pass has catalogued.
// `"avoid bad thoughts"` is quoted in order to be DENIED -- the command is not
// avoidance but casting down and taking captive, which presumes the thought
// arrives uninvited. `"I love You"` is the reader's own utterance in the child
// band's opening, not Scripture. The rest are our idioms and Darrell's phrases.
// Every entry is asserted absent from the corpus below.
const OUR_OWN_QUOTED = [
  'avoid bad thoughts',                       // quoted to be denied
  'I love You',                               // the reader's own words
  'actions speak louder than words', 'judge by deeds',
  'what is His Body, Church, Council?', 'everywhere and nowhere',
];

describe('L92 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'John 14:15; 2 Corinthians 10:5; Luke 17:21'", 'benefits:', 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (love standardized → deeds → thoughts → study → Body → Kingdom → temple)', () => {
    expect(l).toContain('YAHWEH STANDARDIZED LOVE');
    expect(l).toContain('DETERMINISTIC'); // Darrell's frame: if-then
    expect(l).toContain('THE DEEDS INCLUDE THE THOUGHTS NOT CAST DOWN');
    expect(l).toContain('THE STUDY THAT NEVER OCCURRED');
    expect(l).toContain('everywhere and nowhere');
    expect(l).toContain('temples of Yahweh');
    const order = [
      '1) THE DETERMINISTIC LOGIC',
      '2) JUDGED BY DEEDS',
      '3) AND THE DEEDS INCLUDE THE THOUGHTS NOT CAST DOWN',
      '4) AND THE STUDY THAT NEVER OCCURRED',
      '5) THIS OBEDIENT LIFE IS A MEMBER OF HIS BODY',
      '6) THE CHURCH, AND THE COUNCIL',
      '7) THE KINGDOM',
      '8) BECAUSE IT LIVES INSIDE US',
      '9) SO THE STANDARD REACHES ALL THE WAY IN',
      '10) THE WHOLE OF IT',
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
    it(`quotes verbatim: "${frag.slice(0, 56)}${frag.length > 56 ? '…' : ''}"`, () => {
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
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(140);
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

  it('OUR OWN compression of 2 Corinthians 10:5 never wears quotation marks', () => {
    // A tenth false attribution, found by this lesson's audit. A facilitator
    // prompt carried `"captive to the obedience of Christ"` in quotation marks,
    // in a sentence that had ALREADY cited (2 Corinthians 10:5) a clause
    // earlier -- so a reader takes the quoted phrase for the verse's words. The
    // verse reads `bringing into captivity every thought to the obedience of
    // Christ`. The compression is good teaching shorthand and it is KEPT, as
    // ours, unquoted, with the reference still pointing where it can be checked.
    expect(l, 'our compression must not be quoted as the verse').not.toContain('"captive to the obedience of Christ"');
    expect(KJV_FLOW.includes('captive to the obedience of Christ')).toBe(false);
    expect(KJV_FLOW.includes('bringing into captivity every thought to the obedience of Christ')).toBe(true);
    expect(l, 'and the verse itself is quoted in full').toContain('bringing into captivity every thought to the obedience of Christ');
  });

  it('is PROVEN-TO-CATCH — on this lesson\'s own hinges, each read from the corpus', () => {
    expect(KJV_FLOW.includes('If ye love me, keep my commandments.')).toBe(true);
    expect(KJV_FLOW.includes('If ye love me, keep my commandments;')).toBe(false);
    expect(KJV_FLOW.includes('and his commandments are not grievous.')).toBe(true);
    expect(KJV_FLOW.includes('and his commandments are not grievous,')).toBe(false);
    expect(KJV_FLOW.includes('behold, the kingdom of God is within you.')).toBe(true);
    expect(KJV_FLOW.includes('behold, the kingdom of God is within you,')).toBe(false);
    expect(KJV_FLOW.includes('For as he thinketh in his heart, so is he')).toBe(true);
    expect(KJV_FLOW.includes('For as a man thinketh in his heart, so is he')).toBe(false);   // the common misquote
    expect(KJV_FLOW.includes('My people are destroyed for lack of knowledge')).toBe(true);
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
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(3500);
    }
  });

  it('every band carries all the movements, not a subset', () => {
    const EVERY_BAND = [
      'If ye love me, keep my commandments.',
      'He that hath my commandments, and keepeth them, he it is that loveth me',
      'If a man love me, he will keep my words',
      'For this is the love of God, that we keep his commandments: and his commandments are not grievous.',
      'why call ye me, Lord, Lord, and do not the things which I say?',
      'but he that doeth the will of my Father which is in heaven.',
      'as the body without the spirit is dead, so faith without works is dead also.',
      'let us not love in word, neither in tongue; but in deed and in truth.',
      'he shall reward every man according to his works.',
      'will render to every man according to his deeds',
      'by their fruits ye shall know them.',
      'the dead were judged out of those things which were written in the books, according to their works.',
      'Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ',
      'hath committed adultery with her already in his heart',
      'out of the heart proceed evil thoughts, murders, adulteries',
      'For as he thinketh in his heart, so is he',
      'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
      'Therefore to him that knoweth to do good, and doeth it not, to him it is sin.',
      'My people are destroyed for lack of knowledge',
      'be ye transformed by the renewing of your mind',
      'Now ye are the body of Christ, and members in particular.',
      'we, being many, are one body in Christ, and every one members one of another.',
      'he is the head of the body, the church',
      'that in all things he might have the preeminence.',
      'upon this rock I will build my church; and the gates of hell shall not prevail against it.',
      'where two or three are gathered together in my name, there am I in the midst of them',
      'For it seemed good to the Holy Ghost, and to us',
      'fellowcitizens with the saints, and of the household of God',
      'The kingdom of God cometh not with observation',
      'behold, the kingdom of God is within you.',
      'My kingdom is not of this world',
      'the kingdom of God is not meat and drink; but righteousness, and peace, and joy in the Holy Ghost.',
      'Know ye not that ye are the temple of God, and that the Spirit of God dwelleth in you?',
      'your body is the temple of the Holy Ghost which is in you',
      'and ye are not your own',
      'Ye also, as lively stones, are built up a spiritual house, an holy priesthood',
      'builded together for an habitation of God through the Spirit.',
      'NOTICE', 'TEST', 'CAPTURE', 'REDIRECT',
      'DETERMINISTIC',
    ];
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      for (const frag of EVERY_BAND) expect(t, `${band} lost: ${frag}`).toContain(frag);
    }
  });

  it('every band reaches the SYNTHESIS, which is this lesson\'s whole payoff', () => {
    // Movement nine is what turns the standard from a rulebook into the upkeep
    // of an occupied house. Each band may say it in its own words -- the child
    // band carries `dirt you carried INTO His holy room` and `a lamp you never
    // turned on` -- so the check tests the TEACHING rather than one phrasing.
    // Requiring the exact adult wording would have failed a correct child band,
    // which is the mirror of the mistake this pass keeps catching: a check must
    // watch the thing, not a label for it.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that an uncast-down thought defiles the holy place`)
        .toMatch(/defilement carried INTO the holy place|dirt you carried INTO His holy room/i);
      expect(t, `${band} lost the unlit lamp`)
        .toMatch(/lamp you never light|lamp you never turned on/i);
      expect(t, `${band} lost that the standard is housekeeping, not a leash`)
        .toMatch(/not a leash/i);
      expect(t, `${band} lost the temple-made-of-temples`)
        .toMatch(/temple made of temples|temple made out of temples/i);
      expect(t, `${band} lost the closing if-then`)
        .toMatch(/Obey Him, and the (temple|house) stays His/i);
    }
  });

  it('every band keeps the command as CASTING DOWN, not avoidance', () => {
    // `avoid bad thoughts` is quoted in the teen and senior bands precisely to
    // be denied: the thought's arrival is not the sin, and the command presumes
    // it arrives uninvited. The child and youth bands carry the same point in
    // their own words.
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band), `${band} lost that an unfought thought is a deed begun`)
        .toMatch(/a deed already begun|a deed that already started/i);
    }
    for (const band of ['teen', 'senior']) {
      expect(level(band), `${band} lost that the command is not avoidance`)
        .toMatch(/not "avoid bad thoughts"/);
    }
  });

  it('every band keeps the STUDY NEVER DONE as a deed of omission', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} lost that not studying is not neutral`)
        .toMatch(/not neutral|not a nothing/i);
      expect(t, `${band} lost the omission restated as thought-and-deed`)
        .toMatch(/a thought never captured and a deed never done|a thought you never caught and a good deed you never did/i);
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // TWENTIETH consecutive lesson in this pass whose senior band handed the
    // reader the teacher's clipboard.
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
    const senior = level('senior');
    expect(senior, 'not grievous is about the commandments, not the reader\'s vigour')
      .toMatch(/not about the vigour/i);
    expect(senior, 'a long-fed thought has a deeper channel, and the command still applies')
      .toMatch(/deeper channel/i);
    expect(senior, 'long acquaintance is not study undertaken this week')
      .toMatch(/not the same as study undertaken this week/i);
    expect(senior, 'a quiet obedience nobody notices is still load the body carries')
      .toMatch(/still load the body is carrying/i);
    expect(senior, 'ownership is settled even of a failing body').toMatch(/begun to fail/i);
    expect(senior, 'and a stone already laid is still bearing weight')
      .toMatch(/still bearing weight/i);
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['John 14:15']).toBe('If ye love me, keep my commandments.');
    expect(KJV['Luke 6:46'].endsWith('the things which I say?')).toBe(true);
    expect(KJV['1 John 5:3']).toContain('his commandments are not grievous');
    expect(KJV['1 Corinthians 12:27']).toBe('Now ye are the body of Christ, and members in particular.');
    expect(KJV['Luke 17:21']).toContain('the kingdom of God is within you');
    expect(KJV['2 Corinthians 10:5 (fragment)']).toContain('captivity every thought');
  });
});
