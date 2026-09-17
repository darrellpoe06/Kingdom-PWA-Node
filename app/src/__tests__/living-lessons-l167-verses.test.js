// @vitest-environment node
//
// L167 — "Be a G About It": execute the fourteen love verbs, high or low,
// because it is not about how you feel.
//
// Darrell, 2026-09-17, spoken into this channel (rendered for meaning, DR-0331):
// "And be a G about that... be that way whether you high or low... use the 14
// love verbs and just execute on them. It ain't about how you feel... The king
// is the one that brings the balance... without a vision you perish... He's
// literally said, eat of me... Ask the questions to the word of God and get
// your answers."
//
// THE THREE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG.
//
//   1. THE COUNT. He said fourteen. L157, already shipped in this same series,
//      says FIFTEEN. Both are right: 1 Corinthians 13:4-7 gives a run of
//      clauses and never numbers them, so it is fourteen when "rejoiceth not in
//      iniquity, but rejoiceth in the truth" counts as one item facing two ways
//      and fifteen when its halves are listed apart. The failure available here
//      was to assert a number and quietly contradict a shipped lesson, or to
//      stage a disagreement (DR-0098). Instead the note is said plainly in
//      EVERY band, and the gate checks that it is said.
//   2. "IT IS NOT ABOUT HOW YOU FEEL" is the load-bearing clause, and the
//      enemy case is what settles it. A band that listed the verbs and dropped
//      Luke 6:35 would teach a warm feeling with extra steps.
//   3. AN ELLIPSIS INSIDE A QUOTATION. Two of the quiz explanations first
//      shipped as "...", which presents a truncation as the quotation. It was
//      caught by the strict audit and is now a standing check: a quoted span of
//      the Word carries no ellipsis, ever. Shorten the span instead.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
// STRICT: whitespace only, never apostrophes (the DR-0456 finding).
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// NO leading-numeral rewriting (the DR-0457 finding: /^(i|1st)/ turned
// "isaiah" into "1saiah"). The corpus filenames already carry their digits.
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase();
const flow = (name, ch) => {
  const c = chapters[bookKey(name)];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

const FLAT = [];
(function flatten(node, path) {
  if (typeof node === 'string') { FLAT.push([path, node]); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${path}[${i}]`)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k);
  }
}(L, ''));

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;
const band = (b) => String(L.levels[b]);
const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);
/** Our authored prose with the quotations removed — for checks about what WE
 *  say, so a quotation can never stand in for the teaching. */
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');

describe('L167 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('Be a G About It — Execute the Fourteen Love Verbs, High or Low, Because It Is Not About How You Feel');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1000);
    for (const b of BANDS) {
      const ratio = proseWords(L.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the reading ladder rises and the child band clears the NEW-lesson ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(fk.child).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen).toBeLessThanOrEqual(fk.senior);
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
});

describe('L167 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(165);
    expect(quoted - referenced, `${quoted - referenced} unreferenced span(s)`).toBe(0);
  });

  it('every referenced span is verbatim in the KJV corpus, strictly', () => {
    const bad = [];
    let checked = 0;
    for (const [path, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        checked += 1;
        const [, span, book, ch] = m;
        const f = flow(book, ch);
        if (!f) { bad.push(`${path}: no such book ${book}`); continue; }
        if (!f.includes(norm(span))) bad.push(`${path}: ${book} ${ch} — ${norm(span).slice(0, 70)}`);
      }
    }
    expect(checked).toBeGreaterThan(165);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('NO QUOTED SPAN CARRIES AN ELLIPSIS — a truncation is not a quotation', () => {
    // Two quiz explanations first shipped with "..." inside the quotation
    // marks, which reads as the Word's own words and is not. The remedy is
    // always to shorten the span to something genuinely verbatim, never to
    // elide inside it.
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\.\.\.|…/.test(span)) offences.push(`${path}: ${span.slice(0, 60)}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = [
      'be a g about', 'fourteen love verbs', 'how you feel',
      'brings the balance', 'without a vision you perish',
    ];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase)) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

describe('L167 — the fourteen are numbered, and the COUNT is handled honestly', () => {
  it('each band quotes all four verses of the list', () => {
    for (const b of BANDS) {
      for (const v of [4, 5, 6, 7]) {
        expect(band(b), `${b} 1 Corinthians 13:${v}`).toContain(`(1 Corinthians 13:${v})`);
      }
    }
  });

  it('each band NUMBERS them so a reader can count along', () => {
    // Numbered, not merely listed: the point of the section is that a reader
    // can check the count against the text rather than take it on trust.
    for (const b of BANDS) {
      // CASE-INSENSITIVE on the items: the child band numbers with full stops
      // ("One. Suffereth long."), so each item is sentence-initial and
      // capitalised. Demanding the adult's lower-case run from a child's
      // register is the too-tight failure this session already hit once.
      const ours = ourVoice(band(b));
      for (const word of ['suffereth long', 'is kind', 'envieth not', 'endureth all things']) {
        expect(ours.toLowerCase(), `${b} does not walk the list (${word})`).toContain(word);
      }
      // AND THE NUMBERS THEMSELVES, IN ORDER. Checking only that the items
      // appear proves the list is present, never that it is NUMBERED — a break
      // that turned "One, suffereth long" into "It suffereth long" left the
      // earlier version of this check perfectly green while destroying the one
      // property the section exists for. The ordinals are matched with their
      // numbering punctuation (a comma in the adult registers, a full stop in
      // the child's) so ordinary uses of "one" cannot satisfy them, and their
      // positions must strictly increase.
      const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen'];
      let last = -1;
      for (const [i, word] of ORDINALS.entries()) {
        const at = ours.search(new RegExp(`\\b${word}[.,]\\s`));
        expect(at, `${b} does not number item ${i + 1} (${word})`).toBeGreaterThan(-1);
        expect(at, `${b} numbers ${word} out of order`).toBeGreaterThan(last);
        last = at;
      }
    }
  });

  it('EACH BAND SAYS THE TEXT DOES NOT NUMBER THEM, and names both counts', () => {
    // The integrity of this lesson turns on this. He said fourteen; L157 says
    // fifteen; the text says neither. Asserting one number and silently
    // contradicting a shipped lesson was the available failure, and staging a
    // disagreement (DR-0098) was the other.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      // The pattern accepts each band's own wording ("does not number them for
      // us", "never numbers them", "nowhere numbers them itself") because the
      // teaching is what is checked, never the adult's phrasing demanded from
      // another register.
      expect(ours, `${b} never says the text does not number them`).toMatch(/(does not|never|nowhere) numbers? them/i);
      expect(ours, `${b} never names the other count`).toMatch(/fifteen/i);
      expect(ours, `${b} never says neither count is wrong`).toMatch(/neither count is|Nobody is wrong|not a mistake|not an error/i);
    }
  });

  it('each band says every one of them is a DOING and none of them a feeling', () => {
    for (const b of BANDS) {
      const says = sentences(ourVoice(band(b))).some((s) => /not (one of them|a single one of them|one) is a feeling/i.test(s));
      expect(says, `${b} never says none of them is a feeling`).toBe(true);
    }
  });
});

describe('L167 — it is not about how you feel', () => {
  it('each band measures love by obedience and forbids it stopping at the tongue', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 14:15`).toContain('(John 14:15)');
      expect(band(b), `${b} 1 John 3:18`).toContain('(1 John 3:18)');
      expect(band(b), `${b} James 2:17`).toContain('(James 2:17)');
    }
  });

  it('each band carries the ENEMY case, which is what settles it', () => {
    // Drop this and the lesson teaches a warm feeling with extra steps.
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 6:35`).toContain('(Luke 6:35)');
      const noWarmth = sentences(ourVoice(band(b))).some((s) => /(no warm|without warmth|waiting on warmth|no warm feeling|not waiting on warmth)/i.test(s));
      expect(noWarmth, `${b} never says the verbs do not wait on warmth`).toBe(true);
    }
  });

  it('each band says He went FIRST, while we were yet sinners', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 5:8`).toContain('(Romans 5:8)');
      expect(ourVoice(band(b)), `${b} never says He went first`).toMatch(/went first/i);
    }
  });

  it('each band says to keep going past the point it pays', () => {
    for (const b of BANDS) expect(band(b), `${b} Galatians 6:9`).toContain('(Galatians 6:9)');
  });
});

describe('L167 — the king brings the balance', () => {
  it('each band carries the scale, the standard and the throne', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 29:4`).toContain('(Proverbs 29:4)');
      expect(band(b), `${b} Proverbs 11:1`).toContain('(Proverbs 11:1)');
      expect(band(b), `${b} Proverbs 20:28`).toContain('(Proverbs 20:28)');
    }
  });

  it('each band names BOTH failures of the balance', () => {
    // Mercy without truth, and truth without mercy. Name one and the lesson
    // recommends the opposite error.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never names mercy without truth`).toMatch(/[Mm]ercy with(out)? no truth|[Mm]ercy without truth/);
      expect(ours, `${b} never names truth without mercy`).toMatch(/[Tt]ruth with(out)? no mercy|[Tt]ruth without mercy/);
    }
  });

  it('each band names the gift that tilts the scale', () => {
    for (const b of BANDS) {
      expect(ourVoice(band(b)), `${b} never names the bribe`).toMatch(/bribe|gift that tilts|takes the gift|accepting the gift/i);
    }
  });
});

describe('L167 — the vision, and the half everybody drops', () => {
  it('each band quotes Proverbs 29:18 WHOLE, including the second half', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('"Where there is no vision, the people perish: but he that keepeth the law, happy is he." (Proverbs 29:18)');
    }
  });

  it('each band says the second half is the one people drop, and what it supplies', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says the second half is dropped`).toMatch(/second half/i);
      expect(ours, `${b} never says what a vision is made of`).toMatch(/keeping what Yahweh said|made of/i);
    }
  });
});

describe('L167 — eat of Me, and what the eating is', () => {
  it('each band carries the hard saying AND the sentence that explains it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} John 6:35`).toContain('(John 6:35)');
      expect(band(b), `${b} John 6:54`).toContain('(John 6:54)');
      // 6:57 is the one most discussions never reach, and it is the one that
      // makes the whole lesson work.
      expect(band(b), `${b} John 6:57`).toContain('(John 6:57)');
    }
  });

  it('each band ties the eating back to executing on an empty day', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says He lived by the Father and you live by Him`).toMatch(/live[ds]? (by|BY) the Father/i);
      expect(ours, `${b} never ties it to a day you feel nothing`).toMatch(/feel nothing|running on your feelings|running on Him/i);
    }
  });
});

describe('L167 — ask the Word and get your answers', () => {
  it('each band carries the invitation and the Berean habit', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Matthew 7:7`).toContain('(Matthew 7:7)');
      expect(band(b), `${b} Jeremiah 33:3`).toContain('(Jeremiah 33:3)');
      expect(band(b), `${b} James 1:5`).toContain('(James 1:5)');
      expect(band(b), `${b} Acts 17:11`).toContain('(Acts 17:11)');
    }
  });

  it('each band reads upbraideth not out loud, in our own words', () => {
    for (const b of BANDS) {
      expect(ourVoice(band(b)), `${b} never explains upbraideth not`).toMatch(/upbraideth not/i);
    }
  });
});

describe('L167 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  it('no generic capital-G God in OUR prose, in any band or the base', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      if (/\bGOD\b|\bGod\b/.test(text.replace(ALL_SPANS, ' '))) offences.push(path);
    }
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('Yahweh is named several times in every band, not merely once', () => {
    // L166's gate found exactly this thinness AFTER the fact — the prose was
    // leaning on "He" and on the KJV's own "God" inside the quotations, which
    // keeps the letter of DR-0210 and misses its point. Checked here at a real
    // floor rather than at one.
    for (const b of BANDS) {
      const n = (band(b).match(/Yahweh/g) || []).length;
      expect(n, `${b} names Yahweh only ${n} time(s)`).toBeGreaterThanOrEqual(3);
    }
    expect((L.lesson.match(/Yahweh/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it("the KJV's own God and LORD are left exactly as written inside every quotation", () => {
    let sawGod = 0; let sawLord = 0;
    for (const [, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\bGod\b/.test(span)) sawGod += 1;
        if (/\bLORD\b/.test(span)) sawLord += 1;
        expect(/Yahweh/.test(span), `Yahweh substituted into a quotation: ${span.slice(0, 60)}`).toBe(false);
      }
    }
    expect(sawGod, 'no quotation carries the KJV God — the sweep this guards against may already have run').toBeGreaterThan(5);
    expect(sawLord).toBeGreaterThan(3);
  });
});
