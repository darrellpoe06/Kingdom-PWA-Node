// =============================================================================
// ProjectBoards handoff — live render proof (Verification Doctrine DR-0076:
// observe the REAL surface). Mounts the actual board, loads the financial-loops
// seed, and drives the two-way push exactly as a user would — proving the three
// money items render AI-owned (Ari), and that a push reassigns the owner AND
// records the note in the item's persisted history. This closes the gap a pure
// unit test can't: that the wired control + history actually render and persist.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ProjectBoards from '../components/ProjectBoards.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
const clickEl = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
const byText = (re) => [...container.querySelectorAll('button, a')].find((b) => re.test((b.textContent || '').trim()));
const rowFor = (re) => [...container.querySelectorAll('li')].find((li) => re.test(li.textContent || ''));

async function typeInto(el, value) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });

describe('ProjectBoards — least-human owners + the two-way handoff record', () => {
  it('the three money items render AI-owned, and a push reassigns + logs the note to history', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ProjectBoards, { isGovernor: true, currentUserPersona: 'darrell' }));
    });

    // Open the Financial loops board and load its real items.
    await clickEl(byText(/Financial loops/));
    await clickEl(byText(/Load the 5 real items/));

    // The three money items are Ari's (least-human default), not Darrell's.
    for (const re of [/Bank statement import/, /Categorize \+ verify/, /Debts — snowball/]) {
      const li = rowFor(re);
      expect(li, `row present: ${re}`).toBeTruthy();
      const owner = [...li.querySelectorAll('span[title]')].find((s) => /owns this|needs a human/.test(s.getAttribute('title') || ''));
      expect(owner.getAttribute('title')).toMatch(/Ari — AI/);
    }

    // Expand the bank-import row and push it to Darrell with a note.
    const bank = rowFor(/Bank statement import/);
    const toggle = [...bank.querySelectorAll('button')].find((b) => b.getAttribute('title') === 'Details');
    await clickEl(toggle);

    const pushBtn = [...rowFor(/Bank statement import/).querySelectorAll('button')].find((b) => /Push to Darrell/.test(b.textContent || ''));
    expect(pushBtn, 'Push to Darrell control present').toBeTruthy();
    await clickEl(pushBtn);

    const note = 'Gmail reconnect needs your credentials — this sub-step is yours.';
    const ta = rowFor(/Bank statement import/).querySelector('textarea[placeholder*="what / why"]');
    expect(ta, 'note field revealed (preview-then-execute)').toBeTruthy();
    await typeInto(ta, note);

    await clickEl([...rowFor(/Bank statement import/).querySelectorAll('button')].find((b) => /^Send to Darrell$/.test((b.textContent || '').trim())));

    // The owner flipped, and the handoff is recorded on the shared backbone
    // (board_tasks.links.history) with who/what/why.
    const stored = JSON.parse(localStorage.getItem('poetech-board-tasks-v1') || '[]').find((t) => /Bank statement import/.test(t.title));
    expect(stored.owner).toBe('Darrell');
    const hist = stored.links.history;
    expect(hist).toHaveLength(1);
    expect(hist[0].from).toBe('Ari');
    expect(hist[0].to).toBe('Darrell');
    expect(hist[0].by).toBe('darrell');
    expect(hist[0].note).toBe(note);          // the note IS captured and persisted
    expect(hist[0].kind).toBe('handoff');

    // And it shows in the rendered history (the recorded channel both sides see).
    const shown = rowFor(/Bank statement import/).textContent;
    expect(shown).toMatch(/Handoff history · 1/);
    expect(shown).toContain(note);

    await act(async () => root.unmount());
    container.remove();
  });
});
