// @vitest-environment node
// =============================================================================
// L308 — Only Yahweh Can Judge Me (DR-1476)
// =============================================================================
// A spoken teaching, Darrell 2026-11-13, the first lesson built on the parallel
// pipeline beside another (DR-1468): one file, one branch, one reserved number.
// One Judge, so study what He judges; boast in Him; hard and beautiful; people
// over money; enemies who are not really enemies; a house divided; who put the
// King on the cross; study to own, seven and also eight; the winning hand.
//
// THIS LESSON'S DANGERS are six, each gated here and each proven to catch:
//  (1) THE CROSS LAID ON ONE PEOPLE. Darrell's point is the leadership of the
//      knowledge base (Matthew 26:3-4); the whole Word puts it on Herod, Pilate,
//      the Gentiles and Israel together (Acts 4:27), on all of us (Isaiah 53:6),
//      and on His own choice (John 10:18). No sentence anywhere may pair a
//      killing word with exactly one people (DR-0098: teach the whole Word).
//  (2) TAX ADVICE. Deductions are named only beside IRS Publication 527, the
//      words "not tax advice" and a tax professional; the young bands carry none.
//  (3) GENEALOGY CLAIMS. His family's pictures are his testimony, every mention
//      defers to his uncle, and no genetic, tribal or ancestry claim is added.
//  (4) A CONVICTION DRESSED AS A STATISTIC. Eighty out of a hundred is his
//      conviction, said so in the same sentence; no percent anywhere.
//  (5) LYRICS. The song is named with its album and year; no lyric is quoted,
//      because every double-quoted span carries a Scripture reference.
//  (6) THE TWO COMMANDS MISJOINED. Darrell joined Matthew 22:39 and Matthew
//      5:44; each is quoted as itself, and a fused quotation is refused.
//
// Quote pairing splits on the quote character (DR-1258/DR-1259); the helpers
// are L306's, copied whole so the gates measure the same way.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED } from '../lib/living-lessons/ll308-only-yahweh-can-judge-me.js';
import { LIVING_LESSONS_MODULES, buildLivingLessonsSchedule } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { declaresUnchecked } from '../../../scripts/unchecked-claims.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { lengthFaults, words, ADULT_MIN, ADULT_MAX } from './new-lessons-keep-a-reader-length.test.js';
import { bareMentionsInSpokenLesson, isSpokenByDarrell } from './spoken-lessons-name-darrell.test.js';

const ID = 'll308-only-yahweh-can-judge-me';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const TITLE_LEAD = 'ONLY YAHWEH CAN JUDGE ME — study what He judges, and walk in the winning hand.';

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
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+(?: of [A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through] = m;
    const chap = chapter(book, ch);
    if (!chap) return null;
    for (let v = Number(from); v <= Number(through || from); v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
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
      const opened = bare.charAt(0).toLowerCase() + bare.slice(1);
      if (!verse.includes(bare) && !verse.includes(opened.charAt(0).toUpperCase() + opened.slice(1)) && !verse.includes(opened)) {
        faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
      }
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);
const sentencesOf = (t) => String(t).split(/(?<=[.!?])\s+(?=[A-Z"])/);

// ── (1) the cross is never laid on one people ─────────────────────────────────
const KILLING = /\b(kill(?:ed|ing|s)?|crucif\w*|murder\w*|put (?:him|Him) to death|nailed)\b/i;
const PEOPLES = /\b(Jews?|Jewish|Israel(?:ites?)?|Hebrews?|Romans?|Gentiles?|Arabs?|Africans?|Europeans?|whites?|blacks?)\b/gi;
const CANON = (g) => {
  const s = g.toLowerCase();
  if (/^(jews?|jewish|israel|israelites?|hebrews?)$/.test(s)) return 'israel';
  return s.replace(/s$/, '');
};
/** Pure. Every sentence that pairs a killing word with exactly one people, or uses the slur. */
export function crossOnOnePeople(texts) {
  const out = [];
  for (const t of texts) {
    for (const s of sentencesOf(t)) {
      if (/christ-?killers?/i.test(s)) {
        out.push(s.slice(0, 90));
        continue;
      }
      if (!KILLING.test(s)) continue;
      const groups = new Set((s.match(PEOPLES) || []).map(CANON));
      if (groups.size === 1) out.push(s.slice(0, 90));
    }
  }
  return out;
}

// ── (2) no tax advice ────────────────────────────────────────────────────────
/** Pure. Places that mention a deduction without the IRS publication, the disclaimer and the professional. */
export function taxFaults(texts) {
  const out = [];
  for (const [k, t] of Object.entries(texts)) {
    if (!/\bdeduct/i.test(t)) continue;
    if (!/Publication 527/.test(t)) out.push(`${k}: deduction without IRS Publication 527`);
    if (!/not tax advice/.test(t)) out.push(`${k}: deduction without "not tax advice"`);
    if (!/tax professional/.test(t)) out.push(`${k}: deduction without a tax professional`);
    if (/\$\s?\d|\d+\s*(?:dollars|%)/.test(t.slice(Math.max(0, t.search(/\bdeduct/i) - 300), t.search(/\bdeduct/i) + 400))) {
      out.push(`${k}: a figure beside the deduction`);
    }
  }
  return out;
}

// ── (3) his family's testimony, no genealogy claims ──────────────────────────
const HERITAGE = /\b(Native American|Indian|feathers)\b/;
const GENEALOGY_CLAIM = /\b(DNA|genetic\w*|blood quantum|tribe|tribal|Cherokee|Choctaw|Seminole|Blackfoot|Lumbee|ancestry test|descended from|percent)\b/i;
/** Pure. Heritage mentions that do not defer to his uncle, and any genealogy claim. */
export function heritageFaults(texts) {
  const out = [];
  for (const [k, t] of Object.entries(texts)) {
    if (HERITAGE.test(t) && !/\buncle\b/.test(t)) out.push(`${k}: heritage without deferring to his uncle`);
    const m = GENEALOGY_CLAIM.exec(t);
    if (m) out.push(`${k}: genealogy claim "${m[0]}"`);
  }
  return out;
}

// ── (4) a conviction, never a statistic ──────────────────────────────────────
/** Pure. Sentences that state the agreement figure without calling it his conviction. */
export function convictionFaults(texts) {
  const out = [];
  for (const t of texts) {
    for (const s of sentencesOf(t)) {
      if (/\beighty\b/i.test(s) && /\bagree/i.test(s) && !/\bconviction\b/i.test(s)) out.push(s.slice(0, 90));
    }
  }
  return out;
}

const SPINE = [
  ['James 4:12', 'There is one lawgiver, who is able to save and to destroy'],
  ['2 Timothy 2:15', 'Study to shew thyself approved unto God'],
  ['1 Corinthians 1:31', 'He that glorieth, let him glory in the Lord'],
  ['Nehemiah 8:10', 'the joy of the LORD is your strength'],
  ['Ecclesiastes 3:11', 'He hath made every thing beautiful in his time'],
  ['1 Corinthians 6:11', 'ye are washed'],
  ['Genesis 2:18', 'It is not good that the man should be alone'],
  ['Proverbs 27:17', 'Iron sharpeneth iron'],
  ['Matthew 5:44', 'Love your enemies'],
  ['Ephesians 6:12', 'we wrestle not against flesh and blood'],
  ['Luke 23:34', 'Father, forgive them; for they know not what they do'],
  ['Mark 3:25', 'if a house be divided against itself, that house cannot stand'],
  ['John 1:11', 'He came unto his own, and his own received him not'],
  ['John 10:18', 'No man taketh it from me, but I lay it down of myself'],
  ['Matthew 16:16', 'Thou art the Christ, the Son of the living God'],
  ['Proverbs 31:16', 'considereth a field, and buyeth it'],
  ['Ecclesiastes 11:2', 'Give a portion to seven, and also to eight'],
  ['Proverbs 4:7', 'with all thy getting get understanding'],
  ['Romans 8:2', 'the law of the Spirit of life in Christ Jesus'],
  ['1 Peter 1:19', 'the precious blood of Christ'],
  ['Hebrews 12:2', 'for the joy that was set before him endured the cross'],
];

describe('L308 is in the catalog, numbered, dated and whole', () => {
  it('is in the catalog exactly once, on its own number and day', () => {
    expect(L, `${ID} is not in the catalog`).toBeTruthy();
    expect(L).toBe(lesson);
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(ORDER).toBe(308);
    expect(ADDED).toBe('2026-11-13');
    expect(buildLivingLessonsSchedule().find((m) => m.id === ID).added).toBe('2026-11-13');
  });

  it('claims 308 exactly once, and sits after ll306', () => {
    const numbers = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 308)).toEqual([308]);
    const i = LIVING_LESSONS_MODULES.findIndex((m) => m.id === ID);
    const j = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll306-'));
    expect(j).toBeGreaterThan(-1);
    expect(j).toBeLessThan(i);
  });

  it('carries two parables, one light and one solemn, each on a verse that resolves', () => {
    expect(L.stories).toHaveLength(2);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
  });

  it('carries a ten-question quiz and an anchor whose every reference resolves, is named, and covers every quotation', () => {
    expect(L.quiz.questions).toHaveLength(10);
    for (const q of L.quiz.questions) {
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
    const anchors = refs.map(parse);
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

describe('a spoken lesson: his name given, his words rendered, a reader length', () => {
  it('names Darrell as the one who spoke it in every text, and carries no bare teacher', () => {
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\bDarrell spoke this lesson into the app\b/);
    expect(bareMentionsInSpokenLesson(L)).toEqual([]);
    expect(isSpokenByDarrell(L)).toBe(true);
  });

  it('names its provenance plainly, and declares what it did not check with a re-review date', () => {
    expect(L.inApp).toMatch(/Darrell spoke this lesson into the app on 2026-11-13/);
    expect(L.inApp).toMatch(/parables with invented people/);
    expect(L.lesson).toMatch(/WHAT WE DID NOT CHECK/);
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', `${ID}.js`), 'utf8');
    expect(declaresUnchecked(src)).toBe(true);
  });

  it('carries no percentage, and sits inside the reader-length band, measured not claimed', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/\d+(\.\d+)?\s?%|percent\b/);
    expect(lengthFaults(L)).toEqual([]);
    expect(words(L.lesson)).toBeGreaterThanOrEqual(ADULT_MIN);
    expect(words(L.lesson)).toBeLessThanOrEqual(ADULT_MAX);
  });
});

describe('the Word is the measure, in the lesson and in every band', () => {
  it('carries the lesson’s spine in every text', () => {
    for (const [, span] of SPINE) {
      for (const k of PLACES) expect(TEXTS[k], `${k}: ${span}`).toContain(span);
    }
  });

  it('PROVEN TO CATCH: a band that drops a spine verse is named', () => {
    const youth = L.levels.youth.replace(/"Give a portion to seven, and also to eight[^"]*" \(Ecclesiastes 11:2\)/, '');
    expect(youth).not.toBe(L.levels.youth);
    expect(SPINE.filter(([, span]) => !youth.includes(span)).map(([ref]) => ref)).toEqual(['Ecclesiastes 11:2']);
  });

  it('EVERY referenced quoted span in EVERY string is verbatim, and the sweep counts itself', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(150);
    expect(referencedCount(PLACES.map((k) => TEXTS[k]))).toBeGreaterThanOrEqual(120);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('the joy of the LORD is your strength', 'the joy of the LORD is your shield');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('every double-quoted span carries a reference: his words, and the song’s, are never put in quotes', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('Yahweh is never put inside a quotation', () => {
    const planted = EVERY_STRING.flatMap((t) => quotedPairs(t).filter((p) => /\bYahweh\b/.test(p.inside)));
    expect(planted).toEqual([]);
  });
});

describe('the two commands Darrell joined are each quoted as themselves', () => {
  it('Matthew 22:39 and Matthew 5:44 stand in the adult lesson as their own verses', () => {
    expect(L.lesson).toContain('"Thou shalt love thy neighbour as thyself" (Matthew 22:39)');
    expect(L.lesson).toMatch(/"But I say unto you, Love your enemies[^"]*" \(Matthew 5:44\)/);
    expect(L.lesson).toMatch(/Darrell joined those two teachings/);
  });

  it('PROVEN TO CATCH: a fused quotation, love your enemies as thyself, is not the verse', () => {
    expect(verbatimFaults(['"Love your enemies as thyself" (Matthew 5:44)'])).toEqual(['(Matthew 5:44) is not the verse: Love your enemies as thyself']);
  });
});

describe('(1) who put the King on the cross: the whole Word, never one people', () => {
  it('no sentence anywhere lays the cross on one people', () => {
    expect(crossOnOnePeople(EVERY_STRING)).toEqual([]);
  });

  it('every text carries all of us and His own choice; every text but the child’s carries Acts 4:27', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).toMatch(/All we like sheep have gone astray|the iniquity of us all/);
      expect(TEXTS[k], k).toContain('No man taketh it from me, but I lay it down of myself');
    }
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], k).toContain('were gathered together');
    expect(L.lesson).toContain('consulted that they might take Jesus by subtilty, and kill him');
    expect(L.lesson).toMatch(/will not let us lay the cross on one people/);
  });

  it('PROVEN TO CATCH: a planted line laying the cross on an ethnicity alone is refused', () => {
    expect(crossOnOnePeople(['The Jews killed Jesus.'])).toEqual(['The Jews killed Jesus.']);
    expect(crossOnOnePeople(['It was the Romans who crucified Him.'])).toHaveLength(1);
    expect(crossOnOnePeople(['Some call them Christ-killers.'])).toHaveLength(1);
    const planted = L.lesson.replace('So the cross is not one nation’s guilt.', 'So the Jewish leaders killed Him, and that is the end of it.');
    expect(planted).not.toBe(L.lesson);
    expect(crossOnOnePeople([planted])).toHaveLength(1);
  });

  it('and does not refuse the Word’s own roll call of everyone together', () => {
    expect(crossOnOnePeople(['Herod, Pilate, the Gentiles and the people of Israel were gathered together, and they crucified Him.'])).toEqual([]);
  });
});

describe('(2) no tax advice', () => {
  it('a deduction is named only beside IRS Publication 527, not tax advice, and a tax professional', () => {
    expect(taxFaults(TEXTS)).toEqual([]);
    expect(L.lesson).toMatch(/\bdeduct/);
    for (const k of ['child', 'youth']) expect(TEXTS[k], k).not.toMatch(/\bdeduct|\btax/i);
  });

  it('PROVEN TO CATCH: a band that loses its disclaimer, or gains a figure, is named', () => {
    const stripped = { adult: L.lesson.replace('That is not tax advice. ', '') };
    expect(stripped.adult).not.toBe(L.lesson);
    expect(taxFaults(stripped)).toEqual(['adult: deduction without "not tax advice"']);
    expect(taxFaults({ x: 'You can deduct $4,000 a year. Publication 527. That is not tax advice. See a tax professional.' })).toEqual([
      'x: a figure beside the deduction',
    ]);
  });
});

describe('(3) his family’s pictures: testimony, deferred to his uncle, no claims added', () => {
  it('every heritage mention defers to his uncle, and no genealogy claim appears anywhere', () => {
    expect(heritageFaults(TEXTS)).toEqual([]);
    expect(heritageFaults({ all: EVERY_STRING.join(' ') })).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k], k).toMatch(/\buncle\b/);
  });

  it('PROVEN TO CATCH: a planted genetic claim, or a mention without his uncle, is named', () => {
    expect(heritageFaults({ x: 'His family is part Cherokee by DNA, and his uncle knows it.' })).toEqual(['x: genealogy claim "Cherokee"']);
    expect(heritageFaults({ y: 'His family has Native American pictures.' })).toEqual(['y: heritage without deferring to his uncle']);
  });
});

describe('(4) eighty out of a hundred is his conviction, never a statistic', () => {
  it('every sentence giving the figure calls it his conviction', () => {
    expect(convictionFaults(EVERY_STRING)).toEqual([]);
    expect(L.lesson).toMatch(/as his own conviction and not as a measured number/);
  });

  it('PROVEN TO CATCH: the figure stated as fact is refused', () => {
    expect(convictionFaults(['Americans agree on about eighty out of a hundred things.'])).toHaveLength(1);
  });
});

describe('(5) the song is named, and no lyric is quoted', () => {
  it('names the song, the album and the year, and says no lyric is quoted', () => {
    expect(L.lesson).toMatch(/Tupac Shakur/);
    expect(L.lesson).toMatch(/1996 album All Eyez on Me/);
    expect(L.lesson).toMatch(/we quote none of its lyrics/);
    expect(L.inApp).toMatch(/we quote none of its lyrics/);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalized', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ')
      .replace(/\bonly God can judge me\b/gi, 'the song');

  it('no generic God, GOD or LORD in our authored voice, the song’s own title aside', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });

  it('PROVEN TO CATCH: a generic God in our voice is refused, while the song title is not', () => {
    expect(ourVoice('God judges every work.').match(/\b(God|GOD|LORD)\b/g)).toEqual(['God']);
    expect(ourVoice('Tupac sang Only God Can Judge Me.').match(/\b(God|GOD|LORD)\b/g)).toBeNull();
  });

  it('but the quotations keep God and the LORD exactly as the corpus has them', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('Study to shew thyself approved unto God');
    expect(inQuotes).toContain('the joy of the LORD is your strength');
  });

  it('never capitalizes the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span carries an ellipsis, no field prints a DR identifier, and our prose is American', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
    expect(EVERY_STRING.flatMap((t) => findBritish(ourProse(t)))).toEqual([]);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the youth friend line names youth and only youth, while the pooled check still reads green', () => {
    const youth = L.levels.youth;
    const friend = /Friends, tell one friend this week three things[^.]*\./.exec(youth);
    expect(friend, 'the youth band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, youth: youth.replace(friend[0], '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'youth', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
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
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('carries no doubled word and no ordinal sentence-opener', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });
});

describe('the thread: L305 and L306 on main, L307 by title only', () => {
  it('names the lessons it follows, and the least-pay testimony it takes up', () => {
    for (const id of ['ll305-search-me-and-know-my-heart', 'll306-the-path-of-the-just-shineth']) {
      expect(
        LIVING_LESSONS_MODULES.some((m) => m.id === id),
        id
      ).toBe(true);
    }
    expect(L.lesson).toMatch(/Search Me and Know My Heart/);
    expect(L.lesson).toMatch(/The Path of the Just Shineth/);
    expect(L.lesson).toMatch(/Love Walks With You on the Training Ground/);
    expect(L.lesson).toMatch(/took the least pay on a team even when he was the best on it/);
  });
});
