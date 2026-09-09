// =============================================================================
// WordInline + verse-refs — the Word opens in place from inside prose, anywhere
// =============================================================================
// Darrell, 2026-09-08: "really anywhere should have this ability... so the
// scriptures can always be read... anywhere at anytime... simple functions
// just to show the Word."
//
// PROVEN-TO-CATCH (DR-0076 §3): altering a character of the prose fails "not
// one character changes"; dropping the range capture from the shared matcher
// fails the range case; a false positive on "LET GO AND LET GOD" fails the
// no-reference case; an <a href> fails "no link"; a chip under the 36px floor
// fails the standard case; and each surface reverting to a plain <p> fails
// its pin at the bottom.
import React, { act } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import WordInline from '../components/WordInline.jsx';
import { segmentByReferences, referencesIn } from '../lib/verse-refs.js';
import { findScriptureRefs } from '../lib/video-harvest.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, rel), 'utf8');

let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
});
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const buttons = (h) => [...h.querySelectorAll('button')];
const click = (n) => act(() => { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

const PROSE = 'So our likeness in Genesis 1:26 is FAMILY language — see 1 John 4:8 and Exodus 3:2-6 too.';

describe('the pure cut', () => {
  it('splits prose around every reference, in order, keeping every character', () => {
    const segs = segmentByReferences(PROSE);
    expect(segs.map((s) => s.type)).toEqual(['text', 'ref', 'text', 'ref', 'text', 'ref', 'text']);
    expect(segs.map((s) => (s.type === 'ref' ? s.raw : s.value)).join('')).toBe(PROSE);
    expect(segs.filter((s) => s.type === 'ref').map((s) => s.value)).toEqual(['Genesis 1:26', '1 John 4:8', 'Exodus 3:2-6']);
  });

  it('keeps a range whole — the shared matcher captures the end verse', () => {
    expect(findScriptureRefs('read Exodus 3:2-6 slowly')[0]).toMatchObject({ ref: 'Exodus 3:2-6', raw: 'Exodus 3:2-6' });
    expect(findScriptureRefs('Psalm 23:1–3')[0].ref).toBe('Psalm 23:1-3');
  });

  it('finds nothing in text that names no verse, and never invents one', () => {
    expect(segmentByReferences('LET GO AND LET GOD')).toEqual([{ type: 'text', value: 'LET GO AND LET GOD' }]);
    expect(segmentByReferences('')).toEqual([]);
    expect(segmentByReferences(null)).toEqual([]);
    expect(referencesIn('Conviction is a Genesis doctrine.')).toEqual([]);
  });

  it('reads Job the man and job the work as different things (Darrell: "train the Ari")', () => {
    // A name is written as a name. The work is never a verse.
    expect(referencesIn('Job 19:25 says my redeemer liveth')).toEqual(['Job 19:25']);
    expect(referencesIn('JOB 19:25 in the transcript')).toEqual(['Job 19:25']);
    expect(referencesIn('meet at the job 9:30 sharp')).toEqual([]);
    expect(referencesIn('Corion finished the job 2 days early')).toEqual([]);
    // A time of day beside a name is still a time.
    expect(referencesIn('Job 9:30 am at the site')).toEqual([]);
    expect(referencesIn('Mark 9:05 pm')).toEqual([]);
    expect(referencesIn('mark 5:30 on the wall')).toEqual([]);
    expect(referencesIn('Mark 5:30 records it')).toEqual(['Mark 5:30']);
    // Books that are nobody's job still read in any case — transcripts arrive lowercase.
    expect(referencesIn('drawn from psalm 46:10 and 1 john 4:9-10')).toEqual(['Psalm 46:10', '1 John 4:9-10']);
    // A clock's leading zero is not a verse number.
    expect(referencesIn('Genesis 2:05')).toEqual([]);
    expect(findScriptureRefs('the job 9:30 and Job 9:30')).toHaveLength(1);
  });

  it('lists the distinct references once each, first appearance first', () => {
    expect(referencesIn('John 1:1 then John 1:1 again, then Genesis 1:1')).toEqual(['John 1:1', 'Genesis 1:1']);
  });
});

describe('the prose renderer', () => {
  const KJV = { 'Genesis 1:26': 'And God said, Let us make man in our image, after our likeness:' };
  const load = vi.fn(async (r) => KJV[r] || '');

  it('renders the prose unchanged, with each reference as a button in its place, and no link', () => {
    const host = render(<WordInline text={PROSE} load={load} />);
    expect(host.querySelector('p').textContent).toBe(PROSE);
    expect(buttons(host).map((b) => b.textContent)).toEqual(['Genesis 1:26', '1 John 4:8', 'Exodus 3:2-6']);
    expect(host.querySelector('a')).toBeNull();
  });

  it('opens the verse directly beneath the paragraph when a reference is pressed', async () => {
    const host = render(<WordInline text={PROSE} load={load} />);
    click(buttons(host)[0]);
    await settle();
    expect(host.textContent).toContain(KJV['Genesis 1:26']);
    const p = host.querySelector('p');
    const region = host.querySelector('[role="region"]');
    expect(region.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    // The paragraph itself is untouched by the open.
    expect(p.textContent).toBe(PROSE);
  });

  it('is a plain paragraph when the prose names no verse', () => {
    const host = render(<WordInline text="Conviction is a Genesis doctrine." load={load} />);
    expect(host.innerHTML).toBe('<p class="">Conviction is a Genesis doctrine.</p>');
  });

  it('keeps the house floor and the focus ring on an inline chip', () => {
    const host = render(<WordInline text="see 1 John 4:8" load={load} />);
    const b = buttons(host)[0];
    expect(b.className).toMatch(/min-h-\[36px\]/);
    expect(b.className).toMatch(/focus:outline/);
    expect(b.getAttribute('aria-label')).toBe('Open 1 John 4:8');
  });

  it('renders as another tag when asked, so a heading or a span can carry it', () => {
    const host = render(<WordInline as="span" text="see 1 John 4:8" load={load} />);
    expect(host.querySelector('span > button')).toBeTruthy();
  });
});

describe('the surfaces that carry it (each reverting to a plain <p> fails here)', () => {
  it('the Torah map: what the text shows, our confession, and where we stop', () => {
    const src = read('../components/TorahPatternMap.jsx');
    expect(src).toMatch(/<WordInline text=\{pattern\.shows\}/);
    expect(src).toMatch(/<WordInline text=\{pattern\.confession\}/);
    expect(src).toMatch(/<WordInline text=\{pattern\.reticence\}/);
  });
  it('Study: the plain layer, the deep source, and the scripture line', () => {
    const src = read('../components/Study.jsx');
    expect(src).toMatch(/<WordInline text=\{entry\.plain\}/);
    expect(src).toMatch(/<WordInline text=\{entry\.deep\}/);
    expect(src).toMatch(/<WordInline text=\{entry\.scripture\}/);
  });
  it('Learn: a story and its verse line', () => {
    const src = read('../components/ChurchLearn.jsx');
    expect(src).toMatch(/<WordInline text=\{s\.body\}/);
    expect(src).toMatch(/<WordInline text=\{`— \$\{s\.verse\}`\}/);
  });
  it('LessonFlow (every course and the living lessons): the part blurbs', () => {
    const src = read('../components/LessonFlow.jsx');
    expect(src).toMatch(/<WordInline text=\{s\.blurb\}/);
    expect(src).toMatch(/<WordInline text=\{seg\.blurb\}/);
  });
  it('PracticeLearn: the big idea, the teaching, the explanations, the strands', () => {
    const src = read('../components/PracticeLearn.jsx');
    expect(src).toMatch(/<WordInline text=\{seg\.audience\.bigIdea\}/);
    expect(src).toMatch(/<WordInline key=\{i\} text=\{t\}/);
    expect(src).toMatch(/<WordInline text=\{q\.explain\}/);
    expect(src).toMatch(/<WordInline text=\{strands\.yahweh\.principle\}/);
  });
  it('the Godhead study and the Eternal Algorithms series: every teaching paragraph', () => {
    const src = read('../components/EternalAlgorithmsStudy.jsx');
    for (const f of ['section.plain', 'section.deep', 'entry.outcome', 'entry.threeD', 'entry.psyche', 'pair.bridge', 'study.intro', 'alg.fourD']) {
      expect(src, f).toMatch(new RegExp(`<WordInline text=\\{${f.replace('.', '\\.')}\\}`));
    }
  });
  it('the Scripture Library: cross-references are chips, not spans', () => {
    const src = read('../components/ScriptureLibrary.jsx');
    expect(src).toMatch(/<VerseChips refs=\{clar\.crossRefs\} \/>/);
  });
});
