// =============================================================================
// Shay's door opens on HER work, and the order path comes early
// =============================================================================
// Darrell 2026-08-31, looking at the live door: "keep Moore Divahs Tab at the
// top... move the other business tabs to the bottom of the page... then move
// the ordering aspect to the top... maybe after the first 3 images/product
// spots so Shay's customers can see how to order... just want it to flow
// better."
//
// Two things this pins, both of which are ORDER — the exact property a render
// test catches and a unit test cannot:
//
//   1. A customer arriving from her flyer meets scrub caps, not a four-way
//      chooser between businesses she did not come for. The siblings live in a
//      bottom nav, AFTER <main>.
//   2. "How do I order?" appears after her first few pieces, not below the
//      entire gallery — and it survives an EMPTY showcase, because the day her
//      gallery is empty is the day the order form matters most.
//
// Proven-to-catch: written against the previous layout first and observed
// failing — sibling tabs above <main>, and the order block below every piece.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PIECES = Array.from({ length: 7 }, (_, i) => ({
  slug: `sp-${i + 1}`,
  title: `Piece ${i + 1}`,
  image_path: `moore-divahs/sp-${i + 1}.jpeg`,
  price_cents: null,
  pinned: false,
  created_at: `2026-08-0${i + 1}`,
}));

// A showcase that can be emptied per-test, so the empty-gallery case is real.
const showcase = { pieces: PIECES };

vi.mock('../lib/showcase.js', () => ({
  fetchShowcase: async () => ({ ok: true, pieces: showcase.pieces }),
  showcaseImageUrl: (p) => `https://cdn.example/${p}`,
  sortPieces: (p) => [...(p || [])],
}));
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    rpc: async () => ({ data: [], error: null }),
  },
  readPersistedSession: () => null,
  signOut: async () => ({}),
}));
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: async () => ({ data: [], error: null }) }));
vi.mock('../lib/business-messages.js', () => ({
  fetchMessages: async () => ({ ok: true, rows: [] }),
  sendMessage: async () => ({ ok: true }),
}));
vi.mock('../lib/crm-sync.js', () => ({ captureLead: async () => ({ ok: true }) }));

import MooreDoor from '../components/MooreDoor.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  showcase.pieces = PIECES;
});

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(MooreDoor)); });
  await act(async () => { await Promise.resolve(); });
}

// Position of a heading in DOCUMENT order — the thing "flow" actually means.
const headingAt = (text) => {
  const all = [...container.querySelectorAll('h1,h2,h3')];
  const i = all.findIndex((h) => h.textContent.trim() === text);
  expect(i, `no heading "${text}"`).toBeGreaterThan(-1);
  return i;
};

describe('the door opens on her work, not on a chooser', () => {
  it('no sibling business is offered ABOVE the main content', async () => {
    await mount();
    const main = container.querySelector('main');
    expect(main).toBeTruthy();
    // Everything rendered before <main> — the header, comfort controls, auth.
    const before = document.createElement('div');
    for (const n of [...main.parentElement.childNodes]) {
      if (n === main) break;
      before.appendChild(n.cloneNode(true));
    }
    for (const sibling of ['The Practice', 'The Church', 'PoeTech']) {
      expect(before.textContent, `"${sibling}" is still offered above the fold`).not.toContain(sibling);
    }
  });

  it('the siblings are reachable at the BOTTOM, each saying what it is', async () => {
    await mount();
    const nav = container.querySelector('nav[aria-label="More from the family"]');
    expect(nav, 'no family nav at the bottom').toBeTruthy();
    // After <main> in document order — that is what "bottom of the page" means.
    const main = container.querySelector('main');
    expect(main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const sibling of ['The Practice', 'The Church', 'PoeTech']) {
      expect(nav.textContent).toContain(sibling);
    }
    // Her own door is not offered as a destination while she is already on it.
    expect(nav.textContent).not.toContain('Moore Divahs');
    // The blurb rides along — the room a one-word tab never had.
    expect(nav.textContent).toMatch(/TLC Therapy Solutions/);
  });

  it('a sibling tab keeps a way back, so the bottom nav never strands anyone', async () => {
    await mount();
    const nav = container.querySelector('nav[aria-label="More from the family"]');
    const toPractice = [...nav.querySelectorAll('button')].find((b) => /The Practice/.test(b.textContent));
    await act(async () => { toPractice.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { await Promise.resolve(); });
    const main = container.querySelector('main');
    const back = [...container.querySelectorAll('button')].find((b) => /←\s*Moore Divahs/.test(b.textContent));
    expect(back, 'no way back to her door from a sibling').toBeTruthy();
    expect(main.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});

describe('the order path comes early', () => {
  it('sits AFTER her first pieces and BEFORE the rest of the gallery', async () => {
    await mount();
    expect(headingAt('Her work')).toBeLessThan(headingAt('Custom work, made for you'));
    expect(headingAt('Start an order')).toBeLessThan(headingAt('More of her work'));
  });

  it('only the first four pieces greet a customer; the rest wait below', async () => {
    await mount();
    const figures = [...container.querySelectorAll('figure')];
    expect(figures).toHaveLength(7);
    const order = container.querySelector('h3') && [...container.querySelectorAll('h2,h3')]
      .find((h) => h.textContent.trim() === 'Start an order');
    const beforeOrder = figures.filter(
      (f) => order.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(beforeOrder).toHaveLength(4);
  });

  it('an EMPTY showcase still tells a customer how to order', async () => {
    showcase.pieces = [];
    await mount();
    expect(container.textContent).toMatch(/being curated/i);
    // The whole point: no pieces must never mean no order path.
    expect(headingAt('Start an order')).toBeGreaterThan(-1);
    expect(container.querySelector('form')).toBeTruthy();
    // Nothing to show below, so no empty "More of her work" heading.
    expect(container.textContent).not.toContain('More of her work');
  });
});
