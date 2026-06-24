// =============================================================================
// ThoughtFinalizer — live render proof (Verification Doctrine: observe the real
// surface, not only the pure logic). Mounts the ACTUAL component in jsdom with
// real reflections and reads the DOM it produces. Auth-free: the surface takes
// `entries` + `onSaveEntry` + `email` as props.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ThoughtFinalizer from '../components/ThoughtFinalizer.jsx';
import { normalizeEntry } from '../lib/study-space.js';
import { applyDistillation } from '../lib/thought-finalizer.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const RESULT = { plain: 'Plain version. Practically, do it.', scripture: 'Exodus 32:19', tags: ['brokenness'], algorithms: [] };

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ThoughtFinalizer, { email: 'darrellpoe06@gmail.com', ...props }));
  });
}
beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ThoughtFinalizer renders the real finalize surface', () => {
  it('shows the deep source verbatim, the needs-a-plain badge, the batch button + count, and the distilled badge', async () => {
    const pending = normalizeEntry({ kind: 'reflection', title: 'Broken tablets', deep: "Darrell's deep source words." });
    const distilled = applyDistillation(normalizeEntry({ kind: 'reflection', title: 'Metanoia', deep: 'Deep metanoia.' }), RESULT);
    await mount({ entries: [pending, distilled], onSaveEntry: () => {} });
    const text = container.textContent;

    expect(text).toContain('Finalize my thoughts');
    expect(text).toContain('1 distilled');                   // honest progress
    expect(text).toContain('1 need a plain version');
    expect(text).toContain("Darrell's deep source words.");  // deep source verbatim
    expect(text).toContain('Needs a plain version');         // pending badge
    expect(text).toContain('Distilled · deep + plain');      // finished badge
    expect(text).toContain('Plain version. Practically, do it.'); // the distilled plain
    const btns = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(btns.some((t) => /Finalize my thoughts/.test(t) && /·\s*1/.test(t))).toBe(true);
  });

  it('a manual plain version saves back WITHOUT touching the deep source', async () => {
    const pending = normalizeEntry({ kind: 'reflection', title: 'Wilderness', deep: 'Original deep.' });
    let saved = null;
    await mount({ entries: [pending], onSaveEntry: (e) => { saved = e; } });
    const area = container.querySelector('textarea');
    expect(area).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(area, 'My own plain version.');
      area.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const saveBtn = [...container.querySelectorAll('button')].find((b) => /Save plain version/.test(b.textContent));
    await act(async () => { saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(saved).toBeTruthy();
    expect(saved.deep).toBe('Original deep.');     // VERBATIM
    expect(saved.plain).toBe('My own plain version.');
    expect(saved.finalization.source).toBe('manual');
  });

  it('empty state when there is nothing to finalize', async () => {
    await mount({ entries: [], onSaveEntry: () => {} });
    expect(container.textContent).toContain('Nothing to finalize yet.');
  });
});
