// @vitest-environment jsdom
// =============================================================================
// Next goes to the next paragraph, Back to the one before, and one reading owns
// the voice (DR-0756)
// =============================================================================
// Darrell 2026-10-06, from his phone, a lesson open with READ ALOUD and the
// voice on "My voice (Darrell) · AI (stand-in)" — the NAS piece path, not the
// phone's own voice — with the whole lesson on the device ("169 of 169 pieces ·
// 3.2 MB"):
//   1. "The reader does not go to the next section or paragraph... it goes to
//      the beginning of the lessons."
//   2. "it gets garbled words at times even with the storage increase for
//      cache."
//
// Three causes, measured before anything was changed:
//
//   A. paragraphStarts resolved each sentence to its nearest ancestor in a
//      narrow tag whitelist (P, LI, H1-6, BLOCKQUOTE, TD, TH, DT, DD,
//      FIGCAPTION, PRE). A lesson whose prose renders in DIVs — most of this
//      app — has every sentence walk past them and land on the one element the
//      whole lesson is wrapped in, so the starts list came back [0]: Forward
//      answered null (nothing moved) and Back answered starts[0], SEGMENT 0,
//      the top of the lesson. Both halves of his first sentence, from one line.
//
//   B. The absolute place was `base + local`, where `local` was read live from
//      whichever counter the current mode pointed at. A jump sets the new base
//      at once while that counter still holds the old run's position, so the
//      jump AFTER a jump was computed from a place the voice was never at.
//
//   C. A read is asynchronous for seconds before it plays a note, and a second
//      read started inside that window found nothing to stop — the first had
//      not installed its queue yet. Both then drove the ONE shared <audio>
//      element, and the superseded one put its piece on it mid-sentence.
//
// Proven-to-catch, each run against the code as it was:
//   A → starts [0]; Forward null; Back 0.
//   B → reading at sentence 3, Forward landed on paragraph 3 and Back then went
//       FORWARD to paragraph 4.
//   C → the element took "Bravo one…" and then "Alpha one…", the new reading
//       cut off part-way and replaced by a sentence from where the listener is
//       no longer.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildFollowMap, paragraphStarts, paragraphJumpTarget } from '../lib/read-follow.js';

// --- A. a lesson whose prose is in DIVs is still a lesson with paragraphs ----
describe('the paragraph grid comes from the follow map itself', () => {
  const mount = (html) => {
    const root = document.createElement('li'); // ChurchLearn wraps a lesson in <li>
    root.id = 'learn-lesson-dr756';
    root.innerHTML = html;
    document.body.appendChild(root);
    return root;
  };

  it('prose in DIVs has real paragraphs — Forward moves, Back does NOT restart the lesson', () => {
    const root = mount([
      '<div>The big idea opens here. It says a thing.</div>',
      '<div>A second movement follows. It also says a thing.</div>',
      '<div>A third closes it. The end.</div>',
    ].join(''));
    const follow = buildFollowMap(root);
    const starts = paragraphStarts(follow);
    expect(follow.segments.length).toBe(6);
    expect(starts, 'a DIV-rendered lesson read as ONE paragraph').toEqual([0, 2, 4]);
    // Reading the second sentence of the second paragraph:
    expect(paragraphJumpTarget(starts, 3, 1), 'Forward had nowhere to go').toBe(4);
    expect(paragraphJumpTarget(starts, 3, -1), 'Back jumped to the top of the lesson').toBe(2);
    root.remove();
  });

  it('headings, paragraphs and list items each open their own paragraph', () => {
    const root = mount([
      '<div class="head">The big idea</div><p>The first paragraph opens. It says two things.</p>',
      '<div class="head">What this frees in you</div><ul><li>Freedom from fear.</li><li>Peace in the storm.</li></ul>',
      '<p>The closing paragraph. It is the end.</p>',
    ].join(''));
    const follow = buildFollowMap(root);
    expect(paragraphStarts(follow)).toEqual([0, 1, 3, 4, 5, 6]);
    root.remove();
  });

  it('the grid is positions, not live nodes — it survives the lesson re-rendering under it', () => {
    const html = '<div>One sentence. Two sentence.</div><div>Three sentence.</div><div>Four sentence.</div>';
    const root = mount(html);
    const follow = buildFollowMap(root);
    const before = paragraphStarts(follow);
    root.innerHTML = html; // React replaces the text nodes the map was built from
    expect(paragraphStarts(follow)).toEqual(before);
    expect(before).toEqual([0, 2, 3]);
    root.remove();
  });

  it('a follow map built by hand (no block grid) still groups by its blocks', () => {
    const root = mount('<p>One sentence. Two sentence.</p><p>Three sentence.</p><ul><li>Four sentence.</li></ul>');
    const follow = buildFollowMap(root);
    const { blocks, ...noGrid } = follow;
    expect(blocks.length).toBeGreaterThan(0);
    expect(paragraphStarts(noGrid)).toEqual([0, 2, 3]);
    root.remove();
  });
});

// --- B. the step after a step ------------------------------------------------
const readSpy = vi.fn();
const hook = { skip: null };
const state = { isReading: false, deviceRead: true, cloudPiece: -1, segmentIndex: 0 };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: state.segmentIndex, deviceRead: state.deviceRead,
    setBoundaryHandler: null, cloudProgress: 0, cloudPiece: state.cloudPiece,
    setSkipHandlers: (h) => { hook.skip = h; },
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'lesson-dr756';
const PARAS = [
  'The first paragraph opens the lesson. It says two things.',
  'The second paragraph teaches the middle. It has its own words.',
  'The third paragraph closes the lesson. It is the end.',
  'The fourth paragraph adds a coda. It also ends.',
];

describe('the step after a step lands where the voice actually is', () => {
  let container; let root; let lessonEl;
  beforeEach(() => {
    readSpy.mockClear(); hook.skip = null;
    state.isReading = false; state.deviceRead = true; state.cloudPiece = -1; state.segmentIndex = 0;
    try { localStorage.clear(); } catch { /* ignore */ }
    lessonEl = document.createElement('main');
    lessonEl.innerHTML = `<li id="lesson-el">${PARAS.map((p) => `<p>${p}</p>`).join('')}</li>`;
    document.body.appendChild(lessonEl);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove(); lessonEl.remove();
    try { clearReadTarget(OWNER); } catch { /* ignore */ }
  });

  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 300)); });
  const spoken = () => String((readSpy.mock.calls.at(-1) || [''])[0]);

  it('in the NAS voice: Next moves one paragraph, and Back then moves ONE back — never forward', async () => {
    act(() => root.render(createElement(TTSControl, { view: 'church' })));
    act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-el' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    await settle();
    expect(spoken()).toMatch(/^The first paragraph/);

    // The NAS voice is playing its fourth piece — segment 3, the second
    // sentence of paragraph 2. deviceRead is false while a clip plays.
    state.isReading = true; state.deviceRead = false; state.cloudPiece = 3;
    act(() => root.render(createElement(TTSControl, { view: 'church' })));
    await settle();

    readSpy.mockClear();
    act(() => { hook.skip.next(); });
    expect(spoken(), 'Next did not reach the third paragraph').toMatch(/^The third paragraph/);

    readSpy.mockClear();
    act(() => { hook.skip.prev(); });
    expect(spoken(), 'Back after Next moved FORWARD instead of back').toMatch(/^The second paragraph/);
  });
});
