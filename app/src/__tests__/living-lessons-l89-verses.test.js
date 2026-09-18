// =============================================================================
// L89 — The Most-Hated Verse (Hebrews 10:26): verbatim KJV
// =============================================================================
// Darrell 2026-08-25 (spoken/transcribed from an Instagram Reel): "The most
// hated verse in the Bible by people who 'think' they're saved! ... Hebrews
// 10:26." The Reel read the NLT; this lesson teaches the KJV our corpus can
// verify and pin (DR-0076 / DR-0281), reading the verse INSIDE its chapter
// (the once-for-all sacrifice, 10:10-18) so the warning is understood by the
// grace it guards (DR-0098: the Word explains the Word). Every KJV line below
// was FETCHED from the repo's own KJV this session. A drifted quote fails the
// build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll89-the-most-hated-verse-wilful-sin-the-one-sacrifice-the-advocate'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (this session).
const KJV = {
  'Hebrews 10:10': 'By the which will we are sanctified through the offering of the body of Jesus Christ once for all.',
  'Hebrews 10:14': 'For by one offering he hath perfected for ever them that are sanctified.',
  'Hebrews 10:18': 'Now where remission of these is, there is no more offering for sin.',
  'Hebrews 10:26': 'For if we sin wilfully after that we have received the knowledge of the truth, there remaineth no more sacrifice for sins,',
  'Hebrews 10:29': 'Of how much sorer punishment, suppose ye, shall he be thought worthy, who hath trodden under foot the Son of God, and hath counted the blood of the covenant, wherewith he was sanctified, an unholy thing, and hath done despite unto the Spirit of grace?',
  'Hebrews 10:31': 'It is a fearful thing to fall into the hands of the living God.',
  'Hebrews 10:39': 'But we are not of them who draw back unto perdition; but of them that believe to the saving of the soul.',
  '1 John 1:9': 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.',
  '1 John 2:1 (fragment)': 'if any man sin, we have an advocate with the Father, Jesus Christ the righteous',
  'Romans 6:1-2 (fragment)': 'Shall we continue in sin, that grace may abound? God forbid.',
  '2 Peter 3:9 (fragment)': 'not willing that any should perish, but that all should come to repentance.',
  'James 4:8 (fragment)': 'Draw nigh to God, and he will draw nigh to you.',
  'Hebrews 3:15 (fragment)': 'To day if ye will hear his voice, harden not your hearts',
  'Galatians 6:7 (fragment)': 'God is not mocked: for whatsoever a man soweth, that shall he also reap.',
};

const QUOTED_FRAGMENTS = [
  'By the which will we are sanctified through the offering of the body of Jesus Christ once for all.',
  'after he had offered one sacrifice for sins for ever, sat down on the right hand of God',
  'For by one offering he hath perfected for ever them that are sanctified.',
  'where remission of these is, there is no more offering for sin',
  'For if we sin wilfully after that we have received the knowledge of the truth, there remaineth no more sacrifice for sins',
  'hath trodden under foot the Son of God, and hath counted the blood of the covenant, wherewith he was sanctified, an unholy thing, and hath done despite unto the Spirit of grace?',
  'a certain fearful looking for of judgment',
  'It is a fearful thing to fall into the hands of the living God.',
  'If we say that we have no sin, we deceive ourselves, and the truth is not in us.',
  'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.',
  'if any man sin, we have an advocate with the Father, Jesus Christ the righteous',
  'Shall we continue in sin, that grace may abound? God forbid.',
  'God is not mocked: for whatsoever a man soweth, that shall he also reap.',
  'Cast not away therefore your confidence, which hath great recompence of reward.',
  'Now the just shall live by faith: but if any man draw back, my soul shall have no pleasure in him.',
  'But we are not of them who draw back unto perdition; but of them that believe to the saving of the soul.',
  'not willing that any should perish, but that all should come to repentance.',
  'To day if ye will hear his voice, harden not your hearts',
  'Draw nigh to God, and he will draw nigh to you. Cleanse your hands, ye sinners; and purify your hearts, ye double minded.',
];

describe('L89 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, ALL FOUR levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    // 'youth:' was absent from this list, and the band was absent from the
    // lesson, while the coverage describe below still called itself "full
    // coverage" (DR-0418: every band is the whole message). The youth band was
    // written 2026-09-18 and is now required here, so it cannot go missing
    // again without failing.
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Hebrews 10:26; 1 John 1:9'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });
  it('reads the verse inside its chapter, names the hinge word, and holds the mercy', () => {
    expect(l).toContain('once for all'); // the finished sacrifice frames the warning
    expect(l).toContain('WILFULLY');     // the KJV hinge word taught explicitly
    expect(l).toContain('MISTAKES ARE NOT WILFUL SIN'); // the pastoral distinction
    expect(l).toContain('THE POINT IS NOT DESPAIR'); // relationship balance, not just backbone
    expect(l).toContain('Reel read the NLT'); // honest provenance: taught in KJV, Reel used NLT
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the whole message (child, youth, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    expect(i, `the ${name} band is missing entirely`).toBeGreaterThan(-1);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  const BANDS = ['child', 'youth', 'teen', 'senior'];

  it('all FOUR bands carry the frame and the mercy', () => {
    for (const band of BANDS) {
      const t = level(band);
      expect(t, `${band} carries the once-for-all sacrifice`).toContain('once for all');
      expect(t, `${band} carries the confession-mercy`).toContain('If we confess our sins');
    }
  });

  it('all FOUR bands carry the Advocate — the half a warning lesson most easily drops', () => {
    // The adult lesson makes the Advocate load-bearing: a believer who sins is
    // not thrown out, he is represented. A band that kept the warning and lost
    // this would teach the opposite of the passage.
    for (const band of BANDS) {
      expect(level(band), `${band} drops the Advocate`).toContain('we have an advocate with the Father');
    }
  });

  it('youth, teen and senior name the hinge word and the no-despair hope', () => {
    // The child band teaches WILFULLY in its own register (on purpose, eyes
    // wide open) rather than by repeating the KJV adverb in lowercase, so it is
    // held to the caps form its own text uses.
    expect(level('child')).toContain('WILFULLY');
    for (const band of ['youth', 'teen', 'senior']) {
      expect(level(band), `${band} drops the hinge word`).toContain('wilfully');
      expect(level(band), `${band} drops the hope the chapter ends on`).toContain('saving of the soul');
    }
  });

  // OUR prose only — quotations stripped. Caught by the break harness: the
  // frame and hinge checks below were satisfiable by the QUOTATION alone, so a
  // band could quote Hebrews 10:26 verbatim and never once teach what wilfully
  // means. Quoting a verse is not teaching it, and DR-0418 asks every band to
  // be the whole MESSAGE.
  const ourProse = (band) => level(band).replace(/"[^"]*"/g, ' ');

  it('all FOUR bands TEACH the hinge word, not merely quote the verse containing it', () => {
    const MEANING = [/deliberate/i, /on purpose/i, /chosen|picks/i, /eyes (wide )?open/i,
      /kept (on|up)|keep on|sustained/i, /presumptuous/i];
    for (const band of BANDS) {
      const ours = ourProse(band);
      expect(ours, `${band} never names wilfully outside the quotation`).toMatch(/wilfully/i);
      const carried = MEANING.filter((re) => re.test(ours)).length;
      expect(carried, `${band} names wilfully but explains it in fewer than two ways`)
        .toBeGreaterThanOrEqual(2);
    }
  });

  it('all FOUR bands TEACH that the one sacrifice is finished, in their own words', () => {
    for (const band of BANDS) {
      const ours = ourProse(band);
      expect(ours, `${band} never says the sacrifice is ONE, outside the quotation`)
        .toMatch(/one sacrifice|ONE sacrifice|one time|only ONE|only one/);
      expect(ours, `${band} never says it is finished or enough, outside the quotation`)
        .toMatch(/finished|enough|sufficient|done|complete/i);
    }
  });

  it('no band elides inside a quotation (DR-0459)', () => {
    // Found already shipped in this lesson on 2026-09-18: the teen and senior
    // bands each carried Hebrews 10:29 with an ellipsis standing in for the
    // middle of His own sentence. The remedy was never an elision — it was to
    // quote the contiguous verbatim span, which was available the whole time.
    for (const band of BANDS) {
      for (const m of level(band).matchAll(/"([^"]*)"/g)) {
        expect(/\.\.\.|\u2026/.test(m[1]), `${band}: an elision inside a quotation — "${m[1]}"`).toBe(false);
      }
    }
  });

  it('no band cites a decision record at the reader', () => {
    // Found already shipped in this lesson on 2026-09-18: the senior band told
    // the reader to teach the verse inside its chapter "(DR-0098: let the Word
    // explain the Word)". The rule is right and the citation is ours, not
    // theirs — a reader has no idea what DR-0098 is, and a lesson that shows
    // its own internal bookkeeping has stopped speaking to the person in front
    // of it. The rule now travels in plain words.
    for (const band of BANDS) {
      expect(level(band), `${band} cites a decision record to the reader`).not.toMatch(/DR-\d{4}/);
    }
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Hebrews 10:26'].startsWith('For if we sin wilfully')).toBe(true);
    expect(KJV['Hebrews 10:14']).toBe('For by one offering he hath perfected for ever them that are sanctified.');
    expect(KJV['1 John 1:9'].endsWith('cleanse us from all unrighteousness.')).toBe(true);
    expect(KJV['Hebrews 10:31'].length).toBe(63);
    expect(KJV['Hebrews 10:39']).toContain('saving of the soul');
    expect(KJV['Romans 6:1-2 (fragment)']).toContain('God forbid');
  });
});
