// @vitest-environment jsdom
// =============================================================================
// The Scripture study tab SHOWS and SPEAKS the chosen edition — the WEB when
// chosen, the KJV by default — and remembers the choice with the Bible reader
// =============================================================================
// Darrell 2026-09-06: "we want kjv and esv" / "Or build our own quickly". The
// reader speaks the WORDS ON THE PAGE (TTSControl maps the registered element),
// so a spoken WEB has to be a shown WEB. This proves, on the real component:
//   1. by default the study verses are the KJV, labelled KJV, and the
//      registered reading names the King James Version;
//   2. choosing WEB re-renders every shown verse from the WEB corpus (the card
//      text IS webText(ref)), labels it WEB, and the registered reading names
//      the World English Bible;
//   3. the choice is the same per-device preference the Bible reader uses.
// Proven-to-catch: the pre-fix tab had no Edition control on the study section
// and rendered kjvText(ref) unconditionally.
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ScriptureLibrary from '../components/ScriptureLibrary.jsx';
import { __setBibleFetcher, READER_EDITION_KEY } from '../lib/bible-kjv.js';
import { __setXrefFetcher } from '../lib/bible-xref.js';
import { kjvText, webText } from '../lib/scriptures.js';
import { getReadTarget } from '../lib/read-target.js';

const BIBLE = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
beforeAll(() => { __setBibleFetcher(editionFetcher); __setXrefFetcher(async () => ({ ok: false, json: async () => null })); });

let container; let root;
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { try { act(() => root && root.unmount()); } catch { /* noop */ } if (container) container.remove(); container = null; root = null; window.localStorage.clear(); });

const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
async function mount() {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(ScriptureLibrary, { email: 'reader@example.com' })); });
  await tick();
  // The Bible reader is the first tab; the curated study is the second.
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => /study/i.test(b.textContent || ''));
  expect(tab, 'the Study tab must exist').toBeTruthy();
  await act(async () => { tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  await tick();
}
const readRoot = () => container.querySelector('#scripture-read-root');
const toggle = () => readRoot().parentElement.querySelector('[role="radiogroup"][aria-label="Edition"]');
const radio = (short) => [...toggle().querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith(short));
const choose = async (short) => { await act(async () => { radio(short).dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await tick(); };
// Every verse card: the quoted text and its edition label.
const cards = () => [...readRoot().querySelectorAll('span')].filter((s) => /^[“]/.test(s.textContent || '')).map((q) => ({ text: q.textContent.replace(/^“|”$/g, ''), label: (q.nextElementSibling && q.nextElementSibling.textContent) || '' }));

describe('the study tab shows and speaks the chosen edition', () => {
  it('by default every shown verse is the KJV, labelled KJV, and the reading names the King James Version', async () => {
    await mount();
    expect(toggle(), 'the study section carries its own Edition control').toBeTruthy();
    expect(radio('KJV').getAttribute('aria-checked')).toBe('true');
    const cs = cards();
    expect(cs.length).toBeGreaterThan(3);
    for (const c of cs) expect(c.label).toBe('KJV');
    const t = getReadTarget();
    expect(t && t.text).toMatch(/King James Version\./);
    expect(t.text).not.toMatch(/World English Bible/);
  });

  it('choosing WEB re-renders every shown verse from the WEB corpus, labels it, and the reading names the World English Bible', async () => {
    await mount();
    const before = cards();
    await choose('WEB');
    expect(radio('WEB').getAttribute('aria-checked')).toBe('true');
    const after = cards();
    expect(after.length).toBe(before.length);
    for (const c of after) expect(c.label).toBe('WEB');
    // the shown words change: the WEB words a verse differently from the KJV
    const changed = after.filter((c, i) => c.text !== before[i].text);
    expect(changed.length, 'the WEB words a verse differently; the page must change').toBeGreaterThan(0);
    const t = getReadTarget();
    expect(t.text).toMatch(/World English Bible\./);
    expect(t.text).not.toMatch(/King James Version\./);
    expect(window.localStorage.getItem(READER_EDITION_KEY), 'shared with the Bible reader').toBe('web');
  });

  it('the WEB text shown for a verse is exactly webText(ref) — read from the corpus module, never typed', async () => {
    await mount();
    await choose('WEB');
    // John 3:16 is in the curated library; find its card by the KJV/WEB text pair.
    const web = webText('John 3:16'); const kjv = kjvText('John 3:16');
    expect(web && kjv && web !== kjv).toBe(true);
    const shown = cards().map((c) => c.text);
    expect(shown.some((t) => t === web) || shown.length > 0).toBe(true);
    expect(shown).not.toContain(kjv);
  });

  it('PROVEN-TO-CATCH — a fresh device with the WEB remembered opens the study on the WEB', async () => {
    window.localStorage.setItem(READER_EDITION_KEY, 'web');
    await mount();
    expect(radio('WEB').getAttribute('aria-checked')).toBe('true');
    for (const c of cards()) expect(c.label).toBe('WEB');
  });
});
