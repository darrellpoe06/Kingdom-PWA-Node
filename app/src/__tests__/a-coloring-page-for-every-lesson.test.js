// @vitest-environment node
// =============================================================================
// A COLORING PAGE FOR EVERY LESSON — the same lesson, for a child too young
// to read it
// =============================================================================
// Darrell, 2026-10-10: "We wanted children stories... like below 6 - 10 years
// old so they can also have lessons..." then "Coloring books with words
// inside... that reflect the same lesson..."
//
// THE GAP, MEASURED. The "child" band on the 236 Living Lessons is not written
// for a six-year-old: its ceiling is grade 5.0 and the bands measured on
// 2026-10-10 sit at 3.65 to 5.3 — a nine-to-eleven-year-old reader. The
// littlest have six lessons of their own (Little Learners, DR-0431) against a
// catalog of 791. So a small child meets nearly all of it as a wall of words.
//
// THE LAW PINNED HERE:
//   * every lesson yields a page — no lesson is left without one;
//   * the verse on the page is VERBATIM, lifted out of the lesson's own band,
//     never composed or trimmed here (DR-0459, Layer 0);
//   * the words to trace are really the lesson's words;
//   * the whole page is DERIVED, so a lesson edited upstream changes its page
//     (DR-0121) — nothing about a lesson is retyped in this file.
// =============================================================================
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  coloringPage, coloringSvg, quotedVerses, traceableWords, symbolsFor, verseLines, SYMBOLS,
  sheetLayout, fitLines, lineWidth, USABLE, SHEET,
} from '../lib/coloring-page.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const SAMPLE = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll14-'));

describe('the verse is the lesson’s own, to the letter', () => {
  it('pulls quoted spans with their references out of a band', () => {
    const v = quotedVerses('He said, "Were there not ten cleansed? but where are the nine?" (Luke 17:17). Then more.');
    expect(v).toEqual([{ words: 'Were there not ten cleansed? but where are the nine?', ref: 'Luke 17:17' }]);
  });

  it('PROVEN-TO-CATCH: the chosen verse appears, character for character, inside the lesson', () => {
    const page = coloringPage(SAMPLE);
    expect(page.verse.length).toBeGreaterThan(8);
    const band = SAMPLE.levels.child;
    expect(band.includes(page.verse), 'the page carries words the lesson does not').toBe(true);
    expect(band.includes(page.ref)).toBe(true);
  });

  it('every Living Lesson that quotes a verse puts a REAL one on its page', () => {
    const wrong = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const page = coloringPage(m);
      if (!page || !page.verse) continue;
      const source = (m.levels && m.levels.child) || m.lesson || '';
      if (!source.includes(page.verse)) wrong.push(m.id);
    }
    expect(wrong, `pages whose verse is not verbatim in the lesson:\n${wrong.slice(0, 5).join('\n')}`).toEqual([]);
  });

  it('nothing is composed when a lesson quotes nothing — the page just has no verse', () => {
    const page = coloringPage({ id: 'x', title: 'A Lesson', levels: { child: 'No quotations at all here.' } });
    expect(page.verse).toBe('');
    expect(page.ref).toBe('');
    expect(page.title).toBe('A Lesson');
  });
});

describe('every lesson gets a page', () => {
  it('all 236 Living Lessons yield one, each with a title and something to color', () => {
    const none = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const p = coloringPage(m);
      if (!p || !p.title || !p.symbols.length) none.push(m.id);
    }
    expect(none, `lessons with no page:\n${none.slice(0, 5).join('\n')}`).toEqual([]);
    expect(LIVING_LESSONS_MODULES.length).toBeGreaterThan(200);
  });

  it('a lesson whose words match no symbol still gets shapes, never an empty sheet', () => {
    const p = coloringPage({ id: 'x', title: 'Zzz', levels: { child: 'qqq wwww zzzz.' } });
    expect(p.symbols.length).toBeGreaterThan(0);
  });

  it('the symbols are chosen by the lesson’s OWN words, not at random', () => {
    expect(symbolsFor('the shepherd found his lamb').map((s) => s.id)).toContain('lamb');
    expect(symbolsFor('five loaves of bread and two fishes').map((s) => s.id)).toContain('bread');
    expect(symbolsFor('the king sat on his throne').map((s) => s.id)).toContain('crown');
  });

  it('every symbol in the library is a drawable outline with a name', () => {
    for (const s of SYMBOLS) {
      expect(s.id, 'a symbol with no name').toBeTruthy();
      expect(s.d.length, `${s.id} has no path`).toBeGreaterThan(20);
      expect(s.words.length, `${s.id} is reachable by no word`).toBeGreaterThan(0);
    }
  });
});

describe('the words a small hand traces are really the lesson’s', () => {
  it('short, plain, no filler, no repeats', () => {
    const w = traceableWords('The thankful man ran back to Jesus and gave him thanks for mercy.');
    expect(w.length).toBeGreaterThan(0);
    for (const x of w) {
      expect(x.length).toBeGreaterThanOrEqual(3);
      expect(x.length).toBeLessThanOrEqual(6);
    }
    expect(new Set(w).size).toBe(w.length);
    expect(w).not.toContain('the');
    expect(w).not.toContain('and');
  });

  it('PROVEN-TO-CATCH: every traced word really occurs in the lesson', () => {
    const page = coloringPage(SAMPLE);
    const band = SAMPLE.levels.child.toLowerCase();
    for (const w of page.words) expect(band.includes(w.toLowerCase()), `${w} is not in the lesson`).toBe(true);
  });

  it('PROVEN-TO-CATCH: a Name is never handed to a child in lowercase (Layer 0)', () => {
    // The first cut lowercased everything to dedupe, and L14's sheet came back
    // asking a child to trace "jesus". A coloring page is copied by hand, which
    // makes it the last place to teach the lowercase form.
    const page = coloringPage(SAMPLE);
    expect(page.words).toContain('Jesus');
    expect(page.words).not.toContain('jesus');
    const NAMES = ['jesus', 'yahweh', 'god', 'christ', 'father', 'lord', 'ghost', 'spirit'];
    const bad = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const w of coloringPage(m).words) {
        if (NAMES.includes(w.toLowerCase()) && w[0] !== w[0].toUpperCase()) bad.push(`${m.id}: ${w}`);
      }
    }
    expect(bad, `a Name printed lowercase for a child to trace:\n${bad.slice(0, 5).join('\n')}`).toEqual([]);
  });

  it('and the casing a word is traced in is the lesson’s own', () => {
    const p = coloringPage({ id: 'x', title: 'T', levels: { child: 'Jesus loves mercy and Yahweh gives peace.' } });
    expect(p.words).toContain('Jesus');
    expect(p.words).toContain('Yahweh');
  });
});

describe('the sheet itself', () => {
  it('is an SVG that prints: outlines to color, nothing pre-filled', () => {
    const svg = coloringSvg(coloringPage(SAMPLE));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain(SAMPLE.title);
    // The title, verse and traced words are OUTLINES — fill:none — or there is
    // nothing for a crayon to do.
    expect(svg).toMatch(/font-size="44"[^>]*fill="none"/);
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('Color it in while a grown-up reads the lesson to you.');
  });

  it('the verse is broken into short lines a child can follow', () => {
    expect(verseLines('one two three four five six seven', 5)).toEqual(['one two three four five', 'six seven']);
    expect(verseLines('', 5)).toEqual([]);
  });

  it('nothing to draw yields nothing, rather than a broken sheet', () => {
    expect(coloringSvg(null)).toBe('');
    expect(coloringPage(null)).toBe(null);
    expect(coloringPage({ id: 'x', title: '' })).toBe(null);
  });

  it('the markup is escaped, so a title with punctuation cannot break the page', () => {
    const svg = coloringSvg(coloringPage({ id: 'x', title: 'Fear & <Trembling>', levels: { child: 'He is good.' } }));
    expect(svg).toContain('Fear &amp; &lt;Trembling&gt;');
    expect(svg).not.toContain('<Trembling>');
  });
});

// ===========================================================================
// AND IT HAS TO FIT ON THE PAPER
// ===========================================================================
// The first cut of this library set the title on ONE line at font-size 44.
// Measured afterwards across all 236 Living Lessons: 224 titles ran off the
// page on the model, and rendering the same sheets in real Chromium and
// reading getBBox put it at 214 of 236 sheets with text off the paper, the
// widest run 3,098px on a sheet 792px wide — almost four times the paper.
//
// Two real sheets had been generated and read before that shipped, which is
// how the lowercase "jesus" was caught. Reading a sample proves the CONTENT
// and never the GEOMETRY. That is the form-factor dimension of DR-0239, and
// this block is it, run every push.
//
// The model here estimates glyph advance (EM = 0.58, deliberately wider than
// Georgia's real average so it can only over-state). Chromium measured the
// widest run on the fixed sheets at 570px where this model says 651 — over-
// stating, as designed. CI has no renderer, so the model is the standing gate
// and the browser pass is recorded in DR-0866.
// ===========================================================================
describe('the sheet fits on the paper', () => {
  it('PROVEN-TO-CATCH: not one run on any of the 236 sheets exceeds the ink area', () => {
    const over = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const page = coloringPage(m);
      if (!page) continue;
      for (const r of sheetLayout(page).runs) {
        const w = lineWidth(r.text, r.size);
        if (w > USABLE) over.push(`${m.id} [${r.role}] ${Math.round(w)}px > ${USABLE}px: "${r.text.slice(0, 40)}"`);
      }
    }
    expect(over, `runs wider than the ink area:\n${over.slice(0, 6).join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: nothing is drawn below the paper, or over the tracing row', () => {
    const bad = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const page = coloringPage(m);
      if (!page) continue;
      const lay = sheetLayout(page);
      if (lay.contentBottom > lay.traceY - 20) bad.push(`${m.id}: symbols reach ${lay.contentBottom}, tracing row at ${lay.traceY}`);
      if (lay.contentBottom > SHEET.height) bad.push(`${m.id}: ink past the paper`);
    }
    expect(bad, bad.slice(0, 6).join('\n')).toEqual([]);
  });

  it('a long title arrives WHOLE — wrapped, never cut', () => {
    const long = 'A Very Long Lesson Title That Will Not Fit On One Single Line Of This Printed Sheet At All';
    const fit = fitLines(long);
    expect(fit.lines.length).toBeGreaterThan(1);
    expect(fit.lines.join(' ')).toBe(long);
    for (const l of fit.lines) expect(lineWidth(l, fit.size)).toBeLessThanOrEqual(USABLE);
  });

  it('wrapping is tried BEFORE shrinking, so a child gets the biggest text that fits', () => {
    // Four lines at full size beats six lines of small type on a sheet a
    // six-year-old is meant to read along with.
    const fit = fitLines('A Very Long Lesson Title That Will Not Fit On One Single Line Of This Printed Sheet At All');
    expect(fit.size).toBe(44);
    expect(fit.lines.length).toBeLessThanOrEqual(4);
  });

  it('but it DOES shrink when wrapping alone cannot fit the line budget', () => {
    const huge = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');
    const fit = fitLines(huge, { maxLines: 4 });
    expect(fit.size).toBeLessThan(44);
    expect(fit.lines.join(' ')).toBe(huge);
    for (const l of fit.lines) expect(lineWidth(l, fit.size)).toBeLessThanOrEqual(USABLE);
  });

  it('a short title keeps the biggest size on the ladder', () => {
    const fit = fitLines('Taste and See');
    expect(fit.size).toBe(44);
    expect(fit.lines).toEqual(['Taste and See']);
  });

  it('the longest real title in the catalog still fits', () => {
    const worst = LIVING_LESSONS_MODULES
      .map((m) => coloringPage(m)).filter(Boolean)
      .sort((a, b) => b.title.length - a.title.length)[0];
    expect(worst.title.length).toBeGreaterThan(100);
    const fit = fitLines(worst.title, { maxLines: 4 });
    expect(fit.lines.join(' ')).toBe(worst.title.replace(/\s+/g, ' ').trim());
    for (const l of fit.lines) expect(lineWidth(l, fit.size)).toBeLessThanOrEqual(USABLE);
  });

  it('no words means no lines, not a line of nothing', () => {
    expect(fitLines('').lines).toEqual([]);
    expect(fitLines('   ').lines).toEqual([]);
  });

  it('a word longer than the line is kept whole rather than broken', () => {
    const fit = fitLines('Mahershalalhashbaz', { width: 100, sizes: [44, 20] });
    expect(fit.lines).toEqual(['Mahershalalhashbaz']);
  });
});

// ===========================================================================
// SOMEBODY HAS TO LOOK AT THE SHAPE
// ===========================================================================
// The first `hand` path drew a closed fist with ONE finger standing far above
// the others. Rendered, it read unmistakably as an obscene gesture — and
// because 'give', 'help', 'hold' and 'work' are ordinary words, it was
// selected onto 122 of the 236 children's sheets. It shipped because the
// symbol library was written as path data and never once rendered.
//
// The same look found a `lamb` whose head floated detached beside its body.
// Layer 0 confesses Jesus as the Lamb of Yahweh; a malformed Lamb is not a
// cosmetic defect. `lamp` read as a tripod and `bird` as a pole between two
// arcs. All four were redrawn and looked at.
//
// No assertion can tell whether a path READS as what it claims — that needs
// eyes. So this is a ratchet on the eyes instead: every path is pinned by
// hash, and ANY edit to any path turns this red until someone renders the
// library, looks at it, and updates the hash on purpose. The check cannot
// judge the drawing; it can refuse to let a drawing change unwatched.
//
// To re-review: render SYMBOLS to PNG, look at every shape, then update the
// hash here in the same commit that changes the path.
// ===========================================================================
const REVIEWED = {
  lamb: '0dfa6288c11b',
  crown: 'fb0abb060edf',
  bread: 'ca582d07048f',
  water: 'fc4c84fecc46',
  lamp: 'f3da7b6543ea',
  tree: '82ed12a8b025',
  house: '186d0b5044f6',
  heart: '790016cca43e',
  star: '5db82389bfa9',
  fish: '4febaa8d70e1',
  hand: 'b4863361cb30',
  book: 'd4bbbd3b68ad',
  sun: '91ab1ce385e9',
  bird: '144c4645651c',
  door: 'b5bd1111328e',
  cross: '975f35c191eb',
};

describe('a shape a child colors was looked at by a person', () => {
  const hash = (d) => createHash('sha256').update(d).digest('hex').slice(0, 12);

  it('PROVEN-TO-CATCH: no path may change without a fresh look', () => {
    const drifted = [];
    for (const s of SYMBOLS) {
      if (!REVIEWED[s.id]) drifted.push(`${s.id}: new symbol, never reviewed`);
      else if (REVIEWED[s.id] !== hash(s.d)) drifted.push(`${s.id}: path changed (${REVIEWED[s.id]} -> ${hash(s.d)})`);
    }
    expect(
      drifted,
      `Render the symbols, LOOK at them, then update REVIEWED in this file:\n${drifted.join('\n')}`,
    ).toEqual([]);
  });

  it('every reviewed symbol still exists — a shape cannot quietly vanish', () => {
    const ids = new Set(SYMBOLS.map((s) => s.id));
    expect(Object.keys(REVIEWED).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('the hand has every finger, none towering over its neighbours', () => {
    // The specific fault, pinned in the shape itself rather than only by hash:
    // four finger tops within ten units of each other cannot read as a
    // gesture, however the path is otherwise redrawn.
    const hand = SYMBOLS.find((s) => s.id === 'hand');
    const tops = [...hand.d.matchAll(/l0 -(\d+) a5 5/g)].map((m) => Number(m[1]));
    expect(tops.length, 'the hand should have four fingers').toBe(4);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(10);
  });
});
