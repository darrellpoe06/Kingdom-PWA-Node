// @vitest-environment jsdom
// =============================================================================
// What PoeTech designs — the declared purpose, in one place, on two surfaces
// =============================================================================
// Darrell, 2026-09-24: "PoeTech App should be Designing repeatable governance
// systems that help organizations recognize patterns, surface risks, and make
// better decisions without depending on one person's institutional knowledge."
// Recorded as DR-0607. This pin holds the three together: the sentence in
// lib/purpose.js is the sentence in the decision record; the About page's
// Mission section renders it; the OpsBoard (the governance surface) renders
// it; and the Word quoted beside it is verbatim KJV from the corpus on disk.
import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPEATABLE_GOVERNANCE, purposeLine } from '../lib/purpose.js';
import About from '../components/About.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

describe('the purpose is one sentence, in his words, held in one place', () => {
  it('states the three verbs and the one condition', () => {
    const s = REPEATABLE_GOVERNANCE.statement;
    expect(s).toMatch(/^PoeTech designs repeatable governance systems/);
    expect(s).toContain('recognize patterns');
    expect(s).toContain('surface risks');
    expect(s).toContain('make better decisions');
    expect(s).toMatch(/without depending on one person.s institutional knowledge\.$/);
    expect(REPEATABLE_GOVERNANCE.verbs.map((v) => v.does)).toEqual(['recognize patterns', 'surface risks', 'make better decisions']);
    expect(purposeLine()).toBe(s);
  });

  it('is the sentence the decision record declares — the record and the app never drift', () => {
    const dir = join(REPO, 'docs', 'decisions');
    const file = readdirSync(dir).find((f) => f.startsWith(`${REPEATABLE_GOVERNANCE.record}-`));
    expect(file, `${REPEATABLE_GOVERNANCE.record} must exist`).toBeTruthy();
    const dr = readFileSync(join(dir, file), 'utf8');
    // The record carries his words verbatim (as spoken) AND the rendered sentence
    // the app shows; both must be present.
    expect(dr).toContain('Designing repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person');
    expect(dr).toContain(REPEATABLE_GOVERNANCE.statement.replace('’', "'"));
    expect(dr).toContain(`- **Date:** ${REPEATABLE_GOVERNANCE.declaredOn}`);
  });

  it('quotes the Word beside it verbatim from the KJV on disk, referenced', () => {
    const files = { Proverbs: 'Proverbs', Habakkuk: 'Habakkuk', Ecclesiastes: 'Ecclesiastes' };
    for (const w of REPEATABLE_GOVERNANCE.word) {
      const m = /^([A-Za-z]+) (\d+):(\d+)$/.exec(w.ref);
      expect(m, `${w.ref} must be a single-verse reference`).toBeTruthy();
      const book = JSON.parse(readFileSync(join(REPO, 'app', 'public', 'bible', 'kjv', `${files[m[1]]}.json`), 'utf8'));
      expect(book.chapters[Number(m[2]) - 1][Number(m[3]) - 1]).toBe(w.text);
    }
  });
});

describe('the About page carries it in the Mission section', () => {
  const base = {
    moduleInterest: {}, toggleModuleInterest: vi.fn(), theme: 'cream', setTheme: vi.fn(),
    feedback: [], deleteFeedback: vi.fn(), checkoutIntents: [], addCheckoutIntent: vi.fn(),
    deleteCheckoutIntent: vi.fn(), addProject: vi.fn(), VIEW_TIER_REQUIREMENTS: {},
  };
  it('renders the statement, the three verbs, and the referenced Word once the Mission tab is opened', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => { root.render(createElement(About, base)); });
    // Lazy panels: not in the DOM until the tab is opened.
    expect(host.querySelector('[data-testid="about-purpose-repeatable-governance"]')).toBe(null);
    const tab = host.querySelector('#about-tab-mission');
    expect(tab, 'the Mission tab must exist').toBeTruthy();
    act(() => { tab.click(); });
    const block = host.querySelector('[data-testid="about-purpose-repeatable-governance"]');
    expect(block, 'the purpose block must render in Mission').toBeTruthy();
    expect(block.textContent).toContain(REPEATABLE_GOVERNANCE.statement);
    for (const v of REPEATABLE_GOVERNANCE.verbs) expect(block.textContent).toContain(v.does);
    for (const w of REPEATABLE_GOVERNANCE.word) {
      expect(block.textContent).toContain(w.text);
      expect(block.textContent).toContain(`(${w.ref})`);
    }
    act(() => root.unmount());
    host.remove();
  });
});

describe('the OpsBoard — the governance surface — states the purpose it serves', () => {
  it('renders the statement above the lane model, network-free', async () => {
    const mod = await import('../components/OpsBoard.jsx');
    const html = renderToStaticMarkup(createElement(mod.default));
    expect(html).toContain('data-testid="ops-board-purpose"');
    // renderToStaticMarkup escapes the apostrophe; compare on the escaped form.
    const escaped = REPEATABLE_GOVERNANCE.statement.replace(/’/g, '’');
    expect(html.replace(/&#x27;|&#39;/g, "'")).toContain(escaped);
    expect(html).toMatch(/applied to the delivery lane/);
    // Order: the purpose precedes the model it governs.
    expect(html.indexOf('ops-board-purpose')).toBeLessThan(html.indexOf('The delivery lane.'));
  });
});
