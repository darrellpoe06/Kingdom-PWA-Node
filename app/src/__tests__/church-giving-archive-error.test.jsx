// @vitest-environment jsdom
// Proven-to-catch for the Giving-archive "error told the user to sign in" bug
// (usability sweep 2026-07-22). A real fetch/RLS FAILURE used to collapse into the
// same empty state as "no rows", which reads: "sign in as a church member" — to a
// member who is ALREADY signed in. On the Give surface, that's a trust-killer. The
// fix splits error (connection hiccup + Try again) from empty (honest sign-in note).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
vi.mock('../lib/call-to-give-sync.js', () => ({ fetchCallToGiveArchive: (...a) => fetchMock(...a) }));

import { CallToGiveArchive } from '../components/ChurchGiving.jsx';

let container; let root;
afterEach(() => { try { act(() => root.unmount()); } catch { /* noop */ } container?.remove(); vi.clearAllMocks(); });

const mount = async () => {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(CallToGiveArchive)); });
};

describe('CallToGiveArchive — a real failure is NOT the sign-in empty state', () => {
  it('shows a connection error + Try again when the fetch REJECTS (not "sign in")', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await mount();
    expect(container.textContent).toMatch(/couldn.?t load/i);
    expect([...container.querySelectorAll('button')].some((b) => /try again/i.test(b.textContent))).toBe(true);
    expect(container.textContent).not.toMatch(/sign in as a church member/i);
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('shows the honest sign-in empty state when the fetch RESOLVES with no rows', async () => {
    fetchMock.mockResolvedValue({ archive: [] });
    await mount();
    expect(container.textContent).toMatch(/sign in as a church member/i);
    expect(container.textContent).not.toMatch(/try again/i);
  });
});
