// @vitest-environment node
// =============================================================================
// L171 — Trend It Against the Shoreline. Every verse verbatim, every band
// carrying the engineering AND the guard, checked where each does its job.
// =============================================================================
// Darrell, 2026-09-17, spoken into this channel in two parts. Part one: trend
// your code after you write it so you can time it; an on-off statement is on
// with power and off without; you pick the default; you walk away and come back
// and read the trend to see how well the code is aligned with the reality you
// are programming it towards — and the Lord is the same way, so the Word is the
// guaranteed shoreline and we look at the trends of our lives against it, and
// that is not a guilt trip but a way to evaluate so we can tighten up.
//
// Part two is the half that makes part one engineering rather than a figure of
// speech: it is key that we are trending POINTS. Twenty-four-point controllers,
// thirty-two-point controllers, each point on-off or a pneumatic sort of
// control — something that can actually do something physically in the world.
// So we are trending what impacted reality. Then the setpoints, and everything
// it is supposed to be impacting, in orchestration, so at any moment we can
// take a snapshot in time. At thirty-five degrees did the chilled water valve
// open so we do not burst our pipes — and not all the way up either: five, ten,
// twenty percent, thirty at the most. A range is zero to a hundred and that is
// an analog; a one or a zero is a digital.
//
// WHAT THIS GATE IS FOR, and why it is shaped the way it is. The recurring
// finding of this whole pass has one sentence: check the PROPERTY, in the place
// it is supposed to be doing its job — never the presence of the words around
// it. A phrase found anywhere in five thousand words proves nothing, so almost
// every check below is WINDOWED on the passage that owns the claim, and the
// window is cut with quotations ALREADY REMOVED (DR-0462: slicing raw text and
// stripping afterwards leaves an unbalanced quote mark that drags the Word's
// own words into the window and lets our prose pass on His).
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

const ID = 'll171-trend-it-against-the-shoreline-points-setpoints-and-the-trends-of-our-lives';
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

describe('L171 exists and is the newest lesson', () => {
  it('is mounted exactly once, and titled', () => {
    expect(L, 'L171 is not mounted').toBeTruthy();
    expect(L.title).toBe('Trend It Against the Shoreline — Points, Setpoints, and the Trends of Our Lives');
    // MOUNTED EXACTLY ONCE, not "last". This first read
    // LIVING_LESSONS_MODULES[length - 1].id === ID, which is a property that
    // is only true until the next lesson lands — and it duly went red on the
    // full verify the moment one did. Being newest is not a property of this
    // lesson; being present, exactly once, is (DR-0468).
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
  });

  it('carries a real lesson, four real bands, a quiz and facilitator notes', () => {
    expect(L.lesson.split(/\s+/).length).toBeGreaterThan(3000);
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(12);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(8);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
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
      expect(spans.length, `${key} quotes nothing`).toBeGreaterThan(30);
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
      // An ellipsis inside quotation marks presents a truncation as His own
      // words. The remedy is always a shorter verbatim span (DR-0459).
      const bad = spansOf(TEXTS[key]).filter((s) => /\.\.\.|…/.test(s.quote)).map((s) => s.quote);
      expect(bad, `${key} elides inside a quotation`).toEqual([]);
    });
  }

  it('the anchor list is DERIVED from the lesson, not painted beside it', () => {
    // The L149 correction: an anchor named only by a label, which the lesson
    // never taught, survived for months. Here the anchor must be exactly the
    // adult lesson's own references, in order of first appearance.
    const derived = [];
    for (const s of spansOf(L.lesson)) {
      const r = `${s.book} ${s.ch}:${s.vs}`;
      if (!derived.includes(r)) derived.push(r);
    }
    expect(L.anchor.ref.split(';').map((x) => x.trim())).toEqual(derived);
    expect(derived.length).toBeGreaterThan(50);
  });
});

describe('the typographic and covenant-name bindings hold', () => {
  it('no adversary name is capitalised anywhere in the lesson', () => {
    const whole = [L.title, L.bigIdea, L.inApp, L.anchor.ref, ...L.benefits,
      ...L.quiz.questions.flatMap((q) => [q.q, ...q.options, q.explain]),
      ...L.facilitator.talkingPoints, ...ALL.map((k) => TEXTS[k])].join(' ');
    for (const name of ['Satan', 'Lucifer', 'Baal', 'The Devil', 'The Dragon', 'The Adversary', 'The Accuser', 'The Deceiver']) {
      expect(whole.includes(name), `${name} is capitalised somewhere in L171`).toBe(false);
    }
    // And the one place the adversary's kingdom is named, it is named as the
    // corpus already carries it — inside a quotation, lowercase.
    expect(L.lesson.includes('if baal, then follow him')).toBe(true);
  });

  it('OUR prose says Yahweh and never the generic name; His own words are untouched', () => {
    for (const key of ALL) {
      const ours = ourProseOnly(TEXTS[key]);
      expect((ours.match(/Yahweh/g) || []).length,
        `${key} barely names Yahweh in our own voice (DR-0210)`).toBeGreaterThanOrEqual(3);
      expect((ours.match(/\bGod\b/g) || []).length,
        `${key} uses the generic name in OUR voice`).toBe(0);
    }
    // The bright line: the corpus's own "God" stays exactly as written. If a
    // blind sweep had ever run, these quotations would no longer be verbatim —
    // and they are quoted here so the line is checked, not merely stated.
    expect(L.lesson.includes('"For the word of God is quick, and powerful')).toBe(true);
    expect(L.lesson.includes('"Search me, O God, and know my heart')).toBe(true);
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

describe('the engineering is real engineering, in every band', () => {
  for (const key of ALL) {
    it(`${key}: a point is defined as a wire that ends at metal that moves`, () => {
      // The load-bearing sentence of the lesson. A check for the word "point"
      // would pass on any paragraph, so the wire AND the metal AND the movement
      // are required in one passage.
      carries(key, TEXTS[key], ['A point is not an idea', 'A point is a wire'], [
        ['the wire', /wire/i],
        ['the metal', /metal/i],
        ['the movement', /moves/i],
        ['why it matters — the point count is the measure of reach', /point count is the (exact|measure)|number of points is how much/i],
      ], 500);
    });

    it(`${key}: names the point counts he gave — twenty-four and thirty-two`, () => {
      const ours = ourWords(TEXTS[key]);
      expect(ours, `${key} drops the 24-point controller`).toMatch(/twenty[- ]four[- ]point/i);
      expect(ours, `${key} drops the 32-point controller`).toMatch(/thirty[- ]two[- ]point/i);
    });

    it(`${key}: a digital point has two states and NO middle`, () => {
      // Stating "one or zero" is not the property. The property is the REFUSAL
      // of a middle, which is what makes lukewarm a failure mode later.
      carries(key, TEXTS[key], ['digital point has two states', 'A digital point has two states'], [
        ['the two states', /two states and no others/i],
        ['the refusal of a middle', /no (such thing as a )?digital point at forty percent/i],
      ], 500);
    });

    it(`${key}: an analog point is a range, zero to a hundred, and says why percent`, () => {
      const ours = ourWords(TEXTS[key]);
      expect(ours, `${key} never gives the analog range`).toMatch(/zero to (a hundred|one hundred)/i);
      expect(ours, `${key} never says why a percentage is the unit`)
        .toMatch(/percentage is the one unit|percent because percent works/i);
    });

    it(`${key}: pneumatic is named as AIR, and the lag is the reason trending exists`, () => {
      carries(key, TEXTS[key], ['pneumatic loop', 'In an air loop'], [
        ['that pneumatic means air', /air/i],
        ['the spring the air argues with', /spring/i],
      ], 700);
      carries(key, TEXTS[key], ['Lag is', 'called lag'], [
        ['that the command and the world are two separate facts', /two (different|separate)? ?facts/i],
        ['that only one of them is reality', /only one of them is reality/i],
      ], 500);
    });

    it(`${key}: the default is a decision, with at least two real fail-states`, () => {
      carries(key, TEXTS[key], ['fail OPEN', 'fail open'], [
        ['the freeze valve failing open', /fail open/i],
        ['a second fail-state', /fail (on|shut)/i],
        ['what a default IS — what runs when nobody decides', /when nobody is (deciding|choosing)/i],
      ], 900);
    });

    it(`${key}: setpoint, process value and output are kept as three separate numbers`, () => {
      carries(key, TEXTS[key], ['setpoint is what you asked for'], [
        ['what you asked for', /what you asked for/i],
        ['what the world is doing', /what the world is (actually )?doing/i],
        ['the output as the pushing', /how hard the program is pushing/i],
      ], 600);
    });

    it(`${key}: BOTH diagnostic cases are carried, and the not-the-code case comes first`, () => {
      // The pastoral payload: it separates trying-and-failing from not-trying.
      // A band with one case teaches half a diagnostic, so both are required
      // AND their order is pinned.
      const w = ourWords(TEXTS[key]);
      const notCode = w.search(/problem is not the code|code is not the problem/i);
      const isCode = w.search(/problem IS the code|now the problem is the code|now the code is the problem/i);
      expect(notCode, `${key} drops the case where the program is doing all it can`).toBeGreaterThan(-1);
      expect(isCode, `${key} drops the case where the program is not trying`).toBeGreaterThan(-1);
      expect(notCode, `${key} teaches the two diagnostic cases out of order`).toBeLessThan(isCode);
    });
  }
});

describe('the thirty-five-degree case carries BOTH halves', () => {
  for (const key of ALL) {
    it(`${key}: the freeze is real — the water expands and the pipe splits`, () => {
      carries(key, TEXTS[key], ['Water expands when it freezes', 'Water grows when it freezes'], [
        ['why the pipe gives', /expands when it freezes|grows when it freezes/i],
        ['that it splits', /splits/i],
        ['that a closed pipe cannot give', /does not give|cannot give/i],
      ], 700);
      expect(ourWords(TEXTS[key]), `${key} never names the temperature he gave`)
        .toMatch(/thirty[- ]five degrees/i);
    });

    it(`${key}: the percentages he named appear INSIDE the freeze passage`, () => {
      // Percentages anywhere in five thousand words prove nothing. They have
      // to be where the valve is being opened.
      carries(key, TEXTS[key], ['You do not open it all the way'], [
        ['five', /five/i], ['ten', /ten/i], ['twenty', /twenty/i], ['thirty', /thirty/i],
        ['the ceiling he set', /thirty at the most/i],
      ], 400);
    });

    it(`${key}: full open is refused WITH its consequence, not merely discouraged`, () => {
      carries(key, TEXTS[key], ['floods the coil'], [
        ['the loop consequence', /drags the (whole )?loop/i],
        ['the other zones calling for heat they do not need', /call(s)? for heat/i],
        ['the energy burned all night', /all night/i],
      ], 500);
    });

    it(`${key}: the answer is "open this much", and only a trend proves both halves`, () => {
      carries(key, TEXTS[key], ['open this much'], [
        ['that a trend is what proves it', /trend/i],
        ['that it opened', /it opened/i],
        ['and how far', /how far/i],
      ], 500);
    });
  }
});

describe('what a trend MISSES is said plainly — three things, the heart last', () => {
  for (const key of ALL) {
    it(`${key}: the sample interval, the unwired point, and the heart`, () => {
      const w = ourWords(TEXTS[key]);
      expect(w, `${key} never names the between-samples blindness`)
        .toMatch(/between samples|gap between samples/i);
      expect(w, `${key} never names the point that was never wired`)
        .toMatch(/never wired|with no wire/i);
      expect(w, `${key} never says the absence of a line looks like the absence of a problem`)
        .toMatch(/absence of a line looks (exactly )?like the absence of a problem|no line looks just like no problem/i);
    });

    it(`${key}: the interval is called a RESOLUTION, not a lie`, () => {
      // The honest form of the limit. A band that called it a lie would be
      // teaching that instruments deceive, which is not the claim being made.
      carries(key, TEXTS[key], ['two-minute alarm', 'two minute alarm'], [
        ['that it is not a lie', /not a lie/i],
        ['that it is a resolution', /it is a resolution|how fine the chart is/i],
      ], 400);
    });

    it(`${key}: the heart's limit is answered with a PERSON, not a method`, () => {
      carries(key, TEXTS[key], ['who can know it'], [
        ['that the answer is a Person', /a Person/],
        ['and not a method', /not a method|rather than a method|not answer with a method/i],
      ], 400);
    });
  }
});

describe('the Word is the shoreline AND the instrument', () => {
  for (const key of ALL) {
    it(`${key}: his phrase is kept, and a shoreline is defined as not moving when you move`, () => {
      expect(ourWords(TEXTS[key]), `${key} drops his phrase`).toMatch(/guaranteed shoreline/i);
      carries(key, TEXTS[key], ['A shoreline is what'], [
        ['that it does not move when you move', /does not move when \w+ moves?/i],
        ['that it gets no vote', /not a (consensus|vote)/i],
        ['what a moving reference costs', /decoration|just art/i],
      ], 500);
    });

    it(`${key}: the stronger claim is made — a discerner is a sensor`, () => {
      carries(key, TEXTS[key], ['A discerner is a sensor'], [
        ['that it reaches the point nothing else can', /(nobody|nothing) else can reach/i],
        ['that the Word is more than durable — it is the instrument', /instrument|tool/i],
      ], 700);
    });
  }
});

describe('the standard is His, measured with His own trade tools', () => {
  for (const key of ALL) {
    it(`${key}: a false balance is a lie built into the INSTRUMENT`, () => {
      carries(key, TEXTS[key], ['false balance is not', 'false scale is not'], [
        ['that the lie is in the instrument, not in the telling', /(built|build) into the (instrument|tool)/i],
        ['the consequence for every honest weighing after it', /every honest weighing|honest weighing/i],
        ['that this is a calibration error', /calibration error|bad setting/i],
      ], 500);
    });

    it(`${key}: a plummet finds true vertical however crooked the wall is`, () => {
      carries(key, TEXTS[key], ['plummet is', 'weight on a string'], [
        ['what the tool is', /weight on a string/i],
        ['that the wall gets no opinion', /crooked/i],
      ], 400);
    });

    it(`${key}: the self-baseline is refused as a loop whose setpoint tracks itself`, () => {
      carries(key, TEXTS[key], ['Measuring yourself by yourself', 'Measuring you by you'], [
        ['the mechanism — your own trend as its own setpoint', /own trend as (its own setpoint|the mark)/i],
        ['what that always reads', /always reads/i],
        ['that the other chart cannot be seen anyway', /cannot see (their|anyway)|chart you (have never seen|cannot see)/i],
      ], 700);
    });
  }
});

describe('Yahweh already keeps the historian, and samples with no gap', () => {
  for (const key of ALL) {
    it(`${key}: count and number are read as data words`, () => {
      carries(key, TEXTS[key], ['Count is a'], [['that count is a data word', /data word|number word/i]], 300);
    });

    it(`${key}: His sampling is stated to have NO interval, against ours which does`, () => {
      // The contrast is the property. A band that said "He knows everything"
      // would be true, and would not be this lesson.
      carries(key, TEXTS[key], ['no gap between samples'], [
        ['that every historian WE build has an interval', /has an interval|has a gap/i],
        ['that His has none', /has none/i],
      ], 400);
    });

    it(`${key}: the tears are logged rather than dismissed`, () => {
      carries(key, TEXTS[key], ['There is a book'], [
        ['that the crying is in the record', /crying is (logged )?in it/i],
        ['and was not dismissed', /not dismissed|not brushed off|rather than dismissed/i],
      ], 350);
    });
  }
});

describe('the alarm names the way, and the direction is the standard', () => {
  for (const key of ALL) {
    it(`${key}: a deviation alarm announces a GAP early, both directions, naming the correction`, () => {
      carries(key, TEXTS[key], ['deviation alarm'], [
        ['that it announces a gap rather than a verdict', /announces a gap|says there is a gap/i],
        ['that it fires early enough to act', /early enough (to act|that somebody can still act)/i],
      ], 500);
      carries(key, TEXTS[key], ['both directions of error', 'both ways of missing'], [
        ['that it fires on error in either direction', /both (directions|ways)/i],
        ['that it names the correction instead of the crime', /crime/i],
      ], 400);
    });

    it(`${key}: Jeremiah 6:16 is counted out as four verbs with a next action`, () => {
      carries(key, TEXTS[key], ['Stand, see, ask, walk', 'Stand. See. Ask. Walk.'], [
        ['that a next action is attached', /next (action|step)/i],
        ['that this IS the trend review', /trend review/i],
      ], 400);
    });

    it(`${key}: one reading is not a trend, and a rising line contains bad days`, () => {
      carries(key, TEXTS[key], ['One reading is not a trend'], [
        ['what chasing one sample does', /chase noise|chasing noise/i],
        ['that the just path is a slope rather than a level', /rising line|line goes up|slope/i],
        ['that the slope survives bad days', /(contain|contains|hold|can hold) bad days/i],
      ], 700);
    });
  }
});

describe('both classes of point are taught, and the low end is not despised', () => {
  for (const key of ALL) {
    it(`${key}: lukewarm is the failure mode on a DIGITAL point`, () => {
      carries(key, TEXTS[key], ['the middle is'], [
        ['that the middle is the broken state', /broken (state|place)/i],
        ['that not everything in a life is a percentage', /not everything (in a life )?is a percent/i],
      ], 500);
    });

    it(`${key}: full open is the failure mode on an ANALOG point`, () => {
      carries(key, TEXTS[key], ['Honey at full open'], [
        ['that the error is driving to full because full felt sincere', /full felt/i],
        ['that honey itself is good', /Honey is good/i],
      ], 500);
    });

    it(`${key}: at least two worked examples of EACH class, so the skill is usable`, () => {
      const w = ourWords(TEXTS[key]);
      const digital = [/Repentance is (digital|one or zero)/i, /Telling the truth is (digital|one or zero)/i,
        /Turning from sin is (digital|one or zero)/i, /Forgiveness is digital/i].filter((r) => r.test(w)).length;
      const analog = [/Rest is (analog|a range)/i, /Eating is (analog|a range)/i, /Spending is analog/i].filter((r) => r.test(w)).length;
      expect(digital, `${key} gives fewer than two digital examples of a real point of a life`).toBeGreaterThanOrEqual(2);
      expect(analog, `${key} gives fewer than two analog examples`).toBeGreaterThanOrEqual(2);
      expect(w, `${key} never names the cost of getting the classification backwards`)
        .toMatch(/negotiat|trading percents with sin/i);
    });

    it(`${key}: five percent is honoured, not shamed`, () => {
      carries(key, TEXTS[key], ['is five percent'], [
        ['that the low end is not despised', /not despised|not looked down on/i],
      ], 400);
    });
  }
});

describe('his own guard is structural, not a soft ending', () => {
  for (const key of ALL) {
    it(`${key}: not a guilt trip is argued from the muted alarm`, () => {
      // The guard has to be load-bearing. A band that merely asserted "this is
      // not a guilt trip" would do the opposite of what he asked for, because
      // nothing would stop the reader from reading it as one anyway.
      carries(key, TEXTS[key], ['muted'], [
        ['the alarm that shames its operator', /shamed the (operator|worker)/i],
        ['the timescale of the muting', /(within|inside|in) a week/i],
      ], 400);
      expect(ourWords(TEXTS[key]), `${key} never distinguishes a diagnostic from an accusation`)
        .toMatch(/diagnostic and an accusation|test and a blame/i);
    });

    it(`${key}: no condemnation is the state you read a BAD chart from`, () => {
      carries(key, TEXTS[key], ['No condemnation'], [
        ['that it is not a reward for a good chart', /not (the reward|a prize) for (producing )?a good chart/i],
        ['that it is the state you are in while reading a bad one', /while (you )?read(ing)? a bad one/i],
      ], 400);
    });

    it(`${key}: the chastening is given a YIELD with an afterward`, () => {
      carries(key, TEXTS[key], ['known output'], [
        ['that the correction is an input with a known output', /input with a known output/i],
        ['and that the yield comes afterward', /afterward/i],
      ], 300);
    });

    it(`${key}: the getting back on track has a Person doing the leading`, () => {
      carries(key, TEXTS[key], ['getting back on track'], [
        ['Who does the leading', /Person doing the leading|Someone leading/i],
      ], 400);
    });
  }
});

describe('the assignment keeps the two details a reader will want to skip', () => {
  for (const key of ALL) {
    it(`${key}: fix nothing on days one through six, and open the Word BEFORE the sheet`, () => {
      carries(key, TEXTS[key], ['seven days'], [
        ['the ban on correcting during the week', /(fix|do not fix) (anything|nothing) on days one/i],
        ['the Word opened before the sheet', /open the Word (first|before)/i],
        ['why the order matters', /line is set before (the data is read|you read the data)/i],
      ], 700);
    });

    it(`${key}: the point chosen must have a STATE, not a mood`, () => {
      carries(key, TEXTS[key], ['not a mood'], [
        ['a worked example of a state', /did not pray|did not read/i],
        ['that it must be a real point', /real point/i],
      ], 400);
    });

    it(`${key}: and the three questions an engineer asks a chart`, () => {
      carries(key, TEXTS[key], ['three', 'engineer questions'], [
        ['what it actually did', /what did it (actually|really) do/i],
        ['where the gap is', /where is the gap/i],
        ['and whether the adjustment is digital or five percent', /digital or (is it )?five percent|one or zero, or is it five percent/i],
      ], 700);
    });
  }
});
