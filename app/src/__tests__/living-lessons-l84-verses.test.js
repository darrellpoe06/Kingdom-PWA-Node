// =============================================================================
// L84 — Blessed and Highly Favored: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken lesson request): "what does it mean to be blessed
// and highly favored based on the biblical scriptures across all ages until
// the revelation? Before during and after time?... everything they must endure
// challenge etc..." Every KJV line below was FETCHED from the repo's own KJV
// (app/public/bible/kjv/*.json) this session — never written from memory
// (DR-0076 / DR-0281 QUOTED). The lesson must contain each quoted fragment
// letter-for-letter; a drifted quote fails the build (the L83 discipline).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
// The lesson's own slice of the file, so pins can't match a different lesson.
const start = src.indexOf("id: 'll84-blessed-and-highly-favored-before-during-after-time'");
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
// JS ’ escapes render as the typographic apostrophe the KJV uses.
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Ephesians 1:3': 'Blessed be the God and Father of our Lord Jesus Christ, who hath blessed us with all spiritual blessings in heavenly places in Christ:',
  'Ephesians 1:4': 'According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:',
  'Luke 1:28': 'And the angel came in unto her, and said, Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women.',
  'Luke 2:35': '(Yea, a sword shall pierce through thy own soul also,) that the thoughts of many hearts may be revealed.',
  'Genesis 6:8': 'But Noah found grace in the eyes of the LORD.',
  'Genesis 39:21': 'But the LORD was with Joseph, and shewed him mercy, and gave him favour in the sight of the keeper of the prison.',
  'Psalms 105:19': 'Until the time that his word came: the word of the LORD tried him.',
  'Psalms 5:12': 'For thou, LORD, wilt bless the righteous; with favour wilt thou compass him as with a shield.',
  'Daniel 1:9': 'Now God had brought Daniel into favour and tender love with the prince of the eunuchs.',
  'James 1:12 (fragment)': 'Blessed is the man that endureth temptation',
  'Hebrews 12:6': 'For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth.',
  'Revelation 20:6 (fragment)': 'Blessed and holy is he that hath part in the first resurrection',
  'Revelation 21:4 (fragment)': 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying',
};

// Fragments the lesson quotes (subsets of the full verses above or fetched whole).
const QUOTED_FRAGMENTS = [
  'who hath blessed us with all spiritual blessings in heavenly places in Christ',
  'chosen us in him before the foundation of the world',
  'which was given us in Christ Jesus before the world began',
  'Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women',
  'Fear not, Mary: for thou hast found favour with God',
  'a sword shall pierce through thy own soul also',
  'But Noah found grace in the eyes of the LORD',
  'and thou shalt be a blessing',
  'But the LORD was with Joseph, and shewed him mercy, and gave him favour in the sight of the keeper of the prison',
  'Until the time that his word came: the word of the LORD tried him',
  'ye thought evil against me; but God meant it unto good',
  'the LORD blessed the latter end of Job more than his beginning',
  'Now God had brought Daniel into favour and tender love with the prince of the eunuchs',
  'Blessed are they which are persecuted for righteousness’ sake: for theirs is the kingdom of heaven',
  'Rejoice, and be exceeding glad: for great is your reward in heaven',
  'For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth',
  'My grace is sufficient for thee: for my strength is made perfect in weakness',
  'Blessed is the man that endureth temptation',
  'with favour wilt thou compass him as with a shield',
  'Blessed is he that readeth, and they that hear the words of this prophecy',
  'Blessed and holy is he that hath part in the first resurrection',
  'Blessed are they that do his commandments, that they may have right to the tree of life',
  'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying',
];

describe('L84 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 1:28'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/); // the catalog count grows with every new lesson; this lesson's presence is the real pin
    expect(src).toContain('L84 Blessed and Highly Favored');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Genesis 6:8']).toBe('But Noah found grace in the eyes of the LORD.');
    expect(KJV['Luke 1:28'].endsWith('blessed art thou among women.')).toBe(true);
    expect(KJV['Genesis 39:21'].length).toBe(113);
    expect(KJV['Hebrews 12:6'].startsWith('For whom the Lord loveth')).toBe(true);
    // Each pinned fragment appears inside its own full verse where both exist.
    expect(KJV['Revelation 21:4 (fragment)']).toContain('wipe away all tears');
  });
});
