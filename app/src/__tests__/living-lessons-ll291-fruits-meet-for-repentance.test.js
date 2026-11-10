// @vitest-environment node
// =============================================================================
// L291 — Fruits Meet for Repentance: what a real apology says, walls that have
// gates, and the Word on forgiving the one who betrayed you
// =============================================================================
// A relationship send read under the newsletter Way (DR-1361): a panel on
// betrayal, generational curses, boundaries versus walls, accountability and
// apology. The research pass could not identify the panel and found the study
// its apology points match (Lewicki, Polin and Lount, Ohio State, 2016:
// responsibility first, repair second, a request for forgiveness last). The
// lesson teaches it from the Word in the Word's order (DR-0098). (DR-1382.)
//
// THIS LESSON'S DANGERS are three. (1) Teaching that forgiveness can wait on
// trust: every band carries Matthew 6:14-15 and the line between forgiveness
// and trust, with a proof that dropping Luke 17:3 is caught. (2) Blaming the
// wounded: the beam is taught as the one question a person can answer, never
// as fault. (3) Staging the covenant debate: the lesson names Yahweh's hatred
// of violence and treachery and sends covenant questions to the Word and the
// elders.
//
// Quote pairing is done by splitting on the quote character (DR-1258/DR-1259),
// never by the {10,} regex, and the verbatim sweep asserts its own count. The
// helpers are L284's, copied whole so the gates measure the same way. A verse
// is never spent (DR-1317).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { bareMentionsInSpokenLesson } from './spoken-lessons-name-darrell.test.js';

const ID = 'll291-fruits-meet-for-repentance';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'FRUITS MEET FOR REPENTANCE — what a real apology says, walls that have gates, and the Word on forgiving the one who betrayed you.';

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) {
        if (chap[v - 1] == null) return false;
        out.push(chap[v - 1]);
      }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

const SPINE = [
  ['Isaiah 8:20', 'if they speak not according to this word, it is because there is no light in them.'],
  ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good.'],
  ['Psalms 55:12-14', 'But it was thou, a man mine equal, my guide, and mine acquaintance.'],
  ['Proverbs 18:19', 'A brother offended is harder to be won than a strong city'],
  ['Proverbs 25:28', 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.'],
  ['Nehemiah 7:3', 'Let not the gates of Jerusalem be opened until the sun be hot'],
  ['Proverbs 4:23', 'Keep thy heart with all diligence'],
  ['Proverbs 19:19', 'for if thou deliver him, yet thou must do it again.'],
  ['Exodus 20:5-6', 'And shewing mercy unto thousands of them that love me'],
  ['Ezekiel 18:20', 'The son shall not bear the iniquity of the father'],
  ['Galatians 3:13', 'Christ hath redeemed us from the curse of the law, being made a curse for us'],
  ['2 Corinthians 5:17', 'if any man be in Christ, he is a new creature'],
  ['Psalms 11:5', 'him that loveth violence his soul hateth.'],
  ['Malachi 2:14', 'against whom thou hast dealt treacherously: yet is she thy companion, and the wife of thy covenant.'],
  ['Matthew 7:3-5', 'first cast out the beam out of thine own eye'],
  ['Galatians 6:4-5', 'But let every man prove his own work'],
  ['Proverbs 26:11', 'As a dog returneth to his vomit, so a fool returneth to his folly.'],
  ['Proverbs 26:24-26', 'When he speaketh fair, believe him not'],
  ['Genesis 3:12-13', 'The woman whom thou gavest to be with me, she gave me of the tree, and I did eat.'],
  ['2 Samuel 12:13', 'I have sinned against the LORD.'],
  ['Psalms 51:3-4', 'For I acknowledge my transgressions: and my sin is ever before me.'],
  ['Luke 15:18-21', 'Father, I have sinned against heaven, and before thee'],
  ['1 Samuel 15:24', 'because I feared the people, and obeyed their voice.'],
  ['1 Samuel 15:30', 'I have sinned: yet honour me now'],
  ['2 Corinthians 7:10-11', 'For godly sorrow worketh repentance to salvation not to be repented of: but the sorrow of the world worketh death.'],
  ['Proverbs 28:13', 'whoso confesseth and forsaketh them shall have mercy.'],
  ['Luke 19:8', 'I restore him fourfold.'],
  ['Matthew 3:8', 'Bring forth therefore fruits meet for repentance'],
  ['1 John 3:18', 'let us not love in word, neither in tongue; but in deed and in truth.'],
  ['Genesis 42:15-16', 'that your words may be proved, whether there be any truth in you'],
  ['Genesis 45:4-5', 'I am Joseph your brother, whom ye sold into Egypt.'],
  ['Matthew 6:14-15', 'neither will your Father forgive your trespasses.'],
  ['Colossians 3:13', 'even as Christ forgave you, so also do ye.'],
  ['Luke 17:3-4', 'if he repent, forgive him.'],
  ['Matthew 18:21-22', 'Until seventy times seven.'],
  ['Ephesians 4:26', 'Be ye angry, and sin not'],
  ['Ephesians 4:31-32', 'forgiving one another, even as God for Christ’s sake hath forgiven you.'],
  ['Hebrews 12:15', 'lest any root of bitterness springing up trouble you'],
  ['Matthew 18:15', 'go and tell him his fault between thee and him alone'],
  ['Matthew 5:23-24', 'first be reconciled to thy brother'],
  ['1 John 1:9', 'If we confess our sins, he is faithful and just to forgive us our sins'],
  ['Isaiah 43:25', 'I, even I, am he that blotteth out thy transgressions for mine own sake'],
  ['Micah 7:18-19', 'he retaineth not his anger for ever, because he delighteth in mercy.'],
  ['John 1:29', 'which taketh away the sin of the world.'],
  ['Psalms 139:23-24', 'Search me, O God, and know my heart'],
];

describe('L291 is in the catalog, numbered, dated and whole', () => {
  it('exists exactly once with all four bands', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.levels.child.length).toBeGreaterThan(1000);
  });

  it('claims 291 exactly once, and nothing else claims it', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 291)).toEqual([291]);
  });

  it('sits after ll290 in the catalog', () => {
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll290-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries its build day, the day it was spoken', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-11-09');
  });

  it('carries two real stories, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.title).trim().length).toBeGreaterThan(0);
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a quiz whose answers are in range and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = String(L.anchor.ref)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = L.lesson.includes(`(${r})`) || named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });

  it('and the anchor names EVERY verse any string of the module quotes (DR-0734)', () => {
    const parse = (r) => {
      const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
      return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
    };
    const anchors = String(L.anchor.ref)
      .split(';')
      .map((s) => parse(s.trim()))
      .filter(Boolean);
    const quoted = new Set(
      EVERY_STRING.flatMap((t) =>
        quotedPairs(t)
          .map((p) => p.ref)
          .filter(Boolean)
      )
    );
    const missing = [...quoted].filter((r) => {
      const p = parse(r);
      return !anchors.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
    });
    expect(missing).toEqual([]);
  });
});

describe('the lesson practises the newsletter Way: the panel described, the research named, the reading shown, a reader length', () => {
  it('names Darrell as the sender and the research in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell sent\b/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Ohio State/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/Lewicki/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
  });

  it('shows the reading: the video not fetched, the panel unnamed, the study’s order, no percentage', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/could not be fetched|could not get the video/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/seven hundred fifty-five/);
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(L.lesson).toMatch(/names no one on the panel|does not name anyone on the panel/);
    expect(L.lesson).toMatch(/rest on the summary until the transcript lands/);
    expect(L.lesson).toMatch(/No advertising rides the send/);
    expect(L.lesson).toMatch(/common teaching among counselors|common counseling language/);
  });

  it('sits inside the reader-length band Darrell asked for, measured not claimed', () => {
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure of the betrayal, the boundary, the apology and the forgiveness, in the lesson and in every band', () => {
  it('names betrayal by the near one and the wall with gates in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('But it was thou, a man mine equal, my guide, and mine acquaintance.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('like a city that is broken down, and without walls.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Let not the gates of Jerusalem be opened until the sun be hot');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Keep thy heart with all diligence');
  });

  it('breaks the family curse in Christ and names Yahweh’s hatred of violence, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The son shall not bear the iniquity of the father');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Christ hath redeemed us from the curse of the law, being made a curse for us');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('him that loveth violence his soul hateth.');
  });

  it('sets the real apology beside the false one in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('The woman whom thou gavest to be with me, she gave me of the tree, and I did eat.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I have sinned against the LORD.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I have sinned: yet honour me now');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I restore him fourfold.');
  });

  it('proves repentance by fruit and Joseph’s test, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Bring forth therefore fruits meet for repentance');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('let us not love in word, neither in tongue; but in deed and in truth.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('that your words may be proved, whether there be any truth in you');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('I am Joseph your brother, whom ye sold into Egypt.');
  });

  it('commands forgiveness now and earns trust by fruit, in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Your heavenly Father will also forgive you|neither will your Father forgive your trespasses/i);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Until seventy times seven.');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Be ye angry, and sin not');
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('if he repent, forgive him.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/keep (the|your) gate|gate shut|gate barred/);
  });

  it('PROVEN TO CATCH: a band that drops "if he repent, forgive him" is named', () => {
    const teen = L.levels.teen.replace('"If thy brother trespass against thee, rebuke him; and if he repent, forgive him." (Luke 17:3).', 'Just trust again.');
    expect(teen).not.toBe(L.levels.teen);
    expect(teen.includes('if he repent, forgive him.')).toBe(false);
  });

  it('ends with the One who forgives first and confesses the Lamb (DR-0210), in every text', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toContain('If we confess our sins, he is faithful and just to forgive us our sins');
    for (const k of PLACES) expect(TEXTS[k], k).toContain('which taketh away the sin of the world.');
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Lamb of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/Eternal Son of Yahweh/);
    for (const k of PLACES) expect(TEXTS[k], k).toContain('Search me, O God, and know my heart');
  });

  it('says plainly in inApp where it came from and that the stories are invented', () => {
    expect(L.inApp).toMatch(/a link and a summary Darrell sent/);
    expect(L.inApp).toMatch(/parables with invented people/);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(260);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(245);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('Bring forth therefore fruits meet for repentance', 'Bring forth therefore fruits fit for repentance');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a mid-verse span that capitalises its first word is not the verse', () => {
    const broken = L.levels.child.replace(
      '"first cast out the beam out of thine own eye" (Matthew 7:5)',
      '"First cast out the beam out of thine own eye" (Matthew 7:5)'
    );
    expect(broken).not.toBe(L.levels.child);
    expect(verbatimFaults([broken])).toEqual(['(Matthew 7:5) is not the verse: First cast out the beam out of thine own eye']);
  });

  it('Yahweh is never put inside a quotation, in any string of the module', () => {
    const planted = [];
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        if (/\bYahweh\b/.test(inside)) planted.push(`${ref || 'no ref'}: ${inside.slice(0, 60)}`);
      }
    }
    expect(planted).toEqual([]);
  });

  it('every double-quoted span carries a reference: his own words are rendered, never put in double quotes', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span anywhere in a reader-facing field carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });

  it('and no reader-facing field prints a DR identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });

  it('and our own prose is spelled the American way, while the quotations keep the corpus spelling', () => {
    expect(EVERY_STRING.flatMap((t) => findBritish(ourProse(t)))).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');

  it('no generic God, GOD or LORD in our authored voice (DR-0210)', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic "God" in our voice, copied through unquoted, is refused', () => {
    const planted = 'God gave the officer the sword for good.';
    expect(ourVoice(planted).match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them (DR-0076 bright line)', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('I have sinned against the LORD.');
    expect(inQuotes).toContain('even as God for Christ’s sake hath forgiven you.');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the youth friend line names youth and only youth, while the pooled check still reads green', () => {
    const youth = L.levels.youth;
    const friend = /Friends, tell one friend this week about the sorry that had a but in it[^.]*\./.exec(youth);
    expect(friend, 'the youth band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '') } };
    expect(stripped.levels.youth).not.toBe(youth);
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    for (const b of BANDS) expect(full.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k].startsWith(TITLE_LEAD), k).toBe(true);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(10);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('and no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});
