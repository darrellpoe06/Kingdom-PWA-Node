// @vitest-environment jsdom
// =============================================================================
// THE COLORING PAGE CAN BE REACHED — the sheet, in the app, from the lesson
// =============================================================================
// Darrell, 2026-10-10: "Coloring books with words inside... that reflect the
// same lesson..."
//
// The library that derives a sheet shipped the same day with NO way to open
// one from the app. A sheet nobody can reach is not delivered (DR-0065), so
// DR-0865's parked date is not waited out (DR-0236).
//
// COPY AND BEHAVIOR ARE TESTED TOGETHER (DR-0691). Every control here is
// pressed and the result checked against what its own label promises: "Color
// this lesson" opens it, "Hide the coloring page" closes it, "Save it" really
// saves, and when the browser blocks the print window the note SAYS a file was
// saved instead — and a file really was.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ColoringSheet, { ColoringBookButton, sheetFileName } from '../components/ColoringSheet.jsx';
import { coloringPage, coloringBooklet, bookletCount } from '../lib/coloring-page.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SAMPLE = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll14-'));
const SOME = LIVING_LESSONS_MODULES.slice(0, 5);

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
  return container;
}

const at = (sel) => container.querySelector(`[data-testid="${sel}"]`);
const press = async (sel) => { await act(async () => { at(sel).click(); }); };

/** Catch what the page tries to save, without a real download. */
let saved;
beforeEach(() => {
  saved = [];
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function click() { saved.push(this.download); };
});

describe('the lesson offers its coloring page', () => {
  it('the block is there, named for who it is for, and says what it is', async () => {
    await mount(createElement(ColoringSheet, { module: SAMPLE }));
    const block = at('lesson-coloring-sheet');
    expect(block.textContent).toContain('For the littlest');
    expect(block.textContent).toContain('too young to read it');
    expect(block.getAttribute('data-lesson')).toBe(SAMPLE.id);
  });

  it('"Color this lesson" OPENS it, and the sheet shown is this lesson’s own', async () => {
    await mount(createElement(ColoringSheet, { module: SAMPLE }));
    expect(at('coloring-sheet-open')).toBeNull();
    await press('coloring-sheet-toggle');
    expect(at('coloring-sheet-open')).toBeTruthy();
    const svg = at('coloring-sheet-svg');
    const page = coloringPage(SAMPLE);
    // The verse on the rendered sheet is the lesson's own, to the letter.
    expect(svg.textContent.replace(/\s+/g, ' ')).toContain(page.verse.split(/\s+/).slice(0, 4).join(' '));
    for (const w of page.words) expect(svg.textContent).toContain(w);
  });

  it('and then the label says "Hide the coloring page", and pressing it hides it', async () => {
    await mount(createElement(ColoringSheet, { module: SAMPLE }));
    expect(at('coloring-sheet-toggle').textContent).toBe('Color this lesson');
    await press('coloring-sheet-toggle');
    expect(at('coloring-sheet-toggle').textContent).toBe('Hide the coloring page');
    expect(at('coloring-sheet-toggle').getAttribute('aria-expanded')).toBe('true');
    await press('coloring-sheet-toggle');
    expect(at('coloring-sheet-open')).toBeNull();
    expect(at('coloring-sheet-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('"Save it" really saves, under a name a parent can find again', async () => {
    await mount(createElement(ColoringSheet, { module: SAMPLE }));
    await press('coloring-sheet-toggle');
    await press('coloring-sheet-save');
    const name = sheetFileName(coloringPage(SAMPLE));
    expect(saved).toContain(name);
    expect(name.startsWith('coloring-')).toBe(true);
    expect(name.endsWith('.svg')).toBe(true);
    expect(at('coloring-sheet-note').textContent).toContain(name);
  });

  it('PROVEN-TO-CATCH: a blocked print window SAVES instead, and the note says exactly that', async () => {
    // A popup blocker on a phone is ordinary, not an error. The tap must never
    // be dead, and the copy must not claim a print that did not happen.
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await mount(createElement(ColoringSheet, { module: SAMPLE }));
    await press('coloring-sheet-toggle');
    await press('coloring-sheet-print');
    const note = at('coloring-sheet-note').textContent;
    expect(note).toContain('blocked the print window');
    expect(note).toContain('saved');
    // The copy says a file was saved, so a file really was saved.
    expect(saved).toContain(sheetFileName(coloringPage(SAMPLE)));
    open.mockRestore();
  });

  it('a signed-out reader still SEES the sheet, and is asked for an account only to take it (DR-0698)', async () => {
    await mount(createElement(ColoringSheet, { module: SAMPLE, signedIn: false }));
    await press('coloring-sheet-toggle');
    expect(at('coloring-sheet-svg')).toBeTruthy();
    expect(at('coloring-sheet-save')).toBeNull();
    expect(at('coloring-sheet-print')).toBeNull();
    expect(at('download-needs-account')).toBeTruthy();
  });

  it('a lesson with no page says so, rather than leaving a hole (P15)', async () => {
    await mount(createElement(ColoringSheet, { module: { id: 'x', title: '' } }));
    const block = at('lesson-coloring-sheet');
    expect(block.getAttribute('data-empty')).toBe('true');
    expect(block.textContent).toContain('no coloring page yet');
  });

  it('a lesson that quotes nothing says the page has no verse, and invents none', async () => {
    await mount(createElement(ColoringSheet, { module: { id: 'x', title: 'A Quiet Lesson', levels: { child: 'He is good to us.' } } }));
    expect(at('lesson-coloring-sheet').getAttribute('data-has-verse')).toBe('false');
    expect(at('coloring-sheet-no-verse').textContent).toContain('does not quote a verse');
  });
});

describe('the whole course prints as a book', () => {
  it('the count on the button is the number of sheets it really prints', async () => {
    await mount(createElement(ColoringBookButton, { modules: SOME, title: 'Living Lessons' }));
    const btn = at('coloring-book-print');
    expect(btn.getAttribute('data-sheets')).toBe(String(bookletCount(SOME)));
    expect(btn.textContent).toContain(String(SOME.length));
  });

  it('PROVEN-TO-CATCH: every lesson gets its OWN page — one sheet, one page break', () => {
    const html = coloringBooklet(SOME, { title: 'A Book' });
    expect((html.match(/<svg/g) || []).length).toBe(SOME.length);
    expect(html).toContain('page-break-after:always');
    expect(html).toContain('size:letter');
    // Self-contained on purpose: nothing to fetch, so it prints offline.
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<link');
  });

  it('a blocked print window saves the book instead, and says so', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await mount(createElement(ColoringBookButton, { modules: SOME, title: 'Living Lessons' }));
    await press('coloring-book-print');
    expect(at('coloring-book-note').textContent).toContain('saved');
    expect(saved.some((n) => n && n.startsWith('coloring-book-'))).toBe(true);
    open.mockRestore();
  });

  it('with nothing to print it SAYS so, rather than vanishing (P15)', async () => {
    await mount(createElement(ColoringBookButton, { modules: [], title: 'Empty' }));
    expect(at('coloring-book-none').textContent).toContain('No coloring pages here yet');
    expect(at('coloring-book-print')).toBeNull();
  });

  it('an empty book is still a readable document, not a broken file', () => {
    const html = coloringBooklet([], { title: 'Empty' });
    expect(html).toContain('no lessons to color yet');
    expect(html.startsWith('<!doctype html>')).toBe(true);
  });
});
