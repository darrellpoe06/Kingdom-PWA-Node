// =============================================================================
// read-follow — the highlight-as-it-reads contract (DR-0264, proven-to-catch)
// =============================================================================
// Darrell 2026-08-03: readers "could be 6 or 60 years old... highlighted as it
// reads so users can see their place and the screen should move with the
// location of the words." These pins hold the alignment law: the engine's
// sentence N and the DOM range N are THE SAME SENTENCE by construction,
// because buildFollowMap normalizes with the same collapse and segments with
// segmentText itself.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildFollowMap, segmentRange, wordRange, supportsHighlight,
  highlightSegment, highlightWord, clearReadingHighlights, followRange, scrollContainerFor, stickyTopInset,
  segmentIndexAtDomPoint, alignSegments, segmentIndexAtFraction,
  SEGMENT_HIGHLIGHT, WORD_HIGHLIGHT,
} from '../lib/read-follow.js';
import { segmentText, createBrowserTTS } from '../lib/tts.js';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

function pageRoot() {
  const root = document.createElement('main');
  root.innerHTML = `
    <h2>The   Perfect You Were Made For.</h2>
    <p>Two famous verses say <strong>be perfect</strong>. Both words mean whole!</p>
    <div class="tts-controls"><button>Play this never reads</button></div>
    <div aria-hidden="true">decoration text never reads</div>
    <p>You were made to be whole.</p>
  `;
  document.body.appendChild(root);
  return root;
}

describe('buildFollowMap — alignment by construction', () => {
  it('normalized text segments EXACTLY as the engine will segment it, ranges included', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    expect(follow).toBeTruthy();
    // The engine will run segmentText over the same text we hand read() — the
    // segment lists must be identical, index for index.
    const engineSegs = segmentText(follow.text);
    expect(follow.segments.map((s) => s && s.text)).toEqual(engineSegs);
    expect(follow.segments.length).toBeGreaterThanOrEqual(3);
    root.remove();
  });

  it('CATCHES chrome leakage — control-panel and aria-hidden text never enter the read', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    expect(follow.text).not.toContain('never reads');
    root.remove();
  });

  it('segmentRange N covers the exact on-screen sentence N (across nested elements)', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    const r0 = segmentRange(follow, 0);
    expect(norm(r0.toString())).toBe(follow.segments[0].text);
    // The sentence containing the <strong> spans elements — the range still covers it whole.
    const idx = follow.segments.findIndex((s) => s && /be perfect/.test(s.text));
    expect(idx).toBeGreaterThan(-1);
    expect(norm(segmentRange(follow, idx).toString())).toBe(follow.segments[idx].text);
    root.remove();
  });

  it('wordRange maps a boundary charIndex to the single spoken word', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    const seg0 = follow.segments[0].text; // "The Perfect You Were Made For."
    const at = seg0.indexOf('Perfect');
    const r = wordRange(follow, 0, at);
    expect(norm(r.toString())).toBe('Perfect');
    root.remove();
  });
});

describe('the DR-0265 bridges — tap-to-start, lesson alignment, cloud fraction', () => {
  it('segmentIndexAtDomPoint resolves a tapped character to its sentence', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    // Tap inside the second paragraph's <strong> ("be perfect").
    const strong = root.querySelector('strong').firstChild;
    const idx = segmentIndexAtDomPoint(follow, strong, 1);
    expect(idx).toBeGreaterThan(-1);
    expect(follow.segments[idx].text).toMatch(/be perfect/);
    // An unknown node is honestly unresolvable.
    expect(segmentIndexAtDomPoint(follow, document.createTextNode('x'), 0)).toBe(-1);
    root.remove();
  });

  it('alignSegments highlights what IS rendered and returns null for spoken-but-unrendered passages', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    const spoken = [
      'The Perfect You Were Made For.',
      'This paced step is not rendered anywhere on the card.',
      'You were made to be whole.',
    ];
    const ranges = alignSegments(follow, spoken);
    expect(ranges[0]).toBeTruthy();
    expect(norm(ranges[0].toString())).toBe(spoken[0]);
    expect(ranges[1]).toBeNull(); // honest gap — no highlight, never a wrong one
    expect(ranges[2]).toBeTruthy();
    root.remove();
  });

  it('segmentIndexAtFraction maps playback fraction to the sentence by character weight', () => {
    const lens = [10, 30, 60]; // total 100
    expect(segmentIndexAtFraction(lens, 0)).toBe(0);
    expect(segmentIndexAtFraction(lens, 0.05)).toBe(0);
    expect(segmentIndexAtFraction(lens, 0.2)).toBe(1);
    expect(segmentIndexAtFraction(lens, 0.9)).toBe(2);
    expect(segmentIndexAtFraction(lens, 1)).toBe(2);
    expect(segmentIndexAtFraction([], 0.5)).toBe(-1); // nothing to follow
  });
});

describe('highlight + follow are unbreakable where the platform lacks the APIs', () => {
  it('jsdom has no CSS Custom Highlight API — helpers no-op instead of crashing', () => {
    expect(supportsHighlight()).toBe(false);
    expect(highlightSegment(null)).toBe(false);
    expect(() => clearReadingHighlights()).not.toThrow();
  });

  // PROVEN-TO-CATCH (DR-0076 §3). The test above passes for the WRONG reason on a
  // device with the API: it only ever exercised the unsupported branch, so the
  // highlight never painted on any real browser and no gate said so — the words
  // read aloud but nothing lit up (reported 2026-08-06). These pins stand the
  // real platform up in jsdom and assert the call shape the app actually makes:
  // highlightSegment(range) with NO explicit window. Reverting the `win` default
  // in setNamed turns both of these red.
  describe('on a browser that HAS the API, the app call shape actually paints', () => {
    class FakeHighlight { constructor(r) { this.range = r; } }
    let store;
    beforeEach(() => {
      store = new Map();
      window.Highlight = FakeHighlight;
      window.CSS = { ...(window.CSS || {}), highlights: store };
    });
    afterEach(() => { delete window.Highlight; delete window.CSS; });

    it('highlightSegment(range) registers the sentence highlight — no window argument', () => {
      const root = pageRoot();
      const follow = buildFollowMap(root);
      expect(highlightSegment(segmentRange(follow, 0))).toBe(true);
      expect(store.get(SEGMENT_HIGHLIGHT)).toBeInstanceOf(FakeHighlight);
      root.remove();
    });

    it('highlightWord(range) paints the word, and highlightWord(null) clears it', () => {
      const root = pageRoot();
      const follow = buildFollowMap(root);
      const at = follow.segments[0].text.indexOf('Perfect');
      expect(highlightWord(wordRange(follow, 0, at))).toBe(true);
      expect(store.has(WORD_HIGHLIGHT)).toBe(true);
      expect(highlightWord(null)).toBe(true);   // the per-sentence clear TTSControl makes
      expect(store.has(WORD_HIGHLIGHT)).toBe(false);
      root.remove();
    });

    it('clearReadingHighlights() removes both roles when reading stops', () => {
      const root = pageRoot();
      const follow = buildFollowMap(root);
      highlightSegment(segmentRange(follow, 0));
      highlightWord(wordRange(follow, 0, 0));
      clearReadingHighlights();
      expect(store.size).toBe(0);
      root.remove();
    });
  });

  it('followRange centers the range\'s element via scrollIntoView', () => {
    const root = pageRoot();
    const follow = buildFollowMap(root);
    const r = segmentRange(follow, 0);
    const el = r.startContainer.parentElement;
    el.scrollIntoView = vi.fn();
    followRange(r);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    root.remove();
  });
});

describe('the engine reports WORD boundaries per segment (the karaoke enhancement)', () => {
  class FakeUtterance { constructor(text) { this.text = text; } }
  it('u.onboundary routes (segmentIndex, charIndex) to engine.onBoundary; other boundary kinds are ignored', () => {
    const spoken = [];
    const synth = { speak: (u) => spoken.push(u), cancel: () => {}, resume: () => {} };
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {}, prefs: {} });
    const hits = [];
    engine.onBoundary = (seg, charIndex) => hits.push([seg, charIndex]);
    engine.load('One sentence here. And a second one.');
    engine.play();
    expect(spoken.length).toBe(1);
    spoken[0].onboundary({ name: 'word', charIndex: 4 });
    spoken[0].onboundary({ name: 'sentence', charIndex: 0 }); // ignored
    spoken[0].onend();
    expect(spoken.length).toBe(2); // second segment speaking
    spoken[1].onboundary({ name: 'word', charIndex: 6 });
    expect(hits).toEqual([[0, 4], [1, 6]]);
  });
});

// =============================================================================
// THE WORDS ARE INSIDE A SCROLLING CONTAINER — the presenter's full-screen
// overlay panel and the console's slide mirror. Darrell 2026-09-06: "the scroll
// ... as the TTS reads is not working on the presentations". followRange
// computed a viewport delta and called window.scrollBy — which does not move
// the panel inside a `position: fixed; inset: 0` overlay, nor a box's own
// overflow. The tests above passed because jsdom has no layout: the range has
// no box, so the OLD scrollIntoView fallback (which does reach nested
// scrollers) ran, and the real-browser path was never exercised. These pins
// give the range a box, so the real path runs.
// =============================================================================
describe('followRange inside a scrolling container moves THAT container, not the window', () => {
  const rect = (top, bottom, extra = {}) => ({ top, bottom, height: bottom - top, width: 200, left: 0, right: 200, ...extra });
  let box; let p; let winScroll;
  beforeEach(() => {
    box = document.createElement('div');
    box.style.overflowY = 'auto';
    p = document.createElement('p');
    p.textContent = 'Perfect love casteth out fear. Fear hath torment. He that feareth is not made perfect in love.';
    box.appendChild(p);
    document.body.appendChild(box);
    winScroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
  });
  afterEach(() => { box.remove(); winScroll.mockRestore(); });

  it('scrollContainerFor finds the nearest overflow-y auto/scroll ancestor and never body or html', () => {
    expect(scrollContainerFor(p)).toBe(box);
    const loose = document.createElement('p');
    document.body.appendChild(loose);
    document.body.style.overflowY = 'auto'; // the page's own scroller is the window's business
    expect(scrollContainerFor(loose)).toBeNull();
    document.body.style.overflowY = '';
    loose.remove();
  });

  it('a followed sentence below the container’s fold scrolls the container by the reading delta; the window is untouched', () => {
    const follow = buildFollowMap(box);
    const r = segmentRange(follow, 2);
    r.getBoundingClientRect = () => rect(450, 480);       // the sentence, in viewport coords
    box.getBoundingClientRect = () => rect(100, 300);     // the panel: 200px tall, starting at y=100
    box.scrollBy = vi.fn();
    followRange(r);
    expect(box.scrollBy).toHaveBeenCalledTimes(1);
    const { top, behavior } = box.scrollBy.mock.calls[0][0];
    // sentence bottom relative to the panel = 380; readable bottom = 200 - 24 margin = 176
    expect(top).toBe(380 - 176);
    expect(['smooth', 'auto', 'instant']).toContain(behavior);
    expect(winScroll, 'window.scrollBy cannot move a fixed overlay’s panel').not.toHaveBeenCalled();
  });

  it('a sentence already inside the container’s reading band does not move it (no twitch)', () => {
    const follow = buildFollowMap(box);
    const r = segmentRange(follow, 0);
    r.getBoundingClientRect = () => rect(150, 180);
    box.getBoundingClientRect = () => rect(100, 300);
    box.scrollBy = vi.fn();
    followRange(r);
    expect(box.scrollBy).not.toHaveBeenCalled();
    expect(winScroll).not.toHaveBeenCalled();
  });

  it('PROVEN-TO-CATCH — with no scrolling ancestor the window path still runs (the page case is unchanged)', () => {
    const loose = document.createElement('p');
    loose.textContent = 'Perfect love casteth out fear.';
    document.body.appendChild(loose);
    const follow = buildFollowMap(loose);
    const r = segmentRange(follow, 0);
    r.getBoundingClientRect = () => rect(2000, 2030);
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    followRange(r);
    expect(winScroll).toHaveBeenCalledTimes(1);
    expect(winScroll.mock.calls[0][0].top).toBeGreaterThan(0);
    loose.remove();
  });
});

// The presenter's full-screen mode is a `position: fixed; inset: 0` overlay.
// stickyTopInset probes the top edge for fixed/sticky elements and took the
// overlay itself as "top chrome" — inset = min(overlay bottom, 45% of the
// viewport) — so every followed sentence was pushed into the lower half.
describe('stickyTopInset — a full-viewport fixed overlay is a surface, not a bar', () => {
  const fixedEl = (top, bottom) => {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.getBoundingClientRect = () => ({ top, bottom, height: bottom - top, width: 400, left: 0, right: 400 });
    return el;
  };
  let probe;
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    probe = vi.fn();
    document.elementsFromPoint = probe;
  });
  afterEach(() => { delete document.elementsFromPoint; });

  it('an overlay covering the viewport contributes NO inset', () => {
    const overlay = fixedEl(0, 800);
    probe.mockReturnValue([overlay]);
    expect(stickyTopInset()).toBe(0);
  });

  it('a real 56px bar pinned at the top still counts — the guard is not a blanket', () => {
    const bar = fixedEl(0, 56);
    probe.mockReturnValue([bar]);
    expect(stickyTopInset()).toBe(56);
  });

  it('PROVEN-TO-CATCH — the overlay alone, before the guard, would have read as 45% of the screen', () => {
    // 800 * 0.45 = 360: the value the old code returned for a full-screen overlay.
    const overlay = fixedEl(0, 800);
    probe.mockReturnValue([overlay]);
    expect(stickyTopInset()).not.toBe(360);
  });
});

