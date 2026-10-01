// @vitest-environment jsdom
//
// Books -> Imported, the Reports section and the chip filters on every theme
// (DR-0713). Darrell, 2026-09-30, a screenshot on the black theme: "Reports tab
// is hidden unless you know... it looks bad on black view... check it on all."
// Three measured defects: the header painted WHITE after a tap (hover:bg-white
// had no midnight remap: 1.26:1), the reports were collapsed behind a bare
// arrow, and the same seven report buttons rendered twice. Each is pinned here
// against the real mounted component, and the contrast of every theme is
// checked by the guard it rides on.
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Imported from '../components/Imported.jsx';
import { THEME_CSS, THEMES } from '../lib/theme-css.js';
import {
  parseThemes, parseMidnightRemap, parseMidnightHoverRemap, checkHoverCoverage, collectHoverBgTokens,
  scanHoverCoverage, parseSelectedOverrides, checkSelectedState, scanSelectedState, scanContrast,
} from '../../../scripts/contrast-guard.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const DATA = {
  accounts: [
    { id: 'a1', name: 'Chase 7206', openingBalance: 5000 },
    { id: 'a2', name: 'Chase 3322', openingBalance: 800 },
  ],
  transactions: [
    { id: 'm1', accountId: 'a1', date: '2026-07-01', amount: -2623, description: 'WF HOME MTG', category: 'mortgage' },
    { id: 'm2', accountId: 'a1', date: '2026-08-01', amount: -2623, description: 'WF HOME MTG', category: 'mortgage' },
    { id: 'm3', accountId: 'a1', date: '2026-09-01', amount: -2623, description: 'WF HOME MTG', category: 'mortgage' },
    { id: 'n1', accountId: 'a2', date: '2026-09-02', amount: -811.5, description: 'WF MTG 2111', category: 'mortgage 2111' },
    { id: 'n2', accountId: 'a2', date: '2026-09-12', amount: -811.5, description: 'WF MTG 2111', category: 'mortgage 2111' },
    { id: 'g1', accountId: 'a1', date: '2026-09-04', amount: -120.25, description: 'KROGER', category: 'groceries' },
    { id: 'p1', accountId: 'a1', date: '2026-09-05', amount: 2400, description: 'PAYROLL', category: 'income' },
  ],
};

async function mount(data = DATA) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(Imported, { data })); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  return { container, click };
}
const tokens = (el) => String(el.getAttribute('class') || '').split(/\s+/).filter(Boolean);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  localStorage.setItem('poe-current-profile', 'p1');
});

describe('the Reports section: visible, one set of controls, theme tokens only', () => {
  it('reports are visible by default on a first visit: section open, a report showing', async () => {
    const { container } = await mount();
    const sec = container.querySelector('[data-kpi-reports]');
    expect(sec, 'the Reports section renders').toBeTruthy();
    expect(container.querySelector('#kpi-reports-title').textContent).toMatch(/^Reports/);
    expect(container.querySelector('[role="tabpanel"]'), 'a report is on screen without a tap').toBeTruthy();
    const toggle = [...sec.querySelectorAll('button')].find((b) => /^(Hide|Show) report$/.test(b.textContent.trim()));
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('ONE row of report buttons: one tablist, each report named once, one of them selected', async () => {
    const { container } = await mount();
    const sec = container.querySelector('[data-kpi-reports]');
    expect(sec.querySelectorAll('[role="tablist"]')).toHaveLength(1);
    const tabs = [...sec.querySelectorAll('[role="tab"]')];
    const labels = tabs.map((t) => t.textContent.trim());
    expect(labels.length).toBeGreaterThan(2);
    expect(new Set(labels).size, `duplicated report buttons: ${labels.join(' | ')}`).toBe(labels.length);
    // no other button in the section repeats a report's name
    const others = [...sec.querySelectorAll('button:not([role="tab"])')].map((b) => b.textContent.trim());
    expect(others.filter((t) => labels.includes(t))).toEqual([]);
    const selected = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(tokens(selected[0])).toContain('poe-selected');
  });

  it('the header and its controls use theme-remapped color classes only, never a hardcoded white', async () => {
    const { container } = await mount();
    const sec = container.querySelector('[data-kpi-reports]');
    const title = container.querySelector('#kpi-reports-title');
    const toggle = [...sec.querySelectorAll('button')].find((b) => /^(Hide|Show) report$/.test(b.textContent.trim()));
    const remap = parseMidnightRemap(THEME_CSS);
    const hoverRemap = parseMidnightHoverRemap(THEME_CSS);
    for (const el of [sec, title.parentElement, title, toggle]) {
      for (const t of tokens(el)) {
        expect(t, `${t} is not a theme token`).not.toMatch(/^(hover:)?bg-white$/);
        const bg = t.match(/^bg-\[(#[0-9A-Fa-f]{6})\]$/);
        if (bg && bg[1].toLowerCase() !== '#faf8f4') expect(remap.bg[bg[1].toLowerCase()], `${t} has no midnight remap`).toBeTruthy();
        const hv = t.match(/^hover:bg-\[(#[0-9A-Fa-f]{6})\]$/);
        if (hv) expect(hoverRemap[hv[1].toLowerCase()], `${t} has no midnight hover remap`).toBeTruthy();
        const tx = t.match(/^text-\[(#[0-9A-Fa-f]{6})\]$/);
        if (tx) expect(remap.text[tx[1].toLowerCase()], `${t} has no midnight text remap`).toBeTruthy();
      }
    }
  });

  it('every theme the app offers is covered by the checks (enumerated from THEMES)', () => {
    const parsed = parseThemes(THEME_CSS);
    const keys = THEMES.map((t) => t.key);
    expect(keys).toEqual(['cream', 'white', 'slate', 'sapphire', 'rose', 'midnight']);
    for (const k of keys.filter((x) => x !== 'cream')) expect(parsed[k], `${k} parsed`).toBeTruthy();
  });
});

describe('contrast on every theme (WCAG AA), measured by the guard', () => {
  it('body text passes AA on every theme', () => {
    expect(scanContrast().violations).toEqual([]);
  });

  it('every hover fill in use renders dark in midnight (no white bar after a tap)', () => {
    const { violations, used } = scanHoverCoverage();
    expect(used.has('white')).toBe(true);
    expect(violations).toEqual([]);
  });

  it('PROVEN-TO-CATCH: without the hover remap, hover:bg-white fails (the 2026-09-30 white bar)', () => {
    const stripped = THEME_CSS.split('\n').filter((l) => !l.includes('.hover\\:bg-white:hover')).join('\n');
    const v = checkHoverCoverage(parseMidnightHoverRemap(stripped), collectHoverBgTokens('className="hover:bg-white"'));
    expect(v.map((x) => x.rendered)).toEqual(['#FFFFFF']);
  });

  it('the selected chip reads on every theme: AA label, and 3:1 apart from an unselected chip', () => {
    const { violations, rows } = scanSelectedState();
    expect(rows.map((r) => r.theme).sort()).toEqual(['cream', 'midnight', 'rose', 'sapphire', 'slate', 'white']);
    expect(violations).toEqual([]);
  });

  it('PROVEN-TO-CATCH: without poe-selected, midnight selection is invisible (1.12:1)', () => {
    const src = THEME_CSS.split('\n').filter((l) => !l.includes('.poe-selected{')).join('\n');
    const v = checkSelectedState(parseThemes(src), parseSelectedOverrides(src));
    expect(v.some((x) => x.theme === 'midnight' && x.what === 'selected chip vs unselected chip' && x.ratio < 1.2)).toBe(true);
  });
});

describe('multi-select chips: together or separately, remembered and shareable', () => {
  const chip = (c, label) => [...c.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.replace('✓', '').trim() === label);

  it('two category picks show both, the summary tracks them, and Separately stacks a section per pick', async () => {
    const { container, click } = await mount();
    await click([...container.querySelectorAll('[role="group"] button')].find((b) => b.textContent.trim() === 'All'));
    await click(chip(container, 'Mortgage'));
    await click(chip(container, 'Mortgage 2111'));
    expect(chip(container, 'Mortgage').getAttribute('aria-pressed')).toBe('true');
    expect(tokens(chip(container, 'Mortgage'))).toContain('poe-selected');
    const summary = () => [...container.querySelectorAll('div')].find((d) => /^Showing /.test(d.textContent.trim()) && d.children.length < 8).textContent;
    expect(summary()).toMatch(/Showing 5 of 7 transactions/);
    expect(summary()).toMatch(/out \$9,492/);
    // the choice is in the address bar and on this device
    const sp = new URLSearchParams(window.location.search);
    expect(sp.get('icat')).toBe('mortgage|mortgage 2111');
    expect(JSON.parse(localStorage.getItem('poe-imported-picks')).categories).toEqual(['mortgage', 'mortgage 2111']);
    // Separately: one section per pick, subtotals that add to the Together total
    await click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Separately'));
    const secs = [...container.querySelectorAll('[data-pick-section]')];
    expect(secs.map((s) => s.getAttribute('data-pick-section'))).toEqual(['category:mortgage', 'category:mortgage 2111']);
    const outs = secs.map((s) => Number((s.querySelector('[data-section-totals]').textContent.match(/out \$([\d,]+)/) || [])[1].replace(/,/g, '')));
    expect(outs).toEqual([7869, 1623]);
    expect(new URLSearchParams(window.location.search).get('ilayout')).toBe('separate');
    // one tap on a picked chip removes it; a single pick has no Together/Separately
    await click(chip(container, 'Mortgage 2111'));
    expect(container.querySelectorAll('[data-pick-section]')).toHaveLength(0);
    expect([...container.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Separately')).toBe(false);
  });

  it('a shared link opens with its picks already applied', async () => {
    window.history.replaceState(null, '', '/?view=books&iacct=Chase%203322&ilayout=separate');
    const { container } = await mount();
    const acct = [...container.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.replace('✓', '').trim() === 'Chase 3322');
    expect(acct.getAttribute('aria-pressed')).toBe('true');
    expect(new URLSearchParams(window.location.search).get('view')).toBe('books');
  });
});

describe('the footer "Reset to seed data" never shows on a real household (DR-0713)', () => {
  const shell = readFileSync(join(ROOT, 'app/src/poe-financial-mvp-v28.jsx'), 'utf8');
  it('the footer link is demo-only: a signed-in family member does not get it', () => {
    const line = shell.split('\n').find((l) => l.includes('onClick={resetToSeed}'));
    expect(line, 'the footer reset link').toBeTruthy();
    expect(line.trim().startsWith('{isAnyDemoMode && (')).toBe(true);
    expect(line).not.toMatch(/isFamilyMember/);
  });
});
