// =============================================================================
// ThoughtFinalizer — live render proof (Verification Doctrine: observe the real
// surface, not only the pure logic). Mounts the ACTUAL component in jsdom with
// real entries and reads the DOM it produces. Auth-free: the surface takes
// `entries` + `onSaveEntry` as props, so no Supabase session is needed.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ThoughtFinalizer from '../components/ThoughtFinalizer.jsx';
import { normalizeEntry } from '../lib/study-space.js';
import { applySuggestion, acceptFinalization } from '../lib/thought-finalizer.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SUGG = {
  fourD: { summary: '4D eternal reading of joy.', scripture: 'Nehemiah 8:10' },
  threeD: { summary: '3D practical reading.' },
  outcome: 'A strength that does not flicker.',
};

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ThoughtFinalizer, props));
  });
}
beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ThoughtFinalizer renders the real finalize surface', () => {
  it('shows the owner words verbatim, the batch button with the pending count, and the teaching-ready badge', async () => {
    const pending = normalizeEntry({ title: 'Joy is the strength', deep: "Darrell's own deep words.", plain: 'His plain words.' });
    const ready = acceptFinalization(applySuggestion(normalizeEntry({ title: 'The table', plain: 'Set before me.' }), SUGG), '2026-06-24T00:00:00.000Z');
    await mount({ entries: [pending, ready], onSaveEntry: () => {} });
    const text = container.textContent;

    expect(text).toContain('Finalize my thoughts');
    expect(text).toContain('1 teaching-ready');         // honest progress roll-up
    expect(text).toContain("Darrell's own deep words."); // the owner words, verbatim
    expect(text).toContain('His plain words.');
    expect(text).toContain('Teaching-ready');            // the accepted badge
    expect(text).toContain('A strength that does not flicker.'); // the accepted outcome
    // The batch button carries the pending count (1 unfinalized).
    const btns = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(btns.some((t) => /Finalize my thoughts/.test(t) && /·\s*1/.test(t))).toBe(true);
  });

  it('Accept writes back through onSaveEntry WITHOUT mutating the owner words (faithful through the DOM)', async () => {
    // A suggestion already attached, all parts present -> Accept is enabled.
    const suggested = applySuggestion(normalizeEntry({ title: 'Wilderness', deep: 'Original deep.', plain: 'Original plain.' }), SUGG);
    let saved = null;
    await mount({ entries: [suggested], onSaveEntry: (e) => { saved = e; } });

    const acceptBtn = [...container.querySelectorAll('button')].find((b) => /Accept/.test(b.textContent));
    expect(acceptBtn).toBeTruthy();
    await act(async () => { acceptBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

    expect(saved).toBeTruthy();
    expect(saved.finalization.status).toBe('accepted');
    // The owner words are byte-for-byte unchanged.
    expect(saved.deep).toBe('Original deep.');
    expect(saved.plain).toBe('Original plain.');
    expect(saved.title).toBe('Wilderness');
    expect(saved.finalization.outcome).toBe('A strength that does not flicker.');
  });

  it('empty state when there is nothing to finalize', async () => {
    await mount({ entries: [], onSaveEntry: () => {} });
    expect(container.textContent).toContain('No thoughts to finalize yet.');
  });
});
