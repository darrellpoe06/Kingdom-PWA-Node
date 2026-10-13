// @vitest-environment node
//
// L168 — "The King Through the Warrior's Lens": before the foundation, the
// third dimension He spoke, and the name written on His thigh.
//
// Darrell, 2026-09-17, spoken into this channel (rendered for meaning,
// DR-0331): "Non-human beings who existed before time called the sons of God.
// We call them angels... The third dimension started when Yahweh said in the
// beginning... Every knee gonna bow... he's got a tattoo in his thigh that says
// King of Kings... I want you to give us the perspective of the king through
// the lens of the warrior... Shadrach, Meshach, and Abednego in the fire... a
// double-minded man shouldn't expect that he would get anything from the
// Lord... Be a programmer. Program yourself."
//
// FOUR PLACES THIS LESSON COULD HAVE GONE WRONG, and every one of them is a
// checked property below rather than a note in a record nobody reads.
//
//   1. AN INVERTED CLAUSE. On the recording the outside-agent sentence comes
//      out saying He is NOT the one the scientists are looking for. The plain
//      meaning is the opposite and that is how it is rendered — but a silent
//      correction of a man's own words is not this house's way, so the
//      rendering is STATED OUT LOUD in every band. Checked per band.
//   2. GOING PAST WHAT IS WRITTEN on the sons of God. The Word shows them
//      present at the founding of the earth. It never says they existed before
//      time itself and never says when they were made. The temptation to
//      answer a question the text declines is exactly what DR-0098 forbids, so
//      the LIMIT is checked per band, not just the claim.
//   3. THE WARRIOR WITHOUT JOSHUA'S CORRECTION. A warrior lens with no "Nay"
//      in it produces a King who endorses whatever the reader had already
//      decided to do. Joshua 5:13-15 is the pivot of the lesson and is checked
//      per band, including the shoes.
//   4. "TATTOO" AS THOUGH THE WORD SAID IT. Revelation 19:16 says a name is
//      WRITTEN, and says nothing about the method. Darrell's word for it is
//      honoured as his; the Word's silence is kept as the Word's.
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

const ID = 'll168-the-king-through-the-warriors-lens-before-the-foundation-the-third-dimension-he-spoke-and-the-name-written-on-his-thigh';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
// STRICT: whitespace only, never apostrophes (the DR-0456 finding).
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// NO leading-numeral rewriting (the DR-0457 finding).
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
const ourVoice = (t) => String(t).replace(ALL_SPANS, ' ').replace(/\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g, ' ');

describe('L168 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('The King Through the Warrior’s Lens — Before the Foundation, the Third Dimension He Spoke, and the Name Written on His Thigh');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1200);
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

describe('L168 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(185);
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
    expect(checked).toBeGreaterThan(185);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('NO QUOTED SPAN CARRIES AN ELLIPSIS — a truncation is not a quotation', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        if (/\.\.\.|…/.test(span)) offences.push(`${path}: ${span.slice(0, 60)}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });

  it('the Job 1:6 quotation stops before the adversary clause, on purpose', () => {
    // FOUND WHILE VERIFYING: this repo's own KJV corpus carries the adversary
    // in LOWERCASE ("and satan came also among them"), because the binding
    // typographic rule is senior to the source and was applied to the corpus
    // itself. Quoting the whole verse would therefore have meant either
    // matching that lowercase form or failing the strict audit — both
    // distractions from a lesson about the sons of God. The clause we need is
    // contiguous and stops cleanly before it, so that is what is quoted.
    for (const [, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        if (m[2] === 'Job' && m[3] === '1') {
          expect(norm(m[1])).toBe('Now there was a day when the sons of God came to present themselves before the LORD');
        }
      }
    }
  });

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = [
      'third dimension', 'outside agent', 'be a programmer', 'program yourself',
      'tattoo', 'warrior’s lens', "warrior's lens",
    ];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase.toLowerCase())) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });
});

describe('L168 — the inverted clause is rendered OUT LOUD, never silently', () => {
  it('each band states that the recording came out inverted', () => {
    // A silent correction of a man's own words is not this house's way, however
    // obvious the meaning. Every band says what was said, says what it plainly
    // means, and says that the rendering is the only one the sentence permits.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says the clause was inverted`).toMatch(/inverted|comes out/i);
      expect(ours, `${b} never states the rendering`).toMatch(/IS the Outside Agent|is that Him|He IS/);
    }
  });

  it('the base prose says the rendering is not a liberty taken with his words', () => {
    expect(ourVoice(L.lesson)).toMatch(/not a liberty|only reading/i);
  });
});

describe('L168 — the sons of God, and the limit the Word sets', () => {
  it('each band shows them present at the FOUNDING of the earth', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Job 38:4`).toContain('(Job 38:4)');
      expect(band(b), `${b} Job 38:7`).toContain('(Job 38:7)');
      expect(band(b), `${b} Job 1:6`).toContain('(Job 1:6)');
    }
  });

  it('EACH BAND KEEPS THE LIMIT: the Word never says when they were made', () => {
    // The check that matters most in this section. Answering a question the
    // text declines is the DR-0098 failure, and it would have been the easiest
    // thing in the world to do here.
    //
    // AND THIS CHECK WAS ITSELF TOO LOOSE ON ITS FIRST PASS — caught by the
    // break harness, which could not make a break LAND against it. It accepted
    // any "does not say" and any "neither will we" anywhere in the band. Every
    // band carries both in a DIFFERENT paragraph — the one about the method of
    // the writing on His thigh — so the senior band was passing entirely on
    // that paragraph while its own sons-of-God limit went unchecked, and the
    // senior band's actual refusal ("does not go ONE STEP past what is
    // written") matched none of the alternatives at all. It is now WINDOWED:
    // the negated when-clause must be present, and the refusal to guess must
    // sit within 400 characters of it, in our own prose.
    const WHEN = /(does not|never|nowhere)\s+(\w+\s+)?(tells?|says?)(\s+us)?\s+when/i;
    const REFUSAL = /will not guess|neither do we|neither will we|does not go (one step )?past what is written|only say what it says/i;
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      const m = ours.match(WHEN);
      expect(m, `${b} keeps no negated when-clause at all`).toBeTruthy();
      const around = ours.slice(Math.max(0, m.index - 400), m.index + 400);
      expect(around, `${b} states the limit but never refuses to guess beside it`).toMatch(REFUSAL);
    }
  });

  it('each band says the phrase names a class of beings, not men', () => {
    for (const b of BANDS) {
      expect(ourVoice(band(b)), `${b} never says angels`).toMatch(/angels/i);
    }
  });
});

describe('L168 — the third dimension He spoke', () => {
  it('each band carries the voice, not a process', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Genesis 1:1`).toContain('(Genesis 1:1)');
      expect(band(b), `${b} Genesis 1:3`).toContain('(Genesis 1:3)');
      expect(band(b), `${b} Psalms 33:9`).toContain('(Psalms 33:9)');
    }
  });

  it('each band carries the clause that rules out building this order from inside it', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Hebrews 11:3`).toContain('(Hebrews 11:3)');
      expect(ourVoice(band(b)), `${b} never draws out the framed/not-out-of-the-seen point`).toMatch(/framed|old parts|out of the seen/i);
    }
  });

  it('each band carries the PRESENT-TENSE holding', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Colossians 1:17`).toContain('(Colossians 1:17)');
      expect(ourVoice(band(b)), `${b} never makes the holding present`).toMatch(/consist|still holding|right now|holds it/i);
    }
  });
});

describe('L168 — the Outside Agent, and what the failure actually was', () => {
  it('each band carries clearly seen and without excuse', () => {
    for (const b of BANDS) expect(band(b), `${b} Romans 1:20`).toContain('(Romans 1:20)');
  });

  it('each band names the failure as HONOUR rather than intelligence', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 1:21`).toContain('(Romans 1:21)');
      const ours = ourVoice(band(b));
      expect(ours, `${b} never names honour`).toMatch(/honour|thank you|thankful/i);
      expect(ours, `${b} never rules out the evidence or the brains`).toMatch(/never the evidence|not brains|not a failure of intelligence|not intelligence/i);
    }
  });
});

describe("L168 — the warrior's lens, with Joshua's correction", () => {
  it('each band gives the warrior from the text', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Exodus 15:3`).toContain('(Exodus 15:3)');
      expect(band(b), `${b} Psalms 24:8`).toContain('(Psalms 24:8)');
      expect(band(b), `${b} Revelation 19:11`).toContain('(Revelation 19:11)');
    }
  });

  it('EACH BAND CARRIES THE CORRECTION — the Nay, the Captain, and the shoes', () => {
    // The pivot. A warrior lens without this produces a King who endorses
    // whatever the reader had already decided to do.
    for (const b of BANDS) {
      expect(band(b), `${b} Joshua 5:13`).toContain('(Joshua 5:13)');
      expect(band(b), `${b} Joshua 5:14`).toContain('(Joshua 5:14)');
      expect(band(b), `${b} Joshua 5:15 (the shoes)`).toContain('(Joshua 5:15)');
    }
  });

  it('each band says in OUR words that He is not on your side', () => {
    for (const b of BANDS) {
      expect(ourVoice(band(b)), `${b} never states the correction`).toMatch(/not on your side/i);
    }
  });
});

describe('L168 — the name written on His thigh', () => {
  it('each band quotes Revelation 19:16 whole', () => {
    for (const b of BANDS) {
      expect(band(b), b).toContain('"And he hath on his vesture and on his thigh a name written, KING OF KINGS, AND LORD OF LORDS." (Revelation 19:16)');
    }
  });

  it("each band keeps the Word's SILENCE on how it is written", () => {
    // Darrell's word is "tattoo" and the picture is right, but the Word says a
    // name WRITTEN and says nothing about the method. His word stays his; the
    // silence stays the Word's.
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says the method is not given`).toMatch(/does not say how|not say how|does not tell us how/i);
      expect(ours, `${b} never says a name WRITTEN in our own voice`).toMatch(/name written/i);
    }
  });
});

describe('L168 — every knee, the furnace, and one mind', () => {
  it('each band carries the sworn word and the name', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Isaiah 45:23`).toContain('(Isaiah 45:23)');
      expect(band(b), `${b} Philippians 2:10`).toContain('(Philippians 2:10)');
      expect(band(b), `${b} Philippians 2:11`).toContain('(Philippians 2:11)');
    }
  });

  it('EACH BAND CARRIES "BUT IF NOT" and what it settles', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Daniel 3:17`).toContain('(Daniel 3:17)');
      expect(band(b), `${b} Daniel 3:18`).toContain('(Daniel 3:18)');
      const ours = ourVoice(band(b));
      expect(ours, `${b} never says BUT IF NOT in our own voice`).toMatch(/but if not/i);
      expect(ours, `${b} never says obedience was settled before the outcome`).toMatch(/before (they|you) knew|before knowing|before you know/i);
    }
  });

  it('each band finishes the furnace on the fourth man and the smell', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Daniel 3:25`).toContain('(Daniel 3:25)');
      expect(band(b), `${b} Daniel 3:27`).toContain('(Daniel 3:27)');
      expect(ourVoice(band(b)), `${b} never lands on the smell`).toMatch(/smell/i);
    }
  });

  it('each band reads the double-minded man AGAINST the furnace', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} James 1:8`).toContain('(James 1:8)');
      const ours = ourVoice(band(b));
      expect(ours, `${b} never contrasts one mind with a split one`).toMatch(/ONE mind|one mind|split/i);
      expect(ours, `${b} never says two things at once`).toMatch(/two things at once|asking two things/i);
    }
  });
});

describe('L168 — program yourself, taken literally', () => {
  it('each band carries the rewrite, the loop, the storage and the schedule', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Romans 12:2`).toContain('(Romans 12:2)');
      expect(band(b), `${b} Joshua 1:8`).toContain('(Joshua 1:8)');
      expect(band(b), `${b} Psalms 119:11`).toContain('(Psalms 119:11)');
      expect(band(b), `${b} Deuteronomy 6:7`).toContain('(Deuteronomy 6:7)');
    }
  });

  it('each band says WHY it is not a metaphor', () => {
    for (const b of BANDS) {
      const ours = ourVoice(band(b));
      expect(ours, `${b} never ties the programming to His speaking`).toMatch(/by SPEAKING|by TALKING|framed the worlds/i);
      expect(ours, `${b} never names the one thing you hold authority over`).toMatch(/your (own )?mind/i);
    }
  });

  it('each band carries the warfare that makes this the WARRIOR’S lesson', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ephesians 6:12`).toContain('(Ephesians 6:12)');
      expect(band(b), `${b} 2 Corinthians 10:4`).toContain('(2 Corinthians 10:4)');
    }
  });
});

describe('L168 — our own voice says Yahweh (DR-0210), and the quotations are untouched', () => {
  /** Our prose, with the Word's own compound title removed.
   *  "the sons of God" is the phrase this lesson is ABOUT — a construction
   *  lifted from Job and used as a term of art, exactly as CLAUDE.md itself
   *  uses it. The covenant-name rule governs how we name the Father in our own
   *  voice; it was never about a title of a class of created beings, and
   *  rewriting it would corrupt the very thing being taught. */
  const oursNoTitle = (t) => t.replace(ALL_SPANS, ' ').replace(/sons of God/gi, ' ');

  it('no generic capital-G God in OUR prose, outside the Word’s own compound title', () => {
    const offences = [];
    for (const [path, text] of FLAT) {
      if (/\bGOD\b|\bGod\b/.test(oursNoTitle(text))) offences.push(path);
    }
    expect(offences, offences.join(', ')).toEqual([]);
  });

  it('and the compound title is genuinely present, so that exemption is not vacuous', () => {
    // If "sons of God" ever left the lesson, the exemption above would be
    // silently forgiving nothing — and a forgiveness that forgives nothing
    // hides the next real offence.
    expect((L.lesson.match(/sons of God/gi) || []).length).toBeGreaterThan(0);
    for (const b of BANDS) expect(band(b).match(/sons of God/gi) || [], b).not.toHaveLength(0);
  });

  it('Yahweh is named several times in every band, not merely once', () => {
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
    expect(sawGod, 'no quotation carries the KJV God — the sweep this guards against may already have run').toBeGreaterThan(10);
    expect(sawLord).toBeGreaterThan(10);
  });
});
