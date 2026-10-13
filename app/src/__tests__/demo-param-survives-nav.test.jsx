// @vitest-environment jsdom
// =============================================================================
// The demo never becomes real data — `?demo=` must survive a tab tap
// =============================================================================
// Found 2026-08-13 while auditing the `VALID_VIEWS` remainder DR-0296 left open.
// It is not a cosmetic URL issue, which is why it has its own file.
//
// THE CHAIN, each link measured rather than reasoned about:
//
//  1. `getDemoPersona()` reads `window.location.search` and the shell calls it
//     **on every render** (`const demoPersona = getDemoPersona()`), not once in
//     a useState initializer. So the demo identity is not captured — it is
//     re-derived from the URL continuously.
//  2. `isAnyDemoMode = !!demoPersona` is what suppresses persistence: the save
//     effect opens with `if (isAnyDemoMode || reviewerMode) return;` — "Demo +
//     picker + reviewer never write to localStorage (or push snapshots)."
//  3. `useBrowserHistoryNav`'s push effect rewrites the URL through `urlFor()`
//     on every view change, and `urlFor` keeps only view/sub plus
//     `PRESERVED_PARAMS` — which did not include `demo`.
//
// Put together: open the app with `?demo=family-of-4`, tap any tab, and the URL
// loses `demo`. The next render sees no persona, `isAnyDemoMode` flips false,
// and the save effect — which was the only thing standing between the sample
// household and the user's real storage — stops returning early. The demo data
// already sitting in state is then written to localStorage and pushed as a
// snapshot.
//
// That is the sample family's fabricated balances landing in someone's real
// books. The app's own comment says demo "never writes"; this pins that the URL
// the promise depends on actually survives.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { useBrowserHistoryNav, PRESERVED_PARAMS } from '../lib/nav-history.js';

const SHELL = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

// The same three nav holders the shell owns, wired to the real hook.
function Harness() {
  const [view, setView] = useState('overview');
  const [booksView, setBooksView] = useState('calendar');
  const [churchView, setChurchView] = useState('home');
  useBrowserHistoryNav({ view, setView, booksView, setBooksView, churchView, setChurchView });
  return createElement('div', null,
    createElement('button', { className: 'go-books', onClick: () => setView('books') }, 'books'),
    createElement('button', { className: 'go-church', onClick: () => setView('church') }, 'church'),
  );
}

let container, root;
const openAt = (search) => { try { window.history.replaceState(null, '', `/${search}`); } catch (e) {} };
const tap = async (cls) => { await act(async () => { container.querySelector(cls).click(); }); };
const param = (k) => new URLSearchParams(window.location.search).get(k);

beforeEach(() => {
  openAt('');
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null;
  openAt('');
});

const mount = async () => {
  await act(async () => { root = createRoot(container); root.render(createElement(Harness)); });
};

describe('the chain that makes this dangerous is real, not assumed', () => {
  it('the shell re-derives the persona from the URL on EVERY render', () => {
    // If this were a useState initializer the URL could be rewritten harmlessly.
    // It is a bare call in the component body, so the URL IS the live source.
    expect(SHELL).toMatch(/^\s*const demoPersona = getDemoPersona\(\);/m);
    expect(SHELL).toMatch(/function getDemoPersona\(\)[\s\S]{0,200}window\.location\.search/);
  });

  it('and persistence is suppressed by exactly that derived flag', () => {
    expect(SHELL).toMatch(/const isAnyDemoMode = !!demoPersona;/);
    expect(SHELL).toMatch(/if \(isAnyDemoMode \|\| reviewerMode\) return;/);
  });
});

describe('`?demo=` survives navigation', () => {
  it('a tab tap does not strip the demo persona', async () => {
    openAt('?demo=family-of-4');
    await mount();
    expect(param('demo')).toBe('family-of-4');

    await tap('.go-books');
    expect(param('view')).toBe('books');
    expect(param('demo'), 'the demo persona was dropped by the URL rewrite').toBe('family-of-4');

    await tap('.go-church');
    expect(param('demo')).toBe('family-of-4');
  });

  it('bare ?demo (no value) survives too — it is the universal start', async () => {
    openAt('?demo');
    await mount();
    await tap('.go-books');
    expect(window.location.search).toMatch(/(^|[?&])demo(=|&|$)/);
  });

  it('the picker cut survives', async () => {
    openAt('?demo=picker');
    await mount();
    await tap('.go-books');
    expect(param('demo')).toBe('picker');
  });

  it('demo is in PRESERVED_PARAMS beside the other door/context params', () => {
    expect(PRESERVED_PARAMS).toContain('demo');
    // The params already there must not be lost while adding one.
    for (const p of ['lovecorner', 'moore', 'tlc', 'biz']) expect(PRESERVED_PARAMS).toContain(p);
  });

  it('a normal session gains no phantom demo param', async () => {
    await mount();
    await tap('.go-books');
    expect(param('demo')).toBeNull();
    expect(window.location.search).toBe('?view=books');
  });
});
