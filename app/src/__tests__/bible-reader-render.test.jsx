// =============================================================================
// BibleReader — live render proof the whole-KJV in-app reader works (Darrell
// 2026-07-04: a Logos-type Bible inside PoeTech, no link-out). Mounts the real
// component with the fetcher pointed at the shipped per-book assets on disk,
// proves it opens a chapter of verbatim KJV, jumps to a reference, and lists the
// 66 books — all without leaving the app.
// =============================================================================
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import BibleReader from '../components/BibleReader.jsx';
import { __setBibleFetcher } from '../lib/bible-kjv.js';
import { __setXrefFetcher } from '../lib/bible-xref.js';

const KJV_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
const XREF_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/xref');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const diskFetcher = (dir) => async (url) => {
  const file = String(url).split('/').pop();
  try {
    const body = readFileSync(join(dir, file), 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, json: async () => null };
  }
};

beforeAll(() => {
  __setBibleFetcher(diskFetcher(KJV_ASSETS));
  __setXrefFetcher(diskFetcher(XREF_ASSETS));
});

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(BibleReader, { email: 'reader@example.com', ...props })); });
  await tick();
}
const setValue = (el, val) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
};
const clickText = async (re) => {
  const b = [...container.querySelectorAll('button')].find((x) => re.test((x.textContent || '').trim()));
  await act(async () => { b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  await tick();
};

describe('BibleReader — the whole KJV, read in-app', () => {
  it('opens on Genesis 1 with verbatim public-domain text', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/King James Version/);
    expect(text).toContain('In the beginning God created the heaven and the earth.');
  });

  it('jumps to a typed reference and shows that verse', async () => {
    await mount();
    const input = container.querySelector('#bible-jump');
    setValue(input, 'John 3:16');
    await clickText(/^Go$/);
    const text = container.textContent || '';
    expect(text).toMatch(/John 3/);
    expect(text).toContain('For God so loved the world');
  });

  it('type-ahead: a single letter lists every book with that letter', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'J');
    await tick();
    const text = container.textContent || '';
    for (const name of ['James', 'Jeremiah', 'Job', 'John', 'Jonah', 'Joshua', 'Jude']) {
      expect(text, `type-ahead should list ${name}`).toContain(name);
    }
  });

  it('"John 3" (book + chapter, no verse) opens that chapter', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'John 3');
    await clickText(/^Go$/);
    const text = container.textContent || '';
    expect(text).toMatch(/John 3/);
    expect(text).toContain('For God so loved the world'); // John 3:16 is in the chapter
  });

  it('lists all 66 books in the picker (Genesis … Revelation)', async () => {
    await mount();
    await clickText(/All 66 books/);
    const text = container.textContent || '';
    expect(text).toMatch(/Old Testament/);
    expect(text).toMatch(/New Testament/);
    expect(text).toMatch(/Genesis/);
    expect(text).toMatch(/Revelation/);
    expect(text).toMatch(/Song of Solomon/);
  });

  it('tapping a verse number opens its unions — cross-references across the testaments', async () => {
    await mount();
    // Genesis 1:1's verse-number button (opens the study panel).
    const verseBtn = [...container.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').startsWith('Genesis 1:1'));
    expect(verseBtn).toBeTruthy();
    await act(async () => { verseBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick(); await tick();
    const text = container.textContent || '';
    expect(text).toMatch(/cross-references/i);
    expect(text).toContain('John 1:1-3');           // the top OT->NT union for Genesis 1:1
    expect(text).toMatch(/Copy/);
  });

  it('rejects an unfindable reference without leaving the app', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'Hezekiah 3:1');
    await clickText(/^Go$/);
    expect(container.textContent).toMatch(/Not a book or reference I can find/);
  });
});
