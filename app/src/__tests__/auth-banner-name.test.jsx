// =============================================================================
// AuthBanner — the account strip shows the CHOSEN name and lets you set it
// =============================================================================
// DP 2026-07-12: "Everyone calls me DP not darrellpoe06... I want a user name so
// people can pick whatever they want... so people recognize who is who." The
// always-visible strip is where a name is picked (no Settings hunt).
// PROVEN-TO-CATCH: a chosen display_name shows (not the email); with no chosen
// name the strip invites "Pick a name"; saving calls saveDisplayName with the
// typed value. The real resolveUserName is kept (importActual) so the strip and
// the resolver can't drift.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// One session the stubbed onAuthChange will hand back; each test sets it first.
// vi.hoisted so the mock factory (hoisted above imports) can reach these.
const { sessionRef, saveDisplayNameMock } = vi.hoisted(() => ({
  sessionRef: { current: null },
  saveDisplayNameMock: vi.fn(async () => ({ data: { user: { email: 'x', user_metadata: {} } }, error: null })),
}));

vi.mock('../lib/supabase.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,                                   // keep the REAL resolveUserName
    __esModule: true,
    default: {},
    onAuthChange: (cb) => { cb(sessionRef.current); return () => {}; },
    signOut: vi.fn(async () => {}),
    saveDisplayName: saveDisplayNameMock,
  };
});

import AuthBanner from '../components/AuthBanner.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(AuthBanner)); });
}
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; saveDisplayNameMock.mockClear(); });
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('the account strip wears the chosen name', () => {
  it('shows the CHOSEN display_name ("DP"), not the email local part', async () => {
    sessionRef.current = { user: { email: 'darrellpoe06@gmail.com', user_metadata: { display_name: 'DP' } } };
    await mount();
    expect(container.textContent).toContain('DP');
    expect(container.textContent).not.toContain('darrellpoe06');
    expect(btn(/change name/i), 'a chosen name offers "Change name"').toBeTruthy();
  });

  it('with no chosen name, invites you to "Pick a name" (and does not leak the full email)', async () => {
    sessionRef.current = { user: { email: 'darrellpoe06@gmail.com', user_metadata: {} } };
    await mount();
    expect(btn(/pick a name/i), 'no chosen name should invite picking one').toBeTruthy();
    expect(container.textContent).not.toContain('@gmail.com');
  });

  it('picking a name opens an input and Save stores the typed value', async () => {
    sessionRef.current = { user: { email: 'darrellpoe06@gmail.com', user_metadata: {} } };
    await mount();
    await act(async () => { btn(/pick a name/i).click(); });
    const input = container.querySelector('#pick-name');
    expect(input, 'the name input should appear').toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'DP');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { btn(/^save$/i).click(); });
    expect(saveDisplayNameMock).toHaveBeenCalledWith('DP');
  });
});
