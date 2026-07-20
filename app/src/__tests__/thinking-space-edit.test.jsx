// @vitest-environment jsdom
//
// ThinkingSpace — edit AND add-update (Darrell + Christina 2026-07-20: "I need
// to be able to edit notes"; "edit AND add onto"). Observe the real surface
// (Verification Doctrine §7): Edit prefills + overwrites via updateNote; Add
// update starts blank and APPENDS a dated line to the note's own text (via the
// same updateNote, so the monolith stays frozen), keeping the original first.
//
// The surface also renders <OneVoiceInput> (its own top textarea + a "Save"
// submit), so helpers target the NOTE's own field (the last textarea) and
// disambiguate the edit "Save" from the input's "Save".
import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThinkingSpace } from '../components/ThinkingSpace.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOTE = { id: 'n1', text: 'I started my fast at 8pm, weight 201.5', createdAt: '2026-07-06T00:00:00.000Z' };

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(ThinkingSpace, props)); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const setLastTextarea = async (v) => {
    const ta = [...container.querySelectorAll('textarea')].at(-1);
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, v);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return ta;
  };
  const lastTextarea = () => [...container.querySelectorAll('textarea')].at(-1);
  const clickText = async (s, { last = false } = {}) => {
    const m = [...container.querySelectorAll('button')].filter(b => b.textContent.trim().includes(s));
    await click(last ? m.at(-1) : m[0]);
  };
  return { container, lastTextarea, setLastTextarea, clickText };
}

describe('ThinkingSpace — edit and add-update', () => {
  it('Edit prefills the note text and overwrites via updateNote', async () => {
    localStorage.clear();
    const updateNote = vi.fn();
    const { lastTextarea, setLastTextarea, clickText } = await mount({ notes: [NOTE], updateNote });
    await clickText('Edit');
    expect(lastTextarea().value).toBe(NOTE.text);      // edit prefills the existing text
    await setLastTextarea('corrected weight 200.0');
    await clickText('Save', { last: true });            // the edit "Save", not the input's
    expect(updateNote).toHaveBeenCalledWith('n1', 'corrected weight 200.0');
  });

  it('Add update starts blank and appends a dated line (original stays first)', async () => {
    localStorage.clear();
    const updateNote = vi.fn();
    const { lastTextarea, setLastTextarea, clickText } = await mount({ notes: [NOTE], updateNote });
    await clickText('Add update');
    expect(lastTextarea().value).toBe('');              // a fresh update, NOT the original text
    await setLastTextarea('Day 3 — 199.2');
    await clickText('Save update');
    expect(updateNote).toHaveBeenCalledTimes(1);
    const [id, newText] = updateNote.mock.calls[0];
    expect(id).toBe('n1');
    expect(newText.startsWith(NOTE.text)).toBe(true);   // original preserved, at the top
    expect(newText).toContain('— update ');             // dated update marker
    expect(newText).toContain('Day 3 — 199.2');         // the appended words
  });

  it('an empty update is a no-op (updateNote not called)', async () => {
    localStorage.clear();
    const updateNote = vi.fn();
    const { clickText } = await mount({ notes: [NOTE], updateNote });
    await clickText('Add update');
    await clickText('Save update');
    expect(updateNote).not.toHaveBeenCalled();
  });

  it('Edit and Add update are both discoverable as buttons (not hidden)', async () => {
    localStorage.clear();
    const { container } = await mount({ notes: [NOTE], updateNote: vi.fn() });
    const labels = [...container.querySelectorAll('button')].map(b => b.textContent.trim());
    expect(labels).toContain('Edit');
    expect(labels).toContain('Add update');
  });
});
