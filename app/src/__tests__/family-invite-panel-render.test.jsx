// Live render proof for the governor "invite people to the family" panel
// (DR-0076). Mounts the REAL component in jsdom and pins: it renders the email
// field + role select + send control, the send button is disabled until a valid
// email is entered, and it shows the steward posture (they join on next sign-in).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import FamilyInvitePanel from '../components/FamilyInvitePanel.jsx';

let container, root;
async function mount(Component) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Component));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

function setValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('FamilyInvitePanel — governor grant control', () => {
  it('renders the emails field, role select, and send button', async () => {
    await mount(FamilyInvitePanel);
    expect(container.querySelector('#fi-emails')).not.toBeNull();
    expect(container.querySelector('#fi-role')).not.toBeNull();
    const btn = [...container.querySelectorAll('button')].find((b) => /send invite/i.test(b.textContent));
    expect(btn).toBeTruthy();
  });

  it('the send button is disabled until a valid email is entered', async () => {
    await mount(FamilyInvitePanel);
    const btn = [...container.querySelectorAll('button')].find((b) => /send invite/i.test(b.textContent));
    expect(btn.disabled).toBe(true);
    await act(async () => { setValue(container.querySelector('#fi-emails'), 'son@example.com'); });
    expect(btn.disabled).toBe(false);
    expect(container.textContent).toMatch(/1 valid email ready/i);
  });

  it('states the steward posture — they join on their next sign-in', async () => {
    await mount(FamilyInvitePanel);
    expect(container.textContent.toLowerCase()).toContain('next sign-in');
  });
});
