// =============================================================================
// ThoughtFinalizer — live render proof of the promote gate (observe the surface).
// Mounts the REAL component in jsdom and asserts the UI gate that keeps rough
// drafts out of the finished gallery:
//   • a DRAFT (suggested, not accepted) shows NO promote button — it stays in
//     the workshop.
//   • a FINALIZED (accepted, teaching-ready) thought shows Promote; clicking it
//     writes a real entry into the Eternal Algorithms device-local library and
//     the button flips to "Update".
// Auth-free: ThoughtFinalizer takes entries + email as props.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ThoughtFinalizer from '../components/ThoughtFinalizer.jsx';
import { normalizeEntry } from '../lib/study-space.js';
import { applySuggestion, acceptFinalization } from '../lib/thought-finalizer.js';
import { loadLibrary, findBySource } from '../lib/eternal-algorithms.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const EMAIL = 'darrellpoe06@gmail.com';
const SUGG = { fourD: { summary: '4d reading', scripture: 'Genesis 50:20' }, threeD: { summary: '3d practice' }, outcome: 'growth' };

const readyThought = acceptFinalization(
  applySuggestion(normalizeEntry({ id: 't-ready', title: 'Build by Resistance', deep: 'd', plain: 'p' }, 0, 0), SUGG, { source: 'local' }),
  '2026-06-25T00:00:00.000Z',
);
const draftThought = applySuggestion(
  normalizeEntry({ id: 't-draft', title: 'Half a Thought', deep: 'd', plain: 'p' }, 0, 1), SUGG, { source: 'local' },
); // suggested, NOT accepted -> a draft

let container, root;
async function mount(entries) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ThoughtFinalizer, { entries, email: EMAIL, onSaveEntry: () => {} }));
  });
}
function findButton(text) {
  return [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text)) || null;
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ThoughtFinalizer promote gate (live)', () => {
  it('a draft shows NO promote button; a finalized thought does', async () => {
    await mount([draftThought, readyThought]);
    // Exactly one promote control — for the teaching-ready thought only.
    const promoteButtons = [...container.querySelectorAll('button')].filter((b) => /Promote to Eternal Algorithms/.test(b.textContent));
    expect(promoteButtons.length).toBe(1);
    expect(container.textContent).toContain('Build by Resistance'); // the ready one
    expect(container.textContent).toContain('Half a Thought');      // the draft is shown (in the workshop)
  });

  it('promoting writes a real entry into the library and flips to Update', async () => {
    await mount([readyThought]);
    expect(findBySource(loadLibrary(EMAIL).entries, 't-ready')).toBeFalsy(); // not yet

    await act(async () => { findButton('Promote to Eternal Algorithms').dispatchEvent(new Event('click', { bubbles: true })); });

    const promoted = findBySource(loadLibrary(EMAIL).entries, 't-ready');
    expect(promoted).toBeTruthy();
    expect(promoted.name).toBe('Build by Resistance');
    expect(promoted.outcome).toBe('growth');
    expect(promoted.source).toBe('study');
    // The button now offers Update (idempotent re-promote), and the card says so.
    expect(findButton('Update in Eternal Algorithms')).toBeTruthy();
    expect(container.textContent).toContain('In the Eternal Algorithms library');
  });
});
