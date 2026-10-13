// Render proof for the invitee claim banner (DR-0187, DR-0076). The critical
// safety property: it renders NOTHING for a normal visitor (no ?join token), so
// it never disrupts the app; and it surfaces the claim prompt when a token IS
// present in the URL.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ClaimInviteBanner from '../components/ClaimInviteBanner.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ClaimInviteBanner));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { window.history.replaceState({}, '', '/'); } catch { /* jsdom */ }
});

describe('ClaimInviteBanner — invitee claim entry', () => {
  it('renders NOTHING when there is no ?join token (normal visitor)', async () => {
    try { window.history.replaceState({}, '', '/'); } catch { /* jsdom */ }
    await mount();
    expect(container.textContent).toBe('');
  });

  it('surfaces the claim prompt when a ?join token is in the URL', async () => {
    try { window.history.replaceState({}, '', '/?join=abc123token'); } catch { /* jsdom */ }
    await mount();
    // shows an invite-related message (checking / sign-in / claim), never blank
    expect(container.textContent.length).toBeGreaterThan(0);
    expect(container.textContent.toLowerCase()).toMatch(/invite|claim/);
  });
});
