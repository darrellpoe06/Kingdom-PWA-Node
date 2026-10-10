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
import { describe, it, expect } from 'vitest';
import {
  coloringPage, coloringSvg, quotedVerses, traceableWords, symbolsFor, verseLines, SYMBOLS,
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
