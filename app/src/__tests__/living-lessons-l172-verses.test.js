// @vitest-environment node
// =============================================================================
// L172 — The Spirit of Your Mind. Every verse verbatim, every band carrying the
// whole ladder AND the refusal, checked where each does its job.
// =============================================================================
// Darrell, 2026-09-17, spoken into this channel and opened with the word
// "Lesson": what is the spirit of our mind according to the biblical record? He
// wants to understand how Yahweh built us as flesh, spirit, soul — mind, will
// and emotions — everything from the physical all the way through to the
// spiritual; from when things are so small on the quantum level, how it is like
// a vapour, all the way through to things being physical inside time. And time,
// he said, is the only thing that began. Then his reason for asking: the things
// that make it so we can see are clearly stated, but because they are so not
// discussed in reality, we often do not really see it.
//
// THE THREE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG, and what the
// gate therefore holds:
//
//   1. A DIAGRAM. The obvious way to answer "how did He build us" is a
//      three-circle chart of body, soul and spirit presented as doctrine. The
//      Word does not draw one. Hebrews 4:12 says soul and spirit are divisible
//      and says what divides them — the Word, not introspection — so the lesson
//      gives the terms, shows them working, and REFUSES the cross-section out
//      loud in every band. That refusal is checked, because it is the thing a
//      future edit would quietly "improve" away.
//   2. THE QUANTUM HALF. Dressing a measurement in a verse to make the verse
//      look clever would have been easy and would have cost more credibility
//      than it bought. So it is said in three separately-labelled parts: what
//      the Word says (Hebrews 11:3), what has been MEASURED, and what we refuse
//      to do. The gate requires all three in one passage, the refusal included.
//   3. THE EMOTIONS, IN BOTH DIRECTIONS. A band that only showed a man
//      commanding his soul would teach that feeling is fleshly; a band that only
//      showed Jesus weeping would teach that feeling gives orders. Both guards
//      are required in every band.
//
// The windowing helper is the one DR-0466 paid for: quotations come out BEFORE
// the slice (DR-0462), and EVERY occurrence of a marker is walked, because this
// lesson also opens by rendering Darrell's own directive and his words already
// contain vapour, quantum, spirit, mind, soul and flesh.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';

const ID = 'll172-the-spirit-of-your-mind-dust-breath-and-the-one-who-inhabits-eternity';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
// The adult lesson is checked alongside the bands wherever the claim belongs to
// the lesson rather than to a register.
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);

// ---------------------------------------------------------------------------
// The corpus, and the STRICT comparison
// ---------------------------------------------------------------------------
// STRICT is whitespace-only (DR-0456). Apostrophes are NEVER normalised: the
// corpus carries the typographic apostrophe and so must we, or "name's sake"
// silently passes for "name’s sake" and the quotation is not the Word's.
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
// bookKey must NOT rewrite a leading numeral (DR-0457): 1Corinthians.json.
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book);
  if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1];
  if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i);
    else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  // Chapters join with a SPACE so a contiguous multi-verse quotation is a
  // substring of the range it names.
  return parts.some((x) => x == null) ? null : parts.join(' ');
};

// The book pattern MUST allow internal words, or a name like Song of Solomon is
// silently skipped by every check that uses it (DR-0465).
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const ANY_SPAN = /"([^"]+)"/g;
const spansOf = (text) => {
  const out = [];
  SPAN_WITH_REF.lastIndex = 0;
  let m;
  while ((m = SPAN_WITH_REF.exec(text))) {
    out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  }
  return out;
};

// ---------------------------------------------------------------------------
// The window: quotations out FIRST, then slice, then references out
// ---------------------------------------------------------------------------
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ourWords = (text) => String(text).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');

// EVERY window around EVERY occurrence of every marker, quotations already gone.
//
// WHY ALL OF THEM, and this is a finding this gate paid for. The first draft
// took indexOf's FIRST hit. This lesson opens by rendering Darrell's own two-
// part directive, and his words already contain "pneumatic", "default",
// "guaranteed shoreline", "five percent" and most of the rest — so every window
// landed in the directive, where the teaching has not happened yet, and 28
// checks failed against text that genuinely carries the property further down.
// A first-occurrence window does not check the property; it checks where the
// word happens to appear first.
const windowsAround = (text, markers, pad) => {
  const prose = ourWords(text);
  const low = prose.toLowerCase();
  const out = [];
  for (const marker of [].concat(markers)) {
    const m = String(marker).toLowerCase();
    let i = low.indexOf(m);
    while (i >= 0) {
      out.push(prose.slice(Math.max(0, i - pad), i + m.length + pad));
      i = low.indexOf(m, i + 1);
    }
  }
  return out;
};

/**
 * At least ONE passage must carry EVERY named claim together.
 *
 * This is the shape the recurring finding of this pass demands: not "the phrase
 * exists somewhere in five thousand words" (too loose — a band could state a
 * rule in one paragraph and its refutation in another and still pass), and not
 * "the first occurrence carries it" (watching the wrong thing). The property is
 * that some single passage holds the whole claim, and the failure message names
 * the claim that was missing from the closest passage found.
 */
const passage = (text, markers, claims, pad = 600) => {
  const ws = windowsAround(text, markers, pad);
  if (!ws.length) return { found: false, missing: ['the passage itself is absent'] };
  let best = null;
  for (const w of ws) {
    const missing = claims.filter(([, re]) => !re.test(w)).map(([name]) => name);
    if (!missing.length) return { found: true, missing: [] };
    if (!best || missing.length < best.length) best = missing;
  }
  return { found: false, missing: best };
};

/** Assert that one passage of `key` carries every claim. */
const carries = (key, text, markers, claims, pad = 600) => {
  const r = passage(text, markers, claims, pad);
  expect(r.found, `${key}: no single passage carries this together — missing ${r.missing.join('; ')}`).toBe(true);
};

describe('L172 exists and is the newest lesson', () => {
  it('is mounted exactly once, and titled', () => {
    expect(L, 'L172 is not mounted').toBeTruthy();
    expect(L.title).toBe('The Spirit of Your Mind — Dust, Breath, and the One Who Inhabits Eternity');
    // MOUNTED EXACTLY ONCE, not "last". This first read
    // LIVING_LESSONS_MODULES[length - 1].id === ID, which is a property that
    // is only true until the next lesson lands — and it duly went red on the
    // full verify the moment one did. Being newest is not a property of this
    // lesson; being present, exactly once, is (DR-0468).
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
  });

  it('carries a real lesson, four real bands, a quiz and facilitator notes', () => {
    expect(L.lesson.split(/\s+/).length).toBeGreaterThan(2500);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(12);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.benefits.length).toBeGreaterThanOrEqual(12);
    for (const q of L.quiz.questions) {
      expect(q.answer, `${q.q} has an out-of-range answer`).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('every quotation is the Word, verbatim, and referenced', () => {
  for (const key of ALL) {
    it(`${key}: every referenced span matches the corpus strictly`, () => {
      const spans = spansOf(TEXTS[key]);
      expect(spans.length, `${key} quotes nothing`).toBeGreaterThan(40);
      for (const s of spans) {
        const corpus = versesOf(s.book, s.ch, s.vs);
        expect(corpus, `${key}: ${s.book} ${s.ch}:${s.vs} does not resolve in the corpus`).toBeTruthy();
        expect(norm(corpus).includes(norm(s.quote)),
          `${key}: NOT VERBATIM ${s.book} ${s.ch}:${s.vs}\n  ours  : ${norm(s.quote)}\n  corpus: ${norm(corpus)}`).toBe(true);
      }
    });

    it(`${key}: no quoted span is unreferenced`, () => {
      const referenced = new Set(spansOf(TEXTS[key]).map((s) => s.quote));
      const loose = [];
      ANY_SPAN.lastIndex = 0;
      let m;
      while ((m = ANY_SPAN.exec(TEXTS[key]))) if (!referenced.has(m[1])) loose.push(m[1]);
      expect(loose, `${key} has quoted spans with no reference beside them`).toEqual([]);
    });

    it(`${key}: no ellipsis inside a quotation`, () => {
      // Caught for real in this lesson's own metadata audit: Romans 1:20 first
      // shipped as "clearly seen... so that they are without excuse", which
      // presents a truncation as His words. The remedy is always a shorter
      // verbatim span, never an elision (DR-0459).
      const bad = spansOf(TEXTS[key]).filter((s) => /\.\.\.|…/.test(s.quote)).map((s) => s.quote);
      expect(bad, `${key} elides inside a quotation`).toEqual([]);
    });
  }

  it('the anchor list is DERIVED from the lesson, not painted beside it', () => {
    const derived = [];
    for (const s of spansOf(L.lesson)) {
      const r = `${s.book} ${s.ch}:${s.vs}`;
      if (!derived.includes(r)) derived.push(r);
    }
    expect(L.anchor.ref.split(';').map((x) => x.trim())).toEqual(derived);
    expect(derived.length).toBeGreaterThan(60);
  });
});

describe('the typographic and covenant-name bindings hold', () => {
  it('no adversary name is capitalised anywhere in the lesson', () => {
    const whole = [L.title, L.bigIdea, L.inApp, L.anchor.ref, ...L.benefits,
      ...L.quiz.questions.flatMap((q) => [q.q, ...q.options, q.explain]),
      ...L.facilitator.talkingPoints, ...ALL.map((k) => TEXTS[k])].join(' ');
    for (const name of ['Satan', 'Lucifer', 'Baal', 'The Devil', 'The Dragon', 'The Adversary', 'The Accuser', 'The Deceiver']) {
      expect(whole.includes(name), `${name} is capitalised somewhere in L172`).toBe(false);
    }
  });

  it('OUR prose says Yahweh and never the generic name; His own words are untouched', () => {
    for (const key of ALL) {
      const ours = ourProseOnly(TEXTS[key]);
      expect((ours.match(/Yahweh/g) || []).length,
        `${key} barely names Yahweh in our own voice (DR-0210)`).toBeGreaterThanOrEqual(3);
      expect((ours.match(/\bGod\b/g) || []).length,
        `${key} uses the generic name in OUR voice`).toBe(0);
    }
    // The bright line: the corpus's own "God" stays exactly as written. These
    // are quoted here so the line is CHECKED rather than merely stated — a
    // blind God→Yahweh sweep would break them (DR-0076 / DR-0210).
    expect(L.lesson.includes('"In the beginning God created the heaven and the earth."')).toBe(true);
    expect(L.lesson.includes('and the spirit shall return unto God who gave it')).toBe(true);
  });
});

describe('all four bands are the FULL message, and the ladder is monotone', () => {
  it('no band is short of its floor share', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('the child band reads under the ceiling a NEW lesson is held to', () => {
    const fk = fleschKincaidGrade(ourProseOnly(L.levels.child));
    expect(fk, `child band reads at grade ${fk.toFixed(2)}`).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('the ladder rises: child below teen below senior', () => {
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('child')).toBeLessThan(g('teen'));
    expect(g('teen')).toBeLessThan(g('senior'));
  });

  it('the youth band does not read harder than the adult lesson', () => {
    // Its first draft did, because it leaned on adult prose. A band whose
    // register drifts up is a band that is not doing its job for its reader.
    expect(fleschKincaidGrade(ourProseOnly(L.levels.youth)))
      .toBeLessThan(fleschKincaidGrade(ourProseOnly(L.lesson)));
  });

  it('every band opens by naming its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('this lesson appears in NONE of the three shrink-only baselines', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
  });
});

describe('the phrase is answered from its own sentence', () => {
  for (const key of ALL) {
    it(`${key}: put off, be renewed, put on — and the phrase named as the hinge`, () => {
      carries(key, TEXTS[key], ['put off, be renewed, put on', 'Put off. Be renewed. Put on.', 'three-part instruction', 'there are three parts'], [
        ['all three parts', /put off/i],
        ['the middle one', /renewed/i],
        ['the third', /put on/i],
        ['that it is the HINGE', /hinge/i],
      ], 700);
    });

    it(`${key}: the four-step failure is read backwards, and PAST FEELING is placed`, () => {
      carries(key, TEXTS[key], ['Read the order backwards', 'Read it backwards'], [
        ['that the heart goes blind first', /heart goes blind|heart goes dark/i],
        ['and the mind ends in vanity', /vanity|empty/i],
      ], 500);
      carries(key, TEXTS[key], ['Past feeling'], [
        ['that it is not feeling too much', /not feeling too much/i],
        ['that numbness is a LATER stage than being wrong', /later stage than being wrong|worse than being wrong/i],
      ], 400);
    });

    it(`${key}: the phrase SPIRIT OF is explained from the Word's own usage, with the payoff`, () => {
      carries(key, TEXTS[key], ['Fear is not a faculty', 'Fear is not a body part'], [
        ['that spirit-of names a disposition rather than a part', /disposition|the way a thing is set|what it runs on/i],
      ], 600);
      carries(key, TEXTS[key], ['is not your thoughts'], [
        ['the payoff — what the thoughts come out of', /come(s)? out of/i],
        ['and that the instruction is not think better thoughts', /think (better|nicer)/i],
      ], 600);
    });
  }
});

describe('the instrument inside a man, and Whose candle it is', () => {
  for (const key of ALL) {
    it(`${key}: 1 Corinthians 2:11 is read as a PARALLEL, with the skipped half named`, () => {
      carries(key, TEXTS[key], ['It is a parallel', 'It is a pair'], [
        ['that a man’s interior is read by his own spirit', /own spirit|that man’s (own )?spirit|your spirit/i],
        ['that this is the half people skip', /skip/i],
      ], 600);
    });

    it(`${key}: the candle is HIS, and its stated job is SEARCHING`, () => {
      carries(key, TEXTS[key], ['A candle'], [
        ['that it is not your light but His', /not your light/i],
        ['that its job is searching', /searching/i],
      ], 500);
    });
  }
});

describe('the ladder is found in the Word’s own single sentences, twice', () => {
  for (const key of ALL) {
    it(`${key}: Zechariah 12:1 is counted as three acts in one breath, with the conclusion`, () => {
      carries(key, TEXTS[key], ['one breath'], [
        ['the heavens', /heavens|sky/i],
        ['the earth’s foundation', /foundation|ground of the earth/i],
        ['and the spirit inside a man', /spirit of a man inside him|spirit inside a man|inside him/i],
        ['that this refuses two separate departments', /two different departments|two separate departments/i],
      ], 700);
    });

    it(`${key}: Isaiah 57:15 is read in BOTH halves, and the pattern is named as the second time`, () => {
      carries(key, TEXTS[key], ['inhabits eternity names the other place', 'lives in for ever names the other place'], [
        ['that the other place is a broken spirit', /broken spirit/i],
        ['that the Word does this twice', /twice/i],
        ['and that the bottom is the interior of a person', /interior of a person|inside of a person/i],
      ], 700);
    });
  }
});

describe('the assembly, the three words, and the refusal to draw a diagram', () => {
  for (const key of ALL) {
    it(`${key}: Genesis 2:7 is read EXACTLY — man BECAME a living soul`, () => {
      // The whole point of quoting it is that it does not say a soul was
      // installed. A band that quoted the verse and then paraphrased it the
      // ordinary way would be teaching the opposite of what it just quoted.
      carries(key, TEXTS[key], ['Read it exactly', 'Read it very carefully'], [
        ['that it is NOT dust plus an installed soul', /not (say )?dust plus|does not say a soul was/i],
        ['that the man BECAME one', /BECAME|became a living soul/i],
        ['and that the soul is what happened when the two met', /when (the two|those two) met/i],
      ], 700);
    });

    it(`${key}: Hebrews 4:12 is read as saying WHAT divides soul and spirit`, () => {
      carries(key, TEXTS[key], ['That verse does two jobs'], [
        ['that they are genuinely distinguishable', /distinguishable|really are different/i],
        ['that the divider is not introspection', /not introspection|not your feelings/i],
        ['and that it is the Word', /it is the Word|but the Word/i],
      ], 600);
    });

    it(`${key}: THE REFUSAL IS SAID OUT LOUD — no diagram, because the Word draws none`, () => {
      // This is the load-bearing refusal of the lesson and the thing a future
      // edit would most likely "improve" away by adding a tidy chart.
      carries(key, TEXTS[key], ['does not draw one', 'does not give a cross-section', 'not going to hand you one'], [
        ['that no diagram is given', /diagram|cross-section|chart|drawing|cut-away/i],
        ['because the Word does not draw one', /does not draw one|does not give a cross-section|is not in the Bible/i],
      ], 700);
      carries(key, TEXTS[key], ['gone past the text', 'past the text'], [
        ['that going past the text is how this became an argument', /argue about/i],
        ['rather than something people use', /people use/i],
      ], 500);
    });
  }
});

describe('mind, will and emotions are shown WORKING, and both emotion guards hold', () => {
  for (const key of ALL) {
    it(`${key}: the mind is set, girded and stayed — things done to it on purpose`, () => {
      carries(key, TEXTS[key], ['girded', 'Girded'], [
        ['set', /\bset\b/i],
        ['stayed', /stayed/i],
        ['that each is done on purpose by its owner', /on purpose/i],
      ], 500);
    });

    it(`${key}: the will keeps BOTH halves — yours, and He works in it`, () => {
      // Philippians 2:12-13 in one sentence. A band that dropped either half
      // would teach self-manufacture or fatalism, and both are available here.
      carries(key, TEXTS[key], ['Both to will and to do'], [
        ['that the will is genuinely yours', /(genuinely|really) yours/i],
        ['and that He works in it', /He works (in|inside) it/i],
        ['that neither half may be dropped', /neither half|cannot drop either/i],
      ], 500);
    });

    it(`${key}: GUARD ONE — a man speaks TO his own soul rather than obeying it`, () => {
      carries(key, TEXTS[key], ['TO his own soul', 'talking TO his own soul'], [
        ['that he asks it a question', /asks (his|it a question)/i],
        ['that this proves the self is not one undifferentiated thing', /not (one|just one)/i],
      ], 600);
    });

    it(`${key}: GUARD TWO — emotions are not the unspiritual part, because they are in HIM`, () => {
      carries(key, TEXTS[key], ['on the worst day there has ever been'], [
        ['that joy was doing work there', /joy/i],
      ], 500);
      carries(key, TEXTS[key], ['feeling is fleshly', 'not fleshly', 'not the bad part'], [
        ['that feeling is real', /(feelings?|it|they) (is|are) real/i],
        ['that it is His too', /His too/i],
        ['and that it does not give the orders', /take orders|your boss/i],
      ], 500);
    });

    it(`${key}: the faculty lists are named as NOT matching, with ALL as the point`, () => {
      carries(key, TEXTS[key], ['Not identical', 'They are not the same'], [
        ['that it is not a problem to smooth over', /not a (problem|mistake) to (be )?(smooth|hide)/i],
        ['that it is the clue', /clue/i],
        // TIGHTENED after the break harness: the old alternation was
        // /inventory|parts (list|chart|diagram)/, and removing "inventory"
        // left the claim satisfied by a DIFFERENT sentence in the same window
        // ("build a parts diagram has read past..."). An alternation broad
        // enough to be answered by another sentence is not checking the
        // sentence it was written for. It now requires the refusal itself.
        ['that neither is publishing an inventory', /publishing an inventory|making a parts list|is not making a parts/i],
        ['and that the word both press is ALL', /\bALL\b/],
      ], 700);
    });
  }
});

describe('the flesh is distinguished from the body, so the temple is not despised', () => {
  for (const key of ALL) {
    it(`${key}: the flesh wars in the members; the body is the temple it wars inside`, () => {
      carries(key, TEXTS[key], ['the body is the temple it wars inside', 'The body is the temple it fights inside'], [
        ['that the flesh is the thing at war', /flesh is the thing/i],
        ['and the cost of collapsing the two', /despising|looking down on/i],
        ['naming that it was purchased', /purchased|paid for/i],
      ], 600);
    });
  }
});

describe('the quantum half is said in THREE separate parts, refusal included', () => {
  for (const key of ALL) {
    it(`${key}: what the Word says, what was MEASURED, and what we refuse to do`, () => {
      // The separation IS the teaching. A band that merged the three would be
      // doing the exact thing the third part refuses.
      const w = ourWords(TEXTS[key]);
      expect(w, `${key} never labels what the Word actually says`).toMatch(/WHAT THE WORD ACTUALLY SAYS/i);
      expect(w, `${key} never labels the measurement as measurement`).toMatch(/WHAT (HAS BEEN|PEOPLE HAVE) MEASURED/i);
      expect(w, `${key} never labels the refusal`).toMatch(/WHAT WE WILL NOT DO/i);
    });

    it(`${key}: the refusal names the mechanism — a measurement is not dressed in a verse`, () => {
      carries(key, TEXTS[key], ['Dressing a measurement in a verse', 'Dressing up a measurement in a verse'], [
        ['that the Word names no model', /does not name a (science )?model/i],
        ['and that the two facts stand side by side without inflation', /does not need to be (inflated|blown up)/i],
      ], 700);
    });

    it(`${key}: his word VAPOUR is kept as his, with Scripture's own meaning intact`, () => {
      carries(key, TEXTS[key], ['it is not talking about particles', 'it is not talking about tiny bits'], [
        ['that Scripture’s vapour is the brevity of a life', /how short a (life|man)/i],
        ['and that neither borrows the other’s authority', /borrow/i],
      ], 700);
    });
  }
});

describe('time is the only thing that began', () => {
  for (const key of ALL) {
    it(`${key}: WAS, not began — and the beginning is the creation's, not His`, () => {
      carries(key, TEXTS[key], ['Was, not began', 'It says WAS. Not began.'], [
        ['that the beginning belongs to the heaven and the earth', /beginning of (the heaven|the sky)/i],
        ['and not to Him', /not the beginning of Him/i],
      ], 500);
    });

    it(`${key}: before the world began is named as a phrase Scripture uses more than once`, () => {
      carries(key, TEXTS[key], ['uses it more than once', 'more than once'], [
        ['that there was a before', /There was a before/i],
      ], 600);
    });

    it(`${key}: even the RATE is not shared, and the creation is a garment`, () => {
      carries(key, TEXTS[key], ['the rate is not shared', 'the speed is not the same'], [
        ['that the difference is put as a garment and its owner', /garment|coat/i],
      ], 900);
    });
  }
});

describe('the two men, running in opposite directions', () => {
  for (const key of ALL) {
    it(`${key}: outward down and inward up, at the same time, in one person`, () => {
      carries(key, TEXTS[key], ['at the same time', 'simultaneously'], [
        ['that one goes down while the other goes up', /(going|goes) down while the other/i],
        ['in the same person', /same person/i],
      ], 500);
    });

    it(`${key}: not unclothed but CLOTHED UPON — the hope is not escape from the physical`, () => {
      carries(key, TEXTS[key], ['clothed upon', 'Dressed on top'], [
        ['that it is not escape from the physical', /not escap/i],
        ['but the physical swallowed up by life', /swallowed up by life/i],
      ], 500);
    });

    it(`${key}: and the order is given — natural first, spiritual afterward`, () => {
      carries(key, TEXTS[key], ['natural first', 'Natural first'], [
        ['that the order is stated', /order/i],
      ], 400);
    });
  }
});

describe('his own question answered: why the plainest things go unseen', () => {
  for (const key of ALL) {
    it(`${key}: clearly seen, without excuse — the cause is NOT missing evidence`, () => {
      carries(key, TEXTS[key], ['Clearly seen'], [
        ['that men are without excuse', /without excuse|No excuse/i],
        ['and that a shortage of evidence is not the cause', /not blame a shortage|does not blame missing proof/i],
      ], 600);
    });

    it(`${key}: the mechanism is honour withheld, and the darkening came AFTER`, () => {
      carries(key, TEXTS[key], ['They knew'], [
        ['that they did not honour Him', /did not honour/i],
        ['and that the darkening followed', /(darkening came after|dark came after)/i],
      ], 400);
    });

    it(`${key}: and the signal was never quiet`, () => {
      carries(key, TEXTS[key], ['never quiet'], [
        ['that no language lacks that voice', /no language/i],
        ['so the problem is attention and honour', /attention/i],
      ], 700);
    });
  }
});

describe('a method rather than a diagram, and it is usable this week', () => {
  for (const key of ALL) {
    it(`${key}: four practices, and 1 Corinthians 14:15 is the working distinction`, () => {
      carries(key, TEXTS[key], ['BOTH, deliberately', 'BOTH. On purpose.'], [
        ['that one can be engaged while the other is not', /one is (engaged|working) and the other is not/i],
        ['that he refuses to settle for it', /refuses/i],
        ['and that it is given as a practice rather than a theory', /practice/i],
      ], 700);
    });

    it(`${key}: obedience comes BEFORE knowing, and CANNOT is wiring rather than insult`, () => {
      carries(key, TEXTS[key], ['Doing comes first'], [
        ['that knowing follows', /knowing (follows|comes after)/i],
      ], 400);
      carries(key, TEXTS[key], ['about wiring', 'a statement about wiring'], [
        ['that it is not an insult', /not an insult/i],
        ['and that more argument is not the answer', /more argu/i],
      ], 500);
    });

    it(`${key}: the week's three practices are all there, and the second one is strict`, () => {
      const w = ourWords(TEXTS[key]);
      expect(w, `${key} drops the daily Ephesians reading`).toMatch(/Ephesians 4:17-24/);
      expect(w, `${key} drops the one-question discipline`).toMatch(/one question only|one question/i);
      expect(w, `${key} drops the pray-both practice`).toMatch(/1 Corinthians 14:15/);
      expect(w, `${key} never says the two are not the same act`).toMatch(/not the same (act|thing)/i);
      expect(w, `${key} drops speaking TO your own soul`).toMatch(/Psalms 42:5/);
      expect(w, `${key} never insists it is TO yourself rather than about yourself`).toMatch(/TO yourself/);
    });
  }
});
