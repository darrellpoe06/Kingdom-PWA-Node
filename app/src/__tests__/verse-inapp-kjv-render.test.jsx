// =============================================================================
// Verse — internal-linking proof (Darrell 2026-07-04: "are we linked internally
// for all those scripture references... present the Word directly from the app").
// The study Verse now resolves ANY reference to verbatim KJV from the WHOLE
// in-app Bible (not just the ~191 curated set), so a reference that was never
// bundled — Nahum 1:7 — now shows the Word in-app instead of dead-ending to
// "look it up." The fetcher is pointed at the shipped assets on disk.
// =============================================================================
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Verse } from '../components/EternalAlgorithmsStudy.jsx';
import { kjvText } from '../lib/scriptures.js';
import { __setBibleFetcher } from '../lib/bible-kjv.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  __setBibleFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
async function mount(refStr) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Verse, { refStr })); });
  await tick();
}

describe('Verse resolves any reference from the in-app Bible', () => {
  it('shows a NON-curated ref (Nahum 1:7) as verbatim KJV, in-app', async () => {
    expect(kjvText('Nahum 1:7')).toBeNull();           // not in the bundled curated set...
    await mount('Nahum 1:7');
    // ...but the whole in-app KJV supplies it — the Word, from the app itself.
    expect(container.textContent).toContain('The LORD is good, a strong hold in the day of trouble');
    expect(container.textContent).toMatch(/KJV/);
  });

  it('a curated ref still resolves instantly (no regression)', async () => {
    await mount('John 14:15');
    expect(container.textContent).toContain('If ye love me, keep my commandments');
  });
});
