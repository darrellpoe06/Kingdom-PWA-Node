// =============================================================================
// EternalAlgorithms — live render proof (Verification Doctrine: observe the real
// surface, not just the pure logic). Mounts the ACTUAL component in jsdom and
// lets its effects run (seed -> persist -> render), then reads the DOM it
// produces. Auth-free: the component takes `email` as a prop and stores device-
// local, so no Supabase session is needed to render the surface itself.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import EternalAlgorithms from '../components/EternalAlgorithms.jsx';

// Tell React this is a proper act() environment (silences the act warning and
// makes effect flushing deterministic).
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(EternalAlgorithms, { email: 'darrellpoe06@gmail.com' }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('EternalAlgorithms renders the real frameworks & outcomes surface', () => {
  it('mounts, seeds the catalog, and pairs each framework with its outcome', async () => {
    await mount();
    const text = container.textContent;

    // The surface itself.
    expect(text).toContain('Eternal Algorithms');
    expect(text).toContain('Ecclesiastes 3:14');           // the eternal anchor
    expect(text).toContain('Frameworks');                  // the pairing view tab
    expect(text).toContain('Outcome');                     // OUTCOME is surfaced

    // A real seeded framework AND the real outcome it pairs to (framework<->outcome).
    expect(text).toContain('Response over Circumstance (90/10)');
    expect(text).toContain('Stability and joy that do not depend on conditions');
    expect(text).toContain('Change the Frame (metanoia)');
    expect(text).toContain('a transformed life');

    // The default view is the pairing list: a row links the framework to its
    // outcome. Every framework button in the list has an outcome cell beside it.
    const frameworkButtons = container.querySelectorAll('li button');
    expect(frameworkButtons.length).toBeGreaterThanOrEqual(8);
  });

  it('search narrows the live list (real filtering through the DOM)', async () => {
    await mount();
    const input = container.querySelector('#ea-q');
    expect(input).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'footstool');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const text = container.textContent;
    expect(text).toContain('Build by Resistance'); // matches on the footstool 4D text
    expect(text).not.toContain('Seedtime and Harvest');
  });
});
