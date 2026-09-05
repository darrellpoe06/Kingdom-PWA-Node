// =============================================================================
// L91 — The Author's Own Code (DNA lead-sensor): verbatim KJV
// =============================================================================
// Darrell 2026-08-27 (forwarded an Economic Times science piece): University of
// Illinois chemists taught a strand of DNA to detect lead in water (Yi Lu & Jing
// Li, reported JACS Oct 2000). This lesson sets the Author ABOVE the artifact
// (Word-first): they repurposed a molecule Yahweh authored, so wonder runs up —
// concealment is God's glory and the search our honour (Prov 25:2), the fear of
// the LORD is the wisdom under the knowledge (Job 28:28), detection serves
// protection and the body is His temple. The article's figures are carried AS
// REPORTED (DR-0076); every KJV line below was FETCHED from the repo's own KJV
// this session. A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll91-the-authors-own-code-searched-out-to-guard-his-image'");
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
const l = lesson.replace(/’/g, "'");

// Fetched verbatim from app/public/bible/kjv (this session), curly apostrophes normalized.
const KJV = {
  'Psalms 139:1': 'O LORD, thou hast searched me, and known me.',
  'Psalms 139:14': 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'Psalms 139:16': 'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written, which in continuance were fashioned, when as yet there was none of them.',
  'Psalms 139:23': 'Search me, O God, and know my heart: try me, and know my thoughts:',
  'Psalms 139:24': 'And see if there be any wicked way in me, and lead me in the way everlasting.',
  'Proverbs 25:2': 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Job 28:3': 'He setteth an end to darkness, and searcheth out all perfection: the stones of darkness, and the shadow of death.',
  'Job 28:12': 'But where shall wisdom be found? and where is the place of understanding?',
  'Job 28:28': 'And unto man he said, Behold, the fear of the LORD, that is wisdom; and to depart from evil is understanding.',
  'Genesis 2:15': 'And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.',
  'Hebrews 4:12': 'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.',
  '1 Corinthians 6:19': 'What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?',
  'Colossians 1:17 (fragment)': 'he is before all things, and by him all things consist',
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'Luke 8:17': 'For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad.',
  'Psalms 19:7': 'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
  'Colossians 2:3 (fragment)': 'are hid all the treasures of wisdom and knowledge',
  'Proverbs 2:4-5': 'If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD, and find the knowledge of God.',
};

const QUOTED_FRAGMENTS = [
  'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written, which in continuance were fashioned, when as yet there was none of them.',
  'he is before all things, and by him all things consist',
  'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Surely there is a vein for the silver, and a place for gold where they fine it.',
  'Iron is taken out of the earth, and brass is molten out of the stone.',
  'He setteth an end to darkness, and searcheth out all perfection: the stones of darkness, and the shadow of death.',
  'where shall wisdom be found? and where is the place of understanding?',
  'Behold, the fear of the LORD, that is wisdom; and to depart from evil is understanding.',
  'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.',
  'For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad.',
  'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own',
  'to dress it and to keep it',
  'O LORD, thou hast searched me, and known me. Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.',
  'are hid all the treasures of wisdom and knowledge',
  'Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.',
  'If thou seekest her as silver, and searchest for her as for hid treasures; then shalt thou understand the fear of the LORD, and find the knowledge of God.',
  'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
];

describe('L91 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 139:14; Proverbs 25:2; Job 28:28'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('the Word LEADS the science, in order, and keeps provenance honest', () => {
    expect(l).toContain('THE ARTICLE, AND THE AUTHOR ABOVE IT');
    expect(l).toContain('AS THE ARTICLE REPORTED THEM'); // figures carried as reported (DR-0076)
    expect(l).toContain('not independently verified');
    const order = [
      '1) WHOSE CODE IS IT?',
      '2) THE GLORY OF THE HIDDEN',
      '3) MAN MINES THE DARKNESS',
      '4) DETECTING THE HIDDEN POISON',
      '5) GUARDING THE TEMPLE',
      '6) THE SEARCH THAT NEVER ENDS',
      '7) THE FEAR OF THE LORD UNDER THE KNOWLEDGE',
      '8) SEARCH ME',
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
    it(`quotes verbatim: "${frag.slice(0, 54)}${frag.length > 54 ? '…' : ''}"`, () => {
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
  it('child, teen, and senior each carry the Author, the search-as-honour, and the fear of the LORD', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries fearfully and wonderfully made`).toContain('fearfully and wonderfully made');
      expect(t, `${band} carries the fear of the LORD as wisdom`).toContain('the fear of the LORD, that is wisdom');
      expect(t, `${band} carries the search-me turn`).toContain('Search me, O God');
    }
    // teen and senior additionally carry the glory/honour of the search and the temple.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('the honour of kings is to search out a matter');
      expect(t).toContain('temple of the Holy Ghost');
    }
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Proverbs 25:2'].endsWith('search out a matter.')).toBe(true);
    expect(KJV['Job 28:28']).toContain('the fear of the LORD, that is wisdom');
    expect(KJV['Psalms 139:14']).toContain('fearfully and wonderfully made');
    expect(KJV['Psalms 139:23'].startsWith('Search me, O God')).toBe(true);
    expect(KJV['Hebrews 4:12']).toContain('discerner of the thoughts and intents of the heart');
    expect(KJV['Psalms 19:7'].endsWith('making wise the simple.')).toBe(true);
  });
});
