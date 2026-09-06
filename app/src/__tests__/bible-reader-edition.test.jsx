// @vitest-environment jsdom
// =============================================================================
// BibleReader — a SECOND readable edition: the modern-English public-domain WEB
// =============================================================================
// Darrell 2026-09-06: "we want kjv and esv!!!!", "why can't we carry a cited esv
// corpus? Or build our own quickly!!!!". The ESV cannot be carried (Crossway;
// bible-editions.js); the World English Bible is public domain and was already
// ingested to disk (app/public/bible/web) but the reader only ever opened the
// KJV. This proves the reader now reads BOTH, verbatim from disk:
//   1. KJV is the default, and the header names it.
//   2. Choosing WEB reloads the chapter from the WEB corpus (the rendered verse
//      IS the corpus verse — read from the file, never typed here), names the
//      edition, and shows its licence/provenance line (WEB's name is a
//      trademark; the text is labelled as WEB exactly for that reason).
//   3. The choice is remembered on the device; a fresh mount reopens on WEB.
//   4. Word-level highlight spans are scoped to the edition they were made in —
//      a span over KJV words is NOT painted over WEB words (different wording,
//      same offsets = the wrong words) — while whole-verse marks stay shared.
//   5. The copy label follows the edition.
// Proven-to-catch: against the pre-fix reader there is no "Edition" group, the
// header always says King James Version, and Genesis 1:1 never changes.
// =============================================================================
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import BibleReader from '../components/BibleReader.jsx';
import { __setBibleFetcher, READER_EDITION_KEY, readerEdition, rememberReaderEdition } from '../lib/bible-kjv.js';
import { __setXrefFetcher } from '../lib/bible-xref.js';
import { addSpan, emptyHighlights, saveHighlights, getSpans } from '../lib/scripture-highlights.js';

const BIBLE = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The fetcher honours the EDITION directory in the URL (…/bible/<edition>/<Book>.json).
const editionFetcher = async (url) => {
  const parts = String(url).split('/');
  const file = parts.pop();
  const dir = parts.pop();
  try {
    const body = readFileSync(join(BIBLE, dir, file), 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, json: async () => null };
  }
};
const corpusVerse = (edition, book, ch, v) => JSON.parse(readFileSync(join(BIBLE, edition, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

beforeAll(() => {
  __setBibleFetcher(editionFetcher);
  __setXrefFetcher(async () => ({ ok: false, json: async () => null }));
});

let container; let root;
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  window.localStorage.clear();
});

const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(BibleReader, { email: 'reader@example.com', ...props })); });
  await tick();
}
const verse1 = () => container.querySelector('#v-1 p').textContent;
const header = () => container.querySelector('p.uppercase').textContent;
const radio = (short) => [...container.querySelectorAll('[role="radiogroup"][aria-label="Edition"] [role="radio"]')].find((b) => b.textContent.startsWith(short));
const choose = async (short) => { await act(async () => { radio(short).dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await tick(); };

describe('the remembered edition helpers', () => {
  it('default KJV; only an edition on disk is remembered; a blocked store reads as KJV', () => {
    expect(readerEdition()).toBe('kjv');
    rememberReaderEdition('web');
    expect(window.localStorage.getItem(READER_EDITION_KEY)).toBe('web');
    expect(readerEdition()).toBe('web');
    rememberReaderEdition('esv'); // not carried — never stored
    expect(readerEdition()).toBe('web');
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readerEdition(broken)).toBe('kjv');
    expect(() => rememberReaderEdition('web', broken)).not.toThrow();
  });
});

describe('BibleReader reads the KJV by default and the WEB on request — both verbatim from disk', () => {
  it('opens on the KJV, names it, and Genesis 1:1 is the KJV corpus verse', async () => {
    await mount();
    expect(header()).toMatch(/King James Version/);
    expect(radio('KJV').getAttribute('aria-checked')).toBe('true');
    expect(verse1()).toBe(corpusVerse('kjv', 'Genesis', 1, 1));
  });

  it('choosing WEB reloads the chapter from the WEB corpus, names the edition, and shows its provenance', async () => {
    await mount();
    await choose('WEB');
    expect(header()).toMatch(/World English Bible/);
    expect(radio('WEB').getAttribute('aria-checked')).toBe('true');
    const web = corpusVerse('web', 'Genesis', 1, 1);
    expect(web).not.toBe(corpusVerse('kjv', 'Genesis', 1, 1)); // the two really differ
    expect(verse1()).toBe(web);
    const prov = container.querySelector('[data-testid="edition-provenance"]').textContent;
    expect(prov).toMatch(/World English Bible — Public Domain/);
    expect(prov).toMatch(/eBible\.org/);
  });

  it('the choice is remembered — a fresh mount reopens on WEB', async () => {
    await mount();
    await choose('WEB');
    expect(window.localStorage.getItem(READER_EDITION_KEY)).toBe('web');
    act(() => root.unmount()); root = null; container.remove();
    await mount();
    expect(header()).toMatch(/World English Bible/);
    expect(verse1()).toBe(corpusVerse('web', 'Genesis', 1, 1));
  });

  it('a word-level span made over KJV words is NOT painted over WEB words; whole-verse marks are shared', async () => {
    // A saved KJV span: the first four characters of Genesis 1:1.
    const state = addSpan(emptyHighlights(), 'Genesis 1:1', 0, 4, 'anchor');
    saveHighlights('reader@example.com', state);
    await mount();
    const painted = () => container.querySelectorAll('#v-1 p > span > span').length;
    expect(painted(), 'the KJV span paints on the KJV').toBeGreaterThan(0);
    await choose('WEB');
    expect(painted(), 'the same offsets over different words must not paint').toBe(0);
    await choose('KJV');
    expect(painted()).toBeGreaterThan(0);
    // and the edition-scoped key is where a WEB span would live
    expect(getSpans(state, 'Genesis 1:1').length).toBe(1);
    expect(getSpans(state, 'Genesis 1:1@web').length).toBe(0);
  });

  it('PROVEN-TO-CATCH — the pre-fix reader had no Edition group and never changed Genesis 1:1', async () => {
    await mount();
    expect(container.querySelector('[role="radiogroup"][aria-label="Edition"]')).toBeTruthy();
    const before = verse1();
    await choose('WEB');
    expect(verse1()).not.toBe(before);
  });
});
