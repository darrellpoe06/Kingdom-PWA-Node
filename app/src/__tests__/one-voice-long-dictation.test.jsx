// @vitest-environment jsdom
//
// OneVoiceInput — the 2026-08-03 lost-conference-review regression, replayed on
// the real surface (Verification Doctrine §7: observe, don't assume). Darrell
// dictated a 29k-character conference review into Notes, titled it "Conference
// Review and Future Plans", and hit Save — the word "paint" mid-dictation had
// silently flipped the route to 'work', so the whole session filed as a
// maintenance incident on the Action Queue and Your Thoughts stayed at 0.
// This test replays that exact flow and pins the fixed behavior: the long
// dictation saves as a PRIVATE NOTE, titled, and no incident is created.
import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import OneVoiceInput from '../components/OneVoiceInput.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LONG_DICTATION = 'we talked about the assembly and the communication committee '.repeat(10)
  + 'get all that paint and everything else out of the church out of the sanctuary';

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(OneVoiceInput, props)); });
  const setValue = async (el, v, proto) => {
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  return {
    container,
    typeText: (v) => setValue(container.querySelector('textarea'), v, window.HTMLTextAreaElement.prototype),
    typeLabel: (v) => setValue(container.querySelector('input'), v, window.HTMLInputElement.prototype),
    clickSave: async () => {
      const btn = [...container.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save');
      await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    },
  };
}

describe('OneVoiceInput (notes) — a long dictation saves as a titled private note', () => {
  it('does NOT become a work order; the typed label is kept as the title', async () => {
    localStorage.clear();
    const addNote = vi.fn();
    const addIncident = vi.fn();
    const { container, typeText, typeLabel, clickSave } = await mount({
      surface: 'notes', submitLabel: 'Save', addNote, addIncident,
    });
    await typeText(LONG_DICTATION);
    // The diary's label field says what it is (not "Your name").
    expect(container.querySelector('input').placeholder).toMatch(/title/i);
    await typeLabel('Conference Review and Future Plans');
    await clickSave();
    expect(addIncident).not.toHaveBeenCalled();
    expect(addNote).toHaveBeenCalledTimes(1);
    expect(addNote).toHaveBeenCalledWith(`Conference Review and Future Plans\n\n${LONG_DICTATION}`);
  });

  it('a short work request still routes to the Action Queue (the guard is length, not keywords)', async () => {
    localStorage.clear();
    const addNote = vi.fn();
    const addIncident = vi.fn();
    const { typeText, clickSave } = await mount({
      surface: 'notes', submitLabel: 'Save', addNote, addIncident,
    });
    await typeText('the kitchen faucet is leaking again');
    await clickSave();
    expect(addIncident).toHaveBeenCalledTimes(1);
    expect(addNote).not.toHaveBeenCalled();
  });
});
