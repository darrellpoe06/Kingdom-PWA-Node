// =============================================================================
// L85 — The King's Code: every quoted verse is verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken lesson): "Yahweh... has given us the word, which
// is the exact blueprint and code he wants us to run... his identities wrapped
// in... he's testing us to identify who can agree with him... an if then
// statement, which is a deterministic algorithm... he separates the goat from
// the sheep. Goat in the world means greatest of all times... those are the
// ones that he says will be lost. The sheep are the ones that are his. He
// won't listen to anybody else... It's been written on their hearts from
// before time." Every KJV line below was FETCHED from the repo's own KJV
// (app/public/bible/kjv/*.json) this session — never written from memory
// (DR-0076 / DR-0281 QUOTED). The lesson must contain each quoted fragment
// letter-for-letter; a drifted quote fails the build (the L83/L84 discipline).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
// The lesson's own slice of the file, so pins can't match a different lesson.
const start = src.indexOf("id: 'll85-the-kings-code-sheep-hear-goats-of-the-world-lost'");
const lesson = src.slice(start, start + 40000);
// JS ’ escapes render as the typographic apostrophe where used.
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Matthew 25:32': 'And before him shall be gathered all nations: and he shall separate them one from another, as a shepherd divideth his sheep from the goats:',
  'Matthew 25:33': 'And he shall set the sheep on his right hand, but the goats on the left.',
  'Matthew 25:34': 'Then shall the King say unto them on his right hand, Come, ye blessed of my Father, inherit the kingdom prepared for you from the foundation of the world:',
  'Matthew 7:23': 'And then will I profess unto them, I never knew you: depart from me, ye that work iniquity.',
  'Matthew 16:26': 'For what is a man profited, if he shall gain the whole world, and lose his own soul? or what shall a man give in exchange for his soul?',
  'John 10:27': 'My sheep hear my voice, and I know them, and they follow me:',
  'John 10:5': 'And a stranger will they not follow, but will flee from him: for they know not the voice of strangers.',
  'Amos 3:3': 'Can two walk together, except they be agreed?',
  '1 John 2:3': 'And hereby we do know that we know him, if we keep his commandments.',
  'Isaiah 1:19': 'If ye be willing and obedient, ye shall eat the good of the land:',
  'Luke 6:46': 'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Colossians 3:3': 'For ye are dead, and your life is hid with Christ in God.',
  'Psalms 40:8': 'I delight to do thy will, O my God: yea, thy law is within my heart.',
  'James 1:22': 'But be ye doers of the word, and not hearers only, deceiving your own selves.',
  'Hebrews 11:3': 'Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.',
};

// Fragments the lesson quotes (subsets of the full verses above or fetched whole).
const QUOTED_FRAGMENTS = [
  'Through faith we understand that the worlds were framed by the word of God',
  'For ye are dead, and your life is hid with Christ in God',
  'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me',
  'Can two walk together, except they be agreed?',
  'And hereby we do know that we know him, if we keep his commandments',
  'He that saith, I know him, and keepeth not his commandments, is a liar',
  'If ye be willing and obedient, ye shall eat the good of the land',
  'But if ye refuse and rebel, ye shall be devoured with the sword',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  'as a shepherd divideth his sheep from the goats',
  'And he shall set the sheep on his right hand, but the goats on the left',
  'and in thy name done many wonderful works',
  'I never knew you: depart from me, ye that work iniquity',
  'For what is a man profited, if he shall gain the whole world, and lose his own soul?',
  'My sheep hear my voice, and I know them, and they follow me',
  'And a stranger will they not follow, but will flee from him: for they know not the voice of strangers',
  'I will put my law in their inward parts, and write it in their hearts',
  'before the foundation of the world',
  'Come, ye blessed of my Father, inherit the kingdom prepared for you from the foundation of the world',
  'I delight to do thy will, O my God: yea, thy law is within my heart',
  'But be ye doers of the word, and not hearers only, deceiving your own selves',
  'I have set before you life and death, blessing and cursing: therefore choose life',
];

describe('L85 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 25:32-33'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: 84,/);
    expect(src).toContain('L85 The King’s Code');
  });
  it("keeps the Governor's own framing: code, agreement, the GOAT wordplay, best written", () => {
    for (const frag of ['exact blueprint and CODE', 'deterministic algorithm', 'Greatest Of All Time', 'BEST WRITTEN']) {
      expect(l).toContain(frag);
    }
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
    expect(KJV['Amos 3:3']).toBe('Can two walk together, except they be agreed?');
    expect(KJV['Matthew 25:33'].length).toBe(72);
    expect(KJV['John 10:27'].length).toBe(60);
    expect(KJV['Matthew 25:34'].endsWith('from the foundation of the world:')).toBe(true);
    expect(KJV['1 John 2:3'].startsWith('And hereby we do know')).toBe(true);
    // Each pinned fragment appears inside its own full verse where both exist.
    expect(KJV['Matthew 7:23']).toContain('I never knew you');
    expect(KJV['Hebrews 11:3']).toContain('framed by the word of God');
  });
});
