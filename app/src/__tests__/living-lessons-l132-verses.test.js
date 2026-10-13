// @vitest-environment node
// =============================================================================
// L132 — The Whole Salvation Plan From Genesis Alone. Verbatim KJV, and the
// claims this lesson may never lose.
// =============================================================================
// Spoken into the app by Darrell on 2026-09-08: how do you see the whole
// salvation plan from the Godhead inside Genesis only — all of it from Genesis —
// and see our enemies named early in the narratives of the first five books; and
// then, sharpening it minutes later, so we can see the Father, the Son and the
// Holy Spirit working together against the enemies, especially the devil.
//
// THE RESTRICTION IS THE ARGUMENT, so the gate enforces it mechanically. If the
// plan is really Yahweh's from the beginning it must be legible from Genesis
// ALONE — so this file proves that every book cited in the lesson body is one of
// the first five, and that the plan verses are Genesis. A later session that
// "strengthens" the lesson by reaching for Isaiah 53 or John 3 would dissolve
// the very thing being demonstrated, and that is exactly what fails here.
//
// The gate pins four things. (1) Every double-quoted span is verbatim KJV from
// the in-repo corpus, single-verse only — proven-to-catch below on this lesson's
// own material: Genesis 1:1 welded to 1:2 is NOT corpus text. (2) The Torah-only
// restriction holds. (3) The spine cannot drift: the Three on page one, the
// adversary's three moves in order, Genesis 3:15 as a sentence passed on the
// enemy, the covering Yahweh made, faith counted in 15:6, the covenant Yahweh
// walked alone, the Lamb provided, and the Three working as one. (4) The house
// rules: Yahweh in our voice, quoted "God" untouched, adversary names lowercase.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll132-the-whole-salvation-plan-inside-genesis-alone-and-the-godhead-at-war-with-the-enemies-from-the-first-pages';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
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

// Deliberately EMPTY: every double-quoted span in L132 is verbatim KJV. Our own
// emphasis uses capitals, never quotes (DR-0331).
const NOT_SCRIPTURE = [];

describe('L132 is registered with its full shape', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('the module exists and is in the live series', () => {
    expect(start, 'L132 must be present in the source').toBeGreaterThan(-1);
    expect(m, 'L132 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Genesis 1:1-3/);
    expect(m.anchor.ref).toMatch(/Genesis 3:15/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

  it('child, teen and senior levels are all authored, and none is a stub', () => {
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    expect(typeof m.lesson, 'L132 must carry a base lesson for the adult band').toBe('string');
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId, 'the adult band must resolve to its own depth').toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('each band gets genuinely different prose, not the same text relabelled', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child).not.toBe(m.levels.senior);
    expect(m.levels.child.length, 'a child does not read an adult wall of text').toBeLessThan(m.levels.senior.length);
  });

  it('the child level teaches the Three, the lie, the promise and the covering — warmly', () => {
    const c = m.levels.child;
    expect(c, 'a child is shown the Spirit in verse two').toContain('And the Spirit of God moved upon the face of the waters.');
    expect(c, 'a child hears the Us of Genesis 1:26').toContain('Let us make man in our image, after our likeness');
    expect(c, 'a child is told the first lie plainly').toContain('Ye shall not surely die');
    expect(c, 'a child is given the promise').toContain('it shall bruise thy head, and thou shalt bruise his heel');
    expect(c, 'a child is shown the covering').toContain('coats of skins');
    expect(c, 'a child is left with Jesus as the Lamb').toMatch(/Jesus is the Lamb/);
    expect(c, 'the head/heel difference is explained at a child register').toMatch(/A sore heel gets better/);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('every double-quoted span is verbatim KJV from the in-repo corpus (single-verse spans)', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(150);
    const bad = spans.filter((s) => !NOT_SCRIPTURE.includes(s) && !WHOLE_KJV.includes(s));
    expect(bad, `not verbatim KJV:\n${bad.map((b) => `  "${b}"`).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH — a welded two-verse span is not corpus text, so the gate would refuse it', () => {
    // Genesis 1:1 and 1:2 are quoted separately throughout the lesson; welded
    // into one span they are not verbatim (the corpus keeps the verse boundary).
    expect(WHOLE_KJV.includes('In the beginning God created the heaven and the earth.')).toBe(true);
    expect(WHOLE_KJV.includes('And the Spirit of God moved upon the face of the waters.')).toBe(true);
    expect(WHOLE_KJV.includes('In the beginning God created the heaven and the earth. And the earth was without form')).toBe(false);
  });
});

describe('the restriction Darrell set IS the argument, so it is enforced', () => {
  // Darrell, sharpening it mid-build: supporting verses from outside the first
  // five books are welcome for MEANING and CONTEXT, "because there are people
  // who don't accept anything outside of the first 5 books". That makes the
  // Torah-only case an APOLOGETIC, and an apologetic only works if it is
  // genuinely self-sufficient. So the gate enforces the SPLIT, not a blanket
  // ban: the case may cite nothing but the first five books, and the outside
  // witnesses live in a part explicitly marked as removable.
  //
  // Scoped to the LESSON BODY via the module object rather than the raw source:
  // the teen and senior levels legitimately carry the same confirmations, and
  // the quiz and facilitator sit after the lesson in the file, so slicing the
  // source text at the marker would have measured the wrong thing.
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  const MARKER = 'PART NINE — SUPPORTING WITNESSES FROM OUTSIDE THE FIRST FIVE BOOKS';
  const cut = m.lesson.indexOf(MARKER);
  const theCase = cut > -1 ? m.lesson.slice(0, cut) : m.lesson;
  const support = cut > -1 ? m.lesson.slice(cut) : '';

  const TORAH = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
  const BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 'Samuel',
    'Kings', 'Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Jonah',
    'Micah', 'Habakkuk', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', 'Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Thessalonians',
    'Timothy', 'Titus', 'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
  ];

  it('the supporting part exists and is marked CONFIRMATION, never foundation', () => {
    expect(cut, 'the outside witnesses must live in their own marked part').toBeGreaterThan(-1);
    expect(support).toMatch(/Delete this part entirely and Parts One through Eight are untouched/);
    expect(support).toMatch(/different in KIND/);
    expect(support, 'the reason for the restriction is stated for the reader').toMatch(/who receive only the first five books/);
  });

  it('THE CASE cites ONLY the first five books — it must stand for a reader who receives only those', () => {
    const cited = [...new Set(BOOKS.filter((b) => new RegExp(`\\b${b}\\b`).test(theCase)))];
    const outside = cited.filter((b) => !TORAH.includes(b));
    expect(outside, `the Torah-only case must not borrow from outside the first five books; found: ${outside.join(', ')}`).toEqual([]);
    expect(cited).toContain('Genesis');
  });

  it('the outside witnesses are real, and they live in the supporting part', () => {
    for (const ref of ['Revelation 12:9', 'John 8:44', 'John 1:1', 'John 1:29', 'Romans 4:3', 'Galatians 3:8']) {
      expect(support, `${ref} belongs in the supporting part`).toContain(ref);
    }
  });

  it('the teen and senior levels teach the same distinction — confirmation, not foundation', () => {
    expect(m.levels.teen).toMatch(/only accept the first five books/);
    expect(m.levels.teen).toMatch(/With someone who does not, you still have the whole case/);
    expect(m.levels.senior).toMatch(/Confirmations, not foundations/);
    expect(m.levels.senior).toMatch(/Take away every one of them and Genesis still holds the plan/);
  });

  it('the salvation-plan spine is drawn from Genesis specifically', () => {
    for (const ref of ['Genesis 1:1', 'Genesis 1:2', 'Genesis 1:3', 'Genesis 1:26', 'Genesis 3:15',
      'Genesis 3:21', 'Genesis 15:6', 'Genesis 22:8', 'Genesis 49:10', 'Genesis 50:20']) {
      expect(l, `${ref} is part of the Genesis spine`).toContain(ref);
    }
  });

  it('the enemies are drawn from across the first five books, not Genesis only', () => {
    for (const ref of ['Exodus 12:12', 'Exodus 7:11', 'Leviticus 17:7', 'Leviticus 18:21',
      'Numbers 25:3', 'Deuteronomy 32:17']) {
      expect(theCase, `${ref} is part of the enemy roll`).toContain(ref);
    }
  });
});

describe('the spine of the teaching cannot drift out', () => {
  it('the Three are shown on page one, in the order the text gives them', () => {
    const father = l.indexOf('In the beginning God created the heaven and the earth.');
    const spirit = l.indexOf('And the Spirit of God moved upon the face of the waters.');
    const word = l.indexOf('And God said, Let there be light: and there was light.');
    expect(father).toBeGreaterThan(-1);
    expect(spirit).toBeGreaterThan(father);
    expect(word).toBeGreaterThan(spirit);
    expect(l, 'the Spirit is named as being in the SECOND verse').toMatch(/SECOND verse/);
  });

  it('the plural of the Godhead is carried by TWO witnesses inside three chapters', () => {
    expect(l).toContain('Let us make man in our image, after our likeness');
    expect(l).toContain('the man is become as one of us');
  });

  it('the adversary’s three moves are named in order', () => {
    const q = l.indexOf('Yea, hath God said, Ye shall not eat of every tree of the garden?');
    const c = l.indexOf('Ye shall not surely die');
    const p = l.indexOf('ye shall be as gods, knowing good and evil');
    expect(q).toBeGreaterThan(-1);
    expect(c).toBeGreaterThan(-1);
    expect(p).toBeGreaterThan(-1);
    expect(l).toMatch(/MOVE ONE, A QUESTION ABOUT THE WORD/);
    expect(l).toMatch(/MOVE TWO, THE FLAT CONTRADICTION/);
    expect(l).toMatch(/MOVE THREE, THE PROMOTION/);
    expect(l, 'he is a made creature, never an equal power').toMatch(/made, not eternal, not a rival power/);
  });

  it('Yahweh SEEKS before He sentences — the order of Genesis 3 is taught', () => {
    expect(l).toContain('And the LORD God called unto Adam, and said unto him, Where art thou?');
    expect(l).toMatch(/YAHWEH SEEKS BEFORE HE SENTENCES/);
  });

  it('Genesis 3:15 is taught as a sentence passed ON the enemy, with the two injuries weighed', () => {
    expect(l).toContain('And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.');
    expect(l).toMatch(/ANNOUNCED TO THE ENEMY AS HIS SENTENCE/);
    expect(l).toMatch(/A crushed head ends the creature; a bruised heel heals/);
  });

  it('the first death is taught as a covering Yahweh provided, not a penalty extracted', () => {
    expect(l).toContain('Unto Adam also and to his wife did the LORD God make coats of skins, and clothed them.');
    expect(l).toMatch(/a covering He provided, not a penalty He extracted/);
    expect(l, 'the way to the tree of life is KEPT, not demolished').toContain('to keep the way of the tree of life');
  });

  it('the Genesis gospel elements are each present and named', () => {
    expect(l).toContain('And he believed in the LORD; and he counted it to him for righteousness.');
    expect(l).toMatch(/Counted — a ledger word/);
    expect(l).toContain('behold a smoking furnace, and a burning lamp that passed between those pieces');
    expect(l).toMatch(/the human side never walked it/);
    expect(l).toContain('My son, God will provide himself a lamb for a burnt offering: so they went both of them together.');
    expect(l).toContain('in the stead of his son');
    expect(l).toContain('But Noah found grace in the eyes of the LORD.');
    expect(l).toContain('The sceptre shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh come');
    expect(l).toContain('to save much people alive');
  });

  it('the Three are shown working together against the enemies — the thing Darrell asked to see', () => {
    expect(l).toMatch(/THE THREE WORKING TOGETHER AGAINST THEM/);
    expect(l).toMatch(/THE FATHER purposes/);
    expect(l).toMatch(/THE SON is the promised Seed/);
    expect(l).toMatch(/THE HOLY SPIRIT moves on the deep/);
    // One operation, never at odds — the pastoral payoff.
    expect(l).toMatch(/never once at odds/);
    expect(l).toMatch(/one Person of the Godhead is on your side and another needs persuading/);
    // Each Person is evidenced from the Torah itself.
    expect(l).toContain('The LORD shall fight for you, and ye shall hold your peace.');
    expect(l).toContain('provoke him not; for he will not pardon your transgressions: for my name is in him');
    expect(l).toContain('And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,');
  });

  it('the Torah names the enemies, and the lesson refuses to speculate past the text', () => {
    expect(l).toContain('the sons of God saw the daughters of men that they were fair');
    expect(l).toMatch(/names them without explaining them, and the honest thing is to stay where the text stays/);
    expect(l).toContain('They sacrificed unto devils, not to God; to gods whom they knew not, to new gods that came newly up, whom your fathers feared not.');
  });

  it('DR-0098 — the Word is taught, not a debate staged (no camps, no both-sides)', () => {
    expect(/scholars (?:disagree|debate)|some (?:say|argue)|two views|you decide/i.test(l)).toBe(false);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0076)', () => {
  const ours = (() => {
    const { spans } = quotedSpans(l);
    let out = l.replace(/\\'/g, "'");
    for (const s of spans) out = out.split(`"${s}"`).join(' ');
    return out;
  })();

  it('DR-0210 — our authored voice names Yahweh, never the generic "God"', () => {
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
  });

  it('DR-0210 — Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    expect(ours).toMatch(/Lamb of Yahweh/);
    expect(ours).toMatch(/Eternal Son of Yahweh/);
  });

  it('quoted "God" and "LORD" stay EXACTLY as the KJV prints them (DR-0076 bright line)', () => {
    expect(l, 'no Yahweh substituted into a quotation').toContain('In the beginning God created the heaven and the earth.');
    expect(l).toContain('And the Spirit of God moved upon the face of the waters.');
    expect(l).toContain('against all the gods of Egypt I will execute judgment: I am the LORD.');
  });

  it('the adversary and false-god names are never capitalized in our voice', () => {
    for (const bad of ['Satan', 'Lucifer', 'Baal', 'Baalpeor', 'Devil', 'Dragon', 'Adversary', 'Molech', 'Serpent']) {
      expect((ours.match(new RegExp(`\\b${bad}\\b`, 'g')) || []).length, bad).toBe(0);
    }
    expect(ours, 'the adversary is named in our voice, lowercase').toMatch(/the adversary/);
  });
});
