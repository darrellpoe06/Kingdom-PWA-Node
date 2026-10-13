// =============================================================================
// The app says what accessibility standard it holds itself to (DR-0995)
// =============================================================================
// Darrell, 2026-10-13: "Explain this somewhere in the app so people know...
// WCAG is the W3C's accessibility standard, with AA being the legally-required
// level—this app targets 2.2 AA to stay ahead of upcoming ADA deadlines."
// The facts are DR-0315's research; this pins that the words say them, and
// that they never claim more than the gates measure (DR-0076).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AccessibilityNote from '../components/AccessibilityNote.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

describe('the accessibility note', () => {
  it('names WCAG, the W3C, AA as the legal level, the ADA dates, and 2.2 AA as the target', async () => {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(AccessibilityNote)); });
    const note = container.querySelector('[data-testid="accessibility-note"]');
    expect(note.tagName).toBe('DETAILS'); // keyboard and screen readers, natively
    expect(note.hasAttribute('open')).toBe(false); // closed until someone asks
    const text = note.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('WCAG (the Web Content Accessibility Guidelines)');
    expect(text).toContain('the W3C');
    expect(text).toMatch(/AA level is the one the law points to/);
    expect(text).toContain('WCAG 2.1 AA for government websites and apps by April 2027 and April 2028');
    expect(text).toContain('WCAG 2.2 AA');
    expect(text).toContain('at least 36 pixels tall (the standard asks for 24)');
  });

  it('PROVEN-TO-CATCH: it never claims a certification or full compliance the gates do not measure', () => {
    const src = readFileSync(join(here, '../components/AccessibilityNote.jsx'), 'utf8');
    const body = src.slice(src.indexOf('<details'));
    expect(body).not.toMatch(/certif|fully compliant|100%|guarantee/i);
    expect(body).toMatch(/A check\s+is not a person/);
  });

  it('is where people are: the Properties footer and About', () => {
    for (const f of ['../components/PropertiesDoor.jsx', '../components/About.jsx']) {
      expect(readFileSync(join(here, f), 'utf8')).toContain('<AccessibilityNote');
    }
  });
});
