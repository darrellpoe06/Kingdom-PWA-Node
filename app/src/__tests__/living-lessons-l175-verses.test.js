// @vitest-environment node
// =============================================================================
// L175 — True Love Starts With an Act and a Sound Mind, and Feelings Come After
// the Test. Every verse verbatim, every band carrying the ORDER, and the
// posture of the test checked where it does its job.
// =============================================================================
// Darrell spoke this on 2026-09-18 in four compressed pieces, and every one is
// a requirement this gate holds:
//   "True love starts with a acts of kindness and sound mindedness. Feelings
//    come after testing. If before you're playing yourself. Lesson"
//   "Test are for truth"
//   "Not I gotcha"
//   "Just clarification on what's what"
//
// WHAT THIS LESSON ADDS THAT THE HOUSE DID NOT ALREADY HAVE. L157 counts the
// fifteen love verbs and maps their range; L167 says they are executed however
// you feel; L165 handles gratitude and suffering. NONE of them says WHEN the
// feeling is legitimate. This one does, and the ORDER is the teaching: act,
// sound mind, test for truth, then the feeling. So the checks below are
// weighted toward the order and the posture rather than toward the verbs,
// which are already gated elsewhere.
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. FEELINGS TAUGHT AS THE ENEMY. The Word does not do that. Love is OF
//      Him, and love itself rejoices in the truth. A band that landed on
//      feelings-are-unreliable would be teaching something 1 John 4:7 denies,
//      so every band must carry the source AND the place the feeling belongs.
//   2. THE SOUND MIND READ AS A BRAKE ON LOVE. 2 Timothy 1:7 issues power,
//      love and a sound mind in ONE gift, so they were never rivals. Every
//      band must say the sound mind AIMS the kindness rather than restrains it.
//   3. THE TEST WITHOUT ITS OBJECT. "Prove all things" with no object attached
//      becomes suspicion with a verse on it. The object is named twice — TRUE
//      is the first filter of the Test, and love rejoices in the truth — and
//      both are checked.
//   4. THE GOTCHA POSTURE LEFT AVAILABLE. His correction is not a footnote: an
//      examination run to win has stopped being an examination. Checked from
//      three directions — rejoicing in iniquity, seeking her own, and the
//      Galatians 6:1 procedure.
//   5. PLAYING YOURSELF READ AS CONTEMPT. It is a mechanism, not an insult: a
//      feeling with no test under it is trusted on its own testimony with no
//      second witness. Every band must carry the mechanism, and must say who
//      actually gets hurt.
//
// Check-writing rules in force, each already paid for: every claim check reads
// OUR prose with quotations stripped; no alternation branch is merely a word
// the passage contains, nor a phrase our prose echoes out of the quotation
// beside it, nor a title keyword (true, love, starts, sound, mind, feelings,
// come, after, test are ALL title keywords here, so none of them is ever the
// sole evidence for a claim); one claim per test; no check narrows the Word's
// own options; and every chained quotation lead carries its own reference so
// the orphan floor is ZERO rather than an allowance.
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

const ID = 'll175-true-love-starts-with-an-act-and-a-sound-mind-and-feelings-come-after-the-test';
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


describe('L175 — the shape of the lesson', () => {
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

  it('renders ALL SIX movements as numbered sections in every band', () => {
    // NOT "at least five". This lesson has exactly six movements and the first
    // draft rendered THREE, because lesson-format.js only accepts a standalone
    // caps heading of 2-9 words and four of the headings ran to 11-12 words or
    // carried an em dash. Half the movements were invisible to the reader while
    // every other gate stayed green. Pinned at six so a reworded heading that
    // falls outside the renderer's window fails here instead of silently
    // disappearing from the page.
    for (const k of ALL) expect(formatLessonText(TEXTS[k]).sectionCount, `${k} lost a movement to the renderer`).toBe(6);
  });

  it('promotes no caps EMPHASIS into a section heading', () => {
    // The same first draft numbered "WHO CAN KNOW IT." as a section — a four
    // word emphasis inside the prose, not a movement. Every heading must be one
    // of the six the author wrote.
    const bad = [];
    for (const k of ALL) {
      for (const h of formatLessonText(TEXTS[k]).items.filter((i) => i.kind === 'heading')) {
        if (/WHO CAN KNOW IT/.test(h.text)) bad.push(`${k}: ${h.text}`);
      }
    }
    expect(bad, `caps emphasis promoted to a heading:\n${bad.join('\n')}`).toEqual([]);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });
});

describe('L175 — His words, exactly as He said them', () => {
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
    // ZERO. L174 proved this floor is reachable, so it is written as a floor
    // rather than an allowance from the first draft.
    for (const k of ALL) {
      const all = (TEXTS[k].match(ALL_SPANS) || []).length;
      expect(all - spansOf(TEXTS[k]).length, `${k} has an unreferenced span`).toBe(0);
    }
  });

  it('quotes every referenced span in the WHOLE module verbatim, not only the reader texts', () => {
    // THE FINDING THIS GATE WAS MISSING, and the break harness is what surfaced
    // it. Corrupting "Charity suffereth long, and is kind" to "...and is
    // gentle" left the gate GREEN, because the verbatim check above reads only
    // the adult lesson and the four bands. Measured rather than assumed: this
    // module carries 107 referenced spans, and only 79 of them live in those
    // five texts. The other 28 sit in benefits, quiz options, quiz
    // explanations and facilitator talking points — all of which a LEARNER
    // reads — and nothing verified a single one of them.
    //
    // This is the DR-0481 class one turn later: that record installed a
    // whole-module walk for ELISIONS and I did not extend it to
    // VERBATIM-ness, so the same blind spot survived in a different check. A
    // gate is only as wide as the fields it reads.
    const bad = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        SPAN_WITH_REF.lastIndex = 0;
        let m;
        while ((m = SPAN_WITH_REF.exec(node))) {
          const text = versesOf(m[2].trim(), m[3], m[4].trim());
          if (text == null) { bad.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`); continue; }
          if (!norm(text).includes(norm(m[1]))) bad.push(`${path}: ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 60)}`);
        }
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(bad, `spans that are not His words, anywhere in the module:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves no quoted span unreferenced ANYWHERE in the module', () => {
    // Same blind spot, same harness break: stripping the reference off a span
    // in a benefit left the gate green. Two spans genuinely lacked one when
    // this check was written — "Rejoiceth not in iniquity" in a quiz question
    // and in a talking point — and both now carry 1 Corinthians 13:6.
    const bad = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
        let m;
        while ((m = re.exec(node))) if (!m[2]) bad.push(`${path}: ${m[1].slice(0, 60)}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(bad, `quoted spans carrying no reference:\n${bad.join('\n')}`).toEqual([]);
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    const found = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('quotes the Test WHOLE rather than elided', () => {
    // Philippians 4:8 is the most-elided verse in this corpus — 17 spans across
    // 6 lessons are still owed that repair. This lesson quotes it entire, and
    // this check keeps it that way.
    for (const k of ALL) expect(TEXTS[k], `${k} has trimmed the Test`).toContain('whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report');
  });

  it('puts no double quotation marks around HIS words rather than the Word’s', () => {
    // A double-quoted span in this corpus MEANS Scripture. Darrell's own
    // phrases — playing yourself, I-gotcha, clarification on what is what —
    // appear unquoted, or the strongest guarantee the gate makes is diluted.
    const bad = [];
    const walk = (node, path) => {
      if (typeof node === 'string') {
        for (const q of node.match(/"[^"]*"/g) || []) {
          if (/playing yourself|I-gotcha|I gotcha|what is what/i.test(q)) bad.push(`${path}: ${q}`);
        }
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(L, '');
    expect(bad, `his words wearing Scripture's quotation marks:\n${bad.join('\n')}`).toEqual([]);
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
    // Case-BLIND: bigIdea is full capitals by house style.
    for (const [k, v] of Object.entries(READER)) {
      expect(ours(v), `${k} never names Him by His covenant name in our own voice`).toMatch(/Yahweh/i);
    }
  });

  it('never says the generic name in its own prose in any reader field', () => {
    const bad = [];
    for (const [k, v] of Object.entries(READER)) {
      for (const m of ours(v).match(/.{0,24}\bGod\b.{0,16}/g) || []) {
        if (!/of God|word of God|will of God|knowledge of God|power of God|Son of God/.test(m)) bad.push(`${k}: ${m.trim()}`);
      }
    }
    expect(bad, `generic uses in our own prose:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves the KJV generic name untouched inside its quotations', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} has scrubbed the KJV's own wording`).toContain('for love is of God');
  });

  it('recites no record id to the reader', () => {
    for (const [k, v] of Object.entries(READER)) expect(v, `${k} recites a record id`).not.toMatch(/DR-\d{4}/);
  });

  it('names every anchor reference somewhere the reader meets it', () => {
    const body = [L.lesson, L.bigIdea, ...BANDS.map((b) => L.levels[b]), ...L.benefits].join(' ');
    const missing = L.anchor.ref.split(';').map((s) => s.trim()).filter((r) => r && !body.includes(r));
    expect(missing, `anchors never named: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('L175 — the order is the teaching', () => {
  it('puts the act BEFORE the test in every band', () => {
    for (const k of ALL) {
      const act = TEXTS[k].indexOf('Charity suffereth long, and is kind');
      const test = TEXTS[k].indexOf('Prove all things; hold fast that which is good');
      expect(act, `${k} never states the opening act`).toBeGreaterThan(-1);
      expect(test, `${k} puts the proving before the act`).toBeGreaterThan(act);
    }
  });

  it('puts the test BEFORE the place the feeling belongs, in every band', () => {
    for (const k of ALL) {
      const test = TEXTS[k].indexOf('Prove all things; hold fast that which is good');
      const source = TEXTS[k].indexOf('for love is of God');
      expect(source, `${k} never reaches the source`).toBeGreaterThan(-1);
      expect(source, `${k} places the feeling before the proving`).toBeGreaterThan(test);
    }
  });

  it('states the finished order in its own words, in every band', () => {
    for (const k of ALL) expect(OURS[k], `${k} never spells the order out`).toMatch(/in that order/i);
  });
});

describe('L175 — the first two items are both deeds', () => {
  it('quotes the opening of the love chapter in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the opening of the chapter`).toContain('Charity suffereth long, and is kind');
  });

  it('says neither of the first two is an affection', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what the first two items are not`).toMatch(/neither (?:one )?is a feeling|neither qualifies/i);
  });

  it('says what suffering long actually describes', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves suffering long undefined`).toMatch(/ha(?:s|ve) not (?:yet )?changed|remains unchanged/i);
  });

  it('gives the reason the chapter opens there rather than with warmth', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says why the chapter opens where it does`).toMatch(/chest is (?:completely |entirely )?empty|feel nothing at all/i);
  });

  it('carries the deed-and-truth requirement in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the requirement`).toContain('let us not love in word, neither in tongue; but in deed and in truth');
  });

  it('points out that truth sits BESIDE the deed rather than opposite it', () => {
    for (const k of ALL) expect(OURS[k], `${k} misses where truth is placed`).toMatch(/beside (?:the )?deed|adjacent to the deed|next to (?:the )?doing|right next to/i);
  });

  it('closes the performance loophole in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} leaves the performance version open`).toMatch(/without dissimulation|not love in word/);
  });

  it('carries the seven-year example in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the worked example`).toContain('And Jacob served seven years for Rachel');
  });

  it('separates what that verse REPORTS from what it merely explains', () => {
    for (const k of ALL) expect(OURS[k], `${k} reads the seven years sentimentally`).toMatch(/could (?:not )?see(?: the)? feeling|could (?:see|observe|inspect) seven years|could inspect/i);
  });

  it('says the affection lightened the work rather than performing it', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the feeling do the work`).toMatch(/did not do the work|did not perform the labour|did not execute the labour|made the work (?:feel )?(?:short|light)|reduced the weight/i);
  });
});

describe('L175 — the sound mind arrives in the same gift', () => {
  it('quotes the gift in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the gift`).toContain('but of power, and of love, and of a sound mind');
  });

  it('says the three arrive together rather than separately', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says they come together`).toMatch(/one gift|same gift|all three in one|together/i);
  });

  it('names what was NOT given, in every band', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the thing not given`).toMatch(/not given|NOT given|NOT conveyed/);
  });

  it('says the sound mind AIMS the kindness rather than restraining it', () => {
    for (const k of ALL) expect(OURS[k], `${k} reads the sound mind as a brake`).toMatch(/aims the kindness|points the kindness/i);
  });

  it('gives a concrete way unaimed kindness goes wrong', () => {
    for (const k of ALL) expect(OURS[k], `${k} never shows unaimed kindness failing`).toMatch(/dependency|nobody (?:needed|required|asked)|hurts later/i);
  });

  it('refuses to read the sound mind as coldness', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves the coldness reading available`).toMatch(/not (?:being )?cold|not coldness|does not constitute coldness/i);
  });
});

describe('L175 — the test comes next, and its object is truth', () => {
  it('carries the proving instruction in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the proving instruction`).toContain('Prove all things; hold fast that which is good');
  });

  it('insists on the second half rather than only the first', () => {
    for (const k of ALL) expect(OURS[k], `${k} stops at proving and never reaches holding`).toMatch(/both (?:halves|clauses)/i);
  });

  it('carries the instruction to try the voices, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the trying of the spirits`).toContain('believe not every spirit, but try the spirits');
  });

  it('gives the stated reason trying is commanded', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says why trying is commanded`).toMatch(/counterfeits|fake/i);
  });

  it('says TRUE is the first filter of the Test', () => {
    for (const k of ALL) expect(OURS[k], `${k} never marks which filter is first`).toMatch(/TRUE[.,]|True[.,]|True is first|true comes first/);
  });

  it('rules out the softer readings of that first filter', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not exclude the comfortable readings`).toMatch(/not (?:pleasant|nice)|Not (?:pleasant|nice)/);
  });

  it('carries what love itself rejoices in, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing love's own rejoicing`).toContain('Rejoiceth not in iniquity, but rejoiceth in the truth');
  });

  it('says the feeling is given a correct object rather than banished', () => {
    for (const k of ALL) expect(OURS[k], `${k} banishes the feeling instead of aiming it`).toMatch(/correct object|not banned|not banished|a real thing to be glad about/i);
  });

  it('names what gladness attached to an untruth actually is', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what misaimed gladness is`).toMatch(/fiction|a story/i);
  });
});

describe('L175 — not I-gotcha, but clarification', () => {
  it('says taking pleasure in the fault IS rejoicing in iniquity', () => {
    for (const k of ALL) expect(OURS[k], `${k} never connects enjoying the fault to the verse`).toMatch(/rejoicing in iniquity|enjoy(?:ing)? the (?:fault|bad thing)/i);
  });

  it('says what the examination has become when the fault is enjoyed', () => {
    for (const k of ALL) expect(OURS[k], `${k} does not say the test changed jobs`).toMatch(/changed (?:jobs|employment)|hunting, not checking/i);
  });

  it('identifies seeking your own as what a win consists of', () => {
    for (const k of ALL) expect(OURS[k], `${k} never links seeking your own to winning`).toMatch(/what a (?:win|victory)|wanting to win/i);
  });

  it('carries the clause that forbids deciding before looking, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the clause`).toContain('seeketh not her own, is not easily provoked, thinketh no evil');
  });

  it('carries the procedure for a test that finds something, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the procedure`).toContain('restore such an one in the spirit of meekness');
  });

  it('names restoration rather than exposure as the aim', () => {
    for (const k of ALL) expect(OURS[k], `${k} never states the aim`).toMatch(/rather than expos(?:e|ure)|RESTORE, not expose|do not show them up|not exposure/i);
  });

  it('names the safeguard that the examiner stands in the same weather', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the self-consideration safeguard`).toMatch(/same weather|you could trip the same way/i);
  });

  it('says an examination aimed at winning has become a trap', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what a gotcha test turns into`).toMatch(/trap/i);
  });

  it('gives the modest purpose in his own words', () => {
    for (const k of ALL) expect(OURS[k], `${k} never states the modest purpose`).toMatch(/what is what/i);
  });
});

describe('L175 — if the feeling comes first, you are playing yourself', () => {
  it('says a premature feeling has nothing beneath it', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what is missing under it`).toMatch(/nothing (?:whatsoever |whatever )?(?:under|underneath|beneath)/i);
  });

  it('names what is actually being trusted in that case', () => {
    for (const k of ALL) expect(OURS[k], `${k} never identifies what gets trusted`).toMatch(/own report|own testimony|feeling to say the feeling/i);
  });

  it('says there is no second witness', () => {
    for (const k of ALL) expect(OURS[k], `${k} drops the missing witness`).toMatch(/second witness|nobody else in the room/i);
  });

  it('marks it as self-deception rather than somebody else’s lie', () => {
    for (const k of ALL) expect(OURS[k], `${k} blames someone else for it`).toMatch(/you fooling you|not somebody (?:lying|deceiving)|you deceiving yourself/i);
  });

  it('carries the verdict on trusting your own heart, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the verdict`).toContain('He that trusteth in his own heart is a fool');
  });

  it('carries the question the Word asks about the heart, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the question`).toContain('who can know it?');
  });

  it('points out the question is about READING the heart rather than repairing it', () => {
    for (const k of ALL) expect(OURS[k], `${k} misreads the question as being about repair`).toMatch(/READ it/);
  });

  it('concludes the test must come from outside the feeling', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says where the test must come from`).toMatch(/outside the feeling/i);
  });

  it('says who is actually hurt worst by the wrong order', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says who gets hurt`).toMatch(/hurt the worst|injured most|hurt worst/i);
  });

  it('says what the kindness turns out to have been', () => {
    for (const k of ALL) expect(OURS[k], `${k} never names what the kindness really was`).toMatch(/was (?:just )?a mood|constituted a mood/i);
  });
});

describe('L175 — the source, and where the feeling belongs', () => {
  it('carries the source of love in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing the source`).toContain('for love is of God; and every one that loveth is born of God');
  });

  it('says the source is not us', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says where love comes from`).toMatch(/source is not us|not ourselves|comes from Him|proceeds from Him/i);
  });

  it('refuses to make the affections the enemy', () => {
    for (const k of ALL) expect(OURS[k], `${k} leaves feelings as the villain`).toMatch(/(?:not|makes feelings|converts (?:feelings|the affections) into) the (?:enemy|bad guy|adversary)|into an adversary/i);
  });

  it('carries where Jesus located the test of our love for Him, in every band', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} is missing His own test`).toContain('If ye love me, keep my commandments');
  });

  it('says He named an act rather than asking to be felt about', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what He asked for`).toMatch(/felt about/i);
  });

  it('says the affection rides on the deed rather than replacing it', () => {
    for (const k of ALL) expect(OURS[k], `${k} lets the affection stand in for the deed`).toMatch(/rides (?:up)?on it|standing in for|substituting for|that is the proof/i);
  });

  it('calls a feeling that arrives in the right order fuel', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what a well-ordered feeling is`).toMatch(/is fuel|constitute fuel|are fuel/i);
  });

  it('calls a feeling that arrives early a verdict with no evidence', () => {
    for (const k of ALL) expect(OURS[k], `${k} never says what a premature feeling is`).toMatch(/verdict with no evidence|guess with nobody backing/i);
  });
});
