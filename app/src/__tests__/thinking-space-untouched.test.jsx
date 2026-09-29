// @vitest-environment jsdom
//
// Thinking Space keeps its typing box and "Your prompts" (DR-0679). Darrell
// 2026-09-29: "Why take away my type texting place?!" The Create page became
// subtabs; Thinking Space was not touched, and this proves it by rendering the
// real surface: the note input (the one-voice textarea) and PromptHistory.
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThinkingSpace } from '../components/ThinkingSpace.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Thinking Space is untouched by the Create subtabs', () => {
  it('renders the note input and Your prompts', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => { root.render(createElement(ThinkingSpace, { notes: [] })); });
    const box = el.querySelector('[data-testid="one-voice-text"]');
    expect(box).not.toBe(null);
    expect(box.tagName).toBe('TEXTAREA');
    expect(box.disabled).toBe(false);
    expect(el.querySelector('[data-testid="prompt-history"]')).not.toBe(null);
    expect(el.textContent).toMatch(/Your prompts/);
    // No tab bar was put over it.
    expect(el.querySelector('[role="tablist"][aria-label="Create"]')).toBe(null);
    await act(async () => { root.unmount(); });
    el.remove();
  });
});
