// @vitest-environment node
// =============================================================================
// L174 — The Levels of Disrespect, and the Gap Between What He Means and What We
// Say. Every verse verbatim, every band carrying the whole answer, and the
// guardrail checked where it does its job.
// =============================================================================
// Darrell spoke this lesson into the channel on 2026-09-18 in pieces, and every
// piece is a requirement this gate holds:
//   "What is and are the levels of disrespecting Yahweh? Abomination... what
//    does Yahweh mean and what does both relationships look like when they are
//    shown in the biblical scriptures?"
//   "What where when how and why are they bad and the good what makes it good?
//    Either the perpetual issues..."
//   "Gap between what He means and what we say He means..."
//   "Even the gap between what we heard that no one said... it's projected by
//    simple mindedness or misunderstanding..."
//   "Prefrontal cortex and brain regions for emotions etc"  /  "Latest research
//    is mandatory"
//   "Recognition for your need to comprehend Yahweh."  /  "Prioritize His
//    company"
//   "We want truth and clarity opportunities and constraints currently so the
//    understanding is not just about arguments..."
//   "Multiple sme's as council etc..."
//   "Emotional processes don't undermine truth... flesh don't win... spirit
//    win..."
// Then, mid-build, three corrections that are checked here as their own
// properties because each one changes what the lesson teaches:
//   "Test are for truth"  /  "Not I gotcha"  /  "Just clarification on what's
//    what"
//   "Trust and verify are two different skills"  /  "Both important"
//   "Faith is the substance of things hoped for evidence of things not seen...
//    Yahweh loves it"  /  "Without faith it's impossible to please Yahweh"
//   "He made me and then died for me... I want to please Him... why not... I'm
//    sure it'll be the best!!!!"
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. A NUMBERED SCALE HE NEVER PUBLISHED. He grades disrespect — "greater
//      abominations than these" three times in Ezekiel 8 — and He never issues
//      a numbered list. The easy lesson invents eight tidy degrees and presents
//      them as His. Every band must say the ordering is OURS and that where He
//      never compared two items we are not ranking them.
//   2. THE ABOMINATION HALF WITHOUT THE DELIGHT HALF. Proverbs pairs them in
//      one sentence, every time. A band that carried only the offence would
//      teach a Yahweh who is against things and for nothing, which is the
//      opposite of the verse's own grammar.
//   3. THE SECOND GAP COLLAPSING INTO THE FIRST. It is easy to teach the
//      adversary's distortion and quietly drop the harder half — the clause
//      nobody spoke, added sincerely and then quoted as His word. Both halves
//      are checked, and so is the sentence that governs them.
//   4. THE RESEARCH BECOMING AN EXCUSE. Naming the prefrontal cortex and the
//      amygdala explains how the gap opens. It never licenses it. Every band
//      must carry the guardrail in his own terms, and must say out loud that
//      the mechanism is described rather than excused.
//   5. THE REGISTER READ AS SUSPICION. Trust and verifying are two skills and
//      both are required, and faith is called the EVIDENCE rather than the
//      absence of it. A band that only verified would teach a man to audit
//      Yahweh and never rest in Him.
//   6. THE COVENANT NAME SUBSTITUTED INTO A QUOTATION. This lesson is ABOUT the
//      name, which puts maximum pressure on the bright line. Yahweh belongs in
//      OUR prose; the KJV's "God" and "the LORD" stay exactly as written inside
//      every quotation. Checked in both directions.
//
// Check-writing rules in force, each already paid for: every claim check reads
// OUR prose with quotations stripped; no alternation branch is merely a word
// the passage contains, nor a phrase our prose echoes out of the quotation
// beside it, nor a title keyword (the title is in every band by construction);
// one claim per test; and no check narrows the Word's own options.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';
import quotationIntegrity from '../lib/quotation-integrity-baseline.json';

const ID = 'll174-the-levels-of-disrespect-and-the-gap-between-what-he-means-and-what-we-say';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);
// The reader fields, for the name and adversary checks: what a reader is handed.
const READER = { lesson: L.lesson, bigIdea: L.bigIdea, inApp: L.inApp, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };

// ---------------------------------------------------------------------------
// The corpus, and the STRICT comparison
// ---------------------------------------------------------------------------
// STRICT is whitespace-only. Apostrophes are NEVER normalised: the corpus
// carries the typographic apostrophe and so must the KJV side, or "children's"
// silently passes for "children’s" and the quotation is not His.
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
// bookKey must NOT rewrite a leading numeral: 1Corinthians.json.
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
  return parts.some((x) => x == null) ? null : parts.join(' ');
};

// The book pattern MUST allow internal words, or Song of Solomon is silently
// skipped by every check that uses it.
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (text) => {
  const out = [];
  SPAN_WITH_REF.lastIndex = 0;
  let m;
  while ((m = SPAN_WITH_REF.exec(text))) out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  return out;
};

// ---------------------------------------------------------------------------
// OUR prose: quotations out FIRST, then the reference parentheses
// ---------------------------------------------------------------------------
// Every claim check below reads this and only this. A check that reads the raw
// band can be answered by the verse sitting beside the claim, which is a check
// that cannot fail.
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

describe('L174 — the shape of the lesson', () => {
  it('is mounted', () => {
    expect(L, `${ID} is not in the series`).toBeTruthy();
  });

  it('carries all four age bands', () => {
    for (const b of BANDS) expect(String(L.levels[b] || '').trim().length, `${b} is empty`).toBeGreaterThan(400);
  });

  it('has no band below the coverage floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('adds no entry to the coverage debt', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
  });

  it('adds no entry to the reading-level debt', () => {
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
  });

  it('adds no entry to the title-in-narrative debt', () => {
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
  });

  it('adds no entry to the quotation debt', () => {
    expect(Object.keys(quotationIntegrity.elided)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.recited)).not.toContain(ID);
  });

  it('runs a monotone reading ladder from child to senior', () => {
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('teen'), 'teen does not read above child').toBeGreaterThan(g('child'));
    expect(g('senior'), 'senior does not read above teen').toBeGreaterThan(g('teen'));
  });

  it('keeps the child band under the ceiling a NEW lesson is held to', () => {
    expect(fleschKincaidGrade(ourProseOnly(L.levels.child))).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('opens every band on the name of its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('renders numbered sections in every band', () => {
    for (const k of ALL) expect(formatLessonText(TEXTS[k]).sectionCount, `${k} renders too few sections`).toBeGreaterThanOrEqual(5);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });
});

describe('L174 — His words, exactly as He said them', () => {
  it('quotes every referenced span verbatim from the KJV', () => {
    const bad = [];
    for (const k of ALL) {
      for (const s of spansOf(TEXTS[k])) {
        const text = versesOf(s.book, s.ch, s.vs);
        if (text == null) { bad.push(`${k}: ${s.book} ${s.ch}:${s.vs} does not resolve`); continue; }
        if (!norm(text).includes(norm(s.quote))) bad.push(`${k}: ${s.book} ${s.ch}:${s.vs} — ${s.quote.slice(0, 70)}`);
      }
    }
    expect(bad, `spans that are not His words:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves no quoted span without its reference', () => {
    for (const k of ALL) {
      const all = (TEXTS[k].match(ALL_SPANS) || []).length;
      const referenced = spansOf(TEXTS[k]).length;
      // ZERO, not a bounded allowance. The first run of this gate found 3 to 5
      // orphans per band — every one of them the LEAD of a chained series whose
      // single reference sat at the end. Each lead now carries its own verse, so
      // the honest floor is nought and any new orphan fails here.
      expect(all - referenced, `${k} has an unreferenced span`).toBe(0);
    }
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    // Not the reader fields: EVERY string. A gate that never reads a field
    // passes on it for ever, and the elision that taught us this was in a quiz
    // option, outside the ratchet's own scope.
    const found = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
      }
    };
    walk(L, '');
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('claims no paraphrase anywhere in the module', () => {
    const found = [];
    const walk = (node, path) => {
      if (typeof node === 'string') { if (/paraphras/i.test(node)) found.push(path); }
      else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(found, `fields claiming a paraphrase: ${found.join(', ')}`).toEqual([]);
  });

  it('never capitalises an adversary name anywhere in the module', () => {
    const found = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
          if (node.includes(bad)) found.push(`${path}: ${bad}`);
        }
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(found, `capitalised adversary names:\n${found.join('\n')}`).toEqual([]);
  });

  it('says Yahweh in its own prose in every reader field', () => {
    for (const [k, v] of Object.entries(READER)) {
      // Case-BLIND on purpose: bigIdea is rendered in full capitals by house
      // style, so a case-sensitive check would report YAHWEH as a miss and the
      // obvious "fix" would be to break the field's styling.
      expect(ours(v), `${k} never names Him by His covenant name in our own voice`).toMatch(/Yahweh/i);
    }
  });

  it('never says the generic name in its own prose in any reader field', () => {
    // The bright line runs the other way too: this lesson is ABOUT the name, so
    // a generic slip here would be the loudest possible one.
    const bad = [];
    for (const [k, v] of Object.entries(READER)) {
      const mine = ours(v);
      for (const m of mine.match(/.{0,24}\bGod\b.{0,16}/g) || []) {
        if (!/of God|word of God|will of God|knowledge of God|power of God|Son of God/.test(m)) bad.push(`${k}: ${m.trim()}`);
      }
    }
    expect(bad, `generic uses in our own prose:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves the KJV generic name untouched inside its quotations', () => {
    // The complement of the check above, and the reason it cannot be satisfied
    // by a blind sweep: His own text says God and the LORD, and that stays.
    for (const k of ALL) {
      expect(TEXTS[k], `${k} has scrubbed the KJV's own wording`).toContain('hath God said');
    }
  });

  it('recites no record id to the reader', () => {
    for (const [k, v] of Object.entries(READER)) expect(v, `${k} recites a record id`).not.toMatch(/DR-\d{4}/);
  });

  it('names every anchor reference somewhere the reader meets it', () => {
    const body = [L.lesson, L.bigIdea, ...BANDS.map((b) => L.levels[b]), ...L.benefits].join(' ');
    const missing = L.anchor.ref.split(';').map((s) => s.trim()).filter((r) => r && !body.includes(r));
    // A range label names its members: Exodus 34:6-7 is named by that label.
    expect(missing, `anchors never named: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('L174 — what His name means', () => {
  it('teaches the name as a report on His character rather than a pronunciation', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not treat the name as a self-report`).toMatch(/self-report|who He is|His heart|His character/i);
  });

  it('quotes the proclamation in which He describes Himself, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the proclamation`).toContain('merciful and gracious, longsuffering');
  });

  it('keeps the exacting half of that proclamation beside the merciful half', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the half that does not clear the guilty`).toContain('by no means clear the guilty');
  });

  it('defines disrespect as contradicting what He published about Himself', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what disrespect actually is`).toMatch(/mispronunciation|saying His name wrong|contradict/i);
  });

  it('carries the trust that runs off knowing the name, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the trust verse`).toContain('they that know thy name will put their trust in thee');
  });
});

describe('L174 — both relationships, and what makes the good good', () => {
  it('quotes the false balance and the just weight in one verse, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the paired verse`).toContain('A false balance is abomination to the LORD: but a just weight is his delight');
  });

  it('carries a second paired verse so the pairing is a pattern rather than one line', () => {
    for (const k of ALL) {
      const carries = TEXTS[k].includes('The sacrifice of the wicked is an abomination to the LORD: but the prayer of the upright is his delight')
        || TEXTS[k].includes('The way of the wicked is an abomination unto the LORD: but he loveth him that followeth after righteousness');
      // Not narrowed to one of the two: the Word gives both, and a band may
      // reach the pattern through either.
      expect(carries, `${k} shows the pairing only once`).toBe(true);
    }
  });

  it('says the good is good because it is His delight', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what makes the good good`).toMatch(/delight/i);
  });

  it('refuses to ground the good in usefulness or consensus', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not rule out the alternative grounds`).toMatch(/efficient|fair|vote|consensus|admired|reputation/i);
  });

  it('records the offenders who did not know they were offending', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the question the priests asked Him`).toContain('Wherein have we despised thy name?');
  });
});

describe('L174 — the grading, without a scale He never gave', () => {
  it('quotes His own comparative, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} never shows Him grading`).toContain('greater abominations');
  });

  it('says the ordering is ours rather than His', () => {
    for (const k of ALL) expect(OURS[k], `${k} presents our ordering as His`).toMatch(/OUR order|our ordering/i);
  });

  it('refuses to rank what He never compared', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not state the refusal`).toMatch(/did not hand us the numbers|does not invent a rank|declines to (?:invent|manufacture) a rank/i);
  });

  it('carries the prayer that itself becomes the offence, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the turned-away ear`).toContain('even his prayer shall be abomination');
  });

  it('points out that the PRAYER is the subject of that sentence', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the reader miss what became the abomination`).toMatch(/PRAYER/);
  });

  it('carries the test He gave the priests about their governor, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the governor test`).toMatch(/will he be pleased with thee|offer it now unto thy governor|take that same gift to the governor/);
  });

  it('carries the seven in His own words, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the inventory of seven`).toContain('he that soweth discord among brethren');
  });

  it('draws attention to the range of that inventory', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says how wide the seven are`).toMatch(/range|how wide|expression and a (?:killing|homicide)|a face and a/i);
  });

  it('names the four PERPETUAL offences as postures rather than events', () => {
    for (const k of ALL) expect(OURS[k], `${k} never marks the perpetual ones`).toMatch(/perpetual|never stop/i);
  });

  it('says the perpetual ones do not end when the meeting ends', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says why the perpetual ones differ`).toMatch(/after the meeting|when the meeting (?:ends|finishes)|keep going after/i);
  });

  it('places the blood of the covenant at the severe end, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the severe end`).toContain('trodden under foot the Son of God');
  });

  it('confesses Jesus as the Lamb of Yahweh where that severe end is taught', () => {
    for (const k of ALL) expect(OURS[k], `${k} teaches the offence against Him without confessing who He is`).toMatch(/Lamb of Yahweh/);
  });
});

describe('L174 — the two-sided gap', () => {
  it('establishes what He said BEFORE quoting what was said about it', () => {
    for (const k of ALL) {
      const said = TEXTS[k].indexOf('Of every tree of the garden thou mayest freely eat');
      const twisted = TEXTS[k].indexOf('Yea, hath God said');
      expect(said, `${k} never states what He actually said`).toBeGreaterThan(-1);
      expect(twisted, `${k} quotes the distortion before establishing His words`).toBeGreaterThan(said);
    }
  });

  it('quotes the re-quote with the generosity removed, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the first side of the gap`).toContain('Ye shall not eat of every tree of the garden?');
  });

  it('names that first side as a re-quote rather than a new claim', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not identify the mechanism of the distortion`).toMatch(/re-quote|re-quotation|quoting Him with the good part cut out/i);
  });

  it('quotes the clause nobody ever spoke, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the second side of the gap`).toContain('neither shall ye touch it');
  });

  it('states that nobody said that clause', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the added clause pass as His word`).toMatch(/never said touch/i);
  });

  it('marks the second side as sincere rather than malicious', () => {
    for (const k of ALL) expect(OURS[k], `${k} collapses the projection into the lie`).toMatch(/nobody lied|no one lied|not lying|rather than (?:from )?malice/i);
  });

  it('says both sides make Him smaller than He is', () => {
    for (const k of ALL) expect(OURS[k], `${k} never states what the two sides share`).toMatch(/SMALLER THAN HE IS/);
  });

  it('names the withholding charge that the distortion makes', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not say what the distortion alleges`).toMatch(/withholds|holds back/i);
  });

  it('names the touchiness charge that the projection makes', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not say what the projection alleges`).toMatch(/touchy|easily offended|fastidious/i);
  });

  it('carries His ruling on men who defended Him inaccurately, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} drops the ruling on Job's friends`).toContain('ye have not spoken of me the thing that is right');
  });

  it('says accuracy rather than sincerity was the criterion there', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves sincerity standing as a defence`).toMatch(/accura|being right about Him/i);
  });
});

describe('L174 — the mind He built, and the guardrail on it', () => {
  it('carries the Word naming the mechanism before any laboratory did, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the answering-before-hearing verse`).toContain('He that answereth a matter before he heareth it');
  });

  it('names the prefrontal cortex in every band', () => {
    for (const k of ALL) expect(OURS[k], `${k} never names the region Darrell asked for`).toMatch(/prefrontal cortex/i);
  });

  it('names the amygdala in every band', () => {
    for (const k of ALL) expect(OURS[k], `${k} never names the alarm region`).toMatch(/amygdala/i);
  });

  it('cites research from the year the lesson was built, in every band', () => {
    // "Latest research is mandatory" is a requirement, so it is a check.
    for (const k of ALL) expect(OURS[k], `${k} carries no current research`).toMatch(/2026/);
  });

  it('corrects the one-way model of regulation in every band', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves the switch model standing`).toMatch(/both ways|BOTH directions|reciprocal|loop, not a switch|two-way/i);
  });

  it('explains the projection through the failure of a source tag', () => {
    for (const k of ALL) expect(OURS[k], `${k} never explains how a supplied sentence returns as a quotation`).toMatch(/source monitoring|tag/i);
  });

  it('names the conditions that degrade that source tag', () => {
    for (const k of ALL) expect(OURS[k], `${k} omits the conditions under which the tag fails`).toMatch(/stress|upset/i);
  });

  it('carries the walk-in-the-Spirit instruction in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the guardrail verse`).toContain('ye shall not fulfil the lust of the flesh');
  });

  it('carries the captivity of every thought in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the working instruction`).toContain('bringing into captivity every thought to the obedience of Christ');
  });

  it('states his rule that the flesh does not win', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the first half of his rule`).toMatch(/flesh does not (?:win|beat)|flesh do(?:es)? not win/i);
  });

  it('states his rule that the spirit wins', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the second half of his rule`).toMatch(/spirit wins/i);
  });

  it('says the mechanism is described rather than excused', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the research become an excuse`).toMatch(/never excuse|does not excuse|not excuse it|verdict to (?:hide|shelter)/i);
  });
});

describe('L174 — the register, so it is a process rather than an argument', () => {
  it('carries the secret-and-revealed division in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the missing-information verse`).toContain('The secret things belong unto the LORD our God');
  });

  it('carries the concealing-and-searching division of offices in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the two offices`).toContain('but the honour of kings is to search out a matter');
  });

  it('states the constraint in His own words in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} never states the limit`).toContain('now I know in part');
  });

  it('refuses to read that limit as knowing nothing', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the limit collapse into ignorance`).toMatch(/not nothing|nothing like knowing nothing|distinguishable from ignorance|different from ignorance/i);
  });

  it('carries the opportunity as open-ended in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the opportunity verse`).toContain('Then shall we know, if we follow on to know the LORD');
  });

  it('carries the daily search of the text in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the data-driven model`).toContain('searched the scriptures daily, whether those things were so');
  });

  it('carries the multitude of counsellors in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the council`).toContain('in the multitude of counsellors there is safety');
  });

  it('gives the reason one voice is not a council, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} states the council without its reason`).toContain('He that is first in his own cause seemeth just');
  });

  it('says the first account is the one that sounds right', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says why the first account is dangerous`).toMatch(/(?:first|initial) (?:account|story) (?:always |invariably )?sounds/i);
  });

  it('carries prove-all-things in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the proving instruction`).toContain('Prove all things; hold fast that which is good');
  });

  it('fixes the posture of the test as being for truth', () => {
    // Darrell 2026-09-18: "Test are for truth".
    for (const k of ALL) expect(OURS[k], `${k} never says what a test is for`).toMatch(/FOR TRUTH|find out what is true|find the truth/i);
  });

  it('forbids the gotcha posture explicitly', () => {
    // Darrell 2026-09-18: "Not I gotcha".
    for (const k of ALL) expect(OURS[k], `${k} leaves the gotcha posture available`).toMatch(/gotcha/i);
  });

  it('calls a test clarification on what is what', () => {
    // Darrell 2026-09-18: "Just clarification on what's what".
    for (const k of ALL) expect(OURS[k], `${k} never states the modest purpose of a test`).toMatch(/what is what/i);
  });

  it('says a test aimed at winning has become a trap', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not say what a gotcha test turns into`).toMatch(/trap/i);
  });

  it('distinguishes trusting from verifying as two separate skills', () => {
    // Darrell 2026-09-18: "Trust and verify are two different skills" / "Both important".
    for (const k of ALL) expect(OURS[k], `${k} collapses the two skills into one`).toMatch(/two different skills|two separate skills/i);
  });

  it('says each of those two skills fails when held alone', () => {
    for (const k of ALL) expect(OURS[k], `${k} names the two skills without saying why both are needed`).toMatch(/only (?:the )?verif|Only verifying|only check|audits Yahweh/i);
  });

  it('shows the Bereans exercising both in one sentence, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} loses the readiness half of the Berean posture`).toMatch(/readiness of mind|glad heart/);
  });

  it('carries the design that makes the need to comprehend Him legitimate, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the readable-world verse`).toContain('the invisible things of him from the creation of the world are clearly seen');
  });

  it('says wanting to understand Him is the equipment working rather than arrogance', () => {
    for (const k of ALL) expect(OURS[k], `${k} never legitimises the need to comprehend Him`).toMatch(/not arrogance|is not rude|legitimate/i);
  });

  it('says a named unknown does not become a projection', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says why the register closes the second gap`).toMatch(/named unknown/i);
  });
});

describe('L174 — faith as evidence, and the motive behind it', () => {
  it('carries the definition of faith in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the definition of faith`).toContain('the evidence of things not seen');
  });

  it('says faith is called the evidence rather than the absence of it', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets faith read as the opposite of evidence`).toMatch(/EVIDENCE/);
  });

  it('sources faith in His words rather than in a mood, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing where faith comes from`).toContain('faith cometh by hearing, and hearing by the word of God');
  });

  it('carries the stake stated in Hebrews, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the stake`).toContain('without faith it is impossible to please him');
  });

  it('states plainly that Yahweh loves faith', () => {
    // Darrell 2026-09-18: "Yahweh loves it".
    for (const k of ALL) expect(OURS[k], `${k} never says how He feels about faith`).toMatch(/Yahweh loves faith/i);
  });

  it('ties that stake to diligent seeking rather than to belief alone', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the seeking half of the verse`).toMatch(/DILIGENTLY SEEK|SEEK hard/);
  });

  it('carries that He made us, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the making`).toContain('by him all things consist');
  });

  it('carries that the making was particular, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the particularity of the making`).toContain('for I am fearfully and wonderfully made');
  });

  it('carries that He died while the account still stood, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the dying`).toContain('while we were yet sinners, Christ died for us');
  });

  it('renders his own reason for wanting to please Him', () => {
    // Darrell 2026-09-18: "He made me and then died for me... I want to please
    // Him... why not... I'm sure it'll be the best!!!!"
    for (const k of ALL) expect(OURS[k], `${k} never gives the motive in his terms`).toMatch(/made me and then died for me/i);
  });

  it('answers the why-not by invitation rather than by argument, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the invitation`).toContain('O taste and see that the LORD is good');
  });

  it('grounds that it will be the best in the adjective the Word itself uses, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the Word's own adjective`).toContain('good, and acceptable, and perfect, will of God');
  });

  it('keeps the register running at that point by naming its verb', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the closing skip the proving`).toMatch(/PROVE/);
  });
});

describe('L174 — His company is the method', () => {
  it('carries the offer of the Presence in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the offer`).toContain('My presence shall go with thee, and I will give thee rest');
  });

  it('carries the refusal to advance without it, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing Moses answer`).toContain('If thy presence go not with me, carry us not up hence');
  });

  it('puts dwelling and beholding BEFORE enquiring, in His own order', () => {
    for (const k of ALL) {
      const raw = TEXTS[k];
      const dwell = raw.indexOf('that I may dwell in the house of the LORD');
      const behold = raw.indexOf('to behold the beauty of the LORD');
      const enquire = raw.indexOf('to enquire in his temple');
      expect(dwell, `${k} is missing the dwelling`).toBeGreaterThan(-1);
      expect(behold, `${k} puts beholding before dwelling`).toBeGreaterThan(dwell);
      expect(enquire, `${k} puts enquiring before beholding`).toBeGreaterThan(behold);
    }
  });

  it('says the answers are issued inside the house', () => {
    for (const k of ALL) expect(OURS[k], `${k} never draws the lesson from that order`).toMatch(/(?:inside|within) the house/i);
  });

  it('carries the secret kept with those who fear Him, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing who receives the secret`).toContain('The secret of the LORD is with them that fear him');
  });

  it('makes obedience the door rather than analysis, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the door`).toContain('he will keep my words');
  });

  it('carries the posture He says He looks at, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the posture He looks at`).toContain('him that is poor and of a contrite spirit');
  });

  it('honours the need to know Him as the one thing to glory in, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} never honours the need to comprehend Him`).toMatch(/that he understandeth and knoweth me|they might know thee the only true God/);
  });

  it('closes by saying the clarity is given in His company rather than at a distance', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not land the closing`).toMatch(/at a distance|from far away/i);
  });

  it('names His company as the method rather than the closing devotion', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves His company as an appendix`).toMatch(/it is the method|It constitutes the method|how the whole thing works/i);
  });
});

describe('L174 — the levels run in order, in every band', () => {
  it('walks FIRST through SEVENTH in order', () => {
    for (const k of ALL) {
      const marks = ['FIRST,', 'SECOND,', 'THIRD,', 'FOURTH,', 'FIFTH,', 'SIXTH,', 'SEVENTH,'];
      let last = -1;
      for (const m of marks) {
        const at = TEXTS[k].indexOf(m);
        expect(at, `${k} is missing ${m}`).toBeGreaterThan(-1);
        expect(at, `${k} has ${m} out of order`).toBeGreaterThan(last);
        last = at;
      }
    }
  });

  it('places the installed abomination last, where the band carries it', () => {
    // The child band stops at the seventh on purpose; the others go on to the
    // eighth. That is an age decision, and it is PINNED rather than assumed.
    for (const k of ALL) {
      const eighth = TEXTS[k].indexOf('EIGHTH,');
      if (k === 'child') { expect(eighth, 'the child band now carries the eighth level').toBe(-1); continue; }
      expect(eighth, `${k} is missing the eighth level`).toBeGreaterThan(TEXTS[k].indexOf('SEVENTH,'));
      expect(TEXTS[k], `${k} names the installation without His words for it`).toContain('the abomination of desolation');
    }
  });

  it('quotes the Leviticus verdict only where the band is old enough for it', () => {
    // Named at teen and above and in the adult lesson; deliberately absent from
    // the child band. An age placement nobody checks is an age placement that
    // drifts on the next edit.
    for (const k of ALL) {
      const has = TEXTS[k].includes('Thou shalt not lie with mankind, as with womankind: it is abomination');
      if (k === 'child' || k === 'youth') expect(has, `${k} now carries the Leviticus verdict`).toBe(false);
      else expect(has, `${k} has dropped the Leviticus verdict`).toBe(true);
    }
  });

  it('quotes His verdict where He gives it rather than staging a debate over it', () => {
    for (const k of ['adult', 'teen', 'senior']) expect(OURS[k], `${k} stages a debate instead of quoting the verdict`).toMatch(/does not stage a (?:debate|deliberation)|declines to stage/i);
  });
});
