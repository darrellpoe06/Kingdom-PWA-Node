// draft-autosave — Christina 2026-07-10: "automatically save your notes like a
// google doc without hitting save… when you stall out with time or forget and
// come back, your information is still there." Pins the device-local draft
// round-trip AND the primitive's behavior: type → persisted; remount → restored
// with the quiet notice; send → cleared. jsdom (real localStorage + DOM).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { readDraft, writeDraft, clearDraft, draftKey } from '../lib/draft-autosave.js';
import { OneVoiceInput } from '../components/OneVoiceInput.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the draft store (pure round-trip)', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips text + route + name per surface, isolated by key', () => {
    expect(writeDraft('notes', { text: '1. Book cover', route: 'private', name: 'Christina' })).toBe(true);
    expect(readDraft('notes')).toMatchObject({ text: '1. Book cover', route: 'private', name: 'Christina' });
    expect(readDraft('church')).toBeNull(); // another surface's box stays its own
  });
  it('an emptied box clears the draft; corrupt storage reads as none', () => {
    writeDraft('notes', { text: 'words' });
    expect(writeDraft('notes', { text: '   ' })).toBe(false);
    expect(readDraft('notes')).toBeNull();
    localStorage.setItem(draftKey('notes'), '{not json');
    expect(readDraft('notes')).toBeNull();
  });
  it('never throws without storage', () => {
    expect(readDraft('notes', {})).toBeNull();
    expect(writeDraft('notes', { text: 'x' }, {})).toBe(false);
    expect(() => clearDraft('notes', {})).not.toThrow();
  });
});

describe('OneVoiceInput — the words survive without a Save tap', () => {
  let container, root;
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const mount = (props = {}) => act(() => root.render(createElement(OneVoiceInput, { surface: 'notes', addNote: () => {}, ...props })));
  const type = (value) => act(() => {
    const ta = container.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, value);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });

  it('typing persists the draft (debounced); a fresh mount restores it and says so', async () => {
    mount();
    type('1. Book cover');
    await act(() => new Promise((r) => setTimeout(r, 450))); // past the 350ms debounce
    expect(readDraft('notes')).toMatchObject({ text: '1. Book cover' });

    act(() => root.unmount()); // the stall-out: tab closed, time passed
    root = createRoot(container);
    mount();
    expect(container.querySelector('textarea').value).toBe('1. Book cover');
    expect(container.textContent).toContain('saves as you type');
  });

  it('a successful send clears the draft — delivered words are not a draft', async () => {
    writeDraft('notes', { text: 'send me', route: 'private' });
    mount();
    const sendBtn = [...container.querySelectorAll('button')].find((b) => /send|save/i.test(b.textContent || ''));
    act(() => sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await act(() => new Promise((r) => setTimeout(r, 450)));
    expect(readDraft('notes')).toBeNull();
  });
});
