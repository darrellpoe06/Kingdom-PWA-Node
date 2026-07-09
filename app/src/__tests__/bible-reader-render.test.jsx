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

  it('renders a WORD-level highlight for a saved span (part of a verse, not the whole)', async () => {
    // Seed a span over "In" in Genesis 1:1 (offsets 0-2), then open the reader.
    localStorage.setItem('poetech.highlights.v1:reader@example.com',
      JSON.stringify({ spans: { 'Genesis 1:1': [{ start: 0, end: 2, style: 'gold' }] } }));
    await mount();
    const styled = [...container.querySelectorAll('span')].find(
      (s) => s.textContent === 'In' && s.style && s.style.backgroundColor);
    expect(styled, 'the highlighted word "In" renders as its own colored span').toBeTruthy();
    localStorage.removeItem('poetech.highlights.v1:reader@example.com');
  });

  it('study-by-theme: opening a theme and tapping its anchor jumps to that verse', async () => {
    await mount();
    await clickText(/Study by theme/);
    // Open the Love theme (found by its accessible label — the visible chip is "Aa"-style).
    const loveBtn = [...container.querySelectorAll('button')].find(
      (b) => /self-giving love/.test(b.getAttribute('aria-label') || ''));
    expect(loveBtn, 'the Love theme chip renders').toBeTruthy();
    await act(async () => { loveBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick();
    // Its anchors appear; tap John 3:16 to open that verse verbatim in the reader.
    const anchor = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'John 3:16');
    expect(anchor, 'the John 3:16 anchor chip renders').toBeTruthy();
    await act(async () => { anchor.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick();
    const text = container.textContent || '';
    expect(text).toMatch(/John 3/);
    expect(text).toContain('For God so loved the world');
  });

  it('Highlighted Bible — patterns mode auto-colors theme words across the chapter', async () => {
    await mount(); // Genesis 1 — "the Spirit of God moved" (Gen 1:2) carries a theme word.
    await clickText(/Yahweh.s patterns/);
    const text = container.textContent || '';
    expect(text).toMatch(/In this chapter/);
    // "Spirit" renders as its own auto-colored span under the pattern view.
    const styled = [...container.querySelectorAll('span')].find(
      (s) => s.textContent === 'Spirit' && s.style && (s.style.backgroundColor || s.style.color));
    expect(styled, 'the theme word "Spirit" is auto-colored one-click').toBeTruthy();
  });

  it('Highlighted Bible — voices (red-letter): Jesus in red, the tempter cold (Matthew 4)', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'Matthew 4');
    await clickText(/^Go$/);
    await clickText(/voices/i);
    expect(container.textContent).toMatch(/Voices here/);
    // Jesus' answer (Mt 4:4) renders red — the Blood / the Son.
    const jesus = [...container.querySelectorAll('span')].find(
      (s) => /Man shall not live by bread alone/.test(s.textContent || '') && s.style && s.style.color);
    expect(jesus, 'Jesus red-letter').toBeTruthy();
    // the tempter's words (Mt 4:3) render italic — the cold, dishonored voice.
    const tempter = [...container.querySelectorAll('span')].find(
      (s) => /command that these stones be made bread/.test(s.textContent || '') && s.style && s.style.fontStyle === 'italic');
    expect(tempter, 'the tempter cold + italic').toBeTruthy();
  });

  it('Voices mode offers the dramatized "Play the voices" control', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'Matthew 4');
    await clickText(/^Go$/);
    await clickText(/voices/i);
    const btn = [...container.querySelectorAll('button')].find((b) => /Play the voices/.test(b.textContent || ''));
    expect(btn, 'the dramatized-read button renders in voices mode').toBeTruthy();
  });

  it('the reader has a Play button to read the chapter aloud', async () => {
    await mount();
    const play = [...container.querySelectorAll('button')].find((b) => /Play/.test(b.textContent || ''));
    expect(play, 'a Play button renders in the reader').toBeTruthy();
  });

  it('shows the Godhead together in Genesis 1 (Father, Son, Spirit) with a verified union link', async () => {
    await mount(); // opens Genesis 1
    const text = container.textContent || '';
    expect(text).toMatch(/Godhead together/);
    expect(text).toMatch(/The Father/);
    expect(text).toMatch(/The Son/);       // "The Son — the Word"
    expect(text).toMatch(/The Holy Spirit/);
    // A union link out to John 8:12 (Jesus, the Light of the world) is tappable and opens the verse.
    const john = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'John 8:12');
    expect(john, 'the John 8:12 union chip renders').toBeTruthy();
    await act(async () => { john.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick();
    expect(container.textContent).toContain('I am the light of the world');
  });

  it('rejects an unfindable reference without leaving the app', async () => {
    await mount();
    setValue(container.querySelector('#bible-jump'), 'Hezekiah 3:1');
    await clickText(/^Go$/);
    expect(container.textContent).toMatch(/Not a book or reference I can find/);
  });
});
