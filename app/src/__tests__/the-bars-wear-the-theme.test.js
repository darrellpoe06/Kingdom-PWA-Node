// @vitest-environment jsdom
// =============================================================================
// THE PHONE'S OWN BARS WEAR THE THEME (DR-0744)
// =============================================================================
// Darrell 2026-10-01, Midnight on his phone in the installed app, a white strip
// above the page and a white strip below it: "why have the white bar at the
// top and another one at the bottom so 3?!"
//
// An installed app's status bar and, on Android, its navigation bar take their
// color from <meta name="theme-color">. index.html ships it cream for the first
// paint and nothing ever moved it. Now the theme store writes its own color
// there and on the document element, on every change and on the first mount.
//
// PROVEN-TO-CATCH: the last case reads the meta after setThemePref('midnight')
// and fails against the old store, where the meta stayed cream.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, themeColorFor, syncThemeChrome, setThemePref } from '../lib/theme-css.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const meta = () => document.querySelector('meta[name="theme-color"]');

beforeEach(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
  const m = meta();
  if (m) m.remove();
  document.documentElement.style.backgroundColor = '';
});

describe('themeColorFor', () => {
  it('is the page color of each theme, and cream for a key it does not know', () => {
    for (const t of THEMES) expect(themeColorFor(t.key)).toBe(t.color);
    expect(themeColorFor('midnight')).toBe('#000000');
    expect(themeColorFor('nope')).toBe('#FAF8F4');
    expect(themeColorFor(undefined)).toBe('#FAF8F4');
  });
});

describe('syncThemeChrome', () => {
  it('writes the theme color to an existing theme-color meta and to the document element', () => {
    const m = document.createElement('meta');
    m.setAttribute('name', 'theme-color');
    m.setAttribute('content', '#FAF8F4');
    document.head.appendChild(m);
    expect(syncThemeChrome('midnight')).toBe('#000000');
    expect(meta().getAttribute('content')).toBe('#000000');
    expect(document.documentElement.style.backgroundColor).toBe('rgb(0, 0, 0)');
  });
  it('creates the meta when the page has none, so a door without one still colors its bars', () => {
    expect(meta()).toBeNull();
    syncThemeChrome('rose');
    expect(meta().getAttribute('content')).toBe('#FDF2F8');
  });
  it('with no document it writes nothing and says so', () => {
    expect(syncThemeChrome('midnight', null)).toBe('');
  });
});

describe('the store paints the bars on every change', () => {
  it('PROVEN-TO-CATCH: picking Midnight turns the theme-color meta black; picking Cream turns it cream again', () => {
    const m = document.createElement('meta');
    m.setAttribute('name', 'theme-color');
    m.setAttribute('content', '#FAF8F4');
    document.head.appendChild(m);
    expect(setThemePref('midnight')).toBe('midnight');
    expect(meta().getAttribute('content')).toBe('#000000');
    expect(setThemePref('cream')).toBe('cream');
    expect(meta().getAttribute('content')).toBe('#FAF8F4');
  });
  it('an unknown key changes nothing', () => {
    syncThemeChrome('cream');
    setThemePref('plaid');
    expect(meta().getAttribute('content')).toBe('#FAF8F4');
  });
});

describe('the shell and the manifest keep the first-paint color', () => {
  it('index.html still ships a theme-color meta for the first paint, cream like the first-run theme', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(html).toMatch(/<meta name="theme-color" content="#FAF8F4" \/>/);
  });
  it('the installed app manifest keeps the same first-paint color, so the splash and the first frame agree', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'manifest.webmanifest'), 'utf8'));
    expect(manifest.theme_color).toBe('#FAF8F4');
    expect(manifest.display).toBe('standalone');
  });
});
