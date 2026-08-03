// =============================================================================
// read-follow — the highlight-as-it-reads contract (DR-0264, proven-to-catch)
// =============================================================================
// Darrell 2026-08-03: readers "could be 6 or 60 years old... highlighted as it
// reads so users can see their place and the screen should move with the
// location of the words." These pins hold the alignment law: the engine's
// sentence N and the DOM range N are THE SAME SENTENCE by construction,
// because buildFollowMap normalizes with the same collapse and segments with
// segmentText itself.
import { describe, it, expect, vi } from 'vitest';
import {
  buildFollowMap, segmentRange, wordRange, supportsHighlight,
  highlightSegment, clearReadingHighlights, followRange,
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

describe('highlight + follow are unbreakable where the platform lacks the APIs', () => {
  it('jsdom has no CSS Custom Highlight API — helpers no-op instead of crashing', () => {
    expect(supportsHighlight()).toBe(false);
    expect(highlightSegment(null)).toBe(false);
    expect(() => clearReadingHighlights()).not.toThrow();
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
