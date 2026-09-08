// @vitest-environment node
// =============================================================================
// L135 — They Called Every One of Them George. Verbatim KJV, and the fences
// this lesson is bound by.
// =============================================================================
// Built from a telling Darrell brought in on Labor Day 2026 about the Pullman
// porters: men hired out of slavery to staff sleeping cars, addressed by
// passengers as George — the company owner's first name — because learning a
// name costs something and a function is free.
//
// THE WELD WAS NOT MANUFACTURED, AND THIS FILE PINS IT. The KJV word for the man
// at the door of the sheepfold is PORTER, and the sentence it sits in is about
// being called by name (John 10:3). In the house of Yahweh the porters are an
// ordained Levitical office whose names Scripture writes down (1 Chronicles
// 9:17, 9:22). That parallel is the spine of the lesson; if it ever drifts out
// of the text, the lesson has become a history talk with verses attached.
//
// THIS LESSON IS DOCTRINALLY LOAD-BEARING IN BOTH DIRECTIONS, which is why the
// gate is written the way it is:
//   • UNDER-CLAIMING is a lie (DR-0100). The Word sentences the man-stealer to
//     death (Exodus 21:16) and lists menstealers as contrary to sound doctrine
//     (1 Timothy 1:10). Softening that into "a regrettable custom" is the
//     failure this file forbids.
//   • OVER-CLAIMING is also a lie. Providential placement never sanctifies the
//     injury: Genesis 50:20 says the brothers thought evil AND that Yahweh meant
//     it unto good — two facts, not one. Collapsing them turns a comfort into a
//     defence of the men who did it.
//   • AND IT IS A WORSHIP LESSON, NOT A GRIEVANCE LESSON. It must end on the Son
//     who took the servant's form and was given the Name (Philippians 2:7, 2:9).
//
// PROVEN-TO-CATCH, from this lesson's own authoring — both are real defects this
// session produced, and both are re-run below as live assertions:
//   • A MISQUOTED 2 CHRONICLES 8:14. The first draft wrote "for so had God
//     commanded." The verse says "for so had David the man of God commanded."
//     Shortening a quotation to fit the sentence is editing Scripture, and the
//     shortened form is not in the corpus at all.
//   • SIX GENERIC "God" IN OUR OWN AUTHORED VOICE (a child-level paraphrase, one
//     talking point, and four quiz options). DR-0210 governs our voice only —
//     the KJV's "God" inside every quotation is untouched — so the check has to
//     strip quoted spans before it looks, or it would demand we corrupt the text.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated';
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

/** Our authored voice = the text with every quotation removed. */
const ourVoiceOnly = (text) => text.replace(/"[^"]*"/g, ' ');

// Quoted spans in this lesson that are NOT Scripture. The list is deliberately
// EMPTY: every double-quoted span in L135 is verbatim KJV. Emphasis in this
// lesson wears CAPITALS, never quotation marks — quotation marks around our own
// words are the defect class these gates exist to catch, not a thing to
// allowlist away.
const NOT_SCRIPTURE = [];

const module135 = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L135 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L135 must be present in the source').toBeGreaterThan(-1);
    expect(module135(), 'L135 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    const m = module135();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/John 10:3/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of module135().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('THE WELD — the porter is in the text, not in our imagination', () => {
  it('John 10:3 is quoted verbatim, and it is the anchor', () => {
    const verse = 'To him the porter openeth; and the sheep hear his voice: and he calleth his own sheep by name, and leadeth them out.';
    expect(WHOLE_KJV, 'the anchor verse must exist verbatim in the corpus').toContain(verse);
    expect(l, 'L135 must quote its anchor in full').toContain(verse);
  });

  it('the KJV really does use the word PORTER at the door — the whole lesson turns on it', () => {
    // If this ever fails, the weld was imagined and the lesson must be rewritten.
    expect(WHOLE_KJV).toMatch(/To him the porter openeth/);
    expect(WHOLE_KJV, 'and the porter is given the watch').toMatch(/commanded the porter to watch/);
  });

  it('Scripture NAMES its porters, and the lesson reproduces those names verbatim', () => {
    const named = 'And the porters were, Shallum, and Akkub, and Talmon, and Ahiman, and their brethren: Shallum was the chief;';
    expect(WHOLE_KJV).toContain(named);
    expect(l, 'the four named porters are the counterweight to one name for every man').toContain(named);
  });

  it('the porters are taught as an ORDAINED office, not a menial one', () => {
    expect(l).toContain('whom David and Samuel the seer did ordain in their set office.');
    expect(l, 'a reigning king wanted the door job').toContain('I had rather be a doorkeeper in the house of my God, than to dwell in the tents of wickedness.');
  });

  it('PROVEN-TO-CATCH: 2 Chronicles 8:14 is quoted in FULL, not shortened to fit our sentence', () => {
    // The first draft of this lesson wrote "for so had God commanded." — three
    // words shorter than the verse, and not in the corpus at all. Trimming a
    // quotation so it reads better is editing Scripture.
    const short = 'the porters also by their courses at every gate: for so had God commanded.';
    const full = 'the porters also by their courses at every gate: for so had David the man of God commanded.';
    expect(WHOLE_KJV, 'the shortened form must NOT exist — that is why it was a defect').not.toContain(short);
    expect(WHOLE_KJV).toContain(full);
    expect(l, 'the lesson must carry the full clause').toContain(full);
    expect(l, 'the shortened misquote must never return').not.toContain(short);
  });
});

describe('every quoted span in L135 is letter-for-letter KJV', () => {
  it('the quotation marks are balanced (an unclosed quote silently swallows text)', () => {
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L135 source').toBe(true);
  });

  it('EVERY span is either verbatim Scripture or a declared non-Scripture span', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L135 must actually contain quotations').toBeGreaterThan(100);
    const bad = [];
    for (const span of spans) {
      // The corpus joins verses with a newline, so a span crossing a verse
      // boundary is NOT a substring of it. Authored spans split on '...'.
      const parts = span.includes('...') ? span.split('...').map((p) => p.trim()) : [span];
      for (const part of parts) {
        if (!part || NOT_SCRIPTURE.includes(part)) continue;
        if (!WHOLE_KJV.includes(part)) bad.push(part);
      }
    }
    expect(bad, `non-verbatim quoted spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the allowlist is EMPTY and stays honest — nothing of ours wears quotation marks', () => {
    expect(NOT_SCRIPTURE).toEqual([]);
  });
});

describe('DR-0210 typography — Yahweh in our voice, the KJV untouched inside quotes', () => {
  it('PROVEN-TO-CATCH: no generic "God" survives in our AUTHORED voice', () => {
    // Six of these were produced by this authoring and caught before shipping.
    // The check strips quotations first: DR-0210 governs our prose only, and the
    // KJV's own "God" and "the LORD" are fetched verbatim and left exactly as
    // written. A check that did not strip would demand we corrupt Scripture.
    const ours = ourVoiceOnly(l);
    const hits = [...ours.matchAll(/\bGod\b/g)].map((m) => ours.slice(Math.max(0, m.index - 70), m.index + 30));
    expect(hits, `generic "God" in our own voice:\n${hits.join('\n---\n')}`).toEqual([]);
  });

  it('our voice names Him by His covenant name, and often', () => {
    expect((ourVoiceOnly(l).match(/Yahweh/g) || []).length).toBeGreaterThan(40);
  });

  it('the KJV "God" and "the LORD" ARE preserved inside quotations', () => {
    // The complement of the rule above. If this fails, a find-replace corrupted
    // the text — the exact thing DR-0210 forbids.
    expect(l).toContain('And she called the name of the LORD that spake unto her, Thou God seest me');
    expect(l).toContain('God hath chosen the weak things of the world to confound the things which are mighty;');
  });

  it('no adversary name is ever capitalised', () => {
    expect(l).not.toMatch(/\b(Satan|Lucifer|The devil|Baal)\b/);
  });
});

describe('the fences — this lesson may not drift in either direction', () => {
  it('UNDER-CLAIMING IS FORBIDDEN: the Word on man-stealing is quoted at full volume', () => {
    expect(l).toContain('And he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death.');
    expect(l, 'the New Testament keeps the category by name').toMatch(/menstealers/);
  });

  it('the EDIT IS THE TELL, and the prohibition on cutting is cited', () => {
    expect(l).toMatch(/EDIT IS THE TELL|EXCISION IS THE EVIDENCE/);
    expect(l).toContain('Ye shall not add unto the word which I command you, neither shall ye diminish ought from it');
    expect(l).toContain('For I have not shunned to declare unto you all the counsel of God.');
  });

  it('OVER-CLAIMING IS FORBIDDEN: Genesis 50:20 keeps BOTH facts apart', () => {
    // Collapsing "they thought evil" into "so it was good" converts a comfort
    // into a defence of the men who did it. The guard sentence is load-bearing.
    expect(l).toContain('ye thought evil against me; but God meant it unto good');
    expect(l, 'the guard against misuse must be stated out loud').toMatch(/never sanctif/i);
  });

  it('the suppressed half of the Colossians passage is restored', () => {
    expect(l).toContain('Masters, give unto your servants that which is just and equal; knowing that ye also have a Master in heaven.');
    expect(l, 'and the transferable discipline is taught').toMatch(/half a (counsel|text)|the other half|the REMAINDER|the remainder/i);
  });

  it('the LABOR DAY text is Yahweh’s own wage law, quoted with its reason intact', () => {
    expect(l).toContain('At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee.');
    expect(l, 'the protection covers the stranger too').toContain('whether he be of thy brethren, or of thy strangers that are in thy land within thy gates:');
    expect(l, 'and the wage itself has a voice').toContain('which is of you kept back by fraud, crieth');
  });

  it('it is a WORSHIP lesson: it ends on the Son, not on the grievance', () => {
    expect(l).toContain('took upon him the form of a servant');
    expect(l).toContain('given him a name which is above every name:');
    expect(l, 'and Jesus is confessed as the Lamb of Yahweh').toMatch(/Lamb of Yahweh/);
  });

  it('DR-0098 — it teaches rather than staging a present-day political contest', () => {
    // Naming documented history is required (DR-0100). Recruiting the reader
    // into a partisan fight is not teaching, and this lesson must never do it.
    expect(l).not.toMatch(/\b(Democrat|Republican|liberal|conservative|left-wing|right-wing)\b/i);
  });

  it('DR-0076 — the history states its own status instead of borrowing Scripture’s certainty', () => {
    expect(l).toMatch(/commonly cited|customarily cited|usually cited|usually put at|usually given/);
    expect(l, 'and the one correction is offered plainly').toMatch(/first Black-led union chartered by the American Federation of Labor|first union led by Black Americans to be chartered by the American Federation of Labor/);
  });
});

describe('every age band is served text authored for IT (no band left on a fallback)', () => {
  it('child, teen and senior levels are all authored, and none is a stub', () => {
    const m = module135();
    for (const key of ['child', 'teen', 'senior']) {
      expect(typeof m.levels[key], `${key} level missing`).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });

  it('the ADULT band reads adult-depth prose, not the senior text on a fallback', () => {
    const m = module135();
    expect(typeof m.lesson, 'L135 must carry a base lesson for the adult band').toBe('string');
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId, 'the adult band must resolve to its own depth').toBe('standard');
    expect(r.text).toBe(m.lesson);
  });

  it('each band gets genuinely different prose, not the same text relabelled', () => {
    const m = module135();
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child).not.toBe(m.levels.senior);
    expect(m.levels.child.length, 'a child does not read an adult wall of text').toBeLessThan(m.levels.senior.length);
  });

  it('the child level carries the WHOLE lesson, not a fragment of it', () => {
    const c = module135().levels.child;
    expect(c, 'the name that was taken').toMatch(/called every single one of them George/);
    expect(c, 'the porter at the door').toMatch(/porter/i);
    expect(c, 'the named porters of Scripture').toMatch(/Shallum/);
    expect(c, 'Yahweh names and never un-names').toMatch(/never takes one away/);
    expect(c, 'Hagar, seen').toMatch(/Hagar/);
    expect(c, 'the wage rule').toMatch(/before the sun goes down|sun goes down/i);
    expect(c, 'and it lands on the Son').toMatch(/above every name/);
  });

  it('the child level does NOT carry the adult freight it cannot hold', () => {
    const c = module135().levels.child;
    expect(c, 'no death penalty text at child level').not.toMatch(/put to death/);
    expect(c, 'no menstealers at child level').not.toMatch(/menstealers/);
  });

  it('the one assignment reaches every band, because it is the point', () => {
    const m = module135();
    for (const text of [m.lesson, m.levels.child, m.levels.teen, m.levels.senior]) {
      expect(text, 'Greet the friends by name — the single instruction').toContain('Greet the friends by name.');
    }
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('child reads simpler than teen, and teen simpler than senior', async () => {
    const { measureLesson, isInverted, breachesChildCeiling } = await import('../../../scripts/reading-level.mjs');
    const measured = measureLesson(module135());
    expect(isInverted(measured), 'L135 must not read harder at child level than at teen level').toBe(false);
    expect(breachesChildCeiling(measured), 'the child level must sit under the grade ceiling').toBe(false);
    expect(measured.bands.child.authored).toBeLessThan(measured.bands.teen.authored);
    expect(measured.bands.teen.authored).toBeLessThan(measured.bands.senior.authored);
  });
});
