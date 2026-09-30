// DR-0707 — ONE Upload control, the same spot (top right) on EVERY Books tab.
// Darrell 2026-09-30: "We should have them importer on all Books tab pages for
// users?" and: top right, same spot on every tab, compact on phones.
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BooksUploadButton, BooksUploadMount } from '../components/BooksUploadButton.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root = null; let host = null;
function mount(el) { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); act(() => root.render(el)); return host; }
async function until(fn, ms = 8000) {
  const t0 = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('timed out waiting');
    await act(async () => { await new Promise((r) => setTimeout(r, 25)); });
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
const EXPECTED_TABS = ['entities', 'accounts', 'debts', 'owed', 'plan', 'transactions', 'imported', 'cart', 'k1099', 'taxes', 'calendar', 'legal'];

// The Books sub-nav block, from its container to the end of that header row.
function booksHeaderBlock() {
  const start = SHELL.indexOf("{view === 'books' && (\n          <div className=\"border-t");
  const end = SHELL.indexOf('</div>', SHELL.indexOf('</TabScroll>', start));
  return SHELL.slice(start, end);
}
function booksBodyBlock() {
  const start = SHELL.indexOf("<PrivateGate area=\"Financial\"");
  return SHELL.slice(start, SHELL.indexOf('</PrivateGate>', start));
}

afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

describe('the Books shell carries ONE upload for every sub-tab', () => {
  it('the Books tab row still lists every sub-tab the upload must cover', () => {
    const ids = [...booksHeaderBlock().matchAll(/\['([a-z0-9]+)',/g)].map((m) => m[1]);
    for (const id of EXPECTED_TABS) expect(ids).toContain(id);
  });

  it('the button sits at the RIGHT end of the Books tab row, outside any per-tab branch', () => {
    const block = booksHeaderBlock();
    expect(block).toMatch(/<div className="[^"]*\bflex\b[^"]*items-center[^"]*">/);
    const afterRow = block.slice(block.indexOf('</TabScroll>'));
    expect(afterRow).toMatch(/^<\/TabScroll>\s*<BooksUploadButton \/>/);
    expect(block.match(/<BooksUploadButton/g)).toHaveLength(1);
    expect(SHELL.match(/<BooksUploadButton/g)).toHaveLength(1);
  });

  it('the panel mounts once, inside the Financial PIN gate, before any booksView branch', () => {
    const body = booksBodyBlock();
    const mountAt = body.indexOf('<BooksUploadMount');
    expect(mountAt).toBeGreaterThan(-1);
    expect(mountAt).toBeLessThan(body.indexOf("booksView === 'entities'"));
    expect(body.slice(0, mountAt)).not.toMatch(/booksView ===/);
    expect(body).toMatch(/<BooksUploadMount hint=\{booksView\}/);
    expect(SHELL.match(/<BooksUploadMount/g)).toHaveLength(1);
  });
});

describe('walking every Books tab: the same control, the tab only a hint', () => {
  for (const tab of EXPECTED_TABS) {
    it(`${tab}: the Upload control opens the one pipeline`, async () => {
      const c = mount(
        <div>
          <div className="flex items-center" data-testid="row"><div className="flex-1">tabs</div><BooksUploadButton /></div>
          <BooksUploadMount hint={tab} data={{ accounts: [], entities: [] }} demo />
        </div>,
      );
      const q = (sel) => c.querySelector(sel) || document.querySelector(sel);
      const btn = q('[data-testid="books-upload-button"]');
      expect(btn.getAttribute('aria-label')).toMatch(/^Upload a financial document/);
      expect(btn.className).toMatch(/min-h-\[44px\]/);
      expect(btn.className).toMatch(/min-w-\[44px\]/);
      // Last child of the row = the right end.
      expect(q('[data-testid="row"]').lastElementChild).toBe(btn);
      act(() => { btn.click(); });
      await until(() => q('[data-testid="books-upload-panel"]'));
      expect(q('[data-testid="books-upload-input"]').hasAttribute('accept')).toBe(false); // takes anything
      const hintLine = [...document.querySelectorAll('p')].find((p) => /Opened from/.test(p.textContent));
      if (['entities', 'legal'].includes(tab)) expect(hintLine).toBeUndefined();
      else expect(hintLine.textContent).toMatch(/but the document decides where it goes/);
      act(() => { q('[aria-label="Close the upload"]').click(); });
      await until(() => !q('[data-testid="books-upload-panel"]'));
    });
  }
});
