// =============================================================================
// Engagement + VoiceStudio — SectionTabs conversion render proof (DR-0076:
// observe the REAL surface). Both surfaces moved from a stacked scroll to the
// shared SectionTabs strip ("sliding tabs instead of a long scroll", Darrell
// 2026-07-04). This mounts each converted surface and proves:
//   1. the strip is a real tablist and the DEFAULT section's content shows;
//   2. clicking another tab swaps the panel (the moved block still renders);
//   3. the pinned header stays mounted regardless of the active section;
//   4. VoiceStudio's gated Record tab never leaks without a persona, and
//      appears when the signed-in persona is present.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Engagement from '../components/Engagement.jsx';
import VoiceStudio from '../components/VoiceStudio.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;

async function mount(Comp, props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Comp, props));
  });
}

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = null; container = null;
});

// The proven tab-click helper (church-home-render.test.jsx pattern).
const clickTab = async (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  await act(async () => { tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
};

describe('Engagement — trivia + thread behind section tabs', () => {
  it('defaults to Trivia with the title pinned, and Messages swaps in on its tab', async () => {
    await mount(Engagement);
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    // Pinned title + default section (the anchor trivia set, signed out).
    expect(container.textContent).toMatch(/Engagement/);
    expect(container.textContent).toMatch(/Featured Trivia/i);
    expect(container.textContent).not.toMatch(/Two-way messages/i);

    await clickTab('Messages');
    expect(container.textContent).toMatch(/Two-way messages/i);
    // Signed out, the thread shows its honest sign-in note — never a dead panel.
    expect(container.textContent).toMatch(/Sign in .* to read and post/i);
    expect(container.textContent).not.toMatch(/Featured Trivia/i);
    // The pinned title is still there on a non-default section.
    expect(container.textContent).toMatch(/Engagement/);
  });
});

describe('VoiceStudio — listen / voices / record behind section tabs', () => {
  it('defaults to Listen with header + honesty banner pinned; Voices swaps in; no Record tab without a persona', async () => {
    await mount(VoiceStudio, { sovereignVoiceReady: false });
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    // Pinned header + honesty banner (never hidden while the studio is not live).
    expect(container.textContent).toMatch(/Listen to anything/);
    expect(container.textContent).toMatch(/How personal voices work today/);
    // Default section: the read-aloud box.
    expect(container.querySelector('#vs-text')).toBeTruthy();
    // Gated section never leaks without a persona.
    const tabs = [...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent || '');
    expect(tabs.join(' ')).not.toMatch(/Record/);

    await clickTab('Voices');
    // The moved voice-picker block renders (the free System voice always exists).
    expect(container.textContent).toMatch(/Free/);
    expect(container.querySelector('#vs-text')).toBeFalsy();
    // Banner stays pinned on a non-default section.
    expect(container.textContent).toMatch(/How personal voices work today/);
  });

  it('shows the Record tab for a signed-in persona and renders the recorder block on click', async () => {
    await mount(VoiceStudio, { personaKey: 'darrell', isOwner: true, sovereignVoiceReady: false });
    await clickTab('Record');
    expect(container.textContent).toMatch(/Record your voice — Darrell Poe/);
  });
});
