// L309 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Below it, what is particular to this lesson
// (DR-1479): it was built from personal hiring email, so PRIVACY is pinned
// closed, and the two places this lesson could drift from the Word are pinned.
//
// PRIVACY, without leaking what it guards. The forbidden list is written as
// SHAPES, never as the withheld strings themselves: meeting links and numbers,
// passcodes, phone numbers, money, clock times, calendar dates and weekdays,
// institution words, the sender's name. Names the builder never saw cannot be
// listed, so the check is CLOSED-WORLD: every capitalised word in our own voice
// must be a word the lesson also uses in lower case (an ordinary word starting a
// sentence or a heading) or one named in KNOWN below (the Word's names, the
// parables' invented people). Any other proper name, whoever it belongs to,
// fails the build.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll309-he-shall-stand-before-kings.js';
import { livingLessonGate, stringsOf, textsOf, quotedPairs, ourVoice } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll309-he-shall-stand-before-kings',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 309,
  added: '2026-11-13',
  spine: [
    ['Proverbs 22:29', 'he shall stand before kings'],
    ['Genesis 41:16', 'It is not in me: God shall give Pharaoh an answer of peace'],
    ['Daniel 6:3', 'an excellent spirit was in him'],
    ['Nehemiah 2:4', 'So I prayed to the God of heaven'],
    ['1 Peter 3:15', 'be ready always to give an answer'],
    ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him'],
    ['Romans 12:3', 'not to think of himself more highly than he ought to think'],
    ['Proverbs 12:22', 'they that deal truly are his delight'],
    ['Philippians 4:6', 'Be careful for nothing'],
    ['Colossians 3:23', 'as to the Lord, and not unto men'],
    ['Proverbs 16:9', 'the LORD directeth his steps'],
  ],
});

const EVERY = stringsOf(lesson);
const ALL = EVERY.join('\n');
const TEXTS = textsOf(lesson);

// Shapes of what the source email held. None of these may appear anywhere in the module.
const FORBIDDEN_SHAPES = [
  ['a web link', /https?:\/\/|www\.|\.(?:com|edu|org|gov|us|net)\b/i],
  ['a video-meeting service', /\b(?:zoom|webex|teams\.microsoft|meet\.google|gotomeeting)\b/i],
  ['a meeting number or passcode', /\b(?:meeting id|passcode|password|pin)\b|\b\d{3}[ -]?\d{3,4}[ -]?\d{3,4}\b|\d{6,}/i],
  ['a phone number', /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b|\+\d/],
  ['money or a salary', /\$|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?k\b|\b(?:salary|per annum|per hour|hourly rate|pay grade|pay range)\b/i],
  ['a clock time', /\b\d{1,2}(?::\d{2})?\s?(?:a\.?m\.?|p\.?m\.?)(?!\w)|\b(?:CST|CDT|CT|EST|EDT|PST|PDT|UTC)\b|\bo’?'?clock\b/i],
  [
    'a calendar date or weekday',
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b20\d{2}-\d{2}-\d{2}\b/,
  ],
  ['an institution word', /\b(?:university|college|campus|department|requisition|job id|posting number|human resources|HR)\b/i],
  ['a minutes-long meeting length', /\b\d+[- ]minute\b|\bthirty[- ]minute\b/i],
  ['the owner who forwarded it', /\bDarrell\b|\bPoe\b/],
];

const shapeHits = (text) => FORBIDDEN_SHAPES.filter(([, re]) => re.test(text)).map(([name]) => name);

// Capitalised words that are not ordinary words: the Word's names and titles, the
// parables' invented people and places, and the lesson's own terms.
const KNOWN = new Set(
  (
    'Yahweh Jesus Christ Lord Holy Spirit Son Eternal Lamb Word Bible He His Him You I ' +
    'Joseph Pharaoh Egypt Daniel Darius Babylon Nehemiah Peter Paul James Proverbs Genesis Luke Romans Matthew Philippians Colossians Timothy Isaiah Psalms Thessalonians ' +
    'STAR Resources Wisdom Understanding Knowledge Kids Children Parents Grandparents ' +
    'Marisol Reyes San Antonio Texas Wanjiru Kamau Nairobi Kenya'
  ).split(/\s+/)
);

// Ordinary words this lesson only ever uses to open a sentence (so never in lower case).
const ORDINARY = new Set(
  (
    'Provenance Everyone Notice Even Nerves Maybe Folly Pack Lay Someday Raiment Online Inflating Highlight ' +
    'Behavioral Rehearse Hear Weigh Smile Always Fifty Seven Eight Grown-ups English Speak Include Owning Making'
  ).split(/\s+/)
);

/**
 * Every capitalised word in our own voice (quotations and references removed)
 * that is not a CAPITALS heading word, not KNOWN, not used elsewhere in lower
 * case, and not one of the ORDINARY sentence openers. Empty means the lesson
 * names no one it does not account for, wherever in a sentence the name sits.
 */
export function unknownNames(strings) {
  const voice = strings.map((t) => ourVoice(t).replace(/\([^)]*\)/g, ' '));
  const lower = new Set(strings.join(' ').match(/\b[a-z][a-z’'-]*\b/g) || []);
  const out = new Set();
  for (const t of voice) {
    for (const w of t.match(/\b[A-Z][A-Za-z’'-]*\b/g) || []) {
      const bare = w.replace(/[’'](?:s)?$/, '');
      if (bare.length > 1 && bare === bare.toUpperCase() && bare !== 'HR') continue;
      if (KNOWN.has(bare) || ORDINARY.has(bare) || lower.has(bare.toLowerCase())) continue;
      out.add(bare);
    }
  }
  return [...out];
}

describe('L309 is private by construction: nothing of the source email reaches the reader', () => {
  it('carries no link, meeting number, passcode, phone, money, time, date, weekday, institution word or owner name', () => {
    expect(shapeHits(ALL)).toEqual([]);
    expect(shapeHits(String(UNCHECKED).replace(/re-review: \d{4}-\d{2}-\d{2}/, ''))).toEqual([]);
  });

  it('carries no proper name the lesson does not account for (closed world)', () => {
    expect(unknownNames(EVERY)).toEqual([]);
  });

  it('PROVEN TO CATCH: each forbidden shape, planted, is named', () => {
    const plants = [
      ['a web link', 'Join at https://example.invalid/j/1'],
      ['a video-meeting service', 'The panel meets on Zoom.'],
      ['a meeting number or passcode', 'Meeting ID 812 3456 7890.'],
      ['a phone number', 'Call (555) 010-0199 if lost.'],
      ['money or a salary', 'The role pays $85,000.'],
      ['a clock time', 'Be online by 9:30 AM CST.'],
      ['a calendar date or weekday', 'The panel is on Tuesday.'],
      ['an institution word', 'The University wrote back.'],
      ['a minutes-long meeting length', 'A 30-minute panel.'],
      ['the owner who forwarded it', 'Darrell was scheduled.'],
    ];
    for (const [name, text] of plants) expect(shapeHits(`${lesson.lesson} ${text}`), name).toContain(name);
  });

  it('PROVEN TO CATCH: a stranger’s name planted in our voice is named, while the same word inside a quotation is left alone', () => {
    const planted = `${lesson.levels.teen} Ask Quillfeather on the panel about the team.`;
    expect(unknownNames([planted])).toContain('Quillfeather');
    expect(unknownNames([...EVERY, 'The chair, Mrs. Ambervale, will lead.'])).toEqual(['Mrs', 'Ambervale']);
    expect(unknownNames([...EVERY, 'Ambervale will lead the panel.'])).toEqual(['Ambervale']);
    expect(unknownNames(['"Then this Daniel was preferred" (Daniel 6:3)'])).toEqual([]);
  });

  it('the occasion is described only generically, in the provenance and the opening', () => {
    expect(lesson.inApp).toMatch(/project-management role/);
    expect(lesson.inApp).toMatch(/withheld by design/);
    expect(lesson.lesson).toMatch(/withheld by design/);
  });
});

describe('L309 keeps the Word in its own place', () => {
  it('every text carries the written screen told truly and the two-level answer given soberly', () => {
    for (const [k, t] of Object.entries(TEXTS)) {
      expect(t, `${k}: questionnaire or form`).toMatch(/questionnaire|form/);
      expect(t, `${k}: Proverbs 19:5`).toContain('he that speaketh lies shall not escape');
      expect(t, `${k}: Romans 12:3`).toContain('not to think of himself more highly than he ought to think');
    }
  });

  it('Matthew 10:19-20 is never offered as a reason to skip preparing: wherever it is quoted, Matthew 10:18 (for my sake) is named beside it', () => {
    for (const [k, t] of Object.entries(TEXTS)) {
      const quotesIt = quotedPairs(t).some((p) => p.ref && /^Matthew 10:(?:18-)?19/.test(p.ref));
      if (!quotesIt) continue;
      expect(t, k).toMatch(/Matthew 10:18/);
      expect(t, k).toMatch(/for His sake|for His name/);
      expect(t, k).toMatch(/not a reason to skip preparing|never a reason to arrive unprepared|never meant as a reason/);
    }
  });

  it('1 Peter 3:15 is taught first for the hope in Jesus before it is carried into the room', () => {
    for (const [k, t] of Object.entries(TEXTS)) expect(t, k).toMatch(/hope[^.]{0,40}Jesus|Jesus[^.]{0,40}hope/);
  });

  it('Jesus is confessed as the Lamb of Yahweh and His Eternal Son in the adult lesson', () => {
    expect(lesson.lesson).toContain('Jesus, the Lamb of Yahweh and His Eternal Son');
  });
});
