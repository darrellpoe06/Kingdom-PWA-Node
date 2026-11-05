// @vitest-environment jsdom
// =============================================================================
// Following survives the page re-rendering under it (DR-1327)
// =============================================================================
// Darrell 2026-11-05, from his phone, two messages:
//   "After finding the reader the voice is overreacting... won't follow because
//    of something... it shows this after it finds the text and can't keep going
//    because of this!!!!!! Fix it... the reader !!!!!!"
//   "Also this happens after choosing to go to the text... it wont"
// The screenshot: a paced CHILD-pace lesson at STEP 45 OF 52, the words plainly
// on the screen, and the reader's button reading TEXT — the reader's own word
// for "those words are on another page".
//
// WHAT THIS PINS, and what it measured on main before the fix:
//   1. A re-render replaces the read element's text nodes. Every stored DOM
//      Range detaches and reads `collapsed`, so on main the button flipped to
//      data-state="elsewhere" (the TEXT label) with the words on screen, and
//      the next sentence lit NOTHING. Here the map is re-anchored from the live
//      DOM and following carries on.
//   2. The sentence is re-found BY ITS OWN TEXT, so a re-paced page (steps
//      added ABOVE the one being read — `findSentence`'s `moved`) keeps lighting
//      the sentence being HEARD, not the stale index.
//   3. The TEXT tap is never dead. When the words really are gone and no
//      surface claims the reading, openReadingSource returns false — a value
//      showTheText threw away on main, so the tap did nothing at all. Now the
//      listener is told, in the reader.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const calls = { lit: [], scrolled: [] };
vi.mock('../lib/read-follow.js', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    highlightSegment: (r) => { calls.lit.push(r ? r.toString().trim() : null); },
    followRange: (r, o) => { calls.scrolled.push({ text: r ? r.toString().trim() : null, place: o && o.place }); return true; },
  };
});

const state = { isReading: false, cloudPiece: -1, notice: '' };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    usesNasVoice: false, liteVoice: '', offline: null,
    supported: true, isReading: state.isReading, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: 0, deviceRead: false, setBoundaryHandler: null,
    cloudProgress: 0, cloudPiece: state.cloudPiece, audioVoice: 'audio',
    notice: state.notice, setNotice: (m) => { state.notice = m; }, noticeAction: null,
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

// Four sentences, the way a lesson's paced step reads.
const SENTS = [
  'The fruit of the Spirit is love.',
  'Exhort one another daily while it is called today.',
  'And Jesus increased in wisdom and stature.',
  'The whole lesson closes right here.',
];
// What a paced view adds ABOVE the sentence being read as it advances a step:
// the sentence does not change, its INDEX does.
const EARLIER = ['A step opened before this one.', 'And then another step opened.'];

describe('the reader keeps following when the page re-renders', () => {
  let container, root, main;
  const body = (sents) => `<div id="l999-lesson"><p>${sents.join(' ')}</p></div>`;

  beforeEach(() => {
    calls.lit.length = 0; calls.scrolled.length = 0;
    state.isReading = false; state.cloudPiece = -1; state.notice = '';
    try { localStorage.clear(); } catch { /* ignore */ }
    main = document.createElement('main');
    main.innerHTML = body(SENTS);
    document.body.appendChild(main);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    const { clearReadTarget } = await import('../lib/read-target.js');
    clearReadTarget('l999');
    const { _resetReadingOpenersForTests } = await import('../lib/reading-source.js');
    _resetReadingOpenersForTests();
    act(() => root.unmount());
    container.remove(); main.remove();
  });

  const startReading = async () => {
    const { default: TTSControl } = await import('../components/TTSControl.jsx');
    const { setReadTarget } = await import('../lib/read-target.js');
    const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
    render();
    act(() => { setReadTarget('l999', { label: 'this lesson', text: SENTS.join(' '), elementId: 'l999-lesson' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    state.isReading = true;
    render();
    const hide = [...container.querySelectorAll('button')].find((b) => /Hide reading controls|Close/.test(b.getAttribute('aria-label') || ''));
    if (hide) act(() => { hide.click(); });
    render();
    return render;
  };
  const play = (render, i) => { state.cloudPiece = i; render(); };
  const btn = () => container.querySelector('[data-testid="reader-show-text"]');
  // A React re-render of the read element: new text nodes, same container id.
  // This is what every paced step reveal does, and what detaches every Range.
  const rerender = (render, sents) => {
    document.getElementById('l999-lesson').outerHTML = body(sents);
    render();
  };

  it('a re-render that keeps the words: the button still says Following, and the next sentence is lit', async () => {
    const render = await startReading();
    play(render, 1);
    expect(calls.lit.at(-1)).toBe(SENTS[1]);
    expect(btn().getAttribute('data-state')).toBe('following');

    // The step view re-renders. On main every range is detached from here on.
    rerender(render, SENTS);
    // THE BUTTON. On main this read "elsewhere" (the TEXT label) with the words
    // on the screen — the defect in his screenshot.
    expect(btn().getAttribute('data-state'), 'the words are on this page').toBe('following');
    expect(btn().textContent).toMatch(/Following/);
    // THE VOICE CARRIES ON. On main this lit nothing (a collapsed range).
    play(render, 2);
    expect(calls.lit.at(-1)).toBe(SENTS[2]);
    expect(calls.scrolled.at(-1).text).toBe(SENTS[2]);
  });

  it('a re-paced re-render: the sentence is followed by its own text, not its old index', async () => {
    const render = await startReading();
    play(render, 1);
    expect(calls.lit.at(-1)).toBe(SENTS[1]);

    // Two steps opened above the one being read: every index moved by 2.
    rerender(render, [...EARLIER, ...SENTS]);
    expect(btn().getAttribute('data-state')).toBe('following');
    // The sentence re-found is the one being HEARD. Reading on the stale index
    // would light EARLIER[1] / SENTS[0] instead.
    expect(calls.lit.at(-1)).toBe(SENTS[1]);
    play(render, 2);
    expect(calls.lit.at(-1)).toBe(SENTS[2]);
    play(render, 3);
    expect(calls.lit.at(-1)).toBe(SENTS[3]);
  });

  it('the words really are gone: the button says Text, and the tap is never dead', async () => {
    const render = await startReading();
    play(render, 1);
    expect(btn().getAttribute('data-state')).toBe('following');

    // The lesson leaves the page and nothing registers an opener for it.
    document.getElementById('l999-lesson').remove();
    render();
    expect(btn().getAttribute('data-state')).toBe('elsewhere');
    expect(btn().textContent).toMatch(/Text/);

    // THE TAP. On main openReadingSource returned false and showTheText threw
    // the answer away: no scroll, no highlight, no navigation, no word — a
    // button that did nothing. ("Also this happens after choosing to go to the
    // text... it wont")
    expect(state.notice).toBe('');
    act(() => { btn().click(); });
    render();
    expect(state.notice, 'the tap said nothing at all').not.toBe('');
    // And it is said WHERE HE TAPPED: the reader's panel comes open carrying
    // the line, not a mark somewhere he has to go and find.
    const said = container.querySelector('[data-testid="read-aloud-notice"]');
    expect(said, 'the message was set but never shown').not.toBe(null);
    expect(said.textContent).toMatch(/not on this screen/);
  });

  it('a surface that CAN open the reading is still asked, and then nothing is said', async () => {
    const { registerReadingOpener } = await import('../lib/reading-source.js');
    const asked = [];
    registerReadingOpener(({ owner, sentence }) => { asked.push({ owner, sentence }); return true; });
    const render = await startReading();
    play(render, 1);
    document.getElementById('l999-lesson').remove();
    render();
    act(() => { btn().click(); });
    render();
    expect(asked.length).toBe(1);
    expect(asked[0].owner).toBe('l999');
    expect(asked[0].sentence).toBe(1);
    expect(state.notice, 'the surface opened it — there is nothing to report').toBe('');
  });
});

// =============================================================================
// WHAT THE VOICE SAYS TWICE, MEASURED (DR-1327 — "the voice is overreacting")
// =============================================================================
// The suspicion was the green verse chips: a lesson renders a reference inline
// in its prose AND again as a chip under it, so the voice might say it twice.
// MEASURED against the real buildFollowMap, not assumed (DR-0076 §4):
//   • The green chips add NOTHING to the spoken text. Each chip is a <button>
//     and the lead dash is aria-hidden, both of which SKIP_SELECTOR already
//     excludes, and nothing near them carries data-read-keep. They were left
//     exactly as they are.
//   • "Search it out"'s row of NEXT-LESSON links did repeat it: the title is
//     inside a button (skipped), so only the trailing "— same ground: <ref>"
//     was spoken — the reference the prose had just named, with no lesson
//     attached to it. ChurchLearn now marks that row data-read-skip.
describe('the voice does not say a reference twice', () => {
  it('a green verse chip adds nothing to the spoken text', async () => {
    const { buildFollowMap } = await import('../lib/read-follow.js');
    const { default: VerseChips } = await import('../components/VerseChips.jsx');
    const page = document.createElement('main');
    const host = document.createElement('div');
    page.appendChild(host);
    document.body.appendChild(page);
    const r = createRoot(host);
    const prose = 'Anchor — Galatians 5:22: The fruit of the Spirit is love.';
    await act(async () => r.render(createElement('div', null, [
      createElement('p', { key: 'p' }, prose),
      createElement(VerseChips, { key: 'c', refs: ['Galatians 5:22'], tone: 'word', lead: true, load: async () => ({ text: '', ref: '' }) }),
    ])));
    expect(page.querySelectorAll('button').length, 'the chip is rendered').toBe(1);
    expect(buildFollowMap(page).text).toBe(prose);
    act(() => r.unmount());
    page.remove();
  });

  it('the next-lesson link row is not read: no headless "same ground" repeat', async () => {
    const { buildFollowMap } = await import('../lib/read-follow.js');
    const page = document.createElement('main');
    // The markup ChurchLearn renders for the row (data-read-skip is the fix).
    page.innerHTML = '<p>Growth is measured by fruit, Galatians 5:22.</p>'
      + '<ul data-testid="search-it-out-next" data-read-skip>'
      + '<li data-search-next="ll101"><button type="button">L12 · The Fruit That Stays</button>'
      + '<span> — same ground: Galatians 5:22</span></li></ul>';
    document.body.appendChild(page);
    // Measured on main WITHOUT data-read-skip: the reference was spoken again.
    expect(buildFollowMap(page).text).toBe('Growth is measured by fruit, Galatians 5:22.');
    page.remove();
  });

  it('the row ChurchLearn actually renders carries the skip', () => {
    const src = readFileSync(resolve(__dirname, '../components/ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/data-testid="search-it-out-next" data-read-skip/);
  });
});
