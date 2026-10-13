// @vitest-environment jsdom
// THE READER READS THE WORD THE SWITCH HAS OPENED; IT NEVER OPENS IT ITSELF.
// =============================================================================
// Darrell 2026-09-15, after L151: "the reader currently reads the Word drop
// down even when it says to not read the Word which shouldn't read when that
// is the requested because it gives us all options and it stops the reader
// from re-reading the Word back to back because most of it is in the lesson
// for each paragraph... also keep the reader reading the Word already inside
// the lessons."
//
// THE MECHANISM (traced, not assumed): before a read, revealForReading clicks
// every `[aria-expanded="false"]` inside the reading root that is not a menu,
// a tab, or marked `[data-read-no-expand]`. A verse chip is a button with
// aria-expanded, so the reveal opened every verse on the page and the reader
// spoke each one — with the Show-the-Word switch OFF, and right after the
// same verse had just been read verbatim inside the lesson prose.
//
// THE RULE (DR-0417): a verse chip is not a disclosure of the lesson; it is the
// Show-the-Word choice. The reader reads what is on the screen — the prose
// (quoted verses included), plus every verse the switch or a tap has opened —
// and never opens a verse on its own. Switch on: the Word is open and is read.
// Switch off: it stays closed and is not read. Both options, the listener's.
//
// Proven-to-catch (DR-0076 §3): with `data-read-no-expand` removed from the
// two chips, the first two tests FAIL (the reveal reports one button opened
// and a verse region appears with the switch off).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import WordInline from '../components/WordInline.jsx';
import VerseChips from '../components/VerseChips.jsx';
import { revealForReading } from '../lib/read-reveal.js';
import { buildFollowMap } from '../lib/read-follow.js';
import { setShowTheWord, __resetShowTheWord } from '../lib/show-the-word.js';

const VERSE = 'Charity suffereth long, and is kind; charity envieth not;';
const load = async () => VERSE;
const PROSE = 'Love is patient, as 1 Corinthians 13:4 says, and it is kind.';

let host; let root;
beforeEach(() => {
  __resetShowTheWord();
  host = document.createElement('main');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); __resetShowTheWord(); });

const settle = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };

describe('with Show the Word OFF, the reader leaves the Word closed', () => {
  it('a reveal pass opens no verse chip in prose (WordInline)', async () => {
    await act(async () => { root.render(createElement(WordInline, { text: PROSE, load })); });
    const chip = host.querySelector('button[aria-expanded]');
    expect(chip).not.toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(chip.hasAttribute('data-read-no-expand')).toBe(true);
    let opened;
    await act(async () => { opened = revealForReading(host); });
    await settle();
    expect(opened.buttons).toBe(0);
    expect(host.querySelector('[role="region"]')).toBeNull();
    // What the listener hears is the lesson's own sentence — the reference
    // stays in the prose, the verse text does not appear.
    const follow = buildFollowMap(host);
    expect(follow.text).toContain('1 Corinthians 13:4');
    expect(follow.text).not.toContain(VERSE);
  });

  it('a reveal pass opens no chip in a reference strip (VerseChips)', async () => {
    await act(async () => { root.render(createElement(VerseChips, { refs: ['1 Corinthians 13:4'], load })); });
    const chip = host.querySelector('button[aria-expanded]');
    expect(chip.hasAttribute('data-read-no-expand')).toBe(true);
    let opened;
    await act(async () => { opened = revealForReading(host); });
    await settle();
    expect(opened.buttons).toBe(0);
    expect(host.querySelector('[role="region"]')).toBeNull();
  });

  it('a plain disclosure beside the chip is still opened — the feature is not disarmed', async () => {
    await act(async () => { root.render(createElement(WordInline, { text: PROSE, load })); });
    const more = document.createElement('button');
    more.setAttribute('aria-expanded', 'false');
    more.textContent = 'More';
    let clicks = 0;
    more.addEventListener('click', () => { clicks += 1; more.setAttribute('aria-expanded', 'true'); });
    host.appendChild(more);
    let opened;
    await act(async () => { opened = revealForReading(host); });
    expect(opened.buttons).toBe(1);
    expect(clicks).toBe(1);
    expect(host.querySelector('[role="region"]')).toBeNull();
  });
});

describe('with Show the Word ON, the open Word is read', () => {
  it('the verse the switch opened is on the screen and in the reading', async () => {
    await act(async () => { root.render(createElement(WordInline, { text: PROSE, load })); });
    await act(async () => { setShowTheWord(true); });
    await settle();
    const region = host.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region.textContent).toContain(VERSE);
    // A reveal pass has nothing to do here either: the switch already decided.
    let opened;
    await act(async () => { opened = revealForReading(host); });
    expect(opened.buttons).toBe(0);
    const follow = buildFollowMap(host);
    expect(follow.text).toContain(VERSE);
  });
});
