// @vitest-environment jsdom
// A LIST OF REFERENCES IS NOT A SENTENCE — AND A GREEN REFERENCE MUST OPEN.
// =============================================================================
// Darrell 2026-09-13, from the full-screen lesson view with the reader running
// on the Anchor block: "Links don't work in last played... don't read long list
// of references together... especially in these.... just when the word or a
// point is needed... makes sense?"
//
// Two defects on one screen, and they are the same family.
//
// 1. THE READER PERFORMED AN INDEX. An anchor line can carry eighty references
//    separated by semicolons. Spoken one by one that is minutes of "Matthew
//    chapter four verse ten, Isaiah chapter forty-two verse eight..." before a
//    single word of teaching, with no way to skip. It is a LIST being read as
//    prose — the same class as the chrome the reader used to speak. But a
//    reference INSIDE a sentence is the point, and is exactly what he wants
//    kept. So the rule is about RUNS, never about references.
//
// 2. THE ANCHOR'S REFERENCES LOOKED LIKE LINKS AND WERE NOT. They rendered as
//    plain text inside a green paragraph — green because the PARAGRAPH is
//    green — so the line advertised an affordance it did not have. That is the
//    hollow-surface class (DR-0381) in a different coat.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { collapseReferenceRuns } from '../lib/speech-shape.js';
import { toSpokenForm } from '../lib/speech-text.js';
import WordInline from '../components/WordInline.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A real anchor line, in the shape the corpus actually produces.
const ANCHOR = 'Anchor — Matthew 4:10; Isaiah 42:8; Exodus 20:3; Exodus 20:4; Exodus 20:5; '
  + 'Matthew 2:2; Matthew 2:11; Matthew 8:2: KJV: the standard is set by the accused.';

describe('collapseReferenceRuns — a run is summarised, a citation is kept', () => {
  it('collapses a long run to one short sentence that says how many and where', () => {
    const out = collapseReferenceRuns(ANCHOR);
    expect(out).toMatch(/8 Scripture references are listed on the screen/);
    // and it does NOT still contain the individual references
    expect(out).not.toContain('Isaiah 42:8');
    expect(out).not.toContain('Exodus 20:4');
  });

  it('NEVER drops the prose around the run', () => {
    const out = collapseReferenceRuns(ANCHOR);
    expect(out).toContain('Anchor');
    expect(out).toContain('KJV: the standard is set by the accused.');
  });

  it('KEEPS a single reference, because that is the point being made', () => {
    const line = 'He says it plainly in Romans 5:8, and that settles it.';
    expect(collapseReferenceRuns(line)).toBe(line);
  });

  it('KEEPS two references, because a pair in a sentence is still teaching', () => {
    const line = 'Read Genesis 1:26 and John 1:1 together.';
    expect(collapseReferenceRuns(line)).toBe(line);
  });

  it('only collapses references that are ADJACENT — prose between them protects them', () => {
    const line = 'First Genesis 1:26, and the reason is given later, so John 1:1 matters, '
      + 'and then much later Romans 5:8 closes it.';
    const out = collapseReferenceRuns(line);
    expect(out).toContain('Genesis 1:26');
    expect(out).toContain('John 1:1');
    expect(out).toContain('Romans 5:8');
  });

  it('the threshold is adjustable and honoured', () => {
    const three = 'See Genesis 1:1; John 1:1; Romans 5:8.';
    expect(collapseReferenceRuns(three, 3)).toMatch(/3 Scripture references/);
    expect(collapseReferenceRuns(three, 9)).toContain('Genesis 1:1');
  });

  it('is total on degenerate input rather than throwing', () => {
    expect(collapseReferenceRuns('')).toBe('');
    expect(collapseReferenceRuns(null)).toBe('');
    expect(collapseReferenceRuns(undefined)).toBe('');
    expect(collapseReferenceRuns('no references here at all')).toBe('no references here at all');
  });
});

describe('toSpokenForm — the reading itself is fixed, not just the helper', () => {
  it('does not speak the anchor list one reference at a time', () => {
    const spoken = toSpokenForm(ANCHOR);
    expect(spoken).toMatch(/8 Scripture references are listed on the screen/);
    expect(spoken).not.toMatch(/Isaiah chapter 42 verse 8/);
    expect(spoken).not.toMatch(/Exodus chapter 20 verse 4/);
  });

  it('still expands a reference that is doing work in a sentence', () => {
    expect(toSpokenForm('He says it plainly in Romans 5:8, and that settles it.'))
      .toContain('Romans chapter 5 verse 8');
  });

  it('still says a psalm the way a person says it', () => {
    expect(toSpokenForm('Read Psalms 119:105 tonight.')).toMatch(/Psalms 119 verse 105/);
  });
});

describe('WordInline — a reference that LOOKS tappable actually opens', () => {
  let container; let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const anchorLine = 'Anchor — Matthew 4:10; Isaiah 42:8: KJV: the standard is set by the accused.';

  it('renders each reference as a real button, not as coloured text', () => {
    act(() => root.render(createElement(WordInline, { text: anchorLine, load: async () => 'verse text' })));
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toContain('Matthew 4:10');
    expect(labels).toContain('Isaiah 42:8');
  });

  it('and the prose around them is unchanged, character for character', () => {
    act(() => root.render(createElement(WordInline, { text: anchorLine, load: async () => 'verse text' })));
    const flat = container.textContent.replace(/\s+/g, ' ');
    expect(flat).toContain('KJV: the standard is set by the accused.');
    expect(flat).toContain('Matthew 4:10');
  });
});

const readSrc = () => {
  const { readFileSync } = require('node:fs');
  const { join, dirname } = require('node:path');
  const { fileURLToPath } = require('node:url');
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(here, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
};

describe('the Anchor line in the full-screen lesson view is wired to WordInline', () => {
  // Source-pinned, because the defect was that this ONE call site rendered the
  // references as plain text while every other surface made them tappable. A
  // render test on ChurchLearn would need the whole Learn tree mounted; what
  // actually regressed was the wiring, so the wiring is what is pinned.
  // RE-POINTED 2026-09-14, not weakened. The original pinned that the anchor's
  // references were wired to WordInline rather than printed as plain text, which
  // was right. Darrell then moved the LIST itself: "Put the list of links at the
  // end of lessons... so it doesn't take away from the lessons." So the refs are
  // still tappable — they are just tappable at the FOOT of the lesson now, under
  // "The Word we stood on", the same name the presented deck uses. The property
  // being guarded (a reference that looks tappable IS tappable) is unchanged;
  // only where it holds has moved.
  it('does not render the anchor references as bare interpolated text', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).not.toContain('<strong>Anchor — {m.anchor.ref}:</strong>');
    // The list is rendered through WordInline at the foot of the lesson.
    expect(src).toMatch(/The Word we stood on[\s\S]{0,900}<WordInline[\s\S]{0,120}text=\{m\.anchor\.ref\}/);
  });

  it('does NOT print the long list up in the teaching block any more', () => {
    // The defect he reported on 2026-09-14: the list still sat fourth of six
    // blocks, before the teaching, in the reading view — the deck had been
    // fixed in #1567 and the lesson had not. The anchor line keeps the THEME,
    // which is teaching; the eighty semicolons go to the end.
    const src = readSrc();
    expect(src).not.toMatch(/text=\{`Anchor — \$\{m\.anchor\.ref\}/);
    expect(src).toMatch(/text=\{`Anchor — \$\{m\.anchor\.theme/);
  });

  it('says how many references are down there, derived rather than typed', () => {
    // "Say 30 scripture references at the end... Or whatever number."
    const src = readSrc();
    expect(src).toMatch(/referencesIn\(m\.anchor\.ref\)\.length/);
    expect(src).toContain("Scripture {anchorRefCount === 1 ? 'reference' : 'references'}");
  });
});
