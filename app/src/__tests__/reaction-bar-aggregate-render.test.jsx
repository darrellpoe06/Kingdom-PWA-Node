// =============================================================================
// ReactionBar — the "works like social media" gate (Verification Doctrine DR-0076):
// prove the AGGREGATE count pill shows on the card WITHOUT opening the picker, and
// that a single-pick toggle increments on react / decrements on remove.
// =============================================================================
// Darrell 2026-07-02: reactions must aggregate + display like Facebook/LinkedIn —
// a per-reaction tally with counts, a running total, one reaction per person, and
// one tap to add / tap again to remove. This mounts the REAL control and drives it
// exactly as a user would, so the behavior can't silently regress. (Persistence is
// reactions-sync.js against content_reactions; this proves the display + toggle.)
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ReactionBar from '../components/ReactionBar.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

async function render(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
}
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
const menuOpen = () => !!container.querySelector('[role="menu"]');
// The compact counts pill lives OUTSIDE the popover; find it by its "N reactions" title.
const countsPill = () => [...container.querySelectorAll('button')].find((b) => /reaction/i.test(b.getAttribute('title') || ''));
const paletteItem = (label) => [...container.querySelectorAll('[role="menuitem"]')]
  .find((b) => (b.getAttribute('title') || '').startsWith(label));

describe('ReactionBar aggregates + displays like social media', () => {
  it('shows a per-reaction count pill + total on the card without opening the picker', async () => {
    // Two people reacted Lion, one Lamb — the entry a surface passes down.
    await render(createElement(ReactionBar, {
      entry: { counts: { lion: 2, lamb: 1 }, total: 3, myKey: null, score: 9,
        top: [{ key: 'lion', count: 2 }, { key: 'lamb', count: 1 }] },
      onReact: async () => ({ added: true }),
    }));
    expect(menuOpen()).toBe(false);            // picker is CLOSED
    const pill = countsPill();
    expect(pill, 'no aggregate counts pill on the card').toBeTruthy();
    expect(pill.textContent).toMatch(/2/);      // Lion count
    expect(pill.textContent).toMatch(/1/);      // Lamb count
    expect(pill.textContent).toMatch(/3/);      // running total
  });

  it('increments the tally when you react (one tap), picker closes, pill stays visible', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      entry: { counts: { lion: 1 }, total: 1, myKey: null, score: 3, top: [{ key: 'lion', count: 1 }] },
      onReact: async (k) => { sent = k; return { added: true, reactionKey: k }; },
    }));
    // Open the palette and pick Lion.
    const trigger = container.querySelector('button[aria-haspopup="menu"]');
    await click(trigger);
    expect(menuOpen()).toBe(true);
    await click(paletteItem('Lion of Judah'));
    expect(sent).toBe('lion');                 // persisted via onReact
    expect(menuOpen()).toBe(false);            // picker closed after the tap
    // Optimistic aggregate: Lion 1 -> 2, still shown on the card (no picker).
    const pill = countsPill();
    expect(pill).toBeTruthy();
    expect(pill.textContent).toMatch(/2/);
  });

  it('decrements (removes) when you tap your own reaction again — single pick, no stacking', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      // I already picked Lion; the tally counts my pick among the 3.
      entry: { counts: { lion: 3 }, total: 3, myKey: 'lion', score: 9, top: [{ key: 'lion', count: 3 }] },
      onReact: async (k) => { sent = k; return { removed: true }; },
    }));
    const trigger = container.querySelector('button[aria-haspopup="menu"]');
    await click(trigger);
    await click(paletteItem('Lion of Judah'));  // tap my current reaction -> remove
    expect(sent).toBe('lion');
    // Optimistic aggregate: Lion 3 -> 2 (my vote removed).
    const pill = countsPill();
    expect(pill).toBeTruthy();
    expect(pill.textContent).toMatch(/2/);
  });

  // ---------------------------------------------------------------------------
  // Touch-first (Darrell 2026-07-03: "they don't feel intuitive yet"). On a
  // no-hover device the meaning must be REACHABLE (hover doesn't exist there):
  // first tap previews meaning + Scripture and arms the tile; second tap reacts.
  // And every tile carries its visible NAME — nobody reacts blind.
  // ---------------------------------------------------------------------------
  it('every palette tile shows its name visibly (meaning never hides behind hover)', async () => {
    await render(createElement(ReactionBar, { entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] }, onReact: async () => ({}) }));
    await click(container.querySelector('button[aria-haspopup="menu"]'));
    const lamb = paletteItem('Lamb of God');
    expect(lamb, 'Lamb of God tile missing').toBeTruthy();
    expect(lamb.textContent).toMatch(/Lamb of God/); // visible label, not just a title attr
  });

  it('on a no-hover (touch) device: first tap previews + arms, second tap reacts', async () => {
    // jsdom has no matchMedia; installing one that reports (hover: none) = true
    // simulates a phone/tablet. Removed after the test.
    window.matchMedia = (q) => ({ matches: q === '(hover: none)', media: q, addListener: () => {}, removeListener: () => {} });
    try {
      let sent = null;
      await render(createElement(ReactionBar, {
        entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] },
        onReact: async (k) => { sent = k; return { added: true }; },
      }));
      await click(container.querySelector('button[aria-haspopup="menu"]'));
      const lamb = paletteItem('Lamb of God');
      await click(lamb);                          // first tap: preview + arm
      expect(sent).toBe(null);                    // did NOT react blind
      expect(menuOpen()).toBe(true);              // palette stays open
      expect(container.textContent).toMatch(/John 1:29|Lamb of God/); // meaning is visible
      expect(container.textContent).toMatch(/again to react/i);      // the arming prompt
      await click(paletteItem('Lamb of God'));    // second tap: confirm
      expect(sent).toBe('lamb');
      expect(menuOpen()).toBe(false);
    } finally {
      delete window.matchMedia;
    }
  });
});
