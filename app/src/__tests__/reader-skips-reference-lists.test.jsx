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
    const src = readSrc();
    expect(src).not.toContain('<strong>Anchor — {m.anchor.ref}:</strong>');
  });

  it('THE RAW REFERENCE STRING IS NOT PRINTED IN THE LESSON AT ALL', () => {
    // CORRECTED 2026-09-14 after he saw it: "all the lesson actual Word has been
    // stripped and listed instead of naturally inside the lessons" and "now we
    // humans get a computer list".
    //
    // The first fix moved the anchor's reference string from the middle of the
    // lesson to the end. That was still WRONG, and the end was not the point:
    // `m.anchor.ref` is a semicolon-joined machine string (eighty entries on
    // L149) and rendering it ANYWHERE in a lesson gives a person a computer
    // list. His instruction was to keep the Word IN the lesson -- which it
    // already is, quoted inline in the prose -- and to stop the LIST being
    // performed or displayed. So the list is gone from the reading view
    // entirely. The reader still collapses runs (above), and the presented deck
    // still carries its closing reference slide for a speaker who wants it.
    const src = readSrc();
    expect(src).not.toMatch(/text=\{m\.anchor\.ref\}/);
    expect(src).not.toMatch(/The Word we stood on/);
  });

  it('but the anchor THEME still teaches, and inline Scripture is untouched', () => {
    // The half he explicitly asked to keep.
    const src = readSrc();
    expect(src).toMatch(/text=\{`Anchor — \$\{m\.anchor\.theme/);
    expect(src).toMatch(/WordInline/);
  });
});

describe('Show/Hide the Word sits with the play controls', () => {
  // Darrell 2026-09-14, from the lesson with the Read Aloud panel open: "I want
  // that bar to be where the play button is or have the same impact."
  //
  // It was a bar in the lesson BODY. It is a READING preference, so it belongs
  // where reading is controlled. Source-pinned on two properties that a future
  // edit could quietly break, both of which have bitten this panel before.
  const readTts = () => {
    const { readFileSync } = require('node:fs');
    const { join, dirname } = require('node:path');
    const { fileURLToPath } = require('node:url');
    return readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'TTSControl.jsx'),
      'utf8',
    );
  };

  it('the reader panel carries the toggle', () => {
    const src = readTts();
    expect(src).toMatch(/onClick=\{toggleShowTheWord\}/);
    expect(src).toMatch(/Hide the Word — read without the verses open/);
  });

  it('reuses the STORE so the two controls can never disagree', () => {
    // If this were local state, the panel button and the in-lesson bar would
    // drift apart and the verses would be open on one and shut on the other.
    const src = readTts();
    expect(src).toMatch(/useShowTheWord, toggleShowTheWord \} from '\.\.\/lib\/show-the-word\.js'/);
    expect(src).toMatch(/const showWord = useShowTheWord\(\);/);
  });

  it('is sized in em, not rem, because the panel is capped-chrome scaled', () => {
    // The panel comment records the real defect this prevents: rem-sized labels
    // ballooned at A+++/A44 and clipped the controls off-screen. Importing
    // ShowTheWordToggle (which sizes in rem) would reintroduce exactly that.
    const src = readTts();
    const btn = src.slice(src.indexOf('onClick={toggleShowTheWord}') - 400,
      src.indexOf('onClick={toggleShowTheWord}') + 700);
    expect(btn).toMatch(/text-\[0\.6875em\]/);
    expect(btn).not.toMatch(/text-\[0\.\d+rem\]/);
    expect(src).not.toMatch(/import ShowTheWordToggle/);
  });
});
