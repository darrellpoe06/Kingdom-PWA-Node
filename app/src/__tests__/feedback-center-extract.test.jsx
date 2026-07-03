// =============================================================================
// FeedbackCenter extraction — parity + cleanliness verification (DR-0076/0078)
// =============================================================================
// The feedback capture modal + promote queue moved out of the monolith into
// components/FeedbackCenter.jsx. These tests pin (1) the surface still works —
// renders, pre-fills the area from the current view, submits a real row,
// promotes to project — and (2) the extraction paid its debt: the new file
// carries NO consistency-guard baseline (no device-font emoji, no fixed-px
// fonts, no width-cap classes).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEEDBACK_AREAS, FEEDBACK_CATEGORIES, FeedbackModal, FeedbackPromotePanel,
} from '../components/FeedbackCenter.jsx';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let container, root;
async function mount(component, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(component, props));
  });
}
const findButton = (re) =>
  [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('FeedbackModal — the capture form still works after extraction', () => {
  it('renders the form; the area list and category picker are populated', async () => {
    await mount(FeedbackModal, { onClose: () => {}, onSubmit: () => {}, currentView: 'church' });
    expect(document.body.textContent).toMatch(/Feedback · MVP v1\.5/);
    expect(FEEDBACK_AREAS.length).toBeGreaterThan(5);
    expect(FEEDBACK_CATEGORIES.map((c) => c.key)).toContain('bug');
  });

  it('pre-fills the area from the current view (church → church)', async () => {
    await mount(FeedbackModal, { onClose: () => {}, onSubmit: () => {}, currentView: 'church' });
    expect(document.body.querySelector('select').value).toBe('church');
  });

  it('submits a real feedback row through onSubmit', async () => {
    const onSubmit = vi.fn();
    await mount(FeedbackModal, { onClose: () => {}, onSubmit, currentView: 'books' });
    const textarea = document.body.querySelector('textarea');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, 'The ledger flow is clean.');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click(findButton(/Submit feedback/i));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const row = onSubmit.mock.calls[0][0];
    expect(row.area).toBe('books-accounts');
  });
});

describe('FeedbackPromotePanel — the promote queue still works after extraction', () => {
  const row = { id: 'f1', area: 'books-accounts', rating: 'good', whatsWorking: 'ok', whatsNot: 'slow', whatsMissing: '', createdAt: new Date('2026-07-01').toISOString() };

  it('renders the queue with a feedback row and promotes it to a project', async () => {
    const addProject = vi.fn();
    await mount(FeedbackPromotePanel, { feedback: [row], addProject, addIncident: () => {}, deleteFeedback: () => {} });
    expect(document.body.textContent).toMatch(/Feedback Log · Promote queue/);
    const btn = findButton(/\+ Project/);
    expect(btn).toBeTruthy();
    await click(btn);
    expect(addProject).toHaveBeenCalledTimes(1);
    expect(addProject.mock.calls[0][0].name).toMatch(/books-accounts/);
  });
});

describe('the extraction paid its debt — the new file is guard-clean, the monolith shrank', () => {
  const src = readFileSync(join(ROOT, 'components/FeedbackCenter.jsx'), 'utf8');

  it('no device-font emoji, no fixed-px fonts, no width-cap classes', () => {
    expect(src).not.toMatch(/[\u{2600}-\u{26FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}]/u);
    expect(src).not.toMatch(/\u{FE0F}/u);
    expect(src).not.toMatch(/text-\[\d+(?:\.\d+)?px\]/);
    expect(src).not.toMatch(/\bmax-w-(?:\[[^\]]+\]|[a-z0-9-]+)/);
  });

  it('the monolith no longer defines the feedback cluster — it imports it', () => {
    const mono = readFileSync(join(ROOT, 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(mono).not.toMatch(/const FEEDBACK_AREAS = \[/);
    expect(mono).not.toMatch(/function FeedbackModal\(/);
    expect(mono).toMatch(/import \{ FeedbackModal, FeedbackPromotePanel \} from '\.\/components\/FeedbackCenter\.jsx'/);
  });
});
