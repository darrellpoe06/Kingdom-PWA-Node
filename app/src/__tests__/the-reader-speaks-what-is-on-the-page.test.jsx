// @vitest-environment jsdom
// =============================================================================
// THE READER SPEAKS WHAT IS ON THE PAGE — the component half of the 2026-10-09 fix
// =============================================================================
// Darrell, 2026-10-09, from the lesson reader: "reading something totally
// different from what's on the page... fix it..."
//
// `preferText` (DR-0722) asks the reader to speak the text a surface REGISTERED
// rather than the text it renders, so a downloaded lesson's saved voice clips —
// which are keyed on that registered text — play with no connection. It was
// honoured unconditionally. When the registered reading is not this element's
// reading, that is a voice saying words the listener cannot see, with the
// highlight hunting for them across every other lesson card on the page.
//
// THE LAW PINNED HERE, through the real TTSControl and the real read-target
// registry: preferText is honoured when the registered text IS located in the
// element, and OVERRULED by the page when it is not. The reader never speaks a
// reading this screen does not show.
//
// PROVEN-TO-CATCH (DR-0076 §3): the second case fails against the code as it
// stood this morning — it spoke the registered text whatever the page said.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, useEffect } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget } from '../lib/read-target.js';
import { buildFollowMap } from '../lib/read-follow.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const readSpy = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {},
    claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

const OWNER = 'll999-the-page-you-are-looking-at';
// The element renders a HEADING as well as the reading, so the mapped text and
// the registered reading are different strings while every registered sentence
// is still located in the element. Without that difference the first case below
// cannot tell the two paths apart, and a case that cannot fail is not a case.
const HEADING = 'Lesson nine.';
const ON_SCREEN = 'Wisdom builds the house. Understanding establishes it.';
const NOT_ON_SCREEN = 'A hurricane is named for the day it lands. Nobody on this page said that.';

/** A surface that renders ON_SCREEN and registers whatever reading it is told to. */
function Surface({ text, preferText }) {
  useEffect(() => {
    setReadTarget(OWNER, { label: 'this lesson', title: 'The page you are looking at', text, preferText, elementId: `learn-read-${OWNER}` });
    return () => clearReadTarget(OWNER);
  }, [text, preferText]);
  return createElement('div', { id: `learn-read-${OWNER}` },
    createElement('h3', null, HEADING),
    createElement('p', null, ON_SCREEN));
}

let pageBox, pageRoot, panelBox, panelRoot;
beforeEach(() => {
  window.localStorage.clear();
  readSpy.mockClear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  pageBox = document.createElement('main');     // the reader looks for <main>
  document.body.appendChild(pageBox);
  pageRoot = createRoot(pageBox);
  panelBox = document.createElement('div');
  document.body.appendChild(panelBox);
  panelRoot = createRoot(panelBox);
});
afterEach(() => {
  act(() => { pageRoot.unmount(); panelRoot.unmount(); });
  pageBox.remove(); panelBox.remove();
  window.localStorage.clear();
});

async function readIt({ text, preferText }) {
  act(() => pageRoot.render(createElement(Surface, { text, preferText })));
  act(() => panelRoot.render(createElement(TTSControl, { view: 'church' })));
  act(() => { panelBox.querySelector('button[aria-label="Open read-aloud controls"]').click(); });
  const btn = [...panelBox.querySelectorAll('button')].find((b) => /start to finish/.test(b.textContent));
  expect(btn, 'the reader never offered to read this lesson').toBeTruthy();
  await act(async () => { btn.click(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
  expect(readSpy, 'nothing was read at all').toHaveBeenCalled();
  return readSpy.mock.calls[0][0];
}

describe('preferText is honoured when the reading IS on the page', () => {
  it('a saved reading that this element renders is spoken as registered, so the saved clips play (DR-0722)', async () => {
    const spoken = await readIt({ text: ON_SCREEN, preferText: true });
    expect(spoken).toBe(ON_SCREEN);
    // And it is NOT the mapped text, which carries the heading — this is what
    // separates the honoured path from the mapped one.
    const rendered = buildFollowMap(document.getElementById(`learn-read-${OWNER}`)).text;
    expect(rendered).toContain(HEADING);
    expect(spoken, 'preferText was ignored and the page was read instead').not.toBe(rendered);
  });
});

describe('PROVEN-TO-CATCH: preferText is OVERRULED by the page when the reading is not on it', () => {
  it('a reading nowhere in this element is not spoken — the page is', async () => {
    const spoken = await readIt({ text: NOT_ON_SCREEN, preferText: true });
    expect(spoken, 'the reader spoke words that are not on this screen').not.toBe(NOT_ON_SCREEN);
    expect(spoken).not.toContain('hurricane');
    // What it reads instead is this element's own text, mapped — which is what
    // every other read on this surface already does.
    const rendered = buildFollowMap(document.getElementById(`learn-read-${OWNER}`)).text;
    expect(spoken).toBe(rendered);
    expect(spoken).toContain('Wisdom builds the house');
  });

  it('and with preferText off, nothing changed: the mapped text is read as always', async () => {
    const spoken = await readIt({ text: ON_SCREEN, preferText: false });
    const rendered = buildFollowMap(document.getElementById(`learn-read-${OWNER}`)).text;
    expect(spoken).toBe(rendered);
  });
});
