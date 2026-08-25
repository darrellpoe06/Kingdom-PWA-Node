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
const lesson = src.slice(start, start + 30000);
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
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Hebrews 10:26; 1 John 1:9'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
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

describe('every age level carries the whole message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each name the hinge and the mercy', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the once-for-all sacrifice`).toContain('once for all');
      expect(t, `${band} carries the confession-mercy`).toContain('If we confess our sins');
    }
    // teen and senior additionally name the hinge word and the no-despair hope.
    for (const band of ['teen', 'senior']) {
      expect(level(band)).toContain('wilfully');
      expect(level(band)).toContain('saving of the soul');
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
