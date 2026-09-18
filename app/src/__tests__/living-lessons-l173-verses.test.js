// @vitest-environment node
// =============================================================================
// L173 — Humility Is the Strength. Every verse verbatim, every band carrying the
// thesis AND both guards, checked where each does its job.
// =============================================================================
// Darrell, 2026-09-17, spoken into this channel alongside the project-management
// ask: "humility IS the strength it's not the ego it's not pride you don't need
// to feel shame when something negative happens you just need to absorb that and
// understand what am I supposed to learn from this and then don't allow it to
// make you... it's okay to not have your feelings aligned with the reality at
// times you just got to be able to get right and then your feelings will align
// with reality." Plus his testimony: the Lord's perspectives made his many
// certifications faster to comprehend, and the algorithms in the Word are about
// YOU rather than about a machine.
//
// THE FOUR THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. HUMILITY AS SELF-ABASEMENT. The obvious reading of "be humble" is think
//      badly of yourself, and Romans 12:3 says the opposite — think SOBERLY,
//      according as Yahweh dealt the measure. Accuracy, not abasement. A band
//      that lost that would teach a man to undersell what he was given and call
//      it obedience, so the distinction is checked per band.
//   2. NO SHAME BECOMING NO RECKONING. He said absorb it and learn; he did not
//      say shrug. The instrument that separates those is 2 Corinthians 7:10-11 —
//      godly sorrow works repentance, the world's sorrow works death — and the
//      first one's output is itemised as MOVEMENTS. Every band must carry both
//      sorrows, or "no shame" becomes an excuse.
//   3. FEELINGS, IN BOTH DIRECTIONS. A band that only said feelings may lag
//      would drift toward feelings-do-not-matter; a band that only comforted
//      would drift to feelings-first. The Word does neither, and the ORDER is
//      the teaching: recall first, hope after (Lamentations 3:21).
//   4. HIS TESTIMONY OVER-CLAIMED. It would have been easy to dress "studying
//      the Word makes you comprehend systems faster" in a verse and imply a
//      measured score effect. Nothing here measured that, so the lesson states
//      the refusal out loud in every band and a check holds it.
//
// The windowing helper is the one DR-0466 paid for and DR-0468 sharpened:
// quotations out BEFORE the slice, every occurrence of a marker walked, and no
// claim so broad that another sentence in the same window can answer it.
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

const ID = 'll173-humility-is-the-strength-no-shame-and-feelings-that-arrive-late';
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

describe('L173 exists and is mounted', () => {
  it('is mounted exactly once, and titled', () => {
    expect(L, 'L173 is not mounted').toBeTruthy();
    expect(L.title).toBe('Humility Is the Strength — No Shame, and Feelings That Arrive Late');
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
      // Caught for real in this lesson's own pre-band audit: 1 Samuel 30:6 first
      // shipped with an ellipsis swallowing the middle of the verse — the SECOND
      // time in one session I introduced that defect. The remedy is never to
      // elide: two shorter verbatim spans with our own prose between them.
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
    expect(derived.length).toBeGreaterThan(55);
  });
});

describe('the typographic and covenant-name bindings hold', () => {
  it('no adversary name is capitalised anywhere in the lesson', () => {
    const whole = [L.title, L.bigIdea, L.inApp, L.anchor.ref, ...L.benefits,
      ...L.quiz.questions.flatMap((q) => [q.q, ...q.options, q.explain]),
      ...L.facilitator.talkingPoints, ...ALL.map((k) => TEXTS[k])].join(' ');
    for (const name of ['Satan', 'Lucifer', 'Baal', 'The Devil', 'The Dragon', 'The Adversary', 'The Accuser', 'The Deceiver']) {
      expect(whole.includes(name), `${name} is capitalised somewhere in L173`).toBe(false);
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
    // The bright line, CHECKED rather than stated: a blind God→Yahweh sweep
    // would break these quotations, so they are quoted here on purpose.
    expect(L.lesson.includes('for God resisteth the proud, and giveth grace to the humble')).toBe(true);
    expect(L.lesson.includes('that we should be called the sons of God')).toBe(true);
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

describe('the thesis: humility is the INTAKE, not the price', () => {
  for (const key of ALL) {
    it(`${key}: 2 Corinthians 12:10 is read EXACTLY — I am strong, not merely He is`, () => {
      // The whole lesson turns on that clause. A band that quoted it and then
      // paraphrased it the ordinary way ("when I am weak, He is strong") would
      // be teaching the opposite of what it just quoted.
      carries(key, TEXTS[key], ['Read the last clause again', 'Read that last bit again'], [
        ['the refusal of the ordinary paraphrase', /not (say )?when I am weak,? (HE|He) is strong/i],
        ['that the strength arrives IN the man', /in the man|IN the man/],
        // The child band says "quit trying to supply his own" for the same clause.
        ['at the place he stopped supplying his own', /stopped supplying (his|your) own|quit trying to supply (his|your) own/i],
      ], 600);
    });

    it(`${key}: humility is named as the intake rather than the price`, () => {
      // "the intake" is the adult register; the child band renders the same
      // thesis as "the way the strength gets IN".
      carries(key, TEXTS[key], ['the intake', 'the way the strength gets IN'], [
        ['that it is not the price', /not the price/i],
      ], 400);
    });
  }
});

describe('the Proverbs are read as a SEQUENCE, not a mood', () => {
  for (const key of ALL) {
    it(`${key}: BEFORE honour is humility, and the order is named as an order`, () => {
      carries(key, TEXTS[key], ['BEFORE honour'], [
        ['that it is a sequence rather than a mood', /sequence|order of events/i],
        ['and not a mood', /not a mood/i],
      ], 400);
    });

    it(`${key}: and the pairing is priced in ordinary terms`, () => {
      const w = ourWords(TEXTS[key]);
      expect(w, `${key} never prices humility in non-spiritual terms`)
        .toMatch(/price tag|priced|nobody calls spiritual|normal words/i);
      expect(TEXTS[key], `${key} drops Proverbs 22:4`).toContain('(Proverbs 22:4)');
    });
  }
});

describe('the pattern in Him, with the descent and the direction of travel', () => {
  for (const key of ALL) {
    it(`${key}: made himself of no reputation is read as a deliberate act`, () => {
      carries(key, TEXTS[key], ['no reputation'], [
        ['that it takes having one', /(HAD|had) (a reputation|one)/],
      ], 500);
    });

    it(`${key}: you go down, YAHWEH does the lifting — and doing both is the problem`, () => {
      carries(key, TEXTS[key], ['does the lifting'], [
        ['that you go down', /You go down/i],
        ['that Yahweh does the lifting', /Yahweh does the lifting/i],
        ['that doing both jobs yourself is the problem', /both jobs yourself/i],
      ], 400);
    });
  }
});

describe('WHY it is strength operationally — the blocked input', () => {
  for (const key of ALL) {
    it(`${key}: a man who cannot be wrong cannot find the root cause, in order`, () => {
      // Named as mechanical rather than moral, and the chain has to be present
      // or it is just an assertion that humility helps.
      carries(key, TEXTS[key], ['cannot find', 'cannot find out'], [
        ['that the information lives with the people closest to the failure', /closest to the (failure|problem)/i],
        ['that they will not hand it to a man who punishes being wrong', /punishes being wrong/i],
        ['that his pride is a BLOCKED INPUT rather than a bad manner', /blocked (input|wire)/i],
      ], 900);
    });
  }
});

describe('the definition that removes the usual confusion', () => {
  for (const key of ALL) {
    it(`${key}: THINK SOBERLY — accuracy, not abasement`, () => {
      carries(key, TEXTS[key], ['THINK SOBERLY'], [
        ['that it is not thinking badly of yourself', /not thinking (badly|you are bad)/i],
        ['that it is thinking ACCURATELY', /accurate/i],
        // The child band avoids "measure" and says "what Yahweh actually gave you".
        ['and the measure Yahweh actually dealt', /measure|what Yahweh actually gave/i],
      ], 600);
    });

    it(`${key}: and UNDERSELLING is named as the other inaccuracy, costing the same`, () => {
      // Without this the lesson still permits false modesty, which is the error
      // most readers actually have.
      carries(key, TEXTS[key], ['undersells', 'says he is less than he really is'], [
        ['that it is NOT humility', /not being humble|NOT being humble/i],
        ['that it is inaccurate in the other direction', /other direction/i],
        ['and that it costs the work the same', /costs (the work )?the same/i],
      ], 500);
    });

    it(`${key}: the meekest man is shown to be no soft man`, () => {
      carries(key, TEXTS[key], ['Pharaoh'], [
        ['that he broke the tablets', /tablets/i],
        ['that inheriting the earth is not what timidity gets', /timid/i],
      ], 900);
    });
  }
});

describe('no shame — with the standing condition first', () => {
  for (const key of ALL) {
    it(`${key}: Romans 8:1 is placed FIRST, as the place everything else is read from`, () => {
      // FIRST is an ORDER property, so it is checked on the order itself, in the
      // raw text. The earlier version of this check windowed our prose around the
      // quotation's own words — which ourWords() strips before the slice is cut,
      // so it could only ever fail. Worse, had it passed it would have proved
      // nothing about placement. Each reference appears exactly once per band.
      const raw = String(TEXTS[key]);
      const shame = raw.search(/YOU DO NOT NEED TO FEEL SHAME WHEN SOMETHING/i);
      const rom = raw.indexOf('(Romans 8:1)');
      const pity = raw.indexOf('(Psalms 103:13-14)');
      const falls = raw.indexOf('(Proverbs 24:16)');
      for (const [name, i] of [['the shame section', shame], ['Romans 8:1', rom],
        ['Psalms 103:13-14', pity], ['Proverbs 24:16', falls]]) {
        expect(i, `${key} is missing ${name}`).toBeGreaterThan(-1);
      }
      expect(rom, `${key} puts Romans 8:1 before the section it grounds`).toBeGreaterThan(shame);
      expect(pity, `${key} reads Yahweh's pity BEFORE the no-condemnation standing`)
        .toBeGreaterThan(rom);
      expect(falls, `${key} counts the seven falls BEFORE the standing condition`)
        .toBeGreaterThan(rom);
      // And our own prose in the run-up names it as the condition read from.
      carries(key, TEXTS[key], ['Start with the standing condition', 'Start with where you stand'], [
        ['that it is the standing condition read from', /standing condition|where you stand/i],
        ['and that everything else is read from inside it', /read from inside/i],
      ], 400);
    });

    it(`${key}: seven falls, and the RISING is what makes him just`, () => {
      carries(key, TEXTS[key], ['Seven'], [
        ['that it is not once-then-forgiven', /Not once/i],
        ['that the rising is what makes him just', /rising is what makes him/i],
        ['and not the absence of falling', /not the not-falling|Not the never falling/i],
      ], 400);
    });
  }
});

describe('THE TWO SORROWS — the paragraph that keeps this from becoming an excuse', () => {
  for (const key of ALL) {
    it(`${key}: both sorrows named, with their different outputs`, () => {
      carries(key, TEXTS[key], ['Two sorrows', 'Two kinds'], [
        ['that one works repentance', /repentance|turn around/i],
        ['and the other works death', /death/i],
      ], 500);
    });

    it(`${key}: the first one's output is itemised and named as MOVEMENT`, () => {
      // The itemising is the point: it is what makes "absorb it" concrete
      // rather than a feeling about a feeling.
      carries(key, TEXTS[key], ['MOVE'], [
        ['carefulness', /careful/i],
        ['clearing', /clearing/i],
        ['zeal', /zeal|fired up/i],
        ['that godly sorrow gets up and does something', /gets (up|UP)/],
      ], 600);
    });

    it(`${key}: and the world's kind is named as the thing he is REFUSING`, () => {
      // Caught by the break harness: the check's NAME promised REFUSING and no
      // claim asserted it, so the world's sorrow could quietly become something
      // merely observed. His own word was "absorb", and the other kind is the
      // thing being turned down — that is now a claim, not a title.
      carries(key, TEXTS[key], ['sits down with itself'], [
        ['that it calls that feeling bad', /feeling bad/i],
        // The child band says "the thing he is saying no to".
        ['that the second kind is the thing he is REFUSING', /he is refusing|he is saying no to/i],
        ['that this is not softness', /not (being )?soft/i],
        ['and the difference between a correction and a wound', /a wound/i],
      ], 500);
    });
  }
});

describe('what am I supposed to learn — the chain, and the identity clause', () => {
  for (const key of ALL) {
    it(`${key}: the chastening is family business with a yield and a delay`, () => {
      carries(key, TEXTS[key], ['Afterward'], [
        ['that it yields', /yield/i],
        ['and that this is family rather than court', /family/i],
      ], 700);
    });

    it(`${key}: the Romans 5 chain ends in hope that MAKETH NOT ASHAMED`, () => {
      carries(key, TEXTS[key], ['maketh not ashamed', 'MAKETH NOT ASHAMED', 'MAKES YOU NOT ASHAMED'], [
        ['that the chain starts in the bad thing', /starts (in|with) the bad thing/i],
        ['and that this is the last link rather than a consolation', /last link/i],
      ], 600);
    });

    it(`${key}: DO NOT LET IT MAKE YOU — and why that is available`, () => {
      carries(key, TEXTS[key], ['MAKE you'], [
        ['that he did not say do not let it hurt', /do not (let it )?hurt/i],
        ['that the event does not get to author you', /author|decide who you are/i],
        // The child band said "because Yahweh already decided who you are"; the
        // four register bands said "by somebody else" and left Him unnamed at the
        // load-bearing clause. This check caught that, and the lesson was fixed.
        ['because Yahweh already did', /Yahweh already/i],
      ], 700);
    });

    it(`${key}: NOW are the sons, and it doth not yet appear — the gap is named`, () => {
      carries(key, TEXTS[key], ['does not yet appear', 'does not show yet'], [
        ['that the status is settled now', /NOW (are|we)/],
        ['and that the gap is what a bad week exploits', /bad week/i],
      ], 500);
    });
  }
});

describe('feelings may arrive late — shown, not merely permitted', () => {
  for (const key of ALL) {
    it(`${key}: one psalm turns over inside itself with nothing reported as changed`, () => {
      carries(key, TEXTS[key], ['Same psalm'], [
        ['that it is the same man', /Same man/i],
        ['that nothing in the circumstances is reported as changed', /nothing in (his|the) (situation|circumstances)/i],
        ['and that the psalm did not wait for the feeling', /did not wait/i],
      ], 700);
    });

    it(`${key}: RECALL FIRST, HOPE AFTER — and the reverse is explicitly refused`, () => {
      // The order IS the teaching. A band that carried the verse but not the
      // order would leave the reader waiting to feel like recalling.
      carries(key, TEXTS[key], ['RECALL FIRST'], [
        ['that hope comes after', /HOPE AFTER|hope comes after/i],
        ['and that the reverse is refused', /Not hope, (therefore|so then)/i],
      ], 400);
    });

    it(`${key}: David encouraged HIMSELF, with nobody left to do it for him`, () => {
      carries(key, TEXTS[key], ['encouraged HIMSELF'], [
        // The child band says "There was nobody left to do it for him".
        ['that nobody was available to do it for him', /nobody (was available|was left)|was nobody (available|left)/i],
      ], 400);
    });

    it(`${key}: BOTH errors about feeling are closed off`, () => {
      carries(key, TEXTS[key], ['Not feelings-first', 'Not feelings first'], [
        // The register bands hyphenate the compound (feelings-do-not-matter), so a
        // spaced-only pattern cannot see it; and the child band says "might not
        // show up" where the others say "may not come".
        ['that feelings-first waits for what may not come', /(may|might) not (come|show up|arrive)/i],
        ['that feelings-do-not-matter is refused too', /do[- ]not[- ]matter/i],
        ['and that the Psalms kept the complaint in the book', /in the book/i],
      ], 500);
    });
  }
});

describe('the lane is an assignment, and the vision keeps you in it', () => {
  for (const key of ALL) {
    it(`${key}: Yahweh SET the members — a placement, not a ceiling`, () => {
      // Caught by the break harness: with the ceiling sentence removed entirely
      // this stayed green, because at 500 chars the window also swept in the
      // band's earlier "a lane is a JOB, not a fence" — a DIFFERENT sentence
      // answering the same alternation. The fence is a fine line elsewhere; it
      // cannot stand in for THIS one. So the ceiling refusal is its own claim,
      // the placement must be the specific clause rather than a bare noun, and
      // the pad is tight enough that only this paragraph can answer.
      carries(key, TEXTS[key], ['set them', 'SET them'], [
        ['that a lane is not a CEILING imposed on you', /not a (low )?ceiling/i],
        ['but a placement made FOR you, on purpose', /a spot somebody put you in|a placement somebody made for you/i],
      ], 300);
    });

    it(`${key}: the vision is WRITTEN and made plain so it can be RUN`, () => {
      carries(key, TEXTS[key], ['make it plain', 'Make it plain'], [
        ['that it can then be run', /\bRUN\b|run it/],
        ['including on a day you cannot remember it', /cannot remember/i],
      ], 600);
    });

    it(`${key}: and the half of Proverbs 29:18 nobody quotes is named`, () => {
      carries(key, TEXTS[key], ['first half', 'first one'], [
        ['that the second half says what a vision is made of', /made of/i],
      ], 400);
    });
  }
});

describe('his testimony is kept as testimony, with the limit said out loud', () => {
  for (const key of ALL) {
    it(`${key}: the MECHANISM is explained — naming is faster than learning`, () => {
      // Caught by the break harness: removing "He is not learning the thing" left
      // this green, and that clause IS the mechanism. Holding the categories and
      // hearing a new label for them are only half each; the claim that makes it
      // a mechanism rather than a compliment is the CONTRAST between the two.
      carries(key, TEXTS[key], ['Naming is faster than learning', 'naming is faster than learning'], [
        ['that he already held the categories', /already (holds|knows|carries)/i],
        // The register bands spell the contrast out item by item: "He is not
        // learning that work needs a scope, that a scale must be just..."
        ['that he is NOT learning the thing itself', /not learning the thing|is not learning (the|that)/i],
        ['and was learning what the industry calls them', /call/i],
      ], 800);
    });

    it(`${key}: AND THE REFUSAL IS EXPLICIT — no claim about exam scores`, () => {
      // This is the check most likely to be "improved" away by someone who
      // wants the testimony to land harder. It is the honest part.
      carries(key, TEXTS[key], ['exam score', 'test score'], [
        ['that no such claim is made', /Nothing here claims|We are not saying/i],
        ['that it was not measured', /not been measured|Nobody measured/i],
        ['and that a verse-dressed claim would cost more than it buys', /cost more than it buys|would not be honest/i],
      ], 600);
    });

    it(`${key}: and seeing is named as what makes experience fruitful, with the mechanism`, () => {
      carries(key, TEXTS[key], ['BY REASON OF USE'], [
        ['that the senses are exercised by using them', /exercised|sharp/i],
        ['that what it produces is discernment', /discern/i],
        ['and the difference between living through and learning from', /learning from|LEARNING from/i],
      ], 700);
    });
  }
});

describe('the week’s work is concrete and keeps its strict details', () => {
  for (const key of ALL) {
    it(`${key}: the two-sorrows exercise, both columns, with the second NAMED as put down`, () => {
      // Windowed on the exercise itself. Checking the whole band would let some
      // other paragraph answer a column the exercise never asked for — the same
      // wrong-paragraph face this file's helper exists to close. The DOING column
      // is "what it made you DO" in the child band and "what carefulness,
      // clearing or zeal it produced" in the register bands: the same column,
      // named in 2 Corinthians 7:11's own itemised movements.
      carries(key, TEXTS[key], ['two sorrows', 'two kinds of sadness'], [
        ['the column for what it made you DO', /made you DO|it made you do|carefulness, clearing or zeal it produced/i],
        ['the column for what it only made you FEEL, with no movement in it', /no movement attached|no action in it/i],
        // Caught by the break harness: removing the written naming left this green,
        // because the plain "Put that down." two sentences earlier answered the
        // alternation. The property is that the putting-down is WRITTEN, not just
        // done, so the claim now requires the naming clause itself.
        ['the second column NAMED IN WRITING as the thing being put down', /name it as the thing you are putting down|write that you are putting it down/i],
        ['and the refusal of just deciding to feel better', /not just decide to feel better|rather than just deciding to feel better/i],
      ], 700);
    });

    it(`${key}: one sentence, Habakkuk 2:2 on their own lane, and Psalms 42:5 out loud`, () => {
      const w = ourWords(TEXTS[key]);
      expect(w, `${key} drops the one-sentence discipline`).toMatch(/One sentence|ONE sentence/);
      expect(w, `${key} drops the written-vision step`).toMatch(/Habakkuk 2:2/);
      expect(w, `${key} drops saying it to your own soul`).toMatch(/Psalms 42:5/);
      expect(w, `${key} never requires it be said BEFORE it feels true`)
        .toMatch(/before it (is|feels) true/i);
    });
  }
});
