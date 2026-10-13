// =============================================================================
// story-explorer-render.test.jsx — the "Explore Your Story" surface renders the
// exact question and captures a private reflection
// =============================================================================
// Proven-to-catch (DR-0061/DR-0076): the mounted surface shows the exact
// question + the three Joseph-method steps with their verses, and a saved
// reflection is REAL device-local state (read back from the injected storage and
// shown in "Your reflections"), never painted.
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import StoryExplorer from '../components/games/StoryExplorer.jsx';
import { loadReflections } from '../lib/story-exploration.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { document.body.innerHTML = ''; });

function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

function mount(props) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(StoryExplorer, props)); });
  return { host, root };
}

describe('StoryExplorer — the exact question, on the surface', () => {
  it('renders the opening verse, the invitation, and the three steps with their verses', () => {
    const { host } = mount({ level: 'senior', storage: memStorage() });
    const text = host.textContent;
    expect(text).toContain('put thou my tears into thy bottle'); // Psalm 56:8 opening
    expect(text).toContain('Where was God in it?');
    expect(text).toContain('What was He preserving or preparing?');
    expect(text).toContain('What comfort can you now give?');
    expect(text).toContain('In all their affliction he was afflicted'); // Isaiah 63:9
    expect(text).toContain('God meant it unto good'); // Genesis 50:20 Joseph anchor / closing arc
    expect(text).toContain('not clinical therapy'); // TLC guardrail visible
  });

  it('keeps a reflection as REAL device-local state and lists it back', () => {
    const storage = memStorage();
    const { host } = mount({ level: 'senior', storage });

    const memory = host.querySelector('#sx-memory');
    const comfort = host.querySelector('#sx-comfort');
    expect(memory).toBeTruthy();

    const setValue = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new window.Event('input', { bubbles: true }));
    };
    act(() => { setValue(memory, 'The year we lost the house'); });
    act(() => { setValue(comfort, 'I can sit with others who are afraid'); });

    // Click "Keep this reflection"
    const saveBtn = [...host.querySelectorAll('button')].find((b) => /keep this reflection/i.test(b.textContent));
    expect(saveBtn).toBeTruthy();
    act(() => { saveBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });

    // Persisted to the injected storage (real trace, not painted)
    const saved = loadReflections(storage);
    expect(saved.length).toBe(1);
    expect(saved[0].memory).toBe('The year we lost the house');
    expect(saved[0].comfort).toBe('I can sit with others who are afraid');

    // And shown back on the surface under "Your reflections"
    expect(host.textContent).toContain('Your reflections');
    expect(host.textContent).toContain('The year we lost the house');
  });

  it('child level reads the child framing, not the seasoned words', () => {
    const { host } = mount({ level: 'child', storage: memStorage() });
    expect(host.textContent).toContain('a happy memory or a hard one');
  });
});
