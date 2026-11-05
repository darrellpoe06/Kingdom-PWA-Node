// =============================================================================
// The app-wide error card gives the person a reference, not the exception's
// words (DR-1335, DR-1330 D5): the message shows only under reviewer mode
// (DR-0104). Proven both ways, and the journal entry carries the same ref.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { REVIEWER_MODE_KEY } from '../lib/reviewer-lens.js';
import { readErrorJournal, ERROR_JOURNAL_KEY } from '../lib/error-journal.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Boom() { throw new Error('ENOENT: /volume1/secret/path.json'); }

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(ErrorBoundary, null, createElement(Boom))); });
  return container;
}

describe('ErrorBoundary speaks a reference', () => {
  beforeEach(() => {
    localStorage.removeItem(REVIEWER_MODE_KEY);
    localStorage.removeItem(ERROR_JOURNAL_KEY);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

  it('shows a reference and keeps the exception text off the screen for a person', async () => {
    const c = await mount();
    const ref = c.querySelector('[data-testid="error-reference"]').textContent.trim();
    expect(ref).toMatch(/^Reference [0-9a-f]{8}$/);
    expect(c.textContent).not.toContain('Technical detail');
    expect(c.textContent).not.toContain('/volume1/secret/path.json');
    const id = ref.replace('Reference ', '');
    expect(readErrorJournal()[0].message).toContain(`[${id}]`);
  });

  it('shows the exception text under reviewer mode, where the steward reads the build', async () => {
    localStorage.setItem(REVIEWER_MODE_KEY, 'self');
    const c = await mount();
    expect(c.textContent).toContain('Technical detail (reviewer mode)');
    expect(c.textContent).toContain('/volume1/secret/path.json');
  });
});
